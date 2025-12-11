"use client";

import { useContext, useState, useEffect } from "react";
import { ThemeContext } from "./ThemeProvider";

export default function ThemeToggle() {
  const context = useContext(ThemeContext);
  const [mounted, setMounted] = useState(false);
  const [localTheme, setLocalTheme] = useState<"light" | "dark" | "system">("system");
  const [localResolvedTheme, setLocalResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    // Initialize from localStorage if context is not available
    if (!context && typeof window !== "undefined") {
      const stored = localStorage.getItem("check-ip-theme") as "light" | "dark" | "system" | null;
      const initialTheme = stored && ["light", "dark", "system"].includes(stored) ? stored : "system";
      setLocalTheme(initialTheme);
      
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      const resolved = initialTheme === "system" ? systemTheme : initialTheme;
      setLocalResolvedTheme(resolved);
    }
  }, []);

  // Use context if available, otherwise use local state
  const theme = context?.theme ?? localTheme;
  const resolvedTheme = context?.resolvedTheme ?? localResolvedTheme;
  const setTheme = context?.setTheme ?? ((newTheme: "light" | "dark" | "system") => {
    setLocalTheme(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("check-ip-theme", newTheme);
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      const resolved = newTheme === "system" ? systemTheme : newTheme;
      setLocalResolvedTheme(resolved);
      
      // Apply theme directly - immediate execution
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      
      if (resolved === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
      
      root.setAttribute("data-theme", resolved);
    }
  });

  if (!mounted) {
    // Return a placeholder to prevent layout shift
    return (
      <button
        className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
        aria-label="تغییر تم"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
    );
  }

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "system") {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    } else if (resolvedTheme === "dark") {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    }
  };

  const getLabel = () => {
    if (theme === "system") {
      return "تم سیستم";
    } else if (theme === "dark") {
      return "تم دارک";
    } else {
      return "تم روشن";
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 relative group"
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
      {/* Tooltip - positioned below the button */}
      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-slate-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {getLabel()}
      </span>
    </button>
  );
}

