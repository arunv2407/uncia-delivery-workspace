# Setup, Git and deployment handoff

Repository: https://github.com/arunv2407/uncia-delivery-workspace (private).

The initial baseline contains source, configuration, pnpm lockfile, SQL migration, synthetic tests, QA/seed data, handoff guides and dated Excel/PPT snapshots. It excludes the customer Jira report, previous Sites Git history, credentials, runtime state, production database and build/dependency folders.

## Local development

Use Node >=22.13.0 and pnpm 11.25.0. From the extracted source directory:

```sh
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

If Corepack is unavailable, install the exact pinned pnpm version through your normal Node tooling. Clean clones default to the portable execution profile. Do not copy `.sites-runtime` from another machine. `pnpm dev` uses the portable development port 5173. This install command is preferable on a normal laptop to the retained managed-Linux `install:ci` script, which requires Linux-specific tools.

To build and initialize a separate local D1 database:

```sh
pnpm build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_opposite_hellfire_club.sql
pnpm start
```

Apply this initial migration once to an empty local database. Local D1 state remains under ignored `.wrangler/state`. The Vite development server and built Worker preview have different authentication contexts; if the built preview lacks a trusted identity provider, saved-plan requests can return 401. See `app/chatgpt-auth.ts` and the original starter guide for authentication. Do not weaken production authentication to make local preview work.

## Checks

```sh
node scripts/test-model.mjs
node scripts/test-jira-cleanup.mjs
node node_modules/typescript/bin/tsc --noEmit
pnpm build
```

All checks and the build passed in the development workspace; no fresh external-machine install was tested. See CURRENT_STATE.md for verification limits and known display defect.

## Git workflow

The initial clean baseline is approved for main. Follow GIT_WORKFLOW.md for every later change: create an instructed feature/fix branch from main, implement and test, show the result, commit/push only after approval, and merge/deploy only on explicit instructions. No automatic merge or deployment is configured.

```sh
git clone https://github.com/arunv2407/uncia-delivery-workspace.git
cd uncia-delivery-workspace
```

Use your normal authenticated GitHub credentials. Never commit tokens, .env files or live plan backups. The repository is private because roster/client and snapshot files remain organizational data.

## Existing Sites deployment

Keep `.openai/hosting.json` unchanged when continuing the existing Site. Use the Sites source workflow to open/sync the correct project, run checks/build, push the exact source commit, package it, and save/deploy a matching version. A normal push to your new repository alone will not update the existing hosted Site; this export does not configure automatic GitHub deployment.

For a separate Site, obtain a new project identity through Sites rather than reusing the current Site ID. For independent Cloudflare deployment, configure real database IDs and auth/access infrastructure first; current Vite config uses a local placeholder DB identifier and Sites supplies production bindings.

## Data migration and recovery

1. Sign into the existing app; save pending edits and use Export plan to download the latest `delivery-plan.json`.
2. Keep that backup private, separate from source control. The ZIP is not a production database backup.
3. Start the target installation with working authentication and D1 schema.
4. Import plan JSON in Plan settings and save. Validate roster, clients, sprint status/dates, capacity, leaves and Actuals & Jira import inbox.
5. If historical save versions must migrate, separately export both D1 tables and map the previous owner to the target verified identity. JSON import alone does not migrate history.

Before independent deployment, address the documented summary-table defect, provision real database bindings/authentication, and set an explicit private access policy. The expired import endpoint and bundled report have already been removed from this baseline. These are concrete migration tasks, not completed configuration.
