use serde::{Deserialize, Serialize};
use std::fs;
use crate::config_parser::{get_ssh_dir, get_ssh_config_path, read_ssh_config};
use crate::key_manager::list_ssh_keys;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuditIssue {
    pub severity: String, // "critical", "warning", "info"
    pub title: String,
    pub description: String,
    pub path: Option<String>,
    pub fixable: bool,
    pub fix_action: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SecurityAuditReport {
    pub total_hosts: usize,
    pub total_keys: usize,
    pub score: u32, // 0 to 100
    pub issues: Vec<AuditIssue>,
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
                        severity: "critical".to_string(),
                        title: "Insecure ~/.ssh Directory Permissions".to_string(),
                        description: format!("Current permissions are {:o}. Expected 700 (drwx------).", mode),
                        path: Some(ssh_dir.to_string_lossy().to_string()),
                        fixable: true,
                        fix_action: Some("fix_ssh_dir_perms".to_string()),
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
                        severity: "warning".to_string(),
                        title: "Insecure Config File Permissions".to_string(),
                        description: format!("Current config permissions are {:o}. Recommended is 600 (-rw-------).", mode),
                        path: Some(config_path.to_string_lossy().to_string()),
                        fixable: true,
                        fix_action: Some("fix_config_perms".to_string()),
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
                        severity: "critical".to_string(),
                        title: format!("Insecure Private Key: {}", k.file_name),
                        description: format!("Private key has permissions {:o}. SSH requires 600 (-rw-------) or connection will be rejected.", mode),
                        path: Some(k.private_path.clone()),
                        fixable: true,
                        fix_action: Some("fix_private_key_perms".to_string()),
                    });
                }
            }
        }

        // Check key strength
        if k.key_type.eq_ignore_ascii_case("DSA") {
            issues.push(AuditIssue {
                severity: "critical".to_string(),
                title: format!("Legacy Insecure Key: {}", k.file_name),
                description: "DSA keys are deprecated and disabled in modern OpenSSH due to weak security. Migrate to Ed25519.".to_string(),
                path: Some(k.private_path.clone()),
                fixable: false,
                fix_action: None,
            });
        } else if k.key_type.eq_ignore_ascii_case("RSA") {
            if let Some(bits) = k.bits {
                if bits < 2048 {
                    issues.push(AuditIssue {
                        severity: "critical".to_string(),
                        title: format!("Weak RSA Key (<2048 bit): {}", k.file_name),
                        description: format!("Key is only {} bits. Standard minimum is 2048 bits; 4096 or Ed25519 is recommended.", bits),
                        path: Some(k.private_path.clone()),
                        fixable: false,
                        fix_action: None,
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
                severity: "warning".to_string(),
                title: format!("Duplicate Host Alias: '{}'", h.host_pattern),
                description: "OpenSSH uses the first matching block. Duplicate host entries can cause unexpected behavior.".to_string(),
                path: None,
                fixable: false,
                fix_action: None,
            });
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

pub fn fix_all_permissions() -> Result<(), String> {
    let ssh_dir = get_ssh_dir();

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;

        // Set ~/.ssh to 700
        if ssh_dir.exists() {
            let _ = fs::set_permissions(&ssh_dir, fs::Permissions::from_mode(0o700));
        }

        // Set config to 600
        let config_path = get_ssh_config_path();
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
