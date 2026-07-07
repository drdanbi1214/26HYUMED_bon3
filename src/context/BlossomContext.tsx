import React, { createContext, useContext } from "react";
import type { PaletteId } from "@/data/palettes";

interface BlossomContextValue {
  isBlossom: boolean;
  toggleBlossom: () => void;
  isBaseball: boolean;
  toggleBaseball: () => void;
  palette: PaletteId;
  setPalette: (p: PaletteId) => void;
}

const BlossomContext = createContext<BlossomContextValue>({
  isBlossom: false,
  toggleBlossom: () => {},
  isBaseball: false,
  toggleBaseball: () => {},
  palette: "gray",
  setPalette: () => {},
});

export const useBlossomContext = () => useContext(BlossomContext);
export const BlossomProvider = BlossomContext.Provider;
