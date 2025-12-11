"use client";

import { useState } from "react";
import CheckForm from "@/components/CheckForm";
import ResultDisplay from "@/components/ResultDisplay";

export default function HTTPPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async (host: string) => {
    setLoading(true);
    setResult(null);
    
    // Ensure URL has protocol
    const url = host.startsWith("http://") || host.startsWith("https://") 
      ? host 
      : `https://${host}`;
    
    try {
      const response = await fetch(`/api/http?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      if (!response.ok) {
        setResult({ error: data.error || "بررسی HTTP با خطا مواجه شد" });
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error("Error checking HTTP:", error);
      setResult({ error: "بررسی HTTP با خطا مواجه شد" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-6 sm:py-8 md:py-12 px-2 sm:px-4 md:px-6 lg:px-8">
      <CheckForm
        title="بررسی HTTP"
        description="بررسی عملکرد و در دسترس بودن پاسخ وب‌سایت از کشورها و مراکز داده مختلف"
        placeholder="URL را وارد کنید (مثال: https://google.com یا google.com)"
        icon="🌍"
        onSubmit={handleCheck}
      />
      <ResultDisplay result={result} loading={loading} />
    </div>
  );
}

