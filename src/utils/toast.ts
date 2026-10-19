export interface ToastItem {
  id: number;
  kind: "error" | "success" | "info";
  text: string;
  action?: { label: string; run: () => void };
}

type Listener = (t: ToastItem) => void;
const listeners = new Set<Listener>();
let nextId = 1;

export function subscribeToasts(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function push(kind: ToastItem["kind"], text: unknown, action?: ToastItem["action"]) {
  const t: ToastItem = { id: nextId++, kind, text: String(text), action };
  listeners.forEach((l) => l(t));
}

export const toast = {
  error: (text: unknown) => push("error", text),
  success: (text: unknown) => push("success", text),
  info: (text: unknown, action?: ToastItem["action"]) => push("info", text, action),
};
