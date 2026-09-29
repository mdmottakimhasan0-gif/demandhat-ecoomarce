/*! Builder canvas bridge. Runs inside the canvas iframe (same origin as the admin).
 *  - patches server-rendered HTML/CSS sent by the builder
 *  - reports selection / context menu / keyboard shortcuts / drops back to the builder
 *  Drag state is shared through window.parent.__lpDrag = {kind:'new'|'move', type, id?}
 */
(function () {
    'use strict';
    var root = document.getElementById('lp-root');
    var cssEl = document.getElementById('lp-css');
    var fontsEl = document.getElementById('lp-fonts');
    var line = document.getElementById('lp-drop-line');
    var toolbar = null;
    var selectedId = null;
    var accepts = {};          // parentType -> ['*'] | [types]
    var labels = {};           // type -> label
    var lastDropOutline = null;

    function send(msg) { window.parent.postMessage(Object.assign({ lp: true }, msg), window.location.origin); }
    function dragState() { try { return window.parent.__lpDrag || null; } catch (e) { return null; } }

    // ---- DOM helpers ---------------------------------------------------------
    function lpEl(el) { return el && el.closest ? el.closest('[data-lp-id]') : null; }
    function byId(id) { return id ? root.querySelector('[data-lp-id="' + cssEsc(id) + '"]') : null; }
    function cssEsc(s) { return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/"/g, '\\"'); }
    function parentLp(el) { return el.parentElement ? lpEl(el.parentElement) : null; }
    function lpChildren(parentEl) {
        var scope = parentEl || root;
        var out = [];
        scope.querySelectorAll('[data-lp-id]').forEach(function (n) {
            if (n !== parentEl && parentLp(n) === parentEl) out.push(n);
        });
        return out;
    }
    function typeOf(el) { return el ? el.getAttribute('data-lp-type') : null; }

    function canAccept(parentType, childType) {
        if (parentType === null) return childType === 'section';
        var a = accepts[parentType];
        if (!a || !a.length) return false;
        if (a.indexOf('*') > -1) return childType !== 'section' && childType !== 'column';
        return a.indexOf(childType) > -1;
    }

    // ---- patching ------------------------------------------------------------
    function patch(m) {
        var y = window.scrollY;
        cssEl.textContent = m.css || '';
        if (fontsEl) {
            if (m.fontsUrl) { if (fontsEl.getAttribute('href') !== m.fontsUrl) fontsEl.setAttribute('href', m.fontsUrl); fontsEl.disabled = false; }
            else { fontsEl.disabled = true; }
        }
        document.body.className = 'lp-body lp-editing ' + (m.bodyClass || '');
        root.innerHTML = m.html || '';

        // Execute scripts inside custom code blocks
        try {
            var scripts = root.querySelectorAll('script');
            scripts.forEach(function (oldScript) {
                var newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(function (attr) {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.textContent = oldScript.textContent;
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
        } catch (e) {
            console.warn('Canvas custom script execution warning:', e);
        }

        window.scrollTo(0, y);
        mark(selectedId);
    }

    function mark(id) {
        var prev = root.querySelector('[data-lp-selected]');
        if (prev) prev.removeAttribute('data-lp-selected');
        selectedId = id || null;
        var el = byId(selectedId);
        if (el) el.setAttribute('data-lp-selected', '');
        placeToolbar();
        placeSpacing();
        renderRuler();
    }

    // ---- selection toolbar ---------------------------------------------------
    function buildToolbar() {
        toolbar = document.createElement('div');
        toolbar.id = 'lp-toolbar';
        toolbar.hidden = true;
        toolbar.innerHTML =
            '<span class="lp-tb-handle" draggable="true" title="Drag to move">&#10303;</span>' +
            '<span class="lp-tb-label"></span>' +
            '<button type="button" data-act="parent" title="Select parent">&#8593;</button>' +
            '<button type="button" data-act="duplicate" title="Duplicate">&#10064;</button>' +
            '<button type="button" data-act="menu" title="More">&#8942;</button>' +
            '<button type="button" data-act="delete" title="Delete">&#10005;</button>';
        document.body.appendChild(toolbar);

        toolbar.addEventListener('click', function (e) {
            var b = e.target.closest('button[data-act]');
            if (!b || !selectedId) return;
            e.preventDefault(); e.stopPropagation();
            var act = b.getAttribute('data-act');
            if (act === 'menu') {
                var r = b.getBoundingClientRect();
                send({ type: 'context', id: selectedId, x: r.left, y: r.bottom });
            } else {
                send({ type: 'action', action: act, id: selectedId });
            }
        });

        var handle = toolbar.querySelector('.lp-tb-handle');
        handle.addEventListener('dragstart', function (e) {
            var el = byId(selectedId);
            if (!el) { e.preventDefault(); return; }
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/x-lp-move', selectedId);
            e.dataTransfer.setData('text/plain', selectedId);
            try { e.dataTransfer.setDragImage(el, 12, 12); } catch (err) { /* ignore */ }
            try { window.parent.__lpDrag = { kind: 'move', type: typeOf(el), id: selectedId }; } catch (err) { /* ignore */ }
            document.body.classList.add('lp-dragging');
        });
        handle.addEventListener('dragend', endDrag);
    }

    function placeToolbar() {
        if (!toolbar) buildToolbar();
        var el = byId(selectedId);
        if (!el) { toolbar.hidden = true; return; }
        var r = el.getBoundingClientRect();
        toolbar.hidden = false;
        toolbar.querySelector('.lp-tb-label').textContent = labels[typeOf(el)] || typeOf(el) || '';
        var top = r.top + window.scrollY - toolbar.offsetHeight;
        if (top < window.scrollY) top = r.top + window.scrollY + 2;
        toolbar.style.top = Math.max(0, top) + 'px';
        toolbar.style.left = Math.max(0, Math.min(r.left + window.scrollX, document.documentElement.clientWidth - toolbar.offsetWidth - 4)) + 'px';
    }

    // ---- spacing / resize handles ---------------------------------------------
    // Mouse-drag handles on the selected element: orange dots = padding (drag toward the
    // element's centre to add, away to remove), blue dots = margin (drag away to add, toward
    // to remove), blue bars/corner = width / min-height. Live visual feedback is applied as
    // inline styles on the element itself while dragging; on mouseup the final px value is
    // sent to the builder, which commits it through the same code path the Style panel uses -
    // so the panel's own inputs, undo history and autosave all pick it up automatically.
    var spacing = null, badge = null, dragInfo = null;
    var SIDES = ['top', 'right', 'bottom', 'left'];

    function px(v) { return parseFloat(v) || 0; }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function buildSpacing() {
        spacing = document.createElement('div');
        spacing.id = 'lp-spacing';
        spacing.hidden = true;
        var html = '';
        SIDES.forEach(function (s) { html += '<div class="lp-hd lp-pad" data-kind="padding" data-side="' + s + '" title="Drag to adjust padding-' + s + '"></div>'; });
        SIDES.forEach(function (s) { html += '<div class="lp-hd lp-mar" data-kind="margin" data-side="' + s + '" title="Drag to adjust margin-' + s + '"></div>'; });
        html += '<div class="lp-hd lp-rs lp-rs-e" data-kind="width" title="Drag to resize width"></div>';
        html += '<div class="lp-hd lp-rs lp-rs-s" data-kind="height" title="Drag to resize height"></div>';
        html += '<div class="lp-hd lp-rs lp-rs-se" data-kind="corner" title="Drag to resize width and height"></div>';
        spacing.innerHTML = html;
        document.body.appendChild(spacing);
        spacing.addEventListener('mousedown', onHandleDown);

        badge = document.createElement('div');
        badge.id = 'lp-hd-badge';
        badge.hidden = true;
        document.body.appendChild(badge);
    }

    function placeSpacing() {
        if (dragInfo) return; // handles stay put while actively dragging one of them
        if (!spacing) buildSpacing();
        var el = byId(selectedId);
        if (!el) { spacing.hidden = true; return; }
        var r = el.getBoundingClientRect();
        var cs = getComputedStyle(el);
        var x = r.left + window.scrollX, y = r.top + window.scrollY;
        var pad = { top: px(cs.paddingTop), right: px(cs.paddingRight), bottom: px(cs.paddingBottom), left: px(cs.paddingLeft) };
        var mar = { top: px(cs.marginTop), right: px(cs.marginRight), bottom: px(cs.marginBottom), left: px(cs.marginLeft) };

        spacing.hidden = false;
        var at = function (sel, left, top) {
            var n = spacing.querySelector(sel);
            if (n) { n.style.left = left + 'px'; n.style.top = top + 'px'; }
        };
        at('.lp-pad[data-side="top"]', x + r.width / 2 - 4, y + pad.top / 2 - 4);
        at('.lp-pad[data-side="bottom"]', x + r.width / 2 - 4, y + r.height - pad.bottom / 2 - 4);
        at('.lp-pad[data-side="left"]', x + pad.left / 2 - 4, y + r.height / 2 - 4);
        at('.lp-pad[data-side="right"]', x + r.width - pad.right / 2 - 4, y + r.height / 2 - 4);

        at('.lp-mar[data-side="top"]', x + r.width / 2 - 4, y - Math.max(mar.top / 2, 6) - 4);
        at('.lp-mar[data-side="bottom"]', x + r.width / 2 - 4, y + r.height + Math.max(mar.bottom / 2, 6) - 4);
        at('.lp-mar[data-side="left"]', x - Math.max(mar.left / 2, 6) - 4, y + r.height / 2 - 4);
        at('.lp-mar[data-side="right"]', x + r.width + Math.max(mar.right / 2, 6) - 4, y + r.height / 2 - 4);

        at('.lp-rs-e', x + r.width - 3, y + r.height / 2 - 12);
        at('.lp-rs-s', x + r.width / 2 - 12, y + r.height - 3);
        at('.lp-rs-se', x + r.width - 6, y + r.height - 6);
    }

    function showBadge(e, text, matched) {
        badge.hidden = false;
        badge.textContent = text;
        badge.classList.toggle('is-snap', !!matched);
        badge.style.left = (e.clientX + window.scrollX + 14) + 'px';
        badge.style.top = (e.clientY + window.scrollY - 12) + 'px';
    }

    // ---- snapping: land on a 4px grid, and snap-align to the parent's own value for the
    // same side/property (shows a magenta guide line across the parent when it matches). ----
    var SNAP_TOL = 4;
    var guideLine = null;

    function grid(v) { return Math.max(0, Math.round(v / 4) * 4); }

    function snap(v, extra) {
        var best = grid(v), matched = null;
        (extra || []).forEach(function (cand) {
            if (cand != null && Math.abs(v - cand) <= SNAP_TOL) { best = cand; matched = cand; }
        });
        return { value: Math.max(0, Math.round(best)), matched: matched !== null };
    }

    function parentBoxValue(el, prop, side) {
        var p = parentLp(el);
        if (!p) return null;
        return px(getComputedStyle(p)[prop + cap(side)]);
    }

    function ensureGuide() {
        if (!guideLine) { guideLine = document.createElement('div'); guideLine.id = 'lp-snap-guide'; guideLine.hidden = true; document.body.appendChild(guideLine); }
        return guideLine;
    }

    /** Draw a line across the parent's own edge on `side` - shown when a drag snaps to match it. */
    function showParentGuide(el, side) {
        var p = parentLp(el);
        if (!p) return;
        var pr = p.getBoundingClientRect();
        var g = ensureGuide();
        g.hidden = false;
        if (side === 'top' || side === 'bottom') {
            var y = (side === 'top' ? pr.top : pr.bottom) + window.scrollY;
            g.style.cssText = 'left:' + (pr.left + window.scrollX) + 'px;top:' + y + 'px;width:' + pr.width + 'px;height:1px';
        } else {
            var x = (side === 'left' ? pr.left : pr.right) + window.scrollX;
            g.style.cssText = 'left:' + x + 'px;top:' + (pr.top + window.scrollY) + 'px;width:1px;height:' + pr.height + 'px';
        }
    }

    function hideGuide() { if (guideLine) guideLine.hidden = true; }

    function onHandleDown(e) {
        var t = e.target.closest('.lp-hd');
        if (!t || !selectedId) return;
        e.preventDefault();
        e.stopPropagation();
        var el = byId(selectedId);
        if (!el) return;
        var kind = t.getAttribute('data-kind');
        var side = t.getAttribute('data-side');
        var cs = getComputedStyle(el);
        var r = el.getBoundingClientRect();
        dragInfo = {
            kind: kind, side: side, el: el, value: 0,
            startX: e.clientX, startY: e.clientY,
            startPad: kind === 'padding' ? px(cs['padding' + cap(side)]) : 0,
            startMar: kind === 'margin' ? px(cs['margin' + cap(side)]) : 0,
            startW: r.width, startH: r.height,
        };
        document.body.classList.add('lp-hd-dragging');
        document.addEventListener('mousemove', onHandleMove);
        document.addEventListener('mouseup', onHandleUp);
    }

    var PAD_SIGN = { top: 1, bottom: -1, left: 1, right: -1 }; // drag toward centre = more padding
    var MAR_SIGN = { top: -1, bottom: 1, left: -1, right: 1 }; // drag away from box = more margin

    function onHandleMove(e) {
        if (!dragInfo) return;
        var dx = e.clientX - dragInfo.startX, dy = e.clientY - dragInfo.startY;
        var el = dragInfo.el, val, matched = false, isVert = dragInfo.side === 'top' || dragInfo.side === 'bottom';

        if (dragInfo.kind === 'padding' || dragInfo.kind === 'margin') {
            var sign = dragInfo.kind === 'padding' ? PAD_SIGN : MAR_SIGN;
            var start = dragInfo.kind === 'padding' ? dragInfo.startPad : dragInfo.startMar;
            var raw = Math.max(0, start + sign[dragInfo.side] * (isVert ? dy : dx));
            var s = snap(raw, [parentBoxValue(el, dragInfo.kind, dragInfo.side)]);
            val = s.value;
            matched = s.matched;
            el.style[dragInfo.kind + cap(dragInfo.side)] = val + 'px';
            showBadge(e, cap(dragInfo.kind) + ' ' + dragInfo.side + ': ' + val + 'px' + (matched ? ' – matches parent' : ''), matched);
            if (matched) showParentGuide(el, dragInfo.side); else hideGuide();
        } else if (dragInfo.kind === 'width') {
            val = grid(Math.max(20, dragInfo.startW + dx));
            el.style.width = val + 'px';
            showBadge(e, 'Width: ' + val + 'px');
            hideGuide();
        } else if (dragInfo.kind === 'height') {
            val = grid(Math.max(20, dragInfo.startH + dy));
            el.style.minHeight = val + 'px';
            showBadge(e, 'Height: ' + val + 'px');
            hideGuide();
        } else if (dragInfo.kind === 'corner') {
            var w = grid(Math.max(20, dragInfo.startW + dx));
            var h = grid(Math.max(20, dragInfo.startH + dy));
            el.style.width = w + 'px';
            el.style.minHeight = h + 'px';
            val = w + ' x ' + h;
            showBadge(e, val + 'px');
            hideGuide();
        }
        dragInfo.value = val;
    }

    function onHandleUp() {
        if (!dragInfo) return;
        document.removeEventListener('mousemove', onHandleMove);
        document.removeEventListener('mouseup', onHandleUp);
        document.body.classList.remove('lp-hd-dragging');
        badge.hidden = true;
        hideGuide();
        var info = dragInfo;
        dragInfo = null;

        if (info.kind === 'padding' || info.kind === 'margin') {
            send({ type: 'resize', id: selectedId, prop: info.kind, side: info.side, value: info.value });
        } else if (info.kind === 'width') {
            send({ type: 'resizeFlat', id: selectedId, prop: 'width', value: info.value });
        } else if (info.kind === 'height') {
            send({ type: 'resizeFlat', id: selectedId, prop: 'min_height', value: info.value });
        } else if (info.kind === 'corner') {
            send({ type: 'resizeFlat', id: selectedId, prop: 'width', value: parseInt(info.el.style.width, 10) });
            send({ type: 'resizeFlat', id: selectedId, prop: 'min_height', value: parseInt(info.el.style.minHeight, 10) });
        }
        placeSpacing();
    }

    // ---- inline visual editing -----------------------------------------------
    var activeInlineEl = null;
    var activeInlineParentLpId = null;
    var inlineBar = null;

    function ensureInlineBar() {
        if (inlineBar) return inlineBar;
        inlineBar = document.createElement('div');
        inlineBar.id = 'lp-inline-bar';
        inlineBar.hidden = true;
        inlineBar.innerHTML =
            '<button type="button" data-cmd="bold" title="Bold"><b>B</b></button>' +
            '<button type="button" data-cmd="italic" title="Italic"><i>I</i></button>' +
            '<button type="button" data-cmd="link" title="Insert / Change Link">&#128279; Link</button>' +
            '<span class="lp-inline-sep"></span>' +
            '<button type="button" class="lp-btn-add" data-cmd="add-button" title="Add a Button right here">+ Button</button>' +
            '<button type="button" class="lp-btn-add" data-cmd="add-box" title="Add a Container / Box right here">+ Container</button>' +
            '<button type="button" class="lp-btn-add" data-cmd="add-text" title="Add a Text paragraph right here">+ Text</button>' +
            '<button type="button" class="lp-btn-add" data-cmd="add-orderform" title="Add Order Form right here" style="background:#16a34a;color:#fff;font-weight:600;">+ Order Form</button>' +
            '<span class="lp-inline-sep"></span>' +
            '<button type="button" class="lp-btn-del" data-cmd="delete" title="Delete this element from page">&#128465; Delete</button>' +
            '<span class="lp-inline-sep"></span>' +
            '<button type="button" class="lp-btn-done" data-cmd="done" title="Save changes">&#10003; Done</button>';
        document.body.appendChild(inlineBar);

        inlineBar.addEventListener('mousedown', function (e) {
            e.preventDefault(); // keep text selection and focus
        });

        inlineBar.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-cmd]');
            if (!btn || !activeInlineEl) return;
            var cmd = btn.getAttribute('data-cmd');
            if (cmd === 'bold' || cmd === 'italic') {
                document.execCommand(cmd, false, null);
            } else if (cmd === 'link') {
                var currentHref = activeInlineEl.tagName.toLowerCase() === 'a' ? activeInlineEl.getAttribute('href') : '';
                var url = prompt('Enter link URL (e.g. #order, tel:01700000000, or https://wa.me/...):', currentHref || '#order');
                if (url !== null && url.trim() !== '') {
                    if (activeInlineEl.tagName.toLowerCase() === 'a') {
                        activeInlineEl.setAttribute('href', url.trim());
                    } else {
                        document.execCommand('createLink', false, url.trim());
                    }
                    var pNode = byId(activeInlineParentLpId);
                    if (pNode && typeOf(pNode) === 'custom_code') {
                        send({ type: 'updateCustomCode', id: activeInlineParentLpId, html: pNode.innerHTML });
                    }
                }
            } else if (cmd === 'add-orderform') {
                send({ type: 'insertElement', afterId: activeInlineParentLpId, elementType: 'order_form' });
            } else if (cmd === 'add-button') {
                var btnHtml = '<div style="margin: 18px 0; text-align: center;"><a href="#order" class="btn lp-custom-btn" style="display: inline-block; background: #ff5722; color: #ffffff; padding: 14px 32px; font-size: 17px; font-weight: 700; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 14px rgba(255,87,34,0.35); cursor: pointer; transition: all 0.2s ease;">&#128722; অর্ডার করতে এখানে ক্লিক করুন</a></div>';
                activeInlineEl.insertAdjacentHTML('afterend', btnHtml);
                var pNode = byId(activeInlineParentLpId);
                if (pNode && typeOf(pNode) === 'custom_code') {
                    send({ type: 'updateCustomCode', id: activeInlineParentLpId, html: pNode.innerHTML });
                }
            } else if (cmd === 'add-box') {
                var boxHtml = '<div style="margin: 20px 0; padding: 24px; border: 1.5px dashed #3b82f6; border-radius: 10px; background: rgba(59,130,246,0.03); text-align: center;"><h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #1e293b;">নতুন কন্টেইনার / অফার বক্স</h3><p style="margin: 0; font-size: 15px; color: #64748b;">এখানে ডাবল ক্লিক করে যে কোনো লেখা বা বাটন যোগ করুন।</p></div>';
                activeInlineEl.insertAdjacentHTML('afterend', boxHtml);
                var pNode = byId(activeInlineParentLpId);
                if (pNode && typeOf(pNode) === 'custom_code') {
                    send({ type: 'updateCustomCode', id: activeInlineParentLpId, html: pNode.innerHTML });
                }
            } else if (cmd === 'add-text') {
                var txtHtml = '<p style="margin: 12px 0; font-size: 16px; line-height: 1.6; color: #1e293b;">নতুন প্যারাগ্রাফ বা টেক্সট লিখুন...</p>';
                activeInlineEl.insertAdjacentHTML('afterend', txtHtml);
                var pNode = byId(activeInlineParentLpId);
                if (pNode && typeOf(pNode) === 'custom_code') {
                    send({ type: 'updateCustomCode', id: activeInlineParentLpId, html: pNode.innerHTML });
                }
            } else if (cmd === 'delete') {
                var elToDelete = activeInlineEl;
                var parentNode = byId(activeInlineParentLpId);
                var pType = typeOf(parentNode);
                var parentId = activeInlineParentLpId;

                activeInlineEl = null;
                activeInlineParentLpId = null;
                inlineBar.hidden = true;

                elToDelete.remove();

                if (parentNode && pType === 'custom_code') {
                    send({ type: 'updateCustomCode', id: parentId, html: parentNode.innerHTML });
                } else if (parentNode && (pType === 'heading' || pType === 'text')) {
                    send({ type: 'action', action: 'delete', id: parentId });
                }
            } else if (cmd === 'done') {
                finishInlineEdit();
            }
        });

        return inlineBar;
    }

    function positionInlineBar(el) {
        var bar = ensureInlineBar();
        var r = el.getBoundingClientRect();
        var x = r.left + window.scrollX;
        var y = r.top + window.scrollY - 40;
        if (y < 4) y = r.bottom + window.scrollY + 8;
        var maxLeft = Math.max(8, window.innerWidth - (bar.offsetWidth || 380) - 16);
        bar.style.left = Math.max(8, Math.min(x, maxLeft)) + 'px';
        bar.style.top = y + 'px';
        bar.hidden = false;
    }

    function finishInlineEdit() {
        if (!activeInlineEl) return;
        var el = activeInlineEl;
        var parentId = activeInlineParentLpId;
        activeInlineEl = null;
        activeInlineParentLpId = null;

        el.contentEditable = "false";
        el.classList.remove('lp-inline-active');
        if (inlineBar) inlineBar.hidden = true;

        var parentNode = byId(parentId);
        if (!parentNode) return;

        var pType = typeOf(parentNode);
        if (pType === 'custom_code') {
            send({ type: 'updateCustomCode', id: parentId, html: parentNode.innerHTML });
        } else if (pType === 'heading') {
            send({ type: 'updateText', id: parentId, text: el.innerText.trim() });
        } else if (pType === 'text') {
            send({ type: 'updateHtml', id: parentId, html: el.innerHTML });
        } else if (pType === 'button') {
            send({ type: 'updateButtonText', id: parentId, text: el.innerText.trim() });
        }
    }

    // ---- events --------------------------------------------------------------
    document.addEventListener('dblclick', function (e) {
        if (e.target.closest('#lp-toolbar') || e.target.closest('#lp-spacing') || e.target.closest('#lp-inline-bar')) return;
        var el = lpEl(e.target);
        if (!el) return;

        var lpType = typeOf(el);
        var lpId = el.getAttribute('data-lp-id');

        // Allow inline editing inside custom_code or standard text-bearing elements
        var editableTypes = ['custom_code', 'text', 'heading', 'button', 'cta', 'banner'];
        if (editableTypes.indexOf(lpType) === -1 && !el.closest('[data-lp-type="custom_code"]')) return;

        if (activeInlineEl && activeInlineEl !== e.target) {
            finishInlineEdit();
        }

        var target = e.target;
        if (target === el && lpType !== 'custom_code') {
            target = el.querySelector('h1, h2, h3, h4, h5, h6, p, a, button, span') || el;
        }

        target.contentEditable = "true";
        target.classList.add('lp-inline-active');
        activeInlineEl = target;
        activeInlineParentLpId = lpId;
        target.focus();

        positionInlineBar(target);
    });

    document.addEventListener('click', function (e) {
        if (e.target.closest('#lp-toolbar')) return;
        if (e.target.closest('#lp-inline-bar')) return;

        if (activeInlineEl && !activeInlineEl.contains(e.target)) {
            finishInlineEdit();
        }

        var a = e.target.closest('a, button, [type=submit]');
        if (a) e.preventDefault();
        var el = lpEl(e.target);
        send({ type: 'select', id: el ? el.getAttribute('data-lp-id') : null });
    }, true);

    document.addEventListener('submit', function (e) { e.preventDefault(); }, true);

    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        var el = lpEl(e.target);
        if (!el) return;
        send({ type: 'select', id: el.getAttribute('data-lp-id') });
        send({ type: 'context', id: el.getAttribute('data-lp-id'), x: e.clientX, y: e.clientY });
    });

    document.addEventListener('keydown', function (e) {
        if (activeInlineEl) {
            if (e.key === 'Escape') {
                finishInlineEdit();
                e.preventDefault();
            }
            return; // let typing, delete, backspace, bold work inside the text!
        }

        var mod = e.ctrlKey || e.metaKey;
        var k = e.key.toLowerCase();
        if ((mod && ['z', 'y', 'c', 'v', 'd', 's'].indexOf(k) > -1) || k === 'delete' || k === 'escape') {
            e.preventDefault();
            send({ type: 'key', key: k, ctrl: mod, shift: e.shiftKey });
        }
    });

    function repositionOverlays() {
        placeToolbar();
        placeSpacing();
        renderRuler();
        if (activeInlineEl) positionInlineBar(activeInlineEl);
    }
    window.addEventListener('scroll', repositionOverlays, { passive: true });
    window.addEventListener('resize', repositionOverlays);

    // ---- ruler ------------------------------------------------------------------
    // Toggled from the top bar (Ruler icon). Two fixed strips along the top/left of the
    // canvas with pixel tick marks (minor every 10px, labelled every 100px), a crosshair
    // that follows the mouse, and - while an element is selected - a highlighted band on
    // each ruler showing that element's exact span, for manual, ruler-based alignment.
    var MAJOR = 100, MINOR = 10;
    var rulerOn = false;
    var rulerH = null, rulerV = null, rulerCorner = null, rulerCursorH = null, rulerCursorV = null, rulerCoordLabel = null;

    function buildRuler() {
        rulerCorner = document.createElement('div'); rulerCorner.id = 'lp-ruler-corner';
        rulerH = document.createElement('div'); rulerH.id = 'lp-ruler-h';
        rulerV = document.createElement('div'); rulerV.id = 'lp-ruler-v';
        rulerCursorH = document.createElement('div'); rulerCursorH.className = 'lp-ruler-cursor lp-ruler-cursor-h';
        rulerCursorV = document.createElement('div'); rulerCursorV.className = 'lp-ruler-cursor lp-ruler-cursor-v';
        rulerCoordLabel = document.createElement('div'); rulerCoordLabel.id = 'lp-ruler-coord';
        [rulerCorner, rulerH, rulerV, rulerCursorH, rulerCursorV, rulerCoordLabel].forEach(function (n) { n.hidden = true; document.body.appendChild(n); });

        document.addEventListener('mousemove', function (e) {
            if (!rulerOn) return;
            rulerCursorH.style.left = e.clientX + 'px';
            rulerCursorV.style.top = e.clientY + 'px';
            rulerCoordLabel.style.left = (e.clientX + 10) + 'px';
            rulerCoordLabel.style.top = (e.clientY + 10) + 'px';
            rulerCoordLabel.textContent = Math.round(e.clientX + window.scrollX) + ', ' + Math.round(e.clientY + window.scrollY);
        });
    }

    function setRuler(on) {
        rulerOn = !!on;
        if (!rulerH) buildRuler();
        document.body.classList.toggle('lp-ruler-on', rulerOn);
        [rulerCorner, rulerH, rulerV, rulerCursorH, rulerCursorV, rulerCoordLabel].forEach(function (n) { n.hidden = !rulerOn; });
        if (rulerOn) renderRuler();
    }

    function rulerTicks(container, axis, length) {
        container.innerHTML = '';
        var offset = window[axis === 'x' ? 'scrollX' : 'scrollY'];
        var first = Math.floor(offset / MINOR) * MINOR;
        for (var v = first; v <= offset + length + MINOR; v += MINOR) {
            var pos = v - offset;
            var isMajor = v % MAJOR === 0;
            var tick = document.createElement('div');
            tick.className = 'lp-ruler-tick' + (isMajor ? ' lp-ruler-tick-major' : '');
            if (axis === 'x') { tick.style.left = pos + 'px'; } else { tick.style.top = pos + 'px'; }
            container.appendChild(tick);
            if (isMajor && v >= 0) {
                var label = document.createElement('div');
                label.className = 'lp-ruler-label';
                label.textContent = v;
                if (axis === 'x') { label.style.left = (pos + 3) + 'px'; } else { label.style.top = (pos + 2) + 'px'; }
                container.appendChild(label);
            }
        }
    }

    /** Highlight the selected element's exact span on both rulers, for manual ruler-based alignment. */
    function rulerSelectionBand() {
        var old = document.querySelectorAll('.lp-ruler-band');
        old.forEach(function (n) { n.remove(); });
        var el = byId(selectedId);
        if (!el) return;
        var r = el.getBoundingClientRect();
        var bandH = document.createElement('div');
        bandH.className = 'lp-ruler-band lp-ruler-band-h';
        bandH.style.left = r.left + 'px'; bandH.style.width = r.width + 'px';
        rulerH.appendChild(bandH);
        var bandV = document.createElement('div');
        bandV.className = 'lp-ruler-band lp-ruler-band-v';
        bandV.style.top = r.top + 'px'; bandV.style.height = r.height + 'px';
        rulerV.appendChild(bandV);
    }

    function renderRuler() {
        if (!rulerOn || !rulerH) return;
        rulerTicks(rulerH, 'x', window.innerWidth);
        rulerTicks(rulerV, 'y', window.innerHeight);
        rulerSelectionBand();
    }

    // ---- drag & drop ---------------------------------------------------------
    function hasLpDrag(e) {
        var t = e.dataTransfer && e.dataTransfer.types ? Array.prototype.slice.call(e.dataTransfer.types) : [];
        return t.indexOf('application/x-lp-new') > -1 || t.indexOf('application/x-lp-move') > -1;
    }

    function isRowLayout(children) {
        if (children.length < 2) return false;
        var a = children[0].getBoundingClientRect(), b = children[1].getBoundingClientRect();
        return Math.abs(a.top - b.top) < Math.min(a.height, b.height) / 2 && b.left > a.left;
    }

    /** Resolve pointer -> {parentEl|null, index, refEl, side, horizontal}. */
    function resolveDrop(e, drag) {
        var el = lpEl(document.elementFromPoint(e.clientX, e.clientY));
        var dragged = drag.kind === 'move' ? byId(drag.id) : null;
        if (dragged && el && (el === dragged || dragged.contains(el))) return null;

        var parentEl, index, refEl = null, side = 'after', horizontal = false;

        if (!el) {
            var sections = lpChildren(null);
            parentEl = null;
            index = sections.length;
            for (var i = 0; i < sections.length; i++) {
                var r = sections[i].getBoundingClientRect();
                if (e.clientY < r.top + r.height / 2) { index = i; break; }
            }
            refEl = sections[index] || sections[index - 1] || null;
            side = sections[index] ? 'before' : 'after';
            return finish(parentEl, index, refEl, side, false, drag);
        }

        // Candidate 1: drop INSIDE the hovered element when it can hold the dragged type.
        var kids = lpChildren(el);
        if (canAccept(typeOf(el), drag.type) && (kids.length === 0 || !overChild(e, kids))) {
            if (kids.length === 0) return finish(el, 0, null, 'inside', false, drag);
            var horiz = isRowLayout(kids);
            var idx = kids.length;
            for (var j = 0; j < kids.length; j++) {
                var kr = kids[j].getBoundingClientRect();
                var mid = horiz ? kr.left + kr.width / 2 : kr.top + kr.height / 2;
                if ((horiz ? e.clientX : e.clientY) < mid) { idx = j; break; }
            }
            return finish(el, idx, kids[idx] || kids[idx - 1], kids[idx] ? 'before' : 'after', horiz, drag);
        }

        // Candidate 2: before/after the hovered element inside ITS parent, bubbling up until accepted.
        var cur = el;
        var pointerFrac = null;
        while (cur) {
            var par = parentLp(cur);
            var ptype = par ? typeOf(par) : null;
            var sibs = lpChildren(par);
            var horizontalLayout = isRowLayout(sibs);
            var cr = cur.getBoundingClientRect();
            if (pointerFrac === null) {
                pointerFrac = horizontalLayout ? (e.clientX - cr.left) / (cr.width || 1) : (e.clientY - cr.top) / (cr.height || 1);
            }
            if (canAccept(ptype, drag.type) && !(dragged && par === dragged)) {
                var ci = sibs.indexOf(cur);
                var before = pointerFrac < 0.5;
                return finish(par, before ? ci : ci + 1, cur, before ? 'before' : 'after', horizontalLayout, drag);
            }
            if (!par) break;
            cur = par;
        }
        return null;
    }

    function overChild(e, kids) {
        return kids.some(function (k) {
            var r = k.getBoundingClientRect();
            return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        });
    }

    function finish(parentEl, index, refEl, side, horizontal, drag) {
        // A widget dropped at page level is wrapped in a new section by the builder.
        var wrap = parentEl === null && drag.type !== 'section';
        return { parentEl: parentEl, index: index, refEl: refEl, side: side, horizontal: horizontal, wrap: wrap };
    }

    function showIndicator(t) {
        clearIndicator();
        if (!t) return;
        if (t.side === 'inside' || !t.refEl) {
            if (t.parentEl) { t.parentEl.classList.add('lp-drop-inside'); lastDropOutline = t.parentEl; }
            return;
        }
        var r = t.refEl.getBoundingClientRect();
        var x = r.left + window.scrollX, y = r.top + window.scrollY;
        line.hidden = false;
        if (t.horizontal) {
            line.style.cssText = 'left:' + (t.side === 'before' ? x - 2 : x + r.width - 2) + 'px;top:' + y + 'px;width:4px;height:' + r.height + 'px';
        } else {
            line.style.cssText = 'left:' + x + 'px;top:' + (t.side === 'before' ? y - 2 : y + r.height - 2) + 'px;width:' + r.width + 'px;height:4px';
        }
    }

    function clearIndicator() {
        line.hidden = true;
        if (lastDropOutline) { lastDropOutline.classList.remove('lp-drop-inside'); lastDropOutline = null; }
    }

    function endDrag() {
        clearIndicator();
        document.body.classList.remove('lp-dragging');
        try { window.parent.__lpDrag = null; } catch (e) { /* ignore */ }
        send({ type: 'dragend' });
    }

    document.addEventListener('dragover', function (e) {
        var drag = dragState();
        if (!drag || !hasLpDrag(e)) return;
        var t = resolveDrop(e, drag);
        if (!t) { clearIndicator(); return; }
        e.preventDefault();
        e.dataTransfer.dropEffect = drag.kind === 'move' ? 'move' : 'copy';
        showIndicator(t);
    });

    document.addEventListener('dragleave', function (e) {
        if (!e.relatedTarget) clearIndicator();
    });

    document.addEventListener('drop', function (e) {
        var drag = dragState();
        if (!drag || !hasLpDrag(e)) return;
        e.preventDefault();
        var t = resolveDrop(e, drag);
        clearIndicator();
        if (t) {
            send({
                type: 'drop', kind: drag.kind, payload: drag.kind === 'move' ? drag.id : drag.type,
                parentId: t.parentEl ? t.parentEl.getAttribute('data-lp-id') : null, index: t.index
            });
        }
        endDrag();
    });

    // ---- messages from the builder -------------------------------------------
    window.addEventListener('message', function (e) {
        if (e.origin !== window.location.origin || !e.data || !e.data.lp) return;
        var m = e.data;
        if (m.type === 'render') patch(m);
        else if (m.type === 'select') mark(m.id);
        else if (m.type === 'schema') { accepts = m.accepts || {}; labels = m.labels || {}; }
        else if (m.type === 'reposition') repositionOverlays();
        else if (m.type === 'ruler') setRuler(m.on);
        else if (m.type === 'scrollTo') { var el = byId(m.id); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    });

    if ('ResizeObserver' in window) new ResizeObserver(repositionOverlays).observe(root);
    send({ type: 'ready' });
})();
