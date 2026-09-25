import React, { useState } from "react";
import {
  BsTrash3,
  BsXLg,
  BsServer,
  BsKeyFill,
  BsShieldLock,
  BsArrowLeftRight,
  BsShieldCheck,
  BsArrowRepeat,
  BsExclamationTriangleFill,
} from "react-icons/bs";
import { SshHost, SshKeyInfo } from "../types";
import { BrandLogo } from "./BrandLogo";

interface DeleteHostConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  host: SshHost | null;
  keys?: SshKeyInfo[];
  onConfirmDelete: (host: SshHost) => Promise<void>;
}

export const DeleteHostConfirmationModal: React.FC<DeleteHostConfirmationModalProps> = ({
  isOpen,
  onClose,
  host,
  keys = [],
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !host) return null;

  const keyFileName = host.identity_file
    ? host.identity_file.split("/").pop()
    : null;

  const matchedKey = keyFileName
    ? keys.find(
        (k) =>
          k.file_name === keyFileName ||
          k.private_path === host.identity_file ||
          k.private_path.endsWith(`/${keyFileName}`)
      )
    : null;

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirmDelete(host);
      onClose();
    } catch (err) {
      console.error("Failed to delete host:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-[#0b0f19] border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1f2942] bg-[#140b12] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-sm">
              <BsTrash3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Delete SSH Host</h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold border border-rose-500/30">
                  Config Removal
                </span>
              </div>
              <p className="text-gray-400 text-[11px]">
                Remove this host entry from ~/.ssh/config
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <BsXLg className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
          {/* Host Summary Card */}
          <div className="p-3.5 bg-[#070a10] border border-[#1f2942] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <BrandLogo
                  name={host.host_pattern}
                  hostName={host.host_name}
                  tags={host.tags}
                  group={host.group}
                  className="w-4 h-4"
                  fallbackIcon={<BsServer className="w-4 h-4 text-gray-400" />}
                />
                <span className="font-bold text-white font-mono text-sm truncate">
                  {host.host_pattern}
                </span>
              </div>
              {host.group && (
                <span className="px-2 py-0.5 rounded bg-[#101726] text-gray-300 border border-[#1e293b] text-[10px]">
                  {host.group}
                </span>
              )}
            </div>

            <div className="text-[11px] font-mono text-gray-300 bg-[#0e1422] p-2 rounded-lg border border-[#1c263c] space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Destination:</span>
                <span className="text-gray-200">
                  {host.user ? `${host.user}@` : ""}{host.host_name || "alias"}
                  {host.port && host.port !== 22 ? `:${host.port}` : ""}
                </span>
              </div>
              {host.identity_file && (
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-gray-500 flex items-center gap-1">
                    <BsKeyFill className="w-3 h-3 text-blue-400" />
                    Key:
                  </span>
                  <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                    <span className="text-blue-300 truncate">
                      {keyFileName}
                    </span>
                    {matchedKey && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono font-bold uppercase">
                        {matchedKey.key_type}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {host.proxy_jump && (
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-gray-500 flex items-center gap-1">
                    <BsShieldLock className="w-3 h-3 text-purple-400" />
                    ProxyJump:
                  </span>
                  <span className="text-purple-300 truncate max-w-[200px]">
                    {host.proxy_jump}
                  </span>
                </div>
              )}
              {host.local_forward && host.local_forward.length > 0 && (
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-gray-500 flex items-center gap-1">
                    <BsArrowLeftRight className="w-3 h-3 text-emerald-400" />
                    Port Forwards:
                  </span>
                  <span className="text-emerald-300">
                    {host.local_forward.length} rule(s)
                  </span>
                </div>
              )}
            </div>

            {host.tags && host.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap pt-1">
                {host.tags.map((t) => (
                  <span
                    key={t}
                    className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono border border-blue-500/20"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Key Safety Notice */}
          {host.identity_file && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/25 rounded-xl flex items-start gap-2.5 text-blue-300 text-[11px]">
              <BsShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Your SSH Key Remains Safe:</span>
                <p className="text-gray-300 text-[10px] mt-0.5 leading-relaxed">
                  Only the configuration entry for this host will be removed. The private key (<code className="text-blue-300 font-mono">{keyFileName}</code>) will remain untouched on disk.
                </p>
              </div>
            </div>
          )}

          {/* Auto-Backup Reassurance */}
          <div className="p-3 bg-[#070a10] border border-[#1f2942] rounded-xl flex items-start gap-2.5 text-gray-400 text-[11px]">
            <BsExclamationTriangleFill className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-200">Reversible Action</span>
              <p className="text-gray-400 text-[10px] mt-0.5 leading-relaxed">
                A timestamped snapshot of your <code className="text-gray-300 font-mono">~/.ssh/config</code> will be saved automatically. You can restore this host anytime from Settings &gt; Backups.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1f2942] bg-[#0e1422] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-lg border border-[#232f4d] font-medium text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isDeleting ? (
              <>
                <BsArrowRepeat className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting Host...</span>
              </>
            ) : (
              <>
                <BsTrash3 className="w-3.5 h-3.5" />
                <span>Delete Host</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
