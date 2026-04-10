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
      <span style={{ color: "#4561E8", fontStyle: "italic" }}>e</span>
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
