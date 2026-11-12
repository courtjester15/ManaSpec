import { useState } from "react";
import { assetContextLabel, getAssetKey, getAssetType } from "../../domain/assetIdentity.js";
import { actualSaleDraft, compareExit, createExitResearch, emptyExitRoute, EXIT_CHARGES } from "../../domain/exitComparison.js";
import { safeResearchUrl } from "../../domain/marketIntelligence.js";
import { formatMoney } from "../../domain/portfolio.js";
import { useAppState } from "../../state/AppState.jsx";
import { Modal } from "./ui.jsx";

const money = cents => cents == null ? "Unknown" : formatMoney(cents / 100);

export function ExitComparison({ position, onClose, onRecordSale }) {
  return <Modal open={Boolean(position)} title="Compare exits" onClose={onClose} wide>{position && <ExitDesk key={getAssetKey(position)} position={position} onRecordSale={onRecordSale} />}</Modal>;
}

function ExitDesk({ position, onRecordSale }) {
  const { state, updateSlice } = useAppState();
  const saved = state.marketObservations.filter(row => row.researchType === "exit" && getAssetKey(row) === getAssetKey(position)).sort((a, b) => Date.parse(b.checkedAt) - Date.parse(a.checkedAt))[0];
  const [quantity, setQuantity] = useState(Math.min(saved?.quantity || 1, Number(position.qty)));
  const [routes, setRoutes] = useState(() => saved?.routes?.length ? structuredClone(saved.routes) : [emptyExitRoute(), emptyExitRoute("Buylist cash offer")].map((route, index) => index ? { ...route, quoteType: "offer" } : route));
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const holdingSlice = getAssetType(position) === "sealed" ? state.sealedSpecs : state.specs;
  const current = holdingSlice.find(row => getAssetKey(row) === getAssetKey(position)) || position;
  function updateRoute(id, changes) {
    setRoutes(previous => previous.map(route => route.id === id ? { ...route, ...changes } : route));
    setStatus(""); setError("");
  }
  function save() {
    try {
      const record = createExitResearch(current, quantity, routes);
      updateSlice("marketObservations", rows => [record, ...rows]);
      setStatus("Comparison saved as research. Holdings, cash and transactions are unchanged."); setError("");
    } catch (failure) { setError(failure.message); }
  }
  return <div className="exit-desk">
    <div className="trade-card-line"><strong>{position.name}</strong><span>{assetContextLabel(position)} · Owned {current.qty}</span></div>
    <p>Compare your observed offers and estimates in USD. Net means what remains after this batch’s costs. Asking prices are not known bids or guaranteed proceeds.</p>
    <div className="exit-desk-toolbar"><label><span>Quantity to compare</span><input data-autofocus="true" type="number" min="1" max={current.qty} step="1" value={quantity} onChange={event => { setQuantity(event.target.value); setStatus(""); }} /></label><button type="button" className="secondary" onClick={() => setQuantity(current.qty)}>Compare all {current.qty}</button><button type="button" disabled={routes.length >= 3} onClick={() => setRoutes(previous => [...previous, emptyExitRoute("Private / local sale")])}>Add route</button><button type="button" onClick={save}>Save research</button></div>
    {saved && <p className="muted">Loaded saved research from {new Date(saved.checkedAt).toLocaleString()}. Basis recalculates from the current holding; quote dates and quantities still need review.</p>}
    <div className="exit-route-grid">{routes.map((route, index) => <ExitRoute key={route.id} route={route} index={index} position={current} quantity={quantity} onChange={changes => updateRoute(route.id, changes)} onRemove={routes.length > 1 ? () => setRoutes(previous => previous.filter(row => row.id !== route.id)) : undefined} onRecordSale={() => {
      try { onRecordSale(actualSaleDraft(current, quantity, route)); }
      catch (failure) { setError(failure.message); }
    }} />)}</div>
    {status && <p role="status">{status}</p>}{error && <p className="trade-error" role="alert">{error}</p>}
  </div>;
}

