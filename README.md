<p align="center">
  <a href="https://github.com/theasmat/sshx">
    <img src="public/images/logo/sshx-badge.svg" width="460" alt="SSHX — Modern SSH Desktop Manager" />
  </a>
</p>

<p align="center">
  <b>A lightning-fast, secure, and intuitive desktop manager for <code>~/.ssh/config</code>, SSH keys, and native terminal sessions.</b>
  <br />
  Built with <b>Tauri v2</b>, <b>Rust</b>, and <b>React 19 + TypeScript</b>.
</p>

<p align="center">
  <a href="https://github.com/theasmat/sshx/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/theasmat/sshx/ci.yml?branch=main&label=CI%20Build&style=for-the-badge&logo=githubactions&logoColor=white" alt="CI Build Status" />
  </a>
  <a href="https://github.com/theasmat/sshx/releases">
    <img src="https://img.shields.io/github/v/release/theasmat/sshx?color=10B981&label=Latest%20Release&style=for-the-badge&logo=github&logoColor=white" alt="Latest Release" />
  </a>
  <a href="https://tauri.app">
    <img src="https://img.shields.io/badge/Tauri-v2.0-24C8D8?style=for-the-badge&logo=tauri&logoColor=white" alt="Tauri v2" />
  </a>
  <a href="https://www.rust-lang.org">
    <img src="https://img.shields.io/badge/Rust-2021-DEA584?style=for-the-badge&logo=rust&logoColor=white" alt="Rust 2021" />
  </a>
  <a href="https://react.dev">
    <img src="https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  </a>
  <a href="https://www.typescriptlang.org">
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-8B5CF6?style=for-the-badge&logo=open-source-initiative&logoColor=white" alt="MIT License" />
  </a>
</p>

<p align="center">
  <a href="README.md"><b>📖 Overview</b></a> &nbsp;|&nbsp;
  <a href="#-installation"><b>⚡ Quick Install</b></a> &nbsp;|&nbsp;
  <a href="#-highlights--key-features"><b>✨ Features</b></a> &nbsp;|&nbsp;
  <a href="#-keyboard-shortcuts"><b>⌨️ Shortcuts</b></a> &nbsp;|&nbsp;
  <a href="CONTRIBUTING.md"><b>🤝 Contributing Guide</b></a> &nbsp;|&nbsp;
  <a href="SECURITY.md"><b>🛡️ Security Policy</b></a> &nbsp;|&nbsp;
  <a href="https://github.com/theasmat/sshx/releases"><b>📦 Releases</b></a>
</p>

---

<p align="center">
  <a href="https://github.com/theasmat/sshx/releases/latest">
    <img src="https://img.shields.io/badge/⬇%20Download-Latest%20Release-0070F3?style=for-the-badge&logo=apple&logoColor=white" alt="Download Latest Release" height="38" />
  </a>
  &nbsp;&nbsp;
  <a href="https://github.com/theasmat/sshx/releases">
    <img src="https://img.shields.io/badge/📦%20All%20Releases-Changelog-1F2937?style=for-the-badge&logo=github&logoColor=white" alt="View All Releases" height="38" />
  </a>
  &nbsp;&nbsp;
  <a href="#-1-line-universal-installer-macos--linux">
    <img src="https://img.shields.io/badge/⚡%201--Line-Install%20Script-10B981?style=for-the-badge&logo=gnubash&logoColor=white" alt="1-Line Install Script" height="38" />
  </a>
</p>

---

## ⚡ 1-Line Universal Installer (macOS & Linux)

Install or update SSHX instantly with a single terminal command:

```bash
curl -fsSL https://raw.githubusercontent.com/theasmat/sshx/main/install.sh | bash
```

> **Automated Installer Features:**
> - 🎯 **Auto-detects** CPU architecture (`Apple Silicon arm64`, `Intel x64`, `Linux aarch64 / amd64`).
> - 📦 **Downloads** the latest release directly from GitHub.
> - 🍎 **macOS**: Installs to `/Applications`, clears quarantine attributes (`xattr -cr`), and ad-hoc signs the app so it launches smoothly.
> - 🐧 **Linux**: Installs via `.deb` package or sets up `.AppImage` with desktop application launcher.
> - 🧹 **Zero Junk**: Cleans up all temporary downloaded artifacts on completion.

---

## ⚡ Highlights & Key Features

### 🎛️ Intelligent SSH Host Management
- **Lossless AST Parser**: Reads, validates, and serializes your `~/.ssh/config` without modifying unrelated comments, indentations, or custom directives.
- **Dedicated Single Device Snapshot**: Always maintains an isolated backup at `~/.ssh/config.sshx.bak` before making changes, preventing file sprawl while ensuring instant 1-click rollback.
- **Visual Dependency-Aware Deletion**: Analyzes key bindings, proxy jumps, and port forwardings before removing any entry.

### 🔑 SSH Key Vault & 3-Way Conflict Resolver
- **1-Click Key Generator**: Generate **Ed25519** (modern & fast) or **RSA 4096-bit** keys with strict POSIX permissions (`chmod 600`) in seconds.
- **Smart Conflict Engine**: When adding a host with an existing key name, resolve in 1 click:
  1. *Auto-Resolve*: Generates a unique name (e.g. `id_ed25519_github_work_2`).
  2. *Manual Pick*: Choose an existing key from your vault.
  3. *Shared Key Binding*: Reuse the existing key cleanly.
