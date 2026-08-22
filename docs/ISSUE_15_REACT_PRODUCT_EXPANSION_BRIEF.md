# React Product Expansion and Alpha Readiness Batch

## Metadata

- **Status:** In Progress
- **Date:** 2026-08-06
- **Brief Size:** High-Risk
- **Related Documents / Issues:** [GitHub Issue #15](https://github.com/courtjester15/ManaSpec/issues/15), [React Migration Notes](REACT_MIGRATION_NOTES.md), [React Spike Architecture](REACT_SPIKE_ARCHITECTURE.md), [Data Model](DATA_MODEL.md), [Product Principles](PRODUCT_PRINCIPLES.md)
- **Author:** Codex with project-owner direction
- **Approver:** Project owner through Issue #15

This brief is an implementation plan, not an implementation log. Completed work, deviations, validation results, and evidence belong in `REACT_SPIKE_PROGRESS.md`, the canonical current-state documents, and the checkpoint commits.

## 1. Objective

Advance the compatibility-backed React application from parity stabilization into a more useful alpha decision terminal. Deliver five independently reviewable checkpoints: an honest portfolio summary, useful exact-printing price history, local ManaSpec search, a focused UX/parity sweep, and canonical alpha-readiness documentation. Preserve user data, established workflows, and the vanilla behavior/data contracts.

Success means each completed checkpoint is independently tested, browser-reviewed, committed, and pushed; unresolved product policy blocks only its affected checkpoint.

## 2. Background

The React reconstruction implements the seven primary routes, shared shell, compatible local state, Tabulator-backed workflow tables, Card Detail, Signals derivation, and normal/Pages/portable outputs. The remaining work in Issue #15 intentionally combines approved roadmap capabilities with alpha cohesion and documentation reconciliation.

The issue body originally treated 1366×768 as the primary desktop viewport. The issue's resolution-baseline comment supersedes that requirement: 1920×1080 is the canonical desktop presentation, while 1366×768 remains a required compact compatibility target. Additional width should improve working context and scanability rather than merely stretching the laptop layout.

## 3. Scope

### In Scope

- Derive current portfolio cash, deployed capital, marked value, unrealized P/L, transaction-supported realized P/L, current equity, and computable Radar planned capital.
- Expand exact-printing/finish Price History with honest ranges, observation context, and Position/Radar reference values.
- Add categorized local search over Radar, Positions, Transactions, History, and Notes with exact-source navigation.
- Correct evidenced Signals geometry, shared table/filter behavior, labels, empty/disabled states, notices, Help copy, hierarchy, and desktop compression issues.
- Reconcile current React status, dependency choices, viewport priority, validation evidence, and promotion blockers across canonical docs.
- Regenerate the committed Pages and portable React artifacts after applicable source changes.

### Out of Scope

- Transaction authority or computing Positions from Transactions.
- Collection import/management, sealed product, IndexedDB/Dexie, backend/database work, automated recommendations, new market integrations, or new application-state infrastructure.
- A command palette, generalized design-system replacement, app-shell redesign, or speculative responsive redesign.
- Historical performance/equity curves that cannot be reconstructed from recorded observations.

## 4. Existing Architecture

- `AppStateProvider` owns compatible persisted slices through the storage adapter; UI code does not access localStorage directly.
- Pure domain modules own Position normalization, portfolio math, exact-printing related-record resolution, trading, Signals, and data-foundation logic.
- `Views.jsx` currently owns route composition and contextual Card Detail/Price History UI.
- `AppShell.jsx` owns account summary, navigation, Help, and the existing Scryfall-oriented global search entry.
- `TabulatorTable` centralizes shared grid lifecycle and mechanics while each route owns columns, filters, and actions.
- Vanilla modules remain the behavior oracle when active documentation or React intent is unclear.
- Normal, Pages-subpath, and portable Vite builds are required; production dependencies bundle locally with no runtime CDN.

## 5. Existing Research / Decisions

- [Product Principles](PRODUCT_PRINCIPLES.md) establishes exact-printing identity, workflow ownership, dense information, local-first data, and complexity discipline.
- [Data Model](DATA_MODEL.md) defines current Position/Transaction transitional ownership and Snapshot identity/observation honesty.
- [Libraries](LIBRARIES.md) documents Chart.js and Fuse.js as evidence-driven candidates and Tabulator as the adopted shared table engine.
- [Deployment](DEPLOYMENT.md) defines normal, Pages, and portable build requirements.
- Vanilla Price History is the approved evidence for ranges, observation handling, and reference-line semantics.

## 6. Assumptions

- SELL records with a finite stored `realizedPL` are the only honest source for realized P/L in this batch; missing realized values are reported as unavailable coverage, not reconstructed policy.
- Radar planned capital is computable only when planned quantity and a positive entry target are present.
- Current equity means cash plus marked value of calculation-eligible open Positions; it is not historical total return.
- Search may use native normalized substring/token matching unless Fuse.js demonstrates a concrete quality and maintenance advantage on actual local entities.
- Price History may use direct Chart.js integration if it materially simplifies ranges/reference lines and remains compatible with all builds.

## 7. Dependencies

- Existing locally stored state and compatibility adapters.
- Scryfall remains the existing network source for current exact-printing reference prices.
- npm package resolution only if Chart.js or Fuse.js is adopted after the checkpoint evaluation.
- GitHub authentication and the current branch remote for checkpoint pushes.

## 8. Risks

- **Risk:** Summary math could imply unsupported historical performance or include invalid/unpriced ownership rows.
  - **Mitigation:** Keep realized/unrealized/current-state labels explicit, extend pure tested selectors, and surface incomplete coverage.
- **Risk:** Legacy snapshot and transaction records may have incomplete identity or value fields.
  - **Mitigation:** Resolve through the existing compatibility boundary, never fabricate missing observations, and expose honest insufficient/partial states.
- **Risk:** Local search could open the wrong same-name printing.
  - **Mitigation:** Results retain source entity and exact printing keys; fallback resolution opens Card Detail only when unambiguous.
- **Risk:** UI changes optimized for 1920×1080 could regress 1366×768 or portable output.
  - **Mitigation:** Review 1920×1080 first, then explicit 1366×768 compression and representative tablet/phone sanity checks.
- **Risk:** Generated artifacts can obscure source review or drift from source.
  - **Mitigation:** Validate source first, regenerate through repository scripts, and include artifacts in the same applicable checkpoint commit.
- **Risk:** Checkpoints may reveal unresolved product/data policy.
  - **Mitigation:** Record the exact decision, options, and recommendation; leave that portion unimplemented and continue independent checkpoints.

## 9. Constraints

- Preserve exact Scryfall printing plus finish identity and existing storage/backup compatibility.
- Preserve the Radar/Positions/Transactions ownership boundaries and existing workflows.
- Reuse domain selectors, storage adapters, shared UI, dialogs, notices, navigation, and Tabulator infrastructure.
- No runtime CDN and no dependency without a current demonstrated use case.
- 1920×1080 is the primary desktop design and acceptance target; 1366×768 must compress cleanly without app-level horizontal overflow.
- Maintain compact terminal density, keyboard access, associated labels, reasonable focus behavior, and honest empty/disabled states.
- Do not mutate stored data during read-only derivation or startup normalization.

## 10. Likely Files to Review

- `README.md`
- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/STYLE_GUIDE.md`
- `docs/DECISIONS.md`
- `docs/LIBRARIES.md`
- `docs/REACT_MIGRATION_NOTES.md`
- `docs/REACT_SPIKE_ARCHITECTURE.md`
- `docs/REACT_SPIKE_PROGRESS.md`
- `docs/DEPLOYMENT.md`
- `js/modules/dashboard/dashboard.js`
- `js/modules/price-history/price-history.js`
- `react-app/src/domain/portfolio.js`
- `react-app/src/domain/relatedRecords.js`
- `react-app/src/features/views/Views.jsx`
- `react-app/src/features/shared/TabulatorTable.jsx`
- `react-app/src/layouts/AppShell.jsx`
- `react-app/src/persistence/storage.js`
- `react-app/src/styles/react.css`
- `react-app/src/styles/tabulator.css`

## 11. Likely Files to Modify

- Focused domain modules and tests under `react-app/src/domain/` and `react-app/src/test/`.
- React route, shell, shared UI/table, and style files needed by each checkpoint.
- `react-app/package.json` and lockfile only for an approved dependency adoption.
- `react-spike/` and `react-app/dist-portable/` generated artifacts.
- Canonical docs, progress evidence, changelog/history where the completed milestone changes current truth.

## 12. Implementation Expectations

- Execute in issue order when practical, but do not let an unresolved later checkpoint invalidate or delay completed independent work.
- Begin each checkpoint by comparing the current React surface, vanilla evidence, canonical docs, and shared infrastructure.
- Put derivation and matching logic in focused pure modules with tests; keep transient view state in components.
- Keep checkpoint diffs coherent and stage explicit files so unrelated worktree content is preserved.
- Commit and push each completed checkpoint separately after its focused validation.
- Record actual validation and deviations outside this plan.

## 13. Acceptance Criteria

- [ ] Dashboard metrics trace to compatible current state; realized and unrealized P/L are distinct and incomplete coverage is explicit.
- [ ] Price History shows only recorded exact-printing/finish observations, useful ranges, current/prior/date context, and applicable entry/cost/exit references.
- [ ] Local search categorizes relevant stored entities, supports partial local text, and routes to the exact available workflow context without changing Radar Scryfall search.
- [ ] Signals geometry and shared table/filter/UI inconsistencies are corrected through shared infrastructure where ownership is shared.
- [ ] 1920×1080 uses available space deliberately; 1366×768 remains compact and free of app-level horizontal overflow.
- [ ] Storage and backup formats remain compatible; no transaction-authority migration occurs.
- [ ] Canonical docs distinguish historical spike evidence, current implementation, remaining blockers, and the evidence-based promotion recommendation.
- [ ] Tests, lint/source policy, format, normal build, Pages build, portable build, and required browser routes complete or any environmental limitation is recorded explicitly.

## 14. Validation Plan

### Functional

- Run focused Node tests after each domain checkpoint and the full `npm test` suite before its commit.
- Exercise Dashboard, exact Card Detail/Price History, local search result routing, table filtering/reset, workflow row actions, and Admin backup/restore preview.
- Verify empty, sparse, incomplete, same-name, and foil/nonfoil cases.

### Visual / Responsive

- Serve/preview React using the documented React workflow.
- Review 1920×1080 first for intentional information use and working context.
- Review 1366×768 second for compact compression and no app-level horizontal overflow.
- Perform representative tablet and phone sanity checks using existing responsive rules.
- Capture screenshots when they materially support comparison or regression evidence.

### Regression / Compatibility

- Run `npm run lint`, `npm run format:check`, `npm run build`, `npm run build:pages`, and `npm run build:portable`.
- Confirm generated Pages and portable entries contain local assets and remain hash-route safe.
- Preserve vanilla root files and existing localStorage keys/backup envelope.
- Where supported, verify compatibility fixtures and controlled vanilla/React cross-read expectations.

### Quality and Edge Cases

- Inspect console errors across Dashboard, Radar, Positions, Signals, Transactions, History, Card Detail, and Admin.
- Verify keyboard search, empty results, dialog closing/focus, disabled/reset controls, exact-source navigation, and sparse chart accessibility copy.
- Review bundle change if a dependency is added and record selection/rejection evidence.

## 15. Documentation Updates

Checkpoint 5 will reconcile at minimum `ROADMAP.md`, `REACT_MIGRATION_NOTES.md`, `REACT_SPIKE_PROGRESS.md`, `LIBRARIES.md`, `ARCHITECTURE.md`, `DECISIONS.md`, README/deployment documentation where affected, and the project-wide desktop baseline. Earlier checkpoints may update owning docs when behavior or dependency decisions change.

## 16. Deliverables

- [ ] Five independently reviewable checkpoint outcomes or explicit, bounded decision records for incomplete portions.
- [ ] Focused automated coverage for new domain calculations and matching/range behavior.
- [ ] Preserved user data and established workflows.
- [ ] Updated generated Pages and portable artifacts.
- [ ] Canonical alpha-readiness/promotion recommendation.
- [ ] Checkpoint commits pushed with completion and validation evidence.

## 17. Suggested Commits

- `docs(react): brief issue 15 expansion batch`
- `feat(dashboard): add honest portfolio summary`
- `feat(history): expand exact printing price history`
- `feat(search): add local ManaSpec search`
- `fix(react): polish shared alpha workflows`
- `docs(react): reconcile alpha readiness`

## 18. Recommended Next Task

After the batch, open a focused issue for the highest-priority blocker identified by the promotion review. A production cutover, transaction-authority migration, or broad responsive redesign requires separate approval.
