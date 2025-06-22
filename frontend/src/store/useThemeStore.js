import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: "coffee",
  setTheme: (newTheme) => set({ theme: newTheme }),
}));
