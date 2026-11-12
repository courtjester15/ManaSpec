import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { calculatePortfolioSummary, filterPositionRows, formatMoney, getZeroValuationWarning, selectPositionRows, selectSealedPositionRows } from "../../domain/portfolio.js";
import { ASSET_TYPES, assetContextLabel, assetTypeLabel, getAssetKey, getAssetType, getExternalMarketUrl, toTrackedSealedProduct } from "../../domain/assetIdentity.js";
import { EMPTY_CARD_FILTERS, filterTrackedCards } from "../../domain/cardFilters.js";
import { dataFoundation } from "../../domain/dataFoundation.js";
import { parsePrice, priceDistance } from "../../domain/quotes.js";
import { finishPolicy } from "../../domain/finishPolicy.js";
import { buildHistoryEvents } from "../../domain/localSearch.js";
import { getRelatedRecordsForAsset, getRelatedRecordsForPrinting, getRelatedRecordAssetKey, getRelatedRecordPrintingKey, relatedRecordMatchesAsset, resolveAssetDetail, resolveTrackedAsset } from "../../domain/relatedRecords.js";
import { deriveDashboardSignalState, deriveSignalRows, filterSignalRows, getSignalScryfallUrl, getSignalSourceNavigation, getSignalTileRows, getSignalRowsForBucket, SIGNAL_BUCKETS } from "../../domain/signals.js";
import { deletePosition } from "../../domain/trading.js";
import { activeTransactions, transactionCashAmount } from "../../domain/tradeEconomics.js";
import { MarketEvidence } from "../shared/MarketEvidence.jsx";
import { comparableJudgment } from "../../domain/marketIntelligence.js";
import { DetailTradeActions, TradeDialog } from "../shared/TradeDialog.jsx";
import { TransactionReceipt } from "../shared/TransactionReceipt.jsx";
import { applyPriceObservations, fetchPrintings, refreshTrackedPrices, searchCards, toTrackedCard } from "../../services/scryfall.js";
import { searchSealedProducts } from "../../services/mtgjson.js";
import { useAppState } from "../../state/AppState.jsx";
import { TabulatorTable } from "../shared/TabulatorTable.jsx";
const PriceHistory = lazy(() => import("../shared/PriceHistory.jsx").then(module => ({ default: module.PriceHistory })));
import { CardFilterPanel, AssetModeControl, AttentionRow, AttentionTile, TableIndicatorIcon } from "../shared/workspace.jsx";
import { compactDate, compactDateTime, compactHold, compactRarity, printingLabel } from "../../domain/display.js";
import { CardIdentity, MetricBand, MetricTile, SearchField, WorkspacePanel, Modal, Notice, TableFilterPanel, ViewHeader } from "../shared/ui.jsx";

