import { describe, expect, it } from "vitest";
import {
  isBareHostnameAlias,
  keyNameAlternatives,
  providerSlug,
  suggestHostAlias,
  suggestKeyComment,
  suggestKeyName,
} from "./keyUtils";
import { SshKeyInfo } from "../types";

const key = (file_name: string): SshKeyInfo => ({
  file_name,
  private_path: `/h/.ssh/${file_name}`,
  key_type: "ed25519",
  fingerprint_sha256: "",
  comment: "",
  is_agent_loaded: false,
});

describe("providerSlug", () => {
  it("maps hostnames to a short provider name", () => {
    expect(providerSlug("github.com")).toBe("github");
    expect(providerSlug("ssh.dev.azure.com")).toBe("ssh_dev_azure");
    expect(providerSlug("192.168.1.5")).toBe("192_168_1_5");
    expect(providerSlug("")).toBe("");
  });
});

describe("suggestKeyName", () => {
  it("uses provider + account when the alias is a bare hostname", () => {
    expect(suggestKeyName({ alias: "github.com", hostName: "github.com", account: "work" })).toBe("id_ed25519_github_work");
    expect(suggestKeyName({ alias: "github.com", hostName: "github.com" })).toBe("id_ed25519_github");
  });

  it("keeps a meaningful alias", () => {
    expect(suggestKeyName({ alias: "prod-api", hostName: "1.2.3.4" })).toBe("id_ed25519_prod-api");
  });

  it("avoids collisions and offers alternatives", () => {
    const ctx = { alias: "github-work", hostName: "github.com", account: "work" };
    const keys = [key("id_ed25519_github_work")];
    expect(suggestKeyName(ctx, keys)).toBe("id_ed25519_github_work_2");
    expect(keyNameAlternatives(ctx, keys)).toEqual(["id_ed25519_github-work", "id_ed25519_github"]);
  });
});

describe("suggestKeyComment / alias helpers", () => {
  it("builds comment and alias", () => {
    expect(suggestKeyComment({ alias: "github-work", account: "Work" })).toBe("work@github-work");
    expect(suggestKeyComment({ alias: "prod" })).toBe("prod@sshx");
    expect(suggestHostAlias("github.com", "work", [])).toBe("github-work");
    expect(isBareHostnameAlias("github.com", "github.com")).toBe(true);
    expect(isBareHostnameAlias("github-work", "github.com")).toBe(false);
    expect(isBareHostnameAlias("my.box", "my.box")).toBe(false);
  });
});
