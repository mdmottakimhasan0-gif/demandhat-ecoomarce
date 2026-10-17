<?php

namespace App\Services;

use App\Models\Contact;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\LandingPage;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AiChatbotService
{
    /**
     * Get configured Gemini API key from database or environment.
     */
    public function getApiKey(): ?string
    {
        $key = SiteSetting::read('gemini_api_key');
        if (!empty($key)) {
            return trim($key);
        }

        return env('GEMINI_API_KEY') ?: null;
    }

    /**
     * Save Gemini API key in site settings.
     */
    public function saveApiKey(?string $key): void
    {
        SiteSetting::write('gemini_api_key', trim((string) $key));
    }

    /**
     * Call Google Gemini 1.5 Flash API with a prompt and system instruction.
     */
    public function callGemini(string $userPrompt, string $systemInstruction = '', array $history = []): ?string
    {
        $apiKey = $this->getApiKey();
        if (empty($apiKey)) {
            return null;
        }

        try {
            $models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-1.5-flash'];

            $contents = [];

            // Append recent history if provided
            foreach ($history as $h) {
                if (!empty($h['role']) && !empty($h['text'])) {
                    $contents[] = [
                        'role' => $h['role'] === 'user' ? 'user' : 'model',
                        'parts' => [['text' => (string) $h['text']]],
                    ];
                }
            }

            // Current prompt
            $contents[] = [
                'role' => 'user',
                'parts' => [['text' => $userPrompt]],
            ];

            $payload = [
                'contents' => $contents,
                'generationConfig' => [
                    'temperature' => 0.7,
                    'maxOutputTokens' => 800,
                ],
            ];

            if (!empty($systemInstruction)) {
                $payload['systemInstruction'] = [
                    'parts' => [['text' => $systemInstruction]],
                ];
            }

            foreach ($models as $model) {
                $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
                $response = Http::timeout(15)
                    ->withHeaders(['Content-Type' => 'application/json'])
                    ->post($url, $payload);

                if ($response->successful()) {
                    $data = $response->json();
                    $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if ($reply) {
                        return trim($reply);
                    }
                }
            }

            return null;
        } catch (\Throwable $e) {
            Log::error('Gemini API exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Process Customer Chat Messages.
     * Combines smart database lookup with Gemini AI.
     */
    public function processCustomerChat(string $message, array $history = []): array
    {
        $rawMsg = trim($message);
        $clean = mb_strtolower($rawMsg);

        // 1. Detect Phone Number for Order Tracking (e.g. 01712345678 or +88017...)
        if (preg_match('/(?:\+?88)?(01[3-9]\d{8})/', $rawMsg, $matches)) {
            $phone = $matches[1];
            return $this->lookupCustomerOrders($phone);
        }

        // 2. Direct Order Tracking keyword without full number
        if (str_contains($clean, 'track') || str_contains($clean, 'ট্র্যাক') || str_contains($clean, 'আমার পার্সেল') || str_contains($clean, 'অর্ডার কোথায়')) {
            return [
                'type' => 'text',
                'text' => "📦 আপনার অর্ডারের বর্তমান অবস্থা জানতে অনুগ্রহ করে আপনার **১১ ডিজিটের মোবাইল নম্বর** (যেমন: 017XXXXXXXX) অথবা **অর্ডার আইডি** লিখে মেসেজ পাঠান।",
                'quick_replies' => ['01712345678', 'ডেলিভারি চার্জ কত?', 'হোয়াটসঅ্যাপে কথা বলুন'],
            ];
        }

        // 3. Delivery Charge and Shipping Inquiries
        if (str_contains($clean, 'ডেলিভারি') || str_contains($clean, 'চার্জ') || str_contains($clean, 'delivery') || str_contains($clean, 'shipping') || str_contains($clean, 'কুরিয়ার')) {
            return [
                'type' => 'text',
                'text' => "🚚 **ডেলিভারি সংক্রান্ত তথ্য:**\n\n• **ঢাকার ভিতরে:** ৬০ - ৭০ টাকা (১ থেকে ২ দিনের মধ্যে ডেলিভারি)\n• **ঢাকার বাইরে:** ১২০ - ১৩০ টাকা (২ থেকে ৩ দিনের মধ্যে ডেলিভারি)\n• **পেমেন্ট পদ্ধতি:** ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে মূল্য পরিশোধ করার সুযোগ রয়েছে)।\n\nকিছু স্পেশাল অফারে **ফ্রি ডেলিভারি** প্রদান করা হয়!",
                'quick_replies' => ['অর্ডার ট্র্যাক করুন', 'প্রোডাক্ট দেখতে চাই', 'হোয়াটসঅ্যাপে কথা বলুন'],
            ];
        }

        // 4. Return / Replacement Policy Inquiries
        if (str_contains($clean, 'রিটার্ন') || str_contains($clean, 'ফেরত') || str_contains($clean, 'চেঞ্জ') || str_contains($clean, 'return') || str_contains($clean, 'exchange') || str_contains($clean, 'policy')) {
            return [
                'type' => 'text',
                'text' => "🛡️ **আমাদের রিটার্ন ও রিপ্লেসমেন্ট পলিসি:**\n\n• ডেলিভারি ম্যানের সামনে প্রোডাক্ট দেখে ও চেক করে নেওয়ার সুযোগ রয়েছে।\n• প্রোডাক্টে কোনো ক্রটি থাকলে বা সাইজ না মিললে সাথে সাথে ডেলিভারি ম্যানকে রিটার্ন করতে পারবেন বা পরিবর্তন করে নিতে পারবেন।\n• কোনো সহায়তার জন্য আমাদের হেল্পলাইনে সরাসরি যোগাযোগ করতে পারেন।",
                'quick_replies' => ['হোয়াটসঅ্যাপে কথা বলুন', 'অন্য প্রোডাক্ট দেখতে চাই'],
            ];
        }

        // 5. Contact / WhatsApp Helpline
        if (str_contains($clean, 'কথা বলতে') || str_contains($clean, 'কল') || str_contains($clean, 'হোয়াটসঅ্যাপ') || str_contains($clean, 'whatsapp') || str_contains($clean, 'নাম্বার') || str_contains($clean, 'helpline') || str_contains($clean, 'contact')) {
            $contact = Contact::first();
            $wa = $contact?->whatsapp ?: '01700000000';
            $phone = $contact?->phone ?: $wa;
            $waClean = preg_replace('/[^0-9]/', '', $wa);

            return [
                'type' => 'contact',
                'text' => "📞 **আমাদের কাস্টমার কেয়ার সাপোর্ট:**\n\nযেকোনো প্রশ্ন বা সরাসরি কথা বলতে আমাদের সাথে যোগাযোগ করতে পারেন:\n• **মোবাইল:** {$phone}\n• **হোয়াটসঅ্যাপ:** {$wa}",
                'whatsapp_url' => "https://wa.me/{$waClean}?text=" . urlencode("হ্যালো, আমি একটি তথ্য জানতে চাই।"),
                'quick_replies' => ['অর্ডার ট্র্যাক করুন', 'প্রোডাক্ট খুঁজুন'],
            ];
        }

        // 6. Product Search / Recommendation
        $products = $this->searchProducts($rawMsg);
        if ($products->isNotEmpty()) {
            return [
                'type' => 'products',
                'text' => "✨ আপনার পছন্দের সাথে মিল রেখে কিছু চমৎকার পণ্য পাওয়া গেছে:",
                'products' => $products->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'price' => (float) $p->price,
                    'discount' => (float) $p->discount,
                    'selling_price' => $p->discount > 0 ? round($p->price * (1 - $p->discount / 100)) : (float) $p->price,
                    'image' => $p->image ? "/storage/{$p->image}" : null,
                    'url' => "/product/{$p->id}",
                ]),
                'quick_replies' => ['ডেলিভারি চার্জ কত?', 'অর্ডার ট্র্যাক করুন', 'হোয়াটসঅ্যাপে কথা বলুন'],
            ];
        }

        // 7. Conversational AI via Gemini (if API Key is configured)
        $brandName = SiteSetting::read('brand.name', 'Unity Haven');
        $systemInstruction = "You are a friendly, helpful, polite e-commerce customer shopping assistant for '{$brandName}'. " .
            "You speak natural, fluent Bengali (and English if the customer speaks English). " .
            "Help the customer with friendly advice, product ideas, orders, and general store questions. " .
            "Keep replies concise, welcoming, and accurate. Do not make up fake orders.";

        $aiReply = $this->callGemini($rawMsg, $systemInstruction, $history);
        if ($aiReply) {
            return [
                'type' => 'text',
                'text' => $aiReply,
                'quick_replies' => ['অর্ডার ট্র্যাক করুন', 'ডেলিভারি চার্জ কত?', 'হোয়াটসঅ্যাপে কথা বলুন'],
            ];
        }

        // 8. Default Friendly Fallback with Quick Menu
        return [
            'type' => 'text',
            'text' => "স্বাগতম **{$brandName}** এ! 😊\n\nআমি আপনাকে কীভাবে সাহায্য করতে পারি? নিচের অপশনগুলোতে ক্লিক করতে পারেন বা আপনার যেকোনো প্রশ্ন লিখে পাঠাতে পারেন:",
            'quick_replies' => [
                '📦 অর্ডার ট্র্যাক করুন',
                '🚚 ডেলিভারি চার্জ কত?',
                '🔍 সেরা প্রোডাক্টগুলো দেখাও',
                '📞 কাস্টমার কেয়ারে যোগাযোগ',
            ],
        ];
    }

    /**
     * Process Admin AI Copilot / Assistant Messages.
     * Executes administrative queries, stats, drafts, and settings.
     */
    public function processAdminChat(string $message, $user, array $history = []): array
    {
        $raw = trim($message);
        $clean = mb_strtolower($raw);

        // 1. Live Sales and Orders Report
        if (str_contains($clean, 'সেল') || str_contains($clean, 'বিক্রি') || str_contains($clean, 'রিপোর্ট') || str_contains($clean, 'sales') || str_contains($clean, 'report') || str_contains($clean, 'stats') || str_contains($clean, 'অর্ডার')) {
            $today = now()->startOfDay();
            $todayOrders = Order::where('created_at', '>=', $today)->count();
            $todaySales = Order::where('created_at', '>=', $today)->whereNotIn('order_status', ['cancelled', 'returned'])->sum('grand_total');
            $pendingOrders = Order::whereIn('order_status', ['pending', 'processing'])->count();
            $totalProducts = Product::count();
            $lowStock = Product::where('stock', '<=', 5)->count();

            $reply = "📊 **আজকের লাইভ বিজনেস রিপোর্ট:**\n\n" .
                "• **আজকের নতুন অর্ডার:** {$todayOrders} টি\n" .
                "• **আজকের মোট বিক্রি:** ৳" . number_format($todaySales, 2) . "\n" .
                "• **পেন্ডিং / প্রসেসিং অর্ডার:** {$pendingOrders} টি\n" .
                "• **মোট সক্রিয় পণ্য:** {$totalProducts} টি\n" .
                "• **স্টক কম থাকা পণ্য (<= 5):** {$lowStock} টি\n\n" .
                "🔗 [সব অর্ডার দেখুন](/admin/orders) | [পণ্য তালিকা](/admin/products)";

            return [
                'type' => 'text',
                'text' => $reply,
                'quick_replies' => ['নতুন প্রোডাক্ট যোগ করো', 'ল্যান্ডিং পেজ বানাও', 'পিক্সেল আইডি চেক করো'],
            ];
        }

        // 2. Quick Add Product Command
        // e.g. "একটা কালো টি-শার্ট যোগ করো, দাম ৫০০ টাকা, স্টক ৫০" or "নতুন প্রোডাক্ট যোগ" or "add product Smart Watch price 1200 stock 30"
        $isAddProductIntent = str_contains($clean, 'যোগ করো')
            || str_contains($clean, 'অ্যাড করো')
            || str_contains($clean, 'add product')
            || str_contains($clean, 'create product')
            || (str_contains($clean, 'প্রোডাক্ট') && (str_contains($clean, 'যোগ') || str_contains($clean, 'অ্যাড') || str_contains($clean, 'নতুন')))
            || (str_contains($clean, 'পণ্য') && (str_contains($clean, 'যোগ') || str_contains($clean, 'অ্যাড')));

        if ($isAddProductIntent) {
            $hasDetails = preg_match('/(?:দাম|price|tk|টাকা|স্টক|stock|\d{2,6})/iu', $raw);
            if ($hasDetails) {
                $created = $this->parseAndCreateProduct($raw);
                if ($created) {
                    return [
                        'type' => 'action_result',
                        'text' => "🎉 **নতুন প্রোডাক্ট সফলভাবে ড্রাফট তৈরি হয়েছে!**\n\n" .
                            "• **নাম:** {$created->name}\n" .
                            "• **দাম:** ৳{$created->price}\n" .
                            "• **স্টক:** {$created->stock}\n" .
                            (!empty($created->colors) ? "• **কালার:** " . implode(', ', $created->colors) . "\n" : "") .
                            (!empty($created->sizes) ? "• **সাইজ:** " . implode(', ', $created->sizes) . "\n" : "") .
                            "\nএখন আপনি প্রোডাক্টটিতে ছবি বা প্রয়োজনীয় তথ্য যুক্ত করে পাবলিশ করতে পারেন।",
                        'action' => [
                            'label' => 'প্রোডাক্টটি এডিট ও ছবি যোগ করুন',
                            'url' => "/admin/products/{$created->id}/edit",
                        ],
                    ];
                }
            } else {
                return [
                    'type' => 'action_result',
                    'text' => "📦 **নতুন প্রোডাক্ট যোগ করার নিয়ম:**\n\nআপনি চ্যাটে সরাসরি এভাবে লিখে পাঠাতে পারেন:\n*'একটি কালো টি-শার্ট যোগ করো, দাম ৫০০ টাকা, স্টক ৫০'* অথবা *'Add Smart Watch price 1500 stock 20'*\n\nঅথবা ম্যানুয়ালি প্রোডাক্ট তৈরি করতে নিচের বাটনে ক্লিক করুন:",
                    'action' => [
                        'label' => 'ম্যানুয়ালি নতুন প্রোডাক্ট যোগ করুন',
                        'url' => "/admin/products/create",
                    ],
                    'quick_replies' => ['একটি কালো টি-শার্ট যোগ করো, দাম ৫০০ টাকা, স্টক ৫০', 'আজকের সেল রিপোর্ট'],
                ];
            }
        }

        // 3. Pixel or Contact Settings update
        if (str_contains($clean, 'pixel') || str_contains($clean, 'পিক্সেল')) {
            // Check if there is a number
            if (preg_match('/(\d{12,20})/', $raw, $m)) {
                $newId = $m[1];
                SiteSetting::write('site.meta_pixel_id', $newId);
                SiteSetting::write('site.meta_pixel_enabled', '1');
                return [
                    'type' => 'text',
                    'text' => "✅ **মেটা পিক্সেল আইডি সফলভাবে আপডেট হয়েছে!**\n\nবর্তমান পিক্সেল আইডি: `{$newId}`\nলাইভ সাইটে এটি সাথে সাথে সক্রিয় হয়েছে।",
                ];
            } else {
                $currentId = SiteSetting::read('site.meta_pixel_id', 'দেওয়া হয়নি');
                return [
                    'type' => 'text',
                    'text' => "ℹ️ **বর্তমান মেটা পিক্সেল আইডি:** `{$currentId}`\n\nনতুন পিক্সেল আইডি সেট করতে লিখুন: *'মেটা পিক্সেল আইডি 1586781472722788 সেট করো'*।",
                ];
            }
        }

        // 4. Update WhatsApp / Phone Number
        if (str_contains($clean, 'whatsapp') || str_contains($clean, 'হোয়াটসঅ্যাপ') || str_contains($clean, 'ফোন') || str_contains($clean, 'phone')) {
            if (preg_match('/(?:\+?88)?(01[3-9]\d{8})/', $raw, $m)) {
                $phone = $m[1];
                $contact = Contact::first() ?: new Contact();
                $contact->whatsapp = $phone;
                $contact->phone = $phone;
                $contact->save();

                return [
                    'type' => 'text',
                    'text' => "✅ **হোয়াটসঅ্যাপ ও কন্টাক্ট নম্বর সফলভাবে আপডেট করা হয়েছে!**\n\nনতুন নম্বর: `{$phone}`",
                ];
            }
        }

        // 5. Create Landing Page Draft
        if (str_contains($clean, 'ল্যান্ডিং পেজ') || str_contains($clean, 'landing page')) {
            // Extract title
            $title = preg_replace('/^(?:নতুন\s+)?(?:ল্যান্ডিং\s+পেজ\s+|landing\s+page\s+)(?:তৈরি\s+করো|বানাও|create)?/iu', '', $raw);
            $title = trim(str_replace(['বানাও', 'তৈরি করো', 'create', 'make', 'add'], '', $title)) ?: 'New Promotional Offer';

            $slug = Str::slug($title) . '-' . Str::random(4);
            $landing = LandingPage::create([
                'created_by' => $user->id ?? 1,
                'title' => $title,
                'slug' => $slug,
                'status' => LandingPage::STATUS_DRAFT,
                'content_json' => [
                    'sections' => [
                        [
                            'id' => 'hero-' . Str::random(6),
                            'type' => 'hero',
                            'headline' => $title,
                            'subheadline' => 'সীমিত সময়ের বিশেষ অফার! আকর্ষণীয় মূল্যে সেরা পণ্য সংগ্রহ করুন।',
                        ],
                        [
                            'id' => 'order-' . Str::random(6),
                            'type' => 'order_form',
                            'button_text' => 'অর্ডার কনফার্ম করুন',
                        ]
                    ]
                ],
            ]);

            return [
                'type' => 'action_result',
                'text' => "🚀 **'{$title}' ল্যান্ডিং পেজ ড্রাফট তৈরি হয়েছে!**\n\nআপনি ক্যানভাস বিল্ডারে গিয়ে ছবি ও সেকশন কাস্টমাইজ করতে পারেন।",
                'action' => [
                    'label' => 'ল্যান্ডিং পেজ বিল্ডারে যান',
                    'url' => "/admin/landing-pages/{$landing->id}/builder",
                ],
            ];
        }

        // 6. Conversational AI for Admin via Gemini
        $systemPrompt = "You are an intelligent, capable AI Admin Operations Copilot for an e-commerce platform in Bangladesh. " .
            "You assist the store owner with marketing copy, product descriptions, pricing strategy, order analytics, and general management. " .
            "Respond concisely and professionally in natural Bengali or English. Suggest practical next steps.";

        $aiReply = $this->callGemini($raw, $systemPrompt, $history);
        if ($aiReply) {
            return [
                'type' => 'text',
                'text' => $aiReply,
                'quick_replies' => ['আজকের সেল রিপোর্ট দাও', 'নতুন ল্যান্ডিং পেজ বানাও', 'পিক্সেল চেক করো'],
            ];
        }

        // 7. Admin Smart Fallback
        return [
            'type' => 'text',
            'text' => "👋 হ্যালো অ্যাডমিন! আমি আপনার **AI Operations Assistant**। আপনি আমাকে দিয়ে নিচের কাজগুলো দ্রুত করাতে পারেন:\n\n" .
                "• **রিপোর্ট দেখতে:** *'আজকের সেল ও অর্ডার রিপোর্ট দাও'*\n" .
                "• **প্রোডাক্ট যোগ করতে:** *'একটি কালো টি-শার্ট যোগ করো, দাম ৫০০ টাকা, স্টক ৫০'*\n" .
                "• **ল্যান্ডিং পেজ বানাতে:** *'স্মার্ট ওয়াচ ল্যান্ডিং পেজ বানাও'*\n" .
                "• **পিক্সেল / সেটিংস আপডেট করতে:** *'মেটা পিক্সেল আইডি 1586781472722788 সেট করো'*",
            'quick_replies' => [
                '📊 আজকের সেল রিপোর্ট',
                '📦 নতুন প্রোডাক্ট যোগ',
                '🚀 ল্যান্ডিং পেজ তৈরি',
                '⚙️ মেটা পিক্সেল চেক',
            ],
        ];
    }

    /**
     * Search products by keyword in name or description.
     */
    protected function searchProducts(string $keyword)
    {
        $clean = mb_strtolower(trim($keyword));

        // Stopwords to ignore
        $stopWords = [
            'সেরা', 'প্রোডাক্টগুলো', 'প্রোডাক্ট', 'পণ্য', 'দেখাও', 'চাই', 'আছে', 'কি', 'গুলো', 'দেখান',
            'আমাকে', 'একটি', 'কিছু', 'দাম', 'কত', 'show', 'products', 'product', 'best', 'the', 'and', 'for', 'item', 'items'
        ];

        $rawWords = preg_split('/[\s,\.\?!]+/u', $clean, -1, PREG_SPLIT_NO_EMPTY);
        $searchTerms = array_values(array_filter($rawWords, function ($w) use ($stopWords) {
            return mb_strlen($w) >= 2 && !in_array($w, $stopWords);
        }));

        // If no specific keyword left, but user asked for products/best items, return top latest products
        if (empty($searchTerms)) {
            $isProductIntent = str_contains($clean, 'প্রোডাক্ট') || str_contains($clean, 'পণ্য') || str_contains($clean, 'সেরা') || str_contains($clean, 'কালেকশন') || str_contains($clean, 'product') || str_contains($clean, 'show') || str_contains($clean, 'দেখাও');
            if ($isProductIntent) {
                return Product::where('stock', '>', 0)->latest()->take(4)->get();
            }
            return collect();
        }

        $query = Product::query();
        $query->where(function ($q) use ($searchTerms) {
            foreach ($searchTerms as $term) {
                $q->orWhere('name', 'like', "%{$term}%")
                  ->orWhere('description', 'like', "%{$term}%");
            }
        });

        $results = $query->where('stock', '>', 0)->latest()->take(4)->get();

        // If specific search had no results, fallback to latest products if product intent was present
        if ($results->isEmpty() && (str_contains($clean, 'প্রোডাক্ট') || str_contains($clean, 'আছে') || str_contains($clean, 'চাই'))) {
            return Product::where('stock', '>', 0)->latest()->take(4)->get();
        }

        return $results;
    }

    /**
     * Look up orders for a customer phone number.
     */
    protected function lookupCustomerOrders(string $phone): array
    {
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($cleanPhone) > 11) {
            $cleanPhone = substr($cleanPhone, -11);
        }

        $orders = Order::where('phone', 'like', "%{$cleanPhone}%")
            ->with('items.product')
            ->latest()
            ->take(3)
            ->get();

        if ($orders->isEmpty()) {
            return [
                'type' => 'text',
                'text' => "🔍 নম্বর: **{$cleanPhone}** দিয়ে কোনো অর্ডার খুঁজে পাওয়া যায়নি।\n\nঅনুগ্রহ করে অর্ডার করার সময় যে মোবাইল নম্বরটি ব্যবহার করেছিলেন সেটি পুনরায় চেক করে দিন বা আমাদের হেল্পলাইনে যোগাযোগ করুন।",
                'quick_replies' => ['হোয়াটসঅ্যাপে যোগাযোগ', 'প্রোডাক্ট দেখতে চাই'],
            ];
        }

        $orderCards = $orders->map(function ($order) {
            $statusMap = [
                'pending' => 'অপেক্ষমাণ (Pending)',
                'processing' => 'প্রসেসিং হচ্ছে (Processing)',
                'shipped' => 'ডেলিভারির জন্য পাঠানো হয়েছে (Shipped)',
                'delivered' => 'সফলভাবে ডেলিভারি হয়েছে (Delivered)',
                'cancelled' => 'বাতিল করা হয়েছে (Cancelled)',
            ];
            $statusBangla = $statusMap[$order->order_status] ?? ucfirst($order->order_status);

            $itemList = $order->items->map(function ($it) {
                $name = $it->product?->name ?: 'Product Item';
                $var = [];
                if ($it->color) $var[] = $it->color;
                if ($it->size) $var[] = $it->size;
                $varStr = !empty($var) ? ' (' . implode(', ', $var) . ')' : '';
                return "• {$name}{$varStr} x {$it->quantity}";
            })->implode("\n");

            return [
                'id' => $order->id,
                'status' => $statusBangla,
                'raw_status' => $order->order_status,
                'date' => $order->created_at->format('d M, Y h:i A'),
                'total' => (float) $order->grand_total,
                'courier_name' => $order->courier_name,
                'tracking_code' => $order->courier_tracking_code,
                'items_summary' => $itemList,
            ];
        });

        return [
            'type' => 'order_tracking',
            'text' => "🎉 আপনার নম্বরে **{$orders->count()}টি অর্ডার** পাওয়া গেছে:",
            'orders' => $orderCards,
            'quick_replies' => ['অন্য নম্বর ট্র্যাক করুন', 'হোয়াটসঅ্যাপে যোগাযোগ'],
        ];
    }

    /**
     * Parse natural language command to create a product.
     */
    protected function parseAndCreateProduct(string $raw): ?Product
    {
        // Normalize Bengali numerals to English digits
        $bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        $en = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        $normalized = str_replace($bn, $en, $raw);

        // Extract Price (e.g. দাম ৫০০ বা 500 tk বা price: 500)
        $price = 0;
        if (preg_match('/(?:দাম|price|tk|টাকা)[:\s]*(\d+)/iu', $normalized, $m)) {
            $price = (float) $m[1];
        } elseif (preg_match('/\b(\d{2,6})\s*(?:টাকা|tk)\b/iu', $normalized, $m)) {
            $price = (float) $m[1];
        }

        // Extract Stock (e.g. স্টক ৫০ বা stock 50)
        $stock = 20;
        if (preg_match('/(?:স্টক|stock)[:\s]*(\d+)/iu', $normalized, $m)) {
            $stock = (int) $m[1];
        }

        // Extract Colors (e.g. কালার: Red, Black or লাল, কালো)
        $colors = [];
        $colorPresets = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Ash', 'কালো', 'সাদা', 'লাল', 'নীল', 'সবুজ'];
        foreach ($colorPresets as $cp) {
            if (mb_stripos($raw, $cp) !== false) {
                $colors[] = $cp;
            }
        }

        // Extract Sizes (e.g. M, L, XL)
        $sizes = [];
        $sizePresets = ['S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];
        foreach ($sizePresets as $sp) {
            if (preg_match('/\b' . preg_quote($sp, '/') . '\b/i', $raw)) {
                $sizes[] = strtoupper($sp);
            }
        }

        // Extract product name
        // Remove trigger words and details
        $clean = preg_replace('/^(?:একটি|একটা)?\s*(?:নতুন\s+)?(?:প্রোডাক্ট|পণ্য|product)?\s*(?:যোগ\s+করো|অ্যাড\s+করো|বানাও|add)?/iu', '', $raw);
        $clean = preg_replace('/(?:দাম|price|স্টক|stock|tk|টাকা|কালার|সাইজ).*/iu', '', $clean);
        $clean = str_replace(['যোগ করো', 'অ্যাড করো', 'add', 'create'], '', $clean);
        $name = trim(preg_replace('/^[\s,\.।\-]+|[\s,\.।\-]+$/u', '', $clean)) ?: 'New Product';

        // Default category
        $category = Category::first();
        $categoryId = $category ? $category->id : 1;

        $slug = Str::slug($name) . '-' . Str::random(4);

        $product = Product::create([
            'name' => $name,
            'slug' => $slug,
            'category_id' => $categoryId,
            'price' => $price > 0 ? $price : 500,
            'stock' => $stock,
            'colors' => !empty($colors) ? array_unique($colors) : null,
            'sizes' => !empty($sizes) ? array_unique($sizes) : null,
            'description' => "<p>{$name} - সেরা মানের আকর্ষণীয় পণ্য। এখনই অর্ডার করুন।</p>",
            'quick_view' => "<p>{$name} - সেরা কোয়ালিটি এবং দ্রুত ডেলিভারি।</p>",
            'short_description' => $name,
            'bussiness_class' => 'normal',
            'discount' => 0,
            'initial_rating' => 4.8,
        ]);

        return $product;
    }
}
