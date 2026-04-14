"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { SUBJECTS } from "@/lib/types";
import { RUSSIAN_HISTORY_TOPICS } from "@/lib/topics";

const LAYOUT: Record<string, { cx: number; cy: number }> = {
  "russian-history":  { cx: 0.50, cy: 0.40 },
  "world-history":    { cx: 0.24, cy: 0.28 },
  "mathematics":      { cx: 0.73, cy: 0.27 },
  "physics":          { cx: 0.84, cy: 0.50 },
  "chemistry":        { cx: 0.74, cy: 0.68 },
  "biology":          { cx: 0.52, cy: 0.76 },
  "russian-language": { cx: 0.27, cy: 0.68 },
  "literature":       { cx: 0.14, cy: 0.50 },
  "english":          { cx: 0.18, cy: 0.35 },
  "social-studies":   { cx: 0.37, cy: 0.18 },
  "geography":        { cx: 0.63, cy: 0.16 },
  "computer-science": { cx: 0.82, cy: 0.32 },
  "astronomy":        { cx: 0.62, cy: 0.82 },
};

type Status = "active" | "full" | "beta" | "locked";
const STATUS: Record<Status, { core: string; glow: string; label: string }> = {
  active: { core: "#ffa040", glow: "rgba(255,160,64,0.75)", label: "Изучается" },
  full:   { core: "#a0c4ff", glow: "rgba(160,196,255,0.70)", label: "Полный" },
  beta:   { core: "#6b8fff", glow: "rgba(107,143,255,0.60)", label: "Бета" },
  locked: { core: "#3a3a58", glow: "rgba(80,80,140,0.20)",  label: "Скоро" },
};

interface UserProgress { subject: string; xp_total: number }
interface Props { className?: string; userProgress?: UserProgress[] }

function getStatus(id: string, progress: UserProgress[]): Status {
  if (progress.find(x => x.subject === id && x.xp_total > 0)) return "active";
  if (id === "russian-history") return "full";
  return ["world-history","mathematics","physics","chemistry","biology",
    "russian-language","literature","english","social-studies",
    "geography","computer-science","astronomy"].includes(id) ? "beta" : "locked";
}
function getRadius(s: Status) {
  return s === "full" ? 3.0 : s === "active" ? 2.8 : s === "beta" ? 2.1 : 1.4;
}

