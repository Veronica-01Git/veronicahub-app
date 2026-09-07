# Veronica Universe

Internal Brand Intelligence Operating System for the Veronica ecosystem.

## Role

Veronica Universe is an additive governance and intelligence layer. It does not replace Veronica Hub or any ecosystem product. Products continue to own their operational flows; Universe owns the canonical rules that describe identity, expression and decision criteria.

## Non-invasive boundary

The current architecture intentionally does **not**:

- auto-publish content;
- modify public product behavior;
- write Decision or Guardian scores to the database;
- block launches, assets or campaigns;
- execute autonomous actions;
- expose admin-only session/database internals to the client bundle.

Any future active integration must be explicit, scoped and reviewed separately.

## Canonical modules

| Module | Purpose | Current mode |
| --- | --- | --- |
| 00 Overview | Universe Core, topology and system state | Active |
| 01 Essence | Purpose, promise, principles and decision filters | Active |
| 02 Ecosystem | Product nodes and relations to Veronica Core | Active |
| 03 Character | Character Bible, roles, invariants and boundaries | Active |
| 04 Visual System | Optical grammar, tokens, motion and imagery rules | Active |
| 05 Voice | Written/spoken cadence, tone and TTS direction | Active |
| 06 Media | Asset lifecycle, channel matrix and media rules | Active |
| 07 Prompt Lab | Canonical model-agnostic prompt directives | Active |
| 08 Decisions | Brand alignment scoring | Advisory, client-only |
| 09 Guardian | Cross-canon audit checklist | Passive, client-only |

## Architecture

- Route: `/admin/veronica-universe`
- Access: existing admin session boundary
- UI: React + TanStack Router + Tailwind v4 + Radix/cmdk + Lucide + restrained GSAP motion
- No new database tables required for the canonical core
- No new AI provider required for the canonical core
- No Three.js dependency inside the Universe route

Server-only admin internals are isolated behind server boundaries so `@tanstack/react-start/server` does not enter the browser dependency graph.

## Governance model

The direction is progressive autonomy, never implicit autonomy:

1. **Canonical** — document what Veronica is.
2. **Advisory** — evaluate ideas and assets without taking action.
3. **Passive Guardian** — audit across canonical domains.
4. **Future Ask Universe** — read the canon and answer questions.
5. **Future active actions** — only after persistence, versioning, permission scopes, audit logs and explicit action policies exist.

## Future intelligence prerequisites

Before enabling an AI-powered `Ask Veronica Universe` or any autonomous Guardian action, design and approve:

- canonical content persistence and version history;
- provenance for every canon change;
- role-based edit permissions;
- audit log for recommendations and actions;
- human approval thresholds;
- rollback strategy;
- provider/model isolation through adapters;
- explicit rules for read-only vs write-capable tools.

Until those prerequisites exist, Guardian remains passive and all final decisions remain human-controlled.
