import React, { useState, useRef, useEffect } from "react";
import {
  BsSearch,
  BsArrowClockwise,
  BsShieldCheck,
  BsXLg,
} from "react-icons/bs";
import { SshxLogo } from "./SshxLogo";
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
    <header className="h-11 bg-bar px-3.5 flex items-center justify-between gap-3 shrink-0 select-none relative z-40">
      {/* Brand Logo - macOS Style */}
      <div
        onClick={() => onSelectTab("hosts")}
        className="flex items-center gap-2 shrink-0 cursor-pointer group"
        title="SSHX - Modern SSH Config & Key Manager"
      >
        <SshxLogo variant="badge" size="sm" macStyle={true} tagText="v1.0.0" />
      </div>

      {/* Center Search Bar & Omnibox Dropdown */}
      <div ref={searchContainerRef} className="flex-1 max-w-md relative">
        <BsSearch className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="global-sshx-search-input"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search"
          value={searchQuery}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setIsFocused(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full h-8 pl-8 pr-14 text-[13px] bg-white/[0.07] rounded-ctl text-label placeholder-label-3 focus:outline-none focus:bg-white/[0.1] focus:ring-2 focus:ring-accent/70 transition-colors font-sans"
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
            <kbd className="text-[11px] text-label-3 px-1 font-sans pointer-events-none">
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
          className={`flex items-center gap-1.5 h-8 px-2.5 text-[13px] rounded-ctl hover:bg-white/[0.06] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
            auditScore === 100 ? "text-emerald-400" : "text-amber-400"
          }`}
          title="Security & Permissions Auditor"
        >
          <BsShieldCheck className="w-3.5 h-3.5" />
          <span className="text-[13px] font-medium tabular-nums">{auditScore}%</span>
        </button>

        {/* Refresh ~/.ssh/config */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="h-8 w-8 flex items-center justify-center text-label-2 hover:text-label hover:bg-white/[0.06] rounded-ctl transition-colors disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          title="Reload ~/.ssh/config (⌘R)"
        >
          <BsArrowClockwise className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
        </button>
      </div>
    </header>
  );
};
