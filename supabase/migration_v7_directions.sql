-- ============================================================
-- PULSE v7 — 팀 방향성 테이블 추가
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

create table if not exists team_directions (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references teams(id) on delete cascade,
  title      text not null,
  content    text default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_team_directions_team on team_directions(team_id, sort_order);

alter table team_directions enable row level security;
create policy "Authenticated access for team_directions" on team_directions
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
