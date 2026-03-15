-- v12: teams 테이블에 color 컬럼 추가
alter table teams add column if not exists color text default null;
