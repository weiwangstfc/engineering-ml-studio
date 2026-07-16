(function (global) {
  'use strict';

  const VERSION = '1.0.11';
  const SEVERITY_ORDER = Object.freeze({ critical:0, warning:1, information:2 });

  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  function isMissing(value) { return value == null || String(value).trim() === ''; }
  function toNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (isMissing(value)) return NaN;
    const parsed = Number(String(value).replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  function mean(values) { return values.length ? values.reduce((a,b)=>a+b,0)/values.length : NaN; }
  function canonicalRow(row, headers) { return headers.map(name => String(row[name] ?? '')).join('\u241f'); }

  function correlation(rows, left, right) {
    const pairs = rows.map(row => [toNumber(row[left]), toNumber(row[right])]).filter(pair => pair.every(Number.isFinite));
    if (pairs.length < 4) return null;
    const xs=pairs.map(p=>p[0]), ys=pairs.map(p=>p[1]), mx=mean(xs), my=mean(ys);
    let numerator=0, dx=0, dy=0;
    for (let i=0;i<pairs.length;i++) { const a=xs[i]-mx,b=ys[i]-my; numerator+=a*b; dx+=a*a; dy+=b*b; }
    if (dx <= 0 || dy <= 0) return null;
    return numerator / Math.sqrt(dx*dy);
  }

  function finding(severity, code, title, details, columns, affectedRows, recommendation) {
    return { severity, code, title, details, columns:columns || [], affectedRows:Number.isFinite(affectedRows)?affectedRows:null, recommendation:recommendation || '' };
  }

  function analyseDataQuality(rows, headers, profiles, options) {
    const opts=options || {}, target=opts.target || '', selected=Array.from(opts.selectedFeatures || []), selectedSet=new Set(selected);
    const findings=[];
    if (!rows.length) return { version:VERSION, createdAt:new Date().toISOString(), counts:{critical:1,warning:0,information:0}, findings:[finding('critical','empty_dataset','No usable rows','The dataset has no usable rows.',[],0,'Load a non-empty CSV file.')] };

    if (rows.length < 50) findings.push(finding('warning','small_dataset','Small dataset',`Only ${rows.length} rows are available. Validation and test metrics may be unstable.`,[],rows.length,'Use additional representative observations when possible.'));

    const seen=new Map(); let duplicateCount=0;
    for (const row of rows) { const key=canonicalRow(row,headers); if (seen.has(key)) duplicateCount++; else seen.set(key,1); }
    if (duplicateCount) findings.push(finding(duplicateCount/rows.length > .1 ? 'critical':'warning','duplicate_rows','Duplicate rows detected',`${duplicateCount} rows exactly duplicate an earlier row across all imported columns.`,headers,duplicateCount,'Check whether duplicates are intentional replicates. Remove accidental duplicates before fitting.'));

    const relevant = target ? [target, ...selected.filter(name=>name!==target)] : selected;
    for (const name of relevant) {
      const profile=profiles && profiles[name] || {};
      const missing=rows.reduce((count,row)=>count+(isMissing(row[name])?1:0),0);
      const missingRate=missing/rows.length;
      if (missingRate >= .5) findings.push(finding('critical','high_missing',`Very high missingness in ${name}`,`${(missingRate*100).toFixed(1)}% of rows are missing.`,[name],missing,'Remove the feature, improve data collection, or use a defensible missing-data strategy.'));
      else if (missingRate >= .2) findings.push(finding('warning','moderate_missing',`Substantial missingness in ${name}`,`${(missingRate*100).toFixed(1)}% of rows are missing.`,[name],missing,'Review whether imputation or row removal could bias the model.'));

      const values=rows.map(row=>row[name]).filter(value=>!isMissing(value)).map(String);
      const counts=new Map(); values.forEach(value=>counts.set(value,(counts.get(value)||0)+1));
      const unique=counts.size;
      if (unique <= 1) findings.push(finding('critical','constant_column',`Constant selected column: ${name}`,'The column has no usable variation and cannot explain target variation.',[name],values.length,'Remove this column from the selected features.'));
      else {
        const dominant=Math.max(...counts.values())/Math.max(1,values.length);
        if (dominant >= .98) findings.push(finding('warning','near_constant',`Near-constant selected column: ${name}`,`${(dominant*100).toFixed(1)}% of non-missing rows have the same value.`,[name],Math.round(dominant*values.length),'Consider removing it unless the rare values are scientifically important.'));
      }
      if (selectedSet.has(name) && profile.idLike) findings.push(finding('warning','id_like_feature',`ID-like feature selected: ${name}`,'This column appears to identify rows rather than represent a repeatable predictor.',[name],null,'Remove identifiers unless they encode a justified, repeatable effect.'));
      if (selectedSet.has(name) && profile.type === 'categorical' && unique > 50) findings.push(finding('warning','high_cardinality',`High-cardinality category: ${name}`,`${unique} distinct non-missing values may create a wide or sparse encoding.`,[name],null,'Group rare levels, use a defensible category cap, or reconsider the feature.'));
    }

    if (!target) findings.push(finding('information','target_not_selected','Target not selected','Target-specific leakage and missing-target checks will run after a target is selected.',[],null,'Select the target column.'));
    else {
      const missingTarget=rows.reduce((count,row)=>count+(!Number.isFinite(toNumber(row[target]))?1:0),0);
      if (missingTarget) findings.push(finding(missingTarget/rows.length>.2?'critical':'warning','missing_target','Missing or nonnumeric target values',`${missingTarget} rows do not contain a usable numeric target.`,[target],missingTarget,'Correct or exclude these rows before interpreting model performance.'));
      for (const feature of selected) {
        if (feature === target || !profiles || profiles[feature]?.type !== 'numeric') continue;
        const pairs=rows.map(row=>[toNumber(row[feature]),toNumber(row[target])]).filter(p=>p.every(Number.isFinite));
        if (pairs.length < 4) continue;
        const exactlyEqual=pairs.every(([x,y])=>Math.abs(x-y)<=1e-12);
        if (exactlyEqual) findings.push(finding('critical','exact_target_leakage',`Possible target leakage: ${feature}`,`The selected feature equals ${target} for every usable paired row.`,[feature,target],pairs.length,'Remove the feature unless it is genuinely available before prediction and is not derived from the target.'));
        else {
          const corr=correlation(rows,feature,target);
          if (corr != null && Math.abs(corr) >= .995) findings.push(finding('warning','extreme_target_correlation',`Extreme target correlation: ${feature}`,`The absolute Pearson correlation with ${target} is ${Math.abs(corr).toFixed(4)}.`,[feature,target],pairs.length,'Investigate whether the feature is measured after the outcome or calculated from it.'));
        }
      }
    }

    if (!selected.length) findings.push(finding('information','features_not_selected','No input features selected','Feature-specific quality checks will update after features are selected.',[],null,'Select or automatically detect input features.'));
    if (!findings.length) findings.push(finding('information','no_findings','No configured data-quality warning was triggered','The automated checks found no issue under the current target and feature selection.',[],0,'Continue with domain review; automated checks cannot prove that data are suitable.'));

    findings.sort((a,b)=>(SEVERITY_ORDER[a.severity]??9)-(SEVERITY_ORDER[b.severity]??9)||a.title.localeCompare(b.title));
    const counts={critical:0,warning:0,information:0}; findings.forEach(item=>{counts[item.severity]=(counts[item.severity]||0)+1;});
    return { version:VERSION, createdAt:new Date().toISOString(), target:target||null, selectedFeatures:selected, rowCount:rows.length, columnCount:headers.length, counts, findings };
  }

  function sourceValue(row, column) {
    if (!row || !column) return null;
    if (row.metadata && Object.prototype.hasOwnProperty.call(row.metadata,column)) return row.metadata[column];
    if (row.features && Object.prototype.hasOwnProperty.call(row.features,column)) return row.features[column];
    return null;
  }

  function pointMetrics(rows) {
    const usable=(rows||[]).filter(row=>Number.isFinite(Number(row.actual))&&Number.isFinite(Number(row.prediction)));
    if (!usable.length) return {count:0,rmse:null,mae:null,r2:null,bias:null,coverage:null};
    const actual=usable.map(row=>Number(row.actual)), prediction=usable.map(row=>Number(row.prediction));
    const residual=actual.map((value,index)=>value-prediction[index]);
    const mse=mean(residual.map(value=>value*value)), mae=mean(residual.map(Math.abs)), bias=mean(residual), actualMean=mean(actual);
    const ssRes=residual.reduce((sum,value)=>sum+value*value,0), ssTot=actual.reduce((sum,value)=>sum+(value-actualMean)**2,0);
    const covered=usable.filter(row=>typeof row.covered==='boolean');
    return {count:usable.length,rmse:Math.sqrt(mse),mae,r2:ssTot>0?1-ssRes/ssTot:null,bias,coverage:covered.length?covered.filter(row=>row.covered).length/covered.length:null};
  }

  function groupPerformance(rows, column) {
    if (!column) return [];
    const groups=new Map();
    for (const row of rows||[]) { const raw=sourceValue(row,column); const key=isMissing(raw)?'Missing':String(raw); if(!groups.has(key))groups.set(key,[]); groups.get(key).push(row); }
    return Array.from(groups.entries()).map(([group,items])=>({group,...pointMetrics(items)})).sort((a,b)=>(b.count-a.count)||a.group.localeCompare(b.group));
  }

  function parseCriterion(value) { const number=Number(value); return value==null || value==='' || !Number.isFinite(number) ? null : number; }

  function evaluateAcceptance(artifact, dataQuality, criteria, groupColumn) {
    const c={
      maxTestRmse:parseCriterion(criteria&&criteria.maxTestRmse),
      minTestR2:parseCriterion(criteria&&criteria.minTestR2),
      minCoverage:parseCriterion(criteria&&criteria.minCoverage),
      maxCoverage:parseCriterion(criteria&&criteria.maxCoverage),
      maxGroupRmse:parseCriterion(criteria&&criteria.maxGroupRmse),
      requireNoCritical:Boolean(criteria&&criteria.requireNoCritical)
    };
    const test=artifact&&artifact.evaluation&&artifact.evaluation.test || {};
    const pm=test.pointMetrics||{}, um=test.uncertaintyMetrics||{};
    const groups=groupPerformance(artifact&&artifact.diagnosticData&&artifact.diagnosticData.test || [],groupColumn);
    const outcomes=[];
    const add=(key,label,actual,requirement,pass,note)=>outcomes.push({key,label,actual:Number.isFinite(Number(actual))?Number(actual):null,requirement,status:pass==null?'not-evaluated':pass?'pass':'fail',note:note||''});
    add('maxTestRmse','Maximum test RMSE',pm.rmse,c.maxTestRmse==null?'Not configured':`≤ ${c.maxTestRmse}`,c.maxTestRmse==null||!Number.isFinite(Number(pm.rmse))?null:Number(pm.rmse)<=c.maxTestRmse);
    add('minTestR2','Minimum test R²',pm.r2,c.minTestR2==null?'Not configured':`≥ ${c.minTestR2}`,c.minTestR2==null||!Number.isFinite(Number(pm.r2))?null:Number(pm.r2)>=c.minTestR2);
    const coverage=Number(um.coverage);
    const coverageConfigured=c.minCoverage!=null||c.maxCoverage!=null;
    const coveragePass=!coverageConfigured||!Number.isFinite(coverage)?null:(c.minCoverage==null||coverage>=c.minCoverage)&&(c.maxCoverage==null||coverage<=c.maxCoverage);
    add('coverage','Test interval coverage',coverage,coverageConfigured?`${c.minCoverage==null?'−∞':c.minCoverage} to ${c.maxCoverage==null?'∞':c.maxCoverage}`:'Not configured',coveragePass,!Number.isFinite(coverage)&&coverageConfigured?'No interval coverage is available.':'');
    const worstGroup=groups.filter(row=>Number.isFinite(row.rmse)).sort((a,b)=>b.rmse-a.rmse)[0];
    add('maxGroupRmse','Maximum group test RMSE',worstGroup&&worstGroup.rmse,c.maxGroupRmse==null?'Not configured':`≤ ${c.maxGroupRmse}`,c.maxGroupRmse==null||!groupColumn||!worstGroup?null:worstGroup.rmse<=c.maxGroupRmse,!groupColumn&&c.maxGroupRmse!=null?'Choose a group column.':worstGroup?`Worst group: ${worstGroup.group}`:'');
    const critical=dataQuality&&dataQuality.counts?Number(dataQuality.counts.critical)||0:0;
    add('noCritical','No critical data-quality findings',critical,c.requireNoCritical?'0 critical findings':'Not required',!c.requireNoCritical?null:critical===0);
    const evaluated=outcomes.filter(item=>item.status!=='not-evaluated');
    const overall=evaluated.some(item=>item.status==='fail')?'fail':evaluated.length?'pass':'not-evaluated';
    return {version:VERSION,evaluatedAt:new Date().toISOString(),overall,criteria:c,groupColumn:groupColumn||null,groupPerformance:groups,outcomes};
  }

  function assessApplicability(rows, preprocessor) {
    const features=preprocessor&&preprocessor.features || [];
    return (rows||[]).map((row,index)=>{
      const issues=[]; let rank=0;
      for (const feature of features) {
        if (feature.type==='numeric') {
          const value=toNumber(row[feature.name]);
          if (!Number.isFinite(value)) {
            issues.push({severity:feature.missing==='drop'?'critical':'warning',code:'missing_numeric',feature:feature.name,message:`${feature.name} is missing and will ${feature.missing==='drop'?'cause the row to be dropped':'be imputed'}.`});
            rank=Math.max(rank,feature.missing==='drop'?3:2); continue;
          }
          const span=Number(feature.max)-Number(feature.min);
          if (value<feature.min || value>feature.max) {
            const side=value<feature.min?'below':'above', distance=value<feature.min?feature.min-value:value-feature.max;
            issues.push({severity:'warning',code:'outside_numeric_range',feature:feature.name,message:`${feature.name} is ${side} the training range [${feature.min}, ${feature.max}] by ${distance}.`}); rank=Math.max(rank,3);
          } else if (span>0 && (value-feature.min <= .05*span || feature.max-value <= .05*span)) {
            issues.push({severity:'information',code:'near_numeric_boundary',feature:feature.name,message:`${feature.name} is within 5% of a training-range boundary.`}); rank=Math.max(rank,1);
          }
        } else {
          let value=isMissing(row[feature.name])?null:String(row[feature.name]);
          if (value==null) {
            if (feature.missing==='drop') { issues.push({severity:'critical',code:'missing_category',feature:feature.name,message:`${feature.name} is missing and will cause the row to be dropped.`}); rank=Math.max(rank,3); }
            else { issues.push({severity:'information',code:'imputed_category',feature:feature.name,message:`${feature.name} is missing and will be replaced during preprocessing.`}); rank=Math.max(rank,1); }
          } else if (!feature.categories.includes(value)) {
            issues.push({severity:'warning',code:'unseen_category',feature:feature.name,message:`${feature.name} contains unseen category “${value}”.`}); rank=Math.max(rank,2);
          }
        }
      }
      const status=rank>=3?'outside-domain':rank===2?'warning':rank===1?'near-boundary':'within-domain';
      return {rowIndex:index,status,issueCount:issues.length,issues};
    });
  }

  function summariseApplicability(assessments, includedIndices) {
    const include=includedIndices?new Set(includedIndices):null;
    const counts={'within-domain':0,'near-boundary':0,'warning':0,'outside-domain':0,dropped:0};
    for (const item of assessments||[]) { if(include && !include.has(item.rowIndex)){counts.dropped++;continue;} counts[item.status]=(counts[item.status]||0)+1; }
    return {version:VERSION,counts,totalIncluded:Object.entries(counts).filter(([key])=>key!=='dropped').reduce((sum,[,value])=>sum+value,0)};
  }

  global.LRSValidation=Object.freeze({version:VERSION,analyseDataQuality,groupPerformance,evaluateAcceptance,assessApplicability,summariseApplicability,pointMetrics,clone});
})(typeof window !== 'undefined' ? window : globalThis);
