import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { HistoryItem } from "@/types";

const KEY = "rotation_history";
const LIMIT = 5;

/**
 * 최근 검색한 사람(조번호) 목록. 최대 5개 유지.
 */
export function useSearchHistory() {
  const [history, setHistory] = useLocalStorage<HistoryItem[]>(KEY, []);

  const push = useCallback(
    (item: HistoryItem) => {
      setHistory(prev => {
        const filtered = prev.filter(h => h.id !== item.id);
        return [item, ...filtered].slice(0, LIMIT);
      });
    },
    [setHistory]
  );

  const clear = useCallback(() => setHistory([]), [setHistory]);

  return { history, push, clear };
}
