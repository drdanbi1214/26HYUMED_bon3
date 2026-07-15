import ExcelJS from "exceljs";
import {
  AMPM_LABEL,
  OrCase,
  OrClinic,
  SectionGrid,
  SLOT_MIN,
  caseText,
  clinicRange,
  fmtDateHeader,
  fmtTime,
  surgeonColor,
} from "./orSchedule";

// ───────────────────────── 업로드 파싱 ─────────────────────────

const COLS = [
  "수술일자", "환자번호", "환자명", "수술실", "시작",
  "수술명", "집도의", "소요", "상태", "취소일시", "협진", "응급",
] as const;
type ColKey = (typeof COLS)[number];
const REQUIRED: ColKey[] = ["수술일자", "집도의"];

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    const o = v as { richText?: { text: string }[]; text?: unknown; result?: unknown };
    if (Array.isArray(o.richText)) return o.richText.map(r => r.text).join("").trim();
    if (o.text != null) return String(o.text).trim();
    if (o.result != null) return String(o.result).trim();
    return "";
  }
  return String(v).trim();
}

function toDateKey(v: ExcelJS.CellValue): string {
  if (v instanceof Date) {
    // exceljs는 날짜 셀을 UTC 기준 Date로 돌려주므로 UTC getter로 읽어야 하루 밀리지 않는다
    return `${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, "0")}-${String(v.getUTCDate()).padStart(2, "0")}`;
  }
  const m = cellText(v).match(/(\d{4})[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})/);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : "";
}

function toMinutes(v: ExcelJS.CellValue): number | null {
  if (v instanceof Date) return v.getUTCHours() * 60 + v.getUTCMinutes();
  if (typeof v === "number") return v < 2 ? Math.round(v * 24 * 60) : Math.round(v);
  const m = cellText(v).match(/(\d{1,2})\s*[:시]\s*(\d{1,2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function numText(v: ExcelJS.CellValue): string {
  if (typeof v === "number") return String(Math.round(v));
  return cellText(v);
}

/**
 * 소요시간(분). 파일에 따라 숫자(120), 텍스트("120", "120분"),
 * 시간 셀(2:00), 수식 결과 등 제각각이라 전부 분으로 환산한다.
 */
function toDuration(v: ExcelJS.CellValue): number | null {
  if (typeof v === "number") {
    if (v <= 0) return null;
    return v < 1 ? Math.round(v * 24 * 60) : Math.round(v); // 1 미만이면 엑셀 시간 분수
  }
  if (v instanceof Date) return v.getUTCHours() * 60 + v.getUTCMinutes();
  const t = cellText(v);
  const hm = t.match(/(\d{1,2})\s*:\s*(\d{2})/);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2]);
  const m = t.match(/\d+/);
  return m ? Number(m[0]) : null;
}

interface SheetMatch {
  ws: ExcelJS.Worksheet;
  headerRow: number;
  cols: Partial<Record<ColKey, number>>;
  score: number;
}

/**
 * "수술일자·집도의" 헤더가 있는 시트를 찾아 수술 목록으로 파싱한다.
 * 같은 형식 시트가 여러 개면(과거 파일의 시트1처럼) '호출시간' 헤더가 있고
 * 데이터가 많은 쪽(=시트3 형식)을 고른다.
 */
export async function parseOrExcel(buf: ArrayBuffer): Promise<OrCase[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);

  let best: SheetMatch | null = null;
  wb.eachSheet(ws => {
    for (let r = 1; r <= Math.min(10, ws.rowCount); r++) {
      const cols: Partial<Record<ColKey, number>> = {};
      let hasCallTime = false;
      ws.getRow(r).eachCell((cell, colNumber) => {
        const t = cellText(cell.value).replace(/\s/g, "");
        if (t === "호출시간") hasCallTime = true;
        if ((COLS as readonly string[]).includes(t) && cols[t as ColKey] == null) {
          cols[t as ColKey] = colNumber;
        }
      });
      if (!REQUIRED.every(h => cols[h] != null)) continue;
      let dataRows = 0;
      for (let dr = r + 1; dr <= ws.rowCount; dr++) {
        if (toDateKey(ws.getRow(dr).getCell(cols["수술일자"]!).value)) dataRows++;
      }
      const score = dataRows + (hasCallTime ? 10000 : 0);
      if (!best || score > best.score) best = { ws, headerRow: r, cols, score };
      break;
    }
  });
  if (!best) return [];
  const { ws, headerRow, cols } = best as SheetMatch;

  const get = (row: ExcelJS.Row, key: ColKey) =>
    cols[key] != null ? row.getCell(cols[key]!).value : null;

  const out: OrCase[] = [];
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const date = toDateKey(get(row, "수술일자"));
    const patientName = cellText(get(row, "환자명"));
    if (!date || !patientName) continue;
    if (cellText(get(row, "상태")).includes("취소")) continue;
    if (cellText(get(row, "취소일시"))) continue;
    const startMin = toMinutes(get(row, "시작"));
    if (startMin == null) continue;
    out.push({
      idx: out.length,
      date,
      startMin,
      durMin: toDuration(get(row, "소요")) ?? 60,
      room: numText(get(row, "수술실")) || "?",
      patientNo: numText(get(row, "환자번호")),
      patientName,
      opName: cellText(get(row, "수술명")) || "수술명 미정",
      surgeon: cellText(get(row, "집도의")) || "?",
      referral: cellText(get(row, "협진")).toUpperCase() === "Y",
      emergency: cellText(get(row, "응급")).toUpperCase() === "Y",
    });
  }
  return out;
}

