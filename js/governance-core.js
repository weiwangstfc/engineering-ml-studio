(function (global) {
  'use strict';

  const VERSION = '1.0.11';
  const STATUSES = Object.freeze(['draft','under-review','validation-failed','approved','approved-with-conditions','suspended','expired','rejected','retired']);
  const TRANSITIONS = Object.freeze({
    'draft':['draft','under-review','validation-failed','approved','approved-with-conditions','rejected','retired'],
    'under-review':['under-review','draft','validation-failed','approved','approved-with-conditions','rejected','retired'],
    'validation-failed':['validation-failed','under-review','draft','rejected','retired'],
    'approved':['approved','under-review','suspended','expired','retired'],
    'approved-with-conditions':['approved-with-conditions','under-review','suspended','expired','retired','approved'],
    'suspended':['suspended','under-review','approved','approved-with-conditions','retired'],
    'expired':['expired','under-review','approved','approved-with-conditions','retired'],
    'rejected':['rejected','draft','under-review','retired'],
    'retired':['retired']
  });

  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  function number(value) { const n=Number(value); return Number.isFinite(n)?n:null; }
  function mean(values) { return values.length ? values.reduce((sum,value)=>sum+value,0)/values.length : null; }
  function rms(values) { return values.length ? Math.sqrt(values.reduce((sum,value)=>sum+value*value,0)/values.length) : null; }

  function validateTransition(previousStatus, nextStatus) {
    const previous = STATUSES.includes(previousStatus) ? previousStatus : 'draft';
    if (!STATUSES.includes(nextStatus)) return { valid:false, error:`Unknown lifecycle status: ${nextStatus}.` };
    const allowed = TRANSITIONS[previous] || [];
    return allowed.includes(nextStatus)
      ? { valid:true, previous, next:nextStatus }
      : { valid:false, previous, next:nextStatus, error:`A model cannot move directly from ${previous} to ${nextStatus}.` };
  }

  function lifecycleStatus(approval, referenceDate) {
    const a = approval || {};
    const status = STATUSES.includes(a.status) ? a.status : 'draft';
    if (['approved','approved-with-conditions'].includes(status) && a.reviewDate) {
      const today = referenceDate || new Date().toISOString().slice(0,10);
      if (String(a.reviewDate) < today) return 'expired';
    }
    return status;
  }

  function appendLifecycleEvent(previousApproval, nextApproval, role) {
    const previous = previousApproval || { status:'draft', history:[] };
    const next = clone(nextApproval || {});
    const transition = validateTransition(lifecycleStatus(previous), next.status || 'draft');
    if (!transition.valid) throw new Error(transition.error);
    const history = Array.isArray(previous.history) ? clone(previous.history) : [];
    history.push({
      recordedAt:new Date().toISOString(),
      fromStatus:transition.previous,
      status:transition.next,
      role:role || next.reviewerRole || 'reviewer',
      reviewer:next.reviewer || '',
      owner:next.owner || '',
      reviewDate:next.reviewDate || '',
      reason:next.notes || '',
      conditions:next.conditions || '',
      applicationVersion:VERSION
    });
    next.history = history;
    return next;
  }

  function inferMapping(headers) {
    const normalized = (headers || []).map(name => ({ name, key:String(name).trim().toLowerCase().replace(/[\s_-]+/g,'') }));
    const find = patterns => {
      const item = normalized.find(entry => patterns.includes(entry.key));
      return item ? item.name : '';
    };
    return {
      measured:find(['actual','measured','observed','target','ytrue','measuredtarget','actualtarget']),
      predicted:find(['prediction','predicted','ypred','predictedtarget']),
      lower:find(['lower','lowerbound','lowerintervalbound','predictionlower']),
      upper:find(['upper','upperbound','upperintervalbound','predictionupper']),
      group:find(['source','site','group','regime','batch']),
      date:find(['date','predictiondate','measurementdate','timestamp']),
      applicability:find(['applicabilitystatus','applicability_status'])
    };
  }

  function metricsFromPairs(pairs) {
    if (!pairs.length) return { count:0,rmse:null,mae:null,r2:null,bias:null,coverage:null,meanIntervalWidth:null };
    const errors = pairs.map(pair => pair.predicted - pair.measured);
    const measuredMean = mean(pairs.map(pair => pair.measured));
    const ssRes = errors.reduce((sum,error)=>sum+error*error,0);
    const ssTot = pairs.reduce((sum,pair)=>sum+(pair.measured-measuredMean)*(pair.measured-measuredMean),0);
    const intervals = pairs.filter(pair => Number.isFinite(pair.lower) && Number.isFinite(pair.upper));
    return {
      count:pairs.length,
      rmse:rms(errors),
      mae:mean(errors.map(Math.abs)),
      r2:ssTot>0?1-ssRes/ssTot:null,
      bias:mean(errors),
      coverage:intervals.length?intervals.filter(pair=>pair.measured>=pair.lower&&pair.measured<=pair.upper).length/intervals.length:null,
      meanIntervalWidth:intervals.length?mean(intervals.map(pair=>pair.upper-pair.lower)):null
    };
  }

  function analyseMonitoring(rows, mappingInput) {
    const rowsArray = Array.isArray(rows) ? rows : [];
    const mapping = Object.assign({}, inferMapping(rowsArray[0] ? Object.keys(rowsArray[0]) : []), mappingInput || {});
    if (!mapping.measured || !mapping.predicted) throw new Error('Choose measured-target and predicted-target columns.');
    const pairs = [];
    let invalidRows = 0;
    rowsArray.forEach((row,index) => {
      const measured=number(row[mapping.measured]), predicted=number(row[mapping.predicted]);
      if (measured == null || predicted == null) { invalidRows += 1; return; }
      pairs.push({
        rowIndex:index,
        measured,
        predicted,
        lower:mapping.lower?number(row[mapping.lower]):null,
        upper:mapping.upper?number(row[mapping.upper]):null,
        group:mapping.group?String(row[mapping.group] ?? 'Missing'):'All rows',
        date:mapping.date?String(row[mapping.date] ?? ''):'',
        applicability:mapping.applicability?String(row[mapping.applicability] ?? ''):''
      });
    });
    const groups = new Map();
    pairs.forEach(pair => { if (!groups.has(pair.group)) groups.set(pair.group,[]); groups.get(pair.group).push(pair); });
    const groupMetrics = Array.from(groups.entries()).map(([group,values]) => ({ group, ...metricsFromPairs(values) })).sort((a,b)=>String(a.group).localeCompare(String(b.group)));
    const applicabilityCounts = {};
    pairs.forEach(pair => { const key=pair.applicability||'not-recorded'; applicabilityCounts[key]=(applicabilityCounts[key]||0)+1; });
    return {
      artifactType:'local-regression-monitoring-record',
      schemaVersion:1,
      applicationVersion:VERSION,
      createdAt:new Date().toISOString(),
      mapping,
      rowCount:rowsArray.length,
      usableRows:pairs.length,
      invalidRows,
      metrics:metricsFromPairs(pairs),
      groupMetrics,
      applicabilityCounts,
      dateRange:{ minimum:pairs.map(pair=>pair.date).filter(Boolean).sort()[0]||null, maximum:pairs.map(pair=>pair.date).filter(Boolean).sort().slice(-1)[0]||null },
      records:pairs
    };
  }

  function parseRule(value) { const n=Number(value); return value==null||value===''||!Number.isFinite(n)?null:n; }

  function evaluateRevalidation(monitoring, rulesInput) {
    const rules = Object.assign({ maxRmse:null,maxAbsoluteBias:null,minCoverage:null,maxOutsideRate:null,reviewDate:'' }, rulesInput || {});
    rules.maxRmse=parseRule(rules.maxRmse);rules.maxAbsoluteBias=parseRule(rules.maxAbsoluteBias);rules.minCoverage=parseRule(rules.minCoverage);rules.maxOutsideRate=parseRule(rules.maxOutsideRate);
    const outcomes=[];
    const add=(code,label,actual,requirement,failed,note)=>outcomes.push({code,label,actual,requirement,status:failed?'fail':'pass',note:note||''});
    const m=monitoring&&monitoring.metrics||{};
    if(rules.maxRmse!=null&&m.rmse!=null)add('rmse','Monitoring RMSE',m.rmse,`≤ ${rules.maxRmse}`,m.rmse>rules.maxRmse);
    if(rules.maxAbsoluteBias!=null&&m.bias!=null)add('bias','Absolute monitoring bias',Math.abs(m.bias),`≤ ${rules.maxAbsoluteBias}`,Math.abs(m.bias)>rules.maxAbsoluteBias);
    if(rules.minCoverage!=null&&m.coverage!=null)add('coverage','Monitoring interval coverage',m.coverage,`≥ ${rules.minCoverage}`,m.coverage<rules.minCoverage);
    if(rules.maxOutsideRate!=null&&monitoring){
      const outside=(monitoring.applicabilityCounts['outside-domain']||0)+(monitoring.applicabilityCounts.warning||0);
      const rate=monitoring.usableRows?outside/monitoring.usableRows:0;
      add('outside_rate','Outside-domain or warning rate',rate,`≤ ${rules.maxOutsideRate}`,rate>rules.maxOutsideRate);
    }
    if(rules.reviewDate){
      const today=new Date().toISOString().slice(0,10);add('review_date','Review date',rules.reviewDate,`≥ ${today}`,rules.reviewDate<today,rules.reviewDate<today?'The configured review date has passed.':'');
    }
    const failed=outcomes.filter(item=>item.status==='fail');
    return { version:VERSION,evaluatedAt:new Date().toISOString(),overall:failed.length?'fail':outcomes.length?'pass':'not-evaluated',recommendedAction:failed.length?'require-review':'continue',rules,outcomes };
  }

  function modelChangeComparison(oldArtifact, newArtifact) {
    if(!oldArtifact||!newArtifact)throw new Error('Two fitted model artifacts are required.');
    const oldFeatures=oldArtifact.selectedFeatures||[],newFeatures=newArtifact.selectedFeatures||[];
    const oldSet=new Set(oldFeatures),newSet=new Set(newFeatures);
    const oldMetrics=oldArtifact.evaluation&&oldArtifact.evaluation.test&&oldArtifact.evaluation.test.pointMetrics||{};
    const newMetrics=newArtifact.evaluation&&newArtifact.evaluation.test&&newArtifact.evaluation.test.pointMetrics||{};
    const delta=(next,previous)=>Number.isFinite(Number(next))&&Number.isFinite(Number(previous))?Number(next)-Number(previous):null;
    return {
      artifactType:'local-regression-model-change-assessment',schemaVersion:1,applicationVersion:VERSION,createdAt:new Date().toISOString(),
      oldExperimentId:oldArtifact.experimentId||null,newExperimentId:newArtifact.experimentId||null,
      changes:{
        modelType:{old:oldArtifact.modelType||null,new:newArtifact.modelType||null,changed:oldArtifact.modelType!==newArtifact.modelType},
        target:{old:oldArtifact.target||null,new:newArtifact.target||null,changed:oldArtifact.target!==newArtifact.target},
        addedFeatures:newFeatures.filter(feature=>!oldSet.has(feature)),removedFeatures:oldFeatures.filter(feature=>!newSet.has(feature)),
        preprocessingChanged:JSON.stringify(oldArtifact.preprocessor&&oldArtifact.preprocessor.config||null)!==JSON.stringify(newArtifact.preprocessor&&newArtifact.preprocessor.config||null),
        datasetFingerprintChanged:(oldArtifact.dataset&&oldArtifact.dataset.fingerprint&&oldArtifact.dataset.fingerprint.value||null)!==(newArtifact.dataset&&newArtifact.dataset.fingerprint&&newArtifact.dataset.fingerprint.value||null)
      },
      performance:{ old:clone(oldMetrics),new:clone(newMetrics),delta:{rmse:delta(newMetrics.rmse,oldMetrics.rmse),mae:delta(newMetrics.mae,oldMetrics.mae),r2:delta(newMetrics.r2,oldMetrics.r2),bias:delta(newMetrics.bias,oldMetrics.bias)} }
    };
  }

  global.LRSGovernance=Object.freeze({version:VERSION,statuses:STATUSES,transitions:TRANSITIONS,validateTransition,lifecycleStatus,appendLifecycleEvent,inferMapping,analyseMonitoring,evaluateRevalidation,modelChangeComparison,metricsFromPairs,clone});
})(typeof window !== 'undefined' ? window : globalThis);
