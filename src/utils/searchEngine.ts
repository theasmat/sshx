import { SshHost, SshKeyInfo, KnownHostEntry, PresetTemplate, NavTab } from "../types";

export type SearchItemCategory = "action" | "preset" | "host" | "key" | "known-host" | "page";

export interface SearchActionHandler {
  type:
    | "NAVIGATE_TAB"
    | "NAVIGATE_ADD_HOST"
    | "APPLY_PRESET"
    | "SELECT_HOST"
    | "SELECT_KEY"
    | "TRIGGER_ACTION";
  tab?: NavTab;
  addHostScreen?: "hub" | "interactive" | "fast" | "presets";
  presetId?: string;
  preset?: PresetTemplate;
  hostId?: string;
  keyPath?: string;
  actionName?:
    | "open_key_modal"
    | "open_export_backup"
    | "open_restore_backup"
    | "reload_config"
    | "zoom_in"
    | "zoom_out"
    | "zoom_reset";
}

export interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  note: string;
  category: SearchItemCategory;
  badge?: string;
  iconName?: string;
  keywords: string[];
  score?: number;
  handler: SearchActionHandler;
}

// Global Static Actions & Navigation Pages
export const STATIC_SEARCH_ITEMS: SearchItem[] = [
  // 1. Add Host Actions (Triggered on 'new', 'add', 'create', '+', etc.)
  {
    id: "action_add_wizard",
    title: "Add Host (Interactive Wizard)",
    subtitle: "Guided Step-by-Step",
    note: "Step-by-step guided assistant with automatic validation and smart defaults",
    category: "action",
    badge: "Recommended",
    iconName: "stars",
    keywords: [
      "new",
      "add",
      "create",
      "host",
      "wizard",
      "interactive",
      "guided",
      "setup",
      "server",
      "plus",
      "+",
      "ah",
    ],
    handler: {
      type: "NAVIGATE_ADD_HOST",
      addHostScreen: "interactive",
    },
  },
  {
    id: "action_add_fast",
    title: "Add Host (Fast Form Mode)",
    subtitle: "High-Density Single Page",
    note: "All-in-one form to configure Host, IP, User, Port, Key, and Tunnels on one screen",
    category: "action",
    badge: "Power Users",
    iconName: "sliders",
    keywords: [
      "new",
      "add",
      "create",
      "host",
      "fast",
      "form",
      "quick",
      "direct",
      "all",
      "one",
      "plus",
      "+",
      "hf",
    ],
    handler: {
      type: "NAVIGATE_ADD_HOST",
      addHostScreen: "fast",
    },
  },
  {
    id: "action_add_preset_hub",
    title: "Browse Host Presets Catalog",
    subtitle: "Ready-to-Use Templates",
    note: "Pick from pre-configured best-practice templates (GitHub, AWS, Hetzner, DO, Raspberry Pi, Tunnels)",
    category: "action",
    badge: "Templates",
    iconName: "lightning",
    keywords: [
      "new",
      "add",
      "preset",
      "presets",
      "templates",
      "catalog",
      "gallery",
      "github",
      "aws",
      "hetzner",
      "digitalocean",
      "tunnel",
      "homelab",
    ],
    handler: {
      type: "NAVIGATE_ADD_HOST",
      addHostScreen: "presets",
    },
  },
  {
    id: "action_gen_key",
    title: "Generate New SSH Key",
    subtitle: "Ed25519 / RSA-4096",
    note: "Create a fresh cryptographic key pair in ~/.ssh/ with optional passphrase and auto-agent load",
    category: "action",
    badge: "Security",
    iconName: "key",
    keywords: [
      "new",
      "add",
      "create",
      "key",
      "gen",
      "generate",
      "ed25519",
      "rsa",
      "pair",
      "private",
      "public",
      "ssh-keygen",
      "gk",
    ],
    handler: {
      type: "TRIGGER_ACTION",
      actionName: "open_key_modal",
    },
  },

  // 2. Backup & Restore Actions
  {
    id: "action_backup_export",
    title: "Create Encrypted .sshx Backup",
    subtitle: "AES-256-GCM + PBKDF2",
    note: "Export a password-protected .sshx archive containing your SSH configs, keys metadata, and custom presets",
    category: "action",
    badge: "Encrypted",
    iconName: "shield-lock",
    keywords: [
      "backup",
      "export",
      "save",
      "download",
      "sshx",
      "encrypt",
      "password",
      "archive",
      "dump",
      "lock",
      "protect",
    ],
    handler: {
      type: "TRIGGER_ACTION",
      actionName: "open_export_backup",
    },
  },
  {
    id: "action_backup_restore",
    title: "Restore .sshx Backup",
    subtitle: "Encrypted Archive Import",
    note: "Decrypt, inspect preview, and restore SSH configurations from a password-protected .sshx backup file",
    category: "action",
    badge: "Restore",
    iconName: "upload",
    keywords: [
      "restore",
      "import",
      "upload",
      "sshx",
      "decrypt",
      "recover",
      "load",
      "open",
      "file",
    ],
    handler: {
      type: "TRIGGER_ACTION",
      actionName: "open_restore_backup",
    },
  },

  // 3. Navigation Pages
  {
    id: "page_hosts",
    title: "All SSH Hosts",
    subtitle: "Host List & Management",
    note: "View and filter configured SSH servers, test connection latency, and launch terminal sessions",
    category: "page",
    badge: "Page",
    iconName: "terminal",
    keywords: ["hosts", "servers", "connections", "list", "all", "vps", "view"],
    handler: {
      type: "NAVIGATE_TAB",
      tab: "hosts",
    },
  },
  {
    id: "page_keys",
    title: "SSH Key Management",
    subtitle: "Key Ring & Agent Status",
    note: "Inspect ~/.ssh private keys, check strict 600 file permissions, and verify ssh-agent status",
    category: "page",
    badge: "Page",
    iconName: "key",
    keywords: [
      "keys",
      "keyring",
      "agent",
      "identities",
      "ssh-add",
      "passphrase",
      "permissions",
      "chmod",
    ],
    handler: {
      type: "NAVIGATE_TAB",
      tab: "keys",
    },
  },
  {
    id: "page_audit",
    title: "Security & Permissions Auditor",
    subtitle: "Hardening & Best Practices",
    note: "Scan ~/.ssh file permissions, detect weak crypto keys, and audit unencrypted configs with 1-click fixes",
    category: "page",
    badge: "Auditor",
    iconName: "shield-check",
    keywords: [
      "audit",
      "security",
      "score",
      "permissions",
      "chmod",
      "weak",
      "fix",
      "health",
      "check",
      "scanner",
    ],
    handler: {
      type: "NAVIGATE_TAB",
      tab: "audit",
    },
  },
  {
    id: "page_known_hosts",
    title: "Known Hosts & Fingerprints",
    subtitle: "~/.ssh/known_hosts",
    note: "Inspect trusted server host keys, detect hashed hostnames, and manage server fingerprints",
    category: "page",
    badge: "Page",
    iconName: "folder",
    keywords: [
      "known",
      "known_hosts",
      "fingerprint",
      "revoked",
      "sha256",
      "hostkey",
      "trust",
    ],
    handler: {
      type: "NAVIGATE_TAB",
      tab: "known-hosts",
    },
  },
  {
    id: "page_raw_config",
    title: "Raw ~/.ssh/config Editor",
    subtitle: "Direct File Editing",
    note: "Direct syntax-highlighted editor with automatic versioned backups and OpenSSH syntax validation",
    category: "page",
    badge: "Editor",
    iconName: "file-code",
    keywords: [
      "raw",
      "config",
      "editor",
      "text",
      "manual",
      "edit",
      "syntax",
      "code",
      "direct",
    ],
    handler: {
      type: "NAVIGATE_TAB",
      tab: "raw-config",
    },
  },
  {
    id: "page_settings",
    title: "Preferences & Settings",
    subtitle: "App Configuration",
    note: "Configure default terminal launcher (Ghostty, iTerm, Alacritty), UI zoom scale, and privacy masks",
    category: "page",
    badge: "Settings",
    iconName: "gear",
    keywords: [
      "settings",
      "preferences",
      "config",
      "options",
      "terminal",
      "zoom",
      "privacy",
      "ghostty",
      "iterm",
      "scale",
    ],
    handler: {
      type: "NAVIGATE_TAB",
      tab: "settings",
    },
  },

  // 4. Quick Zoom & Utilities
  {
    id: "action_zoom_in",
    title: "Zoom UI In (+10%)",
    subtitle: "Shortcut: Cmd +",
    note: "Increase overall interface scaling by 10% (up to 150%)",
    category: "action",
    badge: "Display",
    iconName: "zoom-in",
    keywords: ["zoom", "in", "scale", "larger", "font", "size", "bigger", "+"],
    handler: {
      type: "TRIGGER_ACTION",
      actionName: "zoom_in",
    },
  },
  {
    id: "action_zoom_out",
    title: "Zoom UI Out (-10%)",
    subtitle: "Shortcut: Cmd -",
    note: "Decrease overall interface scaling by 10% (down to 70%)",
    category: "action",
    badge: "Display",
    iconName: "zoom-out",
    keywords: ["zoom", "out", "scale", "smaller", "font", "size", "compact", "-"],
    handler: {
      type: "TRIGGER_ACTION",
      actionName: "zoom_out",
    },
  },
  {
    id: "action_zoom_reset",
    title: "Reset Zoom (100%)",
    subtitle: "Shortcut: Cmd 0",
    note: "Reset interface scale back to the default 100% standard size",
    category: "action",
    badge: "Display",
    iconName: "zoom-reset",
    keywords: ["zoom", "reset", "default", "100%", "normal", "scale"],
    handler: {
      type: "TRIGGER_ACTION",
      actionName: "zoom_reset",
    },
  },
  {
    id: "action_reload_config",
    title: "Reload SSH Configuration",
    subtitle: "Shortcut: Cmd R",
    note: "Re-read ~/.ssh/config, keys, and known_hosts from filesystem disk",
    category: "action",
    badge: "Sync",
    iconName: "arrow-clockwise",
    keywords: ["reload", "refresh", "sync", "read", "update", "r"],
    handler: {
      type: "TRIGGER_ACTION",
      actionName: "reload_config",
    },
  },
];

