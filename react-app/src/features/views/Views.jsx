import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { calculatePortfolioSummary, filterPositionRows, formatMoney, selectPositionRows, selectSealedPositionRows } from "../../domain/portfolio.js";
import { ASSET_TYPES, assetContextLabel, assetTypeLabel, getAssetKey, getAssetType, getExternalMarketUrl, toTrackedSealedProduct } from "../../domain/assetIdentity.js";
import { EMPTY_CARD_FILTERS, filterTrackedCards } from "../../domain/cardFilters.js";
import { dataFoundation } from "../../domain/dataFoundation.js";
import { buildHistoryEvents } from "../../domain/localSearch.js";
import { getRelatedRecordsForAsset, getRelatedRecordsForPrinting, getRelatedRecordAssetKey, getRelatedRecordPrintingKey, relatedRecordMatchesAsset, relatedRecordMatchesPrinting, resolveAssetDetail, resolveCardDetailPrinting, resolveTrackedAsset, resolveTrackedPrinting } from "../../domain/relatedRecords.js";
import { deriveDashboardSignalState, deriveSignalRows, filterSignalRows, getSignalScryfallUrl, getSignalSourceNavigation, getSignalTileRows, SIGNAL_BUCKETS } from "../../domain/signals.js";
import { buyFromRadar, buyPosition, deletePosition, sellPosition } from "../../domain/trading.js";
import { fetchPrintings, refreshTrackedPrices, searchCards, toTrackedCard } from "../../services/scryfall.js";
import { searchSealedProducts } from "../../services/mtgjson.js";
import { useAppState } from "../../state/AppState.jsx";
import { TabulatorTable } from "../shared/TabulatorTable.jsx";
const PriceHistory = lazy(() => import("../shared/PriceHistory.jsx").then(module => ({ default: module.PriceHistory })));
import { CardIdentity, FilterBar, MetricBand, Modal, Notice, TableFilterPanel, TradeForm, ViewHeader } from "../shared/ui.jsx";

const date = value => value ? new Date(value).toLocaleDateString() : "-";
const number = value => Number(value || 0);
const signedMoney = value => `${number(value) >= 0 ? "+" : "-"}${formatMoney(Math.abs(number(value)))}`;
const color = item => (item.color_identity || item.colors || []).join("") || "C";
const rarity = item => item.rarity ? `${item.rarity[0].toUpperCase()}${item.rarity.slice(1)}` : "-";
const printing = item => `${String(item.set_code || item.set || "-").toUpperCase()} #${item.collector_number || "-"}${item.foil ? " F" : ""}`;
const percent = value => `${number(value) > 0 ? "+" : ""}${number(value).toFixed(1)}%`;
const ageDays = value => value ? Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000)) : 0;

const POSITION_ISSUE_LABELS = Object.freeze({
  invalid_printing_identity: "exact printing identity",
  invalid_asset_identity: "exact asset identity",
  invalid_quantity: "positive quantity",
  invalid_buy_price: "positive buy price",
  invalid_buy_date: "valid buy date",
  invalid_current_price: "current price",
});

function positionValidationMessage(row, requiredOnly = false) {
  const issues = requiredOnly ? row.validation.requiredIssues : row.validation.issues;
  return `Reconciliation required: ${issues.map(issue => POSITION_ISSUE_LABELS[issue]).join(", ")}.`;
}

function ReconciliationValue({ row, requiredOnly = true }) {
  return <span className="status-pill" title={positionValidationMessage(row, requiredOnly)}>Reconcile</span>;
}

function useNotices() {
  const [notice, setNotice] = useState(null);
  return { notice, dismiss: useCallback(() => setNotice(null), []), show: (message, tone = "") => setNotice({ message, tone }) };
}

