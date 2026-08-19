import { dataFoundation } from "./dataFoundation.js";
import { getAssetKey, getAssetType } from "./assetIdentity.js";

function id() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function transaction(position, type, quantity, price, balanceAfter) {
  const averageCost = Number(position.buyPrice || 0);
  const isSell = type === "SELL";
  const total = quantity * price;
  const base = {
    id: id(), cardId: position.id, name: position.name, set_code: position.set_code,
    set_name: position.set_name, collector_number: position.collector_number,
    type, quantity, price, fees: 0,
    date: new Date().toISOString(), notes: "", balanceAfter,
    costBasisPerUnit: isSell && averageCost > 0 ? averageCost : null,
    costBasisTotal: isSell && averageCost > 0 ? averageCost * quantity : null,
    realizedPL: isSell && averageCost > 0 ? total - (averageCost * quantity) : null,
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

export function buyFromRadar(state, item, quantity, price) {
  const qty = Math.max(1, Number(quantity || 1));
  const unitPrice = Math.max(0, Number(price || 0));
  const total = qty * unitPrice;
  if (!unitPrice) throw new Error("Enter a buy price before buying.");
  if (state.cash < total) throw new Error("Not enough cash for this buy.");
  const stores = assetStores(item);
  const isSealed = getAssetType(item) === "sealed";
  const specs = [...(state[stores.positions] || [])];
  let position = specs.find(row => row.id === item.id);
  if (!position) {
    const explicitCurrentPrice = item.currentPrice === null || item.currentPrice === undefined || item.currentPrice === "" ? null : Number(item.currentPrice);
    position = { ...item, qty: 0, buyPrice: 0, currentPrice: isSealed ? explicitCurrentPrice : Number(item.currentPrice || unitPrice), pl: isSealed && explicitCurrentPrice === null ? null : 0, buyDate: null };
    specs.push(position);
  } else position = { ...position };
  const previousQty = Number(position.qty || 0);
  position.qty = previousQty + qty;
  position.buyPrice = ((Number(position.buyPrice || 0) * previousQty) + total) / position.qty;
  position.buyDate ||= new Date().toISOString();
  position.pl = isSealed && (position.currentPrice === null || position.currentPrice === undefined)
    ? null
    : (Number(position.currentPrice || 0) - position.buyPrice) * position.qty;
  specs[specs.findIndex(row => row.id === position.id)] = position;
  const cash = state.cash - total;
  return {
    ...state,
    [stores.positions]: specs,
    cash,
    [stores.transactions]: [transaction(position, "BUY", qty, unitPrice, cash), ...(state[stores.transactions] || [])],
  };
}

export function buyPosition(state, item, quantity, price) {
  return buyFromRadar(state, item, quantity, price);
}

export function sellPosition(state, item, quantity, price) {
  const owned = Number(item.qty || 0);
  const qty = Math.min(owned, Math.max(1, Number(quantity || 1)));
  const unitPrice = Math.max(0, Number(price || item.currentPrice || item.buyPrice || 0));
  if (!qty || !unitPrice) throw new Error("Enter a valid quantity and sale price.");
  const total = qty * unitPrice;
  const remaining = owned - qty;
  const cash = state.cash + total;
  const tx = transaction(item, "SELL", qty, unitPrice, cash);
  const stores = assetStores(item);
  const positions = state[stores.positions] || [];
  const specs = remaining
    ? positions.map(row => row.id === item.id ? { ...row, qty: remaining, pl: Number.isFinite(Number(row.currentPrice)) ? (Number(row.currentPrice) - Number(row.buyPrice || 0)) * remaining : null } : row)
    : positions.filter(row => row.id !== item.id);
  return {
    ...state,
    [stores.positions]: specs,
    cash,
    [stores.transactions]: [tx, ...(state[stores.transactions] || [])],
  };
}

export function deletePosition(state, item) {
  if (getAssetType(item) === "sealed") {
    const key = getAssetKey(item);
    const openQuantity = (state.sealedTransactions || [])
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
