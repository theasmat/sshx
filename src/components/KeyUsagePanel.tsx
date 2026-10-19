import React, { useState } from "react";
import { BsPencilSquare } from "react-icons/bs";
import { SshHost, SshKeyInfo } from "../types";
import { api } from "../api";
import { cleanKeyFileName, hostsUsingKey, isKeyNameDuplicate } from "../utils/keyUtils";
import { getAccountLabel, isGitHost } from "../utils/hostUtils";
import { toast } from "../utils/toast";

interface Props {
  keyInfo: SshKeyInfo;
  keys: SshKeyInfo[];
  hosts: SshHost[];
  /** Account each host authenticated as in its last Test, by host id. */
  hostAccounts?: Record<string, string>;
  onRenamed: (newPath: string) => void;
}

/** Which hosts use this key, plus a rename that repoints them (config is backed up first). */
export const KeyUsagePanel: React.FC<Props> = ({ keyInfo, keys, hosts, hostAccounts, onRenamed }) => {
  const users = hostsUsingKey(keyInfo, hosts);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(keyInfo.file_name);
  const [busy, setBusy] = useState(false);

  const clean = cleanKeyFileName(name);
  const invalid = !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(clean) || clean.endsWith(".pub");
  const taken = clean !== keyInfo.file_name && isKeyNameDuplicate(clean, keys);

  const submit = async () => {
    if (invalid || taken || clean === keyInfo.file_name) return;
    setBusy(true);
    try {
      const newPath = await api.renameKey(keyInfo.private_path, clean);
      toast.success(
        users.length
          ? `Renamed to ${clean}; updated ${users.length} host${users.length === 1 ? "" : "s"}`
          : `Renamed to ${clean}`
      );
      setEditing(false);
      onRenamed(newPath);
    } catch (err) {
      toast.error(`Rename failed: ${err}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-3 bg-app border border-line rounded-md space-y-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none">
          Used by
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setName(keyInfo.file_name);
              setEditing(true);
            }}
            className="flex items-center gap-1 text-gray-300 hover:text-white cursor-pointer"
          >
            <BsPencilSquare className="w-3 h-3" />
            <span>Rename</span>
          </button>
        )}
      </div>

      {users.length === 0 ? (
        <div className="text-gray-500">No host uses this key.</div>
      ) : (
        <ul className="font-mono text-gray-200 space-y-0.5">
          {users.map((h) => {
            const acct = getAccountLabel(h);
            return (
              <li key={h.id}>
                {h.host_pattern}
                {acct && <span className="text-amber-300"> @{acct}</span>}
                {h.host_name && <span className="text-gray-500"> · {h.host_name}</span>}
                {hostAccounts?.[h.id] ? (
                  <span className="text-emerald-400"> · authenticates as @{hostAccounts[h.id]}</span>
                ) : (
                  isGitHost(h) && <span className="text-gray-500"> · not tested</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <div className="space-y-1.5 pt-1">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") setEditing(false);
            }}
            aria-label="New key file name"
            className="w-full bg-panel border border-line rounded px-2.5 py-1 font-mono text-white focus:outline-none focus:border-blue-500"
          />
          {(invalid || taken) && (
            <div className="text-rose-300">
              {taken ? "A key with that name already exists." : "Use letters, digits, '.', '_' and '-' only."}
            </div>
          )}
          <div className="text-gray-500">
            Renames the key files and updates {users.length} host{users.length === 1 ? "" : "s"} in ~/.ssh/config
            (a backup is taken first).
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || invalid || taken || clean === keyInfo.file_name}
              onClick={submit}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Renaming..." : "Rename"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-2.5 py-1 bg-control border border-line-strong text-gray-300 rounded cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
