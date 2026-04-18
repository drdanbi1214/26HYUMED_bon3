import React from "react";
import { DEPT_LINKS } from "@/data/schedule";
import { db, getLinkKey } from "@/utils/schedule";
import { fmtD } from "@/utils/date";
import { Icon } from "@/components/ui/Icon";
import type { WeekData } from "@/types";

interface WeekCardProps {
  week: WeekData;
  isCurrent: boolean;
}

/**
 * 개인 스케줄 페이지의 한 주차 카드.
 * 배정된 과 + 공동실습생 + 드라이브 링크.
 */
export const WeekCard: React.FC<WeekCardProps> = ({ week, isCurrent }) => {
  const { w, d, a } = week;
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
            return (
              <div
                key={i}
                className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800"
              >
                <div>
                  <div className="text-sm font-bold">{x.dept}</div>
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
            );
          })
        ) : (
          <div className="text-xs text-slate-400 italic py-1">일정 없음</div>
        )}
      </div>
    </div>
  );
};
