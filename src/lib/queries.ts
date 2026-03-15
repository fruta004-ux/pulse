import { supabase } from './supabase';
import type {
  DbUser,
  DbTeam,
  DbWeeklyReport,
  DbIssue,
  DbActionItem,
  DbActionHistory,
  DbTeamMemo,
  DbDecisionLog,
  DbTeamDirection,
  DbTeamSystem,
} from '@/types/database';

// ── Fetch helpers ─────────────────────────────────────────

export async function fetchUsers(): Promise<DbUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as DbUser[];
}

export async function fetchTeams(): Promise<DbTeam[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return (data ?? []) as DbTeam[];
}

export async function fetchWeeklyReports(): Promise<DbWeeklyReport[]> {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .order('week_start_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbWeeklyReport[];
}

export async function fetchIssues(): Promise<DbIssue[]> {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbIssue[];
}

export async function fetchActionItems(): Promise<DbActionItem[]> {
  const { data, error } = await supabase
    .from('action_items')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbActionItem[];
}

export async function fetchDecisionLogs(): Promise<DbDecisionLog[]> {
  const { data, error } = await supabase
    .from('decision_logs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbDecisionLog[];
}

export async function fetchActionHistory(actionItemId: string): Promise<DbActionHistory[]> {
  const { data, error } = await supabase
    .from('action_history')
    .select('*')
    .eq('action_item_id', actionItemId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbActionHistory[];
}

// ── Team CRUD ─────────────────────────────────────────────

export async function createTeam(team: {
  name: string;
  leader_name?: string;
  description?: string;
  member_count?: number;
}): Promise<DbTeam> {
  // 현재 최대 sort_order 구하기
  const { data: existing } = await supabase
    .from('teams')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  const nextOrder = ((existing as { sort_order: number }[] | null)?.[0]?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from('teams')
    .insert({
      name: team.name,
      leader_name: team.leader_name ?? '',
      description: team.description ?? '',
      member_count: team.member_count ?? 0,
      sort_order: nextOrder,
      is_active: true,
    } as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as DbTeam;
}

export async function updateTeam(
  id: string,
  updates: Partial<Pick<DbTeam, 'name' | 'leader_name' | 'description' | 'member_count' | 'is_active' | 'parent_team_id' | 'pos_x' | 'pos_y' | 'color'>>
): Promise<void> {
  const { error } = await supabase
    .from('teams')
    .update(updates as Record<string, unknown>)
    .eq('id', id);
  if (error) throw error;
}

export async function updateTeamPosition(
  id: string,
  pos_x: number,
  pos_y: number
): Promise<void> {
  const { error } = await supabase
    .from('teams')
    .update({ pos_x, pos_y } as Record<string, unknown>)
    .eq('id', id);
  if (error) throw error;
}

export async function updateTeamParent(
  id: string,
  parent_team_id: string | null
): Promise<void> {
  const { error } = await supabase
    .from('teams')
    .update({ parent_team_id } as Record<string, unknown>)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTeam(id: string): Promise<void> {
  // Soft delete
  const { error } = await supabase
    .from('teams')
    .update({ is_active: false } as Record<string, unknown>)
    .eq('id', id);
  if (error) throw error;
}

// ── Weekly Report ─────────────────────────────────────────

export async function insertReport(
  report: Omit<DbWeeklyReport, 'id' | 'created_at'>
): Promise<DbWeeklyReport> {
  const { data, error } = await supabase
    .from('weekly_reports')
    .insert(report as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as DbWeeklyReport;
}

// ── Action Items CRUD ─────────────────────────────────────

export async function createActionItem(item: {
  team_id: string;
  title: string;
  assignee_name?: string;
  due_date?: string | null;
}): Promise<DbActionItem> {
  const { data, error } = await supabase
    .from('action_items')
    .insert({
      team_id: item.team_id,
      title: item.title,
      assignee_name: item.assignee_name ?? '',
      due_date: item.due_date ?? null,
    } as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as DbActionItem;
}

export async function updateActionItem(
  id: string,
  updates: Partial<Pick<DbActionItem, 'title' | 'assignee_name' | 'due_date'>>
): Promise<void> {
  const { error } = await supabase
    .from('action_items')
    .update(updates as Record<string, unknown>)
    .eq('id', id);
  if (error) throw error;
}

export async function toggleActionDone(
  id: string,
  currentDoneAt: string | null
): Promise<void> {
  const { error } = await supabase
    .from('action_items')
    .update({
      done_at: currentDoneAt ? null : new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteActionItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('action_items')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── Action History ────────────────────────────────────────

export async function addActionHistory(actionItemId: string, content: string): Promise<DbActionHistory> {
  const { data, error } = await supabase
    .from('action_history')
    .insert({
      action_item_id: actionItemId,
      content,
    } as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as DbActionHistory;
}

export async function updateActionHistory(id: string, content: string): Promise<void> {
  const { error } = await supabase
    .from('action_history')
    .update({ content } as Record<string, unknown>)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteActionHistory(id: string): Promise<void> {
  const { error } = await supabase
    .from('action_history')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── Issues CRUD ───────────────────────────────────────────

export async function createIssue(issue: {
  team_id: string;
  title: string;
  description?: string;
  impact?: string;
  assignee_name?: string;
  due_date?: string | null;
  category?: string;
}): Promise<DbIssue> {
  const { data, error } = await supabase
    .from('issues')
    .insert({
      team_id: issue.team_id,
      title: issue.title,
      description: issue.description ?? null,
      impact: issue.impact ?? 'medium',
      assignee_name: issue.assignee_name ?? '',
      due_date: issue.due_date ?? null,
      category: issue.category ?? 'briefing',
    } as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as DbIssue;
}

export async function updateIssue(
  id: string,
  updates: Partial<Pick<DbIssue, 'title' | 'description' | 'impact' | 'state' | 'assignee_name' | 'due_date' | 'decision' | 'images' | 'category'>>
): Promise<void> {
  const payload: Record<string, unknown> = { ...updates };
  if (updates.state === 'resolved') {
    payload.resolved_at = new Date().toISOString();
  }
  if (updates.decision !== undefined) {
    payload.decision_at = updates.decision ? new Date().toISOString() : null;
  }
  const { error } = await supabase
    .from('issues')
    .update(payload)
    .eq('id', id);
  if (error) {
    console.error('[PULSE] Supabase update error:', error.message, error.details, error.hint);
    throw error;
  }
}

export async function uploadIssueImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png';
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `${fileName}`;

  const { error } = await supabase.storage
    .from('issue-images')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage
    .from('issue-images')
    .getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteIssue(id: string): Promise<void> {
  const { error } = await supabase
    .from('issues')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── Decision Logs ─────────────────────────────────────────

export async function insertDecisionLog(
  log: Omit<DbDecisionLog, 'id' | 'created_at'>
): Promise<DbDecisionLog> {
  const { data, error } = await supabase
    .from('decision_logs')
    .insert(log as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as DbDecisionLog;
}

export async function updateDecisionLog(
  id: string,
  updates: Partial<DbDecisionLog>
): Promise<void> {
  const { error } = await supabase
    .from('decision_logs')
    .update(updates as Record<string, unknown>)
    .eq('id', id);
  if (error) throw error;
}

// ── Team Memos ────────────────────────────────────────────

export async function fetchTeamMemos(teamId: string): Promise<DbTeamMemo[]> {
  const { data, error } = await supabase
    .from('team_memos')
    .select('*')
    .eq('team_id', teamId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbTeamMemo[];
}

export async function createTeamMemo(teamId: string, content: string): Promise<DbTeamMemo> {
  const { data, error } = await supabase
    .from('team_memos')
    .insert({ team_id: teamId, content } as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as DbTeamMemo;
}

export async function toggleMemoPinned(id: string, currentPinned: boolean): Promise<void> {
  const { error } = await supabase
    .from('team_memos')
    .update({ pinned: !currentPinned } as Record<string, unknown>)
    .eq('id', id);
  if (error) throw error;
}

export async function updateTeamMemo(id: string, content: string): Promise<void> {
  const { error } = await supabase
    .from('team_memos')
    .update({ content } as Record<string, unknown>)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTeamMemo(id: string): Promise<void> {
  const { error } = await supabase
    .from('team_memos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── Team Directions ──────────────────────────────────────

export async function fetchTeamDirections(teamId: string): Promise<DbTeamDirection[]> {
  const { data, error } = await supabase
    .from('team_directions')
    .select('*')
    .eq('team_id', teamId)
    .order('sort_order')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbTeamDirection[];
}

export async function createTeamDirection(teamId: string, title: string, content: string): Promise<DbTeamDirection> {
  const { data, error } = await supabase
    .from('team_directions')
    .insert({ team_id: teamId, title, content } as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as DbTeamDirection;
}

export async function updateTeamDirection(id: string, updates: Partial<Pick<DbTeamDirection, 'title' | 'content'>>): Promise<void> {
  const { error } = await supabase
    .from('team_directions')
    .update(updates as Record<string, unknown>)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTeamDirection(id: string): Promise<void> {
  const { error } = await supabase
    .from('team_directions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── Team Systems ────────────────────────────────────────

export async function fetchTeamSystems(teamId: string): Promise<DbTeamSystem[]> {
  const { data, error } = await supabase
    .from('team_systems')
    .select('*')
    .eq('team_id', teamId)
    .order('sort_order')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbTeamSystem[];
}

export async function createTeamSystem(teamId: string, title: string, content: string): Promise<DbTeamSystem> {
  const { data, error } = await supabase
    .from('team_systems')
    .insert({ team_id: teamId, title, content } as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as DbTeamSystem;
}

export async function updateTeamSystem(id: string, updates: Partial<Pick<DbTeamSystem, 'title' | 'content'>>): Promise<void> {
  const { error } = await supabase
    .from('team_systems')
    .update(updates as Record<string, unknown>)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTeamSystem(id: string): Promise<void> {
  const { error } = await supabase
    .from('team_systems')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
