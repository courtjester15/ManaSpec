# Changelog

ManaSpec changes are tracked here for human-readable project memory.

This file is intentionally higher level than Git history. Add user-visible workflow changes, meaningful fixes, documentation/process guardrails, and beta-relevant caveats. Do not record every tiny CSS tweak or internal refactor.

## Unreleased

### Added

- Added Tabulator 6.5.2 as the shared React table foundation behind a ManaSpec-owned wrapper, with Radar as the only Phase 1 pilot and later table modules intentionally deferred.
- Implemented the React 19/Vite 8 ManaSpec reconstruction across Dashboard, Radar, Positions, Signals, Transactions, History, and Admin with hash routing, compatibility-backed local state, shared UI primitives, tests/checks, normal output, a tracked Pages artifact, and a stable directly openable portable build.
- Added paired vanilla/React parity evidence and a dedicated implementation progress record covering the full UI pass plus table and Card Detail correction.

- Added exact-printing local Price History for Radar and Positions, including finish-aware daily snapshots, compact coverage indicators, range filtering, summary metrics, plan reference lines, and a reusable offline chart modal.
- Added Comparable Printings to Card Detail: same-Oracle paper printings expand into finish-aware native rows with sortable release/price columns, exact-printing card-art previews, aligned Scryfall and TCGplayer actions, optional Add to Radar, a pinned comparison baseline, progressive expansion, and local loading/error states.
- Added Backend Foundation Batch 3: explicit data-schema readiness, migration fixtures, reconciliation/correction semantics, runtime-only legacy-backfill provenance, and a repeatable read-only reconciliation report.
- Added Backend Foundation Batch 1 as a read-only compatibility layer: concrete ownership contracts, pure legacy normalizers, a weighted-average Transaction-to-Position projector, a discrepancy comparison harness, and fixture-backed validation without production persistence changes.
- Added the completed 2026-07-11 Data Ownership and Storage Readiness Audit, covering current storage shapes, field ownership, identity, transaction authority, backup safety, localStorage versus Dexie, and a controlled foundation sequence.
- Added `HISTORY.md` as a reconstructed narrative of ManaSpec's origin, major milestones, design shifts, workflow evolution, beta-readiness path, and current state.
- Added focused Architecture, Data Model, and Style Guide docs for current app structure, entity relationships, and UI language.
- Added Product Principles as a stable product-philosophy document for future human and AI contributors.
- Added a docs ownership map and workflow routing rules so future documentation updates land in the right active source of truth.
- Added post-beta finance workflow ideas to the Parking Lot, centered on review/learning, lightweight analytics, optional metadata, and ledger extensions that preserve ManaSpec's decision-loop focus.
- Added a Codex friction log and browser QA friction guidance for recurring tooling, harness, and workflow detours.
- Added a library-integration workflow guardrail requiring native configuration/runtime inspection before compatibility workarounds or replacement mechanics.
- Added a generated repository snapshot utility for faster GPT/Codex orientation.
- Enriched the generated repository snapshot with runtime architecture, workflow ownership, localStorage contracts, dependency hints, DOM/CSS summaries, and architecture hotspots.
- Moved point-in-time audit docs into `docs/audits/` and documented their role as diagnostic context rather than active authority.
- Added a GitHub Pages closed beta deployment runbook covering Pages settings, project-path asset readiness, localStorage persistence, backup/restore expectations, update workflow, known risks, and tester handoff.
- Added `.nojekyll` so GitHub Pages serves the root static app directly without Jekyll processing.
- Added `CONTRIBUTING.md` to welcome contributors, explain contribution expectations, and document the preferred workflow for future community and AI contributors.
- Added storage compatibility guidance for future GitHub Pages beta updates, including localStorage key/data-shape cautions and release-review expectations.
- Added a short beta tester guide covering the beta URL, backup expectations, suggested smoke-test workflows, feedback guidance, local data safety, public Pages hosting, and known limits.
- Added an approved React modernization spike charter and retained the GalleyFlow audit as historical evaluation evidence; the vanilla app remains the production/beta source of truth.
- Added a dedicated React target architecture, dependency inventory and selection guide, and dual vanilla/React deployment runbook covering portable local opening, Pages isolation, rollback, and spike removal.
- Audited the copied GalleyFlow offline package archive, verified its Windows x64 React/Vite and feature-library dependency closures, classified direct candidates and duplicates, and established `/lib` as an ignored local cache rather than tracked application source.
- Added a Roadmap React spike lane for workspace isolation, portable and Pages-path proofs, storage compatibility, full feature parity, responsive validation, and a separate promotion decision.

### Changed

