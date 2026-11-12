import { getAssetKey, getAssetType, getSingleFinish, getSingleScryfallId } from "./assetIdentity.js";
import { parsePrice } from "./quotes.js";

export function researchIdentity(item) {
  const assetKey = getAssetKey(item);
  if (!assetKey) throw new Error("Exact asset identity is required.");
  const identity = getAssetType(item) === "sealed" ? { mtgjson_uuid: item.mtgjson_uuid || assetKey.slice(7) } : { cardKey: assetKey.slice(7), scryfall_id: getSingleScryfallId(item), finish: getSingleFinish(item) };
  return { assetKey, assetType: getAssetType(item), ...identity, cardId: item.id, name: item.name, set_code: item.set_code, ...(getAssetType(item) === "single" ? { collector_number: item.collector_number } : {}) };
}

export function safeResearchUrl(value) {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}

export function observationAge(value, now = Date.now()) {
  const time = Date.parse(value);
  if (!Number.isFinite(time) || time > now) return { days: null, label: "Date unknown / future", stale: true };
  const days = Math.floor((now - time) / 86400000);
  return { days, label: days >= 30 ? `Stale · ${days}d old` : `${days}d old`, stale: days >= 30 };
}

export function marketEvidence(rows, item, now = Date.now()) {
  const observations = rows.filter(row => row.researchType !== "exit" && getAssetKey(row) === getAssetKey(item))
    .sort((a, b) => (Date.parse(b.checkedAt) || 0) - (Date.parse(a.checkedAt) || 0));
  const latest = observations[0];
  const market = parsePrice(latest?.marketPrice);
  const low = parsePrice(latest?.nmLow);
  const age = observationAge(latest?.checkedAt, now);
  const previous = observations.find(row => row !== latest && parsePrice(row.marketPrice) !== null);
  const prices = observations.map(row => parsePrice(row.marketPrice)).filter(value => value !== null);
  return { observations, latest, market, low, age,
    range: prices.length ? { count: prices.length, low: Math.min(...prices), high: Math.max(...prices) } : null,
    spread: market !== null && low !== null ? low - market : null,
    change: !age.stale && market !== null && parsePrice(previous?.marketPrice) > 0 ? (market / Number(previous.marketPrice) - 1) * 100 : null,
  };
}

export function createMarketObservation(item, fields, now = new Date().toISOString()) {
  const marketPrice = parsePrice(fields.marketPrice);
  const nmLow = parsePrice(fields.nmLow);
  if (marketPrice === null && nmLow === null && !fields.rawText?.trim()) throw new Error("Add a market price, NM listing or research note.");
  for (const key of ["marketPrice", "nmLow"]) {
    if (fields[key] !== "" && fields[key] != null && parsePrice(fields[key]) === null) throw new Error("Prices must be nonnegative or blank for unknown.");
  }
  if (!fields.source?.trim()) throw new Error("Name the source of this manual observation.");
  if (!Number.isFinite(Date.parse(fields.checkedAt)) || Date.parse(fields.checkedAt) > Date.parse(now)) throw new Error("Enter the actual observation time, no later than now.");
  if (fields.url && !safeResearchUrl(fields.url)) throw new Error("Use an http or https source URL.");
  return { ...researchIdentity(item), id: crypto.randomUUID(), researchType: "market", source: fields.source.trim(), enteredManually: true, checkedAt: new Date(fields.checkedAt).toISOString(), savedAt: now, marketPrice, nmLow, url: safeResearchUrl(fields.url), confidence: fields.confidence || "unknown", rawText: fields.rawText?.trim() || "", thesis: fields.thesis?.trim() || "", reprintRisk: fields.reprintRisk?.trim() || "", releaseReviewAt: fields.releaseReviewAt || "" };
}

export function comparableJudgment(item, card) {
  if (item.oracle_id && card.oracle_id && item.oracle_id !== card.oracle_id) return "Weak comparable · different card / demand must be justified";
  if (!item.oracle_id || !card.oracle_id) return "Weak comparable · shared card identity not verified";
  return "Same card · treatment, supply and release age may differ";
}
