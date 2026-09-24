// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 UK Research and Innovation (UKRI)
// Engineering ML Studio — clickjacking guard.
//
// The page's Content-Security-Policy is delivered in a <meta> element, and the
// browser IGNORES `frame-ancestors` when it arrives that way: the directive only
// works as an HTTP response header. The application is published on GitHub Pages,
// which does not allow custom response headers, so neither `frame-ancestors` nor
// `X-Frame-Options` can be set. The meta CSP therefore looked like framing
// protection while providing none, and logged a console error on every load.
//
// This script is the protection that does work without headers: it runs first, in
// <head>, and refuses to render the application inside a frame. It must stay an
// external file — the CSP sets `script-src 'self'`, so an inline script would be
// blocked.
//
// If the site is ever moved to a host that can set response headers, add the real
// `frame-ancestors 'none'` / `X-Frame-Options: DENY` header there; this guard then
// becomes a harmless second layer.
(function (global) {
  'use strict';

  var framed;
  try {
    framed = global.top !== global.self;
  } catch (_) {
    // Reading global.top throws when the parent is a different origin, which can
    // only happen inside a frame. Treat the failure itself as the answer.
    framed = true;
  }
  if (!framed) return;

  // Hide the document before anything paints, so no part of the application is
  // ever visible — and therefore never clickable — inside the frame.
  var root = document.documentElement;
  root.style.display = 'none';

  function render() {
    var body = document.body;
    if (!body) return;

    while (body.firstChild) body.removeChild(body.firstChild);

    var box = document.createElement('div');
    box.setAttribute('role', 'alert');
    box.style.cssText = 'margin:2rem auto;max-width:34rem;padding:1.5rem;' +
      'font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.5;' +
      'border:1px solid #dec56c;background:#fff8df;color:#16202a;border-radius:8px';

    var title = document.createElement('h1');
    title.textContent = 'Engineering ML Studio cannot run inside a frame';
    title.style.cssText = 'margin:0 0 .5rem;font-size:1.15rem';

    var why = document.createElement('p');
    why.textContent = 'This application refuses to display inside another page, so that ' +
      'nobody can overlay it and trick you into clicking something you cannot see. ' +
      'Your data is unaffected: nothing has been loaded or sent anywhere.';
    why.style.margin = '0 0 1rem';

    var link = document.createElement('a');
    link.href = global.location.href;
    link.target = '_top';
    link.rel = 'noopener';
    link.textContent = 'Open Engineering ML Studio directly';
    link.style.cssText = 'font-weight:600;color:#0b4b5f';

    box.appendChild(title);
    box.appendChild(why);
    box.appendChild(link);
    body.appendChild(box);

    root.style.display = '';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})(window);
