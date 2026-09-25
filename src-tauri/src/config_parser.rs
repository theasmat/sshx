use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct SshHost {
    pub id: String,
    pub host_pattern: String,
    pub host_name: Option<String>,
    pub user: Option<String>,
    pub port: Option<u16>,
    pub identity_file: Option<String>,
    pub identities_only: Option<bool>,
    pub proxy_jump: Option<String>,
    pub proxy_command: Option<String>,
    pub forward_agent: Option<bool>,
    pub local_forward: Vec<String>,
    pub remote_forward: Vec<String>,
    pub dynamic_forward: Option<String>,
    pub server_alive_interval: Option<u32>,
    pub server_alive_count_max: Option<u32>,
    pub strict_host_key_checking: Option<String>,
    pub custom_directives: Vec<(String, String)>,
    pub tags: Vec<String>,
    pub group: Option<String>,
    pub notes: Option<String>,
    pub color: Option<String>,
    pub comments: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SshConfigFileData {
    pub file_path: String,
    pub exists: bool,
    pub raw_content: String,
    pub hosts: Vec<SshHost>,
    pub global_directives: Vec<(String, String)>,
    pub global_comments: Vec<String>,
}

pub fn get_ssh_dir() -> PathBuf {
    if let Some(home) = dirs::home_dir() {
        home.join(".ssh")
    } else {
        PathBuf::from("/tmp/.ssh")
    }
}

pub fn get_ssh_config_path() -> PathBuf {
    get_ssh_dir().join("config")
}

pub fn parse_ssh_config(content: &str, file_path: &str) -> SshConfigFileData {
    let mut hosts = Vec::new();
    let mut global_directives = Vec::new();
    let mut global_comments = Vec::new();

    let mut current_host: Option<SshHost> = None;
    let mut pending_comments = Vec::new();
    let mut pending_tags = Vec::new();
    let mut pending_group: Option<String> = None;
    let mut pending_note: Option<String> = None;
    let mut pending_color: Option<String> = None;

    for (line_idx, raw_line) in content.lines().enumerate() {
        let trimmed = raw_line.trim();

        if trimmed.is_empty() {
            continue;
        }

        if trimmed.starts_with('#') {
            let comment_text = trimmed[1..].trim();
            // Parse metadata annotations like # @sshx: tag=prod,aws group=Infra color=emerald note=My server
            if comment_text.starts_with("@sshx:") || comment_text.starts_with("@sshx ") {
                let meta_str = comment_text
                    .trim_start_matches("@sshx:")
                    .trim_start_matches("@sshx")
                    .trim();
                for part in meta_str.split_whitespace() {
                    if let Some((k, v)) = part.split_once('=') {
                        match k {
                            "tag" | "tags" => {
                                for t in v.split(',') {
                                    let clean_tag = t.trim().to_string();
                                    if !clean_tag.is_empty() && !pending_tags.contains(&clean_tag) {
                                        pending_tags.push(clean_tag);
                                    }
                                }
                            }
                            "group" => {
                                pending_group = Some(v.replace('_', " ").to_string());
                            }
                            "note" | "notes" => {
                                pending_note = Some(v.replace('_', " ").to_string());
                            }
                            "color" => {
                                pending_color = Some(v.to_string());
                            }
                            _ => {}
                        }
                    }
                }
            } else {
                pending_comments.push(comment_text.to_string());
            }
            continue;
        }

        // Split directive and value
        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.is_empty() {
            continue;
        }

        let directive = parts[0];
        let val = if parts.len() > 1 {
            trimmed[directive.len()..].trim()
        } else {
            ""
        };

        if directive.eq_ignore_ascii_case("Host") || directive.eq_ignore_ascii_case("Match") {
            // Commit previous host
            if let Some(h) = current_host.take() {
                hosts.push(h);
            }

            let host_pattern = val.to_string();
            let id = format!("{}_{}", host_pattern.replace(['*', '?', ' '], "_"), line_idx);

            current_host = Some(SshHost {
                id,
                host_pattern,
                host_name: None,
                user: None,
                port: None,
                identity_file: None,
                identities_only: None,
                proxy_jump: None,
                proxy_command: None,
                forward_agent: None,
                local_forward: Vec::new(),
                remote_forward: Vec::new(),
                dynamic_forward: None,
                server_alive_interval: None,
                server_alive_count_max: None,
                strict_host_key_checking: None,
                custom_directives: Vec::new(),
                tags: std::mem::take(&mut pending_tags),
                group: pending_group.take(),
                notes: pending_note.take(),
                color: pending_color.take(),
                comments: std::mem::take(&mut pending_comments),
            });
            continue;
        }

        if let Some(ref mut host) = current_host {
            match directive.to_lowercase().as_str() {
                "hostname" => host.host_name = Some(val.to_string()),
                "user" => host.user = Some(val.to_string()),
                "port" => host.port = val.parse().ok(),
                "identityfile" => host.identity_file = Some(val.to_string()),
                "identitiesonly" => {
                    host.identities_only = Some(val.eq_ignore_ascii_case("yes"))
                }
                "proxyjump" => host.proxy_jump = Some(val.to_string()),
                "proxycommand" => host.proxy_command = Some(val.to_string()),
                "forwardagent" => {
                    host.forward_agent = Some(val.eq_ignore_ascii_case("yes"))
                }
                "localforward" => host.local_forward.push(val.to_string()),
                "remoteforward" => host.remote_forward.push(val.to_string()),
                "dynamicforward" => host.dynamic_forward = Some(val.to_string()),
                "serveraliveinterval" => host.server_alive_interval = val.parse().ok(),
                "serveralivecountmax" => host.server_alive_count_max = val.parse().ok(),
                "stricthostkeychecking" => {
                    host.strict_host_key_checking = Some(val.to_string())
                }
                _ => host
                    .custom_directives
                    .push((directive.to_string(), val.to_string())),
            }
        } else {
            // Global directive before any Host line
            global_comments.append(&mut pending_comments);
            global_directives.push((directive.to_string(), val.to_string()));
        }
    }

    if let Some(h) = current_host {
        hosts.push(h);
    }

    SshConfigFileData {
        file_path: file_path.to_string(),
        exists: true,
        raw_content: content.to_string(),
        hosts,
        global_directives,
        global_comments,
    }
}

pub fn serialize_ssh_config(
    global_comments: &[String],
    global_directives: &[(String, String)],
    hosts: &[SshHost],
) -> String {
    let mut out = String::new();

    // Global comments
    for c in global_comments {
        out.push_str(&format!("# {}\n", c));
    }

    // Global directives
    for (k, v) in global_directives {
        out.push_str(&format!("{} {}\n", k, v));
    }

    if !global_comments.is_empty() || !global_directives.is_empty() {
        out.push('\n');
    }

    // Hosts
    for (i, h) in hosts.iter().enumerate() {
        if i > 0 || !global_comments.is_empty() || !global_directives.is_empty() {
            out.push('\n');
        }

        // Output regular comments
        for c in &h.comments {
            out.push_str(&format!("# {}\n", c));
        }

        // Output metadata annotations
        let mut meta_parts = Vec::new();
        if !h.tags.is_empty() {
            meta_parts.push(format!("tags={}", h.tags.join(",")));
        }
        if let Some(ref grp) = h.group {
            meta_parts.push(format!("group={}", grp.replace(' ', "_")));
        }
        if let Some(ref note) = h.notes {
            meta_parts.push(format!("note={}", note.replace(' ', "_")));
        }
        if let Some(ref col) = h.color {
            if !col.trim().is_empty() {
                meta_parts.push(format!("color={}", col.trim()));
            }
        }

        if !meta_parts.is_empty() {
            out.push_str(&format!("# @sshx: {}\n", meta_parts.join(" ")));
        }

        out.push_str(&format!("Host {}\n", h.host_pattern.trim()));

        if let Some(ref hn) = h.host_name {
            if !hn.trim().is_empty() {
                out.push_str(&format!("    HostName {}\n", hn.trim()));
            }
        }
        if let Some(ref u) = h.user {
            if !u.trim().is_empty() {
                out.push_str(&format!("    User {}\n", u.trim()));
            }
        }
        if let Some(p) = h.port {
            if p != 22 && p != 0 {
                out.push_str(&format!("    Port {}\n", p));
            }
        }
        if let Some(ref id_file) = h.identity_file {
            if !id_file.trim().is_empty() {
                out.push_str(&format!("    IdentityFile {}\n", id_file.trim()));
            }
        }
        if let Some(io) = h.identities_only {
            if io {
                out.push_str("    IdentitiesOnly yes\n");
            }
        }
        if let Some(ref pj) = h.proxy_jump {
            if !pj.trim().is_empty() {
                out.push_str(&format!("    ProxyJump {}\n", pj.trim()));
            }
        }
        if let Some(ref pc) = h.proxy_command {
            if !pc.trim().is_empty() {
                out.push_str(&format!("    ProxyCommand {}\n", pc.trim()));
            }
        }
        if let Some(fa) = h.forward_agent {
            out.push_str(&format!("    ForwardAgent {}\n", if fa { "yes" } else { "no" }));
        }
        for lf in &h.local_forward {
            if !lf.trim().is_empty() {
                out.push_str(&format!("    LocalForward {}\n", lf.trim()));
            }
        }
        for rf in &h.remote_forward {
            if !rf.trim().is_empty() {
                out.push_str(&format!("    RemoteForward {}\n", rf.trim()));
            }
        }
        if let Some(ref df) = h.dynamic_forward {
            if !df.trim().is_empty() {
                out.push_str(&format!("    DynamicForward {}\n", df.trim()));
            }
        }
        if let Some(sai) = h.server_alive_interval {
            if sai > 0 {
                out.push_str(&format!("    ServerAliveInterval {}\n", sai));
            }
        }
        if let Some(sacm) = h.server_alive_count_max {
            if sacm > 0 {
                out.push_str(&format!("    ServerAliveCountMax {}\n", sacm));
            }
        }
        if let Some(ref shkc) = h.strict_host_key_checking {
            if !shkc.trim().is_empty() {
                out.push_str(&format!("    StrictHostKeyChecking {}\n", shkc.trim()));
            }
        }
        for (k, v) in &h.custom_directives {
            if !k.trim().is_empty() && !v.trim().is_empty() {
                out.push_str(&format!("    {} {}\n", k.trim(), v.trim()));
            }
        }
    }

    out
}

pub fn sanitize_raw_config_lines(content: &str) -> (String, usize) {
    let mut fixed_lines = Vec::new();
    let mut fixed_count = 0;

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
        "serveraliveinterval",
        "serveralivecountmax",
        "stricthostkeychecking",
    ];

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            fixed_lines.push(line.to_string());
            continue;
        }

        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.len() == 1 {
            let directive_lower = parts[0].to_lowercase();
            if keywords_requiring_arg.contains(&directive_lower.as_str()) {
                // Comment out the empty directive line
                fixed_lines.push(format!("# [Fixed by SSHX - missing argument] {}", line));
                fixed_count += 1;
                continue;
            }
        }

        fixed_lines.push(line.to_string());
    }

    (fixed_lines.join("\n"), fixed_count)
}

