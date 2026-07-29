// Engineering ML Studio — mode/router layer (Phase 1 prototype).
//
// A tiny view switcher over the existing single-page application. It shows exactly
// one top-level "view" at a time (Home, Explore, Project, About) and keeps the top
// navigation, the mode indicator and the URL hash in sync. It deliberately does NOT
// touch the inherited Project-mode application state or logic; Project mode is simply
// one of the views it can show.
(function (global) {
  'use strict';

  var VIEWS = ['home', 'explore', 'project', 'learn', 'about'];
  var LABELS = { home: 'Home', explore: 'Explore', project: 'Project', learn: 'Learn', about: 'About' };

  function el(id) { return document.getElementById(id); }
  function viewEl(mode) { return el('view-' + mode); }

  function isValid(mode) { return VIEWS.indexOf(mode) !== -1; }

  var current = null;

  function show(mode, options) {
    if (!isValid(mode)) mode = 'home';
    options = options || {};
    VIEWS.forEach(function (name) {
      var node = viewEl(name);
      if (node) node.classList.toggle('is-hidden', name !== mode);
    });
    // Reflect the active state in the primary navigation.
    var navLinks = document.querySelectorAll('.top-nav [data-nav]');
    navLinks.forEach(function (link) {
      var active = link.getAttribute('data-nav') === mode;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    var indicator = el('modeIndicator');
    if (indicator) indicator.textContent = LABELS[mode] ? LABELS[mode] + ' mode' : '';

    // Keep the URL hash in sync without adding a second history entry per click.
    if (global.location && ('#' + mode) !== global.location.hash) {
      try { global.history.replaceState(null, '', '#' + mode); }
      catch (_) { global.location.hash = mode; }
    }

    var previous = current;
    current = mode;

    // Move keyboard focus to the newly shown view for accessibility, unless asked not to.
    if (!options.noFocus) {
      var node = viewEl(mode);
      if (node && typeof node.focus === 'function') {
        try { node.focus({ preventScroll: false }); } catch (_) { node.focus(); }
      }
    }

    // Let interested modules (e.g. Explore) react to being shown.
    if (previous !== mode) {
      try {
        document.dispatchEvent(new CustomEvent('ems:modechange', { detail: { mode: mode, previous: previous } }));
      } catch (_) { /* CustomEvent unsupported — ignore */ }
    }
    return mode;
  }

  function modeFromHash() {
    var raw = (global.location && global.location.hash || '').replace(/^#/, '').trim();
    return isValid(raw) ? raw : 'home';
  }

  function onModeClick(event) {
    var trigger = event.target && event.target.closest ? event.target.closest('[data-mode]') : null;
    if (!trigger) return;
    var mode = trigger.getAttribute('data-mode');
    if (!isValid(mode)) return;
    event.preventDefault();
    show(mode);
  }

  function init() {
    document.addEventListener('click', onModeClick);
    global.addEventListener('hashchange', function () { show(modeFromHash(), { noFocus: false }); });
    // Initial view: honour a deep link (e.g. #explore), default to Home.
    show(modeFromHash(), { noFocus: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.EMSModes = Object.freeze({
    show: show,
    get current() { return current; },
    views: VIEWS.slice()
  });
})(window);
