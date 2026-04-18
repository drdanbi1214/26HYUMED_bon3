import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const NOT_CONFIGURED_MSG = "Supabase가 설정되지 않아 식단을 불러올 수 없어요.";
const BUCKET = "menu-images";

/**
 * hospital_menu 테이블의 가장 최근 row에서 이미지 URL(content 컬럼)을 읽어옴.
 * 관리자가 이미지를 업로드하면:
 *   1) Supabase Storage `menu-images` 버킷에 파일 업로드
 *   2) public URL을 hospital_menu.content 에 insert
 *
 * 기존에는 content 컬럼에 텍스트 식단을 저장했지만, 이제는 이미지 URL만 저장한다.
 * (스키마 변경 없이 의미만 바뀜)
 */
export function useMenu() {
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
      .from("hospital_menu")
      .select("content")
      .order("id", { ascending: false })
      .limit(1);
    if (error) {
      setError(error.message);
    } else if (rows?.[0]) {
      const v = rows[0].content as string;
      // URL처럼 생겼을 때만 채택. (예전 텍스트 데이터는 무시)
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
   * 이미지를 Storage에 업로드하고, 그 public URL을 hospital_menu에 insert 한다.
   * 성공하면 새 URL을 state에 반영하고 true 반환.
   */
  const uploadAndSave = useCallback(async (file: File): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      setError(NOT_CONFIGURED_MSG);
      return false;
    }
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있어요.");
      return false;
    }

    setUploading(true);
    setError(null);

    // 파일명: 타임스탬프 + 안전한 확장자
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const filename = `menu-${Date.now()}.${ext}`;

    // 1) Storage 업로드
    const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadErr) {
      setError(`업로드 실패: ${uploadErr.message}`);
      setUploading(false);
      return false;
    }

    // 2) public URL 조회
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    const publicUrl = pub?.publicUrl;
    if (!publicUrl) {
      setError("공개 URL을 가져오지 못했어요.");
      setUploading(false);
      return false;
    }

    // 3) DB에 URL 저장
    const { error: dbErr } = await supabase.from("hospital_menu").insert([{ content: publicUrl }]);
    if (dbErr) {
      setError(`DB 저장 실패: ${dbErr.message}`);
      setUploading(false);
      return false;
    }

    setImageUrl(publicUrl);
    setUploading(false);
    return true;
  }, []);

  return { imageUrl, loading, error, uploading, uploadAndSave, refetch };
}
