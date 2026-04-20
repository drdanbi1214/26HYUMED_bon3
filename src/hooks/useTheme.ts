// ============================================================
// CHERRY BLOSSOM FEATURE — remove when done:
// Delete useTheme.ts, restore useDarkMode usage in App.tsx
// ============================================================
import { useEffect } from "react";
import { useLocalStorageString } from "@/hooks/useLocalStorage";

export type ThemePref = "light" | "dark" | "blossom";

export function useTheme() {
  const [pref, setPref] = useLocalStorageString("theme_pref", "light");

  const isDark = pref === "dark";
  const isBlossom = pref === "blossom";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("blossom", isBlossom);
  }, [isDark, isBlossom]);

  return {
    isDark,
    isBlossom,
    toggle: () => setPref(isDark ? "light" : "dark"),
    toggleBlossom: () => setPref(isBlossom ? "light" : "blossom"),
  };
}
