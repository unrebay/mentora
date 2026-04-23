import type { ReactNode } from "react";
import MeLogo from "@/components/MeLogo";

/* ── Icon presets ────────────────────────────────────────── */

export function MentIcon() {
  return <MeLogo height={26} colorM="var(--brand)" colorE="var(--brand)" />;
}

export function FlameIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C12 2 7 7 7 12c0 2.761 2.239 5 5 5s5-2.239 5-5c0-1.5-.5-2.5-1-3.5 0 0 0 2-2 2.5C15.5 9 14 7 12 2z"
        fill="#FF7A00"
      />
    </svg>
  );
}

export function MessageIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#10B981">
      <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
    </svg>
  );
}

export function StarIcon({ color = "#f59e0b" }: { color?: string }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/* ── StatCard component ──────────────────────────────────── */

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  accent: string;
  /** Use brand styling (Мент card) — subtle blue tint wrapper */
  isBrand?: boolean;
}

export default function StatCard({ label, value, icon, accent, isBrand }: StatCardProps) {
  return (
    <div
      data-tilt
      data-tilt-strength="5"
      className="rounded-2xl p-4 border text-center"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2"
        style={
          isBrand
            ? {
                background: "rgba(69,97,232,0.08)",
                border: "1.5px solid rgba(100,140,240,0.3)",
              }
            : { background: `${accent}18` }
        }
      >
        {icon}
      </div>
      <div className="font-bold text-xl" style={{ color: "var(--text)" }}>
        {value.toLocaleString("ru-RU")}
      </div>
      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
    </div>
  );
}
