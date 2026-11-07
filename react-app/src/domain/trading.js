import { dataFoundation } from "./dataFoundation.js";
import { getAssetKey, getAssetType, getSingleFinish, getSingleScryfallId } from "./assetIdentity.js";
import { finishPolicy } from "./finishPolicy.js";
import { activeTransactions, positionBasisCents, tradeEconomics } from "./tradeEconomics.js";

function id() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function transaction(position, type, values, details, balanceAfter, trade) {
  const recordedAt = new Date().toISOString();
  const timestamp = details.date ? new Date(details.date).getTime() : Date.parse(recordedAt);
  if (!Number.isFinite(timestamp)) throw new Error("Enter a valid trade date and time.");
  if (timestamp > Date.parse(recordedAt)) throw new Error("Enter a trade date and time that has already passed.");
  const base = {
    id: id(), cardId: position.id, name: position.name, set_code: position.set_code,
    set_name: position.set_name, collector_number: position.collector_number,
    type, quantity: values.qty, price: values.unitCents / 100,
    date: new Date(timestamp).toISOString(), recordedAt, balanceAfter,
    notes: String(details.notes ?? "").trim(),
    costBasisPerUnit: values.basisCents === null ? null : values.basisCents / 100 / values.qty,
    costBasisTotal: values.basisCents === null ? null : values.basisCents / 100,
    realizedPL: values.realizedCents === null ? null : values.realizedCents / 100,
    trade: {
      version: 1,
      source: String(details.source ?? "").trim() || null,
      reference: String(details.reference ?? "").trim() || null,
      grossCents: values.grossCents,
      cashCents: values.cashCents,
      basisCents: values.basisCents,
      charges: values.charges,
      ...trade,
    },
  };
  if (getAssetType(position) === "sealed") {
    return {
      ...base,
      assetType: "sealed",
      assetKey: getAssetKey(position),
      mtgjson_uuid: position.mtgjson_uuid,
      category: position.category,
      subtype: position.subtype,
      productType: position.productType,
      releaseDate: position.releaseDate,
      tcgplayerProductId: position.tcgplayerProductId,
      purchaseUrls: position.purchaseUrls,
      contentsSummary: position.contentsSummary,
    };
  }
  return {
    ...base,
    foil: Boolean(position.foil),
    ...(finishPolicy.recordFinish(position) ? { finish: finishPolicy.recordFinish(position), trackedPrintingKey: `${position.scryfall_id || String(position.id).replace(/\|.*$/, "")}|${finishPolicy.recordFinish(position)}` } : {}),
    scryfall_id: position.scryfall_id || position.id,
    oracle_id: position.oracle_id,
    rarity: position.rarity,
    colors: position.colors,
    color_identity: position.color_identity,
    type_line: position.type_line,
    image_uris: position.image_uris,
  };
}

function assetStores(item) {
  return getAssetType(item) === "sealed"
    ? { positions: "sealedSpecs", transactions: "sealedTransactions" }
    : { positions: "specs", transactions: "transactions" };
}

function findPosition(positions, item) {
  const key = getAssetKey(item);
  const matches = positions.filter(row => key && getAssetKey(row) ? getAssetKey(row) === key : row.id === item.id);
  if (matches.length > 1) throw new Error("Reconcile duplicate holdings for this exact asset before trading.");
  return matches[0];
}

function adjustedCash(cash, deltaCents) {
  const cents = Math.round(Number(cash) * 100) + deltaCents;
  if (!Number.isSafeInteger(cents)) throw new Error("Cash balance is outside the supported range.");
  if (cents < 0) throw new Error("Not enough cash for this operation.");
  return cents / 100;
}

function financialState(position) {
  return position ? {
    qty: position.qty, buyPrice: position.buyPrice, buyDate: position.buyDate ?? null,
    openBasisCents: position.openBasisCents ?? null,
  } : null;
}

function withPositionProfit(position) {
  const quote = position.currentPrice;
  return { ...position, pl: positionBasisCents(position) === null || quote == null || quote === "" || !Number.isFinite(Number(quote)) || Number(quote) < 0
    ? null : (Number(quote) - Number(position.buyPrice)) * position.qty };
}

function replacePosition(positions, current, next) {
  if (!current) return [...positions, next];
  if (!next) return positions.filter(row => row !== current);
  return positions.map(row => row === current ? next : row);
}

export function buyFromRadar(state, item, quantity, price, details = {}) {
  if (getAssetType(item) === "single" && Array.isArray(item.finishes)) finishPolicy.selectFinish(item, finishPolicy.recordFinish(item));
  const stores = assetStores(item);
  const positions = state[stores.positions] || [];
  const current = findPosition(positions, item);
  const values = tradeEconomics("BUY", quantity, price, details);
  const cash = adjustedCash(state.cash, -values.cashCents);
  const openBasis = current ? positionBasisCents(current) : 0;
  const qty = Number(current?.qty ?? 0) + values.qty;
  if (openBasis === null || !Number.isSafeInteger(qty) || !Number.isSafeInteger(openBasis + values.cashCents)) {
    throw new Error("Reconcile the existing holding and its cost basis before adding to it.");
  }
  const openBasisCents = openBasis + values.cashCents;
  const finish = getSingleFinish(item);
  const scryfallId = getSingleScryfallId(item);
  const identity = !current && finish && scryfallId
    ? { scryfall_id: scryfallId, finish, trackedPrintingKey: `${scryfallId}|${finish}` }
    : {};
  const tx = transaction(current || { ...item, ...identity }, "BUY", values, details, cash);
  const next = withPositionProfit({
    ...(current || item), ...identity, qty, openBasisCents, buyPrice: openBasisCents / 100 / qty,
    buyDate: current?.buyDate || tx.date,
  });
  Object.assign(tx.trade, { before: financialState(current), after: financialState(next) });
  return {
    ...state,
    [stores.positions]: replacePosition(positions, current, next),
    cash,
    [stores.transactions]: [tx, ...(state[stores.transactions] || [])],
  };
}

