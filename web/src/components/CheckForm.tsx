"use client";

import { useState, useEffect, useRef } from "react";

interface CheckFormProps {
  title: string;
  description: string;
  placeholder: string;
  onSubmit: (host: string, options?: any) => Promise<void>;
  options?: React.ReactNode;
  icon: string;
}

const STORAGE_KEY = "check-ip-host-value";

export default function CheckForm({ title, description, placeholder, onSubmit, options, icon }: CheckFormProps) {
  // Initialize host from localStorage if available
  const [host, setHost] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) || "";
    }
    return "";
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const hasAutoCheckedRef = useRef(false);
  const onSubmitRef = useRef(onSubmit);

  // Keep onSubmit ref updated
  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  // Auto-check when component mounts if host exists in localStorage
  useEffect(() => {
    // Only auto-check once per component mount
    if (hasAutoCheckedRef.current) {
      return;
    }

    // Get the stored host value directly from localStorage
    const storedHost = typeof window !== "undefined" 
      ? (localStorage.getItem(STORAGE_KEY) || "").trim()
      : "";

    // Only proceed if we have a stored host and onSubmit is available
    if (storedHost && onSubmitRef.current) {
      hasAutoCheckedRef.current = true;
      
      // Use requestAnimationFrame + setTimeout to ensure everything is ready
      requestAnimationFrame(() => {
        setTimeout(() => {
          // Double-check that we still have a stored host value
          const currentStoredHost = typeof window !== "undefined" 
            ? (localStorage.getItem(STORAGE_KEY) || "").trim()
            : "";
          
          // Check if onSubmit is available and call it
          if (currentStoredHost && onSubmitRef.current) {
            setLoading(true);
            setError("");
            onSubmitRef.current(currentStoredHost).catch((err) => {
              setError(err instanceof Error ? err.message : "خطایی رخ داد");
            }).finally(() => {
              setLoading(false);
            });
          }
        }, 300);
      });
    }
  }, []); // Run only once on mount

  // Save host to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (host.trim()) {
        localStorage.setItem(STORAGE_KEY, host);
      } else {
        // Remove from localStorage if cleared
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [host]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!host.trim()) {
      setError("لطفاً یک میزبان یا آدرس IP وارد کنید");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onSubmit(host.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start sm:items-center mb-3 sm:mb-4">
          <span className="text-xl sm:text-2xl mr-2 sm:mr-3 flex-shrink-0">{icon}</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-200 break-words">{title}</h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 break-words">{description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="host" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
              میزبان یا آدرس IP
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="host"
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 min-w-0"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base whitespace-nowrap"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="hidden sm:inline">در حال بررسی...</span>
                    <span className="sm:hidden">...</span>
                  </span>
                ) : (
                  "بررسی"
                )}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400 break-words">{error}</p>
            )}
          </div>

          {options && (
            <div className="pt-2 sm:pt-3 border-t border-slate-200 dark:border-slate-700">
              {options}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

