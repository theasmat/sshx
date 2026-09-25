import React, { useState } from "react";
import {
  BsShieldCheck,
  BsShieldExclamation,
  BsExclamationTriangleFill,
  BsInfoCircleFill,
  BsCheckCircleFill,
  BsWrench,
  BsArrowClockwise,
  BsStars,
  BsPlusLg,
  BsCheckLg,
  BsCopy,
} from "react-icons/bs";
import { SecurityAuditReport, NavTab } from "../types";
import { api } from "../api";
import { SecurityAuditFixModal } from "../components/SecurityAuditFixModal";

interface SecurityAuditViewProps {
  report: SecurityAuditReport | null;
  onRefresh: () => void;
  isLoading: boolean;
  onSelectTab?: (tab: NavTab) => void;
  onOpenAddHost?: () => void;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({
  report,
  onRefresh,
  isLoading,
  onSelectTab,
  onOpenAddHost,
}) => {
  const [isFixModalOpen, setIsFixModalOpen] = useState(false);
  const [fixSuccessMsg, setFixSuccessMsg] = useState<string | null>(null);
  const [generatedKeyMsg, setGeneratedKeyMsg] = useState<{
    fileName: string;
    pubKey: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  const handleGenerateReplacementKey = async (baseName: string) => {
    setIsGeneratingKey(true);
    try {
      const cleanName = `id_ed25519_migrated_${Date.now().toString().slice(-4)}`;
      const result = await api.generateKey({
        name: cleanName,
        key_type: "ed25519",
        comment: `${baseName}-migrated@sshx`,
      });

      setGeneratedKeyMsg({
        fileName: result.file_name,
        pubKey: result.public_key_content || "",
      });
      onRefresh();
    } catch (err: any) {
      alert(`Failed to generate replacement key: ${err}`);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleCopyGeneratedPub = () => {
    if (generatedKeyMsg?.pubKey) {
      navigator.clipboard.writeText(generatedKeyMsg.pubKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const score = report?.score ?? 100;
  const issues = report?.issues ?? [];
  const fixableCount = issues.filter((i) => i.fixable).length;

  return (
    <div className="h-full flex flex-col bg-[#070a10] text-xs select-none overflow-hidden">
      {/* Top Header */}
      <div className="px-3.5 py-1.5 border-b border-[#1f2942] bg-[#090d16] flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <BsShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Security & Permissions Audit</h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenAddHost && (
            <button
              onClick={onOpenAddHost}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-semibold text-xs transition-colors cursor-pointer"
            >
              <BsPlusLg className="w-3 h-3" />
              <span>New Host Connection</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-md border border-[#232f4d] font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <BsArrowClockwise className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
            <span>Re-Run Audit</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Security Score Banner */}
          <div className="p-3.5 bg-[#0b0f19] border border-[#1f2942] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-2xl font-mono border ${
                  score === 100
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : score >= 80
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                }`}
              >
                {score}%
              </div>

              <div>
                <h3 className="font-bold text-white text-sm">
                  {score === 100
                    ? "SSH Configuration is Hardened & Secure"
                    : "Security Issues Detected"}
                </h3>
                <p className="text-gray-400 text-xs mt-0.5">
                  Scanned {report?.total_hosts ?? 0} hosts and {report?.total_keys ?? 0} private keys in ~/.ssh/.
                </p>
              </div>
            </div>

            {fixableCount > 0 && (
              <button
                onClick={() => setIsFixModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95"
              >
                <BsWrench className="w-3.5 h-3.5" />
                <span>Review & Fix All Issues ({fixableCount})</span>
              </button>
            )}
          </div>

          {/* Success messages */}
          {fixSuccessMsg && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BsCheckCircleFill className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{fixSuccessMsg}</span>
              </div>
              <button
                onClick={() => setFixSuccessMsg(null)}
                className="text-gray-400 hover:text-white cursor-pointer ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {generatedKeyMsg && (
            <div className="p-3 bg-[#0c1322] border border-emerald-500/40 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                  <BsCheckCircleFill className="w-4 h-4 text-emerald-400" />
                  <span>Replacement Key ~/.ssh/{generatedKeyMsg.fileName} Generated!</span>
                </div>
                <button
                  onClick={() => setGeneratedKeyMsg(null)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center justify-between bg-[#070a10] p-2 rounded-lg border border-[#1f2942]">
                <span className="font-mono text-gray-300 truncate max-w-md">
                  {generatedKeyMsg.pubKey}
                </span>
                <button
                  onClick={handleCopyGeneratedPub}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs cursor-pointer ml-2 shrink-0"
                >
                  {copiedKey ? <BsCheckLg className="w-3 h-3" /> : <BsCopy className="w-3 h-3 text-white" />}
                  <span>{copiedKey ? "Copied!" : "Copy .pub"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Audit Issues List */}
          <div className="space-y-1.5">
            <h3 className="font-semibold text-white text-xs">Security Findings</h3>

            {issues.length === 0 ? (
              <div className="p-6 text-center bg-[#0b0f19] border border-[#1f2942] rounded-xl text-emerald-400 flex flex-col items-center gap-2">
                <BsCheckCircleFill className="w-7 h-7" />
                <span className="font-semibold text-sm">No Security Warnings</span>
                <span className="text-gray-400 text-xs">
                  All ~/.ssh directory and key permissions match standard Unix security policies (700 / 600).
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start justify-between gap-3 bg-[#0b0f19] ${
                      issue.severity === "critical"
                        ? "border-rose-500/30"
                        : issue.severity === "warning"
                        ? "border-amber-500/30"
                        : "border-blue-500/30"
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5 shrink-0">
                        {issue.severity === "critical" ? (
                          <BsShieldExclamation className="w-4 h-4 text-rose-400" />
                        ) : issue.severity === "warning" ? (
                          <BsExclamationTriangleFill className="w-4 h-4 text-amber-400" />
                        ) : (
                          <BsInfoCircleFill className="w-4 h-4 text-blue-400" />
                        )}
                      </div>

                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-xs">
                            {issue.title}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-mono font-semibold leading-none ${
                              issue.severity === "critical"
                                ? "bg-rose-500/20 text-rose-300"
                                : issue.severity === "warning"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-blue-500/20 text-blue-300"
                            }`}
                          >
                            {issue.severity}
                          </span>
                        </div>

                        <p className="text-gray-400 text-xs leading-relaxed">
                          {issue.description}
                        </p>

                        {issue.path && (
                          <div className="text-[11px] font-mono text-gray-500 mt-1">
                            Target path: {issue.path}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Interactive Action Button for this finding */}
                    <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                      {issue.fixable && (
                        <button
                          onClick={() => setIsFixModalOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs transition-colors cursor-pointer"
                        >
                          <BsWrench className="w-3 h-3" />
                          <span>Fix Issue</span>
                        </button>
                      )}

                      {(issue.title.includes("Legacy") || issue.title.includes("Weak")) && (
                        <button
                          onClick={() => handleGenerateReplacementKey(issue.title)}
                          disabled={isGeneratingKey}
                          className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium text-xs transition-colors cursor-pointer"
                        >
                          <BsStars className="w-3 h-3 text-purple-200" />
                          <span>Generate Ed25519</span>
                        </button>
                      )}

                      {issue.title.includes("Duplicate") && onSelectTab && (
                        <button
                          onClick={() => onSelectTab("hosts")}
                          className="px-3 py-1 bg-[#161d30] hover:bg-[#1f2942] text-blue-400 rounded font-medium text-xs border border-[#232f4d] cursor-pointer"
                        >
                          Go to Hosts ➔
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Audit Fix Checklist Modal */}
      <SecurityAuditFixModal
        isOpen={isFixModalOpen}
        onClose={() => setIsFixModalOpen(false)}
        issues={issues}
        onFixApplied={(res) => {
          setFixSuccessMsg(`Successfully applied ${res.fixed_count} security fix(es)!`);
          onRefresh();
        }}
        onSelectTab={onSelectTab}
        onGenerateKey={handleGenerateReplacementKey}
      />
    </div>
  );
};
