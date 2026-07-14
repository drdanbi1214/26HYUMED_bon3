import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { OrCase, OrChange, OrClinic, OrEvent, SectionId, ViewId } from "@/utils/orSchedule";

export interface OrRoomMeta {
  id: string;
  name: string;
  view: ViewId | null;
  color: string | null;
  created_at: string;
}

/** 엑셀 재업로드 실행취소용 스냅샷 (직전 시간표 상태 그대로) */
export interface OrSnapshot {
  view: string | null;
  cases: OrCase[] | null;
  assignments: Record<string, string>;
  changes: OrChange[];
  memos: Record<string, string>;
  uploaded_at: string | null;
}

/** 최대 몇 번 전 업로드까지 되돌릴 수 있는지 */
export const UNDO_LIMIT = 3;

export interface OrRoom extends OrRoomMeta {
  cases: OrCase[] | null;
  assignments: Record<string, string>;
  changes: OrChange[];
  clinics: OrClinic[];
  events: OrEvent[];
  memos: Record<string, string>;
  uploaded_at: string | null;
  /** 직전 업로드들의 스냅샷 (최신이 0번째), 최대 UNDO_LIMIT개 */
  history: OrSnapshot[];
}

/** 방 목록에서 고를 수 있는 색 태그 프리셋 */
export const ROOM_COLORS = [
  "#F87171", // red
  "#FB923C", // orange
  "#FBBF24", // amber
  "#4ADE80", // green
  "#2DD4BF", // teal
  "#60A5FA", // blue
  "#818CF8", // indigo
  "#C084FC", // purple
  "#F472B6", // pink
];

