// Vercel serverless function — Naver KBO API 프록시 (CORS 우회)
export default async function handler(req: any, res: any) {
  // KST = UTC+9
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  const date = kst.toISOString().slice(0, 10).replace(/-/g, "");

  try {
    const response = await fetch(
      `https://api-gw.sports.naver.com/schedule/games?category=kbo&date=${date}&home=&away=&size=20`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
          Referer: "https://sports.naver.com/",
        },
      }
    );

    if (!response.ok) throw new Error(`upstream ${response.status}`);
    const json = await response.json();

    const raw: any[] = json?.result?.games ?? [];
    const games = raw.map((g) => ({
      id: g.gameId ?? g.gameCode,
      away: g.awayTeamName ?? g.awayTeam,
      awayScore: g.awayTeamScore ?? g.awayScore ?? null,
      home: g.homeTeamName ?? g.homeTeam,
      homeScore: g.homeTeamScore ?? g.homeScore ?? null,
      status: g.statusInfo ?? g.status ?? "",
      time: g.gameTime ?? g.startTime ?? "",
    }));

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ games, date });
  } catch (e) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(500).json({ error: String(e), games: [], date: "" });
  }
}