export function buyPosition(state, item, quantity, price, details) {
  return buyFromRadar(state, item, quantity, price, details);
}

export function sellPosition(state, item, quantity, price, details = {}) {
  const stores = assetStores(item);
  const positions = state[stores.positions] || [];
  const current = findPosition(positions, item);
  const values = tradeEconomics("SELL", quantity, price, details, current);
  const cash = adjustedCash(state.cash, values.cashCents);
  const qty = Number(current.qty) - values.qty;
  const basis = positionBasisCents(current);
  const openBasisCents = basis === null ? null : basis - values.basisCents;
  const next = qty ? withPositionProfit({
    ...current, qty, openBasisCents, buyPrice: openBasisCents === null ? current.buyPrice : openBasisCents / 100 / qty,
  }) : null;
  const tx = transaction(current, "SELL", values, details, cash, {
    before: financialState(current), after: financialState(next),
    ...(next ? {} : { closedPosition: dataFoundation.serializeCompatibleRecord(current) }),
  });
  return {
    ...state,
    [stores.positions]: replacePosition(positions, current, next),
    cash,
    [stores.transactions]: [tx, ...(state[stores.transactions] || [])],
  };
}

function reversalContext(state, item) {
  const stores = assetStores(item);
  const transactions = state[stores.transactions] || [];
  const tx = transactions.find(row => row.id === item.id);
  if (tx?.trade?.version !== 1 || !["BUY", "SELL"].includes(tx.type)) return null;
  const key = getAssetKey(tx);
  if (!key || activeTransactions(transactions).find(row => getAssetKey(row) === key)?.id !== tx.id) return null;
  const positions = state[stores.positions] || [];
  const matching = positions.filter(row => getAssetKey(row) === key);
  const current = matching[0];
  if (matching.length > 1 || JSON.stringify(financialState(current)) !== JSON.stringify(tx.trade.after)) return null;
  if (!Number.isSafeInteger(tx.trade.cashCents) || (tx.trade.before && !current && !tx.trade.closedPosition)) return null;
  return { stores, transactions, tx, positions, current };
}

export function canReverseTrade(state, tx) {
  return Boolean(reversalContext(state, tx));
}

export function reverseTrade(state, item, reason) {
  const notes = String(reason ?? "").trim();
  if (!notes) throw new Error("Enter a reason for reversing this trade.");
  const context = reversalContext(state, item);
  if (!context) throw new Error("Only the latest active true-cost trade for an unchanged holding can be reversed.");
  const { stores, transactions, tx, positions, current } = context;
  const { before, closedPosition, cashCents } = tx.trade;
  const deltaCents = tx.type === "BUY" ? cashCents : -cashCents;
  const cash = adjustedCash(state.cash, deltaCents);
  const next = before ? withPositionProfit({ ...(current || closedPosition), ...before }) : null;
  const now = new Date().toISOString();
  const reversal = {
    ...tx, id: id(), type: "REVERSAL", reversesId: tx.id, date: now, recordedAt: now,
    notes, balanceAfter: cash, costBasisTotal: null, costBasisPerUnit: null, realizedPL: null,
    trade: { version: 1, cashCents: deltaCents },
  };
  return {
    ...state, cash,
    [stores.positions]: replacePosition(positions, current, next),
    [stores.transactions]: [reversal, ...transactions],
  };
}

export function deletePosition(state, item) {
  if (getAssetType(item) === "sealed") {
    const key = getAssetKey(item);
    const openQuantity = activeTransactions(state.sealedTransactions || [])
      .filter(row => getAssetKey(row) === key)
      .reduce((total, row) => total + (String(row.type).toUpperCase() === "BUY" ? 1 : -1) * Number(row.quantity || 0), 0);
    if (openQuantity > 0) {
      const error = new Error(`Cannot delete ${item.name}: its sealed transaction history still projects an open holding. Use Sell for a real exit.`);
      error.code = "would_leave_open_transaction_projection";
      throw error;
    }
    return { ...state, sealedSpecs: (state.sealedSpecs || []).filter(row => row.id !== item.id) };
  }
  const risk = dataFoundation.findPositionDeletionRisk(item, state.transactions);
  if (risk.blocked) {
    const error = new Error(risk.reason === "invalid_position_identity"
      ? `Cannot verify whether deleting ${item.name} is safe. No data was changed.`
      : `Cannot delete ${item.name}: its transaction history still projects an open holding. Use Sell for a real exit; quantity corrections require reconciliation.`);
    error.code = risk.reason;
    error.deletionRisk = risk;
    throw error;
  }
  return { ...state, specs: state.specs.filter(row => row.id !== item.id) };
}
