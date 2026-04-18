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

// 맛집 카테고리
export type RestaurantCategory = "seoul" | "guri" | "outside";

// Supabase restaurants 테이블 row
export interface Restaurant {
  id: number;
  name: string;
  category: RestaurantCategory;
  created_at: string;
}

// Supabase restaurant_reviews 테이블 row
export interface Review {
  id: number;
  restaurant_id: number;
  content: string;
  created_at: string;
  // 레거시 후기용 식별자. 예: "(2022 2:6)" 또는 "(2026)".
  // 사용자가 앱에서 직접 작성하는 후기는 항상 null이고, UI에서는 created_at(날짜)로 표시.
  // tag가 있으면 UI에서 날짜 대신 tag를 표시.
  tag: string | null;
}

// 카테고리 라벨 (UI 표시용)
export const CATEGORY_LABEL: Record<RestaurantCategory, string> = {
  seoul: "서울",
  guri: "구리",
  outside: "외부",
};
