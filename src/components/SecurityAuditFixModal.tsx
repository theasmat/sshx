import { toast } from "../utils/toast";
import React, { useState, useEffect, useMemo } from "react";
import { BsCheckCircleFill, BsWrench } from "react-icons/bs";
import { Button, Dialog, Group, Segmented } from "./ui";
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
      toast.error(`Failed to apply security fixes: ${err}`);
    } finally {
      setIsApplying(false);
    }
  };

  const selectedCount = fixableIssues.filter((i, idx) => selectedIds.has(i.id || `issue_${idx}`)).length;

  return (
    <Dialog
      size="lg"
      title="Review fixes"
      subtitle={`${fixableIssues.length} fixable`}
      onClose={onClose}
      footer={
        <>
          <span className="mr-auto text-xs text-label-3">
            {fixResult ? "All actions executed." : `${selectedCount} of ${fixableIssues.length} selected`}
          </span>
          <Button onClick={onClose}>{fixResult ? "Close" : "Cancel"}</Button>
          {!fixResult && (
            <Button variant="primary" icon={<BsWrench />} onClick={handleApplySelected} disabled={selectedCount === 0 || isApplying}>
              {isApplying ? `Applying ${selectedCount}...` : `Apply ${selectedCount} ${selectedCount === 1 ? "Fix" : "Fixes"}`}
            </Button>
          )}
        </>
      }
    >
      {fixResult ? (
        <div className="space-y-4 text-[13px]">
          <div role="status" className="rounded-card bg-emerald-500/10 px-4 py-4 text-center space-y-1">
            <BsCheckCircleFill className="w-6 h-6 mx-auto text-emerald-400" />
            <div className="font-medium text-label">
              {fixResult.fixed_count} {fixResult.fixed_count === 1 ? "fix" : "fixes"} applied
            </div>
            <div className="text-label-2">
              New security score <span className="font-medium text-emerald-300 tabular-nums">{fixResult.report.score}%</span>
            </div>
          </div>
          {fixResult.messages.length > 0 && (
            <Group title="Applied changes">
              {fixResult.messages.map((msg, idx) => (
                <div key={idx} className="px-4 py-2.5 text-label-2">
                  {msg}
                </div>
              ))}
            </Group>
          )}
        </div>
      ) : (
        <div className="space-y-4 text-[13px]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Segmented
              label="Category"
              value={categoryFilter}
              options={[
                { value: "all" as const, label: `All (${fixableIssues.length})` },
                { value: "permissions" as const, label: "Permissions" },
                { value: "syntax" as const, label: "Syntax" },
              ]}
              onChange={setCategoryFilter}
            />
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleSelectAll} className="text-accent hover:underline cursor-pointer">
                Select all
              </button>
              <button type="button" onClick={handleDeselectAll} className="text-accent hover:underline cursor-pointer">
                Deselect all
              </button>
            </div>
          </div>

          {filteredFixable.length === 0 ? (
            <div className="rounded-card bg-card px-4 py-6 text-center text-label-3">No fixable issues in this category.</div>
          ) : (
            <div className="rounded-card bg-card divide-y divide-white/[0.06] overflow-hidden">
              {filteredFixable.map((issue, idx) => {
                const issueId = issue.id || `issue_${idx}`;
                const isChecked = selectedIds.has(issueId);
                return (
                  <label key={issueId} className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-white/[0.03]">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelect(issueId)}
                      className="mt-1 w-4 h-4 accent-[#0a84ff] cursor-pointer"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="text-label font-medium">{issue.title}</div>
                      <p className="text-label-2 leading-relaxed">{issue.description}</p>
                      {issue.fix_preview && (
                        <div className="font-mono text-xs text-label-3">Will run: {issue.fix_preview}</div>
                      )}
                      {issue.path && <div className="font-mono text-xs text-label-3 truncate">{issue.path}</div>}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {nonFixableIssues.length > 0 && (
            <Group title={`Needs your decision (${nonFixableIssues.length})`}>
              {nonFixableIssues.map((issue, idx) => (
                <div key={idx} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-label font-medium">{issue.title}</div>
                    <div className="text-xs text-label-2">{issue.description}</div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    {(issue.title.includes("Legacy") || issue.title.includes("Weak")) && onGenerateKey && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onGenerateKey(issue.title);
                        }}
                        className="text-accent hover:underline cursor-pointer"
                      >
                        Generate Ed25519
                      </button>
                    )}
                    {issue.title.includes("Duplicate") && onSelectTab && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectTab("hosts");
                        }}
                        className="text-accent hover:underline cursor-pointer"
                      >
                        Go to Hosts
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </Group>
          )}
        </div>
      )}
    </Dialog>
  );
};
