import type {
  DbWeeklyReport,
  DbIssue,
  DbActionItem,
  TeamStatus,
} from '@/types/database';

// ── Team Reports ────────────────────────────────────────

export function getTeamReports(
  allReports: DbWeeklyReport[],
  teamId: string
): DbWeeklyReport[] {
  if (!allReports || !Array.isArray(allReports)) return [];
  return allReports
    .filter((r) => r.team_id === teamId)
    .sort((a, b) => b.week_start_date.localeCompare(a.week_start_date));
}

export function getLatestReport(
  allReports: DbWeeklyReport[],
  teamId: string
): DbWeeklyReport | undefined {
  return getTeamReports(allReports, teamId)[0];
}

// ── Streak ──────────────────────────────────────────────

export function calculateStreak(
  allReports: DbWeeklyReport[],
  teamId: string
): number {
  const reports = getTeamReports(allReports, teamId);
  if (reports.length === 0) return 0;

  let streak = 0;
  const now = new Date();
  const currentMonday = getMonday(now);

  for (let i = 0; i < reports.length; i++) {
    const weekStart = new Date(reports[i].week_start_date);
    const expected = new Date(currentMonday);
    expected.setDate(expected.getDate() - 7 * i);

    const diff = Math.abs(weekStart.getTime() - expected.getTime());
    if (diff < 3 * 24 * 60 * 60 * 1000) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

// ── Company-level status ────────────────────────────────

export function getCompanyStatus(
  allReports: DbWeeklyReport[],
  teamIds: string[]
): TeamStatus {
  if (!allReports?.length || !teamIds?.length) return 'green';
  const latests = teamIds.map((id) => getLatestReport(allReports, id));
  const hasRed = latests.some((r) => r?.status === 'red');
  if (hasRed) return 'red';
  const yellowCount = latests.filter((r) => r?.status === 'yellow').length;
  if (yellowCount >= 2) return 'yellow';
  return 'green';
}

// ── Stale teams ─────────────────────────────────────────

export function getStaleDays(
  allReports: DbWeeklyReport[],
  teamId: string
): number {
  const latest = getLatestReport(allReports, teamId);
  if (!latest) return 999;
  const diff = Date.now() - new Date(latest.created_at).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function isStale(allReports: DbWeeklyReport[], teamId: string): boolean {
  return getStaleDays(allReports, teamId) > 7;
}

// ── Status change ───────────────────────────────────────

export function getStatusChange(
  allReports: DbWeeklyReport[],
  teamId: string
): 'improved' | 'worsened' | 'same' | 'unknown' {
  const reports = getTeamReports(allReports, teamId);
  if (reports.length < 2) return 'unknown';
  const order: Record<TeamStatus, number> = { green: 0, yellow: 1, red: 2 };
  const curr = order[reports[0].status];
  const prev = order[reports[1].status];
  if (curr < prev) return 'improved';
  if (curr > prev) return 'worsened';
  return 'same';
}

// ── Pending decisions count ─────────────────────────────

export function getPendingDecisionCount(
  allReports: DbWeeklyReport[],
  teamIds: string[]
): number {
  if (!allReports?.length) return 0;
  return teamIds.reduce((count, id) => {
    const latest = getLatestReport(allReports, id);
    return count + (latest?.exec_decision_needed ? 1 : 0);
  }, 0);
}

// ── Team issues / actions ───────────────────────────────

export function getTeamIssues(
  allIssues: DbIssue[],
  teamId: string
): DbIssue[] {
  if (!allIssues || !Array.isArray(allIssues)) return [];
  return allIssues.filter((i) => i.team_id === teamId);
}

export function getTeamActions(
  allActions: DbActionItem[],
  teamId: string
): DbActionItem[] {
  if (!allActions || !Array.isArray(allActions)) return [];
  return allActions.filter((a) => a.team_id === teamId);
}

// ── User name helper ────────────────────────────────────

export function getUserNameById(
  allUsers: { id: string; name: string }[],
  userId: string
): string {
  if (!allUsers) return '알 수 없음';
  return allUsers.find((u) => u.id === userId)?.name ?? '알 수 없음';
}

// ── Format helpers ──────────────────────────────────────

export function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}
