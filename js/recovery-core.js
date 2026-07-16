(function (global) {
  'use strict';
  const VERSION='1.0.11';
  const KEY='local-regression-studio-recovery-v1';
  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function available(){try{const key='__lrs_test__';global.localStorage.setItem(key,'1');global.localStorage.removeItem(key);return true;}catch(_){return false;}}
  function save(snapshot){if(!available())return {saved:false,reason:'Local storage unavailable.'};const envelope={artifactType:'local-regression-recovery',schemaVersion:1,applicationVersion:VERSION,savedAt:new Date().toISOString(),originalCsvIncluded:false,snapshot:clone(snapshot)};global.localStorage.setItem(KEY,JSON.stringify(envelope));return {saved:true,metadata:{savedAt:envelope.savedAt,artifactCount:Array.isArray(snapshot&&snapshot.artifacts)?snapshot.artifacts.length:0}};}
  function load(){if(!available())return null;const raw=global.localStorage.getItem(KEY);if(!raw)return null;try{const value=JSON.parse(raw);if(value.artifactType!=='local-regression-recovery'||Number(value.schemaVersion)!==1)return null;return clone(value);}catch(_){return null;}}
  function clear(){if(available())global.localStorage.removeItem(KEY);return true;}
  function metadata(){const value=load();if(!value)return null;return {savedAt:value.savedAt,applicationVersion:value.applicationVersion,artifactCount:Array.isArray(value.snapshot&&value.snapshot.artifacts)?value.snapshot.artifacts.length:0,originalCsvIncluded:false};}
  global.LRSRecovery=Object.freeze({version:VERSION,key:KEY,available,save,load,clear,metadata});
})(typeof window !== 'undefined' ? window : globalThis);
