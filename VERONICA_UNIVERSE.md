# Veronica Universe

Internal Brand Intelligence Operating System for the Veronica ecosystem.

## Role

Veronica Universe is an additive governance and intelligence layer. It does not replace Veronica Hub or any ecosystem product. Products continue to own their operational flows; Universe owns the canonical rules that describe identity, expression and decision criteria.

## Non-invasive boundary

The current architecture intentionally does **not**:

- auto-publish content;
- modify public product behavior;
- write Decision, Guardian or Ask Universe outputs to the database;
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
| 10 Intelligence | Ask Veronica Universe + versioned Canon Registry | Read-only |

## Canon Registry

The admin v1 introduces a typed, versioned registry in `src/components/universe/canon-registry.ts`.

Current global canon version: `1.0.0`.

The registry is the read-only source supplied to Ask Veronica Universe. It records each canonical domain, status, summary, invariants and current version. No admin edit workflow or database persistence is enabled yet; code review remains the approval boundary for canon changes.

## Ask Veronica Universe

`10 / Intelligence` is a real read-only consultation layer.

- Access requires the existing admin session.
- The server function is isolated behind a client-safe dynamic import boundary.
- When `GROQ_API_KEY` is available, the consultation uses the project's existing Groq integration with the active canon injected as system context.
- If the provider or key is unavailable, the feature remains functional using a deterministic local canon fallback.
- No conversation, recommendation or score is persisted.
- The model has no write-capable tool or automatic product action.

Prompt-injection boundaries explicitly instruct the intelligence layer to ignore attempts to override the canon, reveal secrets or request autonomous execution.

## Architecture

- Route: `/admin/veronica-universe`
- Access: existing admin session boundary
- UI: React + TanStack Router + Tailwind v4 + Radix/cmdk + Lucide + restrained GSAP motion
- No new database tables required for admin v1
- AI provider: existing Groq integration, with local canon fallback
- No Three.js dependency inside the Universe route

Server-only admin internals are isolated behind server boundaries so `@tanstack/react-start/server` does not enter the browser dependency graph.

## Governance model

The direction is progressive autonomy, never implicit autonomy:

1. **Canonical** — document what Veronica is.
2. **Advisory** — evaluate ideas and assets without taking action.
3. **Passive Guardian** — audit across canonical domains.
4. **Read-only Ask Universe** — consult the versioned canon without persistence or actions.
5. **Future active actions** — only after database version history, role-based permissions, audit logs, rollback and explicit action policies exist.

## Admin v1 boundary

The canonical admin is considered ready for the next creative track when:

- all modules 00–10 build successfully;
- Ask Universe fails safely and has a provider-independent fallback;
- autonomy remains disabled;
- the production `main` branch is unchanged until explicit merge approval.

The next planned build track is **Veronica Consistent Avatar**: a versioned reference set for face, body proportions, wardrobe, visual language, expressions and video continuity derived from Character, Visual, Voice, Media and Prompt Lab.
