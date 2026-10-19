import { toast } from "../utils/toast";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BsKeyFill,
  BsCheckCircleFill,
} from "react-icons/bs";
import { Button, Badge, Segmented, Switch } from "./ui";
import { SshHost, SshKeyInfo, PresetTemplate } from "../types";
import { api } from "../api";
import {
  isKeyNameDuplicate,
  findMatchingExistingKey,
  getUniqueKeyName,
  suggestKeyName,
  suggestKeyComment,
  keyNameAlternatives,
  hostsUsingKey,
  keyConflictHosts,
} from "../utils/keyUtils";

interface KeyAuthCardProps {
  identityFile: string;
  identitiesOnly: boolean;
  onChangeIdentity: (identityFile: string, identitiesOnly: boolean) => void;
  availableKeys: SshKeyInfo[];
  hostPattern: string;
  hostName?: string | null;
  /** Account label (e.g. "work") used to name the key and its comment. */
  account?: string | null;
  preset?: PresetTemplate | null;
  /** How this host authenticates: its own new account/key, an existing key, or agent defaults. */
  mode: KeyMode;
  onModeChange: (mode: KeyMode) => void;
  existingHosts: SshHost[];
  currentHostId?: string;
  hostAccounts?: Record<string, string>;
  /** Git providers allow one key per account, so reusing a key on the same server needs an explicit override. */
  isGit: boolean;
  allowShared: boolean;
  onAllowSharedChange: (v: boolean) => void;
  onRefreshKeys: () => void;
  onOpenConflictModal: (conflictData: {
    conflictKeyName: string;
    uniqueSuggestionName: string;
    existingKey?: SshKeyInfo;
  }) => void;
  onOpenGuideModal: (keyInfo: SshKeyInfo | null, pubKey: string) => void;
}

export type KeyMode = "identity" | "new" | "existing" | "agent";

