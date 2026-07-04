/**
 * 수술 배정표(E345 배정.xlsx 등)에서 뽑은 수술 건 하나.
 * 시간은 자정 기준 분(minute) 단위.
 */
export interface OrCase {
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

export function buildGrid(cases: OrCase[]): SectionGrid {
  const dates = [...new Set(cases.map(c => c.date))].sort();
  let startMin = 8 * 60;
  let endMin = 17 * 60;
  for (const c of cases) {
    startMin = Math.min(startMin, Math.floor(c.startMin / SLOT_MIN) * SLOT_MIN);
    endMin = Math.max(endMin, Math.ceil((c.startMin + c.durMin) / SLOT_MIN) * SLOT_MIN);
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
