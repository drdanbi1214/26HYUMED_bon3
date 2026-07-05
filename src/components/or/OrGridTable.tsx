import React from "react";
import {
  AMPM_LABEL,
  OrCase,
  OrClinic,
  OrEvent,
  SectionGrid,
  SLOT_MIN,
  clinicRange,
  fmtDateHeader,
  fmtTime,
  roomLabel,
  studentColors,
} from "@/utils/orSchedule";

type SlotCell = { oc: OrCase; span: number } | "covered" | null;

interface ClinicBlock {
  ampm: "AM" | "PM";
  span: number;
  items: OrClinic[];
}
type ClinicCell = { block: ClinicBlock } | "covered" | null;

type EventCell = { block: { span: number; item: OrEvent } } | "covered" | null;

interface OrGridTableProps {
  grid: SectionGrid;
  /** 학생 배정 (OrCase.idx → 이름). 있으면 블록에 표시 */
  assignments?: Record<string, string>;
  /** 수술별 메모 (OrCase.idx → 메모). 있으면 블록에 표시 */
  memos?: Record<string, string>;
  /** 외래 배정. 해당 날짜에 외래 전용 열이 추가된다 */
  clinics?: OrClinic[];
  /** 공용 일정. 해당 날짜에 일정 전용 열이 추가된다 (겹치면 열이 늘어난다) */
  events?: OrEvent[];
  /** 있으면 수술 블록을 탭해서 배정할 수 있다 */
  onCaseClick?: (c: OrCase) => void;
}

