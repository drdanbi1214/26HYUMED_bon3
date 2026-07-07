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
      // 느린 사이트 하나가 전체 응답을 붙잡지 않게 요청당 3초 제한
      const r = await fetch(url, { headers: BROWSER, signal: AbortSignal.timeout(3000), ...opts });
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

  // ── 전략 3: KBO 공식 AJAX (대소문자 수정: GetKboGameList) ─────────────────
  async function fetchKboOfficial(dateDash: string): Promise<any[] | null> {
    const kboHeaders = {
      ...BROWSER,
      Referer: "https://www.koreabaseball.com/",
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    };
    // YYYYMMDD 형식만 작동 (대시 형식은 "날짜 변환 불가" 오류)
    const dates = [dateDash.replace(/-/g, ""), dateDash];
    for (const date of dates) {
      const url = `https://www.koreabaseball.com/ws/Main.asmx/GetKboGameList?leId=1&srId=0&date=${date}`;
      const j = await tryUrl(url, { headers: kboHeaders });
      if (!j || typeof j !== "object") continue;
      // 응답 구조: { game: [...] } — YYYYMMDD 형식에서 확인됨
      const raw = j?.game ?? j?.d ?? j?.data ?? [];
      const list = Array.isArray(raw) ? raw : raw?.list ?? raw?.gameList ?? [];
      if (list.length > 0) {
        // 첫 번째 경기 전체 필드를 debug에 기록해 점수 필드명 확인
        debug.push(`kbo sample: ${JSON.stringify(list[0]).slice(0, 300)}`);
        return list.map((g: any) => ({
          id: g.G_ID ?? g.gameId ?? String(Math.random()),
          away: g.AWAY_NM ?? g.awayTeam ?? "?",
          awayScore: g.T_SCORE_CN != null ? Number(g.T_SCORE_CN) : null,
          home: g.HOME_NM ?? g.homeTeam ?? "?",
          homeScore: g.B_SCORE_CN != null ? Number(g.B_SCORE_CN) : null,
          status: g.GAME_STATE_SC ?? g.GAME_SC_NM ?? g.status ?? "",
          time: g.G_TM ?? g.startTime ?? "",
        }));
      }
    }
    return null;
  }

  // ── 전략 4: 네이버 모바일 API ─────────────────────────────────────────────
  async function fetchNaverMobile(date: string, dateDash: string): Promise<any[]> {
    const mobileHeaders = {
      ...BROWSER,
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      Referer: "https://m.sports.naver.com/",
    };
    const urls = [
      `https://m.sports.naver.com/api/kbaseball/schedule?date=${date}`,
      `https://m.sports.naver.com/kbaseball/schedule/index?date=${dateDash}`,
      `https://api-gw.sports.naver.com/schedule/games?category=baseball&date=${date}&leagueCode=kbo`,
    ];
    for (const url of urls) {
      const j = await tryUrl(url, { headers: mobileHeaders });
      if (!j || typeof j !== "object") continue;
      const raw = j?.result?.games ?? j?.games ?? j?.data?.games ?? j?.list ?? [];
      if (Array.isArray(raw) && raw.length > 0) {
        debug.push(`naver mobile ok (${url.slice(0, 50)}): ${raw.length}`);
        return parseNaverGames(raw);
      }
    }
    return [];
  }

  // ── 전략 5: KBO 공식 스코어보드 XML 파싱 ──────────────────────────────────
  async function fetchKboXml(dateDash: string): Promise<any[]> {
    // KBO 공식은 SOAP/XML 응답을 줄 수도 있음
    const url = `https://www.koreabaseball.com/ws/Main.asmx/GetKboGameList`;
    try {
      const r = await fetch(url, {
        method: "POST",
        signal: AbortSignal.timeout(3000),
        headers: {
          ...BROWSER,
          "Content-Type": "application/json; charset=utf-8",
          Referer: "https://www.koreabaseball.com/",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ leId: "1", srId: "0", date: dateDash }),
      });
      const text = await r.text();
      debug.push(`kbo POST ${r.status} | ${text.slice(0, 100)}`);
      if (!r.ok) return [];
      const j = JSON.parse(text);
      const raw = j?.d ?? j?.data ?? [];
      const list = Array.isArray(raw) ? raw : raw?.list ?? [];
      return list.map((g: any) => ({
        id: g.G_ID ?? String(Math.random()),
        away: g.AWAY_NM ?? "?",
        awayScore: g.AWAY_SCORE != null ? Number(g.AWAY_SCORE) : null,
        home: g.HOME_NM ?? "?",
        homeScore: g.HOME_SCORE != null ? Number(g.HOME_SCORE) : null,
        status: g.GAME_STATE_SC ?? "",
        time: g.G_TM ?? "",
      }));
    } catch (e) { debug.push(`kbo POST err: ${e}`); return []; }
  }

  async function fetchGames(date: string, dateDash: string): Promise<any[]> {
    // 전 소스를 동시에 시작해두고, 우선순위(KBO 공식 → 다음 → 네이버 → 네이버 모바일 → KBO POST)
    // 순서로 먼저 성공한 걸 쓴다. 예전엔 하나씩 차례로 기다려서 느렸음.
    const attempts: Promise<any[] | null>[] = [
      fetchKboOfficial(dateDash).catch(() => null),
      fetchDaum(date).catch(() => null),
      fetchNaver(date).catch(() => null),
      fetchNaverMobile(date, dateDash).catch(() => [] as any[]),
      fetchKboXml(dateDash).catch(() => [] as any[]),
    ];
    for (const p of attempts) {
      const r = await p;
      if (r && r.length > 0) return r;
    }
    return [];
  }

  const [today, yesterday] = await Promise.all([
    fetchGames(todayStr, todayDash),
    fetchGames(ystdStr, ystdDash),
  ]);

  res.setHeader("Access-Control-Allow-Origin", "*");
  // Vercel CDN에 60초 캐시 → 같은 1분 안에 여는 사람들은 즉시 응답 (경기 중 점수는 최대 1분 지연)
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
  res.status(200).json({ today, yesterday, todayStr, ystdStr, debug });
}
