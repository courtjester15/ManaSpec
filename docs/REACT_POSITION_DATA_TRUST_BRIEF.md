# React Position Data Trust Implementation Brief

## Metadata

- **Status:** Completed
- **Date:** 2026-07-24
- **Brief Size:** High-Risk
- **Related Documents / Issues:** GitHub Issue #6; `docs/REACT_MIGRATION_NOTES.md`; `docs/REACT_SPIKE_ARCHITECTURE.md`; `docs/DATA_MODEL.md`
- **Author:** Codex
- **Approver:** Project owner through approved GitHub Issue #6

This brief is an implementation plan, not an implementation log. Record completed work, deviations, validation results, and evidence in the project's designated completion record.

## 1. Objective

Introduce a canonical, read-only React Position row model that derives its required values from the vanilla-compatible `qty`, `buyPrice`, and `buyDate` fields. Correct the Positions date display, identify invalid Position records without silently repairing them, and exclude invalid records from portfolio calculations and open-position counts while preserving storage and backup compatibility.

## 2. Background

Vanilla is the behavioral and persisted-data source of truth. Vanilla Positions use `buyDate` for acquisition age and date, but React currently renders `addedAt || createdAt`. React normalization already preserves `qty`, `buyPrice`, and `buyDate`; however, missing values can render blank or be coerced to legitimate-looking zeroes by shared calculations and money formatting. The approved architecture review requires a selector boundary between persisted compatibility records and clearer React row concepts.

An open Position requires exact printing identity, positive finite quantity, positive finite buy price, and a valid buy date. Missing, zero, or invalid required values require reconciliation and must not affect portfolio calculations or counts.

## 3. Scope

### In Scope

- Add a pure canonical Position selector/row builder and focused validation.
- Derive `quantity`, `averageBuyPrice`, and `acquiredAt` only from `qty`, `buyPrice`, and `buyDate`.
- Use canonical Position rows in the React Positions view and portfolio summary.
- Show invalid required values as reconciliation-required rather than legitimate zeroes.
- Exclude invalid Positions from invested capital, marked value, profit/loss, and open-position counts.
- Preserve exact printing identity, compatible serialization, backup import/export, and unknown fields.
- Add sanitized regression fixtures and focused tests.
- Regenerate the committed React Pages and portable artifacts.
- Record implementation and validation evidence in the React progress/current-state documentation.

### Out of Scope

- Migrating Positions or any other module to `TabulatorTable`.
- Modifying `TabulatorTable`, shared table architecture, or table CSS architecture.
- Adding speculative date or numeric aliases.
- Automatically repairing or destructively migrating invalid records.
- Changing ledger, reconciliation-event, or transaction-projection architecture.
- Redesigning the Positions table.

## 4. Existing Architecture

`createStorageAdapter` loads `specs` through `dataFoundation.normalizeSpec`, which preserves compatible raw records and produces normalized `qty`, `buyPrice`, `buyDate`, and exact printing identity. `PositionsView` currently consumes `state.specs` directly, defines module columns, and uses the interim `DataTable`. `calculatePortfolioSummary` currently coerces invalid numeric values to zero. The implementation will add a domain selector between normalized state and those consumers without changing persistence or shared table components.

## 5. Existing Research / Decisions

- GitHub Issue #5 approved the persisted-record versus canonical-row boundary.
- GitHub Issue #6 defines the focused Position Data Trust batch and its acceptance criteria.
- The checked repository backup contains `qty`, `buyPrice`, and `buyDate`, with no evidence supporting `quantity`, `averageBuyPrice`, `addedAt`, or `createdAt` aliases.
- Vanilla `js/modules/portfolio/portfolio.js` uses `buyDate` and filters open Positions by positive `qty`.

## 6. Assumptions

- A valid open Position requires exact printing identity, positive finite quantity, positive finite buy price, and valid buy date.
- Zero quantity and zero buy price are invalid for an open Position.
- Current price may be unavailable without invalidating stored ownership, but rows without a valid current price are excluded from calculations that require current value and are surfaced explicitly.
- Canonical React row names are runtime concepts and are never persisted as replacement fields.

## 7. Dependencies

- Existing compatibility metadata and serializer behavior in `dataFoundation` and `storage`.
- Existing vanilla Position behavior and retained sanitized fixtures.
- No new package dependency is required.

## 8. Risks

- **Risk:** Treating a historical but legitimate record as invalid.
  - **Mitigation:** Use only approved persisted fields and add fixtures for every accepted/invalid shape.
- **Risk:** Canonical aliases leak into persisted storage.
  - **Mitigation:** Keep the row model separate from state records and test serialization after compatible edits.
- **Risk:** Invalid records silently distort financial summaries.
  - **Mitigation:** Gate calculations on explicit validation and test every missing/zero/invalid required field.
