# User-controlled Git workflow

Owner account: `arunv2407` (connection verified 30 October 2026).
Private repository created and verified on 30 October 2026: https://github.com/arunv2407/uncia-delivery-workspace

The user approved the initial clean source check-in to main on 30 October 2026. Later changes remain subject to the approval rules below.

## Approval rules

- `main` holds the approved baseline. Use lowercase `main` consistently.
- Create a named `feature/...` or `fix/...` branch from current `main` only when instructed.
- Implement and test changes locally. Present the changes, validation and remaining limitations for review.
- Commit and push the approved changes only after an explicit instruction. Never treat a request to edit the app as permission to check in code.
- Open a pull request when instructed; provide its exact branch, commit and checks.
- Merge only after explicit final approval of that PR. A request to commit/push is not permission to merge.
- Deploy only when instructed. No auto-merge, auto-deploy, direct main pushes after bootstrap, or force pushes.
- Creating the repository, its initial code commit, feature commits, merges and deployment are separate actions unless the user explicitly authorizes them together.

Suggested instructions:

1. “Create branch `fix/jira-cleanup` from main.”
2. “Make these changes and show me the result. Do not commit yet.”
3. “Approved. Commit and push this branch and open a PR.”
4. “Approved. Merge PR #N into main.”
5. “Deploy the approved main version.”

For the first import, approve a clean source snapshot as the initial main commit. Importing the old Sites Git history would also import the removed Jira report from historical commits. Use a fresh repository history, exclude environment/credential/build/local-database files and use synthetic Jira fixtures only.

The existing Sites source repository is distinct from the new GitHub repository. Sites publishing performs its own source commit/push, so it also requires explicit approval under these rules. A GitHub push does not by itself deploy the Site.

Repository protection can enforce PRs and required checks where supported by the account/plan. No protection rule is claimed to be configured by this document.

## Approved baseline and pending deployment

Local changes remove the bundled report, automatic report import and expired import endpoint. On the first authenticated plan/history load after an approved deployment, a one-time owner-scoped cleanup clears Jira issues, import metadata/inbox/completion markers from the current plan and all saved versions. It preserves sprint planning, named leave, client assignments and manual actual hours. The reset is transactional and revision-checked. Later user imports remain supported and are not automatically deleted.

Initial baseline check-in is approved. No PR/merge, production deployment or production data deletion is authorized by that check-in approval. The previously delivered ZIP and original CSV attachment remain older artifacts and must not be used for the clean initial import. This cleanup does not erase platform deployment backups, existing Sites Git history, or Library files; those require separate explicit operations.


## Engineering update prepared on 02 November 2026

Source: user-supplied PEG Org Chart (Final-List V4). Local changes add Engineering register/availability, planned/unplanned dated leave and actual hours, preserve started legacy sprint planning, and refresh Excel/PPT snapshots. Default Head exclusion is an editable assumption. Counts reconcile to 30 positions, 28 filled, 2 vacancies; 21 filled positions have names pending. The user explicitly authorized all three steps on 02 November 2026: create feature/engineering-roster, commit/push/open a PR, merge to main, and deploy. This authorization applies to this Engineering update only; future changes retain the approval gates above.
