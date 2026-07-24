import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveDashboardSignalState,
  deriveSignalRows,
  filterSignalRows,
  getSignalRowsForBucket,
  getSignalSourceNavigation,
} from "../domain/signals.js";
import { SIGNAL_NOW, signalFixtureState } from "./fixtures/signals.js";

const rows = deriveSignalRows(signalFixtureState, { now: SIGNAL_NOW });
const byId = id => rows.find(row => row.id === id);
const contract = row => ({
  id: row.id,
  buckets: row.buckets,
  status: row.status,
  reason: row.reasonLabel,
  priority: row.priority,
  source: row.source,
  action: row.actionLabel,
});

test("fixture rows match the vanilla signal contract", () => {
  assert.deepEqual(rows.map(contract), [
    { id: "shared-printing|nonfoil", buckets: ["targetsHit"], status: "Exit hit", reason: "At or above exit", priority: -10, source: "portfolio", action: "SELL / Position" },
    { id: "radar-entry-hit", buckets: ["targetsHit", "staleChecks"], status: "Entry hit", reason: "At or below entry", priority: -10, source: "radar", action: "BUY / Radar" },
    { id: "shared-printing|foil", buckets: ["approaching"], status: "Exit near", reason: "Near exit target", priority: 10.004, source: "portfolio", action: "REVIEW / Exit" },
    { id: "radar-approaching", buckets: ["approaching"], status: "Entry near", reason: "Near entry target", priority: 10.005, source: "radar", action: "REVIEW / Entry" },
    { id: "radar-stale", buckets: ["staleChecks"], status: "Market check", reason: "Stale market check", priority: 30.03, source: "radar", action: "MARKET / Radar" },
    { id: "position-outside", buckets: [], status: "Watching", reason: "Position review", priority: 99, source: "portfolio", action: "REVIEW / Position" },
    { id: "radar-fresh", buckets: [], status: "Watching", reason: "Radar watch", priority: 99, source: "radar", action: "WATCH / Radar" },
    { id: "radar-outside", buckets: [], status: "Watching", reason: "Radar watch", priority: 99, source: "radar", action: "WATCH / Radar" },
    { id: "radar-no-plan", buckets: ["noPlan"], status: "No plan", reason: "Entry missing", priority: 20 + new Date("2026-01-08T00:00:00.000Z").getTime() / 1000, source: "radar", action: "ADD PLAN" },
    { id: "position-no-plan", buckets: ["noPlan"], status: "No plan", reason: "Exit + Hold missing", priority: 20 + (10_000_000_000_000 + new Date("2026-01-04T00:00:00.000Z").getTime()) / 1000, source: "portfolio", action: "ADD PLAN" },
  ]);
});

test("Approaching is inclusive at 5% and excludes rows outside 5%", () => {
  assert.equal(byId("radar-approaching").targetPercent, 5);
  assert.equal(byId("radar-approaching").buckets.includes("approaching"), true);
  assert.ok(byId("radar-outside").targetPercent > 5);
  assert.equal(byId("radar-outside").buckets.includes("approaching"), false);
  assert.equal(byId("position-outside").targetPercent, 6);
});

test("market freshness uses exact printing and finish identity", () => {
  assert.equal(byId("shared-printing|nonfoil").marketFreshness, "1d old");
  assert.equal(byId("shared-printing|nonfoil").marketPrice, 109);
  assert.equal(byId("shared-printing|foil").marketFreshness, "2d old");
  assert.equal(byId("shared-printing|foil").marketPrice, 97);
  assert.equal(byId("radar-stale").marketFreshness, "30d old");
  assert.equal(byId("radar-fresh").marketFreshness, "7d old");
  assert.equal(byId("radar-fresh").buckets.includes("staleChecks"), false);
});

test("bucket, exact-row, and reset selectors match vanilla triage", () => {
  assert.deepEqual(getSignalRowsForBucket(rows, "targetsHit").map(row => row.id), ["shared-printing|nonfoil", "radar-entry-hit"]);
  assert.deepEqual(getSignalRowsForBucket(rows, "approaching").map(row => row.id), ["shared-printing|foil", "radar-approaching", "radar-outside", "position-outside", "radar-stale", "radar-fresh"]);
  assert.deepEqual(filterSignalRows(rows, { bucketId: "approaching", printingId: "shared-printing|foil" }).map(row => row.id), ["shared-printing|foil"]);
  assert.deepEqual(filterSignalRows(rows).map(row => row.id), ["shared-printing|nonfoil", "radar-entry-hit", "shared-printing|foil", "radar-approaching", "radar-stale", "radar-no-plan", "position-no-plan"]);
});

test("source navigation preserves exact Radar and Positions printing identity", () => {
  assert.deepEqual(getSignalSourceNavigation(byId("shared-printing|foil")), { pathname: "/positions", search: "?focus=shared-printing%7Cfoil" });
  assert.deepEqual(getSignalSourceNavigation(byId("radar-approaching")), { pathname: "/radar", search: "?focus=radar-approaching" });
});

test("Dashboard totals and queues use the same derived signal membership", () => {
  const dashboard = deriveDashboardSignalState(rows);
  assert.equal(dashboard.activeCount, filterSignalRows(rows).length);
  assert.deepEqual(dashboard.queues.exitHits.map(row => row.id), ["shared-printing|nonfoil"]);
  assert.deepEqual(dashboard.queues.entryHits.map(row => row.id), ["radar-entry-hit"]);
  assert.deepEqual(dashboard.queues.exitNear.map(row => row.id), ["shared-printing|foil", "position-outside"]);
  assert.deepEqual(dashboard.queues.entryNear.map(row => row.id), ["radar-approaching", "radar-outside", "radar-stale", "radar-fresh"]);
  assert.deepEqual(dashboard.queues.marketDue.map(row => row.id), ["radar-entry-hit", "radar-stale"]);
  assert.deepEqual(dashboard.queues.holdDue.map(row => row.id), ["position-no-plan"]);
  assert.deepEqual(dashboard.queues.missingPlans.map(row => row.id), ["radar-no-plan", "position-no-plan"]);
});
