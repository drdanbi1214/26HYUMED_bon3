import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { SchedulePage } from "@/pages/SchedulePage";
import { BoardPage } from "@/pages/BoardPage";
import { MenuPage } from "@/pages/MenuPage";
import { WhoPage } from "@/pages/WhoPage";
import { ProfPage } from "@/pages/ProfPage";
import { RestaurantsPage } from "@/pages/RestaurantsPage";
import { RestaurantDetailPage } from "@/pages/RestaurantDetailPage";
import { useDarkMode } from "@/hooks/useDarkMode";
import { ToastProvider } from "@/components/ui/Toast";
import { SupabaseBanner } from "@/components/layout/SupabaseBanner";

/**
 * 최상위 앱 컴포넌트.
 *
 * Stage 2: BrowserRouter 기반 URL 라우팅.
 *   /                  → HomePage
 *   /schedule/:id      → SchedulePage (예: /schedule/C3)
 *   /board             → BoardPage
 *   /menu              → MenuPage
 *   /who               → WhoPage
 *   /prof              → ProfPage
 *   (그 외)            → /
 *
 * 다크모드는 여전히 상위에서 한 번만 관리해서 하위 페이지들이 공유한다.
 */
export const App: React.FC = () => {
  const { isDark, toggle: toggleDark } = useDarkMode();

  // 페이지 공통으로 쓰는 props (쓸 페이지만 골라서 사용)
  const commonProps = { isDark, onToggleDark: toggleDark };

  return (
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