- **ssh-agent Keyring Integration**: Real-time view of keys currently loaded in memory with 1-click load / unload.
- **Key Impact Analysis Modal**: Warns before deleting an SSH key if connected host profiles rely on it.

### 🚀 1-Click Native Terminal Launching
- Auto-detects installed terminal emulators:
  - **Ghostty**, **WezTerm**, **iTerm2**, **Alacritty**, **Kitty**, and **Terminal.app** (macOS).
  - Native Linux terminal emulators and Windows Terminal.
- 1-Click to test connectivity (`ssh -T`) or launch active terminal sessions.

### 🌐 Presets Hub & Custom Template Builder
- **Built-in Presets**:
  - *Git Providers*: GitHub Multi-Account isolation, GitLab, Bitbucket.
  - *Cloud Infrastructure*: AWS EC2, DigitalOcean, Hetzner, Oracle Cloud, Google Cloud.
  - *Network Proxies*: Bastion / Jump Hosts (`ProxyJump`), Dynamic SOCKS5 & Local Port Forwarding (`-D`, `-L`).
  - *HomeLab & IoT*: Raspberry Pi, Proxmox, TrueNAS.
- **Dual Launch Modes**: Open any preset in either the **Interactive Wizard** (guided step-by-step) or **Fast Mode** (prefilled instantly).
- **Custom Preset Creator**: Save and reuse customized connection templates for your team or infrastructure.

### 🛡️ Automated Security Audit & Permission Auto-Repair
- Validates permissions on `~/.ssh` (`700`), `config` (`600`), and private keys (`600`).
- Scans for legacy weak RSA keys (< 2048 bits), stale `known_hosts` entries, and syntax anomalies.
- **Selective Auto-Fix Modal**: Choose exactly which security findings to repair with one click.

### 📦 Encrypted Backups & Migration
- Export and import password-protected encrypted backups (`.sshx`) using **AES-256-GCM + PBKDF2** key derivation.

### ⚡ Global Omnibox & Command Palette (`Cmd+K`)
- Instant fuzzy search across hosts, presets, keys, known hosts, and action commands with keyboard navigation.

---

## 📥 Installation

### 🍎 macOS (Apple Silicon & Intel)

1. Download the latest **`.dmg`** from [GitHub Releases](https://github.com/theasmat/sshx/releases/latest).
2. Open the `.dmg` and drag **SSHX** into your **Applications** folder.

> [!IMPORTANT]
> **macOS Gatekeeper Note (Unnotarized Open Source App)**  
> Because SSHX is a community open-source project and is not distributed through a paid Apple Developer certificate, macOS Gatekeeper may show a notice: *"SSHX is damaged and can't be opened"* or *"Developer cannot be verified"*.
>
> **How to bypass in 1 second:**
>
> **Option 1 — Terminal (Fastest)**:
> ```bash
> xattr -cr /Applications/SSHX.app
> ```
> *(Optional: re-sign locally if needed: `codesign --force --deep --sign - /Applications/SSHX.app`)*
>
> **Option 2 — System Settings**:
> 1. Right-click (or <kbd>Control</kbd> + click) `SSHX.app` in `/Applications` and select **Open**.
> 2. Click **Open** in the confirmation prompt.  
> *(Or go to **macOS System Settings** → **Privacy & Security** → scroll down and click **Open Anyway**).*

---

### 🐧 Linux (.deb / .AppImage)

Download the package for your distribution from [GitHub Releases](https://github.com/theasmat/sshx/releases/latest):

- **Ubuntu / Debian (.deb)**:
  ```bash
  sudo dpkg -i SSHX_*_amd64.deb || sudo apt-get install -f -y
  ```
- **Universal AppImage**:
  ```bash
  chmod +x SSHX_*_amd64.AppImage
  ./SSHX_*_amd64.AppImage
  ```

---

### 🪟 Windows (.msi / .exe)

1. Download the **`.msi`** or **`.exe`** installer from [GitHub Releases](https://github.com/theasmat/sshx/releases/latest).
2. If Windows SmartScreen appears: click **More info** → click **Run anyway**.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Cmd</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | Open Global Omnibox & Command Palette |
| <kbd>Cmd</kbd> + <kbd>N</kbd> / <kbd>Ctrl</kbd> + <kbd>N</kbd> | Create New Host Profile |
| <kbd>Cmd</kbd> + <kbd>R</kbd> / <kbd>Ctrl</kbd> + <kbd>R</kbd> | Reload SSH Config & Refresh Data |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Navigate Host & Search Lists |
| <kbd>Enter</kbd> | Connect to Selected Host in Terminal |
| <kbd>Cmd</kbd> + <kbd>+</kbd> / <kbd>Cmd</kbd> + <kbd>-</kbd> | Zoom In / Out (70% – 150%) |
| <kbd>Cmd</kbd> + <kbd>0</kbd> | Reset UI Zoom to 100% |

---

## 🛠️ Local Development & Contributing

Want to contribute to SSHX? Read our comprehensive **[Contributing Guide](CONTRIBUTING.md)** for architecture details, coding guidelines, and PR procedures.

```bash
# 1. Clone repository
git clone git@github-personal:theasmat/sshx.git
cd sshx

# 2. Install dependencies
npm install

# 3. Start development server
npm run tauri dev
```

---

## 📄 License

SSHX is licensed under the [MIT License](LICENSE).
