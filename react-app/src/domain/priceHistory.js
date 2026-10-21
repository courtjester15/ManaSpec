const DAY_MS = 86_400_000;

export const PRICE_HISTORY_RANGES = Object.freeze([
  { key: "1w", label: "1W", days: 7 },
  { key: "1m", label: "1M", days: 30 },
  { key: "3m", label: "3M", days: 90 },
  { key: "1y", label: "1Y", days: 365 },
  { key: "all", label: "All", days: null },
]);

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function getPriceHistoryTimestamp(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const timestamp = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const date = new Date(timestamp);
  return date.getUTCFullYear() === Number(match[1])
    && date.getUTCMonth() === Number(match[2]) - 1
    && date.getUTCDate() === Number(match[3])
    ? timestamp
    : null;
}

export function normalizePriceHistory(rows = []) {
  const observations = new Map();
  rows.forEach((row, index) => {
    const timestamp = getPriceHistoryTimestamp(row?.date);
    const price = positiveNumber(row?.price);
    if (timestamp === null || price === null) return;
    const date = new Date(timestamp).toISOString().slice(0, 10);
    const observation = { ...row, date, price, timestamp, source: row.source || "scryfall", sourceIndex: index };
    const current = observations.get(date);
    const currentSaved = new Date(current?.savedAt || 0).getTime();
    const nextSaved = new Date(observation.savedAt || 0).getTime();
    if (!current || nextSaved >= currentSaved) observations.set(date, observation);
  });
  return [...observations.values()]
    .sort((left, right) => left.timestamp - right.timestamp || left.sourceIndex - right.sourceIndex)
    .map(({ sourceIndex, ...observation }) => observation);
}

export function getPriceHistoryCoverage(rows = []) {
  const history = normalizePriceHistory(rows);
  if (!history.length) return { observationCount: 0, days: 0, oldest: null, newest: null };
  return {
    observationCount: history.length,
    days: Math.max(1, Math.round((history.at(-1).timestamp - history[0].timestamp) / DAY_MS)),
    oldest: history[0].date,
    newest: history.at(-1).date,
  };
}

export function filterPriceHistoryRange(rows = [], rangeKey = "all") {
  const history = normalizePriceHistory(rows);
  const range = PRICE_HISTORY_RANGES.find(candidate => candidate.key === rangeKey);
  if (!history.length || !range?.days) return history;
  const cutoff = history.at(-1).timestamp - range.days * DAY_MS;
  return history.filter(observation => observation.timestamp >= cutoff);
}

export function getPriceHistoryRangeState(rows = []) {
  const history = normalizePriceHistory(rows);
  return PRICE_HISTORY_RANGES.map(range => ({
    ...range,
    observationCount: filterPriceHistoryRange(history, range.key).length,
    enabled: range.key === "all" || filterPriceHistoryRange(history, range.key).length >= 2,
  }));
}

export function choosePriceHistoryRange(rows = []) {
  const coverage = getPriceHistoryCoverage(rows);
  const ranges = getPriceHistoryRangeState(rows);
  if (coverage.days >= 365 && ranges.find(range => range.key === "1y")?.enabled) return "1y";
  if (coverage.days >= 30 && ranges.find(range => range.key === "1m")?.enabled) return "1m";
  return "all";
}

export function calculatePriceHistoryMetrics(rows = []) {
  const history = normalizePriceHistory(rows);
  if (!history.length) return {
    observationCount: 0,
    latest: null,
    prior: null,
    changeAmount: null,
    changePercent: null,
    high: null,
    low: null,
    oldest: null,
    newest: null,
  };
  const latest = history.at(-1);
  const prior = history.length >= 2 ? history.at(-2) : null;
  const prices = history.map(observation => observation.price);
  return {
    observationCount: history.length,
    latest,
    prior,
    changeAmount: prior ? latest.price - prior.price : null,
    changePercent: prior ? ((latest.price - prior.price) / prior.price) * 100 : null,
    high: Math.max(...prices),
    low: Math.min(...prices),
    oldest: history[0].date,
    newest: latest.date,
  };
}
