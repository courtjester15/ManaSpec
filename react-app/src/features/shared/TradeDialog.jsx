import { useId, useState } from "react";
import { assetContextLabel, assetTypeLabel } from "../../domain/assetIdentity.js";
import { formatMoney } from "../../domain/portfolio.js";
import { TRADE_CHARGES, tradeEconomics } from "../../domain/tradeEconomics.js";
import { buyFromRadar, sellPosition } from "../../domain/trading.js";
import { useAppState } from "../../state/AppState.jsx";
import { Modal } from "./ui.jsx";

function localTime() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function TradeAmounts({ rows }) {
  return <dl className="trade-amounts">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

export function TradeDialog({ trade, onClose, onSaved }) {
  return <Modal open={Boolean(trade)} title={trade?.mode === "SELL" ? "Record sale" : trade?.more ? "Buy more" : "Record buy"} onClose={onClose}>
    {trade && <TradeForm {...trade} onCancel={onClose} onSaved={(quantity) => {
      onClose();
      onSaved?.(quantity);
    }} />}
  </Modal>;
}

function TradeForm({ item, mode = "BUY", defaultQuantity = 1, onSaved, onCancel }) {
  const { state, updateState } = useAppState();
  const selling = mode === "SELL";
  const sourceExamples = useId();
  const [fields, setFields] = useState(() => ({ quantity: defaultQuantity, price: "", date: localTime(), source: "" }));
  const [error, setError] = useState("");
  const change = key => event => {
    setFields(previous => ({ ...previous, [key]: event.target.value }));
    setError("");
  };
  const max = selling ? Number(item.qty) : undefined;
  let values;
  let previewError;
  if (fields.price !== "") {
    try { values = tradeEconomics(mode, fields.quantity, fields.price, fields, item); }
    catch (failure) { previewError = failure.message; }
  }
  const cash = values ? formatMoney(values.cashCents / 100) : "—";
  const balance = values ? Math.round(state.cash * 100) + (selling ? values.cashCents : -values.cashCents) : null;
  const cashError = balance !== null && balance < 0 ? "Not enough cash for this operation." : "";
  function submit(event) {
    event.preventDefault();
    try {
      const record = selling ? sellPosition : buyFromRadar;
      updateState(current => record(current, item, fields.quantity, fields.price, fields));
      onSaved(Number(fields.quantity));
    } catch (failure) {
      setError(failure.message);
    }
  }
  return <form className="react-form trade-form" onSubmit={submit}>
    <div className="trade-card-line"><strong>{item.name}</strong><span>{assetTypeLabel(item)} · {assetContextLabel(item)}</span></div>
    {selling && <div className="trade-owned"><span>Owned {max}</span><button type="button" className="secondary" onClick={() => {
      setFields(previous => ({ ...previous, quantity: max }));
      setError("");
    }}>Sell all {max}</button></div>}
    <div className="form-grid">
      <label><span>Quantity</span><input required type="number" inputMode="numeric" min="1" max={max} step="1" value={fields.quantity} onChange={change("quantity")} /></label>
      <label><span>{selling ? "Gross sale price per unit" : "Purchase price per unit"}</span><input data-autofocus="true" required type="number" inputMode="decimal" min="0.01" step="0.01" value={fields.price} onChange={change("price")} placeholder="Actual price" /></label>
      <label><span>Trade date and time</span><input required type="datetime-local" value={fields.date} onChange={change("date")} /></label>
      <label><span>{selling ? "Sale channel" : "Purchase source"}</span><input list={sourceExamples} value={fields.source} onChange={change("source")} placeholder="Optional, e.g. TCGplayer" />
        <datalist id={sourceExamples}>{["TCGplayer", "eBay", "Local game store", "Private sale", "Other"].map(source => <option key={source} value={source} />)}</datalist>
      </label>
    </div>
    <details className="trade-options">
      <summary>Shipping, fees and order details</summary>
      <p className="muted">Use actual amounts for this line. For a shared order, split charges across its lines once and use the same reference on each.</p>
      <div className="form-grid">
        {TRADE_CHARGES.filter(field => !field.type || field.type === mode).map(({ key, label }) => <label key={key}><span>{label}</span><input type="number" inputMode="decimal" min="0" step="0.01" value={fields[key] ?? ""} onChange={change(key)} placeholder="—" /></label>)}
        <label><span>Order reference</span><input value={fields.reference ?? ""} onChange={change("reference")} /></label>
      </div>
      <label><span>Notes</span><textarea rows="2" value={fields.notes ?? ""} onChange={change("notes")} /></label>
    </details>
    <div aria-live="polite">
      <TradeAmounts rows={[
        ["Gross item total", values ? formatMoney(values.grossCents / 100) : "—"],
        [selling ? "Net received" : "All-in purchase cost", cash],
        ...(selling ? [
          ["Allocated weighted basis", values?.basisCents == null ? "—" : formatMoney(values.basisCents / 100)],
          ["Realized gain / loss", values?.realizedCents == null ? "—" : formatMoney(values.realizedCents / 100)],
          ["Realized ROI", values?.basisCents > 0 ? `${(values.realizedCents / values.basisCents * 100).toFixed(2)}%` : "—"],
        ] : [["All-in cost per unit", values ? formatMoney(values.cashCents / 100 / values.qty) : "—"]]),
        ["Cash after trade", balance === null ? "—" : formatMoney(balance / 100)],
      ]} />
    </div>
    {(error || previewError || cashError) && <p className="trade-error" role="alert">{error || previewError || cashError}</p>}
    <div className="modal-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button type="submit" disabled={Boolean(previewError || cashError)}>{selling ? "Confirm sale" : "Confirm buy"}</button></div>
  </form>;
}

export function DetailTradeActions({ item, owned, watched }) {
  const [trade, setTrade] = useState(null);
  const [status, setStatus] = useState("");
  const buyItem = owned || watched || item;
  return <div className="detail-trade-actions">
    <button type="button" onClick={() => setTrade({ item: buyItem, more: Boolean(owned), defaultQuantity: owned ? 1 : watched?.plannedQty || 1 })}>{owned ? "Buy more" : "Record buy"}</button>
    {owned && <button type="button" className="danger" onClick={() => setTrade({ item: owned, mode: "SELL" })}>Sell</button>}
    {status && <span role="status">{status}</span>}
    <TradeDialog trade={trade} onClose={() => setTrade(null)} onSaved={qty => setStatus(`${trade.mode === "SELL" ? "Sold" : "Bought"} ${qty}.`)} />
  </div>;
}
