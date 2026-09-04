import React, { useEffect, useState } from "react";
import { useSuggestions } from "@/hooks/useSuggestions";
import { useToast } from "@/components/ui/Toast";

/** 이 기기(브라우저)에서 "다시 보지 않기"를 눌렀는지 기억하는 키 */
const DISMISS_KEY = "feedback_prompt_dismissed";

const isDismissed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * 사이트 접속 시 모두에게 뜨는 개선사항 요청 창.
 *
 * - 확인: 건의사항(suggestions 테이블)으로 전송 후 닫고, 이 기기에서 다시 안 뜸
 * - 닫기: 이번 방문만 닫음 (다음 접속·새로고침 때 다시 뜸)
 * - 다시 보지 않기: 이 기기(브라우저)에서 다시는 안 뜸 (localStorage)
 */
export const FeedbackPrompt: React.FC = () => {
  const { saving, add } = useSuggestions();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (isDismissed()) return;
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  /** 이 기기에서 다시는 안 뜨게 */
  const neverShowAgain = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // private mode 등은 무시
    }
    setOpen(false);
  };

  /** 이번 방문만 닫기 */
  const closeForNow = () => setOpen(false);

  const submit = async () => {
    const body = text.trim();
    if (!body) return;
    const err = await add(`[접속 팝업] ${body}`);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success("소중한 피드백 감사합니다! 🙇");
    neverShowAgain();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={closeForNow}
      />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl shadow-slate-900/30 animate-in fade-in zoom-in-95 duration-300">
        <p className="text-base font-black text-slate-800 dark:text-slate-100">
          개선할 점을 알려주세요!
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
          자세한 피드백은 사이트 주인에게 큰 힘이 됩니다. 🙏
        </p>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          autoFocus
          placeholder="예) ○○ 화면에 △△ 기능이 있으면 좋겠어요"
          className="mt-3 w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-y"
        />

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={submit}
            disabled={saving || !text.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md active:scale-95 transition-all disabled:opacity-40"
          >
            {saving ? "보내는 중…" : "확인"}
          </button>
          <button
            onClick={closeForNow}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold active:scale-95 transition-all"
          >
            닫기
          </button>
        </div>

        <div className="mt-2 text-center">
          <button
            onClick={neverShowAgain}
            className="text-[11px] text-slate-400 dark:text-slate-500 underline underline-offset-2 active:scale-95 transition-all"
          >
            다시 보지 않기
          </button>
        </div>
      </div>
    </div>
  );
};
