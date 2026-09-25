import React, { useState, useRef } from "react";
import {
  BsGear,
  BsTerminalFill,
  BsKeyFill,
  BsShieldCheck,
  BsClockHistory,
  BsFolder2Open,
  BsCopy,
  BsCheckLg,
  BsCheckCircleFill,
  BsZoomIn,
  BsZoomOut,
  BsShieldLock,
  BsDownload,
  BsUpload,
  BsFileEarmarkLock2,
  BsXLg,
  BsEye,
  BsEyeSlash,
  BsExclamationCircleFill,
  BsArrowRepeat,
  BsCloudArrowDownFill,
  BsGithub,
} from "react-icons/bs";
import { check, Update } from "@tauri-apps/plugin-updater";
import { BrandLogo } from "../components/BrandLogo";
import { SshxLogo } from "../components/SshxLogo";
import { TerminalAppInfo, SshConfigFileData } from "../types";
import {
  createEncryptedSshxBackup,
  decryptSshxBackup,
  downloadSshxFile,
  SshxBackupPayload,
} from "../utils/backupCrypto";
import { loadCustomPresets } from "../presets";
import { api } from "../api";

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
    <div className="h-full flex flex-col bg-[#070a10] text-xs select-none overflow-hidden">
      {/* Top Header */}
      <div className="px-3.5 py-1.5 border-b border-[#1f2942] bg-[#090d16] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <BsGear className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Application Settings</h2>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-md text-xs animate-in fade-in">
            <BsCheckCircleFill className="w-3.5 h-3.5 text-emerald-400" />
            <span>Saved</span>
          </div>
        )}
      </div>

      {/* Main Settings Form Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-3.5">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Section 1: UI Scaling & Zoom Controls */}
          <div className="p-3.5 bg-[#0b0f19] border border-[#1f2942] rounded-lg space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#1f2942]">
              <div className="flex items-center gap-2 text-gray-300 font-semibold text-xs">
                <BsZoomIn className="w-3.5 h-3.5 text-blue-400" />
                <span>UI Scaling & Zoom</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                <kbd className="bg-[#161d30] px-1.5 py-0.5 rounded border border-[#232f4d] text-gray-300">Cmd +</kbd>
                <kbd className="bg-[#161d30] px-1.5 py-0.5 rounded border border-[#232f4d] text-gray-300">Cmd -</kbd>
                <kbd className="bg-[#161d30] px-1.5 py-0.5 rounded border border-[#232f4d] text-gray-300">Cmd 0</kbd>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-gray-400 text-xs">
                  Adjust interface scale for optimal clarity across high-DPI and laptop displays.
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {zoomPresets.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => onSetZoom(lvl)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold font-mono transition-colors border cursor-pointer ${
                        zoomLevel === lvl
                          ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                          : "bg-[#070a10] text-gray-400 border-[#1f2942] hover:text-gray-200 hover:bg-[#161d30]"
                      }`}
                    >
                      {lvl}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSetZoom((prev: number) => Math.max(prev - 10, 70))}
                  className="p-2 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-md border border-[#232f4d] cursor-pointer"
                  title="Zoom Out (Cmd -)"
                >
                  <BsZoomOut className="w-3.5 h-3.5" />
                </button>

                <span className="font-mono font-bold text-white text-xs w-12 text-center">
                  {zoomLevel}%
                </span>

                <button
                  type="button"
                  onClick={() => onSetZoom((prev: number) => Math.min(prev + 10, 150))}
                  className="p-2 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-md border border-[#232f4d] cursor-pointer"
                  title="Zoom In (Cmd +)"
                >
                  <BsZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onSetZoom(100)}
                  className="px-2.5 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-400 hover:text-gray-200 rounded-md border border-[#232f4d] text-xs font-medium cursor-pointer"
                  title="Reset to default (Cmd 0)"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Encrypted Backup & Restore (.sshx) */}
          <div className="p-3.5 bg-[#0b0f19] border border-[#1f2942] rounded-lg space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#1f2942]">
              <div className="flex items-center gap-2 text-gray-300 font-semibold text-xs">
                <BsFileEarmarkLock2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Password-Encrypted Backup & Restore (.sshx)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                AES-256-GCM
              </span>
            </div>

            <p className="text-gray-400 text-xs leading-relaxed">
              Export an encrypted bundle (<code className="text-emerald-400 font-mono">.sshx</code>) containing your SSH config, known hosts, and custom presets with mandatory password protection. Only openable with your password in SSHX.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Export Button */}
              <button
                type="button"
                onClick={handleStartExport}
                className="p-3 bg-[#070a10] hover:bg-[#121829] border border-[#1f2942] hover:border-blue-500/40 rounded-lg text-left transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5 group-hover:text-blue-400 transition-colors">
                    <BsDownload className="w-3.5 h-3.5 text-blue-400" />
                    <span>Export Encrypted .sshx</span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Secure with password & save bundle
                  </div>
                </div>
                <span className="text-blue-400 font-mono text-xs font-semibold">➔</span>
              </button>

              {/* Restore Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-[#070a10] hover:bg-[#121829] border border-[#1f2942] hover:border-emerald-500/40 rounded-lg text-left transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-white text-xs flex items-center gap-1.5 group-hover:text-emerald-400 transition-colors">
                    <BsUpload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Restore from .sshx</span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Decrypt password-protected archive
                  </div>
                </div>
                <span className="text-emerald-400 font-mono text-xs font-semibold">➔</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleSelectFileToRestore}
                accept=".sshx,application/x-sshx-backup,application/json"
                className="hidden"
              />
            </div>
          </div>

          {/* Section 3: Terminal Launcher Target */}
          <div className="p-3.5 bg-[#0b0f19] border border-[#1f2942] rounded-lg space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1f2942] text-gray-300 font-semibold text-xs">
              <BsTerminalFill className="w-3.5 h-3.5 text-blue-400" />
              <span>Default Terminal Launcher</span>
            </div>

            <div className="space-y-2">
              <p className="text-gray-400 text-xs leading-relaxed">
                Choose the native desktop terminal emulator used when launching interactive SSH connections.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                {terminals.map((t) => {
                  const isSelected = selectedTerminal === t.id;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onSelectTerminal(t.id);
                        triggerSaveToast();
                      }}
                      className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500 text-blue-300 font-semibold shadow-sm"
                          : "bg-[#070a10] border-[#1f2942] text-gray-300 hover:bg-[#161d30]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded flex items-center justify-center bg-[#161d30] border border-[#232f4d] shrink-0 text-gray-300">
                          <BrandLogo
                            name={t.name}
                            className="w-3.5 h-3.5"
                            fallbackIcon={<BsTerminalFill className="w-3.5 h-3.5 text-blue-400" />}
                          />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">{t.name}</div>
                          <div className="text-[11px] text-gray-400 font-mono leading-none mt-0.5">
                            {t.is_installed ? "Detected & Installed" : "System standard"}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <BsCheckLg className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: SSH Key Generation Defaults */}
          <div className="p-3.5 bg-[#0b0f19] border border-[#1f2942] rounded-lg space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1f2942] text-gray-300 font-semibold text-xs">
              <BsKeyFill className="w-3.5 h-3.5 text-purple-400" />
              <span>SSH Key Generation Defaults</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-gray-300 font-medium mb-1.5 text-xs">
                  Default Cryptographic Algorithm
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveAlgo("ed25519")}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      defaultAlgo === "ed25519"
                        ? "bg-purple-600/20 border-purple-500 text-purple-300 font-bold"
                        : "bg-[#070a10] border-[#1f2942] text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <div className="text-xs">Ed25519</div>
                    <div className="text-[10px] text-emerald-400 font-medium leading-none mt-0.5">Recommended</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveAlgo("rsa")}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      defaultAlgo === "rsa"
                        ? "bg-purple-600/20 border-purple-500 text-purple-300 font-bold"
                        : "bg-[#070a10] border-[#1f2942] text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <div className="text-xs">RSA</div>
                    <div className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">4096-bit</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveAlgo("ecdsa")}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      defaultAlgo === "ecdsa"
                        ? "bg-purple-600/20 border-purple-500 text-purple-300 font-bold"
                        : "bg-[#070a10] border-[#1f2942] text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <div className="text-xs">ECDSA</div>
                    <div className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">NIST P-256</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1 text-xs">
                  Default SSH Port for New Hosts
                </label>
                <input
                  type="number"
                  value={defaultPort}
                  onChange={(e) => handlePortChange(parseInt(e.target.value, 10) || 22)}
                  className="w-28 bg-[#070a10] border border-[#1f2942] rounded px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Safety, Automated Snapshots & Backups */}
          <div className="p-3.5 bg-[#0b0f19] border border-[#1f2942] rounded-lg space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#1f2942]">
              <div className="flex items-center gap-2 text-gray-300 font-semibold text-xs">
                <BsShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Safety & Automated Snapshots</span>
              </div>

              <button
                type="button"
                onClick={onOpenRawBackups}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#161d30] hover:bg-[#1f2942] text-amber-300 rounded-md border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                <BsClockHistory className="w-3.5 h-3.5 text-amber-400" />
                <span>Manage Local Snapshots</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-3 bg-[#070a10] border border-[#1f2942] rounded-md cursor-pointer">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white text-xs">Auto-Backup Before Modifications</div>
                  <div className="text-xs text-gray-400">
                    Automatically create a timestamped snapshot (`~/.ssh/config.bak.&lt;ts&gt;`) on save.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoBackup}
                  onChange={(e) => handleToggleAutoBackup(e.target.checked)}
                  className="w-4 h-4 rounded border-[#1f2942] bg-[#0b0f19] text-blue-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-[#070a10] border border-[#1f2942] rounded-md cursor-pointer">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white text-xs">Screen Privacy Masking</div>
                  <div className="text-xs text-gray-400">
                    Mask cryptographic fingerprints and public keys on screen to prevent shoulder surfing.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacyMask}
                  onChange={(e) => handleTogglePrivacyMask(e.target.checked)}
                  className="w-4 h-4 rounded border-[#1f2942] bg-[#0b0f19] text-blue-600 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Section 6: System Paths */}
          <div className="p-3.5 bg-[#0b0f19] border border-[#1f2942] rounded-lg space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1f2942] text-gray-300 font-semibold text-xs">
              <BsFolder2Open className="w-3.5 h-3.5 text-amber-400" />
              <span>System SSH Directories & Configs</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-[#070a10] border border-[#1f2942] rounded-md">
                <div className="space-y-0.5">
                  <div className="text-gray-400 text-[10px] font-semibold uppercase leading-none">Config File</div>
                  <div className="font-mono text-white text-xs">~/.ssh/config</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyPath("~/.ssh/config")}
                  className="p-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded border border-[#232f4d] cursor-pointer"
                  title="Copy path"
                >
                  {copiedPath === "~/.ssh/config" ? (
                    <BsCheckLg className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <BsCopy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#070a10] border border-[#1f2942] rounded-md">
                <div className="space-y-0.5">
                  <div className="text-gray-400 text-[10px] font-semibold uppercase leading-none">Known Hosts File</div>
                  <div className="font-mono text-white text-xs">~/.ssh/known_hosts</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyPath("~/.ssh/known_hosts")}
                  className="p-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded border border-[#232f4d] cursor-pointer"
                  title="Copy path"
                >
                  {copiedPath === "~/.ssh/known_hosts" ? (
                    <BsCheckLg className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <BsCopy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section 7: Software Updates & GitHub Auto-Updater */}
          <div className="p-3.5 bg-[#0b0f19] border border-[#1f2942] rounded-lg space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#1f2942]">
              <div className="flex items-center gap-2 text-gray-300 font-semibold text-xs">
                <BsCloudArrowDownFill className="w-3.5 h-3.5 text-blue-400" />
                <span>Software Updates & Auto-Updater</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <BsGithub className="w-3.5 h-3.5 text-gray-300" />
                <span className="font-mono text-gray-300 text-[10px]">theasmat/sshx</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-[#070a10] border border-[#1f2942] rounded-md flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">SSHX Desktop App</span>
                    <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-semibold border border-blue-500/30">
                      v0.1.0 (Current)
                    </span>
                  </div>
                  <p className="text-gray-400 text-[11px]">
                    Automatic multi-platform background updates configured via GitHub Releases.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCheckForUpdates}
                  disabled={updateStatus === "checking" || updateStatus === "downloading"}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <BsArrowRepeat className={`w-3.5 h-3.5 ${updateStatus === "checking" ? "animate-spin" : ""}`} />
                  <span>{updateStatus === "checking" ? "Checking..." : "Check for Updates"}</span>
                </button>
              </div>

              {/* Status & Update Feedback */}
              {updateStatus === "up-to-date" && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md flex items-center gap-2 text-emerald-300 text-xs animate-in fade-in">
                  <BsCheckCircleFill className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>You are running the latest version of SSHX (v0.1.0).</span>
                </div>
              )}

              {updateStatus === "available" && availableUpdate && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-md space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-purple-300 text-xs">
                      Update Available: v{availableUpdate.version}
                    </div>
                    <button
                      type="button"
                      onClick={handleInstallUpdate}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-md font-bold text-xs shadow-sm transition-colors cursor-pointer"
                    >
                      Download & Install
                    </button>
                  </div>
                  {availableUpdate.body && (
                    <p className="text-gray-300 text-[11px] font-mono whitespace-pre-wrap bg-[#070a10] p-2 rounded border border-[#1f2942]">
                      {availableUpdate.body}
                    </p>
                  )}
                </div>
              )}

              {updateStatus === "downloading" && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-md space-y-1.5 animate-in fade-in">
                  <div className="flex justify-between text-xs text-blue-300 font-semibold">
                    <span>Downloading update...</span>
                    <span>{downloadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#070a10] rounded-full overflow-hidden border border-[#1f2942]">
                    <div
                      className="h-full bg-blue-500 transition-all duration-200"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {updateStatus === "ready" && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <BsCheckCircleFill className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Update downloaded successfully. Restart SSHX to apply.</span>
                  </div>
                </div>
              )}

              {updateStatus === "error" && updateError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-md text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                  <BsExclamationCircleFill className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Update check status:</span>
                    <p className="text-gray-400 text-[11px] mt-0.5">{updateError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 8: About SSHX */}
          <div className="p-3 bg-[#090d16] border border-[#1f2942] rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SshxLogo variant="icon" size={36} macStyle={true} />
              <div>
                <h4 className="font-bold text-white text-xs">SSHX — Modern SSH Desktop Manager</h4>
                <p className="text-[11px] text-gray-400 leading-tight">
                  Version 1.0.0 • Built with Tauri v2 + Rust + React 19 • Open Source
                </p>
              </div>
            </div>

            <span className="text-[10px] px-2 py-0.5 rounded bg-[#161d30] text-blue-400 border border-blue-500/30 font-medium font-mono">
              v1.0.0
            </span>
          </div>
        </div>
      </div>

      {/* MODAL 1: EXPORT ENCRYPTED .SSHX BACKUP */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c101a] border border-[#1f2942] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#1f2942] bg-[#090d16] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <BsShieldLock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Export Encrypted .sshx Backup</h3>
                  <p className="text-[11px] text-gray-400">All backups require a password</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <BsXLg className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePerformExport} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-[#070a10] border border-[#1f2942] rounded-xl space-y-1">
                <div className="text-gray-300 font-semibold text-xs flex items-center gap-1.5">
                  <BsCheckCircleFill className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Backup Contents</span>
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Includes {configData?.hosts.length || 0} SSH hosts from <code className="text-blue-400 font-mono">~/.ssh/config</code>, {knownHostsCount} known hosts, and custom presets. Encrypted with AES-256-GCM.
                </p>
              </div>

              {exportError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs flex items-center gap-2">
                  <BsExclamationCircleFill className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{exportError}</span>
                </div>
              )}

              <div>
                <label className="block text-gray-300 font-semibold mb-1 text-xs">
                  Create Backup Encryption Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showExportPass ? "text" : "password"}
                    required
                    placeholder="Enter strong password..."
                    value={exportPassword}
                    onChange={(e) => setExportPassword(e.target.value)}
                    className="w-full bg-[#070a10] border border-[#1f2942] rounded-xl pl-3 pr-10 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowExportPass(!showExportPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer"
                  >
                    {showExportPass ? <BsEyeSlash className="w-3.5 h-3.5" /> : <BsEye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1 text-xs">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type={showExportPass ? "text" : "password"}
                  required
                  placeholder="Re-enter password..."
                  value={exportConfirmPass}
                  onChange={(e) => setExportConfirmPass(e.target.value)}
                  className="w-full bg-[#070a10] border border-[#1f2942] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#1f2942]">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <BsDownload className="w-3.5 h-3.5" />
                  <span>{isExporting ? "Encrypting & Exporting..." : "Export .sshx Bundle"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESTORE FROM .SSHX BACKUP */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c101a] border border-[#1f2942] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#1f2942] bg-[#090d16] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <BsFileEarmarkLock2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Restore from .sshx Backup</h3>
                  <p className="text-[11px] text-gray-400 font-mono truncate max-w-[220px]">
                    {restoreFileName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRestoreModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <BsXLg className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {restoreError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs flex items-center gap-2">
                  <BsExclamationCircleFill className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{restoreError}</span>
                </div>
              )}

              {restoreSuccessMsg && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
                  <BsCheckCircleFill className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{restoreSuccessMsg}</span>
                </div>
              )}

              {!decryptedPreview ? (
                /* Password prompt form */
                <form onSubmit={handleVerifyPassword} className="space-y-4">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1 text-xs">
                      Enter Decryption Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showRestorePass ? "text" : "password"}
                        required
                        placeholder="Enter password..."
                        value={restorePassword}
                        onChange={(e) => setRestorePassword(e.target.value)}
                        className="w-full bg-[#070a10] border border-[#1f2942] rounded-xl pl-3 pr-10 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRestorePass(!showRestorePass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer"
                      >
                        {showRestorePass ? <BsEyeSlash className="w-3.5 h-3.5" /> : <BsEye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-[#1f2942]">
                    <button
                      type="button"
                      onClick={() => setIsRestoreModalOpen(false)}
                      className="px-4 py-2 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-xl font-medium cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isRestoring}
                      className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      <BsShieldLock className="w-3.5 h-3.5" />
                      <span>{isRestoring ? "Decrypting..." : "Decrypt & Inspect"}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Decrypted contents summary & execution */
                <div className="space-y-3.5">
                  <div className="p-3 bg-[#070a10] border border-emerald-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                        <BsCheckCircleFill className="w-3.5 h-3.5" />
                        <span>Password Verified Successfully</span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(decryptedPreview.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                      <div className="p-2 bg-[#0b0f19] border border-[#1f2942] rounded-lg text-center">
                        <div className="text-lg font-bold text-white">
                          {decryptedPreview.metadata.hostsCount}
                        </div>
                        <div className="text-[10px] text-gray-400 font-sans">SSH Hosts</div>
                      </div>

                      <div className="p-2 bg-[#0b0f19] border border-[#1f2942] rounded-lg text-center">
                        <div className="text-lg font-bold text-white">
                          {decryptedPreview.metadata.knownHostsCount}
                        </div>
                        <div className="text-[10px] text-gray-400 font-sans">Known Hosts</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-400 text-xs">
                    Restoring this backup will update your <code className="text-emerald-400 font-mono">~/.ssh/config</code> and <code className="text-emerald-400 font-mono">~/.ssh/known_hosts</code>. An automated safety backup of your current configuration will be saved first.
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-[#1f2942]">
                    <button
                      type="button"
                      onClick={() => setIsRestoreModalOpen(false)}
                      className="px-4 py-2 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-xl font-medium cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={handleExecuteRestore}
                      className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      <BsUpload className="w-3.5 h-3.5" />
                      <span>{isRestoring ? "Restoring..." : "Confirm & Restore"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
