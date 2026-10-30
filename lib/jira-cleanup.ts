// One-time, owner-scoped data removal requested on 30 October 2026.
// Keep future user imports: this operation is skipped after its marker is stored.
export const JIRA_RESET = 'jira-reset-2026-10-30';

export function withoutJiraData<T extends Record<string, any>>(input: T): T {
  const plan = JSON.parse(JSON.stringify(input));
  plan.importInbox = [];
  plan.completedImports = [];
  for (const sprint of plan.sprints ?? []) {
    sprint.issues = [];
    sprint.importInfo = null;
  }
  plan.dataMaintenance = {...plan.dataMaintenance, [JIRA_RESET]: true};
  return plan;
}

// History is scrubbed in place, so restoring an older version cannot restore
// the deleted Jira data. Other plan fields and manually entered actuals remain.
export const CLEAN_HISTORY_SQL = `UPDATE plan_versions SET data = json_set(
  data,
  '$.sprints', json(COALESCE((
    SELECT json_group_array(json_set(value, '$.issues', json('[]'), '$.importInfo', NULL))
    FROM json_each(plan_versions.data, '$.sprints')
  ), '[]')),
  '$.importInbox', json('[]'),
  '$.completedImports', json('[]'),
  '$.dataMaintenance."jira-reset-2026-10-30"', json('true')
) WHERE owner = ? AND EXISTS (
  SELECT 1 FROM plans WHERE owner = ? AND version = ? AND updated_at = ?
)`;

export type SavedPlan = {data: string; version: number; updated_at: string};

export async function cleanSavedJiraData(db: D1Database, owner: string, row: SavedPlan) {
  const raw = JSON.parse(row.data);
  if (raw.dataMaintenance?.[JIRA_RESET] === true) return {row, changed: false};
  const json = JSON.stringify(withoutJiraData(raw));
  const now = new Date().toISOString();
  const revision = row.version + 1;
  // D1 batch is transactional. Both history statements are gated on the exact
  // updated current row, so a stale reader cannot partially scrub history.
  const results = await db.batch([
    db.prepare('UPDATE plans SET data=?,version=version+1,updated_at=? WHERE owner=? AND version=?')
      .bind(json, now, owner, row.version),
    db.prepare(CLEAN_HISTORY_SQL).bind(owner, owner, revision, now),
    db.prepare(`INSERT INTO plan_versions (id,owner,data,version,saved_at)
      SELECT ?,owner,data,version,updated_at FROM plans
      WHERE owner=? AND version=? AND updated_at=?`)
      .bind(crypto.randomUUID(), owner, revision, now),
  ]);
  if (!results[0].meta.changes) throw new Error('The plan changed during Jira cleanup. Reload to retry safely.');
  return {row: {data: json, version: revision, updated_at: now}, changed: true};
}
