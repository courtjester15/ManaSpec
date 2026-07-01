# ManaSpec Documentation Drift Audit

Date: 2026-06-30

Scope: read-only comparison of the active ManaSpec implementation against the active documentation set.

Priority lens: identify meaningful drift that could confuse future contributors. This audit does not rewrite docs, fix code, or propose speculative improvements.

No code changes were made as part of this audit.

## Files Reviewed

Active documentation:

- `docs/README.md`
- `docs/PRODUCT_PRINCIPLES.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/STYLE_GUIDE.md`
- `docs/ROADMAP.md`
- `docs/WORKFLOW.md`
- `docs/DECISIONS.md`

Implementation touchpoints:

- `index.html`
- `js/core/app.js`
- `js/core/state.js`
- `js/core/storage.js`
- `js/ui/help.js`
- `js/ui/table.js`
- `js/ui/context-band.js`
- `js/modules/admin/admin.js`
- `js/modules/card-details/card-details.js`
- `js/modules/card-filters/card-filters.js`
- `js/modules/dashboard/dashboard.js`
- `js/modules/history/history.js`
- `js/modules/portfolio/portfolio.js`
- `js/modules/portfolio/search.js`
- `js/modules/portfolio/trading.js`
- `js/modules/radar/radar.js`
- `js/modules/signals/signals.js`
- `js/modules/transactions/transactions.js`

## Verification

- `git status --short` after the read-only audit was clean.
- No active docs were rewritten as part of this audit note.
- No implementation files were changed as part of this audit note.

## Executive Summary

The active docs are broadly aligned with the current product direction, but several Signals, Transactions, and Roadmap statements have drifted after recent workflow polish.

The most contributor-confusing drift is:

- Signals are documented as partly manual/saved, but the active UI now treats Signals as computed attention from Radar, Positions, and market-check state.
- Roadmap still lists several items as pending even though code now substantially implements them.
- README understates the current Transactions ledger and overstates the absence of ledger behavior.
- Help still mentions a Digital Radar search path that the active UI intentionally does not expose.

## Findings By Document

### `docs/README.md`

#### High: Signals manual records are documented but not active

- Documented behavior: Signals current behavior says manual signal records can still be added.
- Code behavior: `js/modules/signals/signals.js` renders computed attention rows from `getTrackedSignalCards()`. It does not render a manual-signal creation UI and does not include saved `signals` records in the active table.
- Why it matters: future contributors may look for a manual Signals workflow that no longer exists.

#### High: Signals context-band description is stale

- Documented behavior: Signals uses the shared module context band for attention buckets.
- Code behavior: Signals uses a custom `signals-action-band` / `signals-action-tile` queue system, not `renderModuleContextBand()`.
- Why it matters: this misroutes future UI work toward the wrong shared component.

#### High: Transactions ledger is understated

- Documented behavior: Positions limitations say there is no transaction ledger yet.
- Code behavior: the app has a Transactions module, logs BUY/SELL rows, backfills opening BUY rows from current Positions, tracks balance context, and estimates realized SELL P/L where possible.
- Still true: Positions remain directly mutated and are not yet computed from Transactions.
- Why it matters: contributors could underestimate existing ledger behavior and duplicate work.

#### Medium: Signals exact filtering and deep-link behavior is missing

- Code behavior: `openTrackedSource()` can route to exact Radar/Position rows with filter/focus, and Signals tile preview rows can filter the Signals table to an exact printing.
- Documentation gap: README describes Signals deep-links broadly but does not capture exact filtering behavior.
- Why it matters: exact-row workflow is now part of the attention model.

#### Medium: No Plan ownership rules are missing

- Code behavior: Radar requires only Entry; Positions require Exit and Hold.
- Documentation gap: README says No Plan rows show tracked cards without plan data, but does not state the ownership-specific rule.
- Why it matters: this rule has already caused regressions and should be easy to find.

#### Medium: Approaching fallback behavior is missing

- Code behavior: Signals fills quiet Approaching tiles with nearest target watches outside the strict 5% threshold.
- Documentation gap: README documents approaching target states but not the fallback behavior.
- Why it matters: future contributors may remove fallback rows while trying to simplify Signals.

#### Low: Signals reset location is stale

- Documented behavior: Signals table header includes a `Show all` reset.
- Code behavior: reset lives in the Signals utility tile.
- Why it matters: minor UI orientation drift.

#### Low: Signals "target panels" wording is stale

- Documented behavior: README refers to target panels.
- Code behavior: current UI is attention tiles with Dashboard-style queue rows.
- Why it matters: low-risk terminology drift.

### `docs/PRODUCT_PRINCIPLES.md`

No meaningful drift found.

### `docs/ARCHITECTURE.md`

#### High: Signals saved/manual state is overstated

- Documented behavior: runtime state includes `signals`, and Signals are described as partly saved/manual records.
- Code behavior: `signals` still loads and is included in backup/import, but the active Signals UI computes rows from Radar, Positions, and market observations.
- Why it matters: contributors may assume saved Signals are an active workflow state owner.

#### Medium: Shared attention queue renderer is not documented

- Code behavior: Dashboard and Signals now share `renderAttentionQueueRow()` for queue row markup/styling.
- Documentation gap: Shared UI Systems does not mention the attention queue row pattern.
- Why it matters: future Dashboard/Signals work should preserve the shared visual contract.

#### Medium: Signals source filtering is more advanced than docs imply

- Code behavior: Signals can route to exact Radar/Position rows and can filter the Signals table to an exact tile preview card.
- Documentation gap: architecture only describes broad deep-linking.
- Why it matters: source navigation is now part of the attention workflow contract.

### `docs/DATA_MODEL.md`

#### High: Signal backing-store description is stale

