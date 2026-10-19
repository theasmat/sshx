import React, { useState, useMemo } from "react";
import {
  BsTerminalFill,
  BsCopy,
  BsPlayFill,
  BsPencilSquare,
  BsTrash3,
  BsKeyFill,
  BsArrowLeftRight,
  BsCloudUpload,
  BsCheckCircleFill,
  BsExclamationCircleFill,
  BsServer,
  BsCopy as BsDuplicate,
  BsThreeDots,
  BsBook,
} from "react-icons/bs";
import { BrandLogo } from "./BrandLogo";
import { SshHost, SshKeyInfo } from "../types";
import { api } from "../api";
import { toast } from "../utils/toast";
import { getAllPresets } from "../presets";
import { getGitProviderInfo, findSiblingHosts, getAccountLabel, firstAlias, gitRemoteUrl } from "../utils/hostUtils";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button, Badge, Group, Menu, MenuItem, Row } from "./ui";
import { PostCreationGuideModal } from "./PostCreationGuideModal";

interface HostDetailPaneProps {
  host: SshHost | null;
  onConnect: (host: SshHost) => void;
  onEdit: (host: SshHost) => void;
  onDelete: (host: SshHost) => void;
  onDuplicate: (host: SshHost) => void;
  onTest: (host: SshHost) => void;
  terminalName: string;
  keys?: SshKeyInfo[];
  onOpenRawConfig?: () => void;
  allHosts?: SshHost[];
  hostAccounts?: Record<string, string>;
}

