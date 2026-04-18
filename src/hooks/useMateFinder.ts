import { useMemo } from "react";
import { MEMBERS, NAME_LOOKUP, RAW_DATA } from "@/data";
import { isIn } from "@/utils/schedule";
import { weekDates } from "@/utils/date";

export interface MateCommonWeek {
  w: number;
  d: { s: Date; e: Date };
  people: string[];
}

export interface MateResult {
  error?: string;
  commonWeeks?: MateCommonWeek[];
}

/**
 * mateInputs에 담긴 이름들이 전부 "구리"에 가는 주차 + 그 주 구리에 있는 모든 사람.
 * 2명 미만이면 null.
 */
export function useMateFinder(mateInputs: string[]): MateResult | null {
  return useMemo(() => {
    const active = mateInputs.map(n => n.trim()).filter(Boolean);
    if (active.length < 2) return null;

    const people = active.map(name =>
      NAME_LOOKUP[name] ? { name, ...NAME_LOOKUP[name] } : null
    );
    if (people.some(p => p === null)) {
      return { error: "찾을 수 없는 이름이 있습니다." };
    }

    const commonWeeks: MateCommonWeek[] = [];
    for (let w = 1; w <= 36; w++) {
      const allInGuri = people.every(
        p => p && RAW_DATA.some(row => row[0].includes("구리") && isIn(row[w] || "", p.group, p.number))
      );
      if (!allInGuri) continue;

      const guriPeople: string[] = [];
      Object.entries(MEMBERS).forEach(([g, nums]) => {
        Object.entries(nums).forEach(([num, nameStr]) => {
          const n = parseInt(num);
          if (RAW_DATA.some(row => row[0].includes("구리") && isIn(row[w] || "", g, n))) {
            nameStr.split(",").map(s => s.trim()).forEach(name => guriPeople.push(name));
          }
        });
      });

      commonWeeks.push({
        w,
        d: weekDates(w),
        people: guriPeople.sort((a, b) => a.localeCompare(b, "ko")),
      });
    }
    return { commonWeeks };
  }, [mateInputs]);
}
