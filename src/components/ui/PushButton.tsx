import { useEffect, useState } from 'react'

const VAPID_PUBLIC_KEY = 'BEbxrCOfk5cBRiyZvacUKQEE9MJpaHntjNGYyA33FuM4Ea815KAw31vRYuW-t7VZyJ2z0v2wqoy9RVEcAOSx-8o'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

/** 일실기 푸시 알림 구독/해제 버튼 (설정 페이지에서 사용) */
export function PushButton() {
  const [status, setStatus] = useState<'idle' | 'subscribed' | 'denied' | 'loading'>('idle')

  useEffect(() => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') setStatus('subscribed')
    else if (Notification.permission === 'denied') setStatus('denied')
  }, [])

  const subscribe = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('이 브라우저는 푸시 알림을 지원하지 않아요.\n\niPhone 사용자라면:\n- iOS 16.4 이상이어야 해요\n- Safari에서 이 사이트 열기 → 하단 공유 버튼 → "홈 화면에 추가" → 홈 화면 앱으로 열기')
      return
    }
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStatus('denied'); return }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      const r = await fetch('/api/register-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => null)
        throw new Error(d?.error || `서버 등록 실패 (${r.status})`)
      }
      setStatus('subscribed')
      // 설정이 실제로 동작하는지 바로 확인시켜주는 로컬 알림
      await reg.showNotification('일실기 알림 설정 완료 ✅', {
        body: '매일 밤 11시 30분에 알림이 올 거예요!',
        icon: '/icons/icon-192.png',
      }).catch(() => {})
    } catch (e) {
      alert(`알림 설정에 실패했어요:\n${e instanceof Error ? e.message : e}`)
      setStatus('idle')
    }
  }

  const unsubscribe = async () => {
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/unregister-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setStatus('idle')
    } catch {
      setStatus('subscribed')
    }
  }

  if (status === 'subscribed') return (
    <button
      onClick={unsubscribe}
      className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-bold active:scale-[0.98] transition-all"
    >
      🔕 일실기 알림 취소 (현재 켜짐)
    </button>
  )
  if (status === 'denied') return (
    <p className="text-center text-xs text-slate-400 py-2">알림이 차단됨 (브라우저 설정에서 허용해주세요)</p>
  )
  return (
    <button
      onClick={subscribe}
      disabled={status === 'loading'}
      className="w-full py-3 rounded-2xl bg-indigo-500 text-white text-sm font-bold active:scale-[0.98] transition-all disabled:opacity-60"
    >
      🔔 {status === 'loading' ? '설정 중...' : '일실기 알림 켜기 (매일 23:30)'}
    </button>
  )
}
