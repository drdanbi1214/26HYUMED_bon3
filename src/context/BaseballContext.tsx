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

  const toggleBaseball = () =>
    setIsBaseball((prev) => {
      localStorage.setItem("baseball_mode", String(!prev));
      return !prev;
    });

  return (
    <BaseballContext.Provider value={{ isBaseball, toggleBaseball }}>
      {children}
    </BaseballContext.Provider>
  );
};
