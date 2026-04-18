import { MEMBERS } from "@/data/members";
import type { ParsedPart } from "@/types";

/**
 * 스케줄 셀 코드를 파싱.
 *
 * 예)
 *   "A34"        → [{ g:"A", ns:[3,4] }]
 *   "B1-4"       → [{ g:"B", ns:[1,2,3,4] }]
 *   "A34 B12"    → [{ g:"A", ns:[3,4] }, { g:"B", ns:[1,2] }]
 *   "3 C234"     → [{ g:"C", ns:[2,3,4] }]   (특수 표기)
 *   ""/"0"       → []
 */
export function parse(code: string): ParsedPart[] {
  if (!code || !code.trim() || code === "0") return [];
  if (code === "3 C234") return [{ g: "C", ns: [2, 3, 4] }];
  const r: ParsedPart[] = [];
  for (const p of code.trim().split(/\s+/)) {
    const m = p.match(/^([A-I])(.+)$/);
    if (!m) continue;
    const g = m[1];
    const np = m[2];
    if (np.includes("-")) {
      const [a, b] = np.split("-").map(Number);
      const ns: number[] = [];
      for (let i = a; i <= b; i++) ns.push(i);
      r.push({ g, ns });
    } else {
      r.push({ g, ns: np.split("").map(Number) });
    }
  }
  return r;
}

/** 이 셀에 (group, number) 조원이 포함돼 있는지 */
export function isIn(cell: string, tg: string, tn: number): boolean {
  return parse(cell).some(p => p.g === tg && p.ns.includes(tn));
}

/** 이 셀에서 (tg, tn) 본인 제외한 공동실습생 이름 배열 */
export function coMem(cell: string, tg: string, tn: number): string[] {
  const names: string[] = [];
  for (const p of parse(cell)) {
    for (const n of p.ns) {
      if (p.g === tg && n === tn) continue;
      const nm = MEMBERS[p.g]?.[n];
      if (nm) names.push(nm);
    }
  }
  return names;
}

/**
 * DEPT_LINKS 매칭용 키 정규화.
 *   "소화기내과1(서울)"   → "소화기내과(서울)"
 *   "정신건강의학(서울A)" → "정신건강의학(서울)"
 */
export function getLinkKey(deptName: string): string {
  // 1. 괄호 안팎의 A~D 말미 제거
  let n = deptName.replace(/[A-D]\)$/, ")").replace(/[A-D]$/, "");
  // 2. 숫자 제거 (소화기내과1 → 소화기내과)
  n = n.replace(/\d+/g, "");
  return n;
}

/**
 * 과의 "기본 이름" (병원·번호·알파벳 제거).
 *   "소화기내과1(서울)"   → "소화기내과"
 *   "정신건강의학(서울A)" → "정신건강의학"
 */
export function db(d: string): string {
  return d
    .replace(/\d.*$/, "")
    .replace(/\(.*\)/, "")
    .replace(/[A-D]$/, "")
    .trim();
}
