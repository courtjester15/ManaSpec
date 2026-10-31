# Module controls and shared UI review — 30 October 2026

## Recommendation

Approve one coherent React workspace-standardization outcome covering **module tops and tables together**. Implement shared controls and layout contracts first, migrate the routes, then finish table formatting/sizing and run populated cross-module QA. Do not fix each screenshot with independent CSS overrides. This is a recommendation, not implementation authority or a frontend-promotion decision.

Companion: [populated table comparison](populated-table-comparison-2026-10-29.md). That report owns detailed table findings; this report expands the proposed scope to the control areas that feed them.

## Evidence and limits

Reviewed Dashboard, Radar, Positions, Signals, Transactions, History and Admin in the in-app browser at 1366×768 and 1920×1080 using the same isolated backup copies as the table review (38 Positions, 16 Radar entries, 65 transactions, 8 notes and 37 market observations). The original backup and real browser localStorage remain unchanged. Private screenshots/layout measurements are ignored under `.tmp/module-review/`; do not commit or deploy them.

Inspected `features/views/Views.jsx`, `features/shared/ui.jsx`, `styles/index.css`, `styles/react.css`, the copied legacy form/component styles, vanilla `js/ui/context-band.js`, and owning form/component rules. Tested React Signals No Plan → filtered state → Show all: reset enabled after selection and disabled after reset. No trading, data editing, migrations, implementation tests/builds, phone QA or complete keyboard/accessibility certification was performed in this read-only review. Route screenshots can catch deferred table-cell rendering; blank cells in intermediate frames are not evidence of persistent missing data.

## Findings

### 1. The filter grid has a concrete child-count mismatch

React `TableFilterPanel` renders five children: search, asset-mode selector, event/type selector, page size, Reset. Imported `.ledger-filter-bar` still declares four columns: `minmax(180px, 1fr) 130px 94px auto`. At the inspected populated History view the asset selector measured 163px inside its 130px track; Reset auto-placed on row two and expanded to the search-column width. This explains the overlapping/truncated selector labels and oversized Reset button. Transactions has the same shared defect.

At 1366px React Transactions/History filter panels measured **127px high**, versus vanilla's **74px**. Their tables began around y=407 versus vanilla y=370. This is not a preference about whitespace: markup and grid configuration disagree.

**Correction:** let a shared toolbar own named search/filter/scope/page-size/reset slots, fit-content controls, minimum search width, and intentional wrapping. Adding a control must not rely on auto-placement into a grid intended for another child count.

### 2. Shared search styling does not reach all actual inputs

React Radar's discovery tile is broad, but its input measured only **186px**; Search sits far away on the right. The tile is fixed at **108px** and the input extends below its bottom edge. Radar additionally puts discovery Singles/Sealed/All inside the tile and a second All/Singles/Sealed bubble on a separate row before the filters.

React Positions similarly has an 82px-high filter area with a **186px** input, despite extensive unused horizontal space. Its plain `FilterBar` applies flex growth to the label, not an explicit full-width input contract. By contrast `TableFilterPanel` uses `.filter-control input { width:100% }`. Radar's search-panel form has its own grid but lacks a matching explicit input-width rule.

**Correction:** shared SearchField sizing, label, clear/focus and loading/empty/error treatments; separate functional variants for discovery and local filtering. Discovery remains asynchronous Scryfall/sealed search with explicit submission; local filters remain local. Move the saved-data asset scope into the filter toolbar and label it separately from discovery scope. Never wire the two scopes to one state variable merely because they look alike.

### 3. Module tops have several competing rendering paths

- `MetricBand` produces shared four-tile context markup, but Radar manually reproduces metric articles around its discovery search.
- Positions uses `FilterBar`; Radar uses a bespoke `RadarFilterBar`; Transactions/History use `TableFilterPanel`; Signals has a bespoke utility tile. Shared responsibilities have different DOM shapes and CSS assumptions.
- React imports complete copied legacy base/layout/forms/components/tables styles, then React overrides, then table overrides. New markup inherits old global and descendant selectors even when it no longer follows the old component's child structure.
- `.react-metric-band` styles coexist with the actual `MetricBand` class `.module-context-band`; names alone do not establish which contract owns a rendered component.
- `.view-heading p` forces nowrap. Descriptions grow with mixed-asset support, so the shared heading needs a deliberate wrapping rule rather than guaranteed single-line fit.

**Correction:** components own their DOM and CSS together. Route code supplies content, control configuration and callbacks. Extract CSS ownership as components migrate; remove superseded rules only after inspecting their callers. Keep inherited tokens and proven visuals; do not replace the entire stylesheet stack in one speculative cleanup.

### 4. Tiles do not consistently communicate interaction

Vanilla's context helper deliberately renders a button when a tile has an action and an article otherwise. React `MetricBand` is articles only. Imported `.module-context-card:hover` styles also highlight passive metric tiles, making them look actionable.

`AssetModeControl` combines the control class with `asset-mode-filter`, so its supposedly reusable shape carries placement rules (right margin/alignment) from one use case. Its appearance is then corrected by ancestor-specific overrides. Small in-table asset badges, asset scope controls, signal status pills and action tiles are distinct concepts and should not share accidental placement behavior.

**Correction:** separate a layout-neutral ToggleGroup from the toolbar slot holding it; share visual tokens with badges, not selection state. MetricTile renders a passive article or one semantic button/link with visible focus/selected states. Do not add a button inside another clickable button. Make active and disabled behavior consistent and keyboard-operable.

### 5. Signals shares data with Dashboard more successfully than presentation

