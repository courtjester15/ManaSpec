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

const PRICE_REFRESH_FRESH_MS = 6 * 60 * 60 * 1000;
let priceRefreshInFlight = null;

async function refreshPrices(options = {}) {
  if (priceRefreshInFlight) return priceRefreshInFlight;

  if (!options.force && isPriceRefreshFresh()) {
    renderPriceRefreshStatus();
    return {
      skipped: true,
      reason: "fresh",
    };
  }

  priceRefreshInFlight = runPriceRefresh();

  try {
    return await priceRefreshInFlight;
  } finally {
    priceRefreshInFlight = null;
  }
}

async function runPriceRefresh() {
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

  return {
    skipped: false,
    checkedAt: startedAt.toISOString(),
    updatedCount,
  };
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

function isPriceRefreshFresh(now = Date.now()) {
  const status = typeof loadPriceRefreshStatus === "function"
    ? loadPriceRefreshStatus()
    : null;
  if (!status?.checkedAt) return false;

  const checkedAt = new Date(status.checkedAt).getTime();
  if (!Number.isFinite(checkedAt)) return false;

  return now - checkedAt < PRICE_REFRESH_FRESH_MS;
}
