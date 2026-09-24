import React, { useState, useEffect } from "react";
import {
  FileCode,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Clock,
  History,
  X,
  RefreshCw,
  ArchiveRestore,
} from "lucide-react";
import { api } from "../api";

interface RawConfigViewProps {
  initialContent: string;
  filePath: string;
  onSaved: () => void;
  isLoading?: boolean;
}

export const RawConfigView: React.FC<RawConfigViewProps> = ({
  initialContent,
  filePath,
  onSaved,
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Backup Snapshots state
  const [backups, setBackups] = useState<string[]>([]);
  const [isBackupsModalOpen, setIsBackupsModalOpen] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Load backups list
  const loadBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const list = await api.listBackups();
      setBackups(list);
    } catch (e) {
      console.error("Failed to load backups:", e);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleOpenBackups = () => {
    loadBackups();
    setIsBackupsModalOpen(true);
  };

  const handleRestoreBackup = async (backupName: string) => {
    if (
      !confirm(
        `Are you sure you want to restore '${backupName}'?\nThis will replace your current ~/.ssh/config.`
      )
    ) {
      return;
    }

    setRestoringBackup(backupName);
    try {
      const restored = await api.restoreBackup(backupName);
      setContent(restored.raw_content);
      setRestoreSuccessMsg(`Successfully restored snapshot '${backupName}'!`);
      setTimeout(() => setRestoreSuccessMsg(null), 3000);
      onSaved();
      setIsBackupsModalOpen(false);
    } catch (err: any) {
      alert(`Failed to restore backup: ${err}`);
    } finally {
      setRestoringBackup(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await api.saveRawConfig(content);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      onSaved();
    } catch (err: any) {
      setErrorMsg(`Failed to save config: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = () => {
    if (confirm("Discard unsaved changes and revert to file content?")) {
      setContent(initialContent);
    }
  };

  // Keyboard shortcut Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [content]);

  const isModified = content !== initialContent;

  const formatBackupTime = (name: string) => {
    const tsStr = name.replace("config.bak.", "");
    const ts = parseInt(tsStr, 10);
    if (isNaN(ts)) return name;
    const date = new Date(ts * 1000);
    return date.toLocaleString();
  };

  return (
    <div className="h-full flex flex-col bg-[#070a10] text-xs select-none overflow-hidden">
      {/* Top Header */}
      <div className="px-5 py-3 border-b border-[#1f2942] bg-[#090d16] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <FileCode className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Raw ~/.ssh/config Editor</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Backups Button */}
          <button
            onClick={handleOpenBackups}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-lg border border-[#232f4d] font-medium transition-colors cursor-pointer"
            title="View automated backup snapshots"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Snapshots & Backups</span>
          </button>

          {isModified && (
            <button
              onClick={handleRevert}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-lg border border-[#232f4d] font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Revert</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving || !isModified}
            className="flex items-center gap-1.5 px-4 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {saveSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saveSuccess ? "Saved!" : isSaving ? "Saving..." : "Save Config (⌘S)"}</span>
          </button>
        </div>
      </div>

      {/* Helper Bar */}
      <div className="px-5 py-2 bg-[#090d16]/80 border-b border-[#1f2942] flex items-center justify-between text-[11px] text-gray-400">
        <div className="flex items-center gap-2 font-mono">
          <span>File: {filePath || "~/.ssh/config"}</span>
          {isModified && (
            <span className="text-amber-400 font-sans font-semibold text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
              ● Unsaved Changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Automatic backup snapshot created before every modification</span>
        </div>
      </div>

      {restoreSuccessMsg && (
        <div className="px-5 py-2 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{restoreSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="px-5 py-2 bg-rose-500/10 border-b border-rose-500/30 text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Code Editor Textarea */}
      <div className="flex-1 p-5 overflow-hidden">
        <div className="h-full bg-[#05070c] border border-[#1f2942] rounded-xl overflow-hidden flex flex-col shadow-inner">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            placeholder="# ~/.ssh/config"
            className="flex-1 w-full p-4 bg-transparent text-emerald-400 font-mono text-xs focus:outline-none resize-none leading-relaxed select-text"
          />
        </div>
      </div>

      {/* Backups & Snapshots Modal */}
      {isBackupsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0c101a] border border-[#1f2942] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#1f2942] bg-[#090d16] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Config Backup Snapshots</h3>
                  <p className="text-[10px] text-gray-400">
                    Automatic timestamped snapshots stored in ~/.ssh/
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={loadBackups}
                  disabled={isLoadingBackups}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-[#161d30] rounded-lg transition-colors cursor-pointer"
                  title="Refresh list"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isLoadingBackups ? "animate-spin" : ""}`}
                  />
                </button>
                <button
                  onClick={() => setIsBackupsModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-[#161d30] rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Backups List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-[#1f2942]/40">
              {isLoadingBackups ? (
                <div className="p-8 text-center text-gray-500">Loading snapshots...</div>
              ) : backups.length === 0 ? (
                <div className="p-8 text-center text-gray-500 space-y-1">
                  <div className="font-medium">No previous backup snapshots found.</div>
                  <div className="text-[11px] text-gray-600">
                    Snapshots are automatically created each time you save ~/.ssh/config.
                  </div>
                </div>
              ) : (
                backups.map((b) => (
                  <div
                    key={b}
                    className="pt-2 first:pt-0 flex items-center justify-between gap-3 p-2.5 bg-[#070a10] hover:bg-[#0f1422] border border-[#1f2942] rounded-xl transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white font-mono text-xs">
                          {b}
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-400/90 font-medium">
                        {formatBackupTime(b)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestoreBackup(b)}
                      disabled={restoringBackup === b}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      <span>{restoringBackup === b ? "Restoring..." : "Restore"}</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#1f2942] bg-[#090d16] flex justify-end">
              <button
                onClick={() => setIsBackupsModalOpen(false)}
                className="px-4 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-lg font-medium text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
