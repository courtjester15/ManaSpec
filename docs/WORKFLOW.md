# ManaSpec Development Workflow

The canonical contributor process. `../AGENTS.md` is the concise agent entry point; the current approved GitHub Issue/work order is the executable scope. Keep process proportional.

## Roles and authority

- **Jason:** product/workflow owner, material scope and final acceptance, sole merge/deployment/React-promotion authority.
- **Pete:** architecture and Issue review, prioritization, PR review, workflow/documentation reconciliation.
- **Dex:** bounded investigation/implementation, independent QA and routine corrections, tests, documentation closure, branches/PRs within the approved work order.
- Dex resolves reversible engineering/UI decisions independently. Escalate ambiguous domain semantics, data loss, incompatible migrations, unapproved scope, deployment/canonical promotion.

## Source-of-truth order

1. `../AGENTS.md`, then this `WORKFLOW.md`.
2. The approved Issue/work order (its **status and scope** control permission to implement).
3. Only directly relevant canonical docs: `README.md` for product behavior, `PRODUCT_PRINCIPLES.md` for product judgment, `ARCHITECTURE.md` / `DATA_MODEL.md` for internals, `STYLE_GUIDE.md` for UI, `DECISIONS.md` for settled rationale, and `DEPLOYMENT.md` for release topology.
4. Relevant source/tests/fixtures. Old audits, completed plans, historical branches and `dev notes/` are opt-in evidence, never default instruction.

Docs own durable present truth; Issues own work and discovery; PRs/Git own delivered proof/history. Chat and archived notes are not the sole record of decisions.

## Issue classification and execution

Use `P0`–`P3` for **implementation-ready** and `E0`–`E3` for **exploration/evidence** where labels exist. `0` immediate, `1` near-term, `2` later, `3` deferred/dependent. Priority and readiness differ: an important `E1` is still not a build order. Agree new/material classifications with Jason rather than auto-labeling.

- A tracker or `E` Issue does not authorize implementation; a bounded investigation can be approved there. `P` or explicit bounded owner approval authorizes implementation. Tiny maintenance and documentation changes may proceed without an artificial extra Issue.
- Prefer coherent Issue scope—`Goal`, `In scope`, `Preserve`, `Out of scope`, `Validation` as needed. Large cross-module slices are fine when one meaningful outcome is reviewable; split when outcomes become unrelated or risky.
- Established decisions stay established unless real implementation evidence creates a material conflict. Investigate only necessary code and closest working sibling; do not automatically review the whole repo/Issue history.

## Review and completion loop

```text
Approved Issue / bounded request
-> Inspect affected code/docs and proven shared behavior
-> Reproduce baseline where applicable
-> Implement coherent slice; resolve clearly related defects
-> Focused tests; realistic browser/data/recovery self-review
-> Correct obvious issues before asking for Jason's UI time
-> Change-scoped documentation/status closure
-> Commit + push approved branch + open/update PR
-> Pete/Jason review -> Jason-authorized merge/promotion -> cleanup
```

- Vanilla root is the current production/beta and behavioral oracle. React is the advanced integration/PR #18 candidate, with implemented #15/#16 work, **not automatically promoted**. Verify the current Issue, PR and branch status before choosing implementation target.
- Local-first data, backup compatibility and exact identity are critical; missing or stale market prices are never verified $0 values. Do not accidentally make Transactions the authority during unrelated changes.
- Reuse existing libraries/shared table components and domain/price/storage helpers; do not build parallel implementations without a demonstrated domain reason.
- Use focused validation while iterating and applicable full build/test/artifact checks once at the final review/pre-merge gate (or earlier where the changed boundary requires them). Docs-only work gets factual/status/link checks, not browser or bundle rebuilds.

## Independent Dex QA contract

Before requesting owner review of changed UI, Dex must exercise, critique and fix the changed **real task** with safe synthetic or explicitly approved fixtures. Verify populated/empty/failure states, browser/console, keyboard/focus/action controls, relevant 1366×768 and 1920×1080 layouts, sibling/shared tables, and navigation/recovery. Passing builds does not prove browser acceptance. Follow the specialist Browser Testing and Table Contract sections below, without a new checklist or full-app tour after each fix.

For affected financial/data logic also test exact singles printing + finish and sealed IDs, quantities, cost basis, realized versus unrealized P/L, missing/null/stale/failed price refresh, actual zero versus unknown, and summary agreement across Positions/Dashboard/Signals. Never overwrite local real data while investigating a zero-valuation symptom. For state/destructive changes test reload and backup/export/import, schema compatibility and recovery against safe fixture copies; report unverified checks honestly.

