/**
 * claims-metrics.js --- MVP: Claims Metrics and Statistics
 * Namespace: FMStock.ui.claims.metrics
 */

window.FMStock = window.FMStock || {};
window.FMStock.ui = window.FMStock.ui || {};
window.FMStock.ui.claims = window.FMStock.ui.claims || {};

function getClaimsStats(claims, evaluations) {
  if (!claims || !claims.length) return { total: 0, byDirection: {}, byVerdict: {}, avgAccuracy: 0 };
  var total = claims.length, byDirection = {}, byVerdict = {};
  var correct = 0, evaled = 0;
  claims.forEach(function(c) {
    var d = c.direction || "unknown";
    byDirection[d] = (byDirection[d] || 0) + 1;
    var e = (evaluations || []).find(function(x) { return x.claimId === c.id; });
    var v = (e && e.result) || "pending";
    byVerdict[v] = (byVerdict[v] || 0) + 1;
    if (v === "correct" || v === "hit") correct++;
    if (v !== "pending" && v !== "Pending") evaled++;
  });
  return { total: total, byDirection: byDirection, byVerdict: byVerdict, avgAccuracy: evaled > 0 ? correct / evaled : 0 };
}

function getFilterOptions(claims, data) {
  return {
    speakers: [...new Set((claims || []).map(function(c) { return c.expertId; }).filter(Boolean))],
    tickers: [...new Set((claims || []).map(function(c) { return c.ticker; }).filter(Boolean))],
    directions: ["bullish", "bearish", "neutral"],
    verdicts: ["correct", "partial", "wrong", "pending"]
  };
}

function getDateRange(claims) {
  if (!claims || !claims.length) return { min: null, max: null };
  var dates = claims.map(function(c) { return c.baseDate; }).filter(Boolean).sort();
  return { min: dates[0] || null, max: dates[dates.length - 1] || null };
}

window.FMStock.ui.claims.metrics = {
  getClaimsStats: getClaimsStats,
  getFilterOptions: getFilterOptions,
  getDateRange: getDateRange
};
