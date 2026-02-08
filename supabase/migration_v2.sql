-- ============================================================
-- PULSE v2 — 스키마 업데이트
-- Supabase SQL Editor에서 실행하세요 (migration.sql 이후)
-- ============================================================

-- 1. teams 테이블: owner_user_id를 선택사항으로 변경
alter table teams alter column owner_user_id drop not null;

-- 2. teams에 팀장 이름 컬럼 추가 (users 테이블 없이도 팀 생성 가능)
alter table teams add column if not exists leader_name text default '';

-- 3. teams에 description 추가
alter table teams add column if not exists description text default '';

-- 4. action_items에 히스토리 메모 테이블 추가
create table if not exists action_history (
  id             uuid primary key default gen_random_uuid(),
  action_item_id uuid not null references action_items(id) on delete cascade,
  content        text not null,
  created_at     timestamptz not null default now()
);

create index if not exists idx_action_history_item on action_history(action_item_id, created_at desc);

-- RLS for action_history
alter table action_history enable row level security;
create policy "Allow all for action_history" on action_history for all using (true) with check (true);

-- 5. action_items: owner_user_id를 선택사항으로 변경 (팀장 직접 입력 방식)
alter table action_items alter column owner_user_id drop not null;

-- 6. action_items에 assignee_name 추가 (users 없이도 담당자 지정)
alter table action_items add column if not exists assignee_name text default '';

-- 7. issues: owner_user_id를 선택사항으로 변경
alter table issues alter column owner_user_id drop not null;

-- 8. issues에 assignee_name 추가
alter table issues add column if not exists assignee_name text default '';

-- 9. weekly_reports: created_by를 선택사항으로 변경
alter table weekly_reports alter column created_by drop not null;