function SingleCardDetail({ item, source, onClose, initialPanel = "" }) {
  const { state, updateSlice } = useAppState();
  const [text, setText] = useState("");
  const [printings, setPrintings] = useState([]);
  const [printingsStatus, setPrintingsStatus] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [comparablesOpen, setComparablesOpen] = useState(false);
  const [market, setMarket] = useState({ marketPrice: "", currentSellers: "", currentQuantity: "", rawText: "" });
  useEffect(() => {
    if (!item) return undefined;
    const controller = new AbortController();
    setPrintingsStatus("Loading comparable printings…");
    fetchPrintings(item, controller.signal).then(rows => { setPrintings(rows.slice(0, 16)); setPrintingsStatus(""); }).catch(error => { if (error.name !== "AbortError") setPrintingsStatus(error.message); });
    return () => controller.abort();
  }, [item]);
  useEffect(() => {
    setHistoryOpen(Boolean(item) && initialPanel === "history");
    setComparablesOpen(false);
  }, [item, initialPanel]);
  if (!item) return null;
  const trackedItems = [...state.specs, ...state.radar];
  const key = getRelatedRecordPrintingKey(item);
  const notes = getRelatedRecordsForPrinting(state.cardNotes, item, trackedItems).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  const tcg = `https://www.tcgplayer.com/search/magic/product?productLineName=magic&q=${encodeURIComponent(item.name)}`;
  const scryfall = `https://scryfall.com/card/${String(item.scryfall_id || item.id).replace(/\|.*$/, "")}`;
  const ownedItem = state.specs.find(row => getRelatedRecordPrintingKey(row) === key && number(row.qty) > 0);
  const watchedItem = state.radar.find(row => getRelatedRecordPrintingKey(row) === key);
  const owned = source !== "radar" && Boolean(ownedItem);
  const priceHistoryReferences = [
    { label: "Entry target", value: item.entryTarget ?? watchedItem?.entryTarget, color: "#7dd3fc" },
    { label: "Average cost", value: ownedItem?.buyPrice, color: "#fbbf24" },
    { label: "Exit target", value: item.exitTarget ?? ownedItem?.exitTarget ?? watchedItem?.exitTarget, color: "#86efac" },
  ];
  const slice = owned ? "specs" : "radar";
  const latestMarket = getRelatedRecordsForPrinting(state.marketObservations, item, trackedItems).sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt))[0];
  const target = number(owned ? item.exitTarget : item.entryTarget);
  const targetDistance = target ? ((number(item.currentPrice) - target) / target) * 100 : null;
  function editPlan(field, value) {
    updateSlice(slice, rows => rows.map(row => row.id === item.id ? { ...row, [field]: field === "holdTime" ? value : number(value) } : row));
  }
  function addNote(event) {
    event.preventDefault();
    if (!text.trim()) return;
    const now = new Date().toISOString();
    updateSlice("cardNotes", rows => [{ id: crypto.randomUUID(), cardKey: key, cardId: item.id, scryfall_id: item.scryfall_id, finish: item.foil ? "foil" : "nonfoil", cardName: item.name, set_code: item.set_code, collector_number: item.collector_number, text: text.trim(), createdAt: now, updatedAt: now }, ...rows]);
    setText("");
  }
  const history = getRelatedRecordsForPrinting(state.priceSnapshots, item, trackedItems).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  function saveMarket(event) {
    event.preventDefault(); const now = new Date().toISOString();
    updateSlice("marketObservations", rows => [{ id: crypto.randomUUID(), cardKey: key, cardId: item.id, scryfall_id: item.scryfall_id, finish: item.foil ? "foil" : "nonfoil", foil: Boolean(item.foil), name: item.name, set_code: item.set_code, collector_number: item.collector_number, source: "tcgplayer", checkedAt: now, url: tcg, marketPrice: number(market.marketPrice), currentSellers: number(market.currentSellers), currentQuantity: number(market.currentQuantity), rawText: market.rawText }, ...rows]);
    setMarket({ marketPrice: "", currentSellers: "", currentQuantity: "", rawText: "" });
  }
  const comparableRows = printings.map(card => { const cardId = String(card.scryfall_id || card.id).replace(/\|.*$/, ""); const setCode = card.set?.toUpperCase?.() || card.set_code || "-"; const nonfoil = number(card.prices?.usd || (!card.foil ? card.currentPrice : 0)); const foil = number(card.prices?.usd_foil || (card.foil ? card.currentPrice : 0)); return <a key={card.id} href={`https://scryfall.com/card/${cardId}`} target="_blank" rel="noreferrer"><span>{card.set_name} · {setCode} #{card.collector_number}</span><strong>{nonfoil ? formatMoney(nonfoil) : "-"}</strong><small>{foil ? `Foil ${formatMoney(foil)}` : "No foil price"}</small></a>; });
  return <><Modal open title={item.name} onClose={onClose} compactDetail><div className="compact-detail"><div className="compact-detail-identity"><strong>{String(item.set_code || "-").toUpperCase()} #{item.collector_number || "-"} · {item.foil ? "Foil" : "Nonfoil"}</strong><span>{item.set_name || "Exact tracked printing"}</span></div><section className="compact-detail-metrics"><div><span>Current</span><strong>{formatMoney(item.currentPrice)}</strong></div><div><span>{owned ? "Cost basis" : "Entry"}</span><strong>{number(owned ? item.buyPrice : item.entryTarget) ? formatMoney(owned ? item.buyPrice : item.entryTarget) : "-"}</strong></div><div><span>Exit</span><strong>{number(item.exitTarget) ? formatMoney(item.exitTarget) : "-"}</strong></div><div><span>Quantity</span><strong>{owned ? number(item.qty) : number(item.plannedQty || 1)}</strong></div></section><div className="compact-detail-grid"><div className="compact-detail-column"><section className="compact-detail-section plan"><header><h4>Plan / Evaluation</h4><span>{targetDistance === null ? "Target needed" : `${percent(targetDistance)} vs target`}</span></header><div className="compact-plan-fields"><label><span>Entry</span><input type="number" step="0.01" value={item.entryTarget || ""} placeholder="Set" onChange={event => editPlan("entryTarget", event.target.value)} /></label><label><span>Exit</span><input type="number" step="0.01" value={item.exitTarget || ""} placeholder="Set" onChange={event => editPlan("exitTarget", event.target.value)} /></label>{owned && <label><span>Hold</span><input value={item.holdTime || ""} placeholder="Months" onChange={event => editPlan("holdTime", event.target.value)} /></label>}</div><div className="compact-evaluation"><span>Source <strong>{owned ? "Positions" : "Radar"}</strong></span><span>Market <strong>{latestMarket?.marketPrice ? formatMoney(latestMarket.marketPrice) : "No check"}</strong></span><span>Checked <strong>{latestMarket ? date(latestMarket.checkedAt) : "Due"}</strong></span></div></section><section className="compact-detail-section market"><header><h4>Market Check</h4><span>{latestMarket ? `Saved ${date(latestMarket.checkedAt)}` : "TCG snapshot"}</span></header><form className="compact-market-form" onSubmit={saveMarket}><label><span>Market price</span><input type="number" min="0" step="0.01" value={market.marketPrice} onChange={event => setMarket(current => ({ ...current, marketPrice: event.target.value }))} /></label><label><span>Sellers</span><input type="number" min="0" value={market.currentSellers} onChange={event => setMarket(current => ({ ...current, currentSellers: event.target.value }))} /></label><label><span>Quantity</span><input type="number" min="0" value={market.currentQuantity} onChange={event => setMarket(current => ({ ...current, currentQuantity: event.target.value }))} /></label><label className="raw"><span>Raw observation</span><input value={market.rawText} onChange={event => setMarket(current => ({ ...current, rawText: event.target.value }))} placeholder="Condition or pasted market context" /></label><button type="submit">Save Check</button></form></section></div><div className="compact-detail-column"><section className="compact-detail-section notes"><header><h4>Notes</h4><span>{notes.length ? `${notes.length} saved` : "-"}</span></header>{notes[0] ? <article className="compact-latest-note"><small>{new Date(notes[0].updatedAt || notes[0].createdAt).toLocaleString()}</small><p>{notes[0].text}</p></article> : <p className="compact-empty">No notes yet.</p>}<form className="compact-note-form" onSubmit={addNote}><input value={text} onChange={event => setText(event.target.value)} placeholder="Add note" /><button type="submit">Add Note</button></form>{notes.length > 1 && <details className="compact-note-history"><summary>Show older notes ({notes.length - 1})</summary>{notes.slice(1).map(note => <p key={note.id}>{note.text}</p>)}</details>}</section><section className="compact-detail-section context"><header><h4>Card Context</h4><span>{rarity(item)} · {color(item)}</span></header><strong>{item.type_line || "Card data unavailable"}</strong><p className="compact-oracle">{item.oracle_text || "Oracle text unavailable."}</p><small>Artist: {item.artist || "-"}</small><div className="compact-detail-links"><a href={scryfall} target="_blank" rel="noreferrer">Scryfall</a><a href={tcg} target="_blank" rel="noreferrer">TCGplayer</a></div></section><section className="compact-secondary-actions"><button type="button" onClick={() => setHistoryOpen(true)}>Price History <span>{history.length}</span></button><button type="button" onClick={() => setComparablesOpen(true)}>Comparable Printings <span>{printingsStatus || printings.length}</span></button></section></div></div></div></Modal><Modal open={historyOpen} title={`${item.name} · Price History`} onClose={() => setHistoryOpen(false)} wide>{historyOpen && <Suspense fallback={<p className="muted">Loading price history…</p>}><PriceHistory rows={history} item={item} references={priceHistoryReferences} /></Suspense>}</Modal><Modal open={comparablesOpen} title={`${item.name} · Comparable Printings`} onClose={() => setComparablesOpen(false)} wide>{printingsStatus && <p className="muted">{printingsStatus}</p>}{printings.length ? <div className="comparables">{comparableRows}</div> : !printingsStatus && <p className="muted">No comparable printings found.</p>}</Modal></>;
}

function SealedProductDetail({ item, source, onClose }) {
  const { state, updateState } = useAppState();
  const [text, setText] = useState("");
  const [market, setMarket] = useState({ marketPrice: "", currentSellers: "", currentQuantity: "", rawText: "" });
  if (!item) return null;
  const trackedItems = [...state.sealedSpecs, ...state.sealedRadar];
  const canonical = resolveTrackedAsset(item, trackedItems) || item;
  const owned = state.sealedSpecs.find(row => getAssetKey(row) === getAssetKey(canonical));
  const watched = state.sealedRadar.find(row => getAssetKey(row) === getAssetKey(canonical));
  const target = source === "radar" ? watched || canonical : owned || canonical;
  const notes = getRelatedRecordsForAsset(state.cardNotes, canonical, trackedItems).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  const observations = getRelatedRecordsForAsset(state.marketObservations, canonical, trackedItems).sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt));
  const latestMarket = observations[0];
  const marketUrl = getExternalMarketUrl(canonical);
  const assetKey = getAssetKey(canonical);
  const identity = { assetType: ASSET_TYPES.SEALED, assetKey, mtgjson_uuid: canonical.mtgjson_uuid, name: canonical.name, cardName: canonical.name, set_code: canonical.set_code, set_name: canonical.set_name, category: canonical.category, subtype: canonical.subtype, productType: canonical.productType };
  function editPlan(key, value) {
    const slice = owned && source !== "radar" ? "sealedSpecs" : "sealedRadar";
    updateState(current => ({ ...current, [slice]: current[slice].map(row => getAssetKey(row) === assetKey ? { ...row, [key]: key === "holdTime" ? value : Math.max(0, number(value)) } : row) }));
  }
  function addNote(event) {
    event.preventDefault(); if (!text.trim()) return;
    const now = new Date().toISOString();
    updateState(current => ({ ...current, cardNotes: [{ id: crypto.randomUUID(), ...identity, text: text.trim(), createdAt: now, updatedAt: now }, ...current.cardNotes] }));
    setText("");
  }
  function saveMarket(event) {
    event.preventDefault();
    const price = number(market.marketPrice);
    if (!price) return;
    const checkedAt = new Date().toISOString();
    const observation = { id: crypto.randomUUID(), ...identity, source: "tcgplayer-manual", checkedAt, url: marketUrl, marketPrice: price, currentSellers: number(market.currentSellers), currentQuantity: number(market.currentQuantity), rawText: market.rawText.trim() };
    updateState(current => ({
      ...current,
      sealedSpecs: current.sealedSpecs.map(row => getAssetKey(row) === assetKey ? { ...row, currentPrice: price, priceUpdatedAt: checkedAt, valuationSource: "manual-tcgplayer-check" } : row),
      sealedRadar: current.sealedRadar.map(row => getAssetKey(row) === assetKey ? { ...row, currentPrice: price, priceUpdatedAt: checkedAt, valuationSource: "manual-tcgplayer-check" } : row),
      marketObservations: [observation, ...current.marketObservations],
    }));
    setMarket({ marketPrice: "", currentSellers: "", currentQuantity: "", rawText: "" });
  }
  const currentPrice = target.currentPrice ?? latestMarket?.marketPrice;
  const targetValue = owned ? target.exitTarget : target.entryTarget;
  const targetDistance = number(currentPrice) && number(targetValue) ? ((number(currentPrice) - number(targetValue)) / number(targetValue)) * 100 : null;
  return <Modal open title={canonical.name} onClose={onClose} compactDetail><div className="compact-detail"><div className="compact-detail-identity"><strong><span className="asset-type-pill sealed">Sealed</span> {assetContextLabel(canonical)}</strong><span>Exact MTGJSON product · {canonical.mtgjson_uuid}</span></div><section className="compact-detail-metrics"><div><span>Manual value</span><strong>{number(currentPrice) ? formatMoney(currentPrice) : "Unpriced"}</strong></div><div><span>{owned ? "Cost basis" : "Entry"}</span><strong>{number(owned ? target.buyPrice : target.entryTarget) ? formatMoney(owned ? target.buyPrice : target.entryTarget) : "-"}</strong></div><div><span>Exit</span><strong>{number(target.exitTarget) ? formatMoney(target.exitTarget) : "-"}</strong></div><div><span>Quantity</span><strong>{owned ? number(target.qty) : number(target.plannedQty || 1)}</strong></div></section><div className="compact-detail-grid"><div className="compact-detail-column"><section className="compact-detail-section plan"><header><h4>Plan / Evaluation</h4><span>{targetDistance === null ? "Value or target needed" : `${percent(targetDistance)} vs target`}</span></header><div className="compact-plan-fields"><label><span>Entry</span><input type="number" step="0.01" value={target.entryTarget || ""} placeholder="Set" onChange={event => editPlan("entryTarget", event.target.value)} /></label><label><span>Exit</span><input type="number" step="0.01" value={target.exitTarget || ""} placeholder="Set" onChange={event => editPlan("exitTarget", event.target.value)} /></label>{owned && <label><span>Hold</span><input value={target.holdTime || ""} placeholder="Months" onChange={event => editPlan("holdTime", event.target.value)} /></label>}</div><div className="compact-evaluation"><span>Source <strong>{owned ? "Positions" : "Radar"}</strong></span><span>Valuation <strong>{target.valuationSource || "Manual only"}</strong></span><span>Checked <strong>{target.priceUpdatedAt ? date(target.priceUpdatedAt) : "Due"}</strong></span></div></section><section className="compact-detail-section market"><header><h4>Manual Market Check</h4><span>{latestMarket ? `Saved ${date(latestMarket.checkedAt)}` : "No official sealed feed"}</span></header><form className="compact-market-form" onSubmit={saveMarket}><label><span>Market price</span><input required type="number" min="0.01" step="0.01" value={market.marketPrice} onChange={event => setMarket(current => ({ ...current, marketPrice: event.target.value }))} /></label><label><span>Sellers</span><input type="number" min="0" value={market.currentSellers} onChange={event => setMarket(current => ({ ...current, currentSellers: event.target.value }))} /></label><label><span>Quantity</span><input type="number" min="0" value={market.currentQuantity} onChange={event => setMarket(current => ({ ...current, currentQuantity: event.target.value }))} /></label><label className="raw"><span>Observation</span><input value={market.rawText} onChange={event => setMarket(current => ({ ...current, rawText: event.target.value }))} placeholder="Condition, shipping, or market context" /></label><button type="submit">Save value</button></form></section></div><div className="compact-detail-column"><section className="compact-detail-section notes"><header><h4>Notes</h4><span>{notes.length ? `${notes.length} saved` : "-"}</span></header>{notes[0] ? <article className="compact-latest-note"><small>{new Date(notes[0].updatedAt || notes[0].createdAt).toLocaleString()}</small><p>{notes[0].text}</p></article> : <p className="compact-empty">No notes yet.</p>}<form className="compact-note-form" onSubmit={addNote}><input value={text} onChange={event => setText(event.target.value)} placeholder="Add product thesis or check note" /><button type="submit">Add Note</button></form>{notes.length > 1 && <details className="compact-note-history"><summary>Show older notes ({notes.length - 1})</summary>{notes.slice(1).map(note => <p key={note.id}>{note.text}</p>)}</details>}</section><section className="compact-detail-section context"><header><h4>Product Context</h4><span>{canonical.releaseDate || "Release unknown"}</span></header><strong>{String(canonical.productType || canonical.category || "Sealed product").replaceAll("_", " ")}</strong><p className="compact-oracle">{canonical.contentsSummary || "Contents summary unavailable in the trimmed catalog."}</p><small>TCGplayer product ID: {canonical.tcgplayerProductId || "Unavailable"}</small><div className="compact-detail-links">{marketUrl && <a href={marketUrl} target="_blank" rel="noreferrer">Exact TCGplayer product</a>}</div></section><section className="compact-detail-section context"><header><h4>Valuation History</h4><span>{observations.length} checks</span></header>{observations.length ? observations.slice(0, 6).map(row => <p key={row.id}><strong>{formatMoney(row.marketPrice)}</strong> · {new Date(row.checkedAt).toLocaleString()}</p>) : <p className="compact-empty">Save a manual market check to establish a timestamped valuation.</p>}</section></div></div></div></Modal>;
}

