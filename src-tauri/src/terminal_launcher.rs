use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TerminalAppInfo {
    pub id: String,
    pub name: String,
    pub is_installed: bool,
    pub is_default: bool,
    pub path: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SshTestResult {
    pub success: bool,
    pub exit_code: Option<i32>,
    pub output: String,
    pub duration_ms: u64,
}

pub fn detect_terminals() -> Vec<TerminalAppInfo> {
    let mut list = Vec::new();

    #[cfg(target_os = "macos")]
    {
        let candidates = vec![
            ("ghostty", "Ghostty", "/Applications/Ghostty.app"),
            ("wezterm", "WezTerm", "/Applications/WezTerm.app"),
            ("iterm2", "iTerm2", "/Applications/iTerm.app"),
            ("alacritty", "Alacritty", "/Applications/Alacritty.app"),
            ("kitty", "kitty", "/Applications/kitty.app"),
            ("warp", "Warp", "/Applications/Warp.app"),
            ("terminal", "Terminal.app", "/System/Applications/Utilities/Terminal.app"),
        ];

        let mut has_default = false;
        for (id, name, app_path) in candidates {
            let user_app = dirs::home_dir()
                .map(|h| h.join("Applications").join(Path::new(app_path).file_name().unwrap_or_default()))
                .unwrap_or_default();
            let is_installed = Path::new(app_path).exists() || user_app.exists();

            let is_def = !has_default && is_installed;
            if is_def {
                has_default = true;
            }

            list.push(TerminalAppInfo {
                id: id.to_string(),
                name: name.to_string(),
                is_installed,
                is_default: is_def,
                path: app_path.to_string(),
            });
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        list.push(TerminalAppInfo {
            id: "default".to_string(),
            name: "Default Terminal".to_string(),
            is_installed: true,
            is_default: true,
            path: "".to_string(),
        });
    }

    list
}

pub fn launch_ssh_session(terminal_id: &str, host_alias: &str) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        match terminal_id.to_lowercase().as_str() {
            "ghostty" => {
                let _ = Command::new("open")
                    .arg("-a")
                    .arg("Ghostty")
                    .arg("--args")
                    .arg("-e")
                    .arg("ssh")
                    .arg(host_alias)
                    .spawn()
                    .map_err(|e| format!("Failed to launch Ghostty: {}", e))?;
            }
            "wezterm" => {
                let _ = Command::new("open")
                    .arg("-a")
                    .arg("WezTerm")
                    .arg("--args")
                    .arg("start")
                    .arg("--")
                    .arg("ssh")
                    .arg(host_alias)
                    .spawn()
                    .map_err(|e| format!("Failed to launch WezTerm: {}", e))?;
            }
            "iterm2" => {
                let script = format!(
                    r#"tell application "iTerm"
                        create window with default profile command "ssh {}"
                        activate
                    end tell"#,
                    host_alias
                );
                let _ = Command::new("osascript")
                    .arg("-e")
                    .arg(&script)
                    .spawn()
                    .map_err(|e| format!("Failed to launch iTerm2: {}", e))?;
            }
            "alacritty" => {
                let _ = Command::new("open")
                    .arg("-a")
                    .arg("Alacritty")
                    .arg("--args")
                    .arg("-e")
                    .arg("ssh")
                    .arg(host_alias)
                    .spawn()
                    .map_err(|e| format!("Failed to launch Alacritty: {}", e))?;
            }
            "kitty" => {
                let _ = Command::new("open")
                    .arg("-a")
                    .arg("kitty")
                    .arg("--args")
                    .arg("ssh")
                    .arg(host_alias)
                    .spawn()
                    .map_err(|e| format!("Failed to launch kitty: {}", e))?;
            }
            "warp" => {
                let _ = Command::new("open")
                    .arg("-a")
                    .arg("Warp")
                    .arg("--args")
                    .arg(format!("ssh {}", host_alias))
                    .spawn()
                    .map_err(|e| format!("Failed to launch Warp: {}", e))?;
            }
            _ => {
                // Default to Terminal.app via osascript
                let script = format!(
                    r#"tell application "Terminal"
                        do script "ssh {}"
                        activate
                    end tell"#,
                    host_alias
                );
                let _ = Command::new("osascript")
                    .arg("-e")
                    .arg(&script)
                    .spawn()
                    .map_err(|e| format!("Failed to launch Terminal.app: {}", e))?;
            }
        }
        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    {
        // Linux / Unix fallback
        let _ = Command::new("x-terminal-emulator")
            .arg("-e")
            .arg(format!("ssh {}", host_alias))
            .spawn()
            .map_err(|e| format!("Failed to launch terminal: {}", e))?;
        Ok(())
    }
}

pub fn test_ssh_connection(host_alias: &str) -> SshTestResult {
    let start = std::time::Instant::now();
    let mut cmd = Command::new("ssh");

    // GitHub, GitLab, and normal servers test
    cmd.arg("-o").arg("BatchMode=yes")
        .arg("-o").arg("ConnectTimeout=5")
        .arg("-o").arg("StrictHostKeyChecking=accept-new")
        .arg("-T")
        .arg(host_alias);

    match cmd.output() {
        Ok(output) => {
            let duration_ms = start.elapsed().as_millis() as u64;
            let stdout_str = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr_str = String::from_utf8_lossy(&output.stderr).to_string();
            let combined = if !stdout_str.is_empty() && !stderr_str.is_empty() {
                format!("{}\n{}", stdout_str, stderr_str)
            } else if !stdout_str.is_empty() {
                stdout_str
            } else {
                stderr_str
            };

            let code = output.status.code();
            // Note: GitHub/GitLab returns code 1 on successful auth with message "Hi username! You've successfully authenticated..."
            let is_success = output.status.success()
                || combined.contains("successfully authenticated")
                || combined.contains("Welcome to GitLab");

            SshTestResult {
                success: is_success,
                exit_code: code,
                output: combined.trim().to_string(),
                duration_ms,
            }
        }
        Err(e) => {
            let duration_ms = start.elapsed().as_millis() as u64;
            SshTestResult {
                success: false,
                exit_code: None,
                output: format!("Execution error: {}", e),
                duration_ms,
            }
        }
    }
}

pub fn test_ssh_direct(
    host_name: &str,
    user: Option<&str>,
    port: Option<u16>,
    identity_file: Option<&str>,
) -> SshTestResult {
    let start = std::time::Instant::now();
    let mut cmd = Command::new("ssh");

    cmd.arg("-F").arg("/dev/null")
        .arg("-o").arg("BatchMode=yes")
        .arg("-o").arg("ConnectTimeout=6")
        .arg("-o").arg("StrictHostKeyChecking=accept-new")
        .arg("-T");

    if let Some(p) = port {
        if p != 22 && p != 0 {
            cmd.arg("-p").arg(p.to_string());
        }
    }

    if let Some(id_file) = identity_file {
        if !id_file.trim().is_empty() {
            cmd.arg("-i").arg(id_file.trim());
        }
    }

    let target = match user {
        Some(u) if !u.trim().is_empty() => format!("{}@{}", u.trim(), host_name),
        _ => host_name.to_string(),
    };
    cmd.arg(target);

    match cmd.output() {
        Ok(output) => {
            let duration_ms = start.elapsed().as_millis() as u64;
            let stdout_str = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr_str = String::from_utf8_lossy(&output.stderr).to_string();
            let combined = if !stdout_str.is_empty() && !stderr_str.is_empty() {
                format!("{}\n{}", stdout_str, stderr_str)
            } else if !stdout_str.is_empty() {
                stdout_str
            } else {
                stderr_str
            };

            let code = output.status.code();
            let is_success = output.status.success()
                || combined.contains("successfully authenticated")
                || combined.contains("Welcome to GitLab");

            SshTestResult {
                success: is_success,
                exit_code: code,
                output: combined.trim().to_string(),
                duration_ms,
            }
        }
        Err(e) => {
            let duration_ms = start.elapsed().as_millis() as u64;
            SshTestResult {
                success: false,
                exit_code: None,
                output: format!("Execution error: {}", e),
                duration_ms,
            }
        }
    }
}

pub fn install_key_to_remote(host_alias: &str, identity_file: Option<&str>) -> SshTestResult {
    let start = std::time::Instant::now();
    let mut cmd = Command::new("ssh-copy-id");

    if let Some(id_file) = identity_file {
        if !id_file.trim().is_empty() {
            let pub_file = if id_file.ends_with(".pub") {
                id_file.to_string()
            } else {
                format!("{}.pub", id_file)
            };
            cmd.arg("-i").arg(pub_file);
        }
    }

    cmd.arg(host_alias);

    match cmd.output() {
        Ok(output) => {
            let duration_ms = start.elapsed().as_millis() as u64;
            let stdout_str = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr_str = String::from_utf8_lossy(&output.stderr).to_string();
            let combined = format!("{}\n{}", stdout_str, stderr_str);
            let is_success = output.status.success() || combined.contains("Number of key(s) added");

            SshTestResult {
                success: is_success,
                exit_code: output.status.code(),
                output: combined.trim().to_string(),
                duration_ms,
            }
        }
        Err(e) => {
            let duration_ms = start.elapsed().as_millis() as u64;
            SshTestResult {
                success: false,
                exit_code: None,
                output: format!("Failed to execute ssh-copy-id: {}", e),
                duration_ms,
            }
        }
    }
}



