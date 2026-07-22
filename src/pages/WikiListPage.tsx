import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { WikiGate } from "@/components/wiki/WikiGate";
import { useWikiIndex, wikiHref } from "@/hooks/useWiki";

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
};

interface WikiListPageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

/** 실습나무위키 대문: 검색/새 문서 + 최근 변경 + 전체 문서 목록 (나무위키처럼 완전 자유 문서) */
export const WikiListPage: React.FC<WikiListPageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();

  return (
    <>
      <Header
        title="🌳 실습나무위키"
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate("/")}
      />

      <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 pb-16">
        <WikiGate>
          <MainPage />
        </WikiGate>
      </div>
    </>
  );
};

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const { index, loading, error, refetch } = useWikiIndex();
  const [q, setQ] = useState("");

  const docs = Object.entries(index).map(([title, updatedAt]) => ({ title, updatedAt }));
  const recent = [...docs]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8);
  const all = [...docs].sort((a, b) => a.title.localeCompare(b.title, "ko"));
  const query = q.trim();
  const matches = query ? all.filter(d => d.title.includes(query)) : [];
  const exact = query && index[query] !== undefined;

  const go = (title: string) => {
    const t = title.trim().replace(/^\/+|\/+$/g, "");
    if (t) navigate(wikiHref(t));
  };

  /** "외과/회진" → 앞 경로는 흐리게, 마지막 이름만 진하게 + 깊이만큼 들여쓰기 */
  const TitleLabel: React.FC<{ title: string }> = ({ title }) => {
    const segs = title.split("/");
    const last = segs.pop()!;
    return (
      <span style={{ paddingLeft: `${segs.length * 14}px` }}>
        {segs.length > 0 && (
          <span className="text-slate-400 dark:text-slate-500">{segs.join("/")}/</span>
        )}
        <span className="font-bold">{last}</span>
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-900/10">
      {/* 나무위키풍 초록 바 */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#00a495]">
        <span className="text-sm font-black text-white">🌳 실습나무위키</span>
        <span className="text-[10px] text-white/80">대문</span>
      </div>

      <div className="p-4">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3 px-1 leading-4">
          나무위키처럼 아무 제목이나 문서를 만들 수 있어요. 제목에 /를 넣으면 하위 문서가
          돼요 (예: <span className="font-bold">외과/회진</span>). 누구나 편집할 수 있고 모든
          판은 역사에 남아요.
        </p>

        {/* 검색 / 새 문서 (나무위키 상단 검색창처럼 — 없는 제목이면 그대로 새 문서) */}
        <div className="flex gap-1.5">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && go(q)}
            placeholder="문서 검색 · 새 문서 제목 입력"
            className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#00a495]/30 transition-all"
          />
          <button
            onClick={() => go(q)}
            disabled={!query}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-[#00a495] text-white text-sm font-bold shadow-md active:scale-95 transition-all disabled:opacity-40"
          >
            이동
          </button>
        </div>

        {/* 검색 결과 */}
        {query && (
          <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {matches.map(d => (
              <button
                key={d.title}
                onClick={() => go(d.title)}
                className="w-full text-left px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
              >
                🌳 {d.title}
              </button>
            ))}
            {!exact && (
              <button
                onClick={() => go(q)}
                className="w-full text-left px-3.5 py-2.5 text-sm text-red-500 dark:text-red-400 active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
              >
                🌱 "{query}" 새 문서 만들기
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="text-center py-6">
            <p className="text-xs text-red-500 mb-3">{error}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 rounded-xl bg-[#00a495] text-white text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              다시 시도
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="mt-4 h-32 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        )}

        {!loading && !error && (
          <>
            {/* 최근 변경 (나무위키의 최근 변경) */}
            {recent.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-black text-slate-500 dark:text-slate-400 mb-2 px-1">
                  🕐 최근 변경
                </p>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  {recent.map(d => (
                    <button
                      key={d.title}
                      onClick={() => go(d.title)}
                      className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
                    >
                      <span className="text-sm text-[#0275d8] dark:text-sky-400 truncate">
                        {d.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {fmtTime(d.updatedAt)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 전체 문서 (하위 문서는 들여쓰기) */}
            <div className="mt-5">
              <p className="text-xs font-black text-slate-500 dark:text-slate-400 mb-2 px-1">
                📚 전체 문서 ({all.length})
              </p>
              {all.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">🌱</div>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">
                    아직 문서가 하나도 없어요
                  </p>
                  <p className="text-[11px] text-slate-400">
                    위 검색창에 제목을 입력하고 이동을 눌러 첫 나무를 심어보세요!
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  {all.map(d => (
                    <button
                      key={d.title}
                      onClick={() => go(d.title)}
                      className="w-full text-left px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
                      title={d.title}
                    >
                      <TitleLabel title={d.title} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
