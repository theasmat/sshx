import React, { useState } from "react";
import {
  Terminal,
  Copy,
  Check,
  Play,
  Edit2,
  Trash2,
  Key,
  Shield,
  ArrowLeftRight,
  Clock,
  Sparkles,
  Server,
  Folder,
  Tag,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { SshHost } from "../types";
import { api } from "../api";

interface HostDetailPaneProps {
  host: SshHost | null;
  onConnect: (host: SshHost) => void;
  onEdit: (host: SshHost) => void;
  onDelete: (host: SshHost) => void;
  onDuplicate: (host: SshHost) => void;
  onTest: (host: SshHost) => void;
  terminalName: string;
}

export const HostDetailPane: React.FC<HostDetailPaneProps> = ({
  host,
  onConnect,
  onEdit,
  onDelete,
  onDuplicate,
  onTest,
  terminalName,
}) => {
  const [copied, setCopied] = useState(false);
  const [isInstallingKey, setIsInstallingKey] = useState(false);
  const [installMsg, setInstallMsg] = useState<{ success: boolean; text: string } | null>(null);

  if (!host) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500 select-none bg-[#0b0f19]">
        <div className="w-12 h-12 rounded-xl bg-[#161d30] border border-[#232f4d] flex items-center justify-center text-gray-400 mb-3">
          <Server className="w-6 h-6 opacity-60" />
        </div>
        <p className="font-semibold text-gray-300 text-sm">No Host Selected</p>
        <p className="text-xs text-gray-500 mt-1 max-w-xs">
          Select a host from the list or use <kbd className="bg-[#1c243a] px-1.5 py-0.5 rounded text-gray-400 font-mono text-[10px]">↑</kbd> <kbd className="bg-[#1c243a] px-1.5 py-0.5 rounded text-gray-400 font-mono text-[10px]">↓</kbd> arrows to navigate.
        </p>
      </div>
    );
  }

  const getSshCommand = () => {
    let cmd = "ssh";
    if (host.port && host.port !== 22) {
      cmd += ` -p ${host.port}`;
    }
    if (host.identity_file) {
      cmd += ` -i ${host.identity_file}`;
    }
    if (host.user && host.host_name) {
      cmd += ` ${host.user}@${host.host_name}`;
    } else if (host.host_name) {
      cmd += ` ${host.host_name}`;
    } else {
      cmd += ` ${host.host_pattern}`;
    }
    return cmd;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getSshCommand());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // AUTOMATION 2: Install Key to Remote Server (ssh-copy-id)
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
      <div className="p-5 space-y-4">
        {/* Top Title & Header */}
        <div className="space-y-1.5 pb-3.5 border-b border-[#1f2942]">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ring-4 ${getColorDot(
                host.color
              )} shrink-0`}
            />
            <h2 className="font-bold text-white text-base tracking-tight truncate">
              {host.host_pattern}
            </h2>
            {host.group && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#161d30] text-gray-400 border border-[#232f4d] flex items-center gap-1">
                <Folder className="w-2.5 h-2.5 text-amber-400" />
                <span>{host.group}</span>
              </span>
            )}
          </div>
          {host.notes && (
            <p className="text-xs text-gray-400 italic">{host.notes}</p>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onConnect(host)}
            className="col-span-2 flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-semibold shadow-md shadow-blue-500/20 transition-all text-xs cursor-pointer active:scale-95"
          >
            <Terminal className="w-4 h-4" />
            <span>Connect in {terminalName}</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#161d30] hover:bg-[#1c243a] text-gray-200 rounded-lg border border-[#232f4d] font-medium transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>{copied ? "Copied Command" : "Copy Command"}</span>
          </button>

          <button
            onClick={() => onTest(host)}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#161d30] hover:bg-[#1c243a] text-gray-200 rounded-lg border border-[#232f4d] font-medium transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Connection</span>
          </button>

          {/* 1-Click Install Key to Remote Server (ssh-copy-id) */}
          <button
            onClick={handleInstallKey}
            disabled={isInstallingKey}
            className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#121829] hover:bg-[#1a233a] text-blue-300 rounded-lg border border-blue-500/30 font-medium transition-colors cursor-pointer disabled:opacity-50 text-xs"
            title="Install public key onto remote server's ~/.ssh/authorized_keys"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {isInstallingKey
                ? "Authorizing Key on Remote Server..."
                : "📤 Install Key to Remote Server (ssh-copy-id)"}
            </span>
          </button>
        </div>

        {installMsg && (
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs ${
              installMsg.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            {installMsg.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{installMsg.text}</span>
          </div>
        )}

        {/* Command Line Preview Box */}
        <div className="bg-[#070a10] border border-[#1f2942] rounded-lg p-2.5 font-mono text-[11px] text-gray-300 relative group">
          <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            CLI Command
          </div>
          <div className="text-emerald-400 break-all select-all">
            {getSshCommand()}
          </div>
        </div>

        {/* Directives Table */}
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Connection Parameters
          </div>

          <div className="bg-[#0f1422] border border-[#1f2942] rounded-lg divide-y divide-[#1f2942] text-xs">
            <div className="flex items-center justify-between p-2.5">
              <span className="text-gray-400">HostName / IP</span>
              <span className="font-mono text-gray-200 font-medium">
                {host.host_name || "(alias)"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5">
              <span className="text-gray-400">User</span>
              <span className="font-mono text-gray-200 font-medium">
                {host.user || "(default)"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5">
              <span className="text-gray-400">Port</span>
              <span className="font-mono text-gray-200 font-medium">
                {host.port || 22}
              </span>
            </div>

            {host.identity_file && (
              <div className="flex items-center justify-between p-2.5">
                <span className="text-gray-400 flex items-center gap-1">
                  <Key className="w-3 h-3 text-blue-400" />
                  <span>IdentityFile</span>
                </span>
                <span className="font-mono text-amber-300 font-medium truncate max-w-[160px]">
                  {host.identity_file}
                </span>
              </div>
            )}

            {host.proxy_jump && (
              <div className="flex items-center justify-between p-2.5">
                <span className="text-gray-400 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-purple-400" />
                  <span>ProxyJump</span>
                </span>
                <span className="font-mono text-purple-300 font-medium">
                  {host.proxy_jump}
                </span>
              </div>
            )}

            {host.local_forward.length > 0 && (
              <div className="p-2.5 space-y-1">
                <span className="text-gray-400 flex items-center gap-1">
                  <ArrowLeftRight className="w-3 h-3 text-emerald-400" />
                  <span>LocalForward Tunnels</span>
                </span>
                {host.local_forward.map((lf, i) => (
                  <div
                    key={i}
                    className="font-mono text-[11px] text-emerald-300 bg-[#070a10] px-2 py-1 rounded border border-[#1f2942]"
                  >
                    {lf}
                  </div>
                ))}
              </div>
            )}

            {host.server_alive_interval && (
              <div className="flex items-center justify-between p-2.5">
                <span className="text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>KeepAlive Interval</span>
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
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>Tags</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {host.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-[#161d30] text-gray-300 border border-[#232f4d] text-[11px]"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar: Edit / Duplicate / Delete */}
      <div className="p-4 border-t border-[#1f2942] bg-[#070a10] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(host)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161d30] hover:bg-[#1c243a] text-gray-200 rounded-md border border-[#232f4d] font-medium transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => onDuplicate(host)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161d30] hover:bg-[#1c243a] text-gray-200 rounded-md border border-[#232f4d] font-medium transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Duplicate</span>
          </button>
        </div>

        <button
          onClick={() => onDelete(host)}
          className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
          title="Delete host"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
