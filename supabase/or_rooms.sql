-- 수술 시간표 "배정 방" 테이블. Supabase 대시보드 → SQL Editor에서 1회 실행.
create table if not exists or_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  view text,                                    -- '1' | '2' | 'all' (저장한 시간표 종류)
  cases jsonb,                                  -- 파싱된 수술 목록
  assignments jsonb not null default '{}'::jsonb, -- 학생 배정 { "caseIdx": "이름" }
  changes jsonb not null default '[]'::jsonb,   -- 최근 재업로드에서 감지된 변경 알림
  clinics jsonb not null default '[]'::jsonb,   -- 외래 배정 [{date, ampm, prof, student}]
  memos jsonb not null default '{}'::jsonb,     -- 수술별 메모 { "caseIdx": "메모" }
  uploaded_at timestamptz,                      -- 시간표 업로드 시각 ("기준" 표시용)
  created_at timestamptz not null default now()
);

alter table or_rooms enable row level security;
create policy "or_rooms_all" on or_rooms for all using (true) with check (true);

-- 예전 버전 테이블을 이미 만들었다면 이 두 줄만 실행하면 됨
alter table or_rooms add column if not exists clinics jsonb not null default '[]'::jsonb;
alter table or_rooms add column if not exists memos jsonb not null default '{}'::jsonb;
