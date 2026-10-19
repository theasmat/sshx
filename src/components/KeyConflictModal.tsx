import React from "react";
import { Button, Dialog } from "./ui";
import { SshKeyInfo } from "../types";

interface KeyConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflictKeyName: string;
  uniqueSuggestionName: string;
  existingKey?: SshKeyInfo;
  onAutoResolve: (uniqueName: string) => void;
  onManualSelect: () => void;
  onForceUseExisting: (existingKey: SshKeyInfo) => void;
}

export const KeyConflictModal: React.FC<KeyConflictModalProps> = ({
  isOpen,
  onClose,
  conflictKeyName,
  uniqueSuggestionName,
  existingKey,
  onAutoResolve,
  onManualSelect,
  onForceUseExisting,
}) => {
  if (!isOpen) return null;

  const Option: React.FC<{ title: string; body: React.ReactNode; onClick: () => void; recommended?: boolean }> = ({
    title,
    body,
    onClick,
    recommended,
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3 hover:bg-white/[0.05] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/70"
    >
      <div className="flex items-center gap-2 text-label font-medium">
        {title}
        {recommended && <span className="text-[11px] font-normal text-accent">Recommended</span>}
      </div>
      <div className="text-label-2 text-xs mt-0.5 leading-relaxed">{body}</div>
    </button>
  );

  return (
    <Dialog
      title="Key name already exists"
      subtitle={`~/.ssh/${conflictKeyName}`}
      onClose={onClose}
      footer={<Button onClick={onClose}>Cancel</Button>}
    >
      <div className="space-y-3 text-[13px]">
        <p className="text-label-2 leading-relaxed">
          A key named <code className="font-mono text-label">{conflictKeyName}</code> is already in your{" "}
          <code className="font-mono text-label">~/.ssh/</code> folder. How should SSHX continue?
        </p>
        <div className="rounded-card bg-card divide-y divide-white/[0.06] overflow-hidden">
          <Option
            recommended
            title="Create a new key"
            onClick={() => onAutoResolve(uniqueSuggestionName)}
            body={
              <>
                Generates <code className="font-mono text-label-2">~/.ssh/{uniqueSuggestionName}</code>
              </>
            }
          />
          {existingKey && (
            <Option
              title="Use the existing key"
              onClick={() => onForceUseExisting(existingKey)}
              body={<>Links <code className="font-mono text-label-2">{conflictKeyName}</code> to this host without creating a file.</>}
            />
          )}
          <Option
            title="Choose something else"
            onClick={onManualSelect}
            body="Pick a different key from ~/.ssh/ or type your own filename."
          />
        </div>
      </div>
    </Dialog>
  );
};
