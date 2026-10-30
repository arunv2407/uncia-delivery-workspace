# Technical stack and architecture

Versions below are declarations from the exported `package.json`; `pnpm-lock.yaml` is the dependency resolution authority. Date: 30 October 2026.

| Layer | Technology | Purpose |
| --- | --- | --- |
| Language | TypeScript 5.9.3; JavaScript ESM | Application and tooling |
| UI | React / React DOM 19.2.6 | Interactive workspace |
| Framework | Vinext 1.0.0-beta.5; Next-compatible imports, Next 16.3.4 dependency | App Router pages/routes and server rendering |
| Build | Vite 8.0.13; Cloudflare Vite plugin 1.37.1 | Worker/client bundles |
| Hosting | Cloudflare Workers via ChatGPT Sites | Managed deployment and request dispatch |
| Database | Cloudflare D1, binding `DB` | Per-owner plans and history |
| Schema tooling | Drizzle ORM 0.45.2; Drizzle Kit 0.31.10 | Schema and SQL migrations; API currently uses prepared D1 SQL |
| Styling | Authored `app/globals.css`; Tailwind CSS 4.2.1 in starter | Workspace and shared UI |
| UI library inventory | Radix/Base UI/shadcn components; Lucide; Recharts | Shared primitives/icons/chart dependencies; not every dependency is used by the workspace |
| Authentication | Sites Sign in with ChatGPT dispatch | Trusted identity headers and owner partitioning |
| Package/runtime | pnpm 11.25.0; Node >=22.13.0 | Locked installation and development |
| Local Worker tools | Wrangler 4.92.0 | Local persistence, D1 execution and Worker preview |
| Tests | Node assert + TypeScript transpilation | Business-rule regression script |

## Application flow

`app/page.tsx` renders the workspace. `app/workspace.tsx` manages selected views, plan editing, calculation and save/export actions. Domain logic in `lib/model.ts` handles migration, validation, lifecycle and capacity. `lib/insights.ts` handles CSV mapping, scope/completion analytics and effort attribution. `lib/assignments.ts` owns fixed products and client mapping helpers.

Authenticated GET `/api/plan` loads the owner's plan and performs compatible migration and the authorized one-time Jira data cleanup. PUT `/api/plan` validates the complete plan, enforces lifecycle and leave rules, and saves with optimistic revision matching. Conflicting writes return HTTP 409. `/api/history` lists the latest 50 versions or reads one owner-scoped snapshot.

## Persistence model

| Table | Columns | Use |
| --- | --- | --- |
| `plans` | `owner` primary key, `data` JSON text, `version`, `updated_at` | Current plan per authenticated owner |
| `plan_versions` | `id` primary key, `owner`, `data` JSON text, `version`, `saved_at` | Historical save snapshots |

Migration: `drizzle/0000_opposite_hellfire_club.sql`. Plan JSON contains sprint definitions, role allocations, QA roster, dated leaves, clients/product mappings, actuals, Jira issues, import inbox and completion markers. Started sprints include frozen `lockedContext` for historical calculations. There is no R2 binding in the current manifest.

## Source map

| Path | Responsibility |
| --- | --- |
| `app/sprint-manager.tsx` | Sprint editing, creation and lifecycle |
| `app/leave-calendar.tsx` | Individual dated leave and summaries |
| `app/qa-team.tsx`, `app/client-settings.tsx` | Roster, client catalog and assignments |
| `app/sprint-insights.tsx` | Import preview/mapping, actuals and analytics |
| `lib/model.ts`, `lib/insights.ts`, `lib/assignments.ts` | Core rules |
| `lib/jira-cleanup.ts` | Owner-scoped, one-time removal of prior Jira imports and history |
| `seed-plan.json`, `qa-roster.json` | Initial planning and QA data |
| `app/chatgpt-auth.ts` | Identity helper and sign-in/out paths |
| `app/api/plan`, `app/api/history` | Persistence APIs |
| `worker/index.ts`, `vite.config.ts`, `scripts/vite` | Worker/hosting integration |
| `.openai/hosting.json` | Existing Sites identity and bindings |
| `scripts/test-model.mjs`, `scripts/test-jira-cleanup.mjs` | Domain and transactional data cleanup checks |
| `public/downloads` | Excel/PPT snapshots, not live database exports |

## Hosting boundaries

The source is Git portable; production infrastructure is not automatically portable. Sites supplies sign-in dispatch, trusted identity headers, private access controls, D1 binding provisioning and deployment behavior. Plain `next start` is not the production runtime for this project.

For independent hosting, provision D1, configure real Worker bindings, apply migrations and replace or securely recreate authentication. Strip incoming identity headers at the trusted edge and inject identity only after verifying a session; never trust caller-supplied `oai-authenticated-user-*` headers. Browser-local mock authentication is for development only. Sites' owner-private audience does not transfer to another host automatically.

Worker execution uses HTTP-based integrations; this implementation does not directly call Jira APIs. Jira integration currently means user-imported files, not synchronized Jira accounts or scheduled ingestion.

## Maintenance notes

Keep lifecycle enforcement on the server as well as the UI. Preserve legacy migrations and revision checks; never replace live saved plans with seed data during deployments. Maintain snapshot parity where applicable. Review starter dependencies and retained components before reducing them. No license for public redistribution is granted by this handoff; review third-party notices (including `scripts/vite/sites-vite-plugin.LICENSE`) and organizational policy.
