<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('landing_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('status', 20)->default('draft')->index();
            // Draft working copy. The public site renders the published version snapshot.
            $table->longText('content_json')->nullable();
            $table->longText('settings_json')->nullable();
            $table->longText('seo_json')->nullable();
            $table->longText('tracking_json')->nullable();
            // Encrypted with Laravel's encrypter (model cast). Never part of any JSON snapshot.
            $table->text('capi_access_token')->nullable();
            $table->unsignedBigInteger('published_version_id')->nullable()->index();
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('landing_page_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('landing_page_id')->constrained('landing_pages')->cascadeOnDelete();
            $table->unsignedInteger('version_number');
            $table->string('label', 120)->nullable();
            $table->longText('content_json')->nullable();
            $table->longText('settings_json')->nullable();
            $table->longText('seo_json')->nullable();
            $table->longText('tracking_json')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->nullable();

            $table->unique(['landing_page_id', 'version_number']);
        });

        Schema::create('landing_page_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('thumbnail')->nullable();
            $table->string('category', 60)->default('Custom')->index();
            $table->longText('content_json')->nullable();
            $table->longText('settings_json')->nullable();
            $table->longText('seo_json')->nullable();
            $table->boolean('is_public')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('landing_page_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('disk', 30)->default('public');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime', 100);
            $table->unsignedBigInteger('size')->default(0);
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('alt')->nullable();
            $table->timestamps();
        });

        Schema::create('landing_page_leads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('landing_page_id')->constrained('landing_pages')->cascadeOnDelete();
            $table->string('form_id', 80)->nullable();
            $table->string('name')->nullable();
            $table->string('email')->nullable()->index();
            $table->string('phone', 50)->nullable();
            $table->text('data_json')->nullable();
            $table->string('source')->nullable()->index();
            $table->string('utm_source')->nullable()->index();
            $table->string('utm_medium')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->string('utm_term')->nullable();
            $table->string('utm_content')->nullable();
            $table->text('landing_url')->nullable();
            $table->text('referrer')->nullable();
            $table->string('ip_hash', 64)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->string('status', 20)->default('new')->index();
            $table->timestamp('created_at')->nullable()->index();
        });

        Schema::create('landing_page_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('landing_page_id')->constrained('landing_pages')->cascadeOnDelete();
            $table->string('event_name', 60)->index();
            $table->string('event_id', 80)->index();
            $table->string('element_id', 80)->nullable();
            // pageload | click | form_submit | system
            $table->string('source', 30)->default('pageload');
            $table->string('visitor_hash', 64)->nullable()->index();
            $table->string('utm_source')->nullable();
            $table->text('metadata_json')->nullable();
            $table->timestamp('created_at')->nullable()->index();

            $table->unique(['landing_page_id', 'event_name', 'event_id'], 'lp_events_dedupe_unique');
        });

        Schema::create('landing_page_event_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('landing_page_event_id')->constrained('landing_page_events')->cascadeOnDelete();
            $table->string('channel', 20); // browser | capi
            $table->string('status', 20);  // sent | failed | skipped
            $table->unsignedSmallInteger('response_code')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('landing_page_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->boolean('is_encrypted')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_page_settings');
        Schema::dropIfExists('landing_page_event_deliveries');
        Schema::dropIfExists('landing_page_events');
        Schema::dropIfExists('landing_page_leads');
        Schema::dropIfExists('landing_page_media');
        Schema::dropIfExists('landing_page_templates');
        Schema::dropIfExists('landing_page_versions');
        Schema::dropIfExists('landing_pages');
    }
};
