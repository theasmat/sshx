import { useState, useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { HostsView } from "./views/HostsView";
import { AddHostView } from "./views/AddHostView";
import { KeyManagementView } from "./views/KeyManagementView";
import { KnownHostsView } from "./views/KnownHostsView";
import { SecurityAuditView } from "./views/SecurityAuditView";
import { RawConfigView } from "./views/RawConfigView";
import { TestResultModal } from "./components/TestResultModal";
import {
  SshConfigFileData,
  SshHost,
  SshKeyInfo,
  TerminalAppInfo,
  KnownHostEntry,
  SecurityAuditReport,
  SshTestResult,
  NavTab,
} from "./types";
import { api } from "./api";

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("hosts");
  const [configData, setConfigData] = useState<SshConfigFileData | null>(null);
  const [keys, setKeys] = useState<SshKeyInfo[]>([]);
  const [terminals, setTerminals] = useState<TerminalAppInfo[]>([]);
  const [knownHosts, setKnownHosts] = useState<KnownHostEntry[]>([]);
  const [auditReport, setAuditReport] = useState<SecurityAuditReport | null>(null);
  const [selectedTerminal, setSelectedTerminal] = useState<string>("ghostty");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingHost, setEditingHost] = useState<SshHost | null>(null);

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
        const matchGroup = (h.group || "").toLowerCase().includes(q);
        const matchTags = h.tags.some((t) => t.toLowerCase().includes(q));
        return matchAlias || matchHostName || matchUser || matchGroup || matchTags;
      }
      return true;
    });
  }, [configData, activeGroup, activeTag, searchQuery]);

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

      // Shortcut: Cmd+K -> Focus Search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }

      // Shortcut: Cmd+R -> Reload
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        loadAllData();
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
    let cmd = "ssh";
    if (host.port && host.port !== 22) cmd += ` -p ${host.port}`;
    if (host.identity_file) cmd += ` -i ${host.identity_file}`;
    if (host.user && host.host_name) {
      cmd += ` ${host.user}@${host.host_name}`;
    } else if (host.host_name) {
      cmd += ` ${host.host_name}`;
    } else {
      cmd += ` ${host.host_pattern}`;
    }

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

  // Delete Host
  const handleDeleteHost = async (host: SshHost) => {
    if (!confirm(`Are you sure you want to delete host "${host.host_pattern}"?`)) {
      return;
    }
    try {
      await api.deleteHost(host.id);
      await loadAllData();
      setActiveTab("hosts");
    } catch (err: any) {
      alert(`Failed to delete host: ${err}`);
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070a10] text-gray-200 font-sans select-none antialiased">
      {/* Top Universal Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={loadAllData}
        isLoading={isLoading}
        auditScore={auditReport?.score}
        onSelectTab={setActiveTab}
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
        {/* Left Side Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === "add-host") {
              setEditingHost(null);
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
                setActiveTab("add-host");
              }}
              copiedId={copiedId}
              terminalName={activeTerminalName}
            />
          )}

          {activeTab === "add-host" && (
            <AddHostView
              initialHost={editingHost}
              existingKeys={keys}
              existingHosts={configData?.hosts || []}
              onSave={handleSaveHost}
              onCancel={() => {
                setEditingHost(null);
                setActiveTab("hosts");
              }}
              onRefreshKeys={loadAllData}
            />
          )}

          {activeTab === "keys" && (
            <KeyManagementView
              keys={keys}
              onRefresh={loadAllData}
              isLoading={isLoading}
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
    </div>
  );
}
export default App;
