import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { SettingsPage } from "@/pages/SettingsPage";
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

  // 테마별 배경 사진: 기본=낮 해변, 다크=밤 해변, 벚꽃/야구 모드는 전용 사진
  const bgImage = isBaseball
    ? "bg-[url('/bg-baseball.jpg')]"
    : isBlossom
      ? "bg-[url('/bg-blossom.jpg')]"
      : "bg-[url('/bg-beach.jpg')] dark:bg-[url('/bg-beach-night.jpg')]";

  return (
    <BlossomProvider value={{ isBlossom, toggleBlossom, isBaseball, toggleBaseball }}>
      <ToastProvider>
        <BrowserRouter>
          {/* ── PHOTO BACKGROUND ── 여름 끝나면 기본(해변)만 제거, 벚꽃/야구는 유지 ── */}
          <div aria-hidden className={`fixed inset-0 -z-10 bg-cover bg-center ${bgImage}`} />
          <div className="min-h-screen transition-colors duration-300">
            <Shell>
              <SupabaseBanner />
              <Routes>
                <Route path="/" element={<HomePage {...commonProps} />} />
                <Route path="/settings" element={<SettingsPage {...commonProps} />} />
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
        </BrowserRouter>
      </ToastProvider>
    </BlossomProvider>
  );
};

export default App;
