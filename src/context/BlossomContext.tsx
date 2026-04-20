// ============================================================
// CHERRY BLOSSOM FEATURE — remove when done:
// Delete this file and remove BlossomProvider from App.tsx
// ============================================================
import React, { createContext, useContext } from "react";

interface BlossomContextValue {
  isBlossom: boolean;
  toggleBlossom: () => void;
}

const BlossomContext = createContext<BlossomContextValue>({
  isBlossom: false,
  toggleBlossom: () => {},
});

export const useBlossomContext = () => useContext(BlossomContext);
export const BlossomProvider = BlossomContext.Provider;
