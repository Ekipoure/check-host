"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "check-ip-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Get system theme preference
  const getSystemTheme = (): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    if (typeof window === "undefined") return;
    
    const root = document.documentElement;
    const resolved = newTheme === "system" ? getSystemTheme() : newTheme;

    // Immediately remove all theme classes
    root.classList.remove("light", "dark");
    
    // Immediately add the resolved theme class
    if (resolved === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      // For light theme, explicitly add light class and ensure dark is removed
      root.classList.add("light");
      root.classList.remove("dark");
    }
    
    // Also set data attribute for better compatibility
    root.setAttribute("data-theme", resolved);
    
    // Update state
    setResolvedTheme(resolved);
  };

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const initialTheme = stored && ["light", "dark", "system"].includes(stored) ? stored : "system";
    setThemeState(initialTheme);
    applyTheme(initialTheme);
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  // Note: We don't need a useEffect here because setTheme already calls applyTheme directly
  // This prevents double application and ensures immediate theme changes

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      // Apply immediately without waiting for state update
      applyTheme(newTheme);
    }
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

