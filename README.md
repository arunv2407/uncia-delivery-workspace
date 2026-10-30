# Uncia Delivery Workspace — Version 1

Private delivery planning workspace with ongoing sprints, capacity planning, QA resource/client assignments, dated planned/unplanned leave, release timelines, actual hours and Jira file analytics.

## Documentation

- [CURRENT_STATE.md](CURRENT_STATE.md): capabilities, limitations and deployment/data status.
- [TECH_STACK.md](TECH_STACK.md): architecture, dependency versions, storage and source map.
- [SETUP_AND_GIT.md](SETUP_AND_GIT.md): development, validation, Git and deployment.
- [GIT_WORKFLOW.md](GIT_WORKFLOW.md): explicit approval rules for all Git and publication actions.
- [docs/ORIGINAL_STARTER_README.md](docs/ORIGINAL_STARTER_README.md): retained framework/authentication guidance.
- [AGENTS.md](AGENTS.md): implementation constraints for future coding sessions.

## Quick start

Node >=22.13.0 and pnpm 11.25.0 are required.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

```sh
node scripts/test-model.mjs
node scripts/test-jira-cleanup.mjs
node node_modules/typescript/bin/tsc --noEmit
pnpm build
```

Jira import capability remains available, but customer issue records and automatic report import are excluded from this baseline. Seed roster/client data and dated Excel/PPT snapshots remain organizational data; keep this repository private. Production plans/history, credentials and local runtime state are not source-controlled.

GitHub repository: https://github.com/arunv2407/uncia-delivery-workspace

The initial GitHub baseline is separate from the hosted Sites deployment. A push does not deploy the live application.
