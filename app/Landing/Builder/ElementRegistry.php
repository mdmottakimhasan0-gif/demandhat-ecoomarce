<?php

namespace App\Landing\Builder;

use App\Landing\Builder\Elements as E;

/**
 * Registry of every element the builder knows about. To add an element, write a
 * subclass of AbstractElement and register() it (see LandingServiceProvider).
 */
class ElementRegistry
{
    /** @var array<string, AbstractElement> */
    private array $elements = [];

    public const CATEGORIES = [
        'layout' => 'Layout',
        'basic' => 'Basic',
        'content' => 'Content',
        'marketing' => 'Marketing',
        'advanced' => 'Advanced',
    ];

    public function __construct()
    {
        foreach ([
            E\SectionElement::class, E\ContainerElement::class, E\ColumnsElement::class, E\ColumnElement::class,
            E\HeadingElement::class, E\TextElement::class, E\ImageElement::class, E\ButtonElement::class,
            E\IconElement::class, E\DividerElement::class, E\SpacerElement::class, E\VideoElement::class,
            E\IconBoxElement::class, E\ImageBoxElement::class, E\FeatureListElement::class, E\TestimonialElement::class,
            E\TestimonialSliderElement::class,
            E\TeamElement::class, E\PricingElement::class, E\FaqElement::class, E\CountdownElement::class,
            E\LogoElement::class, E\GalleryElement::class, E\ImageSliderElement::class,
            E\FormElement::class, E\OrderFormElement::class, E\WhatsappElement::class, E\CallElement::class, E\SocialLinksElement::class, E\CtaElement::class,
            E\HtmlElement::class, E\ShortcodeElement::class, E\CustomCodeElement::class,
        ] as $class) {
            $this->register(new $class);
        }
    }

    public function register(AbstractElement $element): static
    {
        $this->elements[$element->type()] = $element;

        return $this;
    }

    public function get(?string $type): ?AbstractElement
    {
        return $this->elements[$type] ?? null;
    }

    public function has(?string $type): bool
    {
        return isset($this->elements[$type]);
    }

    /** @return array<string, AbstractElement> */
    public function all(): array
    {
        return $this->elements;
    }

    /** May an element of $childType live directly inside $parentType? */
    public function accepts(?string $parentType, string $childType): bool
    {
        if ($parentType === null) {
            return $childType === 'section'; // page root only holds sections
        }
        $parent = $this->get($parentType);
        if (! $parent) {
            return false;
        }
        $accepts = $parent->accepts();
        if (in_array('*', $accepts, true)) {
            return ! in_array($childType, ['section', 'column'], true) && $this->has($childType);
        }

        return in_array($childType, $accepts, true);
    }

    /** Payload sent to the builder UI. */
    public function schema(): array
    {
        $elements = [];
        foreach ($this->elements as $type => $el) {
            $elements[$type] = $el->schema();
        }

        return [
            'categories' => self::CATEGORIES,
            'elements' => $elements,
            'icons' => \App\Landing\Support\Icons::all(),
        ];
    }
}