// Helper: Levenshtein Distance for typo tolerance
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// Intent Synonyms Map
const SYNONYM_MAP: Record<string, string[]> = {
  new: ["add", "create", "wizard", "fast", "presets", "gen", "plus", "+"],
  add: ["new", "create", "wizard", "fast", "presets", "gen", "plus", "+"],
  create: ["new", "add", "wizard", "fast", "presets", "gen"],
  make: ["new", "add", "create"],
  plus: ["new", "add", "+"],
  key: ["keys", "gen", "generate", "ed25519", "rsa", "agent", "identities"],
  backup: ["export", "save", "download", "sshx", "encrypt", "protect", "dump"],
  restore: ["import", "upload", "sshx", "decrypt", "recover", "load"],
  audit: ["security", "score", "permissions", "chmod", "check", "fix"],
  security: ["audit", "score", "permissions", "chmod", "key", "encrypt"],
  zoom: ["scale", "size", "font", "larger", "smaller"],
  config: ["raw", "editor", "settings", "options"],
  settings: ["preferences", "options", "terminal", "zoom", "privacy"],
  vps: ["cloud", "hetzner", "aws", "digitalocean", "server", "host"],
  git: ["github", "gitlab", "ssh", "version-control"],
  tunnel: ["forward", "localforward", "postgres", "mysql", "port"],
};

