# Issue #16: Sealed Product Speculation Vertical Slice

## Metadata

- **Status:** In Progress
- **Date:** 2026-08-18
- **Brief Size:** High-Risk
- **Related Documents / Issues:** [GitHub Issue #16](https://github.com/courtjester15/ManaSpec/issues/16), [Product Principles](PRODUCT_PRINCIPLES.md), [Data Model](DATA_MODEL.md), [React Spike Architecture](REACT_SPIKE_ARCHITECTURE.md), [Deployment](DEPLOYMENT.md)
- **Author:** Codex with project-owner direction
- **Approver:** Project owner through Issue #16

This brief is an implementation plan, not an implementation log. Record completed work, deviations, validation results, and evidence in `REACT_SPIKE_PROGRESS.md`, the owning active docs, and checkpoint commits.

## 1. Objective

Add sealed Magic products as first-class speculation assets in the React application through the complete ManaSpec workflow: exact-product discovery, Radar planning, buying into Positions, buying more, partial/full selling, and retained Transactions/History context. Preserve current singles behavior and browser data, use real MTGJSON identities, provide exact TCGplayer routing where supported, and never represent sealed products as fake Scryfall printings.

Success means a tester can use representative booster, pack, bundle, preconstructed/specialty, and Secret Lair products end to end with honest valuation semantics, durable local state, compatible backup/restore, clean mixed workflow views, and verified normal/Pages/portable delivery.

## 2. Background

ManaSpec's validated workflow currently assumes exact single-card printings identified by Scryfall UUID plus finish. Issue #16 deliberately pulls sealed speculation forward from deferred scope because it is a desired owner/tester workflow and a useful forward React feature.

The React app is the current forward feature-development target but is not yet the canonical production frontend. The vanilla root remains operational and shares the Pages localStorage origin. Existing singles keys and record shapes therefore remain compatibility boundaries; sealed support must not make vanilla interpret a product as a card.

The 2026-08-18 MTGJSON proof used `SetList.json` version `5.3.0+20260818`:

- 868 sets and 4,679 sealed products were present.
- 3,405 products exposed both `identifiers.tcgplayerProductId` and `purchaseUrls.tcgplayer`.
- Representative play/draft/collector boxes, packs, bundles, commander decks, and Secret Lair products had stable MTGJSON UUIDs and exact TCGplayer IDs.
- Representative MTGJSON links redirected to exact `tcgplayer.com/product/<productId>` destinations.
- Raw `SetList.json` was 11,590,303 bytes, too large for an unconditional browser fetch.
- Five representative sealed UUIDs were absent from the 53,101,981-byte `AllPricesToday.json`. MTGJSON documents that price file as card prices keyed by card UUID, so it is not an approved sealed price feed.

The approved V1 pricing fallback is timestamped manual valuation/market observation. Exact product links remain automatic where MTGJSON supplies them.

## 3. Scope

### In Scope

- A shared asset identity boundary for existing singles and new sealed products.
- A generated, trimmed, locally bundled MTGJSON sealed catalog with source metadata and deterministic generation tooling.
- Radar discovery modes for Singles, Sealed, and All when the combined result model remains clear.
- Mixed Radar and Positions views with All, Singles, and Sealed filters.
- Sealed plan fields, notes, exact external links, and manual timestamped valuation.
- Sealed buy, buy-more, partial-sell, and full-sell behavior using physical units and weighted average cost.
- Mixed Transactions and History with visible asset type and filtering.
- Portfolio/Dashboard/Signals integration only where current valuation and existing semantics remain honest.
- Versioned local persistence, old-backup migration, backup/export/import, and reload coverage.
- Normal, Pages-subpath, and portable generated outputs plus browser QA at 1920x1080 and 1366x768.
- Owning documentation, changelog, progress evidence, checkpoint commits, branch push, and a draft PR.

### Out of Scope

- Collection or general inventory management.
- Opening, expected-value, or box-contents valuation calculations.
- Automated recommendations or predictions.
- Marketplace scraping or an unproven price integration.
- Backend/database work or multi-user synchronization.
- Transaction-authority migration or computed Positions.
- Vanilla sealed UI implementation or React canonical promotion.
- Unrelated React/vanilla polish or redesign.

## 4. Existing Architecture

- `AppStateProvider` owns compatible durable state through one storage adapter.
- Existing singles use `specs`, `radar`, and `transactions`; React selectors and routes consume those arrays.
- Pure domain modules own exact-printing identity, related-record resolution, trading, Signals, local search, and portfolio math.
- `Views.jsx` composes the seven routes and contextual detail workflows.
- `TabulatorTable` is the only dense React grid boundary.
- Normal, Pages, and portable builds bundle local production dependencies; the portable output cannot depend on runtime fetches for its catalog.

Sealed state will use additive top-level arrays (`sealedSpecs`, `sealedRadar`, `sealedTransactions`) so vanilla continues to read untouched singles records. React combines those arrays at selector/UI boundaries and reuses the same domain operations, dialogs, tables, notes, observations, Signals, and History surfaces.

## 5. Existing Research / Decisions

- [Issue #16](https://github.com/courtjester15/ManaSpec/issues/16) explicitly overrides the former roadmap deferral.
- [MTGJSON Sealed Product model](https://mtgjson.com/data-models/sealed-product/) supplies product UUID, name, category/subtype, identifiers, contents, release date, and purchase URLs.
- [MTGJSON All Files](https://mtgjson.com/downloads/all-files/) and [Price model](https://mtgjson.com/data-models/price/) describe card prices, not a sealed-product price feed.
- [Product Principles](PRODUCT_PRINCIPLES.md) keeps Radar/Positions ownership and user decision authority.
- [React Spike Architecture](REACT_SPIKE_ARCHITECTURE.md) requires explicit persistence, compatible records, one table boundary, and three delivery outputs.

## 6. Assumptions

- MTGJSON sealed UUID is the canonical product identity; TCGplayer product ID is an external-market identifier, not ManaSpec identity.
- A sealed product can be tracked without a TCGplayer link if MTGJSON identity is otherwise complete; the missing link is shown honestly.
- Manual market price becomes current valuation only after an explicit save and retains its timestamp/source.
- Existing singles with no `assetType` remain singles through inference; they are not destructively rewritten merely to add new identity fields.
- Additive sealed stores are safer for current same-origin vanilla compatibility than mixing sealed records into card-only arrays.

## 7. Dependencies

- MTGJSON `SetList.json` for catalog generation and periodic refresh.
- Existing React, React Router, Tabulator, Chart.js, and Vite dependencies; no new runtime package is expected.
- TCGplayer external routing only through MTGJSON-provided identity/URLs; no marketplace API or scraping dependency.

## 8. Risks

- **Risk:** Existing singles or backups become unreadable.
  - **Mitigation:** Preserve existing keys/shapes, use additive data-schema migration, retain v1 fixtures, and test backup round trips.
- **Risk:** Sealed is accidentally normalized as a Scryfall printing.
  - **Mitigation:** Central asset identity requires `sealed:<mtgjson UUID>` and rejects missing/invalid sealed identity.
- **Risk:** Manual valuation looks automated or current when stale.
  - **Mitigation:** Label the source as manual, store checked time, show unpriced states, and exclude unsupported values from equity/P/L.
- **Risk:** Catalog delivery harms startup or portable use.
  - **Mitigation:** Generate a trimmed catalog, lazy-load it in normal/Pages builds, bundle it into portable output, and record sizes.
- **Risk:** Shared-table generalization regresses singles density/actions.
  - **Mitigation:** Reuse the wrapper, keep concise columns, test mixed and singles-only modes at both required desktop widths.
- **Risk:** Vanilla encounters new sealed records on the shared origin.
  - **Mitigation:** Keep sealed records in additive keys vanilla does not load; do not alter current singles arrays for sealed workflow state.

## 9. Constraints

- Local-first, user-owned, replace-only backup behavior remains intact.
- No fake finish, Scryfall ID, collector number, or price.
- No destructive startup writes; migration occurs at backup import or through defaults on read.
- Existing singles default behavior remains predictable.
- UI remains dense, scan-friendly, and shared-component-first.
- 1920x1080 is primary; 1366x768 must avoid broken workflow or app-level horizontal overflow.
- Delivered assets and dependencies remain local; network failure must not hide saved records.

## 10. Likely Files to Review

- `react-app/src/domain/dataFoundation.js`
- `react-app/src/domain/relatedRecords.js`
- `react-app/src/domain/trading.js`
- `react-app/src/domain/portfolio.js`
- `react-app/src/domain/signals.js`
- `react-app/src/domain/localSearch.js`
- `react-app/src/persistence/storage.js`
- `react-app/src/features/views/Views.jsx`
- `react-app/src/features/shared/TabulatorTable.jsx`
- `react-app/src/layouts/AppShell.jsx`
- `react-app/src/styles/react.css`
- `react-app/src/styles/tabulator.css`
- React tests, build tools, generated artifacts, and routed active docs.

## 11. Likely Files to Modify

- Focused asset/catalog domain and service modules plus generated catalog data.
- Existing trading, related-record, portfolio, Signals, local-search, and storage modules.
- React route composition, shared UI primitives, shell summary/help, and scoped styles.
- Migration/compatibility fixtures and focused tests.
- `react-spike/` and `react-app/dist-portable/` generated artifacts.
- README, Roadmap, Architecture, Data Model, Style Guide, Decisions, progress evidence, Changelog, and History where direction materially changes.

## 12. Implementation Expectations

- Build and test the asset identity/persistence boundary before route UI.
- Generate catalog data from a reproducible script; never hand-maintain thousands of product records.
- Reuse state, table, modal, form, notice, navigation, and formatting boundaries.
- Share calculations and commands across asset types while keeping external metadata appropriately typed.
- Commit coherent recovery points after foundation/search, core trading, integrations, and validation/docs.
- Stop only for a product/data-safety decision not resolved by Issue #16 or active repository evidence.

## 13. Acceptance Criteria

- [ ] Search switches among Singles, Sealed, and All and selects exact real products.
- [ ] Representative booster box, pack, bundle, precon/specialty, and Secret Lair products are covered and limitations recorded.
- [ ] Exact TCGplayer routing works when MTGJSON supplies identity.
- [ ] Pricing source/fallback is explicit; manual timestamped valuation is durable and drives value only after save.
- [ ] Sealed Radar planning and Radar-to-Position buying work while the product remains watched.
- [ ] Sealed Positions support buy more, weighted cost, partial sell, and full sell.
- [ ] All/Singles/Sealed filters work in Radar and Positions without regressing singles.
- [ ] Mixed Transactions and History clearly retain asset type and exact identity.
- [ ] Notes/observations resolve to the correct sealed asset and survive sell/re-buy.
- [ ] Reload and backup/export/import retain sealed state; old backups still import.
- [ ] Unpriced sealed holdings do not add invented equity or unrealized P/L.
- [ ] Existing singles fixtures and core trading tests remain green.
- [ ] Browser console and required desktop layouts are clean.
- [ ] Test, lint, format, normal build, Pages build, portable build, and artifact checks pass.

## 14. Validation Plan

### Functional

- Add and trade representative products across the complete workflow.
- Verify manual valuation, exact links, note ownership, filters, mixed records, and saved-state reload.
- Exercise empty, unpriced, missing-link, duplicate, invalid-identity, insufficient-cash, partial-sell, and full-sell states.

### Visual / Responsive

- Run the documented React dev/preview workflow.
- Review Radar, Positions, Transactions, History, Signals, Dashboard, and detail at 1920x1080 and 1366x768.
- Sanity-check tablet/phone rules where generalized controls or tables changed.

### Regression / Compatibility

- Run focused and full Node tests, source/format checks, and all three builds.
- Load v1 migration fixtures and round-trip a v2 backup containing sealed state.
- Verify existing singles records remain unmodified by read-only normalization and behave normally.
- Verify root vanilla remains operational and sealed keys do not replace singles keys.

### Quality and Edge Cases

- Inspect console/network failures, keyboard controls, dialog focus/close behavior, external-link labels, stale manual valuations, catalog load failure, and invalid identities.
- Review catalog and bundle sizes; confirm no runtime CDN or marketplace scraping.

Record actual results and evidence in the designated completion records; this plan is not proof that validation occurred.

## 15. Documentation Updates

Update `docs/README.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/STYLE_GUIDE.md`, `docs/DECISIONS.md`, `docs/REACT_SPIKE_ARCHITECTURE.md`, `docs/REACT_SPIKE_PROGRESS.md`, `CHANGELOG.md`, and `HISTORY.md` where the completed milestone changes current truth. Update `docs/LIBRARIES.md` only if dependency status changes.

## 16. Deliverables

- [ ] Real sealed asset identity and generated catalog foundation.
- [ ] Complete sealed Search → Radar → Positions → Sell → Transactions/History workflow.
- [ ] Honest manual valuation and exact external routing.
- [ ] Compatible persistence, migration fixtures, and backup/restore.
- [ ] Focused automated coverage and complete build/browser evidence.
- [ ] Updated active docs and generated delivery artifacts.
- [ ] Coherent checkpoint commits, pushed branch, and draft PR.

## 17. Suggested Commit

`docs(sealed): brief issue 16 vertical slice`

## 18. Recommended Next Task

After Issue #16 review, gather sealed-focused tester feedback and decide whether a trustworthy automated exact-product valuation source warrants a separately approved integration.
