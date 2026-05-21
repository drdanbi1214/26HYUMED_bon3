import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Closure } from "@/types";

// 임시 하드코딩 테스트용 — UI 확인 후 제거
const TEST_CLOSURES: Closure[] = [
  {
    id: 9999,
    hospital: "구리",
    dept_code: "NE",
    doctor_name: "테스트의사",
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    reason: "테스트휴진",
  },
];

export function useClosures() {
  const [closures, setClosures] = useState<Closure[]>(TEST_CLOSURES);
  const [loading, setLoading] = useState(false);

  return { closures, loading };
}
