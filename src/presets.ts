import { PresetTemplate, SshHost, PostCreationGuide } from "./types";
import rawBuiltinPresets from "./presets.json";

export interface PresetJsonItem {
  id: string;
  category: "git" | "cloud" | "bastion" | "homelab" | "tunnel" | "custom";
  title: string;
  subtitle: string;
  iconName: string;
  badge?: string;
  config: Partial<SshHost>;
  keySuggestion?: {
    keyName: string;
    keyType: "ed25519" | "rsa";
    bits?: number;
    comment: string;
  };
  extraHelp?: string;
  externalLink?: {
    label: string;
    url: string;
  };
  postCreationGuide?: PostCreationGuide;
}

// Map raw JSON entries to PresetTemplate structure
export const BUILTIN_PRESET_TEMPLATES: PresetTemplate[] = (
  rawBuiltinPresets as PresetJsonItem[]
).map((item) => ({
  id: item.id,
  category: item.category,
  title: item.title,
  subtitle: item.subtitle,
  iconName: item.iconName,
  badge: item.badge,
  defaultHost: item.config,
  keyRecommendation: item.keySuggestion,
  extraHelp: item.extraHelp,
  externalLink: item.externalLink,
  postCreationGuide: item.postCreationGuide,
}));

const CUSTOM_PRESETS_STORAGE_KEY = "sshx_custom_presets_v2";

export function loadCustomPresets(): PresetTemplate[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load custom presets:", e);
    return [];
  }
}

export function saveCustomPreset(preset: PresetTemplate): void {
  const current = loadCustomPresets();
  const existingIdx = current.findIndex((p) => p.id === preset.id);
  let updated: PresetTemplate[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = preset;
  } else {
    updated = [...current, preset];
  }
  localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(updated));
}

export function deleteCustomPreset(presetId: string): void {
  const current = loadCustomPresets();
  const updated = current.filter((p) => p.id !== presetId);
  localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(updated));
}

export function getAllPresets(): PresetTemplate[] {
  const custom = loadCustomPresets();
  return [...BUILTIN_PRESET_TEMPLATES, ...custom];
}

export const PRESET_TEMPLATES = BUILTIN_PRESET_TEMPLATES;
