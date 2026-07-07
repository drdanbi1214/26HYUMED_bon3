import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  'mailto:lucy001214@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// 카오모지는 iOS 알림에서 깨져 보여서 한글 + 표준 이모지만 사용
const MESSAGES = [
  '마감 30분 전! 오늘 일실기 제출하셨나요? ⏰',
  '자기 전에 일실기 꼭 제출하기, 잊지 마세요 🌙',
  '오늘의 일실기, 지금 내면 딱이에요 ✍️',
  '일실기 쓰고 개운하게 잡시다 😴',
  '일실기 제출 확인! 아직이라면 서둘러요 📝',
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = createClient(
    (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // pg_cron(정시)과 Vercel 크론(백업, 최대 59분 지연)이 둘 다 호출해도 하룻밤에 한 번만 발송.
  // 자정을 넘겨 지연 실행돼도 같은 '밤'으로 묶이도록 KST에서 12시간을 빼서 날짜를 만든다.
  const night = new Date(Date.now() + (9 - 12) * 3600 * 1000).toISOString().slice(0, 10)
  if (req.query.force !== '1') {
    const { error: logErr } = await supabase.from('hanyang_push_log').insert({ day: night })
    if (logErr?.code === '23505') return res.json({ sent: 0, skipped: `already sent (${night})` })
    // 로그 테이블이 아직 없으면(42P01 등) 중복 방지 없이 그냥 발송
  }

  const { data: subs } = await supabase.from('hanyang_push_subscriptions').select('*')
  if (!subs?.length) return res.json({ sent: 0 })

  const body = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
  const payload = JSON.stringify({ title: '일실기 알림', body })

  const expiredIds: string[] = []
  await Promise.all(
    subs.map(sub =>
      webpush
        .sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
        .catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) expiredIds.push(sub.id)
        })
    )
  )

  if (expiredIds.length) {
    await supabase.from('hanyang_push_subscriptions').delete().in('id', expiredIds)
  }

  res.json({ sent: subs.length - expiredIds.length })
}
