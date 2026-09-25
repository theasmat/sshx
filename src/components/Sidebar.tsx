import React from "react";
import {
  BsServer,
  BsPlusLg,
  BsKeyFill,
  BsJournalBookmark,
  BsShieldCheck,
  BsFileEarmarkCode,
  BsTerminalFill,
  BsFolder2Open,
  BsTag,
  BsGear,
  BsLayoutSidebarInset,
  BsLayoutSidebar,
} from "react-icons/bs";
import { TerminalAppInfo, NavTab } from "../types";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  totalHosts: number;
  totalKeys: number;
  totalKnownHosts: number;
  auditScore: number;
  groups: { name: string; count: number }[];
  tags: { name: string; count: number }[];
  activeGroup: string | null;
  activeTag: string | null;
  onSelectGroup: (group: string | null) => void;
  onSelectTag: (tag: string | null) => void;
  terminals: TerminalAppInfo[];
  selectedTerminal: string;
  onSelectTerminal: (termId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  totalHosts,
  totalKeys,
  totalKnownHosts,
  auditScore,
  groups,
  tags,
  activeGroup,
  activeTag,
  onSelectGroup,
  onSelectTag,
  terminals,
  selectedTerminal,
  onSelectTerminal,
  isCollapsed,
  onToggleCollapse,
}) => {
  if (isCollapsed) {
    /* COLLAPSED ICON-ONLY MODE */
    return (
      <aside className="w-12 border-r border-[#1f2942] bg-[#090d16] flex flex-col justify-between items-center py-2 select-none shrink-0 text-xs transition-all duration-200">
        <div className="flex flex-col items-center gap-1.5 w-full px-1">
          {/* Add Host Icon Button */}
          <button
            onClick={() => onSelectTab("add-host")}
            title="Add New SSH Host (⌘N)"
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all cursor-pointer shadow-sm ${
              activeTab === "add-host"
                ? "bg-blue-500 text-white ring-2 ring-blue-400/40"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
            }`}
          >
            <BsPlusLg className="w-3.5 h-3.5" />
          </button>

          {/* Nav Icons Divider */}
          <div className="w-6 h-px bg-[#1f2942] my-0.5" />

          {/* All Hosts */}
          <button
            onClick={() => {
              onSelectTab("hosts");
              onSelectGroup(null);
              onSelectTag(null);
            }}
            title={`All Hosts (${totalHosts})`}
            className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              activeTab === "hosts"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                : "text-gray-400 hover:bg-[#161d30] hover:text-white"
            }`}
          >
            <BsServer className="w-3.5 h-3.5" />
            {totalHosts > 0 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-3.5 rounded-full bg-[#161d30] border border-[#232f4d] text-[10px] font-mono text-gray-300 flex items-center justify-center leading-none">
                {totalHosts}
              </span>
            )}
          </button>

          {/* Key Management */}
          <button
            onClick={() => onSelectTab("keys")}
            title={`Key Management (${totalKeys})`}
            className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              activeTab === "keys"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                : "text-gray-400 hover:bg-[#161d30] hover:text-white"
            }`}
          >
            <BsKeyFill className="w-3.5 h-3.5 text-blue-400" />
            {totalKeys > 0 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-3.5 rounded-full bg-[#161d30] border border-[#232f4d] text-[10px] font-mono text-gray-300 flex items-center justify-center leading-none">
                {totalKeys}
              </span>
            )}
          </button>

          {/* Host Manager (Known Hosts) */}
          <button
            onClick={() => onSelectTab("known-hosts")}
            title={`Host Manager (${totalKnownHosts})`}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              activeTab === "known-hosts"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                : "text-gray-400 hover:bg-[#161d30] hover:text-white"
            }`}
          >
            <BsJournalBookmark className="w-3.5 h-3.5 text-yellow-400" />
          </button>

          {/* Security Audit */}
          <button
            onClick={() => onSelectTab("audit")}
            title={`Security Audit (${auditScore}%)`}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              activeTab === "audit"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                : "text-gray-400 hover:bg-[#161d30] hover:text-white"
            }`}
          >
            <BsShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          {/* Raw Config */}
          <button
            onClick={() => onSelectTab("raw-config")}
            title="Raw ~/.ssh/config Editor"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              activeTab === "raw-config"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                : "text-gray-400 hover:bg-[#161d30] hover:text-white"
            }`}
          >
            <BsFileEarmarkCode className="w-3.5 h-3.5 text-purple-400" />
          </button>

          {/* Settings */}
          <button
            onClick={() => onSelectTab("settings")}
            title="Settings"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              activeTab === "settings"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                : "text-gray-400 hover:bg-[#161d30] hover:text-white"
            }`}
          >
            <BsGear className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        {/* Bottom Expand Toggle Button */}
        <div className="w-full px-1 pt-1.5 border-t border-[#1f2942]/60 flex flex-col items-center">
          <button
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            className="w-8 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#161d30] transition-colors cursor-pointer"
          >
            <BsLayoutSidebar className="w-3.5 h-3.5 text-blue-400" />
          </button>
        </div>
      </aside>
    );
  }

  /* EXPANDED FULL MODE */
  return (
    <aside className="w-52 border-r border-[#1f2942] bg-[#090d16] flex flex-col justify-between select-none shrink-0 text-xs overflow-y-auto transition-all duration-200">
      <div className="p-2 space-y-2">
        {/* 1. At First: Add Host Button */}
        <button
          onClick={() => onSelectTab("add-host")}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md font-semibold text-xs shadow-sm transition-all cursor-pointer ${
            activeTab === "add-host"
              ? "bg-blue-500 text-white ring-2 ring-blue-400/40 shadow-blue-500/20"
              : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <BsPlusLg className="w-3.5 h-3.5" />
            <span>Add Host</span>
          </div>
          <kbd className="text-[10px] bg-blue-700/60 px-1.5 py-0.5 rounded font-mono leading-none">
            ⌘N
          </kbd>
        </button>

        {/* Navigation Items */}
        <div className="space-y-0.5 pt-1 border-t border-[#1f2942]/80">
          {/* 2. All Hosts */}
          <button
            onClick={() => {
              onSelectTab("hosts");
              onSelectGroup(null);
              onSelectTag(null);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === "hosts" && activeGroup === null && activeTag === null
                ? "bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30"
                : "text-gray-300 hover:bg-[#161d30] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <BsServer className="w-3.5 h-3.5" />
              <span className="text-xs">All Hosts</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#161d30] text-gray-400 font-mono leading-none">
              {totalHosts}
            </span>
          </button>

          {/* 3. Key Management */}
          <button
            onClick={() => onSelectTab("keys")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === "keys"
                ? "bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30"
                : "text-gray-300 hover:bg-[#161d30] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <BsKeyFill className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs">Key Management</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#161d30] text-gray-400 font-mono leading-none">
              {totalKeys}
            </span>
          </button>

          {/* 4. Host Manager (Known Hosts) */}
          <button
            onClick={() => onSelectTab("known-hosts")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === "known-hosts"
                ? "bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30"
                : "text-gray-300 hover:bg-[#161d30] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <BsJournalBookmark className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs">Host Manager</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#161d30] text-gray-400 font-mono leading-none">
              {totalKnownHosts}
            </span>
          </button>

          {/* 5. Security Audit */}
          <button
            onClick={() => onSelectTab("audit")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === "audit"
                ? "bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30"
                : "text-gray-300 hover:bg-[#161d30] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <BsShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs">Security Audit</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold leading-none ${
                auditScore === 100
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              {auditScore}%
            </span>
          </button>

          {/* 6. Raw Config */}
          <button
            onClick={() => onSelectTab("raw-config")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === "raw-config"
                ? "bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30"
                : "text-gray-300 hover:bg-[#161d30] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <BsFileEarmarkCode className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs">Raw Config</span>
            </div>
          </button>

          {/* 7. Settings */}
          <button
            onClick={() => onSelectTab("settings")}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === "settings"
                ? "bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30"
                : "text-gray-300 hover:bg-[#161d30] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <BsGear className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs">Settings</span>
            </div>
          </button>
        </div>

        {/* Contextual Groups Filter (when on hosts tab) */}
        {activeTab === "hosts" && groups.length > 0 && (
          <div className="space-y-1 pt-1.5 border-t border-[#1f2942]">
            <div className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Groups</span>
              <BsFolder2Open className="w-3 h-3 text-gray-500" />
            </div>
            {groups.map((grp) => (
              <button
                key={grp.name}
                onClick={() => {
                  onSelectTag(null);
                  onSelectGroup(activeGroup === grp.name ? null : grp.name);
                }}
                className={`w-full flex items-center justify-between px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  activeGroup === grp.name
                    ? "bg-blue-600/20 text-blue-400 font-medium border border-blue-500/30"
                    : "text-gray-300 hover:bg-[#161d30] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <BsFolder2Open className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate text-xs">{grp.name}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#161d30] text-gray-400 font-mono shrink-0 leading-none">
                  {grp.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Contextual Tags Filter (when on hosts tab) */}
        {activeTab === "hosts" && tags.length > 0 && (
          <div className="space-y-1 pt-1.5 border-t border-[#1f2942]">
            <div className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Tags</span>
              <BsTag className="w-3 h-3 text-gray-500" />
            </div>
            <div className="flex flex-wrap gap-1 px-0.5">
              {tags.map((t) => (
                <button
                  key={t.name}
                  onClick={() => {
                    onSelectGroup(null);
                    onSelectTag(activeTag === t.name ? null : t.name);
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors border cursor-pointer leading-none ${
                    activeTag === t.name
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/50 font-medium"
                      : "bg-[#0f1422] text-gray-400 border-[#1f2942] hover:text-gray-200 hover:border-gray-500"
                  }`}
                >
                  <span>#{t.name}</span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer: Launch Target Selector & Collapse Button */}
      <div className="p-2 border-t border-[#1f2942] bg-[#070a10] space-y-2">
        <div>
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <BsTerminalFill className="w-3 h-3 text-blue-400" />
            <span>Launch Target</span>
          </div>
          <select
            value={selectedTerminal}
            onChange={(e) => onSelectTerminal(e.target.value)}
            className="w-full bg-[#0f1422] border border-[#1f2942] rounded text-gray-200 text-xs px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {terminals.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.is_installed ? "✓" : ""}
              </option>
            ))}
            {terminals.length === 0 && (
              <option value="terminal">Terminal.app</option>
            )}
          </select>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-between px-2 py-1 text-gray-400 hover:text-white hover:bg-[#161d30] rounded transition-colors text-xs cursor-pointer"
          title="Collapse sidebar to icon-only mode"
        >
          <span className="text-xs">Collapse</span>
          <BsLayoutSidebarInset className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
    </aside>
  );
};
