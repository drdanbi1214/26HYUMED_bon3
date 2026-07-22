import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { WikiGate } from "@/components/wiki/WikiGate";
import { WikiContent } from "@/components/wiki/WikiContent";
import { useWikiDoc, useWikiIndex, wikiHref, type WikiRevision } from "@/hooks/useWiki";
import { sliceSection } from "@/utils/wikiMarkup";
import { useToast } from "@/components/ui/Toast";

const NAMU_GREEN = "#00a495";

/** 나무위키식 "최근 수정 시각: 2026-07-22 14:33:05" */
const fmtFull = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const fmtShort = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// 빈 문서를 처음 편집할 때 넣어주는 뼈대
const TEMPLATE = `== 개요 ==
내용을 적어주세요.
`;

interface WikiDocPageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

export const WikiDocPage: React.FC<WikiDocPageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  // 하위 문서(외과/회진)도 받을 수 있게 /wiki/* 스플랫 라우트 사용
  const { "*": splat = "" } = useParams();
  const title = splat.split("/").filter(Boolean).map(decodeURIComponent).join("/");

  useEffect(() => {
    if (!title) navigate("/wiki", { replace: true });
  }, [title, navigate]);
  if (!title) return null;

  return (
    <>
      <Header
        title="🌳 실습나무위키"
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate("/wiki")}
      />
      <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 pb-16">
        <WikiGate>
          <DocBody title={title} />
        </WikiGate>
      </div>
    </>
  );
};

type Mode = "view" | "edit" | "history";

