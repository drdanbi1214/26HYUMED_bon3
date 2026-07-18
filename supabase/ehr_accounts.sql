-- EHR 공용계정 테이블 v2: 계정을 한 건씩 행으로 저장 (ID/비밀번호/인증서 + 수정 시각).
-- 이전 버전(서버별 텍스트 한 덩어리)을 이미 실행했더라도 이 파일을 다시 실행하면 새 구조로 교체됩니다.
-- Supabase 대시보드 → SQL Editor에서 실행.
drop table if exists ehr_accounts;

create table ehr_accounts (
  id uuid primary key default gen_random_uuid(),
  server text not null,                         -- 'seoul' | 'guri'
  login_id text not null default '',            -- EHR ID
  password text not null default '',            -- 비밀번호
  cert text not null default '',                -- 인증서 (비밀번호 등)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ehr_accounts enable row level security;
create policy "ehr_accounts_all" on ehr_accounts for all using (true) with check (true);
