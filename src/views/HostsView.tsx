import React, { useState, useRef } from "react";
import { CompactHostList } from "../components/CompactHostList";
import { HostDetailPane } from "../components/HostDetailPane";
import { BsServer, BsPlusLg } from "react-icons/bs";
import { SshHost, SshKeyInfo } from "../types";

interface HostsViewProps {
  hosts: SshHost[];
  selectedHost: SshHost | null;
  onSelectHost: (host: SshHost) => void;
  onConnect: (host: SshHost) => void;
  onCopyCmd: (host: SshHost) => void;
  onTest: (host: SshHost) => void;
  onEdit: (host: SshHost) => void;
  onDuplicate: (host: SshHost) => void;
  onDelete: (host: SshHost) => void;
  onOpenAddHost: () => void;
  copiedId: string | null;
  terminalName: string;
  keys?: SshKeyInfo[];
  onOpenRawConfig?: () => void;
  allHosts?: SshHost[];
  hostAccounts?: Record<string, string>;
}

export const HostsView: React.FC<HostsViewProps> = ({
  hosts,
  selectedHost,
  onSelectHost,
  onConnect,
  onCopyCmd,
  onTest,
  onEdit,
  onDuplicate,
  onDelete,
  onOpenAddHost,
  copiedId,
  terminalName,
  keys,
  onOpenRawConfig,
  allHosts,
  hostAccounts,
}) => {
  const [listWidth, setListWidth] = useState<number>(() => {
    try {
      const w = parseInt(localStorage.getItem("sshx_list_width") || "", 10);
      return w >= 240 && w <= 640 ? w : 320;
    } catch {
      return 320;
    }
  });
  const dragging = useRef(false);

  const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const left = e.currentTarget.parentElement!.getBoundingClientRect().left;
    setListWidth(Math.min(640, Math.max(240, e.clientX - left)));
  };
  const endResize = () => {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      localStorage.setItem("sshx_list_width", String(listWidth));
    } catch {
      /* width just is not remembered */
    }
  };

  if (hosts.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-app select-none">
        <div className="w-14 h-14 rounded-2xl bg-card border border-line flex items-center justify-center text-blue-400 mb-4 shadow-lg shadow-blue-500/10">
          <BsServer className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No SSH Hosts Found</h3>
        <p className="text-xs text-gray-400 max-w-sm mb-5 leading-relaxed">
          {allHosts && allHosts.length > 0
            ? "No hosts match your current search or filters. Clear them to see all hosts."
            : "Your ~/.ssh/config has no hosts yet. Add one to get started."}
        </p>
        <button
          onClick={onOpenAddHost}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition-colors shadow-md shadow-blue-600/20"
        >
          <BsPlusLg className="w-4 h-4" />
          <span>Add Your First Host</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-row overflow-hidden bg-app">
      {/* Left Pane: Host List */}
      <div style={{ width: listWidth }} className="shrink-0 h-full flex flex-col bg-app">
        {/* Navigation / Host count header */}
        <div className="px-3 py-1.5 border-b border-line bg-bar flex items-center justify-between text-xs text-gray-400 select-none">
          <span className="font-semibold text-gray-300">
            {hosts.length} {hosts.length === 1 ? "host" : "hosts"}
          </span>
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="bg-control px-1.5 py-0.5 rounded border border-line-strong font-mono text-gray-300 text-[10px]">↑</kbd>
              <kbd className="bg-control px-1.5 py-0.5 rounded border border-line-strong font-mono text-gray-300 text-[10px]">↓</kbd>
              <span className="text-gray-400">nav</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <kbd className="bg-control px-1.5 py-0.5 rounded border border-line-strong font-mono text-gray-300 text-[10px]">↵</kbd>
              <span className="text-gray-400">connect</span>
            </span>
          </div>
        </div>

        {/* Compact list */}
        <CompactHostList
          hosts={hosts}
          selectedHostId={selectedHost ? selectedHost.id : null}
          onSelectHost={onSelectHost}
          onConnect={onConnect}
          onCopyCmd={onCopyCmd}
          onTest={onTest}
          onDelete={onDelete}
          copiedId={copiedId}
          hostAccounts={hostAccounts}
        />
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize host list"
        onPointerDown={startResize}
        onPointerMove={onResize}
        onPointerUp={endResize}
        className="w-1 shrink-0 cursor-col-resize bg-line hover:bg-blue-500/60 transition-colors"
      />

      {/* Right Pane: Host Detail View */}
      <div className="flex-1 min-w-0 h-full overflow-hidden bg-panel">
        <HostDetailPane
          host={selectedHost}
          onConnect={onConnect}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onTest={onTest}
          terminalName={terminalName}
          keys={keys}
          allHosts={allHosts ?? hosts}
          hostAccounts={hostAccounts}
          onOpenRawConfig={onOpenRawConfig}
        />
      </div>
    </div>
  );
};
