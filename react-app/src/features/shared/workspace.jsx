import { FilterToolbar } from "./ui.jsx";
import { formatMoney } from "../../domain/portfolio.js";
import { attentionReason } from "../../domain/display.js";
import { assetContextLabel } from "../../domain/assetIdentity.js";

export function AssetModeControl({ value, onChange, label = "Asset type", options = [["all", "All"], ["single", "Singles"], ["sealed", "Sealed"]] }) {
  return <div className="workspace-scope" role="group" aria-label={label}>{options.map(([mode, text]) => <button key={mode} type="button" aria-pressed={value === mode} onClick={() => onChange(mode)}>{text}</button>)}</div>;
}

export function AttentionRow({ item, reason, bucketId, onActivate, selected }) {
  const title = item.title || `${item.name} · ${assetContextLabel(item)}`;
  const why = reason || attentionReason(item, bucketId);
  const quote = item.currentPrice === null || item.currentPrice === undefined ? "Unpriced" : formatMoney(item.currentPrice);
  const detail = item.detail || `${why} · ${quote}${item.targetValue ? ` → ${formatMoney(item.targetValue)}` : ""}`;
  const Tag = onActivate ? "button" : "div";
  return <Tag className="workspace-attention-row" type={onActivate ? "button" : undefined} onClick={onActivate} aria-pressed={onActivate && selected !== undefined ? selected : undefined} title={`${title} — ${detail}`}><strong>{title}</strong><span>{detail}</span></Tag>;
}

export function AttentionTile({ title, detail, count, shown, active, onSelect, children }) {
  const heading = <><span>{title}</span>{count !== undefined && <strong>{count}</strong>}{detail && <small>{detail}</small>}{shown !== undefined && count > shown && <small>Showing {shown} of {count}</small>}</>;
  return <section className="workspace-attention-tile" data-active={active || undefined}>{onSelect ? <button className="workspace-attention-heading" type="button" aria-pressed={Boolean(active)} onClick={onSelect}>{heading}</button> : <h4 className="workspace-attention-heading">{heading}</h4>}<div className="workspace-attention-rows">{children}</div></section>;
}

export function CardFilterPanel({ filters, onChange, onClear, shownCount, totalCount, pageSize, onPageSizeChange, title = "Filter Radar", scope }) {
  const update = (key, value) => onChange(current => ({ ...current, [key]: value }));
  const types = ["Creature", "Planeswalker", "Instant", "Sorcery", "Artifact", "Enchantment", "Land", "Battle"];
  return <FilterToolbar title={title} countText={`${shownCount} of ${totalCount ?? shownCount} matching`} value={filters.text} onChange={value => update("text", value)} placeholder="Name, set, type" pageSize={pageSize} onPageSizeChange={onPageSizeChange} onReset={onClear} scope={scope}><label className="filter-control"><span>Rarity</span><select aria-label="Rarity" value={filters.rarity} onChange={event => update("rarity", event.target.value)}><option value="">Rarity</option><option value="mythic">Mythic</option><option value="rare">Rare</option><option value="uncommon">Uncommon</option><option value="common">Common</option></select></label><label className="filter-control"><span>Type</span><select aria-label="Type" value={filters.type} onChange={event => update("type", event.target.value)}><option value="">Type</option>{types.map(type => <option key={type}>{type}</option>)}</select></label><label className="filter-control"><span>Color</span><select aria-label="Color" value={filters.color} onChange={event => update("color", event.target.value)}><option value="">Color</option><option value="C">Colorless</option><option value="W">White</option><option value="U">Blue</option><option value="B">Black</option><option value="R">Red</option><option value="G">Green</option><option value="M">Multicolor</option></select></label><label className="filter-control"><span>Min $</span><input aria-label="Minimum price" inputMode="decimal" value={filters.minPrice} onChange={event => update("minPrice", event.target.value)} placeholder="Min $" /></label><label className="filter-control"><span>Max $</span><input aria-label="Maximum price" inputMode="decimal" value={filters.maxPrice} onChange={event => update("maxPrice", event.target.value)} placeholder="Max $" /></label><label className="inline-check"><input type="checkbox" checked={filters.reserved} onChange={event => update("reserved", event.target.checked)} />Reserved</label><label className="filter-control"><span>Print</span><select aria-label="Reprint" value={filters.reprint} onChange={event => update("reprint", event.target.value)}><option value="">Print</option><option value="new">First</option><option value="reprint">Reprint</option></select></label><label className="filter-control"><span>Plan</span><select aria-label="Plan" value={filters.plan} onChange={event => update("plan", event.target.value)}><option value="">Plan</option><option value="planned">Has plan</option><option value="unplanned">No plan</option><option value="entryHit">Entry hit</option><option value="exitHit">Exit hit</option><option value="approaching">Approaching</option></select></label></FilterToolbar>;
}

export function TableIndicatorIcon({ type }) {
  return type === "notes"
    ? <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.5" width="9" height="11" rx="1" /><path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3.5" /></svg>
    : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 12.5h11M3.5 10l3-3 2.5 2 3.5-5" /></svg>;
}
