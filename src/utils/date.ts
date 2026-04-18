// 2026년 본3 실습 학사일정 기준.
// 1주차 = 2026-02-09 ~ 02-13 (금)
// 설연휴(1주) = 2026-02-14 ~ 02-22 → 2주차 = 2026-02-23 ~ 02-27
// 여름방학(3주 공백): 25주차 전후 세이프존을 별도 offset 처리

export const SUMMER_START = new Date(2026, 7, 1);   // 2026-08-01
export const SUMMER_END = new Date(2026, 7, 23);    // 2026-08-23

/** 주차(1~36) → 해당 주 월요일 Date */
export function weekStart(w: number): Date {
  if (w === 1) return new Date(2026, 1, 9);                    // 2월 9일
  if (w <= 24) return new Date(2026, 1, 23 + (w - 2) * 7);     // 2월 23일 + (w-2)주
  return new Date(2026, 1, 23 + (w - 2) * 7 + 21);             // 여름방학 3주 skip
}

/** 주차 → 월~금 날짜 범위 */
export function weekDates(w: number) {
  const s = weekStart(w);
  const e = new Date(s);
  e.setDate(e.getDate() + 4);
  return { s, e };
}

/** Date → "M/D" 짧은 포맷 */
export function fmtD(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** Date → "YYYY.MM.DD" 풀 포맷 */
export function fmtFull(d: Date) {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/** 현재 시점의 주차. 여름방학이면 "summer", 실습 시작 전이면 null */
export function curWeek(): number | "summer" | null {
  const n = new Date();
  const ss = new Date(SUMMER_START); ss.setHours(0, 0, 0, 0);
  const se = new Date(SUMMER_END); se.setHours(23, 59, 59, 999);
  if (n >= ss && n <= se) return "summer";
  for (let w = 36; w >= 1; w--) if (n >= weekStart(w)) return w;
  return null;
}

/** 여름방학 시작까지 며칠 남았나 (지나면 음수) */
export function dDay() {
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  const t = new Date(SUMMER_START);
  t.setHours(0, 0, 0, 0);
  return Math.ceil((t.getTime() - n.getTime()) / 864e5);
}

/** 해당 주차 끝난 직후 토·일 Date */
export function weekendAfter(w: number) {
  const e = weekDates(w).e;
  const sat = new Date(e); sat.setDate(sat.getDate() + 1);
  const sun = new Date(e); sun.setDate(sun.getDate() + 2);
  return { sat, sun };
}

/** 1주차 바로 직전 토·일 (아직 사용 안 함, 유지용) */
export function weekendBefore1() {
  const s = weekStart(1);
  const sun = new Date(s); sun.setDate(sun.getDate() - 1);
  const sat = new Date(s); sat.setDate(sat.getDate() - 2);
  return { sat, sun };
}

/** 주어진 토·일이 "지금" 주말인지 */
export function isCurrentWeekend(sat: Date, sun: Date) {
  const now = new Date();
  const satStart = new Date(sat); satStart.setHours(0, 0, 0, 0);
  const sunEnd = new Date(sun); sunEnd.setHours(23, 59, 59, 999);
  return now >= satStart && now <= sunEnd;
}

/** 설연휴 구간인지 (2026-02-14 ~ 02-22) */
export function isLunarBreak() {
  const now = new Date();
  const s = new Date(2026, 1, 14); s.setHours(0, 0, 0, 0);
  const e = new Date(2026, 1, 22); e.setHours(23, 59, 59, 999);
  return now >= s && now <= e;
}
