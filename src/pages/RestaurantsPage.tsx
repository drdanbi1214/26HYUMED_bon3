import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useRestaurants } from "@/hooks/useRestaurants";
import { useToast } from "@/components/ui/Toast";
import { isSupabaseConfigured } from "@/lib/supabase";
import { CATEGORY_LABEL, type RestaurantCategory } from "@/types";

interface RestaurantsPageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

type Filter = "all" | RestaurantCategory;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "seoul", label: "서울" },
  { key: "guri", label: "구리" },
  { key: "outside", label: "외부" },
];

/**
 * 맛집 목록 페이지 + 카테고리 필터 + 검색 + 신규 등록.
 */
export const RestaurantsPage: React.FC<RestaurantsPageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  const { items, loading, error, add, refetch } = useRestaurants();
  const toast = useToast();

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(r => {
      if (filter !== "all" && r.category !== filter) return false;
      if (q && !r.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filter, query]);

  const handleAdd = async (name: string, category: RestaurantCategory) => {
    if (!isSupabaseConfigured) {
      toast.error("Supabase가 설정되지 않아 등록할 수 없어요.");
      return false;
    }
    const row = await add(name, category);
    if (row) {
      toast.success("맛집이 등록됐어요.");
      setShowForm(false);
      navigate(`/restaurants/${row.id}`);
      return true;
    }
    toast.error("등록에 실패했어요.");
    return false;
  };

  return (
    <>
      <Header
        title="🥄 맛집인계"
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate("/")}
      />

      <div className="space-y-5 animate-in fade-in slide-in-from-right duration-500 pb-16">
        {/* 검색 + 등록 버튼 */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => { setShowSearch(v => !v); setQuery(""); }}
              className={`px-5 py-3 rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-all ${
                showSearch
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
              }`}
            >
              🔍 검색
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setShowForm(v => !v)}
              className={`px-5 rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-all ${
                showForm
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
              }`}
            >
              {showForm ? "닫기" : "등록"}
            </button>
          </div>
          {showSearch && (
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="음식점 이름 검색"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm"
            />
          )}
        </div>

        {showForm && (
          <RestaurantForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        )}

        {/* 카테고리 필터 탭 */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
                filter === f.key
                  ? "bg-blue-600 border-blue-700 text-white shadow-md"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 목록 */}
        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorPanel message={error} onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <EmptyState hasItems={items.length > 0} />
        ) : (
          <ul className="space-y-2">
            {filtered.map(r => (
              <li key={r.id}>
                <button
                  onClick={() => navigate(`/restaurants/${r.id}`)}
                  className="w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 shadow-sm active:scale-[0.99] transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {r.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(r.created_at).toLocaleDateString("ko-KR", {
                        year: "2-digit",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-black text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                    {CATEGORY_LABEL[r.category]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

/** 신규 맛집 등록 폼 */
const RestaurantForm: React.FC<{
  onSubmit: (name: string, category: RestaurantCategory) => Promise<boolean>;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<RestaurantCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErr(null);
    if (!name.trim()) {
      setErr("음식점 이름을 입력해주세요.");
      return;
    }
    if (!category) {
      setErr("카테고리를 선택해주세요.");
      return;
    }
    setSubmitting(true);
    const ok = await onSubmit(name, category);
    setSubmitting(false);
    if (!ok) setErr("등록에 실패했어요.");
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">새 맛집 등록</h3>
        <button onClick={onCancel} className="text-xs text-slate-400 hover:text-slate-600">
          취소
        </button>
      </div>

      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="음식점 이름"
        maxLength={80}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
      />

      <div>
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">카테고리</p>
        <div className="grid grid-cols-3 gap-2">
          {(["seoul", "guri", "outside"] as RestaurantCategory[]).map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                category === c
                  ? "bg-blue-600 border-blue-700 text-white shadow-md"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
              }`}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      {err && (
        <div className="text-[11px] text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            등록 중...
          </>
        ) : (
          "등록하기"
        )}
      </button>
      <p className="text-[10px] text-slate-400 text-center">
        등록 후 상세 페이지로 이동해 첫 후기를 남겨주세요.
      </p>
    </div>
  );
};

/** 목록 로딩 스켈레톤 */
const ListSkeleton: React.FC = () => (
  <ul className="space-y-2 animate-pulse">
    {[0, 1, 2, 3].map(i => (
      <li key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4">
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-2/3 mb-2" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/4" />
      </li>
    ))}
  </ul>
);

const EmptyState: React.FC<{ hasItems: boolean }> = ({ hasItems }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow-sm">
    <div className="text-5xl mb-3">🥄</div>
    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
      {hasItems ? "검색 결과가 없어요" : "아직 등록된 맛집이 없어요"}
    </p>
    <p className="text-[11px] text-slate-400">
      {hasItems ? "다른 이름으로 검색하거나 필터를 바꿔보세요." : "오른쪽 위 '등록' 버튼으로 첫 맛집을 추가해보세요."}
    </p>
  </div>
);

const ErrorPanel: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 rounded-3xl p-8 text-center shadow-sm">
    <div className="text-4xl mb-4">😵</div>
    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
      목록을 불러오지 못했어요
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
