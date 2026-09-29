<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;

class FaqElement extends AbstractElement
{
    public function type(): string
    {
        return 'faq';
    }

    public function label(): string
    {
        return 'FAQ';
    }

    public function category(): string
    {
        return 'content';
    }

    public function defaults(): array
    {
        return [
            'content' => ['items' => [
                ['question' => 'How quickly will I see results?', 'answer' => 'Most clients see their first results within the first two weeks.'],
                ['question' => 'Is there a contract?', 'answer' => 'No long-term contract. Cancel any time.'],
                ['question' => 'What do I need to get started?', 'answer' => 'Just fill in the form and we will take care of the rest.'],
            ]],
            'settings' => [],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        return [
            Control::repeater('items', 'Questions', [
                Control::text('question', 'Question'),
                Control::textarea('answer', 'Answer', ['rows' => 3]),
            ], ['question' => 'New question?', 'answer' => 'Answer'], ['title_field' => 'question']),
            Control::switch('first_open', 'Open first item', ['default' => false]),
        ];
    }

    protected function styleGroups(): array
    {
        return ['typography', 'color', 'background', 'border', 'effects'];
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        return $root.' details{border-bottom:1px solid rgba(128,128,128,.25);padding:16px 0}'
            .$root.' summary{cursor:pointer;font-weight:600;list-style:none;display:flex;justify-content:space-between;gap:12px;align-items:center}'
            .$root.' summary::-webkit-details-marker{display:none}'
            .$root.' summary::after{content:"+";font-size:1.4em;line-height:1;flex:none}'
            .$root.' details[open] summary::after{content:"\2212"}'
            .$root.' .lp-faq-a{margin:10px 0 0;opacity:.85}';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $out = '';
        foreach (array_values((array) $this->c($node, 'items', [])) as $i => $item) {
            $open = ($i === 0 && $this->c($node, 'first_open')) ? ' open' : '';
            $out .= '<details'.$open.'><summary>'.e((string) ($item['question'] ?? '')).'</summary><p class="lp-faq-a">'.nl2br(e((string) ($item['answer'] ?? ''))).'</p></details>';
        }

        return $this->open($node, $ctx).$out.'</div>';
    }
}
