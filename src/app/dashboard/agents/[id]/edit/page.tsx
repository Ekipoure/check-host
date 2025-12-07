"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Agent {
  id: string;
  name: string;
  serverIp: string;
  location?: "internal" | "external";
  status: "online" | "offline" | "installing" | "disabled";
  port?: number;
  host?: string;
  agentLocation?: string;
  agentCountryCode?: string;
  agentCountry?: string;
  agentCity?: string;
  agentIp?: string;
  agentAsn?: string;
  username?: string;
  targetPath?: string;
  deploymentMethod?: "github" | "upload";
  repositoryUrl?: string;
}

export default function EditAgentPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    serverIp: "",
    location: "internal" as "internal" | "external",
    port: "8000",
    host: "0.0.0.0",
    agentLocation: "",
    agentCountryCode: "",
    agentCountry: "",
    agentCity: "",
    agentIp: "",
    agentAsn: "",
    username: "",
    targetPath: "",
    deploymentMethod: "github" as "github" | "upload",
    repositoryUrl: "",
  });

  useEffect(() => {
    loadAgent();
  }, [agentId]);

  const loadAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`);
      const data = await response.json();
      if (data.success && data.agent) {
        setAgent(data.agent);
        setFormData({
          name: data.agent.name || "",
          serverIp: data.agent.serverIp || "",
          location: data.agent.location || "internal",
          port: data.agent.port?.toString() || "8000",
          host: data.agent.host || "0.0.0.0",
          agentLocation: data.agent.agentLocation || "",
          agentCountryCode: data.agent.agentCountryCode || "",
          agentCountry: data.agent.agentCountry || "",
          agentCity: data.agent.agentCity || "",
          agentIp: data.agent.agentIp || "",
          agentAsn: data.agent.agentAsn || "",
          username: data.agent.username || "",
          targetPath: data.agent.targetPath || "",
          deploymentMethod: data.agent.deploymentMethod || "github",
          repositoryUrl: data.agent.repositoryUrl || "",
        });
      } else {
        alert("Agent not found");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error loading agent:", error);
      alert("Failed to load agent");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          serverIp: formData.serverIp,
          location: formData.location,
          port: parseInt(formData.port) || 8000,
          host: formData.host,
          agentLocation: formData.agentLocation,
          agentCountryCode: formData.agentCountryCode,
          agentCountry: formData.agentCountry,
          agentCity: formData.agentCity,
          agentIp: formData.agentIp,
          agentAsn: formData.agentAsn,
          username: formData.username,
          targetPath: formData.targetPath,
          deploymentMethod: formData.deploymentMethod,
          repositoryUrl: formData.repositoryUrl,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("✅ Agent updated successfully!");
        router.push("/dashboard");
      } else {
        alert(`❌ Error: ${data.error || "Failed to update agent"}`);
      }
    } catch (error) {
      console.error("Error updating agent:", error);
      alert("❌ Failed to update agent");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Edit Agent
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Update agent configuration (password is not stored and cannot be changed here)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Server IP *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.serverIp}
                    onChange={(e) => setFormData({ ...formData, serverIp: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Location
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value as "internal" | "external" })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="internal">Internal</option>
                    <option value="external">External</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    placeholder="root"
                  />
                </div>
              </div>
            </div>

            {/* Network Configuration */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Network Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Host
                  </label>
                  <input
                    type="text"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Agent Location */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Agent Location
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.agentLocation}
                    onChange={(e) => setFormData({ ...formData, agentLocation: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Country Code
                  </label>
                  <input
                    type="text"
                    value={formData.agentCountryCode}
                    onChange={(e) => setFormData({ ...formData, agentCountryCode: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.agentCountry}
                    onChange={(e) => setFormData({ ...formData, agentCountry: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.agentCity}
                    onChange={(e) => setFormData({ ...formData, agentCity: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Agent IP
                  </label>
                  <input
                    type="text"
                    value={formData.agentIp}
                    onChange={(e) => setFormData({ ...formData, agentIp: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    ASN
                  </label>
                  <input
                    type="text"
                    value={formData.agentAsn}
                    onChange={(e) => setFormData({ ...formData, agentAsn: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Deployment Configuration */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Deployment Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Target Path
                  </label>
                  <input
                    type="text"
                    value={formData.targetPath}
                    onChange={(e) => setFormData({ ...formData, targetPath: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    placeholder="~/agent-{id}"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Deployment Method
                  </label>
                  <select
                    value={formData.deploymentMethod}
                    onChange={(e) => setFormData({ ...formData, deploymentMethod: e.target.value as "github" | "upload" })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="github">GitHub</option>
                    <option value="upload">Upload</option>
                  </select>
                </div>
                {formData.deploymentMethod === "github" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Repository URL
                    </label>
                    <input
                      type="text"
                      value={formData.repositoryUrl}
                      onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="https://github.com/user/repo.git"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

