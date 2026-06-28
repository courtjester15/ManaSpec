# ManaSpec Future Audit Plan

Keep this as a future reference. These audits are not all urgent. Use them at natural checkpoints.

## 1. Hygiene Audit

**When:** Occasionally, especially after big feature batches.

Purpose:

- Find dead code, old files, unused helpers, legacy experiments, duplicate assets.
- Keep repo clean without doing major architecture work.

Status:

- Already done once.
- Re-run lightly near beta.

## 2. Architecture / Separation of Concerns Audit

**When:** Baseline now, then re-run near beta or right after beta.

Purpose:

- Find files doing too many jobs.
- Identify modules worth splitting later.
- Spot duplicated logic and unclear ownership.
- Avoid refactoring too early.

Current use:

- Treat current audit as baseline only.
- Compare future audit against it before acting.

## 3. Workflow / CLW Audit

**When:** Ongoing during Core Loop Workflow refinement.

Purpose:

- Find friction in actual use.
- Check scan speed, table clarity, sort/filter behavior, action placement, and add/buy/sell flow.
- Decide what feels intuitive before moving deeper into Dashboard.

Status:

- Current main focus.

## 4. UI Consistency Audit

**When:** After CLW stabilizes, before wider beta testing.

Purpose:

- Standardize buttons, spacing, table rhythm, icons, empty states, tooltips, and terminology.
- Catch things like inconsistent column names, button vertical alignment, filter density, and table header wording.

## 5. Data Model / Ownership Audit

**When:** Before Ledger work.

Purpose:

- Decide what is source of truth.
- Identify duplicated data between Radar, Positions, Transactions, Notes, Snapshots, and Market Checks.
- Clarify what is stored vs computed.
- Prepare for ledger migration safely.

This is likely one of the most important pre-Ledger audits.

## 6. Beta Readiness Audit

**When:** Right before sharing with brother/friends.

Purpose:

- Check backup/restore.
- Check bad input handling.
- Check recoverability from mistakes.
- Check first-user confusion points.
- Confirm key workflows are understandable without developer guidance.

## 7. Performance Audit

**When:** Only if the app feels slow.

Purpose:

- Investigate search delay, table render lag, large localStorage behavior, and repeated DOM work.
- Do not optimize early unless the pain is real.

## Likely Order

Current:

1. CLW / Workflow Audit

Near beta:

2. UI Consistency Audit
3. Light Hygiene Audit
4. Beta Readiness Audit

Before Ledger:

5. Data Model / Ownership Audit

After beta:

6. Re-run Architecture Audit and compare against baseline

Only if needed:

7. Performance Audit
