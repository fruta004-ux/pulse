-- ============================================================
-- PULSE v5 — 조직도 캔버스: 팀 위치 좌표 + 부모 팀 관계
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. teams에 부모 팀 관계 추가 (조직도 계층 구조)
alter table teams add column if not exists parent_team_id uuid references teams(id) on delete set null;

-- 2. teams에 캔버스 좌표 추가
alter table teams add column if not exists pos_x float default 0;
alter table teams add column if not exists pos_y float default 0;
