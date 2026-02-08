-- ============================================================
-- PULSE — 경영한눈 : Supabase Migration
-- ============================================================

-- Enums
create type user_role as enum ('admin', 'executive', 'lead', 'member');
create type team_status as enum ('green', 'yellow', 'red');
create type issue_impact as enum ('high', 'medium', 'low');
create type issue_state as enum ('open', 'in_progress', 'resolved');
create type decision_state as enum ('pending', 'decided', 'followup_done');

-- ── Users ───────────────────────────────────────────────
create table users (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text unique not null,
  role       user_role not null default 'member',
  team_id    uuid,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ── Teams ───────────────────────────────────────────────
create table teams (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  owner_user_id  uuid not null references users(id),
  member_count   int not null default 0,
  sort_order     int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- Add FK for users.team_id after teams table exists
alter table users add constraint fk_users_team foreign key (team_id) references teams(id);

-- ── Weekly Reports ──────────────────────────────────────
create table weekly_reports (
  id                    uuid primary key default gen_random_uuid(),
  team_id               uuid not null references teams(id),
  week_start_date       date not null,
  status                team_status not null,
  headline              text not null,
  anomalies             text[] not null default '{}',
  next_action           text not null,
  exec_decision_needed  boolean not null default false,
  decision_reason       text,
  option_a              text,
  option_b              text,
  due_date              date,
  risk_tags             text[] not null default '{}',
  links                 text[] not null default '{}',
  created_at            timestamptz not null default now(),
  created_by            uuid not null references users(id),
  unique(team_id, week_start_date)
);

-- ── Issues ──────────────────────────────────────────────
create table issues (
  id             uuid primary key default gen_random_uuid(),
  team_id        uuid not null references teams(id),
  title          text not null,
  description    text,
  impact         issue_impact not null default 'medium',
  state          issue_state not null default 'open',
  owner_user_id  uuid not null references users(id),
  due_date       date,
  created_at     timestamptz not null default now(),
  resolved_at    timestamptz
);

-- ── Action Items ────────────────────────────────────────
create table action_items (
  id             uuid primary key default gen_random_uuid(),
  team_id        uuid not null references teams(id),
  report_id      uuid references weekly_reports(id),
  title          text not null,
  owner_user_id  uuid not null references users(id),
  due_date       date,
  done_at        timestamptz,
  created_at     timestamptz not null default now()
);

-- ── Decision Logs ───────────────────────────────────────
create table decision_logs (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid not null references teams(id),
  report_id       uuid references weekly_reports(id),
  title           text not null,
  context         text,
  option_a        text,
  option_b        text,
  recommendation  text,
  decision        text,
  decided_by      uuid references users(id),
  decided_at      timestamptz,
  comment         text,
  followup_date   date,
  outcome_note    text,
  state           decision_state not null default 'pending',
  created_at      timestamptz not null default now()
);

-- ── Indexes ─────────────────────────────────────────────
create index idx_weekly_reports_team_week on weekly_reports(team_id, week_start_date desc);
create index idx_issues_team on issues(team_id);
create index idx_action_items_team on action_items(team_id);
create index idx_decision_logs_team on decision_logs(team_id);
create index idx_decision_logs_state on decision_logs(state);

-- ── RLS ─────────────────────────────────────────────────
alter table users enable row level security;
alter table teams enable row level security;
alter table weekly_reports enable row level security;
alter table issues enable row level security;
alter table action_items enable row level security;
alter table decision_logs enable row level security;

create policy "Allow all for users"         on users         for all using (true) with check (true);
create policy "Allow all for teams"         on teams         for all using (true) with check (true);
create policy "Allow all for weekly_reports" on weekly_reports for all using (true) with check (true);
create policy "Allow all for issues"        on issues        for all using (true) with check (true);
create policy "Allow all for action_items"  on action_items  for all using (true) with check (true);
create policy "Allow all for decision_logs" on decision_logs for all using (true) with check (true);
