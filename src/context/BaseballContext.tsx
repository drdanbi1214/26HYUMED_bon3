// BASEBALL FEATURE
import React, { createContext, useContext, useEffect, useState } from "react";

interface BaseballContextValue {
  isBaseball: boolean;
  toggleBaseball: () => void;
}

const BaseballContext = createContext<BaseballContextValue>({
  isBaseball: false,
  toggleBaseball: () => {},
});

export const useBaseballContext = () => useContext(BaseballContext);

export const BaseballProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBaseball, setIsBaseball] = useState(
    () => localStorage.getItem("baseball_mode") === "true"
  );

  // 야구모드 ↔ blossom 클래스 동기화
  useEffect(() => {
    if (isBaseball) {
      document.documentElement.classList.remove("blossom");
    } else {
      const pref = localStorage.getItem("theme_pref");
      document.documentElement.classList.toggle("blossom", pref === "blossom");
    }
  }, [isBaseball]);

  const toggleBaseball = () =>
    setIsBaseball((prev) => {
      const next = !prev;
      localStorage.setItem("baseball_mode", String(next));
      return next;
    });

  return (
    <BaseballContext.Provider value={{ isBaseball, toggleBaseball }}>
      {children}
    </BaseballContext.Provider>
  );
};
