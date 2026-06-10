/*
====================================
CARD METADATA HELPERS
====================================

Shared Scryfall metadata for Radar ideas and owned Positions.
====================================
*/

function buildTrackedCard(card, overrides = {}) {
  const price = card.foil
    ? parseFloat(card.prices?.usd_foil || card.prices?.usd || overrides.currentPrice || 0)
    : parseFloat(card.prices?.usd || overrides.currentPrice || 0);

  return {
    id: card.id,
    scryfall_id: card.scryfall_id || card.id,
    name: card.name,
    set_code: card.set?.toUpperCase() || overrides.set_code || "",
    set_name: card.set_name || overrides.set_name || "",
    collector_number: card.collector_number || overrides.collector_number || "",
    foil: Boolean(card.foil || overrides.foil),
    currentPrice: Number.isFinite(price) ? price : Number(overrides.currentPrice || 0),
    entryTarget: Number(overrides.entryTarget || 0),
    exitTarget: Number(overrides.exitTarget || 0),
    holdTime: overrides.holdTime || "",
    ...extractCardMetadata(card),
    ...overrides,
  };
}

function syncCardMetadata(target, card) {
  Object.assign(target, extractCardMetadata(card));

  target.scryfall_id = card.id || target.scryfall_id || target.id;
  target.name = card.name || target.name;
  target.set_code = card.set?.toUpperCase() || target.set_code;
  target.set_name = card.set_name || target.set_name;
  target.collector_number = card.collector_number || target.collector_number;
}

function extractCardMetadata(card) {
  return {
    rarity: card.rarity || "",
    released_at: card.released_at || "",
    type_line: card.type_line || "",
    oracle_text: card.oracle_text || "",
    colors: card.colors || [],
    color_identity: card.color_identity || [],
    mana_cost: card.mana_cost || "",
    cmc: Number(card.cmc || 0),
    edhrec_rank: card.edhrec_rank || null,
    reserved: Boolean(card.reserved),
    reprint: Boolean(card.reprint),
    set_type: card.set_type || "",
    artist: card.artist || "",
    promo: Boolean(card.promo),
    finishes: card.finishes || [],
    frame: card.frame || "",
    border_color: card.border_color || "",
    security_stamp: card.security_stamp || "",
  };
}

function getColorLabel(item) {
  const colors = item.color_identity || item.colors || [];
  return colors.length ? colors.join("") : "C";
}

function getPrimaryType(item) {
  const typeLine = item.type_line || "";
  if (typeLine.includes("Creature")) return "Creature";
  if (typeLine.includes("Planeswalker")) return "Planeswalker";
  if (typeLine.includes("Instant")) return "Instant";
  if (typeLine.includes("Sorcery")) return "Sorcery";
  if (typeLine.includes("Artifact")) return "Artifact";
  if (typeLine.includes("Enchantment")) return "Enchantment";
  if (typeLine.includes("Land")) return "Land";
  if (typeLine.includes("Battle")) return "Battle";
  return "Other";
}
