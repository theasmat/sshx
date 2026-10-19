import { askConfirm } from "../utils/confirm";
import { toast } from "../utils/toast";
import { Badge, Button, Dialog, Group, Row, Segmented, Switch } from "../components/ui";
import React, { useState, useEffect, useRef } from "react";
import {
  BsTerminalFill,
  BsCheckLg,
  BsCheckCircleFill,
  BsShieldLock,
  BsDownload,
  BsUpload,
  BsEye,
  BsEyeSlash,
  BsExclamationCircleFill,
  BsArrowRepeat,
  BsArrowClockwise,
  BsArchive,
} from "react-icons/bs";
import { check, Update } from "@tauri-apps/plugin-updater";
import { BrandLogo } from "../components/BrandLogo";
import { SshxLogo } from "../components/SshxLogo";
import { TerminalAppInfo, SshConfigFileData, SshxBackupInfo } from "../types";
import {
  createEncryptedSshxBackup,
  decryptSshxBackup,
  downloadSshxFile,
  SshxBackupPayload,
} from "../utils/backupCrypto";
import { loadCustomPresets } from "../presets";
import { api } from "../api";

const dialogField =
  "w-full h-8 px-2.5 rounded-ctl bg-white/[0.06] text-label placeholder-label-3 focus:outline-none focus:bg-white/[0.09] focus:ring-2 focus:ring-accent/70";

const Setting: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="flex items-center justify-between gap-4 px-4 py-3">
    <div className="min-w-0">
      <div className="text-label">{label}</div>
      {hint && <div className="text-xs text-label-3">{hint}</div>}
    </div>
    <div className="shrink-0 flex items-center gap-2">{children}</div>
  </div>
);