const date = compactDate;
const number = value => Number(value || 0);
const signedMoney = value => `${number(value) >= 0 ? "+" : "-"}${formatMoney(Math.abs(number(value)))}`;
const color = item => (item.color_identity || item.colors || []).join("") || "C";
const rarity = item => compactRarity(item.rarity);
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
  const latestMarket = getRelatedRecordsForPrinting(state.marketObservations, item, trackedItems).filter(row => row.researchType !== "exit").sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt))[0];
  const target = number(owned ? item.exitTarget : item.entryTarget);
  const targetDistance = priceDistance(item.currentPrice, target);
  function editPlan(field, value) {
    updateSlice(slice, rows => rows.map(row => row.id === item.id ? { ...row, [field]: field === "holdTime" ? value : number(value) } : row));
  }
  function addNote(event) {
    event.preventDefault();
    if (!text.trim()) return;
    const now = new Date().toISOString();
    updateSlice("cardNotes", rows => [{ id: crypto.randomUUID(), cardKey: key, cardId: item.id, scryfall_id: item.scryfall_id, finish: finishPolicy.recordFinish(item), cardName: item.name, set_code: item.set_code, collector_number: item.collector_number, text: text.trim(), createdAt: now, updatedAt: now }, ...rows]);
    setText("");
  }
  const history = getRelatedRecordsForPrinting(state.priceSnapshots, item, trackedItems).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  function saveMarket(event) {
    event.preventDefault(); const price = parsePrice(market.marketPrice); if (price === null) return; const now = new Date().toISOString();
    updateSlice("marketObservations", rows => [{ id: crypto.randomUUID(), cardKey: key, cardId: item.id, scryfall_id: item.scryfall_id, finish: finishPolicy.recordFinish(item), foil: Boolean(item.foil), name: item.name, set_code: item.set_code, collector_number: item.collector_number, source: "tcgplayer", checkedAt: now, url: tcg, marketPrice: price, currentSellers: number(market.currentSellers), currentQuantity: number(market.currentQuantity), rawText: market.rawText }, ...rows]);
    setMarket({ marketPrice: "", currentSellers: "", currentQuantity: "", rawText: "" });
  }
  const comparableRows = printings.flatMap(card => finishPolicy.supportedFinishes(card).map(finish => {
    const exact = toTrackedCard(card, { finish });
    const cardId = String(card.scryfall_id || card.id).replace(/\|.*$/, "");
    return <article className="comparable-evidence" key={`${card.id}:${finish}`}><a href={`https://scryfall.com/card/${cardId}`} target="_blank" rel="noreferrer">{card.set_name} · {String(card.set || card.set_code).toUpperCase()} #{card.collector_number} · {finish}</a><strong>Scryfall reference {parsePrice(exact.currentPrice) === null ? "Unavailable" : formatMoney(exact.currentPrice)}</strong><small>Fetched this session · Release {card.released_at || "unknown"} · {comparableJudgment(item, card)}</small><details><summary>Observe and compare this exact printing</summary><MarketEvidence item={exact} /></details></article>;
  }));
  return <><Modal open title={item.name} onClose={onClose} compactDetail><div className="compact-detail">{getZeroValuationWarning(ownedItem || item) && <p className="storage-warning">Valuation review: {getZeroValuationWarning(ownedItem || item)} Value and P/L include the saved zero until an exact quote is available.</p>}<div className="compact-detail-identity"><strong>{String(item.set_code || "-").toUpperCase()} #{item.collector_number || "-"} · {{ nonfoil: "Nonfoil", foil: "Foil", etched: "Etched" }[finishPolicy.recordFinish(item)] || "Unknown finish"}</strong><span>{item.set_name || "Exact tracked printing"}</span></div>{(ownedItem || watchedItem) && <DetailTradeActions item={item} owned={ownedItem} watched={watchedItem} />}<section className="compact-detail-metrics"><div><span>Scryfall reference</span><strong>{parsePrice(item.currentPrice) === null ? "Unpriced" : formatMoney(item.currentPrice)}</strong></div><div><span>{owned ? "Cost basis" : "Entry"}</span><strong>{number(owned ? item.buyPrice : item.entryTarget) ? formatMoney(owned ? item.buyPrice : item.entryTarget) : "-"}</strong></div><div><span>Exit</span><strong>{number(item.exitTarget) ? formatMoney(item.exitTarget) : "-"}</strong></div><div><span>Quantity</span><strong>{owned ? number(item.qty) : number(item.plannedQty || 1)}</strong></div></section><div className="compact-detail-grid"><div className="compact-detail-column"><section className="compact-detail-section plan"><header><h4>Plan / Evaluation</h4><span>{targetDistance === null ? "Price or target needed" : `${percent(targetDistance)} vs target`}</span></header><div className="compact-plan-fields"><label><span>Entry</span><input type="number" step="0.01" value={item.entryTarget || ""} placeholder="Set" onChange={event => editPlan("entryTarget", event.target.value)} /></label><label><span>Exit</span><input type="number" step="0.01" value={item.exitTarget || ""} placeholder="Set" onChange={event => editPlan("exitTarget", event.target.value)} /></label>{owned && <label><span>Hold</span><input value={item.holdTime || ""} placeholder="Months" onChange={event => editPlan("holdTime", event.target.value)} /></label>}</div><div className="compact-evaluation"><span>Source <strong>{owned ? "Positions" : "Radar"}</strong></span><span>Market <strong>{parsePrice(latestMarket?.marketPrice) !== null ? formatMoney(latestMarket.marketPrice) : "No check"}</strong></span><span>Checked <strong>{latestMarket ? date(latestMarket.checkedAt) : "Due"}</strong></span></div></section><MarketEvidence item={ownedItem || watchedItem || item} /></div><div className="compact-detail-column"><section className="compact-detail-section notes"><header><h4>Notes</h4><span>{notes.length ? `${notes.length} saved` : "-"}</span></header>{notes[0] ? <article className="compact-latest-note"><small>{new Date(notes[0].updatedAt || notes[0].createdAt).toLocaleString()}</small><p>{notes[0].text}</p></article> : <p className="compact-empty">No notes yet.</p>}<form className="compact-note-form" onSubmit={addNote}><input data-autofocus={initialPanel === "notes"} value={text} onChange={event => setText(event.target.value)} placeholder="Add note" /><button type="submit">Add Note</button></form>{notes.length > 1 && <details className="compact-note-history"><summary>Show older notes ({notes.length - 1})</summary>{notes.slice(1).map(note => <p key={note.id}>{note.text}</p>)}</details>}</section><section className="compact-detail-section context"><header><h4>Card Context</h4><span>{rarity(item)} · {color(item)}</span></header><strong>{item.type_line || "Card data unavailable"}</strong><p className="compact-oracle">{item.oracle_text || "Oracle text unavailable."}</p><small>Artist: {item.artist || "-"}</small><div className="compact-detail-links"><a href={scryfall} target="_blank" rel="noreferrer">Scryfall</a><a href={tcg} target="_blank" rel="noreferrer">TCGplayer</a></div></section><section className="compact-secondary-actions"><button type="button" onClick={() => setHistoryOpen(true)}>Price History <span>{history.length}</span></button><button type="button" onClick={() => setComparablesOpen(true)}>Comparable Printings <span>{printingsStatus || printings.length}</span></button></section></div></div></div></Modal><Modal open={historyOpen} title={`${item.name} · Price History`} onClose={() => setHistoryOpen(false)} wide>{historyOpen && <Suspense fallback={<p className="muted">Loading price history…</p>}><PriceHistory rows={history} item={item} references={priceHistoryReferences} /></Suspense>}</Modal><Modal open={comparablesOpen} title={`${item.name} · Comparable Printings`} onClose={() => setComparablesOpen(false)} wide>{printingsStatus && <p className="muted">{printingsStatus}</p>}{printings.length ? <div className="comparables">{comparableRows}</div> : !printingsStatus && <p className="muted">No comparable printings found.</p>}</Modal></>;
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
  const observations = getRelatedRecordsForAsset(state.marketObservations, canonical, trackedItems).filter(row => row.researchType !== "exit").sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt));
  const latestMarket = observations.filter(row => row.researchType !== "exit")[0];
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
    const price = parsePrice(market.marketPrice);
    if (price === null) return;
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
  const currentPrice = target.currentPrice;
  const targetValue = source === "positions" ? owned?.exitTarget : target.entryTarget;
  const targetDistance = priceDistance(currentPrice, targetValue);
  const showingPosition = source === "positions" && owned;
  return <Modal open title={canonical.name} onClose={onClose} compactDetail><div className="compact-detail"><div className="compact-detail-identity"><strong><span className="asset-type-pill sealed">Sealed</span> {assetContextLabel(canonical)}</strong><span>Exact MTGJSON product · {canonical.mtgjson_uuid}</span></div>{(owned || watched) && <DetailTradeActions item={canonical} owned={owned} watched={watched} />}<section className="compact-detail-metrics"><div><span>Manual value</span><strong>{parsePrice(currentPrice) !== null ? formatMoney(currentPrice) : "Unpriced"}</strong></div><div><span>{showingPosition ? "Cost basis" : "Entry"}</span><strong>{number(showingPosition ? owned.buyPrice : target.entryTarget) ? formatMoney(showingPosition ? owned.buyPrice : target.entryTarget) : "-"}</strong></div><div><span>Exit</span><strong>{number(target.exitTarget) ? formatMoney(target.exitTarget) : "-"}</strong></div><div><span>Quantity</span><strong>{showingPosition ? number(owned.qty) : number(target.plannedQty || 1)}</strong></div></section><div className="compact-detail-grid"><div className="compact-detail-column"><section className="compact-detail-section plan"><header><h4>Plan / Evaluation</h4><span>{targetDistance === null ? "Value or target needed" : `${percent(targetDistance)} vs target`}</span></header><div className="compact-plan-fields"><label><span>Entry</span><input type="number" step="0.01" value={target.entryTarget || ""} placeholder="Set" onChange={event => editPlan("entryTarget", event.target.value)} /></label><label><span>Exit</span><input type="number" step="0.01" value={target.exitTarget || ""} placeholder="Set" onChange={event => editPlan("exitTarget", event.target.value)} /></label>{owned && <label><span>Hold</span><input value={target.holdTime || ""} placeholder="Months" onChange={event => editPlan("holdTime", event.target.value)} /></label>}</div><div className="compact-evaluation"><span>Source <strong>{showingPosition ? "Positions" : "Radar"}</strong></span><span>Valuation <strong>{target.valuationSource || "Manual only"}</strong></span><span>Checked <strong>{target.priceUpdatedAt ? date(target.priceUpdatedAt) : "Due"}</strong></span></div></section><MarketEvidence item={target} /><section className="compact-detail-section market"><header><h4>Set portfolio valuation</h4><span>{latestMarket ? `Saved ${date(latestMarket.checkedAt)}` : "No official sealed feed"}</span></header><form className="compact-market-form" onSubmit={saveMarket}><label><span>Market price</span><input required type="number" min="0" step="0.01" value={market.marketPrice} onChange={event => setMarket(current => ({ ...current, marketPrice: event.target.value }))} /></label><label><span>Sellers</span><input type="number" min="0" value={market.currentSellers} onChange={event => setMarket(current => ({ ...current, currentSellers: event.target.value }))} /></label><label><span>Quantity</span><input type="number" min="0" value={market.currentQuantity} onChange={event => setMarket(current => ({ ...current, currentQuantity: event.target.value }))} /></label><label className="raw"><span>Observation</span><input value={market.rawText} onChange={event => setMarket(current => ({ ...current, rawText: event.target.value }))} placeholder="Condition, shipping, or market context" /></label><button type="submit">Save value</button></form></section></div><div className="compact-detail-column"><section className="compact-detail-section notes"><header><h4>Notes</h4><span>{notes.length ? `${notes.length} saved` : "-"}</span></header>{notes[0] ? <article className="compact-latest-note"><small>{new Date(notes[0].updatedAt || notes[0].createdAt).toLocaleString()}</small><p>{notes[0].text}</p></article> : <p className="compact-empty">No notes yet.</p>}<form className="compact-note-form" onSubmit={addNote}><input value={text} onChange={event => setText(event.target.value)} placeholder="Add product thesis or check note" /><button type="submit">Add Note</button></form>{notes.length > 1 && <details className="compact-note-history"><summary>Show older notes ({notes.length - 1})</summary>{notes.slice(1).map(note => <p key={note.id}>{note.text}</p>)}</details>}</section><section className="compact-detail-section context"><header><h4>Product Context</h4><span>{canonical.releaseDate || "Release unknown"}</span></header><strong>{String(canonical.productType || canonical.category || "Sealed product").replaceAll("_", " ")}</strong><p className="compact-oracle">{canonical.contentsSummary || "Contents summary unavailable in the trimmed catalog."}</p><small>TCGplayer product ID: {canonical.tcgplayerProductId || "Unavailable"}</small><div className="compact-detail-links">{marketUrl && <a href={marketUrl} target="_blank" rel="noreferrer">Exact TCGplayer product</a>}</div></section><section className="compact-detail-section context"><header><h4>Valuation History</h4><span>{observations.length} checks</span></header>{observations.length ? observations.slice(0, 6).map(row => <p key={row.id}><strong>{parsePrice(row.marketPrice) === null ? "Unpriced" : formatMoney(row.marketPrice)}</strong> · {new Date(row.checkedAt).toLocaleString()}</p>) : <p className="compact-empty">Save a manual market check to establish a timestamped valuation.</p>}</section></div></div></div></Modal>;
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
  const searchRef = useRef(null);
  const requestRef = useRef(0);
  useEffect(() => {
    const dismiss = event => {
      if (event.key === "Escape" || (event.type === "pointerdown" && !searchRef.current?.contains(event.target))) {
        requestRef.current += 1;
        setResults([]);
        setStatus("");
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismiss);
    return () => {
      requestRef.current += 1;
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", dismiss);
    };
  }, []);
  async function submit(event) {
    const request = ++requestRef.current;
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
      if (request !== requestRef.current) return;
      setResults(combined); setStatus(combined.length ? "" : "No matching paper singles or sealed products found.");
    }
    catch (error) { if (request === requestRef.current) setStatus(error.message); }
  }
  function choose(item) {
    requestRef.current += 1;
    setResults([]);
    setStatus("");
    setChoice(item);
  }
  function changeQuery(value) {
    requestRef.current += 1;
    setQuery(value);
    setResults([]);
    setStatus("");
  }
  return <section ref={searchRef} className="search-panel workspace-discovery-panel"><form onSubmit={submit}><AssetModeControl value={assetMode} label="Search asset type" options={[["single", "Singles"], ["sealed", "Sealed"], ["all", "All"]]} onChange={value => { requestRef.current += 1; setAssetMode(value); setResults([]); setStatus(""); }} /><SearchField label="Search / Add Candidate" value={query} onChange={changeQuery} placeholder={assetMode === "sealed" ? "Find product or set, e.g. BLB play booster" : "Find card, product, or set"} /><button type="submit" className="search-submit">Search</button></form>{status && <p className="muted" role="status">{status}</p>}{results.length > 0 && <div className="search-results">{results.map(item => <button type="button" key={`${getAssetType(item)}:${item.id}`} onClick={() => choose(item)}><span>{item.image_uris?.small && <img src={item.image_uris.small} alt="" />}<strong>{item.name}</strong></span><small><span className={`asset-type-pill ${getAssetType(item)}`}>{assetTypeLabel(item)}</span> {getAssetType(item) === ASSET_TYPES.SEALED ? `${item.set_name} · ${item.set_code} · ${String(item.productType || item.category || "Product").replaceAll("_", " ")} · Manual valuation` : `${item.set_name} · ${item.set.toUpperCase()} #${item.collector_number} · ${item.prices.usd ? formatMoney(item.prices.usd) : "No nonfoil price"}${item.prices.usd_foil ? ` · Foil ${formatMoney(item.prices.usd_foil)}` : ""}`}</small></button>)}</div>}<Modal open={Boolean(choice)} title={getAssetType(choice) === ASSET_TYPES.SEALED ? "Add exact sealed product" : "Add exact printing"} onClose={() => setChoice(null)}>{choice && (getAssetType(choice) === ASSET_TYPES.SEALED ? <AddSealedCandidateForm product={choice} onCancel={() => setChoice(null)} onAdd={options => { onAdd(toTrackedSealedProduct(choice, options)); setChoice(null); }} /> : <AddCandidateForm card={choice} onCancel={() => setChoice(null)} onAdd={options => { onAdd(toTrackedCard(choice, options)); setChoice(null); }} />)}</Modal></section>;
}

