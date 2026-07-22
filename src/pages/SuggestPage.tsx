import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { PinKeypad } from "@/components/ui/PinKeypad";
import { useSuggestions } from "@/hooks/useSuggestions";
import { useToast } from "@/components/ui/Toast";

const ADMIN_PIN = "12141214";

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
};

interface SuggestPageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

/**
 * 건의사항: 누구나 익명으로 작성해서 보낼 수 있음.
 * 쌓인 목록은 "관리자 확인" → 키패드에 12141214 입력해야 보임 (매번 입력).
 */
export const SuggestPage: React.FC<SuggestPageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { items, saving, add, fetchAll, remove } = useSuggestions();

  const [content, setContent] = useState("");
  // "idle" → 버튼만 | "pin" → 키패드 | "admin" → 목록
  const [adminStep, setAdminStep] = useState<"idle" | "pin" | "admin">("idle");
  const [listError, setListError] = useState<string | null>(null);

  const send = async () => {
    const err = await add(content.trim());
    if (err) {
      toast.error(err);
      return;
    }
    toast.success("건의사항을 보냈어요. 감사합니다! 📮");
    setContent("");
    // 관리자 화면을 보고 있었다면 목록도 갱신
    if (adminStep === "admin") fetchAll().then(e => setListError(e));
  };

  const openAdmin = async () => {
    setAdminStep("admin");
    setListError(null);
    const err = await fetchAll();
    setListError(err);
  };

  return (
    <>
      <Header
        title="📮 건의사항"
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate("/")}
      />

      <div className="space-y-4 animate-in fade-in slide-in-from-right duration-500 pb-16">
        {/* 작성 카드 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl shadow-slate-900/10">
          <p className="text-sm font-black text-slate-700 dark:text-slate-200 mb-1">
            ✍️ 건의사항 남기기
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">
            앱 기능, 오류, 실습 관련 건의 등 뭐든 편하게 남겨주세요. 익명이고, 관리자만 볼 수
            있어요.
          </p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            placeholder="예) 수술 시간표에 ○○ 기능이 있으면 좋겠어요"
            className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-y"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={send}
              disabled={saving || !content.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md active:scale-95 transition-all disabled:opacity-40"
            >
              {saving ? "보내는 중…" : "📮 보내기"}
            </button>
          </div>
        </div>

        {/* 관리자 영역 */}
        {adminStep === "idle" && (
          <div className="text-center pt-2">
            <button
              onClick={() => setAdminStep("pin")}
              className="text-xs font-bold text-slate-400 dark:text-slate-500 underline underline-offset-2 active:scale-95 transition-all"
            >
              🔐 관리자 확인
            </button>
          </div>
        )}

        {adminStep === "pin" && (
          <PinKeypad pin={ADMIN_PIN} label="🔐 관리자 비밀번호를 입력하세요" onUnlock={openAdmin} />
        )}

        {adminStep === "admin" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-900/10">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                📥 받은 건의사항 {items ? `(${items.length})` : ""}
              </span>
              <button
                onClick={() => fetchAll().then(e => setListError(e))}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
              >
                🔄 새로고침
              </button>
            </div>

            <div className="p-4 space-y-3">
              {listError && <p className="text-xs text-red-500 text-center py-2">{listError}</p>}
              {!items && !listError && (
                <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              )}
              {items && items.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">아직 건의사항이 없어요.</p>
              )}
              {items?.map(s => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">
                      {s.content}
                    </p>
                    <button
                      onClick={async () => {
                        if (!window.confirm("이 건의사항을 삭제할까요?")) return;
                        const err = await remove(s.id);
                        if (err) toast.error(err);
                        else toast.success("삭제했어요.");
                      }}
                      disabled={saving}
                      className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg text-red-500 border border-red-200 dark:border-red-900/40 active:scale-95 transition-all disabled:opacity-50"
                    >
                      🗑️
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 text-right">
                    🕐 {fmtTime(s.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
