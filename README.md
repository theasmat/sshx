# SSHX — Modern SSH Config & Key Manager

A blazing-fast, lightweight desktop GUI built with **Tauri v2 + Rust** and **React + TypeScript** to visually view, edit, organize, validate, and manage `~/.ssh/config` and SSH keys—launching sessions directly into your preferred native terminal (Ghostty, WezTerm, iTerm2, Alacritty, Kitty, Terminal.app).

---

## ✨ Features

- **🎛️ Graphical SSH Host Manager:** Lossless two-way sync with `~/.ssh/config` (preserves all existing comments, includes, and custom formatting with automatic timestamped backups).
- **⚡ 1-Click Quick Presets:**
  - **GitHub Multi-Account Wizard:** Configure `github-personal`, `github-work`, or custom accounts with dedicated keys, 1-click public key copying for GitHub Settings, and connection tests (`ssh -T git@...`).
  - **GitLab & Bitbucket:** Account isolation and key management.
  - **Cloud VPS:** Presets for AWS EC2 / Lightsail, Hetzner Cloud, DigitalOcean, and Oracle Cloud.
  - **Bastion / Jump Hosts:** Route target servers through jump hosts via `ProxyJump`.
  - **Homelab & Local Nodes:** Quick setup for Raspberry Pi and local subnet machines.
  - **Port Forwarding / Tunnels:** Setup Local (`-L`) and Dynamic SOCKS5 (`-D`) proxies.
- **🚀 1-Click Terminal Launch:** Auto-detects installed terminals on macOS (Ghostty, WezTerm, iTerm2, Alacritty, Kitty, Terminal.app) and launches `ssh <alias>` in 1 click.
- **🔑 SSH Key Vault:** Inspect fingerprints (SHA256), comments, and active keys in `ssh-agent`. 1-click Ed25519 & RSA 4096 key generator.
- **📜 Known Hosts Cleaner:** Search and delete entries from `~/.ssh/known_hosts` to instantly fix *"Host key verification failed"* errors.
- **🛡️ Security & Permissions Auditor:** Audits file permissions (`chmod 700 ~/.ssh`, `chmod 600 id_*`), weak RSA keys, and duplicate host aliases with 1-click auto-repair.
- **📝 Direct Raw Config Editor:** Syntax-highlighted lossless editor for `~/.ssh/config`.

---

## 🛠️ Development

### Prerequisites
- Node.js 18+ (`npm`)
- Rust & Cargo (`rustc 1.77+`)

### Run in Development
```bash
# Install dependencies
npm install

# Start Tauri dev app
npm run tauri dev
```

### Build Production Bundle
```bash
npm run tauri build
```
