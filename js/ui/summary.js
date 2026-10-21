/*
====================================
SUMMARY SYSTEM
====================================

Handles:
- cash display
- portfolio value
- total P/L calculation
- total equity (cash + holdings)
- per-position P/L updates
====================================
*/

function updateTotals() {
  let invested = 0;
  let value = 0;
  let pricedInvested = 0;
  let unpriced = 0;

  specs.forEach(s => {
    invested += toFiniteNumber(s.buyPrice) * toFiniteNumber(s.qty);
    const price = getMarketPriceOrNull(s.currentPrice);
    if (price === null) { unpriced += 1; return; }
    value += price * toFiniteNumber(s.qty);
    pricedInvested += toFiniteNumber(s.buyPrice) * toFiniteNumber(s.qty);
  });

  const pl = value - pricedInvested;
  const plPercent = pricedInvested > 0 ? (pl / pricedInvested) * 100 : 0;

  const totalEquity = toFiniteNumber(cash) + value;

  // CASH / CORE METRICS
  const summaryNumberOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  document.getElementById("cash").innerText = formatNumber(cash, summaryNumberOptions);
  document.getElementById("invested").innerText = formatNumber(invested, summaryNumberOptions);
  document.getElementById("value").innerText = formatNumber(value, summaryNumberOptions);

  // TOTAL EQUITY (SAFE)
  const eqEl = document.getElementById("totalEquity");
  if (eqEl) {
    eqEl.innerText = formatNumber(totalEquity, summaryNumberOptions);
  }

  document.getElementById("value").title = `${unpriced} unpriced Positions excluded; cost basis retained`;

  // P/L
  const plEl = document.getElementById("totalPL");
  if (plEl) {
    plEl.innerText = `${pl >= 0 ? "+" : ""}${formatNumber(pl, summaryNumberOptions)} (${formatNumber(plPercent, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%)`;
    plEl.style.color = pl >= 0 ? "green" : "red";
  }
}

function updatePL() {
  specs.forEach(s => {
    s.pl = getMarketPriceOrNull(s.currentPrice) === null ? null : ((toFiniteNumber(s.currentPrice) - toFiniteNumber(s.buyPrice)) * toFiniteNumber(s.qty)).toFixed(2);
  });
}

function renderPriceRefreshStatus() {
  const statusEl = document.getElementById("priceRefreshStatus");
  if (!statusEl) return;

  const status = loadPriceRefreshStatus();

  if (!status || !status.checkedAt) {
    statusEl.innerText = "Prices: not checked this session";
    return;
  }

  const checkedAt = new Date(status.checkedAt);
  if (Number.isNaN(checkedAt.getTime())) {
    statusEl.innerText = "Prices: last check time unavailable";
    return;
  }

  statusEl.innerText = `Prices checked ${checkedAt.toLocaleString()} (${formatNumber(status.updatedCount, { maximumFractionDigits: 0 })} cards)`;
}

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
