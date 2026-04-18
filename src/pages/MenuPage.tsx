import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { MenuViewer } from "@/components/menu/MenuViewer";
import { MenuEditor } from "@/components/menu/MenuEditor";
import { useMenu } from "@/hooks/useMenu";
import { useToast } from "@/components/ui/Toast";
import { isSupabaseConfigured } from "@/lib/supabase";

const ADMIN_CLICK_COUNT = 5;

interface MenuPageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

export const MenuPage: React.FC<MenuPageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  const { imageUrl, loading, error, uploading, uploadAndSave, refetch } = useMenu();
  const [editing, setEditing] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const toast = useToast();

  /** 제목을 5번 연속으로 클릭하면 관리자 편집 모드로 진입 */
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

  const handleSave = async (file: File) => {
    if (!isSupabaseConfigured) {
      toast.error("Supabase가 설정되지 않아 업로드할 수 없어요.");
      return false;
    }
    const ok = await uploadAndSave(file);
    if (ok) {
      toast.success("식단 이미지가 업로드됐어요.");
      setEditing(false);
    } else {
      toast.error("업로드 실패. 다시 시도해주세요.");
    }
    return ok;
  };

  return (
    <>
      <Header
        title="🍱 이번 주 식단"
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate("/")}
        onTitleClick={handleTitleClick}
      />

      <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 pb-16">
        {editing ? (
          <MenuEditor
            initialUrl={imageUrl}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            uploading={uploading}
          />
        ) : loading ? (
          <MenuSkeleton />
        ) : error ? (
          <ErrorPanel message={error} onRetry={refetch} />
        ) : (
          <MenuViewer imageUrl={imageUrl} />
        )}
      </div>
    </>
  );
};

/** 메뉴 로딩 스켈레톤 */
const MenuSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden">
      <div className="h-12 bg-slate-100 dark:bg-slate-800/50" />
      <div className="p-3">
        <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      </div>
    </div>
  </div>
);

/** 에러 발생 시 보여주는 패널 + 재시도 */
const ErrorPanel: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 rounded-3xl p-8 text-center shadow-sm">
    <div className="text-4xl mb-4">😵</div>
    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
      식단을 불러오지 못했어요
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
