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
    document: { getElementById: id => { if (!nodes.has(id)) nodes.set(id, { style: {} }); return nodes.get(id); } },
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
  console.log("Position valuation regressions passed (vanilla refresh, display, summary, identity and unavailable quotes).");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
