-- 구리병원 셔틀 안내 이미지 테이블. hospital_menu(식단)와 같은 패턴.
-- Supabase 대시보드 → SQL Editor에서 1회 실행.
create table if not exists hospital_shuttle (
  id bigint generated always as identity primary key,
  content text,                                 -- 셔틀 안내 이미지의 public URL
  created_at timestamptz not null default now()
);

alter table hospital_shuttle enable row level security;
create policy "hospital_shuttle_all" on hospital_shuttle for all using (true) with check (true);

-- ⚠️ 이 SQL로는 만들 수 없는 부분: Storage 버킷
-- Supabase 대시보드 → Storage → New bucket 에서 이름 "shuttle-images", Public bucket 체크로 1회 생성해야 함.
-- (hospital_menu 용으로 만들었던 "menu-images" 버킷과 같은 방식)
