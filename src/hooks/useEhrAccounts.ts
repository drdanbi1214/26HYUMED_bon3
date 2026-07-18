import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const NOT_CONFIGURED_MSG = "Supabase가 설정되지 않아 계정 목록을 불러올 수 없어요.";

export type EhrServer = "seoul" | "guri";

export interface EhrAccount {
  id: string;
  server: EhrServer;
  name: string;
  loginId: string;
  password: string;
  cert: string;
  birth: string;
  note: string;
  updatedAt: string;
}

export interface EhrAccountFields {
  name: string;
  loginId: string;
  password: string;
  cert: string;
  birth: string;
  note: string;
}

/**
 * ehr_accounts 테이블(서울/구리 서버별 공용계정, 계정당 한 행)을 읽고 추가/수정/삭제.
 * 누구나 수정 가능한 공유 데이터 — 변경 후 refetch로 최신 목록을 다시 가져옴.
 */
export function useEhrAccounts() {
  const [accounts, setAccounts] = useState<Record<EhrServer, EhrAccount[]>>({ seoul: [], guri: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refetch = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError(NOT_CONFIGURED_MSG);
      return;
    }
    setError(null);
    const { data: rows, error } = await supabase
      .from("ehr_accounts")
      .select("id, server, name, login_id, password, cert, birth, note, updated_at")
      .order("created_at", { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      const next: Record<EhrServer, EhrAccount[]> = { seoul: [], guri: [] };
      for (const r of rows ?? []) {
        if (r.server !== "seoul" && r.server !== "guri") continue;
        next[r.server as EhrServer].push({
          id: r.id,
          server: r.server,
          name: r.name ?? "",
          loginId: r.login_id ?? "",
          password: r.password ?? "",
          cert: r.cert ?? "",
          birth: r.birth ?? "",
          note: r.note ?? "",
          updatedAt: r.updated_at,
        });
      }
      setAccounts(next);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  /** 성공하면 null, 실패하면 에러 메시지를 반환 */
  const addAccount = useCallback(
    async (server: EhrServer, fields: EhrAccountFields): Promise<string | null> => {
      if (!isSupabaseConfigured) return NOT_CONFIGURED_MSG;
      setSaving(true);
      const { error } = await supabase.from("ehr_accounts").insert([
        { server, name: fields.name, login_id: fields.loginId, password: fields.password, cert: fields.cert, birth: fields.birth, note: fields.note },
      ]);
      setSaving(false);
      if (error) return `추가 실패: ${error.message}`;
      await refetch();
      return null;
    },
    [refetch]
  );

  /** 성공하면 null, 실패하면 에러 메시지를 반환 */
  const updateAccount = useCallback(
    async (id: string, fields: EhrAccountFields): Promise<string | null> => {
      if (!isSupabaseConfigured) return NOT_CONFIGURED_MSG;
      setSaving(true);
      const { error } = await supabase
        .from("ehr_accounts")
        .update({
          name: fields.name,
          login_id: fields.loginId,
          password: fields.password,
          cert: fields.cert,
          birth: fields.birth,
          note: fields.note,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      setSaving(false);
      if (error) return `수정 실패: ${error.message}`;
      await refetch();
      return null;
    },
    [refetch]
  );

  /** 성공하면 null, 실패하면 에러 메시지를 반환 */
  const deleteAccount = useCallback(
    async (id: string): Promise<string | null> => {
      if (!isSupabaseConfigured) return NOT_CONFIGURED_MSG;
      setSaving(true);
      const { error } = await supabase.from("ehr_accounts").delete().eq("id", id);
      setSaving(false);
      if (error) return `삭제 실패: ${error.message}`;
      await refetch();
      return null;
    },
    [refetch]
  );

  return { accounts, loading, error, saving, addAccount, updateAccount, deleteAccount, refetch };
}
