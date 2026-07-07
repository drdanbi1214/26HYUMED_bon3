import React from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useBlossomContext } from "@/context/BlossomContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { PushButton } from "@/components/ui/PushButton";
import type { HistoryItem } from "@/types";

interface SettingsPageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

/** 설정 섹션 카드 */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl shadow-slate-900/25">
    <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3">{title}</h2>
    {children}
  </div>
);

/**
 * 설정 페이지 (/settings)
 * - 테마: 야구/벚꽃/다크모드 토글 (원래 헤더 우측에 있던 버튼들)
 * - 계정: MY 버튼에 저장된 내 정보 확인/해제
 * - 알림: 일실기 푸시 켜기/끄기
 */
export const SettingsPage: React.FC<SettingsPageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  const { isBlossom, toggleBlossom, isBaseball, toggleBaseball } = useBlossomContext();
  const [myInfo, setMyInfo] = useLocalStorage<HistoryItem | null>("my_schedule", null);

  const themeBtn = (active: boolean, activeCls: string) =>
    `flex-1 py-3 rounded-2xl border flex flex-col items-center gap-1 text-2xl active:scale-95 transition-all ${
      active
        ? activeCls
        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
    }`;

  return (
    <>
      <Header
        title="⚙️ 설정"
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate(-1)}
      />

      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
        <Section title="🎨 테마 설정">
          <div className="flex gap-2">
            <button
              onClick={toggleBaseball}
              className={themeBtn(isBaseball, "border-blue-400 bg-blue-100 dark:bg-blue-900/40")}
              aria-label="야구 모드 토글"
            >
              ⚾
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">야구 모드</span>
            </button>
            <button
              onClick={toggleBlossom}
              className={themeBtn(isBlossom, "border-pink-300 bg-pink-100 dark:bg-pink-900/30")}
              aria-label="벚꽃 테마 토글"
            >
              🌸
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">벚꽃 테마</span>
            </button>
            <button
              onClick={onToggleDark}
              className={themeBtn(isDark, "border-indigo-400 bg-indigo-100 dark:bg-indigo-900/40")}
              aria-label="다크모드 토글"
            >
              {isDark ? "☀️" : "🌙"}
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {isDark ? "라이트 모드" : "다크 모드"}
              </span>
            </button>
          </div>
        </Section>

        <Section title="👤 계정 (MY 버튼)">
          {myInfo ? (
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {myInfo.name}
                <span className="ml-1.5 text-xs font-medium text-slate-400">({myInfo.id})</span>
              </div>
              <button
                onClick={() => setMyInfo(null)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500 border border-red-100 dark:border-red-900 active:scale-95 transition-all"
              >
                저장 해제
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed">
              아직 저장된 정보가 없어요. 홈 검색칸에 내 이름(또는 조번호)을 치고{" "}
              <span className="font-black text-indigo-500">MY</span>를 누르면 이 기기에 저장돼요.
            </p>
          )}
        </Section>

        <Section title="🔔 일실기 알림">
          <PushButton />
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            매일 밤 11시 30분에 일일실습기록 알림을 보내드려요
          </p>
        </Section>
      </div>
    </>
  );
};
