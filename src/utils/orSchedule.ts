/**
 * 수술 배정표(E345 배정.xlsx 등)에서 뽑은 수술 건 하나.
 * 시간은 자정 기준 분(minute) 단위.
 */
export interface OrCase {
  /** 파싱 순서 고유번호. 방(배정) 기능에서 학생 배정의 키로 쓴다. */
  idx: number;
  date: string; // "2026-07-06"
  startMin: number;
  durMin: number;
  room: string;
  patientNo: string;
  patientName: string;
  opName: string;
  surgeon: string;
}

export type SectionId = 1 | 2;

/** 시간표 보기: 외과서울1/2는 교수 명단으로 필터, "all"(기타)은 전체 수술 표시 */
export type ViewId = SectionId | "all";

/** 섹션별 담당 교수. 어느 쪽 명단에도 없는 집도의는 두 섹션 모두에 표시한다. */
export const SECTION_PROFS: Record<SectionId, string[]> = {
  1: ["안병규", "박성실", "최지윤", "하태경", "이주희"],
  2: ["정민성", "차치환", "박신정", "이경근", "최동호", "김경식", "정윤경", "이준선", "손준혁"],
};

export const VIEW_LABELS: Record<ViewId, string> = {
  1: "외과서울1 (LGI·Vas·UGI)",
  2: "외과서울2 (Breast·Endo·HBP·SP)",
  all: "기타 (전체 수술)",
};

export function splitBySection(cases: OrCase[]): Record<SectionId, OrCase[]> {
  const s1 = new Set(SECTION_PROFS[1]);
  const s2 = new Set(SECTION_PROFS[2]);
  const out: Record<SectionId, OrCase[]> = { 1: [], 2: [] };
  for (const c of cases) {
    if (s1.has(c.surgeon)) out[1].push(c);
    else if (s2.has(c.surgeon)) out[2].push(c);
    else {
      // 명단에 없는 새 교수 → 양쪽 시간표에 모두 표시
      out[1].push(c);
      out[2].push(c);
    }
  }
  return out;
}

export const SLOT_MIN = 30;

/**
 * 날짜별 세로 레인 배치가 끝난 시간표 그리드.
 * 같은 날 시간이 겹치는 수술(다른 방)은 레인을 나눠서 나란히 배치한다.
 */
export interface SectionGrid {
  days: { date: string; lanes: OrCase[][] }[];
  startMin: number;
  endMin: number;
}

/**
 * extraDates: 수술이 없어도 열을 만들 날짜 (외래만 있는 날 등)
 * events: 공용 일정 — 날짜 열이 생기고, 그리드 시간 범위도 일정에 맞춰 넓힌다
 */
export function buildGrid(cases: OrCase[], extraDates: string[] = [], events: OrEvent[] = []): SectionGrid {
  const dates = [...new Set([...cases.map(c => c.date), ...extraDates, ...events.map(e => e.date)])].sort();
  let startMin = 8 * 60;
  let endMin = 17 * 60;
  for (const c of cases) {
    startMin = Math.min(startMin, Math.floor(c.startMin / SLOT_MIN) * SLOT_MIN);
    endMin = Math.max(endMin, Math.ceil((c.startMin + c.durMin) / SLOT_MIN) * SLOT_MIN);
  }
  for (const e of events) {
    startMin = Math.min(startMin, Math.floor(e.start / SLOT_MIN) * SLOT_MIN);
    endMin = Math.max(endMin, Math.ceil(e.end / SLOT_MIN) * SLOT_MIN);
  }
  const days = dates.map(date => {
    const dayCases = cases
      .filter(c => c.date === date)
      .sort((a, b) => a.startMin - b.startMin || b.durMin - a.durMin || a.room.localeCompare(b.room));
    const lanes: OrCase[][] = [];
    const laneEnds: number[] = [];
    for (const c of dayCases) {
      // 30분 슬롯으로 반올림한 구간 기준으로 겹침을 판정해야 렌더링 시 셀이 충돌하지 않는다
      const rs = Math.floor(c.startMin / SLOT_MIN) * SLOT_MIN;
      const re = Math.ceil((c.startMin + c.durMin) / SLOT_MIN) * SLOT_MIN;
      let i = laneEnds.findIndex(end => end <= rs);
      if (i === -1) {
        lanes.push([]);
        laneEnds.push(0);
        i = lanes.length - 1;
      }
      lanes[i].push(c);
      laneEnds[i] = re;
    }
    if (lanes.length === 0) lanes.push([]);
    return { date, lanes };
  });
  return { days, startMin, endMin };
}

/** 집도의별 파스텔 배경색 (화면·엑셀 공용, ARGB의 RGB 6자리) */
const PALETTE = [
  "FEF3C7", "DBEAFE", "DCFCE7", "FCE7F3", "EDE9FE", "FFEDD5",
  "CCFBF1", "FEE2E2", "E0E7FF", "D1FAE5", "FEF9C3", "F1F5F9",
];

