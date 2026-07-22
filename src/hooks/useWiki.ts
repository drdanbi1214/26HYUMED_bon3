import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const NOT_CONFIGURED_MSG = "Supabase가 설정되지 않아 위키를 불러올 수 없어요.";

/** 문서 제목 → URL 경로. '/'가 든 하위 문서(예: 외과/회진)도 세그먼트별로 안전하게 인코딩 */
export const wikiHref = (title: string) =>
  `/wiki/${title.split("/").map(encodeURIComponent).join("/")}`;

/** 대문 페이지용: 문서 제목 → 최근 수정 시각 (내용이 있는 문서만 키 존재) */
export function useWikiIndex() {
  const [index, setIndex] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError(NOT_CONFIGURED_MSG);
      return;
    }
    setError(null);
    const { data, error } = await supabase.from("wiki_docs").select("dept, content, updated_at");
    if (error) {
      setError(error.message);
    } else {
      const next: Record<string, string> = {};
      for (const r of data ?? []) {
        if ((r.content ?? "").trim()) next[r.dept] = r.updated_at;
      }
      setIndex(next);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { index, loading, error, refetch };
}

export interface WikiRevision {
  id: string;
  content: string;
  summary: string;
  createdAt: string;
}

export type WikiSaveResult =
  | { status: "ok" }
  | { status: "conflict" }
  | { status: "error"; message: string };

/**
 * 과 문서 하나를 읽고 저장. 공유 문서라 저장 전에 서버의 updated_at을 다시 확인해서
 * 내가 불러온 뒤 다른 사람이 먼저 저장했으면 conflict를 돌려줌 (나무위키의 편집 충돌).
 * 저장할 때마다 wiki_revisions에 판(역사)이 쌓임.
 */
export function useWikiDoc(dept: string) {
  const [content, setContent] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
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
    const { data, error } = await supabase
      .from("wiki_docs")
      .select("content, updated_at")
      .eq("dept", dept)
      .maybeSingle();
    if (error) {
      setError(error.message);
    } else {
      setContent(data?.content ?? "");
      setUpdatedAt(data?.updated_at ?? null);
    }
    setLoading(false);
  }, [dept]);

  useEffect(() => {
    setLoading(true);
    refetch();
  }, [refetch]);

  const save = useCallback(
    async (newContent: string, summary: string, force = false): Promise<WikiSaveResult> => {
      if (!isSupabaseConfigured) return { status: "error", message: NOT_CONFIGURED_MSG };
      setSaving(true);
      try {
        if (!force) {
          const { data, error } = await supabase
            .from("wiki_docs")
            .select("updated_at")
            .eq("dept", dept)
            .maybeSingle();
          if (error) return { status: "error", message: error.message };
          if ((data?.updated_at ?? null) !== updatedAt) return { status: "conflict" };
        }
        const now = new Date().toISOString();
        const { error: upErr } = await supabase
          .from("wiki_docs")
          .upsert({ dept, content: newContent, updated_at: now }, { onConflict: "dept" });
        if (upErr) return { status: "error", message: upErr.message };
        // 역사 기록은 실패해도 본문 저장은 이미 된 상태라 무시
        await supabase.from("wiki_revisions").insert([{ dept, content: newContent, summary }]);
        await refetch();
        return { status: "ok" };
      } finally {
        setSaving(false);
      }
    },
    [dept, updatedAt, refetch]
  );

  /** 역사 목록 (최신순 50개) + 전체 판 수 */
  const listRevisions = useCallback(async (): Promise<
    { revisions: WikiRevision[]; total: number } | { error: string }
  > => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_MSG };
    const { data, error, count } = await supabase
      .from("wiki_revisions")
      .select("id, content, summary, created_at", { count: "exact" })
      .eq("dept", dept)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return { error: error.message };
    return {
      total: count ?? data?.length ?? 0,
      revisions: (data ?? []).map(r => ({
        id: r.id,
        content: r.content ?? "",
        summary: r.summary ?? "",
        createdAt: r.created_at,
      })),
    };
  }, [dept]);

  return { content, updatedAt, loading, error, saving, refetch, save, listRevisions };
}
