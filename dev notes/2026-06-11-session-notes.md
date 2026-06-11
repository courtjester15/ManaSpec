# 2026-06-11 Session Notes

## Completed From Beta Notes

Area: Workflow Ownership
Type: Design / Data Model
Severity: High

Repro:
Planning fields were split across Radar, Positions, Signals, and Card Detail without clear ownership.

Expected:
Radar owns entry planning and planned quantity. Positions owns owned-position management, exit planning, and hold tracking. Signals is a read-only attention layer. Card Detail edits canonical plan data for the current printing/source.

Outcome:
Updated `WORKFLOW.md` and `README.md`. Signals no longer edits plan data inline. Card Detail saves plan data to the source that opened it instead of cross-writing Radar and Positions.

Thought:
This is the main product-shape decision from the first beta pass.

## Completed From Beta Test 01

Area: Radar
Type: Workflow
Severity: High

Repro:
Buy a card from Radar.

Expected:
Radar item remains visible or the user can choose whether to remove it.

Outcome:
Buying from Radar now creates or updates a Position and keeps the Radar item watched.

Thought:
This supports scale-in workflows and avoids the "where did my watch item go?" moment.

Area: Radar
Type: Workflow
Severity: High

Repro:
Track a card with an intended entry price.

Expected:
Radar prominently supports target buy price as part of entry planning.

Outcome:
Radar now has an inline Entry column, editable directly from the Radar table.

Thought:
Radar now better reflects its ownership of entry planning.

Area: Positions
Type: Workflow
Severity: High

Repro:
Exit a position with quantity greater than 1.

Expected:
Ability to sell one, a chosen quantity, or all copies.

Outcome:
Positions now has a Sell Qty stepper plus Sell and All actions. Multi-copy exits log a single SELL transaction with the chosen quantity.

Thought:
This removes repeated single-copy sell friction while keeping the existing confirmation flow for now.

Area: Tables
Type: Bug
Severity: High

Repro:
After adding Radar Entry and Positions Sell Qty / All actions, action buttons overflowed and row heights became inconsistent.

Expected:
Tables keep fixed, scannable rows and horizontal scroll when dense.

Outcome:
Updated table grid templates so explicit columns match the new Radar and Positions cells.

Thought:
Root cause was CSS grid column count/width mismatch after workflow columns were added.

## Still Open From Beta Test 01

Area: Radar Search
Type: UX
Severity: Medium

Thought:
Search mode dropdown still creates cognitive overhead. Candidate fix is unified smart search, but this should wait until higher-priority workflow trust issues are handled.

Area: Global Notifications
Type: UX
Severity: Medium

Thought:
Save notices can still shift layout. Candidate fix is app-level toast notifications.

Area: Signals
Type: UX / Workflow
Severity: Medium

Thought:
Signals still needs clearer attention hierarchy and exact deep-links to the relevant Radar idea or Position.

Area: Data Safety
Type: Data Trust
Severity: High

Thought:
JSON export/import from Admin is still the next trust-building feature before deeper ledger migration.

## Suggested Next Priority Queue

1. Signals deep-linking to exact Radar/Position rows.
2. App-styled sell confirmation or modal workflow.
3. Global toast notifications to remove layout shift.
4. Card Detail command center polish pass.
5. Admin JSON export/import.
6. Ledger migration plan.