pub fn read_ssh_config() -> Result<SshConfigFileData, String> {
    let ssh_dir = get_ssh_dir();
    if !ssh_dir.exists() {
        fs::create_dir_all(&ssh_dir).map_err(|e| e.to_string())?;
    }

    let config_path = get_ssh_config_path();
    let file_path_str = config_path.to_string_lossy().to_string();

    if !config_path.exists() {
        return Ok(SshConfigFileData {
            file_path: file_path_str,
            exists: false,
            raw_content: String::new(),
            hosts: Vec::new(),
            global_directives: Vec::new(),
            global_comments: Vec::new(),
        });
    }

    let content = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    let data = parse_ssh_config(&content, &file_path_str);
    Ok(data)
}

pub const SSHX_BACKUP_PRIMARY: &str = "config.sshx.bak";
pub const SSHX_BACKUP_PREVIOUS: &str = "config.sshx.bak.previous";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SshxBackupInfo {
    pub filename: String,
    pub display_name: String,
    pub file_path: String,
    pub size_bytes: u64,
    pub modified_timestamp: u64,
    pub is_primary: bool,
}

/// Automatically removes legacy timestamped config.bak.<ts> files to keep ~/.ssh/ clean
pub fn clean_legacy_backups(ssh_dir: &std::path::Path) {
    if let Ok(entries) = fs::read_dir(ssh_dir) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("config.bak.") {
                let suffix = &name["config.bak.".len()..];
                if !suffix.is_empty() && suffix.chars().all(|c| c.is_ascii_digit()) {
                    let _ = fs::remove_file(entry.path());
                }
            }
        }
    }
}

