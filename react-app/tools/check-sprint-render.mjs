import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";
import { MemoryRouter } from "react-router-dom";

// Static rendering catches runtime/component contracts while browser attachment
// is unavailable. It does not certify layout, keyboard interaction or focus.
const server = await createServer({ server: { middlewareMode: true, watch: null, ws: false }, appType: "custom" });
try {
  const { AppStateProvider } = await server.ssrLoadModule("/src/state/AppState.jsx");
  const { createStorageAdapter } = await server.ssrLoadModule("/src/persistence/storage.js");
  const { MarketEvidence } = await server.ssrLoadModule("/src/features/shared/MarketEvidence.jsx");
  const { ExitComparison } = await server.ssrLoadModule("/src/features/shared/ExitComparison.jsx");
  const { TradeDialog } = await server.ssrLoadModule("/src/features/shared/TradeDialog.jsx");
  const views = await server.ssrLoadModule("/src/features/views/Views.jsx");
  const position = { id: "synthetic|foil", scryfall_id: "synthetic", finish: "foil", foil: true, name: "Synthetic premium", qty: 3, buyPrice: 500, openBasisCents: 150000, currentPrice: null, buyDate: "2026-11-01" };
  function render(Component, props = {}, data = {}) {
    const entries = new Map(Object.entries(data).map(([key, value]) => [key, JSON.stringify(value)]));
    const adapter = createStorageAdapter({ getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) });
    return renderToString(React.createElement(AppStateProvider, { adapter }, React.createElement(MemoryRouter, null, React.createElement(Component, props))));
  }
  assert.match(render(MarketEvidence, { item: position }), /Unknown is not a zero price/);
  const desk = render(ExitComparison, { position }, { specs: [position] });
  assert.match(desk, /Quote unavailable/);
  assert.match(desk, /Store credit/);
  assert.match(desk, /Quantity to compare/);
  const sale = render(TradeDialog, { trade: { item: position, mode: "SELL", defaultQuantity: 1, initialFields: { price: "620", marketplaceFee: "77.50", shippingPaid: "10", otherCosts: "1.50" } } }, { specs: [position], cash: 10000 });
  assert.match(sale, /\$531\.00/);
  assert.match(sale, /Confirm sale/);
  assert.match(render(views.RadarView), /Start with one idea/);
  assert.match(render(views.PositionsView), /Find a card on Radar/);
  for (const name of ["DashboardView", "RadarView", "PositionsView", "SignalsView", "TransactionsView", "HistoryView", "AdminView"]) {
    const html = render(views[name], {}, { specs: Array.from({ length: 100 }, (_, index) => ({ ...position, id: `synthetic-${index}|foil`, scryfall_id: `synthetic-${index}` })) });
    assert.ok(html.length > 100, `${name} renders a populated shell`);
  }
  console.log("Sprint static-render checks passed: unknown evidence, exit desk, prefilled $531 receipt, empty and 100-position route shells. Browser layout/focus/keyboard remain unverified.");
} finally {
  await server.close();
}
