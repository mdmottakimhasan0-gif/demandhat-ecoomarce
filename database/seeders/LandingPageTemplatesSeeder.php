<?php

namespace Database\Seeders;

use App\Landing\Builder\ContentNormalizer;
use App\Models\LandingPageTemplate;
use Illuminate\Database\Seeder;

/**
 * Optional starter templates: php artisan db:seed --class=LandingPageTemplatesSeeder
 * Idempotent: templates are matched by name, so re-running never duplicates them.
 */
class LandingPageTemplatesSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->templates() as $tpl) {
            LandingPageTemplate::updateOrCreate(
                ['name' => $tpl['name']],
                [
                    'description' => $tpl['description'],
                    'category' => $tpl['category'],
                    'is_public' => true,
                    'content_json' => ['version' => 1, 'sections' => $tpl['sections']],
                    'settings_json' => ['layout' => 'blank', 'font_family' => $tpl['font'] ?? 'Inter', 'custom_css' => $tpl['custom_css'] ?? ''],
                    // Empty title: pages created from a template use their own title unless SEO is customised.
                    'seo_json' => ['title' => '', 'description' => $tpl['description'], 'robots' => 'index,follow'],
                ]
            );
        }
    }

    // ---- tiny builder DSL -----------------------------------------------------

    private function n(string $type, array $content = [], array $settings = [], array $children = []): array
    {
        return ['id' => ContentNormalizer::newId($type), 'type' => $type, 'content' => $content, 'settings' => $settings, 'children' => $children];
    }

    private function pad(string $v, string $h = '20px'): array
    {
        return ['desktop' => ['top' => $v, 'right' => $h, 'bottom' => $v, 'left' => $h], 'tablet' => ['top' => '56px', 'right' => $h, 'bottom' => '56px', 'left' => $h], 'mobile' => ['top' => '40px', 'right' => '16px', 'bottom' => '40px', 'left' => '16px']];
    }

    private function section(array $children, array $settings = [], array $content = []): array
    {
        return $this->n('section', $content + ['content_width' => 'boxed'], $settings + ['padding' => $this->pad('80px')], [$this->n('container', [], ['gap' => '20px'], $children)]);
    }

    private function h(string $text, string $tag = 'h2', array $settings = []): array
    {
        $size = $tag === 'h1' ? ['desktop' => '56px', 'tablet' => '42px', 'mobile' => '32px'] : ['desktop' => '38px', 'tablet' => '32px', 'mobile' => '26px'];

        return $this->n('heading', ['text' => $text, 'tag' => $tag], $settings + ['font_size' => $size, 'font_weight' => '800', 'line_height' => '1.15']);
    }

    private function p(string $text, array $settings = []): array
    {
        return $this->n('text', ['html' => '<p>'.$text.'</p>'], $settings + ['font_size' => ['desktop' => '18px', 'mobile' => '16px'], 'line_height' => '1.7']);
    }

    private function btn(string $text, string $url = '#form', array $settings = [], array $content = []): array
    {
        return $this->n('button', $content + ['text' => $text, 'url' => $url, 'size' => 'lg', 'event_enabled' => true, 'event_name' => 'Lead', 'event_browser' => true, 'event_server' => true],
            $settings + ['background_type' => 'color', 'background_color' => '#2563eb', 'hover_background' => '#1d4ed8', 'color' => '#ffffff', 'border_radius' => '10px', 'font_weight' => '700']);
    }

    private function cols(string $layout, array $columns, array $settings = [], string $mobileLayout = '1'): array
    {
        return $this->n('columns', ['layout' => $layout, 'tablet_layout' => '1', 'mobile_layout' => $mobileLayout], $settings + ['grid_gap' => '32px', 'gap' => ['desktop' => '40px', 'mobile' => '24px'], 'align_items' => 'center'],
            array_map(fn ($c) => $this->n('column', [], ['gap' => '18px'], $c), $columns));
    }

    private function form(string $title, array $fields, string $button, array $settings = []): array
    {
        return $this->n('form', [
            'fields' => $fields, 'submit_text' => $button, 'success_message' => 'Thank you! We will contact you soon.',
            'save_lead' => true, 'event_enabled' => true, 'event_name' => 'Lead', 'event_browser' => true, 'event_server' => true,
        ], $settings + [
            'background_type' => 'color', 'background_color' => '#ffffff', 'color' => '#111827', 'border_radius' => '18px', 'box_shadow' => 'lg',
            'padding' => ['desktop' => ['top' => '32px', 'right' => '32px', 'bottom' => '32px', 'left' => '32px'], 'mobile' => ['top' => '22px', 'right' => '20px', 'bottom' => '22px', 'left' => '20px']],
            'max_width' => '460px', 'css_id' => 'form', // target of the #form buttons
        ]);
    }

    private function f(string $type, string $label, string $name, bool $required = true, string $ph = '', string $options = ''): array
    {
        return ['type' => $type, 'label' => $label, 'name' => $name, 'placeholder' => $ph, 'required' => $required, 'default' => '', 'options' => $options];
    }

    private function box(string $icon, string $title, string $text, array $settings = []): array
    {
        return $this->n('icon_box', ['icon' => $icon, 'title' => $title, 'description' => $text, 'tag' => 'h3'], $settings + [
            'align' => 'left', 'icon_color' => '#2563eb', 'icon_size' => '36px', 'background_type' => 'color', 'background_color' => '#f8fafc', 'border_radius' => '14px',
            'padding' => ['desktop' => ['top' => '28px', 'right' => '26px', 'bottom' => '28px', 'left' => '26px']],
        ]);
    }

    private function dark(): array
    {
        return ['background_type' => 'gradient', 'gradient_from' => '#0f172a', 'gradient_to' => '#1e3a8a', 'gradient_angle' => 135, 'color' => '#ffffff'];
    }

    // ---- templates ------------------------------------------------------------

    private function templates(): array
    {
        return [
            $this->leadGen(), $this->productOffer(), $this->consultation(), $this->agency(), $this->comingSoon(),
            $this->electronics(), $this->books(), $this->ecommerce(), $this->woodenCraft(), $this->productCheckout(),
        ];
    }

    /** One-page checkout. Products are chosen per landing in the builder (Order Form > Products). */
    private function orderForm(string $mode = 'single', array $settings = [], array $content = []): array
    {
        return $this->n('order_form', $content + [
            'items' => [], 'mode' => $mode, 'allow_qty' => true, 'block_active_orders' => true,
            'heading_details' => 'Delivery details', 'heading_order' => 'Your order',
            'submit_text' => 'Confirm Order', 'currency_symbol' => '৳',
            'success_message' => 'Thank you! Your order #{order} has been placed. We will call you shortly to confirm it.',
            'event_enabled' => true, 'event_name' => 'Purchase', 'event_browser' => true, 'event_server' => true,
        ], $settings + [
            'background_type' => 'color', 'background_color' => '#ffffff', 'color' => '#111827', 'border_radius' => '18px',
            'box_shadow' => 'lg', 'accent' => '#16a34a', 'max_width' => '980px',
            'padding' => ['desktop' => ['top' => '32px', 'right' => '32px', 'bottom' => '32px', 'left' => '32px'], 'mobile' => ['top' => '18px', 'right' => '16px', 'bottom' => '18px', 'left' => '16px']],
            'css_id' => 'order',
        ]);
    }

    /** Slim top bar. */
    private function topBar(string $text, string $bg = '#111827'): array
    {
        return $this->n('section', ['content_width' => 'boxed'], ['background_type' => 'color', 'background_color' => $bg, 'color' => '#ffffff', 'padding' => $this->pad('10px')], [
            $this->n('container', [], [], [$this->n('text', ['html' => '<p><strong>'.$text.'</strong></p>'], ['align' => 'center', 'font_size' => '14px', 'color' => '#ffffff'])]),
        ]);
    }

    private function photo(string $alt, string $max = '480px'): array
    {
        return $this->n('image', ['image' => '', 'alt' => $alt], ['align' => 'center', 'img_max_width' => $max, 'border_radius' => '16px']);
    }

    /** Four "why buy from us" trust tiles. */
    private function trustRow(): array
    {
        $tile = fn ($icon, $title, $text) => $this->box($icon, $title, $text, ['align' => 'center', 'background_color' => '#ffffff', 'box_shadow' => 'sm']);

        return $this->cols('25-25-25-25', [
            [$tile('truck', 'Fast delivery', 'Delivered to your door all over Bangladesh.')],
            [$tile('shield', 'Warranty', 'Genuine product with after-sales support.')],
            [$tile('dollar', 'Cash on delivery', 'Check the product first, pay when you receive it.')],
            [$tile('award', '100% original', 'Sourced directly. No fakes, no compromise.')],
        ], ['align_items' => 'stretch']);
    }

    private function reviews(string $title = 'What our customers say'): array
    {
        return $this->section([
            $this->h($title, 'h2', ['align' => 'center']),
            $this->cols('33-33-33', [
                [$this->n('testimonial', ['quote' => 'Exactly as described and delivered in two days. Very happy with it.', 'name' => 'Rafiq Ahmed', 'role' => 'Dhaka', 'rating' => 5])],
                [$this->n('testimonial', ['quote' => 'Great quality for the price. Packaging was perfect and support was helpful.', 'name' => 'Nusrat Jahan', 'role' => 'Chattogram', 'rating' => 5])],
                [$this->n('testimonial', ['quote' => 'I was unsure about ordering online, but cash on delivery made it easy. Recommended!', 'name' => 'Imran Hossain', 'role' => 'Sylhet', 'rating' => 5])],
            ], ['align_items' => 'stretch']),
        ], ['background_type' => 'color', 'background_color' => '#f8fafc']);
    }

    private function floatingWhatsapp(): array
    {
        return $this->n('section', ['content_width' => 'boxed'], ['padding' => $this->pad('0px')], [
            $this->n('container', [], [], [
                $this->n('whatsapp', ['text' => 'Chat with us', 'number' => '', 'message' => 'Hi, I have a question about this product.', 'floating' => true, 'event_enabled' => true, 'event_name' => 'Contact', 'event_browser' => true, 'event_server' => true],
                    ['background_type' => 'color', 'background_color' => '#25d366', 'color' => '#ffffff', 'border_radius' => '999px', 'font_weight' => '700']),
            ]),
        ]);
    }

    private function electronics(): array
    {
        $go = fn (string $t = 'Order Now - Cash on Delivery') => $this->btn($t, '#order', ['background_color' => '#f97316', 'hover_background' => '#ea580c'], ['event_name' => 'InitiateCheckout']);

        return [
            'name' => 'Electronics Product', 'category' => 'Product', 'font' => 'Inter',
            'description' => 'Sales page for a gadget or electronic item: hero, trust badges, features, specs, reviews, countdown offer and a built-in order form.',
            'sections' => [
                $this->topBar('Free delivery all over Bangladesh  |  Cash on delivery  |  Warranty included'),
                $this->section([
                    $this->cols('50-50', [
                        [
                            $this->n('text', ['html' => '<p><strong>NEW ARRIVAL - LIMITED STOCK</strong></p>'], ['color' => '#fb923c', 'font_size' => '14px', 'letter_spacing' => '2px']),
                            $this->h('Powerful Performance. All-Day Battery.', 'h1', ['color' => '#ffffff']),
                            $this->p('Describe your product in one clear sentence: what it does and why it beats the alternatives.', ['color' => '#cbd5e1']),
                            $this->n('feature_list', ['items' => [['icon' => 'check-circle', 'text' => 'Up to 40 hours battery life'], ['icon' => 'check-circle', 'text' => '1 year official warranty'], ['icon' => 'check-circle', 'text' => 'Free delivery + cash on delivery']]], ['color' => '#ffffff', 'icon_color' => '#4ade80', 'font_size' => '18px', 'grid_gap' => '12px']),
                            $this->n('container', [], ['flex_direction' => 'row', 'flex_wrap' => 'wrap', 'gap' => '12px'], [
                                $go(),
                                $this->n('call', ['text' => 'Call to order', 'number' => '', 'event_enabled' => true, 'event_name' => 'Contact', 'event_browser' => true, 'event_server' => true], ['background_type' => 'color', 'background_color' => '#ffffff', 'color' => '#0f172a', 'border_radius' => '10px', 'font_weight' => '700']),
                            ]),
                        ],
                        [$this->photo('Product photo on a clean background', '520px')],
                    ]),
                ], $this->dark() + ['gradient_to' => '#1e293b', 'padding' => $this->pad('80px')]),
                $this->section([$this->trustRow()], ['background_type' => 'color', 'background_color' => '#f1f5f9', 'padding' => $this->pad('48px')]),
                $this->section([
                    $this->h('Why you will love it', 'h2', ['align' => 'center']),
                    $this->cols('33-33-33', [
                        [$this->box('zap', 'Fast charging', 'Full charge in under 90 minutes.')],
                        [$this->box('shield', 'Built to last', 'Durable materials tested for daily use.')],
                        [$this->box('star', 'Premium quality', 'Crisp performance you can feel from day one.')],
                    ], ['align_items' => 'stretch']),
                    $this->cols('33-33-33', [
                        [$this->box('settings', 'Easy setup', 'Works out of the box. No complicated steps.')],
                        [$this->box('globe', 'Works with everything', 'Compatible with phones, laptops and tablets.')],
                        [$this->box('heart', 'Comfortable to use', 'Lightweight design for all-day comfort.')],
                    ], ['align_items' => 'stretch']),
                ]),
                $this->section([
                    $this->cols('50-50', [
                        [$this->h('Technical specifications', 'h2'), $this->n('feature_list', ['items' => [['icon' => 'check', 'text' => 'Model: replace with your model'], ['icon' => 'check', 'text' => 'Battery: 40 hours'], ['icon' => 'check', 'text' => 'Connectivity: Bluetooth 5.3'], ['icon' => 'check', 'text' => 'Warranty: 12 months'], ['icon' => 'check', 'text' => 'In the box: charger, cable, manual']]], ['font_size' => '17px', 'grid_gap' => '12px'])],
                        [$this->n('video', ['source' => 'youtube', 'url' => ''])],
                    ]),
                ], ['background_type' => 'color', 'background_color' => '#f8fafc']),
                $this->reviews(),
                $this->section([
                    $this->n('countdown', ['target' => date('Y-m-d\TH:i', strtotime('+7 days')), 'expired_text' => 'This offer has ended.'], ['align' => 'center', 'font_size' => '40px', 'color' => '#ffffff']),
                    $this->h('Special price ends soon - order today', 'h2', ['align' => 'center', 'color' => '#ffffff']),
                    $this->orderForm('single', ['css_id' => 'order']),
                ], ['background_type' => 'gradient', 'gradient_from' => '#ea580c', 'gradient_to' => '#9a3412', 'gradient_angle' => 135, 'color' => '#ffffff', 'padding' => $this->pad('80px')]),
                $this->section([
                    $this->h('Frequently asked questions', 'h2', ['align' => 'center']),
                    $this->n('faq', ['items' => [
                        ['question' => 'How long does delivery take?', 'answer' => 'Inside Dhaka 1-2 days, outside Dhaka 3-5 days.'],
                        ['question' => 'Is there a warranty?', 'answer' => 'Yes. Every product comes with a warranty; keep your order number as proof.'],
                        ['question' => 'Can I pay after receiving the product?', 'answer' => 'Yes. We offer cash on delivery all over Bangladesh.'],
                        ['question' => 'Can I return it if I do not like it?', 'answer' => 'Yes, within 7 days if the product is unused and in its original packaging.'],
                    ], 'first_open' => true], ['max_width' => '760px', 'margin' => ['desktop' => ['left' => 'auto', 'right' => 'auto']]]),
                ]),
                $this->floatingWhatsapp(),
            ],
        ];
    }

    /** Bengali sales page for a wooden handicraft / home-decor product, with a built-in order form. */
    private function woodenCraft(): array
    {
        $go = fn (string $t = 'অর্ডার করুন - ক্যাশ অন ডেলিভারি') => $this->btn($t, '#order', ['background_color' => '#c93b16', 'hover_background' => '#ad2b09'], ['event_name' => 'InitiateCheckout']);
        // Icon-box style: still one line of 4 on mobile, but sized closer to the desktop look
        // (icon_size, padding and font_size all accept responsive desktop/mobile values).
        $tile = fn ($icon, $title, $text) => $this->box($icon, $title, $text, [
            'align' => 'center', 'background_color' => '#ffffff', 'box_shadow' => 'sm',
            'icon_size' => ['desktop' => '32px', 'mobile' => '24px'],
            'font_size' => ['desktop' => '15px', 'mobile' => '11px'],
            'padding' => ['desktop' => ['top' => '28px', 'right' => '26px', 'bottom' => '28px', 'left' => '26px'], 'mobile' => ['top' => '14px', 'right' => '8px', 'bottom' => '14px', 'left' => '8px']],
        ]);

        return [
            'name' => 'Wooden Craft Product (Bangla)', 'category' => 'Product', 'font' => 'Hind Siliguri',
            'description' => 'কাঠের হস্তশিল্প বা হোম ডেকোর পণ্যের বাংলা সেলস পেজ - হিরো, ট্রাস্ট ব্যাজ, ফিচার, স্পেসিফিকেশন, ছবি, রিভিউ, কাউন্টডাউন অফার এবং বিল্ট-ইন অর্ডার ফর্ম।',
            'sections' => [
                $this->topBar('সারাদেশে ফ্রি হোম ডেলিভারি  |  ক্যাশ অন ডেলিভারি  |  ১০০% অরিজিনাল প্রোডাক্ট', '#3a1e12'),
                $this->section([
                    $this->cols('50-50', [
                        [
                            $this->n('text', ['html' => '<p><strong>ধামাকা অফার - স্টক সীমিত</strong></p>'], ['color' => '#d97706', 'font_size' => '14px', 'letter_spacing' => '2px']),
                            $this->h('প্রিমিয়াম কোয়ালিটি মেহেগুনি কাঠের চুড়ির আলনা', 'h1', ['color' => '#3a1e12']),
                            $this->p('ড্রেসিং টেবিলে ছড়িয়ে-ছিটিয়ে থাকা চুড়ি ও গয়নাকে দিন একটি রাজকীয়, পরিপাটি জায়গা।', ['color' => '#4b5563']),
                            $this->n('text', ['html' => '<p><strong style="font-size:2rem;color:#c93b16">৳৯৫০</strong> <s style="color:#9ca3af">৳১,৩৯০</s></p>'], []),
                            $this->n('feature_list', ['items' => [
                                ['icon' => 'shield', 'text' => '১০০% খাঁটি মেহেগুনি কাঠ'],
                                ['icon' => 'check-circle', 'text' => '৫ লেয়ার ধারণক্ষমতা'],
                                ['icon' => 'truck', 'text' => 'সারাদেশে ফ্রি ডেলিভারি'],
                            ]], ['color' => '#3a1e12', 'icon_color' => '#15803d', 'font_size' => '18px', 'grid_gap' => '12px']),
                            $this->n('container', [], ['flex_direction' => 'row', 'flex_wrap' => 'wrap', 'gap' => '12px'], [
                                $go(),
                                $this->n('call', ['text' => 'কল করুন', 'number' => '', 'event_enabled' => true, 'event_name' => 'Contact', 'event_browser' => true, 'event_server' => true], ['background_type' => 'color', 'background_color' => '#ffffff', 'color' => '#3a1e12', 'border_radius' => '10px', 'font_weight' => '700']),
                            ]),
                        ],
                        [$this->photo('প্রোডাক্টের ছবি', '480px')],
                    ]),
                ], ['background_type' => 'color', 'background_color' => '#fbf7f4', 'padding' => $this->pad('80px')]),
                $this->section([
                    $this->cols('25-25-25-25', [
                        [$tile('dollar', 'ক্যাশ অন ডেলিভারি', 'পণ্য দেখে টাকা দিন।')],
                        [$tile('clock', 'সহজ রিটার্ন', '২৪ ঘণ্টায় রিটার্ন বা এক্সচেঞ্জ।')],
                        [$tile('shield', 'মানের গ্যারান্টি', '১০০% খাঁটি উপকরণ।')],
                        [$tile('truck', 'ফ্রি ডেলিভারি', 'সারাদেশে ডেলিভারি চার্জ ফ্রি।')],
                    ], ['align_items' => 'stretch', 'gap' => ['desktop' => '24px', 'mobile' => '6px']], '4'),
                ], ['background_type' => 'color', 'background_color' => '#f1f5f9', 'padding' => $this->pad('48px')]),
                $this->section([
                    $this->h('কেন এই প্রোডাক্টটি বেছে নেবেন?', 'h2', ['align' => 'center']),
                    $this->cols('33-33-33', [
                        [$tile('award', 'উচ্চমানের কাঠ', 'দক্ষ কারিগরের হাতে তৈরি, বছরের পর বছর টিকে থাকে।')],
                        [$tile('star', 'নিখুঁত ফিনিশিং', 'স্মুথ হ্যান্ড-পলিশ এবং আকর্ষণীয় ডিজাইন।')],
                        [$tile('heart', 'আরামদায়ক ব্যবহার', 'হালকা ওজন, ব্যবহার করা সহজ ও টেকসই।')],
                    ], ['align_items' => 'stretch', 'gap' => ['desktop' => '24px', 'mobile' => '8px']], '3'),
                ]),
                $this->section([
                    $this->cols('50-50', [
                        [
                            $this->h('স্পেসিফিকেশন', 'h2'),
                            $this->n('feature_list', ['items' => [
                                ['icon' => 'check', 'text' => 'ম্যাটেরিয়াল: মেহেগুনি কাঠ'],
                                ['icon' => 'check', 'text' => 'লেয়ার সংখ্যা: ৫'],
                                ['icon' => 'check', 'text' => 'ফিনিশ: হ্যান্ড-পলিশড'],
                                ['icon' => 'check', 'text' => 'ওজন: হালকা ও টেকসই'],
                                ['icon' => 'check', 'text' => 'বক্সে থাকছে: ১ পিস আলনা'],
                            ]], ['font_size' => '17px', 'grid_gap' => '12px']),
                        ],
                        [$this->photo('স্পেসিফিকেশন ছবি', '420px')],
                    ]),
                ], ['background_type' => 'color', 'background_color' => '#fbf7f4']),
                $this->section([
                    $this->h('বিভিন্ন অ্যাঙ্গেল থেকে দেখুন', 'h2', ['align' => 'center']),
                    $this->n('gallery', ['images' => [['image' => '', 'alt' => 'ছবি ১'], ['image' => '', 'alt' => 'ছবি ২'], ['image' => '', 'alt' => 'ছবি ৩'], ['image' => '', 'alt' => 'ছবি ৪']]], ['columns' => ['desktop' => 4, 'tablet' => 2, 'mobile' => 2], 'grid_gap' => '16px', 'border_radius' => '10px']),
                ]),
                $this->section([
                    $this->h('আমাদের ক্রেতারা যা বলছেন', 'h2', ['align' => 'center']),
                    $this->n('testimonial_slider', [
                        'items' => [
                            ['quote' => 'পণ্যের মান অসাধারণ, ডেলিভারিও দ্রুত পেয়েছি। খুবই সন্তুষ্ট!', 'name' => 'রফিক আহমেদ', 'role' => 'ঢাকা', 'avatar' => '', 'rating' => 5],
                            ['quote' => 'দাম অনুযায়ী মানটা সত্যিই ভালো। প্যাকেজিং একদম পারফেক্ট ছিল।', 'name' => 'নুসরাত জাহান', 'role' => 'চট্টগ্রাম', 'avatar' => '', 'rating' => 5],
                            ['quote' => 'ক্যাশ অন ডেলিভারি থাকায় অর্ডার করা সহজ হয়েছে। রেকমেন্ডেড!', 'name' => 'ইমরান হোসেন', 'role' => 'সিলেট', 'avatar' => '', 'rating' => 5],
                        ],
                        'autoplay' => true, 'interval' => 5, 'arrows' => true, 'dots' => true, 'slides_desktop' => '3',
                    ], ['background_color' => '#ffffff', 'max_width' => '1040px']),
                ], ['background_type' => 'color', 'background_color' => '#f8fafc']),
                $this->section([
                    $this->n('countdown', ['target' => date('Y-m-d\TH:i', strtotime('+3 days')), 'expired_text' => 'অফারটি শেষ হয়ে গেছে।'], ['align' => 'center', 'font_size' => '40px', 'color' => '#ffffff']),
                    $this->h('বিশেষ অফার শেষ হওয়ার আগেই অর্ডার করুন', 'h2', ['align' => 'center', 'color' => '#ffffff']),
                    $this->p('নিচের ফর্মটি পূরণ করে অর্ডার কনফার্ম করুন - পণ্য হাতে পেয়ে টাকা দিন।', ['align' => 'center', 'color' => '#fce7db']),
                    $this->orderForm('single', ['accent' => '#c93b16', 'css_id' => 'order'], [
                        'submit_text' => 'অর্ডার কনফার্ম করুন', 'heading_details' => 'ডেলিভারি ঠিকানা', 'heading_order' => 'আপনার অর্ডার',
                        'payment_note' => 'ক্যাশ অন ডেলিভারি - পণ্য হাতে পেয়ে টাকা দিন।',
                    ]),
                ], ['background_type' => 'gradient', 'gradient_from' => '#3a1e12', 'gradient_to' => '#6d3922', 'gradient_angle' => 135, 'color' => '#ffffff', 'padding' => $this->pad('80px')]),
                $this->section([
                    $this->h('সচরাচর জিজ্ঞাসিত প্রশ্ন', 'h2', ['align' => 'center']),
                    $this->n('faq', ['items' => [
                        ['question' => 'ডেলিভারি পেতে কত দিন লাগে?', 'answer' => 'ঢাকার ভেতরে ১-২ দিন, ঢাকার বাইরে ৩-৫ দিন লাগে।'],
                        ['question' => 'আগে টাকা দিতে হবে কি?', 'answer' => 'না। আমরা ক্যাশ অন ডেলিভারি অফার করি - পণ্য হাতে পেয়ে টাকা দিন।'],
                        ['question' => 'পণ্য পছন্দ না হলে ফেরত দেওয়া যাবে?', 'answer' => 'হ্যাঁ, পণ্য অক্ষত ও অরিজিনাল প্যাকেজিং-এ থাকলে ৭ দিনের মধ্যে ফেরত দেওয়া যাবে।'],
                    ], 'first_open' => true], ['max_width' => '760px', 'margin' => ['desktop' => ['left' => 'auto', 'right' => 'auto']]]),
                ]),
                $this->floatingWhatsapp(),
            ],
        ];
    }

    /**
     * Bengali product page with a sticky two-column checkout layout (product info left,
     * order form right - sticky on desktop, collapsing to a bottom bar + stacked form on mobile).
     * Built to match a supplied design 1:1: same section order, card padding/margin and colours.
     */
    private function productCheckout(): array
    {
        $primary = '#FF5100';
        $primaryHover = '#E04600';
        $primaryLight = '#FFF0EB';
        $success = '#10B981';
        $textMain = '#0F172A';
        $textMuted = '#64748B';
        $border = '#E2E8F0';
        $pageBg = '#F8FAFC';

        // "White card": the repeating panel every left-column block sits in - 18px radius, 1px
        // border, small shadow, 14/16px padding - matches the source design's .white-card exactly.
        $card = fn (array $children, array $settings = []) => $this->n('container', [], $settings + [
            'background_type' => 'color', 'background_color' => '#ffffff', 'border_radius' => '18px',
            'border_width' => ['desktop' => ['top' => '1px', 'right' => '1px', 'bottom' => '1px', 'left' => '1px']],
            'border_style' => 'solid', 'border_color' => $border, 'box_shadow' => 'sm',
            'padding' => ['desktop' => ['top' => '14px', 'right' => '16px', 'bottom' => '14px', 'left' => '16px']],
            'gap' => '8px',
        ], $children);

        $pill = fn (string $text, string $bg, string $fg, string $borderColor) => $this->n('text', ['html' => '<p>'.$text.'</p>'], [
            'background_type' => 'color', 'background_color' => $bg, 'color' => $fg, 'border_radius' => '999px',
            'border_width' => ['desktop' => ['top' => '1px', 'right' => '1px', 'bottom' => '1px', 'left' => '1px']], 'border_style' => 'solid', 'border_color' => $borderColor,
            'padding' => ['desktop' => ['top' => '3px', 'right' => '10px', 'bottom' => '3px', 'left' => '10px']],
            'font_size' => '12px', 'font_weight' => '700', 'width' => 'fit-content', 'margin' => ['desktop' => ['top' => '0', 'bottom' => '0']],
        ]);

        // Compact icon tile for the 3-pillar spec row - shrinks cleanly to one line on mobile
        // via the same responsive icon_size/font_size/padding pattern used in the wooden template.
        $pillar = fn (string $icon, string $title, string $text) => $this->box($icon, $title, $text, [
            'align' => 'left', 'background_color' => $pageBg, 'box_shadow' => 'none', 'icon_color' => $primary,
            'icon_size' => ['desktop' => '24px', 'mobile' => '18px'],
            'font_size' => ['desktop' => '13px', 'mobile' => '10px'],
            'padding' => ['desktop' => ['top' => '10px', 'right' => '10px', 'bottom' => '10px', 'left' => '10px'], 'mobile' => ['top' => '8px', 'right' => '6px', 'bottom' => '8px', 'left' => '6px']],
            'border_radius' => '12px',
        ]);

        $priceLine = $this->n('text', ['html' => '<p><strong style="font-size:1.9rem;color:'.$primary.'">৳১,১২০</strong> <s style="color:#94A3B8">৳১,৯৫০</s> <strong style="color:#DC2626;font-size:12px">৪৩% ছাড়</strong></p>'], []);
        $go = fn (string $t = 'অর্ডার করতে এখানে ক্লিক করুন') => $this->btn($t, '#order', ['background_color' => $primary, 'hover_background' => $primaryHover, 'border_radius' => '12px'], ['event_name' => 'InitiateCheckout']);

        $left = [
            $card([
                $this->n('container', [], ['flex_direction' => 'row', 'flex_wrap' => 'wrap', 'justify_content' => 'space-between', 'align_items' => 'center', 'gap' => '8px'], [
                    $pill('⚡ অফার সীমিত সময়ের জন্য', $primaryLight, $primary, '#FED7AA'),
                    $pill('★★★★★ 4.9 (১,৪৫০+ রিভিউ)', '#FEF3C7', '#B45309', '#FDE68A'),
                ]),
                $this->h('সিলভার ক্রেস্ট স্টেইনলেস স্টিল ইলেকট্রিক মিনি গ্রাইন্ডার ৩৫০ ওয়াট', 'h1', ['font_size' => ['desktop' => '23px', 'mobile' => '19px'], 'color' => $textMain, 'line_height' => '1.35', 'font_weight' => '800']),
                $this->n('text', ['html' => '<p>মাত্র ১০-১৫ সেকেন্ডেই শুকনা ও ভেজা যেকোনো মসলা, চালের গুঁড়া বা কফি বিন্স মিহি গুঁড়ো করুন!</p>'], ['color' => $textMuted, 'font_size' => '13.5px']),
            ]),
            $card([
                $this->photo('সিলভার ক্রেস্ট ইলেকট্রিক মিনি গ্রাইন্ডার', '100%'),
                $this->n('gallery', ['images' => [['image' => '', 'alt' => 'স্টুডিও ছবি'], ['image' => '', 'alt' => 'ব্যবহারের ছবি']]], ['columns' => ['desktop' => 2, 'tablet' => 2, 'mobile' => 2], 'grid_gap' => '10px', 'border_radius' => '8px']),
            ], ['padding' => ['desktop' => ['top' => '0px', 'right' => '0px', 'bottom' => '10px', 'left' => '0px']], 'gap' => '10px']),
            $card([
                $this->n('container', [], ['flex_direction' => 'row', 'flex_wrap' => 'wrap', 'justify_content' => 'space-between', 'align_items' => 'center', 'gap' => '8px'], [
                    $priceLine,
                    $pill('● স্টক সীমিত — মাত্র ৭টি বাকি!', '#ECFDF5', '#047857', '#A7F3D0'),
                ]),
                $go(),
                $this->n('feature_list', ['items' => [
                    ['icon' => 'shield', 'text' => '১০০% অরিজিনাল কপার মোটর'],
                    ['icon' => 'check-circle', 'text' => 'পণ্য দেখে পেমেন্টের সুবিধা'],
                ]], ['font_size' => '12px', 'grid_gap' => '8px', 'icon_color' => $success]),
            ]),
            $card([
                $this->n('text', ['html' => '<p><strong>⚡ স্পেশাল অফার অ্যালার্ট</strong></p>'], ['color' => '#ffffff', 'font_size' => '11px', 'background_color' => 'rgba(0,0,0,.25)', 'border_radius' => '999px', 'padding' => ['desktop' => ['top' => '2px', 'right' => '10px', 'bottom' => '2px', 'left' => '10px']], 'width' => 'fit-content']),
                $this->h('অফার শেষ হওয়ার আগেই আপনার অর্ডার কনফার্ম করুন!', 'h3', ['color' => '#ffffff', 'font_size' => '17px', 'font_weight' => '800']),
                // "days" is off: a 1-hour offer would always show a useless "00 দিন" - hiding it
                // also leaves more room for the other three units to fit on one line on mobile.
                $this->n('countdown', ['target' => date('Y-m-d\TH:i', strtotime('+1 hour')), 'expired_text' => 'অফারটি শেষ হয়ে গেছে।', 'show_days' => false, 'label_hours' => 'ঘণ্টা', 'label_minutes' => 'মিনিট', 'label_seconds' => 'সেকেন্ড'], ['color' => '#ffffff', 'font_size' => ['desktop' => '21px', 'mobile' => '17px'], 'font_weight' => '800']),
            ], ['background_type' => 'gradient', 'gradient_from' => $primary, 'gradient_to' => '#E62A00', 'gradient_angle' => 135, 'border_width' => ['desktop' => ['top' => '0', 'right' => '0', 'bottom' => '0', 'left' => '0']]]),
            $card([
                $this->n('text', ['html' => '<p>কেন বেছে নেবেন?</p>'], ['color' => $primary, 'font_size' => '11.5px', 'font_weight' => '800', 'letter_spacing' => '.5px']),
                $this->h('মাত্র কয়েক সেকেন্ডে যেকোনো মসলা মিহি গুঁড়ো বা পেস্ট', 'h2', ['font_size' => '19px', 'color' => $textMain]),
                $this->n('text', ['html' => '<p>দৈনন্দিন রান্নার ঝামেলা কমাতে সিলভার ক্রেস্ট মিনি গ্রাইন্ডার আপনার কিচেনের সেরা সঙ্গী।</p>'], ['color' => $textMuted, 'font_size' => '13px']),
                $this->cols('50-50', [
                    [$this->n('feature_list', ['items' => [
                        ['icon' => 'check-circle', 'text' => '৩৫০ ওয়াট শক্তিশালী মোটর: মাত্র ১০-১৫ সেকেন্ডেই যেকোনো শক্ত মসলা মিহি গুঁড়ো হয়।'],
                        ['icon' => 'check-circle', 'text' => '৪-ব্লেড শার্প স্টিল ব্লেড: শুকনা মরিচ, হলুদ, জিরা, ধনিয়া ও গোলমরিচ নিখুঁতভাবে পিষে ফেলে।'],
                        ['icon' => 'check-circle', 'text' => 'ফুড-গ্রেড স্টিল বাটি: মরিচা প্রতিরোধী এবং খাদ্যের পুষ্টিগুণ অক্ষুণ্ণ রাখে।'],
                    ]], ['font_size' => '13px', 'grid_gap' => '8px', 'icon_color' => $success])],
                    [$this->n('feature_list', ['items' => [
                        ['icon' => 'check-circle', 'text' => 'শুকনা ও ভেজা গুঁড়ো: চালের গুঁড়া, কফি বিন্স, বাদাম ও কালোজিরাও গুঁড়ো করা যায়।'],
                        ['icon' => 'check-circle', 'text' => 'পুশ-বাটন সেফটি সুইচ: ঢাকনা চেপে ধরলেই চালু, হাত সরালেই বন্ধ।'],
                        ['icon' => 'check-circle', 'text' => 'সহজে ওয়াশ ফ্রেন্ডলি: সহজে পরিষ্কার ও কমপ্যাক্ট সাইজে যেকোনো জায়গায় ফিট হয়।'],
                    ]], ['font_size' => '13px', 'grid_gap' => '8px', 'icon_color' => $success])],
                ], ['gap' => ['desktop' => '10px', 'mobile' => '8px']], '2'),
            ]),
            $card([
                $this->n('text', ['html' => '<p>স্পেসিফিকেশন</p>'], ['color' => $primary, 'font_size' => '11.5px', 'font_weight' => '800', 'letter_spacing' => '.5px']),
                $this->h('ছোট সাইজ, শক্তিশালী পারফরম্যান্স', 'h3', ['font_size' => '17px', 'color' => $textMain]),
                $this->cols('33-33-33', [
                    [$pillar('zap', '৩৫০W মোটর', 'পিওর কপার হাই-স্পিড')],
                    [$pillar('target', '৪-লিফ ব্লেড', 'শার্প স্টেইনলেস স্টিল')],
                    [$pillar('shield', 'সেফটি লক', 'ওভারহিট প্রোটেকশন')],
                ], ['align_items' => 'stretch', 'gap' => ['desktop' => '8px', 'mobile' => '6px']], '3'),
                $this->n('feature_list', ['items' => [
                    ['icon' => 'check', 'text' => 'প্রোডাক্টের নাম: Silver Crest Electric Mini Grinder'],
                    ['icon' => 'check', 'text' => 'পাওয়ার ও ভোল্টেজ: ৩৫০ ওয়াট | ২২০V - ২৪০V, ৫০Hz'],
                    ['icon' => 'check', 'text' => 'বাটির ধারণক্ষমতা: ১৫০ - ২০০ গ্রাম'],
                    ['icon' => 'check', 'text' => 'ব্লেড ম্যাটেরিয়াল: ৪-পাখা ফুড-গ্রেড স্টেইনলেস স্টিল'],
                    ['icon' => 'check', 'text' => 'বডি ম্যাটেরিয়াল: ব্রাশড মেটালিক স্টেইনলেস স্টিল'],
                    ['icon' => 'check', 'text' => 'সুইচ কন্ট্রোল: স্মার্ট প্রেস-টু-স্টার্ট পুশ বাটন'],
                ]], ['font_size' => '13px', 'grid_gap' => '8px', 'icon_color' => $primary]),
            ]),
            $card([
                $this->n('text', ['html' => '<p>গ্রাহকদের মতামত</p>'], ['color' => $primary, 'font_size' => '11.5px', 'font_weight' => '800', 'letter_spacing' => '.5px']),
                $this->h('ক্রেতারা কী বলছেন?', 'h3', ['font_size' => '17px', 'color' => $textMain]),
                $this->n('text', ['html' => '<p><strong style="font-size:1.5rem">4.9</strong> ★★★★★ &nbsp;<span style="color:#64748B">১,৪৫০+ রেটিং</span></p>'], []),
                $this->n('testimonial_slider', [
                    'items' => [
                        ['quote' => 'প্রোডাক্টটা হাতে পেয়ে টেস্ট করলাম। শুকনো মরিচ আর গোলমরিচ একদম ১০ সেকেন্ডে পাউডার হয়ে গেছে! সাইজটা ছোট কিন্তু পাওয়ার অনেক বেশি।', 'name' => 'মাহমুদা বেগম', 'role' => 'মিরপুর, ঢাকা', 'avatar' => '', 'rating' => 5],
                        ['quote' => 'কফি বিন্স ও কালোজিরা গুঁড়ো করার জন্য নিয়েছিলাম। এক কথায় অসাধারণ। ক্যাশ অন ডেলিভারিতে চেক করে নিতে পেরেছি। ধন্যবাদ!', 'name' => 'তানভীর হাসান', 'role' => 'চট্টগ্রাম', 'avatar' => '', 'rating' => 5],
                    ],
                    'autoplay' => true, 'interval' => 5, 'arrows' => true, 'dots' => true, 'slides_desktop' => '2',
                ], ['background_color' => $pageBg, 'max_width' => '100%', 'padding' => ['desktop' => ['top' => '12px', 'right' => '40px', 'bottom' => '12px', 'left' => '40px'], 'mobile' => ['top' => '10px', 'right' => '30px', 'bottom' => '10px', 'left' => '30px']]]),
            ]),
        ];

        $right = [
            $this->orderForm('single', [
                'css_id' => 'order', 'accent' => $primary, 'button_background' => $primary,
                'border_width' => ['desktop' => ['top' => '2px', 'right' => '2px', 'bottom' => '2px', 'left' => '2px']], 'border_style' => 'solid', 'border_color' => $primary,
                'border_radius' => '24px', 'box_shadow' => 'lg', 'max_width' => '100%',
            ], [
                'heading_details' => 'ক্যাশ অন ডেলিভারিতে অর্ডার করুন', 'heading_order' => 'আপনার অর্ডার',
                'label_name' => 'আপনার নাম', 'label_phone' => 'মোবাইল নম্বর', 'label_address' => 'সম্পূর্ণ ঠিকানা',
                'label_area' => 'ডেলিভারি এরিয়া', 'label_inside' => 'ঢাকা সিটির ভিতরে', 'label_outside' => 'ঢাকা সিটির বাইরে',
                'payment_note' => 'পণ্য হাতে পেয়ে চেক করে পেমেন্ট করার নিশ্চয়তা।', 'submit_text' => 'অর্ডার কনফার্ম করুন',
                'success_message' => 'অভিনন্দন! আপনার অর্ডার #{order} সফল হয়েছে। আমরা শীঘ্রই কল করে যাচাই করব।',
            ]),
        ];

        // Custom-ratio columns (source uses 1.15fr / 0.85fr) with the exact gap/padding from the
        // source page-layout grid, and the right column sticky on desktop only.
        $mainGrid = $this->n('columns', ['layout' => 'custom', 'custom_layout' => '58-42', 'tablet_layout' => '1', 'mobile_layout' => '1'], [
            'gap' => ['desktop' => '24px', 'mobile' => '14px'], 'align_items' => 'flex-start',
        ], [
            $this->n('column', [], ['gap' => '12px'], $left),
            $this->n('column', [], ['gap' => '12px', 'css_id' => 'order-col'], $right),
        ]);

        $mainSection = $this->n('section', ['content_width' => 'boxed'], [
            'background_type' => 'color', 'background_color' => $pageBg,
            'padding' => ['desktop' => ['top' => '20px', 'right' => '12px', 'bottom' => '40px', 'left' => '12px'], 'mobile' => ['top' => '12px', 'right' => '12px', 'bottom' => '90px', 'left' => '12px']],
        ], [$this->n('container', [], ['gap' => '0'], [$mainGrid])]);

        // Mobile-only sticky bottom bar (hidden on tablet/desktop via the standard visibility
        // controls; fixed positioning for the <768px band comes from the page's own custom CSS).
        $mobileBar = $this->n('section', ['content_width' => 'full'], [
            'css_id' => 'mobile-cta-bar', 'hide_desktop' => true, 'hide_tablet' => true,
            'background_type' => 'color', 'background_color' => '#ffffff',
            'border_width' => ['desktop' => ['top' => '1px', 'right' => '0', 'bottom' => '0', 'left' => '0']], 'border_style' => 'solid', 'border_color' => $border,
            'padding' => ['desktop' => ['top' => '10px', 'right' => '14px', 'bottom' => '10px', 'left' => '14px']],
        ], [
            $this->n('container', [], ['flex_direction' => 'row', 'align_items' => 'center', 'justify_content' => 'space-between', 'gap' => '12px'], [
                $this->n('text', ['html' => '<p><span style="color:#64748B;font-size:10.5px">অফার প্রাইস</span><br><strong style="font-size:1.2rem;color:'.$primary.'">৳১,১২০</strong></p>'], []),
                $go('অর্ডার করুন'),
            ]),
        ]);

        return [
            'name' => 'Product Checkout (Bangla)', 'category' => 'Product', 'font' => 'Hind Siliguri',
            'description' => 'ক্যাশ অন ডেলিভারি প্রোডাক্ট পেজ: স্টিকি চেকআউট ফর্ম, আরজেন্সি টাইমার, বেনিফিটস, স্পেসিফিকেশন ও রিভিউ - ডেস্কটপে ২-কলাম, মোবাইলে বটম স্টিকি বার সহ।',
            'custom_css' => '@media(min-width:1025px){#order-col{position:sticky;top:16px}}'
                .'@media(max-width:767px){#mobile-cta-bar{position:fixed;left:0;right:0;bottom:0;z-index:999}}',
            'sections' => [
                $this->topBar('🔥 সীমিত সময়ের অফার! আজকের অর্ডারে পাচ্ছেন বিশেষ ছাড় ও ক্যাশ অন ডেলিভারি 🔥', $primary),
                $mainSection,
                $mobileBar,
                $this->n('section', ['content_width' => 'boxed'], ['background_type' => 'color', 'background_color' => '#ffffff', 'padding' => $this->pad('18px')], [
                    $this->n('container', [], [], [
                        // [site_name] pulls the shop's real configured name at render time - never hardcode a brand into a reusable template.
                        $this->n('shortcode', ['code' => '© [year] [site_name]. সর্বস্বত্ব সংরক্ষিত।'], ['align' => 'center', 'font_size' => '12px', 'color' => $textMuted]),
                        $this->n('text', ['html' => '<p>পণ্য চেক করে ক্যাশ অন ডেলিভারিতে নেওয়ার নিশ্চয়তা।</p>'], ['align' => 'center', 'font_size' => '12px', 'color' => $textMuted]),
                    ]),
                ]),
            ],
        ];
    }

    private function books(): array
    {
        return [
            'name' => 'Book Launch', 'category' => 'Product', 'font' => 'Playfair Display',
            'description' => 'Sales page for a book: cover hero, what you will learn, author, reviews, bundle with order bump and an order form.',
            'sections' => [
                $this->section([
                    $this->cols('33-67', [
                        [$this->photo('Book cover', '340px')],
                        [
                            $this->n('text', ['html' => '<p><strong>THE BEST-SELLING GUIDE</strong></p>'], ['color' => '#b45309', 'font_size' => '14px', 'letter_spacing' => '3px']),
                            $this->h('The Book Title That Changes How You Think', 'h1', ['color' => '#1c1917']),
                            $this->p('One powerful promise for your reader. Who it is for and the result they will get after reading it.', ['color' => '#57534e']),
                            $this->n('text', ['html' => '<p>★★★★★ <strong>4.9</strong> from 1,200+ readers &nbsp;|&nbsp; by <strong>Author Name</strong></p>'], ['color' => '#b45309', 'font_size' => '16px']),
                            $this->n('container', [], ['flex_direction' => 'row', 'flex_wrap' => 'wrap', 'gap' => '12px'], [
                                $this->btn('Order the book - Cash on delivery', '#order', ['background_color' => '#b45309', 'hover_background' => '#92400e'], ['event_name' => 'InitiateCheckout']),
                            ]),
                        ],
                    ]),
                ], ['background_type' => 'gradient', 'gradient_from' => '#fffbeb', 'gradient_to' => '#fef3c7', 'gradient_angle' => 160, 'padding' => $this->pad('90px')]),
                $this->section([
                    $this->cols('50-50', [
                        [$this->h('What you will learn', 'h2')],
                        [$this->n('feature_list', ['items' => [
                            ['icon' => 'check-circle', 'text' => 'The first big lesson, written as a benefit'],
                            ['icon' => 'check-circle', 'text' => 'A practical method you can use the same day'],
                            ['icon' => 'check-circle', 'text' => 'Mistakes to avoid that cost others years'],
                            ['icon' => 'check-circle', 'text' => 'Real stories and worked examples'],
                            ['icon' => 'check-circle', 'text' => 'Checklists and templates included'],
                        ]], ['font_size' => '18px', 'icon_color' => '#b45309', 'grid_gap' => '14px'])],
                    ]),
                ]),
                $this->section([
                    $this->cols('67-33', [
                        [$this->h('About the author', 'h2'), $this->p('Write two or three sentences about the author: experience, credibility and why they wrote this book.'), $this->n('social_links', ['links' => [['network' => 'facebook', 'url' => 'https://facebook.com/'], ['network' => 'youtube', 'url' => 'https://youtube.com/']]], ['align' => 'left', 'font_size' => '24px'])],
                        [$this->photo('Author photo', '260px')],
                    ]),
                ], ['background_type' => 'color', 'background_color' => '#fafaf9']),
                $this->section([
                    $this->h('A look inside', 'h2', ['align' => 'center']),
                    $this->n('gallery', ['images' => [['image' => '', 'alt' => 'Sample page 1'], ['image' => '', 'alt' => 'Sample page 2'], ['image' => '', 'alt' => 'Sample page 3']]], ['columns' => ['desktop' => 3, 'tablet' => 3, 'mobile' => 1], 'grid_gap' => '16px', 'border_radius' => '10px']),
                ]),
                $this->reviews('What readers are saying'),
                $this->section([
                    $this->h('Get your copy today', 'h2', ['align' => 'center']),
                    $this->p('Pick the book, add the optional bonus and confirm. Delivery all over Bangladesh - pay when the book arrives.', ['align' => 'center']),
                    $this->orderForm('single', ['accent' => '#b45309', 'css_id' => 'order'], ['submit_text' => 'Confirm my order']),
                ], ['background_type' => 'color', 'background_color' => '#fef3c7', 'padding' => $this->pad('80px')]),
                $this->section([
                    $this->h('Questions', 'h2', ['align' => 'center']),
                    $this->n('faq', ['items' => [
                        ['question' => 'Is this the printed book?', 'answer' => 'Yes, a physical copy delivered to your address. Tell us if you also want an e-book.'],
                        ['question' => 'How many days for delivery?', 'answer' => 'Inside Dhaka 1-2 days, outside Dhaka 3-5 days.'],
                        ['question' => 'Do I need to pay in advance?', 'answer' => 'No. Cash on delivery - you pay when you receive the book.'],
                    ], 'first_open' => true], ['max_width' => '760px', 'margin' => ['desktop' => ['left' => 'auto', 'right' => 'auto']]]),
                ]),
                $this->floatingWhatsapp(),
            ],
        ];
    }

    private function ecommerce(): array
    {
        $card = fn (string $name, string $text) => $this->n('image_box', ['image' => '', 'alt' => $name, 'title' => $name, 'description' => $text, 'link' => '#order', 'tag' => 'h3'], ['align' => 'center', 'border_radius' => '14px', 'box_shadow' => 'sm', 'background_type' => 'color', 'background_color' => '#ffffff']);

        return [
            'name' => 'E-commerce Sale', 'category' => 'E-commerce', 'font' => 'Poppins',
            'description' => 'Multi-product sale page: countdown banner, best sellers grid, trust badges, reviews and an order form where customers pick several products.',
            'sections' => [
                $this->topBar('MEGA SALE - up to 50% OFF  |  Free delivery on selected items', '#be123c'),
                $this->section([
                    $this->n('countdown', ['target' => date('Y-m-d\TH:i', strtotime('+5 days')), 'expired_text' => 'The sale has ended.'], ['align' => 'center', 'font_size' => '40px', 'color' => '#ffffff']),
                    $this->h('Big Savings On Our Best Sellers', 'h1', ['align' => 'center', 'color' => '#ffffff']),
                    $this->p('Hand-picked products at prices you will not see again. While stock lasts - cash on delivery, delivered to your door.', ['align' => 'center', 'color' => '#ffe4e6']),
                    $this->n('container', [], ['flex_direction' => 'row', 'justify_content' => 'center', 'flex_wrap' => 'wrap', 'gap' => '12px'], [
                        $this->btn('Shop the sale', '#order', ['background_color' => '#ffffff', 'color' => '#be123c', 'hover_background' => '#ffe4e6'], ['event_name' => 'InitiateCheckout']),
                    ]),
                ], ['background_type' => 'gradient', 'gradient_from' => '#be123c', 'gradient_to' => '#7c1d3f', 'gradient_angle' => 135, 'padding' => $this->pad('90px')]),
                $this->section([
                    $this->h('Best sellers', 'h2', ['align' => 'center']),
                    $this->cols('25-25-25-25', [
                        [$card('Product one', 'Short line about this product.')],
                        [$card('Product two', 'Short line about this product.')],
                        [$card('Product three', 'Short line about this product.')],
                        [$card('Product four', 'Short line about this product.')],
                    ], ['align_items' => 'stretch']),
                ]),
                $this->section([$this->trustRow()], ['background_type' => 'color', 'background_color' => '#f1f5f9', 'padding' => $this->pad('48px')]),
                $this->section([
                    $this->n('pricing', ['plans' => [
                        ['name' => 'Starter Pack', 'price' => '৳999', 'period' => '', 'features' => "1 product of your choice\nFree delivery", 'button_text' => 'Choose', 'button_url' => '#order', 'highlight' => false, 'badge' => ''],
                        ['name' => 'Family Pack', 'price' => '৳1,899', 'period' => '', 'features' => "3 products\nFree delivery\nFree gift", 'button_text' => 'Choose', 'button_url' => '#order', 'highlight' => true, 'badge' => 'Best value'],
                        ['name' => 'Mega Pack', 'price' => '৳2,999', 'period' => '', 'features' => "5 products\nFree delivery\nFree gift + priority support", 'button_text' => 'Choose', 'button_url' => '#order', 'highlight' => false, 'badge' => ''],
                    ], 'event_enabled' => false], ['columns' => ['desktop' => 3, 'tablet' => 1, 'mobile' => 1], 'grid_gap' => '24px']),
                ], ['background_type' => 'color', 'background_color' => '#fff1f2']),
                $this->reviews('Loved by thousands of shoppers'),
                $this->section([
                    $this->h('Build your order', 'h2', ['align' => 'center']),
                    $this->p('Tick the products you want, choose the quantity and confirm. You pay only when the parcel arrives.', ['align' => 'center']),
                    $this->orderForm('multiple', ['accent' => '#be123c', 'css_id' => 'order'], ['submit_text' => 'Place my order']),
                ], ['background_type' => 'color', 'background_color' => '#f8fafc', 'padding' => $this->pad('80px')]),
                $this->section([
                    $this->h('Shopping questions', 'h2', ['align' => 'center']),
                    $this->n('faq', ['items' => [
                        ['question' => 'How do I order?', 'answer' => 'Choose your products in the order form above, enter your address and confirm. We will call you to verify.'],
                        ['question' => 'What are the delivery charges?', 'answer' => 'Shown in the order summary before you confirm. Inside Dhaka is the cheapest.'],
                        ['question' => 'Can I exchange a product?', 'answer' => 'Yes. Contact us within 7 days of delivery.'],
                    ], 'first_open' => true], ['max_width' => '760px', 'margin' => ['desktop' => ['left' => 'auto', 'right' => 'auto']]]),
                ]),
                $this->floatingWhatsapp(),
            ],
        ];
    }

    private function leadGen(): array
    {
        return [
            'name' => 'Lead Generation', 'category' => 'Lead Generation', 'font' => 'Inter',
            'description' => 'Hero with a lead form, benefits, social proof, FAQ and a closing call to action.',
            'sections' => [
                $this->section([
                    $this->cols('67-33', [
                        [
                            $this->n('text', ['html' => '<p><strong>FREE 30-MINUTE STRATEGY SESSION</strong></p>'], ['color' => '#93c5fd', 'font_size' => '14px', 'letter_spacing' => '2px']),
                            $this->h('Get More Qualified Leads Without Increasing Your Ad Spend', 'h1', ['color' => '#ffffff']),
                            $this->p('We audit your funnel, fix the leaks and build a repeatable lead engine tailored to your business.', ['color' => '#cbd5e1']),
                            $this->n('feature_list', ['items' => [['icon' => 'check-circle', 'text' => 'Custom funnel audit'], ['icon' => 'check-circle', 'text' => 'No long-term contract'], ['icon' => 'check-circle', 'text' => 'Results in the first 30 days']]], ['color' => '#ffffff', 'icon_color' => '#4ade80', 'font_size' => '18px', 'grid_gap' => '12px']),
                        ],
                        [$this->form('Get your free audit', [$this->f('name', 'Full name', 'name', true, 'Your name'), $this->f('email', 'Work email', 'email', true, 'you@company.com'), $this->f('phone', 'Phone', 'phone', false, '+1 555 000 0000')], 'Get My Free Audit')],
                    ]),
                ], $this->dark() + ['padding' => $this->pad('96px')]),
                $this->section([
                    $this->n('logo', ['logos' => [['alt' => 'Acme Co'], ['alt' => 'Globex'], ['alt' => 'Initech'], ['alt' => 'Umbrella']]], ['columns' => ['desktop' => 4, 'tablet' => 2, 'mobile' => 2], 'grid_gap' => '24px']),
                ], ['background_type' => 'color', 'background_color' => '#f1f5f9', 'padding' => $this->pad('40px')]),
                $this->section([
                    $this->h('Why businesses choose us', 'h2', ['align' => 'center']),
                    $this->cols('33-33-33', [
                        [$this->box('target', 'Laser-focused targeting', 'Reach the people most likely to buy, not just anyone who clicks.')],
                        [$this->box('zap', 'Fast turnaround', 'Campaigns live within days, optimised weekly with real data.')],
                        [$this->box('shield', 'Transparent reporting', 'Know exactly what you pay for and what it returns.')],
                    ], ['align_items' => 'stretch']),
                ]),
                $this->section([
                    $this->h('What our clients say', 'h2', ['align' => 'center']),
                    $this->cols('50-50', [
                        [$this->n('testimonial', ['quote' => 'We doubled our qualified enquiries in six weeks and cut cost per lead by 41%.', 'name' => 'Sarah Lee', 'role' => 'Founder, BrightHome', 'rating' => 5])],
                        [$this->n('testimonial', ['quote' => 'Clear reporting, fast responses and real results. The best agency decision we made.', 'name' => 'Marcus Reid', 'role' => 'CMO, Northwind', 'rating' => 5])],
                    ], ['align_items' => 'stretch']),
                ], ['background_type' => 'color', 'background_color' => '#f8fafc']),
                $this->section([
                    $this->h('Frequently asked questions', 'h2', ['align' => 'center']),
                    $this->n('faq', ['items' => [
                        ['question' => 'How quickly will I see results?', 'answer' => 'Most clients see their first qualified leads within 14 days.'],
                        ['question' => 'Do I need to sign a contract?', 'answer' => 'No. We work month to month and earn your business every month.'],
                        ['question' => 'What does the free audit include?', 'answer' => 'A review of your ads, landing pages and tracking with a prioritised action plan.'],
                    ], 'first_open' => true], ['max_width' => '760px', 'margin' => ['desktop' => ['left' => 'auto', 'right' => 'auto']]]),
                ]),
                $this->section([
                    $this->n('cta', ['title' => 'Ready to grow?', 'description' => 'Claim your free strategy session before this month fills up.', 'button_text' => 'Get My Free Audit', 'button_url' => '#form', 'event_enabled' => true, 'event_name' => 'Lead', 'event_browser' => true, 'event_server' => true]),
                ], ['padding' => $this->pad('64px')]),
            ],
        ];
    }

    private function productOffer(): array
    {
        return [
            'name' => 'Product Offer', 'category' => 'Product', 'font' => 'Poppins',
            'description' => 'Limited-time product promotion with countdown, benefits, pricing and testimonial.',
            'sections' => [
                $this->section([
                    $this->cols('50-50', [
                        [
                            $this->n('text', ['html' => '<p><strong>LAUNCH OFFER - 40% OFF</strong></p>'], ['color' => '#fbbf24', 'font_size' => '14px', 'letter_spacing' => '2px']),
                            $this->h('The Last Water Bottle You Will Ever Buy', 'h1', ['color' => '#ffffff']),
                            $this->p('Insulated for 24 hours, built for life. Free shipping on every order this week.', ['color' => '#d1d5db']),
                            $this->n('countdown', ['target' => date('Y-m-d\TH:i', strtotime('+14 days')), 'expired_text' => 'This offer has ended.'], ['color' => '#ffffff', 'align' => 'left']),
                            $this->btn('Order Now - Save 40%', '#pricing', ['background_color' => '#f59e0b', 'hover_background' => '#d97706', 'color' => '#111827'], ['event_name' => 'InitiateCheckout']),
                        ],
                        [$this->n('image', ['image' => '', 'alt' => 'Product photo'], ['align' => 'center', 'img_max_width' => '460px'])],
                    ]),
                ], ['background_type' => 'gradient', 'gradient_from' => '#111827', 'gradient_to' => '#7c2d12', 'gradient_angle' => 135, 'color' => '#ffffff', 'padding' => $this->pad('90px')]),
                $this->section([
                    $this->h('Built different', 'h2', ['align' => 'center']),
                    $this->cols('33-33-33', [
                        [$this->box('shield', 'Lifetime warranty', 'If it ever fails, we replace it. No questions asked.')],
                        [$this->box('truck', 'Free fast shipping', 'Delivered to your door in 2-4 business days.')],
                        [$this->box('award', '30-day guarantee', 'Love it or send it back for a full refund.')],
                    ], ['align_items' => 'stretch']),
                ]),
                $this->n('section', ['content_width' => 'boxed', 'html_tag' => 'section'], ['padding' => $this->pad('80px'), 'background_type' => 'color', 'background_color' => '#f8fafc', 'css_id' => 'pricing'], [
                    $this->n('container', [], ['gap' => '24px', 'align_items' => 'stretch'], [
                        $this->h('Choose your bundle', 'h2', ['align' => 'center']),
                        $this->n('pricing', ['plans' => [
                            ['name' => 'Single', 'price' => '$29', 'period' => '', 'features' => "1 bottle\nFree shipping", 'button_text' => 'Buy 1', 'button_url' => '#', 'highlight' => false, 'badge' => ''],
                            ['name' => 'Duo', 'price' => '$49', 'period' => '', 'features' => "2 bottles\nFree shipping\nFree cleaning brush", 'button_text' => 'Buy 2', 'button_url' => '#', 'highlight' => true, 'badge' => 'Best value'],
                            ['name' => 'Family', 'price' => '$89', 'period' => '', 'features' => "4 bottles\nFree shipping\nGift box", 'button_text' => 'Buy 4', 'button_url' => '#', 'highlight' => false, 'badge' => ''],
                        ], 'event_enabled' => true, 'event_name' => 'InitiateCheckout', 'event_browser' => true, 'event_server' => true], ['columns' => ['desktop' => 3, 'tablet' => 1, 'mobile' => 1], 'grid_gap' => '24px'])
                    ]),
                ]),
                $this->section([
                    $this->n('testimonial', ['quote' => 'Still ice cold after a full day in the sun. I bought three more as gifts.', 'name' => 'Daniel Ortiz', 'role' => 'Verified buyer', 'rating' => 5], ['max_width' => '640px', 'margin' => ['desktop' => ['left' => 'auto', 'right' => 'auto']]]),
                ]),
            ],
        ];
    }

    private function consultation(): array
    {
        return [
            'name' => 'Consultation', 'category' => 'Consultation', 'font' => 'Montserrat',
            'description' => 'Book-a-call page for professionals: hero, process, team and booking form.',
            'sections' => [
                $this->section([
                    $this->n('text', ['html' => '<p><strong>FREE 20-MINUTE CONSULTATION</strong></p>'], ['align' => 'center', 'color' => '#2563eb', 'letter_spacing' => '2px', 'font_size' => '14px']),
                    $this->h('Talk to an Expert About Your Goals', 'h1', ['align' => 'center']),
                    $this->p('Tell us where you are and where you want to be. We will map out the fastest route.', ['align' => 'center', 'color' => '#475569']),
                    $this->n('container', [], ['flex_direction' => 'row', 'justify_content' => 'center', 'flex_wrap' => 'wrap', 'gap' => '14px'], [
                        $this->btn('Book Consultation', '#form', [], ['event_name' => 'Schedule']),
                        $this->n('call', ['text' => 'Call Us', 'number' => '+15550000000', 'event_enabled' => true, 'event_name' => 'Contact', 'event_browser' => true, 'event_server' => true], ['background_type' => 'color', 'background_color' => '#0f172a', 'color' => '#ffffff', 'border_radius' => '10px']),
                        $this->n('whatsapp', ['text' => 'WhatsApp', 'number' => '15550000000', 'message' => 'Hi, I would like a consultation.', 'event_enabled' => true, 'event_name' => 'Contact', 'event_browser' => true, 'event_server' => true], ['background_type' => 'color', 'background_color' => '#25d366', 'color' => '#ffffff', 'border_radius' => '10px']),
                    ]),
                ], ['background_type' => 'gradient', 'gradient_from' => '#eff6ff', 'gradient_to' => '#ffffff', 'gradient_angle' => 180, 'padding' => $this->pad('100px')]),
                $this->section([
                    $this->h('How it works', 'h2', ['align' => 'center']),
                    $this->cols('33-33-33', [
                        [$this->box('calendar', '1. Book a time', 'Pick a slot that suits you. It takes less than a minute.', ['align' => 'center'])],
                        [$this->box('message', '2. We talk', 'A friendly, no-pressure conversation about your situation.', ['align' => 'center'])],
                        [$this->box('trending-up', '3. Get a plan', 'Leave with a clear, actionable plan - yours to keep.', ['align' => 'center'])],
                    ], ['align_items' => 'stretch']),
                ]),
                $this->section([
                    $this->h('Meet your consultants', 'h2', ['align' => 'center']),
                    $this->n('team', ['members' => [['name' => 'Dr. Amira Khan', 'role' => 'Lead Consultant', 'bio' => '15 years helping founders scale.'], ['name' => 'James Wu', 'role' => 'Strategy Advisor', 'bio' => 'Ex-operator, growth specialist.'], ['name' => 'Lena Fischer', 'role' => 'Client Success', 'bio' => 'Makes sure you get results.']]], ['columns' => ['desktop' => 3, 'tablet' => 3, 'mobile' => 1], 'grid_gap' => '24px']),
                ], ['background_type' => 'color', 'background_color' => '#f8fafc']),
                $this->section([
                    $this->cols('50-50', [
                        [$this->h('Book your free consultation', 'h2'), $this->p('Fill in the form and we will reply within one business day to confirm your slot.'), $this->n('faq', ['items' => [['question' => 'Is it really free?', 'answer' => 'Yes. No credit card and no obligation.']], 'first_open' => true])],
                        [$this->form('Book', [$this->f('name', 'Full name', 'name'), $this->f('email', 'Email', 'email'), $this->f('phone', 'Phone', 'phone', false), $this->f('service', 'Topic', 'topic', true, 'Choose a topic', "Strategy\nMarketing\nOperations\nOther"), $this->f('textarea', 'Anything we should know?', 'notes', false)], 'Request My Slot')],
                    ]),
                ]),
            ],
        ];
    }

    private function agency(): array
    {
        return [
            'name' => 'Agency Service', 'category' => 'Agency', 'font' => 'Poppins',
            'description' => 'Agency landing page with services grid, results, testimonials and enquiry form.',
            'sections' => [
                $this->section([
                    $this->h('We Build Brands That Convert', 'h1', ['align' => 'center', 'color' => '#ffffff']),
                    $this->p('Strategy, creative and performance marketing under one roof.', ['align' => 'center', 'color' => '#c7d2fe']),
                    $this->n('container', [], ['flex_direction' => 'row', 'justify_content' => 'center', 'gap' => '14px', 'flex_wrap' => 'wrap'], [
                        $this->btn('Start a Project', '#form', ['background_color' => '#ffffff', 'color' => '#4338ca', 'hover_background' => '#e0e7ff']),
                    ]),
                ], ['background_type' => 'gradient', 'gradient_from' => '#4338ca', 'gradient_to' => '#7c3aed', 'gradient_angle' => 135, 'padding' => $this->pad('110px')]),
                $this->section([
                    $this->h('What we do', 'h2', ['align' => 'center']),
                    $this->cols('33-33-33', [
                        [$this->box('target', 'Performance Ads', 'Meta, Google and TikTok campaigns built to return more than they cost.')],
                        [$this->box('globe', 'Web & Landing Pages', 'Fast, conversion-focused sites that turn visitors into leads.')],
                        [$this->box('chart', 'Analytics & Tracking', 'Pixel, Conversions API and dashboards you can trust.')],
                    ], ['align_items' => 'stretch']),
                    $this->cols('33-33-33', [
                        [$this->box('star', 'Brand Identity', 'Logos, guidelines and messaging that make you memorable.')],
                        [$this->box('message', 'Content & Social', 'Consistent content that builds an audience and drives demand.')],
                        [$this->box('users', 'CRM & Automation', 'Follow up every lead automatically, on every channel.')],
                    ], ['align_items' => 'stretch']),
                ]),
                $this->section([
                    $this->cols('33-33-33', [
                        [$this->n('icon_box', ['icon' => 'trending-up', 'title' => '3.4x average ROAS', 'description' => 'Across 120+ campaigns'], ['align' => 'center', 'icon_color' => '#a5b4fc', 'title_color' => '#ffffff', 'description_color' => '#c7d2fe'])],
                        [$this->n('icon_box', ['icon' => 'users', 'title' => '250+ happy clients', 'description' => 'In 14 countries'], ['align' => 'center', 'icon_color' => '#a5b4fc', 'title_color' => '#ffffff', 'description_color' => '#c7d2fe'])],
                        [$this->n('icon_box', ['icon' => 'award', 'title' => '8 industry awards', 'description' => 'For creative excellence'], ['align' => 'center', 'icon_color' => '#a5b4fc', 'title_color' => '#ffffff', 'description_color' => '#c7d2fe'])],
                    ]),
                ], ['background_type' => 'color', 'background_color' => '#1e1b4b', 'padding' => $this->pad('56px')]),
                $this->section([
                    $this->cols('50-50', [
                        [$this->n('testimonial', ['quote' => 'They rebuilt our funnel and tracking from scratch. Revenue is up 62% year on year.', 'name' => 'Priya Nair', 'role' => 'CEO, Lumen Skincare', 'rating' => 5])],
                        [$this->n('testimonial', ['quote' => 'Professional, proactive and genuinely obsessed with results.', 'name' => 'Tom Becker', 'role' => 'Founder, Loop Fitness', 'rating' => 5])],
                    ], ['align_items' => 'stretch']),
                ], ['background_type' => 'color', 'background_color' => '#f8fafc']),
                $this->section([
                    $this->cols('50-50', [
                        [$this->h('Tell us about your project', 'h2'), $this->p('Share a few details and a senior strategist will get back to you within one business day.')],
                        [$this->form('Project', [$this->f('name', 'Name', 'name'), $this->f('email', 'Email', 'email'), $this->f('text', 'Company', 'company', false), $this->f('service', 'Service', 'service', true, 'Select a service', "Performance Ads\nWeb & Landing Pages\nBrand Identity\nAnalytics & Tracking"), $this->f('textarea', 'Project details', 'details', false)], 'Send Enquiry')],
                    ]),
                ]),
            ],
        ];
    }

    private function comingSoon(): array
    {
        return [
            'name' => 'Coming Soon', 'category' => 'Coming Soon', 'font' => 'Inter',
            'description' => 'Full-screen launch page with countdown and early-access email capture.',
            'sections' => [
                $this->n('section', ['content_width' => 'boxed', 'vertical_align' => 'center', 'html_tag' => 'section'], [
                    'min_height' => '100vh', 'background_type' => 'gradient', 'gradient_from' => '#0f172a', 'gradient_to' => '#581c87', 'gradient_angle' => 160, 'color' => '#ffffff', 'padding' => $this->pad('60px'),
                ], [
                    $this->n('container', [], ['align_items' => 'center', 'gap' => '22px'], [
                        $this->n('text', ['html' => '<p><strong>SOMETHING BIG IS COMING</strong></p>'], ['align' => 'center', 'color' => '#c4b5fd', 'letter_spacing' => '3px', 'font_size' => '13px']),
                        $this->h('We Are Launching Soon', 'h1', ['align' => 'center', 'color' => '#ffffff']),
                        $this->p('Join the early-access list and be first in line when we open the doors.', ['align' => 'center', 'color' => '#ddd6fe']),
                        $this->n('countdown', ['target' => date('Y-m-d\TH:i', strtotime('+30 days')), 'expired_text' => 'We are live!'], ['color' => '#ffffff', 'align' => 'center', 'font_size' => '44px']),
                        $this->form('Early access', [$this->f('email', 'Email address', 'email', true, 'you@example.com')], 'Notify Me', ['max_width' => '440px', 'background_color' => 'rgba(255,255,255,0.08)', 'color' => '#ffffff', 'box_shadow' => 'none', 'label_color' => '#ffffff']),
                        $this->n('social_links', ['links' => [['network' => 'instagram', 'url' => 'https://instagram.com/'], ['network' => 'twitter', 'url' => 'https://x.com/'], ['network' => 'facebook', 'url' => 'https://facebook.com/']]], ['align' => 'center', 'color' => '#ddd6fe', 'font_size' => '24px']),
                    ]),
                ]),
            ],
        ];
    }
}
