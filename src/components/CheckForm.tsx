"use client";

import { useState } from "react";

interface CheckFormProps {
  title: string;
  description: string;
  placeholder: string;
  onSubmit: (host: string, options?: any) => Promise<void>;
  options?: React.ReactNode;
  icon: string;
}

export default function CheckForm({ title, description, placeholder, onSubmit, options, icon }: CheckFormProps) {
  const [host, setHost] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center mb-6">
          <span className="text-4xl mr-4">{icon}</span>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">{title}</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">{description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              {options}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

