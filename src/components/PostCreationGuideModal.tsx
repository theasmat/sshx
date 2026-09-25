import React, { useState, useEffect, useMemo } from "react";
import {
  BsCheckCircleFill,
  BsCopy,
  BsCheckLg,
  BsBoxArrowUpRight,
  BsKeyFill,
  BsTerminalFill,
  BsXLg,
  BsExclamationTriangleFill,
  BsPlayFill,
  BsShieldLockFill,
  BsCloudUploadFill,
  BsArrowRepeat,
  BsGearFill,
  BsCheck2Square,
  BsSquare,
  BsGit,
} from "react-icons/bs";
import { BrandLogo } from "./BrandLogo";
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
    setIsTesting(true);
    setTestResult(null);
    try {
      const directHost = host.host_name || "github.com";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-2xl bg-[#0b0f19] border border-[#1f2942] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-xs">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#1f2942] bg-[#0e1422] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-sm">
              <BsCheckCircleFill className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">
                  Setup & Authorization Guide
                </h3>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {safeHostPattern}
                </span>
                {preset?.badge && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#161d30] text-gray-300 border border-[#232f4d]">
                    {preset.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Complete these platform-specific steps to authorize your connection.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1c243a] transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <BsXLg className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-5 py-2.5 bg-[#080c16] border-b border-[#1f2942] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${
                completedSteps[0]
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-[#161d30] text-gray-400"
              }`}
            >
              <BsCheckLg className="w-3 h-3" />
              <span>1. Key Configured</span>
            </span>
            <span className="text-gray-600">→</span>
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${
                completedSteps[1]
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-[#161d30] text-gray-400"
              }`}
            >
              <BsCopy className="w-3 h-3" />
              <span>2. Copy Key</span>
            </span>
            <span className="text-gray-600">→</span>
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${
                completedSteps[2]
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-[#161d30] text-gray-400"
              }`}
            >
              <BsBoxArrowUpRight className="w-3 h-3" />
              <span>3. Authorize</span>
            </span>
            <span className="text-gray-600">→</span>
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${
                completedSteps[3]
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-[#161d30] text-gray-400"
              }`}
            >
              <BsPlayFill className="w-3.5 h-3.5" />
              <span>4. Test</span>
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Edge Case: No Key Generated / Using SSH Agent Defaults */}
          {!hasKey && (
            <div className="p-3.5 bg-[#0e1422] border border-blue-500/30 rounded-xl flex items-start gap-3 text-xs">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <BsShieldLockFill className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-white">Using Default SSH Agent Keys</div>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  This host connection is configured without an explicit <code className="font-mono text-blue-300">IdentityFile</code>. OpenSSH will automatically use keys currently loaded in your SSH agent or default identities (<code className="font-mono text-blue-300">~/.ssh/id_rsa</code>, <code className="font-mono text-blue-300">id_ed25519</code>).
                </p>
              </div>
            </div>
          )}

          {/* Public Key Box (When key is present) */}
          {hasKey && (
            <div className="p-3.5 bg-[#070a10] border border-blue-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-300 font-semibold text-xs">
                  <BsKeyFill className="w-4 h-4 text-blue-400" />
                  <span>
                    Your Public Key (<code className="font-mono text-white bg-[#161d30] px-1.5 py-0.5 rounded border border-[#232f4d]">{keyFileName}.pub</code>)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPubKey}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm cursor-pointer active:scale-95"
                >
                  {copiedKey ? <BsCheckLg className="w-3.5 h-3.5" /> : <BsCopy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? "Copied to Clipboard!" : "Copy Public Key"}</span>
                </button>
              </div>

              <pre className="p-2.5 bg-[#04060a] border border-[#1f2942] rounded-lg font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed select-all">
                {pubKey}
              </pre>

              {/* Key Not in Agent Notice & 1-Click Fix */}
              {!agentLoaded && keyInfo?.private_path && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-amber-300">
                    <BsExclamationTriangleFill className="w-3.5 h-3.5 shrink-0" />
                    <span>Key not currently loaded in ssh-agent</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddToAgent}
                    disabled={isAddingToAgent}
                    className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isAddingToAgent ? <BsArrowRepeat className="w-3 h-3 animate-spin" /> : null}
                    <span>Load into Agent</span>
                  </button>
                </div>
              )}

              {agentMsg && (
                <div className="text-[11px] text-emerald-400 font-medium px-1">
                  ✓ {agentMsg}
                </div>
              )}
            </div>
          )}

          {/* Platform Step-by-Step Instructions */}
          <div className="p-4 bg-[#0e1422] border border-[#1f2942] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center bg-[#161d30] border border-[#232f4d]">
                  <BrandLogo
                    name={safeHostPattern}
                    hostName={safeHostName}
                    tags={host?.tags || []}
                    group={host?.group || ""}
                    className="w-4 h-4"
                  />
                </div>
                <h4 className="font-bold text-white text-xs">
                  {guideData.platform === "github"
                    ? "Add Public Key to GitHub"
                    : guideData.platform === "gitlab"
                    ? "Add Public Key to GitLab"
                    : guideData.platform === "bastion"
                    ? "Bastion & Dual-Hop Setup"
                    : guideData.platform === "tunnel"
                    ? "Port Forwarding Instructions"
                    : "Authorize Key on Remote Server"}
                </h4>
              </div>

              {guideData.settingsUrl && (
                <button
                  type="button"
                  onClick={() => handleOpenExternal(guideData.settingsUrl!)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <span>{guideData.settingsLabel || "Open Settings Page"}</span>
                  <BsBoxArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Step Checkpoints */}
            <div className="space-y-2">
              {Array.isArray(guideData.steps) &&
                guideData.steps.map((step, idx) => {
                  const isChecked = Boolean(completedSteps[idx]);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleStep(idx)}
                      className={`p-2 rounded-lg border flex items-start gap-2.5 transition-colors cursor-pointer ${
                        isChecked
                          ? "bg-emerald-500/5 border-emerald-500/20 text-gray-300"
                          : "bg-[#070a10] border-[#1f2942] text-gray-200 hover:border-[#2a375a]"
                      }`}
                    >
                      <div className="mt-0.5 text-emerald-400 shrink-0">
                        {isChecked ? <BsCheck2Square className="w-3.5 h-3.5" /> : <BsSquare className="w-3.5 h-3.5 text-gray-500" />}
                      </div>
                      <div className="flex-1 text-xs leading-relaxed">
                        <span className="font-medium">{replaceVars(step)}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 1-Click Remote Key Installation (ssh-copy-id) for Cloud / Homelab / Bastion */}
          {!guideData.skipKeyInstall && hasKey && (
            <div className="p-3.5 bg-[#0e1422] border border-[#1f2942] rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BsCloudUploadFill className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white text-xs">
                    Automated Remote Authorization (ssh-copy-id)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleInstallKey}
                  disabled={isInstallingKey}
                  className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isInstallingKey ? <BsArrowRepeat className="w-3 h-3 animate-spin" /> : <BsCloudUploadFill className="w-3 h-3" />}
                  <span>{isInstallingKey ? "Installing..." : "Install Key to Remote"}</span>
                </button>
              </div>

              {installResult && (
                <div
                  className={`p-2.5 rounded-lg border text-xs leading-relaxed space-y-1 ${
                    installResult.success
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {installResult.success ? (
                      <BsCheckCircleFill className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <BsExclamationTriangleFill className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span>
                      {installResult.success
                        ? `SSH Key installed successfully in ${installResult.duration_ms}ms!`
                        : "ssh-copy-id failed"}
                    </span>
                  </div>
                  {installResult.output && (
                    <pre className="font-mono text-[10px] p-2 bg-black/40 rounded border border-white/5 overflow-x-auto whitespace-pre-wrap">
                      {installResult.output}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Troubleshooting Panel for ssh-copy-id / Config Error */}
          {configErrorParsed.isConfigError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <BsExclamationTriangleFill className="w-4 h-4 text-rose-400" />
                  <span>SSH Config Error Detected</span>
                </div>
                {onOpenRawConfig && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRawConfig();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <BsGearFill className="w-3 h-3" />
                    <span>Fix in Config Editor</span>
                  </button>
                )}
              </div>

              <p className="text-gray-300 text-[11px] leading-relaxed">
                Your <code className="font-mono text-rose-300">~/.ssh/config</code> contains a syntax error
                {configErrorParsed.lineNumber ? ` on line ${configErrorParsed.lineNumber}` : ""}
                {configErrorParsed.keyword ? ` (keyword "${configErrorParsed.keyword}")` : ""} which prevents OpenSSH tools like <code className="font-mono text-gray-200">ssh-copy-id</code> from reading your configuration.
              </p>

              <div className="space-y-1">
                <div className="text-gray-400 font-semibold text-[10px]">Manual Fallback Command (Bypasses Config Parser):</div>
                <div className="flex items-center gap-2">
                  <pre className="p-2 bg-[#070a10] border border-[#1f2942] text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto flex-1 leading-snug">
                    {manualSshInstallCmd}
                  </pre>
                  <button
                    type="button"
                    onClick={() => handleCopyManualCmd(manualSshInstallCmd)}
                    className="px-2.5 py-2 bg-[#161d30] hover:bg-[#1f2942] text-gray-200 border border-[#232f4d] rounded-lg text-[10px] font-medium transition-colors cursor-pointer shrink-0"
                  >
                    {copiedManualCmd ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* In-App "Test Connection" Button */}
          <div className="p-3.5 bg-[#0e1422] border border-[#1f2942] rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BsTerminalFill className="w-3.5 h-3.5 text-amber-400" />
                <h4 className="font-bold text-white text-xs">Verify Connection</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyTestCmd}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-lg border border-[#232f4d] text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {copiedTestCmd ? <BsCheckLg className="w-3 h-3 text-emerald-400" /> : <BsCopy className="w-3 h-3" />}
                  <span>{copiedTestCmd ? "Copied" : "Copy Command"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunTest}
                  disabled={isTesting}
                  className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded-lg font-bold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isTesting ? <BsArrowRepeat className="w-3 h-3 animate-spin" /> : <BsPlayFill className="w-3.5 h-3.5" />}
                  <span>{isTesting ? "Testing..." : "Test Connection"}</span>
                </button>
              </div>
            </div>

            <pre className="p-2 bg-[#070a10] border border-[#1f2942] rounded-lg font-mono text-[11px] text-emerald-400">
              $ {testCmdString}
            </pre>

            {testResult && (
              <div className="space-y-2">
                <div
                  className={`p-2.5 rounded-lg border text-xs leading-relaxed space-y-1 ${
                    testResult.success
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <div className="flex items-center gap-1.5">
                      {testResult.success ? (
                        <BsCheckCircleFill className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <BsExclamationTriangleFill className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      <span>{testResult.success ? "Authentication Successful" : "Test Failed"}</span>
                    </div>
                    {testResult.duration_ms > 0 && (
                      <span className="font-mono text-[10px] text-gray-400">
                        {testResult.duration_ms}ms
                      </span>
                    )}
                  </div>
                  {testResult.output && (
                    <pre className="font-mono text-[10px] p-2 bg-black/40 rounded border border-white/5 overflow-x-auto whitespace-pre-wrap">
                      {testResult.output}
                    </pre>
                  )}
                </div>

                {/* Intelligent Error Diagnostic: Hostname Resolution Failure */}
                {!testResult.success && (testResult.output.includes("Could not resolve hostname") || testResult.output.includes("nodename nor servname")) && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <BsExclamationTriangleFill className="w-3.5 h-3.5 text-amber-400" />
                      <span>Host Alias Not Resolved by OpenSSH</span>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-relaxed">
                      OpenSSH could not find the host alias <code className="text-amber-300 font-mono">{safeHostPattern}</code>. This happens if <code className="text-gray-300 font-mono">~/.ssh/config</code> contains a syntax error (which causes OpenSSH to reject reading config aliases) or if the host was just added.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleRunDirectTest}
                        disabled={isTesting}
                        className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-lg text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <BsPlayFill className="w-3.5 h-3.5" />
                        <span>Test Directly (Bypass Config)</span>
                      </button>
                      {onOpenRawConfig && (
                        <button
                          type="button"
                          onClick={onOpenRawConfig}
                          className="px-2.5 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Fix in Config Editor
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Intelligent Error Diagnostic: Permission Denied (Key not authorized) */}
                {!testResult.success && testResult.output.toLowerCase().includes("permission denied (publickey)") && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                      <BsKeyFill className="w-3.5 h-3.5 text-rose-400" />
                      <span>Public Key Not Yet Authorized on Remote Server</span>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-relaxed">
                      The server reached <code className="text-emerald-300 font-mono">{safeHostName}</code>, but authentication was rejected because your public key is not registered on your account yet.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCopyPubKey}
                        className="px-2.5 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-200 border border-[#232f4d] rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <BsCopy className="w-3 h-3 text-emerald-400" />
                        <span>Copy Public Key</span>
                      </button>
                      {guideData.settingsUrl && (
                        <button
                          type="button"
                          onClick={() => handleOpenExternal(guideData.settingsUrl!)}
                          className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <BsBoxArrowUpRight className="w-3 h-3" />
                          <span>Open {guideData.settingsLabel || "Settings"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Success Diagnostic */}
                {testResult.success && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <BsCheckCircleFill className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SSH Key Authentication Confirmed!</span>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-relaxed">
                      {guideData.platform === "github" || guideData.platform === "gitlab"
                        ? "Your Git provider successfully recognized and authorized this SSH key."
                        : "Your SSH authentication is verified and ready for use."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Git Remote Rewrite Guidance (Multi-Account) */}
          {guideData.gitRemoteRewrite && (
            <div className="p-3.5 bg-[#0e1422] border border-[#1f2942] rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <BsGit className="w-4 h-4 text-orange-400" />
                <span>Using This Profile with Git (Multi-Account Setup)</span>
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                To route git operations through this dedicated SSH key profile, use <code className="text-emerald-300 font-mono">{guideData.gitRemoteRewrite.pattern}</code> instead of <code className="text-gray-400 font-mono">git@github.com:</code>
              </p>

              <div className="space-y-2">
                <div>
                  <div className="text-[10px] font-semibold text-gray-400 mb-1">Clone a new repository:</div>
                  <div className="flex items-center gap-2">
                    <code className="p-2 bg-[#070a10] border border-[#1f2942] rounded-lg font-mono text-[10px] text-emerald-400 flex-1 overflow-x-auto">
                      {replaceVars(guideData.gitRemoteRewrite.example)}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyClone(replaceVars(guideData.gitRemoteRewrite!.example))}
                      className="px-2.5 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-200 border border-[#232f4d] rounded-lg text-[10px] font-medium transition-colors cursor-pointer shrink-0"
                    >
                      {copiedCloneCmd ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-gray-400 mb-1">Switch an existing repository to this profile:</div>
                  <div className="flex items-center gap-2">
                    <code className="p-2 bg-[#070a10] border border-[#1f2942] rounded-lg font-mono text-[10px] text-emerald-400 flex-1 overflow-x-auto">
                      git remote set-url origin {replaceVars(guideData.gitRemoteRewrite.pattern)}username/repo.git
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyRemote(
                          `git remote set-url origin ${replaceVars(
                            guideData.gitRemoteRewrite!.pattern
                          )}username/repo.git`
                        )
                      }
                      className="px-2.5 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-200 border border-[#232f4d] rounded-lg text-[10px] font-medium transition-colors cursor-pointer shrink-0"
                    >
                      {copiedRemoteCmd ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ForwardAgent Security Notice */}
          {host?.forward_agent && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs">
              <BsExclamationTriangleFill className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-amber-300">ForwardAgent Security Notice</div>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  <code className="font-mono text-amber-300">ForwardAgent yes</code> is enabled for this host. This forwards your local SSH authentication agent socket to the remote machine. Only enable this for trusted jump servers.
                </p>
              </div>
            </div>
          )}

          {/* Warnings Section */}
          {Array.isArray(guideData.warnings) && guideData.warnings.length > 0 && (
            <div className="p-3 bg-[#080c16] border border-[#1f2942] rounded-xl space-y-1.5 text-xs">
              <div className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">
                Important Tips & Edge Cases
              </div>
              <ul className="space-y-1 text-gray-300 text-[11px] list-disc list-inside leading-relaxed">
                {guideData.warnings.map((warn, i) => (
                  <li key={i}>{replaceVars(warn)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3 border-t border-[#1f2942] bg-[#090d16] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 hover:text-white rounded-xl font-medium transition-colors cursor-pointer text-xs"
          >
            Done
          </button>

          <div className="flex items-center gap-2">
            {hasKey && (
              <button
                type="button"
                onClick={handleCopyPubKey}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1a233a] hover:bg-[#222e4d] text-blue-300 border border-blue-500/30 rounded-xl font-semibold transition-colors cursor-pointer text-xs"
              >
                {copiedKey ? <BsCheckLg className="w-3.5 h-3.5 text-emerald-400" /> : <BsCopy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? "Key Copied!" : "Copy Key"}</span>
              </button>
            )}

            {onConnect && host && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onConnect(host);
                }}
                className="flex items-center gap-1.5 px-5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 text-xs"
              >
                <BsTerminalFill className="w-3.5 h-3.5" />
                <span>Connect in Terminal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
