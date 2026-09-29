<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Http;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

use Inertia\Inertia;


class OrderController extends Controller
{

    public function checkFraud($id)
    {
        $order = Order::findOrFail($id);

        // Clean the phone number (remove spaces, - etc) if necessary
        $phone = $order->phone;

        // Call the BD Courier API
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.bd_courier.api_key'),
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ])->post('https://api.bdcourier.com/courier-check', [
                    'phone' => $phone
                ]);

        // Return the data to React
        if ($response->successful()) {
            return response()->json($response->json());
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Failed to connect to fraud database',
            'details' => $response->body()
        ], 500);
    }




    public function viewOrderTable(Request $request)
    {
        // 1. Start the query with relationships AND the subquery for order counts
        $query = Order::query()
            ->select('orders.*') // Select standard columns explicitly to avoid conflicts
            ->with(['user', 'assignee', 'authorizer'])
            ->addSelect([
                // This subquery safely counts total orders for the specific phone number
                'order_count' => DB::table('orders as sub_orders')
                    ->selectRaw('count(*)')
                    ->whereColumn('sub_orders.phone', 'orders.phone')
            ]);

        //This part is written by AI. I am not so efficient writing such complex query

        // 2. Search Filter (Wrapped in a nested closure to group OR conditions)
        // IMPORTANT: Without the nested closure, OR logic can break other AND filters
        $query->when($request->search, function ($q, $search) {
            $q->where(function ($subQ) use ($search) {
                $subQ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%");
            });
        });

        $query->when($request->unassigned_only === 'true', function ($q) {
            $q->whereNull('assigned_to');
        });

        // 3. Order Status Filter
        $query->when($request->order_status, function ($q, $status) {
            $q->where('order_status', $status);
        });

        // 4. Payment Status Filter
        $query->when($request->payment_status, function ($q, $status) {
            $q->where('payment_status', $status);
        });

        // 5. Date Filtering
        $query->when($request->date_filter, function ($q, $filter) use ($request) {
            switch ($filter) {
                case 'today':
                    $q->whereDate('created_at', today());
                    break;
                case 'week':
                    $q->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
                case 'month':
                    $q->whereMonth('created_at', now()->month)
                        ->whereYear('created_at', now()->year);
                    break;
                case 'custom':
                    if ($request->filled(['start_date', 'end_date'])) {
                        $q->whereBetween('created_at', [
                            $request->start_date . ' 00:00:00',
                            $request->end_date . ' 23:59:59'
                        ]);
                    }
                    break;
            }
        });

        // 6. Role Based Access Control
        if (Auth::user()->role === 'employee') {
            $query->where('assigned_to', Auth::id());
        }

        // 7. Sorting
        $allowedSortFields = ['created_at', 'grand_total', 'order_status', 'payment_status', 'id'];
        $sortBy = in_array($request->sort_by, $allowedSortFields) ? $request->sort_by : 'created_at';
        $sortOrder = $request->sort_order === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortBy, $sortOrder);

        // 8. Execute Query
        $orders = $query->paginate(10)->withQueryString();

        // --- DATA FOR DROPDOWNS / MODALS ---

        // Get employees for assignment dropdown (excluding current user if needed)
        $employees = User::whereIn('role', ['employee',])
            ->where('id', '!=', Auth::id())
            ->select('id', 'name')
            ->get();

        // Count pending unassigned orders
        $unassignedCount = Order::where('order_status', 'pending')
            ->whereNull('assigned_to')
            ->count();

        return Inertia::render("Admin/Order/Orders", [
            'orders' => $orders,
            'filters' => $request->only([
                'search',
                'order_status',
                'payment_status',
                'date_filter',
                'start_date',
                'end_date',
                'sort_by',
                'sort_order',
                'unassigned_only',
            ]),
            'employees' => $employees,
            'unassignedCount' => $unassignedCount,
        ]);
    }


    public function assignBatch(Request $request)
    {
        $request->validate([
            // Bug Fix 4: Added max:500 cap to prevent massive queries
            'quantity'    => 'required|integer|min:1|max:500',
            // Bug Fix 1: Only allow assigning to employees or managers — not customers/admins
            'employee_id' => [
                'required',
                Rule::exists('users', 'id')->where(function ($query) {
                    $query->whereIn('role', ['employee', 'manager']);
                }),
            ],
        ]);

        // Logic: Find IDs of the OLDEST pending orders with no assignee
        $orderIds = Order::where('order_status', 'pending')
            ->whereNull('assigned_to')
            ->oldest()
            ->take($request->quantity)
            ->pluck('id');

        if ($orderIds->isEmpty()) {
            return redirect()->back()->with('error', 'No pending unassigned orders found.');
        }

        Order::whereIn('id', $orderIds)->update([
            'assigned_to' => $request->employee_id,
        ]);

        $assignedCount = $orderIds->count();

        // Bug Fix 2: Null-safe lookup — prevents fatal crash if employee deleted mid-request
        $employee     = User::find($request->employee_id);
        $employeeName = $employee ? $employee->name : 'the selected employee';

        return redirect()->back()->with(
            'success',
            "Successfully assigned {$assignedCount} order(s) to {$employeeName}."
        );
    }

    public function showDetails($id)
    {
        // Added assignee and authorizer relationships here too just in case you need them in details
        $order = Order::with(['items.product', 'user', 'assignee', 'authorizer'])->findOrFail($id);

        return inertia("Admin/Order/OrderDetails", [
            'order' => $order
        ]);
    }

    public function update(Request $request, $id)
    {


        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'subtotal' => 'required|numeric|min:0',
            'delivery_fee' => 'required|numeric|min:0',
            'grand_total' => 'required|numeric|min:0',
            'order_status' => 'required|in:pending,processing,shipped,delivered,cancelled',
            'payment_status' => 'required|in:paid,pending,failed,refunded'
        ]);


        $order = Order::findOrFail($id);

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'subtotal' => $request->subtotal,
            'delivery_fee' => $request->delivery_fee,
            'grand_total' => $request->grand_total,
            'order_status' => $request->order_status,
            'payment_status' => $request->payment_status,
        ];

        // --- MAINTAINED: AUTHORIZATION TRACKING ---
        if (in_array($request->order_status, ['processing', 'shipped', 'delivered'])) {
            if ($order->authorized_by === null) {
                $data['authorized_by'] = Auth::id();
            }
        }

        $order->update($data);

        return redirect()->back()->with('success', 'Order updated successfully!');
    }




    public function exportPdf(Request $request)
    {
        // Updated to include assignee/authorizer in PDF data if needed
        $query = Order::query()->with(['user', 'assignee', 'authorizer']);

        // Role restriction for PDF export as well (optional, but good for security)
        if (Auth::user()->role === 'employee') {
            $query->where('assigned_to', Auth::id());
        }

        // Apply same filters as the table view
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%");
            });
        }

        if ($request->filled('order_status')) {
            $query->where('order_status', $request->order_status);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('date_filter')) {
            $dateFilter = $request->date_filter;

            switch ($dateFilter) {
                case 'today':
                    $query->whereDate('created_at', today());
                    break;
                case 'week':
                    $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
                case 'month':
                    $query->whereMonth('created_at', now()->month)
                        ->whereYear('created_at', now()->year);
                    break;
                case 'custom':
                    if ($request->filled('start_date') && $request->filled('end_date')) {
                        $query->whereBetween('created_at', [
                            $request->start_date . ' 00:00:00',
                            $request->end_date . ' 23:59:59'
                        ]);
                    }
                    break;
            }
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');

        $allowedSortFields = ['created_at', 'grand_total', 'order_status', 'payment_status', 'id'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        }

        $orders = $query->get();

        $pdf = Pdf::loadView('pdf.orders', ['orders' => $orders]);
        $pdf->setPaper('a4', 'landscape');
        return $pdf->download('orders-' . now()->format('Y-m-d') . '.pdf');
    }

    public function printInvoice($id)
    {
        $order = Order::with(['items.product', 'user'])->findOrFail($id);

        $pdf = Pdf::loadView('pdf.invoice', ['order' => $order]);
        $pdf->setPaper('a4', 'portrait');

        return $pdf->download('invoice-' . $order->id . '.pdf');
    }

    public function viewCustomerDetails($id)
    {
        $user = User::find($id);
        if (!$user) {
            return redirect()->back()->with('error', 'User not found.');
        }
        return inertia("Admin/CustomerDetails", [
            'user' => $user
        ]);
    }
}