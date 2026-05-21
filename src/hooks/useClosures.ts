import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Closure } from "@/types";

export function useClosures() {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase
      .from("closures")
      .select("*")
      .then(({ data }) => {
        setClosures((data as Closure[]) ?? []);
        setLoading(false);
      });
  }, []);

  return { closures, loading };
}