- **Risk:** Invalid records become invisible and cannot be reconciled.
  - **Mitigation:** Keep them visible in Positions with concise reconciliation-required presentation while excluding them from financial metrics.
- **Risk:** Generated deployment artifacts diverge from source.
  - **Mitigation:** Regenerate both documented artifacts and run syntax/build/browser checks.

## 9. Constraints

- Preserve vanilla localStorage keys and record fields.
- Preserve unknown fields and exact printing identity.
- Do not write during normalization or startup.
- Do not fabricate zeroes or automatic repairs.
- Keep the existing `DataTable` and module-specific Positions workflow.
- Preserve the 1366 x 768 dense desktop baseline.
- Keep changes reviewable as one focused Issue #6 batch.

## 10. Likely Files to Review

- `js/modules/portfolio/portfolio.js`
- `js/core/data-foundation.js`
- `react-app/src/domain/dataFoundation.js`
- `react-app/src/domain/portfolio.js`
- `react-app/src/features/views/Views.jsx`
- `react-app/src/persistence/storage.js`
- `react-app/src/test/storage.test.js`
- `test-fixtures/manaspec-backup-2026-06-29-2223.json`

## 11. Likely Files to Modify

- `react-app/src/domain/portfolio.js`
- `react-app/src/features/views/Views.jsx`
- `react-app/src/test/fixtures/positions.js`
- `react-app/src/test/portfolio.test.js`
- `react-app/src/test/storage.test.js`
- `docs/REACT_POSITION_DATA_TRUST_BRIEF.md`
- `docs/REACT_SPIKE_PROGRESS.md`
- generated `react-app/dist-portable/` and `react-spike/` artifacts

## 12. Implementation Expectations

- Build a pure selector rather than renaming persisted fields.
- Return explicit validation status and issue codes suitable for calculation gates and concise UI messages.
- Preserve the original normalized record or a stable reference needed by existing actions, without persisting the canonical row.
- Keep edits and trade actions operating on vanilla-compatible state records.
- Add no shared-table abstractions or unrelated cleanup.

## 13. Acceptance Criteria

- [ ] Positions age and acquisition date come only from `buyDate`.
- [ ] Canonical rows expose clear runtime concepts derived from vanilla-compatible fields.
- [ ] Exact printing identity, positive quantity, positive buy price, and valid buy date are required.
- [ ] Missing, zero, or invalid required values display as reconciliation-required and never as legitimate zeroes.
- [ ] Invalid Positions remain visible but do not affect financial calculations or open-position counts.
- [ ] Valid existing Positions retain their current calculations and workflows.
- [ ] No speculative aliases or persisted canonical-row fields are introduced.
- [ ] Backup round trips and compatible edits preserve `qty`, `buyPrice`, `buyDate`, and unknown fields.
- [ ] Focused and existing automated checks pass.
- [ ] Browser verification passes at 1366 x 768 with no unexplained console errors.

## 14. Validation Plan

### Functional

- Run focused Position selector, calculation, and storage tests.
- Run the full React test suite.
- Import sanitized valid and invalid fixtures and inspect Positions dates, invalid states, and summary metrics.

### Visual / Responsive

- Run React development preview per `docs/WORKFLOW.md` and `docs/DEPLOYMENT.md`.
- Verify Positions at 1366 x 768 without unintended horizontal or nested vertical scrolling.
- Confirm valid and reconciliation-required rows remain understandable without redesign.

### Regression / Compatibility

- Run lint, formatting, normal build, Pages build, and portable build.
- Verify compatible serialization does not persist canonical row aliases.
- Verify backup export/import preserves vanilla fields and unknown fields.
- Verify generated Pages and portable JavaScript syntax.

### Quality and Edge Cases

- Cover missing, zero, negative, nonnumeric, and nonfinite quantity/buy-price inputs.
- Cover missing and invalid `buyDate`, plus a record containing both `addedDate` and `buyDate`.
- Cover missing/invalid current price separately from required ownership validity.
- Confirm no normalization or selector path mutates the source record.

Record actual results and evidence in the project's designated completion record; do not treat this plan as proof that validation occurred.

## 15. Documentation Updates

Update `docs/REACT_SPIKE_PROGRESS.md` with the completed batch and evidence. Update other active architecture/data documents only if implementation changes their current contract; otherwise record that no further documentation update was required.

## 16. Deliverables

- [ ] Canonical Position selector and validation implemented.
- [ ] Positions rendering and portfolio calculations consume trusted rows.
- [ ] Compatibility and exact-printing behavior preserved.
- [ ] Regression fixtures and tests added.
- [ ] Generated artifacts refreshed.
- [ ] Validation results recorded and focused PR opened.

## 17. Suggested Commit

`fix(react): enforce Position data trust`

## 18. Recommended Next Task

Review and approve a separately scoped Positions `TabulatorTable` migration. It is not part of this brief.
