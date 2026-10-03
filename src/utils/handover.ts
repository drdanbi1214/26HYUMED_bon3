import { RAW_DATA } from "@/data/schedule";
import type { HandoverEntry } from "@/data/handoverDemo";

export interface ImportedHandoverDocument {
  sourceName: string;
  dept: string | null;
  entriesByWeek: Record<number, HandoverEntry[]>;
}

const TAG = /\(([1-3]:(?:[1-9]|1[0-2]))\)/g;

/** 1:9 같은 표기를 전체 실습 주차(9주차)로 바꾼다. */
export const weekOfTag = (tag: string) => {
  const [block, week] = tag.split(":").map(Number);
  return (block - 1) * 12 + week;
};

/** "26-류마티스내과-인계 (서울).md" → 스케줄의 "류마티스내과(서울)" */
export function inferDeptFromFilename(fileName: string): string | null {
  const bareName = fileName.replace(/\.[^.]+$/, "");
  const handoverName = bareName.match(/^\d{2}[-_](.+?)[-_ ]*인계\s*\((서울(?:\+구리)?|구리)\)/);
  const cleaned = handoverName
    ? `${handoverName[1].replace(/\s+/g, "")}(${handoverName[2]})`
    : bareName.replace(/^\d{2}[-_]/, "").replace(/[-_ ]*인계\s*/i, "").replace(/\s+/g, "").trim();
  const departments = Array.from(new Set(RAW_DATA.map(row => row[0])));
  return departments.find(dept => dept.replace(/\s+/g, "") === cleaned) ?? (cleaned || null);
}

/**
 * 일정표에는 심장내과1, 산부인과(서울A)처럼 분반 표기가 있고,
 * 인계 파일은 심장내과·산부인과 단위로 한 장인 경우가 있다.
 * 같은 과·같은 병원이라면 해당 인계를 모두 보여준다.
 */
export function matchesHandoverDepartment(documentDept: string | null, scheduledDept: string) {
  if (!documentDept) return false;
  const key = (value: string) => value
    .replace(/\s+/g, "")
    .replace(/^정신과\(/, "정신건강의학(")
    .replace(/\d+(?=\()/g, "")
    .replace(/\((서울|구리)[A-D]\)/g, "($1)");
  const documentKey = key(documentDept);
  const scheduledKey = key(scheduledDept);
  return documentKey === scheduledKey ||
    (documentKey.includes("(서울+구리)") &&
      ["(서울)", "(구리)"].some(location => documentKey.replace("(서울+구리)", location) === scheduledKey));
}

/**
 * 마크다운 인계의 (1:9) 태그를 찾아 탭·상위 항목·문장으로 분해한다.
 * (1:6)(1:7)(1:9) 동일처럼 연속된 태그는 뒤 문장을 각 주차에 모두 넣는다.
 */
export function parseHandoverMarkdown(sourceName: string, markdown: string): ImportedHandoverDocument {
  const entriesByWeek: Record<number, HandoverEntry[]> = {};
  let headings: { level: number; title: string }[] = [];

  for (const rawLine of markdown.split(/\r?\n/)) {
    const heading = rawLine.match(/^(#{1,6})\s+(.+)/);
    if (heading) {
      headings = [
        ...headings.filter(item => item.level < heading[1].length),
        { level: heading[1].length, title: heading[2].replace(/\\/g, "").trim() },
      ];
      continue;
    }

    let text = rawLine.trim();
    if (!text || !TAG.test(text)) {
      TAG.lastIndex = 0;
      continue;
    }
    TAG.lastIndex = 0;
    let tab = "";
    if (text.startsWith("|")) {
      const cells = text.split("|");
      tab = (cells[1] ?? "").replace(/\\/g, "").trim();
      text = cells.slice(2, -1).join("|").trim();
    } else {
      text = text.replace(/^[-*]\s*/, "");
    }

    const matches = [...text.matchAll(TAG)];
    for (let i = 0; i < matches.length; i++) {
      let groupEnd = i;
      while (
        groupEnd + 1 < matches.length &&
        text.slice((matches[groupEnd].index ?? 0) + matches[groupEnd][0].length, matches[groupEnd + 1].index).trim() === ""
      ) groupEnd++;

      const start = (matches[groupEnd].index ?? 0) + matches[groupEnd][0].length;
      const end = groupEnd + 1 < matches.length ? (matches[groupEnd + 1].index ?? text.length) : text.length;
      // 표 한 줄 안에서 다음 공통 소제목(**8. Initial findings** 등)이
      // 태그 없이 바로 이어지는 문서가 있다. 그 안내문을 직전 조의
      // 인계로 잘못 붙이지 않도록, 새 번호 소제목 앞에서 끊는다.
      const taggedContent = text.slice(start, end);
      const nextSharedSection = taggedContent.search(/\*\*\d+\\?\.\s/);
      const content = taggedContent.slice(0, nextSharedSection >= 0 ? nextSharedSection : undefined).trim()
        .replace(/\\([~!+>])/g, "$1").replace(/\*\*/g, "").replace(/~~/g, "").replace(/\s+/g, " ")
        .replace(/\s*\|\s*$/, "");
      if (!content) continue;

      for (let j = i; j <= groupEnd; j++) {
        const week = weekOfTag(matches[j][1]);
        (entriesByWeek[week] ??= []).push({
          section: headings.map(item => item.title).join(" > ") || "요약",
          tab,
          content,
        });
      }
      i = groupEnd;
    }
  }

  return { sourceName, dept: inferDeptFromFilename(sourceName), entriesByWeek };
}
