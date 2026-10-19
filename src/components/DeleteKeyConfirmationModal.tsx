import { hostsUsingKey } from "../utils/keyUtils";
import { toast } from "../utils/toast";
import React, { useState, useMemo } from "react";
import { BsTrash3 } from "react-icons/bs";
import { SshKeyInfo, SshHost } from "../types";
import { api } from "../api";
import { Button, Dialog, Group, Row } from "./ui";

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
    return hostsUsingKey(keyInfo, hosts);
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
      toast.error(`Failed to delete SSH key: ${err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      title="Delete key?"
      subtitle="This cannot be undone"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger" icon={<BsTrash3 />} onClick={handleDelete} disabled={!canDelete || isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Key"}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-[13px]">
        <Group>
          <Row label="Key">{keyInfo.file_name}</Row>
          <Row label="Type">
            {keyInfo.key_type.toUpperCase()}
            {keyInfo.bits ? ` ${keyInfo.bits}-bit` : ""}
          </Row>
          <Row label="Path">{keyInfo.private_path}</Row>
        </Group>

        {hasDependencies ? (
          <div className="rounded-card bg-rose-500/10 px-4 py-3 space-y-3">
            <div className="font-medium text-rose-200">
              Used by {dependentHosts.length} {dependentHosts.length === 1 ? "host" : "hosts"}
            </div>
            <p className="text-label-2 leading-relaxed">
              Deleting this key will make authentication fail for:
            </p>
            <ul className="font-mono text-xs text-label space-y-0.5 max-h-32 overflow-y-auto">
              {dependentHosts.map((h) => (
                <li key={h.id}>
                  {h.host_pattern}
                  <span className="text-label-3">
                    {" "}
                    · {h.user ? `${h.user}@` : ""}
                    {h.host_name || "alias"}
                  </span>
                </li>
              ))}
            </ul>
            <label className="flex items-start gap-2 cursor-pointer text-label-2">
              <input
                type="checkbox"
                checked={unlinkHosts}
                onChange={(e) => setUnlinkHosts(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#0a84ff] cursor-pointer"
              />
              <span>
                <span className="text-label">Also remove the IdentityFile line from these hosts</span>
                <span className="block text-xs text-label-3">They will fall back to your default agent keys.</span>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer text-rose-200">
              <input
                type="checkbox"
                checked={confirmedRisk}
                onChange={(e) => setConfirmedRisk(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#f43f5e] cursor-pointer"
              />
              <span>I understand this may break access to {dependentHosts.length} connected {dependentHosts.length === 1 ? "host" : "hosts"}.</span>
            </label>
          </div>
        ) : (
          <div role="status" className="rounded-card bg-emerald-500/10 text-emerald-300 px-4 py-3">
            No host in ~/.ssh/config uses this key.
          </div>
        )}

        <ul className="list-disc list-inside space-y-1 text-label-3 text-xs">
          <li>
            The private key <code className="font-mono text-label-2">{keyInfo.file_name}</code> and its{" "}
            <code className="font-mono text-label-2">.pub</code> file are deleted from disk.
          </li>
          <li>
            The key is removed from your <code className="font-mono text-label-2">ssh-agent</code>.
          </li>
        </ul>
      </div>
    </Dialog>
  );
};
