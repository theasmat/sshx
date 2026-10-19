import { toast } from "../utils/toast";
import React, { useState } from "react";
import {
  BsCheckCircleFill,
  BsExclamationCircleFill,
  BsClock,
  BsWrench,
  BsCheckLg,
  BsArrowClockwise,
  BsKeyFill,
  BsBoxArrowUpRight,
} from "react-icons/bs";
import { Button, Dialog } from "./ui";
import { SshTestResult, SshHost, SshKeyInfo } from "../types";
import { api } from "../api";
import { getGitProviderInfo } from "../utils/hostUtils";
import { openUrl } from "@tauri-apps/plugin-opener";

interface TestResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostAlias: string;
  /** Full host entry when available — used for provider-aware advice. */
  host?: SshHost | null;
  /** Key configured for the host (matched via IdentityFile), if any. */
  keyInfo?: SshKeyInfo | null;
  result: SshTestResult | null;
  isLoading: boolean;
  onRetest?: (hostAlias: string) => void;
}

export const TestResultModal: React.FC<TestResultModalProps> = ({
  isOpen,
  onClose,
  hostAlias,
  host,
  keyInfo,
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

  // Git hosting providers (GitHub/GitLab/Bitbucket) never accept ssh-copy-id —
  // the public key must be registered in the provider's web settings instead.
  const gitProvider = getGitProviderInfo(host || null);

  const handleOpenProviderSettings = async () => {
    if (!gitProvider?.settingsUrl) return;
    try {
      await openUrl(gitProvider.settingsUrl);
    } catch {
      window.open(gitProvider.settingsUrl, "_blank");
    }
  };

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
      toast.error(`Auto-fix failed: ${err}`);
    } finally {
      setIsFixingHost(false);
    }
  };

  return (
    <Dialog
      title={`Test ${hostAlias}`}
      subtitle={`ssh -T ${hostAlias}`}
      onClose={onClose}
      footer={
        <>
          {onRetest && result && (
            <Button icon={<BsArrowClockwise className={isLoading ? "animate-spin" : ""} />} onClick={() => onRetest(hostAlias)} disabled={isLoading}>
              Retest
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="py-10 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-label-2">Testing connection to {hostAlias}...</p>
        </div>
      ) : result ? (
        <div className="space-y-3 text-[13px]">
          <div
            className={`px-4 py-3 rounded-card flex items-center justify-between ${
              result.success ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {result.success ? <BsCheckCircleFill className="shrink-0" /> : <BsExclamationCircleFill className="shrink-0" />}
              <span>{result.success ? "Connected and authenticated" : "Connection or authentication failed"}</span>
            </div>
            <div className="flex items-center gap-1 text-xs opacity-80 tabular-nums">
              <BsClock />
              <span>{result.duration_ms} ms</span>
            </div>
          </div>

          {isHostKeyMismatch && (
            <div className="rounded-card bg-amber-500/10 px-4 py-3 space-y-2">
              <div className="flex items-center gap-2 font-medium text-amber-200">
                <BsWrench />
                <span>Stale remote host key</span>
              </div>
              <p className="text-label-2 leading-relaxed">
                The server was reinstalled or changed its key, so SSH blocked the connection to protect you from spoofing.
              </p>
              <Button type="button" variant="primary" icon={<BsWrench />} disabled={isFixingHost} onClick={handleAutoFixHostKey}>
                {isFixingHost ? "Removing stale key..." : "Remove stale key and retest"}
              </Button>
            </div>
          )}

          {isPermissionDenied && !isHostKeyMismatch && (
            <div className="rounded-card bg-accent/10 px-4 py-3 space-y-2">
              <div className="flex items-center gap-2 font-medium text-label">
                <BsKeyFill className="text-accent" />
                <span>Key setup</span>
              </div>
              {gitProvider ? (
                <div className="space-y-2">
                  <p className="text-label-2 leading-relaxed">
                    {gitProvider.name} rejected the key, so it is not registered on your {gitProvider.name} account yet.
                    ssh-copy-id does not work with {gitProvider.name}: add the public key in its SSH settings, then retest.
                  </p>
                  {keyInfo && (
                    <div className="rounded-ctl bg-black/25 px-3 py-2 space-y-0.5">
                      <div className="text-xs text-label-3">
                        This host offers <code className="font-mono text-label-2">{keyInfo.file_name}</code>:
                      </div>
                      <div className="font-mono text-xs text-label break-all select-all">{keyInfo.fingerprint_sha256}</div>
                      <div className="text-xs text-label-3">
                        Compare with the keys in your {gitProvider.name} settings. If it is missing, that is the problem.
                      </div>
                    </div>
                  )}
                  {gitProvider.settingsUrl && (
                    <Button type="button" icon={<BsBoxArrowUpRight />} onClick={handleOpenProviderSettings}>
                      {gitProvider.settingsLabel || `Open ${gitProvider.name} SSH settings`}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-label-2 leading-relaxed">
                  The server rejected the key. Use “Install key (ssh-copy-id)” from the host's More menu to add your public key.
                </p>
              )}
            </div>
          )}

          {fixSuccessMsg && (
            <div role="status" className="rounded-ctl bg-emerald-500/10 text-emerald-300 px-3 py-2 flex items-center gap-2">
              <BsCheckLg className="shrink-0" />
              <span>{fixSuccessMsg}</span>
            </div>
          )}

          <div>
            <div className="px-1 mb-1 text-[11px] font-medium uppercase tracking-wide text-label-3">Output</div>
            <pre className="bg-well rounded-card p-3 font-mono text-xs text-label-2 max-h-44 overflow-y-auto whitespace-pre-wrap select-all leading-relaxed">
              {result.output || "(no output received from remote host)"}
            </pre>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
};
