import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  fontSize?: string;
  href?: string;
  className?: string;
  /** Force a specific text colour (e.g. "white" for permanently-dark backgrounds) */
  textColor?: string;
}

const sizes = {
  sm: { fontSize: "1.25rem" },  // ~20px
  md: { fontSize: "1.625rem" }, // ~26px
  lg: { fontSize: "2.125rem" }, // ~34px
};

// Beta badge auto-expires on June 1st 2026
const BETA_EXPIRES = new Date("2026-06-01T00:00:00Z");
const showBeta = () => new Date() < BETA_EXPIRES;

export default function Logo({
  size = "md",
  fontSize: fontSizeOverride,
  href = "/",
  className = "",
  textColor,
}: LogoProps) {
  const fontSize = fontSizeOverride ?? sizes[size].fontSize;

  const mark = (
    <span
      className={`relative inline-flex items-baseline select-none ${className}`}
      style={{
        fontFamily: "var(--font-playfair), Georgia, serif",
        fontSize,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        lineHeight: 1,
        color: textColor ?? "var(--text)",
      }}
    >
      M
      <span style={{
        color: "#4561E8",
        fontStyle: "italic",
        marginRight: "0.05em",
      }}>e</span>
      ntora
      {showBeta() && (
        <span
          style={{
            position: "absolute",
            top: "-0.9em",
            right: "-2.9em",
            fontSize: "0.30em",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontStyle: "normal",
            fontWeight: 600,
            letterSpacing: "0.02em",
            padding: "0.18em 0.52em",
            borderRadius: "99px",
            background: "rgba(69,97,232,0.11)",
            border: "1px solid rgba(69,97,232,0.22)",
            color: "#4561E8",
            lineHeight: 1.4,
            whiteSpace: "nowrap",
            backdropFilter: "blur(8px)",
          }}
        >
          beta
        </span>
      )}
    </span>
  );

  if (!href) return mark;

  return (
    <Link href={href} className="inline-flex items-baseline" aria-label="Mentora — главная">
      {mark}
    </Link>
  );
}
