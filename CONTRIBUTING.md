<p align="center">
  <a href="https://github.com/theasmat/sshx">
    <img src="public/images/logo/sshx-badge.svg" width="380" alt="SSHX — Contributing Guide" />
  </a>
</p>

<p align="center">
  <a href="README.md"><b>📖 Overview & Features</b></a> &nbsp;|&nbsp;
  <a href="README.md#-installation"><b>⚡ Quick Install</b></a> &nbsp;|&nbsp;
  <a href="CONTRIBUTING.md"><b>🤝 Contributing Guide</b></a> &nbsp;|&nbsp;
  <a href="SECURITY.md"><b>🛡️ Security Policy</b></a> &nbsp;|&nbsp;
  <a href="https://github.com/theasmat/sshx/releases"><b>📦 Releases</b></a>
</p>

---

# 🤝 Contributing to SSHX

Thank you for your interest in contributing to **SSHX**! Whether you are reporting a bug, proposing a new feature, polishing the UI, or submitting a pull request, your contributions are warmly appreciated.

---

## 🚀 Getting Started

### 1. Prerequisites
Make sure you have the following installed on your development machine:
- **Node.js**: `v20+` or `v22+` (`npm`)
- **Rust Toolchain**: `stable` (`cargo`, `rustc`):
  ```bash
  rustup update stable
  ```
- **OS-specific build packages**:
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux (Debian/Ubuntu)**:
    ```bash
    sudo apt update && sudo apt install -y \
      libwebkit2gtk-4.1-dev \
      libappindicator3-dev \
      librsvg2-dev \
      patchelf \
      libssl-dev \
      build-essential
    ```
  - **Windows**: Microsoft Visual Studio C++ Build Tools & WebView2.

---

## 🛠️ Development Workflow

```bash
# 1. Clone your fork of the repository (HTTPS)
git clone https://github.com/theasmat/sshx.git
cd sshx

# 2. Install frontend dependencies
npm install

# 3. Start local development mode with hot-reloading
npm run tauri dev
```

---

## 📁 Repository Architecture

```
sshx/
├── src/                    # Frontend (React 19 + TypeScript + Tailwind CSS)
│   ├── components/         # UI Components (Modals, Cards, Omnibox, Toast)
│   ├── views/              # View Panes (Hosts, AddHost, Keys, KnownHosts, Audit, Raw, Settings)
│   ├── utils/              # Client Utilities (searchEngine, backupCrypto, keyUtils)
│   ├── presets.ts          # Built-in Preset Library & Custom Preset Engine
│   ├── types.ts            # Shared TypeScript Interfaces & Data Models
│   ├── App.tsx             # Root Application Shell & State Orchestration
│   └── main.tsx            # App Entrypoint & Desktop Event Listeners
├── src-tauri/              # Backend (Rust + Tauri v2)
│   ├── src/
│   │   ├── config_parser.rs     # Lossless ~/.ssh/config AST parser & serializer
│   │   ├── key_manager.rs       # SSH key generation, ssh-agent, impact analysis
│   │   ├── known_hosts.rs       # ~/.ssh/known_hosts parser & collision resolver
│   │   ├── security_audit.rs    # POSIX permissions & weak key strength auditor
│   │   ├── terminal_launcher.rs # Cross-terminal emulator process launcher
│   │   └── lib.rs               # Tauri IPC commands & plugin bindings
│   ├── Cargo.toml          # Rust dependencies & optimization profiles
│   └── tauri.conf.json     # Tauri app configuration & bundle targets
├── .github/workflows/      # Automated CI/CD Pipelines
│   ├── ci.yml              # Fast automated testing & typecheck on PRs
│   └── release.yml         # Tag & manual multi-platform release packager
└── install.sh              # 1-line universal installer for macOS & Linux
```

---

## 🧪 Testing & Code Verification

Before opening a pull request, ensure all local verification checks pass:

```bash
# 1. Frontend typecheck & production bundle test
npm run build

# 2. Rust unit tests
cargo test --manifest-path src-tauri/Cargo.toml

# 3. Rust compiler check
cargo check --manifest-path src-tauri/Cargo.toml
```

---

## 🎨 Guidelines & Standards

- **TypeScript / React**: Strict type safety. Keep components modular and avoid `any` where interface types can be declared in `src/types.ts`.
- **UI & Styling**: Follow the curated dark theme design tokens (`#070a10`, `#0b0f19`, `#121829`, `#1f2942`) with high contrast and smooth micro-transitions.
- **Safety First**: Destructive actions on user SSH files must always update the dedicated single snapshot (`~/.ssh/config.sshx.bak`) first.

---

## 🔀 Submitting Pull Requests

1. Create a descriptive feature branch (`git checkout -b feat/my-enhancement`).
2. Commit your changes using conventional commits (`git commit -m "feat: add support for custom terminal profiles"`).
3. Push to your branch (`git push origin feat/my-enhancement`).
4. Open a Pull Request on GitHub with a concise description of changes and UI screenshots if visual modifications were made.

Thank you for helping make SSHX the best desktop SSH manager!
