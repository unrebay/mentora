"use client";
import { useEffect, useRef, useState, useCallback } from "react";

// ── colour palette ─────────────────────────────────────────────────────────
const PAL = {
  beta:   { core: "#c8d4ff", glow: "rgba(180,200,255,0.55)", ring: "rgba(200,220,255,0.18)", edge: "rgba(200,215,255,0.10)" },
  full:   { core: "#6b8fff", glow: "rgba(91,119,255,0.70)",  ring: "rgba(69,97,232,0.22)",  edge: "rgba(91,119,255,0.16)" },
  active: { core: "#ffa040", glow: "rgba(249,115,22,0.80)",  ring: "rgba(249,115,22,0.28)", edge: "rgba(249,150,40,0.22)" },
  locked: { core: "#232338", glow: "rgba(80,80,120,0.18)",   ring: "rgba(80,80,120,0.06)",  edge: "rgba(100,100,140,0.05)" },
};

type Status = "beta" | "full" | "active" | "locked";
type Kind   = "subject" | "topic" | "lesson";

interface GNode {
  id: string; label: string;
  kind: Kind; status: Status;
  r: number;
  x: number; y: number;
  vx: number; vy: number;
  phase: number;
}
interface GEdge { a: string; b: string }

const rnd = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

const SUBJECT_DATA: {
  id: string; label: string; status: Status;
  topics: { label: string; activeIdx?: number[] }[];
}[] = [
  {
    id: "russian-history", label: "История России", status: "full",
    topics: [
      { label: "Киевская Русь",   activeIdx: [0, 1] },
      { label: "Монгольское иго", activeIdx: [0] },
      { label: "Иван IV",         activeIdx: [0, 1, 2] },
      { label: "Смутное время",   activeIdx: [0] },
      { label: "Романовы",        activeIdx: [0, 1] },
      { label: "Пётр I",          activeIdx: [0, 1, 2] },
      { label: "Екатерина II",    activeIdx: [0] },
      { label: "XIX век",         activeIdx: [] },
      { label: "1905 год",        activeIdx: [] },
      { label: "Революция",       activeIdx: [0, 1] },
      { label: "СССР",            activeIdx: [0] },
      { label: "Распад СССР",     activeIdx: [] },
    ],
  },
  {
    id: "world-history", label: "История мира", status: "beta",
    topics: [
      { label: "Античность" }, { label: "Средние века" },
      { label: "Ренессанс" },  { label: "Новое время" },
      { label: "XX век" },     { label: "Холодная война" },
    ],
  },
  {
    id: "english", label: "Английский", status: "beta",
    topics: [
      { label: "Грамматика" }, { label: "Лексика" },
      { label: "Говорение" },  { label: "Письмо" },
    ],
  },
  {
    id: "math", label: "Математика", status: "locked",
    topics: [
      { label: "Алгебра" }, { label: "Геометрия" },
      { label: "Анализ" },  { label: "Вероятность" },
    ],
  },
  {
    id: "physics", label: "Физика", status: "locked",
    topics: [
      { label: "Механика" }, { label: "Термодинамика" },
      { label: "Электро" },  { label: "Квантовая" },
    ],
  },
  {
    id: "biology", label: "Биология", status: "locked",
    topics: [
      { label: "Клетка" }, { label: "Генетика" },
      { label: "Экология" }, { label: "Эволюция" },
    ],
  },
  {
    id: "chemistry", label: "Химия", status: "locked",
    topics: [
      { label: "Органика" }, { label: "Неорганика" }, { label: "Реакции" },
    ],
  },
];

