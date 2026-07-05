import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { endpoint, keys } = req.body
  if (!endpoint || !keys?.p256dh || !keys?.auth) return res.status(400).json({ error: 'invalid' })

  // SUPABASE_URL이 잘못 설정돼 있어도 프론트용 VITE_SUPABASE_URL로 폴백 (둘 다 서버에서 읽을 수 있음)
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) {
    return res.status(500).json({ error: '서버에 SUPABASE_URL / SUPABASE_SERVICE_KEY 환경변수가 없어요' })
  }

  const supabase = createClient(url, serviceKey)

  const { error } = await supabase.from('hanyang_push_subscriptions').upsert(
    { endpoint, p256dh: keys.p256dh, auth: keys.auth },
    { onConflict: 'endpoint' }
  )
  if (error) return res.status(500).json({ error: error.message })

  res.json({ ok: true })
}