export const KeyAuthCard: React.FC<KeyAuthCardProps> = ({
  identityFile,
  identitiesOnly,
  onChangeIdentity,
  availableKeys,
  hostPattern,
  hostName,
  account,
  preset,
  mode,
  onModeChange,
  existingHosts,
  currentHostId,
  hostAccounts,
  isGit,
  allowShared,
  onAllowSharedChange,
  onRefreshKeys,
  onOpenConflictModal,
  onOpenGuideModal,
}) => {
  const [showReplaceForm, setShowReplaceForm] = useState(false);
  const [genKeyName, setGenKeyName] = useState("");
  const [genKeyComment, setGenKeyComment] = useState("");
  const [genKeyType, setGenKeyType] = useState<"ed25519" | "rsa">("ed25519");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Re-suggest the name/comment as alias, address or account change, until the user edits them.
  const nameTouched = useRef(false);
  const commentTouched = useRef(false);
  const nameCtx = useMemo(
    () => ({ alias: hostPattern, hostName, account, keyType: genKeyType }),
    [hostPattern, hostName, account, genKeyType]
  );

  useEffect(() => {
    if (preset?.keyRecommendation && !account) {
      if (!nameTouched.current) setGenKeyName(getUniqueKeyName(preset.keyRecommendation.keyName, availableKeys));
      if (!commentTouched.current) setGenKeyComment(preset.keyRecommendation.comment || `${hostPattern}@sshx`);
      setGenKeyType(preset.keyRecommendation.keyType);
      return;
    }
    if (!nameTouched.current) {
      setGenKeyName(
        hostPattern.trim()
          ? suggestKeyName(nameCtx, availableKeys)
          : getUniqueKeyName("id_ed25519_custom", availableKeys)
      );
    }
    if (!commentTouched.current) {
      setGenKeyComment(hostPattern.trim() ? suggestKeyComment(nameCtx) : "");
    }
  }, [hostPattern, preset, availableKeys, nameCtx]);

  const alternatives = useMemo(
    () => (hostPattern.trim() ? keyNameAlternatives(nameCtx, availableKeys) : []),
    [hostPattern, nameCtx, availableKeys]
  );

  // Find currently connected key object if present
  const connectedKeyObj = useMemo(() => {
    if (!identityFile) return null;
    return (
      availableKeys.find((k) => k.private_path === identityFile) || {
        file_name: identityFile.split("/").pop() || identityFile,
        private_path: identityFile,
        public_path: `${identityFile}.pub`,
        key_type: identityFile.includes("ed25519") ? "ed25519" : "rsa",
        bits: 256,
        fingerprint_sha256: "",
        comment: "",
        is_agent_loaded: true,
      }
    );
  }, [identityFile, availableKeys]);

  // Duplicate collision detection
  const isDuplicate = useMemo(
    () => isKeyNameDuplicate(genKeyName, availableKeys),
    [genKeyName, availableKeys]
  );

  const matchingExistingKey = useMemo(
    () => findMatchingExistingKey(genKeyName, availableKeys),
    [genKeyName, availableKeys]
  );

  const uniqueSuggestion = useMemo(
    () => getUniqueKeyName(genKeyName, availableKeys),
    [genKeyName, availableKeys]
  );

  // Public key content
  const currentPubKey =
    connectedKeyObj?.public_key_content ||
    `ssh-ed25519 AAAA... ${connectedKeyObj?.comment || hostPattern || "key"}`;

  const handleCopyPubKey = () => {
    if (connectedKeyObj?.public_key_content) {
      navigator.clipboard.writeText(connectedKeyObj.public_key_content);
    } else {
      navigator.clipboard.writeText(currentPubKey);
    }
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Generate or Re-generate Handler
  const handleGenerateKey = async () => {
    if (!genKeyName.trim()) return;

    // If duplicate, prompt 3-option modal before doing anything destructive
    if (isDuplicate) {
      onOpenConflictModal({
        conflictKeyName: genKeyName.trim(),
        uniqueSuggestionName: uniqueSuggestion,
        existingKey: matchingExistingKey,
      });
      return;
    }

    setIsGenerating(true);
    setSuccessMsg(null);
    try {
      const result = await api.generateKey({
        name: genKeyName.trim(),
        key_type: genKeyType,
        bits: genKeyType === "rsa" ? 4096 : undefined,
        comment: genKeyComment.trim() || `${genKeyName.trim()}@sshx`,
      });

      const newKeyObj: SshKeyInfo = {
        file_name: result.file_name,
        private_path: result.private_path,
        public_path: result.public_path,
        key_type: genKeyType,
        bits: genKeyType === "rsa" ? 4096 : 256,
        fingerprint_sha256: result.fingerprint_sha256 || "",
        comment: genKeyComment.trim() || `${genKeyName.trim()}@sshx`,
        public_key_content: result.public_key_content,
        is_agent_loaded: true,
      };

      onChangeIdentity(result.private_path, true);
      setSuccessMsg(`Key ~/.ssh/${result.file_name} generated & connected!`);
      setShowReplaceForm(false);
      onRefreshKeys();

      // Show Setup Guidance Modal
      onOpenGuideModal(newKeyObj, result.public_key_content || "");
    } catch (err: any) {
      toast.error(`Key generation failed: ${err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const usersOf = (k: Pick<SshKeyInfo, "private_path" | "file_name">) =>
    hostsUsingKey(k, existingHosts).filter((h) => h.id !== currentHostId);
  const describeUsers = (hs: SshHost[]) =>
    hs.map((h) => `${h.host_pattern.split(/\s+/)[0]}${hostAccounts?.[h.id] ? ` @${hostAccounts[h.id]}` : ""}`).join(", ");
  const conflicts = identityFile ? keyConflictHosts(identityFile, hostName, existingHosts, currentHostId) : [];
  const blockedShare = mode === "existing" && isGit && conflicts.length > 0 && !allowShared;

  const selectMode = (m: KeyMode) => {
    if (m === mode) return;
    onModeChange(m);
    setShowReplaceForm(false);
    if (m === "agent") onChangeIdentity("", false);
    // A new identity must never inherit a key another host on this server already uses.
    if ((m === "identity" || m === "new") && identityFile && keyConflictHosts(identityFile, hostName, existingHosts, currentHostId).length > 0) {
      onChangeIdentity("", true);
    }
    if (m === "identity") onChangeIdentity(identityFile, true);
  };

  const showGenerator = (mode === "identity" || mode === "new") && (!identityFile || showReplaceForm);

  const modeCopy: Record<KeyMode, string> = {
    identity: "A new account on this server (for example a second GitHub account). Gets its own alias and its own key.",
    new: "Create a fresh key for this host. Use it for another machine or server on an account you already have.",
    existing: "Reuse a key that is already in ~/.ssh.",
    agent: "No key file: ssh tries the keys loaded in your agent.",
  };

  const field =
    "w-full h-8 px-2.5 rounded-ctl bg-white/[0.06] text-label placeholder-label-3 focus:outline-none focus:bg-white/[0.09] focus:ring-2 focus:ring-accent/70";

  return (
    <div className="rounded-card bg-card divide-y divide-white/[0.06] text-[13px]">
      <div className="px-4 py-3 space-y-2">
        <Segmented
          label="How should this host sign in?"
          value={mode}
          options={[
            { value: "identity" as const, label: "New identity" },
            { value: "new" as const, label: "New key" },
            { value: "existing" as const, label: "Existing key" },
            { value: "agent" as const, label: "Agent default" },
          ]}
          onChange={selectMode}
        />
        <p className="text-xs text-label-3">{modeCopy[mode]}</p>
      </div>

      {mode === "identity" && (
        <div className="px-4 py-3 space-y-1 text-xs">
          {[
            [!!account, "Account label", "Set it in the Account field above"],
            [!!hostPattern.trim(), "Alias", "Give the host its own alias"],
            [!!identityFile, "Dedicated key", "Generate it below"],
          ].map(([ok, label, todo]) => (
            <div key={String(label)} className={ok ? "text-emerald-300" : "text-label-3"}>
              {ok ? "✓" : "○"} {label as string}
              {!ok && <span className="text-label-3"> — {todo as string}</span>}
            </div>
          ))}
        </div>
      )}

      {(mode === "identity" || mode === "new" || mode === "existing") && identityFile && (
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-label">Key</span>
              <span className="font-mono text-label-2 truncate">~/.ssh/{connectedKeyObj?.file_name}</span>
              <Badge>{(connectedKeyObj?.key_type || "ed25519").toUpperCase()}</Badge>
            </div>
            {(() => {
              const others = connectedKeyObj ? usersOf(connectedKeyObj) : [];
              return others.length > 0 ? (
                <div className="text-xs text-label-3">Also used by {describeUsers(others)}</div>
              ) : (
                <div className="text-xs text-label-3">Only this host uses it.</div>
              );
            })()}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button type="button" onClick={() => onOpenGuideModal(connectedKeyObj, currentPubKey)} className="text-accent hover:underline cursor-pointer">
              Setup guide
            </button>
            <button type="button" onClick={handleCopyPubKey} className="text-accent hover:underline cursor-pointer">
              {copiedKey ? "Copied" : "Copy public key"}
            </button>
          </div>
        </div>
      )}

      {mode === "existing" && (
        <div className="px-4 py-3 space-y-2">
          <select
            aria-label="Choose existing key"
            value={identityFile}
            onChange={(e) => {
              onAllowSharedChange(false);
              onChangeIdentity(e.target.value, !!e.target.value);
            }}
            className={`${field} font-mono cursor-pointer`}
          >
            <option value="">Choose a key ({availableKeys.length})</option>
            {availableKeys.map((k) => {
              const users = usersOf(k);
              return (
                <option key={k.private_path} value={k.private_path}>
                  {k.file_name} ({k.key_type.toUpperCase()}){users.length ? ` · used by ${describeUsers(users)}` : ""}
                </option>
              );
            })}
          </select>

          {conflicts.length > 0 && (
            <div role="alert" className="rounded-ctl bg-amber-500/10 text-amber-200 px-3 py-2 text-xs space-y-1.5">
              <div>
                This key is already used by <strong>{describeUsers(conflicts)}</strong> on {hostName}.
                {isGit ? " A git provider only accepts a key on one account, so this host would log in as the same account." : ""}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button type="button" onClick={() => selectMode("identity")} className="underline cursor-pointer">
                  Create a new identity instead
                </button>
                {isGit && (
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowShared}
                      onChange={(e) => onAllowSharedChange(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[#0a84ff] cursor-pointer"
                    />
                    <span>I know, use it anyway</span>
                  </label>
                )}
              </div>
            </div>
          )}
          {blockedShare && <p className="text-xs text-label-3">Choose another key, create a new identity, or confirm the override to continue.</p>}
        </div>
      )}

      {mode !== "agent" && !(mode === "identity") && (
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-label">Use only this key</div>
            <div className="text-xs text-label-3">IdentitiesOnly: ignore other agent keys. Needed when several accounts share one server.</div>
          </div>
          <Switch label="Use only this key" checked={identitiesOnly} onChange={(v) => onChangeIdentity(identityFile, v)} />
        </div>
      )}

      {identityFile && (mode === "identity" || mode === "new") && (
        <div className="px-4 py-3 flex items-center gap-3">
          <button type="button" onClick={() => setShowReplaceForm(!showReplaceForm)} className="text-accent hover:underline cursor-pointer">
            {showReplaceForm ? "Hide generator" : "Generate a different key"}
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeIdentity("", false);
              setShowReplaceForm(false);
            }}
            className="text-rose-300 hover:underline cursor-pointer"
          >
            Unlink
          </button>
        </div>
      )}

      {showGenerator && (
        <div className="px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-label">
              <span>{mode === "identity" ? "Create this identity's key" : "Generate a key"}</span>
              {preset?.keyRecommendation && !account && <Badge tone="warn">{preset.title}</Badge>}
            </div>
            <Segmented
              label="Key type"
              value={genKeyType}
              options={[
                { value: "ed25519" as const, label: "Ed25519" },
                { value: "rsa" as const, label: "RSA 4096" },
              ]}
              onChange={setGenKeyType}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-label-3 font-mono text-xs pointer-events-none">~/.ssh/</span>
              <input
                type="text"
                aria-label="Key filename"
                placeholder="Key filename"
                value={genKeyName}
                onChange={(e) => {
                  nameTouched.current = true;
                  setGenKeyName(e.target.value);
                }}
                className={`${field} font-mono pl-14 ${isDuplicate ? "ring-2 ring-amber-400/60" : ""}`}
              />
            </div>
            <input
              type="text"
              aria-label="Key comment"
              placeholder="Comment (optional)"
              value={genKeyComment}
              onChange={(e) => {
                commentTouched.current = true;
                setGenKeyComment(e.target.value);
              }}
              className={field}
            />
          </div>

          {alternatives.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-label-3">
              <span>Other names</span>
              {alternatives.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    nameTouched.current = true;
                    setGenKeyName(n);
                  }}
                  className="h-6 px-2 rounded-full bg-white/[0.07] font-mono text-label-2 hover:text-label cursor-pointer"
                >
                  {n}
                </button>
              ))}
            </div>
          )}

          {isDuplicate && (
            <div role="status" className="rounded-ctl bg-amber-500/10 text-amber-200 px-3 py-2 text-xs flex items-center justify-between gap-2 flex-wrap">
              <span>
                <code className="font-mono">{genKeyName.trim()}</code> already exists in ~/.ssh/.
              </span>
              <button
                type="button"
                onClick={() => {
                  nameTouched.current = true;
                  setGenKeyName(uniqueSuggestion);
                }}
                className="underline cursor-pointer"
              >
                Use “{uniqueSuggestion}”
              </button>
            </div>
          )}

          <div className="flex items-center justify-end">
            <Button type="button" variant="primary" icon={<BsKeyFill />} disabled={isGenerating || isDuplicate} onClick={handleGenerateKey}>
              {isGenerating ? "Generating..." : "Generate & Link"}
            </Button>
          </div>

          {successMsg && (
            <div role="status" className="text-emerald-300 flex items-center gap-1.5 text-xs">
              <BsCheckCircleFill className="shrink-0" />
              <span className="truncate">{successMsg}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