function buildGraph(W: number, H: number) {
  const nodes: GNode[] = [];
  const edges: GEdge[] = [];
  const cx = W / 2, cy = H / 2;
  const n = SUBJECT_DATA.length;

  SUBJECT_DATA.forEach((s, si) => {
    const angle = (si / n) * Math.PI * 2 - Math.PI / 2;
    const sR    = Math.min(W, H) * 0.28;
    const baseR = s.status === "full" ? 20 : s.status === "beta" ? 14 : 9;

    nodes.push({
      id: s.id, label: s.label,
      kind: "subject", status: s.status, r: baseR,
      x: cx + Math.cos(angle) * sR + rnd(-12, 12),
      y: cy + Math.sin(angle) * sR + rnd(-12, 12),
      vx: 0, vy: 0, phase: rnd(0, Math.PI * 2),
    });

    s.topics.forEach((t, ti) => {
      const tId     = `${s.id}-t${ti}`;
      const spread  = 0.45;
      const tAngle  = angle + (ti - (s.topics.length - 1) / 2) * spread;
      const tDist   = sR + 68 + rnd(-12, 12);
      const tStatus: Status = s.status === "full"
        ? (t.activeIdx && t.activeIdx.length > 0 ? "active" : "full")
        : s.status;
      const tR = s.status === "locked" ? 4 : 7;

      nodes.push({
        id: tId, label: t.label,
        kind: "topic", status: tStatus, r: tR,
        x: cx + Math.cos(tAngle) * tDist + rnd(-8, 8),
        y: cy + Math.sin(tAngle) * tDist + rnd(-8, 8),
        vx: 0, vy: 0, phase: rnd(0, Math.PI * 2),
      });
      edges.push({ a: s.id, b: tId });

      const lessonCount = s.status === "locked" ? 2 : s.status === "beta" ? 3 : 4;
      for (let li = 0; li < lessonCount; li++) {
        const lId     = `${tId}-l${li}`;
        const lAngle  = tAngle + (li - (lessonCount - 1) / 2) * 0.5;
        const lDist   = tDist + 34 + rnd(-8, 8);
        const lStatus: Status =
          tStatus === "active" && t.activeIdx?.includes(li) ? "active"
          : tStatus === "full" ? "full"
          : tStatus === "beta" ? "beta"
          : "locked";
        nodes.push({
          id: lId, label: "",
          kind: "lesson", status: lStatus, r: 2.5,
          x: cx + Math.cos(lAngle) * lDist + rnd(-6, 6),
          y: cy + Math.sin(lAngle) * lDist + rnd(-6, 6),
          vx: 0, vy: 0, phase: rnd(0, Math.PI * 2),
        });
        edges.push({ a: tId, b: lId });
      }
    });
  });

  edges.push({ a: "russian-history", b: "world-history" });
  edges.push({ a: "physics", b: "math" });
  edges.push({ a: "biology", b: "chemistry" });
  edges.push({ a: "world-history", b: "english" });

  return { nodes, edges };
}

function tick(nodes: GNode[], edges: GEdge[], W: number, H: number) {
  const map = new Map(nodes.map((n) => [n.id, n]));

  for (const n of nodes) {
    n.vx += (W / 2 - n.x) * 0.00012;
    n.vy += (H / 2 - n.y) * 0.00012;
  }

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist2 = dx * dx + dy * dy + 1;
      const dist  = Math.sqrt(dist2);
      const strength = (a.r + b.r + 22) * (a.r + b.r + 22);
      const f = Math.min(0.6, strength / dist2);
      const nx = dx / dist, ny = dy / dist;
      a.vx -= f * nx; a.vy -= f * ny;
      b.vx += f * nx; b.vy += f * ny;
    }
  }

  for (const e of edges) {
    const a = map.get(e.a), b = map.get(e.b);
    if (!a || !b) continue;
    const dx = b.x - a.x, dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const rest = a.r + b.r + 55;
    const stretch = dist - rest;
    const k = 0.0018;
    a.vx += k * stretch * (dx / dist);
    a.vy += k * stretch * (dy / dist);
    b.vx -= k * stretch * (dx / dist);
    b.vy -= k * stretch * (dy / dist);
  }

  const pad = 30;
  for (const n of nodes) {
    n.vx *= 0.86; n.vy *= 0.86;
    n.x  = Math.max(pad, Math.min(W - pad, n.x + n.vx));
    n.y  = Math.max(pad, Math.min(H - pad, n.y + n.vy));
  }
}

