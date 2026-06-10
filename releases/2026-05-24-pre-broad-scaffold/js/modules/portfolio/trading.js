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

function buySpec(e, cell) {
  const s = getSpec(cell);
  const price = Number(s.currentPrice);

  if (!price) return alert("Price not loaded yet");
  if (cash < price) return alert("Not enough cash");

  // 🔥 FIRST BUY CHECK (before qty changes)
  if (s.qty === 0) {
    s.buyDate = new Date().toISOString();
  }

  cash -= price;

  s.qty += 1;

  s.buyPrice = ((s.buyPrice * (s.qty - 1)) + price) / s.qty;

  updatePL();
  
  cell.getRow().update(s);
  
  save();
}

function sellSpec(e, cell) {
  const s = getSpec(cell);
  if (s.qty <= 0) return;

  const price = s.currentPrice || s.buyPrice;

  s.qty -= 1;
  cash += price;

  if (s.qty === 0) {
    specs = specs.filter(x => x.id !== s.id);
  }

  updatePL();
  save();
}

function deleteSpec(e, cell) {
  const s = getSpec(cell);
  specs = specs.filter(x => x.id !== s.id);
  save();
}

function resetCash() {
  cash = startingCash;
  localStorage.setItem("cash", cash);
  updateTotals();
}
