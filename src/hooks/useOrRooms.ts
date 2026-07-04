import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { OrCase, OrChange, SectionId, ViewId } from "@/utils/orSchedule";

export interface OrRoomMeta {
  id: string;
  name: string;
  view: ViewId | null;
  created_at: string;
}

export interface OrRoom extends OrRoomMeta {
  cases: OrCase[] | null;
  assignments: Record<string, string>;
  changes: OrChange[];
  uploaded_at: string | null;
}

const TABLE = "or_rooms";

function parseView(v: unknown): ViewId | null {
  if (v === "all") return "all";
  if (v === "1" || v === 1) return 1;
  if (v === "2" || v === 2) return 2;
  return null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToRoom(d: any): OrRoom {
  return {
    id: d.id,
    name: d.name,
    view: parseView(d.view),
    cases: d.cases ?? null,
    assignments: d.assignments ?? {},
    changes: d.changes ?? [],
    uploaded_at: d.uploaded_at ?? null,
    created_at: d.created_at,
  };
}

function friendlyError(e: { code?: string; message?: string } | null | undefined): string {
  if (e?.code === "42P01" || /does not exist/i.test(e?.message ?? "")) {
    return "서버에 or_rooms 테이블이 없어요. supabase/or_rooms.sql을 Supabase SQL Editor에서 실행해주세요.";
  }
  if (/fetch/i.test(e?.message ?? "")) {
    return "서버에 연결하지 못했어요. 네트워크를 확인하고 다시 시도해주세요.";
  }
  return e?.message || "요청에 실패했어요. 잠시 후 다시 시도해주세요.";
}

/** 방 목록 (시간표 내용은 안 불러옴) */
export function useOrRooms() {
  const [rooms, setRooms] = useState<OrRoomMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from(TABLE)
      .select("id,name,view,created_at")
      .order("created_at", { ascending: false });
    if (error) setError(friendlyError(error));
    else if (data) {
      setError("");
      setRooms(data.map(d => ({ ...d, view: parseView(d.view) })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const create = useCallback(async (name: string): Promise<OrRoomMeta | null> => {
    const { data, error } = await supabase.from(TABLE).insert({ name }).select().single();
    if (error || !data) {
      setError(friendlyError(error));
      return null;
    }
    const meta: OrRoomMeta = { id: data.id, name: data.name, view: null, created_at: data.created_at };
    setRooms(prev => [meta, ...prev]);
    return meta;
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) {
      setError(friendlyError(error));
      return false;
    }
    setRooms(prev => prev.filter(r => r.id !== id));
    return true;
  }, []);

  return { rooms, loading, error, fetch, create, remove };
}

/** 방 하나 (시간표·배정 포함) */
export function useOrRoom(id: string) {
  const [room, setRoom] = useState<OrRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isSupabaseConfigured) {
        setError("Supabase가 설정되지 않아 방 기능을 쓸 수 없어요.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single();
      if (!alive) return;
      if (error || !data) setError(friendlyError(error));
      else setRoom(rowToRoom(data));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  /** 시간표 저장(첫 업로드/재업로드). 변경 알림과 이어받은 배정을 함께 기록 */
  const saveTimetable = useCallback(
    async (
      view: ViewId,
      cases: OrCase[],
      assignments: Record<string, string>,
      changes: OrChange[],
    ): Promise<boolean> => {
      const { data, error } = await supabase
        .from(TABLE)
        .update({ view: String(view), cases, assignments, changes, uploaded_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error || !data) {
        setError(friendlyError(error));
        return false;
      }
      setRoom(rowToRoom(data));
      setError("");
      return true;
    },
    [id],
  );

  const saveAssignments = useCallback(
    async (assignments: Record<string, string>): Promise<boolean> => {
      setRoom(r => (r ? { ...r, assignments } : r)); // 낙관적 반영
      const { error } = await supabase.from(TABLE).update({ assignments }).eq("id", id);
      if (error) {
        setError(friendlyError(error));
        return false;
      }
      return true;
    },
    [id],
  );

  const clearChanges = useCallback(async () => {
    setRoom(r => (r ? { ...r, changes: [] } : r));
    await supabase.from(TABLE).update({ changes: [] }).eq("id", id);
  }, [id]);

  return { room, loading, error, saveTimetable, saveAssignments, clearChanges };
}

export type { SectionId };