function render(
  ctx: CanvasRenderingContext2D,
  nodes: GNode[],
  edges: GEdge[],
  map: Map<string, GNode>,
  hoverId: string | null,
  t: number,
  W: number,
  H: number,
) {
  ctx.clearRect(0, 0, W, H);

  for (const e of edges) {
    const a = map.get(e.a), b = map.get(e.b);
    if (!a || !b) continue;
    const dominant = a.status === "active" || b.status === "active" ? "active"
      : a.status === "full" || b.status === "full" ? "full"
      : a.status === "beta" || b.status === "beta" ? "beta"
      : "locked";
    const isHighlit = a.id === hoverId || b.id === hoverId
      || a.id.startsWith(hoverId ?? "__") || b.id.startsWith(hoverId ?? "__");

    ctx.save();
    if (dominant === "active" || isHighlit) {
      ctx.shadowBlur = 6;
      ctx.shadowColor = PAL[dominant].edge;
      ctx.strokeStyle = PAL[dominant].edge;
      ctx.lineWidth   = isHighlit ? 1.2 : 0.8;
    } else {
      ctx.strokeStyle = PAL[dominant].edge;
      ctx.lineWidth   = 0.4;
    }
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  const sorted = [...nodes].sort((a, b) => a.r - b.r);
  for (const n of sorted) {
    const isHover = n.id === hoverId;
    const isChildHover = hoverId ? n.id.startsWith(hoverId + "-") : false;
    const shimmer = 0.75 + 0.25 * Math.sin(t * 0.0008 + n.phase);
    const pal     = PAL[n.status];
    const glowR   = n.r * (isHover ? 3.8 : isChildHover ? 2.4 : 2.0) * shimmer;
    const coreR   = n.r * (isHover ? 1.18 : isChildHover ? 1.08 : 1.0) * shimmer;

    ctx.save();

    if (n.status !== "locked" || isHover || isChildHover) {
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
      grad.addColorStop(0, pal.glow);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur  = n.kind === "subject" ? 18 * shimmer : n.kind === "topic" ? 10 * shimmer : 5;
    ctx.shadowColor = pal.glow;
    ctx.fillStyle   = pal.core;
    ctx.beginPath();
    ctx.arc(n.x, n.y, coreR, 0, Math.PI * 2);
    ctx.fill();

    if (n.kind === "subject") {
      ctx.strokeStyle = pal.ring;
      ctx.lineWidth   = isHover ? 1.5 : 0.8;
      ctx.shadowBlur  = 10;
      ctx.beginPath();
      ctx.arc(n.x, n.y, coreR + 5 * shimmer, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    if (n.kind === "subject") {
      ctx.save();
      ctx.font = isHover
        ? `bold 13px 'Golos Text', system-ui, sans-serif`
        : `11px 'Golos Text', system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = isHover ? "#ffffff" : pal.core;
      ctx.globalAlpha = isHover ? 1 : 0.65 + 0.35 * shimmer;
      ctx.shadowColor = "rgba(0,0,0,0.95)";
      ctx.shadowBlur  = 10;
      ctx.fillText(n.label, n.x, n.y + coreR + 7);
      ctx.restore();
    }

    if (n.kind === "topic" && hoverId && n.id.startsWith(hoverId + "-t")) {
      ctx.save();
      ctx.font = `10px 'Golos Text', system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = pal.core;
      ctx.globalAlpha = 0.88;
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur  = 6;
      ctx.fillText(n.label, n.x, n.y + coreR + 4);
      ctx.restore();
    }
  }
}

export default function KnowledgeGraph({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<{ nodes: GNode[]; edges: GEdge[]; map: Map<string, GNode> } | null>(null);
  const rafRef    = useRef<number>(0);
  const hoverRef  = useRef<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    const W = parent.clientWidth || 800;
    const H = parent.clientHeight || 520;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const g = buildGraph(W, H);
    stateRef.current = { nodes: g.nodes, edges: g.edges, map: new Map(g.nodes.map((n) => [n.id, n])) };
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    const startTime = performance.now();

    function loop(now: number) {
      const t      = now - startTime;
      const canvas = canvasRef.current;
      const s      = stateRef.current;
      if (!canvas || !s) { rafRef.current = requestAnimationFrame(loop); return; }
      const W = canvas.clientWidth, H = canvas.clientHeight;
      const ctx = canvas.getContext("2d")!;
      const steps = t < 5000 ? 3 : 1;
      for (let i = 0; i < steps; i++) tick(s.nodes, s.edges, W, H);
      render(ctx, s.nodes, s.edges, s.map, hoverRef.current, t, W, H);
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [resize]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const s = stateRef.current;
    if (!canvas || !s) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let closest: GNode | null = null;
    let closestDist = 40;
    for (const n of s.nodes) {
      if (n.kind !== "subject") continue;
      const d = Math.sqrt((n.x - mx) ** 2 + (n.y - my) ** 2);
      if (d < closestDist) { closestDist = d; closest = n; }
    }
    const id = closest?.id ?? null;
    if (id !== hoverRef.current) { hoverRef.current = id; setHoverId(id); }
  }, []);

  const onMouseLeave = useCallback(() => { hoverRef.current = null; setHoverId(null); }, []);

  return (
    <div className={`relative w-full h-full ${className}`}
      style={{ minHeight: 520, background: "#06060f", borderRadius: "inherit" }}>
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10 pointer-events-none">
        {[
          { color: "#6b8fff", label: "Полный предмет" },
          { color: "#c8d4ff", label: "Бета" },
          { color: "#ffa040", label: "Изучается" },
          { color: "#2a2a3e", label: "Скоро" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: l.color, boxShadow: `0 0 6px ${l.color}` }} />
            <span className="text-[10px] text-white/40 font-medium">{l.label}</span>
          </div>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="block w-full h-full"
        style={{ cursor: hoverId ? "pointer" : "default" }}
      />
    </div>
  );
}
