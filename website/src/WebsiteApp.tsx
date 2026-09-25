import React, { useState } from "react";
import {
  FiTerminal,
  FiShield,
  FiKey,
  FiLayers,
  FiCopy,
  FiCheck,
  FiDownload,
  FiGithub,
  FiExternalLink,
  FiCheckCircle,
  FiAlertCircle,
  FiServer,
  FiLock,
  FiPlay,
  FiRefreshCw,
  FiSliders,
  FiCode,
  FiCpu,
  FiZap,
} from "react-icons/fi";
import {
  SiApple,
  SiLinux,
  SiRust,
  SiReact,
  SiTypescript,
  SiTauri,
} from "react-icons/si";
import { FaWindows } from "react-icons/fa6";

export function WebsiteApp() {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedXattr, setCopiedXattr] = useState(false);
  const [activeDemoTab, setActiveDemoTab] = useState<"hosts" | "keys" | "presets" | "audit">("hosts");
  const [demoConnectingHost, setDemoConnectingHost] = useState<string | null>(null);
  const [demoAuditFixed, setDemoAuditFixed] = useState(false);

  const curlCommand = "curl -fsSL https://raw.githubusercontent.com/theasmat/sshx/main/install.sh | bash";
  const xattrCommand = "xattr -cr /Applications/SSHX.app";

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopyXattr = () => {
    navigator.clipboard.writeText(xattrCommand);
    setCopiedXattr(true);
    setTimeout(() => setCopiedXattr(false), 2000);
  };

  const handleSimulateConnect = (hostName: string) => {
    setDemoConnectingHost(hostName);
    setTimeout(() => {
      setDemoConnectingHost(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Background Subtle Grid Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] z-0" />

      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070A11]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-2.5">
              <img src="/images/logo/sshx-icon.svg" alt="SSHX Icon" className="w-8 h-8 rounded-lg" />
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                SSH<span className="text-cyan-400">X</span>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">v0.1.0</span>
              </span>
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#downloads" className="hover:text-white transition-colors">Downloads</a>
            <a href="#installation" className="hover:text-white transition-colors">Install Guide</a>
            <a href="https://github.com/theasmat/sshx#readme" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              Docs <FiExternalLink className="text-xs" />
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/theasmat/sshx"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-all"
            >
              <FiGithub className="text-sm" />
              <span>GitHub</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400">★</span>
            </a>
            <a
              href="#downloads"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-200 text-black transition-all"
            >
              <FiDownload className="text-sm" />
              <span>Get SSHX</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative z-10 pt-16 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        {/* Brand Banner Asset */}
        <div className="flex justify-center mb-8">
          <img 
            src="/images/logo/sshx-badge.svg" 
            alt="SSHX Badge" 
            className="w-auto h-28 sm:h-32 object-contain filter drop-shadow-md"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Permanently Open-Source &bull; Zero Telemetry</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Modern SSH Desktop Manager for <span className="text-cyan-400">Speed &amp; Security</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A lightning-fast, flat, and secure desktop manager for <code className="text-cyan-300 font-mono text-sm bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">~/.ssh/config</code>, SSH key vaults, and native terminal sessions.
        </p>

        {/* Primary Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://github.com/theasmat/sshx/releases/latest"
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white hover:bg-slate-200 text-black font-bold text-sm transition-all"
          >
            <SiApple className="text-lg" />
            <span>Download for macOS</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-black/10 font-mono">.dmg</span>
          </a>

          <a
            href="#downloads"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm transition-all"
          >
            <SiLinux className="text-base text-slate-400" />
            <FaWindows className="text-base text-slate-400" />
            <span>Linux &amp; Windows</span>
          </a>
        </div>

        {/* 1-Line Install Terminal Box */}
        <div className="mt-8 max-w-xl mx-auto">
          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300">
            <div className="flex items-center gap-2 overflow-x-auto text-left scrollbar-none">
              <span className="text-cyan-400 select-none font-bold">$</span>
              <span className="text-slate-200 select-all">{curlCommand}</span>
            </div>
            <button
              onClick={handleCopyCurl}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-200 border border-slate-800 transition-colors shrink-0"
              title="Copy to Clipboard"
            >
              {copiedCurl ? (
                <>
                  <FiCheck className="text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <FiCopy className="text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tech Stack Pills */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-5 text-xs font-mono font-medium text-slate-400">
          <div className="flex items-center gap-1.5">
            <SiTauri className="text-[#24C8D8]" />
            <span>Tauri v2.0</span>
          </div>
          <span>&bull;</span>
          <div className="flex items-center gap-1.5">
            <SiRust className="text-[#DEA584]" />
            <span>Rust Engine</span>
          </div>
          <span>&bull;</span>
          <div className="flex items-center gap-1.5">
            <SiReact className="text-[#61DAFB]" />
            <span>React 19</span>
          </div>
          <span>&bull;</span>
          <div className="flex items-center gap-1.5">
            <SiTypescript className="text-[#3178C6]" />
            <span>TypeScript</span>
          </div>
          <span>&bull;</span>
          <div className="flex items-center gap-1.5">
            <FiShield className="text-purple-400" />
            <span>MIT Attribution</span>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE SIMULATION SECTION */}
      <section id="demo" className="relative z-10 py-12 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">Live Desktop UI</h2>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">Interactive App Simulator</p>
          <p className="mt-2 text-slate-400 text-xs sm:text-sm">
            Explore SSHX directly in the browser with mock profiles, terminal launcher, and security audit.
          </p>
        </div>

        {/* Flat App Window Mockup */}
        <div className="rounded-xl bg-[#090D18] border border-slate-800 shadow-xl overflow-hidden text-left">
          {/* Flat Window Titlebar */}
          <div className="h-11 bg-[#060912] border-b border-slate-800/90 px-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>

            {/* Omnibox Bar */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-400 w-72 max-w-full justify-between">
              <span className="flex items-center gap-1.5">
                <FiTerminal className="text-cyan-400 text-xs" />
                <span>Search hosts, keys (⌘K)...</span>
              </span>
              <kbd className="px-1 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400 font-mono border border-slate-700">⌘K</kbd>
            </div>

            <div className="text-xs font-mono text-slate-500 hidden sm:block">SSHX Desktop</div>
          </div>

          {/* Flat App Body */}
          <div className="grid grid-cols-1 md:grid-cols-4 min-h-[380px]">
            {/* Flat Sidebar */}
            <div className="bg-[#070B14] border-r border-slate-800 p-2.5 flex md:flex-col gap-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveDemoTab("hosts")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full text-left ${
                  activeDemoTab === "hosts"
                    ? "bg-slate-800 text-white font-semibold border-l-2 border-cyan-400"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <FiServer className="text-sm" />
                <span>SSH Hosts</span>
                <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">4</span>
              </button>

              <button
                onClick={() => setActiveDemoTab("keys")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full text-left ${
                  activeDemoTab === "keys"
                    ? "bg-slate-800 text-white font-semibold border-l-2 border-cyan-400"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <FiKey className="text-sm" />
                <span>Key Vault</span>
                <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">3</span>
              </button>

              <button
                onClick={() => setActiveDemoTab("presets")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full text-left ${
                  activeDemoTab === "presets"
                    ? "bg-slate-800 text-white font-semibold border-l-2 border-cyan-400"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <FiLayers className="text-sm" />
                <span>Presets Hub</span>
              </button>

              <button
                onClick={() => setActiveDemoTab("audit")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full text-left ${
                  activeDemoTab === "audit"
                    ? "bg-slate-800 text-white font-semibold border-l-2 border-cyan-400"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <FiShield className="text-sm" />
                <span>Security Audit</span>
                <span className={`ml-auto text-[10px] px-1.5 py-0.2 rounded font-mono ${demoAuditFixed ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-amber-950 text-amber-300 border border-amber-800"}`}>
                  {demoAuditFixed ? "100%" : "2 Alerts"}
                </span>
              </button>
            </div>

            {/* Flat Main Content Pane */}
            <div className="md:col-span-3 p-5 bg-[#090D18] overflow-y-auto max-h-[460px]">
              {/* TAB 1: HOSTS */}
              {activeDemoTab === "hosts" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-sm">Configured Hosts</h3>
                      <p className="text-[11px] text-slate-500 font-mono">~/.ssh/config (Snapshot: Active)</p>
                    </div>
                    <button className="px-2.5 py-1 rounded-md bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white">
                      + Add Host
                    </button>
                  </div>

                  {/* Host Card 1 */}
                  <div className="p-3.5 rounded-lg bg-[#0c111e] border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-bold text-white text-sm">prod-api-cluster</span>
                        <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-900">AWS EC2</span>
                      </div>
                      <p className="text-xs font-mono text-slate-400">ec2-user@54.210.88.42:22</p>
                      <p className="text-[10px] font-mono text-slate-500">Identity: ~/.ssh/id_ed25519_aws_prod</p>
                    </div>
                    <button
                      onClick={() => handleSimulateConnect("prod-api-cluster")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-all shrink-0"
                    >
                      {demoConnectingHost === "prod-api-cluster" ? (
                        <>
                          <FiRefreshCw className="animate-spin text-xs" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <FiPlay className="text-[10px]" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Host Card 2 */}
                  <div className="p-3.5 rounded-lg bg-[#0c111e] border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-400" />
                        <span className="font-bold text-white text-sm">bastion-internal-jump</span>
                        <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-900">ProxyJump</span>
                      </div>
                      <p className="text-xs font-mono text-slate-400">admin@10.0.1.50:2222</p>
                      <p className="text-[10px] font-mono text-slate-500">ProxyJump gateway.internal.corp</p>
                    </div>
                    <button
                      onClick={() => handleSimulateConnect("bastion-internal-jump")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all shrink-0"
                    >
                      {demoConnectingHost === "bastion-internal-jump" ? (
                        <>
                          <FiRefreshCw className="animate-spin text-xs text-cyan-400" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <FiPlay className="text-[10px]" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: KEYS */}
              {activeDemoTab === "keys" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-sm">SSH Key Vault</h3>
                      <p className="text-[11px] text-slate-500">Ed25519 &amp; RSA Keys with ssh-agent Keyring</p>
                    </div>
                    <button className="px-2.5 py-1 rounded-md bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white">
                      + Generate Key
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0c111e] border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-900">Ed25519</span>
                        <span className="font-bold text-white text-xs">id_ed25519_github_work</span>
                        <span className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-800">ssh-agent ✓</span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">SHA256:4N9v8k... (chmod 600 ✓)</p>
                    </div>
                    <span className="text-[11px] text-slate-400">Used by 2 hosts</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0c111e] border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold text-purple-400 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-900">RSA 4096</span>
                        <span className="font-bold text-white text-xs">id_rsa_legacy_bastion</span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">SHA256:7X1p2q... (chmod 600 ✓)</p>
                    </div>
                    <span className="text-[11px] text-slate-400">Used by 1 host</span>
                  </div>
                </div>
              )}

              {/* TAB 3: PRESETS */}
              {activeDemoTab === "presets" && (
                <div className="space-y-3">
                  <div className="pb-2 border-b border-slate-800">
                    <h3 className="font-bold text-white text-sm">Presets Hub</h3>
                    <p className="text-[11px] text-slate-500">1-Click Wizards for Git, Cloud, Bastion &amp; SOCKS5</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-lg bg-[#0c111e] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <FiLayers className="text-cyan-400" />
                        <span>GitHub Multi-Account</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Personal &amp; Work account isolation with unique keys.</p>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0c111e] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <FiServer className="text-blue-400" />
                        <span>AWS EC2 Instance</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Prefilled ec2-user / ubuntu defaults with key binding.</p>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0c111e] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <FiLock className="text-purple-400" />
                        <span>Bastion / Jump Host</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Secure ProxyJump chaining for private VPC clusters.</p>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0c111e] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <FiTerminal className="text-emerald-400" />
                        <span>Dynamic SOCKS5 Proxy</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Encrypted local SOCKS5 tunnel with -D port binding.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT */}
              {activeDemoTab === "audit" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-sm">Security &amp; Permissions Auditor</h3>
                      <p className="text-[11px] text-slate-500 font-mono">POSIX 700/600 compliance and weak key inspection</p>
                    </div>
                    {!demoAuditFixed && (
                      <button
                        onClick={() => setDemoAuditFixed(true)}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1"
                      >
                        <FiCheck className="text-xs" />
                        <span>Auto-Fix All</span>
                      </button>
                    )}
                  </div>

                  {demoAuditFixed ? (
                    <div className="p-4 text-center space-y-1 rounded-lg bg-emerald-950/30 border border-emerald-900">
                      <FiCheckCircle className="text-2xl text-emerald-400 mx-auto" />
                      <h4 className="font-bold text-white text-sm">Security Score: 100%</h4>
                      <p className="text-[11px] text-slate-400">All ~/.ssh file permissions and key strengths verified clean.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FiAlertCircle className="text-amber-400 text-sm shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-white">Permissions too open: ~/.ssh/config (644)</p>
                            <p className="text-[10px] text-slate-400 font-mono">Auto-repair to 600 available.</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">Auto-Fixable</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-900/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FiAlertCircle className="text-blue-400 text-sm shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-white">Stale known_hosts entry: 192.168.1.100</p>
                            <p className="text-[10px] text-slate-400 font-mono">Host key mismatch detected.</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-900">Resolvable</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES ASYMMETRICAL BENTO GRID */}
      <section id="features" className="relative z-10 py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">Engineering Highlights</h2>
          <p className="mt-1 text-3xl font-extrabold text-white">Architected for Speed &amp; Integrity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bento Card 1 (Span 2) */}
          <div className="md:col-span-2 p-5 rounded-xl bg-[#0a0f1d] border border-slate-800 hover:border-slate-700 transition-all space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-400">
              <FiCode className="text-lg" />
              <h3 className="font-bold text-white text-base">Lossless AST Config Parser</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              SSHX parses <code className="text-cyan-300 font-mono">~/.ssh/config</code> into an Abstract Syntax Tree. Custom comments, indentation, spacing, and unrecognized flags are 100% preserved on disk.
            </p>
          </div>

          {/* Bento Card 2 (Span 1) */}
          <div className="p-5 rounded-xl bg-[#0a0f1d] border border-slate-800 hover:border-slate-700 transition-all space-y-2.5">
            <div className="flex items-center gap-2 text-purple-400">
              <FiKey className="text-lg" />
              <h3 className="font-bold text-white text-base">3-Way Key Conflict Engine</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deduplicate overlapping key names automatically or bind shared keys with 1 click.
            </p>
          </div>

          {/* Bento Card 3 (Span 1) */}
          <div className="p-5 rounded-xl bg-[#0a0f1d] border border-slate-800 hover:border-slate-700 transition-all space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <FiTerminal className="text-lg" />
              <h3 className="font-bold text-white text-base">Terminal Autodetect</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Launches <strong>Ghostty</strong>, <strong>WezTerm</strong>, <strong>iTerm2</strong>, <strong>Alacritty</strong>, <strong>Kitty</strong>, and native terminals.
            </p>
          </div>

          {/* Bento Card 4 (Span 2) */}
          <div className="md:col-span-2 p-5 rounded-xl bg-[#0a0f1d] border border-slate-800 hover:border-slate-700 transition-all space-y-2.5">
            <div className="flex items-center gap-2 text-blue-400">
              <FiShield className="text-lg" />
              <h3 className="font-bold text-white text-base">Dedicated Single Snapshot Protection</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maintains an isolated backup at <code className="text-cyan-300 font-mono">~/.ssh/config.sshx.bak</code> before any edit. Offers 1-click diff previews and instantaneous rollbacks.
            </p>
          </div>
        </div>
      </section>

      {/* 5. DOWNLOADS SECTION */}
      <section id="downloads" className="relative z-10 py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">Binaries</h2>
          <p className="mt-1 text-3xl font-extrabold text-white">Download for Your Platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* macOS */}
          <div className="p-5 rounded-xl bg-[#0a0f1d] border border-slate-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SiApple className="text-2xl text-white" />
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Universal</span>
              </div>
              <h3 className="text-base font-bold text-white">macOS</h3>
              <p className="text-xs text-slate-400">Apple Silicon &amp; Intel Macs (macOS 11+).</p>
            </div>
            <div className="mt-6">
              <a
                href="https://github.com/theasmat/sshx/releases/latest"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white hover:bg-slate-200 text-black font-bold text-xs transition-all"
              >
                <FiDownload />
                <span>Download .dmg</span>
              </a>
            </div>
          </div>

          {/* Linux */}
          <div className="p-5 rounded-xl bg-[#0a0f1d] border border-slate-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SiLinux className="text-2xl text-slate-300" />
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Deb &amp; AppImage</span>
              </div>
              <h3 className="text-base font-bold text-white">Linux</h3>
              <p className="text-xs text-slate-400">Ubuntu, Debian, Arch &amp; Fedora distributions.</p>
            </div>
            <div className="mt-6 flex gap-2">
              <a
                href="https://github.com/theasmat/sshx/releases/latest"
                className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-800 transition-all"
              >
                <FiDownload />
                <span>.deb</span>
              </a>
              <a
                href="https://github.com/theasmat/sshx/releases/latest"
                className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-800 transition-all"
              >
                <span>AppImage</span>
              </a>
            </div>
          </div>

          {/* Windows */}
          <div className="p-5 rounded-xl bg-[#0a0f1d] border border-slate-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FaWindows className="text-2xl text-blue-400" />
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">64-bit</span>
              </div>
              <h3 className="text-base font-bold text-white">Windows</h3>
              <p className="text-xs text-slate-400">Windows 10 &amp; 11 with Windows Terminal.</p>
            </div>
            <div className="mt-6">
              <a
                href="https://github.com/theasmat/sshx/releases/latest"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-800 transition-all"
              >
                <FiDownload />
                <span>Download .msi</span>
              </a>
            </div>
          </div>
        </div>

        {/* macOS Gatekeeper Box */}
        <div id="installation" className="mt-8 p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <FiAlertCircle className="text-sm" />
            <span>macOS Gatekeeper Unnotarized App Note</span>
          </div>
          <p className="text-slate-400">
            If macOS shows &quot;damaged app&quot; or &quot;unverified developer&quot;, clear the quarantine flag in terminal:
          </p>
          <div className="flex items-center justify-between gap-2 p-2 rounded bg-[#070A11] border border-slate-800 font-mono text-cyan-300">
            <span>{xattrCommand}</span>
            <button
              onClick={handleCopyXattr}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold shrink-0"
            >
              {copiedXattr ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#05070d] py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <img src="/images/logo/sshx-icon.svg" alt="SSHX" className="w-5 h-5 rounded" />
            <span className="font-bold text-slate-300">SSHX</span>
            <span>&bull;</span>
            <span>&copy; 2026 Asmat &amp; Contributors. MIT Attribution License.</span>
          </div>

          <div className="flex items-center gap-5 text-slate-400 font-medium">
            <a href="https://github.com/theasmat/sshx" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
            <a href="https://github.com/theasmat/sshx/releases" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Releases</a>
            <a href="https://github.com/theasmat/sshx/blob/main/CONTRIBUTING.md" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Contributing</a>
            <a href="https://github.com/theasmat/sshx/blob/main/SECURITY.md" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Security</a>
            <a href="https://github.com/theasmat/sshx/blob/main/LICENSE" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">License</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
