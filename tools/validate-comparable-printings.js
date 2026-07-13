const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const source = fs.readFileSync("js/modules/card-details/comparable-printings.js", "utf8");
const printingsSource = fs.readFileSync("js/modules/portfolio/printings.js", "utf8");
const context = {
  console,
  Map,
  escapeHtml: value => String(value),
  escapeDetailAttribute: value => String(value),
  money: value => `$${Number(value).toFixed(2)}`,
  ManaSpecDataFoundation: { normalizeFinish: item => item.finish || (item.foil ? "foil" : "nonfoil") },
};
vm.createContext(context);
vm.runInContext(source, context);
vm.runInContext(printingsSource, context);

const cards = [
  { id: "current", games: ["paper"], digital: false, finishes: ["nonfoil", "foil"], set: "abc", collector_number: "2", released_at: "2024-01-01", prices: { usd: "10", usd_foil: "20" }, scryfall_uri: "https://scryfall.com/card/abc/2" },
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

const sorted = context.sortComparablePrintingRows(rows, tracked);
assert.strictEqual(sorted[0].key, "current|nonfoil", "current row should be pinned");
assert.strictEqual(sorted[1].key, "cheap|nonfoil", "other priced rows should sort lowest first");
assert.strictEqual(sorted.at(-1).key, "cheap|etched", "unpriced rows should sort last");
assert.strictEqual(context.formatComparablePriceDifference(-5, false), "-$5.00");
assert.strictEqual(context.formatComparablePriceDifference(0, false), "Same");
assert.strictEqual(context.formatComparablePriceDifference(null, true), "—", "current row should stay neutral in the comparison column");
assert.ok(context.renderComparablePrintingsSection({ status: "loading" }).includes("Loading comparable printings"));
assert.ok(!context.renderComparablePrintingsSection({ status: "loading" }).includes("aria-busy"), "loading state must not trigger Pico's duplicate spinner");
assert.ok(context.renderComparablePrintingsSection({ status: "error" }).includes("Retry"));
assert.ok(context.renderComparablePrintingsSection({ status: "ready", rows: [sorted[0]], trackedContext: tracked }).includes("No other supported paper printings found"));
assert.ok(context.renderComparablePrintingsControls(10, 87).includes("Show 10 More"));
assert.ok(context.renderComparablePrintingsControls(10, 87).includes("Show All (87)"));
assert.ok(context.renderComparablePrintingsControls(20, 87).includes("Collapse"));
assert.ok(!context.renderComparablePrintingsControls(4, 4), "small result sets should not show expansion controls");
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(context.buildPrintingFinishCard({ id: "etched-card" }, "etched"))),
  { id: "etched-card|etched", scryfall_id: "etched-card", finish: "etched", foil: false },
  "Radar handoff should preserve an exact etched identity"
);

console.log("Comparable Printings validation passed.");
