# Issue #27 React promotion preparation — 2026-11-01

Promotion is NOT complete. No merge, deployment, Pages-setting change or owner-profile write occurred.

## Preserved stack and deployment

Ancestry is main 74d7a27 → PR #18 / 0b10524 → PR #21 / 1162eba → PR #23 / 73d7d4f → PR #25 / 17787b6 → this branch. All four PRs are open; #23 is draft. #18 has a successful artifact check; the other three had no CI checks/reviews when inspected. Preserve and integrate dependencies in order after gates pass; do not close #15/#16/#20/#22/#24 before integration. GitHub Pages uses legacy main/root publication; main is currently unprotected. Operational merge restrictions still apply.

Remote codex/vanilla-maintenance and annotated vanilla-before-react-promotion-2026-10-31 preserve 17787b6 including repaired vanilla. vanilla-pages-2026-10-31 preserves deployed 74d7a27. No history rewrite.

## Delivered safety corrections

- Multi-key saves now allocate a raw undo journal before writes, roll back failures, recover interrupted saves before load, and retain the journal if recovery fails. Stale loaded tabs reject changed storage. This is not cross-tab serializability; close competing writers before cutover.
- Corrupt saved arrays/cash fail closed. Startup recovery can download an allowlisted private raw archive without clearing data.
- Sealed normalization defaults no longer pollute unchanged exports, and older backup metadata cannot discard supplied sealed arrays.
- Blank manual observations cannot create zero quotes. Explicit zeros remain visible in checks, local search, target math and verified new price history; old unverified zeros remain unchanged. Legacy exact-linked notes regain History names/context.
- Canonical /ManaSpec/ build and a labeled schema-v2 React recovery package are generated separately from the working vanilla root. CI builds/tests and packages, never deploys.

## Observed parity matrix

| Workflow | Evidence / result |
| --- | --- |
| Singles discovery and finish | Completed live Sol Ring search → SLD #2783 explicit Foil selection → Add to Radar → full reload. Saved row retained #2783 F and the exact-finish quote; console clean. The earlier interrupted addition is superseded by this completed check. |
| Sealed lookup | Completed bundled Bloomburrow lookup → Bundle add → exact product detail. MTGJSON ec99d990-704c-5ad3-ae7f-f1dbc5fd5ceb and TCGplayer product 541241 remained visible. New product started unpriced; explicit manual zero displayed $0.00 with timestamp/history. Discovery dropdown now dismisses upon choosing a result, preventing it from covering saved-row actions. |
| Radar/watch and buy | Unknown execution price required; insufficient-cash error retained dialog; corrected keyboard submission succeeded and watch remained. |
| Add-on/partial/full sell | Singles basis became $5.60 for five units; partial and full exits passed. Sealed add/partial/full exit passed. Oversell blocked. |
| Cash and totals | Seven-trade synthetic result: cash $187, remaining basis $20, marked value $16, equity $203, recorded realized P/L $37; Dashboard, Positions and Transactions agreed. Synthetic cash reset changed cash to $10,000 while basis/value and record counts remained intact; the fixture was restored afterward. |
| Notes/detail/history | Exact foil note save, manual zero check, actual two-observation Price History, nested Escape, filtering and row actions exercised. |
| Prices | Controlled failed provider retained totals/history; successful exact-finish refresh saved three observations including verified etched zero. Unknown and zero remain distinct in filters and summaries. |
| Backup/reload | Native export verified independently; native import into empty fixture and reload retained seven trades, exact foil/etched, notes, zero observation and totals. |
| Native same-origin recovery | Confirmed empty loopback origin before import. Canonical → recovery portable HTTP build → sealed buy/sell → reload → canonical → review subpath preserved actual native localStorage. Final nine trades: cash $192, basis $20, value $16, equity $208, realized $42. This is controlled local proof, not owner Pages-profile proof. |
| Vanilla compatibility | Actual archived vanilla browser starts on compatible singles. Actual vanilla storage code reads React singles trades/notes; backup round trip passes. Guard refuses sealed or pending/corrupt state before app scripts start. Vanilla is not a complete sealed fallback; retained React recovery supplies that path. |
| Desktop visuals | Final c511da7 build: all seven React routes captured and visually inspected at 1920×1080 and 1366×768 (14/14). Documents, all five tables and filter toolbars fit; console clean. Explicit zero is visible in History price and Positions target distance. All seven preserved vanilla routes also exercised at both sizes; Radar/Positions/Dashboard screenshots compared. Vanilla provider warnings are expected 404s for deliberately synthetic printing IDs, not hidden React failures. |
| Phone/empty | Repeated all seven empty-state navigation routes on the final build at 390×844 with clean console. Populated native fixture restored to its original seven-trade export ($187 cash); session-backed fixture reset to its original $100 state after destructive QA. This is phone navigation sanity, not full mobile acceptance. |
| Portable | Build/classic script and hosted recovery runtime pass. DIRECT FILE DOES NOT PASS: browser policy explicitly allows only HTTP(S) and rejects file://. No alternate browser or desktop workaround attempted. |

