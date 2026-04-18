import { useMemo } from "react";
import { MEMBERS, RAW_DATA } from "@/data";
import { db, parse } from "@/utils/schedule";

export interface WhoWeek {
  w: number;
  people: string[];
}

/** 선택된 과(기본 이름)에 주차별로 누가 돌았는지 */
export function useWhoResults(selectedDept: string | null): WhoWeek[] | null {
  return useMemo(() => {
    if (!selectedDept) return null;
    const weeks: WhoWeek[] = [];
    for (let w = 1; w <= 36; w++) {
      const peopleInWeek: string[] = [];
      RAW_DATA.forEach(row => {
        if (db(row[0]) !== selectedDept) return;
        const cell = row[w] || "";
        parse(cell).forEach(p => {
          p.ns.forEach(n => {
            const name = MEMBERS[p.g]?.[n];
            if (!name) return;
            name.split(",").map(s => s.trim()).forEach(nm => {
              if (!peopleInWeek.includes(nm)) peopleInWeek.push(nm);
            });
          });
        });
      });
      weeks.push({ w, people: peopleInWeek.sort((a, b) => a.localeCompare(b, "ko")) });
    }
    return weeks;
  }, [selectedDept]);
}

/** 전체 과의 "기본 이름" 목록 (중복 제거, 가나다순) */
export function useAllDepts() {
  return useMemo(() => {
    const depts = new Set<string>();
    RAW_DATA.forEach(row => depts.add(db(row[0])));
    return Array.from(depts).sort((a, b) => a.localeCompare(b, "ko"));
  }, []);
}