## Documentation and review closure

- PR: concise changed behavior, root cause when relevant, actual validation/results, risks and remaining owner decisions. Material audit findings belong in a reviewable repository Markdown artifact/PR, not chat only.
- Update only materially changed owning docs in the same PR, and reconcile a finished slice named 'next/open' in the relevant roadmap/tracker. Do not mirror full Issue acceptance/history into README/Roadmap/Decisions.
- A milestone calls for a **change-scoped** contradiction check and a decision whether HISTORY needs an entry; routine fixes should not churn documentation.
- Review-ready does not authorize merge. Jason must explicitly authorize merges, public deployment cutovers, and canonical React promotion. Single main agent by default; at most two bounded non-overlapping subagents without explicit approval, never nested.

## Pasted Notes Workflow

When the user pastes full notes from GPT, chat history, beta testing, or another planning session, treat them as project memory that may need to be saved before the thread moves on.

Triage pasted notes this way:

- Current behavior or implementation rules: summarize into [README](README.md).
- Stable product philosophy or decision principles: summarize into [PRODUCT_PRINCIPLES](PRODUCT_PRINCIPLES.md).
- Active priorities, beta gates, or next-session tasks: summarize into [ROADMAP](ROADMAP.md).
- App internals, boot flow, rendering flow, module ownership, storage ownership, or architectural direction: summarize into [ARCHITECTURE](ARCHITECTURE.md).
- Entities, relationships, lifecycle, ledger migration, or ownership semantics: summarize into [DATA_MODEL](DATA_MODEL.md).
- UI terminology, visual language, dense table rules, formatting, or copy conventions: summarize into [STYLE_GUIDE](STYLE_GUIDE.md).
- Durable product, architecture, data, or workflow rationale: summarize into [DECISIONS](DECISIONS.md).
- Promising but uncommitted ideas: summarize into [PARKING_LOT](PARKING_LOT.md).
- Raw observations, exploratory thinking, or context that may improve later analysis: save or summarize in `dev notes/inbox/` with a date-first filename.

Do not paste long transcripts into active docs. Preserve the useful context, source, and reasoning in a concise form, then prune or promote it later.

If the pasted notes are important and are not already saved in the project folder, create or update an appropriate note file before finishing the work. This helps future Codex sessions provide better analysis from project memory instead of relying on chat history alone.

## MTD and brief handoffs

The Issue is ordinarily the implementation brief. Pete's MTD is a single copy-ready block: first line `Issue # — Actionable title`, then roughly 2–5 lines pointing to the Issue and stating only new clarifications; end `OPEN PR` for implementation intended to land. Do not paste the entire Issue into chat.

The optional `standards/APEX_ENGINEERING_EXECUTION_BRIEF_STANDARD.md` and `templates/IMPLEMENTATION_BRIEF_TEMPLATE.md` exist for Standard/High-Risk changes **when an Issue cannot safely carry the necessary details**. Link one supplemental brief from that Issue; do not require a second plan/template for every small fix or regular Issue.

Pasted brainstorm/audit notes may inform a later Issue or decision but are not execution authority.

## Git Checkpoints

ManaSpec now uses Git for recovery points and version history.

- Commit before risky refactors or data-model changes.
- Commit after each coherent workflow fix or doc update.
- An approved `OPEN PR` or equivalent owner-approved PR-bound work order authorizes pushing its branch and opening/updating its PR without repeated permission. Unapproved local exploration does not authorize push. Neither grants merge, production deployment, or frontend promotion.
- Use branches for experiments that may need to be abandoned or compared.
- Use tags for meaningful app versions such as alpha, beta, or release milestones.
- Do not create new dated release-copy folders for normal checkpoints.
- Treat existing `releases/` folders as legacy snapshots until they are removed in a deliberate cleanup commit.
- Keep `archive/` only for reference material that is still useful outside Git history.

## Beta Release Review

Before releasing updates to GitHub Pages beta users, review whether the change affects existing browser data.

- Treat localStorage keys and data shape as compatibility boundaries.
- Do not rename keys or important fields without a plan.
- Do not delete stored fields without considering existing users.
- Prefer a small migration over silently breaking older saved data.
- Confirm Admin JSON backup/export/import still works for changed data.
- Test with existing saved data when a change touches storage, imports, trading flows, notes, market observations, price snapshots, or startup state.

