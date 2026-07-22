import React from "react";
import { parseWiki, type WikiHeading } from "@/utils/wikiMarkup";

// 나무위키 링크 색 (라이트/다크)
const LINK_CLS =
  "text-[#0275d8] dark:text-sky-400 hover:underline cursor-pointer break-all";
// 나무위키의 "없는 문서" 빨간 링크 — 눌러서 바로 새 문서를 만들 수 있음
const DEADLINK_CLS = "text-red-500 dark:text-red-400 hover:underline cursor-pointer break-all";

/** 인라인 나무마크 — 순서 중요: ''' 가 '' 보다 먼저 */
const INLINE_SRC =
  "'''(?<b>[\\s\\S]+?)'''" +
  "|''(?<i>[\\s\\S]+?)''" +
  "|~~(?<s1>[\\s\\S]+?)~~" +
  "|--(?<s2>[^-\\s][\\s\\S]*?)--" +
  "|__(?<u>[\\s\\S]+?)__" +
  "|\\^\\^(?<sup>[\\s\\S]+?)\\^\\^" +
  "|,,(?<sub>[\\s\\S]+?),," +
  "|\\[\\[(?<lt>[^\\]|]+?)(?:\\|(?<ll>[^\\]]+?))?\\]\\]" +
  "|\\[\\*\\s?(?<fn>(?:[^\\[\\]]|\\[\\[[^\\]]*?\\]\\])*?)\\]" +
  "|(?<url>https?:\\/\\/[^\\s<>\"]+)";

interface RenderCtx {
  notes: string[]; // 각주 내용 (등장 순서)
  existingTitles: string[];
  onGoDoc?: (title: string) => void;
}