function AddCandidateForm({ card, onAdd, onCancel }) {
  const finishes = finishPolicy.supportedFinishes(card);
  const [finish, setFinish] = useState(finishes.length === 1 ? finishes[0] : ""); const [plannedQty, setQty] = useState(1); const [entryTarget, setEntry] = useState("");
  return <form className="react-form" onSubmit={event => { event.preventDefault(); onAdd({ finish: finishPolicy.selectFinish(card, finish), plannedQty, entryTarget }); }}><div className="trade-card-line"><strong>{card.name}</strong><span>{card.set_name} · #{card.collector_number}</span></div><div className="form-grid"><label><span>Finish</span><select required value={finish} disabled={finishes.length <= 1} onChange={event => setFinish(event.target.value)}>{finishes.length !== 1 && <option value="">Choose finish</option>}{finishes.map(value => <option key={value} value={value}>{value === "nonfoil" ? "Nonfoil" : value === "foil" ? "Foil" : "Etched"}</option>)}</select>{!finishes.length && <small>Supported finishes unavailable. Reload this printing.</small>}</label><label><span>Planned quantity</span><input type="number" min="1" value={plannedQty} onChange={event => setQty(event.target.value)} /></label><label><span>Entry target</span><input type="number" min="0" step="0.01" value={entryTarget} onChange={event => setEntry(event.target.value)} placeholder="Optional" /></label></div><div className="modal-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button type="submit" disabled={!finishes.includes(finish)}>Add to Radar</button></div></form>;
}

function AddSealedCandidateForm({ product, onAdd, onCancel }) {
  const [plannedQty, setQty] = useState(1); const [entryTarget, setEntry] = useState("");
  return <form className="react-form" onSubmit={event => { event.preventDefault(); onAdd({ plannedQty, entryTarget }); }}><div className="trade-card-line"><strong>{product.name}</strong><span>{assetContextLabel(product)} · MTGJSON {product.mtgjson_uuid}</span></div><p className="muted">ManaSpec could not verify an official sealed price feed. This product starts unpriced; record a timestamped manual market check before using value or P/L.</p><div className="form-grid"><label><span>Planned quantity</span><input type="number" min="1" value={plannedQty} onChange={event => setQty(event.target.value)} /></label><label><span>Entry target</span><input type="number" min="0" step="0.01" value={entryTarget} onChange={event => setEntry(event.target.value)} placeholder="Optional" /></label></div><div className="modal-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button type="submit">Add to Radar</button></div></form>;
}



