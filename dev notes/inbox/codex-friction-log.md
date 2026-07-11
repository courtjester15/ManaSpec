# Codex Friction Log

Purpose: capture recurring or surprising friction while Codex works in this repo.

This is not an active rules document. Use it as raw project memory for environment quirks, tool snags, and avoidable loops. When the same friction repeats or clearly affects project safety, promote the lesson into `docs/WORKFLOW.md`.

## How To Use

Add an entry when Codex has to take a non-obvious detour, retry a command because of tooling/environment behavior, or work around a harness limitation.

Useful entry shape:

```text
Date:
Context:
What happened:
Workaround:
Promote to Workflow? yes/no/later
```

Keep entries short. The goal is to improve future navigation, not document every normal typo or harmless retry.

## Current Patterns

### Browser Harness And Local App Testing

Context: UI QA and browser inspection.

What happened: Browser automation can behave differently against `file://` URLs, and browser `evaluate()` has been unreliable for inspecting localStorage/app state in the Codex browser harness.

Workaround: Use the documented localhost QA path and test through `http://127.0.0.1:8000/index.html`. Prefer visible UI, DOM snapshots, screenshots when useful, and console checks over localStorage inspection through `evaluate()`.

Promoted: yes, recorded in `docs/WORKFLOW.md`.

### Browser Session Fatigue

Context: Extended browser inspection and automation.

What happened: The browser harness has occasionally become sluggish or inconsistent after extended inspection sessions.

Workaround: If browser automation starts looping, hanging, or producing inconsistent results, restart the browser session, reopen the page, and continue debugging from a fresh state instead of spending excessive time recovering the existing browser state.

Promoted: yes, recorded in `docs/WORKFLOW.md`.

### Card Detail Versus Art Preview

Context: Browser QA for Card Detail.

What happened: Across ManaSpec modules, clicking a card name can open art preview instead of Card Detail. This can make a test look like it opened the right surface when it did not.

Workaround: Verify the open modal contains `#cardDetailBody` or `.card-detail-panel`, not `.card-art-preview`.

Promoted: yes, recorded in `docs/WORKFLOW.md`.

### PowerShell Parallel Reads Timing Out

Context: Documentation review and file inspection.

What happened: Several simple parallel read/search commands timed out together, then succeeded when retried separately with a longer timeout.

Workaround: If parallel read-only commands time out unexpectedly, retry the specific command sequentially with a larger timeout before assuming the repo or command is broken.

Promote to Workflow: later, if it repeats.

### Dirty Worktree And Narrow Commit Scope

Context: Multiple documentation batches in one session.

What happened: Uncommitted documentation changes from earlier batches made later commits easy to mix accidentally.

Workaround: Use `git status --short`, stage only the intended files, inspect `git diff --cached --stat`, and commit narrowly. Mention unrelated dirty files in the final response.

Promoted: partly, Git checkpoint rules already exist in `docs/WORKFLOW.md`.

### CSS Framework Side Effects

Context: Pico CSS duplicate-spinner issue.

What happened: Pico generated spinner behavior through CSS, so normal DOM/JS inspection did not explain the duplicate visual state.

Workaround: When UI behavior appears duplicated but JS/DOM only shows one element, inspect framework CSS and pseudo-elements. For loading/spinner issues, check Pico's `[aria-busy="true"]` behavior before adding or removing ManaSpec spinner code.

Promote to Workflow: later, likely during a future CSS audit.

### Table Contract Regressions

Context: Dense table layout and editable-cell changes.

What happened: Small table or editable-cell changes caused layout/scan regressions across shared table surfaces.

Workaround: Treat table changes as app-wide changes and verify Radar, Positions, Signals, Transactions, and History. Be especially careful when changing input display wrappers, editable-display height, cell padding, money formatting, table grid tracks, or shared cell classes.

Promoted: yes, recorded in `docs/WORKFLOW.md`.

### Dense Table Wrapping

Context: Laptop-first scan surfaces.

What happened: Wrapping in dense tables and search rows has repeatedly hurt scan rhythm.

Workaround: Preserve single-line rhythm for prices, dates, set codes, collector numbers, finish labels, actions, headers, and compact status values. Use ellipsis rarely and mostly for long recoverable text. Check `docs/STYLE_GUIDE.md` before changing wrapping behavior.

Promoted: yes, recorded in `docs/STYLE_GUIDE.md` and `docs/WORKFLOW.md`.

### Responsive Layout Rabbit Holes

Context: Desktop/responsive CSS experiments.

What happened: Broad responsive layout work was reverted or parked because it risked pulling attention away from beta workflow polish.

Workaround: Do not restart broad responsive layout work until the Parking Lot desktop layout contract is promoted into a committed plan. The current accepted shape is laptop-first with larger screens adding breathing room, not different workflows.

Promote to Workflow: no, unless responsive work becomes active again.

### Beta Polish Scope Creep

Context: Product and UI refinement work.

What happened: It is easy to turn a narrow polish pass into broad refactor or feature expansion.

Workaround: Review first, batch small, one module/workflow at a time, and call out rabbit holes early. Use `docs/PRODUCT_PRINCIPLES.md`, especially Workflow Before Features and Complexity Must Earn Its Place.

Promote to Workflow: partly, already reflected in Workflow and Product Principles.

### Roadmap Versus Parking Lot Drift

Context: Documentation ownership.

What happened: Roadmap commitments and Parking Lot ideas started to overlap.

Workaround: Roadmap means "we are going to build this." Parking Lot means "we might build this." Do not let Parking Lot become Roadmap v2.

