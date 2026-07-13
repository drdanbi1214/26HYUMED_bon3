import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { curWeek, dDay } from "@/utils/date";
import { resolveSearchQuery } from "@/utils/buildSchedule";
import type { HistoryItem } from "@/types";
import { useBlossomContext } from "@/context/BlossomContext";
import { PALETTES } from "@/data/palettes";
import { BlossomTree } from "@/components/ui/BlossomTree";
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
  const { isBlossom, isBaseball, palette } = useBlossomContext();

  const { history, push: pushHistory } = useSearchHistory();
  const cw = curWeek();
  const dd = dDay();

  // 기본 모드(테마 없음)에서는 설정에서 고른 팔레트 5색을 홈 버튼 9개에 순서대로 입힌다.
  // 야구/벚꽃 모드는 사진 배경이라 기존 흰색 카드 유지. 다크모드도 기존 유지.
  const plain = !isBaseball && !isBlossom;
  const pal = PALETTES[palette];
  const gridBtn = (i: number, extra = "gap-3") =>
    `py-3 rounded-3xl border font-bold flex items-center justify-center active:scale-95 transition-all ${extra} ${
      plain
        ? `${pal.btns[i % 5]} border-black/5 shadow-lg ${pal.shadow} dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800`
        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-xl shadow-slate-900/25"
    }`;

  // MY 버튼: 한 번 저장해두면 이 기기에서 바로 내 스케줄로 이동
  const [myInfo, setMyInfo] = useLocalStorage<HistoryItem | null>("my_schedule", null);

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

  /**
   * MY: 저장된 내 정보가 있으면 바로 내 스케줄로.
   * 없으면(또는 검색칸에 뭔가 쳐놨으면) 그걸 내 정보로 저장하고 이동.
   * → 이름을 바꿔 저장하고 싶으면 검색칸에 새 이름 치고 MY를 누르면 됨.
   */
  const goToMy = () => {
    setErr("");
    if (input.trim()) {
      const r = resolveSearchQuery(input);
      if (r.ok) {
        setMyInfo({ id: `${r.g}${r.n}`, g: r.g, n: r.n, name: r.name || `${r.g}${r.n}` });
        goToSchedule(r.g, r.n, r.name);
        return;
      }
      if (r.candidates) {
        setErr(`검색 결과 여러 명: ${r.candidates.join(", ")}`);
        return;
      }
      setErr("결과가 없습니다.");
      return;
    }
    if (myInfo) {
      goToSchedule(myInfo.g, myInfo.n, myInfo.name);
      return;
    }
    setErr("검색칸에 내 이름(또는 조번호)을 치고 MY를 누르면 저장돼요. 다음부터는 MY만 누르면 바로 이동!");
  };

  return (
    <>
      <Header title="🩺 2026 본3 실습" isDark={isDark} onToggleDark={onToggleDark} />

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-0">
        {/* 검색 영역 */}
        <div className="space-y-3 mb-6 shrink-0">
          <div className="flex gap-1.5">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()}
              placeholder="조번호(C3) 또는 이름"
              className="flex-1 min-w-0 px-3.5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-xl shadow-slate-900/25"
            />
            <button
              onClick={doSearch}
              className={`shrink-0 px-3.5 rounded-2xl text-white text-xl active:scale-95 transition-all ${
                plain
                  ? `${pal.searchBtn} shadow-lg ${pal.shadow}`
                  : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-slate-900/25"
              }`}
            >
              {isBaseball ? "⚾" : "🔍"}
            </button>
            <button
              onClick={goToMy}
              className={`shrink-0 px-3.5 rounded-2xl text-white text-sm font-black tracking-wide active:scale-95 transition-all ${
                plain
                  ? `${pal.myBtn} shadow-lg ${pal.shadow}`
                  : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-slate-900/25"
              }`}
              aria-label="내 스케줄 바로가기"
            >
              MY
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
          <div
            className={`bg-gradient-to-br dark:from-slate-900/50 dark:to-indigo-950/20 border dark:border-blue-900/30 rounded-3xl p-6 flex justify-between items-center ${
              plain
                ? `${pal.dday} shadow-lg ${pal.shadow}`
                : "from-blue-50 to-indigo-50 border-blue-100 shadow-xl shadow-slate-900/25"
            }`}
          >
            <div>
              <div className="text-xs font-bold text-slate-400 mb-1">여름방학!!!!!!!!ㅠㅠ</div>
              <div className={`text-3xl font-black dark:text-blue-400 ${plain ? pal.ddayNum : "text-blue-600"}`}>
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
          <button onClick={() => navigate("/mate")} className={gridBtn(0)}>
            <span className="text-xl">{isBaseball ? "⚾" : "👥"}</span>
            <span>구리 메이트</span>
          </button>
          <a
            href="https://hyu.u-folio.com/login"
            target="_blank"
            rel="noopener noreferrer"
            className={gridBtn(1)}
          >
            <span className="text-xl">{isBaseball ? "⚾" : "✏️"}</span>
            <span>유포폴</span>
          </a>
          <button onClick={() => navigate("/menu")} className={gridBtn(2)}>
            <span>병원식당메뉴</span>
            <span className="text-xl">{isBaseball ? "⚾" : "🍱"}</span>
          </button>
          <button onClick={() => navigate("/who")} className={gridBtn(3)}>
            <span>먼저 돈 사람은?</span>
            <span className="text-xl">{isBaseball ? "⚾" : "🔍"}</span>
          </button>
          <button onClick={() => navigate("/or-schedule")} className={gridBtn(4)}>
            <span>수술 시간표</span>
            <span className="text-xl">{isBaseball ? "⚾" : "🏥"}</span>
          </button>
          <button onClick={() => navigate("/restaurants")} className={gridBtn(5)}>
            <span>맛집인계</span>
            <span className="text-xl">{isBaseball ? "⚾" : "🥄"}</span>
          </button>
          <button
            onClick={() => navigate("/shuttle")}
            className={gridBtn(6, "gap-2 text-center px-2")}
          >
            <span className="text-[13px] leading-tight">
              구리병원
              <br />
              셔틀조회
            </span>
            <span className="text-xl">{isBaseball ? "⚾" : "🚌"}</span>
          </button>
          <button onClick={() => navigate("/board")} className={gridBtn(7)}>
            <span className="text-xl">{isBaseball ? "⚾" : "💬"}</span>
            <span>익명 게시판</span>
          </button>
          <button onClick={() => navigate("/prof")} className={gridBtn(8)}>
            <span>교수님 미리뵙기</span>
            <span className="text-xl">{isBaseball ? "⚾" : "👨‍🏫"}</span>
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 pt-2 pb-2">
          copyright© 이단비, ver3. 수술 시간표·내 캘린더에 일정 넣기·일실기 알림·테마 배경이 추가되었습니다
        </p>

        {/* CHERRY BLOSSOM FEATURE — remove next block when done */}
        {isBlossom && !isBaseball && <BlossomTree />}
      </div>
    </>
  );
};
