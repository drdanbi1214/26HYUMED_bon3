import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { useBlossomContext } from "@/context/BlossomContext";

interface HeaderProps {
  title: string;
  onTitleClick?: () => void;
  onBack?: () => void;
  /** 오른쪽에 추가 버튼 (병원 토글, "Rotation History" 뱃지 등) */
  rightSlot?: React.ReactNode;
  isDark: boolean;
  onToggleDark: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onTitleClick,
  onBack,
  rightSlot,
}) => {
  const { isBlossom, isBaseball } = useBlossomContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // 사진 배경(벚꽃/야구)에서는 흰 글씨 + 그림자, 기본 단색 배경에서는 어두운 글씨
  const hasPhotoBg = isBlossom || isBaseball;

  return (
    <header className="flex items-center justify-between mb-6 shrink-0 relative z-50">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-50 active:scale-90"
            aria-label="뒤로"
          >
            <Icon><path d="M15 18l-6-6 6-6" /></Icon>
          </button>
        )}
        <h1
          onClick={onTitleClick}
          className={`font-han text-4xl tracking-tight cursor-pointer select-none ${
            hasPhotoBg
              ? `[text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_3px_10px_rgba(0,0,0,0.6)] ${isBlossom ? "text-pink-100" : "text-white"}`
              : "text-slate-800 dark:text-slate-100"
          }`}
        >
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {rightSlot}
        {pathname !== "/settings" && (
          <button
            onClick={() => navigate("/settings")}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-lg shadow-lg shadow-slate-900/20 active:scale-90 transition-all"
            aria-label="설정"
            title="설정"
          >
            ⚙️
          </button>
        )}
      </div>
    </header>
  );
};
