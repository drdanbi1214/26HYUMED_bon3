// 실습나무위키 마크업 파서 — 나무위키(나무마크) 문법의 부분집합을 거의 동일하게 지원.
//
// 블록 문법:
//   == 제목 == / === 소제목 === / ==== 소소제목 ====   문단 (목차에 1. / 1.1. / 1.1.1. 번호)
//   * 항목  또는  - 항목                              목록 (앞 공백 허용)
//   1. 항목                                          번호 목록
//   > 내용                                           인용문
//   ----                                             수평줄 (- 4개 이상)
//   ## 내용                                          주석 (편집창에서만 보이고 문서에는 안 나옴)
//
// 인라인 문법(렌더링은 WikiContent.tsx):
//   '''굵게''' ''기울임'' ~~취소선~~ --취소선-- __밑줄__ ^^윗첨자^^ ,,아랫첨자,,
//   [[문서명]] [[문서명|보이는 이름]] [[https://주소|이름]] [* 각주 내용] https://자동링크

export interface WikiHeading {
  level: 2 | 3 | 4;
  num: string; // "1", "1.1", "1.1.1" …
  title: string;
  id: string; // 스크롤 앵커용 "s-1", "s-1-1"
}

export type WikiBlock =
  | { type: "heading"; h: WikiHeading }
  | { type: "para"; lines: string[] }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; lines: string[] }
  | { type: "hr" };

export interface WikiDocTree {
  toc: WikiHeading[];
  blocks: WikiBlock[];
}

// 나무위키 접기 문단(==# 제목 #==)도 일반 문단으로 취급해서 매치
const HEADING_RE = /^(={2,4})(#?)\s*(.+?)\s*\2\1$/;

export function parseWiki(src: string): WikiDocTree {
  const toc: WikiHeading[] = [];
  const blocks: WikiBlock[] = [];
  let n2 = 0;
  let n3 = 0;
  let n4 = 0;
  let para: string[] = [];
  let quote: string[] = [];
  let list: string[] = [];
  let listOrdered = false;

  const flushPara = () => {
    if (para.length) blocks.push({ type: "para", lines: para });
    para = [];
  };
  const flushQuote = () => {
    if (quote.length) blocks.push({ type: "quote", lines: quote });
    quote = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ type: "list", ordered: listOrdered, items: list });
    list = [];
  };
  const flushAll = () => {
    flushPara();
    flushQuote();
    flushList();
  };

  for (const raw of src.split("\n")) {
    const line = raw.trimEnd();

    // 주석: 문서에는 안 보임 (나무위키 ## 문법)
    if (/^\s*##/.test(line)) continue;

    const mh = line.match(HEADING_RE);
    if (mh) {
      flushAll();
      const level = mh[1].length as 2 | 3 | 4;
      if (level === 2) {
        n2 += 1;
        n3 = 0;
        n4 = 0;
      } else if (level === 3) {
        n3 += 1;
        n4 = 0;
      } else {
        n4 += 1;
      }
      // 상위 문단 없이 하위 문단부터 쓴 경우에도 번호가 나오도록 0은 1로 취급
      const a = n2 || 1;
      const b = n3 || 1;
      const num = level === 2 ? `${a}` : level === 3 ? `${a}.${n3 || 1}` : `${a}.${b}.${n4 || 1}`;
      const h: WikiHeading = { level, num, title: mh[3], id: `s-${num.replace(/\./g, "-")}` };
      toc.push(h);
      blocks.push({ type: "heading", h });
      continue;
    }

    if (/^-{4,}$/.test(line)) {
      flushAll();
      blocks.push({ type: "hr" });
      continue;
    }

    const mq = line.match(/^>\s?(.*)$/);
    if (mq) {
      flushPara();
      flushList();
      quote.push(mq[1]);
      continue;
    }

    const mUl = line.match(/^\s*[*-]\s+(.*)$/);
    const mOl = !mUl && line.match(/^\s*\d+\.\s+(.*)$/);
    if (mUl || mOl) {
      flushPara();
      flushQuote();
      const ordered = Boolean(mOl);
      if (list.length && listOrdered !== ordered) flushList();
      listOrdered = ordered;
      list.push((mUl || mOl)![1].trim());
      continue;
    }

    if (line.trim() === "") {
      flushAll();
      continue;
    }

    flushQuote();
    flushList();
    para.push(line);
  }
  flushAll();
  return { toc, blocks };
}

/**
 * 문단별 편집용: sectionIndex(=toc 배열 인덱스)번째 문단의 원문 범위를 잘라낸다.
 * 문단 = 해당 제목 줄부터, 같거나 더 높은 레벨의 다음 제목 직전까지 (하위 문단 포함).
 * 편집 후에는 [...before, ...수정본.split("\n"), ...after].join("\n") 으로 재조립.
 */
export interface SectionSlice {
  before: string[];
  text: string;
  after: string[];
  title: string;
}

export function sliceSection(src: string, sectionIndex: number): SectionSlice | null {
  const lines = src.split("\n");
  const heads: { line: number; level: number; title: string }[] = [];
  lines.forEach((l, i) => {
    const m = l.trimEnd().match(HEADING_RE);
    if (m) heads.push({ line: i, level: m[1].length, title: m[3] });
  });
  const h = heads[sectionIndex];
  if (!h) return null;
  let end = lines.length;
  for (const nh of heads) {
    if (nh.line > h.line && nh.level <= h.level) {
      end = nh.line;
      break;
    }
  }
  return {
    before: lines.slice(0, h.line),
    text: lines.slice(h.line, end).join("\n"),
    after: lines.slice(end),
    title: h.title,
  };
}
