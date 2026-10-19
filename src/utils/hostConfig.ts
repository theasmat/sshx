import { SshHost } from "../types";

/** Mirrors the Rust serializer's output for one host block, so the preview matches what is written. */
export function buildHostBlock(h: SshHost): string {
  const t = (v?: string | null) => (v ?? "").trim();
  const out: string[] = [];

  const meta: string[] = [];
  if (h.tags?.length) meta.push(`tags=${h.tags.join(",")}`);
  if (t(h.group)) meta.push(`group=${t(h.group).replace(/ /g, "_")}`);
  if (t(h.notes)) meta.push(`note=${t(h.notes).replace(/ /g, "_")}`);
  if (t(h.color)) meta.push(`color=${t(h.color)}`);
  if (meta.length) out.push(`# @sshx: ${meta.join(" ")}`);

  out.push(`${h.is_match ? "Match" : "Host"} ${t(h.host_pattern) || "my-host"}`);
  const line = (k: string, v: string | number) => out.push(`    ${k} ${v}`);

  if (t(h.host_name)) line("HostName", t(h.host_name));
  if (t(h.user)) line("User", t(h.user));
  if (h.port && h.port !== 22) line("Port", h.port);
  if (t(h.identity_file)) line("IdentityFile", t(h.identity_file));
  // Rust never persists IdentitiesOnly without an IdentityFile
  if (h.identities_only && t(h.identity_file)) line("IdentitiesOnly", "yes");
  if (t(h.proxy_jump)) line("ProxyJump", t(h.proxy_jump));
  if (t(h.proxy_command)) line("ProxyCommand", t(h.proxy_command));
  if (h.forward_agent != null) line("ForwardAgent", h.forward_agent ? "yes" : "no");
  h.local_forward.filter(t).forEach((v) => line("LocalForward", v.trim()));
  h.remote_forward.filter(t).forEach((v) => line("RemoteForward", v.trim()));
  if (t(h.dynamic_forward)) line("DynamicForward", t(h.dynamic_forward));
  if (h.server_alive_interval && h.server_alive_interval > 0) line("ServerAliveInterval", h.server_alive_interval);
  if (h.server_alive_count_max && h.server_alive_count_max > 0) line("ServerAliveCountMax", h.server_alive_count_max);
  if (t(h.strict_host_key_checking)) line("StrictHostKeyChecking", t(h.strict_host_key_checking));
  for (const [k, v] of h.custom_directives) {
    if (t(k)) out.push(t(v) ? `    ${t(k)} ${t(v)}` : `    ${t(k)}`);
  }
  return out.join("\n");
}

export interface DiffLine {
  type: "same" | "add" | "del";
  text: string;
}

/** Line diff via longest common subsequence; blocks are tiny so O(n*m) is fine. */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split("\n");
  const b = after.split("\n");
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "del", text: a[i++] });
    } else {
      out.push({ type: "add", text: b[j++] });
    }
  }
  while (i < a.length) out.push({ type: "del", text: a[i++] });
  while (j < b.length) out.push({ type: "add", text: b[j++] });
  return out;
}
