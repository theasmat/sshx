import React, { useState, useRef, useEffect } from "react";
import {
  BsSearch,
  BsArrowClockwise,
  BsTerminalFill,
  BsShieldCheck,
  BsXLg,
} from "react-icons/bs";
import { NavTab } from "../types";
import { OmniboxDropdown } from "./OmniboxDropdown";
import { SearchItem } from "../utils/searchEngine";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  auditScore?: number;
  onSelectTab: (tab: NavTab) => void;
  searchResults: SearchItem[];
  onSelectSearchItem: (item: SearchItem) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  isLoading,
  auditScore = 100,
  onSelectTab,
  searchResults,
  onSelectSearchItem,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Reset selected index when search query or results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, searchResults]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchResults.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        onSelectSearchItem(searchResults[selectedIndex]);
        setIsFocused(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsFocused(false);
      onSearchChange("");
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleSelectItem = (item: SearchItem) => {
    onSelectSearchItem(item);
    setIsFocused(false);
  };

  return (
    <header className="h-10 border-b border-[#1f2942] bg-[#090d16] px-3.5 flex items-center justify-between gap-3 shrink-0 select-none relative z-40">
      {/* Brand Logo */}
      <div
        onClick={() => onSelectTab("hosts")}
        className="flex items-center gap-2 shrink-0 cursor-pointer"
      >
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-500/20 text-white font-bold text-xs tracking-wider">
          <BsTerminalFill className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white text-sm tracking-tight">SSHX</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 leading-none">
            Manager
          </span>
        </div>
      </div>

      {/* Center Search Bar & Omnibox Dropdown */}
      <div ref={searchContainerRef} className="flex-1 max-w-md relative">
        <BsSearch className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="global-sshx-search-input"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search actions, hosts, presets, keys, notes... (Cmd+K)"
          value={searchQuery}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setIsFocused(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full h-7 pl-8 pr-14 text-xs bg-[#0f1422] border border-[#1f2942] rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchQuery ? (
            <button
              onClick={() => {
                onSearchChange("");
                setIsFocused(false);
              }}
              className="p-0.5 text-gray-400 hover:text-white rounded cursor-pointer"
              title="Clear search"
            >
              <BsXLg className="w-3 h-3" />
            </button>
          ) : (
            <kbd className="text-[10px] bg-[#161d30] text-gray-400 px-1.5 py-0.5 rounded border border-[#232f4d] font-mono leading-none pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Omnibox Dropdown */}
        {isFocused && searchQuery.trim() && searchResults.length > 0 && (
          <OmniboxDropdown
            results={searchResults}
            selectedIndex={selectedIndex}
            onSelect={handleSelectItem}
            onHoverIndex={(idx) => setSelectedIndex(idx)}
            query={searchQuery}
            onClose={() => setIsFocused(false)}
          />
        )}
      </div>

      {/* Right Utility Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Security Audit Badge (Jumps to audit tab) */}
        <button
          onClick={() => onSelectTab("audit")}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
            auditScore === 100
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
              : "text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
          }`}
          title="Security & Permissions Auditor"
        >
          <BsShieldCheck className="w-3.5 h-3.5" />
          <span className="text-xs font-mono font-medium">{auditScore}%</span>
        </button>

        {/* Refresh ~/.ssh/config */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#0f1422] rounded-md transition-colors disabled:opacity-50 cursor-pointer"
          title="Reload ~/.ssh/config (⌘R)"
        >
          <BsArrowClockwise className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
        </button>
      </div>
    </header>
  );
};
