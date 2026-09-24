import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  Terminal,
  Key,
  Shield,
  History,
  Folder,
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react";
import { TerminalAppInfo } from "../types";

interface SettingsViewProps {
  terminals: TerminalAppInfo[];
  selectedTerminal: string;
  onSelectTerminal: (termId: string) => void;
  onOpenRawBackups: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  terminals,
  selectedTerminal,
  onSelectTerminal,
  onOpenRawBackups,
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

  return (
    <div className="h-full flex flex-col bg-[#070a10] text-xs select-none overflow-hidden">
      {/* Top Header */}
      <div className="px-5 py-3 border-b border-[#1f2942] bg-[#090d16] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <SettingsIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Application Settings</h2>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Preferences Saved</span>
          </div>
        )}
      </div>

      {/* Main Settings Form Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Section 1: Terminal Launcher Target */}
          <div className="p-4 bg-[#0b0f19] border border-[#1f2942] rounded-xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1f2942] text-gray-300 font-semibold text-xs">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>Default Terminal Launcher</span>
            </div>

            <div className="space-y-2">
              <p className="text-gray-400 text-[11px] leading-relaxed">
                Choose the native desktop terminal emulator used when launching interactive SSH connections.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
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
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500 text-blue-300 font-semibold shadow-sm"
                          : "bg-[#070a10] border-[#1f2942] text-gray-300 hover:bg-[#161d30]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Terminal className={`w-4 h-4 ${isSelected ? "text-blue-400" : "text-gray-500"}`} />
                        <div>
                          <div className="text-xs font-semibold text-white">{t.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {t.is_installed ? "Detected & Installed" : "System standard"}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: SSH Key Generation Defaults */}
          <div className="p-4 bg-[#0b0f19] border border-[#1f2942] rounded-xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1f2942] text-gray-300 font-semibold text-xs">
              <Key className="w-4 h-4 text-purple-400" />
              <span>SSH Key Generation Defaults</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-gray-300 font-medium mb-1.5">
                  Default Cryptographic Algorithm
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveAlgo("ed25519")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      defaultAlgo === "ed25519"
                        ? "bg-purple-600/20 border-purple-500 text-purple-300 font-bold"
                        : "bg-[#070a10] border-[#1f2942] text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <div className="text-xs">Ed25519</div>
                    <div className="text-[10px] text-emerald-400 font-medium">Recommended</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveAlgo("rsa")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      defaultAlgo === "rsa"
                        ? "bg-purple-600/20 border-purple-500 text-purple-300 font-bold"
                        : "bg-[#070a10] border-[#1f2942] text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <div className="text-xs">RSA</div>
                    <div className="text-[10px] text-gray-500 font-medium">4096-bit</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveAlgo("ecdsa")}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      defaultAlgo === "ecdsa"
                        ? "bg-purple-600/20 border-purple-500 text-purple-300 font-bold"
                        : "bg-[#070a10] border-[#1f2942] text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <div className="text-xs">ECDSA</div>
                    <div className="text-[10px] text-gray-500 font-medium">NIST P-256</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">
                  Default SSH Port for New Hosts
                </label>
                <input
                  type="number"
                  value={defaultPort}
                  onChange={(e) => handlePortChange(parseInt(e.target.value, 10) || 22)}
                  className="w-32 bg-[#070a10] border border-[#1f2942] rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Safety, Automated Snapshots & Backups */}
          <div className="p-4 bg-[#0b0f19] border border-[#1f2942] rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1f2942]">
              <div className="flex items-center gap-2 text-gray-300 font-semibold text-xs">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Safety & Automated Snapshots</span>
              </div>

              <button
                type="button"
                onClick={onOpenRawBackups}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#161d30] hover:bg-[#1f2942] text-amber-300 rounded-lg border border-amber-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>Manage Snapshots</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 bg-[#070a10] border border-[#1f2942] rounded-xl cursor-pointer">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">Auto-Backup Before Modifications</div>
                  <div className="text-[11px] text-gray-400">
                    Automatically create a timestamped snapshot (`~/.ssh/config.bak.&lt;ts&gt;`) every time you save.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoBackup}
                  onChange={(e) => handleToggleAutoBackup(e.target.checked)}
                  className="w-4 h-4 rounded border-[#1f2942] bg-[#0b0f19] text-blue-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-[#070a10] border border-[#1f2942] rounded-xl cursor-pointer">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">Screen Privacy Masking</div>
                  <div className="text-[11px] text-gray-400">
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

          {/* Section 4: System Paths */}
          <div className="p-4 bg-[#0b0f19] border border-[#1f2942] rounded-xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1f2942] text-gray-300 font-semibold text-xs">
              <Folder className="w-4 h-4 text-amber-400" />
              <span>System SSH Directories & Configs</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-[#070a10] border border-[#1f2942] rounded-lg">
                <div className="space-y-0.5">
                  <div className="text-gray-400 text-[10px] font-semibold uppercase">Config File</div>
                  <div className="font-mono text-white text-[11px]">~/.ssh/config</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyPath("~/.ssh/config")}
                  className="p-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded border border-[#232f4d] cursor-pointer"
                  title="Copy path"
                >
                  {copiedPath === "~/.ssh/config" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#070a10] border border-[#1f2942] rounded-lg">
                <div className="space-y-0.5">
                  <div className="text-gray-400 text-[10px] font-semibold uppercase">Known Hosts File</div>
                  <div className="font-mono text-white text-[11px]">~/.ssh/known_hosts</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyPath("~/.ssh/known_hosts")}
                  className="p-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded border border-[#232f4d] cursor-pointer"
                  title="Copy path"
                >
                  {copiedPath === "~/.ssh/known_hosts" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: About SSHX */}
          <div className="p-4 bg-[#090d16] border border-[#1f2942] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-mono font-bold text-sm">
                SX
              </div>
              <div>
                <h4 className="font-bold text-white text-xs">SSHX — Modern SSH Desktop Manager</h4>
                <p className="text-[11px] text-gray-400">
                  Version 0.1.0 • Built with Tauri v2 + Rust + React 19
                </p>
              </div>
            </div>

            <span className="text-[10px] px-2 py-1 rounded bg-[#161d30] text-blue-400 border border-blue-500/30 font-medium">
              v0.1.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
