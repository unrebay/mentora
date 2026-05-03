import type { ReactNode, CSSProperties } from "react";

interface Props {
  children: ReactNode;
  /** Accent color used for left border, spotlight glow, and inset shadows. */
  accent: string;
  /** Extra className on the outer container */
  className?: string;
  /** Inline overrides on the outer container */
  style?: CSSProperties;
  /** Adds opacity-→100% spotlight intensification on group-hover */
  hoverable?: boolean;
}

/**
 * AccentCard — glass card with a coloured borderLeft accent and a soft
 * top-right radial spotlight in the same colour. Used by feature cards,
 * step cards (1–5) and tip cards on /guide. Replaces ~60 lines of
 * duplicated inline style across 3 files.
 */
export default function AccentCard({ children, accent, className = "", style, hoverable = true }: Props) {
  return (
    <div
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${hoverable ? "hover:-translate-y-1" : ""} ${className}`}
      style={{
        background: "var(--bg-nav)",
        backdropFilter: "blur(16px) saturate(1.6) brightness(1.02)",
        WebkitBackdropFilter: "blur(16px) saturate(1.6) brightness(1.02)",
        border: "1px solid var(--border-light)",
        borderLeft: `2.5px solid ${accent}`,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.30), 0 1px 0 rgba(255,255,255,0.06) inset",
        ...style,
      }}
    >
      {/* Spotlight — top-right, intensifies on group-hover */}
      <div
        aria-hidden
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none transition-opacity duration-500 opacity-40 group-hover:opacity-95"
        style={{ background: `radial-gradient(circle, ${accent}26 0%, transparent 65%)` }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
