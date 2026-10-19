import { SshHost } from "../types";

export interface GitProviderInfo {
  /** "github" | "gitlab" | "generic" */
  id: string;
  /** Display name, e.g. "GitHub" */
  name: string;
  /** Direct URL to the provider's "add SSH key" settings page, if known */
  settingsUrl?: string;
  settingsLabel?: string;
  /** Hosts like github.com / gitlab.com never accept ssh-copy-id */
  supportsSshCopyId: boolean;
}

/**
 * Heuristic: is this host a git-hosting account (github.com, gitlab.com,
 * bitbucket.org, ...)? Matches the heuristics used by the Setup & Auth Guide.
 */
export function isGitHost(
  host: Pick<SshHost, "host_name" | "host_pattern" | "user" | "tags"> | null | undefined
): boolean {
  if (!host) return false;
  const hostName = (host.host_name || "").toLowerCase();
  const hostPattern = (host.host_pattern || "").toLowerCase();
  const hostUser = (host.user || "").toLowerCase();
  const tags = Array.isArray(host.tags) ? host.tags : [];
  return (
    hostName.includes("github.com") ||
    hostName.includes("gitlab.com") ||
    hostName.includes("bitbucket.org") ||
    hostName.includes("ssh.dev.azure.com") ||
    hostPattern.includes("github") ||
    hostPattern.includes("gitlab") ||
    hostUser === "git" ||
    tags.some((t) => ["git", "github", "gitlab", "bitbucket"].includes((t || "").toLowerCase()))
  );
}

/**
 * Provider-specific info for git hosts: where to register the public key.
 * Returns null for non-git hosts.
 */
export function getGitProviderInfo(
  host: Pick<SshHost, "host_name" | "host_pattern" | "user" | "tags"> | null | undefined
): GitProviderInfo | null {
  if (!isGitHost(host)) return null;
  const hostName = (host?.host_name || "").toLowerCase();
  const hostPattern = (host?.host_pattern || "").toLowerCase();
  if (hostName.includes("github.com") || hostPattern.includes("github")) {
    return {
      id: "github",
      name: "GitHub",
      settingsUrl: "https://github.com/settings/ssh/new",
      settingsLabel: "Open GitHub → SSH Keys",
      supportsSshCopyId: false,
    };
  }
  if (hostName.includes("gitlab.com") || hostPattern.includes("gitlab")) {
    return {
      id: "gitlab",
      name: "GitLab",
      settingsUrl: "https://gitlab.com/-/user_settings/ssh_keys",
      settingsLabel: "Open GitLab → SSH Keys",
      supportsSshCopyId: false,
    };
  }
  if (hostName.includes("bitbucket.org") || hostPattern.includes("bitbucket")) {
    return {
      id: "bitbucket",
      name: "Bitbucket",
      settingsUrl: "https://bitbucket.org/account/settings/ssh-keys/",
      settingsLabel: "Open Bitbucket → SSH Keys",
      supportsSshCopyId: false,
    };
  }
  return {
    id: "generic",
    name: "your Git provider",
    supportsSshCopyId: false,
  };
}

/**
 * Other hosts that point at the same server (same HostName, User and Port) —
 * e.g. two GitHub accounts. Only the alias + IdentityFile tells them apart.
 */
export function findSiblingHosts(
  host: Pick<SshHost, "id" | "host_name" | "user" | "port">,
  hosts: SshHost[]
): SshHost[] {
  const name = (host.host_name || "").trim().toLowerCase();
  if (!name) return [];
  return hosts.filter(
    (h) =>
      h.id !== host.id &&
      (h.host_name || "").trim().toLowerCase() === name &&
      (h.user || "").toLowerCase() === (host.user || "").toLowerCase() &&
      (h.port || 22) === (host.port || 22)
  );
}

/** Account name from a git provider's `ssh -T` reply ("Hi bob!", "Welcome to GitLab, @bob!", "logged in as bob."). */
export function parseGitAccount(output: string): string | null {
  const m =
    /Hi ([\w.-]+)!/.exec(output) ||
    /Welcome to GitLab, @([\w.-]+)!/.exec(output) ||
    /logged in as ([\w.-]+)/.exec(output);
  return m ? m[1].replace(/\.$/, "") : null;
}

/** Account label kept as an `account:<name>` tag so it persists in ~/.ssh/config metadata. */
export function getAccountLabel(host: Pick<SshHost, "tags">): string | null {
  const t = (host.tags || []).find((x) => x.toLowerCase().startsWith("account:"));
  return t ? t.slice("account:".length) : null;
}

export function firstAlias(host: Pick<SshHost, "host_pattern">): string {
  return host.host_pattern.trim().split(/\s+/)[0] || host.host_pattern;
}

/** `git remote set-url` snippet that routes a repo through this alias. */
export function gitRemoteUrl(host: Pick<SshHost, "host_pattern">): string {
  return `git@${firstAlias(host)}:owner/repo.git`;
}

export interface HostCluster {
  /** Shared server address when more than one host uses it, else null. */
  target: string | null;
  hosts: SshHost[];
}

/** Cluster hosts that share a server (first-seen order kept). */
export function clusterHosts(hosts: SshHost[]): HostCluster[] {
  const out: HostCluster[] = [];
  const used = new Set<string>();
  for (const h of hosts) {
    if (used.has(h.id)) continue;
    const sibs = findSiblingHosts(h, hosts);
    const members = [h, ...sibs];
    members.forEach((m) => used.add(m.id));
    out.push({ target: sibs.length ? (h.host_name || "").trim() : null, hosts: members });
  }
  return out;
}
