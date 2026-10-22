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
  const successfulObservations = [];

  for (let s of specs) {
    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/${getPricingScryfallId(s)}`
      );

      if (!res.ok) throw new Error(`Scryfall request failed (${res.status})`);
      const data = await res.json();
      const nextPrice = getScryfallUsdPrice(data, s);
      syncCardMetadata(s, data);

      if (nextPrice !== null) {
        s.currentPrice = nextPrice;
        s.prices = data.prices;
        s.priceUpdatedAt = startedAt.toISOString();
        updatedCount += 1;
        successfulObservations.push({ item: s, price: nextPrice, savedAt: startedAt.toISOString() });
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

      if (!res.ok) throw new Error(`Scryfall request failed (${res.status})`);
      const data = await res.json();
      const nextPrice = getScryfallUsdPrice(data, item);
      syncCardMetadata(item, data);

      if (nextPrice !== null) {
        item.currentPrice = nextPrice;
        item.prices = data.prices;
        item.priceUpdatedAt = startedAt.toISOString();
        updatedCount += 1;
        successfulObservations.push({ item, price: nextPrice, savedAt: startedAt.toISOString() });
      }
    } catch (err) {
      console.warn("Radar price refresh failed", item.name, err);
    }
  }

  updatePL();

  if (typeof saveDailyPriceSnapshots === "function") {
    const snapshotResult = saveDailyPriceSnapshots(successfulObservations);
    console.info(
      `Price snapshots: ${snapshotResult.saved} saved, ${snapshotResult.updated} updated for ${snapshotResult.date}`
    );
  }

  save();
  saveRadarState(radar);
  savePriceRefreshStatus(startedAt, updatedCount);
  updateTotals();
  refreshValuationViews();

  return {
    skipped: false,
    checkedAt: startedAt.toISOString(),
    updatedCount,
  };
}

function getScryfallUsdPrice(card, position) {
  const prices = card.prices || {};
  const finish = typeof getTrackedPrintingFinish === "function"
    ? getTrackedPrintingFinish(position)
    : (position.foil ? "foil" : "nonfoil");
  const field = { nonfoil: "usd", foil: "usd_foil", etched: "usd_etched" }[finish];
  return getMarketPriceOrNull(prices[field]);
}

function getPricingScryfallId(item) {
  return item.scryfall_id || String(item.id || "").replace(/\|(foil|nonfoil|etched)$/i, "");
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

// Quote parsing must preserve genuine zero without coercing unavailable values.
function getMarketPriceOrNull(value) {
  if (!["string", "number"].includes(typeof value) || String(value).trim() === "") return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function getZeroValuationWarning(record = {}) {
  if (record.assetType === "sealed" || record.mtgjson_uuid || !(Number(record.qty) > 0) || getMarketPriceOrNull(record.currentPrice) !== 0) return "";
  const finish = getTrackedPrintingFinish(record);
  const raw = record.prices?.[{ nonfoil: "usd", foil: "usd_foil", etched: "usd_etched" }[finish]];
  if (getMarketPriceOrNull(raw) === 0) return "";
  if (finish && Array.isArray(record.finishes) && record.finishes.length && !record.finishes.includes(finish)) {
    return `Saved ${finish} finish is not offered for this printing. Refresh cannot substitute another finish.`;
  }
  return "Saved $0 has no matching zero quote in the cached provider data. Refresh the exact printing and finish; the value may be valid or unavailable.";
}
