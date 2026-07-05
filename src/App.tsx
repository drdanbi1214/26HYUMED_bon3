import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { SchedulePage } from "@/pages/SchedulePage";
import { BoardPage } from "@/pages/BoardPage";
import { MenuPage } from "@/pages/MenuPage";
import { WhoPage } from "@/pages/WhoPage";
import { ProfPage } from "@/pages/ProfPage";
import { RestaurantsPage } from "@/pages/RestaurantsPage";
import { RestaurantDetailPage } from "@/pages/RestaurantDetailPage";
import { MatePage } from "@/pages/MatePage";
import { OrSchedulePage } from "@/pages/OrSchedulePage";
import { OrRoomPage } from "@/pages/OrRoomPage";
import { ToastProvider } from "@/components/ui/Toast";
import { SupabaseBanner } from "@/components/layout/SupabaseBanner";
import { useTheme } from "@/hooks/useTheme";
import { BlossomProvider } from "@/context/BlossomContext";
import { CherryBlossom } from "@/components/ui/CherryBlossom";

const VAPID_PUBLIC_KEY = 'BEbxrCOfk5cBRiyZvacUKQEE9MJpaHntjNGYyA33FuM4Ea815KAw31vRYuW-t7VZyJ2z0v2wqoy9RVEcAOSx-8o'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

function PushButton() {
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
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
      <button
        onClick={unsubscribe}
        style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: '#f1f5f9', color: '#64748b', fontWeight: 600, border: 'none', cursor: 'pointer' }}
      >
        🔕 일실기 알림 취소
      </button>
    </div>
  )
  if (status === 'denied') return (
    <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>알림이 차단됨 (브라우저 설정에서 허용)</p>
  )
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
      <button
        onClick={subscribe}
        disabled={status === 'loading'}
        style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: '#6366f1', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: status === 'loading' ? 0.6 : 1 }}
      >
        🔔 {status === 'loading' ? '설정 중...' : '일실기 알림'}
      </button>
    </div>
  )
}

/** 수술 시간표 쪽은 넓은 화면(웹)에서 여러 날짜가 한눈에 보이도록 컨테이너를 넓힌다 */
const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const wide = pathname.startsWith("/or-schedule");
  return (
    <div className={`${wide ? "max-w-screen-2xl" : "max-w-2xl"} w-full mx-auto px-5 pt-8 pb-8`}>
      {children}
    </div>
  );
};

export const App: React.FC = () => {
  const { isDark, isBlossom, isBaseball, toggle: toggleDark, toggleBlossom, toggleBaseball } = useTheme();
  const commonProps = { isDark, onToggleDark: toggleDark };

  return (
    <BlossomProvider value={{ isBlossom, toggleBlossom, isBaseball, toggleBaseball }}>
      <ToastProvider>
        <BrowserRouter>
          {/* ── SUMMER BEACH BACKGROUND ── 방학 끝나면 이 div와 public/bg-beach*.jpg 제거 ── */}
          <div
            aria-hidden
            className="fixed inset-0 -z-10 bg-[url('/bg-beach.jpg')] dark:bg-[url('/bg-beach-night.jpg')] bg-cover bg-center"
          />
          <div className="min-h-screen transition-colors duration-300">
            <Shell>
              <SupabaseBanner />
              <Routes>
                <Route path="/" element={<HomePage {...commonProps} />} />
                <Route path="/schedule/:id" element={<SchedulePage {...commonProps} />} />
                <Route path="/board" element={<BoardPage {...commonProps} />} />
                <Route path="/menu" element={<MenuPage {...commonProps} />} />
                <Route path="/who" element={<WhoPage {...commonProps} />} />
                <Route path="/prof" element={<ProfPage {...commonProps} />} />
                <Route path="/restaurants" element={<RestaurantsPage {...commonProps} />} />
                <Route path="/restaurants/:id" element={<RestaurantDetailPage {...commonProps} />} />
                <Route path="/mate" element={<MatePage {...commonProps} />} />
                <Route path="/or-schedule" element={<OrSchedulePage {...commonProps} />} />
                <Route path="/or-schedule/room/:id" element={<OrRoomPage {...commonProps} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Shell>
            {isBlossom && <CherryBlossom />}
          </div>
          <PushButton />
        </BrowserRouter>
      </ToastProvider>
    </BlossomProvider>
  );
};

export default App;
