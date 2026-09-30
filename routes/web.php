<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\CourierController;
use App\Http\Controllers\ProfileController;
use App\Models\Order;
use App\Http\Controllers\AdminReviewController;

// ==========================================
// 1. PUBLIC ROUTES (Accessible by everyone)
// ==========================================
Route::get('/', [CustomerController::class, 'index'])->name('home');
Route::get('/categories', [CustomerController::class, 'showCategories']);
Route::get('/category/{id}', [CustomerController::class, 'showProductsByCategory']);
Route::get('/product/{id}', [ProductController::class, 'showDetails']);
Route::get('/productspage', [CustomerController::class, 'showProductPage']);
Route::get('/about', [CustomerController::class, 'aboutpage']);
Route::get('/ReqProduct', [CustomerController::class, 'reqProductForm']);
Route::get('/offers', [CustomerController::class, 'show_offer_products']);

// Cart Routes
Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::post('/cart/add', [CartController::class, 'store'])->name('cart.add');
Route::patch('/cart/update/{id}', [CartController::class, 'update'])->name('cart.update');
Route::delete('/cart/remove/{id}', [CartController::class, 'destroy'])->name('cart.remove');

// Checkout Routes
Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout.index');
Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');
Route::get('/checkout/success', [CheckoutController::class, 'success'])->name('checkout.success');

// ==========================================
// 2. GUEST ROUTES (Only for non-logged in users)
// ==========================================
Route::middleware('guest')->group(function () {
  Route::get('/register', [CustomerController::class, 'showRegisterForm'])->name('register');
  Route::post('/register/store', [CustomerController::class, 'registerCustomer']);

  Route::get('/login', [CustomerController::class, 'showLoginForm'])->name('login');
  Route::post('/login', [CustomerController::class, 'login']);

  // OTP Routes
  Route::get('/verify-otp', [CustomerController::class, 'showVerifyForm'])->name('verification.notice');
  Route::post('/verify-otp', [CustomerController::class, 'verifyOtp'])->name('verify.otp');


});

