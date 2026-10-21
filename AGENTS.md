# ManaSpec Agent Map

This is the short entry point for Dex and other contributors. `docs/WORKFLOW.md` owns the full contributor lifecycle; the assigned GitHub Issue owns executable scope.

- **Read in order:** this file → `docs/WORKFLOW.md` → the approved Issue/work order → only directly relevant canonical docs and source/tests. Do not recursively consume archives, old audits, `dev notes/`, or the entire roadmap by default.
- **Implementation authority:** the vanilla root is still the production/beta and behavioral reference. The React app in `react-app/` is an advanced candidate on the integration/PR #18 path, **not an automatically approved production replacement**. Confirm the current branch, Issue, and PR state before choosing a target.
- **Data invariants:** local-first user state and backup compatibility; exact single printing + finish or exact sealed-product identity; Radar plans, Positions manages ownership, Transactions currently records events but is not yet the universal ownership source of truth. Missing/invalid/stale price is **not** a verified $0 market price. Never fabricate valuations or investment recommendations.
- Reuse proven shared components, table behavior, domain selectors, and storage adapters before creating parallel implementations. Review the closest working sibling when a shared interaction changes.
- Keep runtime/build/deployment rules implementation-specific; follow `docs/DEPLOYMENT.md` and the directly relevant React or vanilla instructions. Do not modify generated artifacts by hand.

## Work orders and autonomy

- An Issue is the default source of truth for meaningful implementation. A short, directly owner-approved maintenance assignment may be sufficient for tiny or docs-only changes.
- Use one current `P0`–`P3` **implementation** priority or `E0`–`E3` **exploration** priority where labels exist; see `docs/WORKFLOW.md`. A tracker or `E` Issue is not permission to implement its ideas. A `P` Issue or explicit bounded owner approval is.
- A large Issue is fine if it describes one coherent reviewable outcome. Split materially unrelated or risky outcomes, not simply long Issues. Keep agreed product decisions settled unless actual code/evidence conflicts.
- Within an approved scope Dex may independently discover, reproduce, correct, and test **closely related** bugs and make reversible engineering/UI decisions. Stop for genuine product semantics, data-loss risk, storage migration, deployment/promotion authority, or material scope changes.
- **MTD handoffs:** one copyable block; first line `Issue # — Actionable title`, followed by roughly 2–5 brief lines citing the Issue and only new constraints. End `OPEN PR` for implementation intended to land. Do not duplicate a full Issue/engineering brief in chat.
- `docs/standards/APEX_ENGINEERING_EXECUTION_BRIEF_STANDARD.md` and its template are optional detail **when a Standard/High-Risk change cannot be safely specified in its Issue alone**. They do not add a mandatory second plan or gate for ordinary tasks.

## Self-review before asking Jason

- Dex owns first-pass QA: build, run, inspect, critique, fix obvious problems, then report **actual** evidence and remaining limits. Use `docs/WORKFLOW.md` browser/table/data-contract checks on the affected workflow, not a whole-app tour for each small edit.
- For data/financial changes, test representative valid, empty, unknown, stale, failed-fetch, foil/nonfoil, sealed/singles, and cross-module summary states as applicable. Verify price × quantity, cost basis, unrealized/realized P/L, exact asset identity, and all affected Dashboard/Positions/Signals totals. Never turn a fetch or mapping failure into a seemingly legitimate zero.
- For persisted or destructive changes, verify save/reload, add/buy/sell/correction flows, backup/export/import, version/schema compatibility and failure recovery with **synthetic/approved** fixtures. Preserve the original fixture and restore it after destructive QA.
- For UI changes, exercise the realistic task in a browser and check console, keyboard/row actions, common laptop geometry (1366×768) and 1920×1080 where affected, overflow, empty and populated states, and sibling behavior. If the browser/tool blocks validation, record the exact unverified surface; do not claim it passed.
- Run focused tests while iterating; required full build/test/artifact checks once at final review/pre-merge, or sooner when the altered boundary requires them. Do not assert success from build-only evidence.

## Git, documentation, and review boundary

- Work on the correct approved branch/worktree; commit and push an **approved PR-bound** change and open/update a reviewable PR. Keep `main` protected: **only Jason authorizes merge, deployment cutover, or canonical frontend promotion**. Do not merge just because checks pass.
- Never push an unapproved exploratory local task solely because a branch exists. For an approved `OPEN PR` work order, branch push and PR creation are authorized; merge is not.
- Docs own durable truth; Issues own current work/feedback; PRs and Git own delivered evidence/history. Audit findings belong in a reviewable Markdown artifact/PR, not only in chat. Historical plans/audits are not active instructions.
- Reconcile affected `docs/README.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md`, or other owning documents **in the same PR** when implementation changes their truth. Do not update every doc for routine fixes. Milestones warrant a dated progress/HISTORY check.
- Before requesting review, give a short outcome, observed verification, outstanding risk/decision, exact preview location when needed, and the PR. Avoid handing Jason routine UI polish that Dex can verify independently.
- Default to one main agent. Delegate only bounded, non-overlapping tasks; at most two subagents without explicit approval, no nested agents.

For detailed lifecycle, realistic-data validation, safe fixture handling, browser commands, table contracts, QA and deployment requirements, follow `docs/WORKFLOW.md`.
