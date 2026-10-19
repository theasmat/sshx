import React from "react";
import { BsKeyFill, BsTrash3, BsServer } from "react-icons/bs";
import { BrandLogo } from "./BrandLogo";
import { SshHost } from "../types";
import { getAccountLabel, clusterHosts, firstAlias } from "../utils/hostUtils";

interface CompactHostListProps {
  hosts: SshHost[];
  selectedHostId: string | null;
  onSelectHost: (host: SshHost) => void;
  onConnect?: (host: SshHost) => void;
  onCopyCmd?: (host: SshHost) => void;
  onTest?: (host: SshHost) => void;
  onDelete?: (host: SshHost) => void;
  copiedId?: string | null;
  hostAccounts?: Record<string, string>;
}

export const CompactHostList: React.FC<CompactHostListProps> = ({
  hosts,
  selectedHostId,
  onSelectHost,
  onDelete,
  hostAccounts,
}) => {
  const clusters = clusterHosts(hosts);

  // Arrow keys move selection; the app-level handler covers focus outside the list.
  const moveSelection = (e: React.KeyboardEvent, host: SshHost) => {
    const i = hosts.findIndex((h) => h.id === host.id);
    const next = e.key === "ArrowDown" ? hosts[i + 1] : e.key === "ArrowUp" ? hosts[i - 1] : null;
    if (next) {
      e.preventDefault();
      onSelectHost(next);
    }
  };

  return (
    <div role="listbox" aria-label="SSH hosts" className="flex-1 overflow-y-auto px-2 py-2 select-none space-y-0.5">
      {clusters.map((cluster) => (
        <div key={cluster.hosts[0].id} className="space-y-0.5">
          {cluster.target && (
            <div className="px-2 pt-2 pb-1 text-[11px] font-medium text-label-3">
              {cluster.target} · {cluster.hosts.length} identities
            </div>
          )}
          {cluster.hosts.map((host) => {
            const isSelected = selectedHostId === host.id;
            const shared = cluster.target !== null;
            const account = hostAccounts?.[host.id] || getAccountLabel(host);
            const address = `${host.user ? `${host.user}@` : ""}${host.host_name || "(alias)"}${
              host.port && host.port !== 22 ? `:${host.port}` : ""
            }`;

            return (
              <div
                key={host.id}
                role="option"
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => onSelectHost(host)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectHost(host);
                  } else {
                    moveSelection(e, host);
                  }
                }}
                className={`group relative flex items-center gap-3 px-2.5 py-2 rounded-ctl cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                  isSelected ? "bg-accent/20" : "hover:bg-white/[0.05]"
                }`}
              >
                <div className="w-8 h-8 rounded-ctl flex items-center justify-center bg-card shrink-0 text-label">
                  <BrandLogo
                    name={host.host_pattern}
                    hostName={host.host_name}
                    tags={host.tags}
                    group={host.group}
                    className="w-4 h-4"
                    fallbackIcon={<BsServer className="w-3.5 h-3.5 text-label-2" />}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-label truncate">{firstAlias(host)}</div>
                  <div className="text-xs text-label-2 font-mono truncate">{address}</div>
                  {(shared || account) && (
                    <div
                      className="flex items-center gap-1 text-xs text-label-3 truncate"
                      title="Another host uses the same address; the key tells them apart"
                    >
                      <BsKeyFill className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {account ? `@${account} · ` : ""}
                        {host.identity_file ? host.identity_file.split("/").pop() : "default key"}
                      </span>
                    </div>
                  )}
                </div>

                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(host);
                    }}
                    className="p-1.5 rounded-ctl text-label-3 hover:text-rose-300 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                    aria-label={`Delete host ${host.host_pattern}`}
                    title={`Delete host ${host.host_pattern}`}
                  >
                    <BsTrash3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