/**
 * 비밀번호 걸린 xlsx(암호화 CFB 컨테이너)를 해독해서 일반 xlsx 버퍼로 돌려준다.
 * exceljs는 암호화 파일을 못 열어서 xlsx-populate로 먼저 푼다.
 */
export async function decryptXlsx(buf: ArrayBuffer, password: string): Promise<ArrayBuffer> {
  const { default: XlsxPopulate } = await import("xlsx-populate/browser/xlsx-populate.min.js");
  const wb = await XlsxPopulate.fromDataAsync(buf, { password });
  const out = await wb.outputAsync("arraybuffer");
  // xlsx-populate가 빈 docProps/app.xml을 쓰는데 exceljs가 이걸 읽다 죽는다
  // ("Cannot read properties of undefined (reading 'company')") → 제거하면 exceljs가 그냥 건너뜀
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(out);
  zip.remove("docProps/app.xml");
  return zip.generateAsync({ type: "arraybuffer" });
}

// ───────────────────────── 엑셀 다운로드 ─────────────────────────

const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFCBD5E1" } },
  left: { style: "thin", color: { argb: "FFCBD5E1" } },
  bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
  right: { style: "thin", color: { argb: "FFCBD5E1" } },
};

export async function exportExcel(
  sheets: {
    sheetName: string;
    title: string;
    grid: SectionGrid;
    /** 학생 배정 (OrCase.idx → 이름). 있으면 셀에 같이 적는다 */
    assignments?: Record<string, string>;
    /** 외래 배정. 해당 날짜 오른쪽에 외래 열이 추가된다 */
    clinics?: OrClinic[];
  }[],
): Promise<Blob> {
  const wb = new ExcelJS.Workbook();

  for (const { sheetName, title: titleText, grid, assignments, clinics } of sheets) {
    const ws = wb.addWorksheet(sheetName);
    const slots: number[] = [];
    for (let t = grid.startMin; t < grid.endMin; t += SLOT_MIN) slots.push(t);

    const clinicsByDate = new Map<string, OrClinic[]>();
    for (const c of clinics ?? []) {
      const list = clinicsByDate.get(c.date);
      if (list) list.push(c);
      else clinicsByDate.set(c.date, [c]);
    }
    // 각 날짜의 열 수 = 수술 레인 + (외래 있으면 1)
    const dayWidths = grid.days.map(d => d.lanes.length + (clinicsByDate.has(d.date) ? 1 : 0));
    const totalLanes = dayWidths.reduce((s, w) => s + w, 0);
    const lastCol = 1 + Math.max(totalLanes, 1);

    ws.mergeCells(1, 1, 1, lastCol);
    const title = ws.getCell(1, 1);
    title.value = `${titleText} 수술 시간표`;
    title.font = { bold: true, size: 12 };
    title.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 22;

    // 날짜 헤더 (레인 수만큼 가로 병합)
    const timeHead = ws.getCell(2, 1);
    timeHead.value = "시간";
    timeHead.font = { bold: true, size: 9 };
    timeHead.alignment = { horizontal: "center", vertical: "middle" };
    let col = 2;
    for (const [di, day] of grid.days.entries()) {
      const from = col;
      const to = col + dayWidths[di] - 1;
      if (to > from) ws.mergeCells(2, from, 2, to);
      const cell = ws.getCell(2, from);
      cell.value = fmtDateHeader(day.date);
      cell.font = { bold: true, size: 10 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
      col = to + 1;
    }

    slots.forEach((t, i) => {
      const cell = ws.getCell(3 + i, 1);
      cell.value = `${fmtTime(t)} ~ ${fmtTime(t + SLOT_MIN)}`;
      cell.font = { size: 8, color: { argb: "FF64748B" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // 빈 칸 기본 테두리(연함)를 먼저 깔고, 수술 박스는 진한 테두리로 덮는다
    for (let r = 2; r <= 2 + slots.length; r++) {
      for (let cc = 1; cc <= lastCol; cc++) {
        ws.getCell(r, cc).border = BORDER;
      }
    }

    // 수술 박스: 같은 색이 위아래로 붙어도 구분되도록 진한 테두리
    const caseBorder: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "FF475569" } },
      left: { style: "thin", color: { argb: "FF475569" } },
      bottom: { style: "thin", color: { argb: "FF475569" } },
      right: { style: "thin", color: { argb: "FF475569" } },
    };
    col = 2;
    for (const day of grid.days) {
      for (const lane of day.lanes) {
        for (const c of lane) {
          const r1 = 3 + Math.floor((c.startMin - grid.startMin) / SLOT_MIN);
          const r2 = Math.max(
            r1,
            3 + Math.ceil((c.startMin + c.durMin - grid.startMin) / SLOT_MIN) - 1,
          );
          if (r2 > r1) ws.mergeCells(r1, col, r2, col);
          const cell = ws.getCell(r1, col);
          const assigned = assignments?.[String(c.idx)];
          cell.value =
            `${fmtTime(c.startMin)}~${fmtTime(c.startMin + c.durMin)}\n${caseText(c)}` +
            (assigned ? `\n배정: ${assigned}` : "");
          cell.font = { size: 8 };
          cell.alignment = { wrapText: true, vertical: "top" };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: `FF${surgeonColor(c.surgeon)}` },
          };
          cell.border = caseBorder;
        }
        col++;
      }
      // 외래 열 (날짜 맨 오른쪽)
      const dayClinics = clinicsByDate.get(day.date);
      if (dayClinics) {
        for (const ampm of ["AM", "PM"] as const) {
          const items = dayClinics.filter(c => c.ampm === ampm);
          if (!items.length) continue;
          const { start, end } = clinicRange(ampm);
          const r1 = 3 + Math.max(0, Math.floor((Math.max(start, grid.startMin) - grid.startMin) / SLOT_MIN));
          const r2 = Math.max(
            r1,
            3 + Math.min(slots.length, Math.ceil((Math.min(end, grid.endMin) - grid.startMin) / SLOT_MIN)) - 1,
          );
          if (r2 > r1) ws.mergeCells(r1, col, r2, col);
          const cell = ws.getCell(r1, col);
          cell.value =
            `외래(${AMPM_LABEL[ampm]})\n` +
            items.map(i => `${i.prof}${i.student ? ` 배정: ${i.student}` : ""}`).join("\n");
          cell.font = { size: 8 };
          cell.alignment = { wrapText: true, vertical: "top" };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0F2FE" } };
          cell.border = caseBorder;
        }
        col++;
      }
    }

    // 요일 경계(각 날짜의 첫 레인 열 왼쪽)는 굵은 선으로 — 기존 테두리는 유지하고 왼쪽만 덮어쓴다
    {
      const mediumLeft = { style: "medium" as const, color: { argb: "FF64748B" } };
      let boundaryCol = 2;
      grid.days.forEach((_, di) => {
        if (di > 0) {
          for (let r = 2; r <= 2 + slots.length; r++) {
            const cell = ws.getCell(r, boundaryCol);
            cell.border = { ...cell.border, left: mediumLeft };
          }
        }
        boundaryCol += dayWidths[di];
      });
    }

    // 13:30(오후 시작) 기점 가로 굵은 선
    {
      const pmMin = 13 * 60 + 30;
      if (pmMin > grid.startMin && pmMin < grid.endMin) {
        const pmRow = 3 + (pmMin - grid.startMin) / SLOT_MIN;
        const mediumTop = { style: "medium" as const, color: { argb: "FF64748B" } };
        for (let cc = 1; cc <= lastCol; cc++) {
          const cell = ws.getCell(pmRow, cc);
          cell.border = { ...cell.border, top: mediumTop };
        }
      }
    }
    ws.getColumn(1).width = 12;
    for (let cc = 2; cc <= lastCol; cc++) ws.getColumn(cc).width = 17;
    ws.views = [{ state: "frozen", xSplit: 1, ySplit: 2 }];
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
