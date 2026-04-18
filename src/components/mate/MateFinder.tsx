import React from "react";
import { useMateFinder } from "@/hooks/useMateFinder";
import { fmtD } from "@/utils/date";

interface MateFinderProps {
  inputs: string[];
  onChange: (next: string[]) => void;
}

/**
 * 구리 메이트 찾기 폼. 4명 중 2명 이상 입력 시 공통 구리 주차 계산.
 */
export const MateFinder: React.FC<MateFinderProps> = ({ inputs, onChange }) => {
  const result = useMateFinder(inputs);

  return (
    <div className="p-6 rounded-3xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 shadow-sm space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {inputs.map((val, idx) => (
          <input
            key={idx}
            value={val}
            onChange={e => {
              const n = [...inputs];
              n[idx] = e.target.value;
              onChange(n);
            }}
            placeholder={`메이트 ${idx + 1}`}
            className="px-4 py-3 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none shadow-sm focus:ring-2 focus:ring-blue-500/20"
          />
        ))}
      </div>
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
          공통 구리 주차
        </h4>
        {result?.commonWeeks && result.commonWeeks.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {result.commonWeeks.map(res => (
              <div
                key={res.w}
                className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {res.w}주차
                  </span>
                  <span className="text-xs text-slate-400">
                    ({fmtD(res.d.s)} ~ {fmtD(res.d.e)})
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-50 dark:border-slate-800/50">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-2 gap-y-1">
                    {res.people.map((name, pIdx) => (
                      <span
                        key={pIdx}
                        className="bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-700/50"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs italic">
            {result?.error || "2명 이상 입력 시 표시됩니다."}
          </div>
        )}
      </div>
    </div>
  );
};