pub fn write_ssh_config_safe(content: &str) -> Result<(), String> {
    let ssh_dir = get_ssh_dir();
    if !ssh_dir.exists() {
        fs::create_dir_all(&ssh_dir).map_err(|e| e.to_string())?;
    }

    let config_path = get_ssh_config_path();

    // Maintain a single primary snapshot named config.sshx.bak
    if config_path.exists() {
        if let Ok(existing_content) = fs::read_to_string(&config_path) {
            // Only back up if existing file has content and is different from new content
            if !existing_content.trim().is_empty() && existing_content != content {
                let primary_backup = ssh_dir.join(SSHX_BACKUP_PRIMARY);
                let previous_backup = ssh_dir.join(SSHX_BACKUP_PREVIOUS);

                // Rotate existing primary backup to previous
                if primary_backup.exists() {
                    let _ = fs::copy(&primary_backup, &previous_backup);
                }

                // Copy current config to primary snapshot
                let _ = fs::copy(&config_path, &primary_backup);

                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    let perms = fs::Permissions::from_mode(0o600);
                    let _ = fs::set_permissions(&primary_backup, perms.clone());
                    if previous_backup.exists() {
                        let _ = fs::set_permissions(&previous_backup, perms);
                    }
                }
            }
        }
    }

    // Clean up any legacy timestamped backups to prevent ~/.ssh pollution
    clean_legacy_backups(&ssh_dir);

    fs::write(&config_path, content).map_err(|e| e.to_string())?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let perms = fs::Permissions::from_mode(0o600);
        let _ = fs::set_permissions(&config_path, perms);
    }

    Ok(())
}

