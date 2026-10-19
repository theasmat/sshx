import React, { useMemo } from "react";
import { SshHost } from "../types";
import { buildHostBlock, diffLines } from "../utils/hostConfig";

interface Props {
  host: SshHost;
  /** Host as currently in ~/.ssh/config when editing; omit for a new host. */
  original?: SshHost | null;
  className?: string;
}

/** The ~/.ssh/config block that will be written; a diff when editing an existing host. */
export const ConfigPreview: React.FC<Props> = ({ host, original, className = "" }) => {
  const lines = useMemo(() => {
    const after = buildHostBlock(host);
    return original ? diffLines(buildHostBlock(original), after) : diffLines("", after).filter((l) => l.type === "add");
  }, [host, original]);

  const changed = original ? lines.some((l) => l.type !== "same") : true;

  return (
    <pre
      className={`p-2.5 bg-well border border-line rounded font-mono text-xs overflow-x-auto leading-relaxed ${className}`}
      aria-label={original ? "Config changes" : "Config block to be added"}
    >
      {!changed && <span className="text-gray-500"># No changes to this host</span>}
      {changed &&
        lines.map((l, i) => (
          <div
            key={i}
            className={
              l.type === "add"
                ? original
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-emerald-400"
                : l.type === "del"
                ? "text-rose-400 bg-rose-500/10 line-through decoration-rose-400/40"
                : "text-gray-400"
            }
          >
            {original ? (l.type === "add" ? "+ " : l.type === "del" ? "- " : "  ") : ""}
            {l.text || " "}
          </div>
        ))}
    </pre>
  );
};