ManaSpec does not need a migration framework yet, but storage compatibility is now part of the release checklist.

## Changelog Maintenance

Maintain `CHANGELOG.md` as the human-readable history of meaningful work.

- Update `CHANGELOG.md` in the same pass when a change is user-visible, workflow-relevant, or adds a project/process guardrail.
- Use the current environment date for changelog sections when work happens in the active session.
- If reconstructing older history from Git, docs, or notes, label it as retrospective instead of pretending it was recorded live.
- Keep entries concise and human-readable; do not duplicate every commit.
- Leave tiny internal refactors, formatting-only changes, and throwaway experiments out unless they affect behavior or process.

## AI Usage Rules

- Do not ask AI to read every note by default.
- Point AI to the relevant README section and roadmap phase whenever possible.
- Point AI to [Product Principles](PRODUCT_PRINCIPLES.md) when a change needs product judgment before implementation detail.
- Point AI to [Architecture](ARCHITECTURE.md) for app structure, [Data Model](DATA_MODEL.md) for entity relationships, and [Style Guide](STYLE_GUIDE.md) for UI language or table/design consistency.
- Use this folder for current behavior and constraints.
- Use `docs/DECISIONS.md` for rationale and tradeoffs.
- Use `docs/PARKING_LOT.md` for useful ideas that are not ready for roadmap or decisions.
- Use `dev notes/inbox/` and `dev notes/archive/` as reference, not authority.
- When pasting full GPT or chat notes, ask AI to save the important parts if they are not already in the project folder.
- If old notes conflict with active docs, active docs win.

## Codex Friction Notes

Use `dev notes/inbox/codex-friction-log.md` for recurring tool, environment, browser harness, command, or workflow snags that make Codex take non-obvious detours.

Before substantial frontend or browser QA work, check `dev notes/inbox/codex-friction-log.md`. If present, also check the shared local machine note at `C:\Users\Jase\Documents\Codex\machine\CODEX_FRICTION.md` for current browser-harness or local-development workarounds. These notes are aids, not blockers.

Log friction when it is surprising, repeated, safety-relevant, or likely to save future time. Early on, include small-but-real detours such as surprising timeouts, sandbox/network blocks, browser harness limits, screenshot/crop issues, path quoting problems, or ambiguous QA state so patterns can emerge. Do not log every harmless typo, routine exploration miss, or expected test failure.

Promote a friction note into this Workflow doc only after it becomes a durable operating rule.

## Repeated Issue Check

When the same issue comes back after one or two fix attempts, pause before making more small adjustments. Treat the repeat as a signal to step back and inspect the underlying cause, especially for styling, layout, cascade, shared component, browser-state, or data-flow problems.

This is a rule of thumb, not dogma. The goal is to avoid polishing around a hidden root cause while keeping normal iteration lightweight.

## Library Integration Rule

Adopt libraries to remove application-owned mechanics, not to recreate the previous implementation inside a vendor API. The application should provide domain data, intentional configuration, small adapters, and product theming; the library should retain ownership of the capability it was selected to provide.

Before adding compatibility CSS, manual lifecycle calls, timing workarounds, or replacement mechanics:

1. Confirm the library's native configuration and defaults for the behavior.
2. Inspect the live library instance and generated output at the boundary where behavior diverges.
3. Verify wrappers do not pass undefined or empty optional values that suppress library defaults.
4. Classify the proposed customization as native configuration, product styling/theme, or a compatibility workaround.
5. Prefer native configuration first. Keep a workaround only when the native path cannot satisfy a documented ManaSpec requirement, and record why.

Temporary diagnostics should be narrowly scoped and removed after the cause is proven. If a library integration repeatedly needs custom code to reproduce mechanics the library already owns, pause and reassess the wrapper contract before adding another patch.

## Documentation Ownership Rules

Use the docs ownership map in [README](README.md) before adding or moving documentation.