function CardDetail(props) {
  if (!props.item) return null;
  return getAssetType(props.item) === ASSET_TYPES.SEALED ? <SealedProductDetail {...props} /> : <SingleCardDetail {...props} />;
}

function SearchPanel({ initialQuery = "", onAdd }) {
  const [query, setQuery] = useState(initialQuery);
  const [assetMode, setAssetMode] = useState("single");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("");
  const [choice, setChoice] = useState(null);
  async function submit(event) {
    event.preventDefault(); setStatus(assetMode === "sealed" ? "Searching the MTGJSON sealed catalog…" : assetMode === "all" ? "Searching singles and sealed products…" : "Searching Scryfall…"); setResults([]);
    try {
      const [cards, sealed] = await Promise.all([
        assetMode === "sealed" ? [] : searchCards(query),
        assetMode === "single" ? [] : searchSealedProducts(query),
      ]);
      const combined = [
        ...cards.map(card => ({ ...card, assetType: ASSET_TYPES.SINGLE })),
        ...sealed.map(product => ({ ...product, assetType: ASSET_TYPES.SEALED })),
      ];
      setResults(combined); setStatus(combined.length ? "" : "No matching paper singles or sealed products found.");
    }
    catch (error) { setStatus(error.message); }
  }
  return <section className="search-panel module-context-card module-context-card--wide module-context-card--search"><form onSubmit={submit}><div className="asset-mode-control" role="group" aria-label="Search asset type">{[["single", "Singles"], ["sealed", "Sealed"], ["all", "All"]].map(([value, label]) => <button key={value} type="button" className={assetMode === value ? "active" : ""} aria-pressed={assetMode === value} onClick={() => { setAssetMode(value); setResults([]); setStatus(""); }}>{label}</button>)}</div><label><span>Search / Add Candidate</span><input aria-label="Search / Add Candidate" value={query} onChange={event => setQuery(event.target.value)} placeholder={assetMode === "sealed" ? "Find product or set, e.g. BLB play booster" : "Find card, product, or set"} /></label></form>{status && <p className="muted">{status}</p>}{results.length > 0 && <div className="search-results">{results.map(item => <button type="button" key={`${getAssetType(item)}:${item.id}`} onClick={() => setChoice(item)}><span>{item.image_uris?.small && <img src={item.image_uris.small} alt="" />}<strong>{item.name}</strong></span><small><span className={`asset-type-pill ${getAssetType(item)}`}>{assetTypeLabel(item)}</span> {getAssetType(item) === ASSET_TYPES.SEALED ? `${item.set_name} · ${item.set_code} · ${String(item.productType || item.category || "Product").replaceAll("_", " ")} · Manual valuation` : `${item.set_name} · ${item.set.toUpperCase()} #${item.collector_number} · ${item.prices.usd ? formatMoney(item.prices.usd) : "No nonfoil price"}${item.prices.usd_foil ? ` · Foil ${formatMoney(item.prices.usd_foil)}` : ""}`}</small></button>)}</div>}<Modal open={Boolean(choice)} title={getAssetType(choice) === ASSET_TYPES.SEALED ? "Add exact sealed product" : "Add exact printing"} onClose={() => setChoice(null)}>{choice && (getAssetType(choice) === ASSET_TYPES.SEALED ? <AddSealedCandidateForm product={choice} onCancel={() => setChoice(null)} onAdd={options => { onAdd(toTrackedSealedProduct(choice, options)); setChoice(null); }} /> : <AddCandidateForm card={choice} onCancel={() => setChoice(null)} onAdd={options => { onAdd(toTrackedCard(choice, options)); setChoice(null); }} />)}</Modal></section>;
}

function AddCandidateForm({ card, onAdd, onCancel }) {
  const [foil, setFoil] = useState(!card.finishes?.includes("nonfoil")); const [plannedQty, setQty] = useState(1); const [entryTarget, setEntry] = useState("");
  return <form className="react-form" onSubmit={event => { event.preventDefault(); onAdd({ foil, plannedQty, entryTarget }); }}><div className="trade-card-line"><strong>{card.name}</strong><span>{card.set_name} · #{card.collector_number}</span></div><div className="form-grid"><label><span>Finish</span><select value={foil ? "foil" : "nonfoil"} onChange={event => setFoil(event.target.value === "foil")}><option value="nonfoil" disabled={!card.finishes?.includes("nonfoil")}>Nonfoil</option><option value="foil" disabled={!card.finishes?.includes("foil")}>Foil</option></select></label><label><span>Planned quantity</span><input type="number" min="1" value={plannedQty} onChange={event => setQty(event.target.value)} /></label><label><span>Entry target</span><input type="number" min="0" step="0.01" value={entryTarget} onChange={event => setEntry(event.target.value)} placeholder="Optional" /></label></div><div className="modal-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button type="submit">Add to Radar</button></div></form>;
}

function AddSealedCandidateForm({ product, onAdd, onCancel }) {
  const [plannedQty, setQty] = useState(1); const [entryTarget, setEntry] = useState("");
  return <form className="react-form" onSubmit={event => { event.preventDefault(); onAdd({ plannedQty, entryTarget }); }}><div className="trade-card-line"><strong>{product.name}</strong><span>{assetContextLabel(product)} · MTGJSON {product.mtgjson_uuid}</span></div><p className="muted">ManaSpec could not verify an official sealed price feed. This product starts unpriced; record a timestamped manual market check before using value or P/L.</p><div className="form-grid"><label><span>Planned quantity</span><input type="number" min="1" value={plannedQty} onChange={event => setQty(event.target.value)} /></label><label><span>Entry target</span><input type="number" min="0" step="0.01" value={entryTarget} onChange={event => setEntry(event.target.value)} placeholder="Optional" /></label></div><div className="modal-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button type="submit">Add to Radar</button></div></form>;
}

function AssetModeControl({ value, onChange, label = "Asset type" }) {
  return <div className="asset-mode-control asset-mode-filter" role="group" aria-label={label}>{[["all", "All"], ["single", "Singles"], ["sealed", "Sealed"]].map(([mode, text]) => <button key={mode} type="button" className={value === mode ? "active" : ""} aria-pressed={value === mode} onClick={() => onChange(mode)}>{text}</button>)}</div>;
}

function TableIndicatorIcon({ type }) {
  return type === "notes"
    ? <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.5" width="9" height="11" rx="1" /><path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3.5" /></svg>
    : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 12.5h11M3.5 10l3-3 2.5 2 3.5-5" /></svg>;
}

function RadarFilterBar({ filters, onChange, onClear, shownCount, pageSize, onPageSizeChange }) {
  const update = (key, value) => onChange(current => ({ ...current, [key]: value }));
  const types = ["Creature", "Planeswalker", "Instant", "Sorcery", "Artifact", "Enchantment", "Land", "Battle"];
  return <section className="card-filter-panel radar-filter-panel"><div className="panel-heading compact-heading"><h4>Filter Radar</h4><span className="filter-meta">{shownCount} {shownCount === 1 ? "idea" : "ideas"}</span></div><div className="card-filter-controls"><label className="filter-control"><span>Search</span><input aria-label="Filter Radar" value={filters.text} onChange={event => update("text", event.target.value)} placeholder="Name, set, type" /></label><label className="filter-control"><span>Rarity</span><select aria-label="Rarity" value={filters.rarity} onChange={event => update("rarity", event.target.value)}><option value="">Rarity</option><option value="mythic">Mythic</option><option value="rare">Rare</option><option value="uncommon">Uncommon</option><option value="common">Common</option></select></label><label className="filter-control"><span>Type</span><select aria-label="Type" value={filters.type} onChange={event => update("type", event.target.value)}><option value="">Type</option>{types.map(type => <option key={type}>{type}</option>)}</select></label><label className="filter-control"><span>Color</span><select aria-label="Color" value={filters.color} onChange={event => update("color", event.target.value)}><option value="">Color</option><option value="C">Colorless</option><option value="W">White</option><option value="U">Blue</option><option value="B">Black</option><option value="R">Red</option><option value="G">Green</option><option value="M">Multicolor</option></select></label><label className="filter-control"><span>Min $</span><input aria-label="Minimum price" inputMode="decimal" value={filters.minPrice} onChange={event => update("minPrice", event.target.value)} placeholder="Min $" /></label><label className="filter-control"><span>Max $</span><input aria-label="Maximum price" inputMode="decimal" value={filters.maxPrice} onChange={event => update("maxPrice", event.target.value)} placeholder="Max $" /></label><label className="inline-check"><input type="checkbox" checked={filters.reserved} onChange={event => update("reserved", event.target.checked)} />Reserved</label><label className="filter-control"><span>Print</span><select aria-label="Reprint" value={filters.reprint} onChange={event => update("reprint", event.target.value)}><option value="">Print</option><option value="new">First</option><option value="reprint">Reprint</option></select></label><label className="filter-control"><span>Plan</span><select aria-label="Plan" value={filters.plan} onChange={event => update("plan", event.target.value)}><option value="">Plan</option><option value="planned">Has plan</option><option value="unplanned">No plan</option><option value="entryHit">Entry hit</option><option value="exitHit">Exit hit</option><option value="approaching">Approaching</option></select></label><label className="table-page-size-control"><span>Rows</span><select aria-label="Rows per page" value={pageSize} onChange={event => onPageSizeChange(Number(event.target.value))}><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label><button type="button" className="filter-reset-btn" onClick={onClear}>Clear</button></div></section>;
}

