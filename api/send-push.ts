import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  'mailto:lucy001214@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const MESSAGES = [
  '23시하세요(๑و•̀Δ•́)و',
  '일실기 제출하세요!!༼ง=ಠ益ಠ=༽ง',
  '일실기!!!!!제출!!!! ( •̀∀•́ )✧',
  '일실기!!!!!!!!!!!!!!!!( ´༎ຶㅂ༎ຶ`)',
  '일실기낸거맞지.......?',
]

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

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
