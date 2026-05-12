/**
 * claims-metrics.js --- MVP: Claims Metrics and Statistics
 */

export function getClaimsStats(claims, evaluations) {
  if (!claims||!claims.length) return {total:0,byDirection:{},byVerdict:{},avgAccuracy:0};
  const total=claims.length, byDirection={}, byVerdict={};
  let correct=0, evaled=0;
  claims.forEach(c=>{
    const d=c.direction||'unknown'; byDirection[d]=(byDirection[d]||0)+1;
    const e=(evaluations||[]).find(x=>x.claimId===c.id);
    const v=e?.verdict||'pending'; byVerdict[v]=(byVerdict[v]||0)+1;
    if(v==='correct') correct++;
    if(v!=='pending') evaled++;
  });
  return {total,byDirection,byVerdict,avgAccuracy:evaled>0?correct/evaled:0};
}

export function getFilterOptions(claims, data) {
  return {
    speakers:[...new Set((claims||[]).map(c=>c.speaker).filter(Boolean))],
    tickers:[...new Set((claims||[]).map(c=>c.ticker).filter(Boolean))],
    directions:['bullish','bearish','neutral'],
    verdicts:['correct','partial','wrong','pending'],
  };
}

export function getDateRange(claims) {
  if(!claims||!claims.length) return {min:null,max:null};
  const dates=claims.map(c=>c.date).filter(Boolean).sort();
  return {min:dates[0]||null,max:dates[dates.length-1]||null};
}
