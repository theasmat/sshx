export type NavTab =
  | "hosts"
  | "add-host"
  | "presets"
  | "keys"
  | "known-hosts"
  | "audit"
  | "raw-config"
  | "settings";

export interface SshHost {
  id: string;
  host_pattern: string;
  host_name?: string | null;
  user?: string | null;
  port?: number | null;
  identity_file?: string | null;
  identities_only?: boolean | null;
  proxy_jump?: string | null;
  proxy_command?: string | null;
  forward_agent?: boolean | null;
  local_forward: string[];
  remote_forward: string[];
  dynamic_forward?: string | null;
  server_alive_interval?: number | null;
  server_alive_count_max?: number | null;
  strict_host_key_checking?: string | null;
  custom_directives: [string, string][];
  tags: string[];
  group?: string | null;
  notes?: string | null;
  color?: string | null;
  comments: string[];
}

export interface SshConfigFileData {
  file_path: string;
  exists: boolean;
  raw_content: string;
  hosts: SshHost[];
  global_directives: [string, string][];
  global_comments: string[];
}

export interface SshKeyInfo {
  file_name: string;
  private_path: string;
  public_path?: string | null;
  key_type: string;
  bits?: number | null;
  fingerprint_sha256: string;
  comment: string;
  public_key_content?: string | null;
  is_agent_loaded: boolean;
}

export interface GenerateKeyRequest {
  name: string;
  key_type: string;
  bits?: number | null;
  comment: string;
  passphrase?: string | null;
}

export interface TerminalAppInfo {
  id: string;
  name: string;
  is_installed: boolean;
  is_default: boolean;
  path: string;
}

export interface SshTestResult {
  success: boolean;
  exit_code?: number | null;
  output: string;
  duration_ms: number;
}

export interface KnownHostEntry {
  line_number: number;
  host: string;
  key_type: string;
  key_preview: string;
  is_hashed: boolean;
}

export interface AuditIssue {
  id?: string;
  severity: "critical" | "warning" | "info";
  category?: "permissions" | "syntax" | "keys" | "hosts" | string;
  title: string;
  description: string;
  path?: string | null;
  fixable: boolean;
  fix_action?: string | null;
  fix_preview?: string | null;
}

export interface SelectiveFixRequest {
  id: string;
  fix_action: string;
  path?: string | null;
}

export interface SelectiveFixResponse {
  success: boolean;
  fixed_count: number;
  messages: string[];
  report: SecurityAuditReport;
}

export interface SecurityAuditReport {
  total_hosts: number;
  total_keys: number;
  score: number;
  issues: AuditIssue[];
}

export interface PostCreationGuide {
  platform: "github" | "gitlab" | "bitbucket" | "cloud" | "bastion" | "homelab" | "tunnel" | "custom" | string;
  settingsUrl?: string;
  settingsLabel?: string;
  steps: string[];
  testCommand?: string;
  gitRemoteRewrite?: {
    pattern: string;
    example: string;
  };
  warnings?: string[];
  skipKeyInstall?: boolean;
}

export interface PresetTemplate {
  id: string;
  category: "git" | "cloud" | "bastion" | "homelab" | "tunnel" | "custom";
  title: string;
  subtitle: string;
  iconName: string;
  badge?: string;
  defaultHost: Partial<SshHost>;
  keyRecommendation?: {
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

export interface SshxBackupInfo {
  filename: string;
  display_name: string;
  file_path: string;
  size_bytes: number;
  modified_timestamp: number;
  is_primary: boolean;
}

