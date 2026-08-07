import { useEffect, useRef, useState } from "react";
import { formatMoney } from "../../domain/portfolio.js";

export function ViewHeader({ title, description, actions }) {
  return <div className="view-heading"><h3>{title}</h3><p>{description}</p>{actions && <div className="view-actions">{actions}</div>}</div>;
}

export function MetricBand({ items }) {
  return <section className="module-context-band" aria-label="View summary">{items.map(item => <article className="module-context-card" key={item.label}><span>{item.label}</span><strong className={item.tone || ""}>{item.value}</strong><small>{item.detail}</small>{item.preview && <em>{item.preview}</em>}</article>)}</section>;
}

export function FilterBar({ value, onChange, placeholder = "Filter cards, sets, or notes", children }) {
  return <section className="react-filter-bar"><label><span>Search</span><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /></label>{children}</section>;
}

export function TableFilterPanel({ title, countText, value, onChange, placeholder, pageSize, onPageSizeChange, onReset, children }) {
  return <section className="card-filter-panel table-route-filter-panel"><div className="panel-heading compact-heading"><h4>{title}</h4><span className="filter-meta">{countText}</span></div><div className="ledger-filter-bar compact-filter-controls"><label className="filter-control"><span>Search</span><input aria-label={title} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /></label>{children}<label className="table-page-size-control"><span>Rows</span><select aria-label="Rows per page" value={pageSize} onChange={event => onPageSizeChange(Number(event.target.value))}><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label><button type="button" className="filter-reset-btn" onClick={onReset}>Reset</button></div></section>;
}

export function Modal({ title, open, onClose, children, wide = false, compactDetail = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className={`react-modal${wide ? " wide" : ""}${compactDetail ? " card-detail-dialog" : ""}`} onCancel={onClose} onClose={onClose}><header><h3>{title}</h3><button type="button" aria-label="Close" onClick={onClose}>×</button></header><div className="react-modal-body">{children}</div></dialog>;
}

export function TradeForm({ item, mode, onSubmit, onCancel, defaultQuantity = 1 }) {
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [price, setPrice] = useState(Number(item.currentPrice || item.buyPrice || 0));
  const max = mode === "sell" ? Number(item.qty || 1) : undefined;
  return <form className="react-form" onSubmit={event => { event.preventDefault(); onSubmit(Number(quantity), Number(price)); }}><div className="trade-card-line"><strong>{item.name}</strong><span>{item.set_code} #{item.collector_number}{item.foil ? " · Foil" : ""}</span></div><div className="form-grid"><label><span>Quantity</span><input type="number" min="1" max={max} step="1" value={quantity} onChange={event => setQuantity(event.target.value)} /></label><label><span>Price per copy</span><input type="number" min="0.01" step="0.01" value={price} onChange={event => setPrice(event.target.value)} /></label></div><p className="trade-total">Estimated total <strong>{formatMoney(Number(quantity || 0) * Number(price || 0))}</strong></p><div className="modal-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button type="submit">{mode === "sell" ? "Confirm sale" : "Confirm buy"}</button></div></form>;
}

export function Notice({ notice, onDismiss }) {
  useEffect(() => { if (!notice) return undefined; const timer = setTimeout(onDismiss, 4500); return () => clearTimeout(timer); }, [notice, onDismiss]);
  return notice ? <div className={`react-notice ${notice.tone || ""}`} role="status"><span>{notice.message}</span><button type="button" aria-label="Dismiss notification" onClick={onDismiss}>×</button></div> : null;
}

export function CardIdentity({ item, showMeta = false }) {
  return <span className="card-identity" title={`${item.name} · ${item.set_code || "-"} #${item.collector_number || "-"}${item.foil ? " · Foil" : ""}`}><strong>{item.name}</strong>{showMeta && <small>{item.set_code || "-"} #{item.collector_number || "-"}{item.foil ? " · Foil" : ""}</small>}</span>;
}
