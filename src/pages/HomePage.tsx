import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { curWeek, dDay } from "@/utils/date";
import { resolveSearchQuery } from "@/utils/buildSchedule";
import type { HistoryItem } from "@/types";
// CHERRY BLOSSOM FEATURE — remove next 2 lines when done
import { useBlossomContext } from "@/context/BlossomContext";
import { BlossomTree } from "@/components/ui/BlossomTree";
// BASEBALL FEATURE
import { useBaseballContext } from "@/context/BaseballContext";
import { BaseballScoreCard } from "@/components/ui/BaseballScoreCard";

interface HomePageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

/**
 * 홈: 검색 / 최근 기록 / D-Day / 기능 버튼 / 메이트 파인더.
 *
 * 검색 성공 시 `/schedule/C3` 같은 URL로 navigate한다.
 * (이름으로 검색했을 경우 state에 name을 실어 보내서 표시용 이름을 전달)
 */
export const HomePage: React.FC<HomePageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [err, setErr] = useState("");
  // CHERRY BLOSSOM FEATURE — remove next line when done
  const { isBlossom } = useBlossomContext();
  // BASEBALL FEATURE
  const { isBaseball } = useBaseballContext();

  const { history, push: pushHistory } = useSearchHistory();
  const cw = curWeek();
  const dd = dDay();

  /** 조+번호로 실제 이동. history push도 같이. */
  const goToSchedule = (g: string, n: number, name?: string) => {
    const item: HistoryItem = {
      id: `${g}${n}`,
      g,
      n,
      name: name || `${g}${n}`,
    };
    pushHistory(item);
    navigate(`/schedule/${g}${n}`, { state: { name } });
  };

  const doSearch = () => {
    setErr("");
    const r = resolveSearchQuery(input);
    if (r.ok) {
      goToSchedule(r.g, r.n, r.name);
      return;
    }
    if (r.candidates) {
      setErr(`검색 결과 여러 명: ${r.candidates.join(", ")}`);
      return;
    }
    setErr("결과가 없습니다.");
  };

  return (
    <>
      <Header title="📋 2026 본3 실습" isDark={isDark} onToggleDark={onToggleDark} />

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-0">
        {/* 검색 영역 */}
        <div className="space-y-3 mb-6 shrink-0">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()}
              placeholder="조번호(C3) 또는 이름"
              className="flex-1 px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm"
            />
            <button
              onClick={doSearch}
              className="px-5 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl shadow-md active:scale-95 transition-all"
            >
              🔍
            </button>
          </div>
          {history.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {history.map(h => (
                <button
                  key={h.id}
                  onClick={() => goToSchedule(h.g, h.n, h.name)}
                  className="shrink-0 text-[11px] px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 shadow-sm transition-all"
                >
                  🕒 {h.name} ({h.id})
                </button>
              ))}
            </div>
          )}
          {err && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl">
              {err}
            </div>
          )}
        </div>

        {/* D-Day 카드 or 야구 점수 */}
        {isBaseball ? (
          <BaseballScoreCard />
        ) : (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900/50 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30 rounded-3xl p-6 flex justify-between items-center shadow-sm">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Summer Break</div>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
                {cw === "summer" ? "방학중! 🏝️" : `D-${dd}`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Current Week</div>
              <div className="text-xl font-black text-slate-700 dark:text-slate-200">
                {cw === "summer" ? "Summer" : cw === null ? "실습 예정" : `${cw}주차`}
              </div>
            </div>
          </div>
        )}

        {/* 기능 버튼 그리드 */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/mate")}
            className="py-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 shadow-md flex items-center justify-center gap-3"
          >
            <span className="text-xl">👥</span>
            <span>구리 메이트</span>
          </button>
          <a
            href="https://hyu.u-folio.com/login"
            target="_blank"
            rel="noopener noreferrer"
            className="py-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 shadow-md flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <span className="text-xl">✏️</span>
            <span>유포폴</span>
          </a>
          <button
            onClick={() => navigate("/menu")}
            className="py-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 shadow-md flex items-center justify-center gap-3"
          >
            <span>병원식당메뉴</span>
            <span className="text-xl">🍱</span>
          </button>
          <button
            onClick={() => navigate("/who")}
            className="py-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 shadow-md flex items-center justify-center gap-3"
          >
            <span>먼저 돈 사람은?</span>
            <span className="text-xl">🔍</span>
          </button>
          <button
            onClick={() => navigate("/prof")}
            className="py-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 shadow-md flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <span>교수님 미리뵙기</span>
            <span className="text-xl">👨‍🏫</span>
          </button>
          <button
            onClick={() => navigate("/restaurants")}
            className="py-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 shadow-md flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <span>맛집인계</span>
            <span className="text-xl">🥄</span>
          </button>
          <a
            href="https://map.naver.com/p/directions/14153577.8081099,4523550.9131848/%EA%B5%AC%EB%A6%AC%EC%97%AD%20%EA%B2%BD%EC%9D%98%EC%A4%91%EC%95%99%EC%84%A0,13543572,PLACE_POI/14152317.0592169,4523254.7645331/%ED%95%9C%EC%96%91%EB%8C%80%ED%95%99%EA%B5%90%EA%B5%AC%EB%A6%AC%EB%B3%91%EC%9B%90,11686929,PLACE_POI/-/transit?c=14.00,0,0,0,dh"
            target="_blank"
            rel="noopener noreferrer"
            className="py-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all text-center px-2"
          >
            <span className="text-[13px] leading-tight">
              구리병원가는
              <br />
              버스조회
            </span>
            <span className="text-xl">🚌</span>
          </a>
          <button
            onClick={() => navigate("/board")}
            className="py-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 shadow-md flex items-center justify-center gap-3"
          >
            <span className="text-xl">💬</span>
            <span>익명 게시판</span>
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 pt-2 pb-2">
          copyright© 이단비, ver2. 맛집인계, 유포폴 링크 추가, 인계장 링크 추가되었습니다
        </p>

        {/* CHERRY BLOSSOM FEATURE — remove next block when done */}
        {isBlossom && <BlossomTree />}
      </div>
    </>
  );
};
