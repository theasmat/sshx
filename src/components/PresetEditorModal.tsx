import { askConfirm } from "../utils/confirm";
import { toast } from "../utils/toast";
import { Button, Field, Group, Segmented, Switch, inputCls } from "./ui";
import React, { useState, useEffect } from "react";
import {
  BsCheckLg,
  BsTrash3,
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
      toast.error("Please provide a preset title");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm select-none" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Template editor" onClick={(e) => e.stopPropagation()} className="w-full max-w-xl bg-raised rounded-card shadow-pop overflow-hidden flex flex-col max-h-[92vh] text-[13px]">
        <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-label">{editingPreset ? "Edit template" : "New template"}</h3>
            <p className="text-xs text-label-2">Reusable host settings and key recommendations.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-7 w-7 flex items-center justify-center rounded-full text-label-2 hover:text-label hover:bg-white/[0.08] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 pb-5 space-y-5">
          <Group title="Template">
            <Field label="Title">
              <input
                type="text"
                required
                aria-label="Template title"
                placeholder="e.g. GitLab Corporate, Hetzner VPS"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Description">
              <input
                type="text"
                aria-label="Description"
                placeholder="Short description"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Category">
              <select
                aria-label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="git">Git Provider</option>
                <option value="cloud">Cloud VM</option>
                <option value="bastion">Bastion / Jump Host</option>
                <option value="homelab">HomeLab / IoT</option>
                <option value="tunnel">Port Tunnel</option>
                <option value="custom">Custom</option>
              </select>
            </Field>
            <Field label="Icon">
              <input
                type="text"
                aria-label="Brand icon name"
                placeholder="Brand name, e.g. gitlab, digitalocean"
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </Field>
            <Field label="Badge">
              <input
                type="text"
                aria-label="Badge label"
                placeholder="e.g. Internal, Verified"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className={inputCls}
              />
            </Field>
          </Group>

          <Group title="Host defaults">
            <Field label="Alias">
              <input
                type="text"
                aria-label="Default alias"
                placeholder="e.g. gitlab-work"
                value={hostPattern}
                onChange={(e) => setHostPattern(e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </Field>
            <Field label="Address">
              <input
                type="text"
                aria-label="Default address"
                placeholder="e.g. gitlab.company.com"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </Field>
            <Field label="User">
              <input
                type="text"
                aria-label="Default user"
                placeholder="e.g. git, root, ubuntu"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </Field>
            <Field label="Port">
              <input
                type="number"
                aria-label="Default port"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value, 10) || 22)}
                className={`${inputCls} font-mono w-28`}
              />
            </Field>
            <Field label="Group">
              <input
                type="text"
                aria-label="Group"
                placeholder="e.g. Work, Infrastructure"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Color">
              <select
                aria-label="Accent color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={`${inputCls} cursor-pointer w-40`}
              >
                {["blue", "purple", "emerald", "cyan", "amber", "rose", "orange"].map((c) => (
                  <option key={c} value={c}>
                    {c[0].toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
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
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
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
          </Group>

          <Group title="Key recommendation">
            <Field label="Dedicated key">
              <label className="flex items-center gap-2 cursor-pointer text-label">
                <Switch label="Recommend a dedicated key" checked={enableKeyRec} onChange={setEnableKeyRec} />
                <span>Recommend a dedicated key</span>
              </label>
            </Field>
            {enableKeyRec && (
              <>
                <Field label="Filename">
                  <input
                    type="text"
                    aria-label="Recommended key filename"
                    placeholder="e.g. id_ed25519_gitlab"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </Field>
                <Field label="Algorithm">
                  <Segmented
                    label="Algorithm"
                    value={keyType}
                    options={[
                      { value: "ed25519" as const, label: "Ed25519" },
                      { value: "rsa" as const, label: "RSA 4096" },
                    ]}
                    onChange={setKeyType}
                  />
                </Field>
              </>
            )}
          </Group>

          <Group title="Setup guide">
            <Field label="Portal URL">
              <input
                type="url"
                aria-label="Portal URL"
                placeholder="https://gitlab.com/-/profile/keys"
                value={guideUrl}
                onChange={(e) => setGuideUrl(e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </Field>
            <Field label="Button label">
              <input
                type="text"
                aria-label="Button label"
                placeholder="e.g. Open GitLab SSH Settings"
                value={guideUrlLabel}
                onChange={(e) => setGuideUrlLabel(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Steps">
              <textarea
                rows={3}
                aria-label="Setup steps, one per line"
                placeholder={"One step per line, e.g.\nOpen the remote console\nAdd your public SSH key"}
                value={guideInstructions}
                onChange={(e) => setGuideInstructions(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-ctl bg-white/[0.06] text-label placeholder-label-3 font-mono text-xs focus:outline-none focus:bg-white/[0.09] focus:ring-2 focus:ring-accent/70 resize-y"
              />
            </Field>
          </Group>

          {/* Actions & Delete Option */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {editingPreset && onDeletePreset && isCustomPreset && (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await askConfirm({
                      title: "Delete preset?",
                      message: `Delete preset "${editingPreset.title}"?`,
                      confirmLabel: "Delete",
                      danger: true,
                    });
                    if (ok) {
                      onDeletePreset(editingPreset.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-ctl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[13px] font-medium transition-colors cursor-pointer"
                >
                  <BsTrash3 className="w-3.5 h-3.5" />
                  <span>Delete Preset</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={<BsCheckLg />}>
                {editingPreset ? "Update Template" : "Save Template"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
