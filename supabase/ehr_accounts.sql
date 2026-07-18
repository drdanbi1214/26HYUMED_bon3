-- EHR 공용계정 테이블: 계정을 한 건씩 행으로 저장 (ID/비밀번호/인증서/주의사항 + 수정 시각).
-- 이 파일은 여러 번 실행해도 안전합니다 — 테이블이 없으면 만들고, 빠진 컬럼(주의사항)만 추가하며,
-- 이미 등록된 계정은 지우지 않습니다. Supabase 대시보드 → SQL Editor에서 실행.
--
-- ※ 맨 처음의 "서버별 텍스트 한 덩어리" 버전 테이블이 남아 있어서 앱에서 계속 에러가 나면,
--    아래 줄의 주석(-- )을 지우고 파일 전체를 다시 실행하세요 (테이블을 지우고 새로 만듭니다):
-- drop table if exists ehr_accounts;

create table if not exists ehr_accounts (
  id uuid primary key default gen_random_uuid(),
  server text not null,                         -- 'seoul' | 'guri'
  login_id text not null default '',            -- EHR ID
  password text not null default '',            -- 비밀번호
  cert text not null default '',                -- 인증서 (비밀번호 등)
  birth text not null default '',               -- 생년월일
  note text not null default '',                -- 주의사항
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 주의사항/생년월일 컬럼이 없던 이전 버전에서 넘어온 경우 컬럼만 추가
alter table ehr_accounts add column if not exists note text not null default '';
alter table ehr_accounts add column if not exists birth text not null default '';

alter table ehr_accounts enable row level security;
drop policy if exists "ehr_accounts_all" on ehr_accounts;
create policy "ehr_accounts_all" on ehr_accounts for all using (true) with check (true);
