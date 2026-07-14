/*
====================================
PRICE SNAPSHOT SYSTEM
====================================

Stores one local daily Scryfall observation per exact F/NF printing.
Legacy snapshot records are normalized at read time and preserved.
====================================
*/

(function exposePriceSnapshots(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) Object.assign(root, api);
})(typeof globalThis !== "undefined" ? globalThis : this, function createPriceSnapshots() {
  const PRICE_SNAPSHOT_KEY = "priceSnapshots";
  const PRICE_SNAPSHOT_SOURCE = "scryfall";
  const SUPPORTED_HISTORY_FINISHES = new Set(["nonfoil", "foil"]);
  const DAY_MS = 86400000;

  function getSnapshotDate(now = new Date()) {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getSnapshotFinish(record = {}) {
    const explicit = String(record.finish || "").toLowerCase();
    if (SUPPORTED_HISTORY_FINISHES.has(explicit)) return explicit;
    const suffix = String(record.printingKey || record.cardId || record.id || "")
      .match(/\|(nonfoil|foil)$/i)?.[1]?.toLowerCase();
    if (SUPPORTED_HISTORY_FINISHES.has(suffix)) return suffix;
    if (record.foil === true) return "foil";
    if (record.foil === false) return "nonfoil";
    return null;
  }

  function getSnapshotScryfallId(record = {}) {
    const raw = record.scryfallId || record.scryfall_id || record.cardId || record.id || "";
    return String(raw).trim().replace(/\|(nonfoil|foil)$/i, "") || null;
  }

  function normalizePriceSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
    const date = String(snapshot.date || "");
    const finish = getSnapshotFinish(snapshot);
    const scryfallId = getSnapshotScryfallId(snapshot);
    const price = Number(snapshot.price);
    const source = String(snapshot.source || PRICE_SNAPSHOT_SOURCE).toLowerCase();
    if (!isValidSnapshotDate(date)
      || !scryfallId
      || !SUPPORTED_HISTORY_FINISHES.has(finish)
      || !(price > 0)
      || !Number.isFinite(price)
      || !source) return null;

    return {
      date,
      printingKey: `${scryfallId}|${finish}`,
      scryfallId,
      finish,
      name: String(snapshot.name || ""),
      setCode: String(snapshot.setCode || snapshot.set_code || "").toUpperCase(),
      setName: String(snapshot.setName || snapshot.set_name || ""),
      collectorNumber: String(snapshot.collectorNumber || snapshot.collector_number || ""),
      price,
      source,
      savedAt: getValidSavedAt(snapshot.savedAt),
    };
  }

  function isValidSnapshotDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year
      && parsed.getUTCMonth() === month - 1
      && parsed.getUTCDate() === day;
  }

  function getValidSavedAt(value) {
    const time = value ? new Date(value).getTime() : NaN;
    return Number.isFinite(time) ? new Date(time).toISOString() : null;
  }

  function normalizePriceSnapshots(records = [], options = {}) {
    const valid = [];
    const invalid = [];
    (Array.isArray(records) ? records : []).forEach((record, index) => {
      const normalized = normalizePriceSnapshot(record);
      if (normalized) valid.push(normalized);
      else invalid.push({ index, record });
    });
    if (invalid.length && options.warn !== false && typeof console !== "undefined") {
      console.warn(`Skipped ${invalid.length} invalid price snapshot record(s).`, invalid);
    }
    const byDailyKey = new Map();
    valid.forEach(snapshot => {
      const key = getDailySnapshotKey(snapshot);
      const existing = byDailyKey.get(key);
      if (!existing || String(snapshot.savedAt || "") >= String(existing.savedAt || "")) {
        byDailyKey.set(key, snapshot);
      }
    });
    return { valid: [...byDailyKey.values()], invalid };
  }

  function loadPriceSnapshots() {
    let records = [];
    if (typeof loadJsonArray === "function") records = loadJsonArray(PRICE_SNAPSHOT_KEY);
    else if (typeof localStorage !== "undefined") {
      try {
        const parsed = JSON.parse(localStorage.getItem(PRICE_SNAPSHOT_KEY) || "[]");
        records = Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.warn("Could not parse price snapshots. Using empty list.", err);
      }
    }
    return normalizePriceSnapshots(records).valid;
  }

  function savePriceSnapshots(snapshots) {
    localStorage.setItem(PRICE_SNAPSHOT_KEY, JSON.stringify(snapshots));
  }

  function createPriceSnapshot(item, price, options = {}) {
    const normalizedItem = normalizeTrackedHistoryItem(item);
    const numericPrice = Number(price);
    if (!normalizedItem || !(numericPrice > 0) || !Number.isFinite(numericPrice)) return null;
    return {
      date: options.date || getSnapshotDate(),
      ...normalizedItem,
      price: numericPrice,
      source: PRICE_SNAPSHOT_SOURCE,
      savedAt: options.savedAt || new Date().toISOString(),
    };
  }

  function normalizeTrackedHistoryItem(item = {}) {
    const finish = getSnapshotFinish(item);
    const scryfallId = getSnapshotScryfallId(item);
    if (!scryfallId || !SUPPORTED_HISTORY_FINISHES.has(finish)) return null;
    return {
      printingKey: `${scryfallId}|${finish}`,
      scryfallId,
      finish,
      name: String(item.name || ""),
      setCode: String(item.setCode || item.set_code || item.set || "").toUpperCase(),
      setName: String(item.setName || item.set_name || ""),
      collectorNumber: String(item.collectorNumber || item.collector_number || ""),
    };
  }

  function upsertDailyPriceSnapshot(snapshots, snapshot) {
    const normalized = normalizePriceSnapshot(snapshot);
    if (!normalized) return { snapshots: [...snapshots], saved: 0, updated: 0 };
    const next = [...snapshots];
    const key = getDailySnapshotKey(normalized);
    const index = next.findIndex(item => getDailySnapshotKey(item) === key);
    if (index >= 0) {
      next[index] = normalized;
      return { snapshots: next, saved: 0, updated: 1 };
    }
    next.push(normalized);
    return { snapshots: next, saved: 1, updated: 0 };
  }

  function getDailySnapshotKey(snapshot) {
    return `${snapshot.date}|${snapshot.printingKey}|${snapshot.source}`;
  }

  function saveDailyPriceSnapshots(observations = []) {
    const date = getSnapshotDate();
    let snapshots = loadPriceSnapshots();
    let saved = 0;
    let updated = 0;
    const exactPrintingObservations = new Map();

    observations.forEach(observation => {
      const snapshot = createPriceSnapshot(observation.item || observation, observation.price, {
        date,
        savedAt: observation.savedAt,
      });
      if (snapshot) exactPrintingObservations.set(snapshot.printingKey, snapshot);
    });

    exactPrintingObservations.forEach(snapshot => {
      const result = upsertDailyPriceSnapshot(snapshots, snapshot);
      snapshots = result.snapshots;
      saved += result.saved;
      updated += result.updated;
    });

    if (saved || updated) savePriceSnapshots(snapshots);
    return { date, saved, updated, total: snapshots.length };
  }

  function getPriceHistoryForPrinting(itemOrKey, snapshots = loadPriceSnapshots()) {
    const printingKey = typeof itemOrKey === "string"
      ? itemOrKey
      : normalizeTrackedHistoryItem(itemOrKey)?.printingKey;
    if (!printingKey) return [];
    return snapshots
      .filter(snapshot => snapshot.printingKey === printingKey && snapshot.source === PRICE_SNAPSHOT_SOURCE)
      .sort((a, b) => a.date.localeCompare(b.date) || String(a.savedAt || "").localeCompare(String(b.savedAt || "")));
  }

  function getHistoryCoverage(history = []) {
    if (!history.length) return { snapshotCount: 0, days: 0, oldest: null, newest: null };
    const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
    const elapsedDays = Math.round((parseSnapshotDate(sorted.at(-1).date) - parseSnapshotDate(sorted[0].date)) / DAY_MS);
    return {
      snapshotCount: sorted.length,
      days: Math.max(1, elapsedDays),
      oldest: sorted[0].date,
      newest: sorted.at(-1).date,
    };
  }

  function formatHistoryCoverageBadge(history = []) {
    const { days } = getHistoryCoverage(history);
    if (!days) return "0";
    if (days <= 30) return `${days}d`;
    if (days < 365) return `${Math.floor(days / 30)}m`;
    return `${Math.floor(days / 365)}y`;
  }

  function filterHistoryByRange(history = [], range = "all") {
    if (!history.length || range === "all") return [...history];
    const rangeDays = { "7d": 7, "30d": 30, "90d": 90, "6m": 183, "1y": 365 }[String(range).toLowerCase()];
    if (!rangeDays) return [...history];
    const newestTime = parseSnapshotDate(history.at(-1).date).getTime();
    const cutoff = newestTime - (rangeDays * DAY_MS);
    return history.filter(snapshot => parseSnapshotDate(snapshot.date).getTime() >= cutoff);
  }

  function calculateHistoryMetrics(history = []) {
    if (!history.length) return { current: null, change: null, high: null, low: null };
    const prices = history.map(snapshot => Number(snapshot.price)).filter(price => price > 0 && Number.isFinite(price));
    if (!prices.length) return { current: null, change: null, high: null, low: null };
    const earliest = prices[0];
    const current = prices.at(-1);
    return {
      current,
      change: prices.length >= 2 && earliest > 0 ? ((current - earliest) / earliest) * 100 : null,
      high: Math.max(...prices),
      low: Math.min(...prices),
    };
  }

  function parseSnapshotDate(date) {
    const [year, month, day] = String(date).split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  return {
    PRICE_SNAPSHOT_KEY,
    PRICE_SNAPSHOT_SOURCE,
    getSnapshotDate,
    normalizePriceSnapshot,
    normalizePriceSnapshots,
    loadPriceSnapshots,
    savePriceSnapshots,
    createPriceSnapshot,
    saveDailyPriceSnapshots,
    upsertDailyPriceSnapshot,
    getPriceHistoryForPrinting,
    getHistoryCoverage,
    formatHistoryCoverageBadge,
    filterHistoryByRange,
    calculateHistoryMetrics,
    normalizeTrackedHistoryItem,
  };
});