export function RadarView() {
  const { state, updateSlice, updateState } = useAppState(); const [params, setParams] = useSearchParams(); const [filters, setFilters] = useState({ ...EMPTY_CARD_FILTERS }); const [assetMode, setAssetMode] = useState("all"); const [pageSize, setPageSize] = useState(25); const [trade, setTrade] = useState(null); const [detail, setDetail] = useState(null); const [detailPanel, setDetailPanel] = useState(""); const notices = useNotices();
  const focusId = params.get("focus") || "";
  const detailRequest = params.get("detail") || "";
  const sealedRows = filterTrackedCards(state.sealedRadar.filter(item => !focusId || item.id === focusId), filters, { source: "radar" });
  const rows = [...(assetMode === "sealed" ? [] : filterTrackedCards(state.radar.filter(item => !focusId || item.id === focusId), filters, { source: "radar" })), ...(assetMode === "single" ? [] : sealedRows)];
  function add(item) { const slice = getAssetType(item) === ASSET_TYPES.SEALED ? "sealedRadar" : "radar"; if (state[slice].some(row => getAssetKey(row) === getAssetKey(item))) return notices.show(`${item.name} is already on Radar.`, "warning"); updateSlice(slice, list => [item, ...list]); notices.show(`${item.name} added to Radar.`); }
  function updateRadar(item, changes) { const slice = getAssetType(item) === ASSET_TYPES.SEALED ? "sealedRadar" : "radar"; updateSlice(slice, list => list.map(row => getAssetKey(row) === getAssetKey(item) ? { ...row, ...changes } : row)); }
  const trackedItems = [...state.specs, ...state.radar, ...state.sealedSpecs, ...state.sealedRadar];
  function latestMarket(item) { return getRelatedRecordsForAsset(state.marketObservations, item, trackedItems).filter(row => row.researchType !== "exit").sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt))[0]; }
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
    { key: "assetType", label: "Class", align: "center", width: 44, widthShrink: 0, render: item => <span className={`asset-type-pill ${getAssetType(item)}`}>{assetTypeLabel(item)}</span> },
    { key: "set_code", label: "Set", align: "center", width: 48, widthShrink: 0, format: item => String(item.set_code || "-").toUpperCase(), title: item => item.set_name || "" },
    { key: "collector_number", label: "Detail", align: "center", width: 76, widthShrink: 0, format: item => getAssetType(item) === ASSET_TYPES.SEALED ? String(item.productType || item.category || "Product").replaceAll("_", " ") : printingLabel(item) },
    { key: "rarity", label: "Rarity", align: "center", width: 54, widthShrink: 0, format: item => getAssetType(item) === ASSET_TYPES.SEALED ? "-" : item.rarity ? item.rarity[0].toUpperCase() : "-" },
    { key: "color", label: "Color", align: "center", width: 52, widthShrink: 0, format: color },
    { key: "currentPrice", label: "Value", align: "money", width: 72, widthShrink: 0, sortValue: item => number(item.currentPrice), format: item => compactMoney(item.currentPrice), title: item => getAssetType(item) === ASSET_TYPES.SEALED ? item.priceUpdatedAt ? `Manual valuation saved ${new Date(item.priceUpdatedAt).toLocaleString()}` : "Unpriced: save a manual market check in detail" : getZeroValuationWarning(item.sourceRecord || item) || "Scryfall market value" },
    { key: "addedDate", label: "Added", align: "center", width: 58, widthShrink: 0, sortValue: item => item.addedDate ? new Date(item.addedDate).getTime() : 0, format: item => date(item.addedDate), title: item => item.addedDate ? new Date(item.addedDate).toLocaleString() : "No added date" },
    { key: "entryTarget", label: "Entry", align: "money", width: 74, widthShrink: 0, sortValue: item => number(item.entryTarget), format: item => number(item.entryTarget) ? compactMoney(item.entryTarget) : "Set", formatClass: "muted", editor: "number", editorParams: { min: 0, step: .01 }, onEdit: (item, value) => updateRadar(item, { entryTarget: Math.max(0, number(value)) }) },
    { key: "distance", label: "Δ Target", align: "money", width: 72, widthShrink: 0, sortValue: item => priceDistance(item.currentPrice, item.entryTarget) ?? 999, render: item => { const distance = priceDistance(item.currentPrice, item.entryTarget); return <span className={distance === null ? "muted" : distance <= 0 ? "positive" : "negative"}>{distance === null ? "-" : `${distance > 0 ? "+" : ""}${distance.toFixed(1)}%`}</span>; } },
    { key: "plannedQty", label: "Want", align: "center", width: 68, widthShrink: 0, sortValue: item => number(item.plannedQty), render: item => { const qty = Math.max(1, number(item.plannedQty)); return <div className="ms-tabulator-stepper"><button type="button" aria-label={`Decrease planned quantity for ${item.name}`} disabled={qty <= 1} onClick={() => updateRadar(item, { plannedQty: Math.max(1, qty - 1) })}>−</button><span>{qty}</span><button type="button" aria-label={`Increase planned quantity for ${item.name}`} onClick={() => updateRadar(item, { plannedQty: qty + 1 })}>+</button></div>; } },
    { key: "sellers", label: "Sellers", align: "center", width: 58, widthShrink: 0, sortValue: item => number(latestMarket(item)?.currentSellers), format: item => latestMarket(item)?.currentSellers ?? "-" },
    { key: "marketQty", label: "Qty", align: "center", width: 50, widthShrink: 0, sortValue: item => number(latestMarket(item)?.currentQuantity), format: item => latestMarket(item)?.currentQuantity ?? "-" },
    { key: "tcg", label: "TCG Check", align: "money", width: 78, widthShrink: 0, sortValue: item => number(latestMarket(item)?.marketPrice), format: item => parsePrice(latestMarket(item)?.marketPrice) !== null ? compactMoney(latestMarket(item).marketPrice) : "-", title: item => latestMarket(item)?.checkedAt ? `Saved ${new Date(latestMarket(item).checkedAt).toLocaleString()}` : "No saved manual TCGplayer Market Check" },
    { key: "notes", label: "Notes", align: "center", width: 54, widthShrink: 0, sortValue: noteCount, render: item => { const count = noteCount(item); return <button type="button" className={`ms-tabulator-indicator${count ? " active" : ""}`} aria-label={`${count || "No"} notes for ${item.name}`} onClick={() => openDetail(item, "notes")}><TableIndicatorIcon type="notes" />{count > 0 && <sup>{count}</sup>}</button>; } },
    { key: "history", label: "History", align: "center", width: 62, widthShrink: 0, sortValue: historyCount, render: item => { const count = historyCount(item); return <button type="button" className={`ms-tabulator-indicator${count ? " active" : ""}`} aria-label={`${count || "No"} price history snapshots for ${item.name}`} onClick={() => openDetail(item, "history")}><TableIndicatorIcon type="history" />{count > 0 && <sup>{count}</sup>}</button>; } },
    { key: "actions", label: "Actions", sort: false, align: "actions", width: 112, widthShrink: 0, render: item => <div className="table-actions"><button onClick={() => setTrade({ item, defaultQuantity: item.plannedQty || 1 })}>Buy</button><button className="danger ghost" onClick={() => { if (confirm(`Remove ${item.name} from Radar? This only removes the watched idea; it will not affect owned Positions.`)) { const slice = getAssetType(item) === ASSET_TYPES.SEALED ? "sealedRadar" : "radar"; updateSlice(slice, list => list.filter(row => getAssetKey(row) !== getAssetKey(item))); } }}>Remove</button></div> },
  ];
  const allRadar = [...state.radar, ...state.sealedRadar];
  const radarNotes = state.cardNotes.filter(note => allRadar.some(item => relatedRecordMatchesAsset(note, item, trackedItems))).length;
  return <><ViewHeader title="Radar" description="Watch singles and exact sealed products before money is committed. Buying creates or updates a Position while Radar keeps watching." /><MetricBand className="radar-context" leading={<SearchPanel initialQuery={params.get("query") || ""} onAdd={add} />} items={[{ label: "Watching", value: allRadar.length, detail: `${state.radar.length} singles · ${state.sealedRadar.length} sealed`, preview: allRadar[0]?.name || "No watched ideas" }, { label: "Planned Entries", value: allRadar.filter(item => number(item.entryTarget) || number(item.plannedQty) > 1).length, detail: "Entry target or staged qty", preview: "Opportunity tracking" }, { label: "Notes", value: radarNotes, detail: "Linked decision notes", preview: radarNotes ? "Context attached" : "Needs plan" }]} /><CardFilterPanel scope={<AssetModeControl value={assetMode} onChange={setAssetMode} label="Filter Radar by asset type" />} totalCount={allRadar.length} filters={filters} onChange={updater => { if (focusId) setParams({}); setFilters(updater); }} onClear={() => { setParams({}); setFilters({ ...EMPTY_CARD_FILTERS }); setAssetMode("all"); }} shownCount={rows.length} pageSize={pageSize} onPageSizeChange={setPageSize} /><TabulatorTable columns={columns} rows={rows} onRowClick={item => openDetail(item)} tableClass="ms-tabulator--radar" ariaLabel="Radar ideas" empty="Search above and add exact singles or sealed products to start tracking ideas." initialSort={[{ column: "name", dir: "asc" }]} pageSize={pageSize} /><TradeDialog trade={trade} onClose={() => setTrade(null)} onSaved={qty => notices.show(`Bought ${qty} ${trade.item.name}. Radar will keep watching it.`)} /><CardDetail item={detail} source="radar" initialPanel={detailPanel} onClose={() => { setDetail(null); setDetailPanel(""); }} /><Notice notice={notices.notice} onDismiss={notices.dismiss} /></>;
}

