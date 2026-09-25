use serde::{Deserialize, Serialize};
use std::fs;
use crate::config_parser::{get_ssh_dir, get_ssh_config_path, read_ssh_config};
use crate::key_manager::list_ssh_keys;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuditIssue {
    pub id: String,
    pub severity: String, // "critical", "warning", "info"
    pub category: String, // "permissions", "syntax", "keys", "hosts"
    pub title: String,
    pub description: String,
    pub path: Option<String>,
    pub fixable: bool,
    pub fix_action: Option<String>,
    pub fix_preview: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SecurityAuditReport {
    pub total_hosts: usize,
    pub total_keys: usize,
    pub score: u32, // 0 to 100
    pub issues: Vec<AuditIssue>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SelectiveFixRequest {
    pub id: String,
    pub fix_action: String,
    pub path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SelectiveFixResponse {
    pub success: bool,
    pub fixed_count: usize,
    pub messages: Vec<String>,
    pub report: SecurityAuditReport,
}

pub fn run_security_audit() -> Result<SecurityAuditReport, String> {
    let mut issues = Vec::new();
    let ssh_dir = get_ssh_dir();

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;

        // 1. Check ~/.ssh directory permissions (must be 700)
        if ssh_dir.exists() {
            if let Ok(meta) = fs::metadata(&ssh_dir) {
                let mode = meta.permissions().mode() & 0o777;
                if mode != 0o700 {
                    issues.push(AuditIssue {
                        id: "perm_ssh_dir".to_string(),
                        severity: "critical".to_string(),
                        category: "permissions".to_string(),
                        title: "Insecure ~/.ssh Directory Permissions".to_string(),
                        description: format!("Current permissions are {:o}. Standard Unix SSH policy requires 700 (drwx------).", mode),
                        path: Some(ssh_dir.to_string_lossy().to_string()),
                        fixable: true,
                        fix_action: Some("fix_ssh_dir_perms".to_string()),
                        fix_preview: Some("chmod 700 ~/.ssh".to_string()),
                    });
                }
            }
        }

        // 2. Check ~/.ssh/config permissions (should be 600)
        let config_path = get_ssh_config_path();
        if config_path.exists() {
            if let Ok(meta) = fs::metadata(&config_path) {
                let mode = meta.permissions().mode() & 0o777;
                if mode != 0o600 && mode != 0o644 {
                    issues.push(AuditIssue {
                        id: "perm_config".to_string(),
                        severity: "warning".to_string(),
                        category: "permissions".to_string(),
                        title: "Insecure Config File Permissions".to_string(),
                        description: format!("Current config permissions are {:o}. Recommended is 600 (-rw-------).", mode),
                        path: Some(config_path.to_string_lossy().to_string()),
                        fixable: true,
                        fix_action: Some("fix_config_perms".to_string()),
                        fix_preview: Some("chmod 600 ~/.ssh/config".to_string()),
                    });
                }
            }
        }
    }

    // 3. Check Keys
    let keys = list_ssh_keys().unwrap_or_default();
    for k in &keys {
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if let Ok(meta) = fs::metadata(&k.private_path) {
                let mode = meta.permissions().mode() & 0o777;
                if mode != 0o600 {
                    issues.push(AuditIssue {
                        id: format!("perm_key_{}", k.file_name),
                        severity: "critical".to_string(),
                        category: "permissions".to_string(),
                        title: format!("Insecure Private Key: {}", k.file_name),
                        description: format!("Private key has permissions {:o}. SSH requires 600 (-rw-------) or connection will be rejected.", mode),
                        path: Some(k.private_path.clone()),
                        fixable: true,
                        fix_action: Some("fix_private_key_perms".to_string()),
                        fix_preview: Some(format!("chmod 600 {}", k.private_path)),
                    });
                }
            }
        }

        // Check key strength
        if k.key_type.eq_ignore_ascii_case("DSA") {
            issues.push(AuditIssue {
                id: format!("weak_dsa_{}", k.file_name),
                severity: "critical".to_string(),
                category: "keys".to_string(),
                title: format!("Legacy Insecure Key: {}", k.file_name),
                description: "DSA keys are deprecated and disabled in modern OpenSSH due to weak security. Migrate to Ed25519.".to_string(),
                path: Some(k.private_path.clone()),
                fixable: false,
                fix_action: None,
                fix_preview: None,
            });
        } else if k.key_type.eq_ignore_ascii_case("RSA") {
            if let Some(bits) = k.bits {
                if bits < 2048 {
                    issues.push(AuditIssue {
                        id: format!("weak_rsa_{}", k.file_name),
                        severity: "critical".to_string(),
                        category: "keys".to_string(),
                        title: format!("Weak RSA Key (<2048 bit): {}", k.file_name),
                        description: format!("Key is only {} bits. Standard minimum is 2048 bits; 4096 or Ed25519 is recommended.", bits),
                        path: Some(k.private_path.clone()),
                        fixable: false,
                        fix_action: None,
                        fix_preview: None,
                    });
                }
            }
        }
    }

    // 4. Check Config Hosts
    let config_data = read_ssh_config().unwrap_or_else(|_| crate::config_parser::SshConfigFileData {
        file_path: "".to_string(),
        exists: false,
        raw_content: "".to_string(),
        hosts: Vec::new(),
        global_directives: Vec::new(),
        global_comments: Vec::new(),
    });

    let mut seen_aliases = std::collections::HashSet::new();
    for h in &config_data.hosts {
        if !seen_aliases.insert(h.host_pattern.to_lowercase()) {
            issues.push(AuditIssue {
                id: format!("dup_host_{}", h.host_pattern),
                severity: "warning".to_string(),
                category: "hosts".to_string(),
                title: format!("Duplicate Host Alias: '{}'", h.host_pattern),
                description: "OpenSSH uses the first matching block. Duplicate host entries can cause unexpected behavior.".to_string(),
                path: None,
                fixable: false,
                fix_action: None,
                fix_preview: None,
            });
        }
    }

    // 5. Check for malformed / empty directives in raw config
    let keywords_requiring_arg = [
        "dynamicforward",
        "localforward",
        "remoteforward",
        "hostname",
        "user",
        "identityfile",
        "proxyjump",
        "proxycommand",
        "port",
    ];

    for (line_idx, line) in config_data.raw_content.lines().enumerate() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.len() == 1 {
            let directive_lower = parts[0].to_lowercase();
            if keywords_requiring_arg.contains(&directive_lower.as_str()) {
                issues.push(AuditIssue {
                    id: format!("syntax_line_{}", line_idx + 1),
                    severity: "critical".to_string(),
                    category: "syntax".to_string(),
                    title: format!("Syntax Error in ~/.ssh/config: Line {} ('{}')", line_idx + 1, parts[0]),
                    description: format!(
                        "Directive '{}' on line {} is missing its required argument. This breaks OpenSSH tools (ssh-copy-id, git).",
                        parts[0],
                        line_idx + 1
                    ),
                    path: Some(config_data.file_path.clone()),
                    fixable: true,
                    fix_action: Some("sanitize_config_syntax".to_string()),
                    fix_preview: Some(format!("Comment out line {}: # {}", line_idx + 1, parts[0])),
                });
            }
        }
    }

    // Calculate score
    let critical_count = issues.iter().filter(|i| i.severity == "critical").count();
    let warning_count = issues.iter().filter(|i| i.severity == "warning").count();
    let penalty = (critical_count * 25) + (warning_count * 10);
    let score = if penalty >= 100 { 0 } else { 100 - (penalty as u32) };

    Ok(SecurityAuditReport {
        total_hosts: config_data.hosts.len(),
        total_keys: keys.len(),
        score,
        issues,
    })
}

