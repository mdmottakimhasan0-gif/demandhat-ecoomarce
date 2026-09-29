# Landing Page Builder

A visual, drag-and-drop landing page builder for the existing admin panel, with per-page Meta Pixel
and Conversions API tracking, lead capture, versioning and templates.

Admin: **Landing Pages** in the sidebar (`/admin/landing-pages`). Public pages live at `/{slug}`.

## Setup

```bash
composer install                   # dev packages are needed to run the tests
php artisan migrate                # adds 8 new tables, touches nothing existing
php artisan db:seed --class=LandingPageTemplatesSeeder   # optional: 5 starter templates
npm install && npm run build       # builds the admin builder UI
php artisan test                   # or: vendor/bin/pest
```

Optional `.env` values are listed at the bottom of `.env.example`. Secrets are never put in config
files: page/global CAPI tokens are stored encrypted in the database.

## Architecture (where things live)

| Concern | Location |
| --- | --- |
| Element definitions (type, label, defaults, controls, renderer) | `app/Landing/Builder/Elements/*` (one class each) |
| Element registry / control schema (sent to the UI, so new elements need PHP only) | `app/Landing/Builder/ElementRegistry.php`, `Control.php` |
| Builder JSON validation, versioning, id generation | `app/Landing/Builder/ContentNormalizer.php` |
| Responsive CSS (mobile-first: base = mobile, `min-width:768` tablet, `min-width:1025` desktop) | `StyleCompiler.php`, `CssBuilder.php` |
| Server renderer used by the public site, preview **and** the builder canvas | `LandingPageRenderer.php` |
| All sanitisation (HTML, URLs, colours, lengths, CSS) | `app/Landing/Support/Sanitizer.php` |
| Services | `app/Services/Landing/*` |
| Controllers / requests / policies | `app/Http/Controllers/Landing`, `app/Http/Requests/Landing`, `app/Policies/Landing*` |
| Routes | `routes/landing.php` (loaded after `routes/web.php`) |
| Builder UI (React) | `resources/js/landing-builder/*`, `resources/js/Pages/Admin/LandingPages/*` |
| Public runtime (Pixel, forms, tracking; no dependencies, ~6 KB) | `public/vendor/landing/tracker.js` |
| Canvas iframe bridge (selection, drag/drop, shortcuts) | `public/vendor/landing/canvas-bridge.js` |
| Config | `config/landing.php` |

### How the builder works
* The canvas is an **iframe of the real server-rendered page**, so what you edit is what visitors get
  and Desktop/Tablet/Mobile use real media queries. Edits are re-rendered through
  `POST /admin/landing-pages/{id}/render` (debounced) and patched into the iframe.
* Drag & drop is native HTML5 DnD (no dependency): palette to canvas, and reorder / move between
  containers via the handle in the selection toolbar. Nesting rules come from each element's `accepts()`.
* Undo/redo is client-side history (Ctrl+Z / Ctrl+Shift+Z); only the final state is saved.
* Autosave updates the **draft** only (debounced). **Save Draft** and **Publish** create a version.

### Draft vs published
`landing_pages.content_json` is the working draft. **Publish** snapshots draft + settings + SEO +
tracking into `landing_page_versions` and sets `published_version_id`. Visitors only ever see that
snapshot; editing, saving, autosaving or changing tracking never affects the live page until you
publish again. The published version cannot be deleted. Unpublishing takes the page offline
immediately (cache is invalidated).

### Adding an element
1. Create `app/Landing/Builder/Elements/MyElement.php` extending `AbstractElement` (type, label,
   category, `defaults()`, `contentControls()`, `render()`).
2. Register it in `ElementRegistry::__construct()` (or call `register()` from a service provider).

The inspector, drag & drop, sanitising-by-control-type and responsive CSS pick it up automatically.

### Builder JSON (`version: 1`)
```json
{ "version": 1, "sections": [ { "id": "section_ab12cd34ef", "type": "section", "content": {}, "settings": {},
  "children": [ { "id": "heading_...", "type": "heading", "content": {"text": "Hi"}, "settings": {
      "font_size": {"desktop": "56px", "tablet": "42px", "mobile": "30px"} } } ] } ] }
```
Ids are collision-resistant and stable. Old schema versions are upgraded in `ContentNormalizer::migrate()`.

## Order Form (CartFlows-style checkout)
The **Order Form** element (Marketing group) is a one-page checkout that places **real shop orders**
(cash on delivery, guest checkout) through the same rules as the website checkout:

