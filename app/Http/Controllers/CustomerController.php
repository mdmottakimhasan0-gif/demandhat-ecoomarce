<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;
use App\Models\Category;
use App\Models\HeroImage;
use App\Models\LandingSection;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Review;

class CustomerController extends Controller
{
    public function index()
    {
        $products = cache()->remember('landing_products', 86400, function () {
            return Product::with('category:id,name')
                ->select('id', 'name', 'price', 'discount', 'image', 'stock', 'category_id', 'initial_rating', 'slug')
                ->get();
        });

        $categories = cache()->remember('landing_categories', 86400, function () {
            return Category::select('id', 'name', 'photo')->get();
        });

        $heroes = cache()->remember('landing_heroes', 86400, function () {
            return HeroImage::select('id', 'image')->get();
        });

        $sections = cache()->remember('landing_sections', 86400, function () {
            return LandingSection::select('id', 'category_id', 'category_name')->get();
        });

        return inertia('Customer/LandingPage', [
            'products' => $products,
            'categories' => $categories,
            'heroes' => $heroes,
            'sections' => $sections,
        ]);
    }




    public function aboutpage()
    {
        return inertia('Customer/About');
    }

    public function reqProductForm()
    {
        return inertia('Customer/RequestForm');
    }


    public function showCategories()
    {
        $categories = cache()->remember('all_categories_with_count', 86400, function () {
            return Category::withCount('products')->get();
        });

        return inertia('Customer/Categories', ['categories' => $categories]);
    }



    public function showProductsByCategory(Request $request, $id)
    {
        // 1. Start the query with the category filter
        $query = Product::where('category_id', $id);

        // 2. Apply Price Filters (if present in URL)
        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // 3. Apply Sorting
        $sort = $request->input('sort', 'default'); // Default to 'default' if not sent

        switch ($sort) {
            case 'date_desc': // Newest First
                $query->orderBy('created_at', 'desc');
                break;
            case 'date_asc': // Oldest First
                $query->orderBy('created_at', 'asc');
                break;
            case 'name_asc': // Name A to Z
                $query->orderBy('name', 'asc');
                break;
            case 'name_desc': // Name Z to A
                $query->orderBy('name', 'desc');
                break;
            case 'price_desc': // Price High to Low
                $query->orderBy('price', 'desc');
                break;
            case 'price_asc': // Price Low to High
                $query->orderBy('price', 'asc');
                break;
            default: // Default
                $query->orderBy('id', 'desc');
                break;
        }

        // 4. Fetch Results with Pagination
        // withQueryString() ensures filters stay in the URL when you click "Next Page"
        $products = $query->paginate(20)->withQueryString();

        // 5. Get Category Name
        $category = Category::find($id);
        $name = $category ? $category->name : 'Category';

        return inertia('Customer/ProductWithCategory', [
            'products' => $products,
            'name' => $name
        ]);
    }


    public function showProductPage(Request $request)
    {
        // 1. Start Query
        $query = Product::query();

        // 2. Search Logic (New)
        if ($request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where('name', 'LIKE', '%' . $searchTerm . '%');
        }

        // 3. Price Filter Logic (Reuse logic from category page if you want standard filters here too)
        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // 4. Sort Logic (Reuse logic)
        $sort = $request->input('sort', 'default');
        switch ($sort) {
            case 'date_desc':
                $query->orderBy('created_at', 'desc');
                break;
            case 'date_asc':
                $query->orderBy('created_at', 'asc');
                break;
            case 'name_asc':
                $query->orderBy('name', 'asc');
                break;
            case 'name_desc':
                $query->orderBy('name', 'desc');
                break;
            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;
            default:
                $query->orderBy('id', 'desc');
                break;
        }

        // 5. Paginate Results
        $products = $query->paginate(20)->withQueryString();

        // 6. Return View
        return inertia('Customer/ProductPage', [
            'products' => $products,
        ]);
    }

    public function showRegisterForm()
    {
        return inertia('AuthPages/Register');
    }
    public function showLoginForm()
    {
        return inertia('AuthPages/Login');
    }


