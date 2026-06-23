# 2026-06-22 Workflow Pass 2 - Architect Summary

Status: Review complete. Do not implement from this note directly. Use this note to guide future batches.

## Overall Assessment

ManaSpec is no longer suffering from major workflow gaps. Most observations are now about workflow confidence, information hierarchy, attention management, and UI consistency.

The core Radar -> Position -> Signal -> Transaction loop generally exists and works.

The dominant themes from this pass were:

1. Dashboard and Radar tiles communicate statistics more than action.
2. Card Detail needs a command-center workflow review.
3. Signals, targets, and prices need stronger action context.
4. Shared UI elements need consistency passes.
5. Transactions and History need clearer outcome visibility.
6. Admin workflows need stronger safety and user trust.

---

## Theme 1 - Dashboard And Radar Tiles

Current tiles feel informational but often do not help the user decide what to do next.

Examples:

* Notes count provides little value.
* Radar count is mildly useful but not actionable.
* Targets Approaching appears in multiple places.
* Some tiles duplicate information.

Future direction:

Dashboard should balance:

* Portfolio awareness.
* Actionable attention.

Potential useful tiles:

* Targets Approaching.
* Targets Hit.
* Open P/L.
* Top Gainer.
* Top Loser.
* Recent Notes.
* New Positions.
* Watchlist Opportunities.

The goal is not more tiles. The goal is better signals.

---

## Theme 2 - Card Detail Command Center

Card Detail is emerging as the biggest remaining workflow review area.

Current sections:

* Overview
* Plan
* Market Evaluation
* Market Check
* Notes
* Oracle

Questions raised:

* Does Overview provide enough value separate from Market Evaluation?
* Is Plan the primary workflow section and therefore should appear first?
* Is Market Check more important than Overview?
* Does expanding Market Check disrupt layout too much?
* Why does editing a plan not immediately reinforce what changed?

Strong direction:

Card Detail should increasingly feel like the primary workspace for a tracked printing rather than a collection of information panels.

---

## Theme 3 - Workflow Confidence

Several observations point to confidence issues rather than missing features.

Examples:

* User edits a plan but is not immediately sure what changed.
* Save behavior feels inconsistent between tables and Card Detail.
* Some updates appear delayed.
* Signals do not always clearly communicate expected action.

Strong direction:

Whenever possible:

* Edit.
* Enter or click away.
* Save automatically.
* Render immediately.

Users should rarely wonder:

* Did it save?
* What changed?
* What am I supposed to do now?

---

## Theme 4 - Signals And Target Clarity

Signals currently provide attention but not always enough context.

Examples:

* Distance values lack directional meaning.
* Radar and Positions signals blend together.
* Action intent is not always obvious.

Desired outcome:

A signal should answer:

* Why am I seeing this?
* What should I consider doing?
* Is this a buy workflow or sell workflow?

---

## Theme 5 - Transactions And History

Current transaction history records activity but does not yet communicate outcomes strongly enough.

Ideas worth reviewing:

* Running balance column.
* Realized gain/loss shown on SELL rows.
* Stronger review value after exits.

Goal:

Transactions should increasingly feel like a trading journal rather than a raw event log.

---

## Theme 6 - Shared UI Consistency

Repeated observations:

* Toast button alignment.
* Dismiss button alignment.
* Money column padding.
* Editable bubble alignment.
* Popup spacing.
* Search loading indicators.

These appear to be one shared polish pass rather than isolated bugs.

---

## Theme 7 - Admin Data Safety

Reset Cash workflow deserves review.

Current concern:

User avoided testing because action felt risky.

Minimum expectation:

* Strong warning.
* Clear explanation of impact.

Future possibility:

Replace Reset Cash with Set Bankroll workflow that reflects how a real user thinks about speculation capital.

---

## Architect Recommendation

Do not implement this entire review as one batch.

Split into future batches:

1. Workflow confidence and trust.
2. Card Detail command-center review.
3. Shared UI consistency pass.
4. Dashboard and tile definition pass.

Maintain discipline and execute one batch at a time.
