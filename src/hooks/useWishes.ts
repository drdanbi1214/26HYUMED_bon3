import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface Wish {
  id: string;
  text: string;
  created_at: string;
}

export function useWishes() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    const { data } = await supabase
      .from("sakura_wishes")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setWishes(data as Wish[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (text: string): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      // Supabase 미설정 시 로컬스토리지 폴백
      const stored: Wish[] = JSON.parse(localStorage.getItem("sakura_wishes") || "[]");
      const w: Wish = { id: Date.now().toString(), text, created_at: new Date().toISOString() };
      stored.push(w);
      localStorage.setItem("sakura_wishes", JSON.stringify(stored));
      setWishes(prev => [w, ...prev]);
      return true;
    }
    const { data, error } = await supabase
      .from("sakura_wishes")
      .insert({ text })
      .select()
      .single();
    if (error || !data) return false;
    setWishes(prev => [data as Wish, ...prev]);
    return true;
  }, []);

  return { wishes, loading, fetch, add };
}