    public function registerCustomer(Request $request)
    {
        // 1. Validation with your specific Regex
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'address' => 'required|string|max:500',
            'phone' => ['required', 'string', 'regex:/^(013|014|015|016|017|018|019)[0-9]{8}$/', 'unique:users'],
        ]);

        // 2. Generate OTP
        $otp = rand(100000, 999999);

        // 3. Create User
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'address' => $validated['address'],
            'phone' => $validated['phone'],
            'role' => 'customer', // Default role
            'otp' => $otp,
            'otp_expires_at' => Carbon::now()->addMinutes(10), // Expires in 10 mins
        ]);

        // 4. Send Email
        try {
            Mail::to($user->email)->send(new OtpMail($otp, $user->name));
        } catch (\Exception $e) {
            // Log error: \Log::error($e->getMessage());

        }

        // 5. Redirect to OTP page with email in session
        return redirect()->route('verification.notice')->with('email', $user->email);
    }

    // ================= OTP FLOW =================

    public function showVerifyForm()
    {
        $email = session('email');

        // If user tries to access this page directly without registering/login first
        if (!$email) {
            return redirect('/login');
        }

        return Inertia::render('Customer/VerifyOtp', [
            'email' => $email
        ]);
    }

    // public function verifyOtp(Request $request)
    // {
    //     $request->validate([
    //         'email' => 'required|email|exists:users,email',
    //         'otp' => 'required|numeric|digits:6',
    //     ]);

    //     $user = User::where('email', $request->email)->first();

    //     // Check 1: OTP Logic
    //     if (!$user || $user->otp != $request->otp) {
    //         return back()->withErrors(['otp' => 'Invalid OTP provided.']);
    //     }

    //     // Check 2: Expiration
    //     // if (Carbon::now()->greaterThan($user->otp_expires_at)) {
    //     //     return back()->withErrors(['otp' => 'OTP has expired. Please login to request a new one.']);
    //     // }

    //     if (!$user->otp_expires_at || Carbon::now()->greaterThan($user->otp_expires_at)) {
    //         return back()->withErrors(['otp' => 'OTP has expired. Please login to request a new one.']);
    //     }

    //     // Success: Verify both Email , Clear OTP
    //     $user->update([
    //         'email_verified_at' => Carbon::now(),
    //         'otp' => null,
    //         'otp_expires_at' => null,
    //     ]);

    //     // Login the user
    //     Auth::login($user);
    //     $this->moveCartToDatabase($user->id); //added while doing cart functionality
    //     $request->session()->regenerate();

    //     return redirect()->intended('/dashboard');
    // }

    // ================= LOGIN FLOW =================



    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|numeric|digits:6',
        ]);

        $user = User::where('email', $request->email)->first();

        // Check 1: OTP Logic
        if (!$user || $user->otp != $request->otp) {
            return back()->withErrors(['otp' => 'Invalid OTP provided.']);
        }


        // if (!$user || $user->otp != $request->otp) {
        //     return Inertia::render('Customer/VerifyOtp', [
        //         'email' => $request->email,
        //         'errors' => ['otp' => 'Invalid OTP | Email is not genuine.']
        //     ]);
        // }

        // Check 2: Expiration

        if (!$user->otp_expires_at || Carbon::now()->greaterThan($user->otp_expires_at)) {
            return back()->withErrors(['otp' => 'OTP has expired.']);
        }


        // if (!$user->otp_expires_at || Carbon::now()->greaterThan($user->otp_expires_at)) {
        //     return Inertia::render('Customer/VerifyOtp', [
        //         'email' => $request->email,
        //         'errors' => ['otp' => 'OTP has expired. Please login to request a new one.']
        //     ]);
        // }

        // Success logic...
        $user->update([
            'email_verified_at' => Carbon::now(),
            'otp' => null,
            'otp_expires_at' => null,
        ]);

        Auth::login($user);
        $this->moveCartToDatabase($user->id);
        $request->session()->regenerate();

        return redirect()->intended('/');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $remember = $request->boolean('remember');

        // ১. ক্রেডেনশিয়াল চেক করা
        if (Auth::attempt($credentials, $remember)) {
            $user = Auth::user();

            // ============================================================
            // নতুন লজিক: অ্যাডমিন সরাসরি ড্যাশবোর্ডে যাবে (No 2FA)
            // ============================================================
            if ($user->role === 'admin') {
                $request->session()->regenerate();
                $this->moveCartToDatabase($user->id);
                return redirect()->route('admin.orders');
            }

            // ============================================================
            // ২. ম্যানেজার এবং এমপ্লয়ীদের জন্য ২এফএ (2FA Required)
            // ============================================================
            if (in_array($user->role, ['manager', 'employee'])) {

                // যদি ২এফএ সেটআপ না করা থাকে
                if (!$user->google2fa_secret) {
                    Auth::logout();
                    return back()->withErrors([
                        'email' => '2FA is not set up for your account. Please contact your administrator.'
                    ]);
                }

                // আইডি সেশনে রেখে লগআউট করে দিচ্ছি ২এফএ পেজে পাঠানোর জন্য
                $userId = $user->id;
                Auth::logout();
                $request->session()->put('2fa_user_id', $userId);

                return redirect()->route('staff.2fa.index');
            }

            // ============================================================
            // ৩. কাস্টমার হলে আগের লজিক (Email Verification Check)
            // ============================================================
            if ($user->role === 'customer') {
                if ($user->email_verified_at === null) {
                    Auth::logout();
                    $otp = rand(100000, 999999);
                    $user->update(['otp' => $otp, 'otp_expires_at' => Carbon::now()->addMinutes(5)]);

                    try {
                        Mail::to($user->email)->send(new OtpMail($otp, $user->name));
                    } catch (\Exception $e) {
                        // Log error
                    }

                    return redirect()->route('verification.notice')->with('email', $user->email);
                }

                $request->session()->regenerate();
                $this->moveCartToDatabase($user->id);
                return redirect()->intended('/');
            }

            // অন্য কোনো রোল থাকলে ডিফল্ট রিডাইরেক্ট
            return redirect()->intended('/');
        }

        return back()->withErrors(['email' => 'The provided credentials do not match our records.']);
    }


    public function showStaff2FaForm()
    {

        if (!session()->has('2fa_user_id')) {
            return redirect()->route('login');
        }

        return inertia('AuthPages/StaffTwoFactor');
    }

    public function verifyStaff2Fa(Request $request)
    {
        $request->validate([
            'code' => 'required|numeric|digits:6',
        ]);

        if (!session()->has('2fa_user_id')) {
            return redirect()->route('login');
        }

        $userId = session()->get('2fa_user_id');
        $user = User::findOrFail($userId);

        // Google 2FA ভেরিফিকেশন শুরু
        $google2fa = app('pragmarx.google2fa');
        $valid = $google2fa->verifyKey($user->google2fa_secret, $request->code);

        if ($valid) {
            // কোড সঠিক হলে সফলভাবে লগইন
            Auth::login($user);
            session()->forget('2fa_user_id');
            $request->session()->regenerate();

            return redirect()->route('admin.orders');
        }

        return back()->withErrors(['code' => 'Invalid security code. Please ask your manager for the correct code.']);
    }


    // public function login(Request $request)
    // {
    //     $credentials = $request->validate([
    //         'email' => ['required', 'email'],
    //         'password' => ['required'],
    //     ]);



    //     if (Auth::attempt($credentials, $request->boolean('remember'))) {

    //         $user = Auth::user();

    //         // 1. Verify OTP Status
    //         if ($user->email_verified_at === null) {
    //             Auth::logout();
    //             $otp = rand(100000, 999999);
    //             $user->update([
    //                 'otp' => $otp,
    //                 'otp_expires_at' => Carbon::now()->addMinutes(5)
    //             ]);

    //             try {
    //                 Mail::to($user->email)->send(new OtpMail($otp, $user->name));
    //             } catch (\Exception $e) {
    //                 // Log error if mail fails
    //             }

    //             return redirect()->route('verification.notice')
    //                 ->with('email', $user->email)
    //                 ->withErrors(['email' => 'Your email is not verified. A new OTP has been sent.']);
    //         }

    //         // 2. Handle Cart Migration
    //         $this->moveCartToDatabase($user->id);

    //         // 3. REDIRECT BASED ON ROLE
    //         // If Customer -> Home Page
    //         if ($user->role === 'customer') {
    //             return redirect()->intended('/');
    //         }

    //         // If Admin, Manager, or Employee -> Orders Page (as per your request)
    //         if (in_array($user->role, ['admin', 'manager', 'employee'])) {
    //             return redirect()->route('admin.orders');
    //         }
    //
    //         // Fallback
    //         return redirect()->intended('/');
    //     }
    //
    //     return back()->withErrors([
    //         'email' => 'The provided credentials do not match our records.',
    //     ]);
    // }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }

    // Helper to move session cart to database
    protected function moveCartToDatabase($userId)
    {
        $sessionCart = session()->get('cart', []);

        // Load all database cart items for this user
        $dbCart = \App\Models\Cart::where('user_id', $userId)->get();

        // Merge DB cart into session cart
        foreach ($dbCart as $dbItem) {
            if (isset($sessionCart[$dbItem->product_id])) {
                $sessionCart[$dbItem->product_id] += $dbItem->quantity;
            } else {
                $sessionCart[$dbItem->product_id] = $dbItem->quantity;
            }
        }

        // Save the merged session cart back to the database
        \App\Models\Cart::where('user_id', $userId)->delete();

        foreach ($sessionCart as $productId => $quantity) {
            \App\Models\Cart::create([
                'user_id' => $userId,
                'product_id' => $productId,
                'quantity' => $quantity
            ]);
        }

        // Keep the merged cart in session as the active state
        session()->put('cart', $sessionCart);
    }


    public function viewOrders()
    {
        if (!Auth::check()) {
            return redirect('/login'); // or handle guest user
        }

        $user = Auth::user();
        $orders = Order::where('user_id', $user->id)->get();
        return inertia('Customer/CustomerOrders', [
            'orders' => $orders,
        ]);
    }


    public function showOrderedItem($id)
    {
        // 1. Ensure the user is logged in
        if (!Auth::check()) {
            return redirect('/login');
        }

        $user = Auth::user();
        $userPhone = $user->phone;

        // 2. Fetch the order with items and product details
        $order = Order::with('items.product')
            ->where('id', $id)
            ->where(function ($query) use ($user, $userPhone) {
                // Secure Logic: 
                // The order belongs to the user if the phone numbers match
                // OR if the order was explicitly assigned to their user_id.
                if ($userPhone) {
                    $query->where('phone', $userPhone)
                        ->orWhere('user_id', $user->id);
                } else {
                    // Fallback: if user has no phone in profile, search only by ID
                    $query->where('user_id', $user->id);
                }
            })
            ->firstOrFail(); // Throws 404 if not found or not owned by user

        return Inertia::render('Customer/OrderDetails', [
            'order' => $order
        ]);
    }


    public function viewDeashboard()
    {
        $user = Auth::user();

        // 1. Get the phone number from the logged-in user's profile
        $userPhone = $user->phone;

        // 2. Fetch orders where the phone number matches
        // We also include user_id as a fallback in case the phone was entered differently
        $orders = Order::where('phone', $userPhone)->latest()->get();

        return Inertia::render('Customer/CustomerDashboard', [
            'orders' => $orders
        ]);

    }







    public function show_offer_products(Request $request)
    {
        $query = Product::whereHas('category', function ($query) {
            $query->where('name', 'like', '%Offer%')
                ->orWhere('slug', 'offer');
        })
            ->where('stock', '>', 0);

        // 1. Filter by Minimum Price
        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        // 2. Filter by Maximum Price
        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // 3. Sorting Logic
        if ($request->filled('sort')) {
            switch ($request->sort) {
                case 'date_desc':
                    $query->latest();
                    break;
                case 'date_asc':
                    $query->oldest();
                    break;
                case 'name_asc':
                    $query->orderBy('name', 'asc');
                    break;
                case 'name_desc':
                    $query->orderBy('name', 'desc');
                    break;
                case 'price_desc':
                    $query->orderBy('price', 'desc');
                    break;
                case 'price_asc':
                    $query->orderBy('price', 'asc');
                    break;
                default:
                    $query->latest();
                    break;
            }
        } else {
            $query->latest(); // Default sorting
        }

        // Paginate results (12 per page) and keep query parameters in pagination links
        $offerProducts = $query->paginate(20)->withQueryString();

        return inertia('Customer/Offers', [
            'products' => $offerProducts // We pass it as 'products' to match your React component
        ]);
    }








}