export default function KnowledgeGraph({ className = "", userProgress = [] }: Props) {
  const [selected, setSelected] = useState<string | null>("russian-history");
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastDist = useRef<number | null>(null);
  const clickPos = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const vbSize = 100 / zoom;
  const vbX = 50 - vbSize / 2 - pan.x;
  const vbY = 50 - vbSize / 2 - pan.y;
  const viewBox = `${vbX.toFixed(2)} ${vbY.toFixed(2)} ${vbSize.toFixed(2)} ${vbSize.toFixed(2)}`;

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = vbSize / rect.width;
    setPan(p => ({
      x: p.x + (e.clientX - lastPos.current.x) * scale,
      y: p.y + (e.clientY - lastPos.current.y) * scale,
    }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [vbSize]);
  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(4, Math.max(0.5, z * (e.deltaY < 0 ? 1.12 : 0.89))));
  }, []);
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastDist.current = Math.sqrt(dx*dx + dy*dy);
    }
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging.current && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const scale = vbSize / rect.width;
      setPan(p => ({
        x: p.x + (e.touches[0].clientX - lastPos.current.x) * scale,
        y: p.y + (e.touches[0].clientY - lastPos.current.y) * scale,
      }));
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lastDist.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.sqrt(dx*dx+dy*dy);
      setZoom(z => Math.min(4, Math.max(0.5, z * d / lastDist.current!)));
      lastDist.current = d;
    }
  }, [vbSize]);
  const onTouchEnd = useCallback(() => { isDragging.current = false; lastDist.current = null; }, []);

  const onNodeDown = useCallback((e: React.MouseEvent) => { clickPos.current = { x: e.clientX, y: e.clientY }; }, []);
  const onNodeClick = useCallback((id: string, e: React.MouseEvent) => {
    if (Math.hypot(e.clientX - clickPos.current.x, e.clientY - clickPos.current.y) > 6) return;
    setSelected(p => p === id ? null : id);
  }, []);

  const nodes = SUBJECTS.map(s => ({
    id: s.id, label: s.title, emoji: s.emoji,
    status: getStatus(s.id, userProgress),
    cx: (LAYOUT[s.id]?.cx ?? 0.5) * 100,
    cy: (LAYOUT[s.id]?.cy ?? 0.5) * 100,
    r: getRadius(getStatus(s.id, userProgress)),
  }));

  const selNode = nodes.find(n => n.id === selected);
  const selSubject = SUBJECTS.find(s => s.id === selected);
  const selTopics = selected === "russian-history" ? RUSSIAN_HISTORY_TOPICS : null;

  return (
    <div className={`relative w-full h-full flex flex-col select-none ${className}`}
      style={{ background: "#06060f" }}>

      {/* Legend + reset */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
        {(Object.entries(STATUS) as [Status, {core:string;glow:string;label:string}][]).map(([k,v]) => (
          <div key={k} className="flex items-center gap-1.5 pointer-events-none">
            <span className="w-2 h-2 rounded-full" style={{ background: v.core, boxShadow: `0 0 5px ${v.core}` }} />
            <span className="text-[10px] text-white/40">{v.label}</span>
          </div>
        ))}
        <button onClick={() => { setPan({x:0,y:0}); setZoom(1); }}
          className="mt-1 text-[10px] text-white/30 hover:text-white/60 transition-colors text-left">
          ↺ сброс
        </button>
      </div>

      {/* Mobile hint */}
      <p className="absolute top-3 left-3 z-20 text-[10px] text-white/25 pointer-events-none md:hidden">
        Тяни · Нажми на звезду
      </p>

      {/* SVG */}
      <div className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ minHeight: selNode ? 280 : 460 }}>
        <svg ref={svgRef} viewBox={viewBox} preserveAspectRatio="xMidYMid meet"
          className="w-full h-full absolute inset-0 touch-none"
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <defs>
            {nodes.map(n => (
              <radialGradient key={n.id} id={`g-${n.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={STATUS[n.status].glow} />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
            ))}
          </defs>
          {Array.from({length:80},(_,i) => (
            <circle key={i}
              cx={((i*137.5)%100).toFixed(2)} cy={((i*97.3+17)%100).toFixed(2)}
              r="0.22" fill={`rgba(255,255,255,${0.15+(i%4)*0.08})`} />
          ))}
          {selected && nodes.filter(n=>n.id!==selected&&n.status!=="locked").map(n => {
            const s=nodes.find(x=>x.id===selected)!;
            return <line key={n.id} x1={s.cx} y1={s.cy} x2={n.cx} y2={n.cy}
              stroke="rgba(107,143,255,0.07)" strokeWidth="0.4"/>;
          })}
          {nodes.map(n => {
            const st=STATUS[n.status]; const isSel=n.id===selected;
            return (
              <g key={n.id} style={{cursor:"pointer"}}
                onMouseDown={onNodeDown} onClick={e=>onNodeClick(n.id,e)}>
                <circle cx={n.cx} cy={n.cy} r={n.r*3.5*(isSel?1.7:1)} fill={`url(#g-${n.id})`}/>
                {isSel && <circle cx={n.cx} cy={n.cy} r={n.r*2.0}
                  fill="none" stroke={st.core} strokeWidth="0.4" strokeDasharray="1.5 1" opacity="0.55"/>}
                <circle cx={n.cx} cy={n.cy} r={n.r*(isSel?1.35:1)} fill={st.core}
                  style={{filter:`drop-shadow(0 0 ${isSel?5:2.5}px ${st.core})`}}/>
                <text x={n.cx} y={n.cy+n.r+3.8} textAnchor="middle"
                  fontSize={isSel?"3.6":"2.8"} fill={isSel?"#fff":st.core}
                  opacity={isSel?1:0.65} fontWeight={isSel?"bold":"normal"}
                  style={{fontFamily:"system-ui",pointerEvents:"none"}}>
                  {n.label.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail panel */}
      {selNode && selSubject && (
        <div className="border-t border-white/10 flex-shrink-0"
          style={{background:"rgba(8,8,20,0.97)",backdropFilter:"blur(16px)"}}>
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selSubject.emoji}</span>
                <div>
                  <h3 className="font-bold text-white leading-tight">{selSubject.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{background:STATUS[selNode.status].core+"30",color:STATUS[selNode.status].core}}>
                      {STATUS[selNode.status].label.toUpperCase()}
                    </span>
                    <span className="text-xs text-white/40">{selSubject.description}</span>
                  </div>
                </div>
              </div>
              <Link href={`/learn/${selNode.id}`}
                className="flex-shrink-0 px-3 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors">
                Учиться →
              </Link>
            </div>
            {selTopics ? (
              <div className="overflow-x-auto scrollbar-none -mx-4 px-4">
                <div className="flex gap-2 pb-2" style={{width:"max-content"}}>
                  {selTopics.map(p => (
                    <div key={p.id} className="flex-shrink-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 hover:bg-white/10 transition-colors" style={{width:120}}>
                      <div className="text-base mb-1">{p.emoji}</div>
                      <div className="text-xs font-medium text-white/80 leading-tight line-clamp-2">{p.title}</div>
                      <div className="text-[10px] text-white/30 mt-1">{p.years} · {p.topics.length} тем</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-white/30">
                {selNode.status==="active"
                  ? "Ты уже изучаешь этот предмет. Продолжай!"
                  : "Начни учиться — Mentora адаптируется под тебя с первого сообщения."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
