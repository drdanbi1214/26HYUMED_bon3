import React from "react";
import { Icon } from "@/components/ui/Icon";

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
  isDark,
  onToggleDark,
}) => {
  return (
    <header className="flex items-center justify-between mb-6 shrink-0">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 shadow-sm transition-all hover:bg-slate-50 active:scale-90"
            aria-label="뒤로"
          >
            <Icon><path d="M15 18l-6-6 6-6" /></Icon>
          </button>
        )}
        <h1
          onClick={onTitleClick}
          className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 cursor-pointer select-none"
        >
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {rightSlot}
        <button
          onClick={onToggleDark}
          className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-lg shadow-sm active:scale-90 transition-all"
          aria-label="다크모드 토글"
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  );
};
