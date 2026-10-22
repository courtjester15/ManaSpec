# Issue #20 — Position valuation investigation and QA

The October 21 follow-up below supersedes the original record's lack of live quotes and record-specific identity evidence.

Date: 2026-10-20 (America/New_York). Base: `codex/react-modernization-integration`, updated to `0b10524` (documentation-only change over initial `3c5bd39`). Scope: [issue #20](https://github.com/courtjester15/ManaSpec/issues/20). No deployment, merge, or React promotion.

## Findings and root cause

1. **React quote ingestion/refresh:** `Number(nullableFinishQuote) || 0` turns null, absent, blank and invalid prices into zero. A successful collection response with a null quote overwrites a valid cached Position quote and advances its timestamp. Canonical Positions then correctly treat that numeric zero as a priced holding, producing a false full-basis loss. Finish lookup used only `foil`, missing explicit etched identity; suffix-only IDs were sent unstripped to collection lookup. These are independently reproduced failure modes, not proof of the owner's particular records.
2. **Vanilla:** bulk refresh already skipped unavailable quotes, retaining the cached price. However, new tracked-card construction could substitute the other finish or turn absence into zero. Persisted null became zero in table formatting, row values, P/L, summary and Dashboard math. Its price reader also rejected legitimate zero and accepted numeric prefixes such as `12oops`. Card Detail refresh skipped real zero.
3. **React audit cross-effects:** a shared-ID Radar row could replace an owned Position wholesale, losing ownership/plan fields. Audits also generated snapshots from all returned rows, including unchanged cached prices, falsely dating stale observations as fresh. Quote-only patches and explicit successful observations correct these boundaries.
4. **Other affected surfaces:** React buy substituted acquisition cost for absent/zero market quotes, and partial sell coerced null to zero P/L. Card Detail and Signals could display unknown price/distance as zero. Vanilla summary P/L subtracted all basis even when market values were unavailable.

## Safe correction and impact assessment

Strict finite nonnegative exact-finish prices return a number (including genuine zero) or null. Missing/failed refresh keeps the existing quote and original observation time. No opposite-finish substitution, blanket backfill, zero repair heuristic, schema change, or startup rewrite is introduced. Marked P/L excludes unknown holdings and their basis; capital deployed retains their known basis. React refresh patches only price, provider prices, and observation time onto each original row.

Potentially affected: any single whose exact USD quote is unavailable, malformed, or unsupported; cached holdings refreshed during a provider gap; foil/etched or suffix-only records; Positions also watched in Radar; and new/partially sold unpriced holdings. Sealed automatic refresh remains excluded, and its existing manual valuation policy is unchanged. Existing history remains intact. Snapshot history continues its existing positive-price-only policy; genuine zero is a valid current quote but does not add a zero history point.

The existing ignored local June 29 backup contains 40 Positions and 16 Radar rows, with **no numeric zero or missing current prices**. Its load/serialization compatibility checks pass. It predates the report and cannot identify the two reported Positions. No current owner backup or record IDs were attached to #20. Historical zero provenance is ambiguous: existing zeros are intentionally retained until a successful exact quote replaces them. A fresh provider quote is the safe recovery path; unavailable provider data cannot establish a replacement value.

## Reproduction and regression evidence

- React pre-fix tests failed: null quote produced `0` instead of null; etched suffix was sent as the collection ID. Final `src/test/scryfall.test.js` covers malformed/negative/blank/null/zero prices, exact foil/etched lookup, stale timestamp retention, failed fetch, counts, immutability, and quote-only patches.
- `node tools/test-position-valuations.js --baseline=3c5bd39` fails with `0 !== null`; current code passes. Covers vanilla quote ingestion, cross-finish protection, null vs zero formatting/value/P/L, partial summary basis, and HTTP-503 retention without observations.
- React suite: **70 passed, 0 failed**, including null/zero reload and backup round-trip with no load writes, unchanged compatible serialization, known-zero vs unknown summary, buy/partial sale with cash/realized P/L, sealed regression, and Signals null distance.
- Vanilla: `validate-data-foundation.js`, `validate-storage-boundary.js`, `test-price-history.js`, `validate-comparable-printings.js`, and `validate-position-delete-guard.js` passed. Data-foundation audit retains its existing unrelated open-ledger-without-Position finding; no reconciliation was attempted.
- React `lint`, `format:check`, normal/Pages/portable builds and `node tools/check-react-spike-artifact.mjs` passed. Tracked Pages and portable output regenerated. Existing large-chunk and portable import.meta/inlineDynamicImports warnings remain. Source whitespace checks pass; minified generated vendor-containing bundles retain build-emitted whitespace warnings and were not hand-edited.

## Browser evidence and repeatable preview

Use `python -m http.server 8000` from the repo root; `/index.html` responded 200 and loaded the vanilla Dashboard. For repeatable safe cases, run `python tools/prepare-valuation-browser-qa.py` after builds. It creates `.tmp/issue20/` wrappers using a memory-only localStorage replacement and mocked Scryfall; original browser localStorage is never imported/replaced by these fixture pages. Refresh/reload intentionally reseeds each wrapper. Synthetic fixture source: `test-fixtures/browser/issue-20-valuations.json`.

- Vanilla: `http://127.0.0.1:8000/.tmp/issue20/vanilla.html`. Startup refresh, Positions, Signals, Dashboard and `#cardDetailBody` verified. Unknown nonfoil Sol Ring shows `-` for Now, Value and P/L. Stale foil Sol Ring remains $8 × 2 = $16; Arcane Signet has genuine zero, $0 value and -$10 P/L; Command Tower refreshes $12 to $14 × 2 = $28. All rows retain quantity 2 and $5 basis per unit.
- React Pages: serve `.tmp/issue20/pages-root` using `python -m http.server 8002 --bind 127.0.0.1 --directory .tmp/issue20/pages-root`. Open `http://127.0.0.1:8002/ManaSpec/react-spike/qa.html#/positions`; response 200. Actual generated `/ManaSpec/react-spike/` JS/CSS/image base, shell, hash routes and Admin Single Price Audit exercised. Before audit: value $40, P/L $10. After audit: value $44, P/L $14; basis $40, cash $100, equity $144, three of four Positions priced. Shared Radar identity retains its independent plan and Position quantity/basis.
- React Dashboard eight metrics and coverage match Positions; Signals distinguishes missing `-` from true `$0.00`, with missing target distance unavailable. Detail Current is `-` and says price/target needed. No false unknown-price target hit was introduced; existing positive-price target-queue policy is retained.
- React fixture buy/sell: bought one additional unknown-price nonfoil Sol Ring for $7, increasing quantity 2→3 and weighted average $5→$5.6667; Now/Value/P&L stayed unavailable. Sold one at $8: quantity returned to 2, basis remained $5.6667, cash $101 and ledger realized P/L +$2.33. Transactions shows both exact-identity events. Reload reseeded the original memory fixture after QA.
- Layouts inspected: React 1920×1080, 1366×768, 390×844; vanilla desktop/laptop. React phone renders stacked row values and the unknown-price detail remains accessible. No layout/CSS redesign was needed.
- Hosted portable wrapper: `http://127.0.0.1:8000/.tmp/issue20/portable.html#/positions` renders the IIFE artifact and correct fixture rows. **Direct file opening remains unverified:** the in-app browser rejects `file:///C:/Dev/ManaSpec/react-app/dist-portable/index.html` because only HTTP(S) is permitted. No external browser/desktop fallback was used. Hosted smoke does not prove file-origin storage/CORS behavior.

Initial wrapper-only logo paths and missing mock prints URI were fixture shortcomings, corrected in the generator. These were not application defects. Final React audit/trade console checks returned no warnings/errors. Final vanilla detail rendered its complete comparable table without a new error; its console history retained the earlier mock-URI error. Expected mocked failed-fetch warnings in unit tests are separate. Browser QA uses synthetic quotes, so live Scryfall availability and the owner's exact two records remain unverified.

## Review boundary

Review source/domain tests first, then generated artifact integrity and the repeatable browser fixture. Inspect null vs zero, observation timestamps, original row fields and priced-basis P/L. No new durable product decision or project direction changed; DATA_MODEL owns the clarified quote rule, CHANGELOG records the correction, and this record/progress log own evidence. HISTORY/Roadmap/Decisions do not require milestone churn for this bounded fix. Existing unrelated untracked files are excluded from the PR.

## 2026-10-21 follow-up: exact UNF quotes and recovery

Owner requested live verification of Steam Vents UNF #534 and Godless Shrine UNF #533, a warning for suspicious existing zeros, focused regression expansion, and an update to PR #21 without merge/deployment.

### Live provider evidence

Captured at `2026-10-22T02:31:08Z` (October 21, 22:31 EDT), then independently confirmed through Scryfall's exact-ID collection endpoint. Public response evidence is committed in `test-fixtures/browser/issue-20-live-unf-quotes.json`, including collection-check time. These are provider observations at that time, not guaranteed future quotes.

| Exact printing | Scryfall ID | Offered finish | Nonfoil USD | Foil USD | Etched USD |
| --- | --- | --- | --- | --- | --- |
| [Steam Vents UNF #534](https://api.scryfall.com/cards/unf/534) | `be874189-b715-4e7c-85d7-e887328b9d3f` | foil only | null / unavailable | $180.42 | null / unavailable |
| [Godless Shrine UNF #533](https://api.scryfall.com/cards/unf/533) | `0f1296cc-59aa-412d-9115-99fdc9ada754` | foil only | null / unavailable | $158.60 | null / unavailable |

Set, collector number, English printing ID and finishes were checked against the named records in the older ignored backup. That backup marks **both as `foil: false`** while retaining `finishes: ["foil"]`; their IDs match the table above. This is a concrete saved-identity mismatch, not evidence that Scryfall values either printing at $0. The current zero-valued browser records were not supplied or edited, so their present finish cannot be asserted from the older backup alone.

**Recovery conclusion:** if the current records retain those saved nonfoil identities, refresh cannot restore them: the exact nonfoil quote is unavailable. It must retain the saved value/time and must not substitute foil, etched, EUR, another printing, a market observation or acquisition cost. A correctly identified **foil** Position with either ID can recover from zero through the existing refresh path. Separate synthetic foil fixtures prove this without changing the original records' identity.

**Remaining owner/data decision:** confirm the actual owned finish before any identity repair. Changing a legacy nonfoil Position to foil may affect its exact-key notes, transactions and related records; this PR does not toggle that flag, relink history, create transactions or infer a migration. It is not safe to promise that merging and refreshing alone repairs those legacy nonfoil records.

### Warning behavior and surface audit

The warning is derived at render time for owned single Positions with saved zero and no matching cached exact-finish zero quote. When `finishes` excludes the saved finish it explains that mismatch explicitly. Otherwise it explains that zero may be genuine or unavailable and requests an exact-price check. A real cached zero, nonzero quote, unknown/null price, closed row or sealed asset is not treated as this suspicious-zero case.

- Vanilla and React show an accessible valuation-review banner across routes, including summary headers, Dashboard/Portfolio Summary, Positions and Signals. It names affected exact printings and explicitly says value/equity/P&L **still include the saved zeros**. It never silently changes eligibility or math.
- Position detail repeats the reason. Row price tooltips use it where applicable. Vanilla directs users to a live Position detail check; its Admin price-audit control is disabled. React directs users to the existing Admin Single Price Audit.
- Successful vanilla quote refresh/detail checks now cache `prices` with the current quote, matching the existing React cached-provider field, so a confirmed genuine zero is distinguishable after save/reload. Unknown/unavailable attempts do not overwrite cached quote evidence.
- Browser inspection exposed vanilla source rows remaining at $0 after a detail recovery even while the header total changed. `refreshValuationViews()` now repaints active Signals/Dashboard/Position context and rows (and active Radar rows) from canonical state; it preserves existing filter/sort ownership instead of changing identity or transactions.
- Current-price zero is not automatically excluded from portfolio totals. Classification cannot establish whether an arbitrary historical zero is legitimate. The warning makes the uncertainty visible while preserving original calculations and data.

### Actual follow-up checks

- React: **73 tests pass**. New tests cover recorded live ID/finish evidence, nonfoil non-recovery, foil recovery, immutable source data and ownership fields, unchanged compatible serialization, and genuine cached-zero/no-warning behavior. Existing null/zero trading, summary and backup regressions still pass.
- Vanilla `test-position-valuations.js` passes with the same captured responses, retains unavailable nonfoil zero/time, restores foil quotes and P/L, clears warnings for genuine zero/recovered prices, and checks bulk/detail source repaint. Storage-boundary, price-history, and comparable-printings checks pass.
- Source/format checks, normal/Pages/portable builds and Pages artifact integrity pass. Tracked artifacts regenerated. Existing large-bundle and portable import.meta/inlineDynamicImports warnings remain. No new runtime dependencies or schema version were added.
- In-app browser replay of **captured live responses** (not an uncaptured live browser network claim) used two independent memory-only fixtures: one retaining nonfoil identities, one starting with separate correct foil identities. Actual public provider requests were performed separately against Scryfall; external browser API navigation timed out and the web fetch service rejected/failed those URLs. The configured network proxy allowed the authoritative API/collection verification.
- Nonfoil: React audit reports 0 updated; both exact quotes, timestamps and identity remain unchanged; the two-item finish-mismatch warning remains. Vanilla detail check likewise retains zero/time and warning. Both surfaces continue to show synthetic $200 basis, $0 value and -$200 P/L, visibly marked for review.
- Foil: React audit restores both at $180.42/$158.60 and removes the warning. Vanilla detail checks restore each and immediately repaint Signals rows. With **synthetic** quantity 1 and $100 basis each, both frontends show $339.02 value, +$139.02 P/L (69.5%), $100 cash and $439.02 equity. These are fixture calculations, not the owner's actual portfolio P/L. Original IDs/finish, quantity, basis and transaction history are preserved.
- Browser checks cover header totals, Positions context/rows, Dashboard metrics, Signals rows, detail warnings, keyboard Enter to open React detail, 1366×768 and 1920×1080 warning layout. React console is clean; corrected vanilla runs produce no new warning/error. The browser's console retains one intermediate cached-script error from before the final app-script version bump; the final paired script versions resolve it.
- QA wrappers reset to their original memory fixture on reload and never import/replace browser-owned storage. The all-interface root server launch was rejected by automatic approval review; the safe replacement bound Python to `127.0.0.1` and served only copied public runtime files plus synthetic pages. No desktop/external-browser control was used.
- Direct portable file-opening restriction remains as recorded above; this follow-up regenerated portable output but does not claim a new direct-file pass. No merge, deployment, Pages promotion or stored identity repair was performed.

### Repeatable follow-up previews

After builds, run `python tools/prepare-valuation-browser-qa.py --unf-finish nonfoil` and again with `--unf-finish foil`. These generate distinct zero-valued fixtures and use the committed response evidence. Standard local root serving exposes `/.tmp/issue20/vanilla-unf-nonfoil.html` and `vanilla-unf-foil.html`. Where serving the workspace is restricted, copy only public `index.html`, `js/`, `css/`, `assets/` and these synthetic wrappers into a dedicated directory and bind Python to loopback.

For React, serve `.tmp/issue20/pages-root` on loopback and use `/ManaSpec/react-spike/qa-unf-nonfoil.html#/positions` or `qa-unf-foil.html#/positions`. Run Single Price Audit from Admin; switch to Dashboard/Signals/Positions to compare. Do not change a fixture's finish in place and describe that as preserving the original identity.
