-- 건의사항 테이블: 누구나 앱에서 작성, 목록은 관리자 확인(PIN) 화면에서만 보여줌.
-- 이 파일은 여러 번 실행해도 안전합니다. Supabase 대시보드 → SQL Editor에서 실행하세요.

create table if not exists suggestions (
  id uuid primary key default gen_random_uuid(),
  content text not null default '',
  created_at timestamptz not null default now()
);

alter table suggestions enable row level security;
drop policy if exists "suggestions_all" on suggestions;
create policy "suggestions_all" on suggestions for all using (true) with check (true);
