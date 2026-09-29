<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Countries;
use App\Landing\Support\Sanitizer;

/**
 * Lead form. The same normalised field definition drives both the rendered markup
 * and the server-side validation of public submissions (see definition()).
 */
class FormElement extends AbstractElement
{
    public const FIELD_TYPES = [
        'name' => 'Name', 'email' => 'Email', 'phone' => 'Phone', 'text' => 'Text', 'textarea' => 'Textarea',
        'number' => 'Number', 'select' => 'Select', 'radio' => 'Radio', 'checkbox' => 'Checkbox',
        'hidden' => 'Hidden', 'country' => 'Country', 'service' => 'Service',
    ];

    public function type(): string
    {
        return 'form';
    }

    public function label(): string
    {
        return 'Lead Form';
    }

    public function category(): string
    {
        return 'marketing';
    }

    public function defaults(): array
    {
        return [
            'content' => [
                'fields' => [
                    ['type' => 'name', 'label' => 'Full name', 'name' => 'name', 'placeholder' => 'Your name', 'required' => true, 'default' => '', 'options' => ''],
                    ['type' => 'email', 'label' => 'Email', 'name' => 'email', 'placeholder' => 'you@example.com', 'required' => true, 'default' => '', 'options' => ''],
                    ['type' => 'phone', 'label' => 'Phone', 'name' => 'phone', 'placeholder' => '+1 555 000 0000', 'required' => false, 'default' => '', 'options' => ''],
                ],
                'submit_text' => 'Get My Free Quote',
                'success_message' => 'Thank you! We will contact you soon.',
                'redirect_url' => '',
                'notify_email' => '',
                'save_lead' => true,
                'event_enabled' => true,
                'event_name' => 'Lead',
                'event_browser' => true,
                'event_server' => true,
            ],
            'settings' => [
                'background_type' => 'color', 'background_color' => '#ffffff', 'color' => '#111827', 'border_radius' => '16px', 'box_shadow' => 'md',
                'padding' => ['desktop' => ['top' => '32px', 'right' => '32px', 'bottom' => '32px', 'left' => '32px'], 'mobile' => ['top' => '20px', 'right' => '20px', 'bottom' => '20px', 'left' => '20px']],
                'max_width' => '520px',
            ],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        $fieldControls = [
            Control::select('type', 'Type', self::FIELD_TYPES, ['default' => 'text']),
            Control::text('label', 'Label'),
            Control::text('name', 'Field name', ['help' => 'Lowercase letters, numbers, underscore']),
            Control::text('placeholder', 'Placeholder'),
            Control::switch('required', 'Required'),
            Control::text('default', 'Default value'),
            Control::textarea('options', 'Options (one per line)', ['rows' => 3, 'if' => ['type' => ['select', 'radio', 'service']]]),
        ];

        return array_merge([
            Control::repeater('fields', 'Fields', $fieldControls, ['type' => 'text', 'label' => 'New field', 'name' => 'field', 'placeholder' => '', 'required' => false, 'default' => '', 'options' => ''], ['title_field' => 'label']),
            Control::text('submit_text', 'Button text', ['default' => 'Submit']),
            Control::textarea('success_message', 'Success message', ['default' => 'Thank you! We will contact you soon.', 'rows' => 2]),
            Control::url('redirect_url', 'Redirect after success', ['help' => 'Optional. Leave empty to show the message.']),
            Control::text('notify_email', 'Notification email', ['help' => 'Receive an email for each submission.']),
            Control::switch('save_lead', 'Save submissions as leads', ['default' => true]),
        ], $this->trackingControls('Lead'));
    }

    protected function styleControls(): array
    {
        $S = fn (array $o = []) => $o + ['tab' => 'style', 'section' => 'Form'];

        return [
            Control::text('max_width', 'Max width', $S(['responsive' => true, 'placeholder' => '520px'])),
            Control::color('button_background', 'Button background', $S()),
            Control::color('button_color', 'Button text color', $S()),
            Control::color('field_border_color', 'Field border color', $S()),
            Control::text('field_radius', 'Field radius', $S(['placeholder' => '8px'])),
            Control::color('label_color', 'Label color', $S()),
        ];
    }

    protected function styleGroups(): array
    {
        return ['background', 'border', 'effects', 'color'];
    }

    protected function advancedGroups(): array
    {
        return ['spacing', 'visibility', 'animation', 'attributes'];
    }

    /** Settings 'max_width' applies to the form card; keep it available in Style. */
    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        $s = $node['settings'] ?? [];
        $css = $root.'{margin-left:auto;margin-right:auto;width:100%;box-sizing:border-box}'
            .$root.' .lp-field{margin-bottom:14px;display:flex;flex-direction:column;gap:6px;text-align:left}'
            .$root.' .lp-field label,'.$root.' .lp-legend{font-weight:600;font-size:14px}'
            .$root.' .lp-input{font:inherit;padding:12px 14px;border:1px solid #d1d5db;border-radius:8px;background:#fff;color:#111827;width:100%;box-sizing:border-box}'
            .$root.' .lp-input:focus{outline:2px solid #93c5fd;outline-offset:1px}'
            .$root.' .lp-check{display:flex;gap:8px;align-items:center;font-weight:400}'
            .$root.' .lp-check input{width:auto}'
            .$root.' .lp-fb{font:inherit;font-weight:700;cursor:pointer;border:0;border-radius:8px;padding:14px 20px;width:100%;background:#2563eb;color:#fff}'
            .$root.' .lp-fb:disabled{opacity:.6;cursor:wait}'
            .$root.' .lp-hp{position:absolute!important;left:-9999px!important;height:0;overflow:hidden}'
            .$root.' .lp-form-msg{margin-top:12px;font-size:14px;min-height:1em}'
            .$root.' .lp-form-msg.is-error{color:#dc2626}.lp-e-'.self::safeId($node['id']).' .lp-form-msg.is-ok{color:#15803d}'
            .$root.' .lp-err{color:#dc2626;font-size:13px}';
        if ($c = Sanitizer::color($s['button_background'] ?? '')) {
            $css .= $root.' .lp-fb{background:'.$c.'}';
        }
        if ($c = Sanitizer::color($s['button_color'] ?? '')) {
            $css .= $root.' .lp-fb{color:'.$c.'}';
        }
        if ($c = Sanitizer::color($s['field_border_color'] ?? '')) {
            $css .= $root.' .lp-input{border-color:'.$c.'}';
        }
        if ($c = Sanitizer::color($s['label_color'] ?? '')) {
            $css .= $root.' .lp-field label,'.$root.' .lp-legend{color:'.$c.'}';
        }
        if ($r = Sanitizer::length($s['field_radius'] ?? '')) {
            $css .= $root.' .lp-input{border-radius:'.$r.'}';
        }

        return $css;
    }

