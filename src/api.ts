import { invoke } from "@tauri-apps/api/core";
import {
  SshConfigFileData,
  SshHost,
  SshKeyInfo,
  GenerateKeyRequest,
  TerminalAppInfo,
  SshTestResult,
  KnownHostEntry,
  SecurityAuditReport,
  SelectiveFixRequest,
  SelectiveFixResponse,
  SshxBackupInfo,
} from "./types";

const isTauri = (): boolean => {
  return (
    typeof window !== "undefined" &&
    Boolean((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)
  );
};

// Stateful in-memory mock data for Browser / Website Demo Mode
let mockHosts: SshHost[] = [
  {
    id: "mock-1",
    host_pattern: "prod-api-cluster",
    host_name: "54.210.88.42",
    user: "ec2-user",
    port: 22,
    identity_file: "~/.ssh/id_ed25519_aws_prod",
    identities_only: true,
    proxy_jump: null,
    proxy_command: null,
    forward_agent: true,
    local_forward: [],
    remote_forward: [],
    dynamic_forward: null,
    server_alive_interval: 60,
    server_alive_count_max: 3,
    strict_host_key_checking: "ask",
    custom_directives: [],
    tags: ["aws", "production", "api"],
    group: "Production",
    notes: "Main API Cluster Gateway (us-east-1)",
    color: "#10b981",
    comments: ["# Primary AWS Production Cluster"],
  },
  {
    id: "mock-2",
    host_pattern: "bastion-internal-jump",
    host_name: "10.0.1.50",
    user: "admin",
    port: 2222,
    identity_file: "~/.ssh/id_rsa_legacy_bastion",
    identities_only: false,
    proxy_jump: "gateway.internal.corp",
    proxy_command: null,
    forward_agent: false,
    local_forward: ["8080:localhost:8080"],
    remote_forward: [],
    dynamic_forward: null,
    server_alive_interval: 30,
    server_alive_count_max: 5,
    strict_host_key_checking: "yes",
    custom_directives: [["TCPKeepAlive", "yes"]],
    tags: ["bastion", "vpc", "security"],
    group: "Infrastructure",
    notes: "ProxyJump required to access internal database nodes",
    color: "#a855f7",
    comments: ["# Corporate Secure Jump Host"],
  },
  {
    id: "mock-3",
    host_pattern: "github.com",
    host_name: "github.com",
    user: "git",
    port: 22,
    identity_file: "~/.ssh/id_ed25519_github_work",
    identities_only: true,
    proxy_jump: null,
    proxy_command: null,
    forward_agent: false,
    local_forward: [],
    remote_forward: [],
    dynamic_forward: null,
    server_alive_interval: null,
    server_alive_count_max: null,
    strict_host_key_checking: null,
    custom_directives: [],
    tags: ["git", "enterprise"],
    group: "Git Work",
    notes: "GitHub Enterprise Work Account Key Binding",
    color: "#06b6d4",
    comments: ["# Work GitHub identity override"],
  },
  {
    id: "mock-4",
    host_pattern: "homelab-k3s-master",
    host_name: "192.168.1.120",
    user: "ubuntu",
    port: 22,
    identity_file: "~/.ssh/id_ed25519_homelab",
    identities_only: false,
    proxy_jump: null,
    proxy_command: null,
    forward_agent: false,
    local_forward: ["6443:localhost:6443"],
    remote_forward: [],
    dynamic_forward: "1080",
    server_alive_interval: 60,
    server_alive_count_max: 3,
    strict_host_key_checking: "no",
    custom_directives: [],
    tags: ["k3s", "kubernetes", "homelab"],
    group: "HomeLab",
    notes: "HomeLab K3s Control Plane Node",
    color: "#f59e0b",
    comments: ["# Personal HomeLab cluster"],
  },
];

let mockKeys: SshKeyInfo[] = [
  {
    file_name: "id_ed25519_aws_prod",
    private_path: "~/.ssh/id_ed25519_aws_prod",
    public_path: "~/.ssh/id_ed25519_aws_prod.pub",
    key_type: "ed25519",
    bits: 256,
    fingerprint_sha256: "SHA256:4N9v8kO13sL79dFmXpW7m...",
    comment: "ec2-user@aws-prod",
    public_key_content:
      "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleAwsKeyFingerprint ec2-user@aws-prod",
    is_agent_loaded: true,
  },
  {
    file_name: "id_ed25519_github_work",
    private_path: "~/.ssh/id_ed25519_github_work",
    public_path: "~/.ssh/id_ed25519_github_work.pub",
    key_type: "ed25519",
    bits: 256,
    fingerprint_sha256: "SHA256:8Z2x1yW90mN33cKqVtQ2a...",
    comment: "asmat@github-enterprise",
    public_key_content:
      "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleGithubWorkKey asmat@github-enterprise",
    is_agent_loaded: true,
  },
  {
    file_name: "id_rsa_legacy_bastion",
    private_path: "~/.ssh/id_rsa_legacy_bastion",
    public_path: "~/.ssh/id_rsa_legacy_bastion.pub",
    key_type: "rsa",
    bits: 4096,
    fingerprint_sha256: "SHA256:7X1p2qT54bB88aLzYwM9p...",
    comment: "bastion-root@jump",
    public_key_content:
      "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC8LegacyBastionKey bastion-root@jump",
    is_agent_loaded: false,
  },
];

let mockKnownHosts: KnownHostEntry[] = [
  {
    line_number: 1,
    host: "github.com,140.82.121.4",
    key_type: "ssh-ed25519",
    key_preview: "AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5A9Wo...",
    is_hashed: false,
  },
  {
    line_number: 2,
    host: "54.210.88.42",
    key_type: "ssh-rsa",
    key_preview: "AAAAB3NzaC1yc2EAAAADAQABAAABAQC8...",
    is_hashed: false,
  },
  {
    line_number: 3,
    host: "192.168.1.100",
    key_type: "ecdsa-sha2-nistp256",
    key_preview: "AAAAE2VjZHNhLXNoYTItbmlzdHAyNTY...",
    is_hashed: false,
  },
];

let mockAuditReport: SecurityAuditReport = {
  total_hosts: 4,
  total_keys: 3,
  score: 82,
  issues: [
    {
      id: "perm-config",
      severity: "warning",
      category: "permissions",
      title: "Permissions too open: ~/.ssh/config (644)",
      description: "Config file permissions are world-readable (644). Recommended: 600.",
      path: "~/.ssh/config",
      fixable: true,
      fix_action: "chmod_600",
      fix_preview: "chmod 600 ~/.ssh/config",
    },
    {
      id: "stale-known-host",
      severity: "info",
      category: "hosts",
      title: "Stale known_hosts entry: 192.168.1.100",
      description: "Host key was detected as stale or unverified.",
      path: "~/.ssh/known_hosts",
      fixable: true,
      fix_action: "remove_stale",
      fix_preview: "Remove line 3 from known_hosts",
    },
  ],
};

const mockTerminals: TerminalAppInfo[] = [
  {
    id: "ghostty",
    name: "Ghostty",
    is_installed: true,
    is_default: true,
    path: "/Applications/Ghostty.app",
  },
  {
    id: "wezterm",
    name: "WezTerm",
    is_installed: true,
    is_default: false,
    path: "/Applications/WezTerm.app",
  },
  {
    id: "iterm2",
    name: "iTerm2",
    is_installed: true,
    is_default: false,
    path: "/Applications/iTerm.app",
  },
  {
    id: "terminal",
    name: "Terminal.app",
    is_installed: true,
    is_default: false,
    path: "/System/Applications/Utilities/Terminal.app",
  },
];

const mockBackups: SshxBackupInfo[] = [
  {
    filename: "config.sshx.bak",
    display_name: "Single Snapshot Backup (Active)",
    file_path: "~/.ssh/config.sshx.bak",
    size_bytes: 1420,
    modified_timestamp: Date.now() - 3600000,
    is_primary: true,
  },
];

const getMockConfigData = (): SshConfigFileData => ({
  file_path: "~/.ssh/config",
  exists: true,
  raw_content: `# SSHX Managed Configuration
Host prod-api-cluster
  HostName 54.210.88.42
  User ec2-user
  IdentityFile ~/.ssh/id_ed25519_aws_prod

Host bastion-internal-jump
  HostName 10.0.1.50
  User admin
  Port 2222
  ProxyJump gateway.internal.corp
  LocalForward 8080 localhost:8080

Host github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github_work
`,
  hosts: [...mockHosts],
  global_directives: [["ServerAliveInterval", "60"]],
  global_comments: ["# Global SSH configurations"],
});

export const api = {
  getSshConfig: async (): Promise<SshConfigFileData> => {
    if (!isTauri()) return getMockConfigData();
    return await invoke<SshConfigFileData>("get_ssh_config");
  },

  saveSshConfigRaw: async (content: string): Promise<SshConfigFileData> => {
    if (!isTauri()) return getMockConfigData();
    return await invoke<SshConfigFileData>("save_ssh_config_raw", { content });
  },

  saveRawConfig: async (content: string): Promise<SshConfigFileData> => {
    if (!isTauri()) return getMockConfigData();
    return await invoke<SshConfigFileData>("save_ssh_config_raw", { content });
  },

  saveSshHosts: async (
    globalComments: string[],
    globalDirectives: [string, string][],
    hosts: SshHost[]
  ): Promise<SshConfigFileData> => {
    if (!isTauri()) {
      mockHosts = [...hosts];
      return getMockConfigData();
    }
    return await invoke<SshConfigFileData>("save_ssh_hosts", {
      globalComments,
      globalDirectives,
      hosts,
    });
  },

  saveHost: async (hostToSave: SshHost): Promise<SshConfigFileData> => {
    if (!isTauri()) {
      const idx = mockHosts.findIndex((h) => h.id === hostToSave.id);
      if (idx >= 0) {
        mockHosts[idx] = hostToSave;
      } else {
        mockHosts.push(hostToSave);
      }
      return getMockConfigData();
    }
    const current = await invoke<SshConfigFileData>("get_ssh_config");
    const existingIdx = current.hosts.findIndex((h) => h.id === hostToSave.id);
    let updatedHosts: SshHost[];
    if (existingIdx >= 0) {
      updatedHosts = [...current.hosts];
      updatedHosts[existingIdx] = hostToSave;
    } else {
      updatedHosts = [...current.hosts, hostToSave];
    }
    return await invoke<SshConfigFileData>("save_ssh_hosts", {
      globalComments: current.global_comments,
      globalDirectives: current.global_directives,
      hosts: updatedHosts,
    });
  },

  deleteHost: async (
    hostId: string,
    hostPattern?: string
  ): Promise<SshConfigFileData> => {
    if (!isTauri()) {
      mockHosts = mockHosts.filter((h) => h.id !== hostId);
      return getMockConfigData();
    }
    return await invoke<SshConfigFileData>("delete_host", {
      hostId,
      hostPattern: hostPattern || null,
    });
  },

  getSshKeys: async (): Promise<SshKeyInfo[]> => {
    if (!isTauri()) return [...mockKeys];
    return await invoke<SshKeyInfo[]>("get_ssh_keys");
  },

  createSshKey: async (req: GenerateKeyRequest): Promise<SshKeyInfo> => {
    if (!isTauri()) {
      const newKey: SshKeyInfo = {
        file_name: req.name,
        private_path: `~/.ssh/${req.name}`,
        public_path: `~/.ssh/${req.name}.pub`,
        key_type: req.key_type,
        bits: req.bits || (req.key_type === "ed25519" ? 256 : 4096),
        fingerprint_sha256: `SHA256:${Math.random().toString(36).substring(2, 15)}...`,
        comment: req.comment || "",
        public_key_content: `ssh-${req.key_type} AAAAC3NzaC1... ${req.comment}`,
        is_agent_loaded: true,
      };
      mockKeys.push(newKey);
      return newKey;
    }
    return await invoke<SshKeyInfo>("create_ssh_key", { req });
  },

  generateKey: async (req: GenerateKeyRequest): Promise<SshKeyInfo> => {
    return await api.createSshKey(req);
  },

  deleteKey: async (
    privatePath: string,
    unlinkHosts: boolean = true
  ): Promise<string> => {
    if (!isTauri()) {
      mockKeys = mockKeys.filter((k) => k.private_path !== privatePath);
      return "Key deleted successfully (mock)";
    }
    return await invoke<string>("delete_key", {
      privatePath,
      unlinkHosts,
    });
  },

  unlinkKey: async (keyPath: string): Promise<SshConfigFileData> => {
    if (!isTauri()) return getMockConfigData();
    return await invoke<SshConfigFileData>("unlink_key", { keyPath });
  },

  addKeyToAgent: async (privatePath: string): Promise<string> => {
    if (!isTauri()) {
      const k = mockKeys.find((x) => x.private_path === privatePath);
      if (k) k.is_agent_loaded = true;
      return "Identity added to ssh-agent (mock)";
    }
    return await invoke<string>("add_key_to_agent", { privatePath });
  },

  removeKeyFromAgent: async (privatePath: string): Promise<string> => {
    if (!isTauri()) {
      const k = mockKeys.find((x) => x.private_path === privatePath);
      if (k) k.is_agent_loaded = false;
      return "Identity removed from ssh-agent (mock)";
    }
    return await invoke<string>("remove_key_from_agent", { privatePath });
  },

  getDetectedTerminals: async (): Promise<TerminalAppInfo[]> => {
    if (!isTauri()) return [...mockTerminals];
    return await invoke<TerminalAppInfo[]>("get_detected_terminals");
  },

  connectInTerminal: async (
    terminalId: string,
    hostAlias: string
  ): Promise<void> => {
    if (!isTauri()) return;
    return await invoke<void>("connect_in_terminal", { terminalId, hostAlias });
  },

  launchTerminal: async (
    hostAlias: string,
    terminalId: string
  ): Promise<void> => {
    if (!isTauri()) return;
    return await invoke<void>("connect_in_terminal", { terminalId, hostAlias });
  },

  testHostConnection: async (hostAlias: string): Promise<SshTestResult> => {
    if (!isTauri()) {
      return {
        success: true,
        exit_code: 0,
        output: `SSH-2.0-OpenSSH_9.6\nConnection to ${hostAlias} verified successfully.\nAuthenticated with publickey.\nDuration: 28ms`,
        duration_ms: 28,
      };
    }
    return await invoke<SshTestResult>("test_host_connection", { hostAlias });
  },

  testHost: async (hostAlias: string): Promise<SshTestResult> => {
    return await api.testHostConnection(hostAlias);
  },

  testDirectConnection: async (
    hostName: string,
    user?: string,
    port?: number,
    identityFile?: string
  ): Promise<SshTestResult> => {
    if (!isTauri()) {
      return {
        success: true,
        exit_code: 0,
        output: `Connected to ${user || "default"}@${hostName}:${port || 22}\nSimulated dry-run OK.`,
        duration_ms: 35,
      };
    }
    return await invoke<SshTestResult>("test_direct_connection", {
      hostName,
      user: user || null,
      port: port || null,
      identityFile: identityFile || null,
    });
  },

  installKeyToRemote: async (
    hostAlias: string,
    identityFile?: string
  ): Promise<SshTestResult> => {
    if (!isTauri()) {
      return {
        success: true,
        exit_code: 0,
        output: `Key appended to remote ~/.ssh/authorized_keys on ${hostAlias}`,
        duration_ms: 120,
      };
    }
    return await invoke<SshTestResult>("install_key_to_remote", {
      hostAlias,
      identityFile,
    });
  },

  getKnownHosts: async (): Promise<KnownHostEntry[]> => {
    if (!isTauri()) return [...mockKnownHosts];
    return await invoke<KnownHostEntry[]>("get_known_hosts");
  },

  deleteKnownHost: async (
    hostPattern: string,
    lineNumber?: number
  ): Promise<void> => {
    if (!isTauri()) {
      mockKnownHosts = mockKnownHosts.filter((k) => k.host !== hostPattern);
      return;
    }
    return await invoke<void>("delete_known_host", {
      hostPattern,
      lineNumber,
    });
  },

  removeKnownHost: async (hostPattern: string): Promise<void> => {
    return await api.deleteKnownHost(hostPattern);
  },

  getKnownHostsRaw: async (): Promise<string> => {
    if (!isTauri()) return "github.com,140.82.121.4 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5A9Wo\n";
    return await invoke<string>("get_known_hosts_raw");
  },

  saveKnownHostsRaw: async (content: string): Promise<void> => {
    if (!isTauri()) return;
    return await invoke<void>("save_known_hosts_raw", { content });
  },

  fixStaleHost: async (hostPattern: string): Promise<string> => {
    if (!isTauri()) {
      mockKnownHosts = mockKnownHosts.filter((k) => k.host !== hostPattern);
      return "Stale known host removed (mock)";
    }
    return await invoke<string>("fix_stale_host", { hostPattern });
  },

  listBackups: async (): Promise<SshxBackupInfo[]> => {
    if (!isTauri()) return [...mockBackups];
    return await invoke<SshxBackupInfo[]>("list_backups");
  },

  getDeviceSnapshotInfo: async (): Promise<SshxBackupInfo | null> => {
    if (!isTauri()) return mockBackups[0] || null;
    return await invoke<SshxBackupInfo | null>("get_device_snapshot_info");
  },

  readBackupPreview: async (backupName: string): Promise<string> => {
    if (!isTauri()) return "# SSHX Snapshot Backup Content\nHost prod-api-cluster\n  HostName 54.210.88.42\n";
    return await invoke<string>("read_backup_preview", { backupName });
  },

  restoreBackup: async (backupName: string): Promise<SshConfigFileData> => {
    if (!isTauri()) return getMockConfigData();
    return await invoke<SshConfigFileData>("restore_backup", { backupName });
  },

  restoreDeviceSnapshot: async (): Promise<SshConfigFileData> => {
    if (!isTauri()) return getMockConfigData();
    return await invoke<SshConfigFileData>("restore_backup", {
      backupName: "config.sshx.bak",
    });
  },

  auditSecurity: async (): Promise<SecurityAuditReport> => {
    if (!isTauri()) return { ...mockAuditReport };
    return await invoke<SecurityAuditReport>("audit_security");
  },

  fixSecurityPermissions: async (): Promise<SecurityAuditReport> => {
    if (!isTauri()) {
      mockAuditReport = {
        ...mockAuditReport,
        score: 100,
        issues: [],
      };
      return { ...mockAuditReport };
    }
    return await invoke<SecurityAuditReport>("fix_security_permissions");
  },

  fixSelectedSecurityIssues: async (
    requests: SelectiveFixRequest[]
  ): Promise<SelectiveFixResponse> => {
    if (!isTauri()) {
      const fixedIds = new Set(requests.map((r) => r.id));
      mockAuditReport = {
        ...mockAuditReport,
        score: 100,
        issues: mockAuditReport.issues.filter((i) => !fixedIds.has(i.id || "")),
      };
      return {
        success: true,
        fixed_count: requests.length,
        messages: ["Auto-repaired permissions & stale entries (mock)."],
        report: { ...mockAuditReport },
      };
    }
    return await invoke<SelectiveFixResponse>("fix_selected_security_issues", {
      requests,
    });
  },

  fixPermissions: async (): Promise<string> => {
    if (!isTauri()) {
      await api.fixSecurityPermissions();
      return "Permissions successfully repaired to 700 (~/.ssh) and 600 (keys)!";
    }
    await invoke<SecurityAuditReport>("fix_security_permissions");
    return "Permissions successfully repaired to 700 (~/.ssh) and 600 (keys)!";
  },
};
