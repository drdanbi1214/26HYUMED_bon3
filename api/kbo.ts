// Vercel serverless function — KBO 점수 프록시
export default async function handler(req: any, res: any) {
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  const date = kst.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

  const HEADERS = {
    "User-Agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "ko-KR,ko;q=0.9",
    Referer: "https://sports.naver.com/",
    Origin: "https://sports.naver.com",
  };

  // 여러 엔드포인트 순서대로 시도
  const URLS = [
    `https://api-gw.sports.naver.com/schedule/games?category=kbo&date=${date}&home=&away=&size=20`,
    `https://api-gw.sports.naver.com/schedule/games?category=kbo&date=${date}`,
    `https://sports.naver.com/api/kbo/schedule?date=${date}`,
  ];

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  for (const url of URLS) {
    try {
      const resp = await fetch(url, { headers: HEADERS });
      if (!resp.ok) continue;

      const json = await resp.json();

      // 응답 구조 유연하게 처리
      const raw: any[] =
        json?.result?.games ??
        json?.games ??
        json?.data?.games ??
        json?.list ??
        [];

      const games = raw.map((g: any) => ({
        id: g.gameId ?? g.gameCode ?? String(Math.random()),
        away: g.awayTeamName ?? g.awayTeam ?? g.away ?? "?",
        awayScore: g.awayTeamScore ?? g.awayScore ?? null,
        home: g.homeTeamName ?? g.homeTeam ?? g.home ?? "?",
        homeScore: g.homeTeamScore ?? g.homeScore ?? null,
        status: g.statusInfo ?? g.gameStatusInfo ?? g.status ?? "",
        time: g.gameTime ?? g.startTime ?? g.time ?? "",
      }));

      return res.status(200).json({ games, date, source: url });
    } catch {
      continue;
    }
  }

  // 모든 엔드포인트 실패 시 목업 (UI 테스트용)
  return res.status(200).json({
    games: [],
    date,
    error: "KBO 데이터를 가져올 수 없어요. 경기가 없거나 API 점검 중일 수 있어요.",
  });
}
