import React, { useEffect, useRef, useState } from "react";

type Variant = "primary" | "secondary" | "plain" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent hover:bg-accent-hover text-white",
  secondary: "bg-control hover:bg-hover text-label",
  plain: "text-accent hover:bg-white/5",
  danger: "bg-rose-500/15 hover:bg-rose-500/25 text-rose-300",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: React.ReactNode;
}

/** One button style set; 32px high, 8px radius, visible focus ring. */
export const Button: React.FC<ButtonProps> = ({ variant = "secondary", icon, className = "", children, ...rest }) => (
  <button
    {...rest}
    className={`inline-flex items-center justify-center gap-1.5 h-8 px-3.5 rounded-ctl text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${VARIANTS[variant]} ${className}`}
  >
    {icon}
    {children}
  </button>
);

/** Neutral by default; pass a tone only when the badge states something. */
export const Badge: React.FC<{ tone?: "neutral" | "ok" | "warn"; children: React.ReactNode; title?: string }> = ({
  tone = "neutral",
  children,
  title,
}) => {
  const t = {
    neutral: "bg-white/[0.06] text-label-2",
    ok: "bg-emerald-500/15 text-emerald-300",
    warn: "bg-amber-500/15 text-amber-300",
  }[tone];
  return (
    <span title={title} className={`inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium ${t}`}>
      {children}
    </span>
  );
};

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** Draw a divider above this item. */
  separated?: boolean;
}

/** "More" menu: closes on outside click, Escape or selection. */
export const Menu: React.FC<{ items: MenuItem[]; trigger: React.ReactNode; label: string }> = ({ items, trigger, label }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center h-8 w-8 rounded-ctl bg-control hover:bg-hover text-label cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-30 min-w-[220px] py-1 rounded-card bg-raised shadow-pop text-[13px]"
        >
          {items.map((it) => (
            <React.Fragment key={it.label}>
              {it.separated && <div className="my-1 h-px bg-white/[0.07]" />}
              <button
                role="menuitem"
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false);
                  it.onSelect();
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left cursor-pointer disabled:opacity-40 disabled:cursor-default hover:bg-accent hover:text-white ${
                  it.danger ? "text-rose-300" : "text-label"
                }`}
              >
                {it.icon && <span className="w-4 shrink-0 opacity-80">{it.icon}</span>}
                <span className="truncate">{it.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

/** Inset grouped list row (label left, value right), like macOS Settings. */
export const Row: React.FC<{ label: React.ReactNode; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-[13px]">
    <span className="text-label-2 shrink-0">{label}</span>
    <span className="text-label font-mono text-right break-all min-w-0">{children}</span>
  </div>
);

export const Group: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-1.5">
    {title && <h3 className="px-1 text-[11px] font-medium uppercase tracking-wide text-label-3">{title}</h3>}
    <div className="rounded-card bg-card divide-y divide-white/[0.06] overflow-hidden">{children}</div>
  </section>
);

/** One modal pattern: title row, scrollable body, right-aligned footer. Esc or backdrop click closes. */
export const Dialog: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
}> = ({ title, subtitle, onClose, children, footer, size = "md" }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${size === "lg" ? "max-w-2xl" : "max-w-lg"} max-h-[85vh] flex flex-col rounded-card bg-raised shadow-pop overflow-hidden`}
      >
        <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-label">{title}</h3>
            {subtitle && <p className="text-xs text-label-2 font-mono truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-7 w-7 flex items-center justify-center rounded-full text-label-2 hover:text-label hover:bg-white/[0.08] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer && <div className="px-5 py-3 flex items-center justify-end gap-2 bg-black/20">{footer}</div>}
      </div>
    </div>
  );
};

/** macOS-style switch. */
export const Switch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({
  checked,
  onChange,
  label,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative w-10 h-6 rounded-full shrink-0 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
      checked ? "bg-emerald-500" : "bg-white/[0.18]"
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-4" : ""
      }`}
    />
  </button>
);

/** Segmented control for a small set of mutually exclusive choices. */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex p-0.5 rounded-ctl bg-white/[0.07]">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`h-7 px-3 rounded-[6px] text-[13px] cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
            o.value === value ? "bg-white/[0.16] text-label font-medium" : "text-label-2 hover:text-label"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const inputCls =
  "w-full h-8 px-2.5 rounded-ctl bg-white/[0.06] text-label placeholder-label-3 focus:outline-none focus:bg-white/[0.09] focus:ring-2 focus:ring-accent/70";

/** Settings-style form row: label left, controls right. */
export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-start gap-4 px-4 py-2.5">
    <span className="w-28 shrink-0 pt-1.5 text-label-2">{label}</span>
    <div className="flex-1 min-w-0 space-y-1.5">{children}</div>
  </div>
);

export const Hint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs text-label-3">{children}</p>
);

export const Notice: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div role="status" className="rounded-ctl bg-amber-500/10 text-amber-200 px-3 py-2 text-xs">
    {children}
  </div>
);
