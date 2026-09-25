import React, { useState, useEffect, useMemo } from "react";
import {
  BsLightningChargeFill,
  BsSliders,
  BsServer,
  BsShieldLock,
  BsPlusLg,
  BsCheckLg,
  BsChevronRight,
  BsChevronLeft,
  BsStars,
  BsInfoCircleFill,
  BsArrowRight,
  BsSearch,
  BsXLg,
  BsGridFill,
  BsExclamationTriangleFill,
  BsPencilSquare,
  BsTrash3,
  BsRocketTakeoff,
  BsBookmarkPlusFill,
} from "react-icons/bs";
import { BrandLogo } from "../components/BrandLogo";
import { KeyAuthCard } from "../components/KeyAuthCard";
import { KeyConflictModal } from "../components/KeyConflictModal";
import { PostCreationGuideModal } from "../components/PostCreationGuideModal";
import { PresetEditorModal } from "../components/PresetEditorModal";
import { SshHost, SshKeyInfo, PresetTemplate } from "../types";
import { getAllPresets, saveCustomPreset, deleteCustomPreset } from "../presets";
import { api } from "../api";
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
}) => {
  // Screen state: "hub" (Entry 3-card selector) vs "interactive" vs "fast" vs "presets"
  const [activeScreen, setActiveScreen] = useState<"hub" | "interactive" | "fast" | "presets">(
    initialHost ? "fast" : initialScreen || "hub"
  );

  // Sub-source within Interactive & Fast modes: "preset" vs "custom"
  const [creationSource, setCreationSource] = useState<"preset" | "custom">("preset");

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

  // Interactive Wizard Step (1-indexed)
  const [wizardStep, setWizardStep] = useState<number>(1);

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
      setActiveScreen("fast");
      setCreationSource("custom");
    } else if (initialPreset) {
      handleApplyPreset(initialPreset, initialScreen === "fast" ? "fast" : "interactive");
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
      if (initialScreen) {
        setActiveScreen(initialScreen);
      }
      setWizardStep(1);
    }
  }, [initialHost, initialPreset, initialScreen]);

  // Apply a preset template
  const handleApplyPreset = (
    preset: PresetTemplate,
    targetScreen: "interactive" | "fast" = "interactive"
  ) => {
    setSelectedPreset(preset);
    setCreationSource("preset");

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

    if (preset.keyRecommendation) {
      // If an existing key already exists with the recommended base name and host alias was not duplicate, pre-link it!
      const existingMatch = findMatchingExistingKey(preset.keyRecommendation.keyName, availableKeys);
      if (existingMatch && resolvedHostPattern === baseHostPattern && !newHost.identity_file) {
        newHost.identity_file = existingMatch.private_path;
        newHost.identities_only = true;
      }
    }

    setFormData(newHost);
    setActiveScreen(targetScreen);
    setWizardStep(1);
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
      alert("Host alias is required.");
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
        await api.saveHost(formData);
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
        host: formData,
        keyInfo: currentKey || null,
        publicKeyContent: currentKey?.public_key_content || null,
        preset: selectedPreset,
        pendingSaveAfterGuide: true,
      });
      return;
    }

    onSave(formData);
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
  const wizardSteps = useMemo(() => {
    const steps: {
      id: string;
      title: string;
      subtitle: string;
      helpTitle: string;
      helpContent: string;
      isRequired: boolean;
      isPreFilled: boolean;
      badgeText?: string;
    }[] = [];

    // Step 1: Host Alias
    steps.push({
      id: "alias",
      title: "What alias/nickname do you want for this host?",
      subtitle: "The quick shortcut you type in terminal to connect (e.g. ssh my-server).",
      helpTitle: "Host Alias in ~/.ssh/config",
      helpContent:
        "The Host alias lets you type 'ssh alias' in your terminal instead of typing long IP addresses and ports every time.",
      isRequired: true,
      isPreFilled: !!formData.host_pattern,
      badgeText: "Required",
    });

    // Step 2: HostName (Skip or prompt based on preset)
    const isGenericPlaceholderHost =
      !formData.host_name ||
      formData.host_name === "your-server-ip" ||
      formData.host_name === "your-droplet-ip" ||
      formData.host_name.includes("XX-XX");

    const isHostNamePreFixed =
      creationSource === "preset" &&
      selectedPreset &&
      selectedPreset.defaultHost.host_name &&
      !isGenericPlaceholderHost;

    if (!isHostNamePreFixed) {
      steps.push({
        id: "hostname",
        title: "What is the server address (HostName / IP)?",
        subtitle: "The public IPv4 address, domain name, or local network host.",
        helpTitle: "HostName Directive",
        helpContent:
          "Specifies the real hostname or IP to connect to. For cloud VPS, paste your public IP. For local servers, use .local or LAN IP.",
        isRequired: true,
        isPreFilled: !isGenericPlaceholderHost,
        badgeText: isGenericPlaceholderHost ? "Action Required" : "Pre-filled",
      });
    }

    // Step 3: User & Port (Only ask if custom or not pre-set)
    const isUserPortPreFixed =
      creationSource === "preset" &&
      selectedPreset &&
      selectedPreset.defaultHost.user &&
      selectedPreset.defaultHost.port;

    if (!isUserPortPreFixed) {
      steps.push({
        id: "user_port",
        title: "What username and SSH port should be used?",
        subtitle: "Standard SSH port is 22. Common logins: root, ubuntu, git, ec2-user.",
        helpTitle: "User & Port Directives",
        helpContent:
          "Specifies the remote account login. If left blank, SSH defaults to your current macOS username.",
        isRequired: false,
        isPreFilled: !!(formData.user && formData.port),
      });
    }

    // Step 4: Authentication & Private Key
    steps.push({
      id: "auth",
      title: "Which SSH Key should be used for authentication?",
      subtitle: "Choose an existing key from ~/.ssh/ or generate a fresh Ed25519 key.",
      helpTitle: "IdentityFile & Security",
      helpContent:
        "Key-based authentication replaces passwords with cryptographic key pairs. Setting IdentitiesOnly yes ensures SSH only offers this specific key.",
      isRequired: false,
      isPreFilled: !!formData.identity_file,
      badgeText: formData.identity_file ? "Key Selected" : "Recommended",
    });

    // Step 5: Organization (Group & Tags)
    steps.push({
      id: "org",
      title: "How would you like to organize this host?",
      subtitle: "Assign a folder group and searchable tags for fast filtering.",
      helpTitle: "Organization & Grouping",
      helpContent:
        "Groups and tags are saved as structured metadata in ~/.ssh/config comments so they persist across machines without altering SSH behavior.",
      isRequired: false,
      isPreFilled: !!(formData.group || formData.tags.length > 0),
    });

    // Final Step: Review & Finalize
    steps.push({
      id: "review",
      title: "Review & Save your SSH Configuration",
      subtitle: "Inspect the generated ~/.ssh/config block before writing to disk.",
      helpTitle: "Safe Atomic Write",
      helpContent:
        "SSHX automatically backs up your existing config before writing and formats directives with standard OpenSSH indentation.",
      isRequired: true,
      isPreFilled: true,
    });

    return steps;
  }, [formData, selectedPreset, creationSource]);

  const currentStepInfo = wizardSteps[wizardStep - 1] || wizardSteps[0];
  const totalSteps = wizardSteps.length;

  return (
    <div className="h-full flex flex-col bg-[#070a10] text-xs select-none overflow-hidden">
      {/* Top Universal Sub-Header */}
      <div className="px-3.5 py-1.5 border-b border-[#1f2942] bg-[#090d16] flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveScreen("hub")}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Return to Add Host Hub"
          >
            <div className="w-6 h-6 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <BsPlusLg className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-bold text-white text-xs">
              {initialHost ? `Edit Host: ${initialHost.host_pattern}` : "Add SSH Host"}
            </h2>
          </button>
        </div>

        {/* Mode Navigation Pills */}
        <div className="flex items-center gap-1 bg-[#0f1422] p-0.5 rounded-md border border-[#1f2942]">
          <button
            type="button"
            onClick={() => setActiveScreen("hub")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeScreen === "hub"
                ? "bg-[#161d30] text-white border border-[#232f4d]"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <BsGridFill className="w-3 h-3 text-blue-400" />
            <span>Mode Selector</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveScreen("interactive");
              setWizardStep(1);
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeScreen === "interactive"
                ? "bg-purple-600/25 text-purple-300 border border-purple-500/40 font-semibold"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <BsStars className="w-3 h-3 text-purple-400" />
            <span>Interactive Wizard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen("fast")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeScreen === "fast"
                ? "bg-blue-600 text-white font-semibold"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <BsSliders className="w-3 h-3" />
            <span>Fast Form</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen("presets")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
              activeScreen === "presets"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <BsLightningChargeFill className="w-3 h-3 text-amber-400" />
            <span>Presets</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5">
        {/* ========================================================================= */}
        {/* VIEW 1: THE 3-CARD MODE SELECTION HUB */}
        {/* ========================================================================= */}
        {activeScreen === "hub" && (
          <div className="max-w-4xl mx-auto space-y-4 py-2 animate-in fade-in duration-150">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white tracking-tight">
                How would you like to configure your SSH host?
              </h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Choose the workflow that matches your preference. You can switch between modes at any time.
              </p>
            </div>

            {/* 3 Prominent Mode Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
              {/* Card 1: Interactive Wizard Mode */}
              <div
                onClick={() => {
                  setActiveScreen("interactive");
                  setWizardStep(1);
                }}
                className="group p-4 bg-[#0b0f19] hover:bg-[#121829] border border-purple-500/30 hover:border-purple-500/70 rounded-xl cursor-pointer transition-all flex flex-col justify-between gap-3 relative shadow-lg shadow-purple-500/5 hover:-translate-y-0.5"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-purple-500/10">
                      <BsStars className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Recommended
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm group-hover:text-purple-300 transition-colors">
                      Interactive Wizard
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Step-by-step guided assistant. Asks one focused question at a time with smart defaults, plain-English directive explanations, and automatic validation.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1f2942] flex items-center justify-between text-xs text-purple-400 font-semibold">
                  <span>Launch Wizard</span>
                  <BsArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Fast Form Mode */}
              <div
                onClick={() => setActiveScreen("fast")}
                className="group p-4 bg-[#0b0f19] hover:bg-[#121829] border border-blue-500/30 hover:border-blue-500/70 rounded-xl cursor-pointer transition-all flex flex-col justify-between gap-3 relative shadow-lg shadow-blue-500/5 hover:-translate-y-0.5"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-blue-500/10">
                      <BsSliders className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      Power Users
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors">
                      Fast Form Mode
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      All-in-one high-density form. Fill in all directives (Host, HostName, User, Port, Key, and Tunnels) on a single screen with live config block syntax preview.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1f2942] flex items-center justify-between text-xs text-blue-400 font-semibold">
                  <span>Open Fast Form</span>
                  <BsArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 3: Presets Catalog */}
              <div
                onClick={() => setActiveScreen("presets")}
                className="group p-4 bg-[#0b0f19] hover:bg-[#121829] border border-amber-500/30 hover:border-amber-500/70 rounded-xl cursor-pointer transition-all flex flex-col justify-between gap-3 relative shadow-lg shadow-amber-500/5 hover:-translate-y-0.5"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-amber-500/10">
                      <BsLightningChargeFill className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Ready Templates
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                      Quick Presets Catalog
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Search and browse curated best-practice profiles for GitHub, GitLab, AWS EC2, Hetzner, DigitalOcean, Raspberry Pi, and database tunnels.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1f2942] flex items-center justify-between text-xs text-amber-400 font-semibold">
                  <span>Browse Templates</span>
                  <BsArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Quick Cancel Button */}
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-400 hover:text-gray-200 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Cancel & Return to Hosts
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: INTERACTIVE WIZARD (Step-by-Step with Preset / Custom Toggler) */}
        {/* ========================================================================= */}
        {activeScreen === "interactive" && (
          <div className="max-w-2xl mx-auto space-y-3.5 py-1 animate-in fade-in duration-150">
            {/* Top Source Toggler: [⚡ From Preset] vs [✏️ Custom (From Scratch)] */}
            <div className="p-2.5 bg-[#090d16] border border-[#1f2942] rounded-xl flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-semibold text-xs">Source:</span>
                <div className="flex items-center bg-[#070a10] p-0.5 rounded-lg border border-[#1f2942]">
                  <button
                    type="button"
                    onClick={() => {
                      setCreationSource("preset");
                      setWizardStep(1);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      creationSource === "preset"
                        ? "bg-purple-600/25 text-purple-300 border border-purple-500/40 font-semibold shadow-sm"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <BsLightningChargeFill className="w-3 h-3 text-amber-400" />
                    <span>From Preset Template</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCreationSource("custom");
                      setSelectedPreset(null);
                      setWizardStep(1);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      creationSource === "custom"
                        ? "bg-blue-600 text-white font-semibold shadow-sm"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <BsSliders className="w-3 h-3" />
                    <span>Custom (From Scratch)</span>
                  </button>
                </div>
              </div>

              {selectedPreset && creationSource === "preset" && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs">
                  <BrandLogo name={selectedPreset.id} className="w-3.5 h-3.5" />
                  <span className="font-semibold">{selectedPreset.title}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPreset(null)}
                    className="hover:text-rose-400 ml-1 cursor-pointer"
                    title="Clear preset"
                  >
                    <BsXLg className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* If "From Preset" is chosen and no preset selected yet: show search & preset selector list */}
            {creationSource === "preset" && !selectedPreset ? (
              <div className="p-4 bg-[#0b0f19] border border-[#1f2942] rounded-2xl space-y-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">Select a Preset to Begin</h4>
                  <p className="text-xs text-gray-400">
                    Choosing a template pre-fills standard parameters and asks only for required credentials.
                  </p>
                </div>

                {/* Search bar & category chips */}
                <div className="space-y-2">
                  <div className="relative">
                    <BsSearch className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search presets (GitHub, AWS, Hetzner, Postgres...)"
                      value={presetSearch}
                      onChange={(e) => setPresetSearch(e.target.value)}
                      className="w-full bg-[#070a10] border border-[#1f2942] rounded-xl pl-8 pr-3 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                          selectedCategory === cat.id
                            ? "bg-purple-600/20 text-purple-300 border-purple-500/40 font-semibold"
                            : "bg-[#070a10] text-gray-400 border-[#1f2942] hover:text-gray-200"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Presets List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {filteredPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset, "interactive")}
                      className="p-2.5 bg-[#070a10] hover:bg-[#121829] border border-[#1f2942] hover:border-purple-500/50 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-lg bg-[#161d30] border border-[#232f4d] flex items-center justify-center shrink-0">
                          <BrandLogo name={preset.id} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-white text-xs truncate group-hover:text-purple-300">
                            {preset.title}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">
                            {preset.subtitle}
                          </div>
                        </div>
                      </div>
                      <BsChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Step-by-Step Interactive Card */
              <div className="space-y-3">
                {/* Wizard Header & Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 font-semibold font-mono text-[11px]">
                      Step {wizardStep} of {totalSteps}: {currentStepInfo.badgeText || "Configuration"}
                    </span>

                    <button
                      type="button"
                      onClick={() => setActiveScreen("fast")}
                      className="text-gray-400 hover:text-blue-400 text-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>Switch to Fast Form</span>
                      <BsSliders className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="w-full h-1.5 bg-[#161d30] rounded-full overflow-hidden flex">
                    {wizardSteps.map((step, idx) => (
                      <div
                        key={step.id}
                        className={`flex-1 border-r border-[#070a10] transition-all duration-300 ${
                          idx + 1 < wizardStep
                            ? "bg-emerald-500"
                            : idx + 1 === wizardStep
                            ? "bg-purple-500"
                            : "bg-transparent"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Step Card */}
                <div className="p-5 bg-[#0b0f19] border border-[#1f2942] rounded-2xl shadow-xl space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {currentStepInfo.title}
                    </h3>
                    <p className="text-xs text-gray-400">{currentStepInfo.subtitle}</p>
                  </div>

                  {/* STEP: Host Alias */}
                  {currentStepInfo.id === "alias" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-300 font-semibold mb-1 text-xs">
                          Host Alias (Terminal Shortcut) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          autoFocus
                          required
                          placeholder="e.g. prod-db, my-vps, github-work"
                          value={formData.host_pattern}
                          onChange={(e) =>
                            setFormData({ ...formData, host_pattern: e.target.value.trim() })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && formData.host_pattern) {
                              setWizardStep(2);
                            }
                          }}
                          className="w-full bg-[#070a10] border border-[#1f2942] rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Duplicate Host Alias Alert */}
                      {isAliasDuplicate && (
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-300 animate-in fade-in">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <BsExclamationTriangleFill className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">
                              Host alias "{formData.host_pattern}" already exists in ~/.ssh/config
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                host_pattern: uniqueAliasSuggestion,
                              }))
                            }
                            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 rounded-lg font-semibold text-xs shrink-0 cursor-pointer transition-colors shadow-sm"
                          >
                            Rename to "{uniqueAliasSuggestion}"
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP: HostName */}
                  {currentStepInfo.id === "hostname" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-300 font-semibold mb-1 text-xs">
                          Server Address (IP or Domain) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          autoFocus
                          required
                          placeholder="e.g. 192.168.1.50, my-domain.com, ec2-54-210.compute.amazonaws.com"
                          value={formData.host_name || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, host_name: e.target.value.trim() })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && formData.host_name) {
                              setWizardStep(3);
                            }
                          }}
                          className="w-full bg-[#070a10] border border-[#1f2942] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP: User & Port */}
                  {currentStepInfo.id === "user_port" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-300 font-semibold mb-1 text-xs">
                          Username (User)
                        </label>
                        <input
                          type="text"
                          autoFocus
                          placeholder="e.g. root, ubuntu, git, admin"
                          value={formData.user || ""}
                          onChange={(e) => setFormData({ ...formData, user: e.target.value.trim() })}
                          className="w-full bg-[#070a10] border border-[#1f2942] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                        />
                        <div className="flex gap-1 mt-2">
                          {["root", "ubuntu", "git", "ec2-user"].map((u) => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => setFormData({ ...formData, user: u })}
                              className="px-2 py-0.5 rounded bg-[#161d30] text-gray-300 text-[11px] font-mono border border-[#232f4d] cursor-pointer"
                            >
                              {u}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-300 font-semibold mb-1 text-xs">
                          SSH Port
                        </label>
                        <input
                          type="number"
                          value={formData.port || 22}
                          onChange={(e) =>
                            setFormData({ ...formData, port: parseInt(e.target.value, 10) || 22 })
                          }
                          className="w-full bg-[#070a10] border border-[#1f2942] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP: Auth & SSH Keys (Unified KeyAuthCard) */}
                  {currentStepInfo.id === "auth" && (
                    <div className="space-y-3">
                      <KeyAuthCard
                        identityFile={formData.identity_file || ""}
                        identitiesOnly={formData.identities_only || false}
                        onChangeIdentity={(newFile, idsOnly) => {
                          setFormData((prev) => ({
                            ...prev,
                            identity_file: newFile,
                            identities_only: idsOnly,
                          }));
                        }}
                        availableKeys={availableKeys}
                        hostPattern={formData.host_pattern}
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
                    </div>
                  )}

                  {/* STEP: Organization */}
                  {currentStepInfo.id === "org" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-gray-300 font-semibold mb-1 text-xs">
                          Folder / Category Group
                        </label>
                        <input
                          type="text"
                          autoFocus
                          placeholder="e.g. Production, Homelab, Cloud Servers"
                          value={formData.group || ""}
                          onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                          className="w-full bg-[#070a10] border border-[#1f2942] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-300 font-semibold mb-1 text-xs">
                          Tags
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Add tag and press Enter"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                            className="flex-1 bg-[#070a10] border border-[#1f2942] rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddTag}
                            className="px-3 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-200 border border-[#232f4d] rounded-xl font-medium cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP: Review */}
                  {currentStepInfo.id === "review" && (
                    <div className="space-y-3">
                      <div className="p-3 bg-[#070a10] border border-[#1f2942] rounded-xl space-y-1.5">
                        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Generated ~/.ssh/config Block Preview
                        </div>
                        <pre className="p-3 bg-[#05070c] border border-[#1f2942] rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
{`Host ${formData.host_pattern || "my-host"}
${formData.host_name ? `    HostName ${formData.host_name}\n` : ""}${formData.user ? `    User ${formData.user}\n` : ""}${formData.port && formData.port !== 22 ? `    Port ${formData.port}\n` : ""}${formData.identity_file ? `    IdentityFile ${formData.identity_file}\n` : ""}${formData.identities_only ? `    IdentitiesOnly yes\n` : ""}${formData.proxy_jump ? `    ProxyJump ${formData.proxy_jump}\n` : ""}${formData.local_forward.map((f) => `    LocalForward ${f}\n`).join("")}`}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Plain-English Help Note */}
                  <div className="p-3 bg-[#070a10]/80 border border-blue-500/20 rounded-xl space-y-1 text-gray-300">
                    <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs">
                      <BsInfoCircleFill className="w-3.5 h-3.5" />
                      <span>{currentStepInfo.helpTitle}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      {currentStepInfo.helpContent}
                    </p>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-2 flex items-center justify-between border-t border-[#1f2942]">
                    <button
                      type="button"
                      disabled={wizardStep === 1}
                      onClick={() => setWizardStep((prev) => Math.max(prev - 1, 1))}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-xl font-medium disabled:opacity-30 cursor-pointer"
                    >
                      <BsChevronLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    {wizardStep < totalSteps ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (currentStepInfo.id === "alias" && !formData.host_pattern.trim()) {
                            alert("Host alias is required to proceed.");
                            return;
                          }
                          setWizardStep((prev) => Math.min(prev + 1, totalSteps));
                        }}
                        className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-purple-500/20 cursor-pointer"
                      >
                        <span>Next Step</span>
                        <BsArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSubmit()}
                        className="flex items-center gap-1.5 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
                      >
                        <BsCheckLg className="w-4 h-4" />
                        <span>Save Host to ~/.ssh/config</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: FAST FORM MODE (All-in-One Form with Preset / Custom Switcher) */}
        {/* ========================================================================= */}
        {activeScreen === "fast" && (
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-3 animate-in fade-in duration-150">
            {/* Top Preset / Custom Toggler bar */}
            <div className="p-2.5 bg-[#090d16] border border-[#1f2942] rounded-lg flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-semibold text-xs">Preset:</span>
                <div className="flex flex-wrap gap-1">
                  {presetsList.slice(0, 5).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset, "fast")}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
                        selectedPreset?.id === preset.id
                          ? "bg-blue-600 text-white border-blue-500"
                          : "bg-[#161d30] text-gray-300 border-[#232f4d] hover:bg-[#1f2942]"
                      }`}
                    >
                      <BrandLogo name={preset.id} className="w-3 h-3" />
                      <span>{preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveScreen("presets")}
                className="text-blue-400 hover:text-blue-300 text-xs font-semibold cursor-pointer"
              >
                Browse All Presets ➔
              </button>
            </div>

            {/* Section 1: Basic Parameters */}
            <div className="p-3 bg-[#0b0f19] border border-[#1f2942] rounded-lg space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-[#1f2942] text-gray-300 font-semibold text-xs">
                <BsServer className="w-3.5 h-3.5 text-blue-400" />
                <span>Basic Connection Parameters</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-gray-300 font-medium mb-1 text-xs">
                    Host Alias <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. prod-server, github-work, hetzner-01"
                    value={formData.host_pattern}
                    onChange={(e) =>
                      setFormData({ ...formData, host_pattern: e.target.value })
                    }
                    className="w-full bg-[#070a10] border border-[#1f2942] rounded px-2.5 py-1 text-white font-mono text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block leading-none">
                    Terminal shortcut: <code className="text-blue-400 font-mono">ssh {formData.host_pattern || "alias"}</code>
                  </span>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-0.5 text-xs">
                    HostName / IP Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 192.168.1.100, github.com, ec2.aws.com"
                    value={formData.host_name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, host_name: e.target.value })
                    }
                    className="w-full bg-[#070a10] border border-[#1f2942] rounded px-2.5 py-1 text-white font-mono text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1 text-xs">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. root, ubuntu, git, ec2-user"
                    value={formData.user || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, user: e.target.value })
                    }
                    className="w-full bg-[#070a10] border border-[#1f2942] rounded px-2.5 py-1 text-white font-mono text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1 text-xs">
                    SSH Port
                  </label>
                  <input
                    type="number"
                    value={formData.port || 22}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        port: parseInt(e.target.value, 10) || 22,
                      })
                    }
                    className="w-full bg-[#070a10] border border-[#1f2942] rounded px-2.5 py-1 text-white font-mono text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1 text-xs">
                    Folder / Group
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Production, Git Accounts, Homelab"
                    value={formData.group || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, group: e.target.value })
                    }
                    className="w-full bg-[#070a10] border border-[#1f2942] rounded px-2.5 py-1 text-white placeholder-gray-600 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1 text-xs">
                    Tags
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Add tag & Enter"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1 bg-[#070a10] border border-[#1f2942] rounded px-2.5 py-1 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-1 bg-[#161d30] hover:bg-[#1f2942] text-gray-200 border border-[#232f4d] rounded font-medium text-xs cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {formData.tags.map((t) => (
                        <span
                          key={t}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30 text-xs"
                        >
                          <span>#{t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="hover:text-rose-400 cursor-pointer ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
               {/* Section 2: Authentication & SSH Keys (Unified KeyAuthCard) */}
            <KeyAuthCard
              identityFile={formData.identity_file || ""}
              identitiesOnly={formData.identities_only || false}
              onChangeIdentity={(newFile, idsOnly) => {
                setFormData((prev) => ({
                  ...prev,
                  identity_file: newFile,
                  identities_only: idsOnly,
                }));
              }}
              availableKeys={availableKeys}
              hostPattern={formData.host_pattern}
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
            </div>

            {/* Section 3: Jump Host / Proxy & Tunnels */}
            <div className="p-3 bg-[#0b0f19] border border-[#1f2942] rounded-lg space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-[#1f2942] text-gray-300 font-semibold text-xs">
                <BsShieldLock className="w-3.5 h-3.5 text-purple-400" />
                <span>Jump Host (ProxyJump) & Port Forwarding</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-gray-300 font-medium mb-1 text-xs">
                    ProxyJump (Select intermediate jump server)
                  </label>
                  <select
                    value={formData.proxy_jump || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, proxy_jump: e.target.value })
                    }
                    className="w-full bg-[#070a10] border border-[#1f2942] rounded px-2.5 py-1 text-purple-300 font-mono text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Direct connection (No ProxyJump) --</option>
                    {existingHosts
                      .filter((h) => h.host_pattern !== formData.host_pattern)
                      .map((h) => (
                        <option key={h.id} value={h.host_pattern}>
                          {h.host_pattern} ({h.host_name || "alias"})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-1 text-xs">
                    Local Port Forwarding (-L)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. 5432 127.0.0.1:5432"
                      value={localForwardInput}
                      onChange={(e) => setLocalForwardInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddLocalForward();
                        }
                      }}
                      className="flex-1 bg-[#070a10] border border-[#1f2942] rounded px-2.5 py-1 text-white font-mono text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddLocalForward}
                      className="px-3 py-1 bg-[#161d30] hover:bg-[#1f2942] text-gray-200 border border-[#232f4d] rounded font-medium text-xs cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  {formData.local_forward.length > 0 && (
                    <div className="space-y-1 mt-1.5">
                      {formData.local_forward.map((lf, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-2.5 py-1 bg-[#070a10] border border-[#1f2942] rounded text-emerald-300 font-mono text-xs"
                        >
                          <span>LocalForward {lf}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLocalForward(i)}
                            className="text-gray-500 hover:text-rose-400 cursor-pointer ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live Config Preview & Preset Save */}
            <div className="p-3 bg-[#070a10] border border-[#1f2942] rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-semibold text-gray-300">Live ~/.ssh/config Block Preview</span>
                <label className="flex items-center gap-1.5 text-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAsPreset}
                    onChange={(e) => setSaveAsPreset(e.target.checked)}
                    className="rounded border-[#1f2942] bg-[#0b0f19] text-amber-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Save as Reusable Preset</span>
                </label>
              </div>

              {saveAsPreset && (
                <div className="p-2.5 bg-[#0f1422] border border-amber-500/30 rounded">
                  <input
                    type="text"
                    required={saveAsPreset}
                    placeholder="Enter Preset Name (e.g. My Production Cluster Template)"
                    value={customPresetTitle}
                    onChange={(e) => setCustomPresetTitle(e.target.value)}
                    className="w-full bg-[#070a10] border border-[#1f2942] rounded px-2.5 py-1 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <pre className="p-2.5 bg-[#05070c] border border-[#1f2942] rounded font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
{`Host ${formData.host_pattern || "my-host"}
${formData.host_name ? `    HostName ${formData.host_name}\n` : ""}${formData.user ? `    User ${formData.user}\n` : ""}${formData.port && formData.port !== 22 ? `    Port ${formData.port}\n` : ""}${formData.identity_file ? `    IdentityFile ${formData.identity_file}\n` : ""}${formData.identities_only ? `    IdentitiesOnly yes\n` : ""}${formData.proxy_jump ? `    ProxyJump ${formData.proxy_jump}\n` : ""}${formData.local_forward.map((f) => `    LocalForward ${f}\n`).join("")}`}
              </pre>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded font-medium text-xs transition-colors border border-[#232f4d] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded font-semibold text-xs shadow-sm shadow-blue-500/20 cursor-pointer active:scale-95"
              >
                <BsCheckLg className="w-3.5 h-3.5" />
                <span>{initialHost ? "Save Changes" : "Save Host to ~/.ssh/config"}</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: PRESETS GALLERY (Full Catalog) */}
        {/* ========================================================================= */}
        {activeScreen === "presets" && (
          <div className="max-w-4xl mx-auto space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-[#1f2942]/60">
              <div>
                <h3 className="font-semibold text-white text-sm">Choose or Create an SSH Preset</h3>
                <p className="text-gray-400 text-xs mt-0.5">
                  Select a template to pre-fill best practices, or create custom presets for your team.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Create Custom Preset Button */}
                <button
                  type="button"
                  onClick={() => {
                    setPresetBeingEdited(null);
                    setIsPresetEditorOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs transition-colors shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  <BsBookmarkPlusFill className="w-3.5 h-3.5" />
                  <span>+ Custom Preset</span>
                </button>

                {/* Category Pills */}
                <div className="flex flex-wrap gap-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border cursor-pointer ${
                        selectedCategory === cat.id
                          ? "bg-blue-600/20 text-blue-300 border-blue-500/40 font-semibold"
                          : "bg-[#0f1422] text-gray-400 border-[#1f2942] hover:text-gray-200"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              {filteredPresets.map((preset) => {
                const isCustom = preset.id.startsWith("preset_custom_") || preset.category === "custom";

                return (
                  <div
                    key={preset.id}
                    className="group p-3 bg-[#0b0f19] hover:bg-[#121829] border border-[#1f2942] hover:border-purple-500/50 rounded-xl transition-all flex flex-col justify-between gap-2.5 relative shadow-sm"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-md bg-[#161d30] border border-[#232f4d] flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                            <BrandLogo
                              name={preset.id}
                              hostName={preset.defaultHost.host_name}
                              tags={preset.defaultHost.tags}
                              group={preset.defaultHost.group}
                              category={preset.category}
                              className="w-4 h-4"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-white text-xs group-hover:text-purple-300 transition-colors block truncate">
                              {preset.title}
                            </span>
                            {preset.badge && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-[#161d30] text-purple-300 border border-[#232f4d] leading-none inline-block">
                                {preset.badge}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Top Right: Edit & Delete Preset Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPresetBeingEdited(preset);
                              setIsPresetEditorOpen(true);
                            }}
                            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title={`Edit preset ${preset.title}`}
                          >
                            <BsPencilSquare className="w-3.5 h-3.5 text-blue-400" />
                          </button>

                          {isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete custom preset "${preset.title}"?`)) {
                                  deleteCustomPreset(preset.id);
                                  setPresetsList(getAllPresets());
                                }
                              }}
                              className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title={`Delete preset ${preset.title}`}
                            >
                              <BsTrash3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-400 text-xs leading-snug line-clamp-2">
                        {preset.subtitle}
                      </p>
                    </div>

                    {/* Preset Preview Box */}
                    <div className="bg-[#070a10] p-2 rounded-lg border border-[#1f2942] font-mono text-xs text-gray-400 space-y-0.5">
                      <div className="truncate">
                        <span className="text-gray-500">Host </span>
                        <span className="text-blue-400 font-semibold">{preset.defaultHost.host_pattern}</span>
                      </div>
                      {preset.defaultHost.host_name && (
                        <div className="truncate">
                          <span className="text-gray-500">  HostName </span>
                          <span className="text-gray-300">{preset.defaultHost.host_name}</span>
                        </div>
                      )}
                      {preset.defaultHost.user && (
                        <div className="truncate">
                          <span className="text-gray-500">  User </span>
                          <span className="text-gray-300">{preset.defaultHost.user}</span>
                        </div>
                      )}
                    </div>

                    {/* Dual Launch Action Buttons: Interactive Wizard vs Fast Mode */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#1f2942]/60">
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(preset, "interactive")}
                        className="px-2 py-1.5 bg-purple-600/15 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 rounded-lg border border-purple-500/30 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title="Step-by-step guided wizard with live connection test and key generation"
                      >
                        <BsStars className="w-3 h-3 text-purple-400" />
                        <span>Wizard</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyPreset(preset, "fast")}
                        className="px-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all shadow-sm shadow-blue-600/20 cursor-pointer active:scale-95"
                        title="Instant pre-filled fast mode form"
                      >
                        <BsRocketTakeoff className="w-3 h-3" />
                        <span>Fast Mode</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
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
            alert(`Auto-resolve key generation failed: ${err}`);
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
