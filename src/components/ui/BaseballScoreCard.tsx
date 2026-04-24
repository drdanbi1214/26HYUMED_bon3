// BASEBALL FEATURE
import React from "react";
import { useKboScores } from "@/hooks/useKboScores";

const STATUS_COLOR: Record<string, string> = {
  종료: "text-slate-400",
  취소: "text-red-400",
  우천취소: "text-red-400",
};

function statusColor(s: string) {
  if (STATUS_COLOR[s]) return STATUS_COLOR[s];
  if (s.includes("진행") || s.includes("회") || s.includes("말") || s.includes("초"))
    return "text-green-500 font-bold";
  return "text-blue-500"; // 예정
}

export const BaseballScoreCard: React.FC = () => {
  const { games, loading, error, refresh } = useKboScores(true);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900/50 dark:to-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Today's KBO
          </span>
          <a
            href="https://www.tving.com/sports/kbo"
            target="_blank"
            rel="noopener noreferrer"
            title="TVING 야구 생중계"
            className="text-lg leading-none active:scale-90 transition-transform"
          >
            ⚾
          </a>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-slate-400 text-base px-2 py-1 rounded-xl active:scale-90 transition-all disabled:opacity-40"
          title="새로고침"
        >
          {loading ? "⏳" : "↻"}
        </button>
      </div>

      {/* 경기 목록 */}
      {error ? (
        <p className="text-xs text-red-400 text-center py-2">{error}</p>
      ) : loading ? (
        <p className="text-xs text-slate-400 text-center py-2">불러오는 중...</p>
      ) : games.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-2">오늘 KBO 경기가 없어요 🏟️</p>
      ) : (
        <div className="space-y-1.5">
          {games.map((g) => {
            const inProgress = !["종료", "취소", "우천취소"].includes(g.status) &&
              !g.status.match(/^\d{2}:\d{2}$/);
            const scheduled = g.status.match(/^\d{2}:\d{2}$/);
            return (
              <div
                key={g.id}
                className="flex items-center justify-between text-sm"
              >
                {/* 원정팀 */}
                <span className="w-16 text-right font-bold text-slate-700 dark:text-slate-200 truncate">
                  {g.away}
                </span>

                {/* 점수 or 시간 */}
                <span className="flex-1 text-center font-black text-slate-800 dark:text-slate-100 tabular-nums">
                  {scheduled
                    ? g.status
                    : g.awayScore !== null && g.homeScore !== null
                    ? `${g.awayScore} : ${g.homeScore}`
                    : "- : -"}
                </span>

                {/* 홈팀 */}
                <span className="w-16 font-bold text-slate-700 dark:text-slate-200 truncate">
                  {g.home}
                </span>

                {/* 상태 */}
                <span className={`w-14 text-right text-[10px] ${statusColor(g.status)}`}>
                  {inProgress ? g.status : scheduled ? "예정" : g.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
