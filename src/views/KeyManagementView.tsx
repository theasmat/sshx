import React, { useState, useEffect } from "react";
import {
  BsKeyFill,
  BsPlusLg,
  BsCopy,
  BsCheckLg,
  BsShieldLock,
  BsArrowClockwise,
  BsXLg,
  BsEye,
  BsEyeSlash,
  BsCheckCircleFill,
  BsLockFill,
  BsStars,
  BsExclamationTriangleFill,
  BsTrash3,
} from "react-icons/bs";
import { BrandLogo } from "../components/BrandLogo";
import { SshKeyInfo, SshHost } from "../types";
import { api } from "../api";
import { isKeyNameDuplicate, getUniqueKeyName } from "../utils/keyUtils";
import { DeleteKeyConfirmationModal } from "../components/DeleteKeyConfirmationModal";

interface KeyManagementViewProps {
  keys: SshKeyInfo[];
  hosts?: SshHost[];
  onRefresh: () => void;
  isLoading: boolean;
  initialCreateModalOpen?: boolean;
  initialSelectedKeyPath?: string | null;
}

export const KeyManagementView: React.FC<KeyManagementViewProps> = ({
  keys,
  hosts = [],
  onRefresh,
  isLoading,
  initialCreateModalOpen = false,
  initialSelectedKeyPath = null,
}) => {
  const [selectedKeyPath, setSelectedKeyPath] = useState<string | null>(initialSelectedKeyPath);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<SshKeyInfo | null>(null);

  // Default Algorithm State
  const [defaultAlgo, setDefaultAlgo] = useState<"ed25519" | "rsa" | "ecdsa">(
    () => {
      return (
        (localStorage.getItem("sshx_default_algo") as
          | "ed25519"
          | "rsa"
          | "ecdsa") || "ed25519"
      );
    }
  );
  const [isAlgoModalOpen, setIsAlgoModalOpen] = useState(false);

  // Create Key Modal Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(initialCreateModalOpen);
  const [createStep, setCreateStep] = useState<"form" | "success">("form");
  const [keyName, setKeyName] = useState("");
  const [comment, setComment] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [keyType, setKeyType] = useState<"ed25519" | "rsa" | "ecdsa">("ed25519");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTogglingAgent, setIsTogglingAgent] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<SshKeyInfo | null>(null);

  // Default select first key
  useEffect(() => {
    if (keys.length > 0 && !selectedKeyPath) {
      setSelectedKeyPath(keys[0].private_path);
    }
  }, [keys, selectedKeyPath]);

  const selectedKey = keys.find((k) => k.private_path === selectedKeyPath) || null;

  const filteredKeys = keys.filter((k) => {
    const q = searchQuery.toLowerCase();
    return (
      k.file_name.toLowerCase().includes(q) ||
      k.key_type.toLowerCase().includes(q) ||
      (k.comment && k.comment.toLowerCase().includes(q)) ||
      k.private_path.toLowerCase().includes(q)
    );
  });

  const handleCopyPublic = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyFingerprint = (fp: string) => {
    navigator.clipboard.writeText(fp);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleOpenCreateModal = () => {
    setKeyType(defaultAlgo);
    setKeyName(`id_${defaultAlgo}_${Date.now().toString().slice(-4)}`);
    setComment("");
    setPassphrase("");
    setShowPassphrase(false);
    setCreateStep("form");
    setGeneratedResult(null);
    setIsCreateModalOpen(true);
  };

  const handleSelectDefaultAlgo = (algo: "ed25519" | "rsa" | "ecdsa") => {
    setDefaultAlgo(algo);
    localStorage.setItem("sshx_default_algo", algo);
    setIsAlgoModalOpen(false);
  };

  const isModalKeyDuplicate = isKeyNameDuplicate(keyName, keys);
  const uniqueModalKeySuggestion = getUniqueKeyName(keyName, keys);

  const handleGenerateKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      alert("Key filename is required");
      return;
    }

    const cleanRequested = keyName.trim();
    const resolvedName = getUniqueKeyName(cleanRequested, keys);
    if (resolvedName !== cleanRequested) {
      setKeyName(resolvedName);
    }

    setIsGenerating(true);
    try {
      const newKey = await api.generateKey({
        name: resolvedName,
        key_type: keyType,
        bits: keyType === "rsa" ? 4096 : undefined,
        passphrase: passphrase ? passphrase : undefined,
        comment: comment.trim() || "",
      });

      setGeneratedResult(newKey);
      setCreateStep("success");
      onRefresh();
      setSelectedKeyPath(newKey.private_path);
    } catch (err: any) {
      alert(`Failed to generate SSH key: ${err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleAgent = async (keyPath: string, isLoaded: boolean) => {
    setIsTogglingAgent(true);
    try {
      if (isLoaded) {
        await api.removeKeyFromAgent(keyPath);
      } else {
        await api.addKeyToAgent(keyPath);
      }
      onRefresh();
    } catch (err: any) {
      alert(`Failed to update ssh-agent: ${err}`);
    } finally {
      setIsTogglingAgent(false);
    }
  };

  const loadedCount = keys.filter((k) => k.is_agent_loaded).length;

  return (
    <div className="h-full flex flex-col bg-[#070a10] text-xs select-none overflow-hidden">
      {/* Top Header with Prominent Create Key Button */}
      <div className="px-3.5 py-1.5 border-b border-[#1f2942] bg-[#090d16] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-5.5 h-5.5 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <BsKeyFill className="w-3 h-3" />
          </div>
          <div>
            <h2 className="font-bold text-white text-xs">Key Management</h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Main Prominent Create Key Button */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-md font-semibold text-xs transition-all shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            <BsPlusLg className="w-3.5 h-3.5" />
            <span>Create SSH Key</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-md border border-[#232f4d] transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh ~/.ssh/ keys"
          >
            <BsArrowClockwise
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Top Summary Status Bar (Clean & Space-Efficient) */}
      <div className="px-3 py-1.5 border-b border-[#1f2942] bg-[#090d16]/70 shrink-0 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0f1422] border border-[#1f2942] text-gray-300 text-xs">
            <BsKeyFill className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-bold text-white font-mono">{keys.length}</span>
            <span className="text-gray-400">
              {keys.length === 1 ? "key found in ~/.ssh" : "keys found in ~/.ssh"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0f1422] border border-[#1f2942] text-gray-300 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                loadedCount > 0 ? "bg-emerald-400 ring-2 ring-emerald-400/20" : "bg-gray-500"
              }`}
            />
            <span className="font-bold text-emerald-400 font-mono">{loadedCount}</span>
            <span className="text-gray-400">in ssh-agent</span>
          </div>
        </div>

        {/* Default Algorithm with Switch Button */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 text-xs">Default:</span>
          <button
            onClick={() => setIsAlgoModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#161d30] hover:bg-[#1f2942] text-purple-300 border border-purple-500/30 font-mono font-semibold text-xs transition-colors cursor-pointer"
            title="Click to switch preferred key algorithm"
          >
            <BsStars className="w-3 h-3 text-purple-400" />
            <span className="uppercase">{defaultAlgo}</span>
            <span className="text-gray-400 font-sans font-normal text-[11px]">Switch</span>
          </button>
        </div>
      </div>

      {/* Main Split View: Left List of Keys | Right Selected Key Detail (Persistent Side-by-Side) */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Left Pane: Keys List */}
        <div className="w-72 md:w-80 shrink-0 h-full flex flex-col border-r border-[#1f2942] bg-[#070a10]">
          {/* Search bar */}
          <div className="p-2 border-b border-[#1f2942] bg-[#090d16]">
            <input
              type="text"
              placeholder="Filter keys by name, comment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-7 px-2.5 text-xs bg-[#0f1422] border border-[#1f2942] rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#172138]/50">
            {filteredKeys.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-xs">
                No matching keys found in ~/.ssh/
              </div>
            ) : (
              filteredKeys.map((k) => {
                const isSelected = selectedKeyPath === k.private_path;

                return (
                  <div
                    key={k.private_path}
                    onClick={() => setSelectedKeyPath(k.private_path)}
                    className={`group px-2.5 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-600/15 border-l-2 border-blue-500 pl-2"
                        : "hover:bg-[#121829]/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? "bg-blue-600/20 text-blue-400 border-blue-500/40"
                            : "bg-[#161d30] text-gray-400 border-[#232f4d]"
                        }`}
                      >
                        <BrandLogo
                          name={k.file_name}
                          hostName={k.comment}
                          className="w-3.5 h-3.5"
                          fallbackIcon={<BsKeyFill className="w-3 h-3" />}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 leading-tight">
                          <span
                            className={`font-semibold text-[13px] truncate ${
                              isSelected ? "text-blue-400 font-bold" : "text-white"
                            }`}
                          >
                            {k.file_name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase bg-blue-500/10 text-blue-300 border border-blue-500/20 leading-none">
                            {k.key_type}
                          </span>
                        </div>

                        <div className="text-xs text-gray-400 font-mono truncate leading-tight mt-0.5">
                          {k.comment || k.private_path.replace(/^.*[\\/]/, "")}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {k.is_agent_loaded ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" title="Loaded in ssh-agent" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-600" title="Not in ssh-agent" />
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setKeyToDelete(k);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title={`Delete key ${k.file_name}`}
                      >
                        <BsTrash3 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Selected Key Inspector Detail */}
        <div className="flex-1 min-w-0 h-full overflow-y-auto bg-[#0b0f19] p-3">
          {selectedKey ? (
            <div className="max-w-3xl mx-auto space-y-2.5">
              {/* Header Title & Badges */}
              <div className="pb-2 border-b border-[#1f2942] flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-[#161d30] border border-[#232f4d] shrink-0 text-gray-300">
                      <BrandLogo
                        name={selectedKey.file_name}
                        hostName={selectedKey.comment}
                        className="w-4 h-4"
                        fallbackIcon={<BsKeyFill className="w-3.5 h-3.5 text-blue-400" />}
                      />
                    </div>
                    <h3 className="text-sm font-bold text-white font-mono">
                      {selectedKey.file_name}
                    </h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold leading-none">
                      {selectedKey.key_type} {selectedKey.bits ? `${selectedKey.bits}-bit` : ""}
                    </span>
                    {selectedKey.is_agent_loaded && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-medium leading-none">
                        <span>⚡ Loaded</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-mono pl-8">
                    {selectedKey.private_path}
                  </p>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-1.5">
                  {selectedKey.public_key_content && (
                    <button
                      onClick={() =>
                        handleCopyPublic(selectedKey.public_key_content!)
                      }
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-semibold text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                      title="Copy public key to clipboard"
                    >
                      {copiedKey ? (
                        <BsCheckLg className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <BsCopy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedKey ? "Copied!" : "Copy Public Key"}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleCopyPath(selectedKey.private_path)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-md border border-[#232f4d] font-medium text-xs transition-colors cursor-pointer whitespace-nowrap"
                    title="Copy absolute key file path"
                  >
                    {copiedPath ? (
                      <BsCheckLg className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <BsCopy className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    <span>{copiedPath ? "Copied!" : "Copy Path"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setKeyToDelete(selectedKey);
                      setIsDeleteModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-md border border-rose-500/30 font-medium text-xs transition-colors cursor-pointer whitespace-nowrap"
                    title="Delete this SSH key"
                  >
                    <BsTrash3 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete Key</span>
                  </button>
                </div>
              </div>

              {/* Secure Privacy Box for Fingerprint (Masked) - Clean & Responsive */}
              <div className="p-3 bg-[#070a10] border border-[#1f2942] rounded-md flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 leading-none">
                    <BsLockFill className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">SHA256 Fingerprint (Protected)</span>
                  </div>
                  <div className="font-mono text-gray-400 text-xs tracking-widest select-none truncate">
                    SHA256:••••••••••••••••••••••••••••••••
                  </div>
                </div>

                <button
                  onClick={() =>
                    handleCopyFingerprint(selectedKey.fingerprint_sha256)
                  }
                  className="shrink-0 whitespace-nowrap px-3 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-amber-300 hover:text-white rounded-md border border-amber-500/30 font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Copy full SHA256 fingerprint to clipboard"
                >
                  {copiedFingerprint ? <BsCheckLg className="w-3.5 h-3.5 text-emerald-400" /> : <BsCopy className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{copiedFingerprint ? "Copied!" : "Copy"}</span>
                </button>
              </div>

              {/* Secure Public Key Card (Copy-Only for Privacy) - Clean & Responsive */}
              <div className="p-3 bg-[#070a10] border border-[#1f2942] rounded-md flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 leading-none">
                    <BsShieldLock className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="truncate">Public Key (.pub)</span>
                  </div>
                  <div
                    className="text-xs text-gray-400 font-mono truncate"
                    title={selectedKey.public_path || `${selectedKey.private_path}.pub`}
                  >
                    {selectedKey.public_path || `${selectedKey.private_path}.pub`}
                  </div>
                </div>

                {selectedKey.public_key_content && (
                  <button
                    onClick={() =>
                      handleCopyPublic(selectedKey.public_key_content!)
                    }
                    className="shrink-0 whitespace-nowrap px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-md border border-blue-500/30 font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Copy full public key string to clipboard"
                  >
                    {copiedKey ? <BsCheckLg className="w-3.5 h-3.5 text-emerald-300" /> : <BsCopy className="w-3.5 h-3.5 text-blue-400" />}
                    <span>{copiedKey ? "Copied!" : "Copy .pub"}</span>
                  </button>
                )}
              </div>

              {/* Parameters Table */}
              <div className="bg-[#0f1422] border border-[#1f2942] rounded-md divide-y divide-[#1f2942] text-xs">
                <div className="flex items-center justify-between px-2.5 py-1.5">
                  <span className="text-gray-400">Algorithm</span>
                  <span className="font-mono text-white font-semibold uppercase">
                    {selectedKey.key_type}
                  </span>
                </div>

                {selectedKey.bits && (
                  <div className="flex items-center justify-between px-2.5 py-1.5">
                    <span className="text-gray-400">Key Length</span>
                    <span className="font-mono text-gray-200">
                      {selectedKey.bits} bits
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between px-2.5 py-1.5">
                  <span className="text-gray-400">Comment / Email</span>
                  <span className="font-mono text-gray-200">
                    {selectedKey.comment || "(none)"}
                  </span>
                </div>

                <div className="flex items-center justify-between px-2.5 py-1.5">
                  <span className="text-gray-400">Public Key Status</span>
                  <span className="font-mono text-gray-200">
                    {selectedKey.public_path ? "Paired (.pub available)" : "Private only"}
                  </span>
                </div>

                <div className="flex items-center justify-between px-2.5 py-1.5">
                  <span className="text-gray-400">SSH-Agent Status</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-200 flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          selectedKey.is_agent_loaded
                            ? "bg-emerald-400 ring-2 ring-emerald-400/20"
                            : "bg-gray-500"
                        }`}
                      />
                      <span>
                        {selectedKey.is_agent_loaded
                          ? "Active in ssh-agent"
                          : "Not currently loaded"}
                      </span>
                    </span>

                    <button
                      onClick={() =>
                        handleToggleAgent(
                          selectedKey.private_path,
                          selectedKey.is_agent_loaded
                        )
                      }
                      disabled={isTogglingAgent}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer disabled:opacity-50 ${
                        selectedKey.is_agent_loaded
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                      }`}
                      title={
                        selectedKey.is_agent_loaded
                          ? "Run `ssh-add -d` to unload from memory"
                          : "Run `ssh-add` to load into active ssh-agent"
                      }
                    >
                      {isTogglingAgent
                        ? "Updating..."
                        : selectedKey.is_agent_loaded
                        ? "Unload (ssh-add -d)"
                        : "Load into Agent (ssh-add)"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 text-xs">
              Select a key from the list to view its details.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CREATE KEY (Apple/Google Auth-Style Clean Modal) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0c101a] border border-[#1f2942] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1f2942] bg-[#090d16] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <BsKeyFill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {createStep === "form" ? "Create New SSH Key" : "Key Generated Successfully!"}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {createStep === "form"
                      ? "Generate a secure cryptographic key pair in ~/.ssh/"
                      : "Your new SSH key has been created and loaded"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white hover:bg-[#161d30] rounded-lg transition-colors cursor-pointer"
              >
                <BsXLg className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            {createStep === "form" ? (
              <form onSubmit={handleGenerateKeySubmit} className="p-5 space-y-4 text-xs">
                {/* Row 1: Algorithm Selector */}
                <div>
                  <label className="block text-gray-300 font-semibold mb-1.5">
                    Algorithm Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setKeyType("ed25519")}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        keyType === "ed25519"
                          ? "bg-blue-600/20 border-blue-500 text-blue-300 font-bold shadow-sm"
                          : "bg-[#070a10] border-[#1f2942] text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      <div className="text-xs">Ed25519</div>
                      <div className="text-[10px] text-emerald-400 font-medium">Recommended</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setKeyType("rsa")}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        keyType === "rsa"
                          ? "bg-blue-600/20 border-blue-500 text-blue-300 font-bold shadow-sm"
                          : "bg-[#070a10] border-[#1f2942] text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      <div className="text-xs">RSA</div>
                      <div className="text-[10px] text-gray-500 font-medium">4096-bit</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setKeyType("ecdsa")}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        keyType === "ecdsa"
                          ? "bg-blue-600/20 border-blue-500 text-blue-300 font-bold shadow-sm"
                          : "bg-[#070a10] border-[#1f2942] text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      <div className="text-xs">ECDSA</div>
                      <div className="text-[10px] text-gray-500 font-medium">NIST P-256</div>
                    </button>
                  </div>
                </div>

                {/* Row 2: Key Filename */}
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Key Filename <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-xs">
                      ~/.ssh/
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. id_ed25519_github_work"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      className={`w-full bg-[#070a10] border ${
                        isModalKeyDuplicate ? "border-amber-500/60 text-amber-200" : "border-[#1f2942] text-white"
                      } rounded-xl pl-16 pr-3 py-2 font-mono text-xs focus:outline-none focus:border-blue-500`}
                    />
                  </div>

                  {/* Duplicate Warning & Auto-Rename */}
                  {isModalKeyDuplicate && (
                    <div className="mt-1.5 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between gap-2 text-xs text-amber-300 animate-in fade-in">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <BsExclamationTriangleFill className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">Key already exists on disk</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setKeyName(uniqueModalKeySuggestion)}
                        className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 rounded font-semibold text-[11px] shrink-0 cursor-pointer transition-colors"
                      >
                        Rename to "{uniqueModalKeySuggestion}"
                      </button>
                    </div>
                  )}
                </div>

                {/* Row 3: Comment / Email */}
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Comment / Email Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. your-email@company.com"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-[#070a10] border border-[#1f2942] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500 placeholder-gray-600"
                  />
                </div>

                {/* Row 4: Passphrase */}
                <div>
                  <label className="block text-gray-300 font-semibold mb-1 flex items-center justify-between">
                    <span>Passphrase (Optional)</span>
                    <span className="text-[10px] text-gray-500">Leave blank for no password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassphrase ? "text" : "password"}
                      placeholder="Enter passphrase to encrypt key"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      className="w-full bg-[#070a10] border border-[#1f2942] rounded-xl pl-3 pr-10 py-2 text-white text-xs focus:outline-none focus:border-blue-500 placeholder-gray-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer"
                    >
                      {showPassphrase ? <BsEyeSlash className="w-3.5 h-3.5" /> : <BsEye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-2 flex items-center justify-between border-t border-[#1f2942]">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-xl font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    <BsKeyFill className="w-4 h-4" />
                    <span>{isGenerating ? "Generating Key..." : "Generate Key Pair"}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Success Step - Privacy Masked */
              <div className="p-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <BsCheckCircleFill className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-white text-base">
                    {generatedResult?.file_name} Created & Loaded!
                  </h4>
                  <p className="text-xs text-gray-400 font-mono">
                    {generatedResult?.private_path}
                  </p>
                </div>

                <div className="p-3.5 bg-[#070a10] border border-[#1f2942] rounded-xl text-left space-y-1.5">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <BsShieldLock className="w-3 h-3 text-emerald-400" />
                    <span>Public Key Ready to Paste</span>
                  </div>
                  <p className="text-[11px] text-gray-300">
                    Your key is generated securely in <code className="text-blue-400 font-mono">~/.ssh/</code>. Click the button below to copy the public key directly to your clipboard for GitHub, GitLab, or remote servers.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  {generatedResult?.public_key_content && (
                    <button
                      onClick={() =>
                        handleCopyPublic(generatedResult.public_key_content!)
                      }
                      className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      {copiedKey ? <BsCheckLg className="w-4 h-4" /> : <BsCopy className="w-4 h-4" />}
                      <span>{copiedKey ? "Copied Public Key!" : "Copy Public Key"}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-5 py-2 bg-[#161d30] hover:bg-[#1f2942] text-gray-200 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: SWITCH DEFAULT ALGORITHM POPUP */}
      {isAlgoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0c101a] border border-[#1f2942] rounded-2xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#1f2942]">
              <div className="flex items-center gap-2">
                <BsStars className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-white text-xs">Preferred Default Algorithm</h3>
              </div>
              <button
                onClick={() => setIsAlgoModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <BsXLg className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => handleSelectDefaultAlgo("ed25519")}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  defaultAlgo === "ed25519"
                    ? "bg-purple-600/20 border-purple-500 text-purple-300 font-bold"
                    : "bg-[#070a10] border-[#1f2942] text-gray-300 hover:bg-[#161d30]"
                }`}
              >
                <div>
                  <div className="font-semibold text-xs text-white">Ed25519 (Recommended)</div>
                  <div className="text-[10px] text-gray-400">Modern elliptic curve, ultra fast and secure.</div>
                </div>
                {defaultAlgo === "ed25519" && <BsCheckLg className="w-4 h-4 text-purple-400" />}
              </button>

              <button
                onClick={() => handleSelectDefaultAlgo("rsa")}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  defaultAlgo === "rsa"
                    ? "bg-purple-600/20 border-purple-500 text-purple-300 font-bold"
                    : "bg-[#070a10] border-[#1f2942] text-gray-300 hover:bg-[#161d30]"
                }`}
              >
                <div>
                  <div className="font-semibold text-xs text-white">RSA (4096-bit)</div>
                  <div className="text-[10px] text-gray-400">Maximum compatibility with older legacy servers.</div>
                </div>
                {defaultAlgo === "rsa" && <BsCheckLg className="w-4 h-4 text-purple-400" />}
              </button>

              <button
                onClick={() => handleSelectDefaultAlgo("ecdsa")}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  defaultAlgo === "ecdsa"
                    ? "bg-purple-600/20 border-purple-500 text-purple-300 font-bold"
                    : "bg-[#070a10] border-[#1f2942] text-gray-300 hover:bg-[#161d30]"
                }`}
              >
                <div>
                  <div className="font-semibold text-xs text-white">ECDSA (NIST P-256)</div>
                  <div className="text-[10px] text-gray-400">NIST standardized elliptic curve.</div>
                </div>
                {defaultAlgo === "ecdsa" && <BsCheckLg className="w-4 h-4 text-purple-400" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key Deletion Impact & Confirmation Modal */}
      <DeleteKeyConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setKeyToDelete(null);
        }}
        keyInfo={keyToDelete || selectedKey}
        hosts={hosts}
        onKeyDeleted={(deletedPath) => {
          if (selectedKeyPath === deletedPath) {
            setSelectedKeyPath(null);
          }
          onRefresh();
        }}
      />
    </div>
  );
};
