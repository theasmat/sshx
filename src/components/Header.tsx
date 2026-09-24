import React from "react";
import {
  Search,
  RotateCw,
  Terminal,
  ShieldCheck,
} from "lucide-react";
import { NavTab } from "../types";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  auditScore?: number;
  onSelectTab: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading,
  auditScore = 100,
  onSelectTab,
}) => {
  return (
    <header className="h-11 border-b border-[#1f2942] bg-[#090d16] px-3.5 flex items-center justify-between gap-3 shrink-0 select-none">
      {/* Brand Logo */}
      <div
        onClick={() => onSelectTab("hosts")}
        className="flex items-center gap-2 shrink-0 cursor-pointer"
      >
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-xs tracking-wider">
          <Terminal className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white text-xs tracking-tight">SSHX</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider px-1 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Manager
          </span>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-md relative">
        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search hosts, aliases, IPs, tags... (Cmd+K)"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-7 pl-8 pr-12 text-xs bg-[#0f1422] border border-[#1f2942] rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
        />
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-0.5">
          <kbd className="text-[9px] bg-[#161d30] text-gray-400 px-1.5 py-0.2 rounded border border-[#232f4d] font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Utility Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Security Audit Badge (Jumps to audit tab) */}
        <button
          onClick={() => onSelectTab("audit")}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md border transition-colors ${
            auditScore === 100
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
              : "text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
          }`}
          title="Security & Permissions Auditor"
        >
          <ShieldCheck className="w-3 h-3" />
          <span className="text-[11px] font-mono">{auditScore}%</span>
        </button>

        {/* Refresh ~/.ssh/config */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1 text-gray-400 hover:text-gray-200 hover:bg-[#0f1422] rounded-md transition-colors disabled:opacity-50"
          title="Reload ~/.ssh/config (⌘R)"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
        </button>
      </div>
    </header>
  );
};