export function RadarView() {
  const { state, updateSlice, updateState } = useAppState(); const [params, setParams] = useSearchParams(); const [filters, setFilters] = useState({ ...EMPTY_CARD_FILTERS }); const [assetMode, setAssetMode] = useState("all"); const [pageSize, setPageSize] = useState(25); const [trade, setTrade] = useState(null); const [detail, setDetail] = useState(null); const [detailPanel, setDetailPanel] = useState(""); const notices = useNotices();
  const focusId = params.get("focus") || "";
  const detailRequest = params.get("detail") || "";
  const query = String(filters.text || "").toLowerCase();
  function matchesSealedPlan(item) {
    if (!filters.plan) return true;
    if (filters.plan === "planned") return Boolean(number(item.entryTarget) || number(item.plannedQty) > 1);
    if (filters.plan === "unplanned") return !number(item.entryTarget) && number(item.plannedQty) <= 1;
    if (!number(item.currentPrice) || !number(item.entryTarget)) return false;
    const delta = ((number(item.currentPrice) - number(item.entryTarget)) / number(item.entryTarget)) * 100;
    if (filters.plan === "entryHit") return delta <= 0;
    if (filters.plan === "approaching") return delta > 0 && delta <= 10;
    return true;
  }
  const sealedRows = state.sealedRadar.filter(item => (!focusId || item.id === focusId) && (!query || [item.name, item.set_code, item.set_name, item.productType, item.category].join(" ").toLowerCase().includes(query)) && (!filters.minPrice || number(item.currentPrice) >= number(filters.minPrice)) && (!filters.maxPrice || number(item.currentPrice) <= number(filters.maxPrice)) && matchesSealedPlan(item));
  const rows = [...(assetMode === "sealed" ? [] : filterTrackedCards(state.radar.filter(item => !focusId || item.id === focusId), filters)), ...(assetMode === "single" ? [] : sealedRows)];
  function add(item) { const slice = getAssetType(item) === ASSET_TYPES.SEALED ? "sealedRadar" : "radar"; if (state[slice].some(row => getAssetKey(row) === getAssetKey(item))) return notices.show(`${item.name} is already on Radar.`, "warning"); updateSlice(slice, list => [item, ...list]); notices.show(`${item.name} added to Radar.`); }
  function updateRadar(item, changes) { const slice = getAssetType(item) === ASSET_TYPES.SEALED ? "sealedRadar" : "radar"; updateSlice(slice, list => list.map(row => getAssetKey(row) === getAssetKey(item) ? { ...row, ...changes } : row)); }
  const trackedItems = [...state.specs, ...state.radar, ...state.sealedSpecs, ...state.sealedRadar];
  function latestMarket(item) { return getRelatedRecordsForAsset(state.marketObservations, item, trackedItems).sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt))[0]; }
  function noteCount(item) { return getRelatedRecordsForAsset(state.cardNotes, item, trackedItems).length; }
  function historyCount(item) { return getAssetType(item) === ASSET_TYPES.SEALED ? getRelatedRecordsForAsset(state.marketObservations, item, trackedItems).length : getRelatedRecordsForPrinting(state.priceSnapshots, item, trackedItems).length; }
  function openDetail(item, panel = "") { setDetailPanel(panel); setDetail(item); }
  useEffect(() => {
    if (!focusId || !detailRequest) return;
    const item = [...state.radar, ...state.sealedRadar].find(row => row.id === focusId);
    if (item) openDetail(item, detailRequest === "history" ? "history" : "");
  }, [detailRequest, focusId, state.radar, state.sealedRadar]);
  const compactMoney = value => number(value) ? `$${number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "-";
  const columns = [
    { key: "name", label: "Asset", minWidth: 150, widthGrow: 1, widthShrink: 1, render: item => <button className="table-link" aria-label={`Open details for ${item.name}, ${assetContextLabel(item)}`} onClick={() => openDetail(item)}><CardIdentity item={item} /></button> },
    { key: "assetType", label: "Class", align: "center", width: 58, widthShrink: 0, render: item => <span className={`asset-type-pill ${getAssetType(item)}`}>{assetTypeLabel(item)}</span> },
    { key: "set_code", label: "Set", align: "center", width: 48, widthShrink: 0, format: item => String(item.set_code || "-").toUpperCase(), title: item => item.set_name || "" },
    { key: "collector_number", label: "Detail", align: "center", width: 82, widthShrink: 0, format: item => getAssetType(item) === ASSET_TYPES.SEALED ? String(item.productType || item.category || "Product").replaceAll("_", " ") : `${String(item.collector_number || "").padStart(3, "0")}${item.foil ? " F" : ""}` },
    { key: "rarity", label: "Rarity", align: "center", width: 54, widthShrink: 0, format: item => getAssetType(item) === ASSET_TYPES.SEALED ? "-" : item.rarity ? item.rarity[0].toUpperCase() : "-" },
    { key: "color", label: "Color", align: "center", width: 52, widthShrink: 0, format: color },
    { key: "currentPrice", label: "Value", align: "money", width: 72, widthShrink: 0, sortValue: item => number(item.currentPrice), format: item => compactMoney(item.currentPrice), title: item => getAssetType(item) === ASSET_TYPES.SEALED ? item.priceUpdatedAt ? `Manual valuation saved ${new Date(item.priceUpdatedAt).toLocaleString()}` : "Unpriced: save a manual market check in detail" : "Scryfall market value" },
    { key: "addedDate", label: "Added", align: "center", width: 58, widthShrink: 0, sortValue: item => item.addedDate ? new Date(item.addedDate).getTime() : 0, format: item => date(item.addedDate), title: item => item.addedDate ? new Date(item.addedDate).toLocaleString() : "No added date" },
    { key: "entryTarget", label: "Entry", align: "money", width: 74, widthShrink: 0, sortValue: item => number(item.entryTarget), format: item => number(item.entryTarget) ? compactMoney(item.entryTarget) : "Set", formatClass: "muted", editor: "number", editorParams: { min: 0, step: .01 }, onEdit: (item, value) => updateRadar(item, { entryTarget: Math.max(0, number(value)) }) },
    { key: "distance", label: "Δ Target", align: "money", width: 72, widthShrink: 0, sortValue: item => number(item.entryTarget) ? (number(item.currentPrice) - number(item.entryTarget)) / number(item.entryTarget) : 999, render: item => { const distance = number(item.entryTarget) ? ((number(item.currentPrice) - number(item.entryTarget)) / number(item.entryTarget)) * 100 : null; return <span className={distance === null ? "muted" : distance <= 0 ? "positive" : "negative"}>{distance === null ? "-" : `${distance > 0 ? "+" : ""}${distance.toFixed(1)}%`}</span>; } },
    { key: "plannedQty", label: "Want", align: "center", width: 68, widthShrink: 0, sortValue: item => number(item.plannedQty), render: item => { const qty = Math.max(1, number(item.plannedQty)); return <div className="ms-tabulator-stepper"><button type="button" aria-label={`Decrease planned quantity for ${item.name}`} disabled={qty <= 1} onClick={() => updateRadar(item, { plannedQty: Math.max(1, qty - 1) })}>−</button><span>{qty}</span><button type="button" aria-label={`Increase planned quantity for ${item.name}`} onClick={() => updateRadar(item, { plannedQty: qty + 1 })}>+</button></div>; } },
    { key: "sellers", label: "Sellers", align: "center", width: 58, widthShrink: 0, sortValue: item => number(latestMarket(item)?.currentSellers), format: item => latestMarket(item)?.currentSellers ?? "-" },
    { key: "marketQty", label: "Qty", align: "center", width: 50, widthShrink: 0, sortValue: item => number(latestMarket(item)?.currentQuantity), format: item => latestMarket(item)?.currentQuantity ?? "-" },
    { key: "tcg", label: "TCG Check", align: "money", width: 78, widthShrink: 0, sortValue: item => number(latestMarket(item)?.marketPrice), format: item => latestMarket(item)?.marketPrice ? compactMoney(latestMarket(item).marketPrice) : "-", title: item => latestMarket(item)?.checkedAt ? `Saved ${new Date(latestMarket(item).checkedAt).toLocaleString()}` : "No saved manual TCGplayer Market Check" },
    { key: "notes", label: "Notes", align: "center", width: 54, widthShrink: 0, sortValue: noteCount, render: item => { const count = noteCount(item); return <button type="button" className={`ms-tabulator-indicator${count ? " active" : ""}`} aria-label={`${count || "No"} notes for ${item.name}`} onClick={() => openDetail(item, "notes")}><TableIndicatorIcon type="notes" />{count > 0 && <sup>{count}</sup>}</button>; } },
    { key: "history", label: "History", align: "center", width: 62, widthShrink: 0, sortValue: historyCount, render: item => { const count = historyCount(item); return <button type="button" className={`ms-tabulator-indicator${count ? " active" : ""}`} aria-label={`${count || "No"} price history snapshots for ${item.name}`} onClick={() => openDetail(item, "history")}><TableIndicatorIcon type="history" />{count > 0 && <sup>{count}</sup>}</button>; } },
    { key: "actions", label: "Actions", sort: false, align: "actions", width: 112, widthShrink: 0, render: item => <div className="table-actions"><button onClick={() => setTrade(item)}>Buy</button><button className="danger ghost" onClick={() => { if (confirm(`Remove ${item.name} from Radar? This only removes the watched idea; it will not affect owned Positions.`)) { const slice = getAssetType(item) === ASSET_TYPES.SEALED ? "sealedRadar" : "radar"; updateSlice(slice, list => list.filter(row => getAssetKey(row) !== getAssetKey(item))); } }}>Remove</button></div> },
  ];
  const allRadar = [...state.radar, ...state.sealedRadar];
  const radarNotes = state.cardNotes.filter(note => allRadar.some(item => relatedRecordMatchesAsset(note, item, trackedItems))).length;
  return <><ViewHeader title="Radar" description="Watch singles and exact sealed products before money is committed. Buying creates or updates a Position while Radar keeps watching." /><div className="module-context-band radar-context"><SearchPanel initialQuery={params.get("query") || ""} onAdd={add} />{[{ label: "Watching", value: allRadar.length, detail: `${state.radar.length} singles · ${state.sealedRadar.length} sealed`, preview: allRadar[0]?.name || "No watched ideas" }, { label: "Planned Entries", value: allRadar.filter(item => number(item.entryTarget) || number(item.plannedQty) > 1).length, detail: "Entry target or staged qty", preview: "Opportunity tracking" }, { label: "Notes", value: radarNotes, detail: "Linked decision notes", preview: radarNotes ? "Context attached" : "Needs plan" }].map(item => <article className="module-context-card" key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small><em>{item.preview}</em></article>)}</div><AssetModeControl value={assetMode} onChange={setAssetMode} label="Filter Radar by asset type" /><RadarFilterBar filters={filters} onChange={updater => { if (focusId) setParams({}); setFilters(updater); }} onClear={() => { setParams({}); setFilters({ ...EMPTY_CARD_FILTERS }); }} shownCount={rows.length} pageSize={pageSize} onPageSizeChange={setPageSize} /><TabulatorTable columns={columns} rows={rows} onRowClick={item => openDetail(item)} tableClass="ms-tabulator--radar" ariaLabel="Radar ideas" empty="Search above and add exact singles or sealed products to start tracking ideas." initialSort={[{ column: "name", dir: "asc" }]} pageSize={pageSize} /><Modal open={Boolean(trade)} title="Buy from Radar" onClose={() => setTrade(null)}>{trade && <TradeForm item={trade} defaultQuantity={trade.plannedQty || 1} mode="buy" onCancel={() => setTrade(null)} onSubmit={(qty, price) => { try { updateState(current => buyFromRadar(current, trade, qty, price)); notices.show(`Bought ${qty} ${trade.name}. Radar will keep watching it.`); setTrade(null); } catch (error) { notices.show(error.message, "warning"); } }} />}</Modal><CardDetail item={detail} source="radar" initialPanel={detailPanel} onClose={() => { setDetail(null); setDetailPanel(""); }} /><Notice notice={notices.notice} onDismiss={notices.dismiss} /></>;
}

export function PositionsView() {
  const { state, updateSlice, updateState } = useAppState(); const [params, setParams] = useSearchParams(); const [filter, setFilter] = useState(""); const [assetMode, setAssetMode] = useState("all"); const [trade, setTrade] = useState(null); const [detail, setDetail] = useState(null); const notices = useNotices();
  const focusId = params.get("focus") || "";
  const detailRequest = params.get("detail") || "";
  const trackedItems = [...state.specs, ...state.radar, ...state.sealedSpecs, ...state.sealedRadar];
  const singleRows = selectPositionRows(state.specs, { getNotesCount: item => getRelatedRecordsForAsset(state.cardNotes, item, trackedItems).length, getHistoryCount: item => getRelatedRecordsForPrinting(state.priceSnapshots, item, trackedItems).length });
  const sealedPositionRows = selectSealedPositionRows(state.sealedSpecs, { getNotesCount: item => getRelatedRecordsForAsset(state.cardNotes, item, trackedItems).length, getHistoryCount: item => getRelatedRecordsForAsset(state.marketObservations, item, trackedItems).length });
  const positionRows = [...singleRows, ...sealedPositionRows];
  const summary = calculatePortfolioSummary(state.specs, state.cash, { sealedSpecs: state.sealedSpecs, transactions: state.transactions, sealedTransactions: state.sealedTransactions }); const rows = filterPositionRows(positionRows.filter(row => assetMode === "all" || row.assetType === assetMode), { focusId, query: filter });
  useEffect(() => {
    if (!focusId || !detailRequest) return;
    const row = positionRows.find(item => item.id === focusId);
    if (row?.validation.valid) setDetail(row.sourceRecord);
  }, [detailRequest, focusId, state.specs, state.sealedSpecs]);
  const edit = (item, key, value) => { const slice = item.assetType === ASSET_TYPES.SEALED ? "sealedSpecs" : "specs"; updateSlice(slice, list => list.map(row => getAssetKey(row) === item.assetKey ? { ...row, [key]: key === "holdTime" ? value : number(value) } : row)); };
  const columns = [
    { key: "name", label: "Asset", minWidth: 170, widthGrow: 1, widthShrink: 1, render: item => <button className="table-link" aria-label={`Open details for ${item.name}, ${assetContextLabel(item)}`} disabled={!item.validation.valid} onClick={() => setDetail(item.sourceRecord)}><CardIdentity item={item} />{!item.validation.valid && <ReconciliationValue row={item} />}</button> },
    { key: "assetType", label: "Class", align: "center", width: 58, widthShrink: 0, render: item => <span className={`asset-type-pill ${item.assetType}`}>{assetTypeLabel(item)}</span> },
    { key: "set_code", label: "Set", align: "center", width: 44, widthShrink: 0, format: item => String(item.set_code || "-").toUpperCase(), title: item => item.set_name || "" },
    { key: "collector_number", label: "Detail", align: "center", width: 78, widthShrink: 0, format: item => item.assetType === ASSET_TYPES.SEALED ? String(item.productType || "Product").replaceAll("_", " ") : item.collector_number || "-" },
    { key: "rarity", label: "Rarity", align: "center", width: 52, widthShrink: 0, format: rarity },
    { key: "color", label: "Color", align: "center", width: 50, widthShrink: 0, format: color },
    { key: "averageBuyPrice", label: "Buy", align: "money", width: 60, widthShrink: 0, sortValue: item => item.averageBuyPrice ?? -1, render: item => item.averageBuyPrice === null ? <ReconciliationValue row={item} /> : formatMoney(item.averageBuyPrice) },
    { key: "currentPrice", label: "Now", align: "money", width: 60, widthShrink: 0, sortValue: item => item.currentPrice ?? -1, format: item => item.currentPrice === null || item.currentPrice < 0 ? "-" : formatMoney(item.currentPrice), title: item => item.assetType === ASSET_TYPES.SEALED ? item.priceUpdatedAt ? `Manual valuation saved ${new Date(item.priceUpdatedAt).toLocaleString()}` : "Unpriced: open detail to save a manual value" : "Scryfall market value" },
    { key: "quantity", label: "Qty", align: "center", width: 40, minWidth: 40, widthShrink: 0, sortValue: item => item.quantity ?? -1, render: item => item.quantity === null ? <ReconciliationValue row={item} /> : item.quantity },
    { key: "age", label: "Age", align: "center", width: 42, widthShrink: 0, sortValue: item => item.acquiredAt ? ageDays(item.acquiredAt) : -1, render: item => item.acquiredAt ? `${ageDays(item.acquiredAt)}d` : <ReconciliationValue row={item} /> },
    { key: "added", label: "Added", align: "center", width: 64, widthShrink: 0, sortValue: item => item.acquiredAt ? new Date(item.acquiredAt).getTime() : -1, render: item => item.acquiredAt ? date(item.acquiredAt) : <ReconciliationValue row={item} /> },
    { key: "value", label: "Value", align: "money", width: 60, widthShrink: 0, sortValue: item => item.validation.calculationEligible ? item.quantity * item.currentPrice : -1, format: item => item.validation.calculationEligible ? formatMoney(item.quantity * item.currentPrice) : "-" },
    { key: "pl", label: "P/L", align: "money", width: 54, widthShrink: 0, sortValue: item => item.validation.calculationEligible ? (item.currentPrice - item.averageBuyPrice) * item.quantity : -Infinity, render: item => item.validation.calculationEligible ? <span className={item.currentPrice >= item.averageBuyPrice ? "positive" : "negative"}>{signedMoney((item.currentPrice - item.averageBuyPrice) * item.quantity)}</span> : "-" },
    { key: "plPct", label: "P/L %", align: "money", width: 58, widthShrink: 0, sortValue: item => item.validation.calculationEligible ? ((item.currentPrice - item.averageBuyPrice) / item.averageBuyPrice) * 100 : -Infinity, format: item => item.validation.calculationEligible ? percent(((item.currentPrice - item.averageBuyPrice) / item.averageBuyPrice) * 100) : "-" },
    { key: "exitTarget", label: "Target", align: "money", width: 68, widthShrink: 0, sortValue: item => number(item.exitTarget), format: item => number(item.exitTarget) ? number(item.exitTarget).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "Set", editor: "number", editorParams: { min: 0, step: .01 }, onEdit: (item, value) => edit(item, "exitTarget", value) },
    { key: "distance", label: "Δ", align: "money", width: 52, widthShrink: 0, sortValue: item => number(item.exitTarget) ? ((number(item.currentPrice) - number(item.exitTarget)) / number(item.exitTarget)) * 100 : 999, format: item => number(item.exitTarget) ? percent(((number(item.currentPrice) - number(item.exitTarget)) / number(item.exitTarget)) * 100) : "-" },
    { key: "holdTime", label: "Hold", align: "center", width: 62, widthShrink: 0, sortValue: item => item.holdTime || "", format: item => item.holdTime || "Set", editor: "input", onEdit: (item, value) => edit(item, "holdTime", value) },
    { key: "notes", label: "Notes", align: "center", width: 52, widthShrink: 0, sortValue: item => item.notesCount, format: item => item.notesCount },
    { key: "history", label: "History", align: "center", width: 60, widthShrink: 0, sortValue: item => item.historyCount, format: item => item.historyCount },
    { key: "actions", label: "Actions", sort: false, align: "actions", width: 110, widthShrink: 0, render: item => item.validation.valid ? <div className="table-actions"><button onClick={() => setTrade({ item: item.sourceRecord, mode: "buy" })}>Buy</button><button className="danger" onClick={() => setTrade({ item: item.sourceRecord, mode: "sell" })}>Sell</button><button className="danger ghost" onClick={() => removePosition(item.sourceRecord)}>Del</button></div> : <ReconciliationValue row={item} /> },
  ];
  function removePosition(item) { if (!confirm(`Delete ${item.name} from Positions? This removes the current position without logging a transaction.`)) return; try { updateState(current => deletePosition(current, item)); notices.show(`${item.name} deleted from Positions. No transaction was logged.`, "warning"); } catch (error) { notices.show(error.message, "warning"); } }
  function complete(qty, price) { try { updateState(current => trade.mode === "sell" ? sellPosition(current, trade.item, qty, price) : buyPosition(current, trade.item, qty, price)); notices.show(`${trade.mode === "sell" ? "Sold" : "Bought"} ${qty} ${trade.item.name}.`); setTrade(null); } catch (error) { notices.show(error.message, "warning"); } }
  const positionNotes = state.cardNotes.filter(note => [...state.specs, ...state.sealedSpecs].some(item => relatedRecordMatchesAsset(note, item, trackedItems))).length;
  return <><ViewHeader title="Positions" description="Owned singles and sealed products. Unpriced sealed holdings remain visible but are excluded from value and P/L." /><MetricBand items={[{ label: "Portfolio Value", value: formatMoney(summary.value), detail: "Current marked value", preview: summary.unpricedPositionCount ? `${summary.unpricedPositionCount} unpriced or unreconciled` : `${summary.openPositionCount} owned rows` }, { label: "Capital Deployed", value: formatMoney(summary.invested), detail: "Valid open-position cost basis", preview: summary.invalidPositionCount ? "Invalid rows excluded" : "Owned portfolio state" }, { label: "Open Positions", value: summary.openPositionCount, detail: `${state.specs.length} singles · ${state.sealedSpecs.length} sealed`, preview: summary.invalidPositionCount ? `${summary.invalidPositionCount} invalid ${summary.invalidPositionCount === 1 ? "record" : "records"}` : positionRows[0]?.name || "No open positions" }, { label: "Notes", value: positionNotes, detail: "Linked decision notes", preview: positionNotes ? "Context attached" : "No notes yet" }]} /><FilterBar value={filter} onChange={value => { if (focusId) setParams({}); setFilter(value); }} placeholder="Filter singles, sealed products, sets, or types"><AssetModeControl value={assetMode} onChange={setAssetMode} label="Filter Positions by asset type" />{focusId && <button type="button" className="filter-reset-btn" onClick={() => setParams({})}>Show all Positions</button>}</FilterBar><TabulatorTable columns={columns} rows={rows} onRowClick={item => { if (item.validation.valid) setDetail(item.sourceRecord); }} tableClass="ms-tabulator--positions" ariaLabel="Owned Positions" empty="No owned positions yet. Buy an idea from Radar to begin." initialSort={[{ column: "name", dir: "asc" }]} /><Modal open={Boolean(trade)} title={trade?.mode === "sell" ? "Confirm sale" : "Add to position"} onClose={() => setTrade(null)}>{trade && <TradeForm item={trade.item} mode={trade.mode} defaultQuantity={1} onCancel={() => setTrade(null)} onSubmit={complete} />}</Modal><CardDetail item={detail} source="positions" initialPanel={detailRequest} onClose={() => setDetail(null)} /><Notice notice={notices.notice} onDismiss={notices.dismiss} /></>;
}

function signalQueueTitle(row) {
  const identity = [String(row.set_code || "").toUpperCase(), row.collector_number ? `#${row.collector_number}` : "", row.foil ? "F" : ""].filter(Boolean).join(" ");
  return identity ? `${row.name} - ${identity}` : row.name;
}

