# Contributing to SSHX

Thank you for your interest in contributing to **SSHX**! Whether you are reporting a bug, proposing a feature, improving documentation, or submitting a pull request, your contributions are warmly appreciated.

---

## 🚀 Getting Started

### 1. Prerequisites
Make sure you have the following installed on your machine:
- **Node.js** `v20` or higher (`npm`)
- **Rust** stable toolchain (`cargo`, `rustc`):
  ```bash
  rustup update stable
  ```
- **OS-specific dependencies**:
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux (Debian/Ubuntu)**:
    ```bash
    sudo apt install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libssl-dev build-essential
    ```

---

## 🛠️ Development Workflow

### Clone & Install
```bash
# 1. Fork & clone the repo
git clone git@github-personal:theasmat/sshx.git
cd sshx

# 2. Install frontend dependencies
npm install

# 3. Start development environment
npm run tauri dev
```

---

## 📁 Repository Structure

```
sshx/
├── src/                    # Frontend React 19 + TypeScript + Tailwind
│   ├── components/         # Reusable UI components (Modals, Cards, Omnibox)
│   ├── views/              # View panes (Hosts, AddHost, Keys, KnownHosts, Audit, Raw, Settings)
│   ├── utils/              # Utilities (searchEngine, backupCrypto, keyUtils)
│   ├── presets.ts          # Preset loader & custom preset storage
│   ├── types.ts            # TypeScript interfaces & types
│   ├── App.tsx             # Main application entry and router
│   └── main.tsx            # Global lifecycle & desktop security capture
├── src-tauri/              # Rust Backend (Tauri v2)
│   ├── src/
│   │   ├── config_parser.rs     # Lossless ~/.ssh/config parser & serializer
│   │   ├── key_manager.rs       # SSH key generator, ssh-agent, deletion
│   │   ├── known_hosts.rs       # ~/.ssh/known_hosts parser & fixer
│   │   ├── security_audit.rs    # File permission & key strength audit
│   │   ├── terminal_launcher.rs # Cross-terminal process launcher
│   │   └── lib.rs               # Tauri command handlers & plugin registry
│   ├── Cargo.toml          # Rust dependencies & optimization profiles
│   └── tauri.conf.json     # Tauri app configuration & updater endpoints
└── .github/workflows/      # GitHub Actions CI/CD workflows
    ├── ci.yml              # Typecheck, unit tests & cross-platform builds
    └── release.yml         # Tagged release & auto-updater artifacts
```

---

## 🧪 Testing & Validation

Always run the test and check suites before submitting a PR:

```bash
# 1. Typecheck and build frontend
npm run build

# 2. Run Rust backend unit tests
cargo test --manifest-path src-tauri/Cargo.toml

# 3. Verify Rust compiler check
cargo check --manifest-path src-tauri/Cargo.toml
```

---

## 🎨 Code Style & Conventions

- **TypeScript / React**: Use functional components with TypeScript types. Avoid using `any` when explicit types can be declared in `src/types.ts`.
- **Styling**: Use Tailwind CSS utilities adhering to the dark-mode aesthetic palette (`#070a10`, `#0b0f19`, `#121829`, `#1f2942`).
- **Rust**: Keep code idiomatic and format using `cargo fmt`.
- **Safety**: Never perform destructive config overwrites without creating timestamped backups (`config.bak.<timestamp>`).

---

## 🔀 Submitting Pull Requests

1. **Branch Naming**:
   - `feat/feature-name`
   - `fix/bug-description`
   - `docs/improvement`
2. **Commit Messages**: Write concise, conventional commit messages (e.g. `feat: add custom preset editor modal`).
3. **Pull Request**: Open a PR against the `main` branch with a clear summary of changes and screenshots if UI is affected.

Thank you for making SSHX better for everyone!
