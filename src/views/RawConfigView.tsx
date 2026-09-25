import React, { useState, useEffect } from "react";
import {
  BsFileEarmarkCode,
  BsSave,
  BsArrowCounterclockwise,
  BsCheckLg,
  BsExclamationCircleFill,
  BsClock,
  BsClockHistory,
  BsXLg,
  BsArrowClockwise,
  BsArchive,
  BsShieldCheck,
  BsEye,
} from "react-icons/bs";
import { api } from "../api";
import { SshxBackupInfo } from "../types";

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
  const [backups, setBackups] = useState<SshxBackupInfo[]>([]);
  const [isBackupsModalOpen, setIsBackupsModalOpen] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);
  const [previewBackup, setPreviewBackup] = useState<{ name: string; content: string } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const formatBackupTime = (b: SshxBackupInfo) => {
    if (!b.modified_timestamp) return "";
    const d = new Date(b.modified_timestamp * 1000);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

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

  const handlePreview = async (backupName: string) => {
    setIsLoadingPreview(true);
    try {
      const content = await api.readBackupPreview(backupName);
      setPreviewBackup({ name: backupName, content });
    } catch (e: any) {
      alert(`Failed to load backup preview: ${e}`);
    } finally {
      setIsLoadingPreview(false);
    }
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
      setPreviewBackup(null);
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

  return (
    <div className="h-full flex flex-col bg-[#070a10] text-xs select-none overflow-hidden">
      {/* Top Header */}
      <div className="px-3.5 py-1.5 border-b border-[#1f2942] bg-[#090d16] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <BsFileEarmarkCode className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Raw ~/.ssh/config Editor</h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Backups Button */}
          <button
            onClick={handleOpenBackups}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-md border border-[#232f4d] font-medium text-xs transition-colors cursor-pointer"
            title="View automated backup snapshots"
          >
            <BsClockHistory className="w-3.5 h-3.5 text-amber-400" />
            <span>Snapshots</span>
          </button>

          {isModified && (
            <button
              onClick={handleRevert}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-md border border-[#232f4d] font-medium text-xs transition-colors cursor-pointer"
            >
              <BsArrowCounterclockwise className="w-3.5 h-3.5" />
              <span>Revert</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving || !isModified}
            className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-md font-semibold text-xs transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {saveSuccess ? (
              <BsCheckLg className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <BsSave className="w-3.5 h-3.5" />
            )}
            <span>{saveSuccess ? "Saved!" : isSaving ? "Saving..." : "Save (⌘S)"}</span>
          </button>
        </div>
      </div>

      {/* Helper Bar */}
      <div className="px-3.5 py-1 bg-[#090d16]/80 border-b border-[#1f2942] flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2 font-mono">
          <span>File: {filePath || "~/.ssh/config"}</span>
          {isModified && (
            <span className="text-amber-400 font-sans font-semibold text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 leading-none">
              ● Unsaved Changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <BsClock className="w-3.5 h-3.5" />
          <span>Auto-backup snapshot saved on write</span>
        </div>
      </div>

      {restoreSuccessMsg && (
        <div className="px-3 py-1 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
          <BsCheckLg className="w-3.5 h-3.5 text-emerald-400" />
          <span>{restoreSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="px-3 py-1 bg-rose-500/10 border-b border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5">
          <BsExclamationCircleFill className="w-3.5 h-3.5 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Code Editor Textarea */}
      <div className="flex-1 p-2.5 overflow-hidden">
        <div className="h-full bg-[#05070c] border border-[#1f2942] rounded-lg overflow-hidden flex flex-col shadow-inner">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            placeholder="# ~/.ssh/config"
            className="flex-1 w-full p-3 bg-transparent text-emerald-400 font-mono text-xs focus:outline-none resize-none leading-relaxed select-text"
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
                  <BsClockHistory className="w-4 h-4" />
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
                  <BsArrowClockwise
                    className={`w-3.5 h-3.5 ${isLoadingBackups ? "animate-spin" : ""}`}
                  />
                </button>
                <button
                  onClick={() => setIsBackupsModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-[#161d30] rounded-lg transition-colors cursor-pointer"
                >
                  <BsXLg className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Backups List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {isLoadingBackups ? (
                <div className="p-8 text-center text-gray-500">Loading snapshots...</div>
              ) : backups.length === 0 ? (
                <div className="p-8 text-center text-gray-500 space-y-1">
                  <div className="font-medium">No previous backup snapshots found.</div>
                  <div className="text-[11px] text-gray-600">
                    sshX automatically maintains a single clean snapshot (`config.sshx.bak`) on each edit.
                  </div>
                </div>
              ) : (
                backups.map((b) => (
                  <div
                    key={b.filename}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                      b.is_primary
                        ? "bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/60 shadow-sm"
                        : "bg-[#070a10] hover:bg-[#0f1422] border-[#1f2942]"
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white font-mono text-xs">
                          {b.filename}
                        </span>
                        {b.is_primary ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <BsShieldCheck className="w-3 h-3 text-emerald-400" />
                            sshX Device Snapshot (Latest)
                          </span>
                        ) : b.filename === "config.sshx.bak.previous" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Previous Snapshot
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono">
                        <span className="flex items-center gap-1 text-gray-300">
                          <BsClock className="w-3 h-3 text-amber-400/80" />
                          {formatBackupTime(b)}
                        </span>
                        <span>•</span>
                        <span>{formatSize(b.size_bytes)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handlePreview(b.filename)}
                        disabled={isLoadingPreview}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 hover:text-white border border-[#232f4d] rounded-lg font-medium text-[11px] transition-colors cursor-pointer"
                        title="Preview contents"
                      >
                        <BsEye className="w-3 h-3 text-cyan-400" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => handleRestoreBackup(b.filename)}
                        disabled={restoringBackup === b.filename}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                      >
                        <BsArchive className="w-3.5 h-3.5" />
                        <span>{restoringBackup === b.filename ? "Restoring..." : "Restore"}</span>
                      </button>
                    </div>
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

      {/* Snapshot Preview Modal */}
      {previewBackup && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0c101a] border border-[#1f2942] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#1f2942] bg-[#090d16] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <BsEye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Snapshot Preview</h3>
                  <p className="text-[10px] text-gray-400 font-mono">
                    ~/.ssh/{previewBackup.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewBackup(null)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-[#161d30] rounded-lg transition-colors cursor-pointer"
              >
                <BsXLg className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-3 overflow-hidden">
              <pre className="h-full max-h-[50vh] p-3 bg-[#05070c] border border-[#1f2942] rounded-lg overflow-y-auto text-emerald-400 font-mono text-xs leading-relaxed select-text">
                {previewBackup.content || "# (Empty file)"}
              </pre>
            </div>

            <div className="p-3 border-t border-[#1f2942] bg-[#090d16] flex items-center justify-between">
              <button
                onClick={() => setPreviewBackup(null)}
                className="px-4 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-lg font-medium text-xs transition-colors cursor-pointer"
              >
                Close Preview
              </button>

              <button
                onClick={() => handleRestoreBackup(previewBackup.name)}
                disabled={restoringBackup === previewBackup.name}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                <BsArchive className="w-3.5 h-3.5" />
                <span>Restore This Snapshot</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
