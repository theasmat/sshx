import React, { useState, useEffect } from "react";
import {
  Zap,
  Sliders,
  Server,
  Key,
  Shield,
  ArrowLeftRight,
  Sparkles,
  Plus,
  Check,
  Copy,
  ChevronRight,
  FileCode,
  CheckCircle2,
} from "lucide-react";
import { SshHost, SshKeyInfo, PresetTemplate } from "../types";
import { getAllPresets, saveCustomPreset } from "../presets";
import { api } from "../api";

interface AddHostViewProps {
  initialHost: SshHost | null;
  existingKeys: SshKeyInfo[];
  existingHosts: SshHost[];
  onSave: (host: SshHost) => void;
  onCancel: () => void;
  onRefreshKeys: () => void;
}

export const AddHostView: React.FC<AddHostViewProps> = ({
  initialHost,
  existingKeys,
  existingHosts,
  onSave,
  onCancel,
  onRefreshKeys,
}) => {
  // Sub-tabs: "presets" vs "custom"
  const [subTab, setSubTab] = useState<"presets" | "custom">(
    initialHost ? "custom" : "presets"
  );

  // Preset category filter
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [presetsList, setPresetsList] = useState<PresetTemplate[]>([]);

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

  // In-page key generator state
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [genKeyName, setGenKeyName] = useState("id_ed25519_custom");
  const [genKeyComment, setGenKeyComment] = useState("");
  const [genKeyType, setGenKeyType] = useState<"ed25519" | "rsa">("ed25519");
  const [generatedPubKey, setGeneratedPubKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [keyGenSuccessMsg, setKeyGenSuccessMsg] = useState<string | null>(null);

  // Load presets
  useEffect(() => {
    setPresetsList(getAllPresets());
  }, []);

  // Sync initial host if editing
  useEffect(() => {
    if (initialHost) {
      setFormData({ ...initialHost });
      setSubTab("custom");
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
      if (!initialHost) {
        setSubTab("presets");
      }
    }
  }, [initialHost]);

  // Apply a preset template
  const handleApplyPreset = (preset: PresetTemplate) => {
    const newHost: SshHost = {
      id: initialHost?.id || `host_${Date.now()}`,
      host_pattern: preset.defaultHost.host_pattern || preset.id,
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
      setGenKeyName(preset.keyRecommendation.keyName);
      setGenKeyComment(preset.keyRecommendation.comment);
      setGenKeyType(preset.keyRecommendation.keyType);
    }

    setFormData(newHost);
    setSubTab("custom");
  };

  // Generate Key In-Page
  const handleGenerateKey = async () => {
    if (!genKeyName.trim()) return;
    setIsGeneratingKey(true);
    setKeyGenSuccessMsg(null);
    try {
      const result = await api.generateKey({
        name: genKeyName.trim(),
        key_type: genKeyType,
        bits: genKeyType === "rsa" ? 4096 : undefined,
        comment: genKeyComment.trim() || `${genKeyName}@sshx`,
      });
      setGeneratedPubKey(result.public_key_content || null);
      setKeyGenSuccessMsg(`Key ~/.ssh/${result.file_name} generated and loaded into agent!`);
      setFormData((prev) => ({
        ...prev,
        identity_file: result.private_path,
        identities_only: true,
      }));
      onRefreshKeys();
    } catch (err: any) {
      alert(`Key generation failed: ${err}`);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleCopyPubKey = () => {
    if (generatedPubKey) {
      navigator.clipboard.writeText(generatedPubKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    onSave(formData);
  };

  // Filtered Presets
  const filteredPresets = presetsList.filter((p) => {
    if (selectedCategory === "all") return true;
    return p.category === selectedCategory;
  });

  const categories = [
    { id: "all", label: "All Presets" },
    { id: "git", label: "Git (GitHub/GitLab)" },
    { id: "cloud", label: "Cloud VPS (AWS/Hetzner/DO)" },
    { id: "bastion", label: "Bastions & Jump" },
    { id: "homelab", label: "Homelab & Pi" },
    { id: "tunnel", label: "Database Tunnels" },
    { id: "custom", label: "Custom Presets" },
  ];

  return (
    <div className="h-full flex flex-col bg-[#070a10] text-xs select-none overflow-hidden">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="px-5 py-3 border-b border-[#1f2942] bg-[#090d16] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">
              {initialHost ? `Edit Host: ${initialHost.host_pattern}` : "Add New SSH Host"}
            </h2>
          </div>
        </div>

        {/* Two Sub-Tabs: Quick Presets vs Custom Configuration */}
        <div className="flex items-center gap-1 bg-[#0f1422] p-1 rounded-lg border border-[#1f2942]">
          <button
            type="button"
            onClick={() => setSubTab("presets")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium text-xs transition-colors ${
              subTab === "presets"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>⚡ Quick Presets</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("custom")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium text-xs transition-colors ${
              subTab === "custom"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>🛠️ Custom Configuration</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5">
        {subTab === "presets" ? (
          /* SUB-TAB 1: QUICK PRESETS GALLERY */
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-semibold text-white text-sm">Choose a Ready-to-Use SSH Preset</h3>
                <p className="text-gray-400 text-xs">
                  Select a profile to pre-fill best-practice settings and configure isolated SSH keys.
                </p>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border ${
                      selectedCategory === cat.id
                        ? "bg-blue-600/20 text-blue-300 border-blue-500/40"
                        : "bg-[#0f1422] text-gray-400 border-[#1f2942] hover:text-gray-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {filteredPresets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="group p-3.5 bg-[#0b0f19] hover:bg-[#121829] border border-[#1f2942] hover:border-blue-500/50 rounded-xl cursor-pointer transition-all flex flex-col justify-between gap-3 relative shadow-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#161d30] border border-[#232f4d] flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                          {preset.category === "git" ? (
                            <FileCode className="w-3.5 h-3.5 text-orange-400" />
                          ) : preset.category === "cloud" ? (
                            <Server className="w-3.5 h-3.5 text-amber-400" />
                          ) : preset.category === "bastion" ? (
                            <Shield className="w-3.5 h-3.5 text-purple-400" />
                          ) : preset.category === "tunnel" ? (
                            <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          )}
                        </div>
                        <span className="font-bold text-white text-xs group-hover:text-blue-400 transition-colors">
                          {preset.title}
                        </span>
                      </div>
                      {preset.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#161d30] text-gray-300 border border-[#232f4d]">
                          {preset.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      {preset.subtitle}
                    </p>
                  </div>

                  {/* Preset Preview Box */}
                  <div className="bg-[#070a10] p-2 rounded-lg border border-[#1f2942] font-mono text-[10px] text-gray-400 space-y-0.5">
                    <div>
                      <span className="text-gray-500">Host </span>
                      <span className="text-blue-400 font-semibold">{preset.defaultHost.host_pattern}</span>
                    </div>
                    {preset.defaultHost.host_name && (
                      <div>
                        <span className="text-gray-500">  HostName </span>
                        <span className="text-gray-300">{preset.defaultHost.host_name}</span>
                      </div>
                    )}
                    {preset.defaultHost.user && (
                      <div>
                        <span className="text-gray-500">  User </span>
                        <span className="text-gray-300">{preset.defaultHost.user}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#1f2942]/60 text-[11px]">
                    <span className="text-gray-500 group-hover:text-gray-300 flex items-center gap-1">
                      <span>Click to customize</span>
                    </span>
                    <span className="text-blue-400 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>Use Preset</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* SUB-TAB 2: CUSTOM CONFIGURATION BUILDER */
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-4">
            {/* Section 1: Basic Parameters */}
            <div className="p-4 bg-[#0b0f19] border border-[#1f2942] rounded-xl space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#1f2942] text-gray-300 font-semibold text-xs">
                <Server className="w-4 h-4 text-blue-400" />
                <span>Basic Connection Parameters</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Host Alias */}
                <div>
                  <label className="block text-gray-300 font-medium mb-1">
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
                    className="w-full bg-[#070a10] border border-[#1f2942] rounded-lg px-3 py-1.5 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">
                    The alias you type in terminal: <code className="text-blue-400">ssh {formData.host_pattern || "alias"}</code>
                  </span>
                </div>

                {/* HostName / IP */}
                <div>
                  <label className="block text-gray-300 font-medium mb-1">
                    HostName / IP Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 192.168.1.100, github.com, ec2.aws.com"
                    value={formData.host_name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, host_name: e.target.value })
                    }
                    className="w-full bg-[#070a10] border border-[#1f2942] rounded-lg px-3 py-1.5 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* User */}
                <div>
                  <label className="block text-gray-300 font-medium mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. root, ubuntu, git, ec2-user"
                    value={formData.user || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, user: e.target.value })
                    }
                    className="w-full bg-[#070a10] border border-[#1f2942] rounded-lg px-3 py-1.5 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Port */}
                <div>
                  <label className="block text-gray-300 font-medium mb-1">
                    SSH Port
                  </label>
                  <input
                    type="number"
                    value={formData.port || 22}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        port: parseInt(e.target.value) || 22,
                      })
                    }
                    className="w-full bg-[#070a10] border border-[#1f2942] rounded-lg px-3 py-1.5 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Group */}
                <div>
                  <label className="block text-gray-300 font-medium mb-1">
                    Folder / Group
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Production, Git Accounts, Homelab"
                    value={formData.group || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, group: e.target.value })
                    }
                    className="w-full bg-[#070a10] border border-[#1f2942] rounded-lg px-3 py-1.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-gray-300 font-medium mb-1">
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
                      className="flex-1 bg-[#070a10] border border-[#1f2942] rounded-lg px-3 py-1.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-200 border border-[#232f4d] rounded-lg font-medium"
                    >
                      Add
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {formData.tags.map((t) => (
                        <span
                          key={t}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px]"
                        >
                          <span>#{t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="hover:text-rose-400"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Authentication & SSH Keys */}
            <div className="p-4 bg-[#0b0f19] border border-[#1f2942] rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#1f2942]">
                <div className="flex items-center gap-2 text-gray-300 font-semibold text-xs">
                  <Key className="w-4 h-4 text-blue-400" />
                  <span>Authentication & SSH Keys</span>
                </div>

                <label className="flex items-center gap-1.5 text-gray-300 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={formData.identities_only || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identities_only: e.target.checked,
                      })
                    }
                    className="rounded border-[#1f2942] bg-[#070a10] text-blue-600 focus:ring-0"
                  />
                  <span>IdentitiesOnly (Strict isolated key usage)</span>
                </label>
              </div>

              {/* Select from existing ~/.ssh keys */}
              <div>
                <label className="block text-gray-300 font-medium mb-1">
                  IdentityFile (Private Key)
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.identity_file || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, identity_file: e.target.value })
                    }
                    className="flex-1 bg-[#070a10] border border-[#1f2942] rounded-lg px-3 py-1.5 text-amber-300 font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- No specific key (Use agent / default) --</option>
                    {existingKeys.map((k) => (
                      <option key={k.private_path} value={k.private_path}>
                        {k.file_name} ({k.key_type.toUpperCase()}) {k.is_agent_loaded ? "⚡" : ""}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Or enter custom path..."
                    value={formData.identity_file || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, identity_file: e.target.value })
                    }
                    className="w-1/3 bg-[#070a10] border border-[#1f2942] rounded-lg px-3 py-1.5 text-gray-300 font-mono text-[11px] placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* In-Page Quick Key Generator */}
              <div className="mt-2 p-3 bg-[#070a10] border border-blue-500/30 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-blue-300 font-semibold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Generate Dedicated SSH Key for this Host</span>
                  </div>
                  <span className="text-[10px] text-gray-400">Ed25519 Recommended</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Key name (e.g. id_ed25519_myhost)"
                    value={genKeyName}
                    onChange={(e) => setGenKeyName(e.target.value)}
                    className="bg-[#0b0f19] border border-[#1f2942] rounded-md px-2.5 py-1 text-white font-mono text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Comment / Email"
                    value={genKeyComment}
                    onChange={(e) => setGenKeyComment(e.target.value)}
                    className="bg-[#0b0f19] border border-[#1f2942] rounded-md px-2.5 py-1 text-white text-[11px]"
                  />
                  <button
                    type="button"
                    disabled={isGeneratingKey}
                    onClick={handleGenerateKey}
                    className="flex items-center justify-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-semibold text-xs transition-colors disabled:opacity-50"
                  >
                    <Key className="w-3 h-3" />
                    <span>{isGeneratingKey ? "Generating..." : "Generate & Attach Key"}</span>
                  </button>
                </div>

                {keyGenSuccessMsg && (
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-[11px] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{keyGenSuccessMsg}</span>
                    </div>
                    {generatedPubKey && (
                      <button
                        type="button"
                        onClick={handleCopyPubKey}
                        className="flex items-center gap-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-[10px] transition-colors"
                      >
                        {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey ? "Copied!" : "Copy Public Key"}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Jump Host / Proxy & Tunnels */}
            <div className="p-4 bg-[#0b0f19] border border-[#1f2942] rounded-xl space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#1f2942] text-gray-300 font-semibold text-xs">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Jump Host (ProxyJump) & Port Forwarding</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* ProxyJump */}
                <div>
                  <label className="block text-gray-300 font-medium mb-1">
                    ProxyJump (Select intermediate jump server)
                  </label>
                  <select
                    value={formData.proxy_jump || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, proxy_jump: e.target.value })
                    }
                    className="w-full bg-[#070a10] border border-[#1f2942] rounded-lg px-3 py-1.5 text-purple-300 font-mono focus:outline-none focus:border-blue-500"
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

                {/* Local Forward Tunnels */}
                <div>
                  <label className="block text-gray-300 font-medium mb-1">
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
                      className="flex-1 bg-[#070a10] border border-[#1f2942] rounded-lg px-3 py-1.5 text-white font-mono text-[11px] placeholder-gray-600 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddLocalForward}
                      className="px-3 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-200 border border-[#232f4d] rounded-lg font-medium"
                    >
                      Add Tunnel
                    </button>
                  </div>
                  {formData.local_forward.length > 0 && (
                    <div className="space-y-1 mt-1.5">
                      {formData.local_forward.map((lf, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-2 py-1 bg-[#070a10] border border-[#1f2942] rounded text-emerald-300 font-mono text-[11px]"
                        >
                          <span>LocalForward {lf}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLocalForward(i)}
                            className="text-gray-500 hover:text-rose-400"
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
            <div className="p-4 bg-[#070a10] border border-[#1f2942] rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span className="font-semibold text-gray-300">Live ~/.ssh/config Block Preview</span>
                <label className="flex items-center gap-1.5 text-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAsPreset}
                    onChange={(e) => setSaveAsPreset(e.target.checked)}
                    className="rounded border-[#1f2942] bg-[#0b0f19] text-amber-500 focus:ring-0"
                  />
                  <span>Save this configuration as a Reusable Preset</span>
                </label>
              </div>

              {saveAsPreset && (
                <div className="p-2.5 bg-[#0f1422] border border-amber-500/30 rounded-lg">
                  <input
                    type="text"
                    required={saveAsPreset}
                    placeholder="Enter Preset Name (e.g. My Production Cluster Template)"
                    value={customPresetTitle}
                    onChange={(e) => setCustomPresetTitle(e.target.value)}
                    className="w-full bg-[#070a10] border border-[#1f2942] rounded-md px-2.5 py-1 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <pre className="p-3 bg-[#05070c] border border-[#1f2942] rounded-lg font-mono text-[11px] text-emerald-400 overflow-x-auto">
{`Host ${formData.host_pattern || "my-host"}
${formData.host_name ? `    HostName ${formData.host_name}\n` : ""}${formData.user ? `    User ${formData.user}\n` : ""}${formData.port && formData.port !== 22 ? `    Port ${formData.port}\n` : ""}${formData.identity_file ? `    IdentityFile ${formData.identity_file}\n` : ""}${formData.identities_only ? `    IdentitiesOnly yes\n` : ""}${formData.proxy_jump ? `    ProxyJump ${formData.proxy_jump}\n` : ""}${formData.local_forward.map((f) => `    LocalForward ${f}\n`).join("")}`}
              </pre>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-lg font-medium text-xs transition-colors border border-[#232f4d]"
              >
                Cancel & Return
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition-colors shadow-md shadow-blue-600/20"
                >
                  <Check className="w-4 h-4" />
                  <span>{initialHost ? "Save Host Changes" : "Save Host to ~/.ssh/config"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
