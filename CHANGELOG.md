# Changelog

ManaSpec changes are tracked here for human-readable project memory.

This file is intentionally higher level than Git history. Add user-visible workflow changes, meaningful fixes, documentation/process guardrails, and beta-relevant caveats. Do not record every tiny CSS tweak or internal refactor.

## Unreleased

### Added

- Added focused Architecture, Data Model, and Style Guide docs for current app structure, entity relationships, and UI language.
- Added Product Principles as a stable product-philosophy document for future human and AI contributors.
- Added a docs ownership map and workflow routing rules so future documentation updates land in the right active source of truth.
- Added a Codex friction log and browser QA friction guidance for recurring tooling, harness, and workflow detours.
- Added a generated repository snapshot utility for faster GPT/Codex orientation.
- Moved point-in-time audit docs into `docs/audits/` and documented their role as diagnostic context rather than active authority.

### Changed

- Marked the current project status as `v0.9.0-alpha.1` friend preview while reserving `v1.0.0-beta` for the formal beta gates.
- Refocused Dashboard around a compact daily work queue with action tiles for target hits, near targets, market checks, hold reviews, missing plans, and recent notes.
- Polished Dashboard tile density, empty-state language, concise row reasons, Signals tile navigation, and unique-card Recent Notes behavior.
- Refined Dashboard summary hierarchy, uniform action tile height, left-aligned queue rows, quieter empty states, and compact printing identifiers.
- Finalized Dashboard beta polish with useful Near fallback rows, concise price context, proper summary tile hierarchy, and denser list-style action rows.
- Fixed Dashboard layout containment by removing inherited card/panel margins, clipping overflowing queue rows, and hardening list-row alignment.
- Fixed Dashboard Missing Plans so Radar cards only require entry targets, Positions require exit and hold targets, and Recent Notes show note preview text again.
- Aligned Signals attention tiles with Dashboard queue rows, including richer reason/price context, closest-target Approaching fallbacks, and clearer No Plan ownership copy.
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
