<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CourierController extends Controller
{
    public function sendToSteadfast(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $request->validate([
            'note' => 'nullable|string|max:500',
            'invoice' => 'required|string|max:50|unique:orders,courier_invoice_id,' . $order->id,
        ]);

        try {
            $response = Http::withHeaders([
                'Api-Key' => env('STEADFAST_API_KEY'),
                'Secret-Key' => env('STEADFAST_SECRET_KEY'),
                'Content-Type' => 'application/json',
            ])->post('https://portal.packzy.com/api/v1/create_order', [
                        'invoice' => $request->invoice,
                        'recipient_name' => $order->name,
                        'recipient_phone' => $order->phone,
                        'recipient_address' => $order->address,
                        'cod_amount' => $order->grand_total,
                        'note' => $request->note ?? '',
                    ]);

            $result = $response->json();

            // Check if the API returned 200
            if ($response->successful() && isset($result['status']) && $result['status'] == 200) {
                $order->update([
                    'order_status' => 'shipped',
                    'courier_invoice_id' => $request->invoice,
                    // OPTIONAL: Store the tracking code from Steadfast if you have a column for it
                    // 'tracking_code' => $result['consignment']['tracking_code'] ?? null,
                ]);

                return redirect()->back()->with('success', 'Order sent to Steadfast successfully!');
            }

            return redirect()->back()->with('error', 'Steadfast Error: ' . ($result['message'] ?? 'Error occurred.'));

        } catch (\Exception $e) {
            Log::error('Steadfast API Error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to connect to Steadfast.');
        }
    }




}