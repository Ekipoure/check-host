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
  // This effect runs when onSubmit is ready
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
    if (storedHost && onSubmit) {
      hasAutoCheckedRef.current = true;
      
      // Use requestAnimationFrame + setTimeout to ensure everything is ready
      requestAnimationFrame(() => {
        setTimeout(() => {
          // Double-check that we still have a stored host value
          const currentStoredHost = typeof window !== "undefined" 
            ? (localStorage.getItem(STORAGE_KEY) || "").trim()
            : "";
          
          // Check if onSubmit is available and call it
          if (currentStoredHost && onSubmit) {
            setLoading(true);
            setError("");
            onSubmit(currentStoredHost).catch((err) => {
              setError(err instanceof Error ? err.message : "An error occurred");
            }).finally(() => {
              setLoading(false);
            });
          }
        }, 300);
      });
    }
  }, [onSubmit]); // Run when onSubmit is ready (and on mount)

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
      setError("Please enter a host or IP address");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onSubmit(host.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center mb-3">
          <span className="text-2xl mr-3">{icon}</span>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">{title}</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-sm">{description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="host" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Host or IP Address
            </label>
            <div className="flex gap-2">
              <input
                id="host"
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Checking...
                  </span>
                ) : (
                  "Check"
                )}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          {options && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              {options}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

