import { useMemo } from "react";
import { MEMBERS, RAW_DATA } from "@/data";
import { db, parse } from "@/utils/schedule";

export interface WhoWeek {
  w: number;
  seoul: string[];
  /** split=false인 과에서는 항상 빈 배열 */
  guri: string[];
}

export interface WhoResult {
  /** 서울/구리를 나눠서 보여줄지. false면 seoul 한 열에 전부 담긴다 */
  split: boolean;
  weeks: WhoWeek[];
}

/**
 * 병원 구분을 표시하지 않는 과.
 * 과 내부에서 서울·구리를 자체 조정해서 스케줄표의 표기가 실제와 다를 수 있다.
 */
const NO_SPLIT_DEPTS = new Set(["외과"]);

/** 스케줄 행 이름에서 병원 구분. "혈액종양내과(구리)" → "guri" */
function hospitalOf(deptName: string): "seoul" | "guri" {
  return deptName.includes("구리") ? "guri" : "seoul";
}

/** 선택된 과(기본 이름)에 주차별로 누가 돌았는지 — 서울/구리 분리 */
export function useWhoResults(selectedDept: string | null): WhoResult | null {
  return useMemo(() => {
    if (!selectedDept) return null;
    const split = !NO_SPLIT_DEPTS.has(selectedDept);
    const weeks: WhoWeek[] = [];
    for (let w = 1; w <= 36; w++) {
      const buckets: Record<"seoul" | "guri", string[]> = { seoul: [], guri: [] };
      RAW_DATA.forEach(row => {
        if (db(row[0]) !== selectedDept) return;
        const bucket = split ? buckets[hospitalOf(row[0])] : buckets.seoul;
        const cell = row[w] || "";
        parse(cell).forEach(p => {
          p.ns.forEach(n => {
            const name = MEMBERS[p.g]?.[n];
            if (!name) return;
            name.split(",").map(s => s.trim()).forEach(nm => {
              if (!bucket.includes(nm)) bucket.push(nm);
            });
          });
        });
      });
      const sortKo = (a: string, b: string) => a.localeCompare(b, "ko");
      weeks.push({ w, seoul: buckets.seoul.sort(sortKo), guri: buckets.guri.sort(sortKo) });
    }
    return { split, weeks };
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
