# React UI Parity Log

This log tracks the React modernization spike against the vanilla ManaSpec shell. The vanilla app is the visual and interaction reference; the target viewport is 1366 × 768 with the same local backup loaded into both apps.

## Pass order and status

| Route | Inventory focus | Status |
| --- | --- | --- |
| Dashboard | Header, four state tiles, eight scan queues, row/detail navigation | Implemented and compared |
| Radar | Search/context band, filters, full printing table, row detail, buy/remove | Implemented and captured |
| Positions | Context band, full holdings table, row detail, buy/sell/delete | Implemented and captured |
| Signals | Four attention tiles, complete signal table, detail/view actions | Implemented and captured |
| Transactions | Ledger context, full printing/financial columns, row detail | Implemented and captured |
| History / Notes | Trade, Radar, card-note, and thesis chronology; type filter; detail navigation | Implemented and captured |
| Admin | Cash, data safety, prices, integrations, React diagnostics | Implemented and captured |
| Shared shell | Header/nav/density/scrolling/modals/portable build | Implemented; all artifacts regenerated |

## Shared parity requirements

- [x] Same-origin side-by-side comparison available with identical browser data.
- [x] Existing legacy design tokens and CSS remain the visual baseline.
- [x] Dense sortable React table primitive retained.
- [x] Table rows can open card detail without action controls causing accidental row clicks.
- [x] All applicable route tables open card detail from the row.
- [x] Exact 1366 × 768 vanilla Dashboard reference and React route screenshots captured.
- [x] React tests, source policy checks, and format checks pass.
- [x] Final normal, Pages, and portable artifacts regenerated successfully.

## Intentional differences

Only differences that improve migration safety without changing the product will remain here.

- Admin may retain read-only ledger reconciliation and storage diagnostics below the four vanilla admin actions. These expose React migration safety checks and do not replace the vanilla controls.

## Verification record

Screenshots are stored in `docs/screenshots/react-parity/`. The comparison uses `test-fixtures/manaspec-backup-2026-06-29-2223.json` and a 1366 × 768 headless Edge viewport.

Verified commands before the final artifact rebuild:

```text
npm test          13/13 passing
npm run lint      passed
npm run format:check passed
```

Final artifact verification:

```text
npm run build           passed
npm run build:pages     passed; /ManaSpec/react-spike/ asset base verified
npm run build:portable  passed; deferred classic entry and bundled assets verified
node --check assets/manaspec.js passed
```

The in-app browser security policy blocks `file://` navigation, so this run could not repeat the direct local-file browser launch. The portable blank-page regression remains covered by the finalizer test and the generated entry was statically verified to load `./assets/manaspec.js` with `defer`. The prior manual direct-file smoke test remains the runtime evidence for this delivery shape.
