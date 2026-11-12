import { useState } from "react";
import { getAssetType, getSingleFinish } from "../../domain/assetIdentity.js";
import { createMarketObservation, marketEvidence, observationAge, safeResearchUrl } from "../../domain/marketIntelligence.js";
import { formatMoney } from "../../domain/portfolio.js";
import { parsePrice } from "../../domain/quotes.js";
import { useAppState } from "../../state/AppState.jsx";
import { Modal } from "./ui.jsx";

export function localResearchTime(value = new Date()) {
  const time = new Date(value);
  return new Date(time.getTime() - time.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

const quote = value => parsePrice(value) === null ? "Unavailable" : formatMoney(value);

export function MarketEvidence({ item }) {
  const { state, updateSlice } = useAppState();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState({ source: "tcgplayer-manual", marketPrice: "", nmLow: "", checkedAt: localResearchTime(), confidence: "unknown", url: "", rawText: "", thesis: "", reprintRisk: "", releaseReviewAt: "" });
  const evidence = marketEvidence(state.marketObservations, item);
  const { latest, market, low, age, spread, change, observations } = evidence;
  const sealed = getAssetType(item) === "sealed";
  const changeField = key => event => setFields(previous => ({ ...previous, [key]: event.target.value }));
  function save(event) {
    event.preventDefault();
    try {
      const record = createMarketObservation(item, fields);
      updateSlice("marketObservations", rows => [record, ...rows]);
      setEditing(false); setError("");
    } catch (failure) { setError(failure.message); }
  }
  return <section className="compact-detail-section evidence-panel" aria-label="Market evidence">
    <header><h4>Market evidence</h4><button type="button" onClick={() => { setFields(previous => ({ ...previous, checkedAt: localResearchTime() })); setEditing(true); }}>Add observation</button></header>
    <p className="muted">Manual research for this exact {sealed ? "sealed product" : `${getSingleFinish(item) || "unknown"} printing`}. Market and listings are not executable sale proceeds.</p>
    <dl className="evidence-metrics"><div><dt>Observed market</dt><dd>{quote(market)}</dd></div><div><dt>{sealed ? "Observed listing" : "Lowest relevant NM listing"}</dt><dd>{quote(low)}</dd></div><div><dt>Listing − market</dt><dd>{spread === null ? "Unknown" : formatMoney(spread)}</dd></div></dl>
    {latest ? <><p className={age.stale ? "storage-warning" : "muted"}>{latest.source} · {new Date(latest.checkedAt).toLocaleString()} · {age.label} · Manually entered · Confidence: {latest.confidence || "unknown"}</p>{safeResearchUrl(latest.url) && <a href={safeResearchUrl(latest.url)} target="_blank" rel="noreferrer">Open observation source</a>}{change !== null && Math.abs(change) >= 10 && <p>Review: {change.toFixed(1)}% market change since the previous saved observation. Sources or conditions may differ.</p>}{latest.releaseReviewAt && <p>Release review: {latest.releaseReviewAt}{Date.parse(latest.releaseReviewAt) <= Date.now() ? " · Review due" : " · Pending"}</p>}{latest.thesis && <p><strong>Your thesis:</strong> {latest.thesis}</p>}{latest.reprintRisk && <p><strong>Your reprint assessment:</strong> {latest.reprintRisk}</p>}{latest.rawText && <p>{latest.rawText}</p>}</> : <p className="muted">No saved evidence. Unknown is not a zero price. Add a dated source before relying on a quote.</p>}
    {!sealed && <p className="muted">Scryfall reference: {quote(item.currentPrice)} · {item.priceUpdatedAt ? `${observationAge(item.priceUpdatedAt).label} · ${new Date(item.priceUpdatedAt).toLocaleString()}` : "Observation time unknown"}. {getSingleFinish(item) === "etched" && "Etched requires its own quote; foil is not a substitute."}</p>}
    {item.buyDate && <p className="muted">Held {observationAge(item.buyDate).days ?? "unknown"} days. Review your exit target and assumptions before selling.</p>}
    <details><summary>Evidence history ({observations.length})</summary><p className="muted">These are discrete saved checks, not continuous price history or sell-through evidence. Cached records remain available offline.</p>{observations.map(row => <article className="evidence-history" key={row.id}><strong>{row.source} · {observationAge(row.checkedAt).label}</strong><small>{new Date(row.checkedAt).toLocaleString()} · Market {quote(row.marketPrice)} · Listing {quote(row.nmLow)} · {row.confidence || "confidence unknown"}</small><p>{row.rawText}</p>{safeResearchUrl(row.url) && <a href={safeResearchUrl(row.url)} target="_blank" rel="noreferrer">Source</a>}</article>)}</details>
    <Modal open={editing} title="Save market evidence" onClose={() => setEditing(false)}><form className="react-form" onSubmit={save}><p>Copy only observations you can attribute to this exact asset and finish. Leave unsupported values blank.</p><div className="form-grid">
      <label><span>Source</span><input data-autofocus="true" required value={fields.source} onChange={changeField("source")} /></label>
      <label><span>Observed date and time</span><input required type="datetime-local" value={fields.checkedAt} onChange={changeField("checkedAt")} /></label>
      <label><span>Market price (USD)</span><input type="number" min="0" step="0.01" value={fields.marketPrice} onChange={changeField("marketPrice")} placeholder="Unknown" /></label>
      <label><span>{sealed ? "Listing (USD)" : "Lowest relevant NM listing (USD)"}</span><input type="number" min="0" step="0.01" value={fields.nmLow} onChange={changeField("nmLow")} placeholder="Unknown" /></label>
      <label><span>Source URL</span><input type="url" value={fields.url} onChange={changeField("url")} /></label>
      <label><span>Your confidence</span><select value={fields.confidence} onChange={changeField("confidence")}><option value="unknown">Unknown</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
    </div><label><span>Observation notes / condition / conflicts</span><textarea value={fields.rawText} onChange={changeField("rawText")} /></label><details><summary>Thesis, reprint risk and release review</summary><label><span>Your thesis</span><textarea value={fields.thesis} onChange={changeField("thesis")} /></label><label><span>Your reprint risk assessment</span><textarea value={fields.reprintRisk} onChange={changeField("reprintRisk")} /></label><label><span>Release review date</span><input type="date" value={fields.releaseReviewAt} onChange={changeField("releaseReviewAt")} /></label></details>{error && <p role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="secondary" onClick={() => setEditing(false)}>Cancel</button><button>Save evidence</button></div></form></Modal>
  </section>;
}