## Verification and reproduction

102 React tests, source policy and format checks passed. Normal, Pages, portable and canonical builds passed; 17-file Pages manifest valid. Existing bundle-size/IIFE import.meta warnings remain. Focused vanilla storage, valuation and finish-correction checks passed (provider failures are deliberate synthetic cases).

Read-only compatibility audit passed against the private older June backup copy (SHA256 80c18a91feda24c2c2a6bd8ee6e011e6eab301aa685e5e279c77713752e58ee9) and synthetic browser export: unchanged records/unknown fields, no load writes, backup round trip and summary equality. Private data was not committed. An older backup does not certify current owner storage.

Run tools/prepare-promotion-browser-qa.py after builds; serve .tmp/issue-27-preview on loopback 8029. Canonical fixture: /ManaSpec/qa.html; review: /ManaSpec/react-spike/qa.html; hosted portable: /portable/qa.html. Wrappers use synthetic session-backed storage and controlled provider responses; native tests used index.html without wrappers. Raw fixture data stays local under .tmp. Fifteen reviewed, non-private QA screenshots are retained in [the visual evidence directory](../screenshots/react-promotion/). Run tools/prepare-vanilla-rollback.mjs for guarded archive; tools/prepare-react-release.mjs for canonical plus same-origin recovery and source/hash manifest. Working-tree release packages honestly identify sourceDirty; release only the clean reviewed commit.

## Remaining gates / next action

1. Obtain an allowed file-origin-capable test environment; hosted HTTP evidence is insufficient. In-app security policy forbids workaround or alternate browser surfaces for the blocked action.
2. Obtain fresh read-only owner-origin compatibility/backup evidence without desktop control or owner-data writes. Current local native proof and an old backup are not substitutes.
3. Discovery/add and final visual checks are complete; no routine visual testing is assigned to Jason. Finish CI confirmation, retain the clean reviewed release/recovery artifact, and rehearse deployment manifest/real-root smoke when cutover is authorized by proven gates. The first CI run exposed Windows/Linux source-line-ending differences; .gitattributes now normalizes build inputs. A subsequent runner build stalled after passing tests and was stopped for diagnosis; do not call CI green until a complete run passes.
4. Keep #27 open, preserve all stacked PRs, and hold merges/deployment. #28 is the next high-value ready implementation after the React baseline is safely established.

## Final visual evidence

Every image below is a controlled QA view, not an owner profile or proof of direct-file behavior.

| Route | Primary | Supported laptop |
| --- | --- | --- |
| Dashboard | [1920×1080](../screenshots/react-promotion/issue-27-complete-dashboard-1920.jpg) | [1366×768](../screenshots/react-promotion/issue-27-complete-dashboard-1366.jpg) |
| Radar | [1920×1080](../screenshots/react-promotion/issue-27-complete-radar-1920.jpg) | [1366×768](../screenshots/react-promotion/issue-27-complete-radar-1366.jpg) |
| Positions | [1920×1080](../screenshots/react-promotion/issue-27-complete-positions-1920.jpg) | [1366×768](../screenshots/react-promotion/issue-27-complete-positions-1366.jpg) |
| Signals | [1920×1080](../screenshots/react-promotion/issue-27-complete-signals-1920.jpg) | [1366×768](../screenshots/react-promotion/issue-27-complete-signals-1366.jpg) |
| Transactions | [1920×1080](../screenshots/react-promotion/issue-27-complete-transactions-1920.jpg) | [1366×768](../screenshots/react-promotion/issue-27-complete-transactions-1366.jpg) |
| History | [1920×1080](../screenshots/react-promotion/issue-27-complete-history-1920.jpg) | [1366×768](../screenshots/react-promotion/issue-27-complete-history-1366.jpg) |
| Admin | [1920×1080](../screenshots/react-promotion/issue-27-complete-admin-1920.jpg) | [1366×768](../screenshots/react-promotion/issue-27-complete-admin-1366.jpg) |

[Phone navigation capture](../screenshots/react-promotion/issue-27-complete-phone.jpg).
