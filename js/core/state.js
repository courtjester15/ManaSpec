/*
====================================
STATE SYSTEM
====================================

Holds global application state:
- specs (portfolio positions)
- cash balance
- future shared runtime state
====================================
*/

// Portfolio holdings
let specs = loadSpecs();

// Radar ideas
let radar = loadRadar();

// Early module state
let signals = loadSignals();
let thesisNotes = loadThesisNotes();
let cardNotes = loadCardNotes();
let transactions = loadTransactions();

const migratedRadarItems = specs
  .filter(s => Number(s.qty || 0) === 0)
  .map(specToRadarItem);

if (migratedRadarItems.length) {
  radar = mergeRadarItems(radar, migratedRadarItems);
  specs = specs.filter(s => Number(s.qty || 0) > 0);

  localStorage.setItem("radar", JSON.stringify(radar));
  localStorage.setItem("specs", JSON.stringify(specs));
}

// Cash balance
const startingCash = 10000;
let cash = loadCash(startingCash);

backfillTransactionsFromCurrentPositions();
enrichTransactionsFromCurrentPositions();

function specToRadarItem(spec) {
  return {
    ...spec,
    id: spec.id,
    name: spec.name,
    set_code: spec.set_code,
    set_name: spec.set_name,
    collector_number: spec.collector_number,
    foil: spec.foil || false,
    currentPrice: Number(spec.currentPrice || 0),
    addedDate: spec.addedDate || spec.buyDate || new Date().toISOString(),
  };
}

function mergeRadarItems(existing, incoming) {
  const seen = new Set(existing.map(item => item.id));
  const merged = [...existing];

  incoming.forEach(item => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    merged.push(item);
  });

  return merged;
}

function backfillTransactionsFromCurrentPositions() {
  const ownedPositions = specs.filter(spec => Number(spec.qty || 0) > 0);
  if (!ownedPositions.length) return;

  let changed = false;
  const existingBackfills = new Set(
    transactions
      .filter(tx => tx.backfilledFromPositionId)
      .map(tx => tx.backfilledFromPositionId)
  );

  ownedPositions.forEach(position => {
    if (existingBackfills.has(position.id)) return;
    const ledgerQty = getLedgerQuantityForPosition(position.id);
    const missingQty = Number(position.qty || 0) - ledgerQty;
    if (missingQty <= 0) return;

    transactions.push({
      id: `backfill|${position.id}|${Date.now()}`,
      cardId: position.id,
      name: position.name,
      set_code: position.set_code,
      set_name: position.set_name,
      collector_number: position.collector_number,
      foil: position.foil || false,
      ...getTransactionMetadata(position),
      type: "BUY",
      quantity: missingQty,
      price: Number(position.buyPrice || 0),
      fees: 0,
      date: position.buyDate || position.addedDate || new Date().toISOString(),
      notes: "Backfilled from current position.",
      backfilledFromPositionId: position.id,
    });

    existingBackfills.add(position.id);
    changed = true;
  });

  if (!changed) return;

  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function getLedgerQuantityForPosition(cardId) {
  return transactions
    .filter(tx => tx.cardId === cardId && !tx.backfilledFromPositionId)
    .reduce((qty, tx) => {
      const amount = Number(tx.quantity || 0);
      if (tx.type === "BUY") return qty + amount;
      if (tx.type === "SELL") return qty - amount;
      return qty;
    }, 0);
}

function enrichTransactionsFromCurrentPositions() {
  let changed = false;

  transactions.forEach(tx => {
    if (!tx.cardId) return;
    const position = specs.find(spec => spec.id === tx.cardId);
    if (!position) return;

    ["set_name", "set_code", "collector_number", "rarity", "type_line", "released_at", "frame", "border_color", "security_stamp"].forEach(key => {
      if (tx[key] || !position[key]) return;
      tx[key] = position[key];
      changed = true;
    });

    ["colors", "color_identity", "finishes"].forEach(key => {
      if (Array.isArray(tx[key]) && tx[key].length) return;
      if (!Array.isArray(position[key]) || !position[key].length) return;
      tx[key] = position[key];
      changed = true;
    });

    ["foil", "reserved", "reprint", "promo"].forEach(key => {
      if (typeof tx[key] === "boolean") return;
      tx[key] = Boolean(position[key]);
      changed = true;
    });
  });

  if (changed) {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }
}