/**
 * Calculate Relevance Score for a given item against query
 */
function scoreItem(item: SearchItem, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  const title = item.title.toLowerCase();
  const subtitle = (item.subtitle || "").toLowerCase();
  const note = item.note.toLowerCase();
  const keywords = item.keywords.map((k) => k.toLowerCase());

  let score = 0;

  // 1. Exact Match on title or keyword
  if (title === q || keywords.includes(q)) {
    score += 1200;
  }

  // 2. Prefix Match on title
  if (title.startsWith(q)) {
    score += 900;
  }

  // 3. Word boundary / Substring in title
  if (title.includes(` ${q}`) || title.includes(`-${q}`)) {
    score += 750;
  } else if (title.includes(q)) {
    score += 550;
  }

  // 4. Substring in subtitle or note
  if (subtitle.includes(q)) {
    score += 400;
  }
  if (note.includes(q)) {
    score += 250;
  }

  // 5. Keyword Prefix or exact match
  for (const kw of keywords) {
    if (kw === q) {
      score += 600;
    } else if (kw.startsWith(q)) {
      score += 450;
    } else if (kw.includes(q)) {
      score += 250;
    }
  }

  // 6. Synonym expansion boost
  for (const [key, syns] of Object.entries(SYNONYM_MAP)) {
    if (q.includes(key) || key.includes(q)) {
      for (const s of syns) {
        if (keywords.includes(s) || title.includes(s)) {
          score += 350;
        }
      }
    }
  }

  // 7. Acronym Match (e.g. 'ah' for Add Host, 'gk' for Generate Key)
  const titleWords = title.split(/[\s-_()]+/);
  const acronym = titleWords.map((w) => w[0]).join("");
  if (acronym.startsWith(q)) {
    score += 500;
  }

  // 8. Typo Tolerance (Levenshtein for words >= 4 chars)
  if (q.length >= 4 && score === 0) {
    for (const kw of keywords) {
      if (kw.length >= 4) {
        const dist = levenshteinDistance(q, kw);
        if (dist === 1) {
          score += 320;
          break;
        } else if (dist === 2 && q.length >= 6) {
          score += 180;
          break;
        }
      }
    }
  }

  // Priority weighting for Action & Preset categories on creative intent
  if (item.category === "action" && (q === "new" || q === "add" || q === "create" || q === "+")) {
    score += 400;
  }

  return score;
}

