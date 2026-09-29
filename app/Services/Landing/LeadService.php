<?php

namespace App\Services\Landing;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\ContentTree;
use App\Landing\Builder\Elements\FormElement;
use App\Landing\Support\Sanitizer;
use App\Mail\LandingLeadReceived;
use App\Models\LandingPage;
use App\Models\LandingPageLead;
use App\Models\LandingPageVersion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class LeadService
{
    public function __construct(
        private LeadRecorder $recorder,
        private LandingPageTrackingService $tracking,
        private LandingOrderService $orders,
    ) {}

    /**
     * Handle a public form submission.
     * The form definition comes from the PUBLISHED snapshot, never from the request.
     *
     * @return array{ok:bool,message:string,redirect:?string,event:?array}
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function submit(LandingPage $page, LandingPageVersion $version, Request $request): array
    {
        $formId = (string) $request->input('form');
        $node = $formId !== '' ? ContentTree::findSafe($version->content_json ?? [], AbstractElement::safeId($formId)) : null;

        if (! $node || ! in_array($node['type'] ?? '', ['form', 'order_form'], true)) {
            // Check if page has an order_form element anywhere in its tree
            $node = ContentTree::findFirst($version->content_json ?? [], fn ($n) => ($n['type'] ?? '') === 'order_form');
            if (! $node) {
                // Synthesize an order form node from page product settings or request
                $pid = (int) ($version->settings_json['product_id'] ?? $page->settings_json['product_id'] ?? 0);
                $pickedId = $pid ?: (int) ($request->input('pick')[0] ?? 0);
                if ($pickedId > 0) {
                    $node = [
                        'id' => 'custom_order_form',
                        'type' => 'order_form',
                        'content' => [
                            'product_id' => $pickedId,
                            'items' => [
                                [
                                    'id' => $pickedId,
                                    'label' => '',
                                    'description' => '',
                                    'selected' => true,
                                    'qty' => 1,
                                    'bump' => false,
                                    'bump_text' => '',
                                ],
                            ],
                            'mode' => 'single',
                            'allow_qty' => true,
                            'block_active_orders' => false,
                            'delivery_inside' => 60,
                            'delivery_outside' => 120,
                        ],
                        'settings' => [],
                    ];
                } else {
                    abort(404);
                }
            }
        }

        if ($node['type'] === 'order_form') {
            return $this->orders->submit($page, $version, $node, $request);
        }

        $success = [
            'ok' => true,
            'message' => (string) ($node['content']['success_message'] ?? '') ?: 'Thank you! We will contact you soon.',
            'redirect' => Sanitizer::url($node['content']['redirect_url'] ?? '') ?: null,
            'event' => null,
        ];

        // Honeypot: bots fill it. Pretend success, store nothing.
        if (filled($request->input(config('landing.forms.honeypot_field')))) {
            return $success;
        }

        $fields = FormElement::definition($node);
        $data = Validator::make($request->all(), FormElement::rules($fields))->validate();

        [$name, $email, $phone] = $this->identity($fields, $data);

        // Duplicate submission protection (same person + form within a short window).
        $fingerprint = hash('sha256', implode('|', [$page->id, $node['id'], strtolower((string) $email), (string) $phone, $request->ip()]));
        $lock = Cache::add('landing:lead:'.$fingerprint, 1, (int) config('landing.forms.duplicate_window_seconds'));
        if (! $lock) {
            return $success + ['duplicate' => true];
        }

        $eventCfg = AbstractElement::trackingConfig($node, 'submit');

        if (($node['content']['save_lead'] ?? true) !== false) {
            $this->recorder->record($page, AbstractElement::safeId($node['id']), $request, $name, $email, $phone, $this->storable($fields, $data));
        }

        // ---- everything below is best effort: the lead is already saved ----
        $success['event'] = $this->tracking->submission($page, $version, $eventCfg, $request, ['email' => $email, 'phone' => $phone, 'name' => $name]);
        $this->notify($node, $page, $fields, $data);

        return $success;
    }

    private function notify(array $node, LandingPage $page, array $fields, array $data): void
    {
        $to = (string) ($node['content']['notify_email'] ?? '');
        if ($to === '' || ! filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return;
        }
        try {
            $rows = array_map(fn ($r) => ['label' => $r['label'], 'value' => $r['value']], $this->storable($fields, $data));
            Mail::to($to)->send(new LandingLeadReceived($page->title, $page->publicUrl(), $rows));
        } catch (\Throwable $e) {
            report($e); // a mail outage must not fail the submission
        }
    }

    /** name, email, phone taken from the first field of each type. */
    private function identity(array $fields, array $data): array
    {
        $pick = function (string $type) use ($fields, $data) {
            foreach ($fields as $f) {
                if ($f['type'] === $type && ! empty($data[$f['name']])) {
                    return trim((string) $data[$f['name']]);
                }
            }

            return null;
        };

        return [$pick('name'), $pick('email'), $pick('phone')];
    }

    /** @return list<array{name:string,label:string,type:string,value:string}> */
    private function storable(array $fields, array $data): array
    {
        $out = [];
        foreach ($fields as $f) {
            $v = $data[$f['name']] ?? null;
            if ($v === null || $v === '') {
                continue;
            }
            $out[] = [
                'name' => $f['name'],
                'label' => $f['label'] ?: $f['name'],
                'type' => $f['type'],
                'value' => $f['type'] === 'checkbox' ? 'Yes' : mb_substr((string) $v, 0, 5000),
            ];
        }

        return $out;
    }
}
