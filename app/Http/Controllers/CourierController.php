<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\Courier\CourierIntegrationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CourierController extends Controller
{
    public function __construct(
        protected CourierIntegrationService $courierService
    ) {}

    /**
     * Save Integration settings (Steadfast, Pathao, Fraud Checker).
     */
    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            // Steadfast
            'steadfast_enabled' => 'nullable|boolean',
            'steadfast_api_key' => 'nullable|string|max:255',
            'steadfast_secret_key' => 'nullable|string|max:255',
            'steadfast_base_url' => 'nullable|url|max:255',

            // Pathao
            'pathao_enabled' => 'nullable|boolean',
            'pathao_environment' => 'nullable|in:sandbox,production',
            'pathao_base_url' => 'nullable|url|max:255',
            'pathao_client_id' => 'nullable|string|max:255',
            'pathao_client_secret' => 'nullable|string|max:255',
            'pathao_username' => 'nullable|string|max:255',
            'pathao_password' => 'nullable|string|max:255',
            'pathao_store_id' => 'nullable|string|max:255',

            // Fraud Check
            'fraud_provider' => 'nullable|in:auto,bd_courier,steadfast',
            'bd_courier_api_key' => 'nullable|string|max:255',
            'steadfast_fraud_enabled' => 'nullable|boolean',

            // Global Website Meta Pixel
            'meta_pixel_enabled' => 'nullable|boolean',
            'meta_pixel_id' => 'nullable|string|max:50',
            'meta_capi_token' => 'nullable|string|max:500',
        ]);

        $this->courierService->saveSettings($validated);

        return back()->with('success', 'Integration settings updated successfully!');
    }

    /**
     * Test connection to Steadfast API.
     */
    public function testSteadfast(Request $request)
    {
        // If testing with unsaved credentials in modal
        if ($request->filled('api_key') || $request->filled('secret_key')) {
            $this->courierService->saveSettings([
                'steadfast_api_key' => $request->api_key,
                'steadfast_secret_key' => $request->secret_key,
            ]);
        }

        $result = $this->courierService->testSteadfast();
        return response()->json($result);
    }

    /**
     * Test connection to Pathao API.
     */
    public function testPathao(Request $request)
    {
        if ($request->filled('client_id') && $request->filled('client_secret')) {
            $this->courierService->saveSettings([
                'pathao_environment' => $request->environment ?? 'sandbox',
                'pathao_client_id' => $request->client_id,
                'pathao_client_secret' => $request->client_secret,
                'pathao_username' => $request->username,
                'pathao_password' => $request->password,
            ]);
        }

        $result = $this->courierService->testPathao();
        return response()->json($result);
    }

    /**
     * Fetch merchant stores from Pathao.
     */
    public function fetchPathaoStores()
    {
        try {
            $stores = $this->courierService->getPathaoStores();
            return response()->json([
                'status' => 'success',
                'data' => $stores,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Fetch Pathao city list.
     */
    public function fetchPathaoCities()
    {
        try {
            $cities = $this->courierService->getPathaoCities();
            return response()->json(['status' => 'success', 'data' => $cities]);
        } catch (\Throwable $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Fetch Pathao zone list by city ID.
     */
    public function fetchPathaoZones($cityId)
    {
        try {
            $zones = $this->courierService->getPathaoZones($cityId);
            return response()->json(['status' => 'success', 'data' => $zones]);
        } catch (\Throwable $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Fetch Pathao area list by zone ID.
     */
    public function fetchPathaoAreas($zoneId)
    {
        try {
            $areas = $this->courierService->getPathaoAreas($zoneId);
            return response()->json(['status' => 'success', 'data' => $areas]);
        } catch (\Throwable $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Unified send to courier (supports both Steadfast and Pathao).
     */
    public function sendOrder(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $courier = $request->input('courier', 'steadfast');

        $request->validate([
            'courier' => 'required|in:steadfast,pathao',
            'invoice' => 'required|string|max:50',
            'note' => 'nullable|string|max:500',
            'cod_amount' => 'nullable|numeric|min:0',
            'store_id' => 'nullable|integer',
            'delivery_type' => 'nullable|integer',
            'item_type' => 'nullable|integer',
            'item_weight' => 'nullable|numeric|min:0.1',
            'item_quantity' => 'nullable|integer|min:1',
            'item_description' => 'nullable|string|max:255',
            'recipient_city' => 'nullable|integer',
            'recipient_zone' => 'nullable|integer',
            'recipient_area' => 'nullable|integer',
        ]);

        if ($courier === 'pathao') {
            $result = $this->courierService->sendToPathao($order, $request->all());
        } else {
            $result = $this->courierService->sendToSteadfast($order, $request->all());
        }

        if ($result['status'] === 'success') {
            return redirect()->back()->with('success', $result['message']);
        }

        return redirect()->back()->with('error', $result['message']);
    }

    /**
     * Backward-compatible Steadfast endpoint.
     */
    public function sendToSteadfast(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $request->validate([
            'note' => 'nullable|string|max:500',
            'invoice' => 'required|string|max:50',
        ]);

        $result = $this->courierService->sendToSteadfast($order, $request->all());

        if ($result['status'] === 'success') {
            return redirect()->back()->with('success', $result['message']);
        }

        return redirect()->back()->with('error', $result['message']);
    }

    /**
     * Send directly to Pathao endpoint.
     */
    public function sendToPathao(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $request->validate([
            'invoice' => 'required|string|max:50',
            'store_id' => 'nullable|integer',
            'delivery_type' => 'nullable|integer',
            'item_type' => 'nullable|integer',
            'item_weight' => 'nullable|numeric|min:0.1',
            'item_quantity' => 'nullable|integer|min:1',
            'item_description' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:500',
        ]);

        $result = $this->courierService->sendToPathao($order, $request->all());

        if ($result['status'] === 'success') {
            return redirect()->back()->with('success', $result['message']);
        }

        return redirect()->back()->with('error', $result['message']);
    }
}