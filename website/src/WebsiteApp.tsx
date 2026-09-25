import React, { useState } from "react";
import { App as DesktopApp } from "../../src/App";
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

      {/* 3. LIVE INTERACTIVE DESKTOP APP EMBED */}
      <section id="demo" className="relative z-10 py-12 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 text-xs font-medium mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>100% Real Interactive Desktop Engine</span>
          </div>
          <h2 className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">Live Desktop UI</h2>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">Full Interactive App Experience</p>
          <p className="mt-2 text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto">
            Try the real SSHX React &amp; Tailwind interface directly in your browser. Switch views, add profiles, test connections, manage keys, and execute security audits live.
          </p>
        </div>

        {/* Real Desktop Window Mockup Frame */}
        <div className="rounded-xl bg-[#070a10] border border-slate-800 shadow-2xl overflow-hidden text-left">
          {/* Mac Window Titlebar */}
          <div className="h-10 bg-[#060912] border-b border-slate-800 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <img src="/images/logo/sshx-icon.svg" alt="SSHX" className="w-4 h-4 rounded" />
              <span className="font-bold text-slate-200">SSHX Desktop</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-cyan-400 text-[11px] bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">Live Browser Engine</span>
            </div>

            <div className="text-[11px] font-mono text-slate-500 hidden sm:flex items-center gap-1.5">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">⌘K</kbd>
              <span>for Omnibox</span>
            </div>
          </div>

          {/* Embedded Real App Component */}
          <div className="h-[620px] w-full overflow-hidden bg-[#070a10]">
            <DesktopApp embedded={true} />
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
