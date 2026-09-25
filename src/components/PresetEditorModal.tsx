import React, { useState, useEffect } from "react";
import {
  BsXLg,
  BsSliders,
  BsFolder2Open,
  BsKeyFill,
  BsCheckLg,
  BsTrash3,
  BsLink45Deg,
  BsBookmarkStarFill,
} from "react-icons/bs";
import { PresetTemplate, SshHost } from "../types";

interface PresetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPreset: PresetTemplate | null;
  onSavePreset: (preset: PresetTemplate) => void;
  onDeletePreset?: (presetId: string) => void;
}

export const PresetEditorModal: React.FC<PresetEditorModalProps> = ({
  isOpen,
  onClose,
  editingPreset,
  onSavePreset,
  onDeletePreset,
}) => {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState<PresetTemplate["category"]>("custom");
  const [iconName, setIconName] = useState("");
  const [badge, setBadge] = useState("");

  // Default Host Config
  const [hostPattern, setHostPattern] = useState("");
  const [hostName, setHostName] = useState("");
  const [user, setUser] = useState("");
  const [port, setPort] = useState<number>(22);
  const [group, setGroup] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [color, setColor] = useState("blue");

  // Key Recommendation
  const [enableKeyRec, setEnableKeyRec] = useState(true);
  const [keyName, setKeyName] = useState("");
  const [keyType, setKeyType] = useState<"ed25519" | "rsa">("ed25519");
  const [keyComment, setKeyComment] = useState("");

  // Setup Guide & Docs
  const [guideUrl, setGuideUrl] = useState("");
  const [guideUrlLabel, setGuideUrlLabel] = useState("");
  const [guideInstructions, setGuideInstructions] = useState("");

  useEffect(() => {
    if (editingPreset) {
      setTitle(editingPreset.title || "");
      setSubtitle(editingPreset.subtitle || "");
      setCategory(editingPreset.category || "custom");
      setIconName(editingPreset.iconName || "");
      setBadge(editingPreset.badge || "");

      const h = editingPreset.defaultHost || {};
      setHostPattern(h.host_pattern || "");
      setHostName(h.host_name || "");
      setUser(h.user || "");
      setPort(h.port || 22);
      setGroup(h.group || "");
      setTags(h.tags || []);
      setColor(h.color || "blue");

      if (editingPreset.keyRecommendation) {
        setEnableKeyRec(true);
        setKeyName(editingPreset.keyRecommendation.keyName || "");
        setKeyType(editingPreset.keyRecommendation.keyType || "ed25519");
        setKeyComment(editingPreset.keyRecommendation.comment || "");
      } else {
        setEnableKeyRec(false);
        setKeyName("");
        setKeyComment("");
      }

      setGuideUrl(
        editingPreset.postCreationGuide?.settingsUrl ||
          editingPreset.externalLink?.url ||
          ""
      );
      setGuideUrlLabel(
        editingPreset.postCreationGuide?.settingsLabel ||
          editingPreset.externalLink?.label ||
          ""
      );
      setGuideInstructions(
        editingPreset.postCreationGuide?.steps?.join("\n") ||
          editingPreset.extraHelp ||
          ""
      );
    } else {
      // Reset for new preset
      setTitle("");
      setSubtitle("");
      setCategory("custom");
      setIconName("");
      setBadge("Custom");
      setHostPattern("");
      setHostName("");
      setUser("");
      setPort(22);
      setGroup("");
      setTags([]);
      setColor("purple");
      setEnableKeyRec(true);
      setKeyName("");
      setKeyType("ed25519");
      setKeyComment("");
      setGuideUrl("");
      setGuideUrlLabel("");
      setGuideInstructions("");
    }
  }, [editingPreset, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, "");
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please provide a preset title");
      return;
    }

    const presetId =
      editingPreset?.id ||
      `preset_custom_${Date.now()}_${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    const defaultHostConfig: Partial<SshHost> = {
      host_pattern: hostPattern.trim() || title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      host_name: hostName.trim() || undefined,
      user: user.trim() || undefined,
      port: port || 22,
      group: group.trim() || undefined,
      tags: tags,
      color: color,
      identities_only: enableKeyRec,
    };

    const instructionsList = guideInstructions
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const newPreset: PresetTemplate = {
      id: presetId,
      category: category,
      title: title.trim(),
      subtitle: subtitle.trim() || `Configured ${title.trim()} connection profile`,
      iconName: iconName.trim() || title.toLowerCase(),
      badge: badge.trim() || (editingPreset ? undefined : "Custom"),
      defaultHost: defaultHostConfig,
      keyRecommendation: enableKeyRec
        ? {
            keyName: keyName.trim() || `id_${keyType}_${presetId.replace("preset_", "")}`,
            keyType: keyType,
            comment: keyComment.trim() || `${defaultHostConfig.host_pattern}@sshx`,
          }
        : undefined,
      extraHelp: guideInstructions.trim() || undefined,
      externalLink: guideUrl.trim()
        ? {
            label: guideUrlLabel.trim() || "Open Web Dashboard",
            url: guideUrl.trim(),
          }
        : undefined,
      postCreationGuide: guideUrl.trim() || instructionsList.length > 0
        ? {
            platform: category || "custom",
            settingsUrl: guideUrl.trim() || undefined,
            settingsLabel: guideUrlLabel.trim() || "Open Dashboard Settings",
            steps: instructionsList.length > 0 ? instructionsList : ["Copy public key", "Add to remote provider settings", "Test connection"],
          }
        : undefined,
    };

    onSavePreset(newPreset);
    onClose();
  };

  const isCustomPreset = editingPreset?.id.startsWith("preset_custom_") || !editingPreset;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-xl bg-[#0b0f19] border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-xs">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1f2942] bg-[#110d1c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-sm">
              <BsBookmarkStarFill className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">
                  {editingPreset ? "Edit Connection Preset" : "Create Custom Preset"}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-500/30">
                  Preset Hub
                </span>
              </div>
              <p className="text-gray-400 text-[11px]">
                Define reusable SSH configuration templates and key recommendations.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <BsXLg className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Preset Metadata */}
          <div className="p-3 bg-[#070a10] border border-[#1f2942] rounded-xl space-y-3">
            <h4 className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <BsSliders className="w-3.5 h-3.5" />
              <span>Preset Information</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Preset Title <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GitLab Corporate, Hetzner VPS"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#1f2942] focus:border-purple-500 rounded-lg text-white font-medium text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#1f2942] focus:border-purple-500 rounded-lg text-gray-200 text-xs outline-none"
                >
                  <option value="git">Git Provider</option>
                  <option value="cloud">Cloud VM</option>
                  <option value="bastion">Bastion / Jump Host</option>
                  <option value="homelab">HomeLab / IoT</option>
                  <option value="tunnel">Port Tunnel</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-300 mb-1">
                Subtitle / Description
              </label>
              <input
                type="text"
                placeholder="Short description of this template"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#1f2942] focus:border-purple-500 rounded-lg text-white text-xs outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Brand / Icon Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. gitlab, oracle, digitalocean"
                  value={iconName}
                  onChange={(e) => setIconName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#1f2942] focus:border-purple-500 rounded-lg text-gray-200 font-mono text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Badge Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Internal, Verified"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#1f2942] focus:border-purple-500 rounded-lg text-gray-200 text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* Default SSH Host Configuration */}
          <div className="p-3 bg-[#070a10] border border-[#1f2942] rounded-xl space-y-3">
            <h4 className="text-[11px] font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <BsFolder2Open className="w-3.5 h-3.5" />
              <span>Default Host Template</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Default Host Pattern (Alias)
                </label>
                <input
                  type="text"
                  placeholder="e.g. gitlab-work, my-vps"
                  value={hostPattern}
                  onChange={(e) => setHostPattern(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#1f2942] focus:border-blue-500 rounded-lg text-blue-300 font-mono text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  HostName / Domain / IP
                </label>
                <input
                  type="text"
                  placeholder="e.g. gitlab.company.com, 192.168.1.100"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#1f2942] focus:border-blue-500 rounded-lg text-gray-200 font-mono text-xs outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  User
                </label>
                <input
                  type="text"
                  placeholder="e.g. git, root, ubuntu"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#1f2942] focus:border-blue-500 rounded-lg text-gray-200 font-mono text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  placeholder="22"
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value, 10) || 22)}
                  className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#1f2942] focus:border-blue-500 rounded-lg text-gray-200 font-mono text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Group Folder
                </label>
                <input
                  type="text"
                  placeholder="e.g. Work, Infrastructure"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#1f2942] focus:border-blue-500 rounded-lg text-gray-200 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Accent Color
                </label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#1f2942] focus:border-blue-500 rounded-lg text-gray-200 text-xs outline-none"
                >
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="emerald">Emerald</option>
                  <option value="cyan">Cyan</option>
                  <option value="amber">Amber</option>
                  <option value="rose">Rose</option>
                  <option value="orange">Orange</option>
                </select>
              </div>
            </div>

            {/* Tags input */}
            <div>
              <label className="block text-[11px] font-medium text-gray-300 mb-1">
                Default Tags
              </label>
              <div className="flex items-center gap-1.5 mb-1.5">
                <input
                  type="text"
                  placeholder="Type tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-2.5 py-1 bg-[#0e1422] border border-[#1f2942] focus:border-blue-500 rounded-lg text-gray-200 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-2.5 py-1 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-lg border border-[#232f4d] font-medium text-xs transition-colors"
                >
                  Add Tag
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-mono flex items-center gap-1"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Key Recommendation Settings */}
          <div className="p-3 bg-[#070a10] border border-[#1f2942] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <BsKeyFill className="w-3.5 h-3.5" />
                <span>SSH Key Recommendation</span>
              </h4>
              <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableKeyRec}
                  onChange={(e) => setEnableKeyRec(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 bg-[#0e1422] border-[#1f2942]"
                />
                <span>Recommend dedicated key</span>
              </label>
            </div>

            {enableKeyRec && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-gray-300 mb-1">
                    Recommended Key Filename
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. id_ed25519_gitlab"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#1f2942] focus:border-emerald-500 rounded-lg text-emerald-300 font-mono text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-300 mb-1">
                    Algorithm
                  </label>
                  <select
                    value={keyType}
                    onChange={(e) => setKeyType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#1f2942] focus:border-emerald-500 rounded-lg text-gray-200 text-xs outline-none"
                  >
                    <option value="ed25519">Ed25519 (Recommended)</option>
                    <option value="rsa">RSA (4096-bit)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Post-Creation Guide & External Links */}
          <div className="p-3 bg-[#070a10] border border-[#1f2942] rounded-xl space-y-3">
            <h4 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <BsLink45Deg className="w-4 h-4" />
              <span>Setup Guide & Portal URL</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Portal / Settings URL
                </label>
                <input
                  type="url"
                  placeholder="https://gitlab.com/-/profile/keys"
                  value={guideUrl}
                  onChange={(e) => setGuideUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#1f2942] focus:border-amber-500 rounded-lg text-gray-200 font-mono text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-300 mb-1">
                  Button Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Open GitLab SSH Settings"
                  value={guideUrlLabel}
                  onChange={(e) => setGuideUrlLabel(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#1f2942] focus:border-amber-500 rounded-lg text-gray-200 text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-300 mb-1">
                Post-Creation Instructions (1 step per line)
              </label>
              <textarea
                rows={3}
                placeholder={"1. Open the remote console\n2. Add your public SSH key\n3. Test the connection"}
                value={guideInstructions}
                onChange={(e) => setGuideInstructions(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0e1422] border border-[#1f2942] focus:border-amber-500 rounded-lg text-gray-200 font-mono text-xs outline-none resize-y"
              />
            </div>
          </div>

          {/* Actions & Delete Option */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {editingPreset && onDeletePreset && isCustomPreset && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete preset "${editingPreset.title}"?`)) {
                      onDeletePreset(editingPreset.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <BsTrash3 className="w-3.5 h-3.5" />
                  <span>Delete Preset</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-lg border border-[#232f4d] font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs transition-all shadow-md shadow-purple-600/20 cursor-pointer active:scale-95"
              >
                <BsCheckLg className="w-3.5 h-3.5" />
                <span>{editingPreset ? "Update Preset" : "Save Preset"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
