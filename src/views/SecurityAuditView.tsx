import { toast } from "../utils/toast";
import React, { useState } from "react";
import {
  BsShieldCheck,
  BsCheckCircleFill,
  BsWrench,
  BsArrowClockwise,
  BsPlusLg,
} from "react-icons/bs";
import { SecurityAuditReport, NavTab } from "../types";
import { api } from "../api";
import { Button, Group } from "../components/ui";
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
      toast.error(`Failed to generate replacement key: ${err}`);
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

  const scoreColor = score === 100 ? "text-emerald-400" : score >= 80 ? "text-amber-400" : "text-rose-400";
  const dot = (sev: string) => (sev === "critical" ? "bg-rose-400" : sev === "warning" ? "bg-amber-400" : "bg-accent");

  return (
    <div className="h-full flex flex-col bg-app text-[13px] select-none overflow-hidden">
      <div className="px-5 h-12 flex items-center justify-between shrink-0">
        <h2 className="text-[15px] font-semibold text-label">Security Audit</h2>
        <div className="flex items-center gap-2">
          {onOpenAddHost && (
            <Button variant="plain" icon={<BsPlusLg />} onClick={onOpenAddHost}>
              New Host
            </Button>
          )}
          <Button icon={<BsArrowClockwise className={isLoading ? "animate-spin" : ""} />} onClick={onRefresh} disabled={isLoading}>
            Re-run
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="rounded-card bg-card px-6 py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-5 min-w-0">
              <div className={`text-5xl font-semibold tabular-nums tracking-tight ${scoreColor}`}>{score}%</div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-label">
                  {score === 100 ? "Everything looks secure" : `${issues.length} ${issues.length === 1 ? "issue" : "issues"} found`}
                </h3>
                <p className="text-label-2">
                  Scanned {report?.total_hosts ?? 0} hosts and {report?.total_keys ?? 0} keys.
                </p>
              </div>
            </div>
            {fixableCount > 0 && (
              <Button variant="primary" icon={<BsWrench />} onClick={() => setIsFixModalOpen(true)} className="shrink-0">
                Review &amp; Fix ({fixableCount})
              </Button>
            )}
          </div>

          {fixSuccessMsg && (
            <div role="status" className="rounded-ctl bg-emerald-500/10 text-emerald-300 px-3 py-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BsCheckCircleFill className="shrink-0" />
                {fixSuccessMsg}
              </span>
              <button onClick={() => setFixSuccessMsg(null)} aria-label="Dismiss" className="text-label-3 hover:text-label cursor-pointer">
                ✕
              </button>
            </div>
          )}

          {generatedKeyMsg && (
            <Group title={`Replacement key ~/.ssh/${generatedKeyMsg.fileName} generated`}>
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <span className="font-mono text-label-2 truncate">{generatedKeyMsg.pubKey}</span>
                <button onClick={handleCopyGeneratedPub} className="text-accent hover:underline cursor-pointer shrink-0">
                  {copiedKey ? "Copied" : "Copy .pub"}
                </button>
              </div>
            </Group>
          )}

          <section className="space-y-1.5">
            <h3 className="px-1 text-[11px] font-medium uppercase tracking-wide text-label-3">Findings</h3>
            {issues.length === 0 ? (
              <div className="rounded-card bg-card px-6 py-8 text-center space-y-1">
                <BsShieldCheck className="w-7 h-7 mx-auto text-emerald-400" />
                <div className="font-medium text-label">No findings</div>
                <div className="text-label-2">Permissions and keys follow standard SSH policy.</div>
              </div>
            ) : (
              <div className="rounded-card bg-card divide-y divide-white/[0.06] overflow-hidden">
                {issues.map((issue, idx) => (
                  <div key={idx} className="px-4 py-3 flex items-start gap-3">
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dot(issue.severity)}`} aria-label={issue.severity} />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="font-medium text-label">{issue.title}</div>
                      <p className="text-label-2 leading-relaxed">{issue.description}</p>
                      {issue.path && <div className="font-mono text-xs text-label-3 truncate">{issue.path}</div>}
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                      {issue.fixable && (
                        <button onClick={() => setIsFixModalOpen(true)} className="text-accent hover:underline cursor-pointer">
                          Fix
                        </button>
                      )}
                      {(issue.title.includes("Legacy") || issue.title.includes("Weak")) && (
                        <button
                          onClick={() => handleGenerateReplacementKey(issue.title)}
                          disabled={isGeneratingKey}
                          className="text-accent hover:underline disabled:opacity-50 cursor-pointer"
                        >
                          Generate Ed25519
                        </button>
                      )}
                      {issue.title.includes("Duplicate") && onSelectTab && (
                        <button onClick={() => onSelectTab("hosts")} className="text-accent hover:underline cursor-pointer">
                          Go to Hosts
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
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
