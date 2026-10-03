import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { MEMBERS, NAME_LOOKUP } from "@/data/members";
import { buildSearchResult } from "@/utils/buildSchedule";
import { fmtD } from "@/utils/date";
import { matchesHandoverDepartment, parseHandoverMarkdown, type ImportedHandoverDocument } from "@/utils/handover";

interface HandoverPageProps { isDark: boolean; onToggleDark: () => void; }
type Group = { dept: string; start: number; end: number; items: { week: number; peers: string[] }[] };
const LOCAL_KEY = "handover_imports_v1";
const RHEUM_FILE = "26-류마티스내과-인계 (서울).md";
const tagOfWeek = (week: number) => `${Math.floor((week - 1) / 12) + 1}:${((week - 1) % 12) + 1}`;
const EXCLUDED_HANDOVER = /^26-(?:외과|산부인과|소아청소년과|정신과|정신건강의학)-인계\s*\((서울(?:\+구리)?|구리)\)/;

/** 이름 검색 → 연속된 과별 토글 → 인계 파일별 토글. */
export const HandoverPage: React.FC<HandoverPageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [pickedName, setPickedName] = useState("");
  const [outerOpen, setOuterOpen] = useState<Set<string>>(new Set());
  const [fileOpen, setFileOpen] = useState<Set<string>>(new Set());
  const [imports, setImports] = useState<ImportedHandoverDocument[]>([]);
  const [bundled, setBundled] = useState<ImportedHandoverDocument | null>(null);
  const [synced, setSynced] = useState<ImportedHandoverDocument[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try { setImports(JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]")); } catch { localStorage.removeItem(LOCAL_KEY); }
    fetch(`/handovers/${encodeURIComponent(RHEUM_FILE)}`)
      .then(response => response.ok ? response.text() : Promise.reject())
      .then(text => setBundled(parseHandoverMarkdown(RHEUM_FILE, text)))
      .catch(() => setNotice("류마티스내과 예시 인계를 불러오지 못했어요."));
    fetch("/handovers/synced/manifest.json")
      .then(response => response.ok ? response.json() : [])
      .then((manifest: { fileName: string; sourceName: string }[]) => Promise.all(manifest.map(async item => {
        const response = await fetch(`/handovers/synced/${encodeURIComponent(item.fileName)}`);
        if (!response.ok) throw new Error(item.sourceName);
        return parseHandoverMarkdown(item.sourceName, await response.text());
      })))
      .then(setSynced)
      .catch(() => setSynced([]));
  }, []);

  const allDocs = useMemo(() => Array.from(new Map([
    ...(bundled ? [bundled] : []),
    ...synced,
    ...imports,
  ].filter(doc => !EXCLUDED_HANDOVER.test(doc.sourceName)).map(doc => [doc.sourceName, doc])).values()), [bundled, synced, imports]);
  const suggestions = useMemo(() => input.trim() ? Object.keys(NAME_LOOKUP).filter(name => name.includes(input.trim())).slice(0, 8) : [], [input]);
  const result = useMemo(() => {
    const found = NAME_LOOKUP[pickedName];
    return found ? buildSearchResult(found.group, found.number, pickedName) : null;
  }, [pickedName]);

  const groups: Group[] = useMemo(() => {
    if (!result) return [];
    const next: Group[] = [];
    for (const week of result.weeks) for (const assignment of week.a) {
      const peers = Array.from(new Set([MEMBERS[result.g][result.n], ...assignment.co].flatMap(names => names.split(",").map(name => name.trim()))));
      const last = next.at(-1);
      if (last?.dept === assignment.dept && last.end === week.w - 1) {
        last.end = week.w; last.items.push({ week: week.w, peers });
      } else next.push({ dept: assignment.dept, start: week.w, end: week.w, items: [{ week: week.w, peers }] });
    }
    return next;
  }, [result]);

  const selectName = (name: string) => { setInput(name); setPickedName(name); setOuterOpen(new Set()); setFileOpen(new Set()); };
  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) => set(previous => {
    const next = new Set(previous); next.has(key) ? next.delete(key) : next.add(key); return next;
  });
  const importFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const parsed = await Promise.all(Array.from(files).map(async file => parseHandoverMarkdown(file.name, await file.text())));
    setImports(previous => {
      const next = [...previous.filter(old => !parsed.some(doc => doc.sourceName === old.sourceName)), ...parsed];
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); return next;
    });
    const unresolved = parsed.filter(doc => !doc.dept).map(doc => doc.sourceName);
    setNotice(unresolved.length ? `과 자동 연결 실패: ${unresolved.join(", ")}` : `${parsed.length}개 파일을 즉시 분석해 연결했어요.`);
  };

  return <>
    <Header title="📚 인계 모아보기" isDark={isDark} onToggleDark={onToggleDark} onBack={() => navigate("/")} />
    <main className="space-y-2 animate-in fade-in slide-in-from-right duration-500 pb-12">
      <details className="rounded-lg border border-teal-200 bg-teal-50/50 text-[11px] text-teal-900 dark:border-teal-900/60 dark:bg-teal-950/20 dark:text-teal-200">
        <summary className="cursor-pointer px-3 py-2 font-bold">인계 파일 추가 (.md) — 업로드 즉시 자동 추출</summary>
        <div className="border-t border-teal-200 px-3 py-2 dark:border-teal-900/60">
          <p className="mb-1.5 leading-4">파일명: <b>26-과이름-인계 (서울).md</b> · 본문 태그: <b>(1:9)</b>. 여러 조 태그가 이어진 문장은 모두에 넣습니다.</p>
          <input type="file" accept=".md,text/markdown,text/plain" multiple onChange={event => void importFiles(event.target.files)} className="block w-full text-[11px]" />
          <p className="mt-1 text-teal-700/80 dark:text-teal-300/70">Drive 동기화 {synced.length}개 · 이 브라우저에 추가된 파일 {imports.length}개</p>
        </div>
      </details>
      {notice && <p className="rounded-md bg-slate-100 px-2 py-1.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{notice}</p>}

      <div className="relative">
        <input value={input} onChange={event => { setInput(event.target.value); setPickedName(""); }} onKeyDown={event => event.key === "Enter" && suggestions.length === 1 && selectName(suggestions[0])} placeholder="이름 검색 (예: 송은우)" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-8 text-sm outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-slate-800 dark:bg-slate-900" />
        <span aria-hidden className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
        {!pickedName && suggestions.length > 0 && <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">{suggestions.map(name => <button key={name} onClick={() => selectName(name)} className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">{name}</button>)}</div>}
      </div>

      {!result ? <div className="rounded-lg border border-slate-200 bg-white px-3 py-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">이름을 검색하면 실습과와 인계가 연속 주차별로 표시됩니다.</div> : <>
        <p className="px-0.5 text-xs font-bold text-slate-700 dark:text-slate-200">{pickedName}의 실습 기록</p>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {groups.map(group => {
            const outerKey = `${group.start}-${group.end}-${group.dept}`;
            const startDate = result.weeks[group.start - 1].d.s;
            const endDate = result.weeks[group.end - 1].d.e;
            const peers = Array.from(new Set(group.items.flatMap(item => item.peers)));
            const files = allDocs.map(doc => ({ doc, entries: group.items.flatMap(item => (matchesHandoverDepartment(doc.dept, group.dept) ? (doc.entriesByWeek[item.week] ?? []).map(entry => ({ week: item.week, entry })) : [])) })).filter(item => item.entries.length);
            return <section key={outerKey} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
              <button onClick={() => toggle(setOuterOpen, outerKey)} className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <span className="w-[5.75rem] shrink-0 text-xs font-black text-teal-600 dark:text-teal-400">{group.start === group.end ? `${group.start}주차` : `${group.start}~${group.end}주차`}<small className="ml-0.5 text-[10px] font-bold">· {group.items.map(item => tagOfWeek(item.week)).join(", ")}</small></span>
                <span className="min-w-0 flex-1"><b className="block truncate text-sm leading-5 text-slate-700 dark:text-slate-200">{group.dept}</b><small className="block truncate text-[10px] leading-4 text-slate-400">{fmtD(startDate)}~{fmtD(endDate)} · {peers.join(", ")}</small></span>
                <span className="text-[10px] text-slate-400">{outerOpen.has(outerKey) ? "▲" : "▼"}</span>
              </button>
              {outerOpen.has(outerKey) && <div className="border-t border-slate-100 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-950/10">
                {!files.length ? <p className="px-3 py-2 text-[11px] text-slate-400">인계 파일을 추가하면 여기에 연결됩니다.</p> : files.length === 1 ? <div className="bg-white dark:bg-slate-900">{files[0].entries.map(({ week, entry }, index) => <div key={index} className="grid grid-cols-[minmax(6.2rem,28%)_1fr] border-b border-slate-100 last:border-b-0 dark:border-slate-800"><div className="border-r border-slate-100 bg-slate-50/70 px-2 py-1.5 text-[10px] leading-3.5 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40"><b className="block text-teal-700 dark:text-teal-300">{week}주 · {entry.section}</b>{entry.tab && <span>{entry.tab}</span>}</div><p className="break-words px-2 py-1.5 text-[11px] leading-4.5 text-slate-700 dark:text-slate-300">{entry.content}</p></div>)}</div> : files.map(({ doc, entries }) => {
                  const innerKey = `${outerKey}-${doc.sourceName}`;
                  return <div key={innerKey} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                    <button onClick={() => toggle(setFileOpen, innerKey)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60"><span className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-600 dark:text-slate-300">📄 {doc.sourceName}</span><span className="text-[10px] text-slate-400">{entries.length}개 {fileOpen.has(innerKey) ? "▲" : "▼"}</span></button>
                    {fileOpen.has(innerKey) && <div className="border-t border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">{entries.map(({ week, entry }, index) => <div key={index} className="grid grid-cols-[minmax(6.2rem,28%)_1fr] border-b border-slate-100 last:border-b-0 dark:border-slate-800"><div className="border-r border-slate-100 bg-slate-50/70 px-2 py-1.5 text-[10px] leading-3.5 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40"><b className="block text-teal-700 dark:text-teal-300">{week}주 · {entry.section}</b>{entry.tab && <span>{entry.tab}</span>}</div><p className="break-words px-2 py-1.5 text-[11px] leading-4.5 text-slate-700 dark:text-slate-300">{entry.content}</p></div>)}</div>}
                  </div>;
                })}
              </div>}
            </section>;
          })}
        </div>
      </>}
    </main>
  </>;
};
