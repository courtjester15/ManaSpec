import { useEffect, useMemo, useRef, useState } from "react";
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

export function DataTable({ columns, rows, empty = "No rows yet.", onRowClick }) {
  const [sort, setSort] = useState({ key: columns.find(column => column.sort)?.key || columns[0]?.key, direction: "asc" });
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const column = columns.find(item => item.key === sort.key);
    const left = column?.sortValue ? column.sortValue(a) : a[sort.key];
    const right = column?.sortValue ? column.sortValue(b) : b[sort.key];
    const result = typeof left === "number" && typeof right === "number" ? left - right : String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true });
    return sort.direction === "asc" ? result : -result;
  }), [columns, rows, sort]);
  if (!rows.length) return <div className="react-empty">{empty}</div>;
  return <div className="react-table-wrap"><table className="react-table"><thead><tr>{columns.map(column => <th key={column.key} className={column.align || ""}>{column.sort !== false ? <button type="button" onClick={() => setSort(current => ({ key: column.key, direction: current.key === column.key && current.direction === "asc" ? "desc" : "asc" }))}>{column.label}{sort.key === column.key ? (sort.direction === "asc" ? " ↑" : " ↓") : ""}</button> : column.label}</th>)}</tr></thead><tbody>{sorted.map((row, index) => <tr key={row.id || index} onClick={onRowClick ? event => { if (!event.target.closest("button,input,select,a,textarea,label")) onRowClick(row); } : undefined} className={onRowClick ? "clickable" : ""}>{columns.map(column => <td key={column.key} className={column.align || ""} data-label={column.label}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody></table></div>;
}

export function Modal({ title, open, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className={`react-modal${wide ? " wide" : ""}`} onCancel={onClose} onClose={onClose}><header><h3>{title}</h3><button type="button" aria-label="Close" onClick={onClose}>×</button></header><div className="react-modal-body">{children}</div></dialog>;
}

export function TradeForm({ item, mode, onSubmit, onCancel, defaultQuantity = 1 }) {
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [price, setPrice] = useState(Number(item.currentPrice || item.buyPrice || 0));
  const max = mode === "sell" ? Number(item.qty || 1) : undefined;
  return <form className="react-form" onSubmit={event => { event.preventDefault(); onSubmit(Number(quantity), Number(price)); }}><div className="trade-card-line"><strong>{item.name}</strong><span>{item.set_code} #{item.collector_number}{item.foil ? " · Foil" : ""}</span></div><div className="form-grid"><label><span>Quantity</span><input type="number" min="1" max={max} step="1" value={quantity} onChange={event => setQuantity(event.target.value)} /></label><label><span>Price per copy</span><input type="number" min="0.01" step="0.01" value={price} onChange={event => setPrice(event.target.value)} /></label></div><p className="trade-total">Estimated total <strong>{formatMoney(Number(quantity || 0) * Number(price || 0))}</strong></p><div className="modal-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button type="submit">{mode === "sell" ? "Confirm sale" : "Confirm buy"}</button></div></form>;
}

export function Notice({ notice, onDismiss }) {
  useEffect(() => { if (!notice) return undefined; const timer = setTimeout(onDismiss, 4500); return () => clearTimeout(timer); }, [notice, onDismiss]);
  return notice ? <div className={`react-notice ${notice.tone || ""}`} role="status"><span>{notice.message}</span><button type="button" onClick={onDismiss}>×</button></div> : null;
}

export function CardIdentity({ item }) {
  return <span className="card-identity"><strong>{item.name}</strong><small>{item.set_code || "-"} #{item.collector_number || "-"}{item.foil ? " · Foil" : ""}</small></span>;
}
