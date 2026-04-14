import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  fontSize?: string;
  href?: string;
  className?: string;
}

const sizes = {
  sm: { fontSize: "1.25rem" },  // ~20px
  md: { fontSize: "1.625rem" }, // ~26px
  lg: { fontSize: "2.125rem" }, // ~34px
};

export default function Logo({
  size = "md",
  fontSize: fontSizeOverride,
  href = "/",
  className = "",
}: LogoProps) {
  const fontSize = fontSizeOverride ?? sizes[size].fontSize;

  const mark = (
    <span
      className={`inline-flex items-baseline select-none ${className}`}
      style={{
        fontFamily: "var(--font-playfair), Georgia, serif",
        fontSize,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        lineHeight: 1,
        color: "var(--text)",
      }}
    >
      M
      <span style={{
        color: "#4561E8",
        fontStyle: "italic",
        // Lock the italic 'e' to the text baseline.
        // top: 0.03em compensates for Playfair italic optical rise.
        // marginRight: 0.05em adds a hair-space before 'ntora'.
        display: "inline-block",
        verticalAlign: "baseline",
        position: "relative",
        top: "0.03em",
        marginRight: "0.05em",
      }}>e</span>
      ntora
    </span>
  );

  if (!href) return mark;

  return (
    <Link href={href} className="inline-flex items-baseline" aria-label="Mentora — главная">
      {mark}
    </Link>
  );
}
