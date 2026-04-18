import { MEMBERS, NAME_LOOKUP, RAW_DATA } from "@/data";
import { coMem, isIn } from "@/utils/schedule";
import { weekDates } from "@/utils/date";
import type { Assignment, SearchResult, WeekData } from "@/types";

/**
 * 조(A-I) + 번호(1-8)로 한 사람의 1~36주차 실습 일정을 계산한다.
 *
 * @param g         조 알파벳 (예: "C")
 * @param n         조 내 번호 (예: 3)
 * @param nameHint  표시할 이름. 생략 시 MEMBERS의 첫 번째 이름 사용.
 * @returns         SearchResult. 조/번호가 유효하지 않으면 null.
 */
export function buildSearchResult(
  g: string,
  n: number,
  nameHint?: string
): SearchResult | null {
  const rawNames = MEMBERS[g]?.[n];
  if (!rawNames) return null;

  const displayName = nameHint || rawNames.split(",")[0].trim();
  const weeks: WeekData[] = [];
  let sCount = 0;
  let gCount = 0;

  for (let w = 1; w <= 36; w++) {
    const assigns: Assignment[] = [];
    RAW_DATA.forEach(row => {
      if (isIn(row[w] || "", g, n)) {
        assigns.push({
          dept: row[0],
          co: coMem(row[w] || "", g, n),
          cell: row[w] || "",
        });
        if (row[0].includes("서울")) sCount++;
        else if (row[0].includes("구리")) gCount++;
      }
    });
    weeks.push({ w, d: weekDates(w), a: assigns });
  }

  return {
    g,
    n,
    name: displayName,
    weeks,
    stats: { sCount, gCount },
  };
}

/**
 * 검색창 입력을 해석해서 (조, 번호, 표시이름)을 찾는다.
 * 입력 형식:
 *   - "C3" / "c3" 같은 조+번호
 *   - 이름 전체 ("홍길동")
 *   - 이름 일부 (후보 한 명이면 성공, 여러 명이면 후보 리스트 반환)
 *
 * 반환:
 *   { ok: true, g, n, name } - 정상 1건 해석
 *   { ok: false, candidates } - 여러 명 후보
 *   { ok: false, notFound: true } - 결과 없음
 */
export type ResolveResult =
  | { ok: true; g: string; n: number; name?: string }
  | { ok: false; candidates?: string[]; notFound?: boolean };

export function resolveSearchQuery(query: string): ResolveResult {
  const v = query.trim();
  if (!v) return { ok: false, notFound: true };

  const cm = v.toUpperCase().match(/^([A-I])(\d)$/);
  if (cm && MEMBERS[cm[1]]?.[+cm[2]]) {
    return { ok: true, g: cm[1], n: +cm[2] };
  }

  const f = NAME_LOOKUP[v];
  if (f) {
    return { ok: true, g: f.group, n: f.number, name: v };
  }

  const ms = Object.keys(NAME_LOOKUP).filter(n => n.includes(v));
  if (ms.length === 1) {
    return { ok: true, g: NAME_LOOKUP[ms[0]].group, n: NAME_LOOKUP[ms[0]].number, name: ms[0] };
  }
  if (ms.length > 1) {
    return { ok: false, candidates: ms };
  }
  return { ok: false, notFound: true };
}
