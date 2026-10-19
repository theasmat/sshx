import { toast } from "../utils/toast";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BsKeyFill,
  BsCheckCircleFill,
} from "react-icons/bs";
import { Button, Badge, Segmented, Switch } from "./ui";
import { SshKeyInfo, PresetTemplate } from "../types";
import { api } from "../api";
import {
  isKeyNameDuplicate,
  findMatchingExistingKey,
  getUniqueKeyName,
  suggestKeyName,
  suggestKeyComment,
  keyNameAlternatives,
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
  onRefreshKeys: () => void;
  onOpenConflictModal: (conflictData: {
    conflictKeyName: string;
    uniqueSuggestionName: string;
    existingKey?: SshKeyInfo;
  }) => void;
  onOpenGuideModal: (keyInfo: SshKeyInfo | null, pubKey: string) => void;
}

export const KeyAuthCard: React.FC<KeyAuthCardProps> = ({
  identityFile,
  identitiesOnly,
  onChangeIdentity,
  availableKeys,
  hostPattern,
  hostName,
  account,
  preset,
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
    if (preset?.keyRecommendation) {
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

  const field =
    "w-full h-8 px-2.5 rounded-ctl bg-white/[0.06] text-label placeholder-label-3 focus:outline-none focus:bg-white/[0.09] focus:ring-2 focus:ring-accent/70";

  return (
    <div className="rounded-card bg-card divide-y divide-white/[0.06] text-[13px]">
      {/* Current key */}
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-label">{identityFile ? "Key" : "No key selected"}</span>
            {identityFile && (
              <>
                <span className="font-mono text-label-2 truncate">~/.ssh/{connectedKeyObj?.file_name}</span>
                <Badge>{(connectedKeyObj?.key_type || "ed25519").toUpperCase()}</Badge>
              </>
            )}
          </div>
          <div className="text-xs text-label-3">
            {identityFile ? "ssh offers this key for this host." : "ssh will try the keys loaded in your agent."}
          </div>
        </div>
        {identityFile && (
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onOpenGuideModal(connectedKeyObj, currentPubKey)}
              className="text-accent hover:underline cursor-pointer"
            >
              Setup guide
            </button>
            <button type="button" onClick={handleCopyPubKey} className="text-accent hover:underline cursor-pointer">
              {copiedKey ? "Copied" : "Copy public key"}
            </button>
          </div>
        )}
      </div>

      {/* Identities only */}
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-label">Use only this key</div>
          <div className="text-xs text-label-3">
            IdentitiesOnly: ignore other agent keys. Needed when several accounts share one server.
          </div>
        </div>
        <Switch
          label="Use only this key"
          checked={identitiesOnly}
          onChange={(v) => onChangeIdentity(identityFile, v)}
        />
      </div>

      {/* Choose / switch key */}
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
        <select
          aria-label={identityFile ? "Switch key" : "Choose existing key"}
          value={identityFile}
          onChange={(e) => onChangeIdentity(e.target.value, identityFile ? true : !!e.target.value)}
          className={`${field} font-mono flex-1 min-w-[220px] cursor-pointer`}
        >
          {!identityFile && <option value="">Choose an existing key ({availableKeys.length})</option>}
          {identityFile && <option value={identityFile}>{connectedKeyObj?.file_name}</option>}
          {availableKeys
            .filter((k) => k.private_path !== identityFile)
            .map((k) => (
              <option key={k.private_path} value={k.private_path}>
                {k.file_name} ({k.key_type.toUpperCase()})
              </option>
            ))}
        </select>
        {identityFile && (
          <>
            <button
              type="button"
              onClick={() => setShowReplaceForm(!showReplaceForm)}
              className="text-accent hover:underline cursor-pointer"
            >
              {showReplaceForm ? "Hide generator" : "Generate replacement"}
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeIdentity("", false);
                setShowReplaceForm(false);
              }}
              className="text-rose-300 hover:underline cursor-pointer"
              title="Disconnect key and use default OpenSSH authentication"
            >
              Disconnect
            </button>
          </>
        )}
      </div>

      {/* Generator */}
      {(!identityFile || showReplaceForm) && (
        <div className="px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-label">
              <span>{identityFile ? "Generate replacement key" : "Or generate a dedicated key"}</span>
              {preset?.keyRecommendation && <Badge tone="warn">{preset.title}</Badge>}
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
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-label-3 font-mono text-xs pointer-events-none">
                ~/.ssh/
              </span>
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
              <span className="flex items-center gap-3">
                {matchingExistingKey && (
                  <button
                    type="button"
                    onClick={() => {
                      onChangeIdentity(matchingExistingKey.private_path, true);
                      setShowReplaceForm(false);
                    }}
                    className="underline cursor-pointer"
                  >
                    Use existing
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    onOpenConflictModal({
                      conflictKeyName: genKeyName.trim(),
                      uniqueSuggestionName: uniqueSuggestion,
                      existingKey: matchingExistingKey,
                    })
                  }
                  className="underline cursor-pointer"
                >
                  More options
                </button>
              </span>
            </div>
          )}

          <div className="flex items-center justify-end">
            <Button type="button" variant="primary" icon={<BsKeyFill />} disabled={isGenerating} onClick={handleGenerateKey}>
              {isGenerating ? "Generating..." : isDuplicate ? "Resolve & Generate" : "Generate & Connect"}
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
