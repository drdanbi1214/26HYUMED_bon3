import React from "react";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * Supabase 설정이 안 됐을 때 맨 위에 고정되는 경고 배너.
 * 설정이 정상이면 아무것도 렌더하지 않음.
 *
 * 주로 배포 환경에서 Vercel 환경변수를 빼먹었을 때 빠르게 알아채기 위함.
 */
export const SupabaseBanner: React.FC = () => {
  if (isSupabaseConfigured) return null;

  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/40 text-amber-800 dark:text-amber-200 p-4 text-xs leading-relaxed">
      <div className="font-bold mb-1">⚠️ Supabase 미설정</div>
      <div>
        <code className="text-[11px] bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">
          VITE_SUPABASE_URL
        </code>{" "}
        /{" "}
        <code className="text-[11px] bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">
          VITE_SUPABASE_ANON_KEY
        </code>{" "}
        가 없어서 채팅·식단이 동작하지 않아요.
        <br />
        <span className="opacity-80">
          로컬: <code className="font-mono">.env.local</code> / 배포(Vercel): Project Settings → Environment
          Variables 확인.
        </span>
      </div>
    </div>
  );
};
