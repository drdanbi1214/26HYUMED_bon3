// Vercel serverless function — KBO 어제+오늘 점수 프록시
export default async function handler(req: any, res: any) {
  const kst = new Date(Date.now() + 9 * 3600 * 1000);

  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
  const todayStr = fmt(kst);
  const ystd = new Date(kst);
  ystd.setDate(ystd.getDate() - 1);
  const ystdStr = fmt(ystd);

  const HEADERS = {
    "User-Agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "ko-KR,ko;q=0.9",
    Referer: "https://sports.naver.com/",
    Origin: "https://sports.naver.com",
  };

  async function fetchGames(date: string) {
    const urls = [
      `https://api-gw.sports.naver.com/schedule/games?category=kbo&date=${date}&home=&away=&size=20`,
      `https://api-gw.sports.naver.com/schedule/games?category=kbo&date=${date}`,
    ];
    for (const url of urls) {
      try {
        const resp = await fetch(url, { headers: HEADERS });
        if (!resp.ok) continue;
        const json = await resp.json();
        const raw: any[] =
          json?.result?.games ?? json?.games ?? json?.data?.games ?? [];
        if (raw.length > 0 || json?.result !== undefined) {
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
      } catch {
        continue;
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
  res.status(200).json({ today, yesterday, todayStr, ystdStr });
}
