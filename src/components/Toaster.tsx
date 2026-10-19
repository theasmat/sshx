import React, { useEffect, useState } from "react";
import { subscribeToasts, ToastItem } from "../utils/toast";

const COLORS: Record<ToastItem["kind"], string> = {
  error: "border-rose-500/40 bg-rose-950/90 text-rose-100",
  success: "border-emerald-500/40 bg-emerald-950/90 text-emerald-100",
  info: "border-blue-500/40 bg-[#0f1830]/95 text-blue-100",
};

export const Toaster: React.FC = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(
    () =>
      subscribeToasts((t) => {
        setItems((prev) => [...prev, t]);
        // Errors and undo prompts stay a bit longer so they can be read / used.
        const ms = t.kind === "error" || t.action ? 8000 : 4000;
        setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), ms);
      }),
    []
  );

  const dismiss = (id: number) => setItems((prev) => prev.filter((x) => x.id !== id));

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm"
      role="status"
      aria-live="polite"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-xs shadow-lg ${COLORS[t.kind]}`}
        >
          <span className="flex-1 break-words">{t.text}</span>
          {t.action && (
            <button
              className="font-semibold underline cursor-pointer"
              onClick={() => {
                t.action!.run();
                dismiss(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
          <button
            aria-label="Dismiss"
            className="opacity-60 hover:opacity-100 cursor-pointer"
            onClick={() => dismiss(t.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
