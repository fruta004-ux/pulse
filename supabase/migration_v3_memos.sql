-- ============================================================
-- PULSE v3 — 팀별 메모 기능
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

create table if not exists team_memos (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references teams(id) on delete cascade,
  content    text not null,
  pinned     boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_team_memos_team on team_memos(team_id, created_at desc);

alter table team_memos enable row level security;
create policy "Allow all for team_memos" on team_memos for all using (true) with check (true);
