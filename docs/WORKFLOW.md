# ManaSpec Development Workflow

This doc is intentionally small. ManaSpec is a sandbox app, so the docs should help momentum instead of creating process overhead.

## Core Model

ManaSpec development separates three things:

- Thinking: product direction, UX shape, architecture choices.
- Execution: code changes based on current specs.
- State: what is true now.

The docs in this folder represent current state. Dated notes are memory.

## Source Of Truth Order

When working on ManaSpec, use context in this order:

1. [README](README.md) for product shape, module lineup, data model, and implementation rules.
2. [Roadmap](ROADMAP.md) for current phase, next work, and deferred work.
3. [Decisions](DECISIONS.md) when rationale matters.
4. Historical `dev notes/` only if a current doc points there or the user asks for history.

## Work Loop

1. Pick one module or workflow.
2. Read the relevant section in [README](README.md) and the roadmap phase.
3. Make the smallest code change that satisfies the current goal.
4. Verify the app still works.
5. Update [README](README.md) or [ROADMAP.md](ROADMAP.md) if behavior or priorities changed.
6. Update `docs/DECISIONS.md` only when a meaningful choice was made.
7. Leave old dated notes alone unless deliberately archiving or migrating them.

## Git Checkpoints

ManaSpec now uses Git for recovery points and version history.

- Commit before risky refactors or data-model changes.
- Commit after each coherent workflow fix or doc update.
- Use branches for experiments that may need to be abandoned or compared.
- Use tags for meaningful app versions such as alpha, beta, or release milestones.
- Do not create new dated release-copy folders for normal checkpoints.
- Treat existing `releases/` folders as legacy snapshots until they are removed in a deliberate cleanup commit.
- Keep `archive/` only for reference material that is still useful outside Git history.

## AI Usage Rules

- Do not ask AI to read every note by default.
- Point AI to the relevant README section and roadmap phase whenever possible.
- Use this folder for current behavior and constraints.
- Use `docs/DECISIONS.md` for rationale and tradeoffs.
- Use old notes as reference, not authority.
- If old notes conflict with active docs, active docs win.

## Change Size

Prefer narrow, durable steps:

- One module at a time.
- One workflow at a time.
- Update docs in the same pass as behavior changes.
- Avoid large architecture rewrites unless the roadmap explicitly calls for one.

## Doc Size

Keep docs flat until the app earns more structure.

- Prefer updating `README.md` or `ROADMAP.md`.
- Do not create module folders for early ideas.
- Split a module into its own spec only when it has independent state, multiple files, non-obvious behavior, or enough detail that README becomes hard to scan.

## Completion Checklist

Before calling a task done:

- The app behavior matches the relevant README section.
- Any new rule or workflow is documented.
- The roadmap status still makes sense.
- No old note has silently become the new source of truth.
