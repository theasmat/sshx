import { SshKeyInfo, SshHost } from "../types";

/**
 * Normalizes and sanitizes a key file name.
 */
export function cleanKeyFileName(name: string): string {
  let cleaned = name.trim().replace(/[\/\\]/g, "_").replace(/\s+/g, "_");
  if (cleaned.endsWith(".pub")) {
    cleaned = cleaned.slice(0, -4);
  }
  return cleaned;
}

/**
 * Checks if a key file name already exists in the given list of SSH keys.
 */
export function isKeyNameDuplicate(name: string, keys: SshKeyInfo[]): boolean {
  const clean = cleanKeyFileName(name);
  if (!clean) return false;
  return keys.some((k) => {
    const kName = cleanKeyFileName(k.file_name);
    const kPath = k.private_path ? k.private_path.split("/").pop() || "" : "";
    return kName.toLowerCase() === clean.toLowerCase() || kPath.toLowerCase() === clean.toLowerCase();
  });
}

/**
 * Returns the matching existing key if one exists with the given name.
 */
export function findMatchingExistingKey(
  name: string,
  keys: SshKeyInfo[]
): SshKeyInfo | undefined {
  const clean = cleanKeyFileName(name);
  if (!clean) return undefined;
  return keys.find((k) => {
    const kName = cleanKeyFileName(k.file_name);
    const kPath = k.private_path ? k.private_path.split("/").pop() || "" : "";
    return kName.toLowerCase() === clean.toLowerCase() || kPath.toLowerCase() === clean.toLowerCase();
  });
}

/**
 * Generates a unique, non-colliding key name by appending an incrementing index if duplicate.
 * E.g., "id_ed25519_github_personal" -> "id_ed25519_github_personal_2"
 */
export function getUniqueKeyName(baseName: string, keys: SshKeyInfo[]): string {
  let clean = cleanKeyFileName(baseName);
  if (!clean) {
    clean = "id_ed25519_custom";
  }

  if (!isKeyNameDuplicate(clean, keys)) {
    return clean;
  }

  // Strip trailing numeric suffix like "_2" or "_3"
  const rootName = clean.replace(/_\d+$/, "");

  let counter = 2;
  while (true) {
    const candidate = `${rootName}_${counter}`;
    if (!isKeyNameDuplicate(candidate, keys)) {
      return candidate;
    }
    counter++;
  }
}

/**
 * Automatically derives a recommended, non-colliding SSH key filename from a host alias.
 */
export function suggestKeyNameForHost(
  hostPattern: string,
  keyType: "ed25519" | "rsa" | "ecdsa" = "ed25519",
  keys: SshKeyInfo[] = []
): string {
  const sanitizedPattern = hostPattern
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/^_+|_+$/g, "");

  const baseName = sanitizedPattern
    ? `id_${keyType}_${sanitizedPattern}`
    : `id_${keyType}_custom`;

  return getUniqueKeyName(baseName, keys);
}

/**
 * Checks if a host pattern alias already exists in ~/.ssh/config.
 */
export function isHostAliasDuplicate(
  alias: string,
  hosts: SshHost[],
  currentHostId?: string
): boolean {
  const clean = alias.trim().toLowerCase();
  if (!clean) return false;
  return hosts.some(
    (h) => h.id !== currentHostId && h.host_pattern.trim().toLowerCase() === clean
  );
}

/**
 * Generates a unique host alias if duplicate (e.g. github-personal -> github-personal-2).
 */
export function getUniqueHostAlias(
  baseAlias: string,
  hosts: SshHost[],
  currentHostId?: string
): string {
  const clean = baseAlias.trim();
  if (!clean) return "my-host";

  if (!isHostAliasDuplicate(clean, hosts, currentHostId)) {
    return clean;
  }

  const rootAlias = clean.replace(/-\d+$/, "");
  let counter = 2;
  while (true) {
    const candidate = `${rootAlias}-${counter}`;
    if (!isHostAliasDuplicate(candidate, hosts, currentHostId)) {
      return candidate;
    }
    counter++;
  }
}

export interface KeyNameContext {
  alias: string;
  hostName?: string | null;
  /** Account label ("work", "personal") from the `account:` tag or a detected username. */
  account?: string | null;
  keyType?: "ed25519" | "rsa" | "ecdsa";
}

const slug = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

/** "github.com" -> "github", "git.example.co.uk" -> "git_example", IPs keep their dots as "_". */
export function providerSlug(hostName?: string | null): string {
  const h = (hostName || "").trim().toLowerCase();
  if (!h) return "";
  if (/^[\d.]+$/.test(h) || h.includes(":")) return slug(h);
  const labels = h.split(".").filter(Boolean);
  const known = ["github", "gitlab", "bitbucket"].find((p) => labels.includes(p));
  if (known) return known;
  return slug(labels.length > 1 ? labels.slice(0, -1).join("_") : labels[0]);
}

