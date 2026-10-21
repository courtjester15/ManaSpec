# Vanilla vs React Workflow and CSS Audit

Date: 2026-07-21
Scope: Point-in-time audit only; no application implementation changes.
Parity oracle: Vanilla ManaSpec.

## Executive assessment

The React spike has a strong visual and architectural foundation, but it is not yet at workflow parity with vanilla. The shared shell, core routes, storage adapter, buy/sell math, backup path, and dense desktop visual language are recognizable and generally aligned. The largest remaining gaps are not cosmetic: position deletion safety, exact-printing identity in related records, Signals behavior, Card Detail capability, and the filtering/review workflows around the dense tables.

The prior 80-90% "familiar UI" assessment remains reasonable as a visual-direction estimate. It should not be interpreted as 80-90% workflow parity or release readiness.

Recommended status: continue treating React as an implementation/stabilization candidate. Do not promote it over vanilla until the Critical and High findings below are corrected and replayed in a fresh matched browser pass.

## Evidence and limits

Reviewed:

- Current vanilla JavaScript and CSS.
- Current React source, state/storage layer, shared tables, Tabulator Radar pilot, and CSS.
- Existing matched 1366 x 768 screenshots in `docs/screenshots/react-parity/` and `docs/screenshots/react-parity-correction/`.
- Current React tests and source checks.
- Active workflow, style, migration, deployment, progress, and parity documentation.

Validation completed:

- `npm test`: 13/13 passed.
- `npm run lint`: passed.
- `npm run format:check`: passed.
- The five React legacy CSS copies match the five active vanilla stylesheets in content; four differ only by line endings.

Browser limitation:

- The documented vanilla server returned HTTP 200 from the host, but the in-app browser returned `ERR_EMPTY_RESPONSE` on the initial attempt and the one permitted clean retry. Per `docs/WORKFLOW.md`, the live browser pass stopped there. No app defect is inferred from this tooling failure.
- Therefore, findings marked "source-confirmed" are current. Visual observations are based on the existing matched captures and may predate the latest uncommitted Radar/Tabulator work. Fresh console, keyboard, responsive, and matched interaction evidence remains required.

## Priority findings

### Critical

#### C1. React position deletion bypasses the vanilla ledger-safety guard

Status: source-confirmed.

Vanilla calls `ManaSpecDataFoundation.findPositionDeletionRisk` and refuses deletion when transaction history still projects an open holding (`js/modules/portfolio/trading.js:154-176`). React directly removes the Position after a short native confirmation (`react-app/src/features/views/Views.jsx:151`).

Impact:

- A user can delete a transaction-backed open Position while leaving ledger history projecting that holding.
- React's read-only Admin reconciliation can report the damage, but it does not prevent it.
- This is a data-trust regression and a promotion blocker.

Required parity outcome:

- Reuse the shared deletion-risk rule before any delete.
- Preserve vanilla's explicit warning that deletion does not log a transaction.
- Add focused React coverage for blocked and allowed deletion.

#### C2. Related-record matching can cross exact printing or finish boundaries

Status: source-confirmed.

Vanilla notes are keyed and retrieved by the exact tracked-printing key (`js/modules/notes/notes.js:13-50`). React's shared note matcher falls back to base `scryfall_id` (`react-app/src/features/views/Views.jsx:19`), which can associate one note with foil and nonfoil variants of the same Scryfall printing. Card Detail uses a different fallback set (`Views.jsx:47`), so counts and opened-note contents can also disagree.

The same pattern appears elsewhere:

- Price History filters by base card ID but does not filter the snapshot's foil flag (`Views.jsx:65`, `108`, `150`).
- Market observations accept composite or base IDs without an explicit finish/source match (`Views.jsx:52`, `106`, `160`).
- Transaction, History, Dashboard-note, and recent-note routing can fall back to `scryfall_id` or card name and select the wrong printing when several are tracked (`Views.jsx:193`, `206`, `213`).

Impact:

- Notes, market checks, history counts, price series, or detail navigation can be attributed to the wrong exact printing/finish.
- This conflicts with the documented printing-identity and notes-ownership contracts.

Required parity outcome:

- Centralize one compatibility-aware exact-printing matcher for notes, snapshots, observations, transactions, and navigation.
- Permit legacy fallbacks only when they resolve unambiguously.
- Add foil/nonfoil and same-name/different-printing tests for each related-record type.

### High

#### H1. React Signals uses different attention logic from vanilla

Status: source-confirmed.

