-- Migration v11: team_systems table
-- 팀별 시스템/도구 정보를 관리합니다

create table if not exists team_systems (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  title text not null,
  content text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_team_systems_team on team_systems(team_id);

alter table team_systems enable row level security;

create policy "Authenticated users can read team_systems"
  on team_systems for select to authenticated using (true);

create policy "Authenticated users can insert team_systems"
  on team_systems for insert to authenticated with check (true);

create policy "Authenticated users can update team_systems"
  on team_systems for update to authenticated using (true);

create policy "Authenticated users can delete team_systems"
  on team_systems for delete to authenticated using (true);
