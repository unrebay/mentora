"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { SUBJECTS } from "@/lib/types";
import { RUSSIAN_HISTORY_TOPICS } from "@/lib/topics";

// ── Fixed orbital layout — no physics simulation ──────────────────────────
const LAYOUT: Record<string, { cx: number; cy: number }> = {
  "russian-history":  { cx: 0.50, cy: 0.42 },
  "world-history":    { cx: 0.25, cy: 0.30 },
  "mathematics":      { cx: 0.73, cy: 0.28 },
  "physics":          { cx: 0.82, cy: 0.52 },
  "chemistry":        { cx: 0.72, cy: 0.70 },
  "biology":          { cx: 0.50, cy: 0.75 },
  "russian-language": { cx: 0.28, cy: 0.70 },
  "literature":       { cx: 0.16, cy: 0.52 },
  "english":          { cx: 0.20, cy: 0.56 },
  "social-studies":   { cx: 0.35, cy: 0.20 },
  "geography":        { cx: 0.62, cy: 0.18 },
  "computer-science": { cx: 0.80, cy: 0.38 },
  "astronomy":        { cx: 0.60, cy: 0.82 },
};

const STATUS_STYLE = {
  beta:   { core: "#6b8fff", glow: "rgba(107,143,255,0.6)", label: "Бета" },
  full:   { core: "#a0c4ff", glow: "rgba(160,196,255,0.7)", label: "Полный" },
  active: { core: "#ffa040", glow: "rgba(255,160,64,0.75)", label: "Изучается" },
  locked: { core: "#3a3a58", glow: "rgba(80,80,140,0.2)",  label: "Скоро" },
};

type Status = "beta" | "full" | "active" | "locked";

function getStatus(id: string): Status {
  if (id === "russian-history") return "full";
  const beta = ["world-history","mathematics","physics","chemistry","biology",
    "russian-language","literature","english","social-studies",
    "geography","computer-science","astronomy"];
  return beta.includes(id) ? "beta" : "locked";
}

function getRadius(status: Status): number {
  return status === "full" ? 28 : status === "beta" ? 20 : 14;
}

