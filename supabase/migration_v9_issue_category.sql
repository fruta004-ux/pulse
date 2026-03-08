-- ============================================================
-- PULSE v9 — 이슈 카테고리 (현황 브리핑 / 의사결정 필요)
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

alter table issues add column if not exists category text default 'briefing';
