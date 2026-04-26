import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { SchedulePage } from "@/pages/SchedulePage";
import { BoardPage } from "@/pages/BoardPage";
import { MenuPage } from "@/pages/MenuPage";
import { WhoPage } from "@/pages/WhoPage";
import { ProfPage } from "@/pages/ProfPage";
import { RestaurantsPage } from "@/pages/RestaurantsPage";
import { RestaurantDetailPage } from "@/pages/RestaurantDetailPage";
import { MatePage } from "@/pages/MatePage";
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
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStatus('denied'); return }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      await fetch('/api/register-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      setStatus('subscribed')
    } catch {
      setStatus('idle')
    }
  }

  if (status === 'subscribed') return (
    <p style={{ textAlign: 'center', fontSize: '12px', color: '#10b981', marginTop: '8px' }}>🔔 일실기 알림 구독 중</p>
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

export const App: React.FC = () => {
  const { isDark, isBlossom, isBaseball, toggle: toggleDark, toggleBlossom, toggleBaseball } = useTheme();
  const commonProps = { isDark, onToggleDark: toggleDark };

  return (
    <BlossomProvider value={{ isBlossom, toggleBlossom, isBaseball, toggleBaseball }}>
      <ToastProvider>
        <BrowserRouter>
          <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-[#0c1220]">
            <div className="max-w-2xl w-full mx-auto px-5 pt-8 pb-8">
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
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            {isBlossom && <CherryBlossom />}
          </div>
          <PushButton />
        </BrowserRouter>
      </ToastProvider>
    </BlossomProvider>
  );
};

export default App;
