// Vercel serverless function — KBO 어제+오늘 점수 프록시
export default async function handler(req: any, res: any) {
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
  const todayStr = fmt(kst);
  const ystd = new Date(kst);
  ystd.setDate(ystd.getDate() - 1);
  const ystdStr = fmt(ystd);

  const HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    Accept: "application/json, */*",
    "Accept-Language": "ko-KR,ko;q=0.9",
    Referer: "https://sports.naver.com/kbaseball/schedule/index",
    Origin: "https://sports.naver.com",
  };

  const debug: string[] = [];

  async function fetchGames(date: string) {
    const urls = [
      `https://api-gw.sports.naver.com/schedule/games?category=kbo&date=${date}&home=&away=&size=20`,
      `https://api-gw.sports.naver.com/schedule/games?category=kbo&date=${date}`,
      `https://m.sports.naver.com/ajax/baseball/kbo/schedule/schedule.nhn?date=${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`,
    ];
    for (const url of urls) {
      try {
        const resp = await fetch(url, { headers: HEADERS });
        const text = await resp.text();
        debug.push(`[${date}] ${url} → ${resp.status} | ${text.slice(0, 120)}`);
        if (!resp.ok) continue;
        let json: any;
        try { json = JSON.parse(text); } catch { continue; }

        const raw: any[] =
          json?.result?.games ??
          json?.games ??
          json?.data?.games ??
          json?.list ??
          [];

        if (json?.result !== undefined || json?.games !== undefined) {
          return raw.map((g: any) => ({
            id: g.gameId ?? g.gameCode ?? String(Math.random()),
            away: g.awayTeamName ?? g.awayTeam ?? "?",
            awayScore: g.awayTeamScore ?? g.awayScore ?? null,
            home: g.homeTeamName ?? g.homeTeam ?? "?",
            homeScore: g.homeTeamScore ?? g.homeScore ?? null,
            status: g.statusInfo ?? g.gameStatusInfo ?? g.status ?? "",
            time: g.gameTime ?? g.startTime ?? g.time ?? "",
          }));
        }
      } catch (e) {
        debug.push(`[${date}] error: ${e}`);
      }
    }
    return [];
  }

  const [today, yesterday] = await Promise.all([
    fetchGames(todayStr),
    fetchGames(ystdStr),
  ]);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ today, yesterday, todayStr, ystdStr, debug });
}
