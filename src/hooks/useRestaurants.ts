import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Restaurant, RestaurantCategory } from "@/types";

const NOT_CONFIGURED_MSG = "Supabase가 설정되지 않아 맛집 목록을 불러올 수 없어요.";

/**
 * restaurants 테이블 전체 목록을 최신순으로 fetch.
 * 새 맛집 등록은 `add(name, category)`.
 * 성공 시 로컬 state에도 즉시 반영해서 낙관적 업데이트.
 */
export function useRestaurants() {
  const [items, setItems] = useState<Restaurant[]>([]);
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
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setItems((data as Restaurant[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const add = useCallback(
    async (name: string, category: RestaurantCategory): Promise<Restaurant | null> => {
      if (!isSupabaseConfigured) {
        setError(NOT_CONFIGURED_MSG);
        return null;
      }
      const trimmed = name.trim();
      if (!trimmed) {
        setError("음식점 이름을 입력해주세요.");
        return null;
      }
      const { data, error } = await supabase
        .from("restaurants")
        .insert([{ name: trimmed, category }])
        .select()
        .single();
      if (error) {
        setError(error.message);
        return null;
      }
      const row = data as Restaurant;
      // 맨 앞에 끼워넣기 (최신순)
      setItems(prev => [row, ...prev]);
      return row;
    },
    []
  );

  return { items, loading, error, add, refetch };
}