export function PositionsView() {
  const { state, updateSlice, updateState } = useAppState(); const [params, setParams] = useSearchParams(); const [filters, setFilters] = useState({ ...EMPTY_CARD_FILTERS }); const [pageSize, setPageSize] = useState(25); const [assetMode, setAssetMode] = useState("all"); const [trade, setTrade] = useState(null); const [detail, setDetail] = useState(null); const [detailPanel, setDetailPanel] = useState(""); const notices = useNotices();
  const focusId = params.get("focus") || "";
  const detailRequest = params.get("detail") || "";
  const trackedItems = [...state.specs, ...state.radar, ...state.sealedSpecs, ...state.sealedRadar];
  const singleRows = selectPositionRows(state.specs, { getNotesCount: item => getRelatedRecordsForAsset(state.cardNotes, item, trackedItems).length, getHistoryCount: item => getRelatedRecordsForPrinting(state.priceSnapshots, item, trackedItems).length });
  const sealedPositionRows = selectSealedPositionRows(state.sealedSpecs, { getNotesCount: item => getRelatedRecordsForAsset(state.cardNotes, item, trackedItems).length, getHistoryCount: item => getRelatedRecordsForAsset(state.marketObservations, item, trackedItems).length });
  const positionRows = [...singleRows, ...sealedPositionRows];
  const summary = calculatePortfolioSummary(state.specs, state.cash, { sealedSpecs: state.sealedSpecs, transactions: state.transactions, sealedTransactions: state.sealedTransactions }); const eligibleIds = new Set(filterTrackedCards(positionRows.map(row => row.sourceRecord), filters, { source: "positions" }).map(row => row.id)); const rows = filterPositionRows(positionRows.filter(row => (assetMode === "all" || row.assetType === assetMode) && eligibleIds.has(row.id)), { focusId });
  useEffect(() => {
    if (!focusId || !detailRequest) return;
    const row = positionRows.find(item => item.id === focusId);
    if (row?.validation.valid) setDetail(row.sourceRecord);
  }, [detailRequest, focusId, state.specs, state.sealedSpecs]);
  const edit = (item, key, value) => { const slice = item.assetType === ASSET_TYPES.SEALED ? "sealedSpecs" : "specs"; updateSlice(slice, list => list.map(row => getAssetKey(row) === item.assetKey ? { ...row, [key]: key === "holdTime" ? value : number(value) } : row)); };
  const columns = [
    { key: "name", label: "Asset", minWidth: 170, widthGrow: 1, widthShrink: 1, render: item => <button className="table-link" aria-label={`Open details for ${item.name}, ${assetContextLabel(item)}`} disabled={!item.validation.valid} onClick={() => setDetail(item.sourceRecord)}><CardIdentity item={item} />{!item.validation.valid && <ReconciliationValue row={item} />}</button> },
    { key: "assetType", label: "Class", align: "center", width: 44, widthShrink: 0, render: item => <span className={`asset-type-pill ${item.assetType}`}>{assetTypeLabel(item)}</span> },
    { key: "set_code", label: "Set", align: "center", width: 44, widthShrink: 0, format: item => String(item.set_code || "-").toUpperCase(), title: item => item.set_name || "" },
    { key: "collector_number", label: "Detail", align: "center", width: 76, widthShrink: 0, format: item => item.assetType === ASSET_TYPES.SEALED ? String(item.productType || "Product").replaceAll("_", " ") : printingLabel(item) },
    { key: "rarity", label: "Rarity", align: "center", width: 52, widthShrink: 0, format: rarity, title: item => item.rarity || "Rarity unavailable" },
    { key: "color", label: "Color", align: "center", width: 50, widthShrink: 0, format: color },
    { key: "averageBuyPrice", label: "Buy", align: "money", width: 60, widthShrink: 0, sortValue: item => item.averageBuyPrice ?? -1, render: item => item.averageBuyPrice === null ? <ReconciliationValue row={item} /> : formatMoney(item.averageBuyPrice) },
    { key: "currentPrice", label: "Now", align: "money", width: 60, widthShrink: 0, sortValue: item => item.currentPrice ?? -1, format: item => item.currentPrice === null || item.currentPrice < 0 ? "-" : formatMoney(item.currentPrice), title: item => item.assetType === ASSET_TYPES.SEALED ? item.priceUpdatedAt ? `Manual valuation saved ${new Date(item.priceUpdatedAt).toLocaleString()}` : "Unpriced: open detail to save a manual value" : getZeroValuationWarning(item.sourceRecord || item) || "Scryfall market value" },
    { key: "quantity", label: "Qty", align: "center", width: 40, minWidth: 40, widthShrink: 0, sortValue: item => item.quantity ?? -1, render: item => item.quantity === null ? <ReconciliationValue row={item} /> : item.quantity },
    { key: "age", label: "Age", align: "center", width: 42, widthShrink: 0, sortValue: item => item.acquiredAt ? ageDays(item.acquiredAt) : -1, render: item => item.acquiredAt ? `${ageDays(item.acquiredAt)}d` : <ReconciliationValue row={item} /> },
    { key: "added", label: "Added", align: "center", width: 64, widthShrink: 0, sortValue: item => item.acquiredAt ? new Date(item.acquiredAt).getTime() : -1, render: item => item.acquiredAt ? date(item.acquiredAt) : <ReconciliationValue row={item} /> },
    { key: "value", label: "Value", align: "money", width: 60, widthShrink: 0, sortValue: item => item.validation.calculationEligible ? item.quantity * item.currentPrice : -1, format: item => item.validation.calculationEligible ? formatMoney(item.quantity * item.currentPrice) : "-" },
    { key: "pl", label: "P/L", align: "money", width: 66, widthShrink: 0, sortValue: item => item.validation.calculationEligible ? (item.currentPrice - item.averageBuyPrice) * item.quantity : -Infinity, render: item => item.validation.calculationEligible ? <span className={item.currentPrice >= item.averageBuyPrice ? "positive" : "negative"}>{signedMoney((item.currentPrice - item.averageBuyPrice) * item.quantity)}</span> : "-" },
    { key: "plPct", label: "P/L %", align: "money", width: 58, widthShrink: 0, sortValue: item => item.validation.calculationEligible ? ((item.currentPrice - item.averageBuyPrice) / item.averageBuyPrice) * 100 : -Infinity, format: item => item.validation.calculationEligible ? percent(((item.currentPrice - item.averageBuyPrice) / item.averageBuyPrice) * 100) : "-" },
    { key: "exitTarget", label: "Target", align: "money", width: 68, widthShrink: 0, sortValue: item => number(item.exitTarget), format: item => number(item.exitTarget) ? number(item.exitTarget).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "Set", editor: "number", editorParams: { min: 0, step: .01 }, onEdit: (item, value) => edit(item, "exitTarget", value) },
    { key: "distance", label: "Δ", align: "money", width: 52, widthShrink: 0, sortValue: item => number(item.exitTarget) && number(item.currentPrice) ? ((number(item.currentPrice) - number(item.exitTarget)) / number(item.exitTarget)) * 100 : 999, format: item => priceDistance(item.currentPrice, item.exitTarget) !== null ? percent(priceDistance(item.currentPrice, item.exitTarget)) : "-" },
    { key: "holdTime", label: "Hold", align: "center", width: 62, widthShrink: 0, sortValue: item => item.holdTime || "", format: item => compactHold(item.holdTime), editor: "input", onEdit: (item, value) => edit(item, "holdTime", value) },
    { key: "notes", label: "Notes", align: "center", width: 52, widthShrink: 0, sortValue: item => item.notesCount, render: item => <button type="button" className="workspace-indicator" disabled={!item.validation.valid} aria-label={`Open Notes for ${item.name}`} onClick={() => { setDetailPanel("notes"); setDetail(item.sourceRecord); }}><TableIndicatorIcon type="notes" />{item.notesCount || ""}</button> },
    { key: "history", label: "History", align: "center", width: 60, widthShrink: 0, sortValue: item => item.historyCount, render: item => <button type="button" className="workspace-indicator" disabled={!item.validation.valid} aria-label={`Open Price History for ${item.name}`} onClick={() => { setDetailPanel("history"); setDetail(item.sourceRecord); }}><TableIndicatorIcon type="history" />{item.historyCount || ""}</button> },
    { key: "actions", label: "Actions", sort: false, align: "actions", width: 148, widthShrink: 0, render: item => item.validation.valid ? <div className="table-actions"><button onClick={() => setTrade({ item: item.sourceRecord, more: true })}>Buy more</button><button className="danger" onClick={() => setTrade({ item: item.sourceRecord, mode: "SELL" })}>Sell</button><button className="danger ghost" onClick={() => removePosition(item.sourceRecord)}>Del</button></div> : <ReconciliationValue row={item} /> },
  ];
  function removePosition(item) { if (!confirm(`Delete ${item.name} from Positions? This removes the current position without logging a transaction.`)) return; try { updateState(current => deletePosition(current, item)); notices.show(`${item.name} deleted from Positions. No transaction was logged.`, "warning"); } catch (error) { notices.show(error.message, "warning"); } }
  const positionNotes = state.cardNotes.filter(note => [...state.specs, ...state.sealedSpecs].some(item => relatedRecordMatchesAsset(note, item, trackedItems))).length;
  return <><ViewHeader title="Positions" description="Owned singles and sealed products. Unpriced sealed holdings remain visible but are excluded from value and P/L." /><MetricBand items={[{ label: "Portfolio Value", value: formatMoney(summary.value), detail: "Current marked value", preview: summary.unpricedPositionCount ? `${summary.unpricedPositionCount} unpriced or unreconciled` : `${summary.openPositionCount} owned rows` }, { label: "Capital Deployed", value: formatMoney(summary.invested), detail: "Valid open-position cost basis", preview: summary.invalidPositionCount ? "Invalid rows excluded" : "Owned portfolio state" }, { label: "Open Positions", value: summary.openPositionCount, detail: `${state.specs.length} singles · ${state.sealedSpecs.length} sealed`, preview: summary.invalidPositionCount ? `${summary.invalidPositionCount} invalid ${summary.invalidPositionCount === 1 ? "record" : "records"}` : positionRows[0]?.name || "No open positions" }, { label: "Notes", value: positionNotes, detail: "Linked decision notes", preview: positionNotes ? "Context attached" : "No notes yet" }]} /><CardFilterPanel title="Filter Positions" filters={filters} onChange={updater => { if (focusId) setParams({}); setFilters(updater); }} onClear={() => { setParams({}); setFilters({ ...EMPTY_CARD_FILTERS }); setAssetMode("all"); }} shownCount={rows.length} totalCount={positionRows.length} pageSize={pageSize} onPageSizeChange={setPageSize} scope={<AssetModeControl value={assetMode} onChange={setAssetMode} label="Filter Positions by asset type" />} /><TabulatorTable columns={columns} rows={rows} onRowClick={item => { if (item.validation.valid) setDetail(item.sourceRecord); }} tableClass="ms-tabulator--positions" ariaLabel="Owned Positions" pageSize={pageSize} empty="No Positions to show. Clear any filters, or buy an idea from Radar to begin." initialSort={[{ column: "name", dir: "asc" }]} /><TradeDialog trade={trade} onClose={() => setTrade(null)} onSaved={qty => notices.show(`${trade.mode === "SELL" ? "Sold" : "Bought"} ${qty} ${trade.item.name}.`)} /><CardDetail item={detail} source="positions" initialPanel={detailPanel || detailRequest} onClose={() => { setDetail(null); setDetailPanel(""); }} /><Notice notice={notices.notice} onDismiss={notices.dismiss} /></>;
}


