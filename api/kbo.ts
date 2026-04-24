export default async function handler(req: any, res: any) {
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
  const fmtDash = (d: Date) => d.toISOString().slice(0, 10);
  const todayStr = fmt(kst);
  const todayDash = fmtDash(kst);
  const ystd = new Date(kst);
  ystd.setDate(ystd.getDate() - 1);
  const ystdStr = fmt(ystd);
  const ystdDash = fmtDash(ystd);

  const BROWSER = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "application/json, text/html, */*",
    "Accept-Language": "ko-KR,ko;q=0.9",
  };

  const debug: string[] = [];

  async function tryUrl(url: string, opts?: RequestInit) {
    try {
      const r = await fetch(url, { headers: BROWSER, ...opts });
      const text = await r.text();
      debug.push(`${r.status} ${url.slice(0, 80)} | ${text.slice(0, 100)}`);
      if (!r.ok) return null;
      try { return JSON.parse(text); } catch { return text; }
    } catch (e) { debug.push(`ERR ${url.slice(0,60)}: ${e}`); return null; }
  }

  function parseNaverGames(raw: any[]): any[] {
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

  // HTML 파싱으로 __NEXT_DATA__ 에서 경기 추출
  async function fetchFromNaverHTML(date: string, dateDash: string) {
    const html = await tryUrl(
      `https://sports.naver.com/kbaseball/schedule/index?date=${dateDash}`,
      { headers: { ...BROWSER, Accept: "text/html" } }
    );
    if (typeof html !== "string") return [];
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
    if (!m) { debug.push("__NEXT_DATA__ not found"); return []; }
    try {
      const nd = JSON.parse(m[1]);
      // 여러 경로 시도
      const raw =
        nd?.props?.pageProps?.scheduleData?.gameList ??
        nd?.props?.pageProps?.games ??
        nd?.props?.pageProps?.schedule?.games ??
        nd?.props?.initialData?.gameList ??
        [];
      debug.push(`__NEXT_DATA__ games found: ${raw.length}`);
      return parseNaverGames(raw);
    } catch (e) { debug.push(`__NEXT_DATA__ parse error: ${e}`); return []; }
  }

  async function fetchGames(date: string, dateDash: string) {
    // 1) 새 Naver 파라미터 변형들
    const naverVariants = [
      `https://api-gw.sports.naver.com/schedule/games?sports=kbo&date=${date}`,
      `https://api-gw.sports.naver.com/schedule/games?sports=KBO&date=${date}`,
      `https://api-gw.sports.naver.com/schedule/games?leagueCode=kbo&date=${date}`,
      `https://sports.naver.com/api/kbaseball/schedule?date=${date}`,
      `https://sports.naver.com/api/schedule/games?sports=kbo&date=${date}`,
    ];
    for (const url of naverVariants) {
      const j = await tryUrl(url);
      if (!j || typeof j !== "object") continue;
      const raw = j?.result?.games ?? j?.games ?? j?.data?.games ?? [];
      if (Array.isArray(raw)) return parseNaverGames(raw);
    }

    // 2) KBO 공식 사이트 AJAX
    const kboJson = await tryUrl(
      `https://www.koreabaseball.com/ws/Main.asmx/GetKBOGameList?leId=1&srId=0&date=${dateDash}`
    );
    if (kboJson && typeof kboJson === "object") {
      const raw = kboJson?.d ?? kboJson?.data ?? [];
      if (Array.isArray(raw) && raw.length > 0) {
        return raw.map((g: any) => ({
          id: g.G_ID ?? g.gameId ?? String(Math.random()),
          away: g.AWAY_NM ?? g.awayTeam ?? "?",
          awayScore: g.AWAY_SCORE != null ? Number(g.AWAY_SCORE) : null,
          home: g.HOME_NM ?? g.homeTeam ?? "?",
          homeScore: g.HOME_SCORE != null ? Number(g.HOME_SCORE) : null,
          status: g.GAME_STATE_SC ?? g.status ?? "",
          time: g.G_TM ?? g.startTime ?? "",
        }));
      }
    }

    // 3) Naver HTML 파싱 (최후 수단)
    return fetchFromNaverHTML(date, dateDash);
  }

  const [today, yesterday] = await Promise.all([
    fetchGames(todayStr, todayDash),
    fetchGames(ystdStr, ystdDash),
  ]);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ today, yesterday, todayStr, ystdStr, debug });
}
