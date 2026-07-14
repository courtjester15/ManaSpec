const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const source = fs.readFileSync("js/modules/card-details/comparable-printings.js", "utf8");
const printingsSource = fs.readFileSync("js/modules/portfolio/printings.js", "utf8");
const previewedCards = [];
const context = {
  console,
  Map,
  escapeHtml: value => String(value),
  escapeDetailAttribute: value => String(value),
  msEscapeHtml: value => String(value),
  msEscapeAttr: value => String(value),
  money: value => `$${Number(value).toFixed(2)}`,
  openCardArtPreview: card => previewedCards.push(card),
  ManaSpecDataFoundation: { normalizeFinish: item => item.finish || (item.foil ? "foil" : "nonfoil") },
};
vm.createContext(context);
vm.runInContext(source, context);
vm.runInContext(printingsSource, context);

const cards = [
  { id: "current", name: "Exact Art Card", games: ["paper"], digital: false, finishes: ["nonfoil", "foil"], set: "abc", collector_number: "2", released_at: "2024-01-01", prices: { usd: "10", usd_foil: "20" }, image_uris: { normal: "https://img.example/current.jpg" }, scryfall_uri: "https://scryfall.com/card/abc/2" },
  { id: "cheap", games: ["paper", "mtgo"], digital: false, finishes: ["nonfoil", "etched"], set: "xyz", collector_number: "10", released_at: "2020-01-01", prices: { usd: "5", usd_etched: null } },
  { id: "digital", games: ["arena"], digital: true, finishes: ["nonfoil"], prices: { usd: "1" } },
  { id: "current", games: ["paper"], digital: false, finishes: ["nonfoil"], set: "abc", collector_number: "2", prices: { usd: "10" } },
];
const tracked = { scryfallId: "current", finish: "nonfoil" };
const rows = context.getComparablePrintingFinishRows(cards);

assert.strictEqual(rows.length, 4, "paper finishes should expand and UUID+finish rows should dedupe");
assert.ok(!rows.some(row => row.id === "digital"), "digital-only cards should be excluded");
assert.strictEqual(context.getSupportedFinishPrice(cards[0], "foil"), 20);
assert.strictEqual(context.getSupportedFinishPrice(cards[1], "etched"), null, "missing prices must remain missing");
assert.strictEqual(context.isCurrentTrackedPrinting(rows.find(row => row.id === "current" && row.finish === "nonfoil"), tracked), true);
assert.strictEqual(context.isCurrentTrackedPrinting(rows.find(row => row.id === "current" && row.finish === "foil"), tracked), false, "same UUID with another finish must not be current");

const releaseDesc = context.sortComparablePrintingRows(rows, tracked, { field: "releasedAt", direction: "desc" });
assert.strictEqual(releaseDesc[0].key, "current|nonfoil", "current row should be pinned");
assert.strictEqual(releaseDesc[1].key, "current|foil", "default release sort should put newer non-current rows first");
assert.strictEqual(releaseDesc.at(-1).key, "cheap|nonfoil", "stable ties should remain deterministic");

const releaseAsc = context.sortComparablePrintingRows(rows, tracked, { field: "releasedAt", direction: "asc" });
assert.strictEqual(releaseAsc[0].key, "current|nonfoil", "current should stay pinned in oldest-first sorting");
assert.strictEqual(releaseAsc[1].id, "cheap", "oldest valid release should sort first after current");

const priceAsc = context.sortComparablePrintingRows(rows, tracked, { field: "price", direction: "asc" });
assert.strictEqual(priceAsc[0].key, "current|nonfoil", "current should stay pinned in low-price sorting");
assert.strictEqual(priceAsc[1].key, "cheap|nonfoil", "priced rows should sort lowest first");
assert.strictEqual(priceAsc.at(-1).key, "cheap|etched", "unpriced rows should remain last");

const priceDesc = context.sortComparablePrintingRows(rows, tracked, { field: "price", direction: "desc" });
assert.strictEqual(priceDesc[0].key, "current|nonfoil", "current should stay pinned in high-price sorting");
assert.strictEqual(priceDesc[1].key, "current|foil", "priced rows should sort highest first");
assert.strictEqual(priceDesc.at(-1).key, "cheap|etched", "unpriced rows should remain last when descending");

const missingValueRows = [
  { id: "dated", key: "dated|nonfoil", finish: "nonfoil", releasedAt: "2020-01-01", price: 2, setCode: "DAT", collectorNumber: "1" },
  { id: "missing-date", key: "missing-date|nonfoil", finish: "nonfoil", releasedAt: "", price: 1, setCode: "MIS", collectorNumber: "1" },
  { id: "invalid-date", key: "invalid-date|nonfoil", finish: "nonfoil", releasedAt: "invalid", price: 3, setCode: "INV", collectorNumber: "1" },
];
const missingDatesSorted = context.sortComparablePrintingRows(missingValueRows, tracked, { field: "releasedAt", direction: "asc" });
assert.strictEqual(missingDatesSorted[0].id, "dated", "valid dates should precede missing or invalid dates");
assert.ok(missingDatesSorted.slice(1).every(row => !context.getComparableReleaseTimestamp(row.releasedAt)), "missing dates should remain after valid dates");
assert.strictEqual(context.formatComparablePriceDifference(-5, false), "-$5.00");
assert.strictEqual(context.formatComparablePriceDifference(0, false), "Same");
assert.strictEqual(context.formatComparablePriceDifference(null, true), "—", "current row should stay neutral in the comparison column");
assert.ok(context.renderComparablePrintingsSection({ status: "loading" }).includes("Loading comparable printings"));
assert.ok(!context.renderComparablePrintingsSection({ status: "loading" }).includes("aria-busy"), "loading state must not trigger Pico's duplicate spinner");
assert.ok(context.renderComparablePrintingsSection({ status: "error" }).includes("Retry"));
assert.ok(context.renderComparablePrintingsSection({ status: "ready", rows: [releaseDesc[0]], trackedContext: tracked }).includes("No other supported paper printings found"));
assert.ok(context.renderComparablePrintingsControls(10, 87).includes("Show 10 More"));
assert.ok(context.renderComparablePrintingsControls(10, 87).includes("Show All (87)"));
assert.ok(context.renderComparablePrintingsControls(20, 87).includes("Collapse"));
assert.ok(!context.renderComparablePrintingsControls(4, 4), "small result sets should not show expansion controls");
const printingColumn = context.getComparablePrintingColumns(tracked, 10)[0];
const currentRow = rows.find(row => row.key === "current|nonfoil");
const printingMarkup = printingColumn.html(currentRow, 0);
assert.ok(printingMarkup.includes('data-ms-action="art"'), "card name should use the standard table action binding");
assert.ok(printingMarkup.includes("Exact Art Card"), "the exact printing card name should be the preview control");
context.openComparablePrintingArtPreview(currentRow);
assert.strictEqual(previewedCards[0], currentRow.card, "art preview should receive the exact Scryfall printing object");
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(context.buildPrintingFinishCard({ id: "etched-card" }, "etched"))),
  { id: "etched-card|etched", scryfall_id: "etched-card", finish: "etched", foil: false },
  "Radar handoff should preserve an exact etched identity"
);

console.log("Comparable Printings validation passed.");
