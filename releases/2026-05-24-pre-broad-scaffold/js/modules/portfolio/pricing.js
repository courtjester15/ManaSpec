/*
====================================
PRICING SYSTEM
====================================

CUT FROM app.js:

- refreshPrices()

Handles:
- live price updates from Scryfall
- portfolio revaluation
- syncing updated prices into state
====================================
*/

async function refreshPrices() {
  for (let s of specs) {
    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/${s.id}`
      );

      const data = await res.json();
      s.currentPrice = parseFloat(data.prices.usd || s.currentPrice);
    } catch (err) {
      console.warn("Price refresh failed", s.name, err);
    }
  }

  updatePL();

  if (typeof saveDailyPriceSnapshots === "function") {
    const snapshotResult = saveDailyPriceSnapshots();
    console.info(
      `Price snapshots: ${snapshotResult.saved} saved for ${snapshotResult.date}`
    );
  }

  save();
  updateTotals();
}
