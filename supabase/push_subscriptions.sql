-- 일실기 푸시 구독 저장 테이블. Supabase SQL Editor에서 1회 실행.
-- (api/register-push, api/send-push가 service key로만 접근 — anon 접근은 RLS로 차단)
create table if not exists hanyang_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table hanyang_push_subscriptions enable row level security;
