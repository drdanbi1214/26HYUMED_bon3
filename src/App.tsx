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
import { MatePage } from "@/pages/MatePage";
import { ToastProvider } from "@/components/ui/Toast";
import { SupabaseBanner } from "@/components/layout/SupabaseBanner";
// CHERRY BLOSSOM FEATURE — remove next 3 imports when done
import { useTheme } from "@/hooks/useTheme";
import { BlossomProvider } from "@/context/BlossomContext";
import { CherryBlossom } from "@/components/ui/CherryBlossom";
// BASEBALL FEATURE
import { BaseballProvider } from "@/context/BaseballContext";

export const App: React.FC = () => {
  // CHERRY BLOSSOM FEATURE: replaced useDarkMode with useTheme
  // When removing: swap back to `const { isDark, toggle: toggleDark } = useDarkMode()`
  const { isDark, isBlossom, toggle: toggleDark, toggleBlossom } = useTheme();

  const commonProps = { isDark, onToggleDark: toggleDark };

  return (
    // CHERRY BLOSSOM FEATURE — remove BlossomProvider wrapper when done
    <BaseballProvider>
    <BlossomProvider value={{ isBlossom, toggleBlossom }}>
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
            {/* CHERRY BLOSSOM FEATURE — remove next line when done */}
            {isBlossom && <CherryBlossom />}
          </div>
        </BrowserRouter>
      </ToastProvider>
    </BlossomProvider>
    </BaseballProvider>
  );
};

export default App;
