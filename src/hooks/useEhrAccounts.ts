import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const NOT_CONFIGURED_MSG = "Supabase가 설정되지 않아 계정 목록을 불러올 수 없어요.";

export type EhrServer = "seoul" | "guri";

/**
 * ehr_accounts 테이블(서울/구리 서버별 공용계정 목록 텍스트)을 읽고 저장.
 * 누구나 수정 가능한 공유 데이터 — 저장은 server 키로 upsert.
 */
export function useEhrAccounts() {
  const [accounts, setAccounts] = useState<Record<EhrServer, string>>({ seoul: "", guri: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refetch = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError(NOT_CONFIGURED_MSG);
      return;
    }
    setLoading(true);
    setError(null);
    const { data: rows, error } = await supabase.from("ehr_accounts").select("server, content");
    if (error) {
      setError(error.message);
    } else {
      const next: Record<EhrServer, string> = { seoul: "", guri: "" };
      for (const r of rows ?? []) {
        if (r.server === "seoul" || r.server === "guri") next[r.server as EhrServer] = r.content ?? "";
      }
      setAccounts(next);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  /** 성공하면 null, 실패하면 에러 메시지를 반환 */
  const save = useCallback(async (server: EhrServer, content: string): Promise<string | null> => {
    if (!isSupabaseConfigured) return NOT_CONFIGURED_MSG;
    setSaving(true);
    const { error } = await supabase
      .from("ehr_accounts")
      .upsert([{ server, content, updated_at: new Date().toISOString() }]);
    setSaving(false);
    if (error) return `저장 실패: ${error.message}`;
    setAccounts(prev => ({ ...prev, [server]: content }));
    return null;
  }, []);

  return { accounts, loading, error, saving, save, refetch };
}