pub fn list_config_backups() -> Result<Vec<SshxBackupInfo>, String> {
    let ssh_dir = get_ssh_dir();
    if !ssh_dir.exists() {
        return Ok(Vec::new());
    }

    let mut backups = Vec::new();

    // 1. Primary snapshot (config.sshx.bak)
    let primary_path = ssh_dir.join(SSHX_BACKUP_PRIMARY);
    if primary_path.exists() {
        if let Ok(meta) = fs::metadata(&primary_path) {
            let mod_time = meta.modified().unwrap_or(SystemTime::UNIX_EPOCH);
            let ts = mod_time.duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
            backups.push(SshxBackupInfo {
                filename: SSHX_BACKUP_PRIMARY.to_string(),
                display_name: "sshX Device Snapshot (Latest)".to_string(),
                file_path: primary_path.to_string_lossy().to_string(),
                size_bytes: meta.len(),
                modified_timestamp: ts,
                is_primary: true,
            });
        }
    }

    // 2. Previous snapshot (config.sshx.bak.previous)
    let previous_path = ssh_dir.join(SSHX_BACKUP_PREVIOUS);
    if previous_path.exists() {
        if let Ok(meta) = fs::metadata(&previous_path) {
            let mod_time = meta.modified().unwrap_or(SystemTime::UNIX_EPOCH);
            let ts = mod_time.duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
            backups.push(SshxBackupInfo {
                filename: SSHX_BACKUP_PREVIOUS.to_string(),
                display_name: "sshX Device Snapshot (Previous)".to_string(),
                file_path: previous_path.to_string_lossy().to_string(),
                size_bytes: meta.len(),
                modified_timestamp: ts,
                is_primary: false,
            });
        }
    }

    // 3. Any additional user or legacy config backups
    if let Ok(entries) = fs::read_dir(&ssh_dir) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if (name.starts_with("config.") && name.ends_with(".bak") || name.starts_with("config.bak."))
                && name != SSHX_BACKUP_PRIMARY
                && name != SSHX_BACKUP_PREVIOUS
            {
                if let Ok(meta) = entry.metadata() {
                    let mod_time = meta.modified().unwrap_or(SystemTime::UNIX_EPOCH);
                    let ts = mod_time.duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
                    backups.push(SshxBackupInfo {
                        filename: name.clone(),
                        display_name: format!("Backup: {}", name),
                        file_path: entry.path().to_string_lossy().to_string(),
                        size_bytes: meta.len(),
                        modified_timestamp: ts,
                        is_primary: false,
                    });
                }
            }
        }
    }

    // Primary first, then newest modified timestamp
    backups.sort_by(|a, b| {
        if a.is_primary != b.is_primary {
            b.is_primary.cmp(&a.is_primary)
        } else {
            b.modified_timestamp.cmp(&a.modified_timestamp)
        }
    });

    Ok(backups)
}

