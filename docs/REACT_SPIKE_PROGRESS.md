# React Spike Progress And Validation Log

This document records implementation milestones and evidence for the experimental React reconstruction. It does not redefine current vanilla behavior.

## 2026-07-16: Workspace And Build Foundation

Implemented:

- Dedicated `codex/react-modernization-spike` branch.
- Isolated `react-app/` React 19 + Vite 8 workspace.
- Hash-based workflow routes and a recognizable ManaSpec application shell.
- Copied ManaSpec design tokens and active CSS into the isolated workspace as the initial fidelity baseline.
- Removed the React runtime's dependency on the vanilla Pico CDN by adding local reset/control foundations.
- Normal relative-asset build and `/ManaSpec/react-spike/` Pages build mode.
- Classic-script, single-bundle portable build with committed `dist-portable/index.html`.
- Local package manifest/lockfile using normal package names rather than private `/lib` paths.
- Source-policy and basic format checks.

Validated:

- Normal Vite production build completes.
- `/ManaSpec/react-spike/` Pages-mode build completes with the configured project base path.
- Portable IIFE/classic-script build completes.
- Portable HTML contains a normal script rather than `type="module"`, uses relative local assets, and contains no runtime CDN reference.
- Source-policy and format checks pass.

Open validation:

- Direct `file://` browser launch remains pending manual/supported-browser validation. The Codex in-app browser policy blocks navigation to local file URLs, so build inspection alone is not recorded as proof.
- Browser visual QA was attempted through temporary local servers, but the browser environment could not reach the spawned server in this milestone. This is recorded as tooling friction, not an application pass or failure.
- Current feature routes contain temporary placeholders; no workflow parity is claimed yet.