// ==========================================
// 3. AUTHENTICATED ROUTES
// ==========================================
Route::middleware('auth')->group(function () {

  // Global Logout
  Route::post('/logout', [CustomerController::class, 'logout'])->name('logout');

  // ------------------------------------------
  // A. CUSTOMER AREA
  // ------------------------------------------
  Route::middleware(['role:customer'])->group(function () {
    Route::post('/reviews', [ProductController::class, 'storeReview']);
    Route::get('/dashboard', [CustomerController::class, 'viewDeashboard']);
    Route::get('/myOrders', [CustomerController::class, 'viewOrders'])->name('customer.orders');
    Route::get('/orderedItem/{id}', [CustomerController::class, 'showOrderedItem']);
  });

  // ------------------------------------------
  // B. STAFF AREA (Admin + Manager + Employee)
  // ------------------------------------------
  // RESTRICTED: These are the ONLY pages an Employee can see.
  Route::middleware(['role:admin,manager,employee'])->group(function () {

    // 1. View Orders Table
    Route::get('/admin/orders', [OrderController::class, 'viewOrderTable'])->name('admin.orders');

    // 2. View Specific Order Details
    Route::get('/admin/orders/{id}/details', [OrderController::class, 'showDetails'])->name('admin.orders.details');

    // 3. Update Order Status (Employees need this)
    Route::put('/admin/orders/{id}/update', [OrderController::class, 'update'])->name('admin.orders.status');

    // 4. View Customer Profile (Needed to see phone/address in details)
    Route::get('/admin/customers/{id}/profile', [OrderController::class, 'viewCustomerDetails']);

    // 5. Courier Actions
    Route::post('/admin/courier/steadfast/{id}', [CourierController::class, 'sendToSteadfast']);
    Route::post('/admin/courier/pathao/{id}', [CourierController::class, 'sendToPathao']);
    Route::post('/admin/courier/send/{id}', [CourierController::class, 'sendOrder'])->name('admin.courier.send');
    Route::get('/admin/orders/{id}/check-fraud', [OrderController::class, 'checkFraud'])->name('admin.orders.fraud_check');
    Route::get('/admin/orders/export/pdf', [OrderController::class, 'exportPdf'])->name('admin.orders.export');
    Route::get('/admin/orders/{id}/invoice', [OrderController::class, 'printInvoice'])->name('admin.orders.invoice');

    // 6. Own profile & password (every staff member manages their own account)
    Route::get('/admin/profile', [ProfileController::class, 'edit'])->name('admin.profile');
    Route::put('/admin/profile', [ProfileController::class, 'update'])->name('admin.profile.update');
    Route::put('/admin/profile/password', [ProfileController::class, 'updatePassword'])->middleware('throttle:6,1')->name('admin.profile.password');



  });

  // ------------------------------------------
  // C. MANAGEMENT AREA (Admin + Manager)
  // ------------------------------------------
  // BLOCKED for Employees.
  Route::middleware(['role:admin,manager'])->group(function () {



    Route::get('/admin/users', [AdminController::class, 'showUsers']);
    Route::get('/admin/settings', [AdminController::class, 'settingPage']);

    // Duplicate-order protection (Settings > Order Protection)
    Route::put('/admin/settings/order-protection', [\App\Http\Controllers\OrderProtectionController::class, 'update'])->name('admin.order_protection.update');
    Route::post('/admin/settings/order-protection/blocked', [\App\Http\Controllers\OrderProtectionController::class, 'block'])->name('admin.order_protection.block');
    Route::delete('/admin/settings/order-protection/blocked/{id}', [\App\Http\Controllers\OrderProtectionController::class, 'unblock'])->name('admin.order_protection.unblock');

    // Courier & Fraud Integration (Settings > Integrations)
    Route::put('/admin/settings/courier-integration', [CourierController::class, 'updateSettings'])->name('admin.courier_integration.update');
    Route::post('/admin/settings/courier-integration/test-steadfast', [CourierController::class, 'testSteadfast'])->name('admin.courier_integration.test_steadfast');
    Route::post('/admin/settings/courier-integration/test-pathao', [CourierController::class, 'testPathao'])->name('admin.courier_integration.test_pathao');
    Route::get('/admin/settings/courier-integration/pathao-stores', [CourierController::class, 'fetchPathaoStores'])->name('admin.courier_integration.pathao_stores');
    Route::get('/admin/settings/courier-integration/pathao-cities', [CourierController::class, 'fetchPathaoCities'])->name('admin.courier_integration.pathao_cities');
    Route::get('/admin/settings/courier-integration/pathao-zones/{cityId}', [CourierController::class, 'fetchPathaoZones'])->name('admin.courier_integration.pathao_zones');
    Route::get('/admin/settings/courier-integration/pathao-areas/{zoneId}', [CourierController::class, 'fetchPathaoAreas'])->name('admin.courier_integration.pathao_areas');


    // 1. Dashboard
    Route::get('/admin', [AdminController::class, 'dashboard'])->name('admin.dashboard');

    // 2. SENSITIVE Order Actions (Moved here so Employees cannot use them)

    Route::post('/admin/orders/assign-batch', [OrderController::class, 'assignBatch'])->name('admin.orders.assign_batch');

    // 3. Product Management
    Route::resource('/admin/products', AdminProductController::class);
    Route::post('/admin/upload-editor-image', [AdminProductController::class, 'uploadEditorImage']);

    // 4. Category Management
    Route::prefix('admin/categories')->group(function () {
      Route::get('/', [CategoryController::class, 'getAllCategory'])->name('categories.index');
      Route::get('/create', [CategoryController::class, 'createCategory'])->name('categories.create');
      Route::post('/store', [CategoryController::class, 'storeCategory'])->name('categories.store');
      Route::get('/{id}/edit', [CategoryController::class, 'editParentCategory'])->name('categories.edit');
      Route::patch('/{id}/update', [CategoryController::class, 'updateCategory'])->name('categories.update');
      Route::delete('/{id}/delete', [CategoryController::class, 'destroyCategory'])->name('categories.delete');
    });

    // 5. CMS / Hero / Sections
    Route::get('/admin/addHeroImage', [AdminController::class, 'showAddHeroForm']);
    Route::post('/admin/hero/store', [AdminController::class, 'heroStore']);
    Route::get('/admin/heroEdit/{id}', [AdminController::class, 'showEditHeroForm']);
    Route::patch('/admin/hero/{id}', [AdminController::class, 'heroUpdate']);
    Route::delete('/admin/hero/{id}', [AdminController::class, 'deleteHeroImage']);

    Route::get('/admin/addSections', [AdminController::class, 'sectionForm']);
    Route::post('/admin/section/store', [AdminController::class, 'sectionStore']);
    Route::get('/admin/sectionEdit/{id}', [AdminController::class, 'sectionEdit']);
    Route::patch('/admin/section/{id}', [AdminController::class, 'sectionUpdate']);
    Route::delete('/admin/sectionDelete/{id}', [AdminController::class, 'sectionDelete']);
    Route::patch('/admin/marquee/{id}', [AdminController::class, 'updateMarquee']);

    Route::get('/admin/addContact', [AdminController::class, 'createContact'])->name('admin.contact.create');
    Route::post('/admin/contactStore', [AdminController::class, 'storeContact'])->name('admin.contact.store');
    Route::delete('/admin/contactDelete/{id}', [AdminController::class, 'deleteContact'])->name('admin.contact.delete');

    // 6. View Employees
    Route::get('/admin/employees', [EmployeeController::class, 'showEmployees']);
    Route::get('/admin/employee/create', [EmployeeController::class, 'showAddEmployeeForm']);
    Route::post('/admin/employee/store', [EmployeeController::class, 'store'])->name('admin.employees.store');


    Route::get('/admin/employee/{id}/qr-code', [EmployeeController::class, 'getTwoFactorQrCode']);
    Route::post('/admin/employee/{id}/reset-2fa', [EmployeeController::class, 'resetTwoFactor'])->name('admin.employees.reset_2fa');


    // 7. Reviews Management
    Route::get('/admin/reviews', [AdminReviewController::class, 'index'])->name('admin.reviews.index');
    Route::patch('/admin/reviews/{id}/toggle', [AdminReviewController::class, 'toggleStatus'])->name('admin.reviews.toggle');
    Route::delete('/admin/reviews/{id}', [AdminReviewController::class, 'destroy'])->name('admin.reviews.delete');


    Route::get('/admin/employees/export-excel', [EmployeeController::class, 'exportExcel']);

  });

  // ------------------------------------------
  // D. SUPER ADMIN AREA (Admin Only)
  // ------------------------------------------
  Route::middleware(['role:admin'])->group(function () {

    Route::delete('/admin/employees/{id}', [EmployeeController::class, 'destroy'])->name('admin.employees.delete');
  });

});


Route::get('/staff/verify-2fa', [CustomerController::class, 'showStaff2FaForm'])->name('staff.2fa.index');
Route::post('/staff/verify-2fa', [CustomerController::class, 'verifyStaff2Fa'])->name('staff.2fa.verify');