- Documented behavior: Signal backing store is partly computed and partly saved in `signals`.
- Code behavior: active Signal rows are computed. Saved `signals` persist as a storage key but are not surfaced in the Signals UI.
- Why it matters: this blurs source-of-truth ownership for Signals.

#### Medium: Manual reminders are listed as active Signal examples

- Documented behavior: Signals can represent manual reminders or saved signal records.
- Code behavior: active UI does not create or render manual reminders.
- Why it matters: contributors may preserve or build around a workflow that is currently absent.

#### Medium: Signal relationships omit exact filtering

- Code behavior: Signals can filter within Signals to an exact printing, and source routing can filter/focus Radar or Positions.
- Documentation gap: relationship text only says Signals open Radar, Positions, or Card Detail.
- Why it matters: exact filtering has become part of the data relationship users experience.

### `docs/STYLE_GUIDE.md`

No major drift found.

#### Low: Shared attention queue row pattern is not named

- Code behavior: Dashboard and Signals now share attention queue row styling and rendering.
- Documentation gap: Style Guide describes Dashboard tiles and dense scan surfaces, but not the shared Dashboard/Signals attention row pattern.
- Why it matters: nice to document once the pattern is stable.

### `docs/ROADMAP.md`

#### High: App-styled sell confirmation is still pending but implemented

- Roadmap item: replace native sell confirmation with an app-styled workflow.
- Code behavior: `sellSpec()` uses `requestAppConfirmation()` with quantity input and `Sell 1` / `Sell All` controls.
- Why it matters: this appears completed and should not remain a beta blocker.

#### High: Toast notifications are still listed as open notes but implemented

- Roadmap note: replace layout-shifting save notices with toast notifications.
- Code behavior: `showAppNotice()` renders toasts in `#toastStack`.
- Why it matters: this open note can cause duplicate work.

#### Medium: Signals exact deep-linking is still listed as pending

- Roadmap item: deep-link Signals to exact Radar/Position rows.
- Code behavior: Signals `View` action routes through `openTrackedSource()`, which applies exact source filtering/focus. Signals tile preview rows can also exact-filter the Signals table.
- Remaining nuance: this may still need UX review, but it is no longer untouched pending work.
- Why it matters: roadmap should distinguish completed source filtering from any remaining polish.

#### Medium: Signals hierarchy item is stale or partly complete

- Roadmap note: make each signal communicate why it appears and what action is expected.
- Code behavior: recent Signals tiles and table rows now show source, action, reason, and current-to-target context.
- Why it matters: if more hierarchy work remains, the roadmap should state the remaining gap instead of the original broad item.

#### Medium: Digital search archive item may now be docs/help cleanup rather than product work

- Roadmap item: archive Digital search until MTGO tix prices can render.
- Code behavior: active search filters paper cards and no visible Digital toggle is present.
- Drift source: Help still tells users to turn on Digital.
- Why it matters: remaining work appears to be documentation/help cleanup, not active UI removal.

### `docs/WORKFLOW.md`

#### Medium: Rich-data browser QA guidance is incomplete

- Documented behavior: use newest backup fixture as the default rich-data QA fixture.
- Related documented caveat: browser `evaluate()` is not reliable for inspecting localStorage or app state.
- Implementation/tool reality: this leaves an unclear path for loading/restoring fixtures during browser QA.
- Why it matters: future browser QA may avoid rich-data checks or mutate local data awkwardly.

#### Low: Standard localhost port guidance is slightly rigid

- Documented behavior: start `python -m http.server 8000 --bind 127.0.0.1`.
- Observed workflow: alternate ports are sometimes used when 8000 is occupied.
- Why it matters: minor process ambiguity; the core rule of localhost instead of `file://` is still correct.

#### Low: Workflow correctly requires docs updates, and this audit identifies missed updates

- Documented behavior: update docs in the same pass as workflow changes.
- Current state: recent Signals and notification behavior made it into code/changelog but not all active docs.
- Why it matters: this is process drift, not app behavior drift.

### `docs/DECISIONS.md`

#### High: Saved Signal assumptions are stale by implication

- Decision context: ManaSpec preserves `signals` as local user-owned state, and Data Model describes saved/manual Signals.
- Code behavior: active Signals UI does not expose saved/manual signals.
- Why it matters: storage preservation remains correct, but active workflow ownership should not imply saved Signals are currently meaningful UI state.

#### Medium: Ledger framing understates current implementation

- Documented decision: ledger/history are future direction and current portfolio state is useful but not auditable.
- Code behavior: Transactions now provides a visible early ledger, backfills opening BUY rows, and preserves closed-position history through transaction rows.
- Still true: Positions are not yet computed from Transactions.
- Why it matters: contributors could treat Transactions as more speculative than it now is.

## Most Likely Contributor Confusion

### High

- Whether Signals are computed-only or still include manual/saved Signal records.
- Whether the Transactions ledger exists or is still purely future work.
- Whether sell confirmation replacement and toast notifications are still open beta tasks.

### Medium

- How exact Signals filtering/deep-linking currently works.
- Whether No Plan rules differ for Radar and Positions.
- Whether Approaching should stay useful on quiet days through fallback rows.
- Whether Digital Radar search exists in the active UI.

## Suggested Documentation Targets

These are documentation targets only, not implementation recommendations:

- Update `docs/README.md` Signals, Transactions, and Help-adjacent behavior.
- Update `docs/DATA_MODEL.md` and `docs/ARCHITECTURE.md` to clarify that active Signals are computed, while `signals` remains a preserved storage key.
- Reclassify completed or partially completed Roadmap items around sell confirmation, toast notifications, Signals deep-linking, and Digital search.
- Add a short note for the shared Dashboard/Signals attention queue row pattern once it is considered stable.
