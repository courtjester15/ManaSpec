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

  specs.forEach(s => {
    invested += toFiniteNumber(s.buyPrice) * toFiniteNumber(s.qty);
    value += toFiniteNumber(s.currentPrice) * toFiniteNumber(s.qty);
  });

  const pl = value - invested;
  const plPercent = invested > 0 ? (pl / invested) * 100 : 0;

  const totalEquity = toFiniteNumber(cash) + value;

  // CASH / CORE METRICS
  document.getElementById("cash").innerText = toFiniteNumber(cash).toFixed(2);
  document.getElementById("invested").innerText = invested.toFixed(2);
  document.getElementById("value").innerText = value.toFixed(2);

  // TOTAL EQUITY (SAFE)
  const eqEl = document.getElementById("totalEquity");
  if (eqEl) {
    eqEl.innerText = totalEquity.toFixed(2);
  }

  // P/L
  const plEl = document.getElementById("totalPL");
  if (plEl) {
    plEl.innerText = `${pl >= 0 ? "+" : ""}${pl.toFixed(2)} (${plPercent.toFixed(1)}%)`;
    plEl.style.color = pl >= 0 ? "green" : "red";
  }
}

function updatePL() {
  specs.forEach(s => {
    s.pl = ((toFiniteNumber(s.currentPrice) - toFiniteNumber(s.buyPrice)) * toFiniteNumber(s.qty)).toFixed(2);
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

  statusEl.innerText = `Prices checked ${checkedAt.toLocaleString()} (${toFiniteNumber(status.updatedCount)} cards)`;
}

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
