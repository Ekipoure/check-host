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
        setResult({ error: data.error || "Failed to check HTTP" });
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error("Error checking HTTP:", error);
      setResult({ error: "Failed to check HTTP" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <CheckForm
        title="HTTP Check"
        description="Check website's response performance and availability from many countries and datacenters"
        placeholder="Enter URL (e.g., https://google.com or google.com)"
        icon="🌍"
        onSubmit={handleCheck}
      />
      <ResultDisplay result={result} loading={loading} />
    </div>
  );
}

