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
    Referer: "https://sports.daum.net/",
  };

  const debug: string[] = [];

  async function tryUrl(url: string, opts?: RequestInit) {
    try {
      const r = await fetch(url, { headers: BROWSER, ...opts });
      const text = await r.text();
      debug.push(`${r.status} ${url.slice(0, 90)} | ${text.slice(0, 120)}`);
      if (!r.ok) return null;
      try { return JSON.parse(text); } catch { return text; }
    } catch (e) { debug.push(`ERR ${url.slice(0, 70)}: ${e}`); return null; }
  }

  // ── 다음(카카오) 스포츠 파서 ───────────────────────────────────────────────
  function parseDaumGames(list: any[]): any[] {
    return list.map((g: any) => ({
      id: g.gameCode ?? g.id ?? String(Math.random()),
      away: g.awayTeamName ?? g.away ?? "?",
      awayScore: g.awayScore ?? g.awayPoint ?? null,
      home: g.homeTeamName ?? g.home ?? "?",
      homeScore: g.homeScore ?? g.homePoint ?? null,
      status: g.statusCode ?? g.gameStatus ?? g.status ?? "",
      time: g.startTime ?? g.gameTime ?? "",
    }));
  }

  // ── 네이버 파서 ───────────────────────────────────────────────────────────
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

  // ── 전략 1: 다음 스포츠 JSON ──────────────────────────────────────────────
  async function fetchDaum(date: string): Promise<any[] | null> {
    const urls = [
      `https://sports.daum.net/prx/kspo/pc/baseball/schedule/kbo?date=${date}`,
      `https://score.sports.media.daum.net/sports/baseball/kbo/schedule.json?date=${date}`,
      `https://m.sports.daum.net/sports/baseball/schedule/kbo?date=${date}`,
    ];
    for (const url of urls) {
      const j = await tryUrl(url);
      if (!j || typeof j !== "object") continue;
      const list =
        j?.data?.list ?? j?.list ?? j?.result?.list ??
        j?.games ?? j?.data?.games ?? j?.schedule ?? [];
      if (Array.isArray(list) && list.length > 0) return parseDaumGames(list);
    }
    return null;
  }

  // ── 전략 2: 네이버 API 변형들 ─────────────────────────────────────────────
  async function fetchNaver(date: string): Promise<any[] | null> {
    const urls = [
      `https://api-gw.sports.naver.com/schedule/games?sports=kbo&date=${date}`,
      `https://api-gw.sports.naver.com/schedule/games?sports=KBO&date=${date}`,
      `https://api-gw.sports.naver.com/schedule/games?leagueCode=kbo&date=${date}`,
      `https://sports.naver.com/api/kbaseball/schedule?date=${date}`,
    ];
    for (const url of urls) {
      const j = await tryUrl(url);
      if (!j || typeof j !== "object") continue;
      const raw = j?.result?.games ?? j?.games ?? j?.data?.games ?? [];
      if (Array.isArray(raw) && raw.length > 0) return parseNaverGames(raw);
    }
    return null;
  }

  // ── 전략 3: KBO 공식 AJAX ────────────────────────────────────────────────
  async function fetchKboOfficial(dateDash: string): Promise<any[] | null> {
    // KBO는 날짜 형식이 YYYY-MM-DD 또는 YYYYMMDD 둘 다 시도
    const urls = [
      `https://www.koreabaseball.com/ws/Main.asmx/GetKBOGameList?leId=1&srId=0&date=${dateDash}`,
      `https://www.koreabaseball.com/ws/Main.asmx/GetKBOGameList?leId=1&srId=0&date=${dateDash.replace(/-/g, "")}`,
      `https://www.koreabaseball.com/ws/game.asmx/GetScheduleList?leId=1&srId=0&date=${dateDash}`,
    ];
    for (const url of urls) {
      const j = await tryUrl(url, {
        headers: {
          ...BROWSER,
          Referer: "https://www.koreabaseball.com/",
          Accept: "application/json, text/javascript, */*",
        },
      });
      if (!j || typeof j !== "object") continue;
      const raw = j?.d ?? j?.data ?? j?.list ?? [];
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
    return null;
  }

  // ── 전략 4: 네이버 HTML __NEXT_DATA__ 스크래핑 ───────────────────────────
  async function fetchNaverHTML(dateDash: string): Promise<any[]> {
    const html = await tryUrl(
      `https://sports.naver.com/kbaseball/schedule/index?date=${dateDash}`,
      { headers: { ...BROWSER, Accept: "text/html", Referer: "https://sports.naver.com/" } }
    );
    if (typeof html !== "string") return [];
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
    if (!m) { debug.push("__NEXT_DATA__ not found"); return []; }
    try {
      const nd = JSON.parse(m[1]);
      const raw =
        nd?.props?.pageProps?.scheduleData?.gameList ??
        nd?.props?.pageProps?.games ??
        nd?.props?.pageProps?.schedule?.games ??
        nd?.props?.initialData?.gameList ??
        [];
      debug.push(`__NEXT_DATA__ games: ${raw.length}`);
      return parseNaverGames(raw);
    } catch (e) { debug.push(`__NEXT_DATA__ parse error: ${e}`); return []; }
  }

  // ── 전략 5: 다음 HTML 스크래핑 ───────────────────────────────────────────
  async function fetchDaumHTML(date: string): Promise<any[]> {
    const html = await tryUrl(
      `https://sports.daum.net/game/baseball/kbo?date=${date}`,
      { headers: { ...BROWSER, Accept: "text/html", Referer: "https://sports.daum.net/" } }
    );
    if (typeof html !== "string") return [];
    // __NEXT_DATA__ or window.__APP_DATA__ 등 시도
    const m =
      html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/) ??
      html.match(/window\.__REDUX_STATE__\s*=\s*(\{.+?\});\s*<\/script>/s);
    if (!m) { debug.push("daum html: data script not found"); return []; }
    try {
      const nd = JSON.parse(m[1]);
      const raw =
        nd?.props?.pageProps?.gameList ??
        nd?.props?.pageProps?.scheduleList ??
        nd?.schedule?.list ??
        [];
      debug.push(`daum html games: ${raw.length}`);
      return parseDaumGames(Array.isArray(raw) ? raw : []);
    } catch (e) { debug.push(`daum html parse error: ${e}`); return []; }
  }

  async function fetchGames(date: string, dateDash: string): Promise<any[]> {
    // 1순위: 다음 스포츠 JSON
    const daum = await fetchDaum(date);
    if (daum && daum.length > 0) { debug.push(`daum ok: ${daum.length} games`); return daum; }

    // 2순위: 네이버 API
    const naver = await fetchNaver(date);
    if (naver && naver.length > 0) { debug.push(`naver api ok: ${naver.length} games`); return naver; }

    // 3순위: KBO 공식
    const kbo = await fetchKboOfficial(dateDash);
    if (kbo && kbo.length > 0) { debug.push(`kbo official ok: ${kbo.length} games`); return kbo; }

    // 4순위: 네이버 HTML
    const naverHtml = await fetchNaverHTML(dateDash);
    if (naverHtml.length > 0) { debug.push(`naver html ok: ${naverHtml.length} games`); return naverHtml; }

    // 5순위: 다음 HTML
    return fetchDaumHTML(date);
  }

  const [today, yesterday] = await Promise.all([
    fetchGames(todayStr, todayDash),
    fetchGames(ystdStr, ystdDash),
  ]);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ today, yesterday, todayStr, ystdStr, debug });
}
