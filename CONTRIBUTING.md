# Contributing to ManaSpec

Thanks for your interest in ManaSpec.

ManaSpec is a local-first MTG finance/speculation workflow terminal. It helps users organize speculative ideas, watched cards, owned positions, targets, notes, market checks, transactions, and review history.

ManaSpec is not a marketplace, collection tracker, prediction engine, or automated trading advisor. You cannot buy or sell cards directly from the app. The app organizes the workflow; the user makes the decisions.

## Project Priorities

ManaSpec values:

1. Workflow clarity
2. User data safety
3. Exact printing identity
4. Small, understandable changes
5. Laptop-first dense UI
6. Polish after workflow

In short: workflow over prettiness.

## Before Contributing

Please read:

- `README.md`
- `docs/README.md`
- `docs/PRODUCT_PRINCIPLES.md`
- `docs/ROADMAP.md`
- `docs/WORKFLOW.md`
- `docs/STYLE_GUIDE.md`

For architecture or storage changes, also read:

- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/DECISIONS.md`

## Good First Contributions

Useful contributions include:

- Bug reports with clear reproduction steps.
- Small UI wording improvements.
- Dense table layout fixes.
- Help text improvements.
- Documentation corrections.
- Small workflow polish based on real use.

Please avoid large rewrites without discussion first.

## Contribution Rules

- Keep pull requests small and focused.
- Open an issue before large feature work.
- Do not add new libraries unless they clearly remove repeated complexity.
- Do not change localStorage keys casually.
- Do not rename data fields without a migration plan.
- Do not add backend, accounts, cloud sync, or database work unless it is already on the roadmap.
- Do not turn ManaSpec into a general collection tracker.
- Do not add buy/sell recommendations or investment advice.
- Update docs when behavior, workflow, architecture, or data ownership changes.

## Local Development

ManaSpec is currently a vanilla static app.

Use a local HTTP server from the project root:

```bash
python -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/index.html
```

The app stores data in browser `localStorage`. Use Admin -> Data Safety -> Export Backup before testing changes that touch storage, imports, trading flows, or workflow state.

## Pull Request Checklist

Before opening a pull request:

- Run the app from a local HTTP server.
- Smoke test the affected workflow.
- Check the browser console for errors.
- Export a backup before storage-sensitive testing.
- Update relevant docs and `CHANGELOG.md` for user-visible or workflow-relevant changes.

Thanks for helping keep ManaSpec focused, practical, and safe for user data.
