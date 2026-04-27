import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { endpoint } = req.body
  if (!endpoint) return res.status(400).json({ error: 'invalid' })

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  await supabase.from('hanyang_push_subscriptions').delete().eq('endpoint', endpoint)

  res.json({ ok: true })
}
