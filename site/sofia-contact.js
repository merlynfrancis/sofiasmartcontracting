/*
 * sofia-contact.js — makes the "Get in Touch" form actually deliver.
 *
 * The stock form (built by the minified bundle) POSTs to a dead NRG endpoint and
 * requires a US 5-digit zip code, which would block every UAE visitor. Rather
 * than patch the bundle, this intercepts the form's submit in the CAPTURE phase
 * (which runs before the bundle's own bubble-phase handler) and takes over:
 *   - stopImmediatePropagation() prevents the NRG handler from ever running,
 *   - the submission is sent to our own /api/contact serverless route, which
 *     emails a branded message to info@sofiacontracting.com.
 *
 * The API route only exists on the deployed site (Vercel). On the local dev
 * server it will 404, so test the form on the live URL.
 */
(function () {
  'use strict';

  var ENDPOINT = '/api/contact';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // --- hide the US-only Zip Code field wherever a contact form appears ---
  function tidyForm(form) {
    var zip = form.querySelector('input[name="zipCode"]');
    if (zip) {
      var group = zip.closest('.form-group');
      if (group) group.style.display = 'none';
    }
  }
  function scan(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.classList && node.classList.contains('contactForm__form')) tidyForm(node);
    if (node.querySelectorAll) {
      Array.prototype.forEach.call(node.querySelectorAll('.contactForm__form'), tidyForm);
    }
  }
  function watch() {
    scan(document.body);
    new MutationObserver(function (muts) {
      muts.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, scan); });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) watch();
  else document.addEventListener('DOMContentLoaded', watch);

  // --- take over submission ---
  function field(form, name) { return form.querySelector('input[name="' + name + '"]'); }

  function errorLine(form) {
    var line = form.querySelector('.sofiaFormError');
    if (!line) {
      line = document.createElement('div');
      line.className = 'sofiaFormError';
      line.setAttribute('role', 'alert');
      var wrap = form.querySelector('.contactForm__submitWrap');
      if (wrap && wrap.parentNode) wrap.parentNode.insertBefore(line, wrap);
      else form.appendChild(line);
    }
    return line;
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.classList || !form.classList.contains('contactForm__form')) return;

    // Block the stock NRG handler and the native submit; we own this from here.
    e.preventDefault();
    e.stopImmediatePropagation();

    var container = form.closest('.contactForm');
    var get = function (n) { var el = field(form, n); return el ? el.value.trim() : ''; };
    var name = get('name'), company = get('company'), phone = get('phone'), email = get('email');

    var line = errorLine(form);
    var missing = [];
    if (!name) missing.push('your name');
    if (!phone || phone.replace(/\D/g, '').length < 7) missing.push('a phone number');
    if (!email || !EMAIL_RE.test(email)) missing.push('a valid email');
    if (missing.length) {
      line.textContent = 'Please add ' + missing.join(', ') + '.';
      line.style.display = 'block';
      return;
    }
    line.style.display = 'none';

    var btn = form.querySelector('.contactForm__submit');
    if (container) container.classList.add('contactForm--loading');
    if (btn) btn.disabled = true;

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: name,
        company: company,
        phone: phone,
        email: email
      })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, body: j }; });
    }).then(function (res) {
      if (container) container.classList.remove('contactForm--loading');
      if (res.ok && res.body && res.body.ok) {
        if (container) container.classList.add('contactForm--success'); // reveals the stock thank-you
      } else {
        if (btn) btn.disabled = false;
        line.textContent = (res.body && res.body.error) || 'Something went wrong. Please email info@sofiacontracting.com.';
        line.style.display = 'block';
      }
    }).catch(function () {
      if (container) container.classList.remove('contactForm--loading');
      if (btn) btn.disabled = false;
      line.textContent = 'Network error. Please try again, or email info@sofiacontracting.com.';
      line.style.display = 'block';
    });
  }, true); // capture phase
})();
