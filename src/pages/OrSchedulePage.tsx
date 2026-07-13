import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { OrExcelUploader } from "@/components/or/OrExcelUploader";
import { OrGridTable } from "@/components/or/OrGridTable";
import { ROOM_COLORS, useOrRooms } from "@/hooks/useOrRooms";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  OrCase,
  SectionGrid,
  ViewId,
  VIEW_LABELS,
  buildGrid,
  fmtStamp,
  splitBySection,
} from "@/utils/orSchedule";

interface OrSchedulePageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

const VIEW_IDS: ViewId[] = [1, 2, "all"];

/**
 * 수술 시간표 홈: 배정 방 목록/생성 + (방 없이 쓰는) 일회성 시간표 보기.
 */
export const OrSchedulePage: React.FC<OrSchedulePageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<OrCase[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [uploadedAt, setUploadedAt] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [view, setView] = useState<ViewId | null>(null);

  const roomsApi = useOrRooms();
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPw, setNewRoomPw] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);

  const grids = useMemo(() => {
    if (!cases) return null;
    const split = splitBySection(cases);
    return {
      1: buildGrid(split[1]),
      2: buildGrid(split[2]),
      all: buildGrid(cases),
    } as Record<ViewId, SectionGrid>;
  }, [cases]);

  const createRoom = async () => {
    const name = newRoomName.trim();
    const pw = newRoomPw.trim();
    if (!name || !pw || creatingRoom) return;
    setCreatingRoom(true);
    const meta = await roomsApi.create(name, pw);
    setCreatingRoom(false);
    if (meta) {
      setNewRoomName("");
      setNewRoomPw("");
      navigate(`/or-schedule/room/${meta.id}`);
    }
  };

  const deleteRoom = async (id: string, name: string) => {
    const pw = window.prompt(
      `'${name}' 방을 삭제하려면 삭제 비밀번호를 입력하세요.\n저장된 시간표와 배정이 모두 지워져요.`,
    );
    if (pw == null || !pw.trim()) return;
    const result = await roomsApi.remove(id, pw.trim());
    if (result === "wrong") window.alert("삭제 비밀번호가 틀렸어요.");
  };

  const pickColor = async (id: string, color: string | null) => {
    await roomsApi.setColor(id, color);
    setColorPickerId(null);
  };

  const download = async () => {
    if (!grids || !cases || view == null) return;
    setDownloading(true);
    try {
      const { exportExcel } = await import("@/utils/orExcel");
      const stamp = uploadedAt ? ` — ${fmtStamp(uploadedAt)}` : "";
      const blob = await exportExcel(
        view === "all"
          ? [{ sheetName: "전체", title: VIEW_LABELS.all + stamp, grid: grids.all }]
          : [
              { sheetName: "외과서울1", title: VIEW_LABELS[1] + stamp, grid: grids[1] },
              { sheetName: "외과서울2", title: VIEW_LABELS[2] + stamp, grid: grids[2] },
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

  return (
    <>
      <Header title="🏥 수술 시간표" isDark={isDark} onToggleDark={onToggleDark} onBack={() => navigate("/")} />

      <div className="space-y-4 animate-in fade-in slide-in-from-right duration-500 pb-16">
        {/* 배정 방 목록 */}
        {isSupabaseConfigured && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">🚪 배정 방</p>
            {roomsApi.error && (
              <p className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl">
                {roomsApi.error}
              </p>
            )}
            {roomsApi.rooms.map(r => (
              <div key={r.id} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/or-schedule/room/${r.id}`)}
                    className="flex-1 flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left active:scale-[0.98] transition-all"
                    style={r.color ? { borderLeft: `4px solid ${r.color}` } : undefined}
                  >
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{r.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {r.view == null ? "시간표 없음" : VIEW_LABELS[r.view].split(" ")[0]} →
                    </span>
                  </button>
                  <button
                    onClick={() => deleteRoom(r.id, r.name)}
                    aria-label="방 삭제"
                    className="w-9 h-9 shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs active:scale-90 transition-all"
                  >
                    ✕
                  </button>
                  <button
                    onClick={() => setColorPickerId(id => (id === r.id ? null : r.id))}
                    aria-label="방 색깔 설정"
                    className="w-9 h-9 shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 text-xs active:scale-90 transition-all flex items-center justify-center"
                  >
                    {r.color ? (
                      <span
                        className="w-4 h-4 rounded-full border border-black/10"
                        style={{ backgroundColor: r.color }}
                      />
                    ) : (
                      "🎨"
                    )}
                  </button>
                </div>
                {colorPickerId === r.id && (
                  <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    {ROOM_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => pickColor(r.id, c)}
                        aria-label={`색 ${c}`}
                        className={`w-7 h-7 rounded-full border-2 active:scale-90 transition-all ${
                          r.color === c ? "border-slate-700 dark:border-white" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <button
                      onClick={() => pickColor(r.id, null)}
                      className="text-[10px] font-bold text-slate-400 px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
                    >
                      없음
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!roomsApi.loading && roomsApi.rooms.length === 0 && !roomsApi.error && (
              <p className="text-[11px] text-slate-400 text-center py-1">
                아직 방이 없어요. 방을 만들면 시간표와 학생 배정을 저장하고 링크로 같이 볼 수 있어요.
              </p>
            )}
            <div className="space-y-2">
              <input
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                placeholder="새 방 이름 (예: 7월 1주 외과서울)"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm text-sm"
              />
              <div className="flex gap-2">
                <input
                  value={newRoomPw}
                  onChange={e => setNewRoomPw(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createRoom()}
                  placeholder="삭제 비밀번호 (방 지울 때 필요)"
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm text-sm"
                />
                <button
                  onClick={createRoom}
                  disabled={creatingRoom || !newRoomName.trim() || !newRoomPw.trim()}
                  className="px-5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {creatingRoom ? "..." : "만들기"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 방 없이 바로 보기 */}
        <OrExcelUploader
          currentFileName={cases ? fileName : undefined}
          onParsed={(parsed, name) => {
            setCases(parsed);
            setFileName(name);
            setUploadedAt(new Date().toISOString());
            setView(null);
          }}
        />

        {!cases && (
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

            {uploadedAt && (
              <p className="text-[11px] text-slate-400 text-right pr-1">🕒 {fmtStamp(uploadedAt)}</p>
            )}

            <OrGridTable grid={grids[view]} />

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
