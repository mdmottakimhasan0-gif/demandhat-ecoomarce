<?php

namespace App\Http\Controllers;

use App\Models\HeroImage;
use App\Models\Marquee;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use App\Models\LandingSection;
use App\Models\Contact;
class AdminController extends Controller
{

    public function updateMarquee(Request $request, $id)
    {
        $marquee = Marquee::findOrFail($id);

        $validated = $request->validate([
            'content' => 'required|string',
            'position' => 'nullable|string',
        ]);

        $marquee->content = $validated['content'];
        $marquee->position = $validated['position'] ?? null;

        $marquee->save();

        Cache::forget('global_marquee');

        return redirect()->back()->with('success', 'Successfully Updated Marquee');
    }


    public function showUsers()
    {
        $customer = User::where('role', 'customer')->latest()->paginate(10);
        return inertia('Admin/Users', ['users' => $customer]);

    }
    public function dashboard(Request $request)
    {
        // 1. Date Filter Logic
        $range = $request->input('range', '30_days'); // Default to last 30 days
        $customStart = $request->input('start_date');
        $customEnd = $request->input('end_date');

        $endDate = Carbon::now();
        $startDate = Carbon::now()->subDays(30);

        // In DashboardController.php
// In your dashboard() method

        if ($range === 'today') {
            $startDate = Carbon::today();
        } elseif ($range === 'yesterday') {
            $startDate = Carbon::yesterday();
            $endDate = Carbon::yesterday()->endOfDay();
        } elseif ($range === '7_days') {
            $startDate = Carbon::now()->subDays(7);
        } elseif ($range === 'lifetime') {
            // 1. Find the date of the very first order
            $earliestOrder = Order::min('created_at');

            // 2. If orders exist, use that date. If not, fallback to today.
            $startDate = $earliestOrder ? Carbon::parse($earliestOrder) : Carbon::now();
            $endDate = Carbon::now();
        } elseif ($range === 'custom') {
            if ($customStart && $customEnd) {
                $startDate = Carbon::parse($customStart)->startOfDay();
                $endDate = Carbon::parse($customEnd)->endOfDay();
            } else {
                // Fallback
                $range = '30_days';
                $startDate = Carbon::now()->subDays(30);
            }
        }

        // 2. KPI Queries
        $ordersQuery = Order::whereBetween('created_at', [$startDate, $endDate]);

        $totalRevenue = $ordersQuery->clone()->where('payment_status', 'paid')->sum('grand_total');
        $totalSalesVolume = $ordersQuery->clone()->where('order_status', '!=', 'cancelled')->sum('grand_total');
        $totalOrders = $ordersQuery->clone()->count();
        $totalCustomers = User::where('role', 'customer')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        // Average Order Value
        $avgOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        // 3. Action Center Data
        $pendingOrders = Order::where('order_status', 'pending')->count();
        $lowStockProducts = Product::where('stock', '<=', 5)->get(['id', 'name', 'stock', 'image']); // Assuming threshold is 5
        $outOfStock = Product::where('stock', 0)->count();

        // 4. Chart Data: Sales Over Time (Grouped by Day)
        $salesChart = Order::whereBetween('created_at', [$startDate, $endDate])
            // ->where('payment_status', 'paid')
            ->selectRaw('DATE(created_at) as date, SUM(grand_total) as revenue, COUNT(*) as orders')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // 5. Product Insights: Top Selling (Requires OrderItem join)
        // Note: Assuming you have an 'order_items' table. 
        $topProducts = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->select('order_items.product_name', DB::raw('SUM(order_items.quantity) as total_sold'), DB::raw('SUM(order_items.price * order_items.quantity) as revenue'))
            ->groupBy('order_items.product_name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        // 6. Recent Orders
        $recentOrders = Order::latest()->take(6)->get();

        // 4. Chart Data: Sales Over Time (Grouped by Day)
        $salesChart = Order::whereBetween('created_at', [$startDate, $endDate])
            // ->where('payment_status', 'paid') // <-- Ensure your orders actually have 'paid' status
            ->selectRaw('DATE(created_at) as date, SUM(grand_total) as revenue, COUNT(*) as orders')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                // THIS IS THE CRUCIAL FIX: Cast strings to numbers
                return [
                    'date' => $item->date,
                    'revenue' => (float) $item->revenue,
                    'orders' => (int) $item->orders,
                ];
            });

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'revenue' => $totalRevenue,
                'sales_volume' => $totalSalesVolume,
                'orders' => $totalOrders,
                'customers' => $totalCustomers,
                'aov' => $avgOrderValue,
            ],
            'actions' => [
                'pending_orders' => $pendingOrders,
                'low_stock' => $lowStockProducts,
                'out_of_stock' => $outOfStock,
            ],
            'charts' => [
                'sales_trend' => $salesChart,
                'top_products' => $topProducts,
            ],
            'recent_orders' => $recentOrders,
            'filters' => [
                'range' => $range,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ]
        ]);
    }


    public function settingPage()
    {
        $marquee = Marquee::first();
        $sections = LandingSection::all();
        $heroes = HeroImage::all();
        return inertia('Admin/Setting', [
            'heroes' => $heroes,
            'sections' => $sections,
            'marquee' => $marquee,
            'contacts' => Contact::latest()->get(),
            'categories' => \App\Models\Category::orderBy('name')->get(),
            'orderProtection' => app(\App\Services\OrderProtection::class)->panel(),
        ]);
    }

    //---Contact Suru -----

    public function createContact()
    {

        return inertia('Admin/Setting/AddContact');
    }

    public function storeContact(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|max:20',
            'whatsapp' => 'nullable|string|max:20',
        ]);

        Contact::create([
            'phone' => $request->phone,
            'whatsapp' => $request->whatsapp,
        ]);

        // Redirect to your settings page route
        return redirect('/admin/settings')->with('success', 'Contact added successfully.');
    }

    public function deleteContact($id)
    {
        Contact::findOrFail($id)->delete();
        return back()->with('success', 'Contact deleted successfully.');
    }


    //----End--Contact

    public function showAddHeroForm()
    {
        return inertia('Admin/Setting/AddHeroImage');
    }

    public function heroStore(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,git,webp|max:500',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('HeroImages', 'public');
        }

        HeroImage::create([
            'image' => $imagePath,
        ]);

        Cache::forget('landing_heroes');

        return redirect()->back()->with("success", "Image was successfully saved.");

    }

    public function showEditHeroForm($id)
    {
        $hero = HeroImage::findOrFail($id);
        return inertia('Admin/Setting/EditHeroImage', [
            'hero' => $hero
        ]);
    }


    public function heroUpdate(Request $request, $id)
    {

        $request->validate([
            'image' => 'image|mimes:jpeg,png,jpg,gif,webp|max:500',
        ]);


        $hero = HeroImage::findOrFail($id);

        if ($request->hasFile('image')) {

            if ($hero->image && Storage::disk('public')->exists($hero->image)) {
                Storage::disk('public')->delete($hero->image);
            }

            // Store new image
            $imagePath = $request->file('image')->store('HeroImages', 'public');

            $hero->image = $imagePath;
        }

        $hero->save();

        Cache::forget('landing_heroes');

        return redirect()->to("/admin/settings")->with('success', 'Hero image was successfully updated.');
    }


    public function deleteHeroImage($id)
    {
        $hero = HeroImage::findOrFail($id);

        if ($hero->image && Storage::disk('public')->exists($hero->image)) {
            Storage::disk('public')->delete($hero->image);
        }

        $hero->delete();

        Cache::forget('landing_heroes');

        return redirect()->back()->with('success', 'Image deleted successfully!');
    }



    public function sectionForm()
    {

        return inertia('Admin/Setting/SectionForm');
    }

    public function sectionStore(Request $request)
    {
        $validated = $request->validate([
            'category_name' => 'required|string|max:255',
            'category_id' => 'required|integer',
        ]);

        LandingSection::create($validated);

        Cache::forget('landing_sections');

        return redirect()->back()->with('success', 'Section created');
    }

    public function sectionEdit($id)
    {
        $section = LandingSection::findOrFail($id);
        return inertia('Admin/Setting/SectionEditForm', [
            'section' => $section
        ]);
    }


    public function sectionUpdate(Request $request, $id)
    {
        $validated = $request->validate([
            'category_name' => 'required|string|max:255',
            'category_id' => 'required|integer',
        ]);

        $section = LandingSection::findOrFail($id);
        $section->update($validated);

        Cache::forget('landing_sections');

        return redirect()->back()->with('success', 'Section updated successfully.');
    }

    public function sectionDelete($id)
    {
        $section = LandingSection::findOrFail($id);
        $section->delete();

        Cache::forget('landing_sections');

        return redirect()->back()->with('success', 'Section deleted successfully.');
    }





}



