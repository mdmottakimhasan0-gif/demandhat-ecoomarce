<?php

namespace App\Http\Controllers;

use App\Models\BlockedOrderSource;
use App\Services\OrderProtection;
use Illuminate\Http\Request;

/** Admin > Settings > Order Protection (routes are behind role:admin,manager). */
class OrderProtectionController extends Controller
{
    public function update(Request $request, OrderProtection $protection)
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'block_phone' => ['required', 'boolean'],
            'block_ip' => ['required', 'boolean'],
            'ip_limit' => ['required', 'integer', 'min:1', 'max:100'],
            'window_hours' => ['required', 'integer', 'min:1', 'max:720'],
        ]);

        $protection->update($data);

        return back()->with('success', 'Order protection settings saved.');
    }

    public function block(Request $request)
    {
        $data = $request->validate([
            'type' => ['required', 'in:ip,phone'],
            'value' => ['required', 'string', 'max:64'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $value = OrderProtection::normalizeValue($data['type'], $data['value']);
        if ($value === null) {
            return back()->withErrors(['value' => $data['type'] === 'phone'
                ? 'Enter a valid Bangladesh mobile number (01XXXXXXXXX).'
                : 'Enter a valid IP address or a CIDR range (e.g. 203.0.113.0/24, at least /8).']);
        }
        if (BlockedOrderSource::where('type', $data['type'])->where('value', $value)->exists()) {
            return back()->withErrors(['value' => 'This is already blocked.']);
        }

        BlockedOrderSource::create(['type' => $data['type'], 'value' => $value, 'reason' => $data['reason'] ?? null, 'created_by' => $request->user()->id]);

        return back()->with('success', ucfirst($data['type']).' blocked from placing orders.');
    }

    public function unblock(int $id)
    {
        BlockedOrderSource::findOrFail($id)->delete();

        return back()->with('success', 'Removed from the block list.');
    }
}
