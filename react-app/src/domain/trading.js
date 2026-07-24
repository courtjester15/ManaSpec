import { dataFoundation } from "./dataFoundation.js";

function id() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function transaction(position, type, quantity, price, balanceAfter) {
  const averageCost = Number(position.buyPrice || 0);
  const isSell = type === "SELL";
  const total = quantity * price;
  return {
    id: id(), cardId: position.id, name: position.name, set_code: position.set_code,
    set_name: position.set_name, collector_number: position.collector_number,
    foil: Boolean(position.foil), scryfall_id: position.scryfall_id || position.id,
    oracle_id: position.oracle_id, rarity: position.rarity, colors: position.colors,
    color_identity: position.color_identity, type_line: position.type_line,
    image_uris: position.image_uris, type, quantity, price, fees: 0,
    date: new Date().toISOString(), notes: "", balanceAfter,
    costBasisPerUnit: isSell && averageCost > 0 ? averageCost : null,
    costBasisTotal: isSell && averageCost > 0 ? averageCost * quantity : null,
    realizedPL: isSell && averageCost > 0 ? total - (averageCost * quantity) : null,
  };
}

export function buyFromRadar(state, item, quantity, price) {
  const qty = Math.max(1, Number(quantity || 1));
  const unitPrice = Math.max(0, Number(price || 0));
  const total = qty * unitPrice;
  if (!unitPrice) throw new Error("Enter a buy price before buying.");
  if (state.cash < total) throw new Error("Not enough cash for this buy.");
  const specs = [...state.specs];
  let position = specs.find(row => row.id === item.id);
  if (!position) {
    position = { ...item, qty: 0, buyPrice: 0, currentPrice: Number(item.currentPrice || unitPrice), pl: 0, buyDate: null };
    specs.push(position);
  } else position = { ...position };
  const previousQty = Number(position.qty || 0);
  position.qty = previousQty + qty;
  position.buyPrice = ((Number(position.buyPrice || 0) * previousQty) + total) / position.qty;
  position.buyDate ||= new Date().toISOString();
  position.pl = (Number(position.currentPrice || 0) - position.buyPrice) * position.qty;
  specs[specs.findIndex(row => row.id === position.id)] = position;
  const cash = state.cash - total;
  return { ...state, specs, cash, transactions: [transaction(position, "BUY", qty, unitPrice, cash), ...state.transactions] };
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
  const specs = remaining
    ? state.specs.map(row => row.id === item.id ? { ...row, qty: remaining, pl: (Number(row.currentPrice || 0) - Number(row.buyPrice || 0)) * remaining } : row)
    : state.specs.filter(row => row.id !== item.id);
  return { ...state, specs, cash, transactions: [tx, ...state.transactions] };
}

export function deletePosition(state, item) {
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
