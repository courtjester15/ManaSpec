function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function calculatePortfolioSummary(specs = [], cash = 0) {
  const open = specs.filter(spec => finite(spec.qty) > 0);
  const invested = open.reduce((total, spec) => total + finite(spec.buyPrice) * finite(spec.qty), 0);
  const value = open.reduce((total, spec) => total + finite(spec.currentPrice) * finite(spec.qty), 0);
  const profitLoss = value - invested;
  return {
    cash: finite(cash),
    invested,
    value,
    totalEquity: finite(cash) + value,
    profitLoss,
    profitLossPercent: invested > 0 ? (profitLoss / invested) * 100 : 0,
    openPositionCount: open.length,
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
