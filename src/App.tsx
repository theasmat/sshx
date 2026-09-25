import { useState, useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { HostsView } from "./views/HostsView";
import { AddHostView } from "./views/AddHostView";
import { KeyManagementView } from "./views/KeyManagementView";
import { KnownHostsView } from "./views/KnownHostsView";
import { SecurityAuditView } from "./views/SecurityAuditView";
import { RawConfigView } from "./views/RawConfigView";
import { SettingsView } from "./views/SettingsView";
import { TestResultModal } from "./components/TestResultModal";
import { DeleteHostConfirmationModal } from "./components/DeleteHostConfirmationModal";
import {
  SshConfigFileData,
  SshHost,
  SshKeyInfo,
  TerminalAppInfo,
  KnownHostEntry,
  SecurityAuditReport,
  SshTestResult,
  NavTab,
  PresetTemplate,
} from "./types";
import { api } from "./api";
import { getAllPresets } from "./presets";
import {
  buildSearchIndex,
  executeSearch,
  SearchItem,
} from "./utils/searchEngine";

interface AppProps {
  embedded?: boolean;
  className?: string;
}

export function App({ embedded = false, className = "" }: AppProps = {}) {
  const [activeTab, setActiveTab] = useState<NavTab>("hosts");
  const [configData, setConfigData] = useState<SshConfigFileData | null>(null);
  const [keys, setKeys] = useState<SshKeyInfo[]>([]);
  const [terminals, setTerminals] = useState<TerminalAppInfo[]>([]);
  const [knownHosts, setKnownHosts] = useState<KnownHostEntry[]>([]);
  const [auditReport, setAuditReport] = useState<SecurityAuditReport | null>(null);
  const [selectedTerminal, setSelectedTerminal] = useState<string>("ghostty");

  // Dynamic AddHost parameters from search / presets
  const [addHostInitialPreset, setAddHostInitialPreset] = useState<PresetTemplate | null>(null);
  const [addHostInitialScreen, setAddHostInitialScreen] = useState<"hub" | "interactive" | "fast" | "presets">("hub");

  // Dynamic Key parameters from search
  const [keyInitialCreateModalOpen, setKeyInitialCreateModalOpen] = useState(false);
  const [keyInitialSelectedPath, setKeyInitialSelectedPath] = useState<string | null>(null);

  // Dynamic Settings parameters from search
  const [settingsInitialOpenExport, setSettingsInitialOpenExport] = useState(false);
  const [settingsInitialOpenRestore, setSettingsInitialOpenRestore] = useState(false);

  // Zoom state (70% - 150%)
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    const saved = localStorage.getItem("sshx_zoom_level");
    return saved ? parseInt(saved, 10) : 100;
  });

  useEffect(() => {
    if (!embedded) {
      (document.documentElement.style as any).zoom = `${zoomLevel}%`;
      localStorage.setItem("sshx_zoom_level", zoomLevel.toString());
    }
  }, [zoomLevel, embedded]);

  // Collapsible sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("sshx_sidebar_collapsed") === "true";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingHost, setEditingHost] = useState<SshHost | null>(null);

  // Delete Host Modal State
  const [isDeleteHostModalOpen, setIsDeleteHostModalOpen] = useState(false);
  const [hostToDelete, setHostToDelete] = useState<SshHost | null>(null);

  // Toggle sidebar collapse
  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sshx_sidebar_collapsed", next ? "true" : "false");
      return next;
    });
  };

  // Transient Test Modal state
  const [testModalState, setTestModalState] = useState<{
    isOpen: boolean;
    hostAlias: string;
    result: SshTestResult | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    hostAlias: "",
    result: null,
    isLoading: false,
  });

  const loadAllData = async () => {
    setIsLoading(true);
    setErrorBanner(null);
    try {
      const [cfg, kList, termList, khList, audit] = await Promise.all([
        api.getSshConfig(),
        api.getSshKeys(),
        api.getDetectedTerminals(),
        api.getKnownHosts(),
        api.auditSecurity(),
      ]);

      setConfigData(cfg);
      setKeys(kList);
      setTerminals(termList);
      setKnownHosts(khList);
      setAuditReport(audit);

      const firstInstalled = termList.find((t) => t.is_installed);
      if (firstInstalled && !selectedTerminal) {
        setSelectedTerminal(firstInstalled.id);
      } else if (
        firstInstalled &&
        selectedTerminal === "ghostty" &&
        !termList.find((t) => t.id === "ghostty" && t.is_installed)
      ) {
        setSelectedTerminal(firstInstalled.id);
      }

      if (cfg.hosts.length > 0 && !selectedHostId) {
        setSelectedHostId(cfg.hosts[0].id);
      }
    } catch (err: any) {
      setErrorBanner(`Failed to load SSH configuration: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Compute unique groups and tags
  const { groups, tags } = useMemo(() => {
    const groupMap = new Map<string, number>();
    const tagMap = new Map<string, number>();

    if (configData) {
      for (const h of configData.hosts) {
        if (h.group) {
          groupMap.set(h.group, (groupMap.get(h.group) || 0) + 1);
        }
        for (const t of h.tags) {
          tagMap.set(t, (tagMap.get(t) || 0) + 1);
        }
      }
    }

    return {
      groups: Array.from(groupMap.entries()).map(([name, count]) => ({
        name,
        count,
      })),
      tags: Array.from(tagMap.entries()).map(([name, count]) => ({
        name,
        count,
      })),
    };
  }, [configData]);

  // Filter hosts by search, group, and tag
  const filteredHosts = useMemo(() => {
    if (!configData) return [];
    return configData.hosts.filter((h) => {
      if (activeGroup && h.group !== activeGroup) return false;
      if (activeTag && !h.tags.includes(activeTag)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchAlias = h.host_pattern.toLowerCase().includes(q);
        const matchHostName = (h.host_name || "").toLowerCase().includes(q);
        const matchUser = (h.user || "").toLowerCase().includes(q);
        const matchPort = h.port ? h.port.toString().includes(q) : false;
        const matchGroup = (h.group || "").toLowerCase().includes(q);
        const matchTags = h.tags.some((t) => t.toLowerCase().includes(q));
        const matchNotes = (h.notes || "").toLowerCase().includes(q);
        const matchKey = (h.identity_file || "").toLowerCase().includes(q);
        const matchProxy = (h.proxy_jump || "").toLowerCase().includes(q);
        const matchForward = h.local_forward.some((f) => f.toLowerCase().includes(q));

        return (
          matchAlias ||
          matchHostName ||
          matchUser ||
          matchPort ||
          matchGroup ||
          matchTags ||
          matchNotes ||
          matchKey ||
          matchProxy ||
          matchForward
        );
      }
      return true;
    });
  }, [configData, activeGroup, activeTag, searchQuery]);

  // Dynamic Omnibox Search Index
  const allPresets = useMemo(() => getAllPresets(), []);

  const searchIndex = useMemo(() => {
    return buildSearchIndex({
      presets: allPresets,
      hosts: configData?.hosts || [],
      keys,
      knownHosts,
    });
  }, [allPresets, configData, keys, knownHosts]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return executeSearch(searchQuery, searchIndex, 8).results;
  }, [searchQuery, searchIndex]);

  const handleSelectSearchItem = (item: SearchItem) => {
    switch (item.handler.type) {
      case "NAVIGATE_TAB":
        if (item.handler.tab) {
          setActiveTab(item.handler.tab);
        }
        break;

      case "NAVIGATE_ADD_HOST":
        setEditingHost(null);
        setAddHostInitialPreset(null);
        setAddHostInitialScreen(item.handler.addHostScreen || "hub");
        setActiveTab("add-host");
        break;

      case "APPLY_PRESET":
        setEditingHost(null);
        setAddHostInitialPreset(item.handler.preset || null);
        setAddHostInitialScreen("interactive");
        setActiveTab("add-host");
        break;

      case "SELECT_HOST":
        if (item.handler.hostId) {
          setSelectedHostId(item.handler.hostId);
          setActiveTab("hosts");
        }
        break;

      case "SELECT_KEY":
        if (item.handler.keyPath) {
          setKeyInitialSelectedPath(item.handler.keyPath);
          setActiveTab("keys");
        }
        break;

      case "TRIGGER_ACTION":
        switch (item.handler.actionName) {
          case "open_key_modal":
            setKeyInitialCreateModalOpen(true);
            setActiveTab("keys");
            break;
          case "open_export_backup":
            setSettingsInitialOpenExport(true);
            setActiveTab("settings");
            break;
          case "open_restore_backup":
            setSettingsInitialOpenRestore(true);
            setActiveTab("settings");
            break;
          case "reload_config":
            loadAllData();
            break;
          case "zoom_in":
            setZoomLevel((prev) => Math.min(prev + 10, 150));
            break;
          case "zoom_out":
            setZoomLevel((prev) => Math.max(prev - 10, 70));
            break;
          case "zoom_reset":
            setZoomLevel(100);
            break;
        }
        break;
    }
  };

  // Selected Host
  const selectedHost = useMemo(() => {
    if (!configData) return null;
    return (
      filteredHosts.find((h) => h.id === selectedHostId) ||
      filteredHosts[0] ||
      null
    );
  }, [filteredHosts, selectedHostId, configData]);

  // Keyboard navigation for host list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Cmd+K, Cmd+N, Cmd+R, Cmd+-, Cmd+= everywhere
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("global-sshx-search-input") as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (activeTab === "hosts" && filteredHosts.length > 0) {
        const currentIndex = filteredHosts.findIndex(
          (h) => h.id === selectedHost?.id
        );

        if (e.key === "ArrowDown") {
          e.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, filteredHosts.length - 1);
          setSelectedHostId(filteredHosts[nextIndex].id);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const prevIndex = Math.max(currentIndex - 1, 0);
          setSelectedHostId(filteredHosts[prevIndex].id);
        } else if (e.key === "Enter" && selectedHost) {
          e.preventDefault();
          handleConnect(selectedHost);
        }
      }

      // Shortcut: Cmd+N -> Add Host
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setEditingHost(null);
        setActiveTab("add-host");
      }

      // Shortcut: Cmd+R -> Reload
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        loadAllData();
      }

      // Shortcut: Cmd + / Cmd = -> Zoom In
      if ((e.metaKey || e.ctrlKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setZoomLevel((prev) => Math.min(prev + 10, 150));
      }

      // Shortcut: Cmd - / Cmd _ -> Zoom Out
      if ((e.metaKey || e.ctrlKey) && (e.key === "-" || e.key === "_")) {
        e.preventDefault();
        setZoomLevel((prev) => Math.max(prev - 10, 70));
      }

      // Shortcut: Cmd 0 -> Reset Zoom to 100%
      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        e.preventDefault();
        setZoomLevel(100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, filteredHosts, selectedHost]);

  // Connect in Terminal
  const handleConnect = async (host: SshHost) => {
    try {
      await api.launchTerminal(host.host_pattern, selectedTerminal);
    } catch (err: any) {
      alert(`Failed to launch terminal: ${err}`);
    }
  };

  // Copy SSH Command
  const handleCopyCmd = (host: SshHost) => {
    const cmd = `ssh ${host.host_pattern}`;
    navigator.clipboard.writeText(cmd);
    setCopiedId(host.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Test Connection
  const handleTestConnection = async (host: SshHost) => {
    setTestModalState({
      isOpen: true,
      hostAlias: host.host_pattern,
      result: null,
      isLoading: true,
    });

    try {
      const res = await api.testHost(host.host_pattern);
      setTestModalState((prev) => ({
        ...prev,
        result: res,
        isLoading: false,
      }));
    } catch (err: any) {
      setTestModalState((prev) => ({
        ...prev,
        result: {
          success: false,
          output: `Test failed: ${err}`,
          duration_ms: 0,
        },
        isLoading: false,
      }));
    }
  };

  // Edit Host
  const handleOpenEditHost = (host: SshHost) => {
    setEditingHost(host);
    setActiveTab("add-host");
  };

  // Duplicate Host
  const handleDuplicateHost = async (host: SshHost) => {
    const duplicated: SshHost = {
      ...host,
      id: `host_${Date.now()}`,
      host_pattern: `${host.host_pattern}-copy`,
      notes: host.notes ? `Copy of ${host.host_pattern}: ${host.notes}` : `Copy of ${host.host_pattern}`,
    };
    try {
      await api.saveHost(duplicated);
      await loadAllData();
      setSelectedHostId(duplicated.id);
      setActiveTab("hosts");
    } catch (err: any) {
      alert(`Failed to duplicate host: ${err}`);
    }
  };

  // Delete Host Action - Opens confirmation modal
  const handleDeleteHost = (host: SshHost) => {
    setHostToDelete(host);
    setIsDeleteHostModalOpen(true);
  };

  // Confirmed Host Deletion Handler
  const handleConfirmDeleteHost = async (host: SshHost) => {
    try {
      await api.deleteHost(host.id, host.host_pattern);
      await loadAllData();
      if (selectedHostId === host.id) {
        setSelectedHostId(null);
      }
      setActiveTab("hosts");
    } catch (err: any) {
      alert(`Failed to delete host: ${err}`);
      throw err;
    }
  };

  // Save Host from AddHostView
  const handleSaveHost = async (hostToSave: SshHost) => {
    try {
      await api.saveHost(hostToSave);
      await loadAllData();
      setSelectedHostId(hostToSave.id);
      setEditingHost(null);
      setActiveTab("hosts");
    } catch (err: any) {
      alert(`Failed to save host: ${err}`);
    }
  };

  const activeTerminalName =
    terminals.find((t) => t.id === selectedTerminal)?.name || "Terminal.app";

  return (
    <div
      className={`flex flex-col overflow-hidden bg-[#070a10] text-gray-200 font-sans select-none antialiased ${
        embedded ? "w-full h-full min-h-[580px]" : "h-screen w-screen"
      } ${className}`}
    >
      {/* Top Universal Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={loadAllData}
        isLoading={isLoading}
        auditScore={auditReport?.score}
        onSelectTab={setActiveTab}
        searchResults={searchResults}
        onSelectSearchItem={handleSelectSearchItem}
      />

      {/* Error Alert Banner */}
      {errorBanner && (
        <div className="bg-rose-500/10 border-b border-rose-500/30 px-4 py-2 text-xs text-rose-300 flex items-center justify-between">
          <span>{errorBanner}</span>
          <button
            onClick={() => setErrorBanner(null)}
            className="hover:text-rose-100 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main App Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side Navigation (Collapsible) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === "add-host") {
              setEditingHost(null);
              setAddHostInitialPreset(null);
              setAddHostInitialScreen("hub");
            }
            setActiveTab(tab);
          }}
          totalHosts={configData?.hosts.length ?? 0}
          totalKeys={keys.length}
          totalKnownHosts={knownHosts.length}
          auditScore={auditReport?.score ?? 100}
          groups={groups}
          tags={tags}
          activeGroup={activeGroup}
          activeTag={activeTag}
          onSelectGroup={setActiveGroup}
          onSelectTag={setActiveTag}
          terminals={terminals}
          selectedTerminal={selectedTerminal}
          onSelectTerminal={setSelectedTerminal}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebarCollapse}
        />

        {/* Center / Main Content View (Dedicated In-Page Tabs) */}
        <main className="flex-1 overflow-hidden bg-[#070a10]">
          {activeTab === "hosts" && (
            <HostsView
              hosts={filteredHosts}
              selectedHost={selectedHost}
              onSelectHost={(h) => setSelectedHostId(h.id)}
              onConnect={handleConnect}
              onCopyCmd={handleCopyCmd}
              onTest={handleTestConnection}
              onEdit={handleOpenEditHost}
              onDuplicate={handleDuplicateHost}
              onDelete={handleDeleteHost}
              onOpenAddHost={() => {
                setEditingHost(null);
                setAddHostInitialPreset(null);
                setAddHostInitialScreen("hub");
                setActiveTab("add-host");
              }}
              copiedId={copiedId}
              terminalName={activeTerminalName}
              keys={keys}
              onOpenRawConfig={() => setActiveTab("raw-config")}
            />
          )}

          {activeTab === "add-host" && (
            <AddHostView
              initialHost={editingHost}
              initialPreset={addHostInitialPreset}
              initialScreen={addHostInitialScreen}
              existingKeys={keys}
              existingHosts={configData?.hosts || []}
              onSave={handleSaveHost}
              onCancel={() => {
                setEditingHost(null);
                setAddHostInitialPreset(null);
                setActiveTab("hosts");
              }}
              onRefreshKeys={loadAllData}
              onConnect={handleConnect}
              onOpenRawConfig={() => setActiveTab("raw-config")}
            />
          )}

          {activeTab === "keys" && (
            <KeyManagementView
              keys={keys}
              hosts={configData?.hosts || []}
              onRefresh={loadAllData}
              isLoading={isLoading}
              initialCreateModalOpen={keyInitialCreateModalOpen}
              initialSelectedKeyPath={keyInitialSelectedPath}
            />
          )}

          {activeTab === "known-hosts" && (
            <KnownHostsView
              entries={knownHosts}
              onRefresh={loadAllData}
              isLoading={isLoading}
            />
          )}

          {activeTab === "audit" && (
            <SecurityAuditView
              report={auditReport}
              onRefresh={loadAllData}
              isLoading={isLoading}
              onSelectTab={setActiveTab}
              onOpenAddHost={() => {
                setEditingHost(null);
                setAddHostInitialPreset(null);
                setAddHostInitialScreen("hub");
                setActiveTab("add-host");
              }}
            />
          )}

          {activeTab === "raw-config" && (
            <RawConfigView
              initialContent={configData?.raw_content || ""}
              filePath={configData?.file_path || "~/.ssh/config"}
              onSaved={loadAllData}
              isLoading={isLoading}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              terminals={terminals}
              selectedTerminal={selectedTerminal}
              onSelectTerminal={setSelectedTerminal}
              onOpenRawBackups={() => setActiveTab("raw-config")}
              zoomLevel={zoomLevel}
              onSetZoom={setZoomLevel}
              configData={configData}
              knownHostsCount={knownHosts.length}
              onRefreshAll={loadAllData}
              initialOpenExportModal={settingsInitialOpenExport}
              initialOpenRestoreModal={settingsInitialOpenRestore}
            />
          )}
        </main>
      </div>

      {/* Transient Test Output Modal */}
      <TestResultModal
        isOpen={testModalState.isOpen}
        onClose={() =>
          setTestModalState((prev) => ({ ...prev, isOpen: false }))
        }
        hostAlias={testModalState.hostAlias}
        result={testModalState.result}
        isLoading={testModalState.isLoading}
      />

      {/* Host Deletion Impact & Confirmation Modal */}
      <DeleteHostConfirmationModal
        isOpen={isDeleteHostModalOpen}
        onClose={() => {
          setIsDeleteHostModalOpen(false);
          setHostToDelete(null);
        }}
        host={hostToDelete}
        keys={keys}
        onConfirmDelete={handleConfirmDeleteHost}
      />
    </div>
  );
}
export default App;