function signalQueueReason(row, bucketId) {
  if (bucketId === "targetsHit") return row.source === "portfolio" ? "Exit Hit" : "Entry Hit";
  if (bucketId === "approaching") {
    if (row.status === "Exit near") return "Exit Near";
    if (row.status === "Entry near") return "Entry Near";
    return row.source === "portfolio" ? "Exit Watch" : "Entry Watch";
  }
  if (bucketId === "noPlan") return `Missing ${row.missingPlanReasons.join(" + ")}`;
  if (bucketId === "staleChecks") return "Market Check Due";
  return row.reasonLabel;
}

function SignalActionBand({ rows, bucketId, printingId, query, onQuery, pageSize, onPageSizeChange, onBucket, onPrinting, onReset }) {
  return <section className="signals-action-band" aria-label="Signals action center"><div className="signals-action-tiles">{SIGNAL_BUCKETS.map(bucket => { const preview = getSignalTileRows(rows, bucket.id); return <article key={bucket.id} className={`signals-action-tile${bucketId === bucket.id ? " active" : ""}`} onClick={() => onBucket(bucket.id)}><button type="button" className="signals-action-filter" onClick={event => { event.stopPropagation(); onBucket(bucket.id); }}><span className="signals-action-title">{bucket.label}</span><strong>{preview.length}</strong><small>{bucket.detail}</small></button><div className="signals-action-preview">{preview.length ? preview.map(row => <button type="button" key={`${bucket.id}-${row.id}`} className={`scan-row dashboard-queue-row attention-queue-row signals-action-preview-row${printingId === row.id && bucketId === bucket.id ? " active" : ""}`} onClick={event => { event.stopPropagation(); onPrinting(bucket.id, row.id); }}><strong>{signalQueueTitle(row)}</strong><span>{signalQueueReason(row, bucket.id)}</span><small>{row.previewReason}</small></button>) : <em>No cards</em>}</div></article>; })}<article className="signals-action-utility"><span>Attention</span><strong>{filterSignalRows(rows).length} Active</strong><label className="signals-action-search"><span>Search</span><input aria-label="Filter Signals" value={query} onChange={event => onQuery(event.target.value)} placeholder="Card or reason" /></label><button type="button" className="filter-reset-btn" disabled={!bucketId && !printingId && !query} onClick={onReset}>Show all</button><label className="table-page-size-control"><span>Rows</span><select aria-label="Rows per page" value={pageSize} onChange={event => onPageSizeChange(Number(event.target.value))}><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label></article></div></section>;
}