- Closed React Parity Batch 1 data-trust gaps: Position deletion now honors the vanilla ledger-safety guard, related notes/history/market/transaction navigation resolves through one exact-printing helper, foil and nonfoil stay isolated, and ambiguous legacy fallbacks no longer cross-link tracked printings.
- Migrated React Radar to the shared grid contract with compact vanilla-aligned columns, sorting, editable entry targets, quantity steppers, market values, ownership/note/history indicators, isolated row actions, and responsive styling.
- Corrected the shared Tabulator sizing contract by preserving omitted library defaults, allowing Radar to fill its container, give remaining horizontal space to Card, and keep numeric, indicator, and action columns compact.
- Moved the React modernization lane from an unbuilt experiment into active implementation and stabilization. React is now the likely forward frontend candidate, while vanilla remains the behavioral and production/beta source of truth until a separate promotion decision.
- Corrected React dense tables to the established compact scan contract and restored row-body Card Detail opening with action isolation; corrected React Card Detail toward the compact vanilla command-center model.
- Refreshed the core architecture, roadmap, workflow, dependency, deployment, style, decision, migration, progress, and history documentation to match the implemented React milestone and next library-evaluation phase.

- Refined Price History with a continuous calendar-time axis, real-snapshot-only points and hover targets, a shorter non-scrolling laptop modal, and a cleaner compact trend icon.
- Prevented Position deletion when Transactions still project an open holding, closing the silent orphan path identified through the Simulacrum Synthesizer audit; real exits continue to use Sell.
- Centralized normal persistence for Positions, Radar, Transactions, and cash; connected read-only runtime normalization with compatibility-safe serialization; preserved unknown fields and stored shapes; and retained the read-only ledger discrepancy warning without automatic reconciliation.
- Completed the Data Ownership and Storage Readiness Audit and its three approved foundation batches, clearing the provisional user-facing feature sequence to resume while keeping transaction authority and computed Positions as a separately approved future migration.
- Consolidated the next likely user-facing feature candidates in the Roadmap: Comparable Printings, exact-printing price history, owned-spec backfill, and honest portfolio summary/performance work, including provisional build order, minimum scopes, and data-model gates.
- Marked the solo core singles workflow testing phase complete in active status docs, including Radar search/exact printing, Radar management, Radar-to-Positions buying, additional buys, partial/full sells, plan edits, Card Detail, Dashboard, Signals, Transactions, History, and friend-preview workflow validation.
- Marked the current project status as `v0.9.0-alpha.1` friend preview while reserving `v1.0.0-beta` for the formal beta gates.
- Aligned backup metadata with the current `v0.9.0-alpha.1` app version instead of the future `v1.0.0-beta` milestone.
- Refreshed the public-facing `README.md` to better explain ManaSpec's purpose, current status, project philosophy, workflow-first design, intended audience, current limitations, and open-source direction.
- Polished first friend-test UI notes: tightened Radar Add wording/layout, made Buy from Radar execution-only, enlarged dense quantity stepper targets, balanced toolbar buttons, aligned toast dismiss actions, and surfaced manual TCG Market Checks through Positions price hover text.
- Refocused Dashboard around a compact daily work queue with action tiles for target hits, near targets, market checks, hold reviews, missing plans, and recent notes.
- Polished Dashboard tile density, empty-state language, concise row reasons, Signals tile navigation, and unique-card Recent Notes behavior.
- Refined Dashboard summary hierarchy, uniform action tile height, left-aligned queue rows, quieter empty states, and compact printing identifiers.
- Finalized Dashboard beta polish with useful Near fallback rows, concise price context, proper summary tile hierarchy, and denser list-style action rows.
- Fixed Dashboard layout containment by removing inherited card/panel margins, clipping overflowing queue rows, and hardening list-row alignment.
- Fixed Dashboard Missing Plans so Radar cards only require entry targets, Positions require exit and hold targets, and Recent Notes show note preview text again.
- Aligned Signals attention tiles with Dashboard queue rows, including richer reason/price context, closest-target Approaching fallbacks, and clearer No Plan ownership copy.
- Polished Signals tile interactions so bucket clicks filter by bucket, queue-row clicks filter to an exact printing, and preview titles retain primary Dashboard-style emphasis.
- Reconciled active docs and Help with current Signals, Dashboard attention queues, plan ownership, early transaction ledger behavior, Roadmap status, and documentation ownership workflow.
- Added a repeated-issue workflow reminder to pause and diagnose root causes before continuing small adjustment loops.
- Standardized Codex browser QA on `python -m http.server 8000 --bind 127.0.0.1` and documented that `file://` browser blocks should not be troubleshot.

