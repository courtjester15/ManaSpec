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
  const startedAt = new Date();
  let updatedCount = 0;

  for (let s of specs) {
    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/${getPricingScryfallId(s)}`
      );

      const data = await res.json();
      const nextPrice = getScryfallUsdPrice(data, s);
      syncCardMetadata(s, data);

      if (nextPrice) {
        s.currentPrice = nextPrice;
        s.priceUpdatedAt = startedAt.toISOString();
        updatedCount += 1;
      }
    } catch (err) {
      console.warn("Price refresh failed", s.name, err);
    }
  }

  for (let item of radar) {
    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/${getPricingScryfallId(item)}`
      );

      const data = await res.json();
      const nextPrice = getScryfallUsdPrice(data, item);
      syncCardMetadata(item, data);

      if (nextPrice) {
        item.currentPrice = nextPrice;
        item.priceUpdatedAt = startedAt.toISOString();
        updatedCount += 1;
      }
    } catch (err) {
      console.warn("Radar price refresh failed", item.name, err);
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
  saveRadarState(radar);
  savePriceRefreshStatus(startedAt, updatedCount);
  updateTotals();
}

function getScryfallUsdPrice(card, position) {
  const prices = card.prices || {};
  const price = position.foil
    ? parseFloat(prices.usd_foil || prices.usd || position.currentPrice || 0)
    : parseFloat(prices.usd || position.currentPrice || 0);

  return Number.isFinite(price) ? price : 0;
}

function getPricingScryfallId(item) {
  return item.scryfall_id || String(item.id || "").replace(/\|(foil|nonfoil)$/i, "");
}

function savePriceRefreshStatus(date, updatedCount) {
  const status = {
    checkedAt: date.toISOString(),
    updatedCount,
  };

  localStorage.setItem("priceRefreshStatus", JSON.stringify(status));

  if (typeof renderPriceRefreshStatus === "function") {
    renderPriceRefreshStatus();
  }
}
