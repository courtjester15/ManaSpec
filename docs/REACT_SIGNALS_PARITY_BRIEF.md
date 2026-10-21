# React Signals Logic And Triage Parity

## Metadata

- **Status:** Completed
- **Date:** 2026-07-23
- **Brief Size:** Standard
- **Related Documents / Issues:** GitHub Issue #3, `docs/audits/vanilla-react-workflow-css-audit-2026-07-21.md`, `docs/REACT_MIGRATION_NOTES.md`
- **Approver:** Project owner

This brief is an implementation plan, not an implementation log. Record completed work, deviations, validation results, and evidence in the project's designated completion record.

## 1. Objective

Restore React Signals as the same attention-triage workflow as vanilla. Success means identical fixture-derived signal state, a 5% Approaching boundary, shared Dashboard membership, interactive bucket/exact-printing filtering, and exact Radar or Positions source navigation.

## 2. Background

Batch 1 established exact-printing related-record resolution. React Signals still derives a simplified 10% model inside the view, substitutes Scryfall for source navigation, and does not provide vanilla's attention filters. Issue #3 approves the next isolated parity batch and keeps later table, Help, responsive, and visual work out of scope.

## 3. Scope

### In Scope

- Port vanilla signal derivation, reason, priority, market-freshness, and action contracts to a fixture-testable React domain module.
- Use the Batch 1 printing resolver for market observations and finish isolation.
- Make Signals and Dashboard consume the shared derived rows and queue membership.
- Add bucket, exact-row, and reset triage interactions.
- Route `View` to the exact Radar or Positions printing and retain a separately labeled `Scryfall` action.
- Add fixture parity and navigation/filter regression coverage.
- Update durable React progress, roadmap, migration/architecture notes where the shared contract changes current truth, and the changelog.

### Out of Scope

- Card Detail capabilities beyond existing detail behavior.
- General Radar/Positions filter redesign.
- Tabulator migration or other dense-table controls.
- Help, responsive redesign, or unrelated CSS polish.
- Any following audit batch.

## 4. Existing Architecture

React state is loaded through `AppStateProvider`; exact-printing compatibility lives in `domain/relatedRecords.js`; Dashboard and Signals currently derive rows inside `Views.jsx`; hash routes own module navigation. Vanilla `js/modules/signals/signals.js` and `js/modules/dashboard/dashboard.js` are the behavioral source of truth.

## 5. Existing Research / Decisions

- `docs/audits/vanilla-react-workflow-css-audit-2026-07-21.md`, findings H1 and H2.
- `docs/REACT_MIGRATION_NOTES.md` preserves vanilla as the parity authority.
- Batch 1 requires exact printing and finish identity for related market observations.

## 6. Assumptions

- Tracked card IDs remain stable across Signals-to-source navigation.
- A query parameter scoped to Radar/Positions is sufficient to reproduce vanilla's exact-row filter/focus behavior without broad filter-system changes.

## 7. Dependencies

- Merged Batch 1 commit on `codex/react-modernization-integration`.
- Existing React build and browser QA workflows.

## 8. Risks

- **Risk:** Date-based market freshness makes fixtures nondeterministic.
  - **Mitigation:** Accept an explicit clock value in the domain selector and test boundary dates.
- **Risk:** Same-name or same-printing foil/nonfoil observations leak between rows.
  - **Mitigation:** Resolve observations through the Batch 1 compatibility-aware exact-printing helper and cover both finishes.
- **Risk:** UI and Dashboard drift if they create separate derivations.
  - **Mitigation:** Export one domain derivation and queue selector consumed by both views.

## 9. Constraints

- Vanilla behavior and the 5% threshold are authoritative.
- Preserve local-first storage compatibility and current compact visual direction.
- Keep navigation changes limited to exact Signals source focus.
- Preserve independent row, action, and external-link click behavior.

## 10. Likely Files to Review

- `js/modules/signals/signals.js`
- `js/modules/dashboard/dashboard.js`
- `js/core/app.js`
- `react-app/src/features/views/Views.jsx`
- `react-app/src/domain/relatedRecords.js`

## 11. Likely Files to Modify

- `react-app/src/domain/signals.js`
- `react-app/src/features/views/Views.jsx`
- `react-app/src/test/fixtures/signals.js`
- `react-app/src/test/signals.test.js`
- React status/history, roadmap, architecture/migration notes, changelog, and generated deployment artifacts.

## 12. Implementation Expectations

- Keep derivation and triage selection pure and independently testable.
- Reuse exact-printing resolution rather than duplicating matching logic.
- Keep view markup changes focused on interaction parity.
- Do not retune thresholds or expand into the next audit batch.

## 13. Acceptance Criteria

- [x] React fixture rows match vanilla bucket, status, reason, priority, source, and action state.
- [x] Approaching uses a 5% threshold.
- [x] Market freshness and exact finish identity match vanilla.
- [x] Signals and Dashboard totals/queues consume the same derived data.
- [x] Tiles filter buckets; preview rows filter one printing; Show all resets.
- [x] `View` focuses the exact Radar/Positions printing and `Scryfall` remains separately labeled.
- [x] Existing and new tests, lint, format, normal, Pages, and portable builds pass.

## 14. Validation Plan

### Functional

- Run the complete Node test suite with fixed-time parity fixtures.
- Exercise Signals tile, preview, reset, detail, source View, and Scryfall actions in the browser.

### Visual / Responsive

- Confirm the compact Signals layout remains usable at the documented desktop QA viewport; no redesign is planned.

### Regression / Compatibility

- Run lint, format, normal build, Pages build, and portable build.
- Confirm Radar/Positions exact focus does not change unrelated rows or stored data.

### Quality and Edge Cases

- Cover target hit, exactly/within/outside 5%, missing plans, missing/stale/fresh checks, same printing with foil/nonfoil, queue membership, and navigation/filter reset.

## 15. Documentation Updates

- Distill the completed shared Signals contract into React progress/history, roadmap/current priority, architecture or migration notes, and `CHANGELOG.md`.

## 16. Deliverables

- [x] Shared vanilla-parity domain selector
- [x] Signals triage and exact source navigation
- [x] Fixture and interaction contract tests
- [x] Updated durable records and generated artifacts
- [x] Completion handoff prepared for the required issue comment and focused PR

## 17. Suggested Commit

`fix(react): restore Signals triage parity`

## 18. Recommended Next Task

Create and approve the next audit-batch issue before any further parity implementation.
