import React, { useState } from "react";
import { DEPT_LINKS } from "@/data/schedule";
import { db, getLinkKey } from "@/utils/schedule";
import { fmtD } from "@/utils/date";
import { Icon } from "@/components/ui/Icon";
import { getRelevantClosures } from "@/utils/closureMatch";
import type { WeekData, Closure } from "@/types";

interface WeekCardProps {
  week: WeekData;
  isCurrent: boolean;
  closures: Closure[];
}

export const WeekCard: React.FC<WeekCardProps> = ({ week, isCurrent, closures }) => {
  const { w, d, a } = week;
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isCurrent
          ? "bg-blue-500/5 border-blue-500 shadow-md ring-1 ring-blue-500/20"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-black">{w}주차</span>
        <span className="text-[10px] text-slate-400">
          {fmtD(d.s)} ~ {fmtD(d.e)}
        </span>
      </div>
      <div className="space-y-2">
        {a.length > 0 ? (
          a.map((x, i) => {
            const link = DEPT_LINKS[getLinkKey(x.dept)] || DEPT_LINKS[db(x.dept)];
            const deptClosures = getRelevantClosures(closures, d.s, d.e, x.dept);
            return (
              <div key={i}>
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="text-sm font-bold">{x.dept}</div>
                      {deptClosures.length > 0 && (
                        <button
                          onClick={() => setOpenIdx(openIdx === i ? null : i)}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-600 border border-pink-200 hover:bg-pink-200 active:bg-pink-300 transition-colors"
                        >
                          휴진!
                        </button>
                      )}
                    </div>
                    {x.co.length > 0 && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        👥 {x.co.join(", ")}
                      </div>
                    )}
                  </div>
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100"
                      aria-label="실습 자료 링크"
                    >
                      <Icon size={14}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <line x1="10" y1="9" x2="8" y2="9" />
                      </Icon>
                    </a>
                  )}
                </div>
                {openIdx === i && (
                  <div className="mt-1 px-3 py-2 rounded-xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900 shadow-sm space-y-1">
                    {deptClosures.map((c, ci) => (
                      <div key={ci} className="text-[11px] text-pink-800 dark:text-pink-300">
                        {c.doctor_name}{" "}
                        {c.start_date === c.end_date
                          ? fmtD(new Date(c.start_date + "T00:00:00"))
                          : `${fmtD(new Date(c.start_date + "T00:00:00"))}~${fmtD(new Date(c.end_date + "T00:00:00"))}`}{" "}
                        {c.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-xs text-slate-400 italic py-1">일정 없음</div>
        )}
      </div>
    </div>
  );
};
