-- ============================================================
-- PULSE — seed 데이터 전체 삭제
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. users의 team_id FK를 먼저 해제
update users set team_id = null;

-- 2. FK 의존성 순서대로 삭제
delete from decision_logs;
delete from action_items;
delete from issues;
delete from weekly_reports;
delete from teams;
delete from users;
