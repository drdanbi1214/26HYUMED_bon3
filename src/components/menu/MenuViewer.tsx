import React, { useState } from "react";

interface MenuViewerProps {
  /** 식단 이미지의 public URL. 없으면 null. */
  imageUrl: string | null;
}

/**
 * 관리자가 업로드한 주간 식단 이미지를 렌더링.
 * - URL 없음: 업로드 안내 empty state
 * - 이미지 로드 실패: 에러 메시지
 */
export const MenuViewer: React.FC<MenuViewerProps> = ({ imageUrl }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!imageUrl) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow-sm animate-in fade-in duration-500">
        <div className="text-5xl mb-4">🍽️</div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
          이번 주 식단이 아직 업로드되지 않았어요
        </p>
        <p className="text-[11px] text-slate-400">
          관리자가 식단 이미지를 올리면 여기에 보여져요.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <span className="text-sm font-black text-slate-800 dark:text-slate-100">이번 주 식단</span>
        <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
          WEEKLY MENU
        </span>
      </div>

      <div className="p-3">
        {!imgLoaded && !imgError && (
          <div className="w-full h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
            <span className="text-[11px] text-slate-400">이미지를 불러오는 중...</span>
          </div>
        )}
        {imgError ? (
          <div className="w-full h-64 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex flex-col items-center justify-center text-center px-4">
            <div className="text-3xl mb-2">😵</div>
            <p className="text-xs text-red-500 font-bold">이미지를 불러오지 못했어요</p>
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-blue-500 underline mt-1 break-all"
            >
              원본 링크 열기
            </a>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt="이번 주 식단"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-auto rounded-2xl object-contain transition-opacity duration-300 ${
              imgLoaded ? "opacity-100" : "opacity-0 h-0"
            }`}
          />
        )}
      </div>
    </div>
  );
};
