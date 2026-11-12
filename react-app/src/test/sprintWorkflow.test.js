import test from "node:test";
import assert from "node:assert/strict";
import { toTrackedCard, applyPriceObservations } from "../services/scryfall.js";
import { buyFromRadar, sellPosition, reverseTrade } from "../domain/trading.js";
import { calculatePortfolioSummary } from "../domain/portfolio.js";
import { actualSaleDraft, createExitResearch, emptyExitRoute } from "../domain/exitComparison.js";
import { createMarketObservation, marketEvidence } from "../domain/marketIntelligence.js";
import { createStorageAdapter } from "../persistence/storage.js";
import { buildHistoryEvents } from "../domain/localSearch.js";
import { deriveSignalRows } from "../domain/signals.js";

function setup() {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
  const adapter = createStorageAdapter(storage);
  return { adapter, state: adapter.loadState() };
}
function tracked(index, premium = false) {
  return toTrackedCard({ id: `synthetic-${index}`, oracle_id: `card-${index}`, name: `Synthetic ${index}`, set: "TST", set_name: "Synthetic QA", collector_number: String(index), finishes: premium ? ["foil"] : ["nonfoil"], prices: { usd: "10", usd_foil: "500" } }, { finish: premium ? "foil" : "nonfoil", plannedQty: 1, entryTarget: 10 });
}
function persist(adapter, state) {
  adapter.saveSlices(state);
  return adapter.loadState();
}

test("first $10 spec survives buy, cost inspection, research, loss-making exit, reload and reversal", () => {
  const { adapter, state } = setup();
  const item = tracked(1);
  let current = persist(adapter, { ...state, radar: [item] });
  current = persist(adapter, buyFromRadar(current, item, 1, 10, { shippingPaid: 1, taxPaid: .80, source: "Synthetic shop" }));
  assert.equal(current.specs[0].openBasisCents, 1180);
  const offer = { ...emptyExitRoute(), price: "12", shippingPaid: "2", marketplaceFee: "1.80", source: "Synthetic observed listing" };
  const research = createExitResearch(current.specs[0], 1, [offer]);
  current = persist(adapter, { ...current, marketObservations: [research] });
  assert.equal(marketEvidence(current.marketObservations, item).market, null);
  const draft = actualSaleDraft(current.specs[0], 1, offer);
  current = persist(adapter, sellPosition(current, item, draft.defaultQuantity, draft.initialFields.price, draft.initialFields));
  assert.equal(current.transactions[0].realizedPL, -3.6);
  assert.equal(current.radar.length, 1);
  const backup = adapter.parseBackupText(JSON.stringify(adapter.createBackup(current)));
  assert.equal(backup.ok, true);
  adapter.restoreBackup(backup.backup);
  current = adapter.loadState();
  assert.equal(current.marketObservations[0].researchType, "exit");
  assert.match(buildHistoryEvents(current).find(row => row.id === `market-${research.id}`).summary, /no sale recorded/);
  current = persist(adapter, reverseTrade(current, current.transactions[0], "Synthetic correction"));
  assert.equal(current.specs[0].qty, 1);
  assert.equal(current.specs[0].openBasisCents, 1180);
});

test("100-position professional case keeps $500 foil partial-exit totals stable across export/import", () => {
  const { adapter, state } = setup();
  const specs = Array.from({ length: 100 }, (_, index) => ({ ...tracked(index, index === 50), qty: 3, buyPrice: index === 50 ? 500 : 10, openBasisCents: index === 50 ? 150000 : 3000, buyDate: "2026-11-01T12:00:00Z", exitTarget: index === 50 ? 600 : 15, holdTime: "3" }));
  let current = persist(adapter, { ...state, specs });
  const selected = specs[50];
  const offer = { ...emptyExitRoute(), price: "620", feePercent: "12.5", shippingPaid: "10", otherCosts: "1.50", checkedAt: "2026-11-11T10:00", condition: "NM" };
  const draft = actualSaleDraft(selected, 1, offer);
  current = persist(adapter, sellPosition(current, selected, 1, draft.initialFields.price, draft.initialFields));
  const summary = calculatePortfolioSummary(current.specs, current.cash, { transactions: current.transactions });
  assert.equal(current.specs[50].qty, 2);
  assert.equal(current.specs[50].openBasisCents, 100000);
  assert.equal(current.transactions[0].trade.cashCents, 53100);
  const before = JSON.stringify(current);
  assert.throws(() => sellPosition(current, selected, 999, 500), /exceeds/);
  assert.equal(JSON.stringify(current), before);
  adapter.restoreBackup(adapter.parseBackupText(JSON.stringify(adapter.createBackup(current))).backup);
  const restored = adapter.loadState();
  assert.deepEqual(calculatePortfolioSummary(restored.specs, restored.cash, { transactions: restored.transactions }), summary);
  assert.equal(deriveSignalRows(restored).length, 100);
});

test("new bonus sheet, very stale checks, unsupported etched and failed refresh remain honest", () => {
  const normal = tracked(1);
  const etched = { ...tracked(2), id: "synthetic-2|etched", finish: "etched", currentPrice: null };
  const bonus = { ...tracked(3, true), set_type: "masterpiece", released_at: "2026-11-11" };
  const record = createMarketObservation(normal, { source: "tcgplayer-manual", marketPrice: "10", nmLow: "", checkedAt: "2020-01-01", rawText: "Synthetic old observation" });
  const evidence = marketEvidence([record], normal);
  assert.equal(evidence.age.stale, true);
  assert.equal(evidence.low, null);
  assert.equal(evidence.range.count, 1);
  assert.equal(marketEvidence([record], etched).market, null);
  assert.equal(applyPriceObservations([etched], [])[0].currentPrice, null);
  assert.equal(bonus.set_type, "masterpiece");
});
