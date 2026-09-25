<p align="center">
  <a href="https://github.com/theasmat/sshx">
    <img src="public/images/logo/sshx-badge.svg" width="420" alt="SSHX — Modern SSH Desktop Manager" />
  </a>
</p>

<p align="center">
  <b>A lightning-fast, secure, and intuitive desktop manager for <code>~/.ssh/config</code>, SSH keys, and native terminal sessions.</b>
  <br />
  Built with <b>Tauri v2</b>, <b>Rust</b>, and <b>React 19 + TypeScript</b>.
</p>

<p align="center">
  <a href="https://github.com/theasmat/sshx/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/theasmat/sshx/ci.yml?branch=main&label=CI&logo=github&style=flat-square" alt="CI Status" /></a>
  <a href="https://github.com/theasmat/sshx/releases"><img src="https://img.shields.io/github/v/release/theasmat/sshx?color=blue&style=flat-square" alt="Latest Release" /></a>
  <a href="https://github.com/theasmat/sshx/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-purple?style=flat-square" alt="License" /></a>
  <a href="https://tauri.app"><img src="https://img.shields.io/badge/Tauri-v2-24C8D8?logo=tauri&style=flat-square" alt="Tauri v2" /></a>
  <a href="https://www.rust-lang.org"><img src="https://img.shields.io/badge/Rust-2021-DEA584?logo=rust&style=flat-square" alt="Rust" /></a>
</p>

---

## ⚡ Highlights & Key Features

### 🎛️ Intelligent SSH Host Management
- **Safety First with Dedicated Snapshots**: Automatically maintains a single clean device snapshot (`~/.ssh/config.sshx.bak`) on every edit with 1-click rollback and preview.
- **Dependency-Aware Deletion**: Visual confirmation modals analyze dependencies (e.g. key usage, port forwarding) before removing entries.

### 🔑 SSH Key Vault & Smart Conflict Resolution
- **1-Click Key Generator**: Generate **Ed25519** (recommended) or **RSA 4096-bit** keys with automatic permissions (`chmod 600`).
- **3-Option Key Conflict Resolver**: When adding a host with an existing key name, resolve in 1 click:
  1. *Auto-Resolve*: Generates a unique name (e.g. `id_ed25519_github_work_2`).
  2. *Manual Pick*: Choose from your existing key vault.
  3. *Force Use Existing*: Shared key binding.
- **ssh-agent Keyring Integration**: View which keys are loaded in memory and add/remove with one click.
- **Impact Analysis Modal**: Warns if deleting an SSH key will break access to connected host profiles and offers auto-unlinking.

### 🚀 1-Click Terminal Launching
- Auto-detects installed terminal emulators:
  - **Ghostty**, **WezTerm**, **iTerm2**, **Alacritty**, **Kitty**, and **Terminal.app** (macOS).
- 1-Click to test connectivity (`ssh -T`) or launch direct terminal sessions.

### 🌐 Presets Hub & Custom Template Builder
- **Built-in Presets**:
  - *Git Providers*: GitHub Multi-Account isolation, GitLab, Bitbucket.
  - *Cloud Providers*: AWS EC2, DigitalOcean, Hetzner, Oracle Cloud, Google Cloud.
  - *Network Infrastructure*: Bastion / Jump hosts (`ProxyJump`), Local & Dynamic SOCKS5 Port Forwarding (`-L`, `-D`).
  - *HomeLab & IoT*: Raspberry Pi, Proxmox, TrueNAS.
- **Dual Mode Launch**: Open any preset in either the **Interactive Wizard** (step-by-step guidance) or **Fast Mode** (instant prefill).
- **Custom Preset Manager**: Add, edit, and delete custom connection presets tailored to your organization.

### 🛡️ Security Audit & Permission Auto-Repair
- Audits file permissions for `~/.ssh` (`700`), `config` (`600`), and private keys (`600`).
- Scans for legacy weak RSA keys (< 2048 bits), stale `known_hosts` entries, and syntax anomalies.
- **Selective Auto-Fix Modal**: Choose exactly which issues to repair with one click.

### 📦 Encrypted Backups & Migration
- Export and import password-protected, encrypted backups (`.sshx`) using **AES-256-GCM + PBKDF2** key derivation.

### ⚡ Global Omnibox & Command Palette (`Cmd+K`)
- Unified instant search across hosts, presets, keys, known hosts, and action commands.

---

## 📥 Installation

### macOS (Apple Silicon & Intel)
Download the latest `.dmg` from [GitHub Releases](https://github.com/theasmat/sshx/releases).

```bash
# Or build locally
git clone git@github-personal:theasmat/sshx.git
cd sshx
npm install
npm run tauri build
```

### Linux (.deb / .AppImage)
Download `.deb` or `.AppImage` from the [Releases page](https://github.com/theasmat/sshx/releases).

### Windows (.msi / .exe)
Download the installer from [Releases](https://github.com/theasmat/sshx/releases).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Cmd</kbd> + <kbd>K</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | Open Global Omnibox & Command Palette |
| <kbd>Cmd</kbd> + <kbd>N</kbd> / <kbd>Ctrl</kbd> + <kbd>N</kbd> | Create New Host Profile |
| <kbd>Cmd</kbd> + <kbd>R</kbd> / <kbd>Ctrl</kbd> + <kbd>R</kbd> | Reload SSH Config & Data |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Navigate Host List |
| <kbd>Enter</kbd> | Connect to Selected Host in Terminal |
| <kbd>Cmd</kbd> + <kbd>+</kbd> / <kbd>Cmd</kbd> + <kbd>-</kbd> | Zoom In / Out (70% - 150%) |
| <kbd>Cmd</kbd> + <kbd>0</kbd> | Reset Zoom to 100% |

---

## 🛠️ Local Development

### Prerequisites
- **Node.js**: `v20+` or `v22+`
- **Rust**: `1.80+` (`rustup update stable`)
- **macOS / Linux / Windows build tools**

### Setup & Run
```bash
# 1. Clone repository
git clone git@github-personal:theasmat/sshx.git
cd sshx

# 2. Install dependencies
npm install

# 3. Start development server
npm run tauri dev
```

### Run Tests & Verification
```bash
# Frontend typecheck & build
npm run build

# Rust unit tests
cargo test --manifest-path src-tauri/Cargo.toml

# Rust cargo check
cargo check --manifest-path src-tauri/Cargo.toml
```

---

## 🤝 Contributing

Contributions, feature requests, and bug reports are welcome! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

---

## 📄 License

SSHX is licensed under the [MIT License](LICENSE).
