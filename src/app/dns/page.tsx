"use client";

import { useState } from "react";
import CheckForm from "@/components/CheckForm";
import ResultDisplay from "@/components/ResultDisplay";

export default function DNSPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recordType, setRecordType] = useState("A");

  const handleCheck = async (host: string) => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`/api/dns?host=${encodeURIComponent(host)}&type=${recordType}`);
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

  const options = (
    <div>
      <label htmlFor="recordType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        Record Type
      </label>
      <select
        id="recordType"
        value={recordType}
        onChange={(e) => setRecordType(e.target.value)}
        className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
      >
        <option value="A">A (IPv4)</option>
        <option value="AAAA">AAAA (IPv6)</option>
        <option value="PTR">PTR (Reverse DNS)</option>
        <option value="MX">MX (Mail Exchange)</option>
        <option value="TXT">TXT (Text)</option>
        <option value="CNAME">CNAME (Canonical Name)</option>
        <option value="NS">NS (Name Server)</option>
      </select>
    </div>
  );

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <CheckForm
        title="DNS Lookup"
        description="Retrieve DNS records with TTL from nameservers around the world"
        placeholder="Enter hostname or IP address (e.g., google.com or 8.8.8.8)"
        icon="🔍"
        onSubmit={handleCheck}
        options={options}
      />
      <ResultDisplay result={result} loading={loading} />
    </div>
  );
}

