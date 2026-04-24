import { useCallback, useEffect, useState } from "react";

export interface KboGame {
  id: string;
  away: string;
  awayScore: number | null;
  home: string;
  homeScore: number | null;
  status: string;
  time: string;
}

export function useKboScores(enabled: boolean) {
  const [games, setGames] = useState<KboGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kbo");
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      setGames(json.games ?? []);
    } catch (e) {
      setError("점수를 불러올 수 없어요.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) refresh();
  }, [enabled, refresh]);

  return { games, loading, error, refresh };
}