## 2026-06-24 - Project Hygiene And QA Guardrails

### Added

- Added local QA fixture guidance for `test-fixtures/` backup JSON files used during browser regression testing.
- Added a stronger table contract guardrail to the development workflow: table changes must be verified as shared-system changes across Radar, Positions, Signals, Transactions, and History.
- Added a changelog as the human-readable history layer between Git commits and the roadmap.
- Added changelog maintenance rules to the development workflow.
- Added GPT collaboration note guidance for architect summaries and implementation batches.
- Added Card Detail browser QA guidance for distinguishing art preview from the actual detail panel.
- Linked the changelog from the root README and active docs index.

### Notes

- Local QA backup JSON files in `test-fixtures/` are local-only unless explicitly sanitized and approved for commit.
- Table verification should use approximately 1366px laptop width when possible; if the browser harness cannot force that width, verify at the available width and note the limitation.

## 2026-06-23 - Workflow Confidence And Command Center Passes

### Added

- Added transaction review context with running balance and SELL realized gain/loss visibility.
- Added richer Signal action context so attention rows better explain source workflow, reason, and likely action.
- Added stronger Admin Reset Cash confirmation copy and impact preview.
- Added Dashboard/action-awareness improvements so scan panels communicate useful workflow state instead of only counts.

### Changed

- Refined Card Detail into a compact command center: printing context, primary Plan editing, Market Check, Market Evaluation, Notes, and reference context.
- Made Card Detail Plan the primary working section and removed the manual Save Plan button from the normal structured-field workflow.
- Kept Card Detail plan edits autosaving on Enter or click-away with visible re-rendered values.
- Streamlined Radar search dismissal so active search and printing results collapse when attention moves elsewhere or Card Detail opens.
- Tightened shared UI consistency for toasts, money spacing, editable bubbles, modal spacing, and loading treatments.
- Improved dense table and search-result rhythm so rows stay compact and scan-friendly.

### Fixed

- Added finish-aware TCGplayer Market Check parsing fallback so foil-only or nonfoil-only printings can use the single available pasted market value without guessing between ambiguous finishes.

- Restored transaction table layout after Balance and Realized columns caused header/data misalignment.
- Removed duplicate Radar search/loading spinner treatment.
- Suppressed Radar busy pseudo-spinner noise after loading cleanup.
- Fixed several dense table/search wrapping and typography regressions.

### Documentation

- Saved workflow pass notes and table regression notes into project memory.
- Updated Help and active docs to match Card Detail command-center behavior and current workflow confidence improvements.

## 2026-06-21 to 2026-06-22 - Beta Workflow And Table Stabilization

### Added

- Added actionable Dashboard panels and target-backed scan sections.
- Added shared card notes keyed to exact tracked printing identity.
- Added Admin JSON backup and restore for localStorage-backed user data.
- Added shared module context bands above workflow tables.
- Added Signals attention buckets and summary-tile filtering.

### Changed

- Reworked Signals into a read-only attention layer for target state, source workflow, and action context.
- Improved beta workflow responsiveness around add, buy, sell, remove, save, and table interactions.
- Reworked Radar printing picker into dense one-line rows and improved printing-result scan density.
- Improved Radar/Positions table scanning, target visibility, and shared table behavior.

### Fixed

- Restored table alignment after Radar and Positions column/layout regressions.
- Prevented wrapping in dense table and search rows.
- Clarified target display and price source labels.
- Dismissed the Radar printing picker after adding a printing.

### Documentation

- Added pasted-notes workflow guidance.
- Added notes parking lot/project memory documents for future ideas.

## Earlier Alpha Retrospective

### Added

- Built the vanilla HTML/CSS/JavaScript app shell with Dashboard, Radar, Positions, Signals, Transactions, History, and Admin zones.
- Added Scryfall-backed card search, exact printing selection, and price refresh.
- Added Radar as the pre-purchase workspace for watched ideas, entry targets, and planned quantity.
- Added Positions as the owned-holdings workflow with buy, sell, delete, P/L, target, and hold tracking.
- Added Transactions and History as audit/review surfaces for buys, sells, notes, and activity.
- Added contextual Help drawer.

### Changed

- Split card discovery/search concerns from local Radar and Positions filtering.
- Established module ownership rules for Radar, Positions, Signals, Card Detail, Transactions, History, Notes, and Admin.
- Retired Thesis from active navigation while preserving existing thesis code/data for reference.

### Notes

- ManaSpec remains in alpha stabilization. The current priority is to stabilize the singles workflow, preserve local data safety, and draft the ledger migration path before changing the storage model.
