import { formatMoney } from "./portfolio.js";
import { assetContextLabel, assetTypeLabel, getAssetKey } from "./assetIdentity.js";
import { getRelatedRecordPrintingKey, resolveTrackedAsset } from "./relatedRecords.js";

export const LOCAL_SEARCH_CATEGORIES = Object.freeze([
  "Positions",
  "Radar",
  "Transactions",
  "History",
  "Notes",
]);

const CATEGORY_RANK = new Map(LOCAL_SEARCH_CATEGORIES.map((category, index) => [category, index]));
const FINISH_SEARCH_TERMS = new Set(["foil", "nonfoil", "etched"]);

function array(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value) {
  return String(value ?? "").trim();
}

export function normalizeLocalSearchText(value) {
  return clean(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function finishLabel(record = {}) {
  if (record.finish === "etched") return "Etched";
  if (record.foil || record.finish === "foil") return "Foil";
  return "Nonfoil";
}

function printingLabel(record = {}) {
  if (record.assetType === "sealed" || String(record.assetKey || "").startsWith("sealed:")) return assetContextLabel(record);
  const setCode = clean(record.set_code ?? record.set).toUpperCase() || "Set unknown";
  const collectorNumber = clean(record.collector_number);
  return `${setCode}${collectorNumber ? ` #${collectorNumber}` : ""} · ${finishLabel(record)}`;
}

function displayDate(value) {
  if (!value) return "Date unavailable";
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleDateString("en-US") : "Date unavailable";
}

function navigation(pathname, params = {}) {
  const search = Object.entries(params)
    .filter(([, value]) => clean(value))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  return { pathname, search: search ? `?${search}` : "" };
}

function result({ category, id, primary, secondary, context, record, fields, destination, exactPrintingKey = null, exactAssetKey = null }) {
  return {
    category,
    id: `${category.toLowerCase()}:${id}`,
    primary: clean(primary) || "Unnamed record",
    secondary: clean(secondary),
    context: clean(context),
    record,
    destination,
    exactPrintingKey,
    exactAssetKey,
    searchText: normalizeLocalSearchText([primary, secondary, context, ...fields].join(" ")),
  };
}

export function buildHistoryEvents(state = {}) {
  return [
    ...[...array(state.transactions), ...array(state.sealedTransactions)].map(transaction => ({
      ...transaction,
      kind: "transaction",
      eventType: clean(transaction.type).toUpperCase() || "TRADE",
      summary: `${clean(transaction.type).toUpperCase() === "BUY" ? "Bought" : "Sold"} ${transaction.quantity ?? "?"} at ${formatMoney(transaction.price)}${Number.isFinite(Number(transaction.balanceAfter)) ? ` / Balance ${formatMoney(transaction.balanceAfter)}` : ""}`,
    })),
    ...[...array(state.radar), ...array(state.sealedRadar)]
      .filter(item => item.addedDate || item.createdAt)
      .map(item => ({
        ...item,
        id: `radar-${item.id}`,
        kind: "radar",
        date: item.addedDate || item.createdAt,
        price: item.assetType === "sealed" ? null : item.currentPrice,
        eventType: "RADAR",
        summary: "Added to Radar",
      })),
    ...array(state.cardNotes).map(note => ({
      ...note,
      id: `note-${note.id}`,
      kind: "note",
      name: note.cardName,
      date: note.updatedAt || note.createdAt,
      eventType: "NOTE",
      summary: note.text,
    })),
    ...array(state.marketObservations).map(observation => ({
      ...observation,
      id: `market-${observation.id}`,
      kind: "market",
      name: observation.name || observation.cardName,
      date: observation.checkedAt,
      price: observation.marketPrice,
      eventType: "VALUE",
      summary: `Manual market check at ${formatMoney(observation.marketPrice)}${observation.currentSellers ? ` / ${observation.currentSellers} sellers` : ""}`,
    })),
    ...array(state.thesisNotes).map(note => ({
      ...note,
      id: `thesis-${note.id}`,
      kind: "note",
      name: note.cardName || "General",
      date: note.updatedAt || note.createdAt,
      eventType: "THESIS",
      summary: note.conviction || note.text || "Saved thesis",
    })),
  ].filter(event => event.date).sort((left, right) => new Date(right.date) - new Date(left.date));
}

function trackedResults(category, rows) {
  const pathname = category === "Positions" ? "/positions" : "/radar";
  return array(rows).map((item, index) => result({
    category,
    id: item.id || index,
    primary: item.name,
    secondary: printingLabel(item),
    context: category === "Positions"
      ? `${item.qty ?? "?"} owned · ${item.currentPrice ? formatMoney(item.currentPrice) : "Price unavailable"}`
      : `${item.plannedQty || 1} planned · ${item.currentPrice ? formatMoney(item.currentPrice) : "Price unavailable"}`,
    record: item,
    fields: [assetTypeLabel(item), item.set_name, item.type_line, item.oracle_text, item.artist, item.productType, item.category, item.subtype, item.notes, item.holdTime],
    destination: navigation(pathname, { focus: item.id, detail: "1" }),
    exactPrintingKey: getRelatedRecordPrintingKey(item),
    exactAssetKey: getAssetKey(item),
  }));
}

function transactionResults(transactions) {
  return array(transactions).map((transaction, index) => result({
    category: "Transactions",
    id: transaction.id || index,
    primary: transaction.name,
    secondary: `${clean(transaction.type).toUpperCase() || "Transaction"} · ${printingLabel(transaction)}`,
    context: `${displayDate(transaction.date)} · ${transaction.quantity ?? "?"} at ${formatMoney(transaction.price)}`,
    record: transaction,
    fields: [assetTypeLabel(transaction), transaction.set_name, transaction.productType, transaction.category, transaction.notes, transaction.realizedPL, transaction.balanceAfter],
    destination: navigation("/transactions", { focus: transaction.id }),
    exactPrintingKey: getRelatedRecordPrintingKey(transaction),
    exactAssetKey: getAssetKey(transaction),
  }));
}

function historyResults(state) {
  return buildHistoryEvents(state).map((event, index) => result({
    category: "History",
    id: event.id || index,
    primary: event.name,
    secondary: `${event.eventType} · ${printingLabel(event)}`,
    context: `${displayDate(event.date)} · ${event.summary}`,
    record: event,
    fields: [assetTypeLabel(event), event.set_name, event.productType, event.category, event.notes, event.kind],
    destination: navigation("/history", { focus: event.id }),
    exactPrintingKey: getRelatedRecordPrintingKey(event),
    exactAssetKey: getAssetKey(event),
  }));
}

function noteResults(state) {
  const specs = [...array(state.specs), ...array(state.sealedSpecs)];
  const radar = [...array(state.radar), ...array(state.sealedRadar)];
  const tracked = [...specs, ...radar];
  const notes = [
    ...array(state.cardNotes).map(note => ({ note, eventId: `note-${note.id}`, kindLabel: "Card note" })),
    ...array(state.thesisNotes).map(note => ({ note, eventId: `thesis-${note.id}`, kindLabel: "Thesis" })),
  ];
  return notes.map(({ note, eventId, kindLabel }, index) => {
    const trackedItem = resolveTrackedAsset(note, tracked);
    const trackedKey = getAssetKey(trackedItem);
    const position = trackedKey && specs.find(item => getAssetKey(item) === trackedKey);
    const watched = trackedKey && radar.find(item => getAssetKey(item) === trackedKey);
    const destination = position
      ? navigation("/positions", { focus: position.id, detail: "notes" })
      : watched
        ? navigation("/radar", { focus: watched.id, detail: "notes" })
        : navigation("/history", { focus: eventId });
    const noteText = note.text || note.conviction || "Saved note";
    return result({
      category: "Notes",
      id: eventId || index,
      primary: note.cardName || trackedItem?.name || "General note",
      secondary: `${kindLabel}${trackedItem ? ` · ${printingLabel(trackedItem)}` : ""}`,
      context: noteText,
      record: note,
      fields: [note.set_code, note.collector_number, note.tags, note.status],
      destination,
      exactPrintingKey: getRelatedRecordPrintingKey(note),
      exactAssetKey: trackedKey || getAssetKey(note),
    });
  });
}

export function buildLocalSearchIndex(state = {}) {
  return [
    ...trackedResults("Positions", [...array(state.specs), ...array(state.sealedSpecs)]),
    ...trackedResults("Radar", [...array(state.radar), ...array(state.sealedRadar)]),
    ...transactionResults([...array(state.transactions), ...array(state.sealedTransactions)]),
    ...historyResults(state),
    ...noteResults(state),
  ];
}

function scoreResult(item, query, terms) {
  const primary = normalizeLocalSearchText(item.primary);
  const secondary = normalizeLocalSearchText(item.secondary);
  const includesQuery = value => FINISH_SEARCH_TERMS.has(query)
    ? value.split(" ").includes(query)
    : value.includes(query);
  const includesTerm = term => FINISH_SEARCH_TERMS.has(term)
    ? item.searchText.split(" ").includes(term)
    : item.searchText.includes(term);
  if (primary === query) return 0;
  if (primary.startsWith(query)) return 1;
  if (primary.includes(query)) return 2;
  if (includesQuery(secondary)) return 3;
  if (includesQuery(item.searchText)) return 4;
  if (terms.every(includesTerm)) return 5;
  return null;
}

export function searchLocalState(state, queryInput, options = {}) {
  const query = normalizeLocalSearchText(queryInput);
  if (query.length < 2) return [];
  const terms = query.split(" ").filter(Boolean);
  const perCategory = Number.isInteger(options.perCategory) ? options.perCategory : 6;
  const limit = Number.isInteger(options.limit) ? options.limit : 30;
  const counts = new Map();
  return buildLocalSearchIndex(state)
    .map(item => ({ item, score: scoreResult(item, query, terms) }))
    .filter(entry => entry.score !== null)
    .sort((left, right) => left.score - right.score
      || (CATEGORY_RANK.get(left.item.category) ?? 99) - (CATEGORY_RANK.get(right.item.category) ?? 99)
      || left.item.primary.localeCompare(right.item.primary)
      || left.item.id.localeCompare(right.item.id))
    .filter(({ item }) => {
      const count = counts.get(item.category) || 0;
      if (count >= perCategory) return false;
      counts.set(item.category, count + 1);
      return true;
    })
    .slice(0, limit)
    .map(({ item }) => item);
}

export function groupLocalSearchResults(results = []) {
  return LOCAL_SEARCH_CATEGORIES
    .map(category => ({ category, results: results.filter(resultItem => resultItem.category === category) }))
    .filter(group => group.results.length);
}
