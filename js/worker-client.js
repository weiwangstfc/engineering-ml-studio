(function (global) {
  'use strict';

  class WorkerClient {
    constructor(url) {
      this.url = url;
      this.pending = new Map();
      this.sequence = 0;
      this.available = false;
      this.failureReason = null;
      this.worker = null;
      try {
        if (typeof Worker === 'undefined') throw new Error('Web Workers are unavailable in this browser context.');
        this.worker = new Worker(url);
        this.worker.onmessage = event => this._handleMessage(event.data || {});
        this.worker.onerror = event => this._handleFailure(new Error(event.message || 'Worker error'));
        this.available = true;
      } catch (error) {
        this.failureReason = error.message;
      }
    }

    _handleFailure(error) {
      this.failureReason = error && error.message ? error.message : String(error || 'Worker error');
      this.available = false;
      for (const pending of this.pending.values()) { if (pending.timer) clearTimeout(pending.timer); pending.reject(new Error(this.failureReason)); }
      this.pending.clear();
    }

    _handleMessage(message) {
      const pending = this.pending.get(message.requestId);
      if (!pending) return;
      if (message.type === 'PROGRESS') {
        if (pending.onProgress) pending.onProgress(message.progress, message.message);
        return;
      }
      this.pending.delete(message.requestId);
      if (pending.timer) clearTimeout(pending.timer);
      if (message.type === 'ERROR') pending.reject(new Error(message.error || 'Worker operation failed.'));
      else pending.resolve(message.result);
    }

    request(type, payload, onProgress, timeoutMs) {
      if (!this.worker || !this.available) return Promise.reject(new Error(this.failureReason || 'Worker unavailable.'));
      const requestId = `request-${Date.now().toString(36)}-${++this.sequence}`;
      const promise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pending.delete(requestId);
          reject(new Error(`Worker operation timed out: ${type}`));
        }, Number(timeoutMs) || 15000);
        this.pending.set(requestId, { resolve, reject, onProgress, timer });
        this.worker.postMessage({ type, requestId, payload: payload || {} });
      });
      promise.requestId = requestId;
      promise.cancel = () => this.cancel(requestId);
      return promise;
    }

    cancel(requestId) {
      if (this.worker && requestId) this.worker.postMessage({ type:'CANCEL', requestId });
    }

    ping() { return this.request('PING', {}); }

    close() {
      if (this.worker) this.worker.terminate();
      this.worker = null;
      this.available = false;
      for (const pending of this.pending.values()) { if (pending.timer) clearTimeout(pending.timer); pending.reject(new Error('Worker client closed.')); }
      this.pending.clear();
    }
  }

  global.LRSWorkerClient = Object.freeze({
    version: '1.0.11',
    create(url) { return new WorkerClient(url); },
    WorkerClient
  });
})(window);
