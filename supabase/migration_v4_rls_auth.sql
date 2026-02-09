-- =============================================
-- v4: RLS 정책 강화 — 인증된 사용자만 접근 가능
-- =============================================
-- 기존 "Allow all" 정책 삭제 후, authenticated role만 허용하는 정책으로 교체

-- users
drop policy if exists "Allow all for users" on users;
create policy "Authenticated access for users" on users
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- teams
drop policy if exists "Allow all for teams" on teams;
create policy "Authenticated access for teams" on teams
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- weekly_reports
drop policy if exists "Allow all for weekly_reports" on weekly_reports;
create policy "Authenticated access for weekly_reports" on weekly_reports
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- issues
drop policy if exists "Allow all for issues" on issues;
create policy "Authenticated access for issues" on issues
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- action_items
drop policy if exists "Allow all for action_items" on action_items;
create policy "Authenticated access for action_items" on action_items
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- decision_logs
drop policy if exists "Allow all for decision_logs" on decision_logs;
create policy "Authenticated access for decision_logs" on decision_logs
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- action_history
drop policy if exists "Allow all for action_history" on action_history;
create policy "Authenticated access for action_history" on action_history
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- team_memos
drop policy if exists "Allow all for team_memos" on team_memos;
create policy "Authenticated access for team_memos" on team_memos
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