export function SignalsView() {
  const { state } = useAppState(); const navigate = useNavigate(); const [filter, setFilter] = useState(""); const [bucketId, setBucketId] = useState(""); const [printingId, setPrintingId] = useState(""); const [pageSize, setPageSize] = useState(25); const [detail, setDetail] = useState(null); const allRows = useMemo(() => deriveSignalRows(state), [state]); const rows = filterSignalRows(allRows, { bucketId, printingId, query: filter });
  const columns = [
    { key: "name", label: "Asset", minWidth: 170, widthGrow: 1, widthShrink: 1, render: item => <button className="table-link" aria-label={`Open details for ${item.name}, ${assetContextLabel(item)}`} onClick={() => setDetail(item)}><CardIdentity item={item} /></button> },
    { key: "assetType", label: "Class", align: "center", width: 58, widthShrink: 0, render: item => <span className={`asset-type-pill ${getAssetType(item)}`}>{assetTypeLabel(item)}</span> },
    { key: "set_code", label: "Set", align: "center", width: 48, widthShrink: 0, format: item => String(item.set_code || "-").toUpperCase() },
    { key: "collector_number", label: "Detail", align: "center", width: 76, widthShrink: 0, format: item => getAssetType(item) === ASSET_TYPES.SEALED ? String(item.productType || "Product").replaceAll("_", " ") : item.collector_number || "-" },
    { key: "foil", label: "Fin", align: "center", width: 44, widthShrink: 0, format: item => item.foil ? "F" : "N" },
    { key: "sourceLabel", label: "Source", align: "center", width: 68, widthShrink: 0 },
    { key: "actionLabel", label: "Action", align: "center", width: 112, widthShrink: 0 },
    { key: "reasonLabel", label: "Why", align: "center", width: 112, widthShrink: 0, title: item => item.reasonDetail, render: item => <span className={`status-pill ${item.buckets.includes("targetsHit") ? "action" : ""}`}>{item.reasonLabel}</span> },
    { key: "currentPrice", label: "Now", align: "money", width: 58, widthShrink: 0, sortValue: item => number(item.currentPrice), format: item => formatMoney(item.currentPrice) },
    { key: "targetValue", label: "Target", align: "money", width: 68, widthShrink: 0, sortValue: item => number(item.targetValue), format: item => item.targetValue ? formatMoney(item.targetValue) : "-" },
    { key: "change", label: "Δ Target", align: "money", width: 86, widthShrink: 0, sortValue: item => item.change, format: item => item.targetValue ? percent(item.change) : "-" },
    { key: "marketFreshness", label: "Market", align: "center", width: 76, widthShrink: 0, sortValue: item => item.marketAgeSort, title: item => item.marketDetail },
    { key: "actions", label: "Actions", sort: false, align: "actions", width: 148, widthShrink: 0, render: item => <div className="table-actions"><button onClick={() => setDetail(item)}>Detail</button><button onClick={() => navigate(getSignalSourceNavigation(item))}>View</button><a className="button secondary" href={getSignalScryfallUrl(item)} target="_blank" rel="noreferrer">{getAssetType(item) === ASSET_TYPES.SEALED ? "Market" : "Scryfall"}</a></div> },
  ];
  function showBucket(nextBucket) { setBucketId(nextBucket); setPrintingId(""); }
  function showPrinting(nextBucket, nextPrinting) { setBucketId(nextBucket); setPrintingId(nextPrinting); }
  function showAll() { setBucketId(""); setPrintingId(""); setFilter(""); }
  return <><ViewHeader title="Signals" description="What needs attention today across Radar and Positions." /><SignalActionBand rows={allRows} bucketId={bucketId} printingId={printingId} query={filter} onQuery={setFilter} pageSize={pageSize} onPageSizeChange={setPageSize} onBucket={showBucket} onPrinting={showPrinting} onReset={showAll} /><TabulatorTable columns={columns} rows={rows} onRowClick={setDetail} tableClass="ms-tabulator--signals" ariaLabel="Signals attention" empty="No Signals rows match this attention filter." initialSort={[{ column: "name", dir: "asc" }]} pageSize={pageSize} /><CardDetail item={detail} source={detail?.source === "radar" ? "radar" : "positions"} onClose={() => setDetail(null)} /></>;
}

