import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const NOT_CONFIGURED_MSG = "Supabase가 설정되지 않아 셔틀 안내를 불러올 수 없어요.";
const BUCKET = "shuttle-images";

/**
 * hospital_shuttle 테이블의 가장 최근 row에서 이미지 URL(content 컬럼)을 읽어옴.
 * 관리자가 이미지를 업로드하면:
 *   1) Supabase Storage `shuttle-images` 버킷에 파일 업로드
 *   2) public URL을 hospital_shuttle.content 에 insert
 *
 * useMenu와 같은 패턴 (구리병원 셔틀 시간표 이미지용).
 */
export function useShuttle() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const refetch = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError(NOT_CONFIGURED_MSG);
      return;
    }
    setLoading(true);
    setError(null);
    const { data: rows, error } = await supabase
      .from("hospital_shuttle")
      .select("content")
      .order("id", { ascending: false })
      .limit(1);
    if (error) {
      setError(error.message);
    } else if (rows?.[0]) {
      const v = rows[0].content as string;
      setImageUrl(v && /^https?:\/\//.test(v) ? v : null);
    } else {
      setImageUrl(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  /**
   * 이미지를 Storage에 업로드하고, 그 public URL을 hospital_shuttle에 insert 한다.
   * 성공하면 새 URL을 state에 반영하고 null 반환. 실패하면 구체적인 에러 메시지를 반환.
   */
  const uploadAndSave = useCallback(async (file: File): Promise<string | null> => {
    if (!isSupabaseConfigured) {
      setError(NOT_CONFIGURED_MSG);
      return NOT_CONFIGURED_MSG;
    }
    if (!file.type.startsWith("image/")) {
      const msg = "이미지 파일만 업로드할 수 있어요.";
      setError(msg);
      return msg;
    }

    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const filename = `shuttle-${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadErr) {
      const msg = `업로드 실패: ${uploadErr.message}`;
      setError(msg);
      setUploading(false);
      return msg;
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    const publicUrl = pub?.publicUrl;
    if (!publicUrl) {
      const msg = "공개 URL을 가져오지 못했어요.";
      setError(msg);
      setUploading(false);
      return msg;
    }

    const { error: dbErr } = await supabase.from("hospital_shuttle").insert([{ content: publicUrl }]);
    if (dbErr) {
      const msg = `DB 저장 실패: ${dbErr.message}`;
      setError(msg);
      setUploading(false);
      return msg;
    }

    setImageUrl(publicUrl);
    setUploading(false);
    return null;
  }, []);

  return { imageUrl, loading, error, uploading, uploadAndSave, refetch };
}
