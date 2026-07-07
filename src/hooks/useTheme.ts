import { useEffect } from "react";
import { useLocalStorageString } from "@/hooks/useLocalStorage";
import type { PaletteId } from "@/data/palettes";

// 세 가지 모드는 서로 배타적 (하나만 선택 가능)
export type ThemePref = "light" | "dark" | "blossom" | "baseball";

export function useTheme() {
  const [pref, setPref] = useLocalStorageString("theme_pref", "light");
  // 기본 모드 색 팔레트 (블루그레이/핑크)
  const [paletteRaw, setPalette] = useLocalStorageString("color_palette", "gray");
  const palette: PaletteId = paletteRaw === "pink" ? "pink" : "gray";

  const isDark = pref === "dark";
  const isBlossom = pref === "blossom";
  const isBaseball = pref === "baseball";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("blossom", isBlossom);
  }, [isDark, isBlossom]);

  return {
    isDark,
    isBlossom,
    isBaseball,
    palette,
    setPalette: (p: PaletteId) => setPalette(p),
    toggle:         () => setPref(isDark      ? "light"    : "dark"),
    toggleBlossom:  () => setPref(isBlossom   ? "light"    : "blossom"),
    toggleBaseball: () => setPref(isBaseball  ? "light"    : "baseball"),
  };
}