/**
 * Candidate key filenames, best first. A bare alias like "github.com" says nothing
 * about which account the key is for, so prefer provider + account when known.
 */
export function keyNameCandidates(ctx: KeyNameContext): string[] {
  const type = ctx.keyType || "ed25519";
  const aliasSlug = slug(ctx.alias.trim().split(/\s+/)[0] || "");
  const provider = providerSlug(ctx.hostName);
  const account = slug(ctx.account || "");
  // alias that is just the hostname ("github.com") carries no identity
  const aliasIsHostname =
    !!aliasSlug &&
    (aliasSlug === slug(ctx.hostName || "") || aliasSlug === provider || aliasSlug === provider.replace(/_/g, ""));

  const parts: string[][] = [];
  if (account && provider) parts.push([provider, account]);
  if (aliasSlug && !aliasIsHostname) parts.push([aliasSlug]);
  if (provider) parts.push([provider]);
  if (aliasSlug) parts.push([aliasSlug]);
  const names = parts.map((p) => `id_${type}_${p.join("_")}`);
  return Array.from(new Set(names.length ? names : [`id_${type}_custom`]));
}

/** Best non-colliding name for a new key. */
export function suggestKeyName(ctx: KeyNameContext, keys: SshKeyInfo[] = []): string {
  return getUniqueKeyName(keyNameCandidates(ctx)[0], keys);
}

/** Up to `max` other free names to offer as one-click alternatives. */
export function keyNameAlternatives(ctx: KeyNameContext, keys: SshKeyInfo[], max = 3): string[] {
  const best = suggestKeyName(ctx, keys);
  return keyNameCandidates(ctx)
    .filter((n) => !isKeyNameDuplicate(n, keys) && n !== best)
    .slice(0, max);
}

/** Key comment that is recognisable on a provider's key page and in `ssh-add -l`. */
export function suggestKeyComment(ctx: KeyNameContext): string {
  const alias = slug(ctx.alias.trim().split(/\s+/)[0] || "") || "host";
  return ctx.account ? `${slug(ctx.account)}@${alias}` : `${alias}@sshx`;
}

/**
 * Alias that identifies the account instead of the bare hostname:
 * ("github.com", "work") -> "github-work". Returns "" when nothing to suggest.
 */
export function suggestHostAlias(
  hostName: string,
  account: string | null | undefined,
  hosts: SshHost[],
  currentHostId?: string
): string {
  const provider = providerSlug(hostName).replace(/_/g, "-");
  if (!provider) return "";
  const acct = slug(account || "").replace(/_/g, "-");
  return getUniqueHostAlias(acct ? `${provider}-${acct}` : provider, hosts, currentHostId);
}

/** A bare provider hostname as alias makes every repo use this host's key by default. */
export function isBareHostnameAlias(alias: string, hostName?: string | null): boolean {
  const a = alias.trim().toLowerCase();
  const h = (hostName || "").trim().toLowerCase();
  return !!a && !!h && a === h && /(github|gitlab|bitbucket)/.test(h);
}

/** Stable identity of a key path so `~/.ssh/k` and `/Users/me/.ssh/k` compare equal. */
export function keyIdentity(path: string): string {
  const p = path.trim();
  if (p.startsWith("~/.ssh/")) return p.slice("~/.ssh/".length);
  const i = p.lastIndexOf("/.ssh/");
  return i >= 0 ? p.slice(i + "/.ssh/".length) : p;
}

/** Hosts whose IdentityFile points at this key, however the path is written. */
export function hostsUsingKey(key: Pick<SshKeyInfo, "private_path" | "file_name">, hosts: SshHost[]): SshHost[] {
  const target = keyIdentity(key.private_path);
  return hosts.filter((h) => {
    const id = (h.identity_file || "").trim();
    return !!id && (keyIdentity(id) === target || (id.split("/").pop() || id) === key.file_name);
  });
}

/** Hosts (other than `currentId`) that use this key on the same server, e.g. another GitHub account's alias. */
export function keyConflictHosts(
  identityFile: string,
  hostName: string | null | undefined,
  hosts: SshHost[],
  currentId?: string
): SshHost[] {
  const server = (hostName || "").trim().toLowerCase();
  if (!identityFile.trim() || !server) return [];
  const probe = { private_path: identityFile, file_name: identityFile.split("/").pop() || identityFile };
  return hostsUsingKey(probe, hosts).filter(
    (h) => h.id !== currentId && (h.host_name || "").trim().toLowerCase() === server
  );
}
