import React from "react";
import {
  BsExclamationTriangleFill,
  BsLightningChargeFill,
  BsSliders,
  BsXLg,
  BsStars,
} from "react-icons/bs";
import { SshKeyInfo } from "../types";

interface KeyConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflictKeyName: string;
  uniqueSuggestionName: string;
  existingKey?: SshKeyInfo;
  onAutoResolve: (uniqueName: string) => void;
  onManualSelect: () => void;
  onForceUseExisting: (existingKey: SshKeyInfo) => void;
}

export const KeyConflictModal: React.FC<KeyConflictModalProps> = ({
  isOpen,
  onClose,
  conflictKeyName,
  uniqueSuggestionName,
  existingKey,
  onAutoResolve,
  onManualSelect,
  onForceUseExisting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-[#0b0f19] border border-[#1f2942] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1f2942] bg-[#0e1422] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <BsExclamationTriangleFill className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Key Name Conflict Detected
              </h3>
              <p className="text-[11px] text-gray-400 font-mono">
                ~/.ssh/{conflictKeyName} already exists
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1c243a] transition-colors cursor-pointer"
          >
            <BsXLg className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-3">
          <div className="p-3 bg-[#070a10] border border-amber-500/20 rounded-xl space-y-1 text-gray-300">
            <p className="leading-relaxed">
              A private key named <code className="text-amber-300 font-mono font-semibold bg-[#161d30] px-1.5 py-0.5 rounded border border-[#232f4d]">{conflictKeyName}</code> is already stored in your local <code className="text-blue-400 font-mono">~/.ssh/</code> directory.
            </p>
            <p className="text-[11px] text-gray-400">
              Please choose how you would like SSHX to resolve this key connection:
            </p>
          </div>

          {/* 3 Prominent Options */}
          <div className="space-y-2.5">
            {/* Option 1: Auto Resolve (Recommended) */}
            <div
              onClick={() => onAutoResolve(uniqueSuggestionName)}
              className="group p-3 bg-[#0d1527] hover:bg-[#121e38] border border-blue-500/40 hover:border-blue-500/80 rounded-xl cursor-pointer transition-all flex items-start gap-3 shadow-md shadow-blue-500/5 hover:-translate-y-0.5"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <BsStars className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white group-hover:text-blue-300 transition-colors">
                    1. Auto-Resolve (Recommended)
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Safe & Isolated
                  </span>
                </div>
                <p className="text-gray-400 text-[11px] mt-0.5 leading-relaxed">
                  Automatically generate a dedicated, non-colliding key pair:
                </p>
                <code className="block mt-1 text-emerald-400 font-mono text-[11px] bg-[#070a10] px-2 py-1 rounded border border-[#1f2942]">
                  ~/.ssh/{uniqueSuggestionName}
                </code>
              </div>
            </div>

            {/* Option 2: Force Use Existing Key */}
            {existingKey && (
              <div
                onClick={() => onForceUseExisting(existingKey)}
                className="group p-3 bg-[#071318] hover:bg-[#0c1f28] border border-emerald-500/40 hover:border-emerald-500/80 rounded-xl cursor-pointer transition-all flex items-start gap-3 shadow-md shadow-emerald-500/5 hover:-translate-y-0.5"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <BsLightningChargeFill className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white group-hover:text-emerald-300 transition-colors">
                      2. Use Existing Key (Link Directly)
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Reuse
                    </span>
                  </div>
                  <p className="text-gray-400 text-[11px] mt-0.5 leading-relaxed">
                    Connect the existing <code className="text-emerald-300 font-mono">{conflictKeyName}</code> key to this host without generating a new file.
                  </p>
                </div>
              </div>
            )}

            {/* Option 3: Manual Selection / Rename */}
            <div
              onClick={onManualSelect}
              className="group p-3 bg-[#0e121d] hover:bg-[#151a2a] border border-[#1f2942] hover:border-purple-500/50 rounded-xl cursor-pointer transition-all flex items-start gap-3 hover:-translate-y-0.5"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <BsSliders className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white group-hover:text-purple-300 transition-colors">
                  3. Manual Configuration
                </div>
                <p className="text-gray-400 text-[11px] mt-0.5 leading-relaxed">
                  Choose a different key from your ~/.ssh/ directory or type a custom filename manually.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#1f2942] bg-[#090d16] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 hover:text-white rounded-lg font-medium transition-colors cursor-pointer text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
