import React, { createContext, useCallback, useContext, useState } from "react";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION_MS = 3000;

/**
 * 앱 전체를 감싸는 Provider. 어디서든 useToast()로 호출 가능.
 *
 * 사용 예:
 *   const toast = useToast();
 *   toast.success("저장됨!");
 *   toast.error("네트워크 오류");
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setItems(prev => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setItems(prev => prev.filter(t => t.id !== id));
    }, DURATION_MS);
  }, []);

  const value: ToastContextValue = {
    show,
    success: msg => show(msg, "success"),
    error: msg => show(msg, "error"),
    info: msg => show(msg, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none w-full max-w-md px-4">
        {items.map(t => (
          <ToastItemView key={t.id} item={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const styles: Record<ToastKind, string> = {
  success: "bg-emerald-600 border-emerald-700 text-white",
  error: "bg-red-600 border-red-700 text-white",
  info: "bg-slate-800 border-slate-900 text-white",
};

const icons: Record<ToastKind, string> = {
  success: "✅",
  error: "⚠️",
  info: "ℹ️",
};

const ToastItemView: React.FC<{ item: ToastItem }> = ({ item }) => {
  return (
    <div
      className={`pointer-events-auto px-4 py-3 rounded-2xl border shadow-xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300 ${styles[item.kind]}`}
    >
      <span>{icons[item.kind]}</span>
      <span>{item.message}</span>
    </div>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Provider 바깥에서 호출하면 에러 대신 조용히 noop (dev-helpful warning)
    // eslint-disable-next-line no-console
    console.warn("[useToast] ToastProvider 바깥에서 호출됨");
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}

