import { useState } from "react";
import { assetContextLabel } from "../../domain/assetIdentity.js";
import { formatMoney } from "../../domain/portfolio.js";
import { TRADE_CHARGES, transactionCashAmount } from "../../domain/tradeEconomics.js";
import { canReverseTrade, reverseTrade } from "../../domain/trading.js";
import { useAppState } from "../../state/AppState.jsx";
import { TradeAmounts } from "./TradeDialog.jsx";
import { Modal } from "./ui.jsx";

function money(cents) {
  return cents == null ? "—" : formatMoney(cents / 100);
}

export function TransactionReceipt({ item, onClose }) {
  return <Modal open={Boolean(item)} title="Transaction receipt" onClose={onClose}>
    {item && <Receipt key={item.id} item={item} onClose={onClose} />}
  </Modal>;
}

function Receipt({ item, onClose }) {
  const { state, updateState } = useAppState();
  const [correcting, setCorrecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const { trade } = item;
  const reversal = item.type === "REVERSAL";
  const selling = item.type === "SELL";
  const reversedBy = [...state.transactions, ...state.sealedTransactions].find(tx => tx.reversesId === item.id);
  const canReverse = canReverseTrade(state, item);
  function reverse(event) {
    event.preventDefault();
    try {
      updateState(current => reverseTrade(current, item, reason));
      setCorrecting(false);
    } catch (failure) {
      setError(failure.message);
    }
  }
  return <div className="react-form">
    <div className="trade-card-line"><strong>{item.name}</strong><span>{assetContextLabel(item)} · {new Date(item.date).toLocaleString()}</span></div>
    <p>{reversedBy ? "Reversed trade" : reversal ? "Reversal" : selling ? "Sale" : "Purchase"} · {item.quantity} × {formatMoney(item.price)}</p>
    <TradeAmounts rows={reversal ? [
      ["Cash adjustment", money(trade?.cashCents)],
      ["Original transaction", item.reversesId],
    ] : [
      [selling ? "Sale channel" : "Purchase source", trade?.source || "Unknown"],
      ["Order reference", trade?.reference || "—"],
      ["Gross item total", trade ? money(trade.grossCents) : formatMoney(transactionCashAmount(item))],
      ...TRADE_CHARGES.filter(({ key }) => trade?.charges?.[key] != null)
        .map(({ key, label }) => [label, money(trade.charges[key])]),
      [selling ? "Net received" : "All-in purchase cost", trade ? money(trade.cashCents) : "Unknown"],
      ...(selling ? [
        ["Allocated cost basis", formatMoney(item.costBasisTotal)],
        ["Realized gain / loss", formatMoney(item.realizedPL)],
        ["Realized ROI", Number(item.costBasisTotal) > 0 && item.realizedPL != null
          ? `${(item.realizedPL / item.costBasisTotal * 100).toFixed(2)}%` : "—"],
      ] : trade ? [["All-in cost per unit", formatMoney(trade.cashCents / 100 / item.quantity)]] : []),
    ]} />
    {item.notes && <p>{item.notes}</p>}
    {reversedBy && <p role="status">Reversal recorded. {reversedBy.notes}</p>}
    {correcting && canReverse ? <form className="react-form" onSubmit={reverse}>
      <p>Reversing restores the previous holding and offsets this trade’s cash movement. Then you can record a replacement trade.</p>
      <label><span>Reason for reversal</span><textarea required rows="2" value={reason} onChange={event => { setReason(event.target.value); setError(""); }} /></label>
      {error && <p role="alert">{error}</p>}
      <div className="modal-actions"><button type="button" className="secondary" onClick={() => setCorrecting(false)}>Cancel reversal</button><button type="submit" className="danger">Confirm reversal</button></div>
    </form> : <div className="modal-actions">
      {canReverse && <button type="button" className="danger" onClick={() => { setError(""); setCorrecting(true); }}>Reverse trade</button>}
      <button type="button" className="secondary" onClick={onClose}>Done</button>
    </div>}
  </div>;
}
