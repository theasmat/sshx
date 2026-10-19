import React, { useState, useEffect } from "react";
import {
  BsJournalBookmark,
  BsTrash3,
  BsArrowClockwise,
  BsCopy,
  BsCheckLg,
} from "react-icons/bs";
import { Button, Badge, Group } from "../components/ui";
import { BrandLogo } from "../components/BrandLogo";
import { KnownHostEntry } from "../types";
import { api } from "../api";

interface KnownHostsViewProps {
  entries: KnownHostEntry[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const KnownHostsView: React.FC<KnownHostsViewProps> = ({
  entries,
  onRefresh,
  isLoading,
}) => {
  const [search, setSearch] = useState("");
  const [selectedEntryLine, setSelectedEntryLine] = useState<number | null>(null);
  const [deletingHost, setDeletingHost] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedHost, setCopiedHost] = useState(false);

  const filteredEntries = entries.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.host.toLowerCase().includes(q) ||
      e.key_type.toLowerCase().includes(q)
    );
  });

  const selectedEntry =
    filteredEntries.find((e) => e.line_number === selectedEntryLine) ||
    filteredEntries[0] ||
    null;

  useEffect(() => {
    if (entries.length > 0 && selectedEntryLine === null) {
      setSelectedEntryLine(entries[0].line_number);
    }
  }, [entries, selectedEntryLine]);

  const handleDelete = async (host: string, lineNumber?: number) => {
    setDeletingHost(host);
    try {
      // Pass the exact line number: hashed entries (|1|...) cannot be removed
      // with `ssh-keygen -R` and would otherwise silently fail to delete.
      await api.deleteKnownHost(host, lineNumber);
      onRefresh();
    } catch (err: any) {
      console.error(`Failed to remove host: ${err}`);
    } finally {
      setDeletingHost(null);
    }
  };

  const getCliRemoveCmd = (host: string) => {
    return `ssh-keygen -R ${host}`;
  };

  const handleCopyCmd = (host: string) => {
    navigator.clipboard.writeText(getCliRemoveCmd(host));
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleCopyHost = (host: string) => {
    navigator.clipboard.writeText(host);
    setCopiedHost(true);
    setTimeout(() => setCopiedHost(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-app text-[13px] select-none overflow-hidden">
      <div className="px-5 h-12 flex items-center justify-between shrink-0">
        <h2 className="text-[15px] font-semibold text-label">Known Hosts</h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="h-8 w-8 flex items-center justify-center rounded-ctl text-label-2 hover:text-label hover:bg-white/[0.06] disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          title="Refresh known_hosts"
          aria-label="Refresh known hosts"
        >
          <BsArrowClockwise className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex-1 flex flex-row overflow-hidden">
        <div className="w-72 md:w-80 shrink-0 h-full flex flex-col">
          <div className="px-3 pb-2 space-y-2">
            <input
              type="text"
              aria-label="Search known hosts"
              placeholder="Search host or key type"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 px-3 bg-white/[0.07] rounded-ctl text-label placeholder-label-3 focus:outline-none focus:bg-white/[0.1] focus:ring-2 focus:ring-accent/70"
            />
            <div className="px-1 text-xs text-label-3">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </div>
          </div>

          <div role="listbox" aria-label="Known hosts" className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {filteredEntries.length === 0 ? (
              <div className="p-6 text-center text-label-3">
                {search ? "No matching known hosts" : "Your ~/.ssh/known_hosts is empty"}
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const isSelected = selectedEntry?.line_number === entry.line_number;
                return (
                  <div
                    key={entry.line_number}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setSelectedEntryLine(entry.line_number)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedEntryLine(entry.line_number);
                      }
                    }}
                    className={`flex items-center gap-3 px-2.5 py-2 rounded-ctl cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                      isSelected ? "bg-accent/20" : "hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-ctl flex items-center justify-center bg-card shrink-0 text-label">
                      <BrandLogo
                        name={entry.host}
                        className="w-4 h-4"
                        fallbackIcon={<BsJournalBookmark className="w-3.5 h-3.5 text-label-2" />}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-label truncate">{entry.host}</div>
                      <div className="text-xs text-label-2">
                        <span className="uppercase">{entry.key_type}</span>
                        {entry.is_hashed ? " · hashed" : ""}
                      </div>
                    </div>
                    <span className="text-xs text-label-3 tabular-nums">L{entry.line_number}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="w-px bg-white/[0.08] shrink-0" />

        <div className="flex-1 min-w-0 h-full overflow-y-auto bg-panel">
          {selectedEntry ? (
            <div className="max-w-2xl px-8 py-7 space-y-6">
              <header className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-card flex items-center justify-center bg-card shrink-0 text-label">
                  <BrandLogo
                    name={selectedEntry.host}
                    className="w-7 h-7"
                    fallbackIcon={<BsJournalBookmark className="w-5 h-5 text-label-2" />}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-semibold text-label tracking-tight font-mono truncate">
                    {selectedEntry.host}
                  </h3>
                  <p className="text-label-2">Line {selectedEntry.line_number} of ~/.ssh/known_hosts</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Badge>{selectedEntry.key_type.toUpperCase()}</Badge>
                    {selectedEntry.is_hashed && <Badge>Hashed hostname</Badge>}
                  </div>
                </div>
              </header>

              <div className="flex items-center gap-2">
                <Button icon={copiedHost ? <BsCheckLg /> : <BsCopy />} onClick={() => handleCopyHost(selectedEntry.host)}>
                  {copiedHost ? "Copied" : "Copy Host"}
                </Button>
                <Button
                  variant="danger"
                  icon={<BsTrash3 />}
                  disabled={deletingHost === selectedEntry.host}
                  onClick={() => handleDelete(selectedEntry.host, selectedEntry.line_number)}
                >
                  {deletingHost === selectedEntry.host ? "Removing..." : "Remove Entry"}
                </Button>
              </div>

              <Group title="Remove from the command line">
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <code className="font-mono text-label select-all">{getCliRemoveCmd(selectedEntry.host)}</code>
                  <button
                    onClick={() => handleCopyCmd(selectedEntry.host)}
                    className="text-accent hover:underline cursor-pointer shrink-0"
                  >
                    {copiedCmd ? "Copied" : "Copy"}
                  </button>
                </div>
              </Group>

              <p className="text-label-3 leading-relaxed">
                If you rebuild a server, SSH warns{" "}
                <code className="font-mono text-label-2">REMOTE HOST IDENTIFICATION HAS CHANGED</code>. Removing the
                stale entry lets SSH accept the new host key on your next connection.
              </p>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-label-3">Select an entry to inspect</div>
          )}
        </div>
      </div>
    </div>
  );
};
