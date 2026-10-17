<?php

namespace App\Http\Controllers;

use App\Models\SiteSetting;
use App\Services\AiChatbotService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ChatbotController extends Controller
{
    /**
     * Public Customer Chat API Endpoint
     */
    public function customerChat(Request $request, AiChatbotService $ai): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
            'history' => 'nullable|array',
        ]);

        $reply = $ai->processCustomerChat(
            $validated['message'],
            $request->input('history', [])
        );

        return response()->json($reply);
    }

    /**
     * Protected Admin AI Copilot Chat Endpoint
     */
    public function adminChat(Request $request, AiChatbotService $ai): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
            'history' => 'nullable|array',
        ]);

        $reply = $ai->processAdminChat(
            $validated['message'],
            $request->user(),
            $request->input('history', [])
        );

        return response()->json($reply);
    }

    /**
     * Get Admin AI Configuration Status
     */
    public function getAdminStatus(AiChatbotService $ai): JsonResponse
    {
        $apiKey = $ai->getApiKey();

        return response()->json([
            'has_api_key' => !empty($apiKey),
            'masked_key' => $apiKey ? (substr($apiKey, 0, 4) . '...' . substr($apiKey, -4)) : null,
            'brand_name' => SiteSetting::read('brand.name', 'Unity Haven'),
        ]);
    }

    /**
     * Save / Update Free Google Gemini API Key
     */
    public function saveApiKey(Request $request, AiChatbotService $ai): JsonResponse
    {
        $validated = $request->validate([
            'api_key' => 'nullable|string|max:255',
        ]);

        $ai->saveApiKey($validated['api_key'] ?? '');

        return response()->json([
            'ok' => true,
            'message' => 'Gemini API Key successfully updated!',
            'has_api_key' => !empty($validated['api_key']),
        ]);
    }
}
