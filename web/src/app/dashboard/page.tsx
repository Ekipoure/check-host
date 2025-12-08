"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Agent {
  id: string;
  name: string;
  serverIp: string;
  location: "internal" | "external";
  status: "online" | "offline" | "installing" | "disabled";
  lastSeen?: string;
  hidden?: boolean;
}

interface DeploymentLog {
  agentId: string;
  timestamp: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

interface EditAdminFormProps {
  admin: Admin;
  currentAdminId: number;
  onSave: (username?: string, password?: string) => void;
  onCancel: () => void;
}

function EditAdminForm({ admin, currentAdminId, onSave, onCancel }: EditAdminFormProps) {
  const [editUsername, setEditUsername] = useState(admin.username);
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editPassword && editPassword !== editConfirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (editPassword && editPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    const newUsername = editUsername !== admin.username ? editUsername : undefined;
    const newPassword = editPassword || undefined;
    
    onSave(newUsername, newPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          Username
        </label>
        <input
          type="text"
          required
          value={editUsername}
          onChange={(e) => setEditUsername(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            New Password
          </label>
          <input
            type="password"
            value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            placeholder="Leave empty to keep"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            value={editConfirmPassword}
            onChange={(e) => setEditConfirmPassword(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 text-xs font-medium bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
        >
          Save
        </button>
      </div>
    </form>
  );
}

interface Admin {
  id: number;
  username: string;
  created_at: string;
  updated_at: string;
}

type TabType = "agents" | "admins" | "banners";

interface PartialLink {
  text: string;
  url: string;
  color?: string;
}

interface Banner {
  id: number;
  text: string;
  text_color: string;
  background_color: string;
  has_background: boolean;
  font_size: number;
  animation_duration: number;
  link_url: string | null;
  partial_links: PartialLink[] | null;
  position: "top" | "bottom";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("agents");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInstallForm, setShowInstallForm] = useState(false);
  const [deployingAgentId, setDeployingAgentId] = useState<string | null>(null);
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLog[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<"success" | "error">("success");
  const [currentAdmin, setCurrentAdmin] = useState<{ id: number; username: string } | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showAddBannerForm, setShowAddBannerForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerFormData, setBannerFormData] = useState({
    text: "",
    textColor: "#000000",
    backgroundColor: "#ffffff",
    hasBackground: true,
    fontSize: 16,
    animationDuration: 20,
    linkUrl: "",
    partialLinks: [] as PartialLink[],
    position: "top" as "top" | "bottom",
    isActive: true,
  });
  const [formData, setFormData] = useState({
    name: "",
    serverIp: "",
    serverLocation: "internal" as "internal" | "external",
    username: "",
    password: "",
    targetPath: "",
    deploymentMethod: "github" as "github" | "upload",
    repositoryUrl: "",
    agentLocation: "",
    agentCountryCode: "",
    agentCountry: "",
    agentCity: "",
    agentIp: "",
    agentAsn: "",
    countryEmoji: "",
    port: "8000",
    host: "0.0.0.0",
    apiKey: "",
    ipapiKey: "",
    ipgeolocationApiKey: "",
    ipinfoApiKey: "",
    nodeEnv: "production",
    envVars: "",
  });

  useEffect(() => {
    fetch("/api/auth/verify")
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.authenticated) {
          router.push("/login");
        } else {
          setCurrentAdmin(data.admin);
          loadAgents();
          loadAdmins();
          loadBanners();
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  const loadAdmins = async () => {
    try {
      const response = await fetch("/api/auth/admins");
      const data = await response.json();
      if (data.success) {
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error("Error loading admins:", error);
    }
  };

  const loadBanners = async () => {
    try {
      const response = await fetch("/api/banners?admin=true");
      const data = await response.json();
      if (data.success) {
        setBanners(data.banners);
      }
    } catch (error) {
      console.error("Error loading banners:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    if (!deployingAgentId) {
      return;
    }

    let lastLogCount = 0;
    const logsInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/agents/${deployingAgentId}/logs`);
        const data = await response.json();
        if (data.success && data.logs) {
          setDeploymentLogs(data.logs);
          if (data.logs.length > lastLogCount) {
            lastLogCount = data.logs.length;
          }
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    }, 500);

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
            
            if (agent.status === "online") {
              setNotificationMessage(`Agent "${agent.name}" deployed successfully`);
              setNotificationType("success");
            } else {
              setNotificationMessage(`Agent "${agent.name}" deployment failed`);
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
    }, 2000);

    return () => {
      clearInterval(logsInterval);
      clearInterval(statusInterval);
    };
  }, [deployingAgentId]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadAgents();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadAgents = async () => {
    try {
      const response = await fetch("/api/agents?includeHidden=true");
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error("Error loading agents:", error);
    }
  };

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
          countryEmoji: "",
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
        setNotificationMessage(`Error: ${data.error || "Failed to deploy agent"}`);
        setNotificationType("error");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      console.error("Error deploying agent:", error);
      setNotificationMessage("Failed to deploy agent");
      setNotificationType("error");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleUninstall = async (agentId: string) => {
    if (!confirm(`Uninstall agent ${agentId}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/agents/${agentId}/uninstall`, {
        method: "POST",
      });

      const data = await response.json();
      
      if (data.success) {
        setNotificationMessage("Agent uninstalled");
        setNotificationType("success");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        loadAgents();
      } else {
        setNotificationMessage(`Error: ${data.error || "Failed to uninstall"}`);
        setNotificationType("error");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      console.error("Error uninstalling agent:", error);
      setNotificationMessage("Failed to uninstall");
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
        setNotificationMessage("Agent hidden");
        setNotificationType("success");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        loadAgents();
      } else {
        setNotificationMessage(`Error: ${data.error || "Failed to hide"}`);
        setNotificationType("error");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      console.error("Error disabling agent:", error);
      setNotificationMessage("Failed to disable");
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
        setNotificationMessage("Agent shown");
        setNotificationType("success");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        loadAgents();
      } else {
        setNotificationMessage(`Error: ${data.error || "Failed to show"}`);
        setNotificationType("error");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      console.error("Error enabling agent:", error);
      setNotificationMessage("Failed to enable");
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

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (adminFormData.password !== adminFormData.confirmPassword) {
      setNotificationMessage("Passwords do not match");
      setNotificationType("error");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
      return;
    }

    if (adminFormData.password.length < 6) {
      setNotificationMessage("Password must be at least 6 characters");
      setNotificationType("error");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
      return;
    }

    try {
      const response = await fetch("/api/auth/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: adminFormData.username,
          password: adminFormData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNotificationMessage("Admin added");
        setNotificationType("success");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        setShowAddAdminForm(false);
        setAdminFormData({ username: "", password: "", confirmPassword: "" });
        loadAdmins();
      } else {
        setNotificationMessage(`Error: ${data.error || "Failed to add admin"}`);
        setNotificationType("error");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      console.error("Error adding admin:", error);
      setNotificationMessage("Failed to add admin");
      setNotificationType("error");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const handleUpdateAdmin = async (adminId: number, username?: string, password?: string) => {
    try {
      const response = await fetch("/api/auth/admins", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: adminId,
          username,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNotificationMessage("Admin updated");
        setNotificationType("success");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        setEditingAdmin(null);
        loadAdmins();
        if (currentAdmin && currentAdmin.id === adminId) {
          fetch("/api/auth/verify")
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.authenticated) {
                setCurrentAdmin(data.admin);
              }
            });
        }
      } else {
        setNotificationMessage(`Error: ${data.error || "Failed to update"}`);
        setNotificationType("error");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      console.error("Error updating admin:", error);
      setNotificationMessage("Failed to update");
      setNotificationType("error");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const handleDeleteAdmin = async (adminId: number) => {
    if (!confirm("Delete this admin?")) {
      return;
    }

    try {
      const response = await fetch(`/api/auth/admins?id=${adminId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setNotificationMessage("Admin deleted");
        setNotificationType("success");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        loadAdmins();
      } else {
        setNotificationMessage(`Error: ${data.error || "Failed to delete"}`);
        setNotificationType("error");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      console.error("Error deleting admin:", error);
      setNotificationMessage("Failed to delete");
      setNotificationType("error");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bannerFormData.text.trim()) {
      setNotificationMessage("Text is required");
      setNotificationType("error");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
      return;
    }

    try {
      const response = await fetch("/api/banners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bannerFormData),
      });

      const data = await response.json();

      if (data.success) {
        setNotificationMessage("Banner added");
        setNotificationType("success");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        setShowAddBannerForm(false);
        setBannerFormData({
          text: "",
          textColor: "#000000",
          backgroundColor: "#ffffff",
          hasBackground: true,
          fontSize: 16,
          animationDuration: 20,
          linkUrl: "",
          partialLinks: [],
          position: "top",
          isActive: true,
        });
        loadBanners();
      } else {
        setNotificationMessage(`Error: ${data.error || "Failed to add banner"}`);
        setNotificationType("error");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      console.error("Error adding banner:", error);
      setNotificationMessage("Failed to add banner");
      setNotificationType("error");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const handleUpdateBanner = async (bannerId: number) => {
    if (!bannerFormData.text.trim()) {
      setNotificationMessage("Text is required");
      setNotificationType("error");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
      return;
    }

    try {
      const response = await fetch(`/api/banners/${bannerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bannerFormData),
      });

      const data = await response.json();

      if (data.success) {
        setNotificationMessage("Banner updated");
        setNotificationType("success");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        setEditingBanner(null);
        setBannerFormData({
          text: "",
          textColor: "#000000",
          backgroundColor: "#ffffff",
          hasBackground: true,
          fontSize: 16,
          animationDuration: 20,
          linkUrl: "",
          partialLinks: [],
          position: "top",
          isActive: true,
        });
        loadBanners();
      } else {
        setNotificationMessage(`Error: ${data.error || "Failed to update"}`);
        setNotificationType("error");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      console.error("Error updating banner:", error);
      setNotificationMessage("Failed to update");
      setNotificationType("error");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const handleDeleteBanner = async (bannerId: number) => {
    if (!confirm("Delete this banner?")) {
      return;
    }

    try {
      const response = await fetch(`/api/banners/${bannerId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setNotificationMessage("Banner deleted");
        setNotificationType("success");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        loadBanners();
      } else {
        setNotificationMessage(`Error: ${data.error || "Failed to delete"}`);
        setNotificationType("error");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      console.error("Error deleting banner:", error);
      setNotificationMessage("Failed to delete");
      setNotificationType("error");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  const handleToggleBannerActive = async (bannerId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/banners/${bannerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      const data = await response.json();

      if (data.success) {
        setNotificationMessage(`Banner ${!isActive ? "enabled" : "disabled"}`);
        setNotificationType("success");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        loadBanners();
      } else {
        setNotificationMessage(`Error: ${data.error || "Failed to update"}`);
        setNotificationType("error");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    } catch (error) {
      console.error("Error toggling banner:", error);
      setNotificationMessage("Failed to update");
      setNotificationType("error");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  };

  if (!currentAdmin) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 4rem)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Minimal Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Dashboard</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentAdmin.username}
            </p>
          </div>
        </div>


        {/* Deployment Logs */}
        {deployingAgentId && (
          <div className="mb-6 bg-slate-900 dark:bg-slate-950 rounded-lg border border-slate-700 overflow-hidden">
            <div className="p-3 border-b border-slate-700 bg-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200">Deployment Logs</h3>
              <button
                onClick={() => {
                  setDeployingAgentId(null);
                  setDeploymentLogs([]);
                }}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto font-mono text-xs bg-slate-950">
              {deploymentLogs.length === 0 ? (
                <div className="text-slate-400">Waiting for logs...</div>
              ) : (
                <div className="space-y-1">
                  {deploymentLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`${
                        log.type === "error" ? "text-red-400" :
                        log.type === "success" ? "text-green-400" :
                        log.type === "warning" ? "text-yellow-400" :
                        "text-slate-300"
                      }`}
                    >
                      <span className="text-slate-500 mr-2">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      {log.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab("agents")}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  activeTab === "agents"
                    ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Agents ({agents.length})
              </button>
              <button
                onClick={() => setActiveTab("admins")}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  activeTab === "admins"
                    ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Admins ({admins.length})
              </button>
              <button
                onClick={() => setActiveTab("banners")}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  activeTab === "banners"
                    ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Banners ({banners.length})
              </button>
            </div>
          </div>

          {/* Agents Tab */}
          {activeTab === "agents" && (
            <div className="p-4">
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => setShowInstallForm(!showInstallForm)}
                  className="px-3 py-1.5 text-xs font-medium bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
                >
                  {showInstallForm ? "Cancel" : "Deploy"}
                </button>
              </div>

              {showInstallForm && (
                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-600">
                  <h3 className="text-xs font-semibold mb-3 text-slate-800 dark:text-slate-200">Deploy Agent</h3>
                  <form onSubmit={handleInstall} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Agent Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="My Agent"
                          className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Server IP *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.serverIp}
                          onChange={(e) => setFormData({ ...formData, serverIp: e.target.value })}
                          placeholder="192.168.1.100"
                          className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Username *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          placeholder="root"
                          className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Repository URL *
                        </label>
                        <input
                          type="url"
                          required={formData.deploymentMethod === "github"}
                          value={formData.repositoryUrl}
                          onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
                          placeholder="https://github.com/user/repo.git"
                          className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Port
                        </label>
                        <input
                          type="number"
                          value={formData.port}
                          onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                          placeholder="8000"
                          className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-1.5 text-xs font-medium bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors disabled:opacity-50"
                      >
                        {loading ? "Deploying..." : "Deploy"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {agents.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                  No agents deployed
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-400">Status</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-400">Name</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-400">Server IP</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-400">Location</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.map((agent) => (
                        <tr key={agent.id} className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 ${agent.hidden ? 'opacity-50' : ''}`}>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                agent.status === "online" ? "bg-green-500" :
                                agent.status === "offline" ? "bg-red-500" :
                                agent.status === "disabled" ? "bg-gray-400" :
                                "bg-yellow-500 animate-pulse"
                              }`} />
                              <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">{agent.status}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-slate-800 dark:text-slate-200">{agent.name}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{agent.serverIp}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400 capitalize">{agent.location}</td>
                          <td className="py-2 px-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleRefreshStatus(agent.id)}
                                className="px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                title="Refresh"
                              >
                                ↻
                              </button>
                              {agent.hidden ? (
                                <button
                                  onClick={() => handleEnable(agent.id)}
                                  className="px-2 py-1 text-xs font-medium bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                >
                                  Show
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDisable(agent.id)}
                                  className="px-2 py-1 text-xs font-medium bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                                >
                                  Hide
                                </button>
                              )}
                              <button
                                onClick={() => window.location.href = `/dashboard/agents/${agent.id}/edit`}
                                className="px-2 py-1 text-xs font-medium bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleUninstall(agent.id)}
                                className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Admins Tab */}
          {activeTab === "admins" && (
            <div className="p-4">
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => {
                    setShowAddAdminForm(!showAddAdminForm);
                    setEditingAdmin(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  {showAddAdminForm ? "Cancel" : "+ Add Admin"}
                </button>
              </div>

              {showAddAdminForm && (
                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-600">
                  <h3 className="text-xs font-semibold mb-3 text-slate-800 dark:text-slate-200">Add Admin</h3>
                  <form onSubmit={handleAddAdmin} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        required
                        value={adminFormData.username}
                        onChange={(e) => setAdminFormData({ ...adminFormData, username: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          required
                          value={adminFormData.password}
                          onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                          className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Confirm *
                        </label>
                        <input
                          type="password"
                          required
                          value={adminFormData.confirmPassword}
                          onChange={(e) => setAdminFormData({ ...adminFormData, confirmPassword: e.target.value })}
                          className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {admins.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                  No admins
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-400">Username</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-400">Created</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr key={admin.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-800 dark:text-slate-200">{admin.username}</span>
                              {admin.id === currentAdmin.id && (
                                <span className="px-1.5 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded">
                                  You
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400 text-xs">
                            {new Date(admin.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3">
                            {editingAdmin?.id === admin.id ? (
                              <div className="flex justify-end">
                                <EditAdminForm
                                  admin={admin}
                                  currentAdminId={currentAdmin.id}
                                  onSave={(username, password) => {
                                    handleUpdateAdmin(admin.id, username, password);
                                  }}
                                  onCancel={() => setEditingAdmin(null)}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setEditingAdmin(admin)}
                                  className="px-2 py-1 text-xs font-medium bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                                >
                                  Edit
                                </button>
                                {admin.id !== currentAdmin.id && (
                                  <button
                                    onClick={() => handleDeleteAdmin(admin.id)}
                                    className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Banners Tab */}
          {activeTab === "banners" && (
            <div className="p-4">
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => {
                    setShowAddBannerForm(!showAddBannerForm);
                    setEditingBanner(null);
                    setBannerFormData({
                      text: "",
                      textColor: "#000000",
                      backgroundColor: "#ffffff",
                      hasBackground: true,
                      fontSize: 16,
                      animationDuration: 20,
                      linkUrl: "",
                      partialLinks: [],
                      position: "top",
                      isActive: true,
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
                >
                  {showAddBannerForm ? "Cancel" : "+ Add Banner"}
                </button>
              </div>

              {(showAddBannerForm || editingBanner) && (
                <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-600">
                  <h3 className="text-xs font-semibold mb-3 text-slate-800 dark:text-slate-200">
                    {editingBanner ? "Edit Banner" : "Add Banner"}
                  </h3>
                  <form
                    onSubmit={editingBanner ? (e) => { e.preventDefault(); handleUpdateBanner(editingBanner.id); } : handleAddBanner}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Text *
                      </label>
                      <textarea
                        required
                        value={bannerFormData.text}
                        onChange={(e) => setBannerFormData({ ...bannerFormData, text: e.target.value })}
                        placeholder="Enter banner text..."
                        rows={3}
                        className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Text Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={bannerFormData.textColor}
                            onChange={(e) => setBannerFormData({ ...bannerFormData, textColor: e.target.value })}
                            className="w-12 h-8 border border-slate-300 dark:border-slate-600 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={bannerFormData.textColor}
                            onChange={(e) => setBannerFormData({ ...bannerFormData, textColor: e.target.value })}
                            className="flex-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            placeholder="#000000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Font Size (px)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={bannerFormData.fontSize}
                          onChange={(e) => setBannerFormData({ ...bannerFormData, fontSize: parseInt(e.target.value) || 16 })}
                          className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        <input
                          type="checkbox"
                          checked={bannerFormData.hasBackground}
                          onChange={(e) => setBannerFormData({ ...bannerFormData, hasBackground: e.target.checked })}
                          className="rounded border-slate-300 dark:border-slate-600"
                        />
                        Use Background Color
                      </label>
                    </div>

                    {bannerFormData.hasBackground && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Background Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={bannerFormData.backgroundColor}
                            onChange={(e) => setBannerFormData({ ...bannerFormData, backgroundColor: e.target.value })}
                            className="w-12 h-8 border border-slate-300 dark:border-slate-600 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={bannerFormData.backgroundColor}
                            onChange={(e) => setBannerFormData({ ...bannerFormData, backgroundColor: e.target.value })}
                            className="flex-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Animation Duration (seconds)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={bannerFormData.animationDuration}
                          onChange={(e) => setBannerFormData({ ...bannerFormData, animationDuration: parseInt(e.target.value) || 20 })}
                          className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Position
                        </label>
                        <select
                          value={bannerFormData.position}
                          onChange={(e) => setBannerFormData({ ...bannerFormData, position: e.target.value as "top" | "bottom" })}
                          className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        >
                          <option value="top">Top (Above Header)</option>
                          <option value="bottom">Bottom (Below Header)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Link URL (optional - links entire text)
                      </label>
                      <input
                        type="url"
                        value={bannerFormData.linkUrl}
                        onChange={(e) => setBannerFormData({ ...bannerFormData, linkUrl: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        If set, the entire banner text will be clickable. Leave empty to use partial links below.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                        Partial Links (link specific words/phrases)
                      </label>
                      <div className="space-y-2">
                        {bannerFormData.partialLinks.map((link, index) => (
                          <div key={index} className="space-y-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                            <div className="flex gap-2 items-start">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  Text to Link
                                </label>
                                <input
                                  type="text"
                                  value={link.text}
                                  onChange={(e) => {
                                    const newLinks = [...bannerFormData.partialLinks];
                                    newLinks[index].text = e.target.value;
                                    setBannerFormData({ ...bannerFormData, partialLinks: newLinks });
                                  }}
                                  placeholder="Text to link (must exist in banner text)"
                                  className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  URL
                                </label>
                                <input
                                  type="url"
                                  value={link.url}
                                  onChange={(e) => {
                                    const newLinks = [...bannerFormData.partialLinks];
                                    newLinks[index].url = e.target.value;
                                    setBannerFormData({ ...bannerFormData, partialLinks: newLinks });
                                  }}
                                  placeholder="https://example.com"
                                  className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  Link Color
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={link.color || "#0000EE"}
                                    onChange={(e) => {
                                      const newLinks = [...bannerFormData.partialLinks];
                                      newLinks[index].color = e.target.value;
                                      setBannerFormData({ ...bannerFormData, partialLinks: newLinks });
                                    }}
                                    className="w-12 h-8 border border-slate-300 dark:border-slate-600 rounded cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={link.color || "#0000EE"}
                                    onChange={(e) => {
                                      const newLinks = [...bannerFormData.partialLinks];
                                      newLinks[index].color = e.target.value;
                                      setBannerFormData({ ...bannerFormData, partialLinks: newLinks });
                                    }}
                                    placeholder="#0000EE"
                                    className="flex-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newLinks = bannerFormData.partialLinks.filter((_, i) => i !== index);
                                  setBannerFormData({ ...bannerFormData, partialLinks: newLinks });
                                }}
                                className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setBannerFormData({
                              ...bannerFormData,
                              partialLinks: [...bannerFormData.partialLinks, { text: "", url: "", color: "#0000EE" }],
                            });
                          }}
                          className="w-full px-3 py-1.5 text-xs font-medium bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
                        >
                          + Add Partial Link
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Add links for specific words or phrases in your banner text. The text must exactly match part of your banner text.
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={bannerFormData.isActive}
                          onChange={(e) => setBannerFormData({ ...bannerFormData, isActive: e.target.checked })}
                          className="rounded border-slate-300 dark:border-slate-600"
                        />
                        Active (visible on site)
                      </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      {editingBanner && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBanner(null);
                            setBannerFormData({
                              text: "",
                              textColor: "#000000",
                              backgroundColor: "#ffffff",
                              hasBackground: true,
                              fontSize: 16,
                              animationDuration: 20,
                              linkUrl: "",
                              position: "top",
                              isActive: true,
                            });
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-medium bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
                      >
                        {editingBanner ? "Update" : "Add"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {banners.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                  No banners created
                </div>
              ) : (
                <div className="space-y-3">
                  {banners.map((banner) => (
                    <div
                      key={banner.id}
                      className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-md border border-slate-200 dark:border-slate-600"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              banner.is_active
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                            }`}>
                              {banner.is_active ? "Active" : "Inactive"}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {banner.position === "top" ? "Top" : "Bottom"}
                            </span>
                          </div>
                          <div
                            className="text-sm text-slate-800 dark:text-slate-200 mb-2"
                            style={{
                              color: banner.text_color,
                              fontSize: `${banner.font_size}px`,
                            }}
                          >
                            {banner.text}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                            <div>Font: {banner.font_size}px | Duration: {banner.animation_duration}s</div>
                            {banner.link_url && (
                              <div>Link: <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{banner.link_url}</a></div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-3">
                          <button
                            onClick={() => handleToggleBannerActive(banner.id, banner.is_active)}
                            className={`px-2 py-1 text-xs font-medium rounded hover:opacity-80 transition-colors ${
                              banner.is_active
                                ? "bg-yellow-500 text-white"
                                : "bg-green-500 text-white"
                            }`}
                            title={banner.is_active ? "Disable" : "Enable"}
                          >
                            {banner.is_active ? "Disable" : "Enable"}
                          </button>
                          <button
                            onClick={() => {
                              setEditingBanner(banner);
                              setShowAddBannerForm(false);
                              setBannerFormData({
                                text: banner.text,
                                textColor: banner.text_color,
                                backgroundColor: banner.background_color || "#ffffff",
                                hasBackground: banner.has_background,
                                fontSize: banner.font_size,
                                animationDuration: banner.animation_duration,
                                linkUrl: banner.link_url || "",
                                partialLinks: banner.partial_links ? (Array.isArray(banner.partial_links) ? banner.partial_links : JSON.parse(banner.partial_links as any)) : [],
                                position: banner.position,
                                isActive: banner.is_active,
                              });
                            }}
                            className="px-2 py-1 text-xs font-medium bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(banner.id)}
                            className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notification Toast */}
        {showNotification && (
          <div
            className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg text-sm font-medium transform transition-all duration-300 ${
              notificationType === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{notificationType === "success" ? "✓" : "✕"}</span>
              <span>{notificationMessage}</span>
              <button
                onClick={() => setShowNotification(false)}
                className="ml-2 hover:opacity-80"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
