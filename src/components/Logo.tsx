import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

const sizes = {
  sm: { icon: 28, rx: 7,  fontSize: 14, wordmark: 15, gap: 8  },
  md: { icon: 36, rx: 9,  fontSize: 18, wordmark: 20, gap: 10 },
  lg: { icon: 48, rx: 12, fontSize: 24, wordmark: 26, gap: 12 },
};

export default function Logo({ size = "md", href = "/", className = "" }: LogoProps) {
  const s = sizes[size];

  const mark = (
    <span
      className={`inline-flex items-center gap-[${s.gap}px] select-none ${className}`}
      style={{ gap: s.gap }}
    >
      {/* Icon mark */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="40" height="40" rx={s.rx * (40 / s.icon)} fill="url(#logo-grad)" />
        <text
          x="20"
          y="28"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="22"
          fontWeight="800"
          fill="white"
          textAnchor="middle"
          letterSpacing="-0.5"
        >
          M
        </text>
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4f6ef7" />
            <stop offset="100%" stopColor="#3b5bdb" />
          </linearGradient>
        </defs>
      </svg>

      {/* Wordmark */}
      <span
        style={{ fontSize: s.wordmark, letterSpacing: "-0.03em" }}
        className="font-bold text-gray-900 leading-none"
      >
        entora
      </span>
    </span>
  );

  if (!href) return mark;

  return (
    <Link href={href} className="inline-flex items-center" aria-label="Mentora — главная">
      {mark}
    </Link>
  );
}
