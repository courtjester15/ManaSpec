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


## 2026-10-22 approved finish correction closure

This section supersedes the October 21 pending-owner-decision and no-repair statements above. The owner confirmed both physical printings are foil and approved the targeted workflow in [PR #21 comment](https://github.com/courtjester15/ManaSpec/pull/21#issuecomment-6331594385). No merge, deployment or React promotion is authorized.

### Cause and prevention

Scryfall `foil` is capability metadata, not the user's selected finish. The old add flow could offer/default nonfoil on a foil-only printing and could fall back between quote fields. Both entry points now use the shared supported-`finishes` policy. A sole finish is selected and locked; multi-finish printings require a valid explicit choice, including etched. Missing metadata blocks addition. An unavailable quote does not remove an otherwise supported choice, and never selects another finish. Existing unsupported Radar/Position buys are blocked pending correction. Etched identity survives tracking, notes, transaction references and vanilla price history rather than becoming nonfoil.

### Safe recovery workflow

After the change is delivered to the relevant frontend, open **Admin → Preview UNF foil correction**. It fetches both exact IDs and verifies name, UNF collector number and foil support, then previews eligible printings, current exact foil quotes (or unavailable) and linked record counts. Cancel is read-only. Apply creates a retained pre-correction backup before writing any affected arrays. Download it through **Download correction backup**; it uses the existing backup envelope and import path. A backup containing sealed stores retains schema v2 and must be restored through React, as before.

Only the two allowlisted printing IDs with an existing nonfoil Radar or Position activate correction. It relinks matching exact references in Positions, Radar, transactions/backfill provenance, notes, signals, snapshots and market observations; no new transaction is created. Original identities and changed metadata are retained in `finishCorrection.previous`; the retained emergency record additionally contains exact raw storage strings and the original backup data. Quantity, acquisition dates, unit cost/basis, fees, cash, transaction IDs/amounts, realized P/L, historical quote values and observation dates are preserved. Historical observations are relinked, never repriced. Current quotes may recover only from the exact verified foil field; an unavailable foil quote produces null, not a substitute.

Duplicate/existing foil holdings in the same store, conflicting references/finish metadata, malformed storage or changes since preview block application. Failed writes roll back affected raw keys; a backup write failure applies nothing. A rollback failure reports the retained backup explicitly. Already corrected records are no-ops. This is an opt-in, narrowly allowlisted correction, not a startup migration or blanket identity rewrite. The backup is browser-local until downloaded; keep that download for durable recovery.

### Evidence

- Live exact-ID recheck at **2026-10-23T02:45:45Z / October 22, 22:45 EDT**: Steam Vents UNF #534 supports only foil, `usd_foil=181.01`; Godless Shrine UNF #533 supports only foil, `usd_foil=158.46`. Both nonfoil and etched fields remain null. Public recheck payload is in `test-fixtures/browser/issue-20-live-unf-recheck-2026-10-22.json`. Quotes can change; the workflow fetches them at preview time.
- Repeatable browser fixtures replay the earlier captured $180.42/$158.60 responses. Starting with one of each, $100 unit basis and $100 cash, both vanilla and React correct to $339.02 marked value, +$139.02 unrealized P/L, $439.02 equity. The warning clears. Save/reload preserves recovery; React audit updates two printings and adds exact foil snapshots. Dashboard, Positions, Radar and Signals agree. Cancellation retains saved zeros; second correction preview finds no eligible legacy rows. Both sole-foil add forms lock foil; multi-finish forms start unselected/disabled, enable only for valid choices, and retain supported choices with missing quotes.
- React corrected Radar buy of one synthetic unit at $10 updates the same foil Position to quantity 2 and $55 average cost, without duplicating identity. A partial sale at $20 retains one unit at $55, records -$35 realized P/L, leaves cash $110 and $155 open basis; reload and Dashboard agree. These deliberately synthetic transactions are not user trades or provider valuations.
- The older ignored local backup was processed read-only: exactly **2 Positions, 2 transactions and 76 snapshots** match. Input JSON and every tested financial field remain unchanged. The actual current user-origin storage was not read or rewritten. Consequently these figures prove the recovery mechanism, not the owner's current portfolio total.
- React **80 tests** pass. `test-finish-correction.js` proves vanilla correction/startup/reload without duplicate backfills, exact transaction facts/cash and native backup validation. Valuation, price-history, comparable-printings, storage-boundary and data-foundation suites pass. Tests cover zero/null, missing/failed metadata, foil/nonfoil/etched, unavailable foil quote, collisions, conflicts, unchanged unknown/sealed data, stale preview, backup/write failure and rollback, backup export/import.
- Source/format checks, normal/Pages/portable builds and artifact integrity pass. Generated tracked artifacts refreshed. Existing chunk-size/portable import.meta warnings remain.
- In-app browser: correction preview/cancel/apply, automatic vanilla reload, explicit React reload, quote refresh, both finish forms, Radar/Positions/Signals/Dashboard, transaction counts, backup download and idempotence exercised with isolated synthetic session-backed wrappers. Vanilla and React console checks returned no warnings/errors. The wrapper persists only its own synthetic Map to a pathname-scoped sessionStorage key; no user localStorage is overwritten. Reload no longer resets the test fixture; `?reset=1` deliberately resets only that QA namespace.
- Layout: vanilla laptop screenshot remains aligned; React tables retain their existing contained horizontal scrolling at the actual 1280×720 available viewport. Requested 1366×768/1920×1080 overrides did not consistently apply across in-app tabs (DOM measured 1280×720 on React); do not interpret requested dimensions as verified viewport coverage. No new table columns/CSS were introduced. Direct portable file-origin QA remains blocked by the in-app browser policy; no external browser/desktop fallback was used. New etched browser-specific selection was not separately exercised; shared/domain and history regressions cover it.

No current user data was repaired during QA and no deployment occurred. Merging alone does not rewrite the legacy records: after authorized delivery, run the explicit Admin correction in the browser that owns the records, download its backup, and verify holdings and current totals. A normal refresh alone cannot fix saved nonfoil identity.


## 2026-10-22 owner override: actual native Position repair completed

**Current completion record; supersedes the Admin exercise and synthetic-only completion boundary above.** [Owner override](https://github.com/courtjester15/ManaSpec/pull/21#issuecomment-6356465430) authorizes direct repair, supported historical recovery, backup first, no merge/deploy. The special UNF Admin panels/modals and AppState wiring are removed from vanilla and React. No user-operated migration or new automatic startup migration is required.

### Actual environment, backup and safeguards

The only initially open in-app tab was the old memory-backed portable QA fixture; it was not used as live evidence. The stopped local origin was checked through a temporary, loopback-only, read-only native-storage page **before app startup**. Native `http://127.0.0.1:8000` storage actually contained 40 Positions, 16 Radar records, 65 transactions, 8 card notes, 1,537 snapshots and 33 market checks. Both named records matched the exact confirmed IDs and were marked nonfoil. Contrary to the earlier zero report, this accessible store retained $163.27/$157.95 current prices, with old June quote times. This distinction is recorded rather than claiming a zero recovery that was not observed.

The untouched raw strings were downloaded first and copied privately under `.tmp/issue20/actual-owner-before-2026-10-22.json`; a standard compatible backup envelope is retained locally as `actual-owner-before-standard-backup.json`. Raw-backup SHA-256: `467a02edad2e1319306ee4d0106e1ea13b3faf0b1c75c439097921fe6cb86e15`. These private data files are not committed. An additional pre-correction backup containing original raw strings remains in the origin's `manaspec_finish_correction_backup` key.

A private one-time developer command reused the tested correction policy. It verified every native input key against the downloaded backup's SHA-256 before any write, required exactly the two confirmed targets and fresh exact foil quotes, retained the browser backup first, then changed only `specs`, `transactions` and `priceSnapshots`. It was rehearsed against an in-memory copy of the actual backup, asserting all financial facts, unrelated records and prior snapshots unchanged. This was a local authorized data operation, not a shipped Admin workflow or deployment. The temporary command is removed after execution.

### Actual results and reload

Live Scryfall exact-ID observations captured at **2026-10-23T03:16:36Z / October 22, 23:16 EDT** confirm foil-only support, Steam Vents $181.01 and Godless Shrine $158.46; nonfoil/etched quotes are null. The public response is committed separately; no current quote is backdated. The owner-origin Positions now contain:

| Position | Quantity | Preserved unit basis | Exact foil quote | Current unrealized P/L |
| --- | --- | --- | --- | --- |
| Steam Vents UNF #534 | 1 | $163.27 | $181.01 | +$17.74 |
| Godless Shrine UNF #533 | 1 | $157.95 | $158.46 | +$0.51 |

Both IDs now end `|foil`, with explicit foil finish, canonical Scryfall ID and tracked printing key. Their two BUY/backfill references follow those IDs; transaction IDs, quantity, price, fees, dates and notes are unchanged. No matching Radar, notes or market-check references existed to alter. All unrelated 38 Positions and 63 transactions remain structurally identical. Position count remains 40 and transaction count remains 65.

| Native portfolio | Before | After reload |
| --- | --- | --- |
| Cash | $7,043.39 | $7,043.39 |
| Open basis | $2,870.02 | $2,870.02 |
| Marked value | $2,969.52 | $2,987.77 |
| Unrealized P/L | +$99.50 | +$117.75 |
| Equity | $10,012.91 | $10,031.16 |

The +$18.25 change equals the two exact quote deltas. Header, Positions context/rows and Dashboard agree after full reload on the native origin using the local React review artifact (no fixture bootstrap or storage override). Each target shows one new current foil history point. The last **bulk** refresh status was deliberately preserved; it is not rewritten to imply all unrelated quotes were freshly audited. Per-record quote timestamps reflect the exact live observation. Existing missing realized-cost provenance on older unrelated SELLs remains untouched.

A new native export after reload exactly matches the rehearsed expected state. Only the three intended storage keys differ; every other captured key is byte-identical. Every old snapshot and unrelated record is identical. After-export SHA-256: `a5997fa470bae00f717c8ecba99eb29a17917357f2200a79cfcaacf415817705`. Backup/after exports and the actual recovery screenshot remain private local artifacts.

### Historical evidence and limits

All 76 existing target snapshots (38 each, May 20–June 30) claim nonfoil and repeat exactly the respective acquisition costs. No saved exact foil field, archived provider response or corroborating market observation supports treating those values as historical foil prices. The original buggy fallback can explain that pattern, but its existence is not independent proof of a historical quote. **None of the 76 records is repriced, redated, deleted or promoted to verified foil history.** They remain original evidence under their prior nonfoil keys. Two newly verified current foil snapshots are appended, for 1,539 total snapshots. No historical portfolio P/L is fabricated from today's quote or acquisition cost. Further historical repair would require dated exact-printing foil quote evidence; none was available in this store.

This actual repair applies specifically to the accessible native origin/profile `http://127.0.0.1:8000`. Browser storage is origin/profile-specific: this does not establish that a separate GitHub Pages, file-origin or external-browser profile has also changed. No external-browser/desktop access, merge, deployment or React promotion occurred.

### Final verification

- **81 React tests** pass, including an explicit regression that unsupported historical nonfoil prices are preserved and never become verified foil history. Existing exact selection, conflicts/collisions, nullable prices, rollback, persistence and backup checks remain passing.
- Vanilla correction/startup, quote valuation and price-history checks pass. Source/format checks and normal/Pages/portable builds pass; generated artifact integrity passes. Existing build warnings remain as recorded earlier.
- Actual native browser: both corrected rows, quantities/basis, current P/L, history count, Dashboard/header/Positions totals, full reload, persisted raw after-state comparison and absence of special Admin controls verified. Final console returned no warnings/errors. No broad price audit or trade was run against live data, preserving unrelated records.
