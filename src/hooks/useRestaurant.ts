import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Restaurant, Review } from "@/types";

const NOT_CONFIGURED_MSG = "Supabase가 설정되지 않아 맛집 정보를 불러올 수 없어요.";

/**
 * 특정 맛집의 상세 정보 + 후기 목록을 fetch.
 * 후기 등록은 `addReview(content)`.
 * 새 후기는 맨 위(최신 → 오래된 순)에 붙이는 형태로 보여줌.
 */
export function useRestaurant(id: number | null) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError(NOT_CONFIGURED_MSG);
      return;
    }
    if (id === null || Number.isNaN(id)) {
      setLoading(false);
      setError("잘못된 맛집 ID 입니다.");
      return;
    }
    setLoading(true);
    setError(null);

    // 병렬 fetch
    const [{ data: r, error: rErr }, { data: rv, error: rvErr }] = await Promise.all([
      supabase.from("restaurants").select("*").eq("id", id).single(),
      supabase
        .from("restaurant_reviews")
        .select("*")
        .eq("restaurant_id", id)
        .order("created_at", { ascending: false }),
    ]);

    if (rErr) {
      setError(rErr.message);
      setLoading(false);
      return;
    }
    if (rvErr) {
      setError(rvErr.message);
      setLoading(false);
      return;
    }
    setRestaurant(r as Restaurant);
    setReviews((rv as Review[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addReview = useCallback(
    async (content: string): Promise<boolean> => {
      if (!isSupabaseConfigured) {
        setError(NOT_CONFIGURED_MSG);
        return false;
      }
      if (id === null) return false;
      const trimmed = content.trim();
      if (!trimmed) {
        setError("후기를 입력해주세요.");
        return false;
      }
      const { data, error } = await supabase
        .from("restaurant_reviews")
        .insert([{ restaurant_id: id, content: trimmed }])
        .select()
        .single();
      if (error) {
        setError(error.message);
        return false;
      }
      setReviews(prev => [data as Review, ...prev]);
      return true;
    },
    [id]
  );

  return { restaurant, reviews, loading, error, addReview, refetch };
}
