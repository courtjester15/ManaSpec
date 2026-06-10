/*
====================================
TRADING ENGINE
====================================

Handles:
- buy actions
- sell actions
- delete actions
- position updates
====================================
*/

function buySpec(positionOrEvent, maybeCell) {
  const s = getSpec(positionOrEvent, maybeCell);
  if (!s) return;
  const price = Number(s.currentPrice);

  if (!price) {
    alert("Price not loaded yet");
    return;
  }

  if (cash < price) {
    alert("Not enough cash");
    return;
  }

  if (s.qty === 0) {
    s.buyDate = new Date().toISOString();
  }

  cash -= price;
  s.qty += 1;
  s.buyPrice = ((s.buyPrice * (s.qty - 1)) + price) / s.qty;

  if (typeof logTransaction === "function") {
    logTransaction(s, "BUY", 1, price);
  }

  updatePL();
  save();

  if (typeof showAppNotice === "function") {
    showAppNotice(`Bought 1 ${s.name} for ${money(price)}.`);
  }
}

function sellSpec(positionOrEvent, maybeCell) {
  const s = getSpec(positionOrEvent, maybeCell);
  if (!s) return;
  if (s.qty <= 0) return;

  const price = Number(s.currentPrice || s.buyPrice || 0);

  if (!confirm(`Sell 1 ${s.name} for ${money(price)}? This will log a SELL transaction and reduce the position quantity.`)) {
    return;
  }

  s.qty -= 1;
  cash += price;

  if (typeof logTransaction === "function") {
    logTransaction(s, "SELL", 1, price);
  }

  if (s.qty === 0) {
    specs = specs.filter(x => x.id !== s.id);
  }

  updatePL();
  save();

  if (typeof showAppNotice === "function") {
    const suffix = s.qty === 0 ? " Position is now closed." : "";
    showAppNotice(`Sold 1 ${s.name} for ${money(price)}.${suffix}`);
  }
}

function deleteSpec(positionOrEvent, maybeCell) {
  const s = getSpec(positionOrEvent, maybeCell);
  if (!s) return;

  if (!confirm(`Delete ${s.name} from Positions? This removes the current position without logging a transaction.`)) {
    return;
  }

  specs = specs.filter(x => x.id !== s.id);
  save();

  if (typeof showAppNotice === "function") {
    showAppNotice(`${s.name} deleted from Positions. No transaction was logged.`, "warning");
  }
}

function resetCash() {
  cash = startingCash;
  localStorage.setItem("cash", cash);
  updateTotals();
}
