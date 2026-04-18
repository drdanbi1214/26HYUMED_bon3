import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const LOADING_TEXT = "식단 정보를 불러오는 중입니다...";
const NOT_CONFIGURED_MSG = "Supabase가 설정되지 않아 식단을 불러올 수 없어요.";

/**
 * hospital_menu 테이블에서 가장 최근 1건 fetch.
 * 관리자 편집은 `save`로 insert.
 *
 * Supabase 미설정 상태에서는 네트워크 호출을 건너뛰고 즉시 에러 상태가 됨.
 */
export function useMenu() {
  const [data, setData] = useState<string>(LOADING_TEXT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError(NOT_CONFIGURED_MSG);
      return;
    }
    setLoading(true);
    setError(null);
    const { data: rows, error } = await supabase
      .from("hospital_menu")
      .select("content")
      .order("id", { ascending: false })
      .limit(1);
    if (error) setError(error.message);
    else if (rows?.[0]) setData(rows[0].content);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const save = useCallback(async (content: string) => {
    if (!isSupabaseConfigured) {
      setError(NOT_CONFIGURED_MSG);
      return false;
    }
    const { error } = await supabase.from("hospital_menu").insert([{ content }]);
    if (error) {
      setError(error.message);
      return false;
    }
    setData(content);
    setError(null);
    return true;
  }, []);

  return { data, loading, error, save, refetch };
}