export function surgeonColor(surgeon: string): string {
  let h = 0;
  for (const ch of surgeon) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/**
 * 배정된 학생별 파스텔 색 (RGB 6자리). 이름 가나다순으로 팔레트를 순서대로 배정해서
 * 같은 방 안에서는 색이 겹치지 않는다 (팔레트 12색 초과 시 순환).
 */
export function studentColors(assignments: Record<string, string>): Map<string, string> {
  const names = [
    ...new Set(
      Object.values(assignments).flatMap(s => s.split(/[,·/]+/).map(x => x.trim()).filter(Boolean)),
    ),
  ].sort((a, b) => a.localeCompare(b, "ko"));
  return new Map(names.map((n, i) => [n, PALETTE[i % PALETTE.length]]));
}

export function fmtTime(min: number): string {
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function fmtDateHeader(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()} (${WEEKDAYS[d.getDay()]})`;
}

export function roomLabel(room: string): string {
  return /^\d+$/.test(room) ? `${room}번 방` : room;
}

/** 원본 배정표와 같은 "환자번호_환자명:수술명_교수_방" 문자열 (엑셀 다운로드용) */
export function caseText(c: OrCase): string {
  return `${c.patientNo}_${c.patientName}:${c.opName}_${c.surgeon}_${c.room}`;
}

// ───────────── 외래 배정 ─────────────

export interface OrClinic {
  id: string;
  date: string; // "2026-07-06"
  ampm: "AM" | "PM";
  prof: string;
  student: string; // 배정 학생 (쉼표로 여러 명)
}

export const AMPM_LABEL: Record<"AM" | "PM", string> = { AM: "오전", PM: "오후" };

/** 외래 블록이 차지하는 그리드 구간: 오전 9~12시, 오후 13:30~17시 */
export function clinicRange(ampm: "AM" | "PM"): { start: number; end: number } {
  return ampm === "AM" ? { start: 9 * 60, end: 12 * 60 } : { start: 13 * 60 + 30, end: 17 * 60 };
}

// ───────────── 추가 일정 (공용) ─────────────

/** 외래·수술이 아닌 임의의 공용 일정 (자유 시작~끝 시간 + 이름) */
export interface OrEvent {
  id: string;
  date: string; // "2026-07-06"
  start: number; // 분 (자정 기준)
  end: number; // 분
  name: string;
}

/** "09:30" → 570(분). 형식이 이상하면 null */
export function hmToMin(hm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  const h = +m[1];
  const min = +m[2];
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** 570 → "09:30" (input[type=time] 초기값용) */
export function minToHm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/** 분 → "3h30m" (대시보드 총 수술시간 요약용) */
export function fmtHours(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h${m}m`;
  return h ? `${h}h` : `${m}m`;
}

/** 업로드 시각 → "3/4 (23:20) 기준" */
export function fmtStamp(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} (${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}) 기준`;
}

// ───────────── 재업로드 변경 감지 ─────────────

export interface OrChange {
  type: "new" | "time" | "removed";
  text: string;
}

/**
 * 기존 시간표와 새로 올린 시간표를 비교한다.
 * - 같은 수술(환자번호+환자명+수술명)은 날짜/시간/방이 바뀌면 "time" 변경으로,
 *   기존 학생 배정은 새 idx로 이어받는다. idxMap(옛 idx→새 idx)으로 메모 등도 이어받을 수 있다.
 * - 짝이 없으면 신규(new) / 사라짐(removed).
 */
export function diffCases(
  oldCases: OrCase[],
  newCases: OrCase[],
  oldAssignments: Record<string, string>,
): { changes: OrChange[]; assignments: Record<string, string>; idxMap: Record<string, string> } {
  const keyOf = (c: OrCase) => `${c.patientNo}|${c.patientName}|${c.opName}`;
  const when = (c: OrCase) => `${fmtDateHeader(c.date)} ${fmtTime(c.startMin)}`;
  const oldByKey = new Map<string, OrCase[]>();
  for (const c of oldCases) {
    const k = keyOf(c);
    const q = oldByKey.get(k);
    if (q) q.push(c);
    else oldByKey.set(k, [c]);
  }

  const changes: OrChange[] = [];
  const assignments: Record<string, string> = {};
  const idxMap: Record<string, string> = {};
  for (const n of newCases) {
    const o = oldByKey.get(keyOf(n))?.shift();
    if (!o) {
      changes.push({ type: "new", text: `${n.patientName} · ${n.opName} (${n.surgeon}) — ${when(n)}` });
      continue;
    }
    idxMap[String(o.idx)] = String(n.idx);
    const a = oldAssignments[String(o.idx)];
    if (a) assignments[String(n.idx)] = a;
    if (o.date !== n.date || o.startMin !== n.startMin || o.room !== n.room) {
      const roomNote = o.room !== n.room ? ` (${roomLabel(o.room)}→${roomLabel(n.room)})` : "";
      changes.push({ type: "time", text: `${n.patientName} (${n.surgeon}): ${when(o)} → ${when(n)}${roomNote}` });
    }
  }
  for (const q of oldByKey.values()) {
    for (const o of q) {
      changes.push({ type: "removed", text: `${o.patientName} · ${o.opName} (${o.surgeon}) — ${when(o)}` });
    }
  }
  return { changes, assignments, idxMap };
}