export default function KnowledgeGraph({ className = "" }: { className?: string }) {
  const [selected, setSelected] = useState<string | null>("russian-history");

  const nodes = SUBJECTS.map(s => ({
    id: s.id, label: s.title, emoji: s.emoji,
    status: getStatus(s.id),
    cx: LAYOUT[s.id]?.cx ?? 0.5,
    cy: LAYOUT[s.id]?.cy ?? 0.5,
    r: getRadius(getStatus(s.id)),
  }));

  const selectedNode = nodes.find(n => n.id === selected);
  const selectedSubject = SUBJECTS.find(s => s.id === selected);
  const selectedTopics = selected === "russian-history" ? RUSSIAN_HISTORY_TOPICS : null;

  const handleSelect = useCallback((id: string) => {
    setSelected(prev => prev === id ? null : id);
  }, []);

  return (
    <div className={`relative w-full h-full flex flex-col ${className}`}
      style={{ minHeight: 520, background: "#06060f" }}>

      {/* Legend */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-20 pointer-events-none">
        {(Object.entries(STATUS_STYLE) as [Status, typeof STATUS_STYLE[Status]][]).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: val.core, boxShadow: `0 0 6px ${val.core}` }} />
            <span className="text-[10px] text-white/40 font-medium">{val.label}</span>
          </div>
        ))}
      </div>

      {/* Mobile hint */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <p className="text-[10px] text-white/30 md:hidden">Нажми на звезду</p>
      </div>

      {/* SVG Star Map */}
      <div className="flex-1 relative" style={{ minHeight: selected ? 300 : 480 }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"
          className="w-full h-full absolute inset-0" style={{ minHeight: selected ? 300 : 480 }}>
          <defs>
            {nodes.map(n => {
              const s = STATUS_STYLE[n.status];
              return (
                <radialGradient key={n.id} id={`g-${n.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={s.glow} />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </radialGradient>
              );
            })}
          </defs>

          {/* Background stars */}
          {Array.from({ length: 60 }, (_, i) => (
            <circle key={i}
              cx={((i * 137.5) % 100).toFixed(1)}
              cy={((i * 97.3 + 17) % 100).toFixed(1)}
              r="0.25" fill="rgba(255,255,255,0.35)" />
          ))}

          {/* Connection lines from selected to others */}
          {selected && nodes.filter(n => n.id !== selected && n.status !== "locked").map(n => {
            const sel = nodes.find(x => x.id === selected)!;
            return (
              <line key={n.id}
                x1={sel.cx * 100} y1={sel.cy * 100}
                x2={n.cx * 100} y2={n.cy * 100}
                stroke="rgba(107,143,255,0.08)" strokeWidth="0.3" />
            );
          })}

          {/* Subject nodes */}
          {nodes.map(n => {
            const s = STATUS_STYLE[n.status];
            const isSel = n.id === selected;
            const cr = n.r / 100;
            const gr = cr * 3.5;
            return (
              <g key={n.id} style={{ cursor: "pointer" }}
                onClick={() => handleSelect(n.id)}>
                {/* Glow */}
                <circle cx={n.cx * 100} cy={n.cy * 100}
                  r={gr * (isSel ? 1.6 : 1)}
                  fill={`url(#g-${n.id})`} />
                {/* Selection ring */}
                {isSel && (
                  <circle cx={n.cx * 100} cy={n.cy * 100}
                    r={cr * 1.9} fill="none"
                    stroke={s.core} strokeWidth="0.4"
                    strokeDasharray="1.5 1" opacity="0.6" />
                )}
                {/* Core */}
                <circle cx={n.cx * 100} cy={n.cy * 100}
                  r={cr * (isSel ? 1.3 : 1)}
                  fill={s.core}
                  style={{ filter: `drop-shadow(0 0 ${isSel ? 4 : 2}px ${s.core})` }} />
                {/* Label */}
                <text x={n.cx * 100} y={n.cy * 100 + cr + 3.5}
                  textAnchor="middle"
                  fontSize={isSel ? "3.5" : "2.8"}
                  fill={isSel ? "#fff" : s.core}
                  opacity={isSel ? 1 : 0.7}
                  fontWeight={isSel ? "bold" : "normal"}
                  style={{ fontFamily: "system-ui", pointerEvents: "none" }}>
                  {n.label.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail panel */}
      {selectedNode && selectedSubject && (
        <div className="border-t border-white/10"
          style={{ background: "rgba(10,10,24,0.95)", backdropFilter: "blur(12px)" }}>
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedSubject.emoji}</span>
                <div>
                  <h3 className="font-bold text-white">{selectedSubject.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: STATUS_STYLE[selectedNode.status].core + "33",
                        color: STATUS_STYLE[selectedNode.status].core,
                      }}>
                      {STATUS_STYLE[selectedNode.status].label.toUpperCase()}
                    </span>
                    <span className="text-xs text-white/40">{selectedSubject.description}</span>
                  </div>
                </div>
              </div>
              <Link href={`/learn/${selectedNode.id}`}
                className="flex-shrink-0 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors">
                Учиться →
              </Link>
            </div>

            {/* Russian History topics */}
            {selectedTopics && (
              <div className="overflow-x-auto scrollbar-none -mx-4 px-4">
                <div className="flex gap-2 min-w-max pb-2">
                  {selectedTopics.map(period => (
                    <div key={period.id}
                      className="flex-shrink-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 hover:bg-white/10 transition-colors"
                      style={{ minWidth: 110 }}>
                      <div className="text-sm mb-0.5">{period.emoji}</div>
                      <div className="text-xs font-medium text-white/80 leading-tight">{period.title}</div>
                      <div className="text-[10px] text-white/30 mt-0.5">{period.years} · {period.topics.length} тем</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other subjects */}
            {!selectedTopics && (
              <p className="text-xs text-white/30">
                Полная карта тем появится при запуске предмета. Пока можно начать учиться — Mentora адаптируется под тебя.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
