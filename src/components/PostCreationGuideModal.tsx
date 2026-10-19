import { Button, Dialog } from "./ui";
import React, { useState, useEffect, useMemo } from "react";
import {
  BsCheckCircleFill,
  BsCopy,
  BsCheckLg,
  BsBoxArrowUpRight,
  BsKeyFill,
  BsTerminalFill,
  BsExclamationTriangleFill,
  BsPlayFill,
  BsShieldLockFill,
  BsCloudUploadFill,
  BsArrowRepeat,
  BsGearFill,
} from "react-icons/bs";
import { SshHost, SshKeyInfo, PresetTemplate, PostCreationGuide, SshTestResult } from "../types";
import { openUrl } from "@tauri-apps/plugin-opener";
import { api } from "../api";

interface PostCreationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  host?: SshHost | null;
  keyInfo?: SshKeyInfo | null;
  publicKeyContent?: string | null;
  preset?: PresetTemplate | null;
  onConnect?: (host: SshHost) => void;
  onOpenRawConfig?: () => void;
}

export const PostCreationGuideModal: React.FC<PostCreationGuideModalProps> = ({
  isOpen,
  onClose,
  host,
  keyInfo,
  publicKeyContent,
  preset,
  onConnect,
  onOpenRawConfig,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedTestCmd, setCopiedTestCmd] = useState(false);
  const [copiedCloneCmd, setCopiedCloneCmd] = useState(false);
  const [copiedRemoteCmd, setCopiedRemoteCmd] = useState(false);
  const [copiedManualCmd, setCopiedManualCmd] = useState(false);

  // Stepper completed states
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // Agent load status
  const [agentLoaded, setAgentLoaded] = useState<boolean>(keyInfo?.is_agent_loaded ?? true);
  const [isAddingToAgent, setIsAddingToAgent] = useState(false);
  const [agentMsg, setAgentMsg] = useState<string | null>(null);

  // In-app test execution
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<SshTestResult | null>(null);

  // 1-Click ssh-copy-id execution
  const [isInstallingKey, setIsInstallingKey] = useState(false);
  const [installResult, setInstallResult] = useState<SshTestResult | null>(null);

  // Reset states on open or host change
  useEffect(() => {
    if (isOpen) {
      setCopiedKey(false);
      setCopiedTestCmd(false);
      setCopiedCloneCmd(false);
      setCopiedRemoteCmd(false);
      setCopiedManualCmd(false);
      setTestResult(null);
      setInstallResult(null);
      setAgentLoaded(keyInfo?.is_agent_loaded ?? true);
      setAgentMsg(null);
      setCompletedSteps({ 0: true }); // Step 0 (Key ready) is done by default
    }
  }, [isOpen, host, keyInfo]);

  // Keyboard shortcut listener (Cmd/Ctrl+C to copy key, Esc to close)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Safe host properties
  const safeHostPattern = host?.host_pattern || "my-host";
  const safeHostName = host?.host_name || safeHostPattern;
  const safeUser = host?.user || "root";
  const safePort = host?.port || 22;
  const safeProxyJump = host?.proxy_jump || "bastion-host";

  // Variable substitution helper
  const replaceVars = (text?: string): string => {
    if (!text) return "";
    return text
      .replace(/\{host_pattern\}/g, safeHostPattern)
      .replace(/\{host_name\}/g, safeHostName)
      .replace(/\{user\}/g, safeUser)
      .replace(/\{port\}/g, String(safePort))
      .replace(/\{proxy_jump\}/g, safeProxyJump);
  };

  // Derive active guide data (from preset or fallback heuristics)
  const guideData: PostCreationGuide = useMemo(() => {
    if (preset?.postCreationGuide) {
      return preset.postCreationGuide;
    }

    const hostName = (host?.host_name || "").toLowerCase();
    const hostPattern = (host?.host_pattern || "").toLowerCase();
    const hostUser = (host?.user || "").toLowerCase();
    const hostTags = Array.isArray(host?.tags) ? host.tags : [];
    const localForward = Array.isArray(host?.local_forward) ? host.local_forward : [];

    // Heuristics fallback
    const isGit =
      hostName.includes("github.com") ||
      hostName.includes("gitlab.com") ||
      hostName.includes("bitbucket.org") ||
      hostUser === "git" ||
      hostTags.some((t) => ["git", "github", "gitlab"].includes((t || "").toLowerCase()));

    const isTunnel = localForward.length > 0;
    const isBastion = Boolean(host?.proxy_jump || host?.proxy_command);

    if (isGit) {
      const isGH = hostName.includes("github.com") || hostPattern.includes("github");
      const isGL = hostName.includes("gitlab.com") || hostPattern.includes("gitlab");
      return {
        platform: isGH ? "github" : isGL ? "gitlab" : "custom",
        settingsUrl: isGH
          ? "https://github.com/settings/ssh/new"
          : isGL
          ? "https://gitlab.com/-/user_settings/ssh_keys"
          : undefined,
        settingsLabel: isGH ? "Open GitHub → SSH Keys" : isGL ? "Open GitLab → SSH Keys" : undefined,
        steps: [
          "Copy your public key using the button above.",
          `Open your Git provider settings and add a new SSH key titled "${safeHostPattern}".`,
          "Paste the public key and confirm.",
          "Test connection using the Test Connection button below.",
        ],
        testCommand: `ssh -T ${safeHostPattern}`,
        gitRemoteRewrite: {
          pattern: `git@${safeHostPattern}:`,
          example: `git clone git@${safeHostPattern}:username/repo.git`,
        },
        warnings: [
          "If your Git provider rejects the key as duplicate, generate a unique key dedicated to this account.",
        ],
        skipKeyInstall: true,
      };
    }

    if (isTunnel) {
      return {
        platform: "tunnel",
        steps: [
          "Authorize your SSH key on the gateway server ({host_name}).",
          "Open the tunnel: ssh -N {host_pattern}",
          "Connect your local client to the forwarded local port.",
        ],
        testCommand: `ssh -N ${safeHostPattern}`,
        warnings: ["Use 'ssh -N' to keep the port forwarding active in the background."],
      };
    }

    if (isBastion) {
      return {
        platform: "bastion",
        steps: [
          "Ensure your SSH key is authorized on BOTH the bastion ({proxy_jump}) AND the destination host ({host_name}).",
          "Test transparent jump with: ssh {host_pattern}",
        ],
        testCommand: `ssh ${safeHostPattern}`,
        warnings: [
          "Both the jump server and destination host verify authentication independently.",
        ],
      };
    }

    // Generic cloud / server fallback
    return {
      platform: "cloud",
      steps: [
        "Copy your public key or install it directly using the 1-click ssh-copy-id tool below.",
        "Append the public key to ~/.ssh/authorized_keys on the remote server.",
        "Connect in terminal using: ssh {host_pattern}",
      ],
      testCommand: `ssh ${safeHostPattern}`,
      warnings: [
        "If ssh-copy-id fails with config syntax errors, inspect your ~/.ssh/config using the Troubleshooting panel.",
      ],
    };
  }, [preset, host, safeHostPattern]);

  const configErrorParsed = useMemo(() => {
    const output = installResult?.output || testResult?.output || "";
    if (
      output.includes("Bad configuration option") ||
      output.includes("no argument after keyword") ||
      output.includes("line ") ||
      output.includes(".ssh/config line")
    ) {
      const matchLine = output.match(/line (\d+)/i);
      const matchKeyword = output.match(/keyword "([^"]+)"/i) || output.match(/option:?\s+([a-zA-Z0-9_-]+)/i);
      return {
        isConfigError: true,
        lineNumber: matchLine ? matchLine[1] : null,
        keyword: matchKeyword ? matchKeyword[1] : null,
        rawText: output,
      };
    }
    return { isConfigError: false, lineNumber: null, keyword: null, rawText: "" };
  }, [installResult, testResult]);

  if (!isOpen) return null;

  const hasKey = Boolean(publicKeyContent || keyInfo?.public_key_content || host?.identity_file);
  const pubKey =
    publicKeyContent ||
    keyInfo?.public_key_content ||
    (host?.identity_file ? `ssh-ed25519 AAAAC3... (${host.identity_file.split("/").pop() || "key"})` : "");

  const keyFileName =
    keyInfo?.file_name ||
    (host?.identity_file ? host.identity_file.split("/").pop() || "id_ed25519" : "id_ed25519");

  const testCmdString = replaceVars(guideData?.testCommand || `ssh -T ${safeHostPattern}`);

  const handleCopyPubKey = () => {
    if (!pubKey) return;
    navigator.clipboard.writeText(pubKey);
    setCopiedKey(true);
    setCompletedSteps((prev) => ({ ...prev, 1: true }));
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyTestCmd = () => {
    navigator.clipboard.writeText(testCmdString);
    setCopiedTestCmd(true);
    setTimeout(() => setCopiedTestCmd(false), 2000);
  };

  const handleCopyClone = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCloneCmd(true);
    setTimeout(() => setCopiedCloneCmd(false), 2000);
  };

  const handleCopyRemote = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedRemoteCmd(true);
    setTimeout(() => setCopiedRemoteCmd(false), 2000);
  };

  const handleCopyManualCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedManualCmd(true);
    setTimeout(() => setCopiedManualCmd(false), 2000);
  };

  const handleOpenExternal = async (url: string) => {
    try {
      await openUrl(url);
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleAddToAgent = async () => {
    if (!keyInfo?.private_path) return;
    setIsAddingToAgent(true);
    setAgentMsg(null);
    try {
      const msg = await api.addKeyToAgent(keyInfo.private_path);
      setAgentLoaded(true);
      setAgentMsg(msg || "Key loaded into ssh-agent successfully!");
    } catch (err: any) {
      setAgentMsg(`Failed: ${err}`);
    } finally {
      setIsAddingToAgent(false);
    }
  };

  const handleRunTest = async () => {
    if (!host?.host_pattern) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testHostConnection(host.host_pattern);
      setTestResult(res);
      if (res.success) {
        setCompletedSteps((prev) => ({ ...prev, 3: true }));
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        exit_code: null,
        output: `Error running test: ${err}`,
        duration_ms: 0,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunDirectTest = async () => {
    if (!host) return;
    const directHost = (host.host_name || "").trim();
    if (!directHost) {
      setTestResult({
        success: false,
        exit_code: null,
        output: "Direct test unavailable: this host has no HostName/IP configured.",
        duration_ms: 0,
      });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testDirectConnection(
        directHost,
        host.user || undefined,
        host.port || undefined,
        host.identity_file || undefined
      );
      setTestResult(res);
      if (res.success) {
        setCompletedSteps((prev) => ({ ...prev, 3: true }));
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        exit_code: null,
        output: `Direct test execution error: ${err}`,
        duration_ms: 0,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleInstallKey = async () => {
    if (!host?.host_pattern) return;
    setIsInstallingKey(true);
    setInstallResult(null);
    try {
      const res = await api.installKeyToRemote(
        host.host_pattern,
        host.identity_file || undefined
      );
      setInstallResult(res);
      if (res.success) {
        setCompletedSteps((prev) => ({ ...prev, 2: true }));
      }
    } catch (err: any) {
      setInstallResult({
        success: false,
        exit_code: null,
        output: `Error installing key: ${err}`,
        duration_ms: 0,
      });
    } finally {
      setIsInstallingKey(false);
    }
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const hostUserPrefix = host?.user ? `${host.user}@` : "";
  const hostPortPrefix = host?.port && host.port !== 22 ? `-p ${host.port} ` : "";

  const manualSshInstallCmd = `cat ~/.ssh/${keyFileName}.pub | ssh ${hostPortPrefix}${hostUserPrefix}${safeHostName} "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"`;

  const progress = [
    { done: completedSteps[0], label: "Key" },
    { done: completedSteps[1], label: "Copy" },
    { done: completedSteps[2], label: "Authorize" },
    { done: completedSteps[3], label: "Test" },
  ];

  const resultBox = (ok: boolean, title: string, output?: string, ms?: number) => (
    <div role="status" className={`rounded-card px-4 py-3 space-y-1.5 ${ok ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>
      <div className="flex items-center justify-between font-medium">
        <span className="flex items-center gap-2">
          {ok ? <BsCheckCircleFill className="shrink-0" /> : <BsExclamationTriangleFill className="shrink-0" />}
          {title}
        </span>
        {ms ? <span className="text-xs opacity-80 tabular-nums">{ms} ms</span> : null}
      </div>
      {output && (
        <pre className="font-mono text-xs p-2.5 bg-black/30 rounded-ctl overflow-x-auto whitespace-pre-wrap text-label-2">{output}</pre>
      )}
    </div>
  );

  const codeLine = (text: React.ReactNode, onCopy: () => void, copied: boolean) => (
    <div className="flex items-center gap-3 rounded-ctl bg-well px-3 py-2">
      <code className="font-mono text-xs text-label flex-1 overflow-x-auto whitespace-nowrap">{text}</code>
      <button type="button" onClick={onCopy} className="text-accent hover:underline cursor-pointer shrink-0 text-xs">
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );

  const heading = "px-1 text-[11px] font-medium uppercase tracking-wide text-label-3";

  return (
    <Dialog
      size="lg"
      title="Setup guide"
      subtitle={`${safeHostPattern}${preset?.badge ? ` · ${preset.badge}` : ""}`}
      onClose={onClose}
      footer={
        <>
          {hasKey && (
            <Button type="button" icon={copiedKey ? <BsCheckLg /> : <BsCopy />} onClick={handleCopyPubKey}>
              {copiedKey ? "Copied" : "Copy Key"}
            </Button>
          )}
          {onConnect && host && (
            <Button
              type="button"
              icon={<BsTerminalFill />}
              onClick={() => {
                onClose();
                onConnect(host);
              }}
            >
              Connect in Terminal
            </Button>
          )}
          <Button type="button" variant="primary" onClick={onClose}>
            Done
          </Button>
        </>
      }
    >
      <div className="space-y-5 text-[13px]">
        <ol className="flex items-center gap-2 text-xs" aria-label="Progress">
          {progress.map((p, i) => (
            <li key={p.label} className="flex items-center gap-2">
              <span className={`flex items-center gap-1 ${p.done ? "text-emerald-300" : "text-label-3"}`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${p.done ? "bg-emerald-500/25" : "bg-white/[0.08]"}`}>
                  {p.done ? <BsCheckLg /> : i + 1}
                </span>
                {p.label}
              </span>
              {i < progress.length - 1 && <span className="text-label-3">·</span>}
            </li>
          ))}
        </ol>

        {!hasKey && (
          <div className="rounded-card bg-accent/10 px-4 py-3 space-y-1">
            <div className="flex items-center gap-2 font-medium text-label">
              <BsShieldLockFill className="text-accent" /> Using default agent keys
            </div>
            <p className="text-label-2 leading-relaxed">
              This host has no explicit <code className="font-mono text-label">IdentityFile</code>. OpenSSH will use keys loaded in your
              agent or default identities (<code className="font-mono text-label">~/.ssh/id_rsa</code>,{" "}
              <code className="font-mono text-label">id_ed25519</code>).
            </p>
          </div>
        )}

        {hasKey && (
          <section className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className={heading}>Public key · {keyFileName}.pub</h4>
              <button type="button" onClick={handleCopyPubKey} className="text-accent hover:underline cursor-pointer text-xs">
                {copiedKey ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-3 bg-well rounded-card font-mono text-xs text-label-2 overflow-x-auto leading-relaxed select-all">{pubKey}</pre>
            {!agentLoaded && keyInfo?.private_path && (
              <div className="rounded-ctl bg-amber-500/10 text-amber-200 px-3 py-2 flex items-center justify-between gap-2 text-xs">
                <span>Key is not loaded in ssh-agent.</span>
                <button type="button" onClick={handleAddToAgent} disabled={isAddingToAgent} className="underline cursor-pointer disabled:opacity-50">
                  {isAddingToAgent ? "Loading..." : "Load into agent"}
                </button>
              </div>
            )}
            {agentMsg && <div className="text-xs text-emerald-300 px-1">{agentMsg}</div>}
          </section>
        )}

        <section className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className={heading}>
              {guideData.platform === "github"
                ? "Add the key to GitHub"
                : guideData.platform === "gitlab"
                ? "Add the key to GitLab"
                : guideData.platform === "bastion"
                ? "Bastion and dual-hop setup"
                : guideData.platform === "tunnel"
                ? "Port forwarding"
                : "Authorize the key on the server"}
            </h4>
            {guideData.settingsUrl && (
              <button
                type="button"
                onClick={() => handleOpenExternal(guideData.settingsUrl!)}
                className="text-accent hover:underline cursor-pointer text-xs flex items-center gap-1"
              >
                {guideData.settingsLabel || "Open settings page"} <BsBoxArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="rounded-card bg-card divide-y divide-white/[0.06] overflow-hidden">
            {Array.isArray(guideData.steps) &&
              guideData.steps.map((step, idx) => {
                const isChecked = Boolean(completedSteps[idx]);
                return (
                  <label key={idx} className="px-4 py-2.5 flex items-start gap-3 cursor-pointer hover:bg-white/[0.03]">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleStep(idx)}
                      className="mt-0.5 w-4 h-4 accent-[#0a84ff] cursor-pointer"
                    />
                    <span className={isChecked ? "text-label-3 line-through decoration-white/20" : "text-label"}>{replaceVars(step)}</span>
                  </label>
                );
              })}
          </div>
        </section>

        {!guideData.skipKeyInstall && hasKey && (
          <section className="space-y-1.5">
            <h4 className={heading}>Automatic install (ssh-copy-id)</h4>
            <div className="rounded-card bg-card px-4 py-3 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-label-2">Adds your public key to the server's authorized_keys.</span>
                <Button type="button" icon={<BsCloudUploadFill />} onClick={handleInstallKey} disabled={isInstallingKey}>
                  {isInstallingKey ? "Installing..." : "Install Key"}
                </Button>
              </div>
              {installResult &&
                resultBox(
                  installResult.success,
                  installResult.success ? `Key installed in ${installResult.duration_ms} ms` : "ssh-copy-id failed",
                  installResult.output
                )}
            </div>
          </section>
        )}

        {configErrorParsed.isConfigError && (
          <section className="rounded-card bg-rose-500/10 px-4 py-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-medium text-rose-200">
                <BsExclamationTriangleFill /> SSH config error
              </span>
              {onOpenRawConfig && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRawConfig();
                  }}
                  className="text-accent hover:underline cursor-pointer text-xs flex items-center gap-1"
                >
                  <BsGearFill className="w-3 h-3" /> Fix in Raw Config
                </button>
              )}
            </div>
            <p className="text-label-2 leading-relaxed">
              Your <code className="font-mono text-label">~/.ssh/config</code> contains a syntax error
              {configErrorParsed.lineNumber ? ` on line ${configErrorParsed.lineNumber}` : ""}
              {configErrorParsed.keyword ? ` (keyword "${configErrorParsed.keyword}")` : ""} which prevents OpenSSH tools like{" "}
              <code className="font-mono text-label">ssh-copy-id</code> from reading your configuration.
            </p>
            <div className="space-y-1">
              <div className="text-xs text-label-3">Manual fallback (bypasses the config parser):</div>
              {codeLine(manualSshInstallCmd, () => handleCopyManualCmd(manualSshInstallCmd), copiedManualCmd)}
            </div>
          </section>
        )}

        <section className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className={heading}>Verify connection</h4>
            <Button type="button" icon={isTesting ? <BsArrowRepeat className="animate-spin" /> : <BsPlayFill className="w-4 h-4" />} onClick={handleRunTest} disabled={isTesting}>
              {isTesting ? "Testing..." : "Test Connection"}
            </Button>
          </div>
          {codeLine(`$ ${testCmdString}`, handleCopyTestCmd, copiedTestCmd)}

          {testResult && (
            <div className="space-y-2 pt-1">
              {resultBox(
                testResult.success,
                testResult.success ? "Authentication successful" : "Test failed",
                testResult.output,
                testResult.duration_ms
              )}

              {!testResult.success &&
                (testResult.output.includes("Could not resolve hostname") || testResult.output.includes("nodename nor servname")) && (
                  <div className="rounded-card bg-amber-500/10 px-4 py-3 space-y-2">
                    <div className="font-medium text-amber-200">Host alias not resolved by OpenSSH</div>
                    <p className="text-label-2 leading-relaxed">
                      OpenSSH could not find the host alias <code className="font-mono text-label">{safeHostPattern}</code>. This happens if{" "}
                      <code className="font-mono text-label">~/.ssh/config</code> contains a syntax error (which causes OpenSSH to reject
                      reading config aliases) or if the host was just added.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" icon={<BsPlayFill className="w-4 h-4" />} onClick={handleRunDirectTest} disabled={isTesting}>
                        Test directly (bypass config)
                      </Button>
                      {onOpenRawConfig && (
                        <Button type="button" variant="plain" onClick={onOpenRawConfig}>
                          Fix in Raw Config
                        </Button>
                      )}
                    </div>
                  </div>
                )}

              {!testResult.success && testResult.output.toLowerCase().includes("permission denied (publickey)") && (
                <div className="rounded-card bg-rose-500/10 px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2 font-medium text-rose-200">
                    <BsKeyFill /> Public key not authorized yet
                  </div>
                  <p className="text-label-2 leading-relaxed">
                    The server <code className="font-mono text-label">{safeHostName}</code> was reached, but it rejected the key because it is
                    not registered on your account yet.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button type="button" icon={<BsCopy />} onClick={handleCopyPubKey}>
                      Copy Public Key
                    </Button>
                    {guideData.settingsUrl && (
                      <Button type="button" variant="plain" icon={<BsBoxArrowUpRight />} onClick={() => handleOpenExternal(guideData.settingsUrl!)}>
                        Open {guideData.settingsLabel || "Settings"}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {testResult.success && (
                <p className="text-label-2 px-1">
                  {guideData.platform === "github" || guideData.platform === "gitlab"
                    ? "Your Git provider recognized and authorized this SSH key."
                    : "Your SSH authentication is verified and ready to use."}
                </p>
              )}
            </div>
          )}
        </section>

        {guideData.gitRemoteRewrite && (
          <section className="space-y-1.5">
            <h4 className={heading}>Use this profile with Git</h4>
            <div className="rounded-card bg-card px-4 py-3 space-y-3">
              <p className="text-label-2 leading-relaxed">
                To route git through this key, use <code className="font-mono text-label">{guideData.gitRemoteRewrite.pattern}</code> instead of{" "}
                <code className="font-mono text-label-3">git@github.com:</code>
              </p>
              <div className="space-y-1">
                <div className="text-xs text-label-3">Clone a new repository</div>
                {codeLine(
                  replaceVars(guideData.gitRemoteRewrite.example),
                  () => handleCopyClone(replaceVars(guideData.gitRemoteRewrite!.example)),
                  copiedCloneCmd
                )}
              </div>
              <div className="space-y-1">
                <div className="text-xs text-label-3">Switch an existing repository</div>
                {codeLine(
                  `git remote set-url origin ${replaceVars(guideData.gitRemoteRewrite.pattern)}username/repo.git`,
                  () => handleCopyRemote(`git remote set-url origin ${replaceVars(guideData.gitRemoteRewrite!.pattern)}username/repo.git`),
                  copiedRemoteCmd
                )}
              </div>
            </div>
          </section>
        )}

        {host?.forward_agent && (
          <div className="rounded-card bg-amber-500/10 px-4 py-3 space-y-1">
            <div className="font-medium text-amber-200">ForwardAgent is on</div>
            <p className="text-label-2 leading-relaxed">
              <code className="font-mono text-label">ForwardAgent yes</code> forwards your local SSH agent socket to the remote machine. Only
              enable this for trusted jump servers.
            </p>
          </div>
        )}

        {Array.isArray(guideData.warnings) && guideData.warnings.length > 0 && (
          <section className="space-y-1.5">
            <h4 className={heading}>Good to know</h4>
            <ul className="space-y-1 text-label-2 list-disc list-inside leading-relaxed px-1">
              {guideData.warnings.map((warn, i) => (
                <li key={i}>{replaceVars(warn)}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Dialog>
  );
};
