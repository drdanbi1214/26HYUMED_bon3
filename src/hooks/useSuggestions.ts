import { useCallback, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const NOT_CONFIGURED_MSG = "Supabase가 설정되지 않아 건의사항을 보낼 수 없어요.";

export interface Suggestion {
  id: string;
  content: string;
  createdAt: string;
}

/**
 * 건의사항: 누구나 add로 보낼 수 있고, 목록(fetchAll/remove)은
 * 관리자 확인(PIN)을 통과한 화면에서만 호출함.
 */
export function useSuggestions() {
  const [items, setItems] = useState<Suggestion[] | null>(null);
  const [saving, setSaving] = useState(false);

  /** 성공하면 null, 실패하면 에러 메시지 */
  const add = useCallback(async (content: string): Promise<string | null> => {
    if (!isSupabaseConfigured) return NOT_CONFIGURED_MSG;
    setSaving(true);
    const { error } = await supabase.from("suggestions").insert([{ content }]);
    setSaving(false);
    return error ? `보내기 실패: ${error.message}` : null;
  }, []);

  /** 성공하면 null(items 갱신), 실패하면 에러 메시지 */
  const fetchAll = useCallback(async (): Promise<string | null> => {
    if (!isSupabaseConfigured) return NOT_CONFIGURED_MSG;
    const { data, error } = await supabase
      .from("suggestions")
      .select("id, content, created_at")
      .order("created_at", { ascending: false });
    if (error) return error.message;
    setItems((data ?? []).map(r => ({ id: r.id, content: r.content ?? "", createdAt: r.created_at })));
    return null;
  }, []);

  /** 성공하면 null, 실패하면 에러 메시지 */
  const remove = useCallback(async (id: string): Promise<string | null> => {
    if (!isSupabaseConfigured) return NOT_CONFIGURED_MSG;
    setSaving(true);
    const { error } = await supabase.from("suggestions").delete().eq("id", id);
    setSaving(false);
    if (error) return `삭제 실패: ${error.message}`;
    setItems(prev => prev?.filter(s => s.id !== id) ?? null);
    return null;
  }, []);

  return { items, saving, add, fetchAll, remove };
}
