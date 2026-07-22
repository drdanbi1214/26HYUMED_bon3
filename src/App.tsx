import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { SchedulePage } from "@/pages/SchedulePage";
import { BoardPage } from "@/pages/BoardPage";
import { MenuPage } from "@/pages/MenuPage";
import { ShuttlePage } from "@/pages/ShuttlePage";
import { WhoPage } from "@/pages/WhoPage";
import { ProfPage } from "@/pages/ProfPage";
import { RestaurantsPage } from "@/pages/RestaurantsPage";
import { RestaurantDetailPage } from "@/pages/RestaurantDetailPage";
import { MatePage } from "@/pages/MatePage";
import { OrSchedulePage } from "@/pages/OrSchedulePage";
import { OrRoomPage } from "@/pages/OrRoomPage";
import { EhrPage } from "@/pages/EhrPage";
import { WikiListPage } from "@/pages/WikiListPage";
import { WikiDocPage } from "@/pages/WikiDocPage";
import { ToastProvider } from "@/components/ui/Toast";
import { SupabaseBanner } from "@/components/layout/SupabaseBanner";
import { useTheme } from "@/hooks/useTheme";
import { BlossomProvider } from "@/context/BlossomContext";
import { CherryBlossom } from "@/components/ui/CherryBlossom";
import { PALETTES } from "@/data/palettes";

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
  const { isDark, isBlossom, isBaseball, palette, setPalette, toggle: toggleDark, toggleBlossom, toggleBaseball } = useTheme();
  const commonProps = { isDark, onToggleDark: toggleDark };

  // 테마별 배경 사진: 벚꽃/야구 모드만 전용 사진, 기본 모드는 사진 없이 단색 (body 배경색)
  const bgImage = isBaseball
    ? "bg-[url('/bg-baseball.jpg')]"
    : isBlossom
      ? "bg-[url('/bg-blossom.jpg')]"
      : null;

  return (
    <BlossomProvider value={{ isBlossom, toggleBlossom, isBaseball, toggleBaseball, palette, setPalette }}>
      <ToastProvider>
        <BrowserRouter>
          {bgImage && (
            <div aria-hidden className={`fixed inset-0 -z-10 bg-cover bg-center ${bgImage}`} />
          )}
          {/* 기본 모드는 팔레트 틴트 배경 (다크모드는 body 색 그대로) */}
          <div
            className={`min-h-screen transition-colors duration-300 ${
              !bgImage ? `${PALETTES[palette].page} dark:bg-transparent` : ""
            }`}
          >
            <Shell>
              <SupabaseBanner />
              <Routes>
                <Route path="/" element={<HomePage {...commonProps} />} />
                <Route path="/settings" element={<SettingsPage {...commonProps} />} />
                <Route path="/schedule/:id" element={<SchedulePage {...commonProps} />} />
                <Route path="/board" element={<BoardPage {...commonProps} />} />
                <Route path="/menu" element={<MenuPage {...commonProps} />} />
                <Route path="/shuttle" element={<ShuttlePage {...commonProps} />} />
                <Route path="/who" element={<WhoPage {...commonProps} />} />
                <Route path="/prof" element={<ProfPage {...commonProps} />} />
                <Route path="/restaurants" element={<RestaurantsPage {...commonProps} />} />
                <Route path="/restaurants/:id" element={<RestaurantDetailPage {...commonProps} />} />
                <Route path="/mate" element={<MatePage {...commonProps} />} />
                <Route path="/or-schedule" element={<OrSchedulePage {...commonProps} />} />
                <Route path="/or-schedule/room/:id" element={<OrRoomPage {...commonProps} />} />
                <Route path="/ehr" element={<EhrPage {...commonProps} />} />
                <Route path="/wiki" element={<WikiListPage {...commonProps} />} />
                <Route path="/wiki/*" element={<WikiDocPage {...commonProps} />} />
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