interface SettingsViewProps {
  terminals: TerminalAppInfo[];
  selectedTerminal: string;
  onSelectTerminal: (termId: string) => void;
  onOpenRawBackups: () => void;
  zoomLevel: number;
  onSetZoom: (zoom: number | ((prev: number) => number)) => void;
  configData: SshConfigFileData | null;
  knownHostsCount: number;
  onRefreshAll: () => void;
  initialOpenExportModal?: boolean;
  initialOpenRestoreModal?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  terminals,
  selectedTerminal,
  onSelectTerminal,
  onOpenRawBackups,
  zoomLevel,
  onSetZoom,
  configData,
  knownHostsCount,
  onRefreshAll,
  initialOpenExportModal = false,
  initialOpenRestoreModal = false,
}) => {
  // Key defaults
  const [defaultAlgo, setDefaultAlgo] = useState<"ed25519" | "rsa" | "ecdsa">(
    () => {
      return (
        (localStorage.getItem("sshx_default_algo") as
          | "ed25519"
          | "rsa"
          | "ecdsa") || "ed25519"
      );
    }
  );

  // Backup toggle
  const [autoBackup, setAutoBackup] = useState<boolean>(() => {
    return localStorage.getItem("sshx_auto_backup") !== "false";
  });

  // Privacy mask toggle
  const [privacyMask, setPrivacyMask] = useState<boolean>(() => {
    return localStorage.getItem("sshx_privacy_mask") !== "false";
  });

  // Default port
  const [defaultPort, setDefaultPort] = useState<number>(() => {
    const saved = localStorage.getItem("sshx_default_port");
    return saved ? parseInt(saved, 10) : 22;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(initialOpenExportModal);
  const [exportPassword, setExportPassword] = useState("");
  const [exportConfirmPass, setExportConfirmPass] = useState("");
  const [showExportPass, setShowExportPass] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Restore Modal State
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(initialOpenRestoreModal);
  const [restoreFileContent, setRestoreFileContent] = useState<string | null>(null);
  const [restoreFileName, setRestoreFileName] = useState<string>("");
  const [restorePassword, setRestorePassword] = useState("");
  const [showRestorePass, setShowRestorePass] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [decryptedPreview, setDecryptedPreview] = useState<SshxBackupPayload | null>(null);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);

  // Device Snapshot State (~/.ssh/config.sshx.bak)
  const [deviceSnapshot, setDeviceSnapshot] = useState<SshxBackupInfo | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [isLocalSnapshotsModalOpen, setIsLocalSnapshotsModalOpen] = useState(false);
  const [allSnapshots, setAllSnapshots] = useState<SshxBackupInfo[]>([]);
  const [isLoadingAllSnapshots, setIsLoadingAllSnapshots] = useState(false);
  const [restoringSnapshotName, setRestoringSnapshotName] = useState<string | null>(null);
  const [snapshotSuccessMsg, setSnapshotSuccessMsg] = useState<string | null>(null);
  const [snapshotPreview, setSnapshotPreview] = useState<{ name: string; content: string } | null>(null);
  const [isLoadingSnapshotPreview, setIsLoadingSnapshotPreview] = useState(false);

  const loadDeviceSnapshot = async () => {
    setIsLoadingSnapshot(true);
    try {
      const snap = await api.getDeviceSnapshotInfo();
      setDeviceSnapshot(snap);
    } catch (e) {
      console.warn("Failed to load device snapshot:", e);
    } finally {
      setIsLoadingSnapshot(false);
    }
  };

  const loadAllSnapshots = async () => {
    setIsLoadingAllSnapshots(true);
    try {
      const list = await api.listBackups();
      setAllSnapshots(list);
    } catch (e) {
      console.warn("Failed to load snapshots list:", e);
    } finally {
      setIsLoadingAllSnapshots(false);
    }
  };

  useEffect(() => {
    loadDeviceSnapshot();
  }, [configData]);

  const handleOpenSnapshotsModal = () => {
    loadAllSnapshots();
    setIsLocalSnapshotsModalOpen(true);
  };

  const handlePreviewSnapshot = async (name: string) => {
    setIsLoadingSnapshotPreview(true);
    try {
      const content = await api.readBackupPreview(name);
      setSnapshotPreview({ name, content });
    } catch (e: any) {
      toast.error(`Failed to load snapshot preview: ${e}`);
    } finally {
      setIsLoadingSnapshotPreview(false);
    }
  };

  const handleRestoreDeviceSnapshot = async (snapshotName?: string) => {
    const target = snapshotName || "config.sshx.bak";
    const ok = await askConfirm({
      title: "Restore snapshot?",
      message: `Restore '${target}'?\nThis will revert your current ~/.ssh/config to this snapshot.`,
      confirmLabel: "Restore",
      danger: true,
    });
    if (!ok) return;

    setRestoringSnapshotName(target);
    try {
      await api.restoreBackup(target);
      setSnapshotSuccessMsg(`Successfully restored '${target}'!`);
      setTimeout(() => setSnapshotSuccessMsg(null), 4000);
      onRefreshAll();
      loadDeviceSnapshot();
      if (isLocalSnapshotsModalOpen) {
        loadAllSnapshots();
      }
      setSnapshotPreview(null);
    } catch (e: any) {
      toast.error(`Failed to restore snapshot: ${e}`);
    } finally {
      setRestoringSnapshotName(null);
    }
  };

  const formatSnapshotTime = (ts: number) => {
    if (!ts) return "";
    const d = new Date(ts * 1000);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatSnapshotSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveAlgo = (algo: "ed25519" | "rsa" | "ecdsa") => {
    setDefaultAlgo(algo);
    localStorage.setItem("sshx_default_algo", algo);
    triggerSaveToast();
  };

  const handleToggleAutoBackup = (val: boolean) => {
    setAutoBackup(val);
    localStorage.setItem("sshx_auto_backup", val ? "true" : "false");
    triggerSaveToast();
  };

  const handleTogglePrivacyMask = (val: boolean) => {
    setPrivacyMask(val);
    localStorage.setItem("sshx_privacy_mask", val ? "true" : "false");
    triggerSaveToast();
  };

  const handlePortChange = (port: number) => {
    setDefaultPort(port);
    localStorage.setItem("sshx_default_port", port.toString());
    triggerSaveToast();
  };

  const triggerSaveToast = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  // Auto-Updater State
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "checking" | "up-to-date" | "available" | "downloading" | "ready" | "error"
  >("idle");
  const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const handleCheckForUpdates = async () => {
    setUpdateStatus("checking");
    setUpdateError(null);
    try {
      const update = await check();
      if (update) {
        setAvailableUpdate(update);
        setUpdateStatus("available");
      } else {
        setAvailableUpdate(null);
        setUpdateStatus("up-to-date");
      }
    } catch (err: any) {
      console.warn("Update check:", err);
      setUpdateError(err?.message || String(err));
      setUpdateStatus("error");
    }
  };

  const handleInstallUpdate = async () => {
    if (!availableUpdate) return;
    setUpdateStatus("downloading");
    setDownloadProgress(0);
    try {
      let downloaded = 0;
      let total = 0;
      await availableUpdate.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength || 0;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          if (total > 0) {
            setDownloadProgress(Math.round((downloaded / total) * 100));
          }
        } else if (event.event === "Finished") {
          setDownloadProgress(100);
          setUpdateStatus("ready");
        }
      });
      setUpdateStatus("ready");
    } catch (err: any) {
      setUpdateError(`Update install failed: ${err.message || err}`);
      setUpdateStatus("error");
    }
  };

  // Handle Export .sshx
  const handleStartExport = () => {
    setExportPassword("");
    setExportConfirmPass("");
    setExportError(null);
    setShowExportPass(false);
    setIsExportModalOpen(true);
  };

  const handlePerformExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportPassword) {
      setExportError("A secure password is required to encrypt your backup.");
      return;
    }
    if (exportPassword !== exportConfirmPass) {
      setExportError("Passwords do not match. Please re-enter.");
      return;
    }
    if (exportPassword.length < 4) {
      setExportError("Password should be at least 4 characters.");
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const knownHostsRaw = await api.getKnownHostsRaw().catch(() => "");
      const customPresets = loadCustomPresets();

      const payload: SshxBackupPayload = {
        magic: "SSHX_ENCRYPTED_BACKUP_V1",
        version: "0.1.0",
        createdAt: new Date().toISOString(),
        configContent: configData?.raw_content || "",
        knownHostsContent: knownHostsRaw || "",
        customPresets,
        metadata: {
          hostsCount: configData?.hosts.length || 0,
          knownHostsCount,
          exportedBy: "SSHX Desktop",
        },
      };

      const encryptedData = await createEncryptedSshxBackup(payload, exportPassword);
      const dateStr = new Date().toISOString().split("T")[0];
      downloadSshxFile(encryptedData, `sshx_backup_${dateStr}.sshx`);

      setIsExportModalOpen(false);
      triggerSaveToast();
    } catch (err: any) {
      setExportError(`Export failed: ${err.message || err}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Select .sshx File for Restore
  const handleSelectFileToRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFileName(file.name);
    setRestorePassword("");
    setRestoreError(null);
    setDecryptedPreview(null);
    setRestoreSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRestoreFileContent(content);
      setIsRestoreModalOpen(true);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle Decrypt & Verify .sshx
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFileContent || !restorePassword) {
      setRestoreError("Please enter the password used to encrypt this backup.");
      return;
    }

    setIsRestoring(true);
    setRestoreError(null);

    try {
      const payload = await decryptSshxBackup(restoreFileContent, restorePassword);
      setDecryptedPreview(payload);
    } catch (err: any) {
      setRestoreError(err.message || "Decryption failed. Incorrect password.");
    } finally {
      setIsRestoring(false);
    }
  };

  // Perform Final Restore
  const handleExecuteRestore = async () => {
    if (!decryptedPreview) return;
    setIsRestoring(true);
    setRestoreError(null);

    try {
      // 1. Write raw SSH config (Rust backend automatically creates timestamped snapshot before write)
      if (decryptedPreview.configContent) {
        await api.saveSshConfigRaw(decryptedPreview.configContent);
      }

      // 2. Write raw known_hosts
      if (decryptedPreview.knownHostsContent) {
        await api.saveKnownHostsRaw(decryptedPreview.knownHostsContent);
      }

      // 3. Restore custom presets if present
      if (decryptedPreview.customPresets && Array.isArray(decryptedPreview.customPresets)) {
        localStorage.setItem(
          "sshx_custom_presets_v2",
          JSON.stringify(decryptedPreview.customPresets)
        );
      }

      setRestoreSuccessMsg("Configuration restored successfully! Reloading data...");
      setTimeout(() => {
        onRefreshAll();
        setIsRestoreModalOpen(false);
        triggerSaveToast();
      }, 1200);
    } catch (err: any) {
      setRestoreError(`Restore execution failed: ${err.message || err}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const zoomPresets = [80, 90, 100, 110, 120, 130];

  return (
    <div className="h-full flex flex-col bg-app text-[13px] select-none overflow-hidden">
      <div className="px-5 h-12 flex items-center justify-between shrink-0">
        <h2 className="text-[15px] font-semibold text-label">Settings</h2>
        {savedSuccess && (
          <span role="status" className="flex items-center gap-1.5 text-emerald-300">
            <BsCheckCircleFill /> Saved
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Group title="Appearance">
            <Setting label="Interface zoom" hint="⌘+ / ⌘- / ⌘0">
              <Segmented
                label="Zoom level"
                value={zoomLevel}
                options={zoomPresets.map((l: number) => ({ value: l, label: `${l}%` }))}
                onChange={(l) => onSetZoom(l)}
              />
            </Setting>
          </Group>

          <Group title="Terminal">
            {terminals.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onSelectTerminal(t.id);
                  triggerSaveToast();
                }}
                aria-pressed={selectedTerminal === t.id}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/70"
              >
                <div className="w-7 h-7 rounded-ctl bg-control flex items-center justify-center shrink-0 text-label">
                  <BrandLogo
                    name={t.name}
                    className="w-4 h-4"
                    fallbackIcon={<BsTerminalFill className="w-3.5 h-3.5 text-label-2" />}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-label">{t.name}</div>
                  <div className="text-xs text-label-3">{t.is_installed ? "Installed" : "System default"}</div>
                </div>
                {selectedTerminal === t.id && <BsCheckLg className="text-accent shrink-0" />}
              </button>
            ))}
          </Group>

          <Group title="New keys and hosts">
            <Setting label="Default key algorithm" hint="Ed25519 is recommended">
              <Segmented
                label="Default algorithm"
                value={defaultAlgo}
                options={[
                  { value: "ed25519", label: "Ed25519" },
                  { value: "rsa", label: "RSA 4096" },
                  { value: "ecdsa", label: "ECDSA" },
                ]}
                onChange={(v) => handleSaveAlgo(v)}
              />
            </Setting>
            <Setting label="Default SSH port">
              <input
                type="number"
                aria-label="Default SSH port"
                value={defaultPort}
                onChange={(e) => handlePortChange(parseInt(e.target.value, 10) || 22)}
                className="w-24 h-8 px-2.5 rounded-ctl bg-white/[0.06] text-label font-mono text-right focus:outline-none focus:ring-2 focus:ring-accent/70"
              />
            </Setting>
          </Group>

          <Group title="Safety">
            <Setting label="Back up before changes" hint="Keeps a snapshot at ~/.ssh/config.sshx.bak">
              <Switch label="Back up before changes" checked={autoBackup} onChange={handleToggleAutoBackup} />
            </Setting>
            <Setting label="Hide fingerprints on screen" hint="Masks keys and fingerprints to prevent shoulder surfing">
              <Switch label="Hide fingerprints on screen" checked={privacyMask} onChange={handleTogglePrivacyMask} />
            </Setting>
            <Setting
              label="Device snapshot"
              hint={
                deviceSnapshot
                  ? `${formatSnapshotTime(deviceSnapshot.modified_timestamp)} · ${formatSnapshotSize(deviceSnapshot.size_bytes)}`
                  : "None yet; created on your first edit"
              }
            >
              {deviceSnapshot ? (
                <>
                  <button
                    type="button"
                    onClick={() => handlePreviewSnapshot("config.sshx.bak")}
                    disabled={isLoadingSnapshotPreview}
                    className="text-accent hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRestoreDeviceSnapshot("config.sshx.bak")}
                    disabled={restoringSnapshotName === "config.sshx.bak"}
                    className="text-accent hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {restoringSnapshotName === "config.sshx.bak" ? "Restoring..." : "Restore"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={loadDeviceSnapshot}
                  disabled={isLoadingSnapshot}
                  className="text-accent hover:underline cursor-pointer disabled:opacity-50"
                >
                  Refresh
                </button>
              )}
              <button type="button" onClick={handleOpenSnapshotsModal} className="text-accent hover:underline cursor-pointer">
                All snapshots
              </button>
            </Setting>
            {snapshotSuccessMsg && (
              <div role="status" className="px-4 py-2.5 text-emerald-300 flex items-center gap-2">
                <BsCheckCircleFill className="shrink-0" />
                {snapshotSuccessMsg}
              </div>
            )}
          </Group>

          <Group title="Encrypted backup (.sshx)">
            <Setting label="Export" hint="Config, known hosts and templates, protected by a password (AES-256-GCM)">
              <Button icon={<BsDownload />} onClick={handleStartExport}>
                Export...
              </Button>
            </Setting>
            <Setting label="Restore" hint="Decrypt a .sshx bundle and apply it">
              <Button icon={<BsUpload />} onClick={() => fileInputRef.current?.click()}>
                Restore...
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleSelectFileToRestore}
                accept=".sshx,application/x-sshx-backup,application/json"
                className="hidden"
              />
            </Setting>
          </Group>

          <Group title="Files">
            {["~/.ssh/config", "~/.ssh/known_hosts"].map((path) => (
              <Setting key={path} label={path === "~/.ssh/config" ? "Config file" : "Known hosts file"}>
                <span className="font-mono text-label-2">{path}</span>
                <button
                  type="button"
                  onClick={() => handleCopyPath(path)}
                  className="text-accent hover:underline cursor-pointer"
                >
                  {copiedPath === path ? "Copied" : "Copy"}
                </button>
              </Setting>
            ))}
          </Group>

          <Group title="Updates">
            <Setting label="SSHX Desktop" hint="Updates come from GitHub Releases (theasmat/sshx)">
              <Button
                icon={<BsArrowRepeat className={updateStatus === "checking" ? "animate-spin" : ""} />}
                onClick={handleCheckForUpdates}
                disabled={updateStatus === "checking" || updateStatus === "downloading"}
              >
                {updateStatus === "checking" ? "Checking..." : "Check for Updates"}
              </Button>
            </Setting>

            {updateStatus === "up-to-date" && (
              <div role="status" className="px-4 py-2.5 text-emerald-300 flex items-center gap-2">
                <BsCheckCircleFill className="shrink-0" /> You have the latest version.
              </div>
            )}

            {updateStatus === "available" && availableUpdate && (
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-label font-medium">Update available: v{availableUpdate.version}</span>
                  <Button variant="primary" onClick={handleInstallUpdate}>
                    Download &amp; Install
                  </Button>
                </div>
                {availableUpdate.body && (
                  <p className="text-label-2 text-xs font-mono whitespace-pre-wrap bg-well rounded-ctl p-3">
                    {availableUpdate.body}
                  </p>
                )}
              </div>
            )}

            {updateStatus === "downloading" && (
              <div className="px-4 py-3 space-y-1.5">
                <div className="flex justify-between text-label-2">
                  <span>Downloading update...</span>
                  <span className="tabular-nums">{downloadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.1] rounded-full overflow-hidden">
                  <div className="h-full bg-accent transition-all duration-200" style={{ width: `${downloadProgress}%` }} />
                </div>
              </div>
            )}

            {updateStatus === "ready" && (
              <div role="status" className="px-4 py-2.5 text-emerald-300 flex items-center gap-2">
                <BsCheckCircleFill className="shrink-0" /> Downloaded. Restart SSHX to apply.
              </div>
            )}

            {updateStatus === "error" && updateError && (
              <div role="alert" className="px-4 py-2.5 text-rose-300 flex items-start gap-2">
                <BsExclamationCircleFill className="shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Update check failed</div>
                  <p className="text-label-2 text-xs mt-0.5">{updateError}</p>
                </div>
              </div>
            )}
          </Group>

          <div className="flex items-center gap-3 px-1 text-label-3">
            <SshxLogo variant="icon" size={28} macStyle={true} />
            <div className="text-xs">
              <div className="text-label-2">SSHX {"—"} Modern SSH Desktop Manager</div>
              <div>Version 1.0.0 · Tauri 2, Rust, React 19 · Open source</div>
            </div>
          </div>
        </div>
      </div>

      {isExportModalOpen && (
        <Dialog
          title="Export encrypted backup"
          subtitle="All backups require a password"
          onClose={() => setIsExportModalOpen(false)}
          footer={
            <>
              <Button type="button" onClick={() => setIsExportModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="export-form" variant="primary" icon={<BsDownload />} disabled={isExporting}>
                {isExporting ? "Encrypting..." : "Export"}
              </Button>
            </>
          }
        >
          <form id="export-form" onSubmit={handlePerformExport} className="space-y-4 text-[13px]">
            <p className="text-label-2 leading-relaxed">
              Includes {configData?.hosts.length || 0} SSH hosts from <code className="font-mono text-label">~/.ssh/config</code>,{" "}
              {knownHostsCount} known hosts and your templates, encrypted with AES-256-GCM.
            </p>
            {exportError && (
              <div role="alert" className="rounded-ctl bg-rose-500/10 text-rose-300 px-3 py-2 flex items-center gap-2">
                <BsExclamationCircleFill className="shrink-0" />
                <span>{exportError}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="export-pass" className="text-label-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="export-pass"
                  type={showExportPass ? "text" : "password"}
                  required
                  placeholder="Choose a strong password"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  className={`${dialogField} font-mono pr-9`}
                />
                <button
                  type="button"
                  aria-label={showExportPass ? "Hide password" : "Show password"}
                  onClick={() => setShowExportPass(!showExportPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-label-3 hover:text-label cursor-pointer"
                >
                  {showExportPass ? <BsEyeSlash /> : <BsEye />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="export-confirm" className="text-label-2">
                Confirm password
              </label>
              <input
                id="export-confirm"
                type={showExportPass ? "text" : "password"}
                required
                placeholder="Re-enter password"
                value={exportConfirmPass}
                onChange={(e) => setExportConfirmPass(e.target.value)}
                className={`${dialogField} font-mono`}
              />
            </div>
          </form>
        </Dialog>
      )}

      {isRestoreModalOpen && (
        <Dialog
          title="Restore from backup"
          subtitle={restoreFileName}
          onClose={() => setIsRestoreModalOpen(false)}
          footer={
            !decryptedPreview ? (
              <>
                <Button type="button" onClick={() => setIsRestoreModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="restore-form" variant="primary" icon={<BsShieldLock />} disabled={isRestoring}>
                  {isRestoring ? "Decrypting..." : "Decrypt & Inspect"}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" onClick={() => setIsRestoreModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" icon={<BsUpload />} disabled={isRestoring} onClick={handleExecuteRestore}>
                  {isRestoring ? "Restoring..." : "Confirm & Restore"}
                </Button>
              </>
            )
          }
        >
          <div className="space-y-4 text-[13px]">
            {restoreError && (
              <div role="alert" className="rounded-ctl bg-rose-500/10 text-rose-300 px-3 py-2 flex items-center gap-2">
                <BsExclamationCircleFill className="shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}
            {restoreSuccessMsg && (
              <div role="status" className="rounded-ctl bg-emerald-500/10 text-emerald-300 px-3 py-2 flex items-center gap-2">
                <BsCheckCircleFill className="shrink-0" />
                <span>{restoreSuccessMsg}</span>
              </div>
            )}

            {!decryptedPreview ? (
              <form id="restore-form" onSubmit={handleVerifyPassword} className="space-y-1.5">
                <label htmlFor="restore-pass" className="text-label-2">
                  Decryption password
                </label>
                <div className="relative">
                  <input
                    id="restore-pass"
                    type={showRestorePass ? "text" : "password"}
                    required
                    placeholder="Enter password"
                    value={restorePassword}
                    onChange={(e) => setRestorePassword(e.target.value)}
                    className={`${dialogField} font-mono pr-9`}
                  />
                  <button
                    type="button"
                    aria-label={showRestorePass ? "Hide password" : "Show password"}
                    onClick={() => setShowRestorePass(!showRestorePass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-label-3 hover:text-label cursor-pointer"
                  >
                    {showRestorePass ? <BsEyeSlash /> : <BsEye />}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <Group>
                  <Row label="Password">Verified</Row>
                  <Row label="Created">{new Date(decryptedPreview.createdAt).toLocaleDateString()}</Row>
                  <Row label="SSH hosts">{decryptedPreview.metadata.hostsCount}</Row>
                  <Row label="Known hosts">{decryptedPreview.metadata.knownHostsCount}</Row>
                </Group>
                <p className="text-label-2 leading-relaxed">
                  Restoring updates <code className="font-mono text-label">~/.ssh/config</code> and{" "}
                  <code className="font-mono text-label">~/.ssh/known_hosts</code>. A safety backup of your current
                  configuration is saved first.
                </p>
              </div>
            )}
          </div>
        </Dialog>
      )}

      {isLocalSnapshotsModalOpen && (
        <Dialog
          title="Config snapshots"
          subtitle="Saved in ~/.ssh/ before edits"
          onClose={() => setIsLocalSnapshotsModalOpen(false)}
          footer={
            <>
              <Button
                variant="plain"
                onClick={() => {
                  setIsLocalSnapshotsModalOpen(false);
                  onOpenRawBackups();
                }}
              >
                Open in Raw Config
              </Button>
              <Button
                icon={<BsArrowClockwise className={isLoadingAllSnapshots ? "animate-spin" : ""} />}
                onClick={loadAllSnapshots}
                disabled={isLoadingAllSnapshots}
              >
                Refresh
              </Button>
              <Button variant="primary" onClick={() => setIsLocalSnapshotsModalOpen(false)}>
                Done
              </Button>
            </>
          }
        >
          {isLoadingAllSnapshots ? (
            <div className="py-8 text-center text-label-3">Loading snapshots...</div>
          ) : allSnapshots.length === 0 ? (
            <div className="py-8 text-center space-y-1">
              <div className="text-label-2">No snapshots yet</div>
              <div className="text-xs text-label-3">A snapshot is created when you save changes in sshX.</div>
            </div>
          ) : (
            <div className="rounded-card bg-card divide-y divide-white/[0.06] overflow-hidden text-[13px]">
              {allSnapshots.map((snap) => (
                <div key={snap.filename} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-label truncate">{snap.filename}</div>
                    <div className="text-xs text-label-2 flex items-center gap-2 flex-wrap">
                      <span>{formatSnapshotTime(snap.modified_timestamp)}</span>
                      <span>·</span>
                      <span>{formatSnapshotSize(snap.size_bytes)}</span>
                      {snap.is_primary && <Badge tone="ok">Latest</Badge>}
                      {snap.filename === "config.sshx.bak.previous" && <Badge>Previous</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePreviewSnapshot(snap.filename)}
                      disabled={isLoadingSnapshotPreview}
                      className="text-accent hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRestoreDeviceSnapshot(snap.filename)}
                      disabled={restoringSnapshotName === snap.filename}
                      className="text-accent hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {restoringSnapshotName === snap.filename ? "Restoring..." : "Restore"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Dialog>
      )}

      {snapshotPreview && (
        <Dialog
          size="lg"
          title="Snapshot preview"
          subtitle={`~/.ssh/${snapshotPreview.name}`}
          onClose={() => setSnapshotPreview(null)}
          footer={
            <>
              <Button onClick={() => setSnapshotPreview(null)}>Close</Button>
              <Button
                variant="primary"
                icon={<BsArchive />}
                onClick={() => handleRestoreDeviceSnapshot(snapshotPreview.name)}
                disabled={restoringSnapshotName === snapshotPreview.name}
              >
                Restore This Snapshot
              </Button>
            </>
          }
        >
          <pre className="max-h-[50vh] p-4 bg-well rounded-card overflow-y-auto text-label font-mono text-xs leading-relaxed select-text">
            {snapshotPreview.content || "# (Empty file)"}
          </pre>
        </Dialog>
      )}
    </div>
  );
};
