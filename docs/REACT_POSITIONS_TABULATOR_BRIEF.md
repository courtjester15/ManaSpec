# React Positions Tabulator Migration

## Metadata

- **Status:** Completed
- **Date:** 2026-07-26
- **Brief Size:** Standard
- **Related Documents / Issues:** GitHub Issue #8, GitHub Issue #6, `docs/REACT_POSITION_DATA_TRUST_BRIEF.md`, `docs/REACT_SPIKE_ARCHITECTURE.md`, `docs/DECISIONS.md`
- **Author:** Codex
- **Approver:** Project owner

This brief is an implementation plan, not an implementation log. Record completed work, deviations, validation results, and evidence in the project's designated completion record.

## 1. Objective

Replace the interim Positions `DataTable` with the existing shared `TabulatorTable` configuration while preserving the canonical Position-row boundary, reconciliation and calculation rules established by Issue #6, current filtering and focus behavior, editing, row activation, actions, dense sizing, and responsive behavior. Success is a focused Positions-only migration that passes automated and build validation and a fixture-backed 1366 x 768 vanilla/React visual, interaction, and console comparison.

## 2. Background

Radar has validated the shared ManaSpec-owned `TabulatorTable` wrapper and theme. Positions intentionally remained on the interim `DataTable` until Position Data Trust established a trustworthy canonical runtime row boundary. Issue #6 is merged and closed; its selector derives quantity, average buy price, and acquisition date from vanilla-compatible `qty`, `buyPrice`, and `buyDate`, classifies invalid ownership records for reconciliation, excludes them from calculations and normal actions, and preserves compatible storage.

Issue #8 approves migrating only the Positions table through the established wrapper. It does not reopen the validation semantics from Issue #6 or authorize shared-table redesign.

## 3. Scope

### In Scope

- Replace the Positions `DataTable` instance with `TabulatorTable`.
- Configure the approved 19 columns, one flexible Card column, and fixed compact utility widths.
- Preserve existing sort values, null-safe and reconciliation formatters, Target/Hold edits, Card Detail, Buy, Sell, guarded Delete, Notes/History counts, row/action isolation, focus filtering, and text filtering.
- Continue supplying canonical rows from `selectPositionRows`.
- Add only narrowly justified `.ms-tabulator--positions` styling.
- Add focused regression coverage without redefining Issue #6 validation rules.
- Complete all automated/build checks and 1366 x 768 browser verification.
- Record completion evidence, comment on Issue #8, and open a focused PR into `codex/react-modernization-integration`.

### Out of Scope

- Migrating any table other than Positions.
- Retiring the interim `DataTable`.
- Changing canonical validation, calculation eligibility, reconciliation wording semantics, persisted fields, or storage compatibility.
- Expanding the shared `TabulatorTable` API without a focused failing regression.
- Adding Tabulator filtering, pagination, grouping, export, column-moving, or other modules.
- Restoring or redesigning the full vanilla Position filter panel.
- Card Detail, reconciliation workflow, responsive system, or shared-table redesign.
- Unrelated cleanup or shared styling expansion.

## 4. Existing Architecture

`PositionsView` builds canonical rows with `selectPositionRows`, calculates portfolio metrics from those rows, filters them in React, and uses `sourceRecord` only for compatible state commands. The shared `TabulatorTable` owns Tabulator lifecycle, cloned input data, React formatter roots, sorting adapters, editors, row/action isolation, empty state, `fitColumns` sizing, and responsive card styling. Feature views own column intent, renderers, actions, and edit callbacks.

Persisted records remain vanilla-compatible. Canonical display concepts are runtime-only and must not be serialized as replacement fields.

## 5. Existing Research / Decisions

- GitHub Issue #8 contains the approved column, sizing, behavior, regression, and validation scope.
- `docs/REACT_POSITION_DATA_TRUST_BRIEF.md` owns the completed canonical Position data-trust boundary.
- `docs/DECISIONS.md` adopts Tabulator behind the ManaSpec wrapper.
- `docs/REACT_SPIKE_ARCHITECTURE.md` defines the wrapper/feature ownership boundary.
- `docs/RADAR_TABULATOR_LAYOUT_BRIEF.md` establishes one flexible scan column, fixed compact columns, and native Tabulator sizing ownership.

## 6. Assumptions

- The existing wrapper contracts for renderers, sort values, editors, edit callbacks, initial sort, row activation, and sizing are sufficient.
- Representative invalid Position records retain stable source IDs after compatibility normalization. If a real regression demonstrates an ID collision, prefer a Positions-only presentation key before proposing a shared API change.
- The Issue #6 fixtures remain authoritative for required-field validity; this migration adds table-boundary coverage without expanding those rules.

## 7. Dependencies

- Issue #6 is merged into `codex/react-modernization-integration` and closed.
- Local Node dependencies are installed for React validation.
- A functioning in-app browser session is required for final 1366 x 768 QA.

## 8. Risks

- **Risk:** Tabulator data replacement or React formatter roots could disrupt inline editing or actions.
  - **Mitigation:** Use established wrapper contracts, avoid shared lifecycle changes, and exercise both edits and all row actions in browser QA.
- **Risk:** Fixed utility widths could crowd reconciliation pills or action controls.
  - **Mitigation:** Preserve the approved widths, use Card as the sole flexible column, and add only evidence-backed Positions-specific styling after 1366 x 768 inspection.
- **Risk:** Migration could bypass canonical validation by using raw records or coercing invalid values.
  - **Mitigation:** Keep `selectPositionRows` as the sole table row boundary and add focused source/behavior regression coverage using existing fixtures.
