import React, { useState, useMemo } from "react";
import {
  BsTerminalFill,
  BsCopy,
  BsCheckLg,
  BsPlayFill,
  BsPencilSquare,
  BsTrash3,
  BsKeyFill,
  BsShieldLock,
  BsArrowLeftRight,
  BsClock,
  BsFolder2Open,
  BsTag,
  BsCloudUpload,
  BsCheckCircleFill,
  BsExclamationCircleFill,
  BsServer,
  BsCopy as BsDuplicate,
  BsBook,
} from "react-icons/bs";
import { BrandLogo } from "./BrandLogo";
import { SshHost, SshKeyInfo } from "../types";
import { api } from "../api";
import { getAllPresets } from "../presets";
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
}) => {
  const [copied, setCopied] = useState(false);
  const [isInstallingKey, setIsInstallingKey] = useState(false);
  const [installMsg, setInstallMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

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
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500 select-none bg-[#0b0f19]">
        <div className="w-10 h-10 rounded-xl bg-[#161d30] border border-[#232f4d] flex items-center justify-center text-gray-400 mb-2.5">
          <BsServer className="w-5 h-5 opacity-60 text-blue-400" />
        </div>
        <p className="font-semibold text-gray-300 text-xs">No Host Selected</p>
        <p className="text-xs text-gray-500 mt-1 max-w-xs">
          Select a host from the list or use <kbd className="bg-[#1c243a] px-1.5 py-0.5 rounded text-gray-400 font-mono text-[10px] border border-[#232f4d]">↑</kbd> <kbd className="bg-[#1c243a] px-1.5 py-0.5 rounded text-gray-400 font-mono text-[10px] border border-[#232f4d]">↓</kbd> to navigate.
        </p>
      </div>
    );
  }

  const getSshCommand = () => {
    return `ssh ${host.host_pattern}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getSshCommand());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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

  const getColorDot = (color?: string | null) => {
    switch (color) {
      case "emerald":
        return "bg-emerald-400 ring-emerald-400/20";
      case "blue":
        return "bg-blue-400 ring-blue-400/20";
      case "amber":
        return "bg-amber-400 ring-amber-400/20";
      case "rose":
        return "bg-rose-400 ring-rose-400/20";
      case "purple":
        return "bg-purple-400 ring-purple-400/20";
      case "cyan":
        return "bg-cyan-400 ring-cyan-400/20";
      case "orange":
        return "bg-orange-400 ring-orange-400/20";
      default:
        return "bg-blue-400 ring-blue-400/20";
    }
  };

  return (
    <div className="h-full flex flex-col justify-between bg-[#0b0f19] border-l border-[#1f2942] select-none text-xs overflow-y-auto">
      <div className="p-3 space-y-2.5">
        {/* Top Title & Header */}
        <div className="space-y-1 pb-2 border-b border-[#1f2942]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[#131a29] border border-[#202c46] shrink-0 text-gray-200">
              <BrandLogo
                name={host.host_pattern}
                hostName={host.host_name}
                tags={host.tags}
                group={host.group}
                className="w-4 h-4"
                fallbackIcon={
                  <span
                    className={`w-2.5 h-2.5 rounded-full ring-2 ${getColorDot(
                      host.color
                    )}`}
                  />
                }
              />
            </div>
            <h2 className="font-bold text-white text-sm tracking-tight truncate">
              {host.host_pattern}
            </h2>
            {host.group && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#161d30] text-gray-400 border border-[#232f4d] flex items-center gap-1 leading-none">
                <BsFolder2Open className="w-3 h-3 text-amber-400" />
                <span>{host.group}</span>
              </span>
            )}
          </div>
          {host.notes && (
            <p className="text-xs text-gray-400 italic leading-snug pl-8">{host.notes}</p>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onConnect(host)}
            className="col-span-2 flex items-center justify-center gap-2 py-1.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-md font-semibold shadow-sm shadow-blue-500/20 transition-all text-xs cursor-pointer active:scale-95"
          >
            <BsTerminalFill className="w-3.5 h-3.5" />
            <span>Connect in {terminalName}</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 py-1 px-2.5 bg-[#161d30] hover:bg-[#1c243a] text-gray-200 rounded-md border border-[#232f4d] font-medium transition-colors cursor-pointer text-xs"
          >
            {copied ? (
              <BsCheckLg className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <BsCopy className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>{copied ? "Copied" : "Copy Command"}</span>
          </button>

          <button
            onClick={() => onTest(host)}
            className="flex items-center justify-center gap-1.5 py-1 px-2.5 bg-[#161d30] hover:bg-[#1c243a] text-gray-200 rounded-md border border-[#232f4d] font-medium transition-colors cursor-pointer text-xs"
          >
            <BsPlayFill className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Connection</span>
          </button>

          {/* Setup & Auth Guide Trigger */}
          <button
            onClick={() => setGuideOpen(true)}
            className="flex items-center justify-center gap-1.5 py-1 px-2.5 bg-[#161d30] hover:bg-[#1c243a] text-emerald-300 rounded-md border border-emerald-500/30 font-medium transition-colors cursor-pointer text-xs"
            title="Open platform authorization steps and public key instructions"
          >
            <BsBook className="w-3.5 h-3.5 text-emerald-400" />
            <span>Setup & Auth Guide</span>
          </button>

          {/* 1-Click Install Key to Remote Server (ssh-copy-id) */}
          <button
            onClick={handleInstallKey}
            disabled={isInstallingKey}
            className="col-span-2 flex items-center justify-center gap-1.5 py-1 px-2.5 bg-[#121829] hover:bg-[#1a233a] text-blue-300 rounded-md border border-blue-500/30 font-medium transition-colors cursor-pointer disabled:opacity-50 text-xs"
            title="Install public key onto remote server's ~/.ssh/authorized_keys"
          >
            <BsCloudUpload className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {isInstallingKey
                ? "Authorizing Key..."
                : "Install Key (ssh-copy-id)"}
            </span>
          </button>
        </div>

        {installMsg && (
          <div
            className={`p-2 rounded-md border flex items-center gap-2 text-xs ${
              installMsg.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            {installMsg.success ? (
              <BsCheckCircleFill className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <BsExclamationCircleFill className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
            <span>{installMsg.text}</span>
          </div>
        )}

        {/* Command Line Preview Box */}
        <div className="bg-[#070a10] border border-[#1f2942] rounded-md p-2 font-mono text-xs text-gray-300 relative group">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 leading-none">
            CLI Command
          </div>
          <div className="text-emerald-400 break-all select-all leading-snug">
            {getSshCommand()}
          </div>
        </div>

        {/* Directives Table */}
        <div className="space-y-1">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none">
            Connection Parameters
          </div>

          <div className="bg-[#0f1422] border border-[#1f2942] rounded-md divide-y divide-[#1f2942] text-xs">
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-gray-400">HostName / IP</span>
              <span className="font-mono text-gray-200 font-medium">
                {host.host_name || "(alias)"}
              </span>
            </div>

            <div className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-gray-400">User</span>
              <span className="font-mono text-gray-200 font-medium">
                {host.user || "(default)"}
              </span>
            </div>

            <div className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-gray-400">Port</span>
              <span className="font-mono text-gray-200 font-medium">
                {host.port || 22}
              </span>
            </div>

            {host.identity_file && (
              <div className="flex items-center justify-between px-2.5 py-1.5">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <BsKeyFill className="w-3 h-3 text-blue-400" />
                  <span>IdentityFile</span>
                </span>
                <span className="font-mono text-amber-300 font-medium truncate max-w-[180px]">
                  {host.identity_file}
                </span>
              </div>
            )}

            {host.proxy_jump && (
              <div className="flex items-center justify-between px-2.5 py-1.5">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <BsShieldLock className="w-3 h-3 text-purple-400" />
                  <span>ProxyJump</span>
                </span>
                <span className="font-mono text-purple-300 font-medium">
                  {host.proxy_jump}
                </span>
              </div>
            )}

            {host.local_forward.length > 0 && (
              <div className="p-2 space-y-1">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <BsArrowLeftRight className="w-3 h-3 text-emerald-400" />
                  <span>LocalForward Tunnels</span>
                </span>
                {host.local_forward.map((lf, i) => (
                  <div
                    key={i}
                    className="font-mono text-xs text-emerald-300 bg-[#070a10] px-2 py-0.5 rounded border border-[#1f2942]"
                  >
                    {lf}
                  </div>
                ))}
              </div>
            )}

            {host.server_alive_interval && (
              <div className="flex items-center justify-between px-2.5 py-1.5">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <BsClock className="w-3 h-3 text-gray-400" />
                  <span>KeepAlive</span>
                </span>
                <span className="font-mono text-gray-200">
                  {host.server_alive_interval}s
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {host.tags.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <BsTag className="w-3 h-3" />
              <span>Tags</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {host.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-[#161d30] text-gray-300 border border-[#232f4d] text-xs leading-none"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar: Edit / Duplicate / Delete */}
      <div className="p-2.5 border-t border-[#1f2942] bg-[#070a10] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(host)}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#161d30] hover:bg-[#1c243a] text-gray-200 rounded-md border border-[#232f4d] font-medium text-xs transition-colors cursor-pointer"
          >
            <BsPencilSquare className="w-3 h-3 text-blue-400" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => onDuplicate(host)}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#161d30] hover:bg-[#1c243a] text-gray-200 rounded-md border border-[#232f4d] font-medium text-xs transition-colors cursor-pointer"
          >
            <BsDuplicate className="w-3 h-3 text-yellow-400" />
            <span>Duplicate</span>
          </button>
        </div>

        <button
          onClick={() => onDelete(host)}
          className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
          title="Delete host"
        >
          <BsTrash3 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Persistent Setup & Auth Guide Modal */}
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
