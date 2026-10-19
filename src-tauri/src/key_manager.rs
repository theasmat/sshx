use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::process::{Command, Stdio};
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

    // SECURITY: never pass the passphrase via argv (it would be visible in
    // `ps` output). Instead, feed it to ssh-keygen's stdin prompts.
    // Detach from any controlling terminal first so ssh-keygen cannot bypass
    // our pipe by opening /dev/tty (e.g. when the app was launched from a shell).
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        unsafe {
            cmd.pre_exec(|| {
                libc::setsid();
                Ok(())
            });
        }
    }
    cmd.stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let passphrase = req.passphrase.unwrap_or_default();

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to execute ssh-keygen: {}", e))?;

    // Answer the two passphrase prompts: "Enter passphrase ..." and
    // "Enter same passphrase again: ". An empty passphrase is just "\n\n".
    if let Some(mut stdin) = child.stdin.take() {
        let _ = stdin.write_all(format!("{}\n{}\n", passphrase, passphrase).as_bytes());
    }

    let output = child
        .wait_with_output()
        .map_err(|e| format!("Failed to read ssh-keygen output: {}", e))?;

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

    // Automatically load unencrypted key into ssh-agent
    if passphrase.is_empty() {
        let _ = add_key_to_agent(&key_path_str);
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

pub fn delete_ssh_key(private_path: &str) -> Result<String, String> {
    let priv_path = std::path::PathBuf::from(private_path);
    if !priv_path.exists() {
        return Err(format!("Key file '{}' does not exist.", private_path));
    }

    // Try removing from ssh-agent
    let _ = remove_key_from_agent(private_path);

    // Delete public key file if exists
    let pub_path = if private_path.ends_with(".pub") {
        std::path::PathBuf::from(private_path)
    } else {
        std::path::PathBuf::from(format!("{}.pub", private_path))
    };
    if pub_path.exists() {
        let _ = fs::remove_file(&pub_path);
    }

    // Delete private key file
    if priv_path.exists() {
        fs::remove_file(&priv_path).map_err(|e| format!("Failed to delete private key file: {}", e))?;
    }

    Ok(format!("SSH key '{}' deleted successfully.", private_path))
}



fn valid_key_name(name: &str) -> bool {
    !name.is_empty()
        && !name.starts_with('.')
        && !name.ends_with(".pub")
        && name.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '_' | '-' | '.'))
}

/// Rename a key pair on disk and repoint every host that uses it. The config
/// update goes through the safe writer (backup); if it fails the files are put back.
pub fn rename_ssh_key(private_path: &str, new_name: &str) -> Result<String, String> {
    if !valid_key_name(new_name) {
        return Err("Key name may only contain letters, digits, '.', '_' and '-'.".to_string());
    }
    let old = std::path::PathBuf::from(private_path);
    if !old.exists() {
        return Err(format!("Key file '{}' does not exist.", private_path));
    }
    let dir = old.parent().ok_or("Invalid key path")?;
    let new = dir.join(new_name);
    let old_pub = std::path::PathBuf::from(format!("{}.pub", private_path));
    let new_pub = dir.join(format!("{}.pub", new_name));
    if new.exists() || new_pub.exists() {
        return Err(format!("A key named '{}' already exists.", new_name));
    }

    let _ = remove_key_from_agent(private_path);
    fs::rename(&old, &new).map_err(|e| format!("Failed to rename private key: {}", e))?;
    let had_pub = old_pub.exists();
    if had_pub {
        if let Err(e) = fs::rename(&old_pub, &new_pub) {
            let _ = fs::rename(&new, &old);
            return Err(format!("Failed to rename public key: {}", e));
        }
    }

    if let Err(e) = crate::config_parser::rename_key_in_hosts(private_path, new_name) {
        let _ = fs::rename(&new, &old);
        if had_pub {
            let _ = fs::rename(&new_pub, &old_pub);
        }
        return Err(format!("Could not update ~/.ssh/config, rename undone: {}", e));
    }
    Ok(new.to_string_lossy().to_string())
}

#[cfg(test)]
mod rename_tests {
    use super::valid_key_name;

    #[test]
    fn key_name_validation() {
        assert!(valid_key_name("id_ed25519_github_work"));
        assert!(!valid_key_name(""));
        assert!(!valid_key_name("../evil"));
        assert!(!valid_key_name("a b"));
        assert!(!valid_key_name("k.pub"));
        assert!(!valid_key_name(".hidden"));
    }
}
