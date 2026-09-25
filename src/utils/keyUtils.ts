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
