import React from "react";
import {
  OrCase,
  SectionGrid,
  SLOT_MIN,
  fmtDateHeader,
  fmtTime,
  roomLabel,
  surgeonColor,
} from "@/utils/orSchedule";

type SlotCell = { oc: OrCase; span: number } | "covered" | null;

interface OrGridTableProps {
  grid: SectionGrid;
  /** 학생 배정 (OrCase.idx → 이름). 있으면 블록에 표시 */
  assignments?: Record<string, string>;
  /** 있으면 수술 블록을 탭해서 배정할 수 있다 */
  onCaseClick?: (c: OrCase) => void;
}

export const OrGridTable: React.FC<OrGridTableProps> = ({ grid, assignments, onCaseClick }) => {
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
                  const dayEdge =
                    di > 0 && li === 0 ? " border-l-2 border-l-slate-400 dark:border-l-slate-500" : "";
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
                  const assigned = assignments?.[String(oc.idx)];
                  return (
                    <td
                      key={key}
                      rowSpan={span}
                      onClick={onCaseClick ? () => onCaseClick(oc) : undefined}
                      className={`border border-slate-200 dark:border-slate-700 align-top p-0${dayEdge}${
                        onCaseClick ? " cursor-pointer active:opacity-70 transition-opacity" : ""
                      }`}
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
                        <div className="text-[10px] text-slate-700 leading-tight break-keep">{oc.opName}</div>
                        <div className="text-[10px] font-bold text-slate-700">{oc.surgeon}</div>
                        {assigned && (
                          <div className="inline-block text-[10px] font-bold text-white bg-slate-700/80 rounded-full px-2 py-0.5">
                            👤 {assigned}
                          </div>
                        )}
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
