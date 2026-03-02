-- ============================================================
-- PULSE v8 — 이슈 이미지 지원
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. issues 테이블에 이미지 URL 배열 컬럼 추가
alter table issues add column if not exists images text[] default '{}';

-- 2. Storage 버킷 생성
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'issue-images',
  'issue-images',
  true,
  5242880,  -- 5MB
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;

-- 3. Storage RLS: 인증된 사용자만 업로드/삭제, 누구나 조회 가능
create policy "Public read for issue-images"
  on storage.objects for select
  using (bucket_id = 'issue-images');

create policy "Authenticated upload for issue-images"
  on storage.objects for insert
  with check (bucket_id = 'issue-images' and auth.role() = 'authenticated');

create policy "Authenticated delete for issue-images"
  on storage.objects for delete
  using (bucket_id = 'issue-images' and auth.role() = 'authenticated');