    /**
     * Normalised field definitions. Names are unique, safe identifiers and never collide
     * with the honeypot or CSRF fields.
     *
     * @return list<array{type:string,label:string,name:string,placeholder:string,required:bool,default:string,options:list<string>}>
     */
    public static function definition(array $node): array
    {
        $out = [];
        $seen = [config('landing.forms.honeypot_field') => true, '_token' => true];
        foreach (array_slice((array) ($node['content']['fields'] ?? []), 0, 30) as $i => $f) {
            if (! is_array($f)) {
                continue;
            }
            $type = isset(self::FIELD_TYPES[$f['type'] ?? '']) ? $f['type'] : 'text';
            $name = strtolower(preg_replace('/[^a-z0-9_]/i', '', (string) ($f['name'] ?? '')));
            $name = $name !== '' ? substr($name, 0, 40) : 'field_'.($i + 1);
            while (isset($seen[$name])) {
                $name .= '_'.($i + 1);
            }
            $seen[$name] = true;
            $options = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', (string) ($f['options'] ?? ''))), fn ($o) => $o !== ''));
            if ($type === 'country') {
                $options = Countries::list();
            }
            $out[] = [
                'type' => $type,
                'label' => mb_substr((string) ($f['label'] ?? ''), 0, 120),
                'name' => $name,
                'placeholder' => mb_substr((string) ($f['placeholder'] ?? ''), 0, 120),
                'required' => ! empty($f['required']),
                'default' => mb_substr((string) ($f['default'] ?? ''), 0, 255),
                'options' => array_slice($options, 0, 100),
            ];
        }

        return $out;
    }