export function TransactionsView() {
  const { state } = useAppState(); const [params, setParams] = useSearchParams(); const [filter, setFilter] = useState(""); const [type, setType] = useState(""); const [assetMode, setAssetMode] = useState("all"); const [pageSize, setPageSize] = useState(25); const [detail, setDetail] = useState(null); const focusId = params.get("focus") || "";
  const trackedItems = [...state.specs, ...state.radar, ...state.sealedSpecs, ...state.sealedRadar];
  const allTransactions = [...state.transactions, ...state.sealedTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const rows = allTransactions.filter(tx => (!focusId || String(tx.id) === focusId) && (!type || tx.type === type) && (assetMode === "all" || getAssetType(tx) === assetMode) && [tx.name, tx.set_code, tx.productType, tx.notes, tx.type, assetTypeLabel(tx)].join(" ").toLowerCase().includes(filter.toLowerCase()));
  const buys = allTransactions.filter(tx => tx.type === "BUY"); const sells = allTransactions.filter(tx => tx.type === "SELL");
  function openTransactionDetail(item) {
    const asset = resolveAssetDetail(item, trackedItems);
    if (asset) setDetail({ ...asset, currentPrice: asset.currentPrice ?? item.price });
  }
  const columns = [
    { key: "name", label: "Asset", minWidth: 170, widthGrow: 1, widthShrink: 1, render: item => resolveAssetDetail(item, trackedItems) ? <button className="table-link" aria-label={`Open details for ${item.name}, ${assetContextLabel(item)}`} onClick={() => openTransactionDetail(item)}><CardIdentity item={item} /></button> : <CardIdentity item={item} /> },
    { key: "assetType", label: "Class", align: "center", width: 58, widthShrink: 0, render: item => <span className={`asset-type-pill ${getAssetType(item)}`}>{assetTypeLabel(item)}</span> },
    { key: "set_code", label: "Set", align: "center", width: 48, widthShrink: 0, format: item => String(item.set_code || "-").toUpperCase() },
    { key: "collector_number", label: "Detail", align: "center", width: 78, widthShrink: 0, format: item => getAssetType(item) === ASSET_TYPES.SEALED ? String(item.productType || "Product").replaceAll("_", " ") : item.collector_number || "-" },
    { key: "rarity", label: "Rarity", align: "center", width: 44, widthShrink: 0, format: rarity },
    { key: "color", label: "Color", align: "center", width: 44, widthShrink: 0, format: color },
    { key: "price", label: "Price", align: "money", width: 64, widthShrink: 0, sortValue: item => number(item.price), format: item => formatMoney(item.price) },
    { key: "quantity", label: "Qty", align: "center", width: 38, minWidth: 38, widthShrink: 0, sortValue: item => number(item.quantity), format: item => number(item.quantity) },
    { key: "total", label: "Total", align: "money", width: 74, widthShrink: 0, sortValue: item => number(item.quantity) * number(item.price), render: item => <span className={item.type === "SELL" ? "positive" : "negative"}>{item.type === "SELL" ? "+" : "-"}{formatMoney(number(item.quantity) * number(item.price))}</span> },
    { key: "balanceAfter", label: "Balance", align: "money", width: 82, widthShrink: 0, sortValue: item => Number.isFinite(Number(item.balanceAfter)) ? Number(item.balanceAfter) : -Infinity, format: item => Number.isFinite(Number(item.balanceAfter)) ? formatMoney(item.balanceAfter) : "-" },
    { key: "realizedPL", label: "Realized", align: "money", width: 76, widthShrink: 0, sortValue: item => item.type === "SELL" && Number.isFinite(Number(item.realizedPL)) ? Number(item.realizedPL) : -Infinity, format: item => item.type === "SELL" && Number.isFinite(Number(item.realizedPL)) ? signedMoney(item.realizedPL) : "-" },
    { key: "date", label: "Date", align: "center", width: 68, widthShrink: 0, sortValue: item => item.date ? new Date(item.date).getTime() : -1, format: item => date(item.date) },
    { key: "type", label: "Type", align: "center", width: 58, widthShrink: 0, render: item => <span className={`tx-pill ${item.type.toLowerCase()}`}>{item.type}</span> },
  ];
  const bought = buys.reduce((sum, tx) => sum + number(tx.quantity) * number(tx.price), 0); const sold = sells.reduce((sum, tx) => sum + number(tx.quantity) * number(tx.price), 0);
  return <><ViewHeader title="Transactions" description="Shared ledger for single and sealed buys, sells, balances, and realized outcomes." /><MetricBand items={[{ label: "Buys", value: buys.length, detail: `${formatMoney(bought)} deployed` }, { label: "Sells", value: sells.length, detail: `${formatMoney(sold)} returned` }, { label: "Net Cash Flow", value: signedMoney(sold - bought), detail: "Sells minus buys" }, { label: "Recent Activity", value: allTransactions[0] ? date(allTransactions[0].date) : "-", detail: allTransactions[0]?.name || "No transactions" }]} /><TableFilterPanel title="Filter Transactions" countText={`${rows.length} ${rows.length === 1 ? "transaction" : "transactions"}`} value={filter} onChange={value => { if (focusId) setParams({}); setFilter(value); }} placeholder="Asset, set, type, notes" pageSize={pageSize} onPageSizeChange={setPageSize} onReset={() => { setParams({}); setFilter(""); setType(""); setAssetMode("all"); }}><AssetModeControl value={assetMode} onChange={setAssetMode} label="Filter Transactions by asset type" /><label className="filter-control"><span>Type</span><select aria-label="Transaction type" value={type} onChange={event => setType(event.target.value)}><option value="">All types</option><option>BUY</option><option>SELL</option></select></label>{focusId && <button type="button" className="filter-reset-btn" onClick={() => setParams({})}>Show all Transactions</button>}</TableFilterPanel><TabulatorTable columns={columns} rows={rows} onRowClick={openTransactionDetail} tableClass="ms-tabulator--transactions" ariaLabel="Transactions ledger" empty="No transactions yet. Buys and sells will appear here automatically." initialSort={[{ column: "name", dir: "asc" }]} pageSize={pageSize} /><CardDetail item={detail} source="positions" onClose={() => setDetail(null)} /></>;
}

export function HistoryView() {
  const { state } = useAppState(); const [params, setParams] = useSearchParams(); const [filter, setFilter] = useState(""); const [type, setType] = useState(""); const [assetMode, setAssetMode] = useState("all"); const [pageSize, setPageSize] = useState(25); const [detail, setDetail] = useState(null); const focusId = params.get("focus") || "";
  const trackedItems = [...state.specs, ...state.radar, ...state.sealedSpecs, ...state.sealedRadar];
  const allEvents = buildHistoryEvents(state);
  const events = allEvents.filter(event => (!focusId || String(event.id) === focusId) && (!type || event.kind === type) && (assetMode === "all" || getAssetType(event) === assetMode) && [event.name, event.summary, event.eventType, event.productType, assetTypeLabel(event)].join(" ").toLowerCase().includes(filter.toLowerCase()));
  function openHistoryDetail(event) {
    const item = resolveAssetDetail(event, trackedItems);
    if (item) setDetail(item);
  }
  const columns = [
    { key: "name", label: "Asset", minWidth: 170, widthGrow: 1, widthShrink: 1, render: event => resolveAssetDetail(event, trackedItems) ? <button className="table-link" aria-label={`Open details for ${event.name}, ${assetContextLabel(event)}`} onClick={() => openHistoryDetail(event)}><CardIdentity item={event} /></button> : <CardIdentity item={event} /> },
    { key: "assetType", label: "Class", align: "center", width: 58, widthShrink: 0, render: item => <span className={`asset-type-pill ${getAssetType(item)}`}>{assetTypeLabel(item)}</span> },
    { key: "set_code", label: "Set", align: "center", width: 48, widthShrink: 0, format: item => String(item.set_code || "-").toUpperCase() },
    { key: "collector_number", label: "Detail", align: "center", width: 78, widthShrink: 0, format: item => getAssetType(item) === ASSET_TYPES.SEALED ? String(item.productType || "Product").replaceAll("_", " ") : item.collector_number || "-" },
    { key: "rarity", label: "Rarity", align: "center", width: 44, widthShrink: 0, format: rarity },
    { key: "color", label: "Color", align: "center", width: 44, widthShrink: 0, format: color },
    { key: "price", label: "Price", align: "money", width: 64, widthShrink: 0, sortValue: item => item.price ? number(item.price) : -1, format: item => item.price ? formatMoney(item.price) : "-" },
    { key: "date", label: "Date", align: "center", width: 112, widthShrink: 0, sortValue: item => item.date ? new Date(item.date).getTime() : -1, format: item => new Date(item.date).toLocaleString() },
    { key: "eventType", label: "Type", align: "center", width: 58, widthShrink: 0, render: item => <span className="status-pill">{item.eventType}</span> },
    { key: "notes", label: "Notes", width: 72, widthShrink: 0, sortValue: item => item.notes || "", format: item => item.eventType === "NOTE" ? item.summary : (item.notes || "-") },
    { key: "summary", label: "Detail", width: 220, widthShrink: 0 },
  ];
  return <><ViewHeader title="History" description="Recent activity and learning trail across singles, sealed products, transactions, Radar, valuations, and notes." /><MetricBand items={[{ label: "Events", value: allEvents.length, detail: "Reviewable records" }, { label: "Trades", value: state.transactions.length + state.sealedTransactions.length, detail: "Buy and sell events" }, { label: "Lessons / Review", value: state.cardNotes.length + (state.thesisNotes || []).length, detail: "Saved decision notes" }, { label: "Notes", value: state.cardNotes.length, detail: "Asset memory" }]} /><TableFilterPanel title="Filter History" countText={`${events.length} ${events.length === 1 ? "event" : "events"}`} value={filter} onChange={value => { if (focusId) setParams({}); setFilter(value); }} placeholder="Event, asset, detail" pageSize={pageSize} onPageSizeChange={setPageSize} onReset={() => { setParams({}); setFilter(""); setType(""); setAssetMode("all"); }}><AssetModeControl value={assetMode} onChange={setAssetMode} label="Filter History by asset type" /><label className="filter-control"><span>Type</span><select aria-label="History type" value={type} onChange={event => setType(event.target.value)}><option value="">All events</option><option value="transaction">Transactions</option><option value="radar">Radar</option><option value="note">Notes</option><option value="market">Valuations</option></select></label>{focusId && <button type="button" className="filter-reset-btn" onClick={() => setParams({})}>Show all History</button>}</TableFilterPanel><TabulatorTable columns={columns} rows={events} onRowClick={openHistoryDetail} tableClass="ms-tabulator--history" ariaLabel="Activity history" empty="Activity will appear here as you work." initialSort={[{ column: "name", dir: "asc" }]} pageSize={pageSize} /><CardDetail item={detail} source="positions" onClose={() => setDetail(null)} /></>;
}

export function DashboardView() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const summary = calculatePortfolioSummary(state.specs, state.cash, {
    transactions: state.transactions,
    radar: state.radar,
    sealedSpecs: state.sealedSpecs,
    sealedTransactions: state.sealedTransactions,
    sealedRadar: state.sealedRadar,
  });
  const allSignals = useMemo(() => deriveSignalRows(state), [state]);
  const signalState = useMemo(() => deriveDashboardSignalState(allSignals), [allSignals]);
  const queueRow = (item, reason) => ({ ...item, title: `${item.name} - ${assetContextLabel(item)}`, detail: `${reason} - ${item.currentPrice ? formatMoney(item.currentPrice) : "Unpriced"}${item.targetValue ? ` -> ${item.source === "radar" ? "Entry" : "Target"} ${formatMoney(item.targetValue)}` : ""}` });
  const trackedItems = [...state.specs, ...state.radar, ...state.sealedSpecs, ...state.sealedRadar];
  const noteKeys = new Set();
  const notes = [...state.cardNotes]
    .sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt))
    .filter(note => {
      const key = getRelatedRecordAssetKey(note) || note.cardId || `${note.cardName}|${note.set_code}|${note.collector_number}`;
      if (noteKeys.has(key)) return false;
      noteKeys.add(key);
      return true;
    })
    .slice(0, 5)
    .map(note => {
      const item = resolveTrackedAsset(note, trackedItems);
      return { ...(item || note), title: `${note.cardName || item?.name || "General note"}${item ? ` - ${assetContextLabel(item)}` : ""}`, detail: `${String(note.text || "").slice(0, 72)} / ${date(note.createdAt || note.updatedAt)}`, static: !item };
    });
  const queues = [
    ["Exit Hits", signalState.queues.exitHits.map(item => queueRow(item, "Exit Hit")), "No exit hits."],
    ["Entry Hits", signalState.queues.entryHits.map(item => queueRow(item, "Entry Hit")), "No entry hits."],
    ["Exit Near", signalState.queues.exitNear.map(item => queueRow(item, item.status === "Exit near" ? "Exit Near" : "Exit Watch")), "Nothing near exit."],
    ["Entry Near", signalState.queues.entryNear.map(item => queueRow(item, item.status === "Entry near" ? "Entry Near" : "Entry Watch")), "Nothing near entry."],
    ["Market Checks Due", signalState.queues.marketDue.map(item => queueRow(item, "Market Check Due")), "No market checks due."],
    ["Hold Reviews Due", signalState.queues.holdDue.map(item => queueRow(item, item.status.startsWith("Hold") ? "Hold Review Due" : "Hold Missing")), "No hold reviews due."],
    ["Missing Plans", signalState.queues.missingPlans.map(item => queueRow(item, item.reasonLabel)), "Plans look filled in."],
    ["Recent Notes", notes, "No recent notes."],
  ];
  const largestPosition = summary.positionConcentration[0];
  const realizedCoverage = summary.sellTransactionCount
    ? `${summary.realizedSellCount}/${summary.sellTransactionCount} sells report realized P/L`
    : "No recorded sells yet";
  const markedCoverage = summary.unpricedPositionCount
    ? `${summary.pricedPositionCount}/${summary.openPositionCount} Positions marked`
    : `${summary.pricedPositionCount} ${summary.pricedPositionCount === 1 ? "Position" : "Positions"} marked`;
  const radarCoverage = summary.incompleteRadarPlanCount
    ? `${summary.computableRadarPlanCount} computable · ${summary.incompleteRadarPlanCount} incomplete`
    : `${summary.computableRadarPlanCount} computable plan${summary.computableRadarPlanCount === 1 ? "" : "s"}`;
  return <section className="dashboard-view">
    <ViewHeader title="Dashboard" description="Current capital, portfolio state, and what to inspect first today." />
    <div className="metric-grid dashboard-state-grid dashboard-portfolio-grid">
      <div className="metric-card"><span>Cash Available</span><strong>{formatMoney(summary.cash)}</strong><small>Current paper-trading balance</small></div>
      <div className="metric-card"><span>Capital Deployed</span><strong>{formatMoney(summary.invested)}</strong><small>{summary.invalidPositionCount ? `${summary.invalidPositionCount} unreconciled excluded` : "Valid Position cost basis"}</small></div>
      <div className="metric-card"><span>Positions Value</span><strong>{formatMoney(summary.value)}</strong><small>{largestPosition ? `Largest: ${largestPosition.name} ${largestPosition.sharePercent.toFixed(1)}%` : markedCoverage}</small></div>
      <div className={`metric-card metric-card--${summary.unrealizedProfitLoss > 0 ? "positive" : summary.unrealizedProfitLoss < 0 ? "negative" : "neutral"}`}><span>Unrealized P&amp;L</span><strong>{summary.unrealizedProfitLoss ? signedMoney(summary.unrealizedProfitLoss) : formatMoney(0)}</strong><small>{percent(summary.profitLossPercent)} · {summary.profitablePositionCount} up / {summary.losingPositionCount} down / {summary.flatPositionCount} flat</small></div>
      <div className={`metric-card metric-card--${summary.realizedProfitLoss > 0 ? "positive" : summary.realizedProfitLoss < 0 ? "negative" : "neutral"}`}><span>Recorded Realized P&amp;L</span><strong>{summary.realizedProfitLoss ? signedMoney(summary.realizedProfitLoss) : formatMoney(0)}</strong><small>{realizedCoverage}</small></div>
      <div className="metric-card"><span>Current Equity</span><strong>{formatMoney(summary.totalEquity)}</strong><small>Cash + marked Positions</small></div>
      <div className="metric-card"><span>Radar Plan Capital</span><strong>{formatMoney(summary.plannedRadarCapital)}</strong><small>{radarCoverage}</small></div>
      <button type="button" className="metric-card metric-card--action" onClick={() => navigate("/signals")}><span>Signals</span><strong>{signalState.activeCount} active</strong><small>{markedCoverage} · Open Signals</small></button>
    </div>
    <div className="scan-grid dashboard-work-grid">
      {queues.map(([title, rows, empty]) => <section className="scan-panel" key={title}>
        <h4>{title}</h4>
        {rows.length ? rows.map((item, index) => item.static
          ? <div className="scan-row dashboard-queue-row" key={`${title}-${index}`}><strong>{item.title}</strong><span>{item.detail}</span></div>
          : <button type="button" className="scan-row dashboard-queue-row attention-queue-row" key={`${title}-${item.id}-${index}`} onClick={() => setDetail(item)}><strong>{item.title}</strong><span>{item.detail}</span></button>)
          : <div className="empty-state compact">{empty}</div>}
      </section>)}
    </div>
    <CardDetail item={detail} source={detail?.source || "portfolio"} onClose={() => setDetail(null)} />
  </section>;
}
export function AdminView() {
  const { state, updateState, createBackup, parseBackupText, restoreBackup } = useAppState(); const [preview, setPreview] = useState(null); const notices = useNotices();
  const reconciliation = useMemo(() => dataFoundation.buildReconciliationReport({ specs: state.specs, transactions: state.transactions }), [state.specs, state.transactions]);
  function download() { const blob = new Blob([JSON.stringify(createBackup(), null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `manaspec-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href); notices.show("Backup exported."); }
  async function choose(event) { const file = event.target.files?.[0]; if (!file) return; const result = parseBackupText(await file.text()); if (!result.ok) notices.show(result.message, "warning"); else setPreview(result.backup); event.target.value = ""; }
  async function refresh() { try { notices.show("Refreshing Scryfall prices…"); const unique = new Map([...state.specs, ...state.radar].map(item => [item.id, item])); const result = await refreshTrackedPrices([...unique.values()]); const map = new Map(result.items.map(item => [item.id, item])); const checkedAt = new Date().toISOString(); const day = checkedAt.slice(0, 10); updateState(current => { const newSnapshots = result.items.map(item => ({ date: day, cardId: item.scryfall_id || item.id, name: item.name, set: item.set_code, foil: Boolean(item.foil), price: number(item.currentPrice), source: "scryfall", savedAt: checkedAt })).filter(snapshot => snapshot.price > 0 && !current.priceSnapshots.some(row => row.date === day && row.cardId === snapshot.cardId && Boolean(row.foil) === snapshot.foil)); return { ...current, specs: current.specs.map(item => map.get(item.id) || item), radar: current.radar.map(item => map.get(item.id) || item), priceSnapshots: [...current.priceSnapshots, ...newSnapshots], priceRefreshStatus: { checkedAt, updatedCount: result.updated } }; }); notices.show(`Updated ${result.updated} tracked printing prices.`); } catch (error) { notices.show(error.message, "warning"); } }
  return <><ViewHeader title="Admin" description="Protect local singles and sealed data and manage controlled maintenance actions." /><div className="admin-grid parity-admin-grid"><section className="admin-panel"><h4>Cash</h4><p>Reset only the paper trading cash balance. Positions, Radar, notes, and history remain intact.</p><strong>{formatMoney(state.cash)}</strong><button className="danger" onClick={() => { if (confirm("Reset cash to $10,000?")) updateState(current => ({ ...current, cash: 10000 })); }}>Reset Cash</button></section><section className="admin-panel"><h4>Data Safety</h4><p>Export a complete schema-v2 local backup, including sealed Radar, Positions, and Transactions, or restore an older compatible export.</p><div className="button-row"><button onClick={download}>Export Backup</button><label className="button secondary">Import Backup<input hidden type="file" accept="application/json,.json" onChange={choose} /></label></div></section><section className="admin-panel"><h4>Single Prices</h4><p>Refresh tracked Scryfall single prices and save today’s price-history snapshots. Sealed values remain explicit manual checks.</p><button onClick={refresh}>Run Single Price Audit</button><small>{state.priceRefreshStatus?.checkedAt ? `Last run ${new Date(state.priceRefreshStatus.checkedAt).toLocaleString()}` : "No audit recorded"}</small></section><section className="admin-panel"><h4>Sealed Valuation</h4><p>MTGJSON supplies exact product identity and TCGplayer links, but not an official sealed price feed. Save timestamped values from product detail.</p><button disabled>Automatic sealed prices unavailable</button><small>No scraping or card-price substitution</small></section></div><div className="admin-diagnostics"><section className="admin-card"><h4>Singles ledger reconciliation</h4><p>Read-only comparison of current single Positions against transaction-projected holdings.</p><dl><div><dt>Findings</dt><dd className={reconciliation.summary.findingCount ? "negative" : "positive"}>{reconciliation.summary.findingCount}</dd></div><div><dt>Matched</dt><dd>{reconciliation.summary.matched || 0}</dd></div><div><dt>Projection issues</dt><dd>{reconciliation.projectionIssues.length}</dd></div></dl></section><section className="admin-card"><h4>React storage diagnostics</h4><p>Data remains local to this browser. Use exports for durable backup and device transfer.</p><dl><div><dt>Single Positions / Radar</dt><dd>{state.specs.length} / {state.radar.length}</dd></div><div><dt>Sealed Positions / Radar</dt><dd>{state.sealedSpecs.length} / {state.sealedRadar.length}</dd></div><div><dt>Transactions</dt><dd>{state.transactions.length + state.sealedTransactions.length}</dd></div><div><dt>Price records</dt><dd>{state.priceSnapshots.length} snapshots · {state.marketObservations.length} checks</dd></div></dl></section></div><Modal open={Boolean(preview)} title="Restore ManaSpec backup?" onClose={() => setPreview(null)}>{preview && <div className="react-form"><p>This will replace current local data. An emergency pre-import copy is retained by the storage layer.</p><dl className="backup-counts">{Object.entries(preview.counts).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><div className="modal-actions"><button className="secondary" onClick={() => setPreview(null)}>Cancel</button><button onClick={() => { try { restoreBackup(preview); setPreview(null); notices.show("Backup restored."); } catch (error) { notices.show(error.message, "warning"); } }}>Restore backup</button></div></div>}</Modal><Notice notice={notices.notice} onDismiss={notices.dismiss} /></>;
}
