import React, { useState, useMemo } from "react";
import {
  BsTrash3,
  BsExclamationTriangleFill,
  BsXLg,
  BsKeyFill,
  BsFolder2Open,
  BsCheckSquareFill,
  BsSquare,
  BsArrowRepeat,
  BsCheckCircleFill,
  BsShieldExclamation,
  BsServer,
} from "react-icons/bs";
import { SshKeyInfo, SshHost } from "../types";
import { api } from "../api";
import { BrandLogo } from "./BrandLogo";

interface DeleteKeyConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyInfo: SshKeyInfo | null;
  hosts: SshHost[];
  onKeyDeleted: (keyPath: string) => void;
}

export const DeleteKeyConfirmationModal: React.FC<DeleteKeyConfirmationModalProps> = ({
  isOpen,
  onClose,
  keyInfo,
  hosts,
  onKeyDeleted,
}) => {
  const [unlinkHosts, setUnlinkHosts] = useState(true);
  const [confirmedRisk, setConfirmedRisk] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Find all hosts that use this key
  const dependentHosts = useMemo(() => {
    if (!keyInfo) return [];
    const targetPath = keyInfo.private_path;
    const targetName = keyInfo.file_name;

    return hosts.filter((h) => {
      if (!h.identity_file) return false;
      const idFile = h.identity_file.trim();
      const idName = idFile.split("/").pop() || idFile;

      return (
        idFile === targetPath ||
        idFile === `~/.ssh/${targetName}` ||
        idName === targetName ||
        idFile.endsWith(`/${targetName}`)
      );
    });
  }, [keyInfo, hosts]);

  if (!isOpen || !keyInfo) return null;

  const hasDependencies = dependentHosts.length > 0;
  const canDelete = !hasDependencies || confirmedRisk;

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await api.deleteKey(keyInfo.private_path, unlinkHosts);
      onKeyDeleted(keyInfo.private_path);
      onClose();
    } catch (err: any) {
      alert(`Failed to delete SSH key: ${err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-[#0b0f19] border border-rose-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1f2942] bg-[#140b12] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-sm">
              <BsTrash3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Delete SSH Key</h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold border border-rose-500/30">
                  Permanent Action
                </span>
              </div>
              <p className="text-gray-400 text-[11px]">
                Review dependencies and consequences before deletion.
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
          {/* Key Summary Card */}
          <div className="p-3 bg-[#070a10] border border-[#1f2942] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BsKeyFill className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white font-mono text-xs">{keyInfo.file_name}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                {keyInfo.key_type} {keyInfo.bits ? `(${keyInfo.bits}-bit)` : ""}
              </span>
            </div>

            <div className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5 truncate">
              <BsFolder2Open className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span className="truncate">{keyInfo.private_path}</span>
            </div>

            {keyInfo.fingerprint_sha256 && (
              <div className="text-[10px] font-mono text-gray-500 truncate">
                Fingerprint: {keyInfo.fingerprint_sha256}
              </div>
            )}
          </div>

          {/* Impact & Dependency Analysis */}
          {hasDependencies ? (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <BsShieldExclamation className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Impact Warning: Used by {dependentHosts.length} Host {dependentHosts.length === 1 ? "Profile" : "Profiles"}</span>
              </div>

              <p className="text-gray-300 text-[11px] leading-relaxed">
                The following SSH host configurations are currently linked to this private key. Deleting it will cause connection authentication to fail for these hosts.
              </p>

              {/* List of Affected Hosts */}
              <div className="bg-[#070a10] border border-rose-500/20 rounded-lg divide-y divide-[#1f2942] max-h-36 overflow-y-auto">
                {dependentHosts.map((h) => (
                  <div key={h.id} className="p-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <BrandLogo
                        name={h.host_pattern}
                        hostName={h.host_name}
                        tags={h.tags}
                        className="w-3.5 h-3.5"
                        fallbackIcon={<BsServer className="w-3.5 h-3.5 text-gray-400" />}
                      />
                      <span className="font-bold text-white text-xs truncate">{h.host_pattern}</span>
                    </div>

                    <div className="text-[10px] font-mono text-gray-400 truncate">
                      {h.user ? `${h.user}@` : ""}{h.host_name || "alias"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Unlink Checkbox Option */}
              <div
                onClick={() => setUnlinkHosts(!unlinkHosts)}
                className="flex items-start gap-2 pt-1 cursor-pointer select-none"
              >
                <div className="mt-0.5">
                  {unlinkHosts ? (
                    <BsCheckSquareFill className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <BsSquare className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </div>
                <div className="text-[11px] text-gray-300 leading-tight">
                  <span className="font-medium text-white">Unlink from affected host configurations</span>
                  <span className="block text-[10px] text-gray-400">
                    Removes the IdentityFile line from ~/.ssh/config so hosts fall back to default agent keys.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs">
              <BsCheckCircleFill className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No active host profiles in ~/.ssh/config depend on this key.</span>
            </div>
          )}

          {/* Deletion Scope Explanation */}
          <div className="p-3 bg-[#070a10] border border-[#1f2942] rounded-xl space-y-1.5 text-gray-400 text-[11px]">
            <div className="font-semibold text-gray-300 flex items-center gap-1.5">
              <BsExclamationTriangleFill className="w-3 h-3 text-amber-400" />
              <span>Consequences of Deletion</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[10px] text-gray-400">
              <li>The private key file (<code className="text-gray-300 font-mono">{keyInfo.file_name}</code>) will be permanently deleted from disk.</li>
              <li>The corresponding public key (<code className="text-gray-300 font-mono">{keyInfo.file_name}.pub</code>) will also be deleted.</li>
              <li>The key will be removed from your active <code className="text-gray-300 font-mono">ssh-agent</code> keyring.</li>
            </ul>
          </div>

          {/* Risk Confirmation Checkbox (if has dependencies) */}
          {hasDependencies && (
            <div
              onClick={() => setConfirmedRisk(!confirmedRisk)}
              className="p-2.5 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div>
                {confirmedRisk ? (
                  <BsCheckSquareFill className="w-4 h-4 text-rose-400" />
                ) : (
                  <BsSquare className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <span className="text-xs text-rose-300 font-medium">
                I understand that deleting this key may break access to the {dependentHosts.length} connected hosts.
              </span>
            </div>
          )}
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
            disabled={!canDelete || isDeleting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isDeleting ? (
              <>
                <BsArrowRepeat className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting Key...</span>
              </>
            ) : (
              <>
                <BsTrash3 className="w-3.5 h-3.5" />
                <span>Delete Key Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
