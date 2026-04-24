import React from "react";
import { Icon } from "@/components/ui/Icon";
// CHERRY BLOSSOM FEATURE — remove next line when done
import { useBlossomContext } from "@/context/BlossomContext";
// BASEBALL FEATURE
import { useBaseballContext } from "@/context/BaseballContext";

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
  // CHERRY BLOSSOM FEATURE — remove next line when done
  const { isBlossom, toggleBlossom } = useBlossomContext();
  // BASEBALL FEATURE
  const { isBaseball, toggleBaseball } = useBaseballContext();

  return (
    <header className="flex items-center justify-between mb-6 shrink-0 relative z-50">
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
          className={`text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br cursor-pointer select-none ${
            isBlossom
              ? "from-pink-400 to-rose-500"
              : "from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-400"
          }`}
        >
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {rightSlot}
        {/* BASEBALL FEATURE */}
        <button
          onClick={toggleBaseball}
          className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg shadow-sm active:scale-90 transition-all ${
            isBaseball
              ? "border-blue-400 bg-blue-100 dark:bg-blue-900/40 scale-105"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          }`}
          aria-label="야구 모드 토글"
          title="⚾ 야구 모드"
        >
          ⚾
        </button>
        {/* CHERRY BLOSSOM FEATURE — remove next button when done */}
        <button
          onClick={toggleBlossom}
          className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg shadow-sm active:scale-90 transition-all ${
            isBlossom
              ? "border-pink-300 bg-pink-100 scale-105"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          }`}
          aria-label="벚꽃 테마 토글"
          title="🌸 봄 테마"
        >
          🌸
        </button>
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