- Put product behavior and current workflow truth in [README](README.md).
- Put stable product philosophy and decision mindset in [PRODUCT_PRINCIPLES](PRODUCT_PRINCIPLES.md).
- Put internal build structure, boot order, module ownership, rendering flow, storage ownership, and future architecture direction in [ARCHITECTURE](ARCHITECTURE.md).
- Put entities, relationships, lifecycle, ledger migration context, and data ownership semantics in [DATA_MODEL](DATA_MODEL.md).
- Put terminology, UI language, visual design philosophy, table conventions, formatting, wrapping, and copy rules in [STYLE_GUIDE](STYLE_GUIDE.md).
- Put active priority and sequencing in [ROADMAP](ROADMAP.md).
- Put process rules in [WORKFLOW](WORKFLOW.md).
- Put React spike scope and parity gates in [REACT_MIGRATION_NOTES](REACT_MIGRATION_NOTES.md).
- Put implemented React-only structure, boundaries, and remaining validation in [REACT_SPIKE_ARCHITECTURE](REACT_SPIKE_ARCHITECTURE.md), while keeping [ARCHITECTURE](ARCHITECTURE.md) explicit that vanilla remains the behavioral and production source of truth until promotion.
- Put dependency inventory, evaluation, and adoption records in [LIBRARIES](LIBRARIES.md).
- Put dual-deployment, portable-output, rollback, and spike-removal instructions in [DEPLOYMENT](DEPLOYMENT.md).
- Put durable rationale in [DECISIONS](DECISIONS.md).
- Put uncommitted ideas in [PARKING_LOT](PARKING_LOT.md).
- Put reconstructed origin, milestone, and project-evolution context in [HISTORY](../HISTORY.md).
- Put dated audits, audit plans, and diagnostic snapshots in `docs/audits/`.
- Put raw session memory in `dev notes/inbox/`.

Avoid duplicating the same truth across multiple active docs. If a topic belongs in a new ownership doc, link to that doc instead of restating it in full.

Audit docs are allowed to be more diagnostic and time-bound than active docs. They can propose work, but they do not define current behavior until their findings are promoted into README, Architecture, Data Model, Style Guide, Roadmap, Workflow, or Decisions.

## Browser Testing

When performing UI QA, browser inspection, console debugging, or regression testing against the current vanilla application:

- Use the Codex in-app Browser when available.
- Never open the app using `file://`.
- Always test against the local static server on `127.0.0.1`.
- Start the standard ManaSpec browser QA server from the project root:

```bash
python -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/index.html
```

Notes:
- Use this Python server by default. Do not substitute another local server unless the Python server genuinely fails.
- Confirm `http://127.0.0.1:8000/index.html` responds before troubleshooting the browser.
- Never use `file://`, inline `node -e` scripts, Node static servers, or hidden `Start-Process` server launches for the standard browser QA path.
- Prefer browser inspection and console validation over screenshot-only debugging when available.
- Browser `evaluate()` is not a reliable way to inspect localStorage or app state in the Codex browser harness. Prefer visible UI, DOM snapshots, screenshots when useful, and console checks.
- After a browser disconnect, obtain a fresh browser and fresh tab. Do not reuse stale tabs, locators, sessions, or browser handles.
- If the confirmed preview responds but the browser cannot attach or rejects localhost, treat it as browser-tooling friction rather than a ManaSpec application defect.
- Make one clean retry with the healthy server and a fresh browser session. If it still fails, stop and report the exact blocker.
- Do not repeatedly restart servers or modify application code to compensate for browser-tool failure.

### React Portable Build Exception

The standard vanilla QA path above still forbids `file://`. The approved React spike has a separate required deliverable: its committed portable `index.html` must be tested by direct file opening without a server.

Portable-file testing is an additional React release check, not a replacement for development-server, preview-server, or Pages-subpath testing. Record the browser used, asset/routing results, storage limitations, and any unavoidable fallback. Use [DEPLOYMENT](DEPLOYMENT.md) as the owning guide.

### React Milestone Build Routine

For a React implementation milestone:

1. Run `npm test`, the configured source check, and the configured formatting check in `react-app/`.
2. Generate the normal build, Pages build, and portable build.
3. Refresh the tracked `react-spike/` Pages artifact from the verified Pages output.
4. Verify development/local serving, Pages-subpath behavior, and direct opening of `react-app/dist-portable/index.html`.
5. Update the owning docs, progress/parity evidence, Changelog, and History when applicable.
6. Stage React source, required tracked artifacts, and docs only. Do not stage `node_modules/`, `/lib/`, `.tmp/`, caches, or incidental local QA data.

### Card Detail Browser QA

In the authoritative vanilla app, clicking the card name currently opens art preview, not Card Detail. In React, the verified dense-table contract uses the row body to open Card Detail while interactive controls stop row activation. Do not transfer either click contract to the other implementation accidentally.

For Card Detail QA, use one of these entry points:

- An explicit Detail action, if present.
- A known row/body click target that opens Card Detail.
- Another module entry point already wired to Detail.

