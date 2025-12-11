"use client";

import { useState } from "react";
import CheckForm from "@/components/CheckForm";
import ResultDisplay from "@/components/ResultDisplay";

export default function TCPPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [port, setPort] = useState("80");

  const handleCheck = async (host: string) => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`/api/tcp?host=${encodeURIComponent(host)}&port=${port}`);
      const data = await response.json();
      if (!response.ok) {
        setResult({ error: data.error || "بررسی پورت TCP با خطا مواجه شد" });
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error("Error checking TCP port:", error);
      setResult({ error: "بررسی پورت TCP با خطا مواجه شد" });
    } finally {
      setLoading(false);
    }
  };

  const options = (
    <div>
      <label htmlFor="port" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
        شماره پورت
      </label>
      <input
        id="port"
        type="number"
        min="1"
        max="65535"
        value={port}
        onChange={(e) => setPort(e.target.value)}
        placeholder="80"
        className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 w-full sm:w-32"
      />
    </div>
  );

  return (
    <div className="min-h-screen py-6 sm:py-8 md:py-12 px-2 sm:px-4 md:px-6 lg:px-8">
      <CheckForm
        title="بررسی پورت TCP"
        description="بررسی امکان اتصال TCP به پورت مشخص شده میزبان"
        placeholder="نام میزبان یا آدرس IP را وارد کنید (مثال: google.com یا 8.8.8.8)"
        icon="🔌"
        onSubmit={handleCheck}
        options={options}
      />
      <ResultDisplay result={result} loading={loading} />
    </div>
  );
}