/** saveShared로 갱신하는 공유 필드 (여러 명이 동시에 만지는 것들). cases는 개별 수술 삭제용 */
type RoomPatch = Partial<Pick<OrRoom, "assignments" | "memos" | "clinics" | "events" | "cases">>;

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
    color: d.color ?? null,
    cases: d.cases ?? null,
    assignments: d.assignments ?? {},
    changes: d.changes ?? [],
    clinics: d.clinics ?? [],
    events: d.events ?? [],
    memos: d.memos ?? {},
    uploaded_at: d.uploaded_at ?? null,
    history: d.history ?? [],
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
      .select("id,name,view,color,created_at")
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

  const create = useCallback(async (name: string, deletePw: string): Promise<OrRoomMeta | null> => {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ name, delete_pw: deletePw })
      .select()
      .single();
    if (error || !data) {
      setError(friendlyError(error));
      return null;
    }
    const meta: OrRoomMeta = {
      id: data.id,
      name: data.name,
      view: null,
      color: data.color ?? null,
      created_at: data.created_at,
    };
    setRooms(prev => [meta, ...prev]);
    return meta;
  }, []);

  /** 방 목록 색 태그 변경 (null이면 태그 없앰) */
  const setColor = useCallback(async (id: string, color: string | null): Promise<boolean> => {
    const { error } = await supabase.from(TABLE).update({ color }).eq("id", id);
    if (error) {
      setError(friendlyError(error));
      return false;
    }
    setRooms(prev => prev.map(r => (r.id === id ? { ...r, color } : r)));
    return true;
  }, []);

  /** 삭제 비밀번호가 맞아야만 지워진다. "ok" | "wrong"(비번 불일치) | "error" */
  const remove = useCallback(async (id: string, pw: string): Promise<"ok" | "wrong" | "error"> => {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq("id", id)
      .eq("delete_pw", pw)
      .select("id");
    if (error) {
      setError(friendlyError(error));
      return "error";
    }
    if (!data?.length) return "wrong"; // 비번이 안 맞으면 아무것도 안 지워짐
    setRooms(prev => prev.filter(r => r.id !== id));
    return "ok";
  }, []);

  return { rooms, loading, error, fetch, create, remove, setColor };
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

  // 다른 사람이 이 방을 수정하면 내 화면에도 바로 반영 (useChat과 같은 realtime 패턴)
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel(`or_room_${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: TABLE, filter: `id=eq.${id}` },
        payload => setRoom(rowToRoom(payload.new)),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  /**
   * 시간표 저장(첫 업로드/재업로드). 변경 알림과 이어받은 배정·메모를 함께 기록.
   * 기존에 시간표가 있었다면(재업로드) 그 상태를 history에 스냅샷으로 남겨 실행취소할 수 있게 한다.
   */
  const saveTimetable = useCallback(
    async (
      view: ViewId,
      cases: OrCase[],
      assignments: Record<string, string>,
      changes: OrChange[],
      memos: Record<string, string>,
    ): Promise<boolean> => {
      const { data: fresh, error: fetchErr } = await supabase.from(TABLE).select("*").eq("id", id).single();
      if (fetchErr || !fresh) {
        setError(friendlyError(fetchErr));
        return false;
      }
      const prevHistory: OrSnapshot[] = fresh.history ?? [];
      const history: OrSnapshot[] = fresh.cases
        ? [
            {
              view: fresh.view ?? null,
              cases: fresh.cases,
              assignments: fresh.assignments ?? {},
              changes: fresh.changes ?? [],
              memos: fresh.memos ?? {},
              uploaded_at: fresh.uploaded_at ?? null,
            },
            ...prevHistory,
          ].slice(0, UNDO_LIMIT)
        : prevHistory;

      const { data, error } = await supabase
        .from(TABLE)
        .update({
          view: String(view),
          cases,
          assignments,
          changes,
          memos,
          history,
          uploaded_at: new Date().toISOString(),
        })
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

  /** 직전 업로드로 되돌리기 (history의 맨 앞 스냅샷 복원). 되돌릴 게 없으면 false */
  const undoUpload = useCallback(async (): Promise<boolean> => {
    const { data: fresh, error: fetchErr } = await supabase.from(TABLE).select("*").eq("id", id).single();
    if (fetchErr || !fresh) {
      setError(friendlyError(fetchErr));
      return false;
    }
    const history: OrSnapshot[] = fresh.history ?? [];
    const snap = history[0];
    if (!snap) return false;

    const { data, error } = await supabase
      .from(TABLE)
      .update({
        view: snap.view,
        cases: snap.cases,
        assignments: snap.assignments,
        changes: snap.changes,
        memos: snap.memos,
        uploaded_at: snap.uploaded_at,
        history: history.slice(1),
      })
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
  }, [id]);

  /**
   * 공유 필드(배정·메모·외래·일정) 저장.
   * 여러 명이 동시에 편집해도 서로 덮어쓰지 않도록,
   * 저장 직전 서버 최신값을 다시 읽어 updater를 그 위에 적용한다.
   */
  const saveShared = useCallback(
    async (updater: (fresh: OrRoom) => RoomPatch): Promise<boolean> => {
      setRoom(r => (r ? { ...r, ...updater(r) } : r)); // 낙관적 반영 (실패 시 아래에서 서버값으로 복구)
      const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single();
      if (error || !data) {
        setError(friendlyError(error));
        return false;
      }
      const fresh = rowToRoom(data);
      const { data: saved, error: e2 } = await supabase
        .from(TABLE)
        .update(updater(fresh))
        .eq("id", id)
        .select()
        .single();
      if (e2 || !saved) {
        setRoom(fresh); // 낙관적 반영 롤백
        setError(friendlyError(e2));
        return false;
      }
      setRoom(rowToRoom(saved));
      return true;
    },
    [id],
  );

  const clearChanges = useCallback(async () => {
    setRoom(r => (r ? { ...r, changes: [] } : r));
    await supabase.from(TABLE).update({ changes: [] }).eq("id", id);
  }, [id]);

  return { room, loading, error, saveTimetable, saveShared, clearChanges, undoUpload };
}

export type { SectionId };
