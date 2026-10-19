import React, { useState } from "react";
import { BsTrash3 } from "react-icons/bs";
import { SshHost, SshKeyInfo } from "../types";
import { Button, Dialog, Group, Row } from "./ui";

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
    <Dialog
      title="Delete host?"
      subtitle="Removes this entry from ~/.ssh/config"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger" icon={<BsTrash3 />} onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Host"}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-[13px]">
        <Group>
          <Row label="Alias">{host.host_pattern}</Row>
          <Row label="Destination">
            {host.user ? `${host.user}@` : ""}
            {host.host_name || "alias"}
            {host.port && host.port !== 22 ? `:${host.port}` : ""}
          </Row>
          {host.identity_file && (
            <Row label="Key">
              {keyFileName}
              {matchedKey ? ` (${matchedKey.key_type.toUpperCase()})` : ""}
            </Row>
          )}
          {host.proxy_jump && <Row label="Jump host">{host.proxy_jump}</Row>}
          {host.local_forward && host.local_forward.length > 0 && (
            <Row label="Port forwards">{host.local_forward.length}</Row>
          )}
        </Group>

        <p className="text-label-2 leading-relaxed">
          {host.identity_file && (
            <>
              The key <code className="font-mono text-label">{keyFileName}</code> stays on disk; only the config entry is
              removed.{" "}
            </>
          )}
          A backup of <code className="font-mono text-label">~/.ssh/config</code> is saved first, and you can undo right
          after deleting.
        </p>
      </div>
    </Dialog>
  );
};
