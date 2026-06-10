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
    invested += s.buyPrice * s.qty;
    value += s.currentPrice * s.qty;
  });

  const pl = value - invested;
  const plPercent = invested > 0 ? (pl / invested) * 100 : 0;

  const totalEquity = cash + value;

  // CASH / CORE METRICS
  document.getElementById("cash").innerText = cash.toFixed(2);
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
    s.pl = ((s.currentPrice - s.buyPrice) * s.qty).toFixed(2);
  });
}