const DocBody: React.FC<{ title: string }> = ({ title }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { content, updatedAt, loading, error, saving, refetch, save, listRevisions } =
    useWikiDoc(title);
  const { index } = useWikiIndex();

  const existingTitles = Object.keys(index);
  // 계층: "외과/회진" → 상위 문서 "외과", 하위 문서는 "제목/…"으로 시작하는 문서들
  const parent = title.includes("/") ? title.split("/").slice(0, -1).join("/") : null;
  const children = existingTitles
    .filter(t => t.startsWith(`${title}/`))
    .sort((a, b) => a.localeCompare(b, "ko"));

  const [mode, setMode] = useState<Mode>("view");
  const [tab, setTab] = useState<"raw" | "preview">("raw");
  const [draft, setDraft] = useState("");
  const [summary, setSummary] = useState("");
  // 문단별 편집일 때 잘라낸 앞/뒤 원문 (전체 편집이면 null)
  const [sectionCtx, setSectionCtx] = useState<{ before: string[]; after: string[]; title: string } | null>(null);

  const goDoc = (t: string) => navigate(wikiHref(t));

  /** 편집 시작: sectionIndex가 null이면 전체, 아니면 그 문단만 (나무위키의 문단별 [편집]) */
  const openEditor = (sectionIndex: number | null) => {
    if (sectionIndex === null) {
      setDraft(content.trim() ? content : TEMPLATE);
      setSectionCtx(null);
    } else {
      const slice = sliceSection(content, sectionIndex);
      if (!slice) return;
      setDraft(slice.text);
      setSectionCtx({ before: slice.before, after: slice.after, title: slice.title });
    }
    setSummary("");
    setTab("raw");
    setMode("edit");
  };

  const doSave = async () => {
    const full = sectionCtx
      ? [...sectionCtx.before, ...draft.split("\n"), ...sectionCtx.after].join("\n")
      : draft;
    const r = await save(full, summary.trim());
    if (r.status === "conflict") {
      if (
        window.confirm(
          "편집 충돌! 저장하는 사이에 다른 사람이 이 문서를 먼저 수정했어요.\n\n" +
            "[확인] 내 편집으로 덮어쓰기 (상대방의 판도 역사에 남아 있어요)\n" +
            "[취소] 저장 중단하고 편집 계속하기"
        )
      ) {
        const r2 = await save(full, summary.trim() || "편집 충돌 덮어쓰기", true);
        if (r2.status === "ok") {
          toast.success("저장했어요.");
          setMode("view");
        } else if (r2.status === "error") toast.error(`저장 실패: ${r2.message}`);
      }
      return;
    }
    if (r.status === "error") {
      toast.error(`저장 실패: ${r.message}`);
      return;
    }
    toast.success("저장했어요. 🌳");
    setMode("view");
  };

  if (loading) {
    return (
      <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl animate-pulse" />
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 rounded-3xl p-8 text-center shadow-sm">
        <div className="text-4xl mb-4">😵</div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
          문서를 불러오지 못했어요
        </p>
        <p className="text-[11px] text-slate-400 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="px-5 py-2 rounded-xl bg-[#00a495] text-white text-sm font-bold shadow-md active:scale-95 transition-all"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-900/10">
      {/* 나무위키풍 초록 상단 바 */}
      <div className="flex items-center justify-between px-5 py-3" style={{ background: NAMU_GREEN }}>
        <button onClick={() => navigate("/wiki")} className="text-sm font-black text-white active:scale-95 transition-all">
          🌳 실습나무위키
        </button>
        <span className="text-[10px] text-white/80">
          {mode === "edit" ? "편집 중" : mode === "history" ? "문서 역사" : "함께 가꾸는 문서"}
        </span>
      </div>

      <div className="p-5">
        {/* 문서 제목줄 + 편집/역사 버튼 */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 break-all">
            {title}
            {mode === "edit" && sectionCtx && (
              <span className="ml-2 text-sm font-bold text-slate-400">
                — "{sectionCtx.title}" 문단 편집
              </span>
            )}
            {mode === "edit" && !sectionCtx && (
              <span className="ml-2 text-sm font-bold text-slate-400">(편집)</span>
            )}
          </h1>
          {mode === "view" && (
            <div className="flex gap-1.5">
              <button
                onClick={() => openEditor(null)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
              >
                ✏️ 편집
              </button>
              <button
                onClick={() => setMode("history")}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
              >
                🕐 역사
              </button>
            </div>
          )}
        </div>

        {mode === "view" && (
          <>
            <p className="mt-1 text-right text-[11px] text-slate-400 dark:text-slate-500">
              최근 수정 시각: {updatedAt ? fmtFull(updatedAt) : "—"}
            </p>
            <div className="mt-2 pb-2 text-xs border-b border-slate-200 dark:border-slate-700 space-y-1">
              <p>
                <span className="text-slate-400 dark:text-slate-500 mr-1.5">분류:</span>
                <span
                  className="font-bold cursor-pointer hover:underline"
                  style={{ color: NAMU_GREEN }}
                  onClick={() => navigate("/wiki")}
                >
                  실습나무위키
                </span>
              </p>
              {parent && (
                <p>
                  <span className="text-slate-400 dark:text-slate-500 mr-1.5">상위 문서:</span>
                  <a
                    onClick={() => goDoc(parent)}
                    className="font-bold text-[#0275d8] dark:text-sky-400 cursor-pointer hover:underline break-all"
                  >
                    {parent}
                  </a>
                </p>
              )}
              {children.length > 0 && (
                <p className="flex flex-wrap gap-x-2 gap-y-0.5">
                  <span className="text-slate-400 dark:text-slate-500">하위 문서:</span>
                  {children.map(c => (
                    <a
                      key={c}
                      onClick={() => goDoc(c)}
                      className="text-[#0275d8] dark:text-sky-400 cursor-pointer hover:underline break-all"
                    >
                      {c.slice(title.length + 1)}
                    </a>
                  ))}
                </p>
              )}
            </div>

            {content.trim() ? (
              <WikiContent
                content={content}
                showToc
                onEditSection={i => openEditor(i)}
                onGoDoc={goDoc}
                existingTitles={existingTitles}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🌱</div>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">
                  이 문서는 아직 없습니다
                </p>
                <p className="text-[11px] text-slate-400 mb-5">첫 편집자가 되어 나무를 심어주세요!</p>
                <button
                  onClick={() => openEditor(null)}
                  className="px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md active:scale-95 transition-all"
                  style={{ background: NAMU_GREEN }}
                >
                  ✏️ 새 문서 만들기
                </button>
              </div>
            )}

            {content.trim() && (
              <p className="mt-8 text-center text-[10px] text-slate-400 dark:text-slate-600">
                누구나 편집할 수 있어요. 모든 판은 역사에 남아 언제든 되돌릴 수 있어요 🌳
              </p>
            )}
          </>
        )}

        {mode === "edit" && (
          <Editor
            draft={draft}
            setDraft={setDraft}
            summary={summary}
            setSummary={setSummary}
            tab={tab}
            setTab={setTab}
            saving={saving}
            isSection={Boolean(sectionCtx)}
            onSave={() => doSave()}
            onCancel={() => setMode("view")}
            goDoc={goDoc}
            existingTitles={existingTitles}
          />
        )}

        {mode === "history" && (
          <History
            listRevisions={listRevisions}
            saving={saving}
            onBack={() => setMode("view")}
            onRevert={async (rev, num) => {
              if (!window.confirm(`r${num} 판으로 문서를 되돌릴까요?\n(되돌린 것도 새 판으로 역사에 남아요)`)) return;
              const r = await save(rev.content, `r${num} 판으로 되돌림`, true);
              if (r.status === "ok") {
                toast.success(`r${num} 판으로 되돌렸어요.`);
                setMode("view");
              } else if (r.status === "error") toast.error(`되돌리기 실패: ${r.message}`);
            }}
          />
        )}
      </div>
    </div>
  );
};

/** 나무위키식 편집기: RAW 편집 / 미리보기 탭 + 편집 요약 + 저장 */
const Editor: React.FC<{
  draft: string;
  setDraft: (v: string) => void;
  summary: string;
  setSummary: (v: string) => void;
  tab: "raw" | "preview";
  setTab: (t: "raw" | "preview") => void;
  saving: boolean;
  isSection: boolean;
  onSave: () => void;
  onCancel: () => void;
  goDoc: (t: string) => void;
  existingTitles: string[];
}> = ({ draft, setDraft, summary, setSummary, tab, setTab, saving, isSection, onSave, onCancel, goDoc, existingTitles }) => {
  const tabCls = (active: boolean) =>
    `px-4 py-2 text-sm font-bold border-b-2 transition-all ${
      active
        ? "border-[#00a495] text-[#00a495]"
        : "border-transparent text-slate-400 dark:text-slate-500"
    }`;

  return (
    <div className="mt-3">
      {/* RAW 편집 / 미리보기 탭 (나무위키와 동일) */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-3">
        <button onClick={() => setTab("raw")} className={tabCls(tab === "raw")}>
          RAW 편집
        </button>
        <button onClick={() => setTab("preview")} className={tabCls(tab === "preview")}>
          미리보기
        </button>
      </div>

      {tab === "raw" ? (
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          spellCheck={false}
          className="w-full min-h-[45vh] px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 font-mono text-[13px] leading-6 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#00a495]/30 transition-all resize-y"
        />
      ) : (
        <div className="min-h-[45vh] px-4 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
          <WikiContent content={draft} showToc={!isSection} onGoDoc={goDoc} existingTitles={existingTitles} />
        </div>
      )}

      {/* 문법 도움말 */}
      <details className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 px-4 py-3">
        <summary className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
          📖 나무위키 문법 도움말
        </summary>
        <div className="mt-2 space-y-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400 font-mono">
          <p>== 제목 == · === 소제목 === · ==== 소소제목 ====</p>
          <p>'''굵게''' · ''기울임'' · ~~취소선~~ · __밑줄__ · ^^윗첨자^^ · ,,아랫첨자,,</p>
          <p>* 목록 · 1. 번호 목록 · &gt; 인용문 · ---- 구분선</p>
          <p>[[문서명]] 다른 문서 링크 (없는 문서는 빨갛게) · [[https://주소|이름]] 외부 링크</p>
          <p>[* 각주 내용] 각주 · ## 편집창에서만 보이는 주석</p>
          <p className="font-sans">💡 제목에 /를 넣어 만들면 하위 문서가 돼요 (예: 외과/회진)</p>
        </div>
      </details>

      {/* 편집 요약 (나무위키의 요약 칸) */}
      <input
        value={summary}
        onChange={e => setSummary(e.target.value)}
        placeholder="편집 요약 (선택) — 무엇을 바꿨는지 짧게"
        className="mt-3 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#00a495]/30 transition-all"
      />

      <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
        저장하면 바로 모두에게 보여요. 이전 판은 역사에 남아 언제든 되돌릴 수 있어요. 내용을
        전부 지우고 저장하면 문서가 목록에서 사라져요 (역사에는 남음).
      </p>

      <div className="flex gap-2 justify-end mt-3">
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
        >
          취소
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
          style={{ background: NAMU_GREEN }}
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>
  );
};

/** 문서 역사: rN 판 목록 + 원문 보기 + 되돌리기 (나무위키의 역사 탭) */
const History: React.FC<{
  listRevisions: () => Promise<{ revisions: WikiRevision[]; total: number } | { error: string }>;
  saving: boolean;
  onBack: () => void;
  onRevert: (rev: WikiRevision, num: number) => void;
}> = ({ listRevisions, saving, onBack, onRevert }) => {
  const [revisions, setRevisions] = useState<WikiRevision[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listRevisions().then(r => {
      if (!alive) return;
      if ("error" in r) setError(r.error);
      else {
        setRevisions(r.revisions);
        setTotal(r.total);
      }
    });
    return () => {
      alive = false;
    };
  }, [listRevisions]);

  return (
    <div className="mt-3">
      <button onClick={onBack} className="text-xs font-bold text-[#0275d8] dark:text-sky-400 hover:underline">
        ← 문서로 돌아가기
      </button>

      {error && <p className="mt-4 text-xs text-red-500">{error}</p>}
      {!revisions && !error && (
        <div className="mt-4 h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      )}

      {revisions && revisions.length === 0 && (
        <p className="mt-6 text-center text-xs text-slate-400">아직 편집 역사가 없어요.</p>
      )}

      {revisions && revisions.length > 0 && (
        <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {revisions.map((rev, idx) => {
            const num = total - idx; // 최신이 r{total}
            const older = revisions[idx + 1];
            const diff = older ? rev.content.length - older.content.length : rev.content.length;
            return (
              <div key={rev.id} className="py-3">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-mono font-black" style={{ color: NAMU_GREEN }}>
                    r{num}
                  </span>
                  <span className="text-slate-400">{fmtShort(rev.createdAt)}</span>
                  <span className={`font-mono ${diff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    ({diff >= 0 ? "+" : ""}
                    {diff})
                  </span>
                  {idx === 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      현재 판
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {rev.summary || <span className="italic text-slate-400">요약 없음</span>}
                </p>
                <div className="mt-1.5 flex items-center gap-3">
                  <details className="text-[11px]">
                    <summary className="cursor-pointer text-slate-400 select-none">원문 보기</summary>
                    <pre className="mt-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words max-h-64 overflow-y-auto font-mono text-[11px] leading-5">
                      {rev.content}
                    </pre>
                  </details>
                  {idx !== 0 && (
                    <button
                      onClick={() => onRevert(rev, num)}
                      disabled={saving}
                      className="text-[11px] font-bold text-[#0275d8] dark:text-sky-400 hover:underline disabled:opacity-50"
                    >
                      이 판으로 되돌리기
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
