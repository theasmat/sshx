import React from "react";
import { Key, Shield, ArrowLeftRight } from "lucide-react";
import { SshHost } from "../types";

interface CompactHostListProps {
  hosts: SshHost[];
  selectedHostId: string | null;
  onSelectHost: (host: SshHost) => void;
  onConnect?: (host: SshHost) => void;
  onCopyCmd?: (host: SshHost) => void;
  onTest?: (host: SshHost) => void;
  copiedId?: string | null;
}

export const CompactHostList: React.FC<CompactHostListProps> = ({
  hosts,
  selectedHostId,
  onSelectHost,
}) => {
  const getColorDot = (color?: string | null) => {
    switch (color) {
      case "emerald":
        return "bg-emerald-400";
      case "blue":
        return "bg-blue-400";
      case "amber":
        return "bg-amber-400";
      case "rose":
        return "bg-rose-400";
      case "purple":
        return "bg-purple-400";
      case "cyan":
        return "bg-cyan-400";
      case "orange":
        return "bg-orange-400";
      default:
        return "bg-blue-400";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-[#1f2942]/50 select-none text-xs">
      {hosts.map((host) => {
        const isSelected = selectedHostId === host.id;

        return (
          <div
            key={host.id}
            onClick={() => onSelectHost(host)}
            className={`px-3 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all ${
              isSelected
                ? "bg-blue-600/15 border-l-2 border-blue-500 pl-[10px]"
                : "hover:bg-[#161d30]/60 hover:pl-3.5"
            }`}
          >
            {/* Left: Indicator Dot + Alias + Address */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span
                className={`w-2 h-2 rounded-full ${getColorDot(
                  host.color
                )} shrink-0`}
              />

              <div className="min-w-0 space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold text-xs truncate ${
                      isSelected ? "text-blue-400 font-bold" : "text-white"
                    }`}
                  >
                    {host.host_pattern}
                  </span>
                  {host.group && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#161d30] text-gray-400 border border-[#232f4d] truncate max-w-[90px]">
                      {host.group}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5 truncate">
                  {host.user && (
                    <span className="text-gray-300">{host.user}@</span>
                  )}
                  <span className="text-gray-400 truncate">
                    {host.host_name || "(alias)"}
                  </span>
                  {host.port && host.port !== 22 && (
                    <span className="text-gray-500 text-[10px]">
                      :{host.port}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Clean subtle badges (Key, ProxyJump, Forward) */}
            <div className="flex items-center gap-1 shrink-0 text-[10px]">
              {host.identity_file && (
                <span
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono truncate max-w-[100px]"
                  title={host.identity_file}
                >
                  <Key className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">
                    {host.identity_file.split("/").pop()}
                  </span>
                </span>
              )}

              {host.proxy_jump && (
                <span
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px]"
                  title={`via ${host.proxy_jump}`}
                >
                  <Shield className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate max-w-[60px]">{host.proxy_jump}</span>
                </span>
              )}

              {host.local_forward.length > 0 && (
                <span
                  className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  title={`${host.local_forward.length} Port Forwarding rules`}
                >
                  <ArrowLeftRight className="w-2.5 h-2.5" />
                  <span>{host.local_forward.length}</span>
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
