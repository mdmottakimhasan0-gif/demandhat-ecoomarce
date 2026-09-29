/*! Landing page runtime: Meta Pixel, click/form tracking, countdowns, animations. No dependencies. */
(function () {
    'use strict';
    var LP = window.__LP || {};
    var STANDARD = ['PageView', 'ViewContent', 'Lead', 'Contact', 'CompleteRegistration', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Schedule'];
    var consentGranted = !LP.consent;
    var queue = [];

    // ---- consent hook ---------------------------------------------------------
    // A cookie banner can call window.LandingConsent.grant() / revoke().
    window.LandingConsent = {
        grant: function () {
            if (consentGranted) return;
            consentGranted = true;
            var q = queue.splice(0);
            q.forEach(function (fn) { fn(); });
            if (LP.consent && LP.eventId && LP.trackUrl && !LP.preview) {
                post(LP.trackUrl, { kind: 'pageview', event_id: LP.eventId, url: location.href });
            }
        },
        revoke: function () { consentGranted = false; }
    };

    function whenAllowed(fn) { consentGranted ? fn() : queue.push(fn); }

    function uuid() {
        if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
        var a = new Uint8Array(16);
        (window.crypto || window.msCrypto).getRandomValues(a);
        a[6] = (a[6] & 15) | 64; a[8] = (a[8] & 63) | 128;
        var h = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
        return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
    }

    // Blank pages carry a csrf meta tag; inside the website layout the XSRF cookie is used instead.
    function csrfHeaders() {
        var m = document.querySelector('meta[name="csrf-token"]');
        if (m && m.getAttribute('content')) return { 'X-CSRF-TOKEN': m.getAttribute('content') };
        var c = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return c ? { 'X-XSRF-TOKEN': decodeURIComponent(c[1]) } : {};
    }

    function post(url, data, isForm) {
        var headers = Object.assign({ 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, csrfHeaders());
        var body;
        if (isForm) { body = data; } else { headers['Content-Type'] = 'application/json'; body = JSON.stringify(data); }
        return fetch(url, { method: 'POST', headers: headers, body: body, credentials: 'same-origin', keepalive: !isForm });
    }

    // ---- Meta Pixel (async, never blocks rendering) ---------------------------
    function loadPixel(id) {
        if (window.fbq) return;
        var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!window._fbq) window._fbq = n;
        n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
        var t = document.createElement('script');
        t.async = true; t.src = 'https://connect.facebook.net/en_US/fbevents.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(t, s);
        window.fbq('init', id);
    }

    function pixelAllows(name) { return !!(LP.pixel && LP.pixel.events && LP.pixel.events[name]); }

    // Fires a browser event with an explicit eventID so Meta can de-duplicate it against the CAPI copy.
    function fire(name, eventId, params) {
        if (LP.preview || !LP.pixel) return;
        params = params || {};
        whenAllowed(function () {
            if (!window.fbq) return;
            if (STANDARD.indexOf(name) > -1) window.fbq('track', name, params, { eventID: eventId });
            else window.fbq('trackCustom', name, params, { eventID: eventId });
        });
    }

    if (LP.pixel && !LP.preview) {
        whenAllowed(function () { loadPixel(LP.pixel.id); });
        if (LP.eventId) {
            if (pixelAllows('PageView')) fire('PageView', LP.eventId);
            if (pixelAllows('ViewContent')) fire('ViewContent', LP.eventId);
        }
    }

    // ---- click tracking -------------------------------------------------------
    document.addEventListener('click', function (e) {
        var el = e.target.closest ? e.target.closest('[data-lp-ev]') : null;
        if (!el || el.tagName === 'FORM' || LP.preview) return;
        var name = el.getAttribute('data-lp-en');
        var eventId = uuid();
        if (el.getAttribute('data-lp-eb') === '1' && pixelAllows(name)) fire(name, eventId);
        if (LP.trackUrl) {
            whenAllowed(function () {
                post(LP.trackUrl, { kind: 'click', element: el.getAttribute('data-lp-ev'), event_id: eventId, url: location.href }).catch(function () {});
            });
        }
    }, true);

    // ---- forms ----------------------------------------------------------------
    var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

    document.addEventListener('submit', function (e) {
        var form = e.target;
        if (!form || !form.tagName || form.tagName.toLowerCase() !== 'form') return;

        var isLp = form.hasAttribute('data-lp-form');
        var hasPhone = form.querySelector('[name*="phone"], [name*="mobile"], [type="tel"], input[placeholder*="01"]');
        var hasName = form.querySelector('[name*="name"], input[placeholder*="নাম"]');

        if (!isLp && !(hasPhone || hasName)) return;
        e.preventDefault();

        if (!isLp) {
            form.setAttribute('data-lp-form', 'custom_order_form');
        }

        var msg = form.querySelector('.lp-form-msg');
        if (!msg) {
            msg = document.createElement('div');
            msg.className = 'lp-form-msg';
            msg.style.cssText = 'margin:12px 0;padding:10px 14px;border-radius:6px;font-size:15px;font-weight:600;text-align:center;';
            var submitBtn = form.querySelector('button[type="submit"], input[type="submit"], button, .btn');
            if (submitBtn) {
                submitBtn.parentNode.insertBefore(msg, submitBtn.nextSibling);
            } else {
                form.appendChild(msg);
            }
        }
        var btn = form.querySelector('button[type="submit"], input[type="submit"], button, .btn');
        var label = btn ? (btn.textContent || btn.value) : '';
        var say = function (text, cls) {
            if (msg) {
                msg.textContent = text;
                msg.className = 'lp-form-msg ' + (cls || '');
                msg.style.display = 'block';
                if (cls === 'is-ok') {
                    msg.style.background = '#dcfce7';
                    msg.style.color = '#15803d';
                    msg.style.border = '1px solid #86efac';
                } else if (cls === 'is-error') {
                    msg.style.background = '#fee2e2';
                    msg.style.color = '#b91c1c';
                    msg.style.border = '1px solid #fca5a5';
                }
            }
        };

        form.querySelectorAll('[data-err]').forEach(function (n) { n.textContent = ''; });

        if (LP.preview || !LP.submitUrl) { say('Form submissions are disabled in preview.', 'is-error'); return; }

        var fd = new FormData(form);
        if (!fd.get('form')) fd.append('form', form.getAttribute('data-lp-form') || 'custom_order_form');

        // Normalize field names if custom form used aliases or id selectors without name attribute
        var isAddrField = function (el) {
            if (!el) return false;
            var s = ((el.id || '') + ' ' + (el.name || '') + ' ' + (el.placeholder || '')).toLowerCase();
            return s.indexOf('addr') > -1 || s.indexOf('ঠিকানা') > -1 || s.indexOf('বাসা') > -1 || s.indexOf('রোড') > -1 || el.tagName.toLowerCase() === 'textarea';
        };

        var isNameField = function (el) {
            if (!el) return false;
            var id = (el.id || '').toLowerCase();
            var nm = (el.name || '').toLowerCase();
            var ph = (el.placeholder || '').toLowerCase();
            return id === 'cname' || id === 'name' || nm === 'name' || nm === 'customer_name' || ph.indexOf('আপনার নাম') > -1 || ph.indexOf('নাম লিখুন') > -1;
        };

        var nameInput = form.querySelector('#cName, [name="name"], [name*="customer_name"], [name*="billing_name"], [name*="fullname"], input[placeholder*="আপনার নাম"], input[placeholder*="নাম লিখুন"], [id*="name" i]');
        if (nameInput && isAddrField(nameInput)) {
            nameInput = form.querySelector('#cName, [name="name"], [name*="customer_name"], [name*="fullname"], input[placeholder*="আপনার নাম"], input[placeholder*="নাম লিখুন"]');
        }
        if (nameInput && !fd.get('name') && nameInput.value) {
            fd.append('name', nameInput.value);
            fd.append('cName', nameInput.value);
        }

        var phoneInput = form.querySelector('#cPhone, [name="phone"], [name*="customer_phone"], [name*="mobile"], [type="tel"], input[placeholder*="01"], [id*="phone" i], [id*="mobile" i]');
        if (phoneInput && !fd.get('phone') && phoneInput.value) {
            fd.append('phone', phoneInput.value);
            fd.append('cPhone', phoneInput.value);
        }

        var addrInput = form.querySelector('#cAddress, [name="address"], [name*="customer_address"], [name*="full_address"], textarea, input[placeholder*="ঠিকানা"], input[placeholder*="বাসা"], input[placeholder*="রোড"], [id*="addr" i], [id*="address" i]');
        if (addrInput && isNameField(addrInput) && addrInput !== nameInput) {
            addrInput = form.querySelector('#cAddress, [name="address"], [name*="customer_address"], textarea, input[placeholder*="ঠিকানা"], input[placeholder*="বাসা"]');
        }
        if (addrInput && addrInput === nameInput) {
            // Never let address input and name input be the same element
            addrInput = form.querySelector('textarea, [name="address"], [name*="customer_address"], input[placeholder*="ঠিকানা"], input[placeholder*="বাসা"], #cAddress');
        }
        if (addrInput && !fd.get('address') && addrInput.value) {
            fd.append('address', addrInput.value);
            fd.append('cAddress', addrInput.value);
        }

        var areaInput = form.querySelector('[name="delivery_area"]:checked, [name="del"]:checked, [name*="del"]:checked, [name*="delivery"]:checked, [name*="area"]:checked, [name*="zone"]:checked, select[name*="area"], select[name*="delivery"], select[name="del"]');
        if (areaInput && (!fd.get('delivery_area') || fd.get('delivery_area') === 'dhaka' || fd.get('delivery_area') === 'outside')) {
            var val = String(areaInput.value || '').toLowerCase();
            var isOutside = /outside|বাইরে|120|outside_dhaka/i.test(val);
            fd.set('delivery_area', isOutside ? 'outside_dhaka' : 'inside_dhaka');
        } else if (!fd.get('delivery_area')) {
            fd.append('delivery_area', 'inside_dhaka');
        }

        // Package / Quantity support for custom forms (e.g. 1 piece vs 2 pieces)
        var pkgInput = form.querySelector('input[name="pkg"]:checked, input[name="package"]:checked, input[name="qty"]:checked, select[name="pkg"], select[name="package"], select[name="qty"], input[name="quantity"]');
        if (pkgInput) {
            var pkgQty = Math.max(1, parseInt(pkgInput.value, 10) || 1);
            var pickInput = form.querySelector('input[name="pick[]"], input[name="product_id"]');
            if (pickInput && pickInput.value) {
                fd.append('qty[' + pickInput.value + ']', String(pkgQty));
            }
        }

        var eventId = uuid();
        fd.append('event_id', eventId);
        fd.append('landing_url', location.href);
        if (document.referrer) fd.append('referrer', document.referrer);
        var qs = new URLSearchParams(location.search);
        UTM.forEach(function (k) { if (qs.get(k)) fd.append(k, qs.get(k)); });

        if (btn) {
            btn.disabled = true;
            if (btn.tagName.toLowerCase() === 'input') btn.value = 'অর্ডার প্রক্রিয়াধীন...';
            else btn.textContent = 'অর্ডার প্রক্রিয়াধীন...';
        }
        say('');

        post(LP.submitUrl, fd, true).then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (body) { return { status: res.status, body: body }; });
        }).then(function (r) {
            if (r.status === 200 && r.body.ok) {
                say(r.body.message || 'ধন্যবাদ! আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।', 'is-ok');
                form.reset();
                var ev = r.body.event;
                if (ev && ev.browser) fire(ev.name, ev.id, ev.custom);
                if (r.body.redirect) setTimeout(function () { location.href = r.body.redirect; }, 700);
            } else if (r.status === 422 && r.body.errors) {
                Object.keys(r.body.errors).forEach(function (k) {
                    var slot = form.querySelector('[data-err="' + k + '"]');
                    if (slot) slot.textContent = r.body.errors[k][0];
                });
                say('অনুগ্রহ করে সঠিক তথ্য পূরণ করুন।', 'is-error');
            } else if (r.status === 419) {
                say('Your session expired. Please refresh the page and try again.', 'is-error');
            } else if (r.status === 429) {
                say('Too many attempts. Please wait a moment and try again.', 'is-error');
            } else {
                say('Something went wrong. Please try again.', 'is-error');
            }
        }).catch(function () {
            say('Something went wrong. Please try again.', 'is-error');
        }).then(function () {
            if (btn) {
                btn.disabled = false;
                if (btn.tagName.toLowerCase() === 'input') btn.value = label;
                else btn.textContent = label;
            }
        });
    });

    // ---- order form (live totals) ---------------------------------------------
    // The server recomputes every price, stock level and the delivery fee on submit;
    // this only mirrors DeliveryFee::calculate() so the customer sees the same total.
    document.querySelectorAll('form[data-lp-order]').forEach(function (form) {
        var cfg = {};
        try { cfg = JSON.parse(form.getAttribute('data-lp-order')); } catch (e) { return; }
        var btn = form.querySelector('button[type="submit"]');
        var base = btn ? btn.getAttribute('data-of-label') : '';
        var money = function (n) { return cfg.sym + Math.round(n).toLocaleString('en-US'); };
        var out = function (k, v) { var el = form.querySelector('[data-of="' + k + '"]'); if (el) el.textContent = v; };

        function calc() {
            var sub = 0, hi = 0, me = 0, count = 0;
            form.querySelectorAll('input[name="pick[]"]').forEach(function (i) {
                var q = form.querySelector('input[name="qty[' + i.value + ']"]');
                var on = i.checked;
                if (q) q.disabled = !on;
                if (!on) return;
                var qty = q ? Math.max(1, parseInt(q.value, 10) || 1) : 1;
                var price = parseFloat(i.getAttribute('data-price')) || 0;
                var cls = i.getAttribute('data-class');
                sub += price * qty; count++;
                if (cls === 'high') hi += qty; else if (cls === 'medium') me += qty;
            });
            var area = form.elements.delivery_area ? form.elements.delivery_area.value : 'inside_dhaka';
            var idx = area === 'inside_dhaka' ? 0 : 1;
            var fee = 0;
            if (count) {
                if (cfg.fixed && cfg.fixed[idx] !== null && cfg.fixed[idx] !== undefined) fee = cfg.fixed[idx];
                else if (hi) fee = hi * cfg.t.high[idx];
                else if (me) fee = me * cfg.t.medium[idx];
                else fee = cfg.t.base[idx];
            }
            out('subtotal', money(sub)); out('delivery', money(fee)); out('total', money(sub + fee));
            if (btn && !btn.disabled && base) btn.textContent = count ? base + ' - ' + money(sub + fee) : base;
        }
        form.addEventListener('change', calc);
        form.addEventListener('input', function (e) { if (e.target.type === 'number') calc(); });
        form.addEventListener('reset', function () { setTimeout(calc, 0); });
        calc();
    });

    // ---- countdown ------------------------------------------------------------
    document.querySelectorAll('[data-lp-countdown]').forEach(function (el) {
        var target = Date.parse(el.getAttribute('data-lp-countdown'));
        if (!target) return;
        var nums = {};
        el.querySelectorAll('[data-cd]').forEach(function (n) { nums[n.getAttribute('data-cd')] = n; });
        var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
        var timer;
        function tick() {
            var diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
            // Only divide down through units that actually exist in the markup (some may be
            // hidden via the element's "Show days/hours/..." toggles). Whatever a hidden unit
            // would have held rolls forward into the next visible one instead of being lost -
            // e.g. hiding "days" makes hours count past 24.
            var remaining = diff;
            if (nums.days) { nums.days.textContent = pad(Math.floor(remaining / 86400)); remaining %= 86400; }
            if (nums.hours) { nums.hours.textContent = pad(Math.floor(remaining / 3600)); remaining %= 3600; }
            if (nums.minutes) { nums.minutes.textContent = pad(Math.floor(remaining / 60)); remaining %= 60; }
            if (nums.seconds) { nums.seconds.textContent = pad(remaining); }
            if (diff === 0) {
                clearInterval(timer);
                var text = el.getAttribute('data-expired');
                if (text) el.textContent = text;
            }
        }
        tick();
        timer = setInterval(tick, 1000);
    });

    // ---- generic slider (testimonial slider, image slider, ...) ---------------
    // Any element with [data-lp-slider]/[data-ts-track] gets this behaviour - the element
    // type doesn't matter to the runtime. Base markup is a swipeable, CSS scroll-snap strip
    // (works with zero JS); once this runs it switches to transform-based sliding so the
    // arrows/dots/auto-play work too.
    document.querySelectorAll('[data-lp-slider]').forEach(function (root) {
        var track = root.querySelector('[data-ts-track]');
        var slides = track ? track.children : [];
        if (!track || slides.length < 2) return;

        root.classList.remove('lp-ts-no-js');
        var index = 0;
        var dots = root.querySelectorAll('[data-ts-dot]');
        var timer;

        function go(i) {
            index = (i + slides.length) % slides.length;
            track.style.transform = 'translateX(-' + (slides[0].getBoundingClientRect().width * index) + 'px)';
            dots.forEach(function (d, di) { d.classList.toggle('is-active', di === index); });
        }

        function resetTimer() {
            clearInterval(timer);
            if (root.getAttribute('data-ts-autoplay') === '1') {
                timer = setInterval(function () { go(index + 1); }, parseInt(root.getAttribute('data-ts-interval'), 10) || 5000);
            }
        }

        root.querySelectorAll('[data-ts-prev]').forEach(function (b) { b.addEventListener('click', function () { go(index - 1); resetTimer(); }); });
        root.querySelectorAll('[data-ts-next]').forEach(function (b) { b.addEventListener('click', function () { go(index + 1); resetTimer(); }); });
        dots.forEach(function (d) { d.addEventListener('click', function () { go(parseInt(d.getAttribute('data-ts-dot'), 10) || 0); resetTimer(); }); });
        root.addEventListener('mouseenter', function () { clearInterval(timer); });
        root.addEventListener('mouseleave', resetTimer);
        window.addEventListener('resize', function () { go(index); });

        go(0);
        resetTimer();
    });

    // ---- entrance animations --------------------------------------------------
    var animated = document.querySelectorAll('.lp-anim');
    if (animated.length) {
        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('lp-in'); io.unobserve(en.target); } });
            }, { threshold: 0.12 });
            animated.forEach(function (n) { io.observe(n); });
        } else {
            animated.forEach(function (n) { n.classList.add('lp-in'); });
        }
    }
})();