* Pick products from your catalogue in the inspector (search box). Modes: customer picks one, picks
  several, or a fixed bundle. Optional **order bump** add-ons (dashed highlight box) and quantity steppers.
* Prices (including the product discount), stock and the delivery fee always come from the **database**;
  the browser only sends product ids and quantities, and only products configured on the *published*
  page can be ordered. Stock is row-locked in a transaction, so the last unit can never be oversold.
* Delivery fee uses `App\Services\DeliveryFee` (shared with `CheckoutController`, extracted unchanged);
  optional flat fees per area can be set on the element. Phone numbers use the shop's Bangladesh rule and
  a number with an active order is blocked (option, on by default).
* Each order also creates a **lead** (status `converted`, with UTM attribution) and fires a **Purchase**
  event with `value`, `currency`, `contents` - browser Pixel and CAPI share the same `event_id`.
  Phone numbers reach Meta hashed with the `88` country code.
* After ordering: message with `{order}` number, and/or redirect (e.g. `/checkout/success` reuses the
  shop's thank-you page). Cached pages refresh when a product changes.

## Public URL and existing routes
Pages resolve through `Route::fallback()`, which Laravel only consults when **no other route matches**,
so `/about`, `/login`, `/admin`, `/api/*` etc. can never be shadowed. Slugs that equal an existing
route segment, a reserved name or a file/folder in `public/` are rejected. Form/track endpoints live
under `/_landing/...` so they cannot collide with a slug. If the module tables are missing the
fallback returns a normal 404.

## Permissions
Mapped from the existing `users.role` in `config/landing.php` (no permission package added):

| Permission | admin | manager | employee |
| --- | :-: | :-: | :-: |
| `landing_pages.view/create/edit/publish/templates/leads/analytics` | yes | yes | - |
| `landing_pages.delete`, `landing_pages.tracking` (Pixel/CAPI/scripts/custom JS/custom code) | yes | - | - |

The admin routes additionally sit behind the existing `role:admin,manager` middleware.

## Tracking
* **Pixel (browser):** loaded async by `tracker.js` from the page's published tracking config (page
  pixel, or the global one; per-event toggles). `PageView` fires with `eventID`.
* **Conversions API (server):** `MetaConversionsApiService` -> Graph API. PageView, button clicks and
  form submissions send the **same `event_id`** as the browser event so Meta de-duplicates. User data is
  SHA-256 hashed (email/phone/name); IP + user agent are sent as Meta requires and are not stored on events.
* **Never blocks:** CAPI runs after the response (default) or on the queue
  (`LANDING_TRACKING_DISPATCH=queue`). A failure is logged and recorded in
  `landing_page_event_deliveries`; leads and page views are unaffected.
* **Secrets:** the access token is encrypted (`encrypted` cast / `Crypt`), write-only in the UI, excluded
  from JSON snapshots/exports/serialisation, and never included in any page or API response.
* **Element events:** buttons, CTA, WhatsApp/call buttons, pricing and forms have a *Tracking* section.
  The browser reports clicks to `/_landing/{slug}/track`; the server looks the element up in the
  **published** page, so visitors cannot invent events.
* **Attribution:** `utm_*`, referrer, landing URL and `fbclid` are captured into the session on page load
  and attached to leads/events. Unique visitors use an anonymous first-party cookie (hashed).
* **Consent:** set `LANDING_REQUIRE_CONSENT=true` and call `window.LandingConsent.grant()` from your
  cookie banner; nothing is sent to Meta before that.
* The admin *Events* and *Analytics* screens show **internal** events - not Meta Ads metrics.

## Security summary
CSRF on every POST; validation via Form Requests; per-endpoint policies/gates; rate limits
(`landing-forms`, `landing-track`); honeypot + duplicate-submission guard on forms; allow-list HTML
sanitiser, URL/colour/length/CSS validators (nothing from builder JSON reaches a page unvalidated);
unknown elements degrade to a safe fallback; uploads validated by content (JPEG/PNG/WEBP only, no SVG),
stored under random names; signed, expiring, `noindex` draft previews; raw custom code / scripts are
admin-only and cannot be modified by other roles; lead CSV export neutralises spreadsheet formulas.

## Local development notes
* If CAPI calls fail locally with `cURL error 60`, configure `curl.cainfo` in `php.ini` (same cause as the
  existing BD Courier error in `laravel.log`). It does not affect the visitor.
* The `.env` value `APP_URL=http:http://localhost:8000` is malformed; `phpunit.xml` overrides it for tests.
* Not implemented (by design, architecture allows it later): custom domains, A/B tests, sitemap
  (the site has no sitemap system to integrate with).