pub fn get_device_snapshot() -> Result<Option<SshxBackupInfo>, String> {
    let backups = list_config_backups()?;
    Ok(backups.into_iter().find(|b| b.is_primary))
}

pub fn read_backup_content(backup_name: &str) -> Result<String, String> {
    let ssh_dir = get_ssh_dir();
    let clean_name = std::path::Path::new(backup_name)
        .file_name()
        .ok_or_else(|| "Invalid backup filename".to_string())?;
    let backup_path = ssh_dir.join(clean_name);
    if !backup_path.exists() {
        return Err(format!("Backup file '{}' does not exist in ~/.ssh/", backup_name));
    }
    fs::read_to_string(&backup_path).map_err(|e| e.to_string())
}

pub fn restore_config_backup(backup_name: &str) -> Result<(), String> {
    let ssh_dir = get_ssh_dir();
    let clean_name = std::path::Path::new(backup_name)
        .file_name()
        .ok_or_else(|| "Invalid backup filename".to_string())?;
    let backup_path = ssh_dir.join(clean_name);
    if !backup_path.exists() {
        return Err(format!("Backup file '{}' does not exist in ~/.ssh/", backup_name));
    }

    let content = fs::read_to_string(&backup_path).map_err(|e| e.to_string())?;
    write_ssh_config_safe(&content)?;
    Ok(())
}


pub fn remove_host_entry(host_id: &str, host_pattern: Option<&str>) -> Result<SshConfigFileData, String> {
    let mut config = read_ssh_config()?;
    let original_len = config.hosts.len();

    // 1. Try removing by exact host_id match
    if !host_id.is_empty() {
        config.hosts.retain(|h| h.id != host_id);
    }

    // 2. If nothing was removed (e.g. host_id was ephemeral client ID), match and remove first matching host_pattern
    if config.hosts.len() == original_len {
        if let Some(pat) = host_pattern {
            let clean_pat = pat.trim();
            if !clean_pat.is_empty() {
                if let Some(pos) = config.hosts.iter().position(|h| h.host_pattern.eq_ignore_ascii_case(clean_pat)) {
                    config.hosts.remove(pos);
                }
            }
        }
    }

    // 3. Fallback prefix match if still not found
    if config.hosts.len() == original_len && !host_id.is_empty() {
        if let Some((prefix, _)) = host_id.split_once('_') {
            if let Some(pos) = config.hosts.iter().position(|h| h.host_pattern.eq_ignore_ascii_case(prefix)) {
                config.hosts.remove(pos);
            }
        }
    }

    let serialized = serialize_ssh_config(&config.global_comments, &config.global_directives, &config.hosts);
    write_ssh_config_safe(&serialized)?;
    read_ssh_config()
}

