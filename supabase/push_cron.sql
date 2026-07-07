-- 일실기 푸시 정시 발송. Supabase SQL Editor에서 1회 실행.
--
-- Vercel 무료 플랜 크론은 최대 59분 늦게 실행돼서(23:39, 00:05 발송 사례)
-- 분 단위로 정확한 pg_cron이 매일 23:30 KST에 발송 API를 직접 호출한다.
-- Vercel 크론은 백업으로 남겨두고, 아래 발송 기록 테이블로 하룻밤 1회만 발송되게 막는다.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 하룻밤 1회 발송 기록 (api/send-push가 insert 충돌로 중복 발송을 감지)
create table if not exists hanyang_push_log (
  day date primary key,
  sent_at timestamptz not null default now()
);
alter table hanyang_push_log enable row level security;

-- 같은 이름의 기존 잡이 있으면 지우고 다시 등록 (재실행해도 안전)
select cron.unschedule('hanyang-push-2330')
where exists (select 1 from cron.job where jobname = 'hanyang-push-2330');

select cron.schedule(
  'hanyang-push-2330',
  '30 14 * * *', -- 14:30 UTC = 23:30 KST
  $$
  select net.http_get(
    url := 'https://26hyumed-bon3.vercel.app/api/send-push',
    timeout_milliseconds := 10000
  )
  $$
);
