import type { Closure } from "@/types";

// 스케줄 기본 과명(괄호·숫자 제거 후) → 진료과 코드
// 소아청소년과 하위 코드(PE/PH/PN/PP/PR/PV)는 별도 Set으로 처리
const SCHED_BASE_TO_CODE: Record<string, string> = {
  "소화기내과": "GE",
  "호흡기내과": "CM",
  "심장내과": "CV",
  "신장내과": "NE",
  "류마티스내과": "RM",
  "혈액종양내과": "HO",
  "내분비내과": "EM",       // 스케줄: 내분비내과, 코드표: 내분비대사내과(EM)
  "감염내과": "ID",
  "정형외과": "OS",
  "신경과": "NR",
  "정신건강의학": "NP",     // 스케줄: 정신건강의학(과 없음)
  "산부인과": "OG",
  "소아청소년과": "PD",
  "외과": "GS",
  "영상의학과": "RD",
  "진단검사의학": "CP",     // 스케줄: 진단검사의학(과 없음)
  "마취통증의학과": "AN",
  "신경외과": "NS",
  "안과": "OT",
  "이비인후과": "OL",
  "재활의학과": "RE",
  "병리과": "AP",
  "응급의학과": "ER",
  "가정의학과": "FM",
  "직업환경의학과": "OM",
  "핵의학과": "NM",
  "피부과": "DM",
  "치과": "DS",
  "방사선종양학과": "RO",
  "성형외과": "PS",
  "심장혈관흉부외과": "TS",
  "심창혈관흉부외과": "TS", // 스케줄 오타 처리
  "비뇨의학과": "UR",
  "소아외과": "SP",
  "외상외과": "TR",
  "정형외과수부외과": "OH",
  "성형외과수부외과": "HS",
  "통증클리닉": "PC",
};

// 소아청소년과 하위 코드 (모두 소아청소년과 실습 시 표시)
const PEDS_CODES = new Set(["PD", "PE", "PH", "PN", "PP", "PR", "PV"]);

// 서울·구리 구분 없이 두 병원 휴진 모두 표시하는 과
const MERGED_BASES = new Set(["산부인과", "외과", "소아청소년과"]);

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// "소화기내과1(서울)" → "소화기내과", "산부인과(서울B)" → "산부인과"
function extractBase(deptName: string): string {
  return deptName.replace(/\d*(\([^)]*\))?$/, "").trim();
}

function extractHospital(deptName: string): "서울" | "구리" | null {
  if (deptName.includes("서울")) return "서울";
  if (deptName.includes("구리")) return "구리";
  return null;
}

export function getRelevantClosures(
  closures: Closure[],
  weekStart: Date,
  weekEnd: Date,
  deptName: string
): Closure[] {
  const base = extractBase(deptName);
  const schedCode = SCHED_BASE_TO_CODE[base];
  if (!schedCode) return [];

  const hospital = extractHospital(deptName);
  const isMerged = MERGED_BASES.has(base);

  const filtered = closures.filter(c => {
    const codeMatch =
      base === "소아청소년과" ? PEDS_CODES.has(c.dept_code) : c.dept_code === schedCode;
    if (!codeMatch) return false;

    const start = parseLocalDate(c.start_date);
    const end = parseLocalDate(c.end_date);
    if (start > weekEnd || end < weekStart) return false;

    if (isMerged) return true;
    return !hospital || c.hospital === hospital;
  });

  // 같은 의사·날짜·사유 중복 제거
  const seen = new Set<string>();
  return filtered.filter(c => {
    const key = `${c.doctor_name}|${c.start_date}|${c.end_date}|${c.reason}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
