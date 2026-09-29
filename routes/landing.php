<?php

use App\Http\Controllers\Landing\LandingAnalyticsController;
use App\Http\Controllers\Landing\LandingEventController;
use App\Http\Controllers\Landing\LandingLeadController;
use App\Http\Controllers\Landing\LandingMediaController;
use App\Http\Controllers\Landing\LandingPageController;
use App\Http\Controllers\Landing\LandingProductController;
use App\Http\Controllers\Landing\LandingPublicController;
use App\Http\Controllers\Landing\LandingSettingsController;
use App\Http\Controllers\Landing\LandingTemplateController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Landing Page Builder routes (loaded after routes/web.php)
|--------------------------------------------------------------------------
*/

// ---------------------------------------------------------------- admin ----
// Same guard as the rest of the admin area; each route additionally enforces
// a landing_pages.* permission via policies / gates (see config/landing.php).
Route::middleware(['auth', 'role:admin,manager'])
    ->prefix('admin/landing-pages')
    ->name('admin.landing.')
    ->group(function () {
        Route::get('/', [LandingPageController::class, 'index'])->name('index');
        Route::get('/create', [LandingPageController::class, 'create'])->name('create');
        Route::post('/', [LandingPageController::class, 'store'])->name('store');
        Route::post('/import', [LandingPageController::class, 'import'])->name('import');

        // Templates
        Route::get('/templates', [LandingTemplateController::class, 'index'])->name('templates.index');
        Route::post('/templates', [LandingTemplateController::class, 'store'])->name('templates.store');
        Route::post('/templates/import', [LandingTemplateController::class, 'import'])->name('templates.import');
        Route::put('/templates/{template}', [LandingTemplateController::class, 'update'])->name('templates.update')->whereNumber('template');
        Route::get('/templates/{template}/export', [LandingTemplateController::class, 'export'])->name('templates.export')->whereNumber('template');
        Route::post('/templates/{template}/duplicate', [LandingTemplateController::class, 'duplicate'])->name('templates.duplicate')->whereNumber('template');
        Route::post('/templates/{template}/use', [LandingTemplateController::class, 'use'])->name('templates.use')->whereNumber('template');
        Route::delete('/templates/{template}', [LandingTemplateController::class, 'destroy'])->name('templates.destroy')->whereNumber('template');

        // Template design editor: the same visual builder pages use, saving onto the template itself.
        Route::get('/templates/{template}/edit', [LandingTemplateController::class, 'edit'])->name('templates.edit')->whereNumber('template');
        Route::get('/templates/{template}/canvas', [LandingTemplateController::class, 'canvas'])->name('templates.canvas')->whereNumber('template');
        Route::post('/templates/{template}/render', [LandingTemplateController::class, 'render'])->name('templates.render')->whereNumber('template');
        Route::post('/templates/{template}/save', [LandingTemplateController::class, 'save'])->name('templates.save')->whereNumber('template');
        Route::post('/templates/{template}/autosave', [LandingTemplateController::class, 'autosave'])->name('templates.autosave')->whereNumber('template');
        Route::post('/templates/{template}/preview-link', [LandingTemplateController::class, 'previewLink'])->name('templates.preview-link')->whereNumber('template');

        // Leads
        Route::get('/leads', [LandingLeadController::class, 'index'])->name('leads.index');
        Route::get('/leads/export', [LandingLeadController::class, 'export'])->name('leads.export');
        Route::get('/leads/{lead}', [LandingLeadController::class, 'show'])->name('leads.show')->whereNumber('lead');
        Route::patch('/leads/{lead}', [LandingLeadController::class, 'update'])->name('leads.update')->whereNumber('lead');
        Route::delete('/leads/{lead}', [LandingLeadController::class, 'destroy'])->name('leads.destroy')->whereNumber('lead');

        // Events, analytics, media, global settings
        Route::get('/products/search', [LandingProductController::class, 'search'])->name('products.search');
        Route::get('/events', [LandingEventController::class, 'index'])->name('events');
        Route::get('/analytics', [LandingAnalyticsController::class, 'index'])->name('analytics');
        Route::get('/media', [LandingMediaController::class, 'index'])->name('media.index');
        Route::get('/media/list', [LandingMediaController::class, 'list'])->name('media.list');
        Route::post('/media', [LandingMediaController::class, 'store'])->name('media.store');
        Route::patch('/media/{media}', [LandingMediaController::class, 'update'])->name('media.update')->whereNumber('media');
        Route::delete('/media/{media}', [LandingMediaController::class, 'destroy'])->name('media.destroy')->whereNumber('media');
        Route::get('/tracking', [LandingSettingsController::class, 'tracking'])->name('tracking');
        Route::put('/tracking', [LandingSettingsController::class, 'updateTracking'])->name('tracking.global.update');
        Route::get('/settings', [LandingSettingsController::class, 'settings'])->name('settings');
        Route::put('/settings', [LandingSettingsController::class, 'updateSettings'])->name('settings.update');

        // A single page
        Route::prefix('{landingPage}')->whereNumber('landingPage')->group(function () {
            Route::get('/builder', [LandingPageController::class, 'builder'])->name('builder');
            Route::get('/canvas', [LandingPageController::class, 'canvas'])->name('canvas');
            Route::post('/render', [LandingPageController::class, 'render'])->name('render');
            Route::post('/save', [LandingPageController::class, 'save'])->name('save');
            Route::post('/autosave', [LandingPageController::class, 'autosave'])->name('autosave');
            Route::post('/publish', [LandingPageController::class, 'publish'])->name('publish');
            Route::post('/unpublish', [LandingPageController::class, 'unpublish'])->name('unpublish');
            Route::post('/duplicate', [LandingPageController::class, 'duplicate'])->name('duplicate');
            Route::post('/preview-link', [LandingPageController::class, 'previewLink'])->name('preview-link');
            Route::get('/export', [LandingPageController::class, 'export'])->name('export');
            Route::put('/tracking', [LandingPageController::class, 'updateTracking'])->name('tracking.update');
            Route::get('/versions', [LandingPageController::class, 'versions'])->name('versions');
            Route::post('/versions/{version}/restore', [LandingPageController::class, 'restoreVersion'])->name('versions.restore')->whereNumber('version');
            Route::delete('/versions/{version}', [LandingPageController::class, 'destroyVersion'])->name('versions.destroy')->whereNumber('version');
            Route::delete('/', [LandingPageController::class, 'destroy'])->name('destroy');
        });
    });

// --------------------------------------------------------------- public ----
// Namespaced under /_landing so they can never collide with a landing slug.
Route::prefix('_landing')->group(function () {
    Route::get('/preview/{landingPage}', [LandingPublicController::class, 'preview'])
        ->middleware('signed')->name('landing.preview')->whereNumber('landingPage');
    Route::get('/template-preview/{template}', [LandingPublicController::class, 'templatePreview'])
        ->middleware('signed')->name('landing.template-preview')->whereNumber('template');

    Route::post('/{slug}/submit', [LandingPublicController::class, 'submit'])
        ->middleware('throttle:landing-forms')->name('landing.submit');
    Route::post('/{slug}/track', [LandingPublicController::class, 'track'])
        ->middleware('throttle:landing-track')->name('landing.track');
});

// Landing pages live at the site root: /{slug}. A fallback route is only consulted when
// no other route matched, so every existing URL keeps working exactly as before.
Route::fallback([LandingPublicController::class, 'fallback']);
