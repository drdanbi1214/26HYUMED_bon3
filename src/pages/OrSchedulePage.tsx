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
  // 비밀번호 걸린 파일이면 원본 버퍼를 들고 있다가 비밀번호 입력 후 해독
  const [pendingBuf, setPendingBuf] = useState<ArrayBuffer | null>(null);
  const [pw, setPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  const grids = useMemo(() => {
    if (!cases) return null;
    const split = splitBySection(cases);
    return {
      1: buildGrid(split[1]),
      2: buildGrid(split[2]),
      all: buildGrid(cases),
    } as Record<ViewId, SectionGrid>;
  }, [cases]);

  /** 버퍼를 파싱해서 성공하면 선택창으로 넘어간다 */
  const parseBuffer = async (buf: ArrayBuffer, name: string) => {
    const { parseOrExcel } = await import("@/utils/orExcel");
    const parsed = await parseOrExcel(buf);
    if (parsed.length === 0) {
      setErr("수술 스케줄을 찾지 못했어요. '수술일자'·'집도의' 열이 있는 엑셀(.xlsx)인지 확인해주세요.");
      return;
    }
    setCases(parsed);
    setFileName(name);
    setView(null); // 파일을 올릴 때마다 선택창부터 다시
    setPendingBuf(null);
    setPw("");
  };

  const handleFile = async (f: File | null | undefined) => {
    if (!f) return;
    setBusy(true);
    setErr("");
    try {
      const buf = await f.arrayBuffer();
      const head = new Uint8Array(buf.slice(0, 4));
      const isZip = head[0] === 0x50 && head[1] === 0x4b; // 일반 xlsx = zip
      const isCfb = head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0; // 암호화 xlsx / 구형 xls
      if (isCfb) {
        // 비밀번호 걸린 파일 → 비밀번호를 받아서 해독
        setPendingBuf(buf);
        setFileName(f.name);
        setCases(null);
        setView(null);
        setPw("");
        return;
      }
      if (!isZip) {
        setErr("엑셀(.xlsx) 형식이 아니에요. 병원 시스템에서 받은 파일이라면 엑셀에서 연 뒤 '다른 이름으로 저장 → .xlsx'로 저장해서 올려주세요.");
        return;
      }
      await parseBuffer(buf, f.name);
    } catch (e) {
      const detail = e instanceof Error && e.message ? ` (${e.message})` : "";
      setErr(`파일을 읽지 못했어요. .xlsx 파일이 맞는지 확인해주세요.${detail}`);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submitPassword = async () => {
    if (!pendingBuf || !pw || pwBusy) return;
    setPwBusy(true);
    setErr("");
    try {
      const { decryptXlsx } = await import("@/utils/orExcel");
      const decrypted = await decryptXlsx(pendingBuf, pw);
      await parseBuffer(decrypted, fileName);
    } catch (e) {
      console.error("[or-schedule] 해독 실패:", e);
      const msg = e instanceof Error ? e.message : "";
      // 비밀번호가 틀리면 해독 결과가 깨진 zip이 돼서 "central directory" 에러로도 나타난다
      setErr(
        /password|central directory|zip file/i.test(msg)
          ? "비밀번호가 맞지 않아요. 다시 입력해주세요."
          : "이 파일은 열 수 없어요. 엑셀에서 비밀번호를 해제한 뒤 .xlsx로 다시 저장해서 올려주세요.",
      );
    } finally {
      setPwBusy(false);
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

        {/* 비밀번호 걸린 파일 → 비밀번호 입력 */}
        {pendingBuf && !cases && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="text-center">
              <div className="text-3xl mb-2">🔒</div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                비밀번호가 걸린 파일이에요
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {fileName}의 열기 비밀번호를 입력해주세요. 비밀번호는 이 기기에서만 사용되고 어디에도 전송되지 않아요.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitPassword()}
                placeholder="엑셀 비밀번호"
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm text-sm"
              />
              <button
                onClick={submitPassword}
                disabled={pwBusy || !pw}
                className="px-5 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                {pwBusy ? "여는 중..." : "열기"}
              </button>
            </div>
          </div>
        )}

        {!cases && !err && !pendingBuf && (
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
            {dayCells.map((d, di) => (
              <th
                key={d.date}
                colSpan={d.cells.length}
                className={`bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 px-2 py-2 border border-slate-200 dark:border-slate-700 whitespace-nowrap ${
                  di > 0 ? "border-l-2 border-l-slate-400 dark:border-l-slate-500" : ""
                }`}
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
              {dayCells.flatMap((d, di) =>
                d.cells.map((colCells, li) => {
                  const cell = colCells[ri];
                  const key = `${d.date}-${li}`;
                  // 요일이 바뀌는 첫 레인 왼쪽은 굵은 선으로 구분
                  const dayEdge = di > 0 && li === 0 ? " border-l-2 border-l-slate-400 dark:border-l-slate-500" : "";
                  if (cell === "covered") return null;
                  if (cell === null) {
                    return (
                      <td
                        key={key}
                        className={`border border-slate-100 dark:border-slate-800${dayEdge}`}
                        style={{ minWidth: 132 }}
                      />
                    );
                  }
                  const { oc, span } = cell;
                  return (
                    <td
                      key={key}
                      rowSpan={span}
                      className={`border border-slate-200 dark:border-slate-700 align-top p-0${dayEdge}`}
                      style={{ minWidth: 132, backgroundColor: `#${surgeonColor(oc.surgeon)}` }}
                    >
                      <div className="p-1.5 space-y-0.5">
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
