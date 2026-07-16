'use strict';
self.window = self;
importScripts('./platform-core.js');

const cancelled = new Set();

self.onmessage = async event => {
  const message = event.data || {};
  const requestId = message.requestId;
  if (message.type === 'CANCEL') {
    if (requestId) cancelled.add(requestId);
    return;
  }
  try {
    let result;
    if (message.type === 'PING') {
      result = { ok:true, workerVersion:'1.0.11', platformVersion:self.LRSPlatform.version };
    } else if (message.type === 'FINGERPRINT_TEXT') {
      if (cancelled.has(requestId)) throw new Error('Operation cancelled.');
      result = await self.LRSPlatform.fingerprintText(message.payload && message.payload.text);
      if (cancelled.has(requestId)) throw new Error('Operation cancelled.');
    } else if (message.type === 'MODEL_CAPABILITIES') {
      result = self.LRSPlatform.modelDefinitions;
    } else {
      throw new Error(`Unsupported worker operation: ${message.type}`);
    }
    self.postMessage({ type:'RESULT', requestId, result });
  } catch (error) {
    self.postMessage({ type:'ERROR', requestId, error:error && error.message ? error.message : String(error) });
  } finally {
    cancelled.delete(requestId);
  }
};
