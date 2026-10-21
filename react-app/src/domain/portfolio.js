import { getAssetKey } from "./assetIdentity.js";

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function positiveOrNull(value) {
  const number = finiteOrNull(value);
  return number !== null && number > 0 ? number : null;
}

function validDateOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function isCanonicalPositionRow(value) {
  return value?.validation?.type === "position" && Object.hasOwn(value, "sourceRecord");
}

export function buildPositionRow(spec, options = {}) {
  const sourceRecord = spec && typeof spec === "object" ? spec : {};
  const quantity = positiveOrNull(sourceRecord.qty);
  const averageBuyPrice = positiveOrNull(sourceRecord.buyPrice);
  const acquiredAt = validDateOrNull(sourceRecord.buyDate);
  const currentPrice = finiteOrNull(sourceRecord.currentPrice);
  const trackedPrintingKey = typeof sourceRecord.trackedPrintingKey === "string"
    ? sourceRecord.trackedPrintingKey.trim()
    : "";
  const exactPrintingIdentity = Boolean(
    trackedPrintingKey
    && sourceRecord.scryfall_id
    && ["nonfoil", "foil", "etched"].includes(sourceRecord.finish)
    && trackedPrintingKey === `${sourceRecord.scryfall_id}|${sourceRecord.finish}`
  );
  const issues = [];
  if (!exactPrintingIdentity) issues.push("invalid_printing_identity");
  if (quantity === null) issues.push("invalid_quantity");
  if (averageBuyPrice === null) issues.push("invalid_buy_price");
  if (acquiredAt === null) issues.push("invalid_buy_date");
  const currentPriceValid = currentPrice !== null && currentPrice >= 0;
  if (!currentPriceValid) issues.push("invalid_current_price");
  const requiredIssues = issues.filter(issue => issue !== "invalid_current_price");

  return {
    id: sourceRecord.id || trackedPrintingKey,
    assetType: "single",
    assetKey: getAssetKey(sourceRecord),
    trackedPrintingKey: trackedPrintingKey || null,
    name: sourceRecord.name,
    setCode: sourceRecord.set_code,
    set_code: sourceRecord.set_code,
    set_name: sourceRecord.set_name,
    collectorNumber: sourceRecord.collector_number,
    collector_number: sourceRecord.collector_number,
    finish: sourceRecord.finish,
    foil: sourceRecord.foil,
    rarity: sourceRecord.rarity,
    colors: sourceRecord.colors,
    color_identity: sourceRecord.color_identity,
    quantity,
    averageBuyPrice,
    acquiredAt,
    currentPrice,
    exitTarget: sourceRecord.exitTarget,
    holdTime: sourceRecord.holdTime,
    notesCount: Number(options.notesCount || 0),
    historyCount: Number(options.historyCount || 0),
    validation: {
      type: "position",
      valid: requiredIssues.length === 0,
      calculationEligible: requiredIssues.length === 0 && currentPriceValid,
      issues,
      requiredIssues,
    },
    sourceRecord,
  };
}

export function buildSealedPositionRow(spec, options = {}) {
  const sourceRecord = spec && typeof spec === "object" ? spec : {};
  const quantity = positiveOrNull(sourceRecord.qty);
  const averageBuyPrice = positiveOrNull(sourceRecord.buyPrice);
  const acquiredAt = validDateOrNull(sourceRecord.buyDate);
  const currentPrice = finiteOrNull(sourceRecord.currentPrice);
  const assetKey = getAssetKey(sourceRecord);
  const exactAssetIdentity = Boolean(assetKey && assetKey === sourceRecord.assetKey && assetKey.startsWith("sealed:"));
  const issues = [];
  if (!exactAssetIdentity) issues.push("invalid_asset_identity");
  if (quantity === null) issues.push("invalid_quantity");
  if (averageBuyPrice === null) issues.push("invalid_buy_price");
  if (acquiredAt === null) issues.push("invalid_buy_date");
  const currentPriceValid = currentPrice !== null && currentPrice > 0;
  if (!currentPriceValid) issues.push("invalid_current_price");
  const requiredIssues = issues.filter(issue => issue !== "invalid_current_price");

  return {
    id: sourceRecord.id || assetKey,
    assetType: "sealed",
    assetKey,
    trackedPrintingKey: null,
    name: sourceRecord.name,
    setCode: sourceRecord.set_code,
    set_code: sourceRecord.set_code,
    set_name: sourceRecord.set_name,
    collectorNumber: null,
    collector_number: null,
    finish: null,
    foil: null,
    category: sourceRecord.category,
    subtype: sourceRecord.subtype,
    productType: sourceRecord.productType || sourceRecord.category,
    quantity,
    averageBuyPrice,
    acquiredAt,
    currentPrice,
    priceUpdatedAt: sourceRecord.priceUpdatedAt,
    valuationSource: sourceRecord.valuationSource,
    exitTarget: sourceRecord.exitTarget,
    holdTime: sourceRecord.holdTime,
    notesCount: Number(options.notesCount || 0),
    historyCount: Number(options.historyCount || 0),
    validation: {
      type: "position",
      valid: requiredIssues.length === 0,
      calculationEligible: requiredIssues.length === 0 && currentPriceValid,
      issues,
      requiredIssues,
    },
    sourceRecord,
  };
}

