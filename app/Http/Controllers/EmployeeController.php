<?php

namespace App\Http\Controllers;
use App\Exports\EmployeesExport;
use Maatwebsite\Excel\Facades\Excel;

use App\Models\User;
use App\Models\Order; // <--- IMPORTANT: Added this import
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use PragmaRX\Google2FALaravel\Support\Authenticator;
use SimpleSoftwareIO\QrCode\Facades\QrCode; // অথবা BaconQrCode
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;



class EmployeeController extends Controller
{
    public function showEmployees()
    {
        $employees = User::whereIn('role', ['manager', 'employee'])
            ->withCount([
                // Bug Fix 3: Renamed to 'pending_orders_count' for clarity
                'assignedOrders as pending_orders_count' => function ($query) {
                    $query->where('order_status', 'pending');
                },
                // Count shipped/delivered orders
                'assignedOrders as confirmed_orders_count' => function ($query) {
                    $query->where(function ($q) {
                        $q->whereNotNull('courier_invoice_id')
                          ->orWhereIn('order_status', ['shipped', 'delivered']);
                    });
                },
            ])
            ->latest()
            ->paginate(30);

        return inertia('Admin/Employee/Employees', ['employees' => $employees]);
    }

    public function showAddEmployeeForm()
    {
        return Inertia::render('Admin/Employee/AddEmployeeForm');
    }

    public function store(Request $request)
    {
        // 1. Validation
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => ['required', 'string', 'regex:/^(013|014|015|016|017|018|019)[0-9]{8}$/', 'unique:users'],
            'password' => 'required|string|min:8',
            'address' => 'required|string|max:500',
            'role' => 'required|in:manager,employee',
        ]);

        // 2. Security Check: Prevent managers from creating other managers
        // If a manager bypasses the UI and tries to send 'role' => 'manager'
        if (Auth::user()->role === 'manager' && $validated['role'] === 'manager') {
            return back()->withErrors([
                'role' => 'Unauthorized: Managers are only allowed to create staff accounts.'
            ])->withInput();
        }

        // 3. Create User (Auto Verified)
        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'address' => $validated['address'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'email_verified_at' => Carbon::now(),
            'phone_verified_at' => Carbon::now(),
        ]);

        return redirect()->to('/admin/employees')
            ->with('success', 'New staff member created successfully.');
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // Prevent deleting yourself
        if ($user->id === Auth::id()) {
            return back()->with('error', 'You cannot delete yourself.');
        }

        // Bug Fix 5: Release ALL active orders (pending + processing) when employee is deleted
        // Shipped/delivered orders are already completed — no need to unassign those
        Order::where('assigned_to', $user->id)
            ->whereIn('order_status', ['pending', 'processing'])
            ->update(['assigned_to' => null]);

        $user->delete();

        return back()->with('success', 'Employee removed and their active orders released back to the queue.');
    }

    public function getTwoFactorQrCode($id)
    {
        $user = User::findOrFail($id);
        $google2fa = app('pragmarx.google2fa');

        // সিক্রেট কি না থাকলে তৈরি করবে
        if (!$user->google2fa_secret) {
            $user->google2fa_secret = $google2fa->generateSecretKey();
            $user->save();
        }

        // QR Code এর ডাটা URL তৈরি
        $qrCodeUrl = $google2fa->getQRCodeUrl(
            config('app.name'), // আপনার ব্যবসার নাম
            $user->name,
            $user->google2fa_secret
        );

        // BaconQrCode ব্যবহার করে SVG ইমেজ তৈরি করা (সবচেয়ে সেফ এবং ফাস্ট)
        $renderer = new ImageRenderer(
            new RendererStyle(300),
            new SvgImageBackEnd()
        );
        $writer = new Writer($renderer);

        // ইমেজটিকে Base64 ফরম্যাটে কনভার্ট করা যাতে সরাসরি <img> ট্যাগে শো করে
        $qrcode_svg = $writer->writeString($qrCodeUrl);
        $base64_qrcode = 'data:image/svg+xml;base64,' . base64_encode($qrcode_svg);

        return response()->json([
            'qr_code_url' => $base64_qrcode, // এখন এটি একটি সরাসরি ইমেজ ডাটা
            'secret' => $user->google2fa_secret,
            'name' => $user->name
        ]);
    }


    public function exportExcel()
    {
        $fileName = 'Staff_List_' . date('Y_m_d_H_i') . '.xlsx';
        return Excel::download(new EmployeesExport, $fileName);
    }

    public function resetTwoFactor($id)
    {
        $user = User::findOrFail($id);
        $user->google2fa_secret = null;
        $user->save();

        return redirect()->back()->with('success', "2FA recovery successfully reset for {$user->name}.");
    }
}