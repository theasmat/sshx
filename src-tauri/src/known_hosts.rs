use serde::{Deserialize, Serialize};
use std::fs;
use std::process::Command;
use crate::config_parser::get_ssh_dir;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KnownHostEntry {
    pub line_number: usize,
    pub host: String,
    pub key_type: String,
    pub key_preview: String,
    pub is_hashed: bool,
}

pub fn list_known_hosts() -> Result<Vec<KnownHostEntry>, String> {
    let path = get_ssh_dir().join("known_hosts");
    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let mut entries = Vec::new();

    for (idx, line) in content.lines().enumerate() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }

        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.is_empty() {
            continue;
        }

        let host = parts[0].to_string();
        let is_hashed = host.starts_with("|1|");
        let key_type = parts.get(1).unwrap_or(&"UNKNOWN").to_string();
        let raw_key = parts.get(2).unwrap_or(&"");
        let key_preview = if raw_key.len() > 24 {
            format!("{}...{}", &raw_key[..12], &raw_key[raw_key.len() - 8..])
        } else {
            raw_key.to_string()
        };

        entries.push(KnownHostEntry {
            line_number: idx + 1,
            host,
            key_type,
            key_preview,
            is_hashed,
        });
    }

    Ok(entries)
}

pub fn remove_known_host(host_or_pattern: &str, line_number: Option<usize>) -> Result<(), String> {
    let path = get_ssh_dir().join("known_hosts");
    if !path.exists() {
        return Ok(());
    }

    // When an exact line number is given (e.g. from the known-hosts list UI),
    // remove ONLY that line. Do NOT also run `ssh-keygen -R` first: it rewrites
    // the file and shifts line numbers, which could delete the wrong entry.
    if let Some(line_num) = line_number {
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        let filtered: Vec<&str> = content
            .lines()
            .enumerate()
            .filter(|(idx, _)| idx + 1 != line_num)
            .map(|(_, line)| line)
            .collect();
        let new_content = if filtered.is_empty() {
            String::new()
        } else {
            filtered.join("\n") + "\n"
        };
        fs::write(&path, new_content).map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Pattern-based removal for non-hashed entries.
    // (Hashed entries can only be removed by line number, handled above.)
    if !host_or_pattern.starts_with("|1|") {
        let _ = Command::new("ssh-keygen")
            .arg("-R")
            .arg(host_or_pattern)
            .output();
    }

    Ok(())
}

pub fn read_known_hosts_raw() -> Result<String, String> {
    let path = get_ssh_dir().join("known_hosts");
    if !path.exists() {
        return Ok(String::new());
    }
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

pub fn write_known_hosts_raw(content: &str) -> Result<(), String> {
    let ssh_dir = get_ssh_dir();
    if !ssh_dir.exists() {
        fs::create_dir_all(&ssh_dir).map_err(|e| e.to_string())?;
    }
    let path = ssh_dir.join("known_hosts");
    fs::write(&path, content).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = fs::set_permissions(&path, fs::Permissions::from_mode(0o644));
    }
    Ok(())
}

pub fn fix_stale_host(host_or_pattern: &str) -> Result<String, String> {
    // A config alias (e.g. "github-byte") is usually NOT what appears in
    // known_hosts — the real hostname (e.g. "github.com") is. Resolve the
    // alias with `ssh -G` so the stale entry is actually found and removed.
    let mut candidates: Vec<String> = vec![host_or_pattern.to_string()];

    if let Ok(g_out) = Command::new("ssh").arg("-G").arg(host_or_pattern).output() {
        if g_out.status.success() {
            let text = String::from_utf8_lossy(&g_out.stdout);
            let mut hostname = String::new();
            let mut port = "22".to_string();
            for line in text.lines() {
                let mut it = line.split_whitespace();
                match (it.next(), it.next()) {
                    (Some("hostname"), Some(v)) => hostname = v.to_string(),
                    (Some("port"), Some(v)) => port = v.to_string(),
                    _ => {}
                }
            }
            if !hostname.is_empty() && hostname != host_or_pattern {
                if port != "22" {
                    // Non-standard ports are stored as "[host]:port" in known_hosts
                    candidates.push(format!("[{}]:{}", hostname, port));
                }
                candidates.push(hostname);
            } else if port != "22" {
                candidates.push(format!("[{}]:{}", host_or_pattern, port));
            }
        }
    }

    let mut removed: Vec<String> = Vec::new();
    let mut errors: Vec<String> = Vec::new();
    for candidate in &candidates {
        match Command::new("ssh-keygen").arg("-R").arg(candidate).output() {
            Ok(out) if out.status.success() => {
                if !removed.contains(candidate) {
                    removed.push(candidate.clone());
                }
            }
            Ok(out) => {
                let err = String::from_utf8_lossy(&out.stderr).trim().to_string();
                if !err.is_empty() {
                    errors.push(format!("{}: {}", candidate, err));
                }
            }
            Err(e) => errors.push(format!("{}: {}", candidate, e)),
        }
    }

    if removed.is_empty() {
        let detail = if errors.is_empty() {
            String::new()
        } else {
            format!(" ({})", errors.join("; "))
        };
        Err(format!(
            "No stale entries found in known_hosts for '{}'{}. If the entry is hashed, remove it from the Known Hosts tab instead.",
            host_or_pattern, detail
        ))
    } else {
        let noun = if removed.len() == 1 { "entry" } else { "entries" };
        Ok(format!(
            "Removed stale known_hosts {} for '{}': {}",
            noun,
            host_or_pattern,
            removed.join(", ")
        ))
    }
}



