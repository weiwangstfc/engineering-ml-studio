(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const buildConfig = window.LRS_BUILD_CONFIG || {};
  const localOnly = Boolean(buildConfig.forceLocalOnly) || params.get('localOnly') === '1';
  const timeoutMs = 5500;
  window.__dependencyStatus = { modeRequested: localOnly ? 'local-only' : 'hybrid', libraries: {} };

  function loadScript(url, expectedGlobal, timeout) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        script.remove();
        reject(new Error(`Timed out loading ${url}`));
      }, timeout || timeoutMs);
      script.src = url;
      script.async = true;
      script.onload = () => {
        if (settled) return;
        clearTimeout(timer);
        if (expectedGlobal && typeof window[expectedGlobal] === 'undefined') {
          settled = true;
          reject(new Error(`${expectedGlobal} was not available after loading ${url}`));
          return;
        }
        settled = true;
        resolve(url);
      };
      script.onerror = () => {
        if (settled) return;
        clearTimeout(timer);
        settled = true;
        script.remove();
        reject(new Error(`Failed to load ${url}`));
      };
      document.head.appendChild(script);
    });
  }

  async function loadWithFallback(name, cdnUrl, localUrl, expectedGlobal) {
    if (!localOnly) {
      try {
        await loadScript(cdnUrl, expectedGlobal);
        window.__dependencyStatus.libraries[name] = { source: 'cdn', versionedUrl: cdnUrl };
        return;
      } catch (error) {
        window.__dependencyStatus.libraries[name] = { source: 'cdn-failed', message: error.message };
      }
    }
    await loadScript(localUrl, expectedGlobal, 15000);
    window.__dependencyStatus.libraries[name] = { source: 'local', versionedUrl: localUrl };
  }

  async function boot() {
    try {
      const papaPromise = (async () => {
        if (!localOnly) {
          try {
            await loadScript('https://cdn.jsdelivr.net/npm/papaparse@5.5.4/papaparse.min.js', 'Papa');
            window.CSVEngine = {
              name: 'Papa Parse 5.5.4',
              parse: (text, options) => window.Papa.parse(text, options),
              unparse: (data, options) => window.Papa.unparse(data, options)
            };
            window.__dependencyStatus.libraries.csv = { source: 'cdn', version: 'Papa Parse 5.5.4' };
            return;
          } catch (error) {
            window.__dependencyStatus.libraries.csv = { source: 'cdn-failed', message: error.message };
          }
        }
        await loadScript('./vendor/csv-parser-lite.js', 'CSVLite', 15000);
        window.CSVEngine = {
          name: 'CSV Lite local parser',
          parse: (text, options) => window.CSVLite.parse(text, options),
          unparse: (data, options) => window.CSVLite.unparse(data, options)
        };
        window.__dependencyStatus.libraries.csv = { source: 'local', version: 'CSV Lite' };
      })();

      const plotPromise = loadWithFallback(
        'plotly',
        'https://cdn.jsdelivr.net/npm/plotly.js-dist-min@3.3.1/plotly.min.js',
        './vendor/plotly-3.3.1.min.js',
        'Plotly'
      );
      await Promise.all([papaPromise, plotPromise]);
      await loadScript('./js/ml-core.js', 'MLCore', 15000);
      await loadScript('./js/advanced-core.js', 'AdvancedML', 15000);
      await loadScript('./js/modelling-core.js', 'ExpandedModelling', 15000);
      await loadScript('./js/platform-core.js', 'LRSPlatform', 15000);
      await loadScript('./js/worker-client.js', 'LRSWorkerClient', 15000);
      await loadScript('./js/comparison-core.js', 'LRSComparison', 15000);
      await loadScript('./js/security-core.js', 'LRSSecurity', 15000);
      await loadScript('./js/governance-core.js', 'LRSGovernance', 15000);
      await loadScript('./js/recovery-core.js', 'LRSRecovery', 15000);
      await loadScript('./js/validation-core.js', 'LRSValidation', 15000);
      await loadScript('./js/approval-core.js', 'LRSApproval', 15000);
      await loadScript('./js/app.js', 'LocalRegressionApp', 15000);
      // Phase 1: mode/router layer + Explore controller (built on the modules above).
      await loadScript('./js/modes.js', 'EMSModes', 15000);
      await loadScript('./js/explore.js', 'EMSExplore', 15000);
    } catch (error) {
      const region = document.getElementById('alertRegion');
      if (region) region.innerHTML = `<div class="alert error"><strong>Application startup failed.</strong><br>${escapeHtml(error.message)}</div>`;
      const status = document.getElementById('runtimeMode');
      if (status) status.textContent = 'Startup failed';
      console.error(error);
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
  }
  boot();
})();
