mod config_parser;
mod key_manager;
mod known_hosts;
mod security_audit;
mod terminal_launcher;

use config_parser::{
    list_config_backups, read_ssh_config, remove_host_entry, restore_config_backup,
    serialize_ssh_config, unlink_key_from_hosts, write_ssh_config_safe, SshConfigFileData,
    SshHost,
};
use key_manager::{
    add_key_to_agent as add_key_to_agent_fn, delete_ssh_key as delete_ssh_key_fn,
    generate_ssh_key, list_ssh_keys, remove_key_from_agent as remove_key_from_agent_fn,
    GenerateKeyRequest, SshKeyInfo,
};
use known_hosts::{
    fix_stale_host as fix_stale_host_fn, list_known_hosts, read_known_hosts_raw, remove_known_host,
    write_known_hosts_raw, KnownHostEntry,
};
use security_audit::{
    fix_all_permissions, fix_selected_issues, run_security_audit, SecurityAuditReport,
    SelectiveFixRequest, SelectiveFixResponse,
};
use terminal_launcher::{
    detect_terminals, install_key_to_remote as install_key_to_remote_fn, launch_ssh_session,
    test_ssh_connection, test_ssh_direct, SshTestResult, TerminalAppInfo,
};

#[tauri::command]
fn get_ssh_config() -> Result<SshConfigFileData, String> {
    read_ssh_config()
}

#[tauri::command]
fn save_ssh_config_raw(content: String) -> Result<SshConfigFileData, String> {
    write_ssh_config_safe(&content)?;
    read_ssh_config()
}

#[tauri::command]
fn save_ssh_hosts(
    global_comments: Vec<String>,
    global_directives: Vec<(String, String)>,
    hosts: Vec<SshHost>,
) -> Result<SshConfigFileData, String> {
    let serialized = serialize_ssh_config(&global_comments, &global_directives, &hosts);
    write_ssh_config_safe(&serialized)?;
    read_ssh_config()
}

#[tauri::command]
fn delete_host(host_id: String, host_pattern: Option<String>) -> Result<SshConfigFileData, String> {
    remove_host_entry(&host_id, host_pattern.as_deref())
}

#[tauri::command]
fn get_ssh_keys() -> Result<Vec<SshKeyInfo>, String> {
    list_ssh_keys()
}

#[tauri::command]
fn create_ssh_key(req: GenerateKeyRequest) -> Result<SshKeyInfo, String> {
    generate_ssh_key(req)
}

#[tauri::command]
fn delete_key(private_path: String, unlink_hosts: bool) -> Result<String, String> {
    if unlink_hosts {
        let _ = unlink_key_from_hosts(&private_path);
    }
    delete_ssh_key_fn(&private_path)
}

#[tauri::command]
fn unlink_key(key_path: String) -> Result<SshConfigFileData, String> {
    unlink_key_from_hosts(&key_path)
}

#[tauri::command]
fn add_key_to_agent(private_path: String) -> Result<String, String> {
    add_key_to_agent_fn(&private_path)
}

#[tauri::command]
fn remove_key_from_agent(private_path: String) -> Result<String, String> {
    remove_key_from_agent_fn(&private_path)
}

#[tauri::command]
fn get_detected_terminals() -> Vec<TerminalAppInfo> {
    detect_terminals()
}

#[tauri::command]
fn connect_in_terminal(terminal_id: String, host_alias: String) -> Result<(), String> {
    launch_ssh_session(&terminal_id, &host_alias)
}

#[tauri::command]
fn test_host_connection(host_alias: String) -> SshTestResult {
    test_ssh_connection(&host_alias)
}

#[tauri::command]
fn test_direct_connection(
    host_name: String,
    user: Option<String>,
    port: Option<u16>,
    identity_file: Option<String>,
) -> SshTestResult {
    test_ssh_direct(&host_name, user.as_deref(), port, identity_file.as_deref())
}

#[tauri::command]
fn install_key_to_remote(host_alias: String, identity_file: Option<String>) -> SshTestResult {
    install_key_to_remote_fn(&host_alias, identity_file.as_deref())
}

#[tauri::command]
fn get_known_hosts() -> Result<Vec<KnownHostEntry>, String> {
    list_known_hosts()
}

#[tauri::command]
fn get_known_hosts_raw() -> Result<String, String> {
    read_known_hosts_raw()
}

#[tauri::command]
fn save_known_hosts_raw(content: String) -> Result<(), String> {
    write_known_hosts_raw(&content)
}

#[tauri::command]
fn delete_known_host(host_pattern: String, line_number: Option<usize>) -> Result<(), String> {
    remove_known_host(&host_pattern, line_number)
}

#[tauri::command]
fn list_backups() -> Result<Vec<String>, String> {
    list_config_backups()
}

#[tauri::command]
fn restore_backup(backup_name: String) -> Result<SshConfigFileData, String> {
    restore_config_backup(&backup_name)?;
    read_ssh_config()
}

#[tauri::command]
fn audit_security() -> Result<SecurityAuditReport, String> {
    run_security_audit()
}

#[tauri::command]
fn fix_security_permissions() -> Result<SecurityAuditReport, String> {
    fix_all_permissions()?;
    run_security_audit()
}

#[tauri::command]
fn fix_selected_security_issues(requests: Vec<SelectiveFixRequest>) -> Result<SelectiveFixResponse, String> {
    fix_selected_issues(requests)
}

#[tauri::command]
fn fix_stale_host(host_pattern: String) -> Result<String, String> {
    fix_stale_host_fn(&host_pattern)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_ssh_config,
            save_ssh_config_raw,
            save_ssh_hosts,
            delete_host,
            get_ssh_keys,
            create_ssh_key,
            delete_key,
            unlink_key,
            add_key_to_agent,
            remove_key_from_agent,
            get_detected_terminals,
            connect_in_terminal,
            test_host_connection,
            test_direct_connection,
            install_key_to_remote,
            get_known_hosts,
            get_known_hosts_raw,
            save_known_hosts_raw,
            delete_known_host,
            fix_stale_host,
            list_backups,
            restore_backup,
            audit_security,
            fix_security_permissions,
            fix_selected_security_issues
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