function SignalActionBand({ rows, bucketId, printingId, query, onQuery, pageSize, onPageSizeChange, onBucket, onPrinting, onReset }) {
  return <section className="signals-action-band" aria-label="Signals action center"><div className="signals-action-tiles">{SIGNAL_BUCKETS.map(bucket => { const preview = getSignalTileRows(rows, bucket.id); return <AttentionTile key={bucket.id} title={bucket.label} detail={bucket.detail} count={getSignalRowsForBucket(rows, bucket.id).length} shown={preview.length} active={bucketId === bucket.id} onSelect={() => onBucket(bucket.id)}>{preview.length ? preview.map(row => <AttentionRow key={row.id} item={row} bucketId={bucket.id} selected={printingId === row.id && bucketId === bucket.id} onActivate={() => onPrinting(bucket.id, row.id)} />) : <p className="workspace-empty">No cards</p>}</AttentionTile>; })}<article className="signals-action-utility"><span>Attention</span><strong>{filterSignalRows(rows).length} Active</strong><SearchField className="signals-action-search" label="Filter Signals" value={query} onChange={onQuery} placeholder="Card or reason" hideLabel /><button type="button" className="filter-reset-btn" disabled={!bucketId && !printingId && !query} onClick={onReset}>Show all</button><label className="table-page-size-control"><span>Rows</span><select aria-label="Rows per page" value={pageSize} onChange={event => onPageSizeChange(Number(event.target.value))}><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label></article></div></section>;
}

export function SignalsView() {
  const { state } = useAppState(); const navigate = useNavigate(); const [filter, setFilter] = useState(""); const [bucketId, setBucketId] = useState(""); const [printingId, setPrintingId] = useState(""); const [pageSize, setPageSize] = useState(25); const [detail, setDetail] = useState(null); const allRows = useMemo(() => deriveSignalRows(state), [state]); const rows = filterSignalRows(allRows, { bucketId, printingId, query: filter });
  const columns = [
    { key: "name", label: "Asset", minWidth: 170, widthGrow: 1, widthShrink: 1, render: item => <button className="table-link" aria-label={`Open details for ${item.name}, ${assetContextLabel(item)}`} onClick={() => setDetail(item)}><CardIdentity item={item} /></button> },
    { key: "assetType", label: "Class", align: "center", width: 44, widthShrink: 0, render: item => <span className={`asset-type-pill ${getAssetType(item)}`}>{assetTypeLabel(item)}</span> },
    { key: "set_code", label: "Set", align: "center", width: 48, widthShrink: 0, format: item => String(item.set_code || "-").toUpperCase() },
    { key: "collector_number", label: "Detail", align: "center", width: 76, widthShrink: 0, format: item => getAssetType(item) === ASSET_TYPES.SEALED ? String(item.productType || "Product").replaceAll("_", " ") : printingLabel(item) },
    { key: "foil", label: "Fin", align: "center", width: 44, widthShrink: 0, format: item => ({ nonfoil: "N", foil: "F", etched: "E" }[finishPolicy.recordFinish(item)] || "-") },
    { key: "sourceLabel", label: "Source", align: "center", width: 68, widthShrink: 0 },
    { key: "actionLabel", label: "Action", align: "center", width: 112, widthShrink: 0 },
    { key: "reasonLabel", label: "Why", align: "center", width: 148, widthShrink: 0, title: item => item.reasonDetail, render: item => <span className={`status-pill ${item.buckets.includes("targetsHit") ? "action" : ""}`}>{item.reasonLabel}</span> },
    { key: "currentPrice", label: "Now", align: "money", width: 58, widthShrink: 0, sortValue: item => number(item.currentPrice), format: item => formatMoney(item.currentPrice) },
    { key: "targetValue", label: "Target", align: "money", width: 68, widthShrink: 0, sortValue: item => number(item.targetValue), format: item => item.targetValue ? formatMoney(item.targetValue) : "-" },
    { key: "change", label: "Δ Target", align: "money", width: 86, widthShrink: 0, sortValue: item => item.change, format: item => item.change !== null ? percent(item.change) : "-" },
    { key: "marketFreshness", label: "Market", align: "center", width: 76, widthShrink: 0, sortValue: item => item.marketAgeSort, title: item => item.marketDetail },
    { key: "actions", label: "Actions", sort: false, align: "actions", width: 148, widthShrink: 0, render: item => <div className="table-actions"><button onClick={() => setDetail(item)}>Detail</button><button onClick={() => navigate(getSignalSourceNavigation(item))}>View</button><a className="button secondary" href={getSignalScryfallUrl(item)} target="_blank" rel="noreferrer">{getAssetType(item) === ASSET_TYPES.SEALED ? "Market" : "Scryfall"}</a></div> },
  ];
  function showBucket(nextBucket) { setBucketId(nextBucket); setPrintingId(""); }
  function showPrinting(nextBucket, nextPrinting) { setBucketId(nextBucket); setPrintingId(nextPrinting); }
  function showAll() { setBucketId(""); setPrintingId(""); setFilter(""); }
  return <><ViewHeader title="Signals" description="What needs attention today across Radar and Positions." /><SignalActionBand rows={allRows} bucketId={bucketId} printingId={printingId} query={filter} onQuery={setFilter} pageSize={pageSize} onPageSizeChange={setPageSize} onBucket={showBucket} onPrinting={showPrinting} onReset={showAll} /><TabulatorTable columns={columns} rows={rows} onRowClick={setDetail} tableClass="ms-tabulator--signals" ariaLabel="Signals attention" empty="No Signals rows match this attention filter." initialSort={[{ column: "name", dir: "asc" }]} pageSize={pageSize} /><CardDetail item={detail} source={detail?.source === "radar" ? "radar" : "positions"} onClose={() => setDetail(null)} /></>;
}