Vanilla defines "approaching" as within 5% of the relevant target (`js/modules/signals/signals.js:461-480`). React uses 10% (`react-app/src/features/views/Views.jsx:163`, `168`). The existing paired Dashboard captures also show different active-signal totals and queue membership, although those screenshots alone are not proof because their price timestamps differ.

React's simplified `deriveSignals` also omits much of vanilla's reason, priority, market-freshness, and action-label logic. Vanilla assigns bucket-specific priority and detailed reason state; React primarily sorts by monitor status and absolute target distance (`Views.jsx:159-171`).

Impact:

- Dashboard and Signals can disagree with vanilla on what deserves attention.
- This is product behavior, not merely wording or presentation.

Required parity outcome:

- Port or share the vanilla signal derivation as a tested domain function.
- Create fixture-based parity tests that compare every derived row, bucket, status, reason, priority, and Dashboard queue between implementations.

#### H2. Signals loses its filtering and source-navigation workflow

Status: source-confirmed.

Vanilla's four attention tiles filter the table; preview rows narrow to an exact tracked printing; `Show all` resets the state; `View` routes to and filters the source Radar/Positions row (`js/modules/signals/signals.js:65-144`, `264-265`; `js/ui/help.js:49-59`).

React renders the four summaries as passive metric cards. Its `View` action opens Scryfall in a new tab rather than opening the source workflow (`react-app/src/features/views/Views.jsx:182-185`).

Impact:

- Signals changes from an attention triage surface into a mostly read-only list.
- The label `View` has a materially different meaning.

Required parity outcome:

- Restore bucket and exact-row filtering, reset state, and source deep-linking.
- Keep external Scryfall access under a source-specific label such as `Scryfall`.

#### H3. React Card Detail is a reduced workflow, not yet the vanilla command center

Status: source-confirmed and visually evident in the existing matched Card Detail captures.

React includes plan editing, a simple market-observation form, notes, stored card context, price-history and comparable dialogs, and Scryfall/TCGplayer links. It does not currently reproduce several active vanilla capabilities:

- Live card-detail fetch and enrichment on open.
- Market Check paste parsing and refresh workflow.
- Market Evaluation output and freshness/supply/velocity/price interpretation.
- The Market Check visual help guide.
- Card Kingdom and Card Kingdom Buylist actions.
- Comparable-printing ownership state and `Add to Radar` workflow.
- Vanilla's fuller oracle/card metadata presentation.

Relevant sources: `js/modules/card-details/card-details.js:13-118`, `294-470`, `646-686`; React `react-app/src/features/views/Views.jsx:26-78`.

Impact:

- A primary research and decision workflow is missing, even though the React modal looks polished and compact.
- Comparable Printings is informational only in React where vanilla also makes it actionable.

Required parity outcome:

- Treat Card Detail as a workflow parity batch, not a CSS-polish batch.
- Preserve the compact React panel if desired, but restore the underlying capabilities and exact data semantics.

#### H4. Dense-table review controls are incomplete across most routes

Status: source-confirmed; visually evident in existing captures.

Radar and Positions in vanilla share name/set/type, rarity, type, color, price range, Reserved, printing, plan, page-size, clear/reset, count, and exact-card filtering. React Radar and Positions currently expose one text filter (`Views.jsx:130`, `155`). Transactions and History retain text/type filters but omit vanilla's reset, result count, and page-size controls. React's interim `DataTable` renders every matching row; vanilla applies the standard page-size preference.

Impact:

- Large datasets are slower to triage and produce much taller pages.
- Source deep-links cannot reliably land on an exact filtered row.
- The visual resemblance of the tables overstates workflow parity.

Required parity outcome:

- Port the shared filter model and count/page-size contract before evaluating fine-grained table styling.
- Define one React filter/state API usable by Tabulator and the remaining interim tables.

### Medium

#### M1. React Help is substantially less complete than vanilla Help

Status: source-confirmed.

Vanilla provides route-specific topics, module tips, Signals interaction guidance, Market Check guidance, and tutorial entries (`js/ui/help.js`). React provides one short static workflow drawer (`react-app/src/layouts/AppShell.jsx:66-78`).

Impact: users cannot discover several workflows that already differ or remain incomplete in React. Help/tutorial parity is part of the migration scope.

#### M2. Confirmation behavior is inconsistent and sometimes less informative

Status: source-confirmed.

React trade flows use a shared dialog, but Admin cash reset and Position delete use native `confirm`. The Position delete copy also omits vanilla's warning that no transaction is logged. This weakens the consistent modal/impact-preview contract.

#### M3. CSS parity is visually strong but structurally fragile

