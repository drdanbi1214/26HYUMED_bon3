import React, { createContext, useContext } from "react";

interface BlossomContextValue {
  isBlossom: boolean;
  toggleBlossom: () => void;
  isBaseball: boolean;
  toggleBaseball: () => void;
}

const BlossomContext = createContext<BlossomContextValue>({
  isBlossom: false,
  toggleBlossom: () => {},
  isBaseball: false,
  toggleBaseball: () => {},
});

export const useBlossomContext = () => useContext(BlossomContext);
export const BlossomProvider = BlossomContext.Provider;
