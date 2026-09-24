import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wrench,
  Check,
  RotateCw,
  KeyRound,
} from "lucide-react";
import { SshTestResult } from "../types";
import { api } from "../api";

interface TestResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostAlias: string;
  result: SshTestResult | null;
  isLoading: boolean;
  onRetest?: (hostAlias: string) => void;
}

export const TestResultModal: React.FC<TestResultModalProps> = ({
  isOpen,
  onClose,
  hostAlias,
  result,
  isLoading,
  onRetest,
}) => {
  const [isFixingHost, setIsFixingHost] = useState(false);
  const [fixSuccessMsg, setFixSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const outputText = result?.output || "";
  const isHostKeyMismatch =
    outputText.includes("REMOTE HOST IDENTIFICATION HAS CHANGED") ||
    outputText.includes("Host key verification failed") ||
    outputText.includes("Offending ECDSA key") ||
    outputText.includes("Offending ED25519 key") ||
    outputText.includes("Offending RSA key");

  const isPermissionDenied =
    !result?.success &&
    (outputText.includes("Permission denied (publickey)") ||
      outputText.includes("publickey,password") ||
      outputText.includes("Permission denied"));

  const handleAutoFixHostKey = async () => {
    setIsFixingHost(true);
    setFixSuccessMsg(null);
    try {
      const msg = await api.fixStaleHost(hostAlias);
      setFixSuccessMsg(msg);
      if (onRetest) {
        setTimeout(() => {
          onRetest(hostAlias);
        }, 1000);
      }
    } catch (err: any) {
      alert(`Auto-fix failed: ${err}`);
    } finally {
      setIsFixingHost(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#0c101a] border border-[#1f2942] rounded-2xl w-full max-w-lg p-5 shadow-2xl text-xs space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1f2942] pb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">
              SSH Test: <span className="font-mono text-blue-400">{hostAlias}</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#161d30] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-300 font-medium">Testing connection to {hostAlias}...</p>
            <p className="text-gray-500 text-[11px]">Executing ssh -T {hostAlias}</p>
          </div>
        ) : result ? (
          <div className="space-y-3">
            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                result.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-300"
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-xs">
                {result.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>
                  {result.success
                    ? "Connection & Authentication Succeeded"
                    : "Connection or Authentication Failed"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] opacity-80 font-mono">
                <Clock className="w-3 h-3" />
                <span>{result.duration_ms}ms</span>
              </div>
            </div>

            {/* AUTOMATION 1: Host Key Mismatch Auto-Fix Banner */}
            {isHostKeyMismatch && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-amber-200">
                <div className="flex items-center gap-2 font-semibold text-xs text-amber-300">
                  <Wrench className="w-4 h-4" />
                  <span>Stale Remote Host Key Detected</span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  The remote server was reinstalled or changed its key. SSH blocked the connection to protect against spoofing.
                </p>
                <button
                  type="button"
                  disabled={isFixingHost}
                  onClick={handleAutoFixHostKey}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{isFixingHost ? "Purging Stale Key..." : "⚡ 1-Click Auto-Fix Host & Retest"}</span>
                </button>
              </div>
            )}

            {/* AUTOMATION 2: Permission Denied Public Key Tip */}
            {isPermissionDenied && !isHostKeyMismatch && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-1 text-blue-200">
                <div className="flex items-center gap-2 font-semibold text-xs text-blue-300">
                  <KeyRound className="w-4 h-4" />
                  <span>Authentication / Key Setup Tip</span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  Remote server rejected public key authentication. You can install your public key directly to this server using the <strong className="text-white font-medium">"Install Key to Remote (ssh-copy-id)"</strong> button in the Host Details pane.
                </p>
              </div>
            )}

            {fixSuccessMsg && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{fixSuccessMsg}</span>
              </div>
            )}

            {/* Command Output */}
            <div>
              <div className="text-gray-400 text-[10px] uppercase font-semibold mb-1 tracking-wider">
                CLI Command Output:
              </div>
              <pre className="bg-[#070a10] border border-[#1f2942] rounded-xl p-3 font-mono text-[11px] text-gray-300 max-h-44 overflow-y-auto whitespace-pre-wrap select-all leading-relaxed">
                {result.output || "(no output received from remote host)"}
              </pre>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-[#1f2942]">
          {onRetest && result && (
            <button
              onClick={() => onRetest(hostAlias)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-lg font-medium transition-colors text-xs border border-[#232f4d] cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Retest</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors text-xs ml-auto cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
