import { useEffect, useRef, useState } from "react";
import { validateTrade } from "../../domain/trading.js";
import { formatMoney } from "../../domain/portfolio.js";
import { assetContextLabel, assetTypeLabel, getAssetType } from "../../domain/assetIdentity.js";

export function ViewHeader({ title, description, actions }) {
  return <div className="view-heading"><h3>{title}</h3><p>{description}</p>{actions && <div className="view-actions">{actions}</div>}</div>;
}

export function MetricTile({ item }) {
  const Tag = item.onActivate ? "button" : "article";
  return <Tag className="workspace-metric" type={item.onActivate ? "button" : undefined} onClick={item.onActivate}><span>{item.label}</span><strong className={item.tone || ""}>{item.value}</strong><small>{item.detail}</small>{item.preview && <em title={item.preview}>{item.preview}</em>}</Tag>;
}

export function MetricBand({ items, leading, className = "" }) {
  return <section className={`workspace-context ${className}`} aria-label="View summary">{leading && <div className="workspace-discovery">{leading}</div>}{items.map(item => <MetricTile item={item} key={item.label} />)}</section>;
}

export function SearchField({ label, value, onChange, placeholder, hideLabel = false, className = "" }) {
  return <label className={`workspace-search ${className}`}><span className={hideLabel ? "workspace-sr-only" : "workspace-field-label"}>{label}</span><input aria-label={label} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} type="search" /></label>;
}

export function WorkspacePanel({ title, className = "", children }) {
  return <section className={`workspace-panel ${className}`}><h4>{title}</h4>{children}</section>;
}

export function FilterToolbar({ title, countText, value, onChange, placeholder, pageSize, onPageSizeChange, onReset, scope, children }) {
  return <section className="workspace-toolbar" aria-label={title}><header><h4>{title}</h4><span role="status">{countText}</span></header><div className="workspace-toolbar-controls"><SearchField label={title} value={value} onChange={onChange} placeholder={placeholder} hideLabel />{scope && <div className="workspace-toolbar-scope">{scope}</div>}{children}{pageSize && <label className="workspace-page-size"><span className="workspace-sr-only">Rows per page</span><select aria-label="Rows per page" value={pageSize} onChange={event => onPageSizeChange(Number(event.target.value))}>{[25, 50, 100].map(size => <option key={size} value={size}>{size} rows</option>)}</select></label>}<button type="button" className="workspace-reset" onClick={onReset}>Reset</button></div></section>;
}

export const TableFilterPanel = FilterToolbar;

export function Modal({ title, open, onClose, children, wide = false, compactDetail = false }) {
  const ref = useRef(null);
  const openerRef = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!open) {
      if (dialog.open) dialog.close();
      return undefined;
    }
    if (!dialog.open) {
      openerRef.current = document.activeElement;
      dialog.showModal();
    }
    dialog.querySelector("[data-autofocus=\"true\"]")?.focus();
    return () => {
      const opener = openerRef.current;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [open]);
  return <dialog ref={ref} className={`react-modal${wide ? " wide" : ""}${compactDetail ? " card-detail-dialog" : ""}`} onCancel={onClose} onClose={onClose}><header><h3>{title}</h3><button type="button" aria-label="Close" onClick={onClose}>×</button></header><div className="react-modal-body">{children}</div></dialog>;
}

export function TradeForm({ item, mode, onSubmit, onCancel, defaultQuantity = 1 }) {
  const [quantity, setQuantity] = useState(defaultQuantity);
  const quote = item.currentPrice;
  const [price, setPrice] = useState(quote !== null && quote !== undefined && quote !== "" && Number.isFinite(Number(quote)) && Number(quote) > 0 ? String(quote) : "");
  const [error, setError] = useState("");
  const max = mode === "sell" ? Number(item.qty || 1) : undefined;
  function submit(event) {
    event.preventDefault();
    try {
      validateTrade(quantity, price);
      onSubmit(Number(quantity), Number(price));
    } catch (failure) {
      setError(failure.message);
    }
  }
  return <form className="react-form" onSubmit={submit}><div className="trade-card-line"><strong>{item.name}</strong><span>{assetTypeLabel(item)} · {assetContextLabel(item)}</span></div>{mode === "sell" && <p>Owned: {max}. Enter the quantity sold, or <button type="button" className="secondary" onClick={() => setQuantity(max)}>Sell all {max}</button>.</p>}<div className="form-grid"><label><span>Quantity</span><input required type="number" min="1" max={max} step="1" value={quantity} onChange={event => { setQuantity(event.target.value); setError(""); }} /></label><label><span>Price per unit</span><input required type="number" min="0.01" step="0.01" value={price} placeholder="Enter execution price" onChange={event => { setPrice(event.target.value); setError(""); }} /></label></div>{price === "" && <p className="muted">Enter the actual {mode === "sell" ? "sale" : "purchase"} price per unit.</p>}<p className="trade-total">{mode === "sell" ? "Sale proceeds" : "Purchase total"} <strong>{price !== "" && Number.isFinite(Number(quantity) * Number(price)) ? formatMoney(Number(quantity) * Number(price)) : "—"}</strong></p>{error && <p role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button type="submit">{mode === "sell" ? "Confirm sale" : "Confirm buy"}</button></div></form>;
}

export function Notice({ notice, onDismiss }) {
  useEffect(() => { if (!notice) return undefined; const timer = setTimeout(onDismiss, 4500); return () => clearTimeout(timer); }, [notice, onDismiss]);
  return notice ? <div className={`react-notice ${notice.tone || ""}`} role="status"><span>{notice.message}</span><button type="button" aria-label="Dismiss notification" onClick={onDismiss}>×</button></div> : null;
}

export function CardIdentity({ item, showMeta = false }) {
  const context = assetContextLabel(item);
  return <span className="card-identity" title={`${item.name} · ${context}`}><strong>{item.name}</strong>{showMeta && <small><span className={`asset-type-pill ${getAssetType(item)}`}>{assetTypeLabel(item)}</span> {context}</small>}</span>;
}
