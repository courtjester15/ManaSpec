const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");
const baseline = process.argv.find(arg => arg.startsWith("--baseline="))?.slice(11);
const readSource = file => baseline
  ? execFileSync("git", ["show", `${baseline}:${file}`], { encoding: "utf8" })
  : fs.readFileSync(file, "utf8");

async function main() {
  const nodes = new Map();
  const context = vm.createContext({
    console, Date, Intl, specs: [], radar: [], cash: 100,
    document: { querySelector: () => null, getElementById: id => { if (!nodes.has(id)) nodes.set(id, { style: {} }); return nodes.get(id); } },
    syncCardMetadata() {}, save() {}, saveRadarState() {}, savePriceRefreshStatus() {},
    saveDailyPriceSnapshots(observations) { context.observations = observations; return { saved: observations.length }; },
  });
  for (const file of ["js/core/data-foundation.js", "js/modules/card-details/comparable-printings.js", "js/modules/portfolio/pricing.js", "js/ui/summary.js", "js/modules/portfolio/portfolio.js", "js/modules/dashboard/dashboard.js", "js/modules/card-metadata/card-metadata.js"]) {
    vm.runInContext(readSource(file), context);
  }
  vm.runInContext(readSource("js/core/app.js").replace(/initApp\(\);\s*$/, ""), context);
  context.save = () => {};
  context.savePriceRefreshStatus = () => {};
  for (const value of [null, undefined, "", " ", false, "invalid", "12oops", -1, Infinity]) {
    assert.equal(context.getScryfallUsdPrice({ prices: { usd: value, usd_foil: "99" } }, { foil: false }), null);
  }
  assert.equal(context.getScryfallUsdPrice({ prices: { usd: "0.00" } }, { foil: false }), 0);
  assert.equal(context.getScryfallUsdPrice({ prices: { usd: "9", usd_etched: "7" } }, { finish: "etched" }), 7);
  assert.equal(context.getPricingScryfallId({ id: "a|etched" }), "a");
  assert.equal(context.buildTrackedCard({ id: "a", foil: true, prices: { usd: "99", usd_foil: null } }).currentPrice, null);
  assert.equal(context.tableMoney(null), "-");
  assert.equal(context.tableMoney(0), "$0.00");
  context.specs = [
    { id: "a", name: "Unknown", foil: false, qty: 2, buyPrice: 5, currentPrice: null },
    { id: "b", name: "Stale", foil: false, qty: 2, buyPrice: 5, currentPrice: 8, priceUpdatedAt: "2020-01-01" },
    { id: "c", name: "Zero", foil: false, qty: 1, buyPrice: 5, currentPrice: 4 },
  ];
  context.fetch = async url => ({ ok: true, json: async () => ({ prices: { usd: url.endsWith("c") ? "0.00" : null } }) });
  await context.runPriceRefresh();
  assert.equal(context.specs[0].currentPrice, null);
  assert.equal(context.specs[0].pl, null);
  assert.equal(context.specs[1].currentPrice, 8);
  assert.equal(context.specs[1].priceUpdatedAt, "2020-01-01");
  assert.equal(context.specs[2].currentPrice, 0);
  assert.equal(context.getZeroValuationWarning(context.specs[2]), "");
  assert.equal(context.observations.length, 1);
  assert.equal(nodes.get("invested").innerText, "25.00");
  assert.equal(nodes.get("value").innerText, "16.00");
  assert.equal(nodes.get("totalPL").innerText, "+1.00 (6.7%)");
  assert.equal(context.getPositionValue(context.specs[0]), null);
  assert.equal(context.getPositionPlPct(context.specs[0]), null);
  assert.equal(context.getPositionGainLoss(context.specs[0]), null);
  const before = context.specs.map(row => [row.currentPrice, row.priceUpdatedAt]);
  context.fetch = async () => ({ ok: false, status: 503 });
  await context.runPriceRefresh();
  assert.deepEqual(context.specs.map(row => [row.currentPrice, row.priceUpdatedAt]), before);
  assert.equal(context.observations.length, 0);
  const live = JSON.parse(fs.readFileSync("test-fixtures/browser/issue-20-live-unf-quotes.json", "utf8"));
  for (const finish of ["nonfoil", "foil"]) {
    context.specs = live.cards.map(card => ({
      id: finish === "foil" ? `${card.id}|foil` : card.id, scryfall_id: card.id,
      name: card.name, set_code: "UNF", collector_number: card.collector_number,
      finish, foil: finish === "foil", finishes: card.finishes,
      qty: 1, buyPrice: 100, currentPrice: 0, priceUpdatedAt: "2020-01-01",
    }));
    const identity = context.specs.map(row => [row.id, row.finish, row.qty, row.buyPrice]);
    context.updateTotals();
    assert.equal(nodes.get("valuationWarning").hidden, false);
    context.fetch = async url => ({ ok: true, json: async () => live.cards.find(card => url.endsWith(card.id)) });
    await context.runPriceRefresh();
    assert.deepEqual(context.specs.map(row => [row.id, row.finish, row.qty, row.buyPrice]), identity);
    if (finish === "nonfoil") {
      assert.ok(context.specs.every(row => row.currentPrice === 0 && row.priceUpdatedAt === "2020-01-01"));
      assert.equal(nodes.get("valuationWarning").hidden, false);
      assert.match(nodes.get("valuationWarning").textContent, /not offered/);
      assert.equal(nodes.get("totalPL").innerText, "-200.00 (-100.0%)");
    } else {
      assert.equal(nodes.get("value").innerText, "339.02");
      assert.equal(nodes.get("totalPL").innerText, "+139.02 (69.5%)");
      assert.equal(nodes.get("valuationWarning").hidden, true);
    }
  }
  let signalsPainted = 0;
  context.document.querySelector = selector => selector === "#signalsTable" ? {} : null;
  context.renderSignalsView = () => { signalsPainted += 1; };
  await context.runPriceRefresh();
  assert.equal(signalsPainted, 1, "bulk quote refresh repaints the active Signals source");
  vm.runInContext(readSource("js/modules/card-details/card-details.js"), context);
  context.syncTrackedCardPrice(context.specs[0], live.cards[0]);
  assert.equal(signalsPainted, 2, "detail quote recovery also repaints the active source");
  context.document.querySelector = () => null;
  console.log("Position valuation regressions passed (vanilla refresh, display, summary, identity and unavailable quotes).");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
