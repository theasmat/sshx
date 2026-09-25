# 🛡️ Security Policy & Architecture

<p align="center">
  <a href="README.md"><b>📖 Overview & Features</b></a> &nbsp;|&nbsp;
  <a href="README.md#-installation"><b>⚡ Quick Install</b></a> &nbsp;|&nbsp;
  <a href="CONTRIBUTING.md"><b>🤝 Contributing Guide</b></a> &nbsp;|&nbsp;
  <a href="SECURITY.md"><b>🛡️ Security Policy</b></a> &nbsp;|&nbsp;
  <a href="https://github.com/theasmat/sshx/releases"><b>📦 Releases</b></a>
</p>

---

## 🔒 Security Principles

SSHX is built with a **security-first philosophy** for managing sensitive local SSH configurations and credentials:

1. **Local-Only Zero-Telemetry Architecture**:
   - SSHX operates 100% locally on your machine.
   - No host configurations, credentials, private keys, or known hosts ever leave your device or get sent over the network.
2. **Dedicated Single Device Snapshot Protection**:
   - Before applying any modification to `~/.ssh/config`, SSHX automatically preserves an isolated backup at `~/.ssh/config.sshx.bak`.
   - 1-click rollback and side-by-side diff previews ensure you can recover from accidental deletions instantly.
3. **AES-256-GCM Backup Encryption**:
   - Encrypted profile backups (`.sshx`) use authenticated **AES-256-GCM** encryption with **PBKDF2** key derivation (100,000 iterations + cryptographically secure 16-byte salt and 12-byte IV).
4. **Strict POSIX File Permission Enforcement**:
   - Automated security scanner validates file permissions on `~/.ssh` (`700`), `config` (`600`), and private keys (`600`) with 1-click auto-repair.

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability within SSHX, please **do not open a public GitHub issue**.

Please report vulnerabilities directly via:
- **GitHub Private Vulnerability Reporting**: [Report a Security Advisory](https://github.com/theasmat/sshx/security/advisories/new)
- **Security Contact**: Reach out privately to the maintainers with a detailed description of the issue, steps to reproduce, and potential impact.

We take security concerns seriously and will acknowledge receipt within 48 hours and work with you on a coordinated patch and disclosure timeline.

---

## 🔐 Supported Versions

| Version | Supported |
| :--- | :--- |
| `>= 0.1.0` | ✅ Active Security Support |
| `< 0.1.0` | ❌ End of Life |
