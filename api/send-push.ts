import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  'mailto:lucy001214@gmail.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// 사용자가 직접 고른 카오모지 문구 (2026-07-07). 일부 조합 문자는 iOS 알림에서 깨질 수 있음 — 깨지면 교체
const MESSAGES = [
  '(๑•̀∀•́ฅ ✧ 오늘 일일실습기록은 쓰셨나요?',
  '˚‧º·(˚ ˃̣̣̥᷄⌓˂̣̣̥᷅ )‧º·˚ 아직 일일실습기록 안 쓰셨죠... 저 서운해요',
  '༼ ༎ຶ ෴ ༎ຶ༽ 일일실습기록... 오늘도 안 쓰고 주무시게요?',
  '₍⑅ᐢ..ᐢ⑅₎𓂋⊹ﾟ✦ 일일실습기록 쓸 시간이에요, 얼른요!',
  '(*•̀ᴗ•́*)و ̑̑ 오늘의 일일실습기록, 지금 바로 고고!',
  '(*ˊᵕˋ*)੭ ੈ❤ 자기 전에 일일실습기록 하나만 쓰고 자요~',
  '\\(❁´∀`❁)ﾉ 일일실습기록 쓰셨나용? 안 쓰셨으면 지금!',
  '°₊·ˈ∗(( ॣ>̶᷇ᗢ<̶᷆ ॣ))∗ˈ‧ 헉 벌써 자정이에요! 일일실습기록 확인!',
  '\\\\\\٩(•́⌄•́๑)و//// 일일실습기록 잊지말고 쓰세용!',
  'ε=(ง ˃̶͈̀ᗨ˂̶͈́)۶ 일일실습기록 안 쓰면 저 쫓아갑니다',
  '⁽⁽⁕◟(.öˬö.)◞⁕⁾⁾ 어라...? 오늘 일일실습기록 안 쓰신 거 같은데',
  '♡( ૢ⁼̴̤̆ ꇴ ⁼̴̤̆ ૢ)~ෆ♡ 오늘 하루도 고생했어요, 일일실습기록만 마무리하고 쉬어요',
  '𐔌ᵔ ˶ᐢᗜᐢ˶ ͡ 𐦯ᡣ𐭩 일일실습기록, 쓰셨나요?',
  '٩(๑ `н´๑)۶ 어이 오늘의 일일실습기록, 잊지않았겠지?',
  '(•̀⌓•́)シ 자정입니다... 일일실습기록은요?',
  'ᕕ༼✿•̀︿•́༽ᕗ 일일실습기록 쓰러 가자고요!!',
  '＼＼\\٩(๑`^´๑)۶//／／ 일일실습기록! 지금! 당장!',
  '(๑•̀∀•́ฅ ✧ 하루 마무리는 일일실습기록으로!',
  '(*ˊᵕˋ*)੭ ੈ❤ 오늘의 기록 하나 안 남기면 서운하잖아요~ 일일실습기록 잊지마요',
  '˚‧º·(˚ ˃̣̣̥᷄⌓˂̣̣̥᷅ )‧º·˚ 일일실습기록... 저만 기다리고 있는 거 아니죠?',
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
