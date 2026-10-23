# Issue #20 — Position valuation integrity

## Metadata
- Status: Completed (evidence in `docs/audits/issue-20-position-valuations-2026-10-20.md`)
- Date: 2026-10-20
- Brief Size: Standard
- Related: https://github.com/courtjester15/ManaSpec/issues/20
- Approver: Owner execution authorization in issue #20 and current request

## 1. Objective
Prevent unavailable exact-finish quotes from becoming zero valuations; preserve ownership and financial facts.
## 2. Background
React refresh coerces absent Scryfall quotes to zero. Vanilla retains cached quotes on refresh but formats missing persisted prices as zero.
## 3. Scope
Trace both frontends, correct quote ingestion and missing-value calculations, add regression coverage and browser evidence. Exclude migration, blanket backfill, deployment, merge, and React promotion.
## 4. Existing Architecture
Vanilla global pricing/summary helpers and React Scryfall service feed compatible local storage. React canonical Position selectors already exclude missing quotes from marked P/L.
## 5. Existing Research / Decisions
Follow DATA_MODEL.md exact identity, snapshot, and compatibility contracts; DEPLOYMENT.md delivery checks.
## 6. Assumptions
The owner's two records are unavailable. Synthetic cases establish failure modes, not record-specific provenance.
## 7. Dependencies
Existing Node/Python runtime and in-app browser.
## 8. Risks
Historical zero may be genuine or coerced. Never rewrite it heuristically. Preserve last valid quote/time on unavailable refresh and all raw compatibility fields. Roll back code without data migration.
## 9. Constraints
No storage schema/key changes; preserve exact printing/finish, sealed identity, weighted basis, cash and transactions. Unknown price must not fabricate P/L.
## 10. Likely Files to Review
Pricing, portfolio, summary, dashboard, trading, snapshots, storage adapters and tests in both frontends.
## 11. Likely Files to Modify
Existing price readers/refresh, vanilla display and summary helpers, React trading and audit snapshot boundary, focused tests.
## 12. Implementation Expectations
Use nullable strict nonnegative quote parsing. Keep genuine numeric zero distinct. Refresh only successful exact quotes and record snapshots only for those observations.
## 13. Acceptance Criteria
- Unknown quote never overwrites cached price/time with zero.
- Exact finish and legitimate zero survive refresh.
- Unknown marked values/P&L are unavailable; basis and transaction math remain intact.
- Reload and backup remain compatible without startup rewrites.
## 14. Validation Plan
Functional: deterministic mocked Scryfall tests for null/invalid/zero/failed/stale cases in both frontends.
Visual: in-app vanilla and React workflow smoke with synthetic records at desktop and narrow widths where supported.
Regression: storage, trading, summary, snapshots; React tests/lint/format and three builds/artifact integrity. Attempt portable direct opening and record tool restrictions.
Quality: assert identity, timestamps, source immutability, priced-basis totals, and failed request behavior.
## 15. Documentation Updates
DATA_MODEL.md price contract, CHANGELOG.md and an issue-specific audit completion record; React progress evidence.
## 16. Deliverables
Implementation, regression tests, fixture evidence, regenerated React artifacts, open PR against integration branch.
## 17. Suggested Commit
`fix(pricing): preserve unavailable quotes and honest Position valuations`
## 18. Recommended Next Task
None; owner records may be inspected later with an approved backup if record-specific attribution is needed.
