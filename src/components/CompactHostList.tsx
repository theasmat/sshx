import React from "react";
import { BsKeyFill, BsShieldLock, BsArrowLeftRight, BsTrash3 } from "react-icons/bs";
import { BrandLogo } from "./BrandLogo";
import { SshHost } from "../types";

interface CompactHostListProps {
  hosts: SshHost[];
  selectedHostId: string | null;
  onSelectHost: (host: SshHost) => void;
  onConnect?: (host: SshHost) => void;
  onCopyCmd?: (host: SshHost) => void;
  onTest?: (host: SshHost) => void;
  onDelete?: (host: SshHost) => void;
  copiedId?: string | null;
}

export const CompactHostList: React.FC<CompactHostListProps> = ({
  hosts,
  selectedHostId,
  onSelectHost,
  onDelete,
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
    <div className="flex-1 overflow-y-auto divide-y divide-[#172138]/50 select-none">
      {hosts.map((host) => {
        const isSelected = selectedHostId === host.id;

        return (
          <div
            key={host.id}
            onClick={() => onSelectHost(host)}
            className={`group px-2.5 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
              isSelected
                ? "bg-blue-600/15 border-l-2 border-blue-500 pl-2"
                : "hover:bg-[#121829]/60"
            }`}
          >
            {/* Left: Brand / Tech Logo + Alias + Address */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-[#131a29] border border-[#202c46] shrink-0 text-gray-300">
                <BrandLogo
                  name={host.host_pattern}
                  hostName={host.host_name}
                  tags={host.tags}
                  group={host.group}
                  className="w-3.5 h-3.5"
                  fallbackIcon={
                    <span
                      className={`w-2 h-2 rounded-full ${getColorDot(
                        host.color
                      )}`}
                    />
                  }
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span
                    className={`font-semibold text-[13px] truncate ${
                      isSelected ? "text-blue-400 font-bold" : "text-white"
                    }`}
                  >
                    {host.host_pattern}
                  </span>
                  {host.group && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#101726] text-gray-400 border border-[#1e293b] truncate max-w-[80px] leading-none">
                      {host.group}
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-400 font-mono truncate leading-tight mt-0.5">
                  {host.user && (
                    <span className="text-gray-300">{host.user}@</span>
                  )}
                  <span className="text-gray-400">
                    {host.host_name || "(alias)"}
                  </span>
                  {host.port && host.port !== 22 && (
                    <span className="text-gray-500 text-[11px] ml-0.5">
                      :{host.port}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Clean subtle badges (Key, ProxyJump, Forward) + Quick Delete */}
            <div className="flex items-center gap-1 shrink-0 text-xs">
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(host);
                  }}
                  className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer mr-0.5"
                  title={`Delete host ${host.host_pattern}`}
                >
                  <BsTrash3 className="w-3 h-3" />
                </button>
              )}

              {host.identity_file && (
                <span
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0e172a] text-blue-300 border border-blue-500/25 font-mono text-[11px] truncate max-w-[100px] leading-none"
                  title={host.identity_file}
                >
                  <BsKeyFill className="w-3 h-3 shrink-0 text-blue-400" />
                  <span className="truncate">
                    {host.identity_file.split("/").pop()}
                  </span>
                </span>
              )}

              {host.proxy_jump && (
                <span
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/25 text-[11px] leading-none"
                  title={`via ${host.proxy_jump}`}
                >
                  <BsShieldLock className="w-3 h-3 shrink-0 text-purple-400" />
                  <span className="truncate max-w-[55px]">{host.proxy_jump}</span>
                </span>
              )}

              {host.local_forward.length > 0 && (
                <span
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[11px] leading-none"
                  title={`${host.local_forward.length} Port Forwarding rules`}
                >
                  <BsArrowLeftRight className="w-3 h-3" />
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
