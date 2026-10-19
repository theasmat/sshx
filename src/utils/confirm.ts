export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
}

let handler: ((r: ConfirmRequest) => void) | null = null;

export function registerConfirmHandler(h: ((r: ConfirmRequest) => void) | null) {
  handler = h;
}

/** In-app replacement for window.confirm; resolves false if no dialog host is mounted. */
export function askConfirm(opts: Omit<ConfirmRequest, "resolve">): Promise<boolean> {
  return new Promise((resolve) => {
    if (!handler) return resolve(false);
    handler({ ...opts, resolve });
  });
}
