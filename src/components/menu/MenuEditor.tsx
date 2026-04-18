import React, { useRef, useState } from "react";

interface MenuEditorProps {
  /** 현재 저장된 식단 이미지 URL (없으면 null) */
  initialUrl: string | null;
  /** 이미지 업로드 + DB 저장. 성공 시 true */
  onSave: (file: File) => Promise<boolean>;
  onCancel: () => void;
  /** 외부(useMenu)에서 업로드 중인지 여부 */
  uploading?: boolean;
}

/**
 * 관리자 식단 이미지 업로드 폼. (제목 5번 클릭으로 진입)
 * - 파일 선택 → 미리보기 → 업로드 버튼
 */
export const MenuEditor: React.FC<MenuEditorProps> = ({
  initialUrl,
  onSave,
  onCancel,
  uploading = false,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | null) => {
    setErr(null);
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (!f.type.startsWith("image/")) {
      setErr("이미지 파일만 올릴 수 있어요.");
      return;
    }
    // 10MB 상한
    if (f.size > 10 * 1024 * 1024) {
      setErr("파일이 너무 커요. 10MB 이하로 올려주세요.");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!file) {
      setErr("먼저 이미지를 선택해주세요.");
      return;
    }
    setErr(null);
    const ok = await onSave(file);
    if (!ok) setErr("업로드에 실패했어요. 다시 시도해주세요.");
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
          식단 이미지 업로드 (관리자)
        </h3>
        <button onClick={onCancel} className="text-xs text-slate-400 hover:text-slate-600">
          취소
        </button>
      </div>

      {/* 미리보기 영역 */}
      <div className="w-full rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 min-h-[220px] flex items-center justify-center overflow-hidden">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="업로드 미리보기"
            className="max-h-[420px] w-auto rounded-xl object-contain"
          />
        ) : initialUrl ? (
          <div className="flex flex-col items-center gap-2">
            <img
              src={initialUrl}
              alt="현재 식단"
              className="max-h-[260px] w-auto rounded-xl object-contain opacity-70"
            />
            <span className="text-[10px] text-slate-400">현재 저장된 이미지</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400 py-10">
            <div className="text-3xl">🖼️</div>
            <p className="text-xs">이미지를 선택하면 여기에 미리보기가 뜹니다.</p>
          </div>
        )}
      </div>

      {/* 파일 선택 */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={e => pickFile(e.target.files?.[0] ?? null)}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 active:scale-95 transition-all disabled:opacity-60"
      >
        {file ? `선택됨: ${file.name}` : "이미지 파일 선택"}
      </button>

      {err && (
        <div className="text-[11px] text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={uploading || !file}
        className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            업로드 중...
          </>
        ) : (
          "이미지 업로드"
        )}
      </button>
      <p className="text-[10px] text-slate-400 text-center italic">
        업로드한 이미지가 이번 주 식단으로 즉시 반영됩니다. (최대 10MB)
      </p>
    </div>
  );
};
