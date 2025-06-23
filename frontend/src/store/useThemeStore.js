import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("polychat-theme") || "coffee", // Default to light theme
  setTheme: (newTheme) => {
    localStorage.setItem("polychat-theme", newTheme); // Save to localStorage
    set({ theme: newTheme });
  },
}));
