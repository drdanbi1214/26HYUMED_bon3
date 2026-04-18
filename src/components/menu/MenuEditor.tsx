import React, { useState } from "react";

interface MenuEditorProps {
  initial: string;
  onSave: (content: string) => Promise<boolean>;
  onCancel: () => void;
}

/**
 * 관리자 식단 편집 폼. (제목 5번 클릭으로 진입)
 */
export const MenuEditor: React.FC<MenuEditorProps> = ({ initial, onSave, onCancel }) => {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    const ok = await onSave(value);
    setSaving(false);
    if (!ok) setErr("저장에 실패했습니다.");
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
          식단 데이터 수정 (관리자)
        </h3>
        <button onClick={onCancel} className="text-xs text-slate-400 hover:text-slate-600">
          취소
        </button>
      </div>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="식단 정보를 입력하세요..."
        className="w-full h-80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-mono text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20"
      />
      {err && (
        <div className="text-[11px] text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {err}
        </div>
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-60"
      >
        {saving ? "저장 중..." : "데이터 업데이트"}
      </button>
      <p className="text-[10px] text-slate-400 text-center italic">
        저장 시 가장 최근 데이터로 즉시 반영됩니다.
      </p>
    </div>
  );
};
