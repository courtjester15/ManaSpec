const number = value => Number(value || 0);

export const EMPTY_CARD_FILTERS = Object.freeze({
  text: "",
  rarity: "",
  type: "",
  color: "",
  minPrice: "",
  maxPrice: "",
  reserved: false,
  reprint: "",
  plan: "",
});

function primaryType(item) {
  const typeLine = String(item.type_line || "").split("—")[0].trim();
  return ["Creature", "Planeswalker", "Instant", "Sorcery", "Artifact", "Enchantment", "Land", "Battle"]
    .find(type => typeLine.includes(type)) || "";
}

function matchesColor(item, wanted) {
  const colors = item.color_identity || item.colors || [];
  if (wanted === "C") return colors.length === 0;
  if (wanted === "M") return colors.length > 1;
  return colors.includes(wanted);
}

function matchesPlan(item, wanted, source) {
  const hasPlan = Boolean(number(item.entryTarget) || number(item.exitTarget) || item.holdTime);
  if (wanted === "planned") return hasPlan;
  if (wanted === "unplanned") return !hasPlan;

  const price = item.currentPrice === null || item.currentPrice === undefined || item.currentPrice === "" ? NaN : Number(item.currentPrice);
  if (!Number.isFinite(price) || price < 0) return false;
  const owned = source ? source === "positions" : number(item.qty) > 0;
  const target = number(owned ? item.exitTarget : item.entryTarget);
  if (!target) return false;
  if (wanted === "entryHit") return !owned && price <= target;
  if (wanted === "exitHit") return owned && price >= target;
  if (wanted === "approaching") {
    const distance = owned ? (target - price) / target : (price - target) / target;
    return distance >= 0 && distance <= 0.05;
  }
  return true;
}

export function filterTrackedCards(items, filters = EMPTY_CARD_FILTERS, options = {}) {
  const text = String(filters.text || "").trim().toLowerCase();
  const minPrice = number(filters.minPrice);
  const maxPrice = number(filters.maxPrice);
  const hasMin = filters.minPrice !== "" && filters.minPrice !== undefined && filters.minPrice !== null;
  const hasMax = filters.maxPrice !== "" && filters.maxPrice !== undefined && filters.maxPrice !== null;

  return items.filter(item => {
    const haystack = [item.name, item.set_code, item.set_name, item.type_line, item.oracle_text, item.artist, item.collector_number, item.productType, item.category]
      .join(" ")
      .toLowerCase();
    if (text && !haystack.includes(text)) return false;
    if (filters.rarity && item.rarity !== filters.rarity) return false;
    if (filters.type && primaryType(item) !== filters.type) return false;
    if (filters.color && !matchesColor(item, filters.color)) return false;
    const priceKnown = item.currentPrice !== null && item.currentPrice !== undefined && item.currentPrice !== "" && Number.isFinite(Number(item.currentPrice)) && Number(item.currentPrice) >= 0;
    if ((hasMin || hasMax) && !priceKnown) return false;
    if (hasMin && number(item.currentPrice) < minPrice) return false;
    if (hasMax && number(item.currentPrice) > maxPrice) return false;
    if (filters.reserved && !item.reserved) return false;
    if (filters.reprint === "new" && item.reprint) return false;
    if (filters.reprint === "reprint" && !item.reprint) return false;
    if (filters.plan && !matchesPlan(item, filters.plan, options.source)) return false;
    return true;
  });
}