Status: source-confirmed.

Positive baseline:

- React imports content-equivalent copies of all five vanilla stylesheets.
- The matched screenshots show the shell, palette, typography, spacing language, and dense desktop character are recognizably ManaSpec.

Risks:

- The vanilla CSS is physically duplicated under `react-app/src/styles/legacy/`; there is no automated sync or parity check.
- React then adds approximately 304 lines of React-specific CSS and 343 lines of Tabulator CSS, plus vendor Tabulator CSS.
- Radar now uses Tabulator while Positions, Signals, Transactions, and History use the interim React `DataTable`.
- Column geometry is split among Tabulator column definitions, JavaScript width arrays in `features/shared/ui.jsx`, legacy CSS table contracts, `react.css`, and `tabulator.css`.
- Much of the copied vanilla component CSS is unused because the React markup uses parallel class families such as `react-filter-bar`, `react-table`, and `compact-detail`.

Impact:

- A vanilla CSS correction can silently fail to reach React or be overridden by the parallel layer.
- Table fixes can solve Radar while leaving the other four dense-table surfaces inconsistent.
- Cascade and ownership are harder to reason about than the screenshot similarity suggests.

Recommended direction:

- Make shared tokens and truly shared primitives one owned source.
- Keep React-specific layout CSS, but avoid retaining unused full legacy component sheets indefinitely.
- Complete one shared table/filter contract before migrating the remaining tables.
- Add a CI check that detects drift in any legacy CSS files intentionally kept identical.

#### M4. Existing parity records overstate what has been demonstrated

Status: documentation finding.

`docs/REACT_PARITY_LOG.md` marks all seven routes implemented/compared and checks broad shared parity requirements. That record is useful visual evidence, but the current source still contains the workflow and data-identity gaps above. It should be read as a milestone snapshot, not proof of complete parity.

Recommended direction: update the log after review to distinguish visual-shell parity, workflow parity, data-semantic parity, responsive/accessibility evidence, and deployment evidence.

## Route-by-route summary

| Surface | Current assessment | Main remaining work |
| --- | --- | --- |
| Shared shell | Close visually | Full Help parity; consistent button/confirmation styling; fresh responsive/keyboard pass |
| Dashboard | Visually close, behavior at risk | Share exact Signals derivation; validate all eight queue memberships and detail routing |
| Radar | Strong table pilot, incomplete review workflow | Restore shared filters/count/page-size/exact filtering; fresh Tabulator capture and interaction pass |
| Positions | Visually close, one critical safety defect | Restore delete guard; exact related-record identity; filters/page size; migrate shared table deliberately |
| Signals | Material workflow mismatch | 5% logic parity, bucket filtering, priority/reason parity, source `View` navigation |
| Transactions | Core ledger present | Exact-printing detail resolution; reset/count/page size; matched field/format audit |
| History | Core chronology present | Exact-printing detail resolution; reset/count/page size; verify event taxonomy against vanilla |
| Card Detail | Polished reduced version | Market Check/Evaluation/help, live metadata, market links, comparable actions, identity-safe related data |
| Admin | Strong safety foundation | Consistent confirmations; controlled React-write/vanilla-read test; interpret reconciliation results carefully |

## Recommended review order for Jason and Pete

1. Agree that C1 and C2 are release blockers because they affect data trust.
2. Decide whether vanilla Signals behavior is still the exact desired product contract; if yes, port/share it rather than tuning React independently.
3. Review Card Detail by capability checklist, not screenshot resemblance.
4. Approve one shared React filter/table contract before migrating Positions, Signals, Transactions, and History to Tabulator.
5. Decide which visual differences are intentional React corrections and record only those as accepted differences.
6. After fixes, run one fixture-backed matched pass at 1366 x 768, tablet, and phone, including console, keyboard, destructive-action, and React-write/vanilla-read checks.

## Suggested acceptance gates before promotion

- No Position deletion can violate ledger projection.
- Notes, observations, price history, transactions, and deep-links resolve exact printing and finish.
- Fixture-based Signals and Dashboard outputs match vanilla exactly.
- Signals filtering and source navigation match the documented workflow.
- Card Detail capability checklist passes, including comparable actions and Market Check/Evaluation.
- Shared filters, counts, reset, and page-size behavior pass on Radar, Positions, Signals, Transactions, and History.
- Same fixture produces matched route counts and key computed values in both apps.
- Fresh 1366 x 768, tablet, phone, console, and keyboard evidence is recorded.
- Controlled React-write/vanilla-read and backup round-trip checks pass.