export function TransactionsView() {
  const { state } = useAppState(); const [params, setParams] = useSearchParams(); const [filter, setFilter] = useState(""); const [type, setType] = useState(""); const [assetMode, setAssetMode] = useState("all"); const [pageSize, setPageSize] = useState(25); const [detail, setDetail] = useState(null); const [receipt, setReceipt] = useState(null); const focusId = params.get("focus") || "";
  const trackedItems = [...state.specs, ...state.radar, ...state.sealedSpecs, ...state.sealedRadar];
  const allTransactions = [...state.transactions, ...state.sealedTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const rows = allTransactions.filter(tx => (!focusId || String(tx.id) === focusId) && (!type || tx.type === type) && (assetMode === "all" || getAssetType(tx) === assetMode) && [tx.name, tx.set_code, tx.productType, tx.notes, tx.trade?.source, tx.trade?.reference, tx.type, assetTypeLabel(tx)].join(" ").toLowerCase().includes(filter.toLowerCase()));
  const active = activeTransactions(allTransactions);
  const activeIds = new Set(active.map(tx => tx.id));
  const buys = active.filter(tx => tx.type === "BUY"); const sells = active.filter(tx => tx.type === "SELL");
  function openTransactionDetail(item) {
    const asset = resolveAssetDetail(item, trackedItems);
    if (asset) setDetail(asset);
  }
  const columns = [
    { key: "name", label: "Asset", minWidth: 170, widthGrow: 1, widthShrink: 1, render: item => resolveAssetDetail(item, trackedItems) ? <button className="table-link" aria-label={`Open details for ${item.name}, ${assetContextLabel(item)}`} onClick={() => openTransactionDetail(item)}><CardIdentity item={item} /></button> : <CardIdentity item={item} /> },
    { key: "assetType", label: "Class", align: "center", width: 44, widthShrink: 0, render: item => <span className={`asset-type-pill ${getAssetType(item)}`}>{assetTypeLabel(item)}</span> },
    { key: "set_code", label: "Set", align: "center", width: 48, widthShrink: 0, format: item => String(item.set_code || "-").toUpperCase() },
    { key: "collector_number", label: "Detail", align: "center", width: 78, widthShrink: 0, format: item => getAssetType(item) === ASSET_TYPES.SEALED ? String(item.productType || "Product").replaceAll("_", " ") : printingLabel(item) },
    { key: "rarity", label: "Rarity", align: "center", width: 44, widthShrink: 0, format: rarity, title: item => item.rarity || "Rarity unavailable" },
    { key: "color", label: "Color", align: "center", width: 44, widthShrink: 0, format: color },
    { key: "price", label: "Price", align: "money", width: 64, widthShrink: 0, sortValue: item => number(item.price), format: item => formatMoney(item.price) },
    { key: "quantity", label: "Qty", align: "center", width: 38, minWidth: 38, widthShrink: 0, sortValue: item => number(item.quantity), format: item => number(item.quantity) },
    { key: "total", label: "Cash flow", align: "money", width: 82, widthShrink: 0, sortValue: item => item.type === "BUY" ? -transactionCashAmount(item) : transactionCashAmount(item), format: item => signedMoney(item.type === "BUY" ? -transactionCashAmount(item) : transactionCashAmount(item)), title: item => item.trade ? "Recorded cash movement" : "Legacy item subtotal. Complete charges unknown." },
    { key: "balanceAfter", label: "Balance", align: "money", width: 82, widthShrink: 0, sortValue: item => item.balanceAfter != null && item.balanceAfter !== "" && Number.isFinite(Number(item.balanceAfter)) ? Number(item.balanceAfter) : -Infinity, format: item => item.balanceAfter != null && item.balanceAfter !== "" && Number.isFinite(Number(item.balanceAfter)) ? formatMoney(item.balanceAfter) : "-" },
    { key: "realizedPL", label: "Realized", align: "money", width: 76, widthShrink: 0, sortValue: item => item.type === "SELL" && item.realizedPL != null && item.realizedPL !== "" && Number.isFinite(Number(item.realizedPL)) ? Number(item.realizedPL) : -Infinity, format: item => item.type === "SELL" && item.realizedPL != null && item.realizedPL !== "" && Number.isFinite(Number(item.realizedPL)) ? signedMoney(item.realizedPL) : "-" },
    { key: "date", label: "Date", align: "center", width: 68, widthShrink: 0, sortValue: item => item.date ? new Date(item.date).getTime() : -1, format: item => date(item.date), title: item => item.date ? new Date(item.date).toLocaleString() : "Date unavailable" },
    { key: "type", label: "Trade", align: "center", width: 86, widthShrink: 0, render: item => <button className="table-link" onClick={() => setReceipt(item)} title="View transaction receipt">{item.type === "REVERSAL" ? "Reversal" : activeIds.has(item.id) ? item.type : "Reversed"}</button> },
  ];
  const bought = buys.reduce((sum, tx) => sum + transactionCashAmount(tx), 0); const sold = sells.reduce((sum, tx) => sum + transactionCashAmount(tx), 0);
  return <><ViewHeader title="Transactions" description="Shared ledger for single and sealed buys, sells, balances, and realized outcomes." /><MetricBand items={[{ label: "Buys", value: buys.length, detail: `${formatMoney(bought)} deployed` }, { label: "Sells", value: sells.length, detail: `${formatMoney(sold)} returned` }, { label: "Net Cash Flow", value: signedMoney(sold - bought), detail: "Active sells minus buys" }, { label: "Recent Activity", value: allTransactions[0] ? date(allTransactions[0].date) : "-", detail: allTransactions[0]?.name || "No transactions" }]} /><TableFilterPanel title="Filter Transactions" countText={`${rows.length} of ${allTransactions.length} transactions`} value={filter} onChange={value => { if (focusId) setParams({}); setFilter(value); }} placeholder="Asset, source, order, notes" pageSize={pageSize} onPageSizeChange={setPageSize} onReset={() => { setParams({}); setFilter(""); setType(""); setAssetMode("all"); }} scope={<AssetModeControl value={assetMode} onChange={setAssetMode} label="Filter Transactions by asset type" />}><label className="filter-control"><span>Type</span><select aria-label="Transaction type" value={type} onChange={event => setType(event.target.value)}><option value="">All types</option><option>BUY</option><option>SELL</option><option>REVERSAL</option></select></label>{focusId && <button type="button" className="filter-reset-btn" onClick={() => setParams({})}>Show all Transactions</button>}</TableFilterPanel><TabulatorTable columns={columns} rows={rows} onRowClick={setReceipt} tableClass="ms-tabulator--transactions" ariaLabel="Transactions ledger" empty="No transactions yet. Buys and sells will appear here automatically." initialSort={[{ column: "date", dir: "desc" }]} pageSize={pageSize} /><TransactionReceipt item={receipt} onClose={() => setReceipt(null)} /><CardDetail item={detail} source="positions" onClose={() => setDetail(null)} /></>;
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
    { key: "name", label: "Asset", minWidth: 170, width: 230, widthGrow: 1, widthShrink: 1, render: event => resolveAssetDetail(event, trackedItems) ? <button className="table-link" aria-label={`Open details for ${event.name}, ${assetContextLabel(event)}`} onClick={() => openHistoryDetail(event)}><CardIdentity item={event} /></button> : <CardIdentity item={event} /> },
    { key: "assetType", label: "Class", align: "center", width: 44, widthShrink: 0, render: item => <span className={`asset-type-pill ${getAssetType(item)}`}>{assetTypeLabel(item)}</span> },
    { key: "set_code", label: "Set", align: "center", width: 48, widthShrink: 0, format: item => String(item.set_code || "-").toUpperCase() },
    { key: "collector_number", label: "Detail", align: "center", width: 78, widthShrink: 0, format: item => getAssetType(item) === ASSET_TYPES.SEALED ? String(item.productType || "Product").replaceAll("_", " ") : printingLabel(item) },
    { key: "rarity", label: "Rarity", align: "center", width: 44, widthShrink: 0, format: rarity, title: item => item.rarity || "Rarity unavailable" },
    { key: "color", label: "Color", align: "center", width: 44, widthShrink: 0, format: color },
    { key: "price", label: "Price", align: "money", width: 64, widthShrink: 0, sortValue: item => parsePrice(item.price) ?? -1, format: item => parsePrice(item.price) !== null ? formatMoney(item.price) : "-" },
    { key: "date", label: "Date", align: "center", width: 112, widthShrink: 0, sortValue: item => item.date ? new Date(item.date).getTime() : -1, format: item => compactDateTime(item.date), title: item => item.date ? new Date(item.date).toLocaleString() : "Date unavailable" },
    { key: "eventType", label: "Type", align: "center", width: 58, widthShrink: 0, render: item => <span className="status-pill">{item.eventType}</span> },
    { key: "notes", label: "Notes", width: 72, widthShrink: 0, sortValue: item => item.notes || "", format: item => item.eventType === "NOTE" || item.notes ? "Note" : "-", title: item => item.notes || item.summary },
    { key: "summary", label: "Detail", minWidth: 240, widthGrow: 2, widthShrink: 1, title: item => item.summary },
  ];
  return <><ViewHeader title="History" description="Recent activity and learning trail across singles, sealed products, transactions, Radar, valuations, and notes." /><MetricBand items={[{ label: "Events", value: allEvents.length, detail: "Reviewable records" }, { label: "Trades", value: state.transactions.length + state.sealedTransactions.length, detail: "Buy and sell events" }, { label: "Lessons / Review", value: state.cardNotes.length + (state.thesisNotes || []).length, detail: "Saved decision notes" }, { label: "Notes", value: state.cardNotes.length, detail: "Asset memory" }]} /><TableFilterPanel title="Filter History" countText={`${events.length} of ${allEvents.length} events`} value={filter} onChange={value => { if (focusId) setParams({}); setFilter(value); }} placeholder="Event, asset, detail" pageSize={pageSize} onPageSizeChange={setPageSize} onReset={() => { setParams({}); setFilter(""); setType(""); setAssetMode("all"); }} scope={<AssetModeControl value={assetMode} onChange={setAssetMode} label="Filter History by asset type" />}><label className="filter-control"><span>Type</span><select aria-label="History type" value={type} onChange={event => setType(event.target.value)}><option value="">All events</option><option value="transaction">Transactions</option><option value="radar">Radar</option><option value="note">Notes</option><option value="market">Valuations</option></select></label>{focusId && <button type="button" className="filter-reset-btn" onClick={() => setParams({})}>Show all History</button>}</TableFilterPanel><TabulatorTable columns={columns} rows={events} onRowClick={openHistoryDetail} tableClass="ms-tabulator--history" ariaLabel="Activity history" empty="Activity will appear here as you work." initialSort={[{ column: "date", dir: "desc" }]} pageSize={pageSize} /><CardDetail item={detail} source="positions" onClose={() => setDetail(null)} /></>;
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
  const queueRow = (item, reason) => ({ ...item, title: `${item.name} - ${assetContextLabel(item)}`, detail: `${reason} - ${item.currentPrice !== null && item.currentPrice !== undefined ? formatMoney(item.currentPrice) : "Unpriced"}${item.targetValue ? ` -> ${item.source === "radar" ? "Entry" : "Target"} ${formatMoney(item.targetValue)}` : ""}` });
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
      <MetricTile item={{ label: "Cash Available", value: <>{formatMoney(summary.cash)}</>, detail: <>Current paper-trading balance</> }} />
      <MetricTile item={{ label: "Capital Deployed", value: <>{formatMoney(summary.invested)}</>, detail: <>{summary.invalidPositionCount ? `${summary.invalidPositionCount} unreconciled excluded` : "Valid Position cost basis"}</> }} />
      <MetricTile item={{ label: "Positions Value", value: <>{formatMoney(summary.value)}</>, detail: <>{largestPosition ? `Largest: ${largestPosition.name} ${largestPosition.sharePercent.toFixed(1)}%` : markedCoverage}</> }} />
      <MetricTile item={{ label: "Unrealized P&L", value: <>{summary.unrealizedProfitLoss ? signedMoney(summary.unrealizedProfitLoss) : formatMoney(0)}</>, detail: <>{percent(summary.profitLossPercent)} · {summary.profitablePositionCount} up / {summary.losingPositionCount} down / {summary.flatPositionCount} flat</> ,tone: summary.unrealizedProfitLoss > 0 ? "positive" : summary.unrealizedProfitLoss < 0 ? "negative" : "" }} />
      <MetricTile item={{ label: "Recorded Realized P&L", value: <>{summary.realizedProfitLoss ? signedMoney(summary.realizedProfitLoss) : formatMoney(0)}</>, detail: <>{realizedCoverage}</> ,tone: summary.realizedProfitLoss > 0 ? "positive" : summary.realizedProfitLoss < 0 ? "negative" : "" }} />
      <MetricTile item={{ label: "Current Equity", value: <>{formatMoney(summary.totalEquity)}</>, detail: <>Cash + marked Positions</> }} />
      <MetricTile item={{ label: "Radar Plan Capital", value: <>{formatMoney(summary.plannedRadarCapital)}</>, detail: <>{radarCoverage}</> }} />
      <MetricTile item={{ label: "Signals", value: `${signalState.activeCount} active`, detail: `${markedCoverage} · Open Signals`, onActivate: () => navigate("/signals") }} />
    </div>
    <div className="scan-grid dashboard-work-grid">
      {queues.map(([title, rows, empty]) => <AttentionTile key={title} title={title}>{rows.length ? rows.map((item, index) => <AttentionRow key={`${title}-${item.id || index}`} item={item} onActivate={item.static ? undefined : () => setDetail(item)} />) : <p className="workspace-empty">{empty}</p>}</AttentionTile>)}
    </div>
    <CardDetail item={detail} source={detail?.source || "portfolio"} onClose={() => setDetail(null)} />
  </section>;
}
export function AdminView() {
  const { state, updateState, createBackup, parseBackupText, restoreBackup } = useAppState(); const [preview, setPreview] = useState(null); const notices = useNotices();
  const reconciliation = useMemo(() => dataFoundation.buildReconciliationReport({ specs: state.specs, transactions: state.transactions }), [state.specs, state.transactions]);
  function download() { const blob = new Blob([JSON.stringify(createBackup(), null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `manaspec-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href); notices.show("Backup exported."); }
  async function choose(event) { const file = event.target.files?.[0]; if (!file) return; const result = parseBackupText(await file.text()); if (!result.ok) notices.show(result.message, "warning"); else setPreview(result.backup); event.target.value = ""; }
  async function refresh() { try { notices.show("Refreshing Scryfall prices…"); const unique = new Map([...state.specs, ...state.radar].map(item => [item.id, item])); const result = await refreshTrackedPrices([...unique.values()]); const checkedAt = new Date().toISOString(); const day = checkedAt.slice(0, 10); updateState(current => { const newSnapshots = result.observations.map(item => ({ date: day, cardId: item.scryfall_id || item.id, name: item.name, set: item.set_code, foil: Boolean(item.foil), finish: item.finish, price: number(item.currentPrice), source: "scryfall", verified: true, savedAt: checkedAt })).filter(snapshot => !current.priceSnapshots.some(row => row.date === day && getRelatedRecordPrintingKey(row) === getRelatedRecordPrintingKey(snapshot))); return { ...current, specs: applyPriceObservations(current.specs, result.observations), radar: applyPriceObservations(current.radar, result.observations), priceSnapshots: [...current.priceSnapshots, ...newSnapshots], priceRefreshStatus: { checkedAt, updatedCount: result.updated } }; }); notices.show(`Updated ${result.updated} tracked printing prices.`); } catch (error) { notices.show(error.message, "warning"); } }
  return <><ViewHeader title="Admin" description="Protect local singles and sealed data and manage controlled maintenance actions." /><div className="admin-grid parity-admin-grid"><WorkspacePanel className="admin-panel" title="Cash"><p>Reset only the paper trading cash balance. Positions, Radar, notes, and history remain intact.</p><strong>{formatMoney(state.cash)}</strong><button className="danger" onClick={() => { if (confirm("Reset cash to $10,000?")) updateState(current => ({ ...current, cash: 10000 })); }}>Reset Cash</button></WorkspacePanel><WorkspacePanel className="admin-panel" title="Data Safety"><p>Export a complete schema-v2 local backup, including sealed Radar, Positions, and Transactions, or restore an older compatible export.</p><div className="button-row"><button onClick={download}>Export Backup</button><label className="button secondary">Import Backup<input hidden type="file" accept="application/json,.json" onChange={choose} /></label></div></WorkspacePanel><WorkspacePanel className="admin-panel" title="Single Prices"><p>Refresh tracked Scryfall single prices and save today’s price-history snapshots. Sealed values remain explicit manual checks.</p><button onClick={refresh}>Run Single Price Audit</button><small>{state.priceRefreshStatus?.checkedAt ? `Last run ${new Date(state.priceRefreshStatus.checkedAt).toLocaleString()}` : "No audit recorded"}</small></WorkspacePanel><WorkspacePanel className="admin-panel" title="Sealed Valuation"><p>MTGJSON supplies exact product identity and TCGplayer links, but not an official sealed price feed. Save timestamped values from product detail.</p><button disabled>Automatic sealed prices unavailable</button><small>No scraping or card-price substitution</small></WorkspacePanel></div><div className="admin-diagnostics"><WorkspacePanel className="admin-card" title="Singles ledger reconciliation"><p>Read-only comparison of current single Positions against transaction-projected holdings.</p><dl><div><dt>Findings</dt><dd className={reconciliation.summary.findingCount ? "negative" : "positive"}>{reconciliation.summary.findingCount}</dd></div><div><dt>Matched</dt><dd>{reconciliation.summary.matched || 0}</dd></div><div><dt>Projection issues</dt><dd>{reconciliation.projectionIssues.length}</dd></div></dl></WorkspacePanel><WorkspacePanel className="admin-card" title="React storage diagnostics"><p>Data remains local to this browser. Use exports for durable backup and device transfer.</p><dl><div><dt>Single Positions / Radar</dt><dd>{state.specs.length} / {state.radar.length}</dd></div><div><dt>Sealed Positions / Radar</dt><dd>{state.sealedSpecs.length} / {state.sealedRadar.length}</dd></div><div><dt>Transactions</dt><dd>{state.transactions.length + state.sealedTransactions.length}</dd></div><div><dt>Price records</dt><dd>{state.priceSnapshots.length} snapshots · {state.marketObservations.length} checks</dd></div></dl></WorkspacePanel></div><Modal open={Boolean(preview)} title="Restore ManaSpec backup?" onClose={() => setPreview(null)}>{preview && <div className="react-form"><p>This will replace current local data. An emergency pre-import copy is retained by the storage layer.</p><dl className="backup-counts">{Object.entries(preview.counts).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><div className="modal-actions"><button className="secondary" onClick={() => setPreview(null)}>Cancel</button><button onClick={() => { try { restoreBackup(preview); setPreview(null); notices.show("Backup restored."); } catch (error) { notices.show(error.message, "warning"); } }}>Restore backup</button></div></div>}</Modal><Notice notice={notices.notice} onDismiss={notices.dismiss} /></>;
}
