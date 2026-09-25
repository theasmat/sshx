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
  FiChevronRight,
  FiRefreshCw,
  FiSliders,
  FiCode,
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
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#050813] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] animate-pulse-glow" />
        <div className="absolute top-1/3 -right-40 w-[650px] h-[650px] bg-indigo-600/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-10 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px]" />
      </div>

      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#050813]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20">
                <div className="w-full h-full bg-[#090E20] rounded-[11px] flex items-center justify-center">
                  <FiTerminal className="text-cyan-400 text-xl group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                  SSH<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">X</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">v0.1.0</span>
                </span>
                <span className="text-[10px] text-slate-400 tracking-wide font-medium">Desktop Manager</span>
              </div>
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#demo" className="hover:text-cyan-400 transition-colors">Interactive Demo</a>
            <a href="#downloads" className="hover:text-cyan-400 transition-colors">Downloads</a>
            <a href="#installation" className="hover:text-cyan-400 transition-colors">Installation</a>
            <a href="https://github.com/theasmat/sshx#readme" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
              Docs <FiExternalLink className="text-xs text-slate-400" />
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/theasmat/sshx"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white transition-all shadow-sm hover:shadow-cyan-500/10"
            >
              <FiGithub className="text-base" />
              <span>GitHub</span>
              <span className="px-1.5 py-0.5 text-xs bg-slate-800 rounded-md text-slate-300 border border-slate-700">★ Star</span>
            </a>
            <a
              href="#downloads"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all"
            >
              <FiDownload className="text-base" />
              <span>Download</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Permanently Open-Source &amp; Zero-Telemetry</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
          Modern SSH Desktop Manager for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
            Speed &amp; Security
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-normal">
          A blazing-fast, visual manager for <code className="text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40 text-sm font-mono font-semibold">~/.ssh/config</code>, SSH keys, automated security audits, and native terminal sessions.
        </p>

        {/* Primary CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://github.com/theasmat/sshx/releases/latest"
            className="flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <SiApple className="text-xl" />
            <span>Download for macOS</span>
            <span className="text-xs px-2 py-0.5 rounded bg-white/20 font-medium">Universal DMG</span>
          </a>

          <a
            href="#downloads"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 font-semibold text-base text-slate-200 transition-all hover:border-slate-600"
          >
            <SiLinux className="text-lg text-slate-400" />
            <FaWindows className="text-lg text-slate-400" />
            <span>Other Platforms</span>
          </a>
        </div>

        {/* 1-Line Universal Install Terminal Block */}
        <div className="mt-10 max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#0a0f1e] border border-cyan-500/20 rounded-2xl shadow-xl shadow-black/40 font-mono text-sm text-slate-300">
            <div className="flex items-center gap-2 overflow-x-auto text-left scrollbar-none">
              <span className="text-cyan-400 select-none font-bold">$</span>
              <span className="text-slate-200 select-all">{curlCommand}</span>
            </div>
            <button
              onClick={handleCopyCurl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors shrink-0"
              title="Copy to Clipboard"
            >
              {copiedCurl ? (
                <>
                  <FiCheck className="text-green-400" />
                  <span className="text-green-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <FiCopy className="text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            ⚡ Installs on macOS &amp; Linux, fixes permissions, bypasses Gatekeeper, and clears temporary files.
          </p>
        </div>

        {/* Tech Stack Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <SiTauri className="text-[#24C8D8] text-base" />
            <span>Tauri v2.0</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-2">
            <SiRust className="text-[#DEA584] text-base" />
            <span>Rust Backend</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-2">
            <SiReact className="text-[#61DAFB] text-base" />
            <span>React 19</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-2">
            <SiTypescript className="text-[#3178C6] text-base" />
            <span>TypeScript</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-2">
            <FiShield className="text-purple-400 text-base" />
            <span>MIT Attribution</span>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE LIVE APP PLAYGROUND SECTION */}
      <section id="demo" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-xs font-bold tracking-widest text-cyan-400 uppercase">Live In-Browser Simulation</h2>
          <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">Experience the SSHX Interface</p>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto text-sm">
            Click through the tabs below to test the lightning-fast layout, key conflict resolver, terminal launching, and security scanner.
          </p>
        </div>

        {/* Simulated App Window */}
        <div className="max-w-5xl mx-auto rounded-2xl bg-[#090E20] border border-cyan-500/20 shadow-2xl shadow-cyan-950/30 overflow-hidden">
          {/* Mock Window Titlebar */}
          <div className="h-12 bg-[#060A16] border-b border-slate-800 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>

            {/* Omnibox Bar */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400 w-80 max-w-full justify-between">
              <span className="flex items-center gap-2">
                <FiTerminal className="text-cyan-400 text-xs" />
                <span>Search hosts, keys, presets...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono border border-slate-700">⌘K</kbd>
            </div>

            <div className="text-xs font-bold text-slate-400 hidden sm:block">SSHX App</div>
          </div>

          {/* Mock App Body */}
          <div className="grid grid-cols-1 md:grid-cols-4 min-h-[420px]">
            {/* Mock Sidebar */}
            <div className="bg-[#070b18] border-r border-slate-800/80 p-3 flex md:flex-col gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveDemoTab("hosts")}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left ${
                  activeDemoTab === "hosts"
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <FiServer className="text-base" />
                <span>SSH Hosts</span>
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">4</span>
              </button>

              <button
                onClick={() => setActiveDemoTab("keys")}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left ${
                  activeDemoTab === "keys"
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <FiKey className="text-base" />
                <span>Key Vault</span>
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">3</span>
              </button>

              <button
                onClick={() => setActiveDemoTab("presets")}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left ${
                  activeDemoTab === "presets"
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <FiLayers className="text-base" />
                <span>Presets Hub</span>
              </button>

              <button
                onClick={() => setActiveDemoTab("audit")}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left ${
                  activeDemoTab === "audit"
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <FiShield className="text-base" />
                <span>Security Audit</span>
                <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${demoAuditFixed ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-300 font-bold"}`}>
                  {demoAuditFixed ? "100%" : "2 Alerts"}
                </span>
              </button>
            </div>

            {/* Mock Main Content Pane */}
            <div className="md:col-span-3 p-6 bg-[#090E20] overflow-y-auto max-h-[500px]">
              {/* TAB 1: HOSTS */}
              {activeDemoTab === "hosts" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-base">SSH Host Profiles</h3>
                      <p className="text-xs text-slate-400 font-mono">~/.ssh/config (Snapshot: Active)</p>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-white shadow-sm">
                      + Add Host
                    </button>
                  </div>

                  {/* Host Card 1 */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-bold text-white text-base">prod-api-cluster</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">AWS EC2</span>
                      </div>
                      <p className="text-xs font-mono text-slate-300">ec2-user@54.210.88.42:22</p>
                      <p className="text-[11px] font-mono text-slate-400">Identity: ~/.ssh/id_ed25519_aws_prod</p>
                    </div>
                    <button
                      onClick={() => handleSimulateConnect("prod-api-cluster")}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-md transition-all shrink-0"
                    >
                      {demoConnectingHost === "prod-api-cluster" ? (
                        <>
                          <FiRefreshCw className="animate-spin text-sm" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <FiPlay className="text-xs" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Host Card 2 */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                        <span className="font-bold text-white text-base">bastion-internal-jump</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">ProxyJump</span>
                      </div>
                      <p className="text-xs font-mono text-slate-300">admin@10.0.1.50:2222</p>
                      <p className="text-[11px] font-mono text-slate-400">ProxyJump gateway.internal.corp</p>
                    </div>
                    <button
                      onClick={() => handleSimulateConnect("bastion-internal-jump")}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all shrink-0"
                    >
                      {demoConnectingHost === "bastion-internal-jump" ? (
                        <>
                          <FiRefreshCw className="animate-spin text-sm text-cyan-400" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <FiPlay className="text-xs" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: KEYS */}
              {activeDemoTab === "keys" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-base">SSH Key Vault</h3>
                      <p className="text-xs text-slate-400">Ed25519 &amp; RSA Keys with ssh-agent Keyring</p>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-white shadow-sm">
                      + Generate Key
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Ed25519</span>
                        <span className="font-bold text-white text-sm">id_ed25519_github_work</span>
                        <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded font-mono">ssh-agent Loaded</span>
                      </div>
                      <p className="text-xs font-mono text-slate-400 mt-1">SHA256:4N9v8k... (chmod 600 ✓)</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">Used by 2 hosts</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">RSA 4096</span>
                        <span className="font-bold text-white text-sm">id_rsa_legacy_bastion</span>
                      </div>
                      <p className="text-xs font-mono text-slate-400 mt-1">SHA256:7X1p2q... (chmod 600 ✓)</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">Used by 1 host</span>
                  </div>
                </div>
              )}

              {/* TAB 3: PRESETS */}
              {activeDemoTab === "presets" && (
                <div className="space-y-4">
                  <div className="pb-2 border-b border-slate-800">
                    <h3 className="font-bold text-white text-base">Built-in Presets Hub</h3>
                    <p className="text-xs text-slate-400">1-Click Wizards for Git, Cloud, Jump Hosts &amp; Proxies</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer">
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <FiLayers className="text-cyan-400" />
                        <span>GitHub Multi-Account</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Personal &amp; Work account isolation with unique keys.</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer">
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <FiServer className="text-blue-400" />
                        <span>AWS EC2 Instance</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Prefilled ec2-user / ubuntu defaults with key binding.</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer">
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <FiLock className="text-purple-400" />
                        <span>Bastion / Jump Host</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Secure ProxyJump chaining for private VPC clusters.</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer">
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <FiTerminal className="text-emerald-400" />
                        <span>Dynamic SOCKS5 Proxy</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Encrypted local SOCKS5 tunnel with -D port binding.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT */}
              {activeDemoTab === "audit" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-base">Security &amp; Permissions Auditor</h3>
                      <p className="text-xs text-slate-400">Strict POSIX 700/600 compliance and weak key inspection</p>
                    </div>
                    {!demoAuditFixed && (
                      <button
                        onClick={() => setDemoAuditFixed(true)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
                      >
                        <FiCheck className="text-sm" />
                        <span>Auto-Fix All (1 Click)</span>
                      </button>
                    )}
                  </div>

                  {demoAuditFixed ? (
                    <div className="p-6 text-center space-y-2 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                      <FiCheckCircle className="text-3xl text-emerald-400 mx-auto" />
                      <h4 className="font-bold text-white text-base">Security Score: 100/100</h4>
                      <p className="text-xs text-slate-300">All ~/.ssh file permissions and key strengths verified clean!</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <FiAlertCircle className="text-amber-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-white">Permissions too open: ~/.ssh/config (644)</p>
                            <p className="text-[11px] text-slate-400">Should be restricted to user-only 600.</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">Auto-Fixable</span>
                      </div>

                      <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <FiAlertCircle className="text-blue-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-white">Stale known_hosts entry: 192.168.1.100</p>
                            <p className="text-[11px] text-slate-400">Host key mismatch warning detected.</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">Resolvable</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES GRID */}
      <section id="features" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold tracking-widest text-cyan-400 uppercase">Architecture &amp; Highlights</h2>
          <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">Engineered for Developer Productivity</p>
          <p className="mt-4 text-slate-400 text-base">
            No more broken config formats, mystery connection dropouts, or hunting through scattered terminal tabs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-xl font-bold">
              <FiCode />
            </div>
            <h3 className="text-lg font-bold text-white">Lossless AST Config Parser</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Maintains full fidelity of your <code className="text-xs font-mono text-cyan-300">~/.ssh/config</code>. Custom comments, indentation, and unsupported directives are never overwritten or lost.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xl font-bold">
              <FiKey />
            </div>
            <h3 className="text-lg font-bold text-white">3-Way Key Conflict Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              When adding hosts with identical key names, resolve in 1 click: Auto-Deduplicate name, Pick from Vault, or Share key binding safely.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold">
              <FiTerminal />
            </div>
            <h3 className="text-lg font-bold text-white">Cross-Terminal Detection</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automatically detects installed terminal emulators: <strong>Ghostty</strong>, <strong>WezTerm</strong>, <strong>iTerm2</strong>, <strong>Alacritty</strong>, <strong>Kitty</strong>, and native terminals.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xl font-bold">
              <FiShield />
            </div>
            <h3 className="text-lg font-bold text-white">Safety-First Single Snapshot</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Prevents file clutter by maintaining a single clean backup at <code className="text-xs font-mono text-cyan-300">~/.ssh/config.sshx.bak</code> on every edit with 1-click rollback.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xl font-bold">
              <FiLock />
            </div>
            <h3 className="text-lg font-bold text-white">Encrypted AES-256-GCM Backups</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Export and import encrypted <code className="text-xs font-mono text-cyan-300">.sshx</code> profile bundles with PBKDF2 password derivation for safe machine-to-machine migrations.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-xl font-bold">
              <FiSliders />
            </div>
            <h3 className="text-lg font-bold text-white">Global Omnibox (Cmd+K)</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Fuzzy-search across all host aliases, IPs, usernames, SSH keys, presets, and action commands with zero mouse interaction required.
            </p>
          </div>
        </div>
      </section>

      {/* 5. DOWNLOADS & INSTALLATION SECTION */}
      <section id="downloads" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold tracking-widest text-cyan-400 uppercase">Cross-Platform Binaries</h2>
          <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">Download SSHX for Your OS</p>
          <p className="mt-4 text-slate-400 text-base">
            Packaged natively for macOS, Linux, and Windows with automatic update support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* macOS Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-cyan-500/30 shadow-xl shadow-cyan-950/20 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <SiApple className="text-3xl text-white" />
                <span className="text-xs font-bold px-2 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">Recommended</span>
              </div>
              <h3 className="text-xl font-bold text-white">macOS</h3>
              <p className="text-sm text-slate-400">
                Universal binary for Apple Silicon (M1/M2/M3/M4) &amp; Intel Macs.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
                <li className="flex items-center gap-2">✓ macOS 11.0 (Big Sur) or later</li>
                <li className="flex items-center gap-2">✓ Universal DMG Installer</li>
              </ul>
            </div>

            <div className="mt-8 space-y-3">
              <a
                href="https://github.com/theasmat/sshx/releases/latest"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-sm shadow-md transition-all"
              >
                <FiDownload />
                <span>Download .dmg</span>
              </a>
            </div>
          </div>

          {/* Linux Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <SiLinux className="text-3xl text-slate-300" />
                <span className="text-xs font-bold px-2 py-1 rounded bg-slate-800 text-slate-300">Ubuntu / Debian / Arch</span>
              </div>
              <h3 className="text-xl font-bold text-white">Linux</h3>
              <p className="text-sm text-slate-400">
                Debian packages (.deb) and portable AppImages for all distributions.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
                <li className="flex items-center gap-2">✓ Native Debian / Ubuntu (.deb)</li>
                <li className="flex items-center gap-2">✓ Universal .AppImage</li>
              </ul>
            </div>

            <div className="mt-8 space-y-2">
              <a
                href="https://github.com/theasmat/sshx/releases/latest"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all"
              >
                <FiDownload />
                <span>Download .deb</span>
              </a>
              <a
                href="https://github.com/theasmat/sshx/releases/latest"
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-all"
              >
                <span>Download AppImage</span>
              </a>
            </div>
          </div>

          {/* Windows Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FaWindows className="text-3xl text-blue-400" />
                <span className="text-xs font-bold px-2 py-1 rounded bg-slate-800 text-slate-300">Windows 10 / 11</span>
              </div>
              <h3 className="text-xl font-bold text-white">Windows</h3>
              <p className="text-sm text-slate-400">
                Stand-alone Windows MSI installer with Windows Terminal integration.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
                <li className="flex items-center gap-2">✓ 64-bit MSI installer (.msi)</li>
                <li className="flex items-center gap-2">✓ Windows Terminal launch support</li>
              </ul>
            </div>

            <div className="mt-8 space-y-3">
              <a
                href="https://github.com/theasmat/sshx/releases/latest"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all"
              >
                <FiDownload />
                <span>Download .msi</span>
              </a>
            </div>
          </div>
        </div>

        {/* macOS Gatekeeper Troubleshooting Banner */}
        <div id="installation" className="mt-12 max-w-4xl mx-auto p-6 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-lg space-y-3 text-left">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <FiAlertCircle className="text-lg" />
            <span>macOS Gatekeeper Note (Unnotarized Open Source Binary)</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Because SSHX is a community open-source project without a paid Apple Developer subscription, macOS may prompt with <em>&quot;SSHX is damaged and can&apos;t be opened&quot;</em> or <em>&quot;Unidentified Developer&quot;</em>.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="font-mono text-xs text-cyan-300 overflow-x-auto">
              {xattrCommand}
            </div>
            <button
              onClick={handleCopyXattr}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 shrink-0"
            >
              {copiedXattr ? (
                <>
                  <FiCheck className="text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <FiCopy className="text-slate-400" />
                  <span>Copy Command</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Alternatively: Right-click <kbd className="font-mono">SSHX.app</kbd> in <kbd className="font-mono">/Applications</kbd> → Click <strong>Open</strong> → Click <strong>Open</strong> in the prompt.
          </p>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="relative z-10 border-t border-slate-800 bg-[#04060C] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-600 p-[1px]">
              <div className="w-full h-full bg-[#090E20] rounded-[7px] flex items-center justify-center">
                <FiTerminal className="text-cyan-400 text-sm" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-white text-sm">SSHX</span>
              <span className="text-xs text-slate-500">© 2026 Asmat &amp; SSHX Contributors. MIT Attribution License.</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
            <a href="https://github.com/theasmat/sshx" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">GitHub</a>
            <a href="https://github.com/theasmat/sshx/releases" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">Releases</a>
            <a href="https://github.com/theasmat/sshx/blob/main/CONTRIBUTING.md" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">Contributing</a>
            <a href="https://github.com/theasmat/sshx/blob/main/SECURITY.md" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">Security</a>
            <a href="https://github.com/theasmat/sshx/blob/main/LICENSE" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">License</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