The existing `domain/signals.js` selectors already serve both routes. Preserve that foundation. React Dashboard and Signals nevertheless build queue rows separately: different identity strings, reason construction, number of text lines and font rules. Signals compresses preview text to **9–10px**; Dashboard uses a larger two-line pattern. Long printing identity plus source/reason/context competes inside three preview rows.

Signals articles handle clicks on the tile background while separate header buttons handle keyboard activation. Preview buttons stop propagation. Selection works in the tested path, but this is duplicated event choreography that deserves one owner. Counts currently use `preview.length`, capped by the preview limit, while the utility tile displays the active total. A capped preview count must not look like a bucket total.

**Correction:** shared AttentionRow and AttentionTile primitives with common exact identity, reason and secondary-context formatting, selected/focus treatment, and one event boundary. Keep route-specific intent: Dashboard opens work/detail; Signals filters a bucket or exact asset. Show an unambiguous bucket total and preview relationship using the existing selector membership; retain approaching fallback semantics rather than silently redefining alerts. Support 0, 1 and 3 previews without shrinking fonts or clipping a fourth hidden line.

Signals measured 173px high in React versus 217px in vanilla at laptop size. This is not automatically a regression: useful content should determine the height. Standardization should not force every route's table to the same y-coordinate when the route has a different tool.

### 6. Per-module disposition

| Module | Preserve from vanilla / existing product | Standardize or correct in React |
| --- | --- | --- |
| Dashboard | Clear attention destinations, compact queue identity/reasons, quiet empty states | Shared metric/attention primitives and formatting; responsive metric grid. Keep useful React coverage information rather than blindly reverting to the smaller vanilla summary. |
| Radar | Distinct discovery vs saved filtering, explicit printing/finish selection, dense filter controls | Search tile input bounds and result anchoring; shared metric tiles; saved scope inside shared filter toolbar; consistent loading, errors and Clear/Reset. Preserve sealed discovery. |
| Positions | Full useful card-filter/page-size contract and shown/total context | Replace bare FilterBar with shared toolbar; restore missing filters/pagination; search width, scope/reset alignment; companion table fixes. |
| Signals | Read-only attention ownership and meaningful navigation | Shared attention rows/tiles, keyboard/selection/count/reset semantics; legible previews; utility controls use the same field/button sizing tokens. |
| Transactions | Recent-first ledger review, readable type filter and reset | Fix the five-control/four-track mismatch; standard scope/filter/page-size/reset slots and counts; companion date/sort fixes. |
| History | Recent-first review, readable full event/notes access | Same toolbar correction; flexible event context and consistent date/preview formatting; preserve React's added market-observation events. |
| Admin | Clearly separated backup/restore, maintenance, and diagnostic actions | Shared panel heading, field, button and notice primitives. Keep varied panel content; do not force Admin into the table toolbar layout or trigger destructive actions during presentation QA. |

## Proposed shared ownership

1. **ModuleHeader:** title, description, optional actions, explicit wrapping and spacing.
2. **ContextBand / MetricTile:** shared metric anatomy and passive/action variants; an explicit discovery-search slot for Radar. Metric count/meaning still belongs to domain selectors.
3. **FilterToolbar:** named search, scope, filter, count, page-size and reset slots; intentional compact wrapping. Radar/Positions share a CardFilters field group; ledger/history supply their type controls. Avoid one giant conditional component keyed on route names.
4. **SearchField / SelectField / ToggleGroup / Reset:** common geometry, labels, accessible names and focus states. Distinct discovery, saved-search and local-filter callbacks remain explicit.
5. **AttentionTile / AttentionRow:** shared rendering and interaction boundary over the already shared Signals selectors, with route-specific actions.
6. **Display helpers and tokens:** dates, money, rarity, hold labels, exact asset/finish context; gaps/control heights/padding/radii/typography. Reuse proven helpers rather than introduce another formatting system.

Standardize reset scope: a route's Reset clears local filters, asset scope and focused-row restriction together while preserving its configured page-size preference; input-only clear clears that input. Display active filters and shown/total counts consistently. Preserve a visible distinction between filtering and navigation/deep links. Define the exact page-size preference behavior in the implementation Issue before changing existing persistence.

## One reviewable outcome, staged internally

1. Define the component contracts and geometry using the working vanilla siblings and measured failures. No broad framework/library/state-store migration is warranted.
2. Repair shared search/toolbar/tile ownership and migrate all seven module tops. Move the directly affected DOM/CSS out of the monolithic Views file into those real shared responsibilities; don't split files solely by line count.
3. Apply the companion table formatting, allocation, filtering/pagination, sorting and shortcut improvements using those same controls/helpers.
4. Final QA with the populated backup plus safe synthetic empty, long-label, unknown-price, mixed singles/sealed and foil/etched cases. Exercise search/reset/page-size/tile keyboard and row selection behavior, not only screenshots. Wait for populated cell rendering; check console and 1366×768/1920×1080 containment. Test browser zoom/wrapping as a focused check, not a full mobile redesign.
5. Run relevant tests and full required builds/artifact verification once the coherent implementation stabilizes; update owning style/architecture/workflow docs only where the resulting contract changes their truth. Review through one PR, with no merge/deployment or owner-data writes implied.

## Acceptance boundary

No overlap or out-of-panel controls; usable search width; filters wrap intentionally; passive tiles do not impersonate actions; active scope and reset behavior are legible; no accidental double activation; counts distinguish total from preview; common field and button sizing is owned once; precise domain data and the discovery/local-filter distinction survive. Pair these checks with the companion table acceptance criteria. This review changes documentation only.
