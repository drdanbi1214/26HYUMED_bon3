import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ShuttleViewer } from "@/components/shuttle/ShuttleViewer";
import { ShuttleEditor } from "@/components/shuttle/ShuttleEditor";
import { useShuttle } from "@/hooks/useShuttle";
import { useToast } from "@/components/ui/Toast";
import { isSupabaseConfigured } from "@/lib/supabase";

const ADMIN_CLICK_COUNT = 5;

interface ShuttlePageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

/** MenuPage와 같은 패턴: 제목 5번 클릭 → 관리자가 셔틀 안내 이미지 업로드 */
export const ShuttlePage: React.FC<ShuttlePageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  const { imageUrl, loading, error, uploading, uploadAndSave, refetch } = useShuttle();
  const [editing, setEditing] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const toast = useToast();

  const handleTitleClick = () => {
    const next = clickCount + 1;
    if (next >= ADMIN_CLICK_COUNT) {
      setClickCount(0);
      setEditing(true);
      toast.info("관리자 편집 모드 진입");
    } else {
      setClickCount(next);
    }
  };

  const handleSave = async (file: File): Promise<string | null> => {
    if (!isSupabaseConfigured) {
      const msg = "Supabase가 설정되지 않아 업로드할 수 없어요.";
      toast.error(msg);
      return msg;
    }
    const err = await uploadAndSave(file);
    if (!err) {
      toast.success("셔틀 안내 이미지가 업로드됐어요.");
      setEditing(false);
    } else {
      toast.error(err);
    }
    return err;
  };

  return (
    <>
      <Header
        title="🚌 구리병원 셔틀조회"
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate("/")}
        onTitleClick={handleTitleClick}
      />

      <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 pb-16">
        {editing ? (
          <ShuttleEditor
            initialUrl={imageUrl}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            uploading={uploading}
          />
        ) : loading ? (
          <ShuttleSkeleton />
        ) : error ? (
          <ErrorPanel message={error} onRetry={refetch} />
        ) : (
          <ShuttleViewer imageUrl={imageUrl} />
        )}
      </div>
    </>
  );
};

const ShuttleSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden">
      <div className="h-12 bg-slate-100 dark:bg-slate-800/50" />
      <div className="p-3">
        <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      </div>
    </div>
  </div>
);

const ErrorPanel: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 rounded-3xl p-8 text-center shadow-sm">
    <div className="text-4xl mb-4">😵</div>
    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
      셔틀 안내를 불러오지 못했어요
    </p>
    <p className="text-[11px] text-slate-400 mb-4">{message}</p>
    <button
      onClick={onRetry}
      className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md active:scale-95 transition-all"
    >
      다시 시도
    </button>
  </div>
);
