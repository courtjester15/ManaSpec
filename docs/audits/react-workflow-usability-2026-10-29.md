# React workflow usability — 29 October 2026

Owner-approved Radar → Positions → Sell pass, tracked in [Issue #22](https://github.com/courtjester15/ManaSpec/issues/22). Branch `codex/react-workflow-usability` starts at PR #21 head `1162eba`; review is stacked on that branch. No merge, deployment, frontend promotion, external-browser control, or real user-data writes.

## Findings and changes

- **Reproduced app crash:** buying a synthetic $200 sealed unit with $100 cash opened the fatal error boundary. Domain operations ran inside React state updater callbacks, so the view handler could not catch the deferred error. Updates now calculate and persist synchronously before publishing state, using a current-state ref to preserve successive/batched updates. The form catches failures and retains the dialog and entered values with an inline alert. Persistence no longer runs during React updater replay.
- **Silent execution substitution:** zero/missing/invalid quantities were clamped, oversells were reduced to current ownership, and missing sale prices fell back to quote or acquisition cost. Buy/sell now reject nonpositive, fractional, nonfinite or unsafe quantities and invalid prices. Sales validate against current holdings and use current basis rather than stale dialog data. Tests cover singles and sealed and assert rejected operations leave input unchanged.
- **Misleading form defaults:** an unavailable quote previously displayed acquisition cost as execution price. Missing/zero/invalid quotes now leave a required execution-price field empty. Existing positive quote suggestions remain editable; this is not a claim of an executed market price. Sell dialogs expose owned quantity and a Sell all shortcut; totals explicitly say purchase total or sale proceeds.
- **Filtered empty recovery:** Positions now offers Show all Positions for text, asset-class and deep-link filters, clearing all three. Empty copy accommodates both filtering and an empty portfolio (Tabulator captures its placeholder at mount).
- **Table boundary:** installed Tabulator `setSort` mutates supplied sorter objects. The wrapper now clones those objects before passing React props to the vendor, resolving the observed `$$typeof` column-component errors in a fresh development replay. React-rendered controls stop click propagation before Tabulator processes an action that can replace the row.

## Actual verification

`npm test`: **83 passed, 0 failed**. Source and formatting checks passed. Normal, Pages and portable builds passed; tracked Pages manifest verifies **17 files**. Existing large-chunk, portable `inlineDynamicImports` and `import.meta` warnings remain. Artifact files were generated through build scripts.

In-app browser used synthetic-only storage, never owner localStorage. `tools/prepare-workflow-browser-qa.py` creates reproducible wrappers from `tools/workflow-qa-bootstrap.html`. The bootstrap replaces localStorage with an in-memory Map persisted only under a named sessionStorage fixture key. Reload retains the QA session; a new tab starts fresh. No Scryfall observations or valuations were fabricated or saved as real user data.

Development browser sequence:

1. Seed: $100 cash, 2 unknown-price nonfoil copies at $5 basis, 2 foil copies at $5 basis/$8 quote, 2 unpriced sealed units at $20 basis. Radar watches the nonfoil and sealed identities.
2. Reject unaffordable buy, retain dialog and inputs, retry successfully. Blank price fails native required validation and focuses that input. Oversell fails native range validation.
3. Buy 1 sealed at $20 and 2 nonfoil at $7: $66 cash, nonfoil quantity 4 at weighted $6 basis. Unpriced values/P&L remain unavailable; foil remains separate.
4. Sell 1 nonfoil at $9 and remaining 3 at $10 using Sell all and keyboard Enter: realized $3 + $12. Sell 1 sealed at $25 and remaining 2 at $30: realized $5 + $20.
5. Reload: $190 cash, only the 2 foil copies remain, $10 open basis, $16 marked value, $206 equity and +$6 unrealized. Dashboard reports +$40 realized with 4/4 SELL coverage. Transactions retains 6 new events; both Radar ideas remain watched. History and Signals render and preserve navigation.
6. Exported the synthetic schema-v2 backup through Admin, independently inspected its counts/cash/transactions, imported that same file through the preview/confirmation dialog, and reloaded. Dashboard totals remain consistent. This proves the fixture round-trip, not recovery of owner data or cross-origin synchronization.

At 1366×768 all five table routes (Radar, Positions, Signals, Transactions, History) fit without document horizontal overflow. Laptop screenshot inspection confirmed headers, money, row rhythm and actions. At 1920×1080 the built trade dialog/error renders fully; required fields, Cancel, confirmation and Sell all work. Row buttons open the intended trade dialog without also opening Detail. Keyboard submit and required-input focus were checked; a comprehensive accessibility/focus audit was not performed.

Pages-subpath browser smoke: copied generated artifact served on loopback at `/ManaSpec/react-spike/qa.html`; verified foil full sale, Radar quantity control, unaffordable buy alert and Cancel. Final built smoke console: no warnings/errors. Hosted portable `/portable/qa.html` renders and sells an unpriced sealed position with explicit execution price; final smoke console empty and all table routes contain at laptop width. These are local built-artifact checks, not deployed Pages verification.

## Limits and follow-ups

- Direct `file://` portable verification remains blocked by the in-app browser's HTTP(S)-only policy; hosted portable is separate evidence. No external-browser fallback.
- Development replay still emitted one Tabulator row-target lookup warning after a quantity-driven refresh. The fatal trade error and `$$typeof` errors did not recur after their fixes; the final production-build smoke did not reproduce the row warning. Do not describe the whole development session as console-clean.
- Persistence still saves separate keys. This pass makes failures catchable; it does **not** establish atomic multi-key writes or power-loss/quota recovery for trades. A bounded storage-operation/recovery follow-up remains the best foundation candidate. No new schema, transaction authority, or startup migration is introduced.
- Live discovery/provider availability, broad assistive-technology review and phone/device QA were outside this focused synthetic trade pass. Existing domain suites retain missing/stale/failed quote and backup compatibility coverage.
- No milestone/promotion occurred, so HISTORY and roadmap sequencing were not rewritten. Changelog records delivered behavior; this audit owns diagnostic evidence.

## Reproduce

From the repository root run `python tools/prepare-workflow-browser-qa.py` after builds. Run React Vite on loopback (the verified session used port 5174) and open `http://127.0.0.1:5174/.tmp/workflow.html#/radar`. For built checks serve `.tmp/workflow-preview` with Python bound to `127.0.0.1` on port 8000, then open the Pages or portable QA URL above. The copied QA output is ignored and must not be deployed.
