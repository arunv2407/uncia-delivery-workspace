# Current state — Version 1

Date: 30 October 2026. Repository: https://github.com/arunv2407/uncia-delivery-workspace (private).

## Initial GitHub baseline

This repository starts with a fresh history based on the deployed Sites source plus the approved Jira cleanup. It does not copy the old Sites Git history, which contains the previously supplied report. Customer Jira issue rows, the bundled report, automatic re-import code and the expired fixed-owner import endpoint are removed. Tests use synthetic Jira fixtures.

The hosted app at https://delivery-predictability.arun2407.chatgpt.site/ still runs Site version 8 until separately approved for deployment. The GitHub code check-in does not change live data.

## Capabilities

| Area | Current implementation |
| --- | --- |
| Sprints | No fixed sprint-count limit; independent name, goal and dates; original six seed sprints retained |
| Lifecycle | Planned edits; start-readiness validation; Active planning locked; End/Cancel; frozen historical planning |
| Capacity | Seven roles, QA allocations, workdays/holidays and leave, one editable buffer (default 10%) |
| QA leave | Resource dropdown, Planned/Unplanned, from/to, full/half day per working date; automatic sprint split; duplicate dates blocked; edit/delete unlocked entries |
| Active unplanned leave | Explicit exception permitting additional unplanned leave while retaining original baseline |
| Client catalog | Create clients; map to fixed PRIME/LEAP/FLOW products; multiple resource client assignments |
| Assignments location | QA team register, far-right Product/Client columns; catalog in Plan settings |
| Timeline | One sprint or three consecutive sprints; all-sprint status table; no Beta label |
| Actuals & Jira (Beta) | Per-resource manual effort; file import/mapping; scope and completion analytics; no live Jira API synchronization |
| Persistence | Owner-authenticated D1 plan and version history, optimistic revision checks, JSON import/export |
| UI | Visible editable fields, sprint goal inputs, scrollable navigation, Version 1 label |

## Jira removal behavior awaiting deployment

On the first authenticated plan or history load after an approved deployment, the one-time owner-scoped cleanup removes issues, import metadata, inbox reports and completed-import markers from that owner's current plan and saved history. It preserves sprint planning, leave, clients and manually entered actuals. The current revision increases to reject stale saves; current/history changes are transactional. A saved marker prevents subsequent user imports from being erased.

This source change does not erase existing Sites Git history, earlier deployments/backups, previously exported ZIP files, or the original attachment in ChatGPT. Those remain separate artifacts. No production cleanup is claimed before deployment and an authenticated load.

## Calculation and attribution rules

QA calendar leave replaces legacy aggregate estimates rather than adding both. Weekends/holidays are excluded; even two half-day bookings on the same resource/date are rejected. Assignee is not worklog author. Manual actual totals override verified imported worklog effort. Reported hours are not individual productivity rankings.

## Remaining work

- Engineering structure supplied 02 Nov 2026 is included in this release: 30 positions / 28 filled / 2 vacancies. Six leaders have names, 21 other filled positions remain explicitly unnamed. The Head is excluded by default but can be included explicitly. Named/position leave and actual hours are integrated; The user authorized branch/PR, merge and deployment on 02 Nov 2026; release completion is verified through GitHub and Sites deployment receipts.
- QA seed contains 12 named active people plus one details-pending position to reconcile the stated 13; vacancies and the head are excluded from capacity.
- Local Excel/PPT downloads now include the PEG Engineering structure and revised capacity figures. They remain dated planning snapshots, with six original sprint records, not live database exports or automatic lifecycle enforcement.
- Product/client assignment controls need better discoverability.
- The capacity summary alignment is repaired in this local change and now shows baseline/revised availability and additional unplanned leave consistently.
- Branch protection and CI enforcement are not configured by this initial check-in. User approval requirements are recorded in AGENTS.md and GIT_WORKFLOW.md.

## Validation

Model regression tests, dedicated transactional cleanup tests, TypeScript checking and the production build passed for this baseline. Cleanup tests verify owner isolation, manual/planning preservation, historical scrubbing, stale-revision rejection, rollback and preservation of future imports. A fresh external-machine install and independent hosting migration have not been tested.

## Data portability

Source contains seed data and snapshots, not a production database backup. To migrate current planning, save changes in the live app and click Export plan. Import the JSON through Plan settings on a target installation with working auth/D1. Plan JSON does not migrate saved-version history. Keep backups separate from Git.


## Leave department selector — 03 November 2026

Leave calendar and Roles & leave use Department / Function (QA or Engineering) before Resource. Names are filtered to the selected team and no longer have department prefixes. Switching departments clears the selected person. Editing a booking restores the correct department and person. Existing leave records, duplicate checks, dates, day fractions, lifecycle locks and capacity calculations are unchanged. The user explicitly approved feature branch, commit, merge and private deployment for this update.


## Dedicated sprint QA and product selection

Planned sprints migrate once to Parthiban Rajendiran and Rajkumar Kathiresan at 87.5% allocation each (7 h of an 8 h working day). Both start with 0 planned leave. Other QA resources remain in the register at 0 default sprint allocation. The existing 10% buffer applies after leave, so each has 6.3 indicative hours per working day before leave. Started/closed historical sprint allocations remain frozen. Future newly created sprints receive the same defaults; later explicit allocation adjustments are retained by the migration marker. QA Engineer replaces Engineer / Tester wording without changing anybody to QA Manager. Product checkboxes support any combination of PRIME, LEAP and FLOW, and client choices use their combined mappings. No new product creation. Included in the approved team and capacity update.


## Team controls, sprint work share and buffer — 04 November 2026

Reporting managers are editable in both registers; renaming a manager updates reporting references. Engineering designations use the six user-specified choices. Every data table supports header sorting, per-column filters, search, and column movement, with browser-local saved views and Reset view. View controls remain usable for locked sprints; editing stays locked. Resource work share is sprint-specific: percentage and hours/day edit the same allocation, applied once before leave and buffer. Buffer is editable from 0–100% in Plan settings (default 10%), locked while a sprint is active, and snapshotted at start so historical capacity remains unchanged. Old started baselines use their original 10%. Excel/PPT downloads are dated snapshots and do not expose these new interactive controls or live edits. The user authorized check-in and application publication for this update.


Reporting manager correction: use a native select (unfiltered list on open), offering Engineering Head Denslyn J, all Tech Leads and named QA leadership, excluding the resource themselves. Preserve existing manager values. Table columns move by dragging the header directly; pointer dragging works across the app, the target is highlighted, order persists locally, and arrow keys on the grip provide keyboard access. Remove the separate column movement panel.
