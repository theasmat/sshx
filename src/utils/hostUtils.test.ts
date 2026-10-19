import { describe, expect, it } from "vitest";
import { clusterHosts, findSiblingHosts, getAccountLabel, parseGitAccount } from "./hostUtils";
import { SshHost } from "../types";

const h = (id: string, host_name: string, extra: Partial<SshHost> = {}): SshHost => ({
  id,
  host_pattern: id,
  host_name,
  user: "git",
  local_forward: [],
  remote_forward: [],
  custom_directives: [],
  tags: [],
  comments: [],
  ...extra,
});

describe("findSiblingHosts / clusterHosts", () => {
  const hosts = [h("a", "github.com"), h("b", "GitHub.com"), h("c", "gitlab.com"), h("d", "github.com", { port: 2222 })];

  it("matches same address, user and port case-insensitively", () => {
    expect(findSiblingHosts(hosts[0], hosts).map((x) => x.id)).toEqual(["b"]);
  });

  it("clusters shared hosts and leaves others alone", () => {
    const c = clusterHosts(hosts);
    expect(c.map((x) => x.hosts.map((y) => y.id))).toEqual([["a", "b"], ["c"], ["d"]]);
    expect(c[0].target).toBe("github.com");
    expect(c[1].target).toBeNull();
  });
});

describe("parseGitAccount", () => {
  it("reads GitHub, GitLab and Bitbucket replies", () => {
    expect(parseGitAccount("Hi octocat! You've successfully authenticated")).toBe("octocat");
    expect(parseGitAccount("Welcome to GitLab, @tanuki!")).toBe("tanuki");
    expect(parseGitAccount("authenticated via ssh key.\nYou can use git... logged in as bob.")).toBe("bob");
    expect(parseGitAccount("Permission denied (publickey).")).toBeNull();
  });
});

describe("getAccountLabel", () => {
  it("reads the account: tag", () => {
    expect(getAccountLabel({ tags: ["git", "account:work"] })).toBe("work");
    expect(getAccountLabel({ tags: ["git"] })).toBeNull();
  });
});
