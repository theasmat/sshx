import { toast } from "../utils/toast";
import React, { useState, useEffect } from "react";
import {
  BsKeyFill,
  BsPlusLg,
  BsCopy,
  BsCheckLg,
  BsArrowClockwise,
  BsEye,
  BsEyeSlash,
  BsCheckCircleFill,
  BsTrash3,
} from "react-icons/bs";
import { BrandLogo } from "../components/BrandLogo";
import { SshKeyInfo, SshHost } from "../types";
import { api } from "../api";
import { isKeyNameDuplicate, getUniqueKeyName } from "../utils/keyUtils";
import { Button, Badge, Dialog, Group, Row, Segmented } from "../components/ui";
import { KeyUsagePanel } from "../components/KeyUsagePanel";
import { DeleteKeyConfirmationModal } from "../components/DeleteKeyConfirmationModal";

const modalField =
  "w-full h-8 px-2.5 rounded-ctl bg-white/[0.06] text-label placeholder-label-3 focus:outline-none focus:bg-white/[0.09] focus:ring-2 focus:ring-accent/70";

interface KeyManagementViewProps {
  keys: SshKeyInfo[];
  hosts?: SshHost[];
  hostAccounts?: Record<string, string>;
  onRefresh: () => void;
  isLoading: boolean;
  initialCreateModalOpen?: boolean;
  initialSelectedKeyPath?: string | null;
}

export const KeyManagementView: React.FC<KeyManagementViewProps> = ({
  keys,
  hosts = [],
  hostAccounts,
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
      toast.error("Key filename is required");
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
      toast.error(`Failed to generate SSH key: ${err}`);
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
      toast.error(`Failed to update ssh-agent: ${err}`);
    } finally {
      setIsTogglingAgent(false);
    }
  };

  const loadedCount = keys.filter((k) => k.is_agent_loaded).length;

  return (
    <div className="h-full flex flex-col bg-app text-[13px] select-none overflow-hidden">
      {/* Title bar */}
      <div className="px-5 h-12 flex items-center justify-between shrink-0">
        <h2 className="text-[15px] font-semibold text-label">Keys</h2>
        <div className="flex items-center gap-2">
          <Button variant="primary" icon={<BsPlusLg />} onClick={handleOpenCreateModal}>
            New Key
          </Button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 w-8 flex items-center justify-center rounded-ctl text-label-2 hover:text-label hover:bg-white/[0.06] disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            title="Refresh ~/.ssh keys"
            aria-label="Refresh keys"
          >
            <BsArrowClockwise className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Left: key list */}
        <div className="w-72 md:w-80 shrink-0 h-full flex flex-col">
          <div className="px-3 pb-2 space-y-2">
            <input
              type="text"
              placeholder="Filter keys"
              aria-label="Filter keys"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 px-3 bg-white/[0.07] rounded-ctl text-label placeholder-label-3 focus:outline-none focus:bg-white/[0.1] focus:ring-2 focus:ring-accent/70"
            />
            <div className="flex items-center justify-between px-1 text-xs text-label-3">
              <span>
                {keys.length} {keys.length === 1 ? "key" : "keys"} · {loadedCount} in ssh-agent
              </span>
              <button
                onClick={() => setIsAlgoModalOpen(true)}
                className="hover:text-label-2 cursor-pointer"
                title="Switch preferred key algorithm"
              >
                Default: <span className="uppercase">{defaultAlgo}</span>
              </button>
            </div>
          </div>

          <div role="listbox" aria-label="SSH keys" className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {filteredKeys.length === 0 ? (
              <div className="p-6 text-center text-label-3">No matching keys in ~/.ssh</div>
            ) : (
              filteredKeys.map((k) => {
                const isSelected = selectedKeyPath === k.private_path;
                return (
                  <div
                    key={k.private_path}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setSelectedKeyPath(k.private_path)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedKeyPath(k.private_path);
                      }
                    }}
                    className={`group flex items-center gap-3 px-2.5 py-2 rounded-ctl cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                      isSelected ? "bg-accent/20" : "hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-ctl flex items-center justify-center bg-card shrink-0 text-label">
                      <BrandLogo
                        name={k.file_name}
                        hostName={k.comment}
                        className="w-4 h-4"
                        fallbackIcon={<BsKeyFill className="w-3.5 h-3.5 text-label-2" />}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-label truncate">{k.file_name}</div>
                      <div className="text-xs text-label-2 truncate">
                        <span className="uppercase">{k.key_type}</span>
                        {k.comment ? ` · ${k.comment}` : ""}
                      </div>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${k.is_agent_loaded ? "bg-emerald-400" : "bg-label-3/60"}`}
                      title={k.is_agent_loaded ? "Loaded in ssh-agent" : "Not in ssh-agent"}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setKeyToDelete(k);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 rounded-ctl text-label-3 hover:text-rose-300 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                      aria-label={`Delete key ${k.file_name}`}
                      title={`Delete key ${k.file_name}`}
                    >
                      <BsTrash3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="w-px bg-white/[0.08] shrink-0" />

        {/* Right: selected key */}
        <div className="flex-1 min-w-0 h-full overflow-y-auto bg-panel">
          {selectedKey ? (
            <div className="max-w-2xl px-8 py-7 space-y-6">
              <header className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-card flex items-center justify-center bg-card shrink-0 text-label">
                  <BrandLogo
                    name={selectedKey.file_name}
                    hostName={selectedKey.comment}
                    className="w-7 h-7"
                    fallbackIcon={<BsKeyFill className="w-5 h-5 text-label-2" />}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-semibold text-label tracking-tight truncate">{selectedKey.file_name}</h3>
                  <p className="font-mono text-label-2 truncate" title={selectedKey.private_path}>
                    {selectedKey.private_path}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Badge>
                      {selectedKey.key_type.toUpperCase()}
                      {selectedKey.bits ? ` ${selectedKey.bits}-bit` : ""}
                    </Badge>
                    {selectedKey.is_agent_loaded && <Badge tone="ok">Loaded in agent</Badge>}
                  </div>
                </div>
              </header>

              <div className="flex items-center gap-2">
                {selectedKey.public_key_content && (
                  <Button
                    variant="primary"
                    icon={copiedKey ? <BsCheckLg /> : <BsCopy />}
                    onClick={() => handleCopyPublic(selectedKey.public_key_content!)}
                  >
                    {copiedKey ? "Copied" : "Copy Public Key"}
                  </Button>
                )}
                <Button icon={copiedPath ? <BsCheckLg /> : <BsCopy />} onClick={() => handleCopyPath(selectedKey.private_path)}>
                  {copiedPath ? "Copied" : "Copy Path"}
                </Button>
                <Button
                  variant="danger"
                  icon={<BsTrash3 />}
                  onClick={() => {
                    setKeyToDelete(selectedKey);
                    setIsDeleteModalOpen(true);
                  }}
                >
                  Delete
                </Button>
              </div>

              <KeyUsagePanel
                keyInfo={selectedKey}
                keys={keys}
                hosts={hosts}
                hostAccounts={hostAccounts}
                onRenamed={(newPath) => {
                  setSelectedKeyPath(newPath);
                  onRefresh();
                }}
              />

              <Group title="Details">
                <Row label="Algorithm">{selectedKey.key_type.toUpperCase()}</Row>
                {selectedKey.bits && <Row label="Length">{selectedKey.bits} bits</Row>}
                <Row label="Comment">{selectedKey.comment || "(none)"}</Row>
                <Row label="Public key">{selectedKey.public_path ? "Paired (.pub)" : "Private only"}</Row>
                <Row label="Fingerprint">
                  <span className="inline-flex items-center gap-2">
                    <span className="tracking-widest text-label-3">SHA256:••••••••••••</span>
                    <button
                      onClick={() => handleCopyFingerprint(selectedKey.fingerprint_sha256)}
                      className="font-sans text-accent hover:underline cursor-pointer"
                      title="Copy the full SHA256 fingerprint"
                    >
                      {copiedFingerprint ? "Copied" : "Copy"}
                    </button>
                  </span>
                </Row>
                <Row label="ssh-agent">
                  <span className="inline-flex items-center gap-3">
                    <span className="font-sans">{selectedKey.is_agent_loaded ? "Loaded" : "Not loaded"}</span>
                    <button
                      onClick={() => handleToggleAgent(selectedKey.private_path, selectedKey.is_agent_loaded)}
                      disabled={isTogglingAgent}
                      className="font-sans text-accent hover:underline disabled:opacity-50 cursor-pointer"
                      title={selectedKey.is_agent_loaded ? "Run ssh-add -d to unload" : "Run ssh-add to load"}
                    >
                      {isTogglingAgent ? "Updating..." : selectedKey.is_agent_loaded ? "Unload" : "Load"}
                    </button>
                  </span>
                </Row>
              </Group>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-label-3">Select a key to see its details</div>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <Dialog
          title={createStep === "form" ? "New SSH Key" : "Key created"}
          subtitle={createStep === "form" ? "Generates a key pair in ~/.ssh/" : generatedResult?.private_path}
          onClose={() => setIsCreateModalOpen(false)}
          footer={
            createStep === "form" ? (
              <>
                <Button type="button" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="create-key-form" variant="primary" icon={<BsKeyFill />} disabled={isGenerating}>
                  {isGenerating ? "Generating..." : "Generate"}
                </Button>
              </>
            ) : (
              <>
                {generatedResult?.public_key_content && (
                  <Button
                    icon={copiedKey ? <BsCheckLg /> : <BsCopy />}
                    onClick={() => handleCopyPublic(generatedResult.public_key_content!)}
                  >
                    {copiedKey ? "Copied" : "Copy Public Key"}
                  </Button>
                )}
                <Button variant="primary" onClick={() => setIsCreateModalOpen(false)}>
                  Done
                </Button>
              </>
            )
          }
        >
          {createStep === "form" ? (
            <form id="create-key-form" onSubmit={handleGenerateKeySubmit} className="space-y-4 text-[13px]">
              <div className="space-y-1.5">
                <div className="text-label-2">Algorithm</div>
                <Segmented
                  label="Algorithm"
                  value={keyType}
                  options={[
                    { value: "ed25519" as const, label: "Ed25519" },
                    { value: "rsa" as const, label: "RSA 4096" },
                    { value: "ecdsa" as const, label: "ECDSA" },
                  ]}
                  onChange={setKeyType}
                />
                <p className="text-xs text-label-3">Ed25519 is recommended. RSA works with very old servers.</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="create-key-name" className="text-label-2">
                  Filename
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-label-3 font-mono text-xs pointer-events-none">
                    ~/.ssh/
                  </span>
                  <input
                    id="create-key-name"
                    type="text"
                    required
                    placeholder="e.g. id_ed25519_github_work"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className={`${modalField} font-mono pl-14 ${isModalKeyDuplicate ? "ring-2 ring-amber-400/60" : ""}`}
                  />
                </div>
                {isModalKeyDuplicate && (
                  <div role="status" className="rounded-ctl bg-amber-500/10 text-amber-200 px-3 py-2 text-xs flex items-center justify-between gap-2">
                    <span>Already exists on disk.</span>
                    <button
                      type="button"
                      onClick={() => setKeyName(uniqueModalKeySuggestion)}
                      className="underline cursor-pointer shrink-0"
                    >
                      Use “{uniqueModalKeySuggestion}”
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="create-key-comment" className="text-label-2">
                  Comment
                </label>
                <input
                  id="create-key-comment"
                  type="text"
                  placeholder="e.g. you@company.com"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={modalField}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="create-key-pass" className="text-label-2">
                  Passphrase <span className="text-label-3">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    id="create-key-pass"
                    type={showPassphrase ? "text" : "password"}
                    placeholder="Leave blank for no passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className={`${modalField} font-mono pr-9`}
                  />
                  <button
                    type="button"
                    aria-label={showPassphrase ? "Hide passphrase" : "Show passphrase"}
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-label-3 hover:text-label cursor-pointer"
                  >
                    {showPassphrase ? <BsEyeSlash /> : <BsEye />}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-[13px]">
              <div className="flex items-center gap-2 text-emerald-300">
                <BsCheckCircleFill className="shrink-0" />
                <span className="font-medium">{generatedResult?.file_name} created and loaded</span>
              </div>
              <p className="text-label-2 leading-relaxed">
                Copy the public key and add it to GitHub, GitLab or your server's authorized_keys.
              </p>
            </div>
          )}
        </Dialog>
      )}

      {isAlgoModalOpen && (
        <Dialog title="Default algorithm" subtitle="Used when creating new keys" onClose={() => setIsAlgoModalOpen(false)}>
          <div className="rounded-card bg-card divide-y divide-white/[0.06] overflow-hidden text-[13px]">
            {(
              [
                ["ed25519", "Ed25519", "Modern, fast and secure. Recommended."],
                ["rsa", "RSA 4096", "Maximum compatibility with legacy servers."],
                ["ecdsa", "ECDSA P-256", "NIST standard elliptic curve."],
              ] as const
            ).map(([id, name, desc]) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSelectDefaultAlgo(id)}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-white/[0.05] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/70"
              >
                <div>
                  <div className="text-label">{name}</div>
                  <div className="text-xs text-label-3">{desc}</div>
                </div>
                {defaultAlgo === id && <BsCheckLg className="text-accent shrink-0" />}
              </button>
            ))}
          </div>
        </Dialog>
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
