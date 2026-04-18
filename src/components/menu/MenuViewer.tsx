import React from "react";

interface MenuViewerProps {
  text: string;
}

/**
 * 병원 식당 식단 텍스트를 "날짜별 카드 + 조식/중식/석식 라벨"로 렌더링.
 * 텍스트 파싱은 이 컴포넌트 안에서만.
 */
export const MenuViewer: React.FC<MenuViewerProps> = ({ text }) => {
  const days = text.split(/(?=\d{2}\s*\/\s*\d{2}\s*\()/);
  return (
    <div className="space-y-6">
      {days.map((day, idx) => {
        if (!day.trim()) return null;
        const lines = day.trim().split("\n");
        const dateLine = lines[0];
        const contentLines = lines.slice(1);
        return (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <span className="text-sm font-black text-slate-800 dark:text-slate-100">{dateLine}</span>
              <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                DAILY MENU
              </span>
            </div>
            <div className="p-5 space-y-4">
              {contentLines.map((line, lIdx) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                let badgeStyle = "text-slate-400 border-slate-200 dark:border-slate-700";
                let label = "";
                if (trimmed.startsWith("조식")) {
                  label = "조식";
                  badgeStyle = "text-orange-500 bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/30";
                } else if (trimmed.startsWith("중식")) {
                  label = "중식";
                  badgeStyle = "text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-900/30";
                } else if (trimmed.startsWith("석식")) {
                  label = "석식";
                  badgeStyle = "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/30";
                }
                if (label) {
                  return (
                    <div key={lIdx} className="flex gap-3">
                      <span className={`shrink-0 w-10 h-5 flex items-center justify-center rounded-md border text-[9px] font-black ${badgeStyle}`}>
                        {label}
                      </span>
                      <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium">
                        {trimmed.replace(/.*?\):|.*?:/, "").trim()}
                      </p>
                    </div>
                  );
                }
                return (
                  <p key={lIdx} className="text-[13px] text-slate-500 dark:text-slate-400 pl-[52px] italic">
                    {trimmed}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
