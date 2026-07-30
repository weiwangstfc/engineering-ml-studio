/*
 * project-shell.js — Phase 3 (increment 2)
 *
 * PRESENTATION + NAVIGATION layer for Project mode. It presents the inherited
 * eight internal panels as six user-facing stages and shows ONE stage at a
 * time in a dominant workspace. It does NOT:
 *   - change any calculation, model adapter, default, schema, governance rule
 *     or export format;
 *   - move controls between DOM panels or reorder the training pipeline;
 *   - introduce any new application state or unlock any panel itself.
 *
 * It only:
 *   1. reveals a single panel at a time (`showStage`) and hides the rest, so
 *      the workspace reads as an application screen rather than a long report;
 *   2. keeps the compact left navigator in step with each panel's existing
 *      lock state (available / current / locked) and expands a grouped stage's
 *      substages only while that stage is current;
 *   3. wires additive Back / Continue controls that walk the fixed panel order,
 *      skipping panels that are locked or hidden by the current mode;
 *   4. mirrors app.js's own transitions: app.js calls `element.scrollIntoView`
 *      at key moments (after training → diagnostics; after loading an approved
 *      package → predict). Each panel's `scrollIntoView` is wrapped so it first
 *      reveals that stage — no app.js change is needed;
 *   5. delegates the top-bar utility buttons (Home / Save project / Open
 *      project) to the existing controls by their stable IDs.
 *
 * All gating is READ from the classes that js/app.js already sets
 * (`unlockPanel` / `unlockWorkflow`); this file never unlocks a panel.
 */
