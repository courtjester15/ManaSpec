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

function matchesPlan(item, wanted) {
  const hasPlan = Boolean(number(item.entryTarget) || number(item.exitTarget) || item.holdTime);
  if (wanted === "planned") return hasPlan;
  if (wanted === "unplanned") return !hasPlan;

  const price = number(item.currentPrice);
  const owned = number(item.qty) > 0;
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

export function filterTrackedCards(items, filters = EMPTY_CARD_FILTERS) {
  const text = String(filters.text || "").trim().toLowerCase();
  const minPrice = number(filters.minPrice);
  const maxPrice = number(filters.maxPrice);

  return items.filter(item => {
    const haystack = [item.name, item.set_code, item.set_name, item.type_line, item.oracle_text, item.artist]
      .join(" ")
      .toLowerCase();
    if (text && !haystack.includes(text)) return false;
    if (filters.rarity && item.rarity !== filters.rarity) return false;
    if (filters.type && primaryType(item) !== filters.type) return false;
    if (filters.color && !matchesColor(item, filters.color)) return false;
    if (minPrice && number(item.currentPrice) < minPrice) return false;
    if (maxPrice && number(item.currentPrice) > maxPrice) return false;
    if (filters.reserved && !item.reserved) return false;
    if (filters.reprint === "new" && item.reprint) return false;
    if (filters.reprint === "reprint" && !item.reprint) return false;
    if (filters.plan && !matchesPlan(item, filters.plan)) return false;
    return true;
  });
}
