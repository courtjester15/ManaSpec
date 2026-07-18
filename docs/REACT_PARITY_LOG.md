# React UI Parity Log

## Focused tables and Card Detail correction (2026-07-17)

This correction is verified for the brief's table and Card Detail scope. It is not a declaration that whole-app visual parity is complete.

### Measured geometry

| Surface | Vanilla reference | React before correction | React after correction |
| --- | --- | --- | --- |
| Radar rows | 27 px row; 28 px header; `nowrap` | Shared table rows could expand with multi-line card identity | 27 px row; 27.5 px header; `nowrap` |
| Positions rows | 27 px row; 28 px header | 57 px row; 27.89 px header | 27 px row; 27.5 px header |
| Card Detail | 760 px wide; 520 px high; top/right 12 px | 980 px wide; 683 px high; 230 px image column; body content reached 1015 px | 760 px wide; 352.58 px rendered height; top/right 12 px; no image column; no internally overflowing element |

The React table contract now fixes body rows at 27 px, controls at 20 px, cell padding at 3 px vertical / 6 px horizontal, body text at 12 px, and headers at 11 px. Card identity is one line and Card, Set, collector number, Rarity, and Color remain separate columns. Tables retain horizontal overflow when required without introducing a nested vertical scrollbar.

Card Detail keeps the primary workflow in the compact panel: identity and owned metrics, two-column Plan / Evaluation and Market Check work areas, latest notes, and card context. Price History and Comparable Printings open as secondary dialogs. Row opening, action-button event isolation, plan edits, quantity actions, notes, and market-check persistence remain wired to the existing React data services.

### Required 1366 x 768 comparison captures

| Surface | Vanilla | React |
| --- | --- | --- |
| Radar | [Vanilla Radar](screenshots/react-parity-correction/radar-vanilla-1366x768.jpg) | [React Radar](screenshots/react-parity-correction/radar-react-1366x768.jpg) |
| Positions | [Vanilla Positions](screenshots/react-parity-correction/positions-vanilla-1366x768.jpg) | [React Positions](screenshots/react-parity-correction/positions-react-1366x768.jpg) |
| Card Detail | [Vanilla Card Detail](screenshots/react-parity-correction/card-detail-vanilla-1366x768.jpg) | [React Card Detail](screenshots/react-parity-correction/card-detail-react-1366x768.jpg) |

The paired captures use `test-fixtures/manaspec-backup-2026-06-29-2223.json`. Both secondary Card Detail dialogs were also opened directly during the browser check.

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
