import React, { useEffect, useState } from "react";
import { ConfirmRequest, registerConfirmHandler } from "../utils/confirm";

export const ConfirmDialog: React.FC = () => {
  const [req, setReq] = useState<ConfirmRequest | null>(null);

  useEffect(() => {
    registerConfirmHandler(setReq);
    return () => registerConfirmHandler(null);
  }, []);

  useEffect(() => {
    if (!req) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!req) return null;
  const close = (ok: boolean) => {
    req.resolve(ok);
    setReq(null);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60" onClick={() => close(false)}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-[min(92vw,420px)] bg-[#0b0f19] border border-[#1f2942] rounded-xl p-4 space-y-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-title" className="text-sm font-bold text-white">
          {req.title}
        </h3>
        <p className="text-xs text-gray-300 whitespace-pre-line">{req.message}</p>
        <div className="flex justify-end gap-2">
          <button
            autoFocus
            onClick={() => close(false)}
            className="px-3 py-1.5 bg-[#161d30] border border-[#232f4d] text-gray-200 rounded-lg text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => close(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer ${
              req.danger ? "bg-rose-600 hover:bg-rose-500" : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            {req.confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};
