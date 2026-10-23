import { getSingleFinish, getSingleScryfallId } from "../domain/assetIdentity.js";
import { finishPolicy } from "../domain/finishPolicy.js";

const API = "https://api.scryfall.com";

async function request(path, signal) {
  const response = await fetch(`${API}${path}`, { signal, headers: { Accept: "application/json" } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.details || "Scryfall request failed.");
  return body;
}

export async function searchCards(query, signal) {
  const q = String(query || "").trim();
  if (q.length < 2) return [];
  const setNumber = parseSetNumberQuery(q);
  if (setNumber) {
    const search = `set:${setNumber[1]} number:${setNumber[2]} game:paper`;
    const body = await request(`/cards/search?q=${encodeURIComponent(search)}&unique=prints&order=name`, signal);
    return (body.data || []).slice(0, 12);
  }
  const named = await request(`/cards/named?fuzzy=${encodeURIComponent(q)}`, signal);
  const search = `oracleid:${named.oracle_id} game:paper`;
  const body = await request(`/cards/search?q=${encodeURIComponent(search)}&unique=prints&order=released&dir=desc`, signal);
  return (body.data || []).slice(0, 12);
}

export function parseSetNumberQuery(query) {
  return String(query || "").trim().match(/^([a-z0-9]{3,6})\s+#?([0-9][a-z0-9-]*)$/i);
}

export async function fetchCard(id, signal) {
  return request(`/cards/${encodeURIComponent(id)}`, signal);
}

export async function fetchPrintings(card, signal) {
  if (!card.oracle_id) return [card];
  const body = await request(`/cards/search?q=${encodeURIComponent(`oracleid:${card.oracle_id}`)}&unique=prints&order=released&dir=desc`, signal);
  return body.data || [];
}

export function getCardPrice(card, foil = false) {
  if (foil === null) return null;
  const finish = typeof foil === "string" ? foil : foil ? "foil" : "nonfoil";
  const value = card.prices?.[{ nonfoil: "usd", foil: "usd_foil", etched: "usd_etched" }[finish]];
  if (!["string", "number"].includes(typeof value) || String(value).trim() === "") return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

export function toTrackedCard(card, options = {}) {
  const requested = options.finish || (Object.hasOwn(options, "foil") ? options.foil ? "foil" : "nonfoil" : "");
  const finish = finishPolicy.selectFinish(card, requested);
  const foil = finish === "foil";
  const baseId = getSingleScryfallId(card);
  return {
    id: finish === "nonfoil" ? baseId : `${baseId}|${finish}`, scryfall_id: baseId, finish, trackedPrintingKey: `${baseId}|${finish}`, oracle_id: card.oracle_id, name: card.name,
    set_code: card.set?.toUpperCase?.() || card.set, set_name: card.set_name,
    collector_number: card.collector_number, foil, currentPrice: getCardPrice(card, finish),
    entryTarget: Number(options.entryTarget || 0), exitTarget: Number(options.exitTarget || 0),
    plannedQty: Math.max(1, Number(options.plannedQty || 1)), holdTime: options.holdTime || "",
    addedDate: new Date().toISOString(), priceUpdatedAt: getCardPrice(card, finish) === null ? null : new Date().toISOString(),
    rarity: card.rarity, released_at: card.released_at, type_line: card.type_line,
    oracle_text: card.oracle_text, colors: card.colors, color_identity: card.color_identity,
    mana_cost: card.mana_cost, cmc: card.cmc, edhrec_rank: card.edhrec_rank,
    reserved: card.reserved, reprint: card.reprint, set_type: card.set_type,
    artist: card.artist, promo: card.promo, finishes: card.finishes, frame: card.frame,
    border_color: card.border_color, security_stamp: card.security_stamp,
    prices: card.prices, image_uris: card.image_uris || card.card_faces?.[0]?.image_uris,
  };
}

export async function refreshTrackedPrices(items) {
  if (!items.length) return { items, updated: 0, observations: [] };
  const byId = new Map();
  for (let index = 0; index < items.length; index += 75) {
    const response = await fetch(`${API}/cards/collection`, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ identifiers: items.slice(index, index + 75).map(item => ({ id: getSingleScryfallId(item) })) }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.details || "Price refresh failed.");
    body.data.forEach(card => byId.set(card.id, card));
  }
  const now = new Date().toISOString();
  const observations = [];
  const refreshed = items.map(item => {
      const card = byId.get(getSingleScryfallId(item));
      const price = card ? getCardPrice(card, getSingleFinish(item)) : null;
      if (price === null) return item;
      const updated = { ...item, currentPrice: price, prices: card.prices, priceUpdatedAt: now };
      observations.push(updated);
      return updated;
    });
  return { items: refreshed, updated: observations.length, observations };
}

// A watched row and an owned row can share identity, but never ownership/plan fields.
export function applyPriceObservations(items, observations) {
  const quotes = new Map(observations.map(item => [item.id, {
    currentPrice: item.currentPrice, prices: item.prices, priceUpdatedAt: item.priceUpdatedAt,
  }]));
  return items.map(item => quotes.has(item.id) ? { ...item, ...quotes.get(item.id) } : item);
}
