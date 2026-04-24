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
          awayScore: g.AWAY_SCORE != null ? Number(g.AWAY_SCORE) :
                     g.AWAY_RESULT_SCORE != null ? Number(g.AWAY_RESULT_SCORE) : null,
          home: g.HOME_NM ?? g.homeTeam ?? "?",
          homeScore: g.HOME_SCORE != null ? Number(g.HOME_SCORE) :
                     g.HOME_RESULT_SCORE != null ? Number(g.HOME_RESULT_SCORE) : null,
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
    // 1순위: KBO 공식 GET (대소문자 수정)
    const kbo = await fetchKboOfficial(dateDash);
    if (kbo && kbo.length > 0) return kbo;

    // 2순위: 다음 스포츠 JSON
    const daum = await fetchDaum(date);
    if (daum && daum.length > 0) return daum;

    // 3순위: 네이버 API 변형들
    const naver = await fetchNaver(date);
    if (naver && naver.length > 0) return naver;

    // 4순위: 네이버 모바일
    const naverMobile = await fetchNaverMobile(date, dateDash);
    if (naverMobile.length > 0) return naverMobile;

    // 5순위: KBO 공식 POST
    return fetchKboXml(dateDash);
  }

  const [today, yesterday] = await Promise.all([
    fetchGames(todayStr, todayDash),
    fetchGames(ystdStr, ystdDash),
  ]);

  // 실제 KBO 응답 원본 필드 확인용 (점수 필드명 파악)
  let rawSample: any = null;
  try {
    const r2 = await fetch(
      `https://www.koreabaseball.com/ws/Main.asmx/GetKboGameList?leId=1&srId=0&date=${ystdStr}`,
      { headers: BROWSER }
    );
    const j2 = await r2.json();
    rawSample = j2?.game?.[0] ?? j2;
  } catch {}

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ today, yesterday, todayStr, ystdStr, debug, rawSample });
}
