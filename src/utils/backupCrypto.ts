// Utilities for Encrypted .sshx Backup and Restore
// Format: AES-256-GCM encrypted payload with PBKDF2-SHA256 key derivation (100,000 iterations)

export interface SshxBackupPayload {
  magic: "SSHX_ENCRYPTED_BACKUP_V1";
  version: string;
  createdAt: string;
  configContent: string;
  knownHostsContent: string;
  customPresets: any[];
  metadata: {
    hostsCount: number;
    knownHostsCount: number;
    exportedBy: string;
  };
}

export interface SshxEncryptedBundle {
  format: "SSHX_BUNDLE";
  version: 1;
  kdf: "PBKDF2-SHA256";
  iterations: number;
  salt: string; // hex
  iv: string; // hex
  cipher: string; // base64
}

// Convert ArrayBuffer to Hex String
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Convert Hex String to Uint8Array
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Convert ArrayBuffer to Base64 String
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 String to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Derive AES-GCM-256 Key from Password and Salt using PBKDF2-SHA256
async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations = 100000
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Creates an encrypted .sshx backup string from a raw payload and password
 */
export async function createEncryptedSshxBackup(
  payload: SshxBackupPayload,
  password: string
): Promise<string> {
  if (!password || password.trim().length === 0) {
    throw new Error("A secure password is required to encrypt the backup.");
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 100000;

  const key = await deriveKey(password, salt, iterations);
  const enc = new TextEncoder();
  const rawBytes = enc.encode(JSON.stringify(payload));

  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: 128,
    },
    key,
    rawBytes
  );

  const bundle: SshxEncryptedBundle = {
    format: "SSHX_BUNDLE",
    version: 1,
    kdf: "PBKDF2-SHA256",
    iterations,
    salt: bufferToHex(salt.buffer),
    iv: bufferToHex(iv.buffer),
    cipher: bufferToBase64(cipherBuffer),
  };

  return JSON.stringify(bundle, null, 2);
}

/**
 * Decrypts a .sshx backup file string with a user-provided password
 */
export async function decryptSshxBackup(
  fileContent: string,
  password: string
): Promise<SshxBackupPayload> {
  if (!password) {
    throw new Error("Password is required to decrypt this .sshx backup.");
  }

  let bundle: SshxEncryptedBundle;
  try {
    bundle = JSON.parse(fileContent);
  } catch {
    throw new Error("Invalid .sshx file format. File is corrupted or not a valid SSHX backup.");
  }

  if (bundle.format !== "SSHX_BUNDLE" || !bundle.cipher || !bundle.salt || !bundle.iv) {
    throw new Error("Unrecognized .sshx backup format. Please select a valid .sshx file.");
  }

  const salt = hexToBuffer(bundle.salt);
  const iv = hexToBuffer(bundle.iv);
  const iterations = bundle.iterations || 100000;

  let key: CryptoKey;
  try {
    key = await deriveKey(password, salt, iterations);
  } catch (err: any) {
    throw new Error(`Failed to derive encryption key: ${err.message || err}`);
  }

  const cipherBytes = base64ToBuffer(bundle.cipher);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv as BufferSource,
        tagLength: 128,
      },
      key,
      cipherBytes as BufferSource
    );

    const dec = new TextDecoder();
    const jsonStr = dec.decode(decryptedBuffer);
    const payload = JSON.parse(jsonStr) as SshxBackupPayload;

    if (payload.magic !== "SSHX_ENCRYPTED_BACKUP_V1") {
      throw new Error("Decryption succeeded but magic header is invalid.");
    }

    return payload;
  } catch {
    throw new Error("Incorrect password or corrupted .sshx backup file. Decryption failed.");
  }
}

/**
 * Helper to download a string as a .sshx file in browser/Tauri
 */
export function downloadSshxFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/x-sshx-backup" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".sshx") ? filename : `${filename}.sshx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
