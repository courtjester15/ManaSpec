import { tradeEconomics, TRADE_CHARGES, toCents } from "./tradeEconomics.js";
import { observationAge, researchIdentity, safeResearchUrl } from "./marketIntelligence.js";

export const EXIT_CHARGES = TRADE_CHARGES.filter(field => !field.type || field.type === "SELL");

export function emptyExitRoute(name = "Marketplace estimate") {
  return { id: crypto.randomUUID(), name, quoteType: "asking", payout: "cash", price: "", feePercent: "", condition: "NM", availableQty: "", checkedAt: "", expiresAt: "", source: "", url: "", confidence: "unknown", notes: "" };
}

export function exitTerms(route, quantity) {
  const terms = Object.fromEntries(EXIT_CHARGES.map(({ key }) => [key, route[key] ?? ""]));
  if (route.feePercent !== "" && route.feePercent != null) {
    const rate = Number(route.feePercent);
    if (!Number.isFinite(rate) || rate < 0 || rate >= 100) throw new Error("Fee estimate must be between 0 and less than 100 percent.");
    const price = toCents(route.price);
    if (price !== null) {
      const fixed = toCents(terms.marketplaceFee || 0);
      if (fixed === null || fixed < 0) throw new Error("Enter marketplace fee in dollars and cents.");
      terms.marketplaceFee = (fixed + Math.round(price * Number(quantity) * rate / 100)) / 100;
    }
  }
  return terms;
}

export function compareExit(position, quantity, route, now = Date.now()) {
  if (route.price === "" || route.price == null) return { unknown: true, warning: "Quote unavailable · enter a per-unit amount" };
  const qty = Number(quantity);
  if (route.availableQty !== "" && route.availableQty != null && (!Number.isSafeInteger(Number(route.availableQty)) || Number(route.availableQty) < qty)) throw new Error("Requested quantity exceeds this offer's valid quantity.");
  const terms = exitTerms(route, qty);
  const values = tradeEconomics("SELL", qty, route.price, terms, position);
  const age = observationAge(route.checkedAt, now);
  const expired = Boolean(route.expiresAt) && (!Number.isFinite(Date.parse(route.expiresAt)) || Date.parse(route.expiresAt) <= now);
  const assumptions = EXIT_CHARGES.filter(({ key }) => route[key] === "" || route[key] == null).map(({ label }) => label);
  // Solve against the same cent rounding as the receipt, including percentage fees.
  let breakEvenCents = null;
  if (values.basisCents !== null) {
    let lower = 1;
    let upper = Math.max(1, values.unitCents);
    const atPrice = cents => tradeEconomics("SELL", qty, cents / 100, exitTerms({ ...route, price: cents / 100 }, qty), position).cashCents;
    while (atPrice(upper) < values.basisCents && upper < 1_000_000_000_000) upper *= 2;
    if (atPrice(upper) >= values.basisCents) {
      while (lower < upper) {
        const middle = Math.floor((lower + upper) / 2);
        if (atPrice(middle) >= values.basisCents) upper = middle;
        else lower = middle + 1;
      }
      breakEvenCents = lower;
    }
  }
  return { ...values, terms, age, expired, assumptions, breakEvenCents, unknown: false,
    roi: values.basisCents > 0 ? values.realizedCents / values.basisCents * 100 : null,
    cash: route.payout === "cash",
  };
}

export function createExitResearch(position, quantity, routes, now = new Date().toISOString()) {
  const qty = Number(quantity);
  if (!Number.isSafeInteger(qty) || qty < 1 || qty > Number(position.qty)) throw new Error("Choose a whole quantity within your current holding.");
  if (!routes.length || routes.length > 3) throw new Error("Compare between one and three routes.");
  for (const route of routes) {
    if (route.url && !safeResearchUrl(route.url)) throw new Error("Use an http or https source URL.");
    compareExit(position, qty, route, Date.parse(now));
  }
  return { ...researchIdentity(position), id: crypto.randomUUID(), researchType: "exit", source: "exit-research", checkedAt: now, quantity: qty, routes: structuredClone(routes), rawText: "Saved exit comparison assumptions; not a sale or market valuation." };
}

export function actualSaleDraft(position, quantity, route) {
  const result = compareExit(position, quantity, route);
  if (result.unknown || !result.cash) throw new Error("Only a cash quote can prefill the cash-sale confirmation.");
  return { item: position, mode: "SELL", defaultQuantity: Number(quantity), initialFields: { ...result.terms, price: route.price, source: route.name, notes: `Confirm actual terms, condition ${route.condition || "unknown"}. Research source: ${route.source || "unknown"}. ${route.notes || ""}` } };
}