export function selectPositionRows(specs = [], options = {}) {
  return specs.map(spec => buildPositionRow(spec, {
    notesCount: options.getNotesCount?.(spec) || 0,
    historyCount: options.getHistoryCount?.(spec) || 0,
  }));
}

export function selectSealedPositionRows(specs = [], options = {}) {
  return specs.map(spec => buildSealedPositionRow(spec, {
    notesCount: options.getNotesCount?.(spec) || 0,
    historyCount: options.getHistoryCount?.(spec) || 0,
  }));
}

export function filterPositionRows(rows = [], options = {}) {
  const focusId = String(options.focusId || "");
  const query = String(options.query || "").trim().toLowerCase();
  return rows.filter(row => {
    if (focusId && row.id !== focusId) return false;
    if (!query) return true;
    return [row.name, row.set_code, row.set_name, row.collector_number, row.productType, row.assetType]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}

export function calculatePortfolioSummary(specs = [], cash = 0, options = {}) {
  const rows = [
    ...specs.map(spec => isCanonicalPositionRow(spec) ? spec : buildPositionRow(spec)),
    ...(options.sealedSpecs || []).map(spec => isCanonicalPositionRow(spec) ? spec : buildSealedPositionRow(spec)),
  ];
  const open = rows.filter(row => row.validation.valid);
  const priced = open.filter(row => row.validation.calculationEligible);
  const invested = open.reduce((total, row) => total + row.averageBuyPrice * row.quantity, 0);
  const pricedInvested = priced.reduce((total, row) => total + row.averageBuyPrice * row.quantity, 0);
  const value = priced.reduce((total, row) => total + row.currentPrice * row.quantity, 0);
  const profitLoss = value - pricedInvested;
  const positionOutcomes = priced.map(row => ({
    row,
    value: row.currentPrice * row.quantity,
    profitLoss: (row.currentPrice - row.averageBuyPrice) * row.quantity,
  }));
  const concentration = positionOutcomes
    .filter(outcome => outcome.value > 0)
    .sort((left, right) => right.value - left.value)
    .map(outcome => ({
      id: outcome.row.id,
      name: outcome.row.name,
      trackedPrintingKey: outcome.row.trackedPrintingKey,
      assetKey: outcome.row.assetKey,
      assetType: outcome.row.assetType,
      value: outcome.value,
      sharePercent: value > 0 ? (outcome.value / value) * 100 : 0,
    }));
  const sellTransactions = [...(options.transactions || []), ...(options.sealedTransactions || [])]
    .filter(transaction => String(transaction?.type || "").toUpperCase() === "SELL");
  const realizedTransactions = sellTransactions.filter(transaction => finiteOrNull(transaction.realizedPL) !== null);
  const realizedProfitLoss = realizedTransactions.reduce((total, transaction) => total + finite(transaction.realizedPL), 0);
  const radarPlans = [...(options.radar || []), ...(options.sealedRadar || [])].map(item => ({
    quantity: positiveOrNull(item?.plannedQty ?? item?.targetQty),
    entryTarget: positiveOrNull(item?.entryTarget),
  }));
  const computableRadarPlans = radarPlans.filter(plan => plan.quantity !== null && plan.entryTarget !== null);
  const plannedRadarCapital = computableRadarPlans.reduce((total, plan) => total + plan.quantity * plan.entryTarget, 0);
  return {
    cash: finite(cash),
    invested,
    pricedInvested,
    value,
    totalEquity: finite(cash) + value,
    profitLoss,
    unrealizedProfitLoss: profitLoss,
    profitLossPercent: pricedInvested > 0 ? (profitLoss / pricedInvested) * 100 : 0,
    realizedProfitLoss,
    realizedSellCount: realizedTransactions.length,
    sellTransactionCount: sellTransactions.length,
    missingRealizedSellCount: sellTransactions.length - realizedTransactions.length,
    plannedRadarCapital,
    computableRadarPlanCount: computableRadarPlans.length,
    incompleteRadarPlanCount: radarPlans.length - computableRadarPlans.length,
    profitablePositionCount: positionOutcomes.filter(outcome => outcome.profitLoss > 0).length,
    losingPositionCount: positionOutcomes.filter(outcome => outcome.profitLoss < 0).length,
    flatPositionCount: positionOutcomes.filter(outcome => outcome.profitLoss === 0).length,
    positionConcentration: concentration,
    openPositionCount: open.length,
    pricedPositionCount: priced.length,
    invalidPositionCount: rows.length - open.length,
    unpricedPositionCount: open.length - priced.length,
  };
}
export function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(finite(value));
}

export function formatPriceRefreshStatus(status) {
  if (!status?.checkedAt) return "Prices: not checked this session";
  const date = new Date(status.checkedAt);
  if (Number.isNaN(date.getTime())) return "Prices: last check time unavailable";
  return `Prices checked ${date.toLocaleString()} (${finite(status.updatedCount)} cards)`;
}
