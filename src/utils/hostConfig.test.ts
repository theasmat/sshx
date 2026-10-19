import { describe, expect, it } from "vitest";
import { buildHostBlock, diffLines } from "./hostConfig";
import { SshHost } from "../types";

const host = (extra: Partial<SshHost> = {}): SshHost => ({
  id: "1",
  host_pattern: "github-work",
  host_name: "github.com",
  user: "git",
  local_forward: [],
  remote_forward: [],
  custom_directives: [],
  tags: [],
  comments: [],
  ...extra,
});

describe("buildHostBlock", () => {
  it("writes directives in serializer order and skips defaults", () => {
    expect(buildHostBlock(host({ port: 22, identity_file: "~/.ssh/k", identities_only: true }))).toBe(
      "Host github-work\n    HostName github.com\n    User git\n    IdentityFile ~/.ssh/k\n    IdentitiesOnly yes"
    );
  });

  it("drops IdentitiesOnly without a key, like the Rust serializer", () => {
    expect(buildHostBlock(host({ identities_only: true }))).not.toContain("IdentitiesOnly");
  });

  it("includes the @sshx metadata line", () => {
    expect(buildHostBlock(host({ tags: ["git", "account:work"] })).split("\n")[0]).toBe("# @sshx: tags=git,account:work");
  });
});

describe("diffLines", () => {
  it("marks added and removed lines", () => {
    const d = diffLines("a\nb\nc", "a\nc\nd");
    expect(d.map((l) => `${l.type}:${l.text}`)).toEqual(["same:a", "del:b", "same:c", "add:d"]);
  });
});
