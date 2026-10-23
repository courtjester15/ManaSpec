/* Shared exact-finish selection and owner-approved Issue #20 correction. */
(function expose(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ManaSpecFinishPolicy = api;
})(globalThis, function createFinishPolicy() {
  const FINISHES = ["nonfoil", "foil", "etched"];
  const TARGETS = [
    { id: "be874189-b715-4e7c-85d7-e887328b9d3f", name: "Steam Vents", number: "534" },
    { id: "0f1296cc-59aa-412d-9115-99fdc9ada754", name: "Godless Shrine", number: "533" },
  ];
  const ARRAY_KEYS = ["specs", "radar", "transactions", "cardNotes", "thesisNotes", "signals", "priceSnapshots", "marketObservations", "sealedSpecs", "sealedRadar", "sealedTransactions"];
  const RELATED_KEYS = ["transactions", "cardNotes", "thesisNotes", "signals", "priceSnapshots", "marketObservations"];
  const STORAGE_KEYS = [...ARRAY_KEYS, "cash", "priceRefreshStatus"];
  const recordLabels = { specs: "Positions", radar: "Radar ideas", transactions: "Transactions", cardNotes: "Card notes", thesisNotes: "Archived theses", signals: "Signals", priceSnapshots: "Price history", marketObservations: "Market checks" };
  const BACKUP_KEY = "manaspec_finish_correction_backup";
  const SUFFIX = /\|(nonfoil|foil|etched)$/i;
  const strip = value => String(value || "").replace(/^single:/, "").replace(SUFFIX, "");

  function supportedFinishes(card) {
    return FINISHES.filter(finish => Array.isArray(card?.finishes) && card.finishes.includes(finish));
  }
  function selectFinish(card, requested) {
    const supported = supportedFinishes(card);
    if (!supported.length) throw new Error("Supported finishes are unavailable. Reload the exact printing before adding it.");
    const finish = requested || (supported.length === 1 ? supported[0] : "");
    if (!supported.includes(finish)) throw new Error("Choose a supported finish for this exact printing.");
    return finish;
  }
  function recordFinish(record) {
    if (FINISHES.includes(record.finish)) return record.finish;
    for (const value of [record.trackedPrintingKey, record.cardKey, record.printingKey, record.assetKey, record.cardId, record.id]) {
      const finish = String(value || "").match(SUFFIX)?.[1]?.toLowerCase();
      if (finish) return finish;
    }
    return record.foil === true ? "foil" : record.foil === false ? "nonfoil" : null;
  }
  function exactPrice(card, finish) {
    const raw = card?.prices?.[{ nonfoil: "usd", foil: "usd_foil", etched: "usd_etched" }[finish]];
    if (!["number", "string"].includes(typeof raw) || String(raw).trim() === "") return null;
    const price = Number(raw);
    return Number.isFinite(price) && price >= 0 ? price : null;
  }
  function references(record, primary) {
    return [record.scryfall_id, record.scryfallId,
      record.cardId, record.cardKey, record.printingKey, record.trackedPrintingKey,
      String(record.assetKey || "").startsWith("single:") ? record.assetKey : null,
      record.backfilledFromPositionId, primary ? record.id : null].filter(Boolean);
  }
  function matches(record, target, primary) {
    if (record.assetType === "sealed" || record.mtgjson_uuid) return false;
    const refs = references(record, primary);
    const identityMatch = refs.some(value => strip(value) === target.id);
    const metadataMatch = String(record.set_code || record.set || record.setCode || "").toLowerCase() === "unf"
      && String(record.collector_number || record.collectorNumber || "") === target.number
      && (record.name || record.cardName) === target.name;
    if (!identityMatch && !(refs.length === 0 && metadataMatch)) return false;
    if (refs.some(value => strip(value) !== target.id)) throw new Error(`${target.name}: conflicting identity references. No correction applied.`);
    const declared = [record.finish, ...refs.map(value => String(value).match(SUFFIX)?.[1]?.toLowerCase()),
      record.foil === true ? "foil" : record.foil === false ? "nonfoil" : null].filter(value => FINISHES.includes(value));
    if (new Set(declared).size > 1) throw new Error(`${target.name}: conflicting finish references. No correction applied.`);
    const set = record.set_code || record.set || record.setCode;
    const number = record.collector_number || record.collectorNumber;
    if ((set && String(set).toLowerCase() !== "unf") || (number && String(number) !== target.number)) {
      throw new Error(`${target.name}: conflicting set/collector metadata. No correction applied.`);
    }
    return true;
  }
  function planCorrection(data, cards, now = new Date().toISOString()) {
    const next = { ...data };
    const changedKeys = [];
    const counts = {};
    const corrections = [];
    for (const target of TARGETS) {
      const legacy = ["specs", "radar"].some(key => (data[key] || []).some(row => matches(row, target, true) && recordFinish(row) === "nonfoil"));
      if (!legacy) continue;
      const card = cards.find(item => item.id === target.id);
      if (!card || card.name !== target.name || card.set !== "unf" || String(card.collector_number) !== target.number || !supportedFinishes(card).includes("foil")) {
        throw new Error(`${target.name}: live exact-printing foil metadata could not be verified.`);
      }
      for (const key of ["specs", "radar"]) {
        const rows = (data[key] || []).filter(row => matches(row, target, true));
        if (rows.length > 1) throw new Error(`${target.name}: duplicate or existing foil ${key} row. Resolve the collision before correcting.`);
      }
      corrections.push({ ...target, from: "nonfoil", to: "foil", price: exactPrice(card, "foil") });
      for (const key of ["specs", "radar", ...RELATED_KEYS]) {
        const primary = key === "specs" || key === "radar";
        let count = 0;
        next[key] = (next[key] || []).map(row => {
          if (!matches(row, target, primary)) return row;
          const finish = recordFinish(row);
          if (finish === "foil") return row;
          if (finish && finish !== "nonfoil") throw new Error(`${target.name}: unexpected ${finish} reference in ${key}. No correction applied.`);
          const updated = { ...row, foil: true, finish: "foil" };
          if (primary) updated.id = `${target.id}|foil`;
          for (const field of ["cardId", "backfilledFromPositionId"]) {
            if (Object.hasOwn(row, field)) updated[field] = `${target.id}|foil`;
          }
          for (const field of ["cardKey", "printingKey", "trackedPrintingKey"]) {
            if (Object.hasOwn(row, field)) updated[field] = `${target.id}|foil`;
          }
          if (Object.hasOwn(row, "assetKey")) updated.assetKey = `single:${target.id}|foil`;
          if (primary) {
            updated.scryfall_id = target.id;
            updated.trackedPrintingKey = `${target.id}|foil`;
            updated.currentPrice = exactPrice(card, "foil");
            updated.prices = card.prices;
            updated.finishes = card.finishes;
            updated.priceUpdatedAt = updated.currentPrice === null ? null : now;
          }
          const previous = {};
          for (const field of Object.keys(updated)) {
            if (JSON.stringify(updated[field]) !== JSON.stringify(row[field])) previous[field] = Object.hasOwn(row, field) ? row[field] : null;
          }
          updated.finishCorrection = { issue: 20, correctedAt: now, from: "nonfoil", to: "foil", previous };
          count += 1;
          return updated;
        });
        if (count) {
          counts[key] = (counts[key] || 0) + count;
          if (!changedKeys.includes(key)) changedKeys.push(key);
        }
      }
    }
    return { data: next, corrections, counts, changedKeys };
  }
  function capture(storage) {
    const raw = Object.fromEntries(STORAGE_KEYS.map(key => [key, storage.getItem(key)]));
    const data = {};
    for (const key of ARRAY_KEYS) {
      data[key] = raw[key] === null ? [] : JSON.parse(raw[key]);
      if (!Array.isArray(data[key])) throw new Error(`Invalid ${key} storage; restore/inspect a backup first.`);
    }
    data.cash = raw.cash === null ? 10000 : Number(raw.cash);
    if (!Number.isFinite(data.cash)) throw new Error("Cash storage is invalid; inspect a backup before correcting identity.");
    data.priceRefreshStatus = raw.priceRefreshStatus === null ? {} : JSON.parse(raw.priceRefreshStatus);
    return { raw, data };
  }
  function commit(storage, preview, envelope) {
    if (!preview.plan.corrections.length) throw new Error("No eligible legacy records remain.");
    for (const key of STORAGE_KEYS) {
      if (storage.getItem(key) !== preview.raw[key]) throw new Error("Saved data changed since preview. Preview again; no correction applied.");
    }
    const backup = { ...envelope, data: preview.original };
    if (["sealedSpecs", "sealedRadar", "sealedTransactions"].some(key => preview.original[key]?.length)) backup.dataSchemaVersion = 2;
    storage.setItem(BACKUP_KEY, JSON.stringify({ createdAt: new Date().toISOString(), reason: "issue-20-finish-correction", backup, rawStorage: preview.raw }));
    const written = [];
    try {
      for (const key of preview.plan.changedKeys) {
        written.push(key);
        storage.setItem(key, JSON.stringify(preview.plan.data[key]));
      }
    } catch (error) {
      try {
        for (const key of written.reverse()) {
          if (preview.raw[key] === null) storage.removeItem(key);
          else storage.setItem(key, preview.raw[key]);
        }
      } catch (rollbackError) {
        throw new Error(`Correction write failed; rollback could not finish. Restore the retained ${BACKUP_KEY} backup before further edits.`);
      }
      throw error;
    }
    return preview.plan;
  }
  return Object.freeze({ supportedFinishes, selectFinish, recordFinish, exactPrice, planCorrection, capture, commit, TARGETS, BACKUP_KEY, recordLabels });
});
