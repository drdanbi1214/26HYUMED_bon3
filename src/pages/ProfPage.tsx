import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Icon } from "@/components/ui/Icon";
import {
  PROF_DEPTS_GURI,
  PROF_DEPTS_SEOUL,
  PROF_LINKS_GURI,
  PROF_LINKS_SEOUL,
  RHEUMATOLOGY_DEPTS,
} from "@/data/professors";

type Hospital = "seoul" | "guri";

interface ProfPageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

export const ProfPage: React.FC<ProfPageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  const [hospital, setHospital] = useState<Hospital>("seoul");
  const [subView, setSubView] = useState<string | null>(null); // e.g. "류마티스병원"
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const depts = hospital === "seoul" ? PROF_DEPTS_SEOUL : PROF_DEPTS_GURI;
    if (!search.trim()) return depts;
    return depts.filter(d => d.includes(search.trim()));
  }, [hospital, search]);

  const filteredRheum = useMemo(() => {
    if (!search.trim()) return RHEUMATOLOGY_DEPTS;
    return RHEUMATOLOGY_DEPTS.filter(d => d.includes(search.trim()));
  }, [search]);

  const handleDeptClick = (dept: string) => {
    if (dept === "류마티스병원") {
      setSubView(dept);
      setSearch("");
      return;
    }
    const linkMap = hospital === "seoul" ? PROF_LINKS_SEOUL : PROF_LINKS_GURI;
    const link = linkMap[dept];
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  };

  const title = subView ? `🏥 ${subView}` : "👨‍🏫 교수님 미리뵙기";

  const rightSlot = !subView ? (
    <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 mr-2 shadow-inner">
      <button
        onClick={() => { setHospital("seoul"); setSearch(""); }}
        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
          hospital === "seoul"
            ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm"
            : "text-slate-400 dark:text-slate-500"
        }`}
      >
        서울
      </button>
      <button
        onClick={() => { setHospital("guri"); setSearch(""); }}
        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
          hospital === "guri"
            ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm"
            : "text-slate-400 dark:text-slate-500"
        }`}
      >
        구리
      </button>
    </div>
  ) : null;

  return (
    <>
      <Header
        title={title}
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate("/")}
        rightSlot={rightSlot}
      />

      <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 pb-20">
        <div className="relative z-30 px-1">
          <div className="relative">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="진료과 검색..."
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm pl-12"
            />
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </Icon>
          </div>
        </div>

        {subView ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => { setSubView(null); setSearch(""); }}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-200 active:scale-90"
                aria-label="뒤로"
              >
                <Icon size={18}><path d="M15 18l-6-6 6-6" /></Icon>
              </button>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">진료과 선택</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filteredRheum.map((dept, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDeptClick(dept)}
                  className="px-4 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm font-bold hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-left flex justify-between items-center group"
                >
                  {dept}
                  <Icon className="text-slate-300 group-hover:text-blue-500 transition-colors" size={14}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </Icon>
                </button>
              ))}
              {filteredRheum.length === 0 && (
                <div className="col-span-2 text-center py-10 text-slate-400 text-sm italic">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 px-1">
              {hospital === "seoul" ? "서울병원" : "구리병원"}의 진료과별 교수님 정보를 확인해보세요.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((dept, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDeptClick(dept)}
                  className={`px-4 py-4 rounded-2xl border transition-all text-left flex justify-between items-center group ${
                    dept === "류마티스병원"
                      ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <span className="text-sm font-bold">{dept}</span>
                  <Icon
                    className={`${dept === "류마티스병원" ? "text-indigo-400" : "text-slate-300"} group-hover:text-blue-500 transition-colors`}
                    size={14}
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </Icon>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-2 text-center py-10 text-slate-400 text-sm italic">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
