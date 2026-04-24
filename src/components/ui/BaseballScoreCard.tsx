// BASEBALL FEATURE
import React from "react";
import { useKboScores, type KboGame } from "@/hooks/useKboScores";

function isLive(status: string) {
  return status === "2" || status.includes("회") || status.includes("진행") || status.includes("초") || status.includes("말");
}
function isDone(status: string) {
  return status === "3" || ["종료", "취소", "우천취소"].includes(status);
}
function isScheduled(status: string) {
  return status === "1" || (!isLive(status) && !isDone(status));
}

function GameRow({ g, showTime }: { g: KboGame; showTime?: boolean }) {
  const live = isLive(g.status);
  const done = isDone(g.status);
  const scheduled = isScheduled(g.status);

  const awayWon = done && g.awayScore !== null && g.homeScore !== null && g.awayScore > g.homeScore;
  const homeWon = done && g.awayScore !== null && g.homeScore !== null && g.homeScore > g.awayScore;

  const awayScore = scheduled ? null : g.awayScore;
  const homeScore = scheduled ? null : g.homeScore;

  const RED = "#ef4444";
  const GRAY = "#94a3b8";
  const BLUE = "#3b82f6";
  const GREEN = "#22c55e";
  const DEFAULT = "";

  return (
    <div className="flex items-center justify-between text-lg py-1 gap-1">
      <span
        className="truncate font-bold w-[28%] text-right text-slate-700 dark:text-slate-200"
        style={awayWon ? { color: RED } : undefined}
      >
        {g.away}
      </span>
      {scheduled ? (
        <span className="font-black tabular-nums text-lg w-[44%] text-center shrink-0" style={{ color: BLUE }}>
          {showTime ? g.time || "-" : "-:-"}
        </span>
      ) : (
        <span className="font-black tabular-nums text-lg w-[44%] text-center shrink-0 flex justify-center gap-0.5">
          <span style={{ color: live ? GREEN : awayWon ? RED : GRAY }}>{awayScore ?? "-"}</span>
          <span style={{ color: GRAY }}>:</span>
          <span style={{ color: live ? GREEN : homeWon ? RED : GRAY }}>{homeScore ?? "-"}</span>
        </span>
      )}
      <span
        className="truncate font-bold w-[28%] text-slate-700 dark:text-slate-200"
        style={homeWon ? { color: RED } : undefined}
      >
        {g.home}
      </span>
    </div>
  );
}

function Column({
  title,
  games,
  emptyMsg,
  showTime,
}: {
  title: string;
  games: KboGame[];
  emptyMsg: string;
  showTime?: boolean;
}) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 text-center">
        {title}
      </p>
      {games.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-1">{emptyMsg}</p>
      ) : (
        <div className="space-y-0.5">
          {games.map((g) => (
            <GameRow key={g.id} g={g} showTime={showTime} />
          ))}
        </div>
      )}
    </div>
  );
}

export const BaseballScoreCard: React.FC = () => {
  const { data, loading, error, refresh } = useKboScores(true);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900/50 dark:to-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black text-slate-600 dark:text-slate-300">오늘의 야구</span>
          <a
            href="https://www.tving.com/sports/kbo"
            target="_blank"
            rel="noopener noreferrer"
            title="TVING 생중계"
            className="text-lg leading-none active:scale-90 transition-transform"
          >
            ⚾
          </a>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-slate-400 text-sm px-2 py-0.5 rounded-lg active:scale-90 transition-all disabled:opacity-40"
          title="새로고침"
        >
          {loading ? "⏳" : "↻"}
        </button>
      </div>

      {error ? (
        <p className="text-xs text-red-400 text-center py-2">{error}</p>
      ) : loading ? (
        <p className="text-xs text-slate-400 text-center py-2">불러오는 중...</p>
      ) : (
        <div className="flex gap-3">
          <Column
            title="어제 결과"
            games={data.yesterday}
            emptyMsg="경기 없음"
          />
          {/* 구분선 */}
          <div className="w-px bg-slate-200 dark:bg-slate-700 shrink-0" />
          <Column
            title="오늘 경기"
            games={data.today}
            emptyMsg="경기 없음"
            showTime
          />
        </div>
      )}
    </div>
  );
};
