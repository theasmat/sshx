import React, { useEffect, useRef } from "react";
import {
  BsStars,
  BsSliders,
  BsLightningChargeFill,
  BsKeyFill,
  BsShieldLock,
  BsShieldCheck,
  BsTerminalFill,
  BsServer,
  BsGear,
  BsFolder2Open,
  BsFileEarmarkCode,
  BsZoomIn,
  BsZoomOut,
  BsArrowClockwise,
  BsUpload,
  BsArrowRight,
  BsCheckLg,
} from "react-icons/bs";
import { BrandLogo } from "./BrandLogo";
import { SearchItem, SearchItemCategory } from "../utils/searchEngine";

interface OmniboxDropdownProps {
  results: SearchItem[];
  selectedIndex: number;
  onSelect: (item: SearchItem) => void;
  onHoverIndex: (index: number) => void;
  query: string;
  onClose: () => void;
}

export const OmniboxDropdown: React.FC<OmniboxDropdownProps> = ({
  results,
  selectedIndex,
  onSelect,
  onHoverIndex,
  query,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  // Scroll active item into view
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  if (results.length === 0) return null;

  // Render Category Icon
  const renderItemIcon = (item: SearchItem) => {
    const iconClass = "w-3.5 h-3.5";

    if (item.category === "preset" && item.iconName) {
      return <BrandLogo name={item.iconName} className="w-3.5 h-3.5" />;
    }

    switch (item.iconName) {
      case "stars":
        return <BsStars className={`${iconClass} text-purple-400`} />;
      case "sliders":
        return <BsSliders className={`${iconClass} text-blue-400`} />;
      case "lightning":
        return <BsLightningChargeFill className={`${iconClass} text-amber-400`} />;
      case "key":
        return <BsKeyFill className={`${iconClass} text-emerald-400`} />;
      case "shield-lock":
        return <BsShieldLock className={`${iconClass} text-purple-400`} />;
      case "shield-check":
        return <BsShieldCheck className={`${iconClass} text-emerald-400`} />;
      case "upload":
        return <BsUpload className={`${iconClass} text-blue-400`} />;
      case "terminal":
        return <BsTerminalFill className={`${iconClass} text-blue-400`} />;
      case "server":
        return <BsServer className={`${iconClass} text-cyan-400`} />;
      case "gear":
        return <BsGear className={`${iconClass} text-gray-300`} />;
      case "file-code":
        return <BsFileEarmarkCode className={`${iconClass} text-amber-400`} />;
      case "folder":
        return <BsFolder2Open className={`${iconClass} text-gray-400`} />;
      case "zoom-in":
        return <BsZoomIn className={`${iconClass} text-blue-400`} />;
      case "zoom-out":
        return <BsZoomOut className={`${iconClass} text-blue-400`} />;
      case "zoom-reset":
        return <BsCheckLg className={`${iconClass} text-blue-400`} />;
      case "arrow-clockwise":
        return <BsArrowClockwise className={`${iconClass} text-blue-400`} />;
      default:
        return <BsTerminalFill className={`${iconClass} text-gray-400`} />;
    }
  };

  const getCategoryColor = (cat: SearchItemCategory) => {
    switch (cat) {
      case "action":
        return "bg-purple-500/10 text-purple-300 border-purple-500/30";
      case "preset":
        return "bg-amber-500/10 text-amber-300 border-amber-500/30";
      case "host":
        return "bg-blue-500/10 text-blue-300 border-blue-500/30";
      case "key":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      case "page":
        return "bg-gray-500/10 text-gray-300 border-gray-500/30";
      default:
        return "bg-[#161d30] text-gray-400 border-[#232f4d]";
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-1.5 bg-[#090d16]/95 backdrop-blur-md border border-[#1f2942] rounded-xl shadow-2xl shadow-black/80 z-50 overflow-hidden text-xs animate-in fade-in slide-in-from-top-1 duration-150"
      style={{ minWidth: "460px" }}
    >
      {/* Top Header Label */}
      <div className="px-3 py-1.5 border-b border-[#1f2942] bg-[#0c101c] flex items-center justify-between text-[11px] text-gray-400">
        <span className="font-semibold uppercase tracking-wider text-gray-300">
          Smart Suggestions & Actions
        </span>
        <span className="font-mono text-gray-500">
          {results.length} match{results.length !== 1 ? "es" : ""} for &ldquo;{query}&rdquo;
        </span>
      </div>

      {/* Results List */}
      <div className="max-h-80 overflow-y-auto p-1.5 space-y-1">
        {results.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <div
              key={item.id}
              ref={isSelected ? activeItemRef : null}
              onMouseEnter={() => onHoverIndex(index)}
              onClick={() => onSelect(item)}
              className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                isSelected
                  ? "bg-[#131a2c] border-blue-500/50 shadow-sm"
                  : "bg-[#070a10] hover:bg-[#0f1524] border-transparent"
              }`}
            >
              {/* Left Icon + Title & Note */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-lg bg-[#161d30] border border-[#232f4d] flex items-center justify-center shrink-0 shadow-inner">
                  {renderItemIcon(item)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold text-xs truncate ${
                        isSelected ? "text-white font-bold" : "text-gray-200"
                      }`}
                    >
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span className="text-[10px] text-gray-500 font-mono truncate">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                  {/* Explanatory Note */}
                  <div className="text-[11px] text-gray-400 truncate mt-0.5 leading-snug">
                    {item.note}
                  </div>
                </div>
              </div>

              {/* Right Badges & Enter Prompt */}
              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium border leading-none ${getCategoryColor(
                      item.category
                    )}`}
                  >
                    {item.badge}
                  </span>
                )}

                {isSelected ? (
                  <kbd className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-mono text-[10px] flex items-center gap-0.5 shadow-sm">
                    <span>↵</span>
                  </kbd>
                ) : (
                  <BsArrowRight className="w-3 h-3 text-gray-600" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Hint Footer */}
      <div className="px-3 py-1.5 border-t border-[#1f2942] bg-[#070a10] flex items-center justify-between text-[10px] text-gray-500">
        <div className="flex items-center gap-3">
          <span>
            <kbd className="bg-[#161d30] px-1 py-0.5 rounded border border-[#232f4d] text-gray-300">↑</kbd>{" "}
            <kbd className="bg-[#161d30] px-1 py-0.5 rounded border border-[#232f4d] text-gray-300">↓</kbd> Navigate
          </span>
          <span>
            <kbd className="bg-[#161d30] px-1 py-0.5 rounded border border-[#232f4d] text-gray-300">↵</kbd> Select Action
          </span>
          <span>
            <kbd className="bg-[#161d30] px-1 py-0.5 rounded border border-[#232f4d] text-gray-300">esc</kbd> Dismiss
          </span>
        </div>
        <span className="text-gray-600">SSHX Omnibox Engine</span>
      </div>
    </div>
  );
};