/**
 * Build dynamic list of all searchable entities in the app:
 * - Static Actions & Pages
 * - Presets
 * - Hosts
 * - Keys
 * - Known Hosts
 */
export function buildSearchIndex(params: {
  presets: PresetTemplate[];
  hosts: SshHost[];
  keys: SshKeyInfo[];
  knownHosts: KnownHostEntry[];
}): SearchItem[] {
  const items: SearchItem[] = [...STATIC_SEARCH_ITEMS];

  // 1. Add Presets as Searchable Items
  for (const p of params.presets) {
    const fixedHost = p.defaultHost.host_name || "";
    const fixedUser = p.defaultHost.user || "";
    const fixedPort = p.defaultHost.port || 22;

    items.push({
      id: `preset_${p.id}`,
      title: `Add ${p.title} (Preset)`,
      subtitle: p.subtitle,
      note: `Pre-fills ${fixedUser ? `${fixedUser}@` : ""}${fixedHost || "custom host"}:${fixedPort} and guides key setup`,
      category: "preset",
      badge: p.badge || "Preset",
      iconName: p.id,
      keywords: [
        "preset",
        "template",
        "add",
        "new",
        "create",
        p.id,
        p.category,
        p.title.toLowerCase(),
        ...p.title.toLowerCase().split(/\s+/),
        fixedHost.toLowerCase(),
        fixedUser.toLowerCase(),
        ...(p.defaultHost.tags || []),
      ],
      handler: {
        type: "APPLY_PRESET",
        presetId: p.id,
        preset: p,
      },
    });
  }

  // 2. Add SSH Hosts as Searchable Items
  for (const h of params.hosts) {
    const alias = h.host_pattern;
    const ip = h.host_name || "No HostName";
    const user = h.user ? `${h.user}@` : "";
    const port = h.port && h.port !== 22 ? `:${h.port}` : "";
    const group = h.group ? `[${h.group}]` : "";

    items.push({
      id: `host_${h.id}`,
      title: alias,
      subtitle: `${user}${ip}${port} ${group}`,
      note: h.notes || `SSH Host configuration in ~/.ssh/config (${ip})`,
      category: "host",
      badge: h.group || "SSH Host",
      iconName: "server",
      keywords: [
        "host",
        "server",
        "connect",
        alias.toLowerCase(),
        (h.host_name || "").toLowerCase(),
        (h.user || "").toLowerCase(),
        h.port ? h.port.toString() : "22",
        (h.group || "").toLowerCase(),
        ...h.tags.map((t) => t.toLowerCase()),
        (h.identity_file || "").toLowerCase(),
        (h.proxy_jump || "").toLowerCase(),
      ],
      handler: {
        type: "SELECT_HOST",
        hostId: h.id,
      },
    });
  }

  // 3. Add SSH Keys as Searchable Items
  for (const k of params.keys) {
    items.push({
      id: `key_${k.file_name}`,
      title: k.file_name,
      subtitle: `${k.key_type.toUpperCase()} • ${k.comment || "No comment"}`,
      note: `Private key at ~/.ssh/${k.file_name} ${k.is_agent_loaded ? "(⚡ Loaded in ssh-agent)" : ""}`,
      category: "key",
      badge: k.is_agent_loaded ? "Agent Active" : k.key_type.toUpperCase(),
      iconName: "key",
      keywords: [
        "key",
        "identity",
        "private",
        "public",
        k.file_name.toLowerCase(),
        k.key_type.toLowerCase(),
        (k.comment || "").toLowerCase(),
        k.is_agent_loaded ? "agent" : "",
      ],
      handler: {
        type: "SELECT_KEY",
        keyPath: k.private_path,
      },
    });
  }

  return items;
}

/**
 * Execute Search and return ranked suggestions
 */
export function executeSearch(
  query: string,
  allItems: SearchItem[],
  maxResults = 8
): {
  results: SearchItem[];
  hasMatches: boolean;
  byCategory: Record<SearchItemCategory, SearchItem[]>;
} {
  const q = query.trim();
  if (!q) {
    return {
      results: [],
      hasMatches: false,
      byCategory: {
        action: [],
        preset: [],
        host: [],
        key: [],
        "known-host": [],
        page: [],
      },
    };
  }

  const scored = allItems
    .map((item) => ({
      ...item,
      score: scoreItem(item, q),
    }))
    .filter((item) => (item.score || 0) > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const results = scored.slice(0, maxResults);

  const byCategory: Record<SearchItemCategory, SearchItem[]> = {
    action: [],
    preset: [],
    host: [],
    key: [],
    "known-host": [],
    page: [],
  };

  for (const r of results) {
    if (byCategory[r.category]) {
      byCategory[r.category].push(r);
    }
  }

  return {
    results,
    hasMatches: results.length > 0,
    byCategory,
  };
}