function ExitRoute({ route, index, position, quantity, onChange, onRemove, onRecordSale }) {
  const change = key => event => onChange({ [key]: event.target.value });
  let result;
  let error;
  try { result = compareExit(position, quantity, route); }
  catch (failure) { error = failure.message; }
  return <section className="exit-route" aria-label={`Exit route ${index + 1}`}>
    <header><h4>Route {index + 1}</h4>{onRemove && <button className="secondary" type="button" onClick={onRemove} aria-label={`Remove route ${index + 1}`}>Remove</button>}</header>
    <label><span>Channel / route name</span><input value={route.name} onChange={change("name")} /></label>
    <div className="form-grid"><label><span>Quote type</span><select value={route.quoteType} onChange={change("quoteType")}><option value="asking">Asking / list estimate</option><option value="offer">Known buylist / private offer</option></select></label><label><span>Payout</span><select value={route.payout} onChange={change("payout")}><option value="cash">Cash</option><option value="credit">Store credit</option></select></label>
      <label><span>Price per unit (USD)</span><input type="number" min="0.01" step="0.01" value={route.price} onChange={change("price")} placeholder="Unknown" /></label><label><span>Condition required</span><input value={route.condition} onChange={change("condition")} placeholder="e.g. NM, sealed intact" /></label>
    </div>
    <details className="trade-options" open={undefined}><summary>Fees and shipping assumptions</summary><p className="muted">All fixed amounts apply once to this batch. Blank costs are excluded and remain unconfirmed. Percentage fee applies to item gross; adjust fixed fees for the route’s actual rules.</p><div className="form-grid"><label><span>Estimated marketplace fee %</span><input type="number" min="0" max="99.99" step="0.01" value={route.feePercent} onChange={change("feePercent")} /></label>{EXIT_CHARGES.map(({ key, label }) => <label key={key}><span>{label}{key === "marketplaceFee" ? " (fixed)" : ""}</span><input type="number" min="0" step="0.01" value={route[key] ?? ""} onChange={change(key)} placeholder="Unconfirmed" /></label>)}</div></details>
    <details><summary>Source, validity and confidence</summary><div className="form-grid"><label><span>Observed date and time</span><input type="datetime-local" value={route.checkedAt} onChange={change("checkedAt")} /></label><label><span>Offer expires</span><input type="datetime-local" value={route.expiresAt} onChange={change("expiresAt")} /></label><label><span>Offer valid up to quantity</span><input type="number" min="1" step="1" value={route.availableQty} onChange={change("availableQty")} placeholder="Unknown" /></label><label><span>Source / seller</span><input value={route.source} onChange={change("source")} placeholder="User observed" /></label><label><span>Source URL</span><input type="url" value={route.url} onChange={change("url")} /></label><label><span>Confidence</span><select value={route.confidence} onChange={change("confidence")}><option value="unknown">Unknown</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label></div><label><span>Validity, shipping or payout notes</span><textarea value={route.notes} onChange={change("notes")} /></label></details>
    {safeResearchUrl(route.url) && <a href={safeResearchUrl(route.url)} target="_blank" rel="noreferrer">Open quote source</a>}
    <div className="exit-result" aria-live="polite">{error ? <p className="trade-error" role="alert">{error}</p> : result?.unknown ? <p>{result.warning}</p> : result && <>
      <p className={result.age.stale || result.expired ? "storage-warning" : "muted"}>{route.quoteType === "offer" ? "User-entered offer" : "Asking price estimate"} · {route.payout === "credit" ? "Store credit, not cash" : "Cash"} · {result.age.label}{result.expired ? " · EXPIRED" : ""} · {route.source || "Source unknown"} · {route.confidence} confidence</p>
      <dl className="trade-amounts"><div><dt>Gross batch</dt><dd>{money(result.grossCents)}</dd></div>{EXIT_CHARGES.map(({ key, label, sign = 1 }) => <div key={key}><dt>{label}</dt><dd>{result.charges[key] === null ? "Unconfirmed" : `${sign < 0 ? "+" : "−"}${money(result.charges[key])}`}</dd></div>)}<div><dt>Estimated net {result.cash ? "cash" : "store credit"}</dt><dd><strong>{money(result.cashCents)}</strong></dd></div><div><dt>Net per copy</dt><dd>{formatMoney(result.cashCents / result.qty / 100)}</dd></div><div><dt>Allocated owned basis</dt><dd>{money(result.basisCents)}</dd></div><div><dt>{result.cash ? "Estimated profit / loss" : "Credit face value − cash basis"}</dt><dd>{money(result.realizedCents)}</dd></div><div><dt>{result.cash ? "Net return on basis" : "Face-value return (not cash ROI)"}</dt><dd>{result.roi === null ? "Unknown" : `${result.roi.toFixed(2)}%`}</dd></div><div><dt>Net break-even per unit</dt><dd>{money(result.breakEvenCents)}</dd></div></dl>
      {result.assumptions.length > 0 && <p className="muted">{result.assumptions.length} unconfirmed cost fields excluded. Confirm all charges before relying on net or break-even.</p>}
      {!result.cash && <p>Store credit cannot be recorded as cash income. Review retailer restrictions and cash expenses separately.</p>}
    </>}</div>
    <button type="button" disabled={!result || result.unknown || !result.cash || Boolean(error)} onClick={onRecordSale}>Record actual cash sale…</button><small className="muted">Opens confirmation with these terms. Verify actual execution and every charge.</small>
  </section>;
}
