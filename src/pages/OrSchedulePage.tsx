import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import {
  OrCase,
  SectionGrid,
  ViewId,
  VIEW_LABELS,
  SLOT_MIN,
  buildGrid,
  fmtDateHeader,
  fmtTime,
  roomLabel,
  splitBySection,
  surgeonColor,
} from "@/utils/orSchedule";

interface OrSchedulePageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

/**
 * 수술 시간표: 배정 엑셀(시트3 형식)을 올리면 외과서울1/2·기타(전체) 중
 * 볼 시간표를 고르게 하고, 엑셀로도 내려받게 해준다.
 * exceljs가 무거워서 파싱/다운로드 모듈(orExcel)은 필요할 때 lazy import.
 */
export const OrSchedulePage: React.FC<OrSchedulePageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cases, setCases] = useState<OrCase[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [view, setView] = useState<ViewId | null>(null);

  const grids = useMemo(() => {
    if (!cases) return null;
    const split = splitBySection(cases);
    return {
      1: buildGrid(split[1]),
      2: buildGrid(split[2]),
      all: buildGrid(cases),
    } as Record<ViewId, SectionGrid>;
  }, [cases]);

  const handleFile = async (f: File | null | undefined) => {
    if (!f) return;
    setBusy(true);
    setErr("");
    try {
      const { parseOrExcel } = await import("@/utils/orExcel");
      const parsed = await parseOrExcel(await f.arrayBuffer());
      if (parsed.length === 0) {
        setErr("수술 스케줄을 찾지 못했어요. '수술일자'·'집도의' 열이 있는 엑셀(.xlsx)인지 확인해주세요.");
      } else {
        setCases(parsed);
        setFileName(f.name);
        setView(null); // 파일을 올릴 때마다 선택창부터 다시
      }
    } catch {
      setErr("파일을 읽지 못했어요. .xlsx 파일이 맞는지 확인해주세요.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const download = async () => {
    if (!grids || !cases || view == null) return;
    setDownloading(true);
    try {
      const { exportExcel } = await import("@/utils/orExcel");
      // 외과서울1/2를 보고 있으면 두 섹션을 한 파일에, 기타면 전체 한 시트로
      const blob = await exportExcel(
        view === "all"
          ? [{ sheetName: "전체", title: VIEW_LABELS.all, grid: grids.all }]
          : [
              { sheetName: "외과서울1", title: VIEW_LABELS[1], grid: grids[1] },
              { sheetName: "외과서울2", title: VIEW_LABELS[2], grid: grids[2] },
            ],
      );
      const firstDate = [...new Set(cases.map(c => c.date))].sort()[0] ?? "";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `수술시간표_${view === "all" ? "전체" : "외과서울"}_${firstDate}.xlsx`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setDownloading(false);
    }
  };

  const VIEW_IDS: ViewId[] = [1, 2, "all"];

  return (
    <>
      <Header title="🏥 수술 시간표" isDark={isDark} onToggleDark={onToggleDark} onBack={() => navigate("/")} />

      <div className="space-y-4 animate-in fade-in slide-in-from-right duration-500 pb-16">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 text-sm font-bold text-blue-600 dark:text-blue-400 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {busy ? "읽는 중..." : cases ? `📄 ${fileName} · 다른 파일 올리기` : "📄 배정 엑셀 파일 올리기 (.xlsx)"}
        </button>

        {err && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl">{err}</div>
        )}

        {!cases && !err && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center shadow-sm">
            <div className="text-4xl mb-3">🗓️</div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
              수술 스케줄 엑셀을 올려주세요
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              '수술일자·시작·소요·수술명·집도의' 열이 있는 목록 시트를 읽어서
              <br />
              외과서울1·외과서울2·기타(전체) 시간표로 보여드려요.
            </p>
          </div>
        )}

        {/* 파싱 완료 → 어떤 시간표를 볼지 선택 */}
        {cases && grids && view == null && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 text-center mb-1">
              어떤 시간표를 볼까요?
            </p>
            {VIEW_IDS.map(id => (
              <button
                key={id}
                onClick={() => setView(id)}
                className="w-full py-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold shadow-md active:scale-[0.98] transition-all"
              >
                {VIEW_LABELS[id]}
                <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                  {id === "all"
                    ? `올린 수술 ${grids.all.days.reduce((s, d) => s + d.lanes.flat().length, 0)}건 전부 표시`
                    : `수술 ${grids[id].days.reduce((s, d) => s + d.lanes.flat().length, 0)}건`}
                </span>
              </button>
            ))}
            <p className="text-[10px] text-slate-400 text-center">
              기타를 고르면 과 구분 없이 파일의 모든 수술이 표시돼요.
            </p>
          </div>
        )}

        {/* 시간표 화면 */}
        {cases && grids && view != null && (
          <>
            <div className="flex gap-2">
              {VIEW_IDS.map(id => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`flex-1 py-3 px-1 rounded-2xl text-[11px] font-bold border shadow-sm transition-all ${
                    view === id
                      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-transparent"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {id === "all" ? "기타 (전체)" : `외과서울${id}`}
                </button>
              ))}
            </div>

            <GridTable grid={grids[view]} />

            <button
              onClick={download}
              disabled={downloading}
              className="w-full py-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-sm font-bold shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {downloading
                ? "만드는 중..."
                : view === "all"
                  ? "⬇️ 엑셀 다운로드 (전체)"
                  : "⬇️ 엑셀 다운로드 (외과서울1 + 2)"}
            </button>
          </>
        )}
      </div>
    </>
  );
};

type SlotCell = { oc: OrCase; span: number } | "covered" | null;

const GridTable: React.FC<{ grid: SectionGrid }> = ({ grid }) => {
  const slots: number[] = [];
  for (let t = grid.startMin; t < grid.endMin; t += SLOT_MIN) slots.push(t);

  const dayCells = grid.days.map(day => ({
    date: day.date,
    cells: day.lanes.map(lane => {
      const colCells: SlotCell[] = Array(slots.length).fill(null);
      for (const oc of lane) {
        const s = Math.max(0, Math.floor((oc.startMin - grid.startMin) / SLOT_MIN));
        const e = Math.min(
          slots.length,
          Math.ceil((oc.startMin + oc.durMin - grid.startMin) / SLOT_MIN),
        );
        colCells[s] = { oc, span: Math.max(1, e - s) };
        for (let i = s + 1; i < e; i++) colCells[i] = "covered";
      }
      return colCells;
    }),
  }));

  if (grid.days.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-sm">
        <p className="text-sm text-slate-400">이 시간표에 표시할 수술이 없어요.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 px-2 py-2 border border-slate-200 dark:border-slate-700">
              시간
            </th>
            {dayCells.map(d => (
              <th
                key={d.date}
                colSpan={d.cells.length}
                className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 px-2 py-2 border border-slate-200 dark:border-slate-700 whitespace-nowrap"
              >
                {fmtDateHeader(d.date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((t, ri) => (
            <tr key={t}>
              <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 text-[9px] text-slate-400 px-1.5 border border-slate-100 dark:border-slate-800 whitespace-nowrap text-center h-9">
                {fmtTime(t)}
              </td>
              {dayCells.flatMap(d =>
                d.cells.map((colCells, li) => {
                  const cell = colCells[ri];
                  const key = `${d.date}-${li}`;
                  if (cell === "covered") return null;
                  if (cell === null) {
                    return (
                      <td
                        key={key}
                        className="border border-slate-100 dark:border-slate-800"
                        style={{ minWidth: 132 }}
                      />
                    );
                  }
                  const { oc, span } = cell;
                  return (
                    <td
                      key={key}
                      rowSpan={span}
                      className="border border-slate-200 dark:border-slate-700 align-top p-0"
                      style={{ minWidth: 132 }}
                    >
                      <div
                        className="h-full p-1.5 space-y-0.5"
                        style={{ backgroundColor: `#${surgeonColor(oc.surgeon)}` }}
                      >
                        <div className="text-[9px] font-semibold text-slate-500">
                          {fmtTime(oc.startMin)}~{fmtTime(oc.startMin + oc.durMin)} · {roomLabel(oc.room)}
                        </div>
                        <div className="text-[11px] font-bold text-slate-800 leading-tight">
                          {oc.patientName}{" "}
                          <span className="font-normal text-slate-500">({oc.patientNo})</span>
                        </div>
                        <div className="text-[10px] text-slate-700 leading-tight break-keep">
                          {oc.opName}
                        </div>
                        <div className="text-[10px] font-bold text-slate-700">{oc.surgeon}</div>
                      </div>
                    </td>
                  );
                }),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