export const OrGridTable: React.FC<OrGridTableProps> = ({ grid, assignments, memos, clinics, events, onCaseClick }) => {
  const slots: number[] = [];
  for (let t = grid.startMin; t < grid.endMin; t += SLOT_MIN) slots.push(t);

  // 미배정 = 연회색, 배정 = 학생별 파스텔색 (여러 명이면 첫 학생 색). 외래 배정 학생도 같은 색을 공유
  const studentColorMap = studentColors(assignments ?? {}, (clinics ?? []).map(c => c.student));

  const clinicsByDate = new Map<string, OrClinic[]>();
  for (const c of clinics ?? []) {
    const list = clinicsByDate.get(c.date);
    if (list) list.push(c);
    else clinicsByDate.set(c.date, [c]);
  }

  /** 해당 날짜의 외래 열 셀 (외래가 없으면 null → 열 자체를 안 만든다) */
  const buildClinicCol = (date: string): ClinicCell[] | null => {
    const list = clinicsByDate.get(date);
    if (!list?.length) return null;
    const colCells: ClinicCell[] = Array(slots.length).fill(null);
    for (const ampm of ["AM", "PM"] as const) {
      const items = list.filter(c => c.ampm === ampm);
      if (!items.length) continue;
      const { start, end } = clinicRange(ampm);
      const s = Math.max(0, Math.floor((Math.max(start, grid.startMin) - grid.startMin) / SLOT_MIN));
      const e = Math.max(s + 1, Math.min(slots.length, Math.ceil((Math.min(end, grid.endMin) - grid.startMin) / SLOT_MIN)));
      colCells[s] = { block: { ampm, span: e - s, items } };
      for (let i = s + 1; i < e; i++) colCells[i] = "covered";
    }
    return colCells;
  };

  const eventsByDate = new Map<string, OrEvent[]>();
  for (const ev of events ?? []) {
    const list = eventsByDate.get(ev.date);
    if (list) list.push(ev);
    else eventsByDate.set(ev.date, [ev]);
  }

  /** 해당 날짜의 일정 열들. 시간이 겹치는 일정은 레인(열)을 나눠 나란히 둔다 */
  const buildEventCols = (date: string): EventCell[][] | null => {
    const list = eventsByDate.get(date);
    if (!list?.length) return null;
    const sorted = list.slice().sort((a, b) => a.start - b.start || a.end - b.end);
    const lanes: OrEvent[][] = [];
    const laneEnds: number[] = [];
    for (const ev of sorted) {
      let i = laneEnds.findIndex(end => end <= ev.start);
      if (i === -1) {
        lanes.push([]);
        laneEnds.push(0);
        i = lanes.length - 1;
      }
      lanes[i].push(ev);
      laneEnds[i] = ev.end;
    }
    return lanes.map(lane => {
      const colCells: EventCell[] = Array(slots.length).fill(null);
      for (const ev of lane) {
        const s = Math.max(0, Math.floor((Math.max(ev.start, grid.startMin) - grid.startMin) / SLOT_MIN));
        const e = Math.min(slots.length, Math.ceil((Math.min(ev.end, grid.endMin) - grid.startMin) / SLOT_MIN));
        if (e <= s) continue;
        colCells[s] = { block: { span: e - s, item: ev } };
        for (let i = s + 1; i < e; i++) colCells[i] = "covered";
      }
      return colCells;
    });
  };

  const dayCells = grid.days.map(day => ({
    date: day.date,
    clinicCol: buildClinicCol(day.date),
    eventCols: buildEventCols(day.date),
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
                colSpan={d.cells.length + (d.clinicCol ? 1 : 0) + (d.eventCols?.length ?? 0)}
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
          {slots.map((t, ri) => {
            // 13:30(오후 시작) 기점 가로 굵은 선
            const pmLine = t === 13 * 60 + 30;
            const pmTop = pmLine ? " border-t-2 border-t-slate-400 dark:border-t-slate-500" : "";
            // 병합 셀 테두리가 인접 빈칸과 충돌해 사라지지 않도록 inset 그림자로 확실히 그림
            const caseShadow = "inset 0 0 0 1px #64748b";
            return (
            <tr key={t}>
              <td className={`sticky left-0 z-10 bg-white dark:bg-slate-900 text-[9px] text-slate-400 px-1.5 border border-slate-100 dark:border-slate-800 whitespace-nowrap text-center h-9${pmTop}`}>
                {fmtTime(t)}
              </td>
              {dayCells.flatMap((d, di) => {
                // 요일이 바뀌는 첫 레인 왼쪽은 굵은 선으로 구분
                const laneTds = d.cells.map((colCells, li) => {
                  const cell = colCells[ri];
                  const key = `${d.date}-${li}`;
                  const dayEdge =
                    di > 0 && li === 0 ? " border-l-2 border-l-slate-400 dark:border-l-slate-500" : "";
                  if (cell === "covered") return null;
                  if (cell === null) {
                    return (
                      <td
                        key={key}
                        className={`border border-slate-100 dark:border-slate-800${dayEdge}${pmTop}`}
                        style={{ minWidth: 106 }}
                      />
                    );
                  }
                  const { oc, span } = cell;
                  const assigned = assignments?.[String(oc.idx)];
                  const firstStudent = assigned?.split(/[,·/]+/)[0]?.trim();
                  const cellColor = firstStudent
                    ? studentColorMap.get(firstStudent) ?? "F1F5F9"
                    : "F1F5F9"; // 미배정은 연회색
                  return (
                    <td
                      key={key}
                      rowSpan={span}
                      onClick={onCaseClick ? () => onCaseClick(oc) : undefined}
                      className={`align-top p-0${dayEdge}${pmTop}${
                        onCaseClick ? " cursor-pointer active:opacity-70 transition-opacity" : ""
                      }`}
                      style={{ minWidth: 106, backgroundColor: `#${cellColor}`, boxShadow: caseShadow }}
                    >
                      <div className={`p-1.5 space-y-0.5${assigned ? "" : " opacity-55"}`}>
                        <div className="text-[9px] font-semibold text-slate-500">
                          {fmtTime(oc.startMin)}~{fmtTime(oc.startMin + oc.durMin)} · {roomLabel(oc.room)}
                        </div>
                        <div className="text-[11px] font-bold text-slate-800 leading-tight">
                          {oc.patientName}{" "}
                          <span className="font-normal text-slate-500">({oc.patientNo})</span>
                        </div>
                        <div className="text-[10px] text-slate-700 leading-tight break-keep">{oc.opName}</div>
                        <div className="text-[10px] font-bold text-slate-700">{oc.surgeon}</div>
                        {assigned && (
                          <div className="inline-block text-[10px] font-bold text-white bg-slate-700/80 rounded-full px-2 py-0.5">
                            👤 {assigned}
                          </div>
                        )}
                        {memos?.[String(oc.idx)] && (
                          <div className="text-[9px] text-slate-600 leading-tight break-keep">
                            📝 {memos[String(oc.idx)]}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                });

                // 외래 열 (날짜 맨 오른쪽, 수술과 분리)
                if (d.clinicCol) {
                  const cell = d.clinicCol[ri];
                  const key = `${d.date}-clinic`;
                  if (cell === "covered") laneTds.push(null);
                  else if (cell === null) {
                    laneTds.push(
                      <td
                        key={key}
                        className={`border border-slate-100 dark:border-slate-800${pmTop}`}
                        style={{ minWidth: 88 }}
                      />,
                    );
                  } else {
                    const { block } = cell;
                    // 블록 안 외래가 전부 같은 학생이면 그 학생 색, 미배정만 있으면 연회색, 섞이면 기본 하늘색
                    const clinicStudents = [
                      ...new Set(
                        block.items.map(it => it.student.split(/[,·/]+/)[0]?.trim()).filter(Boolean),
                      ),
                    ];
                    const clinicColor =
                      clinicStudents.length === 1
                        ? studentColorMap.get(clinicStudents[0]) ?? "E0F2FE"
                        : clinicStudents.length === 0
                          ? "F1F5F9"
                          : "E0F2FE";
                    laneTds.push(
                      <td
                        key={key}
                        rowSpan={block.span}
                        className={`align-top p-0${pmTop}`}
                        style={{ minWidth: 88, backgroundColor: `#${clinicColor}`, boxShadow: caseShadow }}
                      >
                        <div className={`p-1.5 space-y-1${clinicStudents.length === 0 ? " opacity-55" : ""}`}>
                          <div className="text-[9px] font-bold text-sky-600">
                            🩺 외래 · {AMPM_LABEL[block.ampm]}
                          </div>
                          {block.items.map(it => (
                            <div key={it.id} className="space-y-0.5">
                              <div className="text-[11px] font-bold text-slate-800 leading-tight">{it.prof}</div>
                              {it.student && (
                                <div className="inline-block text-[10px] font-bold text-white bg-slate-700/80 rounded-full px-2 py-0.5">
                                  👤 {it.student}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>,
                    );
                  }
                }

                // 공용 일정 열 (외래 열 오른쪽, 겹치면 여러 열)
                if (d.eventCols) {
                  d.eventCols.forEach((col, ci) => {
                    const cell = col[ri];
                    const key = `${d.date}-event-${ci}`;
                    if (cell === "covered") {
                      laneTds.push(null);
                      return;
                    }
                    if (cell === null) {
                      laneTds.push(
                        <td
                          key={key}
                          className={`border border-slate-100 dark:border-slate-800${pmTop}`}
                          style={{ minWidth: 88 }}
                        />,
                      );
                      return;
                    }
                    const ev = cell.block.item;
                    laneTds.push(
                      <td
                        key={key}
                        rowSpan={cell.block.span}
                        className={`align-top p-0${pmTop}`}
                        style={{ minWidth: 88, backgroundColor: "#EDE9FE", boxShadow: caseShadow }}
                      >
                        <div className="p-1.5 space-y-0.5">
                          <div className="text-[9px] font-bold text-violet-600">
                            📌 {fmtTime(ev.start)}~{fmtTime(ev.end)}
                          </div>
                          <div className="text-[11px] font-bold text-slate-800 leading-tight break-keep">
                            {ev.name}
                          </div>
                        </div>
                      </td>,
                    );
                  });
                }
                return laneTds;
              })}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
