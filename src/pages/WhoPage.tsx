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

      <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 pb-20">
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
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl mb-6">
              <h4 className="text-xl font-black mb-1">{selected}</h4>
              <p className="text-blue-100 text-sm">주차별 실습 인원 명단입니다.</p>
            </div>
            <div className="space-y-3">
              {results.map(r => {
                const isCur = r.w === cw;
                return (
                  <div
                    key={r.w}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCur
                        ? "bg-blue-500/10 border-blue-500 shadow-md ring-1 ring-blue-500/20"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-sm font-black ${isCur ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-100"}`}>
                        {r.w}주차
                      </span>
                      {isCur && (
                        <span className="text-[10px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.people.length > 0 ? (
                        r.people.map((name, pIdx) => (
                          <span
                            key={pIdx}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium ${
                              isCur
                                ? "bg-blue-500/10 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">실습 인원 없음</span>
                      )}
                    </div>
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