    /** Laravel validation rules for a definition. */
    public static function rules(array $fields): array
    {
        $rules = [];
        foreach ($fields as $f) {
            $r = [$f['required'] ? 'required' : 'nullable'];
            switch ($f['type']) {
                case 'email':
                    $r[] = 'email:rfc';
                    $r[] = 'max:190';
                    break;
                case 'phone':
                    $r[] = 'string';
                    $r[] = 'max:30';
                    $r[] = 'regex:/^[0-9+()\-.\s]{5,30}$/';
                    break;
                case 'number':
                    $r[] = 'numeric';
                    break;
                case 'textarea':
                    $r[] = 'string';
                    $r[] = 'max:5000';
                    break;
                case 'checkbox':
                    $r = [$f['required'] ? 'accepted' : 'nullable', 'boolean'];
                    break;
                case 'select':
                case 'radio':
                case 'service':
                case 'country':
                    $r[] = \Illuminate\Validation\Rule::in($f['options'] ?: ['']);
                    break;
                default:
                    $r[] = 'string';
                    $r[] = 'max:255';
            }
            $rules[$f['name']] = $r;
        }

        return $rules;
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $ctx->hasForm = true;
        $fields = self::definition($node);
        $html = '';

        foreach ($fields as $f) {
            $id = 'f_'.self::safeId($node['id']).'_'.$f['name'];
            $req = $f['required'] ? ' required' : '';
            $label = e($f['label']).($f['required'] ? ' <span aria-hidden="true">*</span>' : '');
            $common = ' id="'.e($id).'" name="'.e($f['name']).'"'.$req;
            $ph = $f['placeholder'] !== '' ? ' placeholder="'.e($f['placeholder']).'"' : '';
            $def = e($f['default']);

            switch ($f['type']) {
                case 'hidden':
                    $html .= '<input type="hidden" name="'.e($f['name']).'" value="'.$def.'">';
                    continue 2;
                case 'textarea':
                    $control = '<textarea class="lp-input" rows="4"'.$common.$ph.'>'.$def.'</textarea>';
                    break;
                case 'select':
                case 'service':
                case 'country':
                    $opts = '<option value="">'.e($f['placeholder'] ?: 'Select...').'</option>';
                    foreach ($f['options'] as $o) {
                        $opts .= '<option value="'.e($o).'"'.($o === $f['default'] ? ' selected' : '').'>'.e($o).'</option>';
                    }
                    $control = '<select class="lp-input"'.$common.'>'.$opts.'</select>';
                    break;
                case 'radio':
                    $control = '';
                    foreach ($f['options'] as $n => $o) {
                        $control .= '<label class="lp-check"><input type="radio" name="'.e($f['name']).'" value="'.e($o).'"'.($n === 0 && $f['required'] ? ' required' : '').($o === $f['default'] ? ' checked' : '').'> '.e($o).'</label>';
                    }
                    $html .= '<fieldset class="lp-field" style="border:0;padding:0;margin:0 0 14px"><legend class="lp-legend">'.$label.'</legend>'.$control.'<span class="lp-err" data-err="'.e($f['name']).'"></span></fieldset>';
                    continue 2;
                case 'checkbox':
                    $html .= '<div class="lp-field"><label class="lp-check"><input type="checkbox"'.$common.' value="1"'.($f['default'] === '1' ? ' checked' : '').'> <span>'.$label.'</span></label><span class="lp-err" data-err="'.e($f['name']).'"></span></div>';
                    continue 2;
                default:
                    $inputType = match ($f['type']) {'email' => 'email', 'phone' => 'tel', 'number' => 'number', default => 'text'};
                    $auto = match ($f['type']) {'name' => 'name', 'email' => 'email', 'phone' => 'tel', default => 'off'};
                    $control = '<input class="lp-input" type="'.$inputType.'" autocomplete="'.$auto.'"'.$common.$ph.' value="'.$def.'">';
            }

            $html .= '<div class="lp-field"><label for="'.e($id).'">'.$label.'</label>'.$control.'<span class="lp-err" data-err="'.e($f['name']).'"></span></div>';
        }

        $hp = e(config('landing.forms.honeypot_field'));
        $track = $this->trackAttrs($node, $ctx, 'submit');
        $formAttrs = ['class' => 'lp-form', 'method' => 'post', 'novalidate' => true, 'data-lp-form' => self::safeId($node['id'])] + $track;

        return $this->open($node, $ctx)
            .'<form'.$this->attrs($formAttrs).'>'
            .'<div class="lp-hp" aria-hidden="true"><label>Leave this field empty<input type="text" name="'.$hp.'" tabindex="-1" autocomplete="off"></label></div>'
            .$html
            .'<button type="submit" class="lp-fb">'.e((string) $this->c($node, 'submit_text', 'Submit')).'</button>'
            .'<div class="lp-form-msg" role="status" aria-live="polite"></div></form></div>';
    }
}
