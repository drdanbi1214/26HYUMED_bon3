-- 구리병원 셔틀 안내 이미지 테이블. hospital_menu(식단)와 같은 패턴.
-- Supabase 대시보드 → SQL Editor에서 1회 실행.
create table if not exists hospital_shuttle (
  id bigint generated always as identity primary key,
  content text,                                 -- 셔틀 안내 이미지의 public URL
  created_at timestamptz not null default now()
);

alter table hospital_shuttle enable row level security;
create policy "hospital_shuttle_all" on hospital_shuttle for all using (true) with check (true);

-- ⚠️ 이 위까지는 SQL Editor에서 실행되지만, Storage 버킷 자체는 대시보드에서 만들어야 함:
-- Supabase 대시보드 → Storage → New bucket 에서 이름 "shuttle-images", Public bucket 체크로 1회 생성.
-- (hospital_menu 용으로 만들었던 "menu-images" 버킷과 같은 방식)

-- 버킷을 만든 뒤, 아래 정책도 SQL Editor에서 실행해야 업로드(쓰기)가 허용됨.
-- "Public bucket" 체크는 다운로드(읽기)만 열어주고, 업로드는 별도 정책이 있어야 가능하기 때문.
create policy "shuttle_images_all"
on storage.objects for all
using (bucket_id = 'shuttle-images')
with check (bucket_id = 'shuttle-images');
