import React from "react";

export interface SshxLogoProps {
  /**
   * - "icon": Pure official vector logo
   * - "text": Icon + clean modern wordmark "SSHX"
   * - "badge": Icon + "SSHX" + tag/badge (e.g. "v1.0.0")
   */
  variant?: "icon" | "text" | "badge";
  /** Size preset or pixel number */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  /** Optional macStyle container flag */
  macStyle?: boolean;
  /** Custom tag text for the "badge" variant */
  tagText?: string;
  /** Additional container class name */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Official SSHX Vector SVG Logo:
 * Classic teal window terminal with prompt `>_` and golden security key.
 */
export const SshxGlyphSvg: React.FC<{
  size?: number | string;
  className?: string;
}> = ({ size = 32, className = "" }) => {
  const id = React.useId().replace(/:/g, "_");
  const screenGradId = `sshx_screen_${id}`;
  const keyGradId = `sshx_key_${id}`;
  const clipId = `sshx_clip_${id}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Background Screen Gradient */}
        <linearGradient id={screenGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7ebfab" />
          <stop offset="100%" stopColor="#a6ddcb" />
        </linearGradient>

        {/* Key Body Gradient */}
        <linearGradient id={keyGradId} x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#f7cb4b" />
          <stop offset="55%" stopColor="#ecb335" />
          <stop offset="100%" stopColor="#c97e1b" />
        </linearGradient>

        {/* Window Interior Clip */}
        <clipPath id={clipId}>
          <rect x="58" y="58" width="396" height="396" rx="42" ry="42" />
        </clipPath>
      </defs>

      {/* Outer Window Frame */}
      <rect x="40" y="40" width="432" height="432" rx="58" ry="58" fill="#1b4d5d" />

      {/* Window Content Area */}
      <g clipPath={`url(#${clipId})`}>
        {/* Header Bar */}
        <rect x="58" y="58" width="396" height="74" fill="#1b4d5d" />

        {/* Main Light Window Workspace */}
        <rect x="58" y="132" width="396" height="322" fill={`url(#${screenGradId})`} />

        {/* Terminal Prompt Window */}
        <g id="terminal-box">
          <rect x="88" y="160" width="180" height="136" rx="16" ry="16" fill="#1e4b5c" />
          {/* Terminal Chevron Prompt '>' */}
          <path
            d="M 118 194 L 148 224 L 118 254"
            fill="none"
            stroke="#ffffff"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Terminal Underscore Cursor '_' */}
          <line
            x1="168"
            y1="254"
            x2="208"
            y2="254"
            stroke="#ffffff"
            strokeWidth="14"
            strokeLinecap="round"
          />
        </g>

        {/* Key Graphic */}
        <g id="security-key">
          {/* White Outer Outline */}
          <path
            d="
              M 316 324
              L 142 324
              L 122 334
              Q 112 344 122 354
              L 138 364
              L 154 364
              L 168 382
              L 184 382
              L 196 364
              L 214 364
              L 228 382
              L 248 382
              L 260 364
              L 316 364
              A 54 54 0 1 0 316 324 Z
            "
            fill="none"
            stroke="#ffffff"
            strokeWidth="18"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Key Body with Cutout Hole */}
          <path
            d="
              M 316 324
              L 142 324
              L 122 334
              Q 112 344 122 354
              L 138 364
              L 154 364
              L 168 382
              L 184 382
              L 196 364
              L 214 364
              L 228 382
              L 248 382
              L 260 364
              L 316 364
              A 54 54 0 1 0 316 324 Z
              M 388 344
              A 17 17 0 1 1 354 344
              A 17 17 0 1 1 388 344 Z
            "
            fillRule="evenodd"
            fill={`url(#keyGradId)`}
          />

          {/* Key Blade Horizontal Highlight */}
          <rect x="146" y="339" width="134" height="9" rx="4.5" ry="4.5" fill="#fbe886" opacity="0.95" />
        </g>
      </g>
    </svg>
  );
};

export const SshxMacAppIcon = SshxGlyphSvg;

/**
 * Primary SshxLogo component supporting 3 variants:
 * 1. "icon": Official standalone vector icon
 * 2. "text": Icon + "SSHX" wordmark
 * 3. "badge": Icon + "SSHX" wordmark + tag/badge
 */
export const SshxLogo: React.FC<SshxLogoProps> = ({
  variant = "badge",
  size = "md",
  tagText = "v1.0.0",
  className = "",
  onClick,
}) => {
  // Resolve pixel size
  let pixelSize = 28;
  let textScale = "text-sm";
  let tagScale = "text-[10px]";

  if (typeof size === "number") {
    pixelSize = size;
  } else {
    switch (size) {
      case "xs":
        pixelSize = 20;
        textScale = "text-xs";
        tagScale = "text-[9px]";
        break;
      case "sm":
        pixelSize = 24;
        textScale = "text-xs";
        tagScale = "text-[9px]";
        break;
      case "md":
        pixelSize = 32;
        textScale = "text-sm";
        tagScale = "text-[10px]";
        break;
      case "lg":
        pixelSize = 44;
        textScale = "text-lg";
        tagScale = "text-xs";
        break;
      case "xl":
        pixelSize = 64;
        textScale = "text-2xl";
        tagScale = "text-xs";
        break;
    }
  }

  // 1. Variant: Icon Only
  if (variant === "icon") {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center shrink-0 ${onClick ? "cursor-pointer" : ""} ${className}`}
      >
        <SshxGlyphSvg size={pixelSize} />
      </div>
    );
  }

  // 2. Variant: Icon + Wordmark
  if (variant === "text") {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-2 select-none shrink-0 ${onClick ? "cursor-pointer" : ""} ${className}`}
      >
        <SshxGlyphSvg size={pixelSize} />
        <div className="flex items-center tracking-tight font-black font-sans leading-none">
          <span className={`text-white ${textScale}`}>SSH</span>
          <span className={`text-[#38BDF8] ${textScale}`}>X</span>
        </div>
      </div>
    );
  }

  // 3. Variant: Icon + Wordmark + Tag/Badge
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none shrink-0 ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <SshxGlyphSvg size={pixelSize} />
      <div className="flex items-center gap-2">
        <div className="flex items-center tracking-tight font-black font-sans leading-none">
          <span className={`text-white ${textScale}`}>SSH</span>
          <span className={`text-[#38BDF8] ${textScale}`}>X</span>
        </div>
        <span
          className={`font-semibold font-mono tracking-wider px-1.5 py-0.5 rounded-md border ${tagScale} leading-none`}
          style={{
            background: "rgba(56, 189, 248, 0.1)",
            borderColor: "rgba(56, 189, 248, 0.25)",
            color: "#38BDF8",
          }}
        >
          {tagText}
        </span>
      </div>
    </div>
  );
};
