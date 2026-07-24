import { getRelatedRecordsForPrinting } from "./relatedRecords.js";

const DAY_MS = 86_400_000;
const SIGNAL_TILE_ROW_LIMIT = 3;

export const SIGNAL_BUCKETS = Object.freeze([
  { id: "targetsHit", label: "Targets Hit", detail: "Immediate buy/sell review" },
  { id: "approaching", label: "Approaching", detail: "Near or closest target" },
  { id: "noPlan", label: "No Plan", detail: "Missing required fields" },
  { id: "staleChecks", label: "Stale Checks", detail: "Missing or 30+ days old" },
]);

const number = value => Number(value || 0);

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(number(value));
}

function compareValues(left, right) {
  if (left === right) return 0;
  if (left === null || left === undefined) return 1;
  if (right === null || right === undefined) return -1;
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
}

function getHoldMonths(value) {
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function getTarget(item) {
  return number(item.owned ? item.exitTarget : item.entryTarget);
}

function getTargetState(item) {
  const price = number(item.currentPrice);
  const target = getTarget(item);
  if (!price || !target) return { state: "none", status: "", percent: 999, beyond: 0 };

  if (item.owned) {
    if (price >= target) {
      return { state: "hit", status: "Exit hit", percent: 0, beyond: ((price - target) / target) * 100 };
    }
    const percent = ((target - price) / target) * 100;
    return {
      state: percent <= 5 ? "approaching" : "watching",
      status: percent <= 5 ? "Exit near" : "",
      percent,
      beyond: 0,
    };
  }

  if (price <= target) {
    return { state: "hit", status: "Entry hit", percent: 0, beyond: ((target - price) / target) * 100 };
  }
  const percent = ((price - target) / target) * 100;
  return {
    state: percent <= 5 ? "approaching" : "watching",
    status: percent <= 5 ? "Entry near" : "",
    percent,
    beyond: 0,
  };
}

function getPlanState(item) {
  const missing = [];
  if (item.owned) {
    if (!number(item.exitTarget)) missing.push("Exit");
    if (!getHoldMonths(item.holdTime)) missing.push("Hold");
  } else if (!number(item.entryTarget)) {
    missing.push("Entry");
  }
  const rawDate = item.buyDate || item.addedDate || item.priceUpdatedAt || "";
  const date = rawDate ? new Date(rawDate) : null;
  return {
    missing,
    ageSort: date && !Number.isNaN(date.getTime()) ? date.getTime() : Number.MAX_SAFE_INTEGER,
  };
}

function getPriceAgeDays(item, now) {
  if (!item.priceUpdatedAt) return 9999;
  const date = new Date(item.priceUpdatedAt);
  if (Number.isNaN(date.getTime())) return 9999;
  return Math.floor(Math.max(0, now - date.getTime()) / DAY_MS);
}

function getMarketState(item, observations, trackedItems, now) {
  const observation = getRelatedRecordsForPrinting(observations, item, trackedItems)
    .filter(row => !row.source || row.source === "tcgplayer")
    .sort((a, b) => new Date(b.checkedAt || 0) - new Date(a.checkedAt || 0))[0];
  const checkedAt = observation?.checkedAt ? new Date(observation.checkedAt) : null;
  const ageDays = checkedAt && !Number.isNaN(checkedAt.getTime())
    ? Math.floor(Math.max(0, now - checkedAt.getTime()) / DAY_MS)
    : 9999;
  const priceAgeDays = getPriceAgeDays(item, now);

  if (!observation?.checkedAt) {
    return {
      state: "missing",
      priceState: priceAgeDays > 14 ? "stale" : "ok",
      label: "No check",
      detail: "No saved TCGplayer Market Check",
      ageDays,
      marketPrice: 0,
    };
  }
  if (ageDays >= 30) {
    return {
      state: "stale",
      priceState: priceAgeDays > 14 ? "stale" : "ok",
      label: `${ageDays}d old`,
      detail: `Market Check saved ${ageDays} days ago`,
      ageDays,
      marketPrice: number(observation.marketPrice),
    };
  }
  return {
    state: ageDays >= 7 ? "aging" : "fresh",
    priceState: priceAgeDays > 14 ? "stale" : "ok",
    label: ageDays <= 0 ? "Today" : `${ageDays}d old`,
    detail: `Market Check saved ${ageDays <= 0 ? "today" : `${ageDays} days ago`}`,
    ageDays,
    marketPrice: number(observation.marketPrice),
  };
}

function getBuckets(target, plan, market) {
  const buckets = [];
  if (target.state === "hit") buckets.push("targetsHit");
  if (target.state === "approaching") buckets.push("approaching");
  if (plan.missing.length) buckets.push("noPlan");
  if (market.state === "missing" || market.state === "stale") buckets.push("staleChecks");
  return buckets;
}

function getStatusLabel(status, buckets) {
  if (status && status !== "Watching") return status;
  if (buckets.includes("noPlan")) return "No plan";
  if (buckets.includes("staleChecks")) return "Market check";
  return status || "Watching";
}

function getActionLabel(item, status, buckets, state) {
  if (status === "Exit hit") return "SELL / Position";
  if (status === "Entry hit") return "BUY / Radar";
  if (status === "Exit near") return "REVIEW / Exit";
  if (status === "Entry near") return "REVIEW / Entry";
  if (status === "Hold due") return "REVIEW / Hold due";
  if (status === "Hold near") return "REVIEW / Hold near";
  if (!state.hasPlan) return "ADD PLAN";
  if (!state.hasTarget) return "ADD TARGET";
  if (buckets.includes("staleChecks")) return item.owned ? "MARKET / Position" : "MARKET / Radar";
  return item.owned ? "REVIEW / Position" : "WATCH / Radar";
}

function getReasonLabel(item, status, buckets, state) {
  if (status === "Exit hit") return "At or above exit";
  if (status === "Entry hit") return "At or below entry";
  if (status === "Exit near") return "Near exit target";
  if (status === "Entry near") return "Near entry target";
  if (status === "Hold due") return "Hold window due";
  if (status === "Hold near") return "Hold window near";
  if (buckets.includes("noPlan")) return `${state.plan.missing.join(" + ")} missing`;
  if (!state.hasTarget) return "No target price";
  if (buckets.includes("staleChecks")) return state.market.state === "missing" ? "No market check" : "Stale market check";
  return item.owned ? "Position review" : "Radar watch";
}

function formatTargetDetail(item, status, buckets) {
  return [
    item.owned ? "Position" : "Radar",
    status && status !== "Watching" ? status : "",
    buckets.includes("staleChecks") ? "Market check needed" : "",
    item.currentPrice ? `Now ${money(item.currentPrice)}` : "",
    item.entryTarget ? `Entry ${money(item.entryTarget)}` : "",
    item.exitTarget ? `Exit ${money(item.exitTarget)}` : "",
    item.holdTime ? `Hold ${item.holdTime}` : "",
  ].filter(Boolean).join(" / ");
}

function getReasonDetail(item, status, buckets, state) {
  const pieces = [
    `${item.owned ? "Positions" : "Radar"} row`,
    getReasonLabel(item, status, buckets, state),
    formatTargetDetail(item, status, buckets),
  ].filter(Boolean);
  if (state.market.detail && buckets.includes("staleChecks")) pieces.push(state.market.detail);
  return pieces.join(" / ");
}

function getPreviewReason(item, target, plan, market, buckets) {
  if (buckets.includes("targetsHit")) return item.owned ? `${target.beyond.toFixed(1)}% above exit` : `${target.beyond.toFixed(1)}% below entry`;
  if (buckets.includes("approaching")) return item.owned ? `${target.percent.toFixed(1)}% from exit` : `${target.percent.toFixed(1)}% from entry`;
  if (buckets.includes("noPlan")) return `${item.owned ? "Position" : "Radar"} missing ${plan.missing.join(" + ")}`;
  if (buckets.includes("staleChecks")) return market.state === "missing" ? "No market check" : `${market.ageDays}d since check`;
  return item.owned ? "Position review" : "Radar watch";
}

function getBucketPriority(item, target, plan, market) {
  return {
    targetsHit: target.state === "hit" ? -target.beyond : 9999,
    approaching: target.state === "approaching" || target.state === "watching" ? target.percent : 9999,
    noPlan: plan.missing.length ? (item.owned ? 10_000_000_000_000 : 0) + plan.ageSort : 99_999_999_999_999,
    staleChecks: market.state === "missing" ? 0 : Math.min(market.ageDays, 999),
  };
}

function getPriority(buckets, bucketPriority) {
  if (buckets.includes("targetsHit")) return bucketPriority.targetsHit;
  if (buckets.includes("approaching")) return 10 + bucketPriority.approaching / 1000;
  if (buckets.includes("noPlan")) return 20 + bucketPriority.noPlan / 1000;
  if (buckets.includes("staleChecks")) return 30 + bucketPriority.staleChecks / 1000;
  return 99;
}

function buildSignalRow(item, observations, trackedItems, now) {
  const target = getTargetState(item);
  const market = getMarketState(item, observations, trackedItems, now);
  const plan = getPlanState(item);
  const targetValue = getTarget(item);
  const buckets = getBuckets(target, plan, market);
  const state = { hasPlan: !plan.missing.length, hasTarget: Boolean(targetValue), market, plan };
  const source = item.owned ? "portfolio" : "radar";
  const currentPrice = number(item.currentPrice);
  const change = currentPrice && targetValue ? ((currentPrice - targetValue) / targetValue) * 100 : 0;
  const bucketPriority = getBucketPriority(item, target, plan, market);

  return {
    ...item,
    source,
    sourceLabel: item.owned ? "Position" : "Radar",
    status: getStatusLabel(target.status, buckets),
    actionLabel: getActionLabel(item, target.status, buckets, state),
    reasonLabel: getReasonLabel(item, target.status, buckets, state),
    reasonDetail: getReasonDetail(item, target.status, buckets, state),
    buckets,
    detail: formatTargetDetail(item, target.status, buckets),
    currentPrice,
    targetValue,
    targetState: target.state,
    targetPercent: target.percent,
    change,
    distanceSort: currentPrice && targetValue ? change : (source === "portfolio" ? -9999 : 9999),
    marketFreshness: market.label,
    marketDetail: market.detail,
    marketAgeSort: market.ageDays,
    marketPrice: market.marketPrice,
    previewReason: getPreviewReason(item, target, plan, market, buckets),
    missingPlanReasons: plan.missing,
    bucketPriority,
    priority: getPriority(buckets, bucketPriority),
  };
}

export function deriveSignalRows(state, options = {}) {
  const now = options.now === undefined ? Date.now() : new Date(options.now).getTime();
  const specs = Array.isArray(state.specs) ? state.specs : [];
  const radar = Array.isArray(state.radar) ? state.radar : [];
  const observations = Array.isArray(state.marketObservations) ? state.marketObservations : [];
  const trackedItems = [...specs, ...radar];
  const items = [
    ...specs.filter(item => number(item.qty) > 0).map(item => ({ ...item, owned: true })),
    ...radar.map(item => ({ ...item, owned: false })),
  ];
  return items
    .map(item => buildSignalRow(item, observations, trackedItems, now))
    .sort((a, b) => compareValues(a.priority, b.priority) || compareValues(a.name, b.name));
}

export function getActiveSignalRows(rows) {
  return rows.filter(row => row.buckets.length);
}

export function getSignalRowsForBucket(rows, bucketId, options = {}) {
  const bucketRows = rows.filter(row => row.buckets.includes(bucketId));
  let filledRows = bucketRows;
  if (bucketId === "approaching") {
    const limit = options.limit || 0;
    const existingIds = new Set(bucketRows.map(row => row.id));
    const candidates = rows
      .filter(row => !existingIds.has(row.id))
      .filter(row => row.targetState === "watching")
      .filter(row => Number.isFinite(row.targetPercent) && row.targetPercent > 5)
      .filter(row => row.currentPrice && row.targetValue)
      .sort((a, b) => compareValues(a.targetPercent, b.targetPercent) || compareValues(a.name, b.name));
    const fillCount = limit ? Math.max(0, limit - bucketRows.length) : candidates.length;
    filledRows = [...bucketRows, ...candidates.slice(0, fillCount)];
  }
  const sorted = [...filledRows].sort((a, b) => compareValues(a.bucketPriority?.[bucketId] ?? 9999, b.bucketPriority?.[bucketId] ?? 9999) || compareValues(a.name, b.name));
  return options.limit ? sorted.slice(0, options.limit) : sorted;
}

export function getSignalTileRows(rows, bucketId) {
  return getSignalRowsForBucket(rows, bucketId, { limit: SIGNAL_TILE_ROW_LIMIT });
}

export function filterSignalRows(rows, filters = {}) {
  const sourceRows = filters.bucketId
    ? getSignalRowsForBucket(rows, filters.bucketId)
    : getActiveSignalRows(rows);
  const query = String(filters.query || "").trim().toLowerCase();
  return sourceRows.filter(row => {
    if (filters.printingId && row.id !== filters.printingId) return false;
    if (!query) return true;
    return [row.name, row.set_code, row.collector_number, row.status, row.actionLabel, row.reasonLabel, row.sourceLabel]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

export function getSignalSourceNavigation(row) {
  return {
    pathname: row.source === "radar" ? "/radar" : "/positions",
    search: `?focus=${encodeURIComponent(row.id)}`,
  };
}

export function getSignalScryfallUrl(row) {
  const id = String(row.scryfall_id || row.id || "").replace(/\|.*$/, "");
  return `https://scryfall.com/card/${encodeURIComponent(id)}`;
}

function fillNearQueue(primary, rows, source) {
  if (primary.length >= 5) return primary.slice(0, 5);
  const existing = new Set(primary.map(row => row.id));
  const fallback = rows
    .filter(row => row.source === source && row.targetState === "watching" && row.currentPrice && row.targetValue)
    .filter(row => !existing.has(row.id))
    .sort((a, b) => compareValues(a.targetPercent, b.targetPercent) || compareValues(a.name, b.name))
    .slice(0, 5 - primary.length);
  return [...primary, ...fallback];
}

export function deriveDashboardSignalState(rows) {
  const activeRows = getActiveSignalRows(rows);
  const exitNear = activeRows.filter(row => row.status === "Exit near");
  const entryNear = activeRows.filter(row => row.status === "Entry near");
  const holdReviews = activeRows.filter(row => row.status === "Hold due" || row.status === "Hold near");
  const holdIds = new Set(holdReviews.map(row => row.id));
  return {
    activeRows,
    activeCount: activeRows.length,
    queues: {
      exitHits: activeRows.filter(row => row.status === "Exit hit").slice(0, 5),
      entryHits: activeRows.filter(row => row.status === "Entry hit").slice(0, 5),
      exitNear: fillNearQueue(exitNear, rows, "portfolio"),
      entryNear: fillNearQueue(entryNear, rows, "radar"),
      marketDue: activeRows.filter(row => row.buckets.includes("staleChecks")).slice(0, 5),
      holdDue: [
        ...holdReviews,
        ...activeRows.filter(row => row.buckets.includes("noPlan") && row.missingPlanReasons.includes("Hold") && !holdIds.has(row.id)),
      ].slice(0, 5),
      missingPlans: activeRows.filter(row => row.buckets.includes("noPlan")).slice(0, 5),
    },
  };
}
