import { useCallback, useEffect, useState } from "react";

/**
 * localStorage와 동기화되는 state.
 *
 * const [theme, setTheme] = useLocalStorage("theme", "light")
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota/private mode errors
    }
  }, [key, value]);

  const reset = useCallback(() => setValue(initial), [initial]);

  return [value, setValue, reset] as const;
}

/**
 * 문자열 전용(JSON.stringify 안 거침).
 * 테마, anon user id처럼 단순 문자열일 때.
 */
export function useLocalStorageString(key: string, initial: string) {
  const [value, setValue] = useState<string>(() => {
    try {
      return localStorage.getItem(key) ?? initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }, [key, value]);

  return [value, setValue] as const;
}
