import React, { useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useRestaurant } from "@/hooks/useRestaurant";
import { useToast } from "@/components/ui/Toast";
import { isSupabaseConfigured } from "@/lib/supabase";
import { CATEGORY_LABEL } from "@/types";
import { Icon } from "@/components/ui/Icon";

interface RestaurantDetailPageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

const MAX_REVIEW_LEN = 500;

/** 날짜를 "26/04/13" 형식으로 */
function formatDate(iso: string): string {
  const d = new Date(iso);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}/${mm}/${dd}`;
}

/**
 * 맛집 상세 + 후기 목록 + 후기 추가.
 * URL: /restaurants/:id
 */
export const RestaurantDetailPage: React.FC<RestaurantDetailPageProps> = ({
  isDark,
  onToggleDark,
}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const numericId = id ? parseInt(id, 10) : NaN;

  const { restaurant, reviews, loading, error, addReview, refetch } = useRestaurant(
    Number.isNaN(numericId) ? null : numericId
  );
  const toast = useToast();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // URL 파라미터가 숫자가 아니면 목록으로
  if (id && Number.isNaN(numericId)) {
    return <Navigate to="/restaurants" replace />;
  }

  const over = input.length > MAX_REVIEW_LEN;
  const countColor = over
    ? "text-red-500"
    : input.length > MAX_REVIEW_LEN * 0.8
    ? "text-amber-500"
    : "text-slate-400";

  const handleSend = async () => {
    const t = input.trim();
    if (!t || sending) return;
    if (t.length > MAX_REVIEW_LEN) {
      toast.error(`후기가 너무 깁니다 (최대 ${MAX_REVIEW_LEN}자)`);
      return;
    }
    if (!isSupabaseConfigured) {
      toast.error("Supabase가 설정되지 않아 후기를 남길 수 없어요.");
      return;
    }
    setSending(true);
    const ok = await addReview(t);
    setSending(false);
    if (ok) {
      setInput("");
      toast.success("후기가 등록됐어요.");
    } else {
      toast.error("후기 등록에 실패했어요.");
    }
  };

  return (
    <>
      <Header
        title={restaurant ? restaurant.name : "맛집"}
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate("/restaurants")}
      />

      <div className="flex flex-col min-h-[calc(100vh-160px)] animate-in fade-in slide-in-from-right duration-500">
        {loading ? (
          <DetailSkeleton />
        ) : error ? (
          <ErrorPanel message={error} onRetry={refetch} />
        ) : restaurant ? (
          <>
            {/* 맛집 정보 요약 카드 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900/50 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30 rounded-3xl p-5 mb-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">
                  Restaurant
                </p>
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
                  {restaurant.name}
                </h2>
              </div>
              <span className="text-[11px] font-black text-blue-600 bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/30 px-3 py-1 rounded-full shadow-sm">
                {CATEGORY_LABEL[restaurant.category]}
              </span>
            </div>

            {/* 후기 목록 */}
            <div className="flex-1 space-y-3 pb-4">
              {reviews.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-sm">
                  <div className="text-4xl mb-2">✍️</div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                    아직 후기가 없어요
                  </p>
                  <p className="text-[11px] text-slate-400">첫 후기를 남겨보세요!</p>
                </div>
              ) : (
                reviews.map(r => (
                  <div
                    key={r.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 text-[10px] font-black text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full mt-0.5">
                        {formatDate(r.created_at)}
                      </span>
                      <p className="flex-1 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                        {r.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 후기 입력창 */}
            <div className="sticky bottom-0 pt-2 pb-4 bg-slate-50 dark:bg-[#0c1220]">
              <div
                className={`flex gap-2 p-2 bg-white dark:bg-slate-900 rounded-2xl border shadow-xl transition-colors ${
                  over ? "border-red-400 dark:border-red-500/60" : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={isSupabaseConfigured ? "후기를 남겨주세요..." : "Supabase 미설정"}
                  disabled={sending || !isSupabaseConfigured}
                  maxLength={MAX_REVIEW_LEN + 100}
                  className="flex-1 px-4 py-3 bg-transparent outline-none text-sm disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !input.trim() || over || !isSupabaseConfigured}
                  className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="후기 등록"
                >
                  {sending ? (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Icon size={18}>
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </Icon>
                  )}
                </button>
              </div>
              <div className="flex justify-end mt-1 pr-1">
                <span className={`text-[10px] font-medium ${countColor}`}>
                  {input.length} / {MAX_REVIEW_LEN}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center">
            <p className="text-sm text-slate-400">맛집을 찾을 수 없어요.</p>
          </div>
        )}
      </div>
    </>
  );
};

const DetailSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl" />
    {[0, 1, 2].map(i => (
      <div
        key={i}
        className="h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl"
      />
    ))}
  </div>
);

const ErrorPanel: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 rounded-3xl p-8 text-center shadow-sm">
    <div className="text-4xl mb-4">😵</div>
    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
      불러오지 못했어요
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
