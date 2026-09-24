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

    // Try standard ssh-keygen -R first if not hashed or if pattern given
    if !host_or_pattern.starts_with("|1|") {
        let _ = Command::new("ssh-keygen")
            .arg("-R")
            .arg(host_or_pattern)
            .output();
    }

    // Also remove by line number if specified
    if let Some(line_num) = line_number {
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        let filtered: Vec<&str> = content
            .lines()
            .enumerate()
            .filter(|(idx, _)| idx + 1 != line_num)
            .map(|(_, line)| line)
            .collect();
        let new_content = filtered.join("\n") + if filtered.is_empty() { "" } else { "\n" };
        fs::write(&path, new_content).map_err(|e| e.to_string())?;
    }

    Ok(())
}

pub fn fix_stale_host(host_or_pattern: &str) -> Result<String, String> {
    let output = Command::new("ssh-keygen")
        .arg("-R")
        .arg(host_or_pattern)
        .output()
        .map_err(|e| format!("Failed to execute ssh-keygen -R: {}", e))?;

    if output.status.success() {
        Ok(format!("Successfully removed stale keys for '{}' from known_hosts!", host_or_pattern))
    } else {
        let err = String::from_utf8_lossy(&output.stderr);
        Err(err.to_string())
    }
}