pub fn unlink_key_from_hosts(key_path_or_name: &str) -> Result<SshConfigFileData, String> {
    let mut config = read_ssh_config()?;
    let clean_target = key_path_or_name.trim();
    let file_name = std::path::Path::new(clean_target)
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_else(|| clean_target.to_string());

    for h in &mut config.hosts {
        if let Some(ref id_file) = h.identity_file {
            let id_name = std::path::Path::new(id_file)
                .file_name()
                .map(|f| f.to_string_lossy().to_string())
                .unwrap_or_else(|| id_file.clone());

            if id_file == clean_target || id_name == file_name {
                h.identity_file = None;
                h.identities_only = None;
            }
        }
    }

    let serialized = serialize_ssh_config(&config.global_comments, &config.global_directives, &config.hosts);
    write_ssh_config_safe(&serialized)?;
    read_ssh_config()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_and_serialize_roundtrip() {
        let sample = r#"# Main production servers
# @sshx: tags=prod,aws group=Cloud color=emerald note=Main_Web_Server
Host prod-web-01
    HostName 54.210.12.34
    User ec2-user
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ServerAliveInterval 60

# @sshx: tags=github,personal group=Git
Host github-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
    IdentitiesOnly yes
"#;
        let parsed = parse_ssh_config(sample, "/tmp/config");
        assert_eq!(parsed.hosts.len(), 2);
        assert_eq!(parsed.hosts[0].host_pattern, "prod-web-01");
        assert_eq!(parsed.hosts[0].user, Some("ec2-user".to_string()));
        assert_eq!(parsed.hosts[0].tags, vec!["prod", "aws"]);
        assert_eq!(parsed.hosts[1].host_pattern, "github-personal");

        let serialized = serialize_ssh_config(&parsed.global_comments, &parsed.global_directives, &parsed.hosts);
        assert!(serialized.contains("Host prod-web-01"));
        assert!(serialized.contains("Host github-personal"));
        assert!(serialized.contains("tags=prod,aws"));
    }

    #[test]
    fn test_sanitize_raw_config_lines() {
        let bad_config = "Host foo\n    HostName 1.2.3.4\n    dynamicforward\n    Port 22\n";
        let (fixed, count) = sanitize_raw_config_lines(bad_config);
        assert_eq!(count, 1);
        assert!(fixed.contains("# [Fixed by SSHX - missing argument]     dynamicforward"));
    }

    #[test]
    fn test_legacy_cleanup_and_backup_naming() {
        let temp_dir = std::env::temp_dir().join(format!("sshx_test_bak_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
        let _ = fs::create_dir_all(&temp_dir);

        // Create mock legacy timestamped files and new files
        let legacy_file1 = temp_dir.join("config.bak.1740000000");
        let legacy_file2 = temp_dir.join("config.bak.1740000001");
        let valid_backup = temp_dir.join(SSHX_BACKUP_PRIMARY);
        let _ = fs::write(&legacy_file1, "old 1");
        let _ = fs::write(&legacy_file2, "old 2");
        let _ = fs::write(&valid_backup, "valid backup");

        assert!(legacy_file1.exists());
        assert!(legacy_file2.exists());
        assert!(valid_backup.exists());

        clean_legacy_backups(&temp_dir);

        assert!(!legacy_file1.exists(), "Legacy file 1 should be removed");
        assert!(!legacy_file2.exists(), "Legacy file 2 should be removed");
        assert!(valid_backup.exists(), "Primary sshx backup must NOT be removed");

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
