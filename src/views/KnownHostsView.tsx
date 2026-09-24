import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Terminal,
  Info,
  Lock,
} from "lucide-react";
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

  const handleDelete = async (host: string) => {
    if (!confirm(`Remove "${host}" from ~/.ssh/known_hosts?`)) return;
    setDeletingHost(host);
    try {
      await api.removeKnownHost(host);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to remove host: ${err}`);
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
    <div className="h-full flex flex-col bg-[#070a10] text-xs select-none overflow-hidden">
      {/* Top Header */}
      <div className="px-5 py-2.5 border-b border-[#1f2942] bg-[#090d16] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-yellow-500/20 text-yellow-400 flex items-center justify-center border border-yellow-500/30">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Host Manager (Known Hosts)</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 font-mono">
            {entries.length} Known Hosts
          </span>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-lg border border-[#232f4d] transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh known_hosts"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-yellow-400" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Pane: Known Hosts List */}
        <div className="w-full md:w-5/12 lg:w-4/12 h-full flex flex-col border-r border-[#1f2942] bg-[#070a10]">
          {/* Search bar */}
          <div className="p-2.5 border-b border-[#1f2942] bg-[#090d16] relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-4.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search host or IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0f1422] border border-[#1f2942] rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 text-xs"
            />
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#1f2942]/60">
            {filteredEntries.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {search ? "No matching known hosts." : "Your ~/.ssh/known_hosts is empty."}
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const isSelected = selectedEntry?.line_number === entry.line_number;

                return (
                  <div
                    key={entry.line_number}
                    onClick={() => setSelectedEntryLine(entry.line_number)}
                    className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-yellow-500/10 border-l-2 border-yellow-500 pl-[10px]"
                        : "hover:bg-[#161d30]/60 hover:pl-3.5"
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold text-xs font-mono truncate ${
                            isSelected ? "text-yellow-400 font-bold" : "text-white"
                          }`}
                        >
                          {entry.host}
                        </span>
                        {entry.is_hashed && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-sans shrink-0">
                            Hashed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                        <span className="text-blue-400 font-semibold uppercase">
                          {entry.key_type}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] text-gray-600 font-mono shrink-0">
                      L{entry.line_number}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Selected Host Inspector */}
        <div className="w-full md:w-7/12 lg:w-8/12 h-full overflow-y-auto bg-[#0b0f19] p-5">
          {selectedEntry ? (
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Header Title */}
              <div className="pb-3 border-b border-[#1f2942] flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white font-mono truncate max-w-md">
                      {selectedEntry.host}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                      {selectedEntry.key_type}
                    </span>
                    {selectedEntry.is_hashed && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                        Hashed Hostname
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-mono">
                    Found on line {selectedEntry.line_number} of ~/.ssh/known_hosts
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyHost(selectedEntry.host)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-lg border border-[#232f4d] font-medium text-xs transition-colors cursor-pointer"
                  >
                    {copiedHost ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHost ? "Copied Host!" : "Copy Host"}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(selectedEntry.host)}
                    disabled={deletingHost === selectedEntry.host}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg border border-rose-500/30 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deletingHost === selectedEntry.host ? "Removing..." : "Remove Entry"}</span>
                  </button>
                </div>
              </div>

              {/* CLI Command Box */}
              <div className="p-3.5 bg-[#070a10] border border-[#1f2942] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-yellow-400" />
                    <span>CLI Fix Command (Remove Stale Host Key)</span>
                  </div>
                  <button
                    onClick={() => handleCopyCmd(selectedEntry.host)}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-sans cursor-pointer"
                  >
                    {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd ? "Copied" : "Copy Command"}</span>
                  </button>
                </div>
                <pre className="p-2 bg-[#05070c] border border-[#1f2942] rounded font-mono text-emerald-400 text-xs select-all">
                  {getCliRemoveCmd(selectedEntry.host)}
                </pre>
              </div>

              {/* Secure Masked Key Preview */}
              <div className="p-3.5 bg-[#070a10] border border-[#1f2942] rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-yellow-400" />
                    <span>Host Key Fingerprint & Record (Protected)</span>
                  </div>
                  <div className="font-mono text-gray-400 text-xs tracking-widest select-none">
                    {selectedEntry.key_type} ••••••••••••••••••••••••••••••••
                  </div>
                </div>
              </div>

              {/* Educational Helper Box */}
              <div className="p-3.5 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-1 text-gray-300">
                <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs">
                  <Info className="w-3.5 h-3.5" />
                  <span>When should you remove a known host?</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  If you rebuild a VPS or reinstall an OS on a server, SSH will warn: <code className="text-amber-300 font-mono">WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!</code> Removing the stale entry allows SSH to securely accept the new host key fingerprint on your next connection.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select an entry from the list to inspect.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
