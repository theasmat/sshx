import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Wrench,
  RefreshCw,
} from "lucide-react";
import { SecurityAuditReport } from "../types";
import { api } from "../api";

interface SecurityAuditViewProps {
  report: SecurityAuditReport | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({
  report,
  onRefresh,
  isLoading,
}) => {
  const [isFixing, setIsFixing] = useState(false);
  const [fixSuccessMsg, setFixSuccessMsg] = useState<string | null>(null);

  const handleFixPermissions = async () => {
    setIsFixing(true);
    setFixSuccessMsg(null);
    try {
      const msg = await api.fixPermissions();
      setFixSuccessMsg(msg);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to repair permissions: ${err}`);
    } finally {
      setIsFixing(false);
    }
  };

  const score = report?.score ?? 100;
  const issues = report?.issues ?? [];
  const fixableCount = issues.filter((i) => i.fixable).length;

  return (
    <div className="h-full flex flex-col bg-[#070a10] text-xs select-none overflow-hidden">
      {/* Top Header */}
      <div className="px-5 py-3 border-b border-[#1f2942] bg-[#090d16] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Security & Permissions Audit</h2>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-lg border border-[#232f4d] font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
          <span>Run Audit</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Security Score Banner */}
          <div className="p-5 bg-[#0b0f19] border border-[#1f2942] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl font-mono border ${
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
                <h3 className="font-bold text-white text-base">
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
                onClick={handleFixPermissions}
                disabled={isFixing}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                <Wrench className="w-4 h-4" />
                <span>{isFixing ? "Repairing..." : "Auto-Fix Permissions (chmod 600/700)"}</span>
              </button>
            )}
          </div>

          {fixSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{fixSuccessMsg}</span>
            </div>
          )}

          {/* Audit Issues List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white text-sm">Security Findings</h3>

            {issues.length === 0 ? (
              <div className="p-8 text-center bg-[#0b0f19] border border-[#1f2942] rounded-xl text-emerald-400 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8" />
                <span className="font-semibold text-sm">No Security Warnings</span>
                <span className="text-gray-400 text-xs">
                  All ~/.ssh directory and key permissions match standard Unix security policies (700 / 600).
                </span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 bg-[#0b0f19] ${
                      issue.severity === "critical"
                        ? "border-rose-500/30"
                        : issue.severity === "warning"
                        ? "border-amber-500/30"
                        : "border-blue-500/30"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {issue.severity === "critical" ? (
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                      ) : issue.severity === "warning" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-400" />
                      )}
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">
                          {issue.title}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-mono font-semibold ${
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

                      <p className="text-gray-400 text-[11px] leading-relaxed">
                        {issue.description}
                      </p>

                      {issue.path && (
                        <div className="text-[10px] font-mono text-gray-500 mt-1">
                          Target path: {issue.path}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
