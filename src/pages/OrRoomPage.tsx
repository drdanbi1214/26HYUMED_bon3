import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { OrExcelUploader } from "@/components/or/OrExcelUploader";
import { OrGridTable } from "@/components/or/OrGridTable";
import { useOrRoom } from "@/hooks/useOrRooms";
import {
  OrCase,
  SectionGrid,
  ViewId,
  VIEW_LABELS,
  buildGrid,
  diffCases,
  fmtDateHeader,
  fmtStamp,
  fmtTime,
  roomLabel,
  splitBySection,
} from "@/utils/orSchedule";

interface OrRoomPageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

const VIEW_IDS: ViewId[] = [1, 2, "all"];

const CHANGE_BADGE: Record<string, { label: string; cls: string }> = {
  new: { label: "🆕 신규", cls: "bg-emerald-100 text-emerald-700" },
  time: { label: "🕒 변경", cls: "bg-amber-100 text-amber-700" },
  removed: { label: "❌ 취소", cls: "bg-red-100 text-red-600" },
};

/**
 * 배정 방: 저장된 시간표 + 학생 배정.
 * 수술 블록을 탭하면 학생을 배정하고, 맨 위에 학생별 수술 대시보드와
 * 재업로드 변경 알림을 보여준다.
 */
export const OrRoomPage: React.FC<OrRoomPageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { room, loading, error, saveTimetable, saveAssignments, clearChanges } = useOrRoom(id ?? "");

  // 새로 올려서 아직 저장 안 된 파싱 결과
  const [pendingCases, setPendingCases] = useState<OrCase[] | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // 배정 입력 모달
  const [assignTarget, setAssignTarget] = useState<OrCase | null>(null);
  const [nameInput, setNameInput] = useState("");

  const grids = useMemo(() => {
    if (!room?.cases) return null;
    const split = splitBySection(room.cases);
    return {
      1: buildGrid(split[1]),
      2: buildGrid(split[2]),
      all: buildGrid(room.cases),
    } as Record<ViewId, SectionGrid>;
  }, [room?.cases]);

  /** 학생별 배정 대시보드 데이터: 이름 → 시간순 수술 목록 */
  const students = useMemo(() => {
    if (!room?.cases) return [];
    const byIdx = new Map(room.cases.map(c => [String(c.idx), c]));
    const map = new Map<string, OrCase[]>();
    for (const [k, names] of Object.entries(room.assignments)) {
      const c = byIdx.get(k);
      if (!c) continue;
      for (const n of names.split(/[,·/]+/).map(s => s.trim()).filter(Boolean)) {
        const list = map.get(n);
        if (list) list.push(c);
        else map.set(n, [c]);
      }
    }
    return [...map.entries()]
      .map(([name, list]) => ({
        name,
        list: [...list].sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [room?.cases, room?.assignments]);

  /** 업로드한 파싱 결과를 선택한 시간표로 저장 (기존 배정은 이어받고 변경은 알림으로) */
  const chooseView = async (v: ViewId) => {
    if (!pendingCases || !room || saving) return;
    setSaving(true);
    const { changes, assignments } = room.cases
      ? diffCases(room.cases, pendingCases, room.assignments)
      : { changes: [], assignments: {} };
    const ok = await saveTimetable(v, pendingCases, assignments, changes);
    setSaving(false);
    if (ok) {
      setPendingCases(null);
      setReplacing(false);
    }
  };

  const openAssign = (c: OrCase) => {
    setAssignTarget(c);
    setNameInput(room?.assignments[String(c.idx)] ?? "");
  };

  const saveAssign = async () => {
    if (!room || !assignTarget || saving) return;
    const next = { ...room.assignments };
    const v = nameInput.trim();
    if (v) next[String(assignTarget.idx)] = v;
    else delete next[String(assignTarget.idx)];
    setSaving(true);
    await saveAssignments(next);
    setSaving(false);
    setAssignTarget(null);
  };

  const download = async () => {
    if (!grids || !room?.cases || room.view == null) return;
    setDownloading(true);
    try {
      const { exportExcel } = await import("@/utils/orExcel");
      const stamp = room.uploaded_at ? ` — ${fmtStamp(room.uploaded_at)}` : "";
      const asg = room.assignments;
      const blob = await exportExcel(
        room.view === "all"
          ? [{ sheetName: "전체", title: `${room.name}${stamp}`, grid: grids.all, assignments: asg }]
          : [
              { sheetName: "외과서울1", title: `${room.name} · ${VIEW_LABELS[1]}${stamp}`, grid: grids[1], assignments: asg },
              { sheetName: "외과서울2", title: `${room.name} · ${VIEW_LABELS[2]}${stamp}`, grid: grids[2], assignments: asg },
            ],
      );
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${room.name}_수술시간표.xlsx`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setDownloading(false);
    }
  };

  const showUploader = !!room && (!room.cases || replacing);

  return (
    <>
      <Header
        title={`🚪 ${room?.name ?? "배정 방"}`}
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate("/or-schedule")}
      />

      <div className="space-y-4 animate-in fade-in slide-in-from-right duration-500 pb-16">
        {loading && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-sm animate-pulse">
            <p className="text-sm text-slate-400">불러오는 중...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl">{error}</div>
        )}

        {/* 재업로드 변경 알림 */}
        {room && room.changes.length > 0 && !showUploader && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-3xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                🔔 새 파일에서 바뀐 수술 {room.changes.length}건
              </p>
              <button
                onClick={clearChanges}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 active:scale-95 transition-all"
              >
                확인했어요
              </button>
            </div>
            <div className="space-y-1.5">
              {room.changes.map((ch, i) => {
                const badge = CHANGE_BADGE[ch.type] ?? CHANGE_BADGE.time;
                return (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded-md font-bold ${badge.cls}`}>{badge.label}</span>
                    <span className="leading-snug">{ch.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 학생별 배정 대시보드 */}
        {room?.cases && students.length > 0 && !showUploader && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">👥 학생별 배정</p>
            {students.map(({ name, list }) => (
              <div key={name}>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1.5">
                  {name} <span className="font-normal text-slate-400">· {list.length}건</span>
                </p>
                <div className="space-y-1">
                  {list.map(c => (
                    <div key={c.idx} className="flex gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="shrink-0 font-semibold whitespace-nowrap">
                        {fmtDateHeader(c.date)} {fmtTime(c.startMin)}
                      </span>
                      <span className="leading-snug">
                        {c.patientName} · {c.opName} · {c.surgeon} · {roomLabel(c.room)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 시간표 업로드 (처음 or 재업로드) */}
        {showUploader && (
          <>
            <OrExcelUploader
              label={room?.cases ? "새 배정 엑셀 올리기 (.xlsx)" : "배정 엑셀 파일 올리기 (.xlsx)"}
              onParsed={parsed => setPendingCases(parsed)}
            />
            {room?.cases && (
              <button
                onClick={() => {
                  setReplacing(false);
                  setPendingCases(null);
                }}
                className="w-full py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-500 active:scale-[0.98] transition-all"
              >
                취소하고 기존 시간표 보기
              </button>
            )}
            {pendingCases && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 text-center mb-1">
                  어떤 시간표를 이 방에 저장할까요?
                </p>
                {VIEW_IDS.map(v => (
                  <button
                    key={v}
                    onClick={() => chooseView(v)}
                    disabled={saving}
                    className="w-full py-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
                  >
                    {saving ? "저장 중..." : VIEW_LABELS[v]}
                  </button>
                ))}
                {room?.cases && (
                  <p className="text-[10px] text-slate-400 text-center">
                    같은 수술의 학생 배정은 그대로 이어지고, 바뀐 수술은 알림으로 표시돼요.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* 저장된 시간표 */}
        {room?.cases && room.view != null && grids && !showUploader && (
          <>
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {VIEW_LABELS[room.view]}
              </span>
              {room.uploaded_at && (
                <span className="text-[11px] text-slate-400">🕒 {fmtStamp(room.uploaded_at)}</span>
              )}
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              수술 블록을 누르면 담당 학생을 배정할 수 있어요.
            </p>

            <OrGridTable grid={grids[room.view]} assignments={room.assignments} onCaseClick={openAssign} />

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setReplacing(true)}
                className="py-4 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20 text-xs font-bold text-blue-600 dark:text-blue-400 active:scale-[0.98] transition-all"
              >
                🔄 새 엑셀 올리기
              </button>
              <button
                onClick={download}
                disabled={downloading}
                className="py-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {downloading ? "만드는 중..." : "⬇️ 엑셀 다운로드"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* 배정 입력 모달 */}
      {assignTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6"
          onClick={() => setAssignTarget(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-xl space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {assignTarget.patientName}{" "}
              <span className="font-normal text-slate-400">({assignTarget.patientNo})</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              {assignTarget.opName}
              <br />
              {fmtDateHeader(assignTarget.date)} {fmtTime(assignTarget.startMin)}~
              {fmtTime(assignTarget.startMin + assignTarget.durMin)} · {assignTarget.surgeon} ·{" "}
              {roomLabel(assignTarget.room)}
            </p>
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveAssign()}
              placeholder="학생 이름 (여러 명이면 쉼표로 구분)"
              autoFocus
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setAssignTarget(null)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 active:scale-[0.98] transition-all"
              >
                취소
              </button>
              <button
                onClick={saveAssign}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {saving ? "저장 중..." : nameInput.trim() ? "저장" : "배정 지우기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
