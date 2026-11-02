// Empty, invalid and unavailable values must never become a market zero.
export function parsePrice(value) {
  if (!["string", "number"].includes(typeof value) || String(value).trim() === "") return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

export function priceDistance(value, target) {
  const price = parsePrice(value);
  const goal = parsePrice(target);
  return price !== null && goal > 0 ? ((price - goal) / goal) * 100 : null;
}
