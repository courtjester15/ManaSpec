---
name: manaspec-code-health
description: Triage ManaSpec React lint findings and review React source or dependency boundaries.
---

Use [React architecture](../../../docs/REACT_SPIKE_ARCHITECTURE.md) to check shared selectors, hooks, and storage ownership before moving code. Follow [Engineering checks](../../../docs/WORKFLOW.md#engineering-checks) for the source policy and ESLint commands. Confirm warnings against the relevant callers and generated or legacy inputs. Keep mechanical cleanup scoped to the issue.
