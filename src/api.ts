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
} from "./types";

export const api = {
  getSshConfig: async (): Promise<SshConfigFileData> => {
    return await invoke<SshConfigFileData>("get_ssh_config");
  },

  saveSshConfigRaw: async (content: string): Promise<SshConfigFileData> => {
    return await invoke<SshConfigFileData>("save_ssh_config_raw", { content });
  },

  saveRawConfig: async (content: string): Promise<SshConfigFileData> => {
    return await invoke<SshConfigFileData>("save_ssh_config_raw", { content });
  },

  saveSshHosts: async (
    globalComments: string[],
    globalDirectives: [string, string][],
    hosts: SshHost[]
  ): Promise<SshConfigFileData> => {
    return await invoke<SshConfigFileData>("save_ssh_hosts", {
      globalComments,
      globalDirectives,
      hosts,
    });
  },

  saveHost: async (hostToSave: SshHost): Promise<SshConfigFileData> => {
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

  deleteHost: async (hostId: string): Promise<SshConfigFileData> => {
    const current = await invoke<SshConfigFileData>("get_ssh_config");
    const updatedHosts = current.hosts.filter((h) => h.id !== hostId);
    return await invoke<SshConfigFileData>("save_ssh_hosts", {
      globalComments: current.global_comments,
      globalDirectives: current.global_directives,
      hosts: updatedHosts,
    });
  },

  getSshKeys: async (): Promise<SshKeyInfo[]> => {
    return await invoke<SshKeyInfo[]>("get_ssh_keys");
  },

  createSshKey: async (req: GenerateKeyRequest): Promise<SshKeyInfo> => {
    return await invoke<SshKeyInfo>("create_ssh_key", { req });
  },

  generateKey: async (req: GenerateKeyRequest): Promise<SshKeyInfo> => {
    return await invoke<SshKeyInfo>("create_ssh_key", { req });
  },

  addKeyToAgent: async (privatePath: string): Promise<string> => {
    return await invoke<string>("add_key_to_agent", { privatePath });
  },

  removeKeyFromAgent: async (privatePath: string): Promise<string> => {
    return await invoke<string>("remove_key_from_agent", { privatePath });
  },

  getDetectedTerminals: async (): Promise<TerminalAppInfo[]> => {
    return await invoke<TerminalAppInfo[]>("get_detected_terminals");
  },

  connectInTerminal: async (
    terminalId: string,
    hostAlias: string
  ): Promise<void> => {
    return await invoke<void>("connect_in_terminal", { terminalId, hostAlias });
  },

  launchTerminal: async (
    hostAlias: string,
    terminalId: string
  ): Promise<void> => {
    return await invoke<void>("connect_in_terminal", { terminalId, hostAlias });
  },

  testHostConnection: async (hostAlias: string): Promise<SshTestResult> => {
    return await invoke<SshTestResult>("test_host_connection", { hostAlias });
  },

  testHost: async (hostAlias: string): Promise<SshTestResult> => {
    return await invoke<SshTestResult>("test_host_connection", { hostAlias });
  },

  installKeyToRemote: async (
    hostAlias: string,
    identityFile?: string
  ): Promise<SshTestResult> => {
    return await invoke<SshTestResult>("install_key_to_remote", {
      hostAlias,
      identityFile,
    });
  },

  getKnownHosts: async (): Promise<KnownHostEntry[]> => {
    return await invoke<KnownHostEntry[]>("get_known_hosts");
  },

  deleteKnownHost: async (
    hostPattern: string,
    lineNumber?: number
  ): Promise<void> => {
    return await invoke<void>("delete_known_host", {
      hostPattern,
      lineNumber,
    });
  },

  removeKnownHost: async (hostPattern: string): Promise<void> => {
    return await invoke<void>("delete_known_host", {
      hostPattern,
    });
  },

  fixStaleHost: async (hostPattern: string): Promise<string> => {
    return await invoke<string>("fix_stale_host", { hostPattern });
  },

  listBackups: async (): Promise<string[]> => {
    return await invoke<string[]>("list_backups");
  },

  restoreBackup: async (backupName: string): Promise<SshConfigFileData> => {
    return await invoke<SshConfigFileData>("restore_backup", { backupName });
  },

  auditSecurity: async (): Promise<SecurityAuditReport> => {
    return await invoke<SecurityAuditReport>("audit_security");
  },

  fixSecurityPermissions: async (): Promise<SecurityAuditReport> => {
    return await invoke<SecurityAuditReport>("fix_security_permissions");
  },

  fixPermissions: async (): Promise<string> => {
    await invoke<SecurityAuditReport>("fix_security_permissions");
    return "Permissions successfully repaired to 700 (~/.ssh) and 600 (keys)!";
  },
};
