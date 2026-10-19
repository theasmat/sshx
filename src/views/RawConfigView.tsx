import { askConfirm } from "../utils/confirm";
import { toast } from "../utils/toast";
import React, { useState, useEffect } from "react";
import { Button, Badge, Dialog } from "../components/ui";
import {
  BsSave,
  BsArrowCounterclockwise,
  BsCheckLg,
  BsExclamationCircleFill,
  BsClock,
  BsClockHistory,
  BsArrowClockwise,
  BsArchive,
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
      toast.error(`Failed to load backup preview: ${e}`);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleRestoreBackup = async (backupName: string) => {
    const ok = await askConfirm({
      title: "Restore backup?",
      message: `Restore '${backupName}'?\nThis will replace your current ~/.ssh/config.`,
      confirmLabel: "Restore",
      danger: true,
    });
    if (!ok) return;

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
      toast.error(`Failed to restore backup: ${err}`);
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

  const handleRevert = async () => {
    const ok = await askConfirm({
      title: "Discard changes?",
      message: "Discard unsaved changes and revert to the file content?",
      confirmLabel: "Discard",
      danger: true,
    });
    if (ok) setContent(initialContent);
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
    <div className="h-full flex flex-col bg-app text-[13px] select-none overflow-hidden">
      <div className="px-5 h-12 flex items-center justify-between shrink-0">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-label leading-tight">Raw Config</h2>
          <p className="text-xs text-label-3 font-mono truncate">
            {filePath || "~/.ssh/config"}
            {isModified && <span className="ml-2 text-amber-300 font-sans">Edited</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<BsClockHistory />} onClick={handleOpenBackups} title="Automatic backup snapshots">
            Snapshots
          </Button>
          {isModified && (
            <Button icon={<BsArrowCounterclockwise />} onClick={handleRevert} disabled={isSaving}>
              Revert
            </Button>
          )}
          <Button
            variant="primary"
            icon={saveSuccess ? <BsCheckLg /> : <BsSave />}
            onClick={handleSave}
            disabled={isSaving || !isModified}
          >
            {saveSuccess ? "Saved" : isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {restoreSuccessMsg && (
        <div role="status" className="mx-5 mb-2 rounded-ctl bg-emerald-500/10 text-emerald-300 px-3 py-2 flex items-center gap-2">
          <BsCheckLg className="shrink-0" />
          <span>{restoreSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div role="alert" className="mx-5 mb-2 rounded-ctl bg-rose-500/10 text-rose-300 px-3 py-2 flex items-center gap-2">
          <BsExclamationCircleFill className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex-1 min-h-0 px-5 pb-4 flex flex-col">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          aria-label="Raw SSH config"
          placeholder="# ~/.ssh/config"
          className="flex-1 min-h-0 w-full p-4 rounded-card bg-well text-label font-mono text-xs focus:outline-none focus:ring-2 focus:ring-accent/70 resize-none leading-relaxed select-text"
        />
        <p className="mt-2 px-1 text-xs text-label-3 flex items-center gap-1.5">
          <BsClock /> A backup snapshot is saved automatically on every write. Save with ⌘S.
        </p>
      </div>

      {isBackupsModalOpen && (
        <Dialog
          title="Config Snapshots"
          subtitle="Automatic backups stored in ~/.ssh/"
          onClose={() => setIsBackupsModalOpen(false)}
          footer={
            <>
              <Button icon={<BsArrowClockwise className={isLoadingBackups ? "animate-spin" : ""} />} onClick={loadBackups} disabled={isLoadingBackups}>
                Refresh
              </Button>
              <Button variant="primary" onClick={() => setIsBackupsModalOpen(false)}>
                Done
              </Button>
            </>
          }
        >
          {isLoadingBackups ? (
            <div className="py-8 text-center text-label-3">Loading snapshots...</div>
          ) : backups.length === 0 ? (
            <div className="py-8 text-center text-label-3 space-y-1">
              <div className="text-label-2">No snapshots yet</div>
              <div className="text-xs">sshX keeps a snapshot (config.sshx.bak) each time you save.</div>
            </div>
          ) : (
            <div className="rounded-card bg-card divide-y divide-white/[0.06] overflow-hidden">
              {backups.map((b) => (
                <div key={b.filename} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-label truncate">{b.filename}</div>
                    <div className="text-xs text-label-2 flex items-center gap-2">
                      <span>{formatBackupTime(b)}</span>
                      <span>·</span>
                      <span>{formatSize(b.size_bytes)}</span>
                      {b.is_primary && <Badge tone="ok">Latest</Badge>}
                      {b.filename === "config.sshx.bak.previous" && <Badge>Previous</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handlePreview(b.filename)}
                      disabled={isLoadingPreview}
                      className="text-accent hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleRestoreBackup(b.filename)}
                      disabled={restoringBackup === b.filename}
                      className="text-accent hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {restoringBackup === b.filename ? "Restoring..." : "Restore"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Dialog>
      )}

      {previewBackup && (
        <Dialog
          size="lg"
          title="Snapshot Preview"
          subtitle={`~/.ssh/${previewBackup.name}`}
          onClose={() => setPreviewBackup(null)}
          footer={
            <>
              <Button onClick={() => setPreviewBackup(null)}>Close</Button>
              <Button
                variant="primary"
                icon={<BsArchive />}
                onClick={() => handleRestoreBackup(previewBackup.name)}
                disabled={restoringBackup === previewBackup.name}
              >
                Restore This Snapshot
              </Button>
            </>
          }
        >
          <pre className="max-h-[50vh] p-4 bg-well rounded-card overflow-y-auto text-label font-mono text-xs leading-relaxed select-text">
            {previewBackup.content || "# (Empty file)"}
          </pre>
        </Dialog>
      )}
    </div>
  );
};
