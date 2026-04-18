import { useEffect } from "react";
import { useLocalStorageString } from "./useLocalStorage";

/**
 * <html>에 .dark 클래스 토글 + localStorage 저장.
 * 반환값: [isDark, toggle, setIsDark]
 */
export function useDarkMode() {
  const [pref, setPref] = useLocalStorageString("theme_pref", "light");
  const isDark = pref === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return {
    isDark,
    toggle: () => setPref(isDark ? "light" : "dark"),
    setIsDark: (v: boolean) => setPref(v ? "dark" : "light"),
  };
}
