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

export function selectPositionRows(specs = [], options = {}) {
  return specs.map(spec => buildPositionRow(spec, {
    notesCount: options.getNotesCount?.(spec) || 0,
    historyCount: options.getHistoryCount?.(spec) || 0,
  }));
}

export function calculatePortfolioSummary(specs = [], cash = 0) {
  const rows = specs.map(spec => isCanonicalPositionRow(spec) ? spec : buildPositionRow(spec));
  const open = rows.filter(row => row.validation.valid);
  const priced = open.filter(row => row.validation.calculationEligible);
  const invested = open.reduce((total, row) => total + row.averageBuyPrice * row.quantity, 0);
  const pricedInvested = priced.reduce((total, row) => total + row.averageBuyPrice * row.quantity, 0);
  const value = priced.reduce((total, row) => total + row.currentPrice * row.quantity, 0);
  const profitLoss = value - pricedInvested;
  return {
    cash: finite(cash),
    invested,
    value,
    totalEquity: finite(cash) + value,
    profitLoss,
    profitLossPercent: pricedInvested > 0 ? (profitLoss / pricedInvested) * 100 : 0,
    openPositionCount: open.length,
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
