<?php

namespace App\Http\Controllers\Landing;

use App\Http\Controllers\Controller;
use App\Landing\Builder\Elements\OrderFormElement;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/** Product lookup for the Order Form element's product picker. */
class LandingProductController extends Controller
{
    public function search(Request $request)
    {
        Gate::authorize('landing_pages.edit');

        $ids = collect(explode(',', (string) $request->query('ids')))->map(fn ($i) => (int) $i)->filter()->take(20);
        $term = '%'.addcslashes((string) $request->query('q'), '%_\\').'%';

        $query = Product::with('images')->select('id', 'name', 'price', 'discount', 'stock', 'image', 'sku')
            ->when($ids->isNotEmpty(), fn ($q) => $q->whereIn('id', $ids))
            ->when($ids->isEmpty(), fn ($q) => $q->where(fn ($w) => $w->where('name', 'like', $term)->orWhere('sku', 'like', $term)))
            ->orderBy('name')->limit(15);

        return response()->json($query->get()->map(function (Product $p) {
            $mainImg = OrderFormElement::productImageUrl($p);
            $gallery = $p->images->map(fn ($img) => OrderFormElement::productImageUrl((object)['image' => $img->image_path, 'images' => collect()]))->filter()->values()->all();
            $allImgs = array_values(array_filter(array_merge([$mainImg], $gallery)));

            return [
                'id' => $p->id,
                'name' => $p->name,
                'price' => OrderFormElement::unitPrice($p),
                'original_price' => (int) round((float) $p->price),
                'discount' => (float) ($p->discount ?: 0),
                'stock' => (int) $p->stock,
                'image' => $mainImg,
                'gallery' => $gallery,
                'all_images' => $allImgs,
            ];
        }));
    }
}
