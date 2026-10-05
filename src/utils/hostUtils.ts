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