export const HostDetailPane: React.FC<HostDetailPaneProps> = ({
  host,
  onConnect,
  onEdit,
  onDelete,
  onDuplicate,
  onTest,
  terminalName,
  keys,
  onOpenRawConfig,
  allHosts,
  hostAccounts,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedPubKey, setCopiedPubKey] = useState(false);
  const [isInstallingKey, setIsInstallingKey] = useState(false);
  const [installMsg, setInstallMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const gitProvider = useMemo(() => getGitProviderInfo(host), [host]);
  const isGit = gitProvider !== null;

  const siblings = useMemo(
    () => (host && allHosts ? findSiblingHosts(host, allHosts) : []),
    [host, allHosts]
  );

  const matchedKey = useMemo(() => {
    if (!host?.identity_file || !keys) return null;
    return (
      keys.find(
        (k) =>
          k.private_path === host.identity_file ||
          k.file_name === host.identity_file ||
          k.file_name === host.identity_file?.split("/").pop()
      ) || null
    );
  }, [host?.identity_file, keys]);

  const matchedPreset = useMemo(() => {
    if (!host) return null;
    const allPresets = getAllPresets();
    return (
      allPresets.find((p) => {
        if (p.id === host.host_pattern) return true;
        if (p.defaultHost.host_name && host.host_name === p.defaultHost.host_name) return true;
        if (
          p.category === "git" &&
          (host.host_name?.includes("github.com") || host.host_name?.includes("gitlab.com"))
        )
          return true;
        return false;
      }) || null
    );
  }, [host]);

  if (!host) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500 select-none bg-panel">
        <div className="w-10 h-10 rounded-xl bg-control border border-line-strong flex items-center justify-center text-gray-400 mb-2.5">
          <BsServer className="w-5 h-5 opacity-60 text-blue-400" />
        </div>
        <p className="font-semibold text-gray-300 text-xs">No Host Selected</p>
        <p className="text-xs text-gray-500 mt-1 max-w-xs">
          Select a host from the list or use <kbd className="bg-hover px-1.5 py-0.5 rounded text-gray-400 font-mono text-[10px] border border-line-strong">↑</kbd> <kbd className="bg-hover px-1.5 py-0.5 rounded text-gray-400 font-mono text-[10px] border border-line-strong">↓</kbd> to navigate.
        </p>
      </div>
    );
  }

  const getSshCommand = () => {
    // Use only the first alias token — a Host line may list several patterns.
    const firstAlias = host.host_pattern.trim().split(/\s+/)[0] || host.host_pattern;
    return `ssh ${firstAlias}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getSshCommand());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyPublicKey = () => {
    const content = matchedKey?.public_key_content?.trim();
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedPubKey(true);
    setTimeout(() => setCopiedPubKey(false), 1500);
  };

  const handleOpenProviderSettings = async () => {
    if (!gitProvider?.settingsUrl) return;
    try {
      await openUrl(gitProvider.settingsUrl);
    } catch {
      window.open(gitProvider.settingsUrl, "_blank");
    }
  };

  const handleInstallKey = async () => {
    setIsInstallingKey(true);
    setInstallMsg(null);
    try {
      const res = await api.installKeyToRemote(
        host.host_pattern,
        host.identity_file || undefined
      );
      if (res.success) {
        setInstallMsg({
          success: true,
          text: "SSH Key installed successfully onto remote server!",
        });
      } else {
        setInstallMsg({
          success: false,
          text: res.output || "Failed to install key onto remote server",
        });
      }
    } catch (err: any) {
      setInstallMsg({
        success: false,
        text: `Error: ${err}`,
      });
    } finally {
      setIsInstallingKey(false);
    }
  };

  const alias = firstAlias(host);
  const addr = `${host.user ? `${host.user}@` : ""}${host.host_name || "(alias)"}${
    host.port && host.port !== 22 ? `:${host.port}` : ""
  }`;
  const account = hostAccounts?.[host.id] || getAccountLabel(host);

  const menuItems: MenuItem[] = [
    { label: copied ? "Copied" : "Copy ssh command", icon: <BsCopy />, onSelect: handleCopy },
    ...(isGit
      ? [
          {
            label: copiedPubKey ? "Public key copied" : "Copy public key",
            icon: <BsKeyFill />,
            onSelect: handleCopyPublicKey,
            disabled: !matchedKey?.public_key_content,
          },
          ...(gitProvider?.settingsUrl
            ? [{ label: `Add key to ${gitProvider.name}`, icon: <BsCloudUpload />, onSelect: handleOpenProviderSettings }]
            : []),
        ]
      : [
          {
            label: isInstallingKey ? "Authorizing key..." : "Install key (ssh-copy-id)",
            icon: <BsCloudUpload />,
            onSelect: handleInstallKey,
            disabled: isInstallingKey,
          },
        ]),
    { label: "Setup & auth guide", icon: <BsBook />, onSelect: () => setGuideOpen(true) },
    { label: "Duplicate", icon: <BsDuplicate />, onSelect: () => onDuplicate(host), separated: true },
    { label: "Delete", icon: <BsTrash3 />, onSelect: () => onDelete(host), danger: true },
  ];

  return (
    <div className="h-full overflow-y-auto bg-panel select-none text-[13px]">
      <div className="max-w-2xl px-8 py-7 space-y-6">
        {/* Header */}
        <header className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-card flex items-center justify-center bg-card shrink-0 text-label">
            <BrandLogo
              name={host.host_pattern}
              hostName={host.host_name}
              tags={host.tags}
              group={host.group}
              className="w-7 h-7"
              fallbackIcon={<BsServer className="w-5 h-5 text-label-2" />}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-label tracking-tight truncate">{alias}</h2>
            <p className="font-mono text-label-2 truncate">{addr}</p>
            {host.notes && <p className="mt-1 text-label-3">{host.notes}</p>}
          </div>
        </header>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="primary" icon={<BsTerminalFill />} onClick={() => onConnect(host)}>
            Connect in {terminalName}
          </Button>
          <Button icon={<BsPlayFill className="w-4 h-4" />} onClick={() => onTest(host)}>
            Test
          </Button>
          <Button icon={<BsPencilSquare />} onClick={() => onEdit(host)}>
            Edit
          </Button>
          <Menu label="More actions" trigger={<BsThreeDots className="w-4 h-4" />} items={menuItems} />
        </div>

        {installMsg && (
          <div
            role="status"
            className={`px-3 py-2 rounded-ctl flex items-center gap-2 ${
              installMsg.success ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"
            }`}
          >
            {installMsg.success ? <BsCheckCircleFill className="shrink-0" /> : <BsExclamationCircleFill className="shrink-0" />}
            <span>{installMsg.text}</span>
          </div>
        )}

        {/* Identity: who this alias logs in as, and what else shares the address */}
        {(isGit || siblings.length > 0) && (
          <Group title="Identity">
            <Row label="Account">
              {account ? (
                <span>@{account}</span>
              ) : (
                <span className="text-label-3 font-sans">Run Test to detect</span>
              )}
            </Row>
            <Row label="Key">{host.identity_file ? host.identity_file.split("/").pop() : "default key"}</Row>
            {isGit && (
              <Row label="Git remote">
                <button
                  className="text-accent hover:underline cursor-pointer text-right"
                  title="Copy the git remote set-url command"
                  onClick={() => {
                    navigator.clipboard.writeText(`git remote set-url origin ${gitRemoteUrl(host)}`);
                    toast.success(`Copied remote command for ${alias}`);
                  }}
                >
                  {gitRemoteUrl(host)}
                </button>
              </Row>
            )}
            {siblings.length > 0 && (
              <div className="px-4 py-2.5 space-y-1">
                <div className="text-label-2">
                  {siblings.length + 1} identities share {host.host_name}. Always connect through the alias.
                </div>
                {[host, ...siblings].map((h) => {
                  const acct = hostAccounts?.[h.id] || getAccountLabel(h);
                  return (
                    <div key={h.id} className={`font-mono text-xs truncate ${h.id === host.id ? "text-label" : "text-label-3"}`}>
                      {firstAlias(h)} → {acct ? `@${acct} · ` : ""}
                      {h.identity_file ? h.identity_file.split("/").pop() : "default key"}
                    </div>
                  );
                })}
              </div>
            )}
          </Group>
        )}

        <Group title="Connection">
          <Row label="Host">{host.host_name || "(alias)"}</Row>
          <Row label="User">{host.user || "default"}</Row>
          <Row label="Port">{host.port || 22}</Row>
          {host.identity_file && <Row label="Identity file">{host.identity_file}</Row>}
          {host.identities_only && <Row label="Identities only">yes</Row>}
          {host.proxy_jump && <Row label="Proxy jump">{host.proxy_jump}</Row>}
          {host.server_alive_interval ? <Row label="Keep alive">{host.server_alive_interval}s</Row> : null}
          {host.group && <Row label="Group">{host.group}</Row>}
        </Group>

        {host.local_forward.length > 0 && (
          <Group title="Local forwards">
            {host.local_forward.map((lf, i) => (
              <Row key={i} label={<BsArrowLeftRight />}>
                {lf}
              </Row>
            ))}
          </Group>
        )}

        {host.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {host.tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        )}
      </div>

      {guideOpen && (
        <PostCreationGuideModal
          isOpen={guideOpen}
          onClose={() => setGuideOpen(false)}
          host={host}
          keyInfo={matchedKey}
          publicKeyContent={matchedKey?.public_key_content}
          preset={matchedPreset}
          onConnect={onConnect}
          onOpenRawConfig={onOpenRawConfig}
        />
      )}
    </div>
  );
};
