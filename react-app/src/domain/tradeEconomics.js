export const TRADE_CHARGES = [
  { key: "shippingPaid", label: "Shipping / postage paid" },
  { key: "taxPaid", label: "Sales tax paid", type: "BUY" },
  { key: "marketplaceFee", label: "Marketplace fee" },
  { key: "commission", label: "Commission" },
  { key: "otherCosts", label: "Supplies / other costs" },
  { key: "discount", label: "Discount / credit", type: "BUY", sign: -1 },
  { key: "shippingCharged", label: "Shipping charged to buyer", type: "SELL", sign: -1 },
  { key: "refund", label: "Discount / refund to buyer", type: "SELL" },
];

export function toCents(value) {
  if (!["number", "string"].includes(typeof value) || String(value).trim() === "") return null;
  const amount = Number(value);
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) && Math.abs(amount * 100 - cents) < 0.000001 ? cents : null;
}

export function positionBasisCents(position) {
  if (position?.openBasisCents !== null && position?.openBasisCents !== undefined) {
    return Number.isSafeInteger(position.openBasisCents) && position.openBasisCents >= 0 ? position.openBasisCents : null;
  }
  const basis = Math.round(Number(position?.buyPrice) * Number(position?.qty) * 100);
  if (basis === 0 && position?.openBasisCents === 0 && position.buyPrice === 0) return 0;
  return Number.isSafeInteger(basis) && basis > 0 ? basis : null;
}

export function allocateBasis(basis, sold, owned) {
  if (basis === null) return null;
  // Round half up, with any residual cents left in the open holding.
  const divisor = BigInt(owned);
  return Number((2n * BigInt(basis) * BigInt(sold) + divisor) / (2n * divisor));
}

export function tradeEconomics(type, quantity, price, details = {}, position) {
  const qty = Number(quantity);
  const unitCents = toCents(price);
  if (!Number.isSafeInteger(qty) || qty < 1) throw new Error("Enter a whole quantity of at least 1.");
  if (unitCents === null || unitCents <= 0) throw new Error("Enter a price greater than zero, in dollars and cents.");
  const grossCents = qty * unitCents;
  if (!Number.isSafeInteger(grossCents)) throw new Error("Trade total is too large.");
  const charges = {};
  let friction = 0n;
  for (const { key, label, type: appliesTo, sign = 1 } of TRADE_CHARGES) {
    if (appliesTo && appliesTo !== type) continue;
    const raw = details[key];
    const cents = raw === undefined || raw === null || raw === "" ? null : toCents(raw);
    if (raw != null && raw !== "" && (cents === null || cents < 0)) {
      throw new Error(`Enter ${label.toLowerCase()} as a nonnegative amount in dollars and cents.`);
    }
    charges[key] = cents;
    friction += BigInt(cents ?? 0) * BigInt(sign);
  }
  const selling = type === "SELL";
  const cashCents = Number(selling ? BigInt(grossCents) - friction : BigInt(grossCents) + friction);
  if (!Number.isSafeInteger(cashCents)) throw new Error("Trade total is too large.");
  if (!selling && cashCents <= 0) throw new Error("All-in purchase cost must be greater than zero.");
  const owned = Number(position?.qty);
  if (selling && (!Number.isSafeInteger(owned) || qty > owned)) {
    throw new Error("Sale quantity exceeds the current holding. Review the quantity before selling.");
  }
  const openBasis = selling ? positionBasisCents(position) : null;
  const basisCents = selling ? allocateBasis(openBasis, qty, owned) : null;
  const realizedCents = basisCents === null ? null : cashCents - basisCents;
  if (realizedCents !== null && !Number.isSafeInteger(realizedCents)) throw new Error("Realized gain or loss is too large.");
  return { qty, unitCents, grossCents, charges, cashCents, basisCents, realizedCents };
}

export function transactionCashCents(tx) {
  const value = tx.trade?.cashCents;
  if (tx.trade?.version === 1 && Number.isSafeInteger(value)) return value;
  return null;
}

export function transactionCashAmount(tx) {
  const cents = transactionCashCents(tx);
  if (cents !== null) return cents / 100;
  const gross = Number(tx.quantity) * Number(tx.price);
  return Number.isFinite(gross) ? gross : 0;
}

export function activeTransactions(records) {
  const reversed = new Set(records.filter(tx => tx?.type === "REVERSAL" && tx.trade?.version === 1)
    .map(tx => tx.reversesId).filter(Boolean));
  return records.filter(tx => tx?.type !== "REVERSAL" && !reversed.has(tx?.id));
}
