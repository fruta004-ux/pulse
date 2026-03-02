-- ============================================================
-- PULSE v6 — 이슈에 결정사항 필드 추가
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

alter table issues add column if not exists decision text;
alter table issues add column if not exists decision_at timestamptz;