- **Risk:** Interactive controls could trigger row-level Card Detail.
  - **Mitigation:** Retain the wrapper's interactive-target isolation and verify Target, Hold, Buy, Sell, Delete, and reconciliation controls.

## 9. Constraints

- Vanilla remains the behavioral and visual source of truth.
- The canonical validation and reconciliation rules from Issue #6 are immutable in this batch.
- Writes must preserve vanilla storage fields and unknown stored data.
- Tabulator owns normal sizing, redraw, sorting, and editor mechanics; no DOM measurement or timing workaround is allowed.
- Desktop baseline is exactly 1366 x 768; shared card behavior remains at 760px and below.
- Runtime dependencies remain bundled locally with no CDN addition.

## 10. Likely Files to Review

- `react-app/src/features/views/Views.jsx`
- `react-app/src/features/shared/TabulatorTable.jsx`
- `react-app/src/features/shared/ui.jsx`
- `react-app/src/styles/tabulator.css`
- `react-app/src/styles/react.css`
- `react-app/src/domain/portfolio.js`
- `react-app/src/test/fixtures/positions.js`
- `react-app/src/test/portfolio.test.js`
- `js/modules/portfolio/portfolio.js`
- `react-app/src/styles/legacy/tables.css`

## 11. Likely Files to Modify

- `react-app/src/features/views/Views.jsx`
- `react-app/src/styles/tabulator.css` only if final layout evidence requires a narrow Positions rule
- Focused React test files if table-boundary behavior can be tested without speculative component infrastructure
- `docs/REACT_SPIKE_PROGRESS.md`
- `CHANGELOG.md`, `docs/ROADMAP.md`, or migration notes only where their current status requires an update
- Generated Pages and portable React artifacts

## 12. Implementation Expectations

- Translate the existing Positions column behavior into the established wrapper contract rather than introducing a second grid abstraction.
- Use Card with `minWidth: 170`, `widthGrow: 1`, and `widthShrink: 1`; do not assign it an explicit width.
- Use the approved fixed widths and `widthShrink: 0` for the other 18 columns.
- Preserve the external FilterBar and pre-table filtering.
- Use existing wrapper editors where they preserve current compatible Target and Hold writes.
- Keep valid and invalid action behavior unchanged.
- Do not modify the wrapper unless a focused regression first proves the existing contract insufficient.

## 13. Acceptance Criteria

- [x] Positions uses the existing shared `TabulatorTable`.
- [x] All approved 19 columns and sizing intentions are present.
- [x] Card is the sole flexible desktop column and compact columns remain fixed.
- [x] Existing sort values, text filtering, focus reset, editing, row activation, and actions are preserved.
- [x] Canonical rows remain the table input boundary.
- [x] Issue #6 validation, reconciliation, calculation exclusion, `buyDate`, and exact-identity rules remain unchanged.
- [x] Target and Hold writes use compatible persisted fields.
- [x] Invalid rows remain visible and blocked from normal actions.
- [x] Only narrowly justified Positions-specific styling is added.
- [x] No unsupported shared-wrapper expansion occurs.
- [x] Focused and full automated/build checks pass.
- [x] The 1366 x 768 visual, interaction, and console verification passes.

## 14. Validation Plan

### Functional

- Run focused canonical/table-boundary tests and the complete React test suite.
- Exercise Card sorting, text filtering, focus reset, Target edit, Hold edit, Card Detail, Buy, Sell, and guarded Delete with fixture-backed data.
- Confirm invalid rows show reconciliation-only behavior.

### Visual / Responsive

- Compare vanilla and React Positions at exactly 1366 x 768.
- Measure document, table root, holder, table, and column widths.
- Confirm Card absorbs remaining width and compact columns/actions remain readable.
- Confirm the existing 760px shared card behavior is not changed by source or styling.

### Regression / Compatibility

- Verify canonical rows still derive `quantity`, `averageBuyPrice`, and `acquiredAt` from `qty`, `buyPrice`, and `buyDate`.
- Verify invalid and zero values retain the established reconciliation classifications and calculation exclusion without adding rules.
- Verify Target/Hold edits write existing compatible fields and do not pollute backups.
- Run normal, Pages, and portable builds and syntax-check generated JavaScript.

### Quality and Edge Cases

- Run lint and formatting checks.
- Inspect browser console warnings and errors.
- Confirm interactive cells do not trigger row activation.
- Confirm representative valid, missing quantity, zero buy price, missing buy date, invalid identity, and unavailable-current-price rows render safely.

Record actual results and evidence in the project's designated completion record; do not treat this plan as proof that validation occurred.

## 15. Documentation Updates

Update `docs/REACT_SPIKE_PROGRESS.md` with actual completion and validation evidence. Update active migration/library status documents only if the completed migration makes their current statements stale. Keep the brief as an approved plan rather than a completion log.

## 16. Deliverables

- [x] Focused Positions `TabulatorTable` migration completed
- [x] Canonical and reconciliation behavior preserved
- [x] Applicable focused regression coverage added
- [x] Automated/build validation completed
- [x] 1366 x 768 browser evidence completed
- [ ] Completion evidence recorded and Issue #8 commented
- [ ] Focused PR opened into `codex/react-modernization-integration`

## 17. Suggested Commit

`feat(react): migrate Positions to shared Tabulator table`

## 18. Recommended Next Task

Review the next individually bounded interim-table migration after Issue #8 is reviewed and merged. No subsequent migration is part of this brief.
