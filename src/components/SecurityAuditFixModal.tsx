import React, { useState, useEffect, useMemo } from "react";
import {
  BsExclamationTriangleFill,
  BsCheckCircleFill,
  BsCheckSquareFill,
  BsSquare,
  BsWrench,
  BsXLg,
  BsArrowRepeat,
  BsFolder2Open,
  BsStars,
  BsArrowRight,
} from "react-icons/bs";
import { AuditIssue, SelectiveFixRequest, SelectiveFixResponse, NavTab } from "../types";
import { api } from "../api";

interface SecurityAuditFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  issues: AuditIssue[];
  onFixApplied: (response: SelectiveFixResponse) => void;
  onSelectTab?: (tab: NavTab) => void;
  onGenerateKey?: (keyTitle: string) => void;
}

export const SecurityAuditFixModal: React.FC<SecurityAuditFixModalProps> = ({
  isOpen,
  onClose,
  issues,
  onFixApplied,
  onSelectTab,
  onGenerateKey,
}) => {
  const fixableIssues = useMemo(() => issues.filter((i) => i.fixable), [issues]);
  const nonFixableIssues = useMemo(() => issues.filter((i) => !i.fixable), [issues]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [fixResult, setFixResult] = useState<SelectiveFixResponse | null>(null);

  // Initialize all fixable items as selected by default when modal opens
  useEffect(() => {
    if (isOpen) {
      const allIds = new Set<string>();
      fixableIssues.forEach((issue, idx) => {
        allIds.add(issue.id || `issue_${idx}`);
      });
      setSelectedIds(allIds);
      setFixResult(null);
    }
  }, [isOpen, fixableIssues]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds = new Set<string>();
    fixableIssues.forEach((issue, idx) => {
      allIds.add(issue.id || `issue_${idx}`);
    });
    setSelectedIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const filteredFixable = fixableIssues.filter((issue) => {
    if (categoryFilter === "all") return true;
    if (categoryFilter === "permissions") return issue.category === "permissions" || issue.fix_action?.includes("perm");
    if (categoryFilter === "syntax") return issue.category === "syntax" || issue.fix_action?.includes("syntax");
    return true;
  });

  const handleApplySelected = async () => {
    const selectedList: SelectiveFixRequest[] = fixableIssues
      .filter((issue, idx) => selectedIds.has(issue.id || `issue_${idx}`) && issue.fix_action)
      .map((issue, idx) => ({
        id: issue.id || `issue_${idx}`,
        fix_action: issue.fix_action!,
        path: issue.path || null,
      }));

    if (selectedList.length === 0) return;

    setIsApplying(true);
    try {
      const res = await api.fixSelectedSecurityIssues(selectedList);
      setFixResult(res);
      onFixApplied(res);
    } catch (err: any) {
      alert(`Failed to apply security fixes: ${err}`);
    } finally {
      setIsApplying(false);
    }
  };

  const selectedCount = fixableIssues.filter((i, idx) => selectedIds.has(i.id || `issue_${idx}`)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-2xl bg-[#0b0f19] border border-[#1f2942] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1f2942] bg-[#0e1422] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-sm">
              <BsWrench className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Security & Permissions Auto-Fix</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                  {fixableIssues.length} Fixable
                </span>
              </div>
              <p className="text-gray-400 text-[11px]">
                Review what will be changed and check or uncheck individual fixes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <BsXLg className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
          {fixResult ? (
            /* Results Screen */
            <div className="space-y-4 py-2">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg">
                  <BsCheckCircleFill className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white text-sm">
                  {fixResult.fixed_count} Security {fixResult.fixed_count === 1 ? "Fix" : "Fixes"} Applied Successfully!
                </h4>
                <p className="text-gray-300 text-xs">
                  Your SSH configuration and permissions have been updated. New security score:{" "}
                  <span className="font-bold text-emerald-400 font-mono">{fixResult.report.score}%</span>
                </p>
              </div>

              {fixResult.messages.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Applied Changes
                  </div>
                  <div className="bg-[#070a10] border border-[#1f2942] rounded-xl p-2.5 space-y-1.5 font-mono text-[11px]">
                    {fixResult.messages.map((msg, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-emerald-300">
                        <BsCheckCircleFill className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Selection Screen */
            <>
              {/* Filter & Selection Bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-[#1f2942]/60">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("all")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                      categoryFilter === "all"
                        ? "bg-emerald-600 text-white font-bold"
                        : "bg-[#161d30] text-gray-300 hover:bg-[#1f2942]"
                    }`}
                  >
                    All ({fixableIssues.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("permissions")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                      categoryFilter === "permissions"
                        ? "bg-emerald-600 text-white font-bold"
                        : "bg-[#161d30] text-gray-300 hover:bg-[#1f2942]"
                    }`}
                  >
                    Permissions
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("syntax")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                      categoryFilter === "syntax"
                        ? "bg-emerald-600 text-white font-bold"
                        : "bg-[#161d30] text-gray-300 hover:bg-[#1f2942]"
                    }`}
                  >
                    Config Syntax
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-gray-600">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-[11px] text-gray-400 hover:text-gray-300 font-medium cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Fixable Items Checklist */}
              <div className="space-y-2">
                {filteredFixable.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 bg-[#070a10] border border-[#1f2942] rounded-xl">
                    No fixable issues found in this category.
                  </div>
                ) : (
                  filteredFixable.map((issue, idx) => {
                    const issueId = issue.id || `issue_${idx}`;
                    const isChecked = selectedIds.has(issueId);

                    return (
                      <div
                        key={issueId}
                        onClick={() => toggleSelect(issueId)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? "bg-[#0e1627] border-emerald-500/40 shadow-sm"
                            : "bg-[#070a10] border-[#1f2942] opacity-75 hover:opacity-100 hover:border-gray-700"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <div className="mt-0.5 shrink-0">
                            {isChecked ? (
                              <BsCheckSquareFill className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <BsSquare className="w-4 h-4 text-gray-500" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-bold text-xs ${isChecked ? "text-white" : "text-gray-300"}`}>
                                {issue.title}
                              </span>

                              {issue.category && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                  {issue.category}
                                </span>
                              )}

                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                                  issue.severity === "critical"
                                    ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                    : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                }`}
                              >
                                {issue.severity}
                              </span>
                            </div>

                            <p className="text-gray-400 text-[11px] leading-relaxed">
                              {issue.description}
                            </p>

                            {/* Action Preview / Command Pill */}
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              {issue.fix_preview && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#04060a] border border-emerald-500/20 text-emerald-300 rounded font-mono text-[10px]">
                                  <BsWrench className="w-2.5 h-2.5 text-emerald-400" />
                                  <span>Action: {issue.fix_preview}</span>
                                </div>
                              )}

                              {issue.path && (
                                <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                                  <BsFolder2Open className="w-2.5 h-2.5" />
                                  <span className="truncate max-w-xs">{issue.path}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Non-Fixable / Manual Guidance Section */}
              {nonFixableIssues.length > 0 && (
                <div className="pt-2 border-t border-[#1f2942]/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400">
                    <span>Manual Recommendations ({nonFixableIssues.length})</span>
                    <span className="text-[10px] text-gray-500 font-normal">Require user decision</span>
                  </div>

                  <div className="space-y-1.5">
                    {nonFixableIssues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#070a10] border border-[#1f2942] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <BsExclamationTriangleFill className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <div className="font-semibold text-gray-200 text-[11px]">{issue.title}</div>
                            <div className="text-gray-400 text-[10px]">{issue.description}</div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="shrink-0">
                          {(issue.title.includes("Legacy") || issue.title.includes("Weak")) && onGenerateKey && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onGenerateKey(issue.title);
                              }}
                              className="flex items-center gap-1 px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 rounded text-[10px] font-medium transition-colors cursor-pointer"
                            >
                              <BsStars className="w-2.5 h-2.5" />
                              <span>Generate Ed25519</span>
                            </button>
                          )}

                          {issue.title.includes("Duplicate") && onSelectTab && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onSelectTab("hosts");
                              }}
                              className="flex items-center gap-1 px-2 py-1 bg-[#161d30] hover:bg-[#1f2942] text-blue-300 border border-[#232f4d] rounded text-[10px] font-medium transition-colors cursor-pointer"
                            >
                              <span>Hosts</span>
                              <BsArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1f2942] bg-[#0e1422] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-400 font-mono">
            {fixResult
              ? "All actions executed safely."
              : `${selectedCount} of ${fixableIssues.length} fixes selected`}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-lg border border-[#232f4d] font-medium text-xs transition-colors cursor-pointer"
            >
              {fixResult ? "Close" : "Cancel"}
            </button>

            {!fixResult && (
              <button
                type="button"
                onClick={handleApplySelected}
                disabled={selectedCount === 0 || isApplying}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isApplying ? (
                  <>
                    <BsArrowRepeat className="w-3.5 h-3.5 animate-spin" />
                    <span>Applying {selectedCount} Fixes...</span>
                  </>
                ) : (
                  <>
                    <BsWrench className="w-3.5 h-3.5" />
                    <span>Apply {selectedCount} Selected {selectedCount === 1 ? "Fix" : "Fixes"}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
