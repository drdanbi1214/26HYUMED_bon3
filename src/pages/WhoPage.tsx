import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Icon } from "@/components/ui/Icon";
import { useAllDepts, useWhoResults } from "@/hooks/useWhoSearch";
import { curWeek } from "@/utils/date";

interface WhoPageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

export const WhoPage: React.FC<WhoPageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  const allDepts = useAllDepts();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const results = useWhoResults(selected);
  const cw = curWeek();

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    return allDepts.filter(d => d.includes(search)).slice(0, 8);
  }, [allDepts, search]);

  const pick = (dept: string) => {
    setSearch(dept);
    setSelected(dept);
  };

  // 병원을 나눠 보여주는 과는 3열, 통합해서 보여주는 과(외과)는 2열
  const cols = results?.split ? "grid-cols-[2.4rem_1fr_1fr]" : "grid-cols-[2.4rem_1fr]";

  return (
    <>
      <Header
        title="🔍 먼저 돈 사람은?"
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate("/")}
        rightSlot={
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 mr-2 uppercase tracking-widest">
            Rotation History
          </div>
        }
      />

      <div className="space-y-3 animate-in fade-in slide-in-from-right duration-500 pb-20">
        <div className="relative z-30 px-1">
          <div className="relative">
            <input
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                if (!e.target.value.trim()) setSelected(null);
              }}
              placeholder="실습과 이름 검색 (예: 소화기내과)"
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm pl-12"
            />
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </Icon>
          </div>
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
              {suggestions.map((dept, i) => (
                <button
                  key={i}
                  onClick={() => pick(dept)}
                  className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-none"
                >
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{dept}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {results ? (
          <div className="space-y-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl px-4 py-3 text-white shadow-lg">
              <h4 className="text-base font-black leading-tight">{selected}</h4>
              <p className="text-blue-100 text-[11px]">주차별 실습 인원 명단입니다.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              {/* 열 제목 — 주차마다 반복하지 않고 맨 위에 한 번만 */}
              {results.split && (
                <div className={`grid ${cols} gap-x-1.5 px-2 py-1.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400`}>
                  <span />
                  <span>서울</span>
                  <span className="border-l border-slate-200 dark:border-slate-700 pl-1.5">구리</span>
                </div>
              )}

              {results.weeks.map(r => {
                const isCur = r.w === cw;
                const cell = (names: string[], extraClass = "") => (
                  <div className={`flex flex-wrap gap-x-1 gap-y-0.5 ${extraClass}`}>
                    {names.length > 0 ? (
                      names.map((name, pIdx) => (
                        <span
                          key={pIdx}
                          className={`text-[11px] leading-snug px-1 rounded font-medium ${
                            isCur
                              ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] leading-snug text-slate-300 dark:text-slate-600">–</span>
                    )}
                  </div>
                );

                return (
                  <div
                    key={r.w}
                    className={`grid ${cols} gap-x-1.5 px-2 py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-none ${
                      isCur ? "bg-blue-500/10" : ""
                    }`}
                  >
                    <span
                      className={`text-[11px] font-black leading-snug ${
                        isCur ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {r.w}주{isCur && <span className="text-[9px] ml-0.5 align-top">●</span>}
                    </span>
                    {cell(r.seoul)}
                    {results.split &&
                      cell(r.guri, "border-l border-slate-100 dark:border-slate-800/60 pl-1.5")}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow-sm">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              실습과를 검색하여
              <br />
              누가 먼저 돌았는지 확인해보세요.
            </p>
          </div>
        )}
      </div>
    </>
  );
};
