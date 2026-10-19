import React, { useState } from "react";
import {
  BsServer,
  BsPlusLg,
  BsKeyFill,
  BsJournalBookmark,
  BsShieldCheck,
  BsFileEarmarkCode,
  BsFolder2,
  BsGear,
  BsChevronDown,
  BsChevronRight,
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
  const [filtersOpen, setFiltersOpen] = useState(true);

  const allHostsActive = activeTab === "hosts" && activeGroup === null && activeTag === null;
  const nav: {
    tab: NavTab;
    label: string;
    icon: React.ReactNode;
    active: boolean;
    trailing?: React.ReactNode;
    onClick?: () => void;
  }[] = [
    {
      tab: "hosts",
      label: "All Hosts",
      icon: <BsServer />,
      active: allHostsActive,
      trailing: totalHosts,
      onClick: () => {
        onSelectTab("hosts");
        onSelectGroup(null);
        onSelectTag(null);
      },
    },
    { tab: "keys", label: "Keys", icon: <BsKeyFill />, active: activeTab === "keys", trailing: totalKeys },
    { tab: "known-hosts", label: "Known Hosts", icon: <BsJournalBookmark />, active: activeTab === "known-hosts", trailing: totalKnownHosts },
    {
      tab: "audit",
      label: "Security Audit",
      icon: <BsShieldCheck />,
      active: activeTab === "audit",
      trailing: (
        <span className={auditScore === 100 ? "text-emerald-400" : "text-amber-400"}>{auditScore}%</span>
      ),
    },
    { tab: "raw-config", label: "Raw Config", icon: <BsFileEarmarkCode />, active: activeTab === "raw-config" },
    { tab: "settings", label: "Settings", icon: <BsGear />, active: activeTab === "settings" },
  ];

  const focus = "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70";

  if (isCollapsed) {
    return (
      <aside className="w-14 bg-bar flex flex-col justify-between items-center py-3 select-none shrink-0">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => onSelectTab("add-host")}
            title="Add host (⌘N)"
            aria-label="Add host"
            className={`w-9 h-9 mb-2 rounded-ctl flex items-center justify-center bg-accent hover:bg-accent-hover text-white cursor-pointer ${focus}`}
          >
            <BsPlusLg className="w-4 h-4" />
          </button>
          {nav.map((n) => (
            <button
              key={n.tab}
              onClick={n.onClick || (() => onSelectTab(n.tab))}
              title={n.label}
              aria-label={n.label}
              aria-current={n.active ? "page" : undefined}
              className={`w-9 h-9 rounded-ctl flex items-center justify-center text-base cursor-pointer transition-colors ${focus} ${
                n.active ? "bg-accent/20 text-accent" : "text-label-2 hover:bg-white/[0.06] hover:text-label"
              }`}
            >
              {n.icon}
            </button>
          ))}
        </div>
        <button
          onClick={onToggleCollapse}
          title="Expand sidebar"
          aria-label="Expand sidebar"
          className={`w-9 h-9 rounded-ctl flex items-center justify-center text-label-2 hover:bg-white/[0.06] hover:text-label cursor-pointer ${focus}`}
        >
          <BsLayoutSidebar className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-56 bg-bar flex flex-col justify-between select-none shrink-0 overflow-y-auto text-[13px]">
      <div className="p-3 space-y-4">
        <button
          onClick={() => onSelectTab("add-host")}
          className={`w-full h-8 flex items-center justify-center gap-1.5 rounded-ctl font-medium text-white cursor-pointer ${focus} ${
            activeTab === "add-host" ? "bg-accent-hover" : "bg-accent hover:bg-accent-hover"
          }`}
        >
          <BsPlusLg className="w-3.5 h-3.5" />
          <span>Add Host</span>
          <span className="ml-1 text-[11px] text-white/60">⌘N</span>
        </button>

        <nav className="space-y-0.5" aria-label="Sections">
          {nav.map((n) => (
            <button
              key={n.tab}
              onClick={n.onClick || (() => onSelectTab(n.tab))}
              aria-current={n.active ? "page" : undefined}
              className={`w-full flex items-center gap-2.5 px-2.5 h-8 rounded-ctl cursor-pointer transition-colors ${focus} ${
                n.active ? "bg-accent/20 text-label" : "text-label hover:bg-white/[0.06]"
              }`}
            >
              <span className={`text-[15px] ${n.active ? "text-accent" : "text-label-2"}`}>{n.icon}</span>
              <span className="flex-1 text-left truncate">{n.label}</span>
              {n.trailing !== undefined && (
                <span className="text-xs text-label-3 tabular-nums">{n.trailing}</span>
              )}
            </button>
          ))}
        </nav>

        {activeTab === "hosts" && (groups.length > 0 || tags.length > 0) && (
          <section>
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              className={`w-full flex items-center gap-1 px-2.5 mb-1 text-[11px] font-medium uppercase tracking-wide text-label-3 hover:text-label-2 cursor-pointer ${focus} rounded-ctl`}
            >
              {filtersOpen ? <BsChevronDown className="w-2.5 h-2.5" /> : <BsChevronRight className="w-2.5 h-2.5" />}
              <span>Filters</span>
            </button>

            {filtersOpen && (
              <div className="space-y-3">
                {groups.length > 0 && (
                  <div className="space-y-0.5">
                    {groups.map((grp) => (
                      <button
                        key={grp.name}
                        onClick={() => {
                          onSelectTag(null);
                          onSelectGroup(activeGroup === grp.name ? null : grp.name);
                        }}
                        aria-pressed={activeGroup === grp.name}
                        className={`w-full flex items-center gap-2.5 px-2.5 h-7 rounded-ctl cursor-pointer transition-colors ${focus} ${
                          activeGroup === grp.name ? "bg-accent/20 text-label" : "text-label hover:bg-white/[0.06]"
                        }`}
                      >
                        <BsFolder2 className="text-label-2 shrink-0" />
                        <span className="flex-1 text-left truncate">{grp.name}</span>
                        <span className="text-xs text-label-3 tabular-nums">{grp.count}</span>
                      </button>
                    ))}
                  </div>
                )}

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 px-1.5">
                    {tags.map((t) => (
                      <button
                        key={t.name}
                        onClick={() => {
                          onSelectGroup(null);
                          onSelectTag(activeTag === t.name ? null : t.name);
                        }}
                        aria-pressed={activeTag === t.name}
                        className={`h-6 px-2 rounded-full text-xs cursor-pointer transition-colors ${focus} ${
                          activeTag === t.name
                            ? "bg-accent text-white"
                            : "bg-white/[0.06] text-label-2 hover:text-label"
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      <div className="p-3 space-y-2">
        <label className="block">
          <span className="block px-0.5 mb-1 text-[11px] font-medium uppercase tracking-wide text-label-3">
            Open in
          </span>
          <select
            value={selectedTerminal}
            onChange={(e) => onSelectTerminal(e.target.value)}
            className={`w-full h-8 bg-control text-label rounded-ctl px-2 cursor-pointer ${focus}`}
          >
            {terminals.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.is_installed ? "" : "(not installed)"}
              </option>
            ))}
            {terminals.length === 0 && <option value="terminal">Terminal.app</option>}
          </select>
        </label>
        <button
          onClick={onToggleCollapse}
          title="Collapse sidebar"
          className={`w-full flex items-center gap-2.5 px-2.5 h-8 rounded-ctl text-label-2 hover:bg-white/[0.06] hover:text-label cursor-pointer ${focus}`}
        >
          <BsLayoutSidebarInset />
          <span>Collapse</span>
        </button>
      </div>
    </aside>
  );
};
