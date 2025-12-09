"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import CheckForm from "@/components/CheckForm";
import ResultDisplay from "@/components/ResultDisplay";

export default function IPInfoPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const initialHost = searchParams.get("host") || "";

  const handleCheck = useCallback(async (host: string) => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`/api/ip-info?host=${encodeURIComponent(host)}`);
      const data = await response.json();
      if (!response.ok) {
        setResult({ error: data.error || "Failed to fetch IP information" });
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error("Error checking IP info:", error);
      setResult({ error: "Failed to fetch IP information" });
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-check if host is provided in URL
  useEffect(() => {
    if (initialHost) {
      handleCheck(initialHost);
    }
  }, [initialHost, handleCheck]);

  return (
    <div className="min-h-screen py-6 sm:py-8 md:py-12 px-2 sm:px-4 md:px-6 lg:px-8">
      <CheckForm
        title="IP Information"
        description="Get geolocation data of IP address or hostname: country, region, city, timezone, ISP, and organization"
        placeholder="Enter IP address or hostname (e.g., 8.8.8.8 or google.com)"
        icon="🌐"
        onSubmit={handleCheck}
      />
      <ResultDisplay result={result} loading={loading} />
    </div>
  );
}

