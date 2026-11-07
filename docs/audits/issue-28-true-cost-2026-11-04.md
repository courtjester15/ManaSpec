# Issue #28 verification

Stacked on PR #37. The React promotion and hosting access gates remain in the [Issue #27 report](issue-27-react-promotion-2026-11-01.md).

- 1366 × 768 in-app browser, synthetic v1 backup restored through Admin. Radar buy of two $10 singles plus $3 shipping and $2 tax previewed $25 total and $12.50 each. Positions sale previewed $18 net, $5.50 realized and 44% ROI. Reversal after reload retained the receipt and restored cash and ownership before re-entry.
- 1920 × 1080 in-app browser, Asset Detail purchase of two $500 foil copies with $51 net charges previewed $1,051 total. Partial sale previewed $569 net, $525.50 allocated basis, $43.50 realized and 8.28% ROI. Insufficient funds blocked confirmation and cancellation returned to the parent detail.
- 390 × 844 in-app browser, unpriced sealed buy and add-on saved $130 combined basis. Sell All previewed $160 net and $30 realized, then cancelled. The expanded form scrolled vertically with no internal horizontal overflow. The account summary showed $1,881 cash, $668 basis, $597 marked value and $59 unrealized, with sealed excluded from marked value.
- Browser QA caught and corrected missing immediate printing identity after legacy import and nested dialog close propagation. The browser session ended before the last cross-route and direct-file checks could be completed. Backup export/restore and interrupted-write recovery are exercised through the storage adapter suite.

## Review follow-up, 2026-11-06

The failed CI job 127024104635 changed the main JS source map and its manifest hash during Linux rebuild. Newly edited Windows files had CRLF source bytes although Git stored LF. Rebuilt from LF source bytes under the existing .gitattributes policy.

Saved openBasisCents is now authoritative, including zero. Invalid explicit cents fail closed. Legacy records without cents retain the average-price fallback. Added repeated fractional allocation/full-liquidation and exact single/sealed receipt reversal reload/backup-restore regressions.

Both direct-file and fresh HTTP in-app browser attempts timed out after 30 seconds and reset the browser kernel. The final cross-route browser sweep and direct-file smoke therefore remain unverified. Prior scenario browser results above remain the available UI evidence.

### Proposed Issue #29 breakdown

1. Reuse trade.version=1 amounts, immutable IDs, linked reversals, positionBasisCents and allocateBasis. Add acquisition lot IDs and a pure event reducer which projects quantity, remaining cents and cash. Preserve weighted allocation as the default.
2. Build a read-only reconciliation report against current holdings and cash. Identify incomplete legacy history, duplicate IDs and exact-identity conflicts. Cover $10/$500, foil isolation, sealed unknown valuations, exits, rebuy and reversals.
3. Prepare explicit opening-balance events linked to original records with unknown provenance. Opening holdings must not debit cash again. Implement preview/export, restartable atomic migration and rollback, with authorization before owner-data writes.
4. Switch existing shared selectors to the verified projection across Dashboard, Positions, Signals, Transactions and History. Keep trade entry and receipts from #38. Prove reload, backup restore, failure recovery and invariant equality before promotion.

Follow-up local verification passed all 107 tests, source/format checks and normal, Pages, portable and canonical builds. Linux CI run 42316506190 passed the previously failing generated-artifact freshness step and release packaging.