function renderInline(text: string, ctx: RenderCtx, keyPrefix: string): React.ReactNode[] {
  const re = new RegExp(INLINE_SRC, "g");
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const g = m.groups!;
    const k = `${keyPrefix}-${i++}`;
    if (g.b != null) out.push(<strong key={k}>{renderInline(g.b, ctx, k)}</strong>);
    else if (g.i != null) out.push(<em key={k}>{renderInline(g.i, ctx, k)}</em>);
    else if (g.s1 != null || g.s2 != null)
      out.push(<del key={k}>{renderInline(g.s1 ?? g.s2, ctx, k)}</del>);
    else if (g.u != null) out.push(<u key={k}>{renderInline(g.u, ctx, k)}</u>);
    else if (g.sup != null) out.push(<sup key={k}>{renderInline(g.sup, ctx, k)}</sup>);
    else if (g.sub != null) out.push(<sub key={k}>{renderInline(g.sub, ctx, k)}</sub>);
    else if (g.lt != null) {
      const target = g.lt.trim();
      const label = g.ll?.trim() || target;
      if (/^https?:\/\//.test(target)) {
        out.push(
          <a key={k} href={target} target="_blank" rel="noopener noreferrer" className={LINK_CLS}>
            {label}
            <span className="text-[0.7em] align-super ml-0.5">↗</span>
          </a>
        );
      } else if (ctx.existingTitles.includes(target)) {
        out.push(
          <a key={k} onClick={() => ctx.onGoDoc?.(target)} className={LINK_CLS}>
            {label}
          </a>
        );
      } else {
        out.push(
          <a key={k} onClick={() => ctx.onGoDoc?.(target)} className={DEADLINK_CLS} title="아직 없는 문서 — 눌러서 만들기">
            {label}
          </a>
        );
      }
    } else if (g.fn != null) {
      ctx.notes.push(g.fn);
      const n = ctx.notes.length;
      out.push(
        <sup key={k} id={`rfn-${n}`}>
          <a
            className={`${LINK_CLS} font-bold`}
            onClick={() => document.getElementById(`fn-${n}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
          >
            [{n}]
          </a>
        </sup>
      );
    } else if (g.url != null) {
      out.push(
        <a key={k} href={g.url} target="_blank" rel="noopener noreferrer" className={LINK_CLS}>
          {g.url}
        </a>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** 여러 줄을 <br/>로 이어 렌더 */
const Lines: React.FC<{ lines: string[]; ctx: RenderCtx; k: string }> = ({ lines, ctx, k }) => (
  <>
    {lines.map((l, i) => (
      <React.Fragment key={i}>
        {i > 0 && <br />}
        {renderInline(l, ctx, `${k}-${i}`)}
      </React.Fragment>
    ))}
  </>
);

const HEAD_SIZE: Record<number, string> = {
  2: "text-xl",
  3: "text-lg",
  4: "text-base",
};

interface WikiContentProps {
  content: string;
  /** 목차 박스 표시 (문서 전체 보기에서만) */
  showToc?: boolean;
  /** 문단 [편집] 클릭 — tocIndex 전달. 없으면 [편집] 링크 숨김 */
  onEditSection?: (tocIndex: number) => void;
  /** [[문서명]] 내부 링크 클릭 (없는 문서도 눌러서 생성) */
  onGoDoc?: (title: string) => void;
  /** 존재하는 문서 제목들 — 링크 색 결정 (있으면 파랑, 없으면 빨강) */
  existingTitles?: string[];
}

/** 나무위키풍 본문 렌더러: 목차 → 본문(문단 번호 + [편집]) → 각주 */
export const WikiContent: React.FC<WikiContentProps> = ({
  content,
  showToc = true,
  onEditSection,
  onGoDoc,
  existingTitles = [],
}) => {
  const { toc, blocks } = parseWiki(content);
  const ctx: RenderCtx = { notes: [], existingTitles, onGoDoc };

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  // 본문을 먼저 렌더해야 각주 번호(ctx.notes)가 채워짐
  let headIdx = -1;
  const body = blocks.map((blk, bi) => {
    switch (blk.type) {
      case "heading": {
        headIdx += 1;
        const idx = headIdx;
        const h: WikiHeading = blk.h;
        return (
          <div
            key={bi}
            id={h.id}
            className={`flex items-baseline gap-2 mt-7 mb-3 pb-1.5 border-b border-slate-300 dark:border-slate-700 scroll-mt-4 ${HEAD_SIZE[h.level]}`}
          >
            <span className="font-bold text-slate-800 dark:text-slate-100">
              <span className="text-slate-500 dark:text-slate-400 mr-1.5">{h.num}.</span>
              {renderInline(h.title, ctx, `h-${bi}`)}
            </span>
            {onEditSection && (
              <a
                onClick={() => onEditSection(idx)}
                className="text-xs font-normal text-[#0275d8] dark:text-sky-400 cursor-pointer hover:underline shrink-0"
              >
                [편집]
              </a>
            )}
          </div>
        );
      }
      case "para":
        return (
          <p key={bi} className="my-2 text-[15px] leading-7 text-slate-700 dark:text-slate-300 break-words">
            <Lines lines={blk.lines} ctx={ctx} k={`p-${bi}`} />
          </p>
        );
      case "list": {
        const Tag = blk.ordered ? "ol" : "ul";
        return (
          <Tag
            key={bi}
            className={`my-2 pl-6 space-y-1 text-[15px] leading-7 text-slate-700 dark:text-slate-300 ${
              blk.ordered ? "list-decimal" : "list-disc"
            }`}
          >
            {blk.items.map((it, ii) => (
              <li key={ii} className="break-words">
                {it ? renderInline(it, ctx, `l-${bi}-${ii}`) : " "}
              </li>
            ))}
          </Tag>
        );
      }
      case "quote":
        return (
          <blockquote
            key={bi}
            className="my-2 px-3.5 py-2 border-l-4 border-[#00a495] bg-slate-50 dark:bg-slate-800/40 rounded-r-lg text-[15px] leading-7 text-slate-600 dark:text-slate-300"
          >
            <Lines lines={blk.lines} ctx={ctx} k={`q-${bi}`} />
          </blockquote>
        );
      case "hr":
        return <hr key={bi} className="my-5 border-slate-200 dark:border-slate-700" />;
    }
  });

  return (
    <div>
      {/* 목차 (나무위키식 박스) */}
      {showToc && toc.length > 0 && (
        <div className="inline-block min-w-[55%] border border-slate-300 dark:border-slate-700 rounded-lg px-5 py-3.5 my-4 bg-slate-50/50 dark:bg-slate-800/30">
          <p className="font-bold text-slate-800 dark:text-slate-100 mb-2">목차</p>
          <div className="space-y-1 text-sm">
            {toc.map((h, i) => (
              <p key={i} className={h.level === 2 ? "" : h.level === 3 ? "pl-4" : "pl-8"}>
                <a onClick={() => scrollTo(h.id)} className={LINK_CLS}>
                  {h.num}. {h.title}
                </a>
              </p>
            ))}
          </div>
        </div>
      )}

      {body}

      {/* 각주 */}
      {ctx.notes.length > 0 && (
        <div className="mt-8 pt-3 border-t border-slate-300 dark:border-slate-700 space-y-1.5">
          {ctx.notes.map((note, i) => (
            <p key={i} id={`fn-${i + 1}`} className="text-[13px] leading-6 text-slate-500 dark:text-slate-400 scroll-mt-4">
              <a
                className={`${LINK_CLS} font-bold mr-1.5`}
                onClick={() =>
                  document.getElementById(`rfn-${i + 1}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
              >
                [{i + 1}]
              </a>
              {renderInline(note, { ...ctx, notes: [] }, `fn-${i}`)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
