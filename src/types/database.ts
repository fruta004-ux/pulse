// ── Supabase Database Types ──────────────────────────────

export type UserRole = 'admin' | 'executive' | 'lead' | 'member';
export type TeamStatus = 'green' | 'yellow' | 'red';
export type IssueImpact = 'high' | 'medium' | 'low';
export type IssueState = 'open' | 'in_progress' | 'resolved';
export type DecisionState = 'pending' | 'decided' | 'followup_done';

export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  team_id: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface DbTeam {
  id: string;
  name: string;
  owner_user_id: string | null;
  leader_name: string;
  description: string;
  member_count: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface DbWeeklyReport {
  id: string;
  team_id: string;
  week_start_date: string;
  status: TeamStatus;
  headline: string;
  anomalies: string[];
  next_action: string;
  exec_decision_needed: boolean;
  decision_reason: string | null;
  option_a: string | null;
  option_b: string | null;
  due_date: string | null;
  risk_tags: string[];
  links: string[];
  created_at: string;
  created_by: string | null;
}

export interface DbIssue {
  id: string;
  team_id: string;
  title: string;
  description: string | null;
  impact: IssueImpact;
  state: IssueState;
  owner_user_id: string | null;
  assignee_name: string;
  due_date: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface DbActionItem {
  id: string;
  team_id: string;
  report_id: string | null;
  title: string;
  owner_user_id: string | null;
  assignee_name: string;
  due_date: string | null;
  done_at: string | null;
  created_at: string;
}

export interface DbActionHistory {
  id: string;
  action_item_id: string;
  content: string;
  created_at: string;
}

export interface DbTeamMemo {
  id: string;
  team_id: string;
  content: string;
  pinned: boolean;
  created_at: string;
}

export interface DbDecisionLog {
  id: string;
  team_id: string;
  report_id: string | null;
  title: string;
  context: string | null;
  option_a: string | null;
  option_b: string | null;
  recommendation: string | null;
  decision: string | null;
  decided_by: string | null;
  decided_at: string | null;
  comment: string | null;
  followup_date: string | null;
  outcome_note: string | null;
  state: DecisionState;
  created_at: string;
}
