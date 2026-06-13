/*
====================================
PRICE SNAPSHOT SYSTEM
====================================

Stores one local daily price snapshot per card.
Current backing store: localStorage.
====================================
*/

const PRICE_SNAPSHOT_KEY = "priceSnapshots";
const PRICE_SNAPSHOT_SOURCE = "scryfall";

function getSnapshotDate() {
  return new Date().toISOString().slice(0, 10);
}

function loadPriceSnapshots() {
  if (typeof loadJsonArray === "function") {
    return loadJsonArray(PRICE_SNAPSHOT_KEY);
  }

  try {
    const snapshots = JSON.parse(localStorage.getItem(PRICE_SNAPSHOT_KEY) || "[]");
    return Array.isArray(snapshots) ? snapshots : [];
  } catch (err) {
    console.warn("Could not parse price snapshots. Using empty list.", err);
    return [];
  }
}

function savePriceSnapshots(snapshots) {
  localStorage.setItem(PRICE_SNAPSHOT_KEY, JSON.stringify(snapshots));
}

function createPriceSnapshot(spec, date) {
  return {
    date,
    cardId: spec.id,
    name: spec.name,
    set_code: spec.set_code,
    set_name: spec.set_name,
    collector_number: spec.collector_number,
    foil: spec.foil || false,
    price: Number(spec.currentPrice || 0),
    source: PRICE_SNAPSHOT_SOURCE,
    savedAt: new Date().toISOString(),
  };
}

function saveDailyPriceSnapshots() {
  const date = getSnapshotDate();
  const snapshots = loadPriceSnapshots();
  const existing = new Set(
    snapshots.map(snapshot =>
      `${snapshot.date}|${snapshot.cardId}|${snapshot.source}`
    )
  );

  const newSnapshots = specs
    .filter(spec => spec.id && Number(spec.currentPrice || 0) > 0)
    .filter(spec => {
      const key = `${date}|${spec.id}|${PRICE_SNAPSHOT_SOURCE}`;
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    })
    .map(spec => createPriceSnapshot(spec, date));

  if (!newSnapshots.length) {
    return {
      date,
      saved: 0,
      total: snapshots.length,
    };
  }

  const updatedSnapshots = snapshots.concat(newSnapshots);
  savePriceSnapshots(updatedSnapshots);

  return {
    date,
    saved: newSnapshots.length,
    total: updatedSnapshots.length,
  };
}
