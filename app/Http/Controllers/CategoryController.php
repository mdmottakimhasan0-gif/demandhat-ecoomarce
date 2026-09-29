<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;



class CategoryController extends Controller
{
    public function createCategory()
    {
        $categories = Category::all();
        return inertia('Admin/CategoryForm', compact('categories'));
    }

    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:500',
        ]);

        $path = null;
        if ($request->hasFile('photo')) {
            // Stores in storage/app/public/categories
            $path = $request->file('photo')->store('categories', 'public');
        }

        Category::create([
            'name' => $request->name,
            'photo' => $path,
        ]);

        // Bust caches so customers see the new category immediately
        Cache::forget('landing_categories');
        Cache::forget('all_categories_with_count');

        return redirect()->back()->with('success', 'Category created successfully!');
    }


    public function getAllCategory()
    {
        $categories = Category::paginate(10);

        return inertia('Admin/CategoriesList', ['categories' => $categories]);
    }


    public function destroyCategory($id)
    {
        Category::where('id', $id)->delete();

        // Bust caches so deleted category disappears immediately
        Cache::forget('landing_categories');
        Cache::forget('all_categories_with_count');

        return redirect()->back()->with('success', 'Category deleted successfully!');
    }

    public function editParentCategory($id)
    {
        $category = Category::findOrFail($id);
        return inertia('Admin/EditCategory', compact('category'));
    }

    public function updateCategory(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $id,
            'photo' => 'nullable|image|max:500',
        ]);

        $category->name = $request->name;

        if ($request->hasFile('photo')) {
            // Delete old photo if it exists
            if ($category->photo) {
                Storage::disk('public')->delete($category->photo);
            }
            // Store new photo
            $category->photo = $request->file('photo')->store('categories', 'public');
        }

        $category->save();

        // Bust caches so updated category name/photo appears immediately
        Cache::forget('landing_categories');
        Cache::forget('all_categories_with_count');

        return redirect('/admin/categories')->with('success', 'Updated successfully');
    }

}
