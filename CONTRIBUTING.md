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

Read `AGENTS.md` and `docs/WORKFLOW.md`, then the relevant approved Issue. Use `docs/README.md` to find only the product, UI, architecture, data, or deployment doc directly relevant to your change. Historical notes and completed audit files are not standing instructions.

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

- Keep pull requests coherent and reviewable; larger end-to-end outcomes are fine when explicitly approved.
- Reuse or extend existing ManaSpec components and visual patterns before creating new UI.
- Use an implementation-approved Issue for meaningful work; an exploratory/tracker Issue does not automatically authorize code changes.
- Do not add new libraries unless they clearly remove repeated complexity.
- Do not change localStorage keys casually.
- Do not rename data fields without a migration plan.
- Do not add backend, accounts, cloud sync, or database work unless it is already on the roadmap.
- Do not turn ManaSpec into a general collection tracker.
- Do not add buy/sell recommendations or investment advice.
- Update only the owning docs when behavior, workflow, architecture, or data ownership changes.
- Commit and push on an approved review branch and open a PR; do not push unapproved exploratory work or merge into `main` without explicit owner authorization.

## Local Development

ManaSpec's current deployed root remains vanilla; React lives under `react-app/` as an unpromoted integration candidate. Follow `docs/DEPLOYMENT.md` for React build/preview/portable checks rather than using the vanilla QA URL.

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

Before opening a pull request (as applicable to the changed surface):

- Build and test the affected implementation; independently exercise the real changed workflow in a browser and check console, failure and recovery cases.
- For price, quantity, P/L, storage or transaction work, verify correct asset/finish identity, honest unknown versus zero valuation, affected cross-module totals, and backup compatibility with approved fixtures.
- For UI changes, compare shared sibling behavior, test the applicable table contract and supported widths.
- Report unavailable checks honestly; docs-only changes need link/factual review rather than browser or artifact builds.
- Update relevant docs and `CHANGELOG.md` for user-visible or workflow-relevant changes.
- For UI changes, note what was reused or extended and justify any completely new implementation.

Thanks for helping keep ManaSpec focused, practical, and safe for user data.
