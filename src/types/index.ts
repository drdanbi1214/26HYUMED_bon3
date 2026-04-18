// 실습 한 칸 = 한 과 + 공동실습생 + 원본 셀 코드
export interface Assignment {
  dept: string;
  co: string[];
  cell: string;
}

// 한 주차(1~36)의 데이터
export interface WeekData {
  w: number;
  d: { s: Date; e: Date };
  a: Assignment[];
}

// 한 명에 대한 조회 결과
export interface SearchResult {
  g: string;
  n: number;
  name: string;
  weeks: WeekData[];
  stats: {
    sCount: number;
    gCount: number;
  };
}

// 최근 검색 기록 (localStorage에 저장)
export interface HistoryItem {
  id: string;
  g: string;
  n: number;
  name: string;
}

// 셀 코드 파싱 결과 ("A34" -> { g:"A", ns:[3,4] })
export interface ParsedPart {
  g: string;
  ns: number[];
}

// Supabase messages 테이블 row
export interface ChatMessage {
  id: number;
  text: string;
  sender_id: string;
  created_at: string;
}
