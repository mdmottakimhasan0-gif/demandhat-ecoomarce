<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class AdminProductController extends Controller
{
    /**
     * Display a listing of the products.
     */
    public function index(Request $request)
    {
        $query = Product::query()->with(['category', 'images']);

        // Filter by Search
        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Filter by Category
        if ($request->category) {
            $query->where('category_id', $request->category);
        }

        // Filter by Status
        if ($request->status) {
            if ($request->status === 'instock')
                $query->where('stock', '>', 5);
            if ($request->status === 'lowstock')
                $query->whereBetween('stock', [1, 5]);
            if ($request->status === 'outofstock')
                $query->where('stock', '<=', 0);
        }

        return Inertia::render('Admin/Product/Products', [
            'products' => $query->latest()->paginate(10)->withQueryString(),
            'categories' => Category::all(),
            'filters' => $request->only(['search', 'category', 'status'])
        ]);
    }

    /**
     * Show the form for creating a new product.
     */
    public function create()
    {
        $categories = Category::all();
        return inertia('Admin/Product/ProductForm', ['categories' => $categories]);
    }



    public function store(Request $request)
    {
        $validated = $request->validate([
            'productName' => 'required|string|max:255',
            'category' => 'required|exists:categories,id',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'bussiness_class' => 'required|in:free,normal,medium,high',
            'productDetails' => 'required|string',
            'initial_rating' => 'nullable|numeric|min:0|max:5',
            'discount' => 'nullable|numeric',
            'colors' => 'nullable|array',
            'colors.*' => 'string|max:100',
            'sizes' => 'nullable|array',
            'sizes.*' => 'string|max:100',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'gallery' => 'nullable|array',
            'gallery.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            'brand' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:50',
            'weight' => 'nullable|numeric',
            'length' => 'nullable|numeric',
            'width' => 'nullable|numeric',
            'specification' => 'nullable|string',
            'quick_view' => 'nullable|string',
            'short_description' => 'nullable|string',
        ], [
            'productName.required' => 'Product Name is required.',
            'category.required' => 'Category is required.',
            'category.exists' => 'Selected category was not found.',
            'price.required' => 'Price is required.',
            'price.numeric' => 'Price must be a valid number.',
            'stock.required' => 'Stock quantity is required.',
            'bussiness_class.required' => 'Delivery class is required.',
            'productDetails.required' => 'Product Details is required.',
            'image.image' => 'Main thumbnail must be an image file.',
            'image.max' => 'Main thumbnail size must not exceed 5MB.',
            'gallery.*.image' => 'Each gallery file must be an image.',
            'gallery.*.max' => 'Each gallery image size must not exceed 5MB.',
        ]);

        return DB::transaction(function () use ($request, $validated) {

            // 1. Handle Primary Image Upload
            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('products', 'public');
            }

            // 2. Advanced SKU Generation
            $category = Category::find($validated['category']);
            $categoryName = $category ? $category->name : 'GEN';
            $prefix = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $categoryName), 0, 3));
            $year = date('y');

            do {
                $random = strtoupper(Str::random(4));
                $sku = "{$prefix}-{$year}-{$random}";
            } while (Product::where('sku', $sku)->exists());

            // Clean variation arrays
            $colors = !empty($validated['colors']) ? array_values(array_filter(array_map('trim', $validated['colors']))) : null;
            $sizes = !empty($validated['sizes']) ? array_values(array_filter(array_map('trim', $validated['sizes']))) : null;

            // 3. Create Product
            $product = Product::create([
                'name' => $validated['productName'],
                'slug' => Str::slug($validated['productName']) . '-' . Str::random(4),
                'category_id' => $validated['category'],
                'sku' => $sku,
                'brand' => $validated['brand'] ?? null,
                'color' => $validated['color'] ?? (!empty($colors) ? $colors[0] : null),
                'colors' => $colors,
                'sizes' => $sizes,
                'weight' => $validated['weight'] ?? null,
                'length' => $validated['length'] ?? null,
                'width' => $validated['width'] ?? null,
                'price' => $validated['price'],
                'initial_rating' => $validated['initial_rating'] ?? 0,
                'stock' => $validated['stock'],
                'description' => $validated['productDetails'],
                'specification' => $validated['specification'] ?? null,
                'image' => $imagePath,
                'quick_view' => $validated['quick_view'] ?? null,
                'short_description' => $validated['short_description'] ?? null,
                'bussiness_class' => $validated['bussiness_class'],
                'discount' => $validated['discount'] ?? 0,
            ]);

            // 4. Handle Gallery Images Upload
            if ($request->hasFile('gallery')) {
                foreach ($request->file('gallery') as $file) {
                    $path = $file->store('products/gallery', 'public');
                    $product->images()->create([
                        'image_path' => $path
                    ]);
                }
            }

            // Bust landing page product and sections cache so the new product appears immediately
            Cache::forget('landing_products');
            Cache::forget('landing_sections');

            return redirect()->to('/admin/products')->with('success', 'Product created successfully!');
        });
    }

    /**
     * Show the form for editing the specified product.
     */
    public function edit(string $id)
    {
        $categories = Category::all();
        $product = Product::with(['category', 'images'])->findOrFail($id);

        return inertia('Admin/Product/EditProduct', [
            'product' => $product,
            'categories' => $categories
        ]);
    }

    public function uploadEditorImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products/description', 'public');
            return response()->json(['url' => asset('storage/' . $path)]);
        }

        return response()->json(['error' => 'Upload failed'], 400);
    }

    /**
     * Update the specified product in storage.
     */
    public function update(Request $request, string $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'productName' => 'required|string|max:255',
            'category' => 'required|exists:categories,id',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'bussiness_class' => 'required|in:free,normal,medium,high',
            'productDetails' => 'required|string',
            'initial_rating' => 'nullable|numeric|min:0|max:5',
            'discount' => 'nullable|numeric',
            'colors' => 'nullable|array',
            'colors.*' => 'string|max:100',
            'sizes' => 'nullable|array',
            'sizes.*' => 'string|max:100',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'gallery' => 'nullable|array',
            'gallery.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            'brand' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:50',
            'weight' => 'nullable|numeric',
            'length' => 'nullable|numeric',
            'width' => 'nullable|numeric',
            'specification' => 'nullable|string',
            'quick_view' => 'nullable|string',
            'short_description' => 'nullable|string',
        ], [
            'productName.required' => 'Product Name is required.',
            'category.required' => 'Category is required.',
            'category.exists' => 'Selected category was not found.',
            'price.required' => 'Price is required.',
            'price.numeric' => 'Price must be a valid number.',
            'stock.required' => 'Stock quantity is required.',
            'bussiness_class.required' => 'Delivery class is required.',
            'productDetails.required' => 'Product Details is required.',
            'image.image' => 'Main thumbnail must be an image file.',
            'image.max' => 'Main thumbnail size must not exceed 5MB.',
            'gallery.*.image' => 'Each gallery file must be an image.',
            'gallery.*.max' => 'Each gallery image size must not exceed 5MB.',
        ]);

        // Clean up unused Tiptap images if applicable
        if (isset($validated['productDetails'])) {
            $this->cleanupUnusedEditorImages($product->description, $validated['productDetails']);
        }
        if (isset($validated['quick_view'])) {
            $this->cleanupUnusedEditorImages($product->quick_view, $validated['quick_view']);
        }
        if (isset($validated['specification'])) {
            $this->cleanupUnusedEditorImages($product->specification, $validated['specification']);
        }

        // Handle Primary Image
        if ($request->hasFile('image')) {
            if ($product->image && Storage::disk('public')->exists($product->image)) {
                Storage::disk('public')->delete($product->image);
            }
            $product->image = $request->file('image')->store('products', 'public');
        }

        // Handle Gallery Images
        if ($request->hasFile('gallery')) {
            foreach ($request->file('gallery') as $file) {
                $path = $file->store('products/gallery', 'public');
                $product->images()->create(['image_path' => $path]);
            }
        }

        if ($product->name !== $validated['productName']) {
            $product->slug = Str::slug($validated['productName']) . '-' . Str::random(4);
        }

        $colors = !empty($validated['colors']) ? array_values(array_filter(array_map('trim', $validated['colors']))) : null;
        $sizes = !empty($validated['sizes']) ? array_values(array_filter(array_map('trim', $validated['sizes']))) : null;

        $product->update([
            'name' => $validated['productName'],
            'category_id' => $validated['category'],
            'brand' => $validated['brand'] ?? $product->brand,
            'color' => $validated['color'] ?? (!empty($colors) ? $colors[0] : $product->color),
            'colors' => $colors,
            'sizes' => $sizes,
            'weight' => $validated['weight'] ?? $product->weight,
            'length' => $validated['length'] ?? $product->length,
            'width' => $validated['width'] ?? $product->width,
            'price' => $validated['price'],
            'stock' => $validated['stock'],
            'initial_rating' => $validated['initial_rating'] ?? 0,
            'description' => $validated['productDetails'],
            'specification' => $validated['specification'] ?? $product->specification,
            'quick_view' => $validated['quick_view'] ?? $product->quick_view,
            'short_description' => $validated['short_description'] ?? $product->short_description,
            'bussiness_class' => $validated['bussiness_class'],
            'discount' => $validated['discount'] ?? 0,
        ]);

        // Bust landing page product and sections cache so the update appears immediately
        Cache::forget('landing_products');
        Cache::forget('landing_sections');

        return redirect()->to('/admin/products')->with('success', 'Product updated successfully!');
    }

    /**
     * Compare old and new HTML, delete images that were removed
     */
    private function cleanupUnusedEditorImages($oldHtml, $newHtml)
    {
        $oldImages = $this->extractImagePaths($oldHtml);
        $newImages = $this->extractImagePaths($newHtml);

        // Images that are in the old list but not in the new list
        $imagesToDelete = array_diff($oldImages, $newImages);

        foreach ($imagesToDelete as $path) {
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }
    }

    /**
     * Helper to get clean paths from <img> tags
     */
    private function extractImagePaths($html)
    {
        if (empty($html))
            return [];
        preg_match_all('/<img [^>]*src="([^"]+)"/i', $html, $matches);

        $paths = [];
        foreach ($matches[1] as $url) {
            if (str_contains($url, '/storage/')) {
                $paths[] = explode('/storage/', $url)[1];
            }
        }
        return $paths;
    }

    /**
     * Remove the specified product from storage.
     */
    public function destroy(string $id)
    {
        $product = Product::with('images')->findOrFail($id);

        // 1. Delete images found inside Tiptap HTML (Description & Quick View)
        $this->deleteImagesFromHtml($product->description);
        $this->deleteImagesFromHtml($product->quick_view);
        $this->deleteImagesFromHtml($product->specification);

        // 2. Delete Primary Image
        if ($product->image && Storage::disk('public')->exists($product->image)) {
            Storage::disk('public')->delete($product->image);
        }

        // 3. Delete Gallery Images
        foreach ($product->images as $img) {
            if (Storage::disk('public')->exists($img->image_path)) {
                Storage::disk('public')->delete($img->image_path);
            }
        }

        // 4. Delete the record from DB
        $product->delete();

        // Bust landing page product cache so deleted product disappears immediately
        Cache::forget('landing_products');
        Cache::forget('landing_sections');

        return redirect()->back()->with('success', 'Product and all associated media deleted.');
    }

    /**
     * Helper function to extract and delete images from HTML strings
     */
    private function deleteImagesFromHtml($html)
    {
        if (empty($html))
            return;

        // Use Regex to find all <img src="..."> tags
        preg_match_all('/<img [^>]*src="([^"]+)"/i', $html, $matches);

        $imageUrls = $matches[1] ?? [];

        foreach ($imageUrls as $url) {
            // We only want to delete images stored on our server
            // Example URL: http://yoursite.com/storage/products/description/abc.jpg
            if (str_contains($url, '/storage/')) {
                // Get the path after "/storage/"
                // Results in: products/description/abc.jpg
                $path = explode('/storage/', $url)[1];

                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }
        }
    }

    /**
     * Helper to delete a single gallery image specifically from edit view.
     */
    public function deleteGalleryImage($imageId)
    {
        $image = ProductImage::findOrFail($imageId);

        // Delete physical file
        if (Storage::disk('public')->exists($image->image_path)) {
            Storage::disk('public')->delete($image->image_path);
        }

        // Delete database record
        $image->delete();

        return redirect()->back()->with('success', 'Gallery image removed.');
    }
}