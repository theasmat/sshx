import { Badge, Button, Field, Group, Hint, Notice, inputCls } from "../components/ui";
import { ConfigPreview } from "../components/ConfigPreview";
import { askConfirm } from "../utils/confirm";
import { toast } from "../utils/toast";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BsCheckLg,
  BsChevronDown,
  BsChevronRight,
  BsPencilSquare,
  BsTrash3,
  BsBookmarkPlusFill,
} from "react-icons/bs";
import { BrandLogo } from "../components/BrandLogo";
import { KeyAuthCard, KeyMode } from "../components/KeyAuthCard";
import { KeyConflictModal } from "../components/KeyConflictModal";
import { PostCreationGuideModal } from "../components/PostCreationGuideModal";
import { PresetEditorModal } from "../components/PresetEditorModal";
import { SshHost, SshKeyInfo, PresetTemplate } from "../types";
import { getAllPresets, saveCustomPreset, deleteCustomPreset } from "../presets";
import { api } from "../api";
import { findSiblingHosts, getAccountLabel, isGitHost } from "../utils/hostUtils";
import { suggestHostAlias, isBareHostnameAlias, keyConflictHosts, hostsUsingKey } from "../utils/keyUtils";
import {
  isHostAliasDuplicate,
  getUniqueHostAlias,
  findMatchingExistingKey,
} from "../utils/keyUtils";

interface AddHostViewProps {
  initialHost: SshHost | null;
  initialPreset?: PresetTemplate | null;
  initialScreen?: "hub" | "interactive" | "fast" | "presets";
  existingKeys: SshKeyInfo[];
  existingHosts: SshHost[];
  onSave: (host: SshHost) => void;
  onCancel: () => void;
  onRefreshKeys: () => void;
  onConnect?: (host: SshHost) => void;
  onOpenRawConfig?: () => void;
  hostAccounts?: Record<string, string>;
}

export const AddHostView: React.FC<AddHostViewProps> = ({
  initialHost,
  initialPreset,
  initialScreen,
  existingKeys,
  existingHosts,
  onSave,
  onCancel,
  onRefreshKeys,
  onConnect,
  onOpenRawConfig,
  hostAccounts,
}) => {
  // Screen state: "hub" (Entry 3-card selector) vs "interactive" vs "fast" vs "presets"
  const [activeScreen, setActiveScreen] = useState<"form" | "presets">(
    !initialHost && initialScreen === "presets" ? "presets" : "form"
  );

  // How this host signs in; chosen explicitly so a key is never linked by accident.
  const [keyMode, setKeyMode] = useState<KeyMode>(initialHost ? (initialHost.identity_file ? "existing" : "agent") : "new");
  const modeTouched = useRef(false);
  const [allowShared, setAllowShared] = useState(false);
  // An existing key that matches the chosen template's recommended name; offered, never auto-linked.
  const [presetKeyHint, setPresetKeyHint] = useState<SshKeyInfo | null>(null);

  // Preset gallery / search state
  const [presetsList, setPresetsList] = useState<PresetTemplate[]>([]);
  const [presetSearch, setPresetSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPreset, setSelectedPreset] = useState<PresetTemplate | null>(null);

  // Preset Editor Modal state
  const [isPresetEditorOpen, setIsPresetEditorOpen] = useState(false);
  const [presetBeingEdited, setPresetBeingEdited] = useState<PresetTemplate | null>(null);

  // Form State
  const [formData, setFormData] = useState<SshHost>({
    id: "",
    host_pattern: "",
    host_name: "",
    user: "",
    port: 22,
    identity_file: "",
    identities_only: false,
    proxy_jump: "",
    proxy_command: "",
    forward_agent: false,
    local_forward: [],
    remote_forward: [],
    dynamic_forward: "",
    server_alive_interval: null,
    server_alive_count_max: null,
    strict_host_key_checking: null,
    custom_directives: [],
    tags: [],
    group: "",
    notes: "",
    color: "blue",
    comments: [],
  });

  const [tagInput, setTagInput] = useState("");
  const [localForwardInput, setLocalForwardInput] = useState("");
  const [saveAsPreset, setSaveAsPreset] = useState(false);
  const [customPresetTitle, setCustomPresetTitle] = useState("");

  // Modals state for Conflict & Post-Creation Guidance
  const [conflictModalState, setConflictModalState] = useState<{
    isOpen: boolean;
    conflictKeyName: string;
    uniqueSuggestionName: string;
    existingKey?: SshKeyInfo;
  }>({
    isOpen: false,
    conflictKeyName: "",
    uniqueSuggestionName: "",
  });

  const [guideModalState, setGuideModalState] = useState<{
    isOpen: boolean;
    host: SshHost | null;
    keyInfo: SshKeyInfo | null;
    publicKeyContent: string | null;
    preset: PresetTemplate | null;
    pendingSaveAfterGuide?: boolean;
  }>({
    isOpen: false,
    host: null,
    keyInfo: null,
    publicKeyContent: null,
    preset: null,
    pendingSaveAfterGuide: false,
  });

  // Available Keys State (synced from existingKeys prop + dynamically created keys)
  const [availableKeys, setAvailableKeys] = useState<SshKeyInfo[]>(existingKeys);

  useEffect(() => {
    setAvailableKeys((prev) => {
      const map = new Map<string, SshKeyInfo>();
      for (const k of existingKeys) {
        map.set(k.private_path, k);
      }
      for (const k of prev) {
        if (!map.has(k.private_path)) {
          map.set(k.private_path, k);
        }
      }
      return Array.from(map.values());
    });
  }, [existingKeys]);

  // Load presets on mount
  useEffect(() => {
    setPresetsList(getAllPresets());
  }, []);



  const sameTargetHosts = useMemo(
    () => findSiblingHosts({ ...formData, id: initialHost?.id ?? "" }, existingHosts),
    [formData, existingHosts, initialHost]
  );

  const account = getAccountLabel(formData);

  // Default to "new identity" when other hosts already use this server or an account label is set.
  useEffect(() => {
    if (initialHost || modeTouched.current) return;
    setKeyMode(sameTargetHosts.length > 0 || account ? "identity" : "new");
  }, [initialHost, sameTargetHosts.length, account]);

  const isGitTarget = isGitHost(formData);
  const sharedKeyHosts = formData.identity_file
    ? keyConflictHosts(formData.identity_file, formData.host_name, existingHosts, initialHost?.id ?? formData.id)
    : [];

  const setAccount = (value: string) => {
    const clean = value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
    setFormData((prev) => ({
      ...prev,
      tags: [
        ...prev.tags.filter((t) => !t.toLowerCase().startsWith("account:")),
        ...(clean ? [`account:${clean}`] : []),
      ],
    }));
  };

  // Alias that names the account ("github-work") instead of the bare hostname.
  const aliasSuggestion = useMemo(
    () => suggestHostAlias(formData.host_name || "", account, existingHosts, initialHost?.id),
    [formData.host_name, account, existingHosts, initialHost]
  );
  const aliasIsBare = isBareHostnameAlias(formData.host_pattern, formData.host_name);
  const showAliasSuggestion =
    !!aliasSuggestion &&
    aliasSuggestion !== formData.host_pattern &&
    (!formData.host_pattern.trim() || aliasIsBare || formData.host_pattern === formData.host_name);

  const aliasHint = showAliasSuggestion ? (
    <div className="rounded-ctl bg-accent/15 text-label px-3 py-2 flex items-center justify-between gap-2 text-xs">
      <span className="min-w-0">
        {aliasIsBare
          ? `"${formData.host_pattern}" would make every repo use this key by default. `
          : "Suggested alias: "}
        <code className="font-mono">{aliasSuggestion}</code>
      </span>
      <button
        type="button"
        onClick={() => setFormData((prev) => ({ ...prev, host_pattern: aliasSuggestion }))}
        className="text-accent hover:underline font-medium shrink-0 cursor-pointer"
      >
        Use it
      </button>
    </div>
  ) : null;

  // Hosts sharing one server need IdentitiesOnly, or ssh offers agent keys
  // first and may log in as the wrong account.
  const hostToSave: SshHost = useMemo(
    () =>
      sameTargetHosts.length > 0 && formData.identity_file && formData.identities_only == null
        ? { ...formData, identities_only: true }
        : formData,
    [formData, sameTargetHosts]
  );

  const isAliasDuplicate = useMemo(
    () => isHostAliasDuplicate(formData.host_pattern, existingHosts, initialHost?.id),
    [formData.host_pattern, existingHosts, initialHost]
  );

  const uniqueAliasSuggestion = useMemo(
    () => getUniqueHostAlias(formData.host_pattern, existingHosts, initialHost?.id),
    [formData.host_pattern, existingHosts, initialHost]
  );

  // Sync initial host if editing, or apply initialPreset if given
  useEffect(() => {
    if (initialHost) {
      setFormData({ ...initialHost });
      setActiveScreen("form");
    } else if (initialPreset) {
      handleApplyPreset(initialPreset);
    } else {
      setFormData({
        id: `host_${Date.now()}`,
        host_pattern: "",
        host_name: "",
        user: "",
        port: 22,
        identity_file: "",
        identities_only: false,
        proxy_jump: "",
        proxy_command: "",
        forward_agent: false,
        local_forward: [],
        remote_forward: [],
        dynamic_forward: "",
        server_alive_interval: null,
        server_alive_count_max: null,
        strict_host_key_checking: null,
        custom_directives: [],
        tags: [],
        group: "",
        notes: "",
        color: "blue",
        comments: [],
      });
      setSelectedPreset(null);
      setActiveScreen(initialScreen === "presets" ? "presets" : "form");
    }
  }, [initialHost, initialPreset, initialScreen]);

  // Apply a preset template
  const handleApplyPreset = (preset: PresetTemplate) => {
    setSelectedPreset(preset);

    // Automatically resolve host alias if duplicate
    const baseHostPattern = preset.defaultHost.host_pattern || preset.id;
    const resolvedHostPattern = getUniqueHostAlias(baseHostPattern, existingHosts);

    const newHost: SshHost = {
      id: initialHost?.id || `host_${Date.now()}`,
      host_pattern: resolvedHostPattern,
      host_name: preset.defaultHost.host_name || "",
      user: preset.defaultHost.user || "",
      port: preset.defaultHost.port || 22,
      identity_file: preset.defaultHost.identity_file || "",
      identities_only: preset.defaultHost.identities_only ?? false,
      proxy_jump: preset.defaultHost.proxy_jump || "",
      proxy_command: preset.defaultHost.proxy_command || "",
      forward_agent: preset.defaultHost.forward_agent ?? false,
      local_forward: preset.defaultHost.local_forward || [],
      remote_forward: preset.defaultHost.remote_forward || [],
      dynamic_forward: preset.defaultHost.dynamic_forward || "",
      server_alive_interval: preset.defaultHost.server_alive_interval ?? null,
      server_alive_count_max: preset.defaultHost.server_alive_count_max ?? null,
      strict_host_key_checking: preset.defaultHost.strict_host_key_checking ?? null,
      custom_directives: preset.defaultHost.custom_directives || [],
      tags: preset.defaultHost.tags || [],
      group: preset.defaultHost.group || "",
      notes: preset.defaultHost.notes || "",
      color: preset.defaultHost.color || "blue",
      comments: preset.defaultHost.comments || [],
    };

    setPresetKeyHint(
      preset.keyRecommendation && !newHost.identity_file
        ? findMatchingExistingKey(preset.keyRecommendation.keyName, availableKeys) || null
        : null
    );

    setFormData(newHost);
    setActiveScreen("form");
  };

  // Tag helpers
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim().toLowerCase()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tagToRemove),
    });
  };

  // Forward helper
  const handleAddLocalForward = () => {
    if (localForwardInput.trim()) {
      setFormData({
        ...formData,
        local_forward: [...formData.local_forward, localForwardInput.trim()],
      });
      setLocalForwardInput("");
    }
  };

  const handleRemoveLocalForward = (idx: number) => {
    setFormData({
      ...formData,
      local_forward: formData.local_forward.filter((_, i) => i !== idx),
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.host_pattern.trim()) {
      toast.error("Host alias is required.");
      return;
    }

    const toSave = hostToSave;

    if (keyMode === "identity" && !account) {
      toast.error("Add an account label (for example work or personal) for the new identity.");
      return;
    }
    if ((keyMode === "identity" || keyMode === "new" || keyMode === "existing") && !formData.identity_file) {
      toast.error(keyMode === "existing" ? "Choose a key, or pick Agent default." : "Generate the key first, or pick Agent default.");
      return;
    }
    if (keyMode === "existing" && isGitTarget && sharedKeyHosts.length > 0 && !allowShared) {
      toast.error(`That key already belongs to ${sharedKeyHosts[0].host_pattern}. Choose another key or create a new identity.`);
      return;
    }

    if (saveAsPreset && customPresetTitle.trim()) {
      const customPreset: PresetTemplate = {
        id: `custom-${Date.now()}`,
        category: "custom",
        title: customPresetTitle.trim(),
        subtitle: `Custom preset for ${formData.host_pattern}`,
        iconName: "sparkles",
        badge: "Custom",
        defaultHost: { ...formData },
      };
      saveCustomPreset(customPreset);
    }

    // For newly created hosts from presets or with configured keys, open PostCreationGuideModal
    if (!initialHost && (selectedPreset?.postCreationGuide || formData.identity_file)) {
      try {
        await api.saveHost(toSave);
        onRefreshKeys();
      } catch (err) {
        console.error("Auto pre-saving host before guide modal:", err);
      }
      const currentKey = availableKeys.find(
        (k) =>
          k.private_path === formData.identity_file ||
          k.file_name === formData.identity_file ||
          k.file_name === formData.identity_file?.split("/").pop()
      );
      setGuideModalState({
        isOpen: true,
        host: toSave,
        keyInfo: currentKey || null,
        publicKeyContent: currentKey?.public_key_content || null,
        preset: selectedPreset,
        pendingSaveAfterGuide: true,
      });
      return;
    }

    onSave(toSave);
  };

  // Filtered Presets for Search & Gallery
  const filteredPresets = useMemo(() => {
    return presetsList.filter((p) => {
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
      if (presetSearch.trim()) {
        const q = presetSearch.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchSub = p.subtitle.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        const matchHost = (p.defaultHost.host_name || "").toLowerCase().includes(q);
        return matchTitle || matchSub || matchId || matchHost;
      }
      return true;
    });
  }, [presetsList, selectedCategory, presetSearch]);

  const categories = [
    { id: "all", label: "All Presets" },
    { id: "git", label: "Git (GitHub/GitLab)" },
    { id: "cloud", label: "Cloud VPS (AWS/Hetzner/DO)" },
    { id: "bastion", label: "Bastions & Jump" },
    { id: "homelab", label: "Homelab & Pi" },
    { id: "tunnel", label: "Database Tunnels" },
    { id: "custom", label: "Custom Presets" },
  ];

  // Dynamic Wizard Steps:
  // If from a preset with fixed HostName, User, and Port, we only ask what is ACTUALLY required or missing!

  const advancedHasContent = !!(
    initialHost &&
    (initialHost.group ||
      initialHost.tags.length ||
      initialHost.proxy_jump ||
      initialHost.local_forward.length)
  );

  const [advancedOpen, setAdvancedOpen] = useState(advancedHasContent);

  return (
    <div className="h-full flex flex-col bg-app text-[13px] select-none overflow-hidden">
      <div className="px-5 h-12 flex items-center justify-between shrink-0">
        <h2 className="text-[15px] font-semibold text-label">
          {activeScreen === "presets" ? "Templates" : initialHost ? `Edit ${initialHost.host_pattern}` : "New Host"}
        </h2>
        {activeScreen === "presets" ? (
          <Button variant="plain" onClick={() => setActiveScreen("form")}>
            Back to form
          </Button>
        ) : (
          !initialHost && (
            <Button variant="plain" onClick={() => setActiveScreen("presets")}>
              Browse templates
            </Button>
          )
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {activeScreen === "form" && (
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
            {!initialHost && presetsList.length > 0 && (
              <section className="space-y-1.5">
                <h3 className="px-1 text-[11px] font-medium uppercase tracking-wide text-label-3">
                  Start from a template
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {presetsList.slice(0, 6).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      aria-pressed={selectedPreset?.id === preset.id}
                      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                        selectedPreset?.id === preset.id
                          ? "bg-accent text-white"
                          : "bg-white/[0.06] text-label hover:bg-white/[0.1]"
                      }`}
                    >
                      <BrandLogo name={preset.id} className="w-3.5 h-3.5" />
                      <span>{preset.title}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <Group title="Server">
              <Field label="Address">
                <input
                  type="text"
                  autoFocus={!initialHost}
                  aria-label="Server address"
                  placeholder="IP or domain, e.g. github.com"
                  value={formData.host_name || ""}
                  onChange={(e) => {
                    const host_name = e.target.value.trim();
                    // git providers always log in as "git"; prefill so same-address accounts match up
                    const gitUser = /(github\.com|gitlab\.com|bitbucket\.org)$/i.test(host_name) && !formData.user;
                    setFormData({ ...formData, host_name, ...(gitUser ? { user: "git" } : {}) });
                  }}
                  className={`${inputCls} font-mono`}
                />
                {sameTargetHosts.length > 0 && (
                  <Notice>
                    Already configured as{" "}
                    {sameTargetHosts
                      .map((h) => `${h.host_pattern} (${h.identity_file ? h.identity_file.split("/").pop() : "default key"})`)
                      .join(", ")}
                    . Give this one its own alias and key.
                  </Notice>
                )}
              </Field>
              <Field label="Account">
                <input
                  type="text"
                  aria-label="Account label"
                  placeholder="Optional, e.g. work or personal"
                  value={account || ""}
                  onChange={(e) => setAccount(e.target.value)}
                  className={inputCls}
                />
                <Hint>Names the alias and key, and shows next to this host in the list.</Hint>
              </Field>
              <Field label="Alias">
                <input
                  type="text"
                  required
                  aria-label="Host alias"
                  placeholder="e.g. prod-db, github-work"
                  value={formData.host_pattern}
                  onChange={(e) => setFormData({ ...formData, host_pattern: e.target.value.trim() })}
                  className={`${inputCls} font-mono`}
                />
                <Hint>
                  Connect with <code className="font-mono text-label-2">ssh {formData.host_pattern || "alias"}</code>
                </Hint>
                {isAliasDuplicate && (
                  <Notice>
                    “{formData.host_pattern}” already exists.{" "}
                    <button
                      type="button"
                      className="underline cursor-pointer"
                      onClick={() => setFormData((prev) => ({ ...prev, host_pattern: uniqueAliasSuggestion }))}
                    >
                      Use “{uniqueAliasSuggestion}”
                    </button>
                  </Notice>
                )}
                {aliasHint}
              </Field>
              <Field label="User">
                <input
                  type="text"
                  aria-label="User"
                  placeholder="e.g. root, ubuntu, git"
                  value={formData.user || ""}
                  onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <Field label="Port">
                <input
                  type="number"
                  aria-label="SSH port"
                  value={formData.port || 22}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value, 10) || 22 })}
                  className={`${inputCls} font-mono w-28`}
                />
              </Field>
            </Group>

            <section className="space-y-1.5">
              <h3 className="px-1 text-[11px] font-medium uppercase tracking-wide text-label-3">Authentication</h3>
              {presetKeyHint && !formData.identity_file && (
                <Notice>
                  This template suggests <code className="font-mono">{presetKeyHint.file_name}</code>, which already exists
                  {hostsUsingKey(presetKeyHint, existingHosts).length > 0
                    ? ` and is used by ${hostsUsingKey(presetKeyHint, existingHosts)
                        .map((h) => h.host_pattern)
                        .join(", ")}`
                    : ""}
                  .{" "}
                  <button
                    type="button"
                    className="underline cursor-pointer"
                    onClick={() => {
                      modeTouched.current = true;
                      setKeyMode("existing");
                      setAllowShared(false);
                      setFormData((prev) => ({ ...prev, identity_file: presetKeyHint.private_path, identities_only: true }));
                      setPresetKeyHint(null);
                    }}
                  >
                    Use it
                  </button>
                  {" · "}
                  <button type="button" className="underline cursor-pointer" onClick={() => setPresetKeyHint(null)}>
                    Create a new one
                  </button>
                </Notice>
              )}
              <KeyAuthCard
                identityFile={formData.identity_file || ""}
                identitiesOnly={formData.identities_only || false}
                onChangeIdentity={(newFile, idsOnly) => {
                  setFormData((prev) => ({ ...prev, identity_file: newFile, identities_only: idsOnly }));
                }}
                availableKeys={availableKeys}
                mode={keyMode}
                onModeChange={(m) => {
                  modeTouched.current = true;
                  setKeyMode(m);
                  setAllowShared(false);
                  setPresetKeyHint(null);
                }}
                existingHosts={existingHosts}
                currentHostId={initialHost?.id ?? formData.id}
                hostAccounts={hostAccounts}
                isGit={isGitTarget}
                allowShared={allowShared}
                onAllowSharedChange={setAllowShared}
                hostPattern={formData.host_pattern}
                hostName={formData.host_name}
                account={getAccountLabel(formData)}
                preset={selectedPreset}
                onRefreshKeys={onRefreshKeys}
                onOpenConflictModal={(data) => {
                  setConflictModalState({
                    isOpen: true,
                    conflictKeyName: data.conflictKeyName,
                    uniqueSuggestionName: data.uniqueSuggestionName,
                    existingKey: data.existingKey,
                  });
                }}
                onOpenGuideModal={(keyInfo, pubKey) => {
                  setGuideModalState({
                    isOpen: true,
                    host: formData,
                    keyInfo,
                    publicKeyContent: pubKey,
                    preset: selectedPreset,
                  });
                }}
              />
            </section>

            <section className="space-y-1.5">
              <button
                type="button"
                onClick={() => setAdvancedOpen((o) => !o)}
                aria-expanded={advancedOpen}
                className="flex items-center gap-1 px-1 text-[11px] font-medium uppercase tracking-wide text-label-3 hover:text-label-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded-ctl"
              >
                {advancedOpen ? <BsChevronDown className="w-2.5 h-2.5" /> : <BsChevronRight className="w-2.5 h-2.5" />}
                <span>Advanced</span>
              </button>

              {advancedOpen && (
                <Group>
                  <Field label="Group">
                    <input
                      type="text"
                      aria-label="Group"
                      placeholder="e.g. Production, Homelab"
                      value={formData.group || ""}
                      onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Tags">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        aria-label="Add tag"
                        placeholder="Add tag and press Return"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        className={inputCls}
                      />
                      <Button type="button" onClick={handleAddTag}>
                        Add
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {formData.tags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 rounded-full bg-white/[0.08] text-label text-xs"
                          >
                            {t}
                            <button
                              type="button"
                              aria-label={`Remove tag ${t}`}
                              onClick={() => handleRemoveTag(t)}
                              className="text-label-3 hover:text-label cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </Field>
                  <Field label="Jump host">
                    <select
                      aria-label="ProxyJump"
                      value={formData.proxy_jump || ""}
                      onChange={(e) => setFormData({ ...formData, proxy_jump: e.target.value })}
                      className={`${inputCls} font-mono`}
                    >
                      <option value="">None (direct connection)</option>
                      {existingHosts
                        .filter((h) => h.host_pattern !== formData.host_pattern)
                        .map((h) => (
                          <option key={h.id} value={h.host_pattern}>
                            {h.host_pattern} ({h.host_name || "alias"})
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label="Local forward">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        aria-label="Local port forward"
                        placeholder="e.g. 5432 127.0.0.1:5432"
                        value={localForwardInput}
                        onChange={(e) => setLocalForwardInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddLocalForward();
                          }
                        }}
                        className={`${inputCls} font-mono`}
                      />
                      <Button type="button" onClick={handleAddLocalForward}>
                        Add
                      </Button>
                    </div>
                    {formData.local_forward.map((lf, i) => (
                      <div key={i} className="flex items-center justify-between font-mono text-xs text-label-2">
                        <span>{lf}</span>
                        <button
                          type="button"
                          aria-label={`Remove forward ${lf}`}
                          onClick={() => handleRemoveLocalForward(i)}
                          className="text-label-3 hover:text-label cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </Field>
                  <Field label="Template">
                    <label className="flex items-center gap-2 cursor-pointer text-label">
                      <input
                        type="checkbox"
                        checked={saveAsPreset}
                        onChange={(e) => setSaveAsPreset(e.target.checked)}
                        className="w-4 h-4 accent-[#0a84ff] cursor-pointer"
                      />
                      <span>Save as reusable template</span>
                    </label>
                    {saveAsPreset && (
                      <input
                        type="text"
                        required
                        aria-label="Template name"
                        placeholder="Template name"
                        value={customPresetTitle}
                        onChange={(e) => setCustomPresetTitle(e.target.value)}
                        className={inputCls}
                      />
                    )}
                  </Field>
                </Group>
              )}
            </section>

            <section className="space-y-1.5">
              <h3 className="px-1 text-[11px] font-medium uppercase tracking-wide text-label-3">
                {initialHost ? "Changes to ~/.ssh/config" : "Will be added to ~/.ssh/config"}
              </h3>
              <ConfigPreview host={hostToSave} original={initialHost} className="rounded-card !p-4 !border-0 bg-card" />
            </section>

            <div className="sticky bottom-0 -mx-5 px-5 py-3 flex items-center justify-end gap-2 bg-app/90 backdrop-blur">
              <Button type="button" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={<BsCheckLg />}>
                {initialHost ? "Save Changes" : "Save Host"}
              </Button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: PRESETS GALLERY (Full Catalog) */}
        {/* ========================================================================= */}
        {activeScreen === "presets" && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-label-2">Pick a template to pre-fill a host, or make your own.</p>
              <Button
                type="button"
                icon={<BsBookmarkPlusFill />}
                onClick={() => {
                  setPresetBeingEdited(null);
                  setIsPresetEditorOpen(true);
                }}
              >
                New Template
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  aria-pressed={selectedCategory === cat.id}
                  className={`h-7 px-3 rounded-full text-[13px] cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                    selectedCategory === cat.id ? "bg-accent text-white" : "bg-white/[0.06] text-label-2 hover:text-label"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              aria-label="Search templates"
              placeholder="Search templates"
              value={presetSearch}
              onChange={(e) => setPresetSearch(e.target.value)}
              className={inputCls}
            />

            {filteredPresets.length === 0 ? (
              <div className="rounded-card bg-card px-6 py-10 text-center text-label-3">No templates match your search</div>
            ) : (
              <div className="rounded-card bg-card divide-y divide-white/[0.06] overflow-hidden">
                {filteredPresets.map((preset) => {
                  const isCustom = preset.id.startsWith("preset_custom_") || preset.category === "custom";
                  const d = preset.defaultHost;
                  return (
                    <div key={preset.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-ctl bg-control flex items-center justify-center shrink-0 text-label">
                        <BrandLogo
                          name={preset.id}
                          hostName={d.host_name}
                          tags={d.tags}
                          group={d.group}
                          category={preset.category}
                          className="w-5 h-5"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-label truncate">{preset.title}</span>
                          {preset.badge && <Badge>{preset.badge}</Badge>}
                        </div>
                        <div className="text-xs text-label-2 truncate">{preset.subtitle}</div>
                        <div className="text-xs text-label-3 font-mono truncate">
                          {d.host_pattern}
                          {d.host_name ? ` · ${d.user ? `${d.user}@` : ""}${d.host_name}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          aria-label={`Edit template ${preset.title}`}
                          title="Edit template"
                          onClick={() => {
                            setPresetBeingEdited(preset);
                            setIsPresetEditorOpen(true);
                          }}
                          className="h-8 w-8 flex items-center justify-center rounded-ctl text-label-3 hover:text-label hover:bg-white/[0.06] cursor-pointer"
                        >
                          <BsPencilSquare />
                        </button>
                        {isCustom && (
                          <button
                            type="button"
                            aria-label={`Delete template ${preset.title}`}
                            title="Delete template"
                            onClick={async () => {
                              const ok = await askConfirm({
                                title: "Delete template?",
                                message: `Delete custom template "${preset.title}"?`,
                                confirmLabel: "Delete",
                                danger: true,
                              });
                              if (ok) {
                                deleteCustomPreset(preset.id);
                                setPresetsList(getAllPresets());
                              }
                            }}
                            className="h-8 w-8 flex items-center justify-center rounded-ctl text-label-3 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                          >
                            <BsTrash3 />
                          </button>
                        )}
                        <Button type="button" variant="primary" onClick={() => handleApplyPreset(preset)}>
                          Use
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Key Conflict 3-Option Resolution Modal */}
      <KeyConflictModal
        isOpen={conflictModalState.isOpen}
        onClose={() => setConflictModalState((prev) => ({ ...prev, isOpen: false }))}
        conflictKeyName={conflictModalState.conflictKeyName}
        uniqueSuggestionName={conflictModalState.uniqueSuggestionName}
        existingKey={conflictModalState.existingKey}
        onAutoResolve={async (uniqueName) => {
          setConflictModalState((prev) => ({ ...prev, isOpen: false }));
          try {
            const result = await api.generateKey({
              name: uniqueName,
              key_type: "ed25519",
              comment: `${formData.host_pattern || uniqueName}@sshx`,
            });
            const newKeyObj: SshKeyInfo = {
              file_name: result.file_name,
              private_path: result.private_path,
              public_path: result.public_path,
              key_type: "ed25519",
              bits: 256,
              fingerprint_sha256: result.fingerprint_sha256 || "",
              comment: `${formData.host_pattern || uniqueName}@sshx`,
              public_key_content: result.public_key_content,
              is_agent_loaded: true,
            };
            setAvailableKeys((prev) => [newKeyObj, ...prev.filter((k) => k.private_path !== result.private_path)]);
            const updatedHost: SshHost = {
              ...formData,
              identity_file: result.private_path,
              identities_only: true,
            };
            setFormData(updatedHost);
            try {
              await api.saveHost(updatedHost);
            } catch (err) {
              console.error("Auto pre-saving host:", err);
            }
            onRefreshKeys();
            setGuideModalState({
              isOpen: true,
              host: updatedHost,
              keyInfo: newKeyObj,
              publicKeyContent: result.public_key_content || null,
              preset: selectedPreset,
              pendingSaveAfterGuide: true,
            });
          } catch (err) {
            toast.error(`Auto-resolve key generation failed: ${err}`);
          }
        }}
        onManualSelect={() => {
          setConflictModalState((prev) => ({ ...prev, isOpen: false }));
        }}
        onForceUseExisting={(existingKey) => {
          setConflictModalState((prev) => ({ ...prev, isOpen: false }));
          setFormData((prev) => ({
            ...prev,
            identity_file: existingKey.private_path,
            identities_only: true,
          }));
        }}
      />

      {/* Post-Creation / Setup Guidance Modal */}
      <PostCreationGuideModal
        isOpen={guideModalState.isOpen}
        onClose={() => {
          const hostToSave = guideModalState.host || formData;
          setGuideModalState((prev) => ({ ...prev, isOpen: false, pendingSaveAfterGuide: false }));
          onSave(hostToSave);
        }}
        host={guideModalState.host || formData}
        keyInfo={guideModalState.keyInfo}
        publicKeyContent={guideModalState.publicKeyContent}
        preset={guideModalState.preset || selectedPreset}
        onConnect={(hostToConnect) => {
          const hostToSave = hostToConnect || guideModalState.host || formData;
          setGuideModalState((prev) => ({ ...prev, isOpen: false, pendingSaveAfterGuide: false }));
          onSave(hostToSave);
          if (onConnect) {
            onConnect(hostToSave);
          }
        }}
        onOpenRawConfig={onOpenRawConfig}
      />

      {/* Custom Preset Add / Edit Modal */}
      <PresetEditorModal
        isOpen={isPresetEditorOpen}
        onClose={() => {
          setIsPresetEditorOpen(false);
          setPresetBeingEdited(null);
        }}
        editingPreset={presetBeingEdited}
        onSavePreset={(newPreset) => {
          saveCustomPreset(newPreset);
          setPresetsList(getAllPresets());
        }}
        onDeletePreset={(presetId) => {
          deleteCustomPreset(presetId);
          setPresetsList(getAllPresets());
        }}
      />
    </div>
  );
};
