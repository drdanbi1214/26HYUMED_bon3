-- 실습나무위키 테이블: 과별 문서 1행(wiki_docs) + 편집 역사(wiki_revisions, 저장할 때마다 판이 쌓임).
-- 이 파일은 여러 번 실행해도 안전합니다 — 테이블이 없으면 만들고, 이미 쓴 문서는 지우지 않습니다.
-- Supabase 대시보드 → SQL Editor에서 실행하세요.

create table if not exists wiki_docs (
  id uuid primary key default gen_random_uuid(),
  dept text not null unique,                    -- 과 이름 (예: '소화기내과')
  content text not null default '',             -- 나무마크 원문
  updated_at timestamptz not null default now()
);

create table if not exists wiki_revisions (
  id uuid primary key default gen_random_uuid(),
  dept text not null,
  content text not null default '',
  summary text not null default '',             -- 편집 요약
  created_at timestamptz not null default now()
);

create index if not exists wiki_revisions_dept_idx
  on wiki_revisions (dept, created_at desc);

alter table wiki_docs enable row level security;
drop policy if exists "wiki_docs_all" on wiki_docs;
create policy "wiki_docs_all" on wiki_docs for all using (true) with check (true);

alter table wiki_revisions enable row level security;
drop policy if exists "wiki_revisions_all" on wiki_revisions;
create policy "wiki_revisions_all" on wiki_revisions for all using (true) with check (true);