Before claiming Card Detail was browser-tested, verify the open modal contains `#cardDetailBody` or `.card-detail-panel`, not `.card-art-preview`.

Do not change the card-name/art-preview behavior for beta unless the user explicitly asks.

## Local QA Fixtures

The `test-fixtures/` folder is for local ManaSpec backup JSON files used during browser QA.

- Treat `test-fixtures/` as local-only unless the user explicitly says a fixture is sanitized and safe to commit.
- Keep backup JSON files in `test-fixtures/` ignored by Git.
- Before staging broad changes, check that local QA backups are not being committed.
- Use the newest ManaSpec backup in `test-fixtures/` as the default rich-data QA fixture when regression testing needs Positions, Radar, Transactions, notes, or market observations.
- If browser QA mutates local test data, restore the newest fixture afterward when practical.

## Change Size

Prefer the smallest **coherent** reviewable outcome. Avoid unrelated refactors, unnecessary documentation churn, or splitting an end-to-end slice solely because it touches multiple modules.

Cross-module work may span multiple modules when that is necessary for one approved outcome. Pause at safe review checkpoints, not artificial micro-stops.

## Doc Size

Keep docs flat until the app earns more structure. ManaSpec has earned focused ownership docs for architecture, data model, style, and the approved React experiment; do not add more active docs casually.

- Prefer updating the existing ownership doc before creating another doc.
- Do not create module folders for early ideas.
- Split a module into its own spec only when it has independent state, multiple files, non-obvious behavior, or enough detail that README becomes hard to scan.

## Completion Checklist

Before reporting completion, verify what applies and explicitly identify any exceptions:

- Approved outcome and acceptance checks met. First-pass realistic self-review performed for changed workflows.
- Focused tests during iteration; actual final tests/builds/artifact and any privacy checks recorded. Do not pass off planned validation as completed.
- Relevant asset-identity, price/financial summary, persistence, reload, restore and failure-recovery cases checked for data-sensitive changes.
- Relevant browser, console, keyboard/table/viewport/sibling checks completed for changed UI—or specific untested surfaces called out.
- Existing shared implementation reused; no unrelated cleanup or new incompatible data model slipped in.
- Owning canonical docs/tracker reconciled only where project truth changed; meaningful milestones checked for HISTORY relevance.
- Approved branch committed/pushed and reviewable PR updated when requested. **No merge or deployment without Jason.**
- PR/handoff contains actual evidence, limits, outstanding decisions and exact preview instructions only when needed; no material finding exists only in chat.

## Table Contract Verification

ManaSpec uses shared table rendering and styling across Radar, Positions, Signals, Transactions, and History. Treat table changes as system changes, not isolated module changes.

A table change is not complete simply because a new field, column, button, indicator, or editable control appears. Table integrity is part of the acceptance criteria.

Use this verification whenever a change affects:

- Table columns, column order, or column width.
- Editable cells, buttons, row actions, or cell content density.
- Money formatting, dates, set codes, collector numbers, or compact labels.
- Headers, rows, shared table helpers, table CSS, pagination, or sorting.

Before implementation:

- Identify every table surface potentially affected.
- Identify any shared renderer, helper, or CSS involved.

After implementation, verify at approximately 1366px laptop width. If the browser harness cannot force 1366px, verify at the available width and note the limitation.

Required surfaces:

- Radar
- Positions
- Signals
- Transactions
- History

Confirm structure:

- Headers align with data columns.
- Column ordering remains correct.
- No duplicate or displaced headers appear.
- No horizontal overflow appears.

Confirm visual rhythm:

- Row height remains consistent.
- Text remains vertically centered.
- Money values remain readable.
- Dense scan surfaces remain compact.

Confirm interaction:

- Editable cells still enter edit mode correctly.
- Save behavior still works.
- Buttons remain aligned.
- Row actions remain usable.

Confirm text handling:

- Text does not unexpectedly wrap.
- Prices, dates, set codes, collector numbers, and actions do not wrap.

Confirm cross-module impact:

- Tables not directly modified did not regress because of shared rendering or CSS changes.

## Workflow Ownership Rules

Radar
- Discovery
- Watched ideas
- Entry planning
- Planned quantity

Positions
- Owned holdings
- Exit planning
- Position management

Signals
- Read-only attention layer
- Alerts and reminders
- Deep-links to Radar or Positions

Card Detail
- Unified editor for a specific printing
- Edits canonical plan data
