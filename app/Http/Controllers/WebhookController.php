<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function handleSteadfastWebhook(Request $request)
    {
        // 1. Security Check: Validate the Token
        $expectedToken = env('STEADFAST_WEBHOOK_TOKEN');

        if (!$expectedToken || $request->bearerToken() !== $expectedToken) {
            Log::critical('Unauthorized Webhook or Missing ENV Token!');
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        // 2. We only care about delivery status updates
        if ($request->input('notification_type') !== 'delivery_status') {
            return response()->json([
                'status' => 'success',
                'message' => 'Ignored non-delivery status update.'
            ], 200);
        }

        $invoice = $request->input('invoice');
        $steadfastStatus = strtolower($request->input('status')); // delivered, partial_delivered, cancelled

        if (!$invoice || !$steadfastStatus) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid payload. Missing invoice or status.'
            ], 400);
        }

        // 3. Find the order in your database using courier_invoice_id
        $order = Order::where('courier_invoice_id', $invoice)->first();

        if ($order) {
            // 4. Map Steadfast status to your database status
            $newStatus = $order->order_status;

            if ($steadfastStatus === 'delivered' || $steadfastStatus === 'partial_delivered') {
                $newStatus = 'delivered';
            } elseif ($steadfastStatus === 'cancelled') {
                // Steadfast uses 'cancelled' when a delivery returns/fails
                $newStatus = 'cancelled';
            }

            // 5. Update database if the status has actually changed
            if ($newStatus !== $order->order_status) {

                // === NEW LOGIC: Prepare the data to update ===
                $updateData = ['order_status' => $newStatus];

                // If the new status is delivered, also mark payment as paid
                if ($newStatus === 'delivered') {
                    $updateData['payment_status'] = 'paid';
                }

                // Perform the update
                $order->update($updateData);

                Log::info("Order #{$order->id} status updated to {$newStatus} via Steadfast Webhook.");
            }

            // 6. Return the required 200 OK success response
            return response()->json([
                'status' => 'success',
                'message' => 'Webhook received successfully.'
            ], 200);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Order not found.'
        ], 404);
    }
}