-- EHR 공용계정 안내 테이블. 서울/구리 서버별로 사용 가능한 공용계정 목록을 텍스트로 저장.
-- 누구나 읽고 수정할 수 있는 구조 (hospital_shuttle과 같은 open policy).
-- Supabase 대시보드 → SQL Editor에서 1회 실행.
create table if not exists ehr_accounts (
  server text primary key,                      -- 'seoul' | 'guri'
  content text not null default '',             -- 공용계정 목록 (자유 텍스트)
  updated_at timestamptz not null default now()
);

alter table ehr_accounts enable row level security;
create policy "ehr_accounts_all" on ehr_accounts for all using (true) with check (true);

-- 서울/구리 두 행을 미리 만들어 둠 (이미 있으면 건드리지 않음)
insert into ehr_accounts (server, content) values ('seoul', ''), ('guri', '')
on conflict (server) do nothing;
