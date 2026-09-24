use serde::{Deserialize, Serialize};
use std::fs;
use std::process::Command;
use crate::config_parser::get_ssh_dir;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SshKeyInfo {
    pub file_name: String,
    pub private_path: String,
    pub public_path: Option<String>,
    pub key_type: String,
    pub bits: Option<u32>,
    pub fingerprint_sha256: String,
    pub comment: String,
    pub public_key_content: Option<String>,
    pub is_agent_loaded: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GenerateKeyRequest {
    pub name: String,
    pub key_type: String, // "ed25519" or "rsa" or "ecdsa"
    pub bits: Option<u32>, // e.g. 4096 for rsa
    pub comment: String,
    pub passphrase: Option<String>,
}

pub fn get_agent_keys() -> Vec<String> {
    let output = Command::new("ssh-add").arg("-l").output();
    let mut fingerprints = Vec::new();
    if let Ok(out) = output {
        let text = String::from_utf8_lossy(&out.stdout);
        for line in text.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                fingerprints.push(parts[1].to_string());
            }
        }
    }
    fingerprints
}

pub fn list_ssh_keys() -> Result<Vec<SshKeyInfo>, String> {
    let ssh_dir = get_ssh_dir();
    if !ssh_dir.exists() {
        return Ok(Vec::new());
    }

    let agent_fps = get_agent_keys();
    let mut keys = Vec::new();

    let entries = fs::read_dir(&ssh_dir).map_err(|e| e.to_string())?;

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let file_name = entry.file_name().to_string_lossy().to_string();

        // Skip non-key files
        if file_name == "config"
            || file_name.starts_with("config.bak.")
            || file_name == "known_hosts"
            || file_name == "known_hosts.old"
            || file_name == "authorized_keys"
            || file_name.ends_with(".pub")
        {
            continue;
        }

        let pub_path = ssh_dir.join(format!("{}.pub", file_name));
        let has_pub = pub_path.exists();

        // Use ssh-keygen -l -f to get metadata
        let target_for_meta = if has_pub {
            pub_path.clone()
        } else {
            path.clone()
        };

        let meta_cmd = Command::new("ssh-keygen")
            .arg("-l")
            .arg("-E")
            .arg("sha256")
            .arg("-f")
            .arg(&target_for_meta)
            .output();

        if let Ok(meta_out) = meta_cmd {
            if meta_out.status.success() {
                let stdout_str = String::from_utf8_lossy(&meta_out.stdout);
                // format: 256 SHA256:abc... comment (ED25519)
                let parts: Vec<&str> = stdout_str.split_whitespace().collect();
                let bits = parts.first().and_then(|b| b.parse().ok());
                let fp = parts.get(1).unwrap_or(&"").to_string();

                let mut key_type = "UNKNOWN".to_string();
                let mut comment = String::new();

                if let Some(last) = parts.last() {
                    let trimmed_last = last.trim_matches(|c| c == '(' || c == ')');
                    key_type = trimmed_last.to_string();
                }

                if parts.len() > 3 {
                    // Middle parts between fp and type are comment
                    let comment_parts = &parts[2..parts.len() - 1];
                    comment = comment_parts.join(" ");
                }

                let pub_content = if has_pub {
                    fs::read_to_string(&pub_path).ok()
                } else {
                    None
                };

                let is_agent = agent_fps.iter().any(|afp| afp == &fp || fp.contains(afp));

                keys.push(SshKeyInfo {
                    file_name: file_name.clone(),
                    private_path: path.to_string_lossy().to_string(),
                    public_path: if has_pub {
                        Some(pub_path.to_string_lossy().to_string())
                    } else {
                        None
                    },
                    key_type,
                    bits,
                    fingerprint_sha256: fp,
                    comment,
                    public_key_content: pub_content,
                    is_agent_loaded: is_agent,
                });
            }
        }
    }

    // Sort ed25519 and rsa first
    keys.sort_by(|a, b| a.file_name.cmp(&b.file_name));
    Ok(keys)
}

pub fn generate_ssh_key(req: GenerateKeyRequest) -> Result<SshKeyInfo, String> {
    let ssh_dir = get_ssh_dir();
    if !ssh_dir.exists() {
        fs::create_dir_all(&ssh_dir).map_err(|e| e.to_string())?;
    }

    let clean_name = req.name.trim().replace(['/', '\\', ' '], "_");
    if clean_name.is_empty() {
        return Err("Key name cannot be empty".to_string());
    }

    let key_path = ssh_dir.join(&clean_name);
    if key_path.exists() {
        return Err(format!("Key '{}' already exists in ~/.ssh/", clean_name));
    }

    let mut cmd = Command::new("ssh-keygen");
    cmd.arg("-t").arg(&req.key_type);

    if req.key_type.to_lowercase() == "rsa" {
        let bits = req.bits.unwrap_or(4096);
        cmd.arg("-b").arg(bits.to_string());
    }

    let key_path_str = key_path.to_string_lossy().to_string();
    cmd.arg("-f").arg(&key_path_str);
    cmd.arg("-C").arg(&req.comment);

    let passphrase = req.passphrase.unwrap_or_default();
    cmd.arg("-N").arg(&passphrase);

    let output = cmd.output().map_err(|e| format!("Failed to execute ssh-keygen: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = fs::set_permissions(&key_path, fs::Permissions::from_mode(0o600));
        let pub_path = ssh_dir.join(format!("{}.pub", clean_name));
        if pub_path.exists() {
            let _ = fs::set_permissions(&pub_path, fs::Permissions::from_mode(0o644));
        }
    }

    // Return the created key info
    let keys = list_ssh_keys()?;
    keys.into_iter()
        .find(|k| k.file_name == clean_name)
        .ok_or_else(|| "Key created but failed to read metadata".to_string())
}

pub fn add_key_to_agent(private_path: &str) -> Result<String, String> {
    let output = Command::new("ssh-add")
        .arg(private_path)
        .output()
        .map_err(|e| format!("Failed to execute ssh-add: {}", e))?;

    if output.status.success() {
        Ok(format!("Key '{}' added to ssh-agent successfully!", private_path))
    } else {
        let err_text = String::from_utf8_lossy(&output.stderr);
        Err(if err_text.trim().is_empty() {
            String::from_utf8_lossy(&output.stdout).to_string()
        } else {
            err_text.to_string()
        })
    }
}

pub fn remove_key_from_agent(private_path: &str) -> Result<String, String> {
    let output = Command::new("ssh-add")
        .arg("-d")
        .arg(private_path)
        .output()
        .map_err(|e| format!("Failed to execute ssh-add -d: {}", e))?;

    if output.status.success() {
        Ok(format!("Key '{}' removed from ssh-agent!", private_path))
    } else {
        let err_text = String::from_utf8_lossy(&output.stderr);
        Err(err_text.to_string())
    }
}

