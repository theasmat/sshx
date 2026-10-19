import React, { useState, useRef } from "react";
import { CompactHostList } from "../components/CompactHostList";
import { HostDetailPane } from "../components/HostDetailPane";
import { BsServer, BsPlusLg } from "react-icons/bs";
import { Button } from "../components/ui";
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
        <div className="w-14 h-14 rounded-card bg-card flex items-center justify-center text-label-2 mb-4">
          <BsServer className="w-7 h-7" />
        </div>
        <h3 className="text-[15px] font-semibold text-label mb-1">No hosts</h3>
        <p className="text-[13px] text-label-2 max-w-sm mb-5">
          {allHosts && allHosts.length > 0
            ? "No hosts match your search or filters. Clear them to see all hosts."
            : "Your ~/.ssh/config has no hosts yet."}
        </p>
        <Button variant="primary" icon={<BsPlusLg />} onClick={onOpenAddHost}>
          Add host
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-row overflow-hidden bg-app">
      {/* Left Pane: Host List */}
      <div style={{ width: listWidth }} className="shrink-0 h-full flex flex-col bg-app">
        <div className="px-4 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-label-3 select-none">
          {hosts.length} {hosts.length === 1 ? "host" : "hosts"}
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
        className="w-px shrink-0 cursor-col-resize bg-white/[0.08] hover:bg-accent hover:w-0.5 transition-all"
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
