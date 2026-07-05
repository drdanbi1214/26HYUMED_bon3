import React, { useMemo } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { WeekCard } from "@/components/schedule/WeekCard";
import { Icon } from "@/components/ui/Icon";
import { curWeek, fmtD } from "@/utils/date";
import { buildSearchResult } from "@/utils/buildSchedule";
import { useClosures } from "@/hooks/useClosures";

interface SchedulePageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

/**
 * 실습 일정 페이지.
 * URL: /schedule/:id (예: /schedule/C3)
 * - :id를 파싱해서 buildSearchResult()로 주차별 일정을 만든다.
 * - location.state.name이 있으면 해당 이름을 표시 (이름 검색해서 온 경우).
 * - :id가 잘못된 형식이거나 해당 조원이 없으면 홈으로 리다이렉트.
 */
export const SchedulePage: React.FC<SchedulePageProps> = ({ isDark, onToggleDark }) => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // state로 이름이 넘어왔으면 그걸 사용 (이름 검색 케이스)
  const stateName = (location.state as { name?: string } | null)?.name;

  const res = useMemo(() => {
    if (!id) return null;
    const m = id.toUpperCase().match(/^([A-I])(\d)$/);
    if (!m) return null;
    return buildSearchResult(m[1], +m[2], stateName);
  }, [id, stateName]);

  const { closures } = useClosures();

  if (!res) return <Navigate to="/" replace />;

  const cw = curWeek();
  const curNum = typeof cw === "number" ? cw : null;
  const cur = res.weeks.find(w => w.w === curNum);
  const nxt = res.weeks.find(w => curNum !== null && w.w === curNum + 1);

  /** 36주 실습 일정을 .ics로 만들어 아이폰/구글 캘린더에 바로 넣을 수 있게 다운로드 */
  const downloadICS = () => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const ymd = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1");
    const events = res.weeks
      .filter(w => w.a.length > 0)
      .map(w => {
        const end = new Date(w.d.e);
        end.setDate(end.getDate() + 1); // DTEND는 마지막 날의 다음 날 (exclusive)
        const dept = w.a.map(x => x.dept).join(" / ");
        const co = w.a.flatMap(x => x.co).join(", ");
        return [
          "BEGIN:VEVENT",
          `UID:bon3-${res.g}${res.n}-w${w.w}@26hyumed`,
          `DTSTART;VALUE=DATE:${ymd(w.d.s)}`,
          `DTEND;VALUE=DATE:${ymd(end)}`,
          `SUMMARY:${esc(`[실습] ${dept}`)}`,
          `DESCRIPTION:${esc(`${w.w}주차${co ? ` · 공동실습: ${co}` : ""}`)}`,
          "END:VEVENT",
        ].join("\r\n");
      });
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//26HYUMED bon3//KR",
      "CALSCALE:GREGORIAN",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${res.g}${res.n}_실습일정.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    let csv = "\ufeff";
    csv += "주차,날짜,실습과,공동실습생\n";
    res.weeks.forEach(w => {
      const deptStr = w.a.map(x => x.dept).join(" / ");
      const coStr = w.a.flatMap(x => x.co).join(", ");
      csv += `${w.w}주차,${fmtD(w.d.s)}-${fmtD(w.d.e)},"${deptStr}","${coStr}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${res.name}_실습일정.csv`;
    link.click();
  };

  return (
    <>
      <Header
        title="🩺 2026 본3 실습"
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate("/")}
      />

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {res.name}
              <span className="ml-2 text-base font-medium text-slate-400">
                {res.g}
                {res.n}
              </span>
            </h2>
            <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                이번 주차는{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400 underline underline-offset-4 decoration-blue-500/30">
                  {curNum ? `${curNum}주차 ${cur?.a[0]?.dept || "일정 없음"}` : "현재 실습 기간이 아닙니다"}
                </span>{" "}
                실습입니다.
              </p>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                다음 주차는{" "}
                <span className="font-bold text-indigo-600 dark:text-indigo-400 underline underline-offset-4 decoration-indigo-500/30">
                  {curNum ? `${curNum + 1}주차 ${nxt?.a[0]?.dept || "일정 없음"}` : "차주 실습 기간이 아닙니다"}
                </span>{" "}
                실습입니다.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadCSV}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50"
              aria-label="CSV 다운로드"
            >
              <Icon size={20}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </Icon>
            </button>
            <a
              href="https://drive.google.com/drive/folders/1K87u0jfBgoWONFOdx6_bMP7eft75U-2L?usp=drive_link"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm transition-all hover:bg-indigo-100"
              aria-label="공용 드라이브"
            >
              <Icon size={20}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </Icon>
            </a>
          </div>
        </div>

        <button
          onClick={downloadICS}
          className="w-full py-3.5 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20 text-xs font-bold text-blue-600 dark:text-blue-400 active:scale-[0.98] transition-all"
        >
          📅 내 캘린더에 일정 넣기 (아이폰/구글 캘린더)
        </button>

        <div className="space-y-3">
          {res.weeks.map(week => (
            <WeekCard key={week.w} week={week} isCurrent={week.w === cw} closures={closures} />
          ))}
        </div>
      </div>
    </>
  );
};
