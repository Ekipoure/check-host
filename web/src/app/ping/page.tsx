"use client";

import { useState } from "react";
import CheckForm from "@/components/CheckForm";
import ResultDisplay from "@/components/ResultDisplay";

export default function PingPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(4);

  const handleCheck = async (host: string) => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`/api/ping?host=${encodeURIComponent(host)}&count=${count}`);
      const data = await response.json();
      if (!response.ok) {
        setResult({ error: data.error || "Failed to ping host" });
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error("Error pinging host:", error);
      setResult({ error: "Failed to ping host" });
    } finally {
      setLoading(false);
    }
  };

  const options = (
    <div>
      <label htmlFor="count" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
        Number of packets
      </label>
      <input
        id="count"
        type="number"
        min="1"
        max="10"
        value={count}
        onChange={(e) => setCount(parseInt(e.target.value) || 4)}
        className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 w-full sm:w-32"
      />
    </div>
  );

  return (
    <div className="min-h-screen py-6 sm:py-8 md:py-12 px-2 sm:px-4 md:px-6 lg:px-8">
      <CheckForm
        title="Ping Test"
        description="Test the reachability of a host, measure network latency and packet loss from different servers worldwide"
        placeholder="Enter hostname or IP address (e.g., google.com or 8.8.8.8)"
        icon="📡"
        onSubmit={handleCheck}
        options={options}
      />
      <ResultDisplay result={result} loading={loading} />
    </div>
  );
}

