"use client";

import { useState } from "react";
import CheckForm from "@/components/CheckForm";
import ResultDisplay from "@/components/ResultDisplay";

export default function DNSPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async (host: string) => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`/api/dns?host=${encodeURIComponent(host)}&type=A`);
      const data = await response.json();
      if (!response.ok) {
        setResult({ error: data.error || "Failed to check DNS" });
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error("Error checking DNS:", error);
      setResult({ error: "Failed to check DNS" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-6 sm:py-8 md:py-12 px-2 sm:px-4 md:px-6 lg:px-8">
      <CheckForm
        title="DNS Lookup"
        description="Retrieve DNS records with TTL from nameservers around the world"
        placeholder="Enter hostname or IP address (e.g., google.com or 8.8.8.8)"
        icon="🔍"
        onSubmit={handleCheck}
      />
      <ResultDisplay result={result} loading={loading} />
    </div>
  );
}

