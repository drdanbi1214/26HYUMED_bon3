import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Closure } from "@/types";

export function useClosures() {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    async function loadClosures() {
      const pageSize = 1000;
      const allClosures: Closure[] = [];

      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from("closures")
          .select("*")
          .order("id", { ascending: true })
          .range(from, from + pageSize - 1);

        if (error) {
          console.error("[closures] fetch error:", error);
          if (!cancelled) setLoading(false);
          return;
        }

        const page = (data as Closure[]) ?? [];
        allClosures.push(...page);
        if (page.length < pageSize) break;
      }

      if (!cancelled) {
        setClosures(allClosures);
        setLoading(false);
      }
    }

    void loadClosures();

    return () => {
      cancelled = true;
    };
  }, []);

  return { closures, loading };
}
