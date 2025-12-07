"use client";

import { useState, useEffect } from "react";

interface Agent {
  id: string;
  name: string;
  serverIp: string;
  location: "internal" | "external";
  status: "online" | "offline" | "installing" | "disabled";
  lastSeen?: string;
}

interface DeploymentLog {
  agentId: string;
  timestamp: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInstallForm, setShowInstallForm] = useState(false);
  const [deployingAgentId, setDeployingAgentId] = useState<string | null>(null);
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLog[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<"success" | "error">("success");
  const [formData, setFormData] = useState({
    name: "",
    serverIp: "",
    serverLocation: "internal" as "internal" | "external",
    username: "",
    password: "",
    targetPath: "",
    deploymentMethod: "github" as "github" | "upload",
    repositoryUrl: "",
    // Agent Configuration
    agentLocation: "",
    agentCountryCode: "",
    agentCountry: "",
    agentCity: "",
    agentIp: "",
    agentAsn: "",
    // Network Configuration
    port: "8000",
    host: "0.0.0.0",
    // Security
    apiKey: "",
    // API Keys (optional)
    ipapiKey: "",
    ipgeolocationApiKey: "",
    ipinfoApiKey: "",
    // Other
    nodeEnv: "production",
    // Advanced (for manual env vars)
    envVars: "",
  });

  useEffect(() => {
    loadAgents();
  }, []);

  // Real-time logs using polling (more reliable than EventSource)
  useEffect(() => {
    if (!deployingAgentId) {
      // When deployment stops, keep the logs visible (don't clear them)
      // Only clear if user explicitly closes the log panel
      return;
    }

    let lastLogCount = 0;
    const logsInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/agents/${deployingAgentId}/logs`);
        const data = await response.json();
        if (data.success && data.logs) {
          // Always update logs, even if count hasn't changed (in case of errors)
          setDeploymentLogs(data.logs);
          if (data.logs.length > lastLogCount) {
            lastLogCount = data.logs.length;
          }
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    }, 500); // Poll every 500ms for real-time feel

    // Also poll for agent status
    const statusInterval = setInterval(async () => {
      try {
        const statusResponse = await fetch("/api/agents");
        const statusData = await statusResponse.json();
        if (statusData.agents) {
          const agent = statusData.agents.find((a: Agent) => a.id === deployingAgentId);
          if (agent && agent.status !== "installing") {
            clearInterval(logsInterval);
            clearInterval(statusInterval);
            setDeployingAgentId(null);
            
            // Show notification
            if (agent.status === "online") {
              setNotificationMessage(`✅ Agent "${agent.name}" deployed successfully!`);
              setNotificationType("success");
            } else {
              setNotificationMessage(`❌ Agent "${agent.name}" deployment failed.`);
              setNotificationType("error");
            }
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 5000);
            loadAgents();
          }
        }
      } catch (error) {
        console.error("Error checking status:", error);
      }
    }, 2000); // Check status every 2 seconds

    return () => {
      clearInterval(logsInterval);
      clearInterval(statusInterval);
    };
  }, [deployingAgentId]);

  // Auto-refresh agent status
  useEffect(() => {
    const interval = setInterval(() => {
      loadAgents();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const loadAgents = async () => {
    try {
      const response = await fetch("/api/agents");
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error("Error loading agents:", error);
    }
  };

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Only clear logs for new deployment, not for viewing existing failed deployments
    // Logs will be loaded from server when deployment starts

    try {
      const response = await fetch("/api/agents/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        setDeployingAgentId(data.agent.id);
        setShowInstallForm(false);
        setFormData({
          name: "",
          serverIp: "",
          serverLocation: "internal",
          username: "",
          password: "",
          targetPath: "",
          deploymentMethod: "github",
          repositoryUrl: "",
          agentLocation: "",
          agentCountryCode: "",
          agentCountry: "",
          agentCity: "",
          agentIp: "",
          agentAsn: "",
          port: "8000",
          host: "0.0.0.0",
          apiKey: "",
          ipapiKey: "",
          ipgeolocationApiKey: "",
          ipinfoApiKey: "",
          nodeEnv: "production",
          envVars: "",
        });
        loadAgents();
      } else {
        setNotificationMessage(`❌ Error: ${data.error || "Failed to deploy agent"}`);
        setNotificationType("error");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      console.error("Error deploying agent:", error);
      setNotificationMessage("❌ Failed to deploy agent");
      setNotificationType("error");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleUninstall = async (agentId: string) => {
    if (!confirm(`Are you sure you want to uninstall agent ${agentId}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/agents/${agentId}/uninstall`, {
        method: "POST",
      });

      const data = await response.json();
      
      if (data.success) {
        setNotificationMessage("✅ Agent uninstalled successfully!");
        setNotificationType("success");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        loadAgents();
      } else {
        setNotificationMessage(`❌ Error: ${data.error || "Failed to uninstall agent"}`);
        setNotificationType("error");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      console.error("Error uninstalling agent:", error);
      setNotificationMessage("❌ Failed to uninstall agent");
      setNotificationType("error");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const handleDisable = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/disable`, {
        method: "POST",
      });

      const data = await response.json();
      
      if (data.success) {
        setNotificationMessage("✅ Agent disabled successfully!");
        setNotificationType("success");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        loadAgents();
      } else {
        setNotificationMessage(`❌ Error: ${data.error || "Failed to disable agent"}`);
        setNotificationType("error");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      console.error("Error disabling agent:", error);
      setNotificationMessage("❌ Failed to disable agent");
      setNotificationType("error");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const handleEnable = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/enable`, {
        method: "POST",
      });

      const data = await response.json();
      
      if (data.success) {
        setNotificationMessage("✅ Agent enabled successfully!");
        setNotificationType("success");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        loadAgents();
      } else {
        setNotificationMessage(`❌ Error: ${data.error || "Failed to enable agent"}`);
        setNotificationType("error");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      console.error("Error enabling agent:", error);
      setNotificationMessage("❌ Failed to enable agent");
      setNotificationType("error");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const handleRefreshStatus = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/status`);
      const data = await response.json();
      if (data.success) {
        loadAgents();
      }
    } catch (error) {
      console.error("Error refreshing status:", error);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                Agent Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage and monitor your network monitoring agents
              </p>
            </div>
            <button
              onClick={() => setShowInstallForm(!showInstallForm)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              {showInstallForm ? "Cancel" : "+ Deploy Agent"}
            </button>
          </div>
        </div>

        {/* Deploy Form */}
        {showInstallForm && (
          <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-200">
              Deploy Agent
            </h2>
            <form onSubmit={handleInstall} className="space-y-6">
              {/* Agent Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Agent Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Production Agent"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  A unique name to identify this agent
                </p>
              </div>

              {/* Server IP Address */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Server IP Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.serverIp}
                  onChange={(e) => setFormData({ ...formData, serverIp: e.target.value })}
                  placeholder="192.168.1.100 or your-server.com"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Server Location */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Server Location
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, serverLocation: "internal" })}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      formData.serverLocation === "internal"
                        ? "bg-indigo-500 text-white shadow-lg"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    <span className="mr-2">🏠</span>
                    Internal
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, serverLocation: "external" })}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      formData.serverLocation === "external"
                        ? "bg-indigo-500 text-white shadow-lg"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    <span className="mr-2">🌐</span>
                    External
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formData.serverLocation === "internal"
                    ? "Server located within your internal network"
                    : "Server located on the public internet"}
                </p>
              </div>

              {/* Username and Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="root"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter server password"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Target Path */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Target Path (Optional - defaults to ~/agent)
                </label>
                <input
                  type="text"
                  value={formData.targetPath}
                  onChange={(e) => setFormData({ ...formData, targetPath: e.target.value })}
                  placeholder="~/agent (will use home directory if empty)"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Deployment Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Deployment Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-4 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <input
                      type="radio"
                      name="deploymentMethod"
                      value="github"
                      checked={formData.deploymentMethod === "github"}
                      onChange={(e) => setFormData({ ...formData, deploymentMethod: e.target.value as "github" | "upload" })}
                      className="mr-3"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Clone from GitHub Repository</span>
                  </label>
                  <label className="flex items-center p-4 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <input
                      type="radio"
                      name="deploymentMethod"
                      value="upload"
                      checked={formData.deploymentMethod === "upload"}
                      onChange={(e) => setFormData({ ...formData, deploymentMethod: e.target.value as "github" | "upload" })}
                      className="mr-3"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Upload Project ZIP File</span>
                  </label>
                </div>
              </div>

              {/* Repository URL */}
              {formData.deploymentMethod === "github" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Repository URL *
                  </label>
                  <input
                    type="url"
                    required={formData.deploymentMethod === "github"}
                    value={formData.repositoryUrl}
                    onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
                    placeholder="https://github.com/username/repository.git"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}

              {/* Agent Configuration Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  Agent Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* AGENT_LOCATION */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Agent Location
                    </label>
                    <input
                      type="text"
                      value={formData.agentLocation}
                      onChange={(e) => setFormData({ ...formData, agentLocation: e.target.value })}
                      placeholder="US East"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* AGENT_COUNTRY_CODE */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Country Code
                    </label>
                    <input
                      type="text"
                      value={formData.agentCountryCode}
                      onChange={(e) => setFormData({ ...formData, agentCountryCode: e.target.value })}
                      placeholder="US"
                      maxLength={2}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* AGENT_COUNTRY */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.agentCountry}
                      onChange={(e) => setFormData({ ...formData, agentCountry: e.target.value })}
                      placeholder="United States"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* AGENT_CITY */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.agentCity}
                      onChange={(e) => setFormData({ ...formData, agentCity: e.target.value })}
                      placeholder="New York"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* AGENT_IP */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Agent IP Address
                    </label>
                    <input
                      type="text"
                      value={formData.agentIp}
                      onChange={(e) => setFormData({ ...formData, agentIp: e.target.value })}
                      placeholder="192.168.1.100"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* AGENT_ASN */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      ASN Number
                    </label>
                    <input
                      type="text"
                      value={formData.agentAsn}
                      onChange={(e) => setFormData({ ...formData, agentAsn: e.target.value })}
                      placeholder="AS12345"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Network Configuration Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  Network Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PORT */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Port *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                      placeholder="8000"
                      min="1"
                      max="65535"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Default: 8000
                    </p>
                  </div>

                  {/* HOST */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Host *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.host}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      placeholder="0.0.0.0"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Default: 0.0.0.0 (all interfaces)
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Configuration Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  Security Configuration
                </h3>
                
                {/* API_KEY */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="your-secret-key-here"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Optional - برای امنیت توصیه می‌شود. باید با WORKER_API_KEY در وب‌سایت یکسان باشد.
                  </p>
                </div>
              </div>

              {/* API Keys Section (Optional) */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  API Keys (Optional - برای IP Geolocation)
                </h3>
                
                <div className="space-y-4">
                  {/* IPAPI_KEY */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      IPAPI Key
                    </label>
                    <input
                      type="text"
                      value={formData.ipapiKey}
                      onChange={(e) => setFormData({ ...formData, ipapiKey: e.target.value })}
                      placeholder="ipapi.io API key"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* IPGEOLOCATION_API_KEY */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      IPGeolocation API Key
                    </label>
                    <input
                      type="text"
                      value={formData.ipgeolocationApiKey}
                      onChange={(e) => setFormData({ ...formData, ipgeolocationApiKey: e.target.value })}
                      placeholder="ipgeolocation.io API key"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* IPINFO_API_KEY */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      IPInfo API Key
                    </label>
                    <input
                      type="text"
                      value={formData.ipinfoApiKey}
                      onChange={(e) => setFormData({ ...formData, ipinfoApiKey: e.target.value })}
                      placeholder="ipinfo.io API key"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Other Configuration Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  Other Configuration
                </h3>
                
                {/* NODE_ENV */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Node Environment
                  </label>
                  <select
                    value={formData.nodeEnv}
                    onChange={(e) => setFormData({ ...formData, nodeEnv: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="production">Production</option>
                    <option value="development">Development</option>
                    <option value="test">Test</option>
                  </select>
                </div>
              </div>

              {/* Advanced Environment Variables (Optional) */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  Advanced Configuration
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Additional Environment Variables (Optional)
                  </label>
                  <textarea
                    value={formData.envVars}
                    onChange={(e) => setFormData({ ...formData, envVars: e.target.value })}
                    placeholder="CUSTOM_VAR=value&#10;ANOTHER_VAR=value"
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    برای متغیرهای اضافی که در فیلدهای بالا وجود ندارند. هر خط به صورت KEY=value
                  </p>
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-1">💡 نکته:</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      <strong>AGENT_ID</strong> به صورت خودکار توسط سیستم تولید می‌شود و نیازی به وارد کردن نیست.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Deploying..." : "Deploy Agent"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Deployment Logs Section */}
        {deployingAgentId && (
          <div className="mb-8 bg-slate-900 dark:bg-slate-950 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 bg-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-200 flex items-center">
                  <span className="mr-2">📋</span>
                  Deployment Logs
                  {deploymentLogs.length > 0 && (
                    <span className="ml-2 text-sm text-slate-400">({deploymentLogs.length} entries)</span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  {deploymentLogs.length > 0 && (
                    <button
                      onClick={async () => {
                        if (deployingAgentId) {
                          try {
                            const response = await fetch(`/api/agents/${deployingAgentId}/logs`);
                            const data = await response.json();
                            if (data.success && data.logs) {
                              setDeploymentLogs(data.logs);
                            }
                          } catch (error) {
                            console.error("Error refreshing logs:", error);
                          }
                        }
                      }}
                      className="text-slate-400 hover:text-slate-200 transition-colors"
                      title="Refresh logs"
                    >
                      ↻
                    </button>
                  )}
                  <button
                    onClick={() => {
                      // Only clear logs when user explicitly closes the panel
                      setDeployingAgentId(null);
                      setDeploymentLogs([]);
                    }}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                    title="Close logs panel"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto font-mono text-sm bg-slate-950">
              {deploymentLogs.length === 0 ? (
                <div className="text-slate-400 animate-pulse">Waiting for logs...</div>
              ) : (
                <div className="space-y-1">
                  {deploymentLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`flex items-start py-1 ${
                        log.type === "error"
                          ? "text-red-400"
                          : log.type === "success"
                          ? "text-green-400"
                          : log.type === "warning"
                          ? "text-yellow-400"
                          : "text-slate-300"
                      }`}
                    >
                      <span className="mr-3 text-slate-500 text-xs min-w-[80px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="flex-1 break-words">{log.message}</span>
                    </div>
                  ))}
                  {/* Auto-scroll to bottom */}
                  <div ref={(el) => {
                    if (el) {
                      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
                    }
                  }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {showNotification && (
          <div
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-300 ${
              notificationType === "success"
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                : "bg-gradient-to-r from-red-500 to-rose-600 text-white"
            }`}
            style={{
              animation: "slideInRight 0.3s ease-out",
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="text-xl">
                {notificationType === "success" ? "✅" : "❌"}
              </div>
              <div className="font-semibold">{notificationMessage}</div>
              <button
                onClick={() => setShowNotification(false)}
                className="ml-4 text-white/80 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Agents List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              Deployed Agents ({agents.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {agents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                No agents deployed yet. Click "Deploy Agent" to get started.
              </div>
            ) : (
              agents.map((agent) => (
                <div key={agent.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        agent.status === "online" ? "bg-green-500" :
                        agent.status === "offline" ? "bg-red-500" :
                        "bg-yellow-500 animate-pulse"
                      }`} />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                          {agent.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {agent.serverIp}
                          {agent.location && ` • ${agent.location === "internal" ? "Internal" : "External"}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        agent.status === "online" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                        agent.status === "offline" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                        agent.status === "disabled" ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" :
                        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}>
                        {agent.status.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleRefreshStatus(agent.id)}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium"
                        title="Refresh Status"
                      >
                        🔄
                      </button>
                      {agent.status === "disabled" ? (
                        <button
                          onClick={() => handleEnable(agent.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-medium"
                        >
                          Enable
                        </button>
                      ) : agent.status === "online" ? (
                        <button
                          onClick={() => handleDisable(agent.id)}
                          className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-xs font-medium"
                        >
                          Disable
                        </button>
                      ) : null}
                      <button
                        onClick={() => window.location.href = `/dashboard/agents/${agent.id}/edit`}
                        className="px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleUninstall(agent.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