Promoted: yes, recorded in `docs/ROADMAP.md` and `docs/PARKING_LOT.md`.

### Active Docs Versus Dev Notes

Context: Reading project memory.

What happened: Dev notes and audits are useful context but can become stale or diagnostic rather than authoritative.

Workaround: Active docs win. Promote findings into active docs before treating them as current truth.

Promoted: yes, recorded in `docs/WORKFLOW.md`.

### Storage And Ledger Safety

Context: localStorage, backup/import, transactions, specs, radar, notes, snapshots, and market observations.

What happened: Storage changes carry trust risk because local browser data is user-owned project state.

Workaround: Do not rename storage keys casually. Plan ledger migration before changing ownership flow. Preserve current localStorage data and backup/import compatibility.

Promoted: yes, recorded in `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/DECISIONS.md`, and `docs/ROADMAP.md`.

### Notes Must Follow Printing Identity

Context: Notes across Radar, Positions, Card Detail, Signals, Transactions, and History.

What happened: Notes tied only to a row would be easy to lose during buy, sell-all, or re-buy workflows.

Workaround: Keep notes keyed to exact tracked printing identity. Do not attach notes only to a Radar row or Position row.

Promoted: yes, recorded in active docs.

### Search Domain Confusion

Context: Search, filtering, and future routing.

What happened: Card discovery, local table filtering, transaction/history filtering, and future global routing can be confused if all are called "search" without context.

Workaround: Card Search belongs in Radar for now. Keep Scryfall discovery separate from local Radar/Positions filtering and transaction/history filtering.

Promoted: yes, recorded in active docs.

### Digital Search Without Digital Pricing

Context: Scryfall search and pricing expectations.

What happened: Digital results without MTGO/digital price support can imply unsupported price intelligence.

Workaround: Do not reintroduce MTGO/Digital search unless digital pricing support ships with it.

Promoted: yes, recorded in `docs/ROADMAP.md` and `docs/README.md`.

### Price Source Confusion

Context: Radar price, Scryfall snapshots, Market Check, and TCGplayer pasted observations.

What happened: User confusion appeared when different price-like values came from different sources.

Workaround: When touching pricing labels, make the source clear: Scryfall snapshot/current price, user-pasted market observation, target math, or local snapshot history.

Promote to Workflow: later, if pricing UI work resumes.

### Card Detail Pressure Point

Context: Card Detail implementation and product role.

What happened: Card Detail handles many responsibilities and can become tempting to split by file size.

Workaround: Do not split only because it is large. After beta, extract pure helpers first: plan parsing, hold-time parsing, target state, market observation parsing, market evaluation, and formatting. Card Detail should not own separate plan state; plan edits belong to the canonical Radar Item or Position.

Promoted: yes, recorded in `docs/ARCHITECTURE.md`.

### Market Evaluation Boundaries

Context: Card Detail market evaluation.

What happened: It would be easy for market evaluation to drift into speculative advice.

Workaround: Keep evaluation observable only: Scryfall metadata, local targets, local notes presence, timestamps, pasted market observations, and local price snapshots. Avoid buy/sell recommendations, reprint risk claims, format-demand claims, or catalyst prediction.

Promoted: yes, recorded in active docs.

### Commit And Push Boundaries

Context: Git work with user-owned repo.

What happened: Local commits are useful, but pushes should be explicit. Coherent doc ownership changes are not throwaway notes.

Workaround: Commit coherent doc/process changes when requested or when a batch is complete. Include suggested commit/push guidance in GPT implementation notes. Do not push unless the user asks.

Promoted: yes, recorded in `docs/WORKFLOW.md`.

### Momentum And Response Shape

Context: Working with the user during evening builder sessions.

What happened: Long analysis can burn momentum when the user wants quick action or a concise read.

Workaround: Answer directly first when the user is in rapid-fire mode, then explain only as useful. Avoid unnecessary clarifying questions when context is enough. If a rabbit hole appears, call it out early.

Promote to Workflow: no, keep as collaboration memory unless it repeatedly affects project outcomes.

### Market Check Visual Help Guide

Date: 2026-07-10

Context: Market Check visual help guide implementation and browser QA.

What happened: Several small environment and tool frictions appeared. Patch anchors failed around existing encoded/icon text. The local browser DOM snapshot API failed even though the app rendered normally. Browser evaluation could not directly inspect localStorage. Screenshot capture produced JPEG bytes despite `.png` filenames. Browser clip capture selected the wrong region. QA used existing browser-local data and created a sample Market Check observation during save-path verification. A one-off `node --check` timeout and a minor PowerShell option mismatch also occurred.

Workaround: Anchor patches on ASCII function names, IDs, classes, or nearby structural markup instead of icon strings. For browser QA, use the documented localhost QA path, visible UI checks, targeted selectors when available, screenshots, and console logs when DOM snapshot or localStorage inspection is unavailable. For screenshot assets, verify they load in the running app; use full viewport plus measured crop when clip capture is unreliable. Treat browser QA state as disposable unless explicitly restored from a known fixture.

Classification: repeat risk for encoded patch anchors, image-format mismatch, mystery browser QA state, and Card Detail complexity; known workaround for DOM/localStorage inspection limits, screenshot clipping, and local-server cleanup; one-off unless repeated for quick-check timeout and PowerShell option mismatch.

Screenshot guidance: keep externally sourced screenshots cropped and free of personal/private information. Frame marketplace screenshots as manually gathered examples, never as official integration, scraping, or verified price data. Refresh screenshots only when the pictured workflow materially changes.

Promote to Workflow: later, if these frictions recur or affect QA confidence.
