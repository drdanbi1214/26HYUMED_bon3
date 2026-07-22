import React from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { WikiGate } from "@/components/wiki/WikiGate";
import { useWikiIndex } from "@/hooks/useWiki";
import { WIKI_DEPTS } from "@/data/wikiDepts";

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

/** 실습나무위키 입구: 과 목록. 과를 누르면 그 과의 문서로 이동. */
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
          <DeptList />
        </WikiGate>
      </div>
    </>
  );
};

const DeptList: React.FC = () => {
  const navigate = useNavigate();
  const { index, loading, error, refetch } = useWikiIndex();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-900/10">
      {/* 나무위키풍 초록 바 */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#00a495]">
        <span className="text-sm font-black text-white">🌳 실습나무위키</span>
        <span className="text-[10px] text-white/80">우리가 함께 가꾸는 실습 문서</span>
      </div>

      <div className="p-4">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3 px-1">
          과를 누르면 문서로 들어가요. 누구나 [편집]으로 내용을 고칠 수 있고, 모든 판은
          역사에 남아 되돌릴 수 있어요.
        </p>

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

        <div className="grid grid-cols-2 gap-2">
          {WIKI_DEPTS.map(dept => {
            const updated = index[dept];
            return (
              <button
                key={dept}
                onClick={() => navigate(`/wiki/${encodeURIComponent(dept)}`)}
                className="text-left px-3.5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 active:scale-95 transition-all"
              >
                <span className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  {updated ? "🌳" : "🌱"} {dept}
                </span>
                <span className="block mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                  {loading ? "…" : updated ? `${fmtTime(updated)} 수정` : "아직 빈 문서"}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-center text-[10px] text-slate-400 dark:text-slate-600">
          🌳 문서가 자란 과 · 🌱 아직 새싹인 과 — 먼저 심는 사람이 임자!
        </p>
      </div>
    </div>
  );
};
