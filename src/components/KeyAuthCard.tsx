import React, { useState, useEffect, useMemo } from "react";
import {
  BsKeyFill,
  BsCheckCircleFill,
  BsCopy,
  BsCheckLg,
  BsStars,
  BsLightningChargeFill,
  BsExclamationTriangleFill,
  BsArrowRepeat,
  BsXLg,
  BsInfoCircleFill,
} from "react-icons/bs";
import { SshKeyInfo, PresetTemplate } from "../types";
import { api } from "../api";
import {
  isKeyNameDuplicate,
  findMatchingExistingKey,
  getUniqueKeyName,
  suggestKeyNameForHost,
} from "../utils/keyUtils";

interface KeyAuthCardProps {
  identityFile: string;
  identitiesOnly: boolean;
  onChangeIdentity: (identityFile: string, identitiesOnly: boolean) => void;
  availableKeys: SshKeyInfo[];
  hostPattern: string;
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

  // Sync / Derive recommended key name when hostPattern or preset changes
  useEffect(() => {
    if (preset?.keyRecommendation) {
      setGenKeyName(getUniqueKeyName(preset.keyRecommendation.keyName, availableKeys));
      setGenKeyComment(preset.keyRecommendation.comment || `${hostPattern}@sshx`);
      setGenKeyType(preset.keyRecommendation.keyType);
    } else if (hostPattern.trim()) {
      setGenKeyName(suggestKeyNameForHost(hostPattern, "ed25519", availableKeys));
      setGenKeyComment(`${hostPattern.trim()}@sshx`);
    } else {
      setGenKeyName(getUniqueKeyName("id_ed25519_custom", availableKeys));
      setGenKeyComment("");
    }
  }, [hostPattern, preset, availableKeys]);

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
      alert(`Key generation failed: ${err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-[#0b0f19] border border-[#1f2942] rounded-xl overflow-hidden shadow-lg transition-all text-xs">
      {/* Universal Top Card Header */}
      <div className="px-3.5 py-2.5 bg-[#0e1422] border-b border-[#1f2942] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
              identityFile
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-blue-500/20 text-blue-400 border-blue-500/30"
            }`}
          >
            <BsKeyFill className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-bold text-white leading-tight">
              <span>SSH Key Authentication</span>
              {identityFile ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <BsCheckCircleFill className="w-2.5 h-2.5" />
                  <span>Connected</span>
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                  Agent Defaults
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
              {identityFile
                ? `Active key: ~/.ssh/${connectedKeyObj?.file_name}`
                : "Select an existing key from ~/.ssh/ or generate a dedicated key below."}
            </p>
          </div>
        </div>

        {/* IdentitiesOnly Toggle */}
        <label
          className="flex items-center gap-1.5 text-gray-300 hover:text-white cursor-pointer select-none bg-[#070a10] px-2.5 py-1 rounded-lg border border-[#1f2942]"
          title="IdentitiesOnly forces SSH to only use the specified key and ignore unlisted agent keys"
        >
          <input
            type="checkbox"
            checked={identitiesOnly}
            onChange={(e) => onChangeIdentity(identityFile, e.target.checked)}
            className="rounded border-[#1f2942] bg-[#0b0f19] text-blue-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
          />
          <span className="text-[11px] font-medium">IdentitiesOnly (Isolate)</span>
        </label>
      </div>

      {/* Main Card Body */}
      <div className="p-3.5 space-y-3">
        {/* ========================================================================= */}
        {/* STATE A: KEY IS CONNECTED */}
        {/* ========================================================================= */}
        {identityFile ? (
          <div className="space-y-3">
            {/* Connected Banner with Badges & Action Buttons */}
            <div className="p-3 bg-[#0c1626] border border-emerald-500/30 rounded-xl space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white font-mono text-xs">
                    ~/.ssh/{connectedKeyObj?.file_name}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase font-mono">
                    {connectedKeyObj?.key_type || "ED25519"}
                  </span>
                  {identitiesOnly && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
                      IdentitiesOnly yes
                    </span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <BsLightningChargeFill className="w-2.5 h-2.5" />
                    <span>ssh-agent</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenGuideModal(connectedKeyObj, currentPubKey)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#161d30] hover:bg-[#1f2942] text-blue-300 border border-blue-500/30 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <BsInfoCircleFill className="w-3.5 h-3.5 text-blue-400" />
                    <span>Setup Guide</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyPubKey}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer active:scale-95"
                  >
                    {copiedKey ? (
                      <BsCheckLg className="w-3.5 h-3.5" />
                    ) : (
                      <BsCopy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey ? "Copied!" : "Copy Public Key (.pub)"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-toolbar: Key switcher & Replacement Form Trigger */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={identityFile}
                  onChange={(e) => onChangeIdentity(e.target.value, true)}
                  className="bg-[#070a10] border border-[#1f2942] hover:border-blue-500/50 rounded-lg px-2.5 py-1 text-amber-300 font-mono text-xs focus:outline-none cursor-pointer"
                  title="Switch to a different existing key in ~/.ssh/"
                >
                  <option value={identityFile}>
                    Switch Key: {connectedKeyObj?.file_name}
                  </option>
                  {availableKeys
                    .filter((k) => k.private_path !== identityFile)
                    .map((k) => (
                      <option key={k.private_path} value={k.private_path}>
                        {k.file_name} ({k.key_type.toUpperCase()})
                      </option>
                    ))}
                </select>

                <button
                  type="button"
                  onClick={() => setShowReplaceForm(!showReplaceForm)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                    showReplaceForm
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-[#161d30] hover:bg-[#1f2942] text-gray-300 border-[#232f4d]"
                  }`}
                >
                  <BsArrowRepeat className="w-3.5 h-3.5 text-blue-400" />
                  <span>{showReplaceForm ? "Hide Generator" : "Generate Replacement"}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onChangeIdentity("", false);
                  setShowReplaceForm(false);
                }}
                className="text-gray-400 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                title="Disconnect key and revert to default OpenSSH authentication"
              >
                <BsXLg className="w-3 h-3" />
                <span>Disconnect Key</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STATE B: NO KEY CONNECTED - SINGLE UNIFIED LIGHTWEIGHT PANEL */
          /* ========================================================================= */
          <div className="space-y-3">
            {/* Quick Dropdown Selector for Existing Keys */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-gray-300 font-medium text-xs">
                  Choose Existing Key from <code className="font-mono text-gray-400">~/.ssh/</code>
                </label>
                <span className="text-[10px] text-gray-500">
                  {availableKeys.length} key{availableKeys.length === 1 ? "" : "s"} found
                </span>
              </div>
              <select
                value={identityFile}
                onChange={(e) => onChangeIdentity(e.target.value, !!e.target.value)}
                className="w-full bg-[#070a10] border border-[#1f2942] rounded-xl px-3 py-2 text-amber-300 font-mono text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">-- No specific key (Use OpenSSH agent defaults) --</option>
                {availableKeys.map((k) => (
                  <option key={k.private_path} value={k.private_path}>
                    {k.file_name} ({k.key_type.toUpperCase()}) {k.is_agent_loaded ? "⚡" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Clean Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1f2942]"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-[#0b0f19] px-2 text-gray-500">or generate dedicated key</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* INLINE DEDICATED KEY GENERATION FORM (Only when no key or replacing) */}
        {/* ========================================================================= */}
        {(!identityFile || showReplaceForm) && (
          <div
            className={`p-3 bg-[#070a10] border ${
              isDuplicate ? "border-amber-500/50" : "border-[#1f2942]"
            } rounded-xl space-y-2.5 transition-colors`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-blue-300 font-semibold text-xs">
                <BsStars className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {identityFile ? "Generate Replacement Key" : "Generate Dedicated SSH Key"}
                </span>
                {preset?.keyRecommendation && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {preset.title} Preset
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex bg-[#0b0f19] p-0.5 rounded-lg border border-[#1f2942]">
                  <button
                    type="button"
                    onClick={() => setGenKeyType("ed25519")}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                      genKeyType === "ed25519"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    Ed25519
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenKeyType("rsa")}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                      genKeyType === "rsa"
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    RSA 4096
                  </button>
                </div>

                {identityFile && showReplaceForm && (
                  <button
                    type="button"
                    onClick={() => setShowReplaceForm(false)}
                    className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#161d30] cursor-pointer"
                    title="Close generator"
                  >
                    <BsXLg className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Inputs & Action Button Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-[11px]">
                  ~/.ssh/
                </span>
                <input
                  type="text"
                  placeholder="Key filename"
                  value={genKeyName}
                  onChange={(e) => setGenKeyName(e.target.value)}
                  className={`w-full bg-[#0b0f19] border ${
                    isDuplicate ? "border-amber-500/60 text-amber-200" : "border-[#1f2942] text-white"
                  } rounded-lg pl-14 pr-2.5 py-1.5 font-mono text-xs focus:outline-none focus:border-blue-500`}
                />
              </div>

              <input
                type="text"
                placeholder="Comment / Email (optional)"
                value={genKeyComment}
                onChange={(e) => setGenKeyComment(e.target.value)}
                className="bg-[#0b0f19] border border-[#1f2942] rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500 placeholder-gray-600"
              />

              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerateKey}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-blue-500/20 active:scale-95"
              >
                <BsKeyFill className="w-3.5 h-3.5" />
                <span>
                  {isGenerating
                    ? "Generating..."
                    : isDuplicate
                    ? "Resolve & Generate"
                    : "Generate & Connect Key"}
                </span>
              </button>
            </div>

            {/* Conflict Notice if key name exists on disk */}
            {isDuplicate && (
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between gap-2 text-xs text-amber-300 animate-in fade-in">
                <div className="flex items-center gap-2 min-w-0">
                  <BsExclamationTriangleFill className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">
                    Key <code className="font-mono text-amber-200 font-semibold">{genKeyName.trim()}</code> exists in ~/.ssh/.
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {matchingExistingKey && (
                    <button
                      type="button"
                      onClick={() => {
                        onChangeIdentity(matchingExistingKey.private_path, true);
                        setShowReplaceForm(false);
                      }}
                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-[11px] cursor-pointer shadow-sm"
                    >
                      ⚡ Use Existing
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
                    className="px-2 py-0.5 bg-[#161d30] hover:bg-[#1f2942] text-amber-200 border border-amber-500/40 rounded font-semibold text-[11px] cursor-pointer shadow-sm"
                  >
                    3 Resolution Options
                  </button>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-1.5">
                <BsCheckCircleFill className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{successMsg}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
