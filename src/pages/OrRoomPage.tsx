import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { OrExcelUploader } from "@/components/or/OrExcelUploader";
import { OrGridTable } from "@/components/or/OrGridTable";
import { useToast } from "@/components/ui/Toast";
import { NAME_LOOKUP } from "@/data/members";
import { useOrRoom } from "@/hooks/useOrRooms";
import {
  AMPM_LABEL,
  OrCase,
  OrEvent,
  SectionGrid,
  ViewId,
  VIEW_LABELS,
  buildGrid,
  clinicRange,
  diffCases,
  fmtDateHeader,
  fmtHours,
  fmtStamp,
  fmtTime,
  hmToMin,
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

/** 대시보드 항목 (수술 또는 외래) */
interface DashEntry {
  key: string;
  sort: number;
  time: string;
  label: string;
  /** "메시지 복사"용: "정윤경 교수님 수술(8:00-13:00)" */
  msgPart: string;
  /** 수술 항목이면 메모 편집용 caseIdx */
  caseIdx?: number;
}
interface DashDate {
  date: string;
  students: { name: string; entries: DashEntry[] }[];
  /** 학생과 무관한 공용 일정 */
  events: DashEntry[];
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 조원 명단에서 학번(예: E3) 찾기. 없으면 빈 문자열. */
function studentCode(name: string): string {
  const m = NAME_LOOKUP[name.trim()];
  return m ? `${m.group}${m.number}` : "";
}

/** "E3 유재섭"처럼 학번+이름. 학번 없으면 이름만. */
function withCode(name: string): string {
  const code = studentCode(name);
  return code ? `${code} ${name}` : name;
}

/**
 * 배정 방: 저장된 시간표 + 학생 배정 + 외래 배정.
 * 대시보드는 날짜별 → 학생별로 묶고, 지난 날짜는 시간표 아래로 분리한다.
 */
export const OrRoomPage: React.FC<OrRoomPageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { room, loading, error, saveTimetable, saveShared, clearChanges } = useOrRoom(id ?? "");
  const toast = useToast();

  // 새로 올려서 아직 저장 안 된 파싱 결과
  const [pendingCases, setPendingCases] = useState<OrCase[] | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // 수술 배정/메모 입력 모달
  const [assignTarget, setAssignTarget] = useState<OrCase | null>(null);
  // "modal": 시간표 칸 클릭 (작은 중앙 모달), "sheet": 대시보드 메모 아이콘 클릭 (전체화면 시트)
  const [assignMode, setAssignMode] = useState<"modal" | "sheet">("modal");
  const [nameInput, setNameInput] = useState("");
  const [memoInput, setMemoInput] = useState("");

  // 외래 배정 모달
  const [clinicOpen, setClinicOpen] = useState(false);
  const [cDate, setCDate] = useState("");
  const [cAmpm, setCAmpm] = useState<"AM" | "PM">("AM");
  const [cProf, setCProf] = useState("");
  const [cStudent, setCStudent] = useState("");

  // 추가 일정(공용) 모달
  const [eventOpen, setEventOpen] = useState(false);
  const [eDate, setEDate] = useState("");
  const [eStart, setEStart] = useState("09:00");
  const [eEnd, setEEnd] = useState("10:00");
  const [eName, setEName] = useState("");

  const grids = useMemo(() => {
    if (!room?.cases) return null;
    // 외래만 있는 날짜도 열이 생기도록 clinic 날짜를 함께 넘긴다
    const clinicDates = room.clinics.map(c => c.date);
    const split = splitBySection(room.cases);
    return {
      1: buildGrid(split[1], clinicDates, room.events),
      2: buildGrid(split[2], clinicDates, room.events),
      all: buildGrid(room.cases, clinicDates, room.events),
    } as Record<ViewId, SectionGrid>;
  }, [room?.cases, room?.clinics, room?.events]);

  const dates = useMemo(
    () => (room?.cases ? [...new Set(room.cases.map(c => c.date))].sort() : []),
    [room?.cases],
  );

  /** 날짜별 → 학생별 배정 대시보드. [당일/미래, 지난 날짜]로 나눠 반환 */
  const [upcoming, past] = useMemo((): [DashDate[], DashDate[]] => {
    if (!room?.cases) return [[], []];
    const byDate = new Map<string, Map<string, DashEntry[]>>();
    const add = (date: string, student: string, entry: DashEntry) => {
      let students = byDate.get(date);
      if (!students) byDate.set(date, (students = new Map()));
      const list = students.get(student);
      if (list) list.push(entry);
      else students.set(student, [entry]);
    };
    const splitNames = (s: string) => s.split(/[,·/]+/).map(x => x.trim()).filter(Boolean);

    const byIdx = new Map(room.cases.map(c => [String(c.idx), c]));
    for (const [k, names] of Object.entries(room.assignments)) {
      const c = byIdx.get(k);
      if (!c) continue;
      for (const n of splitNames(names)) {
        add(c.date, n, {
          key: `s${c.idx}-${n}`,
          sort: c.startMin,
          time: fmtTime(c.startMin),
          label: `${c.surgeon}_${roomLabel(c.room)}_${c.opName}`,
          msgPart: `${c.surgeon} 교수님 수술(${fmtTime(c.startMin)}-${fmtTime(c.startMin + c.durMin)})`,
          caseIdx: c.idx,
        });
      }
    }
    for (const cl of room.clinics) {
      const { start, end } = clinicRange(cl.ampm);
      for (const n of splitNames(cl.student)) {
        add(cl.date, n, {
          key: `c${cl.id}-${n}`,
          sort: cl.ampm === "AM" ? 479 : 779, // 같은 시간대 수술보다 살짝 앞에
          time: `${AMPM_LABEL[cl.ampm]} 외래`,
          label: `${cl.prof}_외래`,
          msgPart: `${cl.prof} 교수님 외래(${fmtTime(start)}-${fmtTime(end)})`,
        });
      }
    }

    // 공용 일정 (학생과 무관, 날짜별로 따로 모음)
    const eventsByDate = new Map<string, DashEntry[]>();
    for (const ev of room.events) {
      const entry: DashEntry = {
        key: `e${ev.id}`,
        sort: ev.start,
        time: `${fmtTime(ev.start)}-${fmtTime(ev.end)}`,
        label: ev.name,
        msgPart: `${ev.name}(${fmtTime(ev.start)}-${fmtTime(ev.end)})`,
      };
      const list = eventsByDate.get(ev.date);
      if (list) list.push(entry);
      else eventsByDate.set(ev.date, [entry]);
    }

    const toDash = (date: string): DashDate => ({
      date,
      students: [...(byDate.get(date)?.entries() ?? [])]
        .map(([name, entries]) => ({ name, entries: entries.sort((a, b) => a.sort - b.sort) }))
        .sort((a, b) => a.name.localeCompare(b.name, "ko")),
      events: (eventsByDate.get(date) ?? []).slice().sort((a, b) => a.sort - b.sort),
    });
    const today = todayStr();
    // 공용 일정만 있는 날짜도 카드가 뜨도록 날짜를 합집합으로
    const allDates = [...new Set([...byDate.keys(), ...eventsByDate.keys()])].sort();
    return [
      allDates.filter(d => d >= today).map(toDash),
      allDates.filter(d => d < today).map(toDash),
    ];
  }, [room?.cases, room?.assignments, room?.clinics, room?.events]);

  /** 대시보드 맨 위 요약: 사람별 총 수술시간 [이단비-3h, ...] */
  const hourSummary = useMemo(() => {
    if (!room?.cases) return [];
    const byIdx = new Map(room.cases.map(c => [String(c.idx), c]));
    const totals = new Map<string, number>();
    for (const [k, names] of Object.entries(room.assignments)) {
      const c = byIdx.get(k);
      if (!c) continue;
      for (const n of names.split(/[,·/]+/).map(x => x.trim()).filter(Boolean)) {
        totals.set(n, (totals.get(n) ?? 0) + c.durMin);
      }
    }
    return [...totals.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], "ko"))
      .map(([name, min]) => `${name}-${fmtHours(min)}`);
  }, [room?.cases, room?.assignments]);

  /** 업로드한 파싱 결과를 선택한 시간표로 저장 (기존 배정·메모는 이어받고 변경은 알림으로) */
  const chooseView = async (v: ViewId) => {
    if (!pendingCases || !room || saving) return;
    setSaving(true);
    let changes: ReturnType<typeof diffCases>["changes"] = [];
    let assignments: Record<string, string> = {};
    let memos: Record<string, string> = {};
    if (room.cases) {
      const diff = diffCases(room.cases, pendingCases, room.assignments);
      changes = diff.changes;
      assignments = diff.assignments;
      for (const [oldIdx, newIdx] of Object.entries(diff.idxMap)) {
        const m = room.memos[oldIdx];
        if (m) memos[newIdx] = m;
      }
    }
    const ok = await saveTimetable(v, pendingCases, assignments, changes, memos);
    setSaving(false);
    if (ok) {
      setPendingCases(null);
      setReplacing(false);
    }
  };

  const openAssign = (c: OrCase, mode: "modal" | "sheet" = "modal") => {
    setAssignTarget(c);
    setAssignMode(mode);
    setNameInput(room?.assignments[String(c.idx)] ?? "");
    setMemoInput(room?.memos[String(c.idx)] ?? "");
  };

  /** 대시보드 메모 아이콘에서 열기 (시간표 칸과 같은 메모를 공유, 전체화면 시트로 크게 표시) */
  const openAssignByIdx = (caseIdx: number) => {
    const c = room?.cases?.find(x => x.idx === caseIdx);
    if (c) openAssign(c, "sheet");
  };

  const saveAssign = async () => {
    if (!room || !assignTarget || saving) return;
    const k = String(assignTarget.idx);
    const name = nameInput.trim();
    const memo = memoInput.trim();
    setSaving(true);
    await saveShared(r => {
      const assignments = { ...r.assignments };
      if (name) assignments[k] = name;
      else delete assignments[k];
      const memos = { ...r.memos };
      if (memo) memos[k] = memo;
      else delete memos[k];
      return { assignments, memos };
    });
    setSaving(false);
    setAssignTarget(null);
  };

  /** 우리 수술이 아닌 칸을 시간표에서 지운다 (배정·메모도 같이 정리) */
  const deleteCase = async () => {
    if (!room || !assignTarget || saving) return;
    if (!window.confirm(`"${assignTarget.patientName}" 수술을 시간표에서 삭제할까요?`)) return;
    const k = String(assignTarget.idx);
    setSaving(true);
    const ok = await saveShared(r => {
      const assignments = { ...r.assignments };
      delete assignments[k];
      const memos = { ...r.memos };
      delete memos[k];
      return { cases: (r.cases ?? []).filter(c => c.idx !== assignTarget.idx), assignments, memos };
    });
    setSaving(false);
    if (ok) {
      setAssignTarget(null);
      toast.success("수술을 삭제했어요");
    }
  };

  const addClinic = async () => {
    if (!room || !cProf.trim() || saving) return;
    const date = cDate || dates[0];
    if (!date) return;
    const clinic = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date,
      ampm: cAmpm,
      prof: cProf.trim(),
      student: cStudent.trim(),
    };
    setSaving(true);
    await saveShared(r => ({ clinics: [...r.clinics, clinic] }));
    setSaving(false);
    setCProf("");
    setCStudent("");
  };

  const removeClinic = async (clinicId: string) => {
    if (!room) return;
    await saveShared(r => ({ clinics: r.clinics.filter(c => c.id !== clinicId) }));
  };

  const addEvent = async () => {
    if (!room || saving) return;
    const name = eName.trim();
    const date = eDate || dates[0];
    const start = hmToMin(eStart);
    const end = hmToMin(eEnd);
    if (!name || !date || start == null || end == null) return;
    if (end <= start) {
      toast.error("끝나는 시간이 시작 시간보다 늦어야 해요");
      return;
    }
    const event = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, date, start, end, name };
    setSaving(true);
    await saveShared(r => ({ events: [...r.events, event] }));
    setSaving(false);
    setEName("");
  };

  const removeEvent = async (eventId: string) => {
    if (!room) return;
    await saveShared(r => ({ events: r.events.filter(e => e.id !== eventId) }));
  };

  /** 해당 날짜의 학생별 일정을 교수님 보고용 메시지 서식으로 복사 */
  const copyMessage = async (dash: DashDate) => {
    if (!room) return;
    const sec = room.view === "all" ? "전체" : `서울 ${room.view} section`;
    // 학번(E1, E2, …) 오름차순. 학번 없는 이름은 뒤로.
    const students = [...dash.students].sort((a, b) => {
      const ma = NAME_LOOKUP[a.name.trim()];
      const mb = NAME_LOOKUP[b.name.trim()];
      if (!ma || !mb) return ma ? -1 : mb ? 1 : 0;
      return ma.group !== mb.group ? ma.group.localeCompare(mb.group) : ma.number - mb.number;
    });
    const lines = students.map(
      s => `${withCode(s.name)} - ${s.entries.map(e => e.msgPart).join("/ ")}`,
    );
    if (dash.events.length > 0) {
      lines.push(`공용 일정 - ${dash.events.map(e => e.msgPart).join("/ ")}`);
    }
    const msg = [`${sec} 익일 일정 다음과 같습니다.`, "", ...lines, "", "감사합니다 교수님."].join("\n");
    try {
      await navigator.clipboard.writeText(msg);
      toast.success("메시지를 복사했어요");
    } catch {
      // 클립보드 접근이 막힌 환경 폴백
      window.prompt("아래 메시지를 복사하세요", msg);
    }
  };

  const download = async () => {
    if (!grids || !room?.cases || room.view == null) return;
    setDownloading(true);
    try {
      const { exportExcel } = await import("@/utils/orExcel");
      const stamp = room.uploaded_at ? ` — ${fmtStamp(room.uploaded_at)}` : "";
      const asg = room.assignments;
      const cls = room.clinics;
      const blob = await exportExcel(
        room.view === "all"
          ? [{ sheetName: "전체", title: `${room.name}${stamp}`, grid: grids.all, assignments: asg, clinics: cls }]
          : [
              { sheetName: "외과서울1", title: `${room.name} · ${VIEW_LABELS[1]}${stamp}`, grid: grids[1], assignments: asg, clinics: cls },
              { sheetName: "외과서울2", title: `${room.name} · ${VIEW_LABELS[2]}${stamp}`, grid: grids[2], assignments: asg, clinics: cls },
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

  const renderDash = (list: DashDate[], muted: boolean) => (
    <div className="space-y-4">
      {list.map(dash => (
        <div key={dash.date}>
          <div className="flex items-center justify-between mb-1.5">
            <p className={`text-base font-bold ${muted ? "text-slate-400" : "text-slate-600 dark:text-slate-300"}`}>
              📅 {fmtDateHeader(dash.date)}
            </p>
            <button
              onClick={() => copyMessage(dash)}
              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 active:scale-95 transition-all"
            >
              📋 메시지 복사
            </button>
          </div>
          <div className="space-y-2 pl-1">
            {dash.students.map(({ name, entries }) => (
              <div key={name}>
                <p className={`text-xs font-bold ${muted ? "text-slate-400" : "text-blue-600 dark:text-blue-400"}`}>
                  {withCode(name)}
                </p>
                <div className="space-y-0.5 mt-0.5">
                  {entries.map(e => {
                    const memo = e.caseIdx != null ? room?.memos[String(e.caseIdx)] : undefined;
                    return (
                      <div
                        key={e.key}
                        className={`flex items-start gap-2 text-[11px] ${muted ? "text-slate-400" : "text-slate-600 dark:text-slate-300"}`}
                      >
                        {e.caseIdx != null ? (
                          <button
                            onClick={() => openAssignByIdx(e.caseIdx!)}
                            aria-label="메모"
                            title={memo || "메모 추가"}
                            className={`shrink-0 text-[12px] leading-none rounded-md active:scale-90 transition-all ${
                              memo ? "" : "opacity-30 grayscale"
                            }`}
                          >
                            📝
                          </button>
                        ) : (
                          <span className="shrink-0 w-[14px]" />
                        )}
                        <span className="shrink-0 font-semibold whitespace-nowrap">{e.time}</span>
                        <span className="flex-1 leading-snug break-keep">{e.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {dash.events.length > 0 && (
              <div>
                <p className={`text-xs font-bold ${muted ? "text-slate-400" : "text-violet-600 dark:text-violet-400"}`}>
                  📌 공용 일정
                </p>
                <div className="space-y-0.5 mt-0.5">
                  {dash.events.map(e => (
                    <div
                      key={e.key}
                      className={`flex items-start gap-2 text-[11px] ${muted ? "text-slate-400" : "text-slate-600 dark:text-slate-300"}`}
                    >
                      <span className="shrink-0 w-[14px]" />
                      <span className="shrink-0 font-semibold whitespace-nowrap">{e.time}</span>
                      <span className="flex-1 leading-snug break-keep">{e.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

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

        {/* 외래 배정 · 추가 일정 버튼 (맨 위 오른쪽) */}
        {room?.cases && !showUploader && (
          <div className="flex justify-end gap-2 -mb-2">
            <button
              onClick={() => {
                setEDate(dates[0] ?? "");
                setEventOpen(true);
              }}
              className="text-[11px] font-bold text-violet-600 dark:text-violet-400 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 active:scale-95 transition-all"
            >
              📌 추가 일정
            </button>
            <button
              onClick={() => {
                setCDate(dates[0] ?? "");
                setClinicOpen(true);
              }}
              className="text-[11px] font-bold text-sky-600 dark:text-sky-400 px-3 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 active:scale-95 transition-all"
            >
              🩺 외래 배정
            </button>
          </div>
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

        {/* 학생별 배정 대시보드 (당일/미래) */}
        {room?.cases && upcoming.length > 0 && !showUploader && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
              👥 학생별 배정{" "}
              {room.uploaded_at && (
                <span className="text-sm font-normal text-slate-400">({fmtStamp(room.uploaded_at)})</span>
              )}
            </p>
            {hourSummary.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {hourSummary.map(s => (
                  <span
                    key={s}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-full px-2.5 py-1"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
            {renderDash(upcoming, false)}
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
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                🗓️ 시간표{" "}
                {room.uploaded_at && (
                  <span className="text-sm font-normal text-slate-400">({fmtStamp(room.uploaded_at)})</span>
                )}
              </p>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {VIEW_LABELS[room.view]}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              수술 블록을 누르면 담당 학생을 배정할 수 있어요.
            </p>

            <OrGridTable
              grid={grids[room.view]}
              assignments={room.assignments}
              memos={room.memos}
              clinics={room.clinics}
              events={room.events}
              onCaseClick={openAssign}
            />

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

            {/* 지난 날짜 배정 (시간표 아래로 분리) */}
            {past.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                <p className="text-sm font-bold text-slate-400">🗂 지난 배정</p>
                {renderDash(past, true)}
              </div>
            )}
          </>
        )}
      </div>

      {/* 수술 배정 입력 모달 (시간표 칸 클릭 → 작은 중앙 모달) */}
      {assignTarget && assignMode === "modal" && (
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
            <textarea
              value={memoInput}
              onChange={e => setMemoInput(e.target.value)}
              placeholder="📝 메모 (시간표와 대시보드에서 같이 보여요)"
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm text-sm resize-none"
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
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
            <button
              onClick={deleteCase}
              disabled={saving}
              className="w-full py-2.5 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/20 text-[11px] font-bold text-red-500 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              🗑 우리 수술이 아니에요 — 시간표에서 삭제
            </button>
          </div>
        </div>
      )}

      {/* 메모 전체화면 시트 (대시보드 📝 아이콘 클릭 → 크게 표시) */}
      {assignTarget && assignMode === "sheet" && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
          onClick={() => setAssignTarget(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-t-3xl w-full max-w-2xl h-[92vh] shadow-xl flex flex-col animate-in slide-in-from-bottom duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {assignTarget.patientName}{" "}
                  <span className="font-normal text-slate-400 text-base">({assignTarget.patientNo})</span>
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug mt-1">
                  {assignTarget.opName}
                  <br />
                  {fmtDateHeader(assignTarget.date)} {fmtTime(assignTarget.startMin)}~
                  {fmtTime(assignTarget.startMin + assignTarget.durMin)} · {assignTarget.surgeon} ·{" "}
                  {roomLabel(assignTarget.room)}
                </p>
              </div>
              <button
                onClick={() => setAssignTarget(null)}
                aria-label="닫기"
                className="shrink-0 w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 active:scale-90 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 min-h-0 p-6 pt-4 space-y-3 overflow-y-auto">
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="학생 이름 (여러 명이면 쉼표로 구분)"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm text-sm"
              />
              <textarea
                value={memoInput}
                onChange={e => setMemoInput(e.target.value)}
                placeholder="📝 메모 (시간표와 대시보드에서 같이 보여요)"
                autoFocus
                className="w-full h-full min-h-[240px] px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm text-base resize-none"
              />
            </div>

            <div className="p-6 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setAssignTarget(null)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-500 active:scale-[0.98] transition-all"
                >
                  취소
                </button>
                <button
                  onClick={saveAssign}
                  disabled={saving}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
              <button
                onClick={deleteCase}
                disabled={saving}
                className="w-full py-2.5 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/20 text-xs font-bold text-red-500 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                🗑 우리 수술이 아니에요 — 시간표에서 삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 외래 배정 모달 */}
      {clinicOpen && room && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6"
          onClick={() => setClinicOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-xl space-y-3 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">🩺 외래 배정</p>

            {room.clinics.length > 0 && (
              <div className="space-y-1.5">
                {room.clinics
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date) || (a.ampm === b.ampm ? 0 : a.ampm === "AM" ? -1 : 1))
                  .map(cl => (
                    <div
                      key={cl.id}
                      className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2"
                    >
                      <span className="flex-1 leading-snug">
                        {fmtDateHeader(cl.date)} {AMPM_LABEL[cl.ampm]} · <b>{cl.prof}</b>
                        {cl.student && <> · 👤 {cl.student}</>}
                      </span>
                      <button
                        onClick={() => removeClinic(cl.id)}
                        aria-label="외래 배정 삭제"
                        className="shrink-0 w-6 h-6 rounded-lg text-slate-400 text-xs active:scale-90 transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="date"
                value={cDate}
                onChange={e => setCDate(e.target.value)}
                className="flex-1 px-3 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 outline-none text-sm"
              />
              <div className="flex rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {(["AM", "PM"] as const).map(a => (
                  <button
                    key={a}
                    onClick={() => setCAmpm(a)}
                    className={`px-4 text-xs font-bold transition-all ${
                      cAmpm === a
                        ? "bg-sky-500 text-white"
                        : "bg-white dark:bg-slate-900 text-slate-500"
                    }`}
                  >
                    {AMPM_LABEL[a]}
                  </button>
                ))}
              </div>
            </div>
            <input
              value={cProf}
              onChange={e => setCProf(e.target.value)}
              placeholder="교수님 이름"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm text-sm"
            />
            <input
              value={cStudent}
              onChange={e => setCStudent(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addClinic()}
              placeholder="배정 학생 (여러 명이면 쉼표로)"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setClinicOpen(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 active:scale-[0.98] transition-all"
              >
                닫기
              </button>
              <button
                onClick={addClinic}
                disabled={saving || !cProf.trim()}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 text-white text-xs font-bold shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {saving ? "저장 중..." : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 추가 일정(공용) 모달 */}
      {eventOpen && room && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6"
          onClick={() => setEventOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-xl space-y-3 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">📌 추가 일정</p>
            <p className="text-[11px] text-slate-400 leading-snug">
              수술·외래가 아닌 공용 일정을 추가하면 아래 날짜별 일정표에 함께 표시돼요.
            </p>

            {room.events.length > 0 && (
              <div className="space-y-1.5">
                {room.events
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)
                  .map(ev => (
                    <div
                      key={ev.id}
                      className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2"
                    >
                      <span className="flex-1 leading-snug">
                        {fmtDateHeader(ev.date)} {fmtTime(ev.start)}-{fmtTime(ev.end)} · <b>{ev.name}</b>
                      </span>
                      <button
                        onClick={() => removeEvent(ev.id)}
                        aria-label="추가 일정 삭제"
                        className="shrink-0 w-6 h-6 rounded-lg text-slate-400 text-xs active:scale-90 transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </div>
            )}

            <input
              type="date"
              value={eDate}
              onChange={e => setEDate(e.target.value)}
              className="w-full px-3 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 outline-none text-sm"
            />
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={eStart}
                onChange={e => setEStart(e.target.value)}
                className="flex-1 px-3 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 outline-none text-sm"
              />
              <span className="text-slate-400 text-xs font-bold">~</span>
              <input
                type="time"
                value={eEnd}
                onChange={e => setEEnd(e.target.value)}
                className="flex-1 px-3 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 outline-none text-sm"
              />
            </div>
            <input
              value={eName}
              onChange={e => setEName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addEvent()}
              placeholder="일정 이름 (예: 팀 미팅, 강의)"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-violet-500/30 transition-all shadow-sm text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setEventOpen(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 active:scale-[0.98] transition-all"
              >
                닫기
              </button>
              <button
                onClick={addEvent}
                disabled={saving || !eName.trim()}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 text-white text-xs font-bold shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {saving ? "저장 중..." : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