pub fn fix_selected_issues(requests: Vec<SelectiveFixRequest>) -> Result<SelectiveFixResponse, String> {
    let mut messages = Vec::new();
    let mut fixed_count = 0;
    let ssh_dir = get_ssh_dir();
    let config_path = get_ssh_config_path();

    for req in requests {
        let action = req.fix_action.as_str();
        match action {
            "fix_ssh_dir_perms" => {
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    if ssh_dir.exists() {
                        if fs::set_permissions(&ssh_dir, fs::Permissions::from_mode(0o700)).is_ok() {
                            messages.push("Hardened ~/.ssh directory permissions to 700 (drwx------)".to_string());
                            fixed_count += 1;
                        }
                    }
                }
            }
            "fix_config_perms" => {
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    if config_path.exists() {
                        if fs::set_permissions(&config_path, fs::Permissions::from_mode(0o600)).is_ok() {
                            messages.push("Secured ~/.ssh/config permissions to 600 (-rw-------)".to_string());
                            fixed_count += 1;
                        }
                    }
                }
            }
            "fix_private_key_perms" => {
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    if let Some(ref p) = req.path {
                        let path = std::path::Path::new(p);
                        if path.exists() {
                            if fs::set_permissions(path, fs::Permissions::from_mode(0o600)).is_ok() {
                                let name = path.file_name().unwrap_or_default().to_string_lossy();
                                messages.push(format!("Secured private key permissions to 600: ~/.ssh/{}", name));
                                fixed_count += 1;
                            }
                        }
                    }
                }
            }
            "sanitize_config_syntax" => {
                if config_path.exists() {
                    if let Ok(raw) = fs::read_to_string(&config_path) {
                        let (sanitized, count) = crate::config_parser::sanitize_raw_config_lines(&raw);
                        if count > 0 {
                            if fs::write(&config_path, sanitized).is_ok() {
                                messages.push(format!("Sanitized ~/.ssh/config: commented out {} incomplete directive(s)", count));
                                fixed_count += 1;
                            }
                        }
                    }
                }
            }
            _ => {}
        }
    }

    let report = run_security_audit()?;
    Ok(SelectiveFixResponse {
        success: true,
        fixed_count,
        messages,
        report,
    })
}

pub fn fix_all_permissions() -> Result<(), String> {
    let ssh_dir = get_ssh_dir();

    // Sanitize config lines if syntax errors exist
    let config_path = get_ssh_config_path();
    if config_path.exists() {
        if let Ok(raw) = fs::read_to_string(&config_path) {
            let (sanitized, fixed_count) = crate::config_parser::sanitize_raw_config_lines(&raw);
            if fixed_count > 0 {
                let _ = fs::write(&config_path, sanitized);
            }
        }
    }

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;

        // Set ~/.ssh to 700
        if ssh_dir.exists() {
            let _ = fs::set_permissions(&ssh_dir, fs::Permissions::from_mode(0o700));
        }

        // Set config to 600
        if config_path.exists() {
            let _ = fs::set_permissions(&config_path, fs::Permissions::from_mode(0o600));
        }

        // Set all private keys to 600, public keys to 644
        if let Ok(entries) = fs::read_dir(&ssh_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    let name = entry.file_name().to_string_lossy().to_string();
                    if name.ends_with(".pub") || name == "known_hosts" || name == "authorized_keys" {
                        let _ = fs::set_permissions(&path, fs::Permissions::from_mode(0o644));
                    } else if !name.starts_with('.') {
                        let _ = fs::set_permissions(&path, fs::Permissions::from_mode(0o600));
                    }
                }
            }
        }
    }

    Ok(())
}