(function () {
  'use strict';

  var PANEL_IDS = [
    'step-upload', 'step-features', 'step-preprocess', 'step-model',
    'step-split', 'step-diagnostics', 'step-predict', 'step-monitor'
  ];

  var currentPanelId = PANEL_IDS[0];

  function panelEl(id) {
    return document.getElementById(id);
  }

  function isLocked(el) {
    return !!(el && el.classList.contains('locked'));
  }

  // A panel is hidden by the current mode when prediction-only mode is active
  // and the panel is training-only or governance-only (the same rule the
  // inherited CSS applies). Used so Back/Continue never target a hidden stage.
  function isModeHidden(el) {
    if (!el) return true;
    if (!document.body.classList.contains('prediction-only')) return false;
    return el.classList.contains('training-only') ||
      el.classList.contains('governance-only');
  }

  // A panel is reachable when it is neither locked nor hidden by the mode.
  function isReachable(id) {
    var el = panelEl(id);
    return !!(el && !isLocked(el) && !isModeHidden(el));
  }

  function nextReachable(fromId) {
    var i = PANEL_IDS.indexOf(fromId);
    for (var j = i + 1; j < PANEL_IDS.length; j++) {
      if (isReachable(PANEL_IDS[j])) return PANEL_IDS[j];
    }
    return null;
  }

  function previousReachable(fromId) {
    var i = PANEL_IDS.indexOf(fromId);
    if (i < 0) i = PANEL_IDS.length;
    for (var j = i - 1; j >= 0; j--) {
      if (isReachable(PANEL_IDS[j])) return PANEL_IDS[j];
    }
    return null;
  }

  function firstReachable() {
    for (var j = 0; j < PANEL_IDS.length; j++) {
      if (isReachable(PANEL_IDS[j])) return PANEL_IDS[j];
    }
    return PANEL_IDS[0];
  }

  // -- Four-state workflow model ---------------------------------------------
  //
  // Every rail row is rendered in exactly ONE of four states, derived purely
  // from (a) which panel is currently shown and (b) the inherited lock cascade.
  // Nothing here equates "unlocked" or "visible" or "last stage" or "visited"
  // with completion:
  //
  //   active     — its panel is the one currently shown (exactly one at a time;
  //                the shown panel's row carries aria-current="step").
  //   complete   — a genuine artifact for that stage exists AND the cursor has
  //                moved past it. Never the active stage; never set for a stage
  //                the user has merely been able to reach.
  //   available  — reachable now (unlocked and not mode-hidden) but not the
  //                active stage and not yet completed. Neutral, clickable.
  //   locked     — not reachable (its entry panel is locked or mode-hidden).
  //                aria-disabled="true"; not clickable.
  //
  // The completion "artifacts" are read from the same lock milestones app.js
  // sets. `step-predict` and `step-diagnostics` unlock together on a successful
  // train, so "fit ready" and "model trained" are the same milestone here.

  var STATE_CLASSES = ['is-active', 'is-complete', 'is-available', 'is-locked'];

  function datasetLoaded() { return !isLocked(panelEl('step-features')); }
  function featuresChosen() { return !isLocked(panelEl('step-model')); }
  function modelTrained() { return !isLocked(panelEl('step-diagnostics')); }

  // The genuine artifact that marks a stage's work as done. Stages 3 and 4 have
  // no dedicated unlock of their own (a valid preprocessing config and a chosen
  // model are prerequisites of training), so they complete at the training
  // milestone. Stage 6 is terminal and is never auto-completed.
  function artifactExists(stageIndex) {
    switch (stageIndex) {
      case 1: return datasetLoaded();
      case 2: return featuresChosen();
      case 3: return featuresChosen();
      case 4: return modelTrained();
      case 5: return modelTrained();
      default: return false;
    }
  }

  // The user-facing stage (1..6) that owns a given internal panel.
  function stageIndexOfPanel(panelId) {
    var item = document.querySelector('#view-project .stage-item[data-panels~="' + panelId + '"]');
    return item ? parseInt(item.getAttribute('data-stage'), 10) : null;
  }

  // The panel a stage row navigates to (its href) — for a grouped stage this is
  // the first substage, which is the panel that gates the whole stage.
  function entryPanelOf(item) {
    var link = item.querySelector(':scope > a.stage-row');
    var href = link && link.getAttribute('href');
    if (href && href.charAt(0) === '#') return href.slice(1);
    return (item.getAttribute('data-panels') || '').split(/\s+/).filter(Boolean)[0];
  }

  function setRowState(row, state) {
    if (!row) return;
    STATE_CLASSES.forEach(function (c) { row.classList.remove(c); });
    row.classList.add('is-' + state);
    row.setAttribute('aria-disabled', state === 'locked' ? 'true' : 'false');
  }

  // Reveal a single panel and hide the rest. Presentation only.
  function showStage(id) {
    var target = panelEl(id);
    if (!target) return false;
    currentPanelId = id;
    PANEL_IDS.forEach(function (pid) {
      var el = panelEl(pid);
      if (el) el.classList.toggle('is-active-panel', pid === id);
    });
    syncAll();
    // A panel revealed from display:none must have any Plotly charts resized,
    // because app.js draws them (before its scrollIntoView) while the panel is
    // still hidden and would otherwise size them to zero width.
    if (window.Plotly && window.Plotly.Plots && typeof window.Plotly.Plots.resize === 'function') {
      var plots = target.querySelectorAll('.plot');
      Array.prototype.forEach.call(plots, function (p) {
        try { window.Plotly.Plots.resize(p); } catch (e) { /* ignore */ }
      });
    }
    // Move focus to the revealed section for keyboard / screen-reader users
    // without a scroll jump.
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    try { target.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }
    return true;
  }

  // Navigate to a panel only if it is reachable (not locked, not mode-hidden).
  function goToPanel(id) {
    if (!isReachable(id)) return false;
    return showStage(id);
  }

  // -- Rail / lock mirroring --------------------------------------------------

  function syncContinueButtons() {
    var buttons = document.querySelectorAll('#view-project .stage-continue[data-target]');
    Array.prototype.forEach.call(buttons, function (btn) {
      var target = panelEl(btn.getAttribute('data-target'));
      var locked = isLocked(target) || !target;
      btn.disabled = locked;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      if (locked) {
        btn.title = 'Complete the current stage first — this stage is not available yet.';
      } else {
        btn.removeAttribute('title');
      }
    });
  }

  function syncBackButtons() {
    var buttons = document.querySelectorAll('#view-project .stage-back');
    var prev = previousReachable(currentPanelId);
    Array.prototype.forEach.call(buttons, function (btn) {
      var disabled = !prev;
      btn.disabled = disabled;
      btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    });
  }

  function syncSidebar() {
    var activeIndex = stageIndexOfPanel(currentPanelId);

    // Top-level stage rows.
    var stageItems = document.querySelectorAll('#view-project .stage-item');
    Array.prototype.forEach.call(stageItems, function (item) {
      var index = parseInt(item.getAttribute('data-stage'), 10);
      var panels = (item.getAttribute('data-panels') || '').split(/\s+/).filter(Boolean);
      var row = item.querySelector(':scope > a.stage-row');
      var grouped = item.classList.contains('stage-grouped');
      var isActive = panels.indexOf(currentPanelId) !== -1;
      var isComplete = !isActive && artifactExists(index) &&
        activeIndex != null && activeIndex > index;
      var reachable = isReachable(entryPanelOf(item));

      var state = isActive ? 'active'
        : isComplete ? 'complete'
        : reachable ? 'available'
        : 'locked';
      setRowState(row, state);

      // Only expand the grouped stage that owns the shown panel.
      item.classList.toggle('substages-open', isActive && grouped);

      // The shown panel's row carries aria-current. For a grouped stage the
      // shown panel is a substage, so the parent row is active-styled but the
      // aria-current lives on the substage row (below) — never both.
      if (row) {
        if (isActive && !grouped) row.setAttribute('aria-current', 'step');
        else row.removeAttribute('aria-current');
      }
    });

    // Substage rows (only visible while their parent stage is active).
    var subItems = document.querySelectorAll('#view-project .substage-item');
    Array.prototype.forEach.call(subItems, function (item) {
      var panel = (item.getAttribute('data-panels') || '').trim();
      var row = item.querySelector(':scope > a.substage-row');
      var isActive = panel === currentPanelId;
      var state = isActive ? 'active' : (isReachable(panel) ? 'available' : 'locked');
      setRowState(row, state);
      if (row) {
        if (isActive) row.setAttribute('aria-current', 'step');
        else row.removeAttribute('aria-current');
      }
    });
  }

  // Presentation-layer invariant check: the top-bar status, the active stage and
  // the completed set must agree. Returns a list of problems (empty when sound)
  // and warns in the console. Used by the tests and as a runtime guard; it never
  // throws or mutates state.
  function checkConsistency() {
    var view = document.getElementById('view-project');
    if (!view) return [];
    var problems = [];
    var loaded = datasetLoaded();
    var trained = modelTrained();
    var currents = view.querySelectorAll('[aria-current="step"]').length;
    var completes = view.querySelectorAll('.stage-row.is-complete').length;

    if (currents !== 1) {
      problems.push('expected exactly one aria-current="step", found ' + currents);
    }
    if (!loaded && completes > 0) {
      problems.push('no dataset loaded but ' + completes + ' stage(s) marked complete');
    }
    if (!loaded) {
      var s6 = view.querySelector('.stage-item[data-stage="6"] > a.stage-row');
      if (s6 && (s6.classList.contains('is-active') || s6.classList.contains('is-complete'))) {
        problems.push('no dataset loaded but Stage 6 appears active or complete');
      }
    }
    if (!trained) {
      var s5 = view.querySelector('.stage-item[data-stage="5"] > a.stage-row');
      if (s5 && s5.classList.contains('is-complete')) {
        problems.push('no trained model but Stage 5 (Evaluate) marked complete');
      }
    }
    if (problems.length && window.console && typeof console.warn === 'function') {
      console.warn('[EMSProjectShell] navigation-state inconsistency: ' + problems.join('; '));
    }
    return problems;
  }

  // Reflect the project's progress in the top-bar status (derived from the
  // existing lock cascade — introduces no new state).
  function updateStatus() {
    var status = document.getElementById('projectStatusText');
    if (!status) return;
    if (!isLocked(panelEl('step-diagnostics'))) {
      status.textContent = 'Model trained';
    } else if (!isLocked(panelEl('step-features'))) {
      status.textContent = 'Dataset loaded';
    } else {
      status.textContent = 'No dataset loaded';
    }
  }

  function syncAll() {
    syncContinueButtons();
    syncBackButtons();
    syncSidebar();
    updateStatus();
    checkConsistency();
  }

  // -- Back / Continue injection ---------------------------------------------

  // Every panel after the first gets a Back button. Reuse an existing
  // non-governance .stage-nav when present (so Back sits beside Continue);
  // otherwise create a plain one. The predict panel's only .stage-nav is
  // governance-only (hidden in prediction-only), so a plain nav is created
  // there to keep Back reachable.
  function injectBackButtons() {
    PANEL_IDS.forEach(function (id, index) {
      if (index === 0) return;
      var panel = panelEl(id);
      if (!panel) return;
      if (panel.querySelector('.stage-back')) return;
      var nav = panel.querySelector(':scope > .stage-nav:not(.governance-only)');
      if (!nav) {
        nav = document.createElement('div');
        nav.className = 'stage-nav';
        panel.appendChild(nav);
      }
      var back = document.createElement('button');
      back.type = 'button';
      back.className = 'button secondary stage-back';
      back.textContent = 'Back';
      nav.insertBefore(back, nav.firstChild);
    });
  }

  function onWorkspaceClick(event) {
    var back = event.target.closest && event.target.closest('.stage-back');
    if (back) {
      event.preventDefault();
      if (back.disabled) return;
      var prev = previousReachable(currentPanelId);
      if (prev) goToPanel(prev);
      return;
    }
    var cont = event.target.closest && event.target.closest('.stage-continue[data-target]');
    if (cont) {
      event.preventDefault();
      if (cont.disabled) return;
      goToPanel(cont.getAttribute('data-target'));
    }
  }

  // Rail links switch the shown stage instead of scrolling to a hash.
  function onSidebarClick(event) {
    var link = event.target.closest && event.target.closest('a[href^="#step-"]');
    if (!link) return;
    event.preventDefault();
    var id = link.getAttribute('href').slice(1);
    if (PANEL_IDS.indexOf(id) === -1) return;
    goToPanel(id);
  }

  // -- Utility buttons (delegate to existing controls) -----------------------

  function clickById(id) {
    var el = document.getElementById(id);
    if (el) el.click();
  }

  function wireUtilities() {
    var home = document.getElementById('topbarHomeBtn');
    if (home) {
      home.addEventListener('click', function () {
        var link = document.querySelector('.top-nav [data-nav="home"]');
        if (link) link.click();
      });
    }
    var save = document.getElementById('topbarSaveBtn');
    if (save) save.addEventListener('click', function () { clickById('downloadProjectBtn'); });
    var open = document.getElementById('topbarOpenBtn');
    if (open) open.addEventListener('click', function () { clickById('projectFile'); });
    // #privacyInfoBtn and the Help link are wired by app.js / native anchors.
  }

  // -- Auto-advance: wrap each panel's scrollIntoView ------------------------

  function patchAutoAdvance() {
    PANEL_IDS.forEach(function (id) {
      var el = panelEl(id);
      if (!el || el.__emsScrollPatched) return;
      var orig = el.scrollIntoView;
      el.scrollIntoView = function () {
        showStage(id);
        if (typeof orig === 'function') {
          try { return orig.apply(this, arguments); } catch (e) { /* ignore */ }
        }
      };
      el.__emsScrollPatched = true;
    });
  }

  // -- Observers --------------------------------------------------------------

  function onStateChange() {
    syncAll();
    // If the mode changed under us (e.g. prediction-only) and the shown panel
    // is no longer reachable, move to the nearest reachable stage.
    if (!isReachable(currentPanelId)) {
      var fallback = nextReachable(currentPanelId) || previousReachable(currentPanelId) || firstReachable();
      if (fallback && fallback !== currentPanelId) showStage(fallback);
    }
  }

  function observeState() {
    if (typeof MutationObserver === 'undefined') return;
    var observer = new MutationObserver(function () { onStateChange(); });
    PANEL_IDS.forEach(function (id) {
      var el = panelEl(id);
      if (el) observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return observer;
  }

  function init() {
    var view = document.getElementById('view-project');
    if (!view) return;
    injectBackButtons();
    patchAutoAdvance();
    view.addEventListener('click', onWorkspaceClick);
    var sidebar = view.querySelector('.sidebar');
    if (sidebar) sidebar.addEventListener('click', onSidebarClick);
    wireUtilities();
    observeState();
    // Open on the first reachable stage (always Load data on a fresh project).
    showStage(firstReachable());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.EMSProjectShell = {
    showStage: showStage,
    goToPanel: goToPanel,
    syncAll: syncAll,
    checkConsistency: checkConsistency,
    currentPanel: function () { return currentPanelId; },
    isLocked: function (id) { return isLocked(panelEl(id)); }
  };
})();
