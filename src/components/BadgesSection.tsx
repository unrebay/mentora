"use client";
import { BADGE_DEFINITIONS } from "@/lib/types";

interface Props {
  earnedBadgeIds: string[];
}

export default function BadgesSection({ earnedBadgeIds }: Props) {
  if (earnedBadgeIds.length === 0) return null;
  const earnedSet = new Set(earnedBadgeIds);
  const earnedBadges = BADGE_DEFINITIONS.filter((b) => earnedSet.has(b.id));
  return (
    <div className="mt-10">
      <p className="text-xs font-bold tracking-[0.18em] uppercase mb-4" style={{ color: "var(--text-muted)" }}>
        Достижения
      </p>
      <div className="flex flex-wrap gap-3">
        {earnedBadges.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5 border transition-all hover:scale-[1.02]"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            title={badge.description}
          >
            <span className="text-xl leading-none select-none">{badge.emoji}</span>
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text)" }}>
                {badge.title}
              </p>
              <p className="text-xs leading-tight mt-0.5" style={{ color: "var(--text-muted)" }}>
                {badge.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
