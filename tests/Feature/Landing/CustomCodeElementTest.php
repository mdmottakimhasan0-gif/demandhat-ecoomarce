<?php

namespace Tests\Feature\Landing;

use App\Landing\Builder\Elements\CustomCodeElement;
use App\Landing\Builder\LandingPageRenderer;
use App\Landing\Builder\RenderContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomCodeElementTest extends TestCase
{
    use RefreshDatabase;
    public function test_custom_code_renders_live_in_preview_and_editing_mode(): void
    {
        $el = app(CustomCodeElement::class);
        $ctx = new RenderContext(editing: true, allowCustomCode: true);

        $node = [
            'id' => 'cc_test',
            'type' => 'custom_code',
            'content' => [
                'language' => 'html',
                'code' => '<div class="banner">Special Promo</div>',
                'html_tag' => 'section',
            ],
            'settings' => [
                'display_type' => 'flex',
                'flex_direction' => 'column',
                'gap' => '20px',
            ],
            'children' => [],
        ];

        $rendered = $el->render($node, '', $ctx);

        $this->assertStringContainsString('<section class="lp-e lp-e-cc_test lp-custom-code"', $rendered);
        $this->assertStringContainsString('data-lp-id="cc_test"', $rendered);
        $this->assertStringContainsString('<div class="banner">Special Promo</div>', $rendered);
        $this->assertStringContainsString('</section>', $rendered);
    }

    public function test_custom_code_renders_php_code_dynamically(): void
    {
        $el = app(CustomCodeElement::class);
        $ctx = new RenderContext(editing: true, allowCustomCode: true);

        $node = [
            'id' => 'cc_php',
            'type' => 'custom_code',
            'content' => [
                'language' => 'php',
                'code' => '<?php echo "Sum is: " . (10 + 25); ?>',
            ],
            'settings' => [],
            'children' => [],
        ];

        $rendered = $el->render($node, '', $ctx);

        $this->assertStringContainsString('Sum is: 35', $rendered);
    }

    public function test_custom_code_renders_blade_and_php_without_tags(): void
    {
        $el = app(CustomCodeElement::class);
        $ctx = new RenderContext(editing: true, allowCustomCode: true);

        $node = [
            'id' => 'cc_blade',
            'type' => 'custom_code',
            'content' => [
                'language' => 'php',
                'code' => 'echo "Hello from raw PHP";',
            ],
            'settings' => [],
            'children' => [],
        ];

        $rendered = $el->render($node, '', $ctx);

        $this->assertStringContainsString('Hello from raw PHP', $rendered);
    }

    public function test_custom_code_auto_wraps_javascript_and_css(): void
    {
        $el = app(CustomCodeElement::class);
        $ctx = new RenderContext(editing: true, allowCustomCode: true);

        $jsNode = [
            'id' => 'cc_js',
            'type' => 'custom_code',
            'content' => [
                'language' => 'javascript',
                'code' => 'console.log("hello");',
            ],
            'settings' => [],
            'children' => [],
        ];
        $jsRendered = $el->render($jsNode, '', $ctx);
        $this->assertStringContainsString('<script type="text/javascript">console.log("hello");</script>', $jsRendered);

        $cssNode = [
            'id' => 'cc_css',
            'type' => 'custom_code',
            'content' => [
                'language' => 'css',
                'code' => '.banner { color: red; }',
            ],
            'settings' => [],
            'children' => [],
        ];
        $cssRendered = $el->render($cssNode, '', $ctx);
        $this->assertStringContainsString('<style>.banner { color: red; }</style>', $cssRendered);
    }

    public function test_custom_code_shows_placeholder_only_when_empty_in_editing(): void
    {
        $el = app(CustomCodeElement::class);
        $ctx = new RenderContext(editing: true, allowCustomCode: true);

        $node = [
            'id' => 'cc_empty',
            'type' => 'custom_code',
            'content' => [
                'language' => 'html',
                'code' => '',
            ],
            'settings' => [],
            'children' => [],
        ];

        $rendered = $el->render($node, '', $ctx);
        $this->assertStringContainsString('Custom Code Block', $rendered);
    }

    public function test_custom_code_renders_compiled_page_styles(): void
    {
        $renderer = app(LandingPageRenderer::class);
        $ctx = new RenderContext(editing: true, allowCustomCode: true);

        $content = [
            'version' => 1,
            'sections' => [
                [
                    'id' => 'sec_1',
                    'type' => 'section',
                    'content' => [],
                    'settings' => [],
                    'children' => [
                        [
                            'id' => 'cc_styled',
                            'type' => 'custom_code',
                            'content' => [
                                'language' => 'html',
                                'code' => '<h1>Live Title</h1>',
                            ],
                            'settings' => [
                                'display_type' => 'flex',
                                'color' => '#123456',
                                'background_color' => '#f0f0f0',
                            ],
                            'children' => [],
                        ],
                    ],
                ],
            ],
        ];

        $compiled = $renderer->compile($content, [], $ctx);

        $this->assertStringContainsString('Live Title', $compiled['body']);
        $this->assertStringContainsString('.lp-e-cc_styled', $compiled['css']);
        $this->assertStringContainsString('#123456', $compiled['css']);
        $this->assertStringContainsString('#f0f0f0', $compiled['css']);
        $this->assertStringContainsString('display:flex', $compiled['css']);
    }
}
