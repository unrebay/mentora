"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { SUBJECTS } from "@/lib/types";
import { RUSSIAN_HISTORY_TOPICS } from "@/lib/topics";

const PAL = {
  active:      { core: "#ffa040", glow: "rgba(255,160,64,0.80)",  ring: "rgba(255,160,64,0.30)",   label: "Изучается" },
  active_full: { core: "#ffa040", glow: "rgba(255,160,64,0.80)",  ring: "rgba(107,143,255,0.45)",  label: "Изучается" },
  full:        { core: "#6b8fff", glow: "rgba(107,143,255,0.70)", ring: "rgba(107,143,255,0.25)",  label: "Полный" },
  beta:        { core: "#c8d4ff", glow: "rgba(200,212,255,0.55)", ring: "rgba(200,212,255,0.20)",  label: "Бета" },
};
type Status = "active" | "active_full" | "full" | "beta";

const LAYOUT: Record<string, { cx: number; cy: number }> = {
  "russian-history":  { cx: 0.46, cy: 0.38 }, // чуть левее центра
  "discovery":        { cx: 0.63, cy: 0.60 }, // правее центра — не перекрывает историю
  "world-history":    { cx: 0.22, cy: 0.27 }, // верх-лево
  "mathematics":      { cx: 0.70, cy: 0.20 }, // верх-право
  "physics":          { cx: 0.82, cy: 0.50 }, // правый
  "chemistry":        { cx: 0.72, cy: 0.72 }, // право-низ
  "biology":          { cx: 0.46, cy: 0.78 }, // низ-центр
  "russian-language": { cx: 0.24, cy: 0.72 }, // лево-низ
  "literature":       { cx: 0.13, cy: 0.50 }, // левый
  "english":          { cx: 0.16, cy: 0.22 }, // верх-лево
  "social-studies":   { cx: 0.37, cy: 0.13 }, // верх-центр
  "geography":        { cx: 0.62, cy: 0.14 }, // верх-право
  "computer-science": { cx: 0.82, cy: 0.32 }, // право-верх
  "astronomy":        { cx: 0.56, cy: 0.86 }, // низ
};

const TOPICS: Record<string, string[]> = {
  "russian-history":  ["Древняя Русь","Монголы","Иван IV","Смута","Романовы","Пётр I","XIX век","Революция","СССР"],
  "world-history":    ["Античность","Средневековье","Ренессанс","Новое время","XX век","Холодная война"],
  "mathematics":      ["Алгебра","Геометрия","Анализ","Вероятность"],
  "physics":          ["Механика","Термодинамика","Электродинамика","Квантовая"],
  "chemistry":        ["Строение атома","Реакции","Органика","Металлы"],
  "biology":          ["Клетка","Генетика","Эволюция","Экология","Анатомия"],
  "russian-language": ["Орфография","Пунктуация","Морфология","Синтаксис"],
  "literature":       ["Классика","XIX век","XX век","Современная","Анализ"],
  "english":          ["Грамматика","Лексика","Говорение","Письмо"],
  "social-studies":   ["Право","Экономика","Политика","Социология"],
  "geography":        ["Физическая","Климат","Страны","Экономика"],
  "computer-science": ["Алгоритмы","Программирование","Сети","БД","ИИ"],
  "astronomy":        ["Солнечная система","Звёзды","Галактики","Космонавтика"],
};

// Nebula clusters — visible soft glow behind groups of related subjects
const NEBULAE = [
  { cx: 0.82, cy: 0.44, rx: 0.26, color: [80, 110, 255],  a: 0.18 }, // Sciences (blue)
  { cx: 0.36, cy: 0.38, rx: 0.24, color: [255, 140, 60],  a: 0.15 }, // History (amber)
  { cx: 0.11, cy: 0.48, rx: 0.18, color: [60, 200, 180],  a: 0.14 }, // Languages/Lit (teal)
  { cx: 0.52, cy: 0.83, rx: 0.22, color: [80, 210, 120],  a: 0.13 }, // Life sciences (green)
  { cx: 0.50, cy: 0.10, rx: 0.20, color: [180, 120, 255], a: 0.14 }, // Social/Geo (purple)
];

interface UserProgress { subject: string; xp_total: number }
interface Props { className?: string; userProgress?: UserProgress[] }

const FULL_SUBJECTS = new Set(["russian-history"]);

function getStatus(id: string, progress: UserProgress[]): Status {
  const hasProgress = !!progress.find(x => x.subject === id && x.xp_total > 0);
  const isFull = FULL_SUBJECTS.has(id);
  if (hasProgress && isFull) return "active_full";
  if (hasProgress) return "active";
  if (isFull) return "full";
  return "beta";
}

// Star radius scales with XP for active subjects
function getRadius(status: Status, xp = 0): number {
  if (status === "beta") return 30;
  if (status === "full") return 42;
  // active / active_full: base 34, grows up to ~56 with XP
  const bonus = Math.min(22, Math.sqrt(Math.max(0, xp)) * 0.7);
  return Math.round(34 + bonus);
}

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

interface GNode {
  id: string; label: string; emoji: string; status: Status;
  x: number; y: number; r: number; xp: number; phase: number;
  topics: { x: number; y: number; label: string; phase: number; baseR: number }[];
}

function buildGraph(W: number, H: number, progress: UserProgress[]): GNode[] {
  return SUBJECTS.map((s, si) => {
    const status = getStatus(s.id, progress);
    const xp = progress.find(x => x.subject === s.id)?.xp_total ?? 0;
    const r = getRadius(status, xp);
    const pos = LAYOUT[s.id] ?? { cx: 0.5, cy: 0.5 };
    const cx = pos.cx * W, cy = pos.cy * H;
    const topicLabels = TOPICS[s.id] ?? [];
    const topics = topicLabels.map((label, i) => {
      const seed1 = si * 100 + i * 7;
      const baseAngle = (i / topicLabels.length) * Math.PI * 2 - Math.PI / 2;
      const angleJitter = (seededRand(seed1) - 0.5) * 1.4;
      const angle = baseAngle + angleJitter;
      const minOrbit = r * 3.0 + 12, maxOrbit = r * 3.0 + (topicLabels.length > 6 ? 38 : 28);
      const orbitR = minOrbit + seededRand(seed1 + 1) * (maxOrbit - minOrbit);
      const baseR = 2.8 + seededRand(seed1 + 2) * 1.6;
      return { x: cx + Math.cos(angle) * orbitR, y: cy + Math.sin(angle) * orbitR,
               label, phase: seededRand(seed1 + 50) * Math.PI * 2, baseR };
    });
    return { id: s.id, label: s.title, emoji: s.emoji, status, x: cx, y: cy, r, xp,
             phase: seededRand(si * 13) * Math.PI * 2, topics };
  });
}

const BG_STARS = Array.from({ length: 160 }, (_, i) => ({
  x: ((i * 137.5) % 1000) / 10, y: ((i * 97.3 + 17) % 1000) / 10,
  r: 0.10 + (i % 5) * 0.07, a: 0.12 + (i % 6) * 0.06,
  twinkle: (i % 3 === 0), phase: (i * 0.73) % (Math.PI * 2),
}));

function drawBg(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  // Nebulae — visible radial glow clouds
  for (const nb of NEBULAE) {
    const cx = nb.cx * W, cy = nb.cy * H, r = nb.rx * Math.min(W, H);
    const [r0, g0, b0] = nb.color;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0,   `rgba(${r0},${g0},${b0},${nb.a})`);
    g.addColorStop(0.45, `rgba(${r0},${g0},${b0},${nb.a * 0.5})`);
    g.addColorStop(1,   `rgba(${r0},${g0},${b0},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }
  // Background stars with subtle twinkle
  for (const s of BG_STARS) {
    const a = s.twinkle ? s.a * (0.7 + 0.3 * Math.sin(t * 0.0008 + s.phase)) : s.a;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath(); ctx.arc((s.x / 100) * W, (s.y / 100) * H, s.r, 0, Math.PI * 2); ctx.fill();
  }
}

function render(
  ctx: CanvasRenderingContext2D, nodes: GNode[],
  activeId: string | null, hovTopicIdx: [string, number] | null,
  t: number, W: number, H: number,
) {
  ctx.clearRect(0, 0, W, H); drawBg(ctx, W, H, t);

  // Connection lines
  for (const n of nodes) {
    const pal = PAL[n.status], isActive = n.id === activeId;
    for (const tp of n.topics) {
      ctx.save();
      ctx.strokeStyle = pal.ring.replace(/[\d.]+\)$/, `${isActive ? 0.22 : 0.06})`);
      ctx.lineWidth = isActive ? 0.6 : 0.3;
      ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(tp.x, tp.y);
      ctx.stroke(); ctx.restore();
    }
  }

  // Topic dots
  for (const n of nodes) {
    const pal = PAL[n.status], isActive = n.id === activeId;
    n.topics.forEach((tp, idx) => {
      const sh = 0.6 + 0.4 * Math.sin(t * 0.0005 + tp.phase);
      const isHovTopic = hovTopicIdx?.[0] === n.id && hovTopicIdx?.[1] === idx;
      const opacity = isHovTopic ? 1 : isActive ? (0.55 + 0.35 * sh) : (0.18 + 0.12 * sh);
      const dotR = tp.baseR * (isHovTopic ? 1.8 : isActive ? (1 + 0.3 * sh) : 0.85);
      ctx.save();
      const g = ctx.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, dotR * 3);
      g.addColorStop(0, pal.glow.replace(/[\d.]+\)$/, `${opacity * 0.7})`));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tp.x, tp.y, dotR * 3, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = isActive ? 8 : 3; ctx.shadowColor = pal.glow;
      ctx.fillStyle = pal.core; ctx.globalAlpha = opacity;
      ctx.beginPath(); ctx.arc(tp.x, tp.y, dotR, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      if (isActive || isHovTopic) {
        const labelAlpha = isHovTopic ? 1 : (0.6 + 0.3 * sh) * opacity;
        ctx.save(); ctx.font = isHovTopic ? 'bold 10px "Golos Text", system-ui' : '9px "Golos Text", system-ui';
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillStyle = pal.core; ctx.globalAlpha = labelAlpha;
        ctx.shadowColor = "rgba(0,0,0,0.95)"; ctx.shadowBlur = 7;
        const dx = tp.x - n.x, dy = tp.y - n.y, len = Math.sqrt(dx*dx+dy*dy)||1;
        const offset = tp.baseR * 2.2 + 10; ctx.fillText(tp.label, tp.x + dx/len*offset, tp.y + dy/len*offset); ctx.restore();
      }
    });
  }

  // Subject stars
  for (const n of [...nodes].sort((a,b)=>a.r-b.r)) {
    const isActive = n.id === activeId, sh = 0.72 + 0.28 * Math.sin(t * 0.0007 + n.phase);
    const pal = PAL[n.status], glowR = n.r*(isActive?3.6:2.2)*sh, coreR = n.r*(isActive?1.25:1)*sh;
    ctx.save();
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
    g.addColorStop(0, pal.glow); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, glowR, 0, Math.PI*2); ctx.fill();
    if (n.status === "active_full") {
      const g2 = ctx.createRadialGradient(n.x, n.y, coreR, n.x, n.y, glowR * 1.6);
      g2.addColorStop(0, "rgba(107,143,255,0.35)"); g2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(n.x, n.y, glowR * 1.6, 0, Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur = isActive ? 24*sh : 14*sh; ctx.shadowColor = pal.glow;
    ctx.fillStyle = pal.core; ctx.beginPath(); ctx.arc(n.x, n.y, coreR, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = pal.ring; ctx.lineWidth = isActive ? 1.5 : 0.8;
    ctx.shadowBlur = isActive ? 12 : 6;
    ctx.shadowColor = n.status === "active_full" ? "rgba(107,143,255,0.8)" : pal.glow;
    ctx.beginPath(); ctx.arc(n.x, n.y, coreR+4*sh, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.font = isActive ? 'bold 13px "Golos Text", system-ui' : '11px "Golos Text", system-ui';
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillStyle = isActive ? "#fff" : pal.core;
    ctx.globalAlpha = isActive ? 1 : (0.65+0.3*sh);
    ctx.shadowColor = "rgba(0,0,0,0.95)"; ctx.shadowBlur = 10;
    ctx.fillText(n.label, n.x, n.y+coreR+7); ctx.restore();
  }
}

export default function KnowledgeGraph({ className = "", userProgress = [] }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const nodesRef     = useRef<GNode[]>([]);
  const rafRef       = useRef<number>(0);
  const activeRef    = useRef<string | null>(null);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hovTopicRef  = useRef<[string, number] | null>(null);
  const clickStart   = useRef({ x: 0, y: 0 });
  const touchStart   = useRef({ x: 0, y: 0, t: 0 });
  const [activeId,    setActiveId]    = useState<string | null>(null);
  const [hovTopicIdx, setHovTopicIdx] = useState<[string, number] | null>(null);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<{ nodeId: string; label: string; x: number; y: number } | null>(null);
  // Popup position in canvas-space pixels
  const [popupAnchor, setPopupAnchor] = useState<{ x: number; y: number; r: number } | null>(null);

  const init = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const p = canvas.parentElement!;
    const W = p.clientWidth || 800, H = p.clientHeight || 600, dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    canvas.getContext("2d")!.scale(dpr, dpr);
    nodesRef.current = buildGraph(W, H, userProgress);
  }, [userProgress]);

  useEffect(() => {
    init(); window.addEventListener("resize", init);
    const t0 = performance.now();
    function loop(now: number) {
      const c = canvasRef.current;
      if (c) render(c.getContext("2d")!, nodesRef.current, activeRef.current, hovTopicRef.current, now - t0, c.clientWidth, c.clientHeight);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", init); };
  }, [init]);

  const activate = useCallback((id: string | null) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (id) { activeRef.current = id; setActiveId(id); }
    else {
      timerRef.current = setTimeout(() => { activeRef.current = null; setActiveId(null); timerRef.current = null; }, 10000);
    }
  }, []);

  const hitSubject = useCallback((mx: number, my: number) => {
    let best: GNode | null = null, bestD = Infinity;
    for (const n of nodesRef.current) {
      const d = Math.hypot(n.x - mx, n.y - my);
      if (d < n.r * 2.2 + 10 && d < bestD) { bestD = d; best = n; }
    }
    return best;
  }, []);

  const hitTopic = useCallback((mx: number, my: number): [GNode, number] | null => {
    for (const n of nodesRef.current) {
      for (let i = 0; i < n.topics.length; i++) {
        const tp = n.topics[i];
        if (Math.hypot(tp.x - mx, tp.y - my) < tp.baseR * 4 + 6) return [n, i];
      }
    }
    return null;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current; if (!c) return;
    const r = c.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    const th = hitTopic(mx, my);
    if (th) {
      hovTopicRef.current = [th[0].id, th[1]]; setHovTopicIdx([th[0].id, th[1]]);
      activate(th[0].id); return;
    }
    hovTopicRef.current = null; setHovTopicIdx(null);
    const s = hitSubject(mx, my);
    activate(s ? s.id : null);
  }, [activate, hitSubject, hitTopic]);

  const onMouseLeave = useCallback(() => {
    hovTopicRef.current = null; setHovTopicIdx(null); activate(null);
  }, [activate]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    clickStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (Math.hypot(e.clientX - clickStart.current.x, e.clientY - clickStart.current.y) > 6) return;
    const c = canvasRef.current; if (!c) return;
    const r = c.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    // Check topic dot first
    const th = hitTopic(mx, my);
    if (th) {
      const [node, idx] = th;
      const tp = node.topics[idx];
      setSelectedTopic({ nodeId: node.id, label: tp.label, x: tp.x, y: tp.y });
      setSelectedId(null); setPopupAnchor(null);
      activate(node.id);
      return;
    }
    setSelectedTopic(null);
    const s = hitSubject(mx, my);
    if (s) {
      setSelectedId(prev => {
        if (prev === s.id) { setPopupAnchor(null); return null; }
        setPopupAnchor({ x: s.x, y: s.y, r: s.r });
        return s.id;
      });
      activate(s.id);
    } else {
      setSelectedId(null); setPopupAnchor(null);
    }
  }, [hitSubject, hitTopic, activate]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const c = canvasRef.current; if (!c) return;
    const r = c.getBoundingClientRect(), mx = e.touches[0].clientX - r.left, my = e.touches[0].clientY - r.top;
    const th = hitTopic(mx, my);
    if (th) { hovTopicRef.current = [th[0].id, th[1]]; setHovTopicIdx([th[0].id, th[1]]); activate(th[0].id); return; }
    hovTopicRef.current = null; setHovTopicIdx(null);
    const s = hitSubject(mx, my); activate(s?.id ?? null);
  }, [activate, hitSubject, hitTopic]);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.hypot(dx, dy) < 10 && Date.now() - touchStart.current.t < 400) {
      const c = canvasRef.current; if (!c) return;
      const r = c.getBoundingClientRect(), mx = e.changedTouches[0].clientX - r.left, my = e.changedTouches[0].clientY - r.top;
      const s = hitSubject(mx, my);
      if (s) {
        setSelectedTopic(null);
      setSelectedId(prev => {
          if (prev === s.id) { setPopupAnchor(null); return null; }
          setPopupAnchor({ x: s.x, y: s.y, r: s.r });
          return s.id;
        });
        activate(s.id);
      }
    }
    activate(null);
  }, [activate, hitSubject]);

  const selNode = nodesRef.current.find(n => n.id === selectedId);
  const selSub  = SUBJECTS.find(s => s.id === selectedId);
  const selTops = selectedId === "russian-history" ? RUSSIAN_HISTORY_TOPICS : null;
  // Simple topic list for non-history subjects
  const selTopicStrings = selectedId && selectedId !== "russian-history" ? (TOPICS[selectedId] ?? []) : [];

  // Topic mini-popup position
  const TOPIC_POP_W = 220;
  let topicPopStyle: React.CSSProperties = { display: "none" };
  if (selectedTopic && canvasRef.current) {
    const W = canvasRef.current.clientWidth, H = canvasRef.current.clientHeight;
    let px = selectedTopic.x - TOPIC_POP_W / 2;
    const py = selectedTopic.y < H * 0.6 ? selectedTopic.y + 18 : selectedTopic.y - 100;
    px = Math.max(8, Math.min(px, W - TOPIC_POP_W - 8));
    topicPopStyle = { display: "block", left: px, top: Math.max(8, py), width: TOPIC_POP_W };
  }
  // Find node for selected topic
  const topicNode = selectedTopic ? nodesRef.current.find(n => n.id === selectedTopic.nodeId) : null;

  // Compute popup CSS position — anchor to star, clamp within canvas
  const POPUP_W = 300, POPUP_H_EST = 180;
  let popupStyle: React.CSSProperties = { display: "none" };
  if (popupAnchor && canvasRef.current) {
    const W = canvasRef.current.clientWidth, H = canvasRef.current.clientHeight;
    let px = popupAnchor.x - POPUP_W / 2;
    // Place above star if enough room, else below
    const aboveY = popupAnchor.y - popupAnchor.r - POPUP_H_EST - 16;
    const belowY = popupAnchor.y + popupAnchor.r + 16;
    let py = aboveY >= 4 ? aboveY : belowY;
    // Clamp horizontally
    px = Math.max(8, Math.min(px, W - POPUP_W - 8));
    py = Math.max(8, Math.min(py, H - POPUP_H_EST - 8));
    popupStyle = { display: "block", left: px, top: py, width: POPUP_W };
  }

  return (
    <div className={`relative w-full h-full ${className}`} style={{ background: "#06060f" }}>
      {/* Legend */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10 pointer-events-none">
        {([
          { key: "active", core: "#ffa040", label: "Изучается" },
          { key: "full",   core: "#6b8fff", label: "Полный" },
          { key: "beta",   core: "#c8d4ff", label: "Бета" },
        ] as { key: string; core: string; label: string }[]).map(item => (
          <div key={item.key} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: item.core, boxShadow: `0 0 5px ${item.core}` }} />
            <span className="text-[10px] text-white/40 font-medium">{item.label}</span>
          </div>
        ))}
      </div>
      <p className="absolute top-4 left-4 z-10 text-[10px] text-white/25 pointer-events-none md:hidden">Нажми на звезду</p>

      {/* Topic mini-popup */}
      {selectedTopic && topicNode && (
        <div className="absolute z-40 rounded-xl overflow-hidden pointer-events-auto"
          style={{
            ...topicPopStyle,
            background: "rgba(10,10,28,0.95)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${PAL[topicNode.status].core}40`,
            boxShadow: `0 4px 24px rgba(0,0,0,0.5)`,
          }}
        >
          <div className="px-3 py-2.5 flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5"
                style={{ color: PAL[topicNode.status].core }}>Тема</p>
              <p className="text-sm font-semibold text-white leading-tight">{selectedTopic.label}</p>
            </div>
            <button onClick={() => setSelectedTopic(null)}
              className="shrink-0 text-white/30 hover:text-white/70 transition-colors text-xs leading-none mt-0.5">✕</button>
          </div>
          <div className="px-3 pb-3">
            <a href={`/learn/${selectedTopic.nodeId}?topic=${encodeURIComponent(selectedTopic.label)}`}
              className="block w-full text-center py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: PAL[topicNode.status].core }}>
              Обсудить эту тему →
            </a>
          </div>
        </div>
      )}

      {/* Floating popup card */}
      {selNode && selSub && (
        <div
          className="absolute z-30 rounded-2xl overflow-hidden pointer-events-auto"
          style={{
            ...popupStyle,
            background: "rgba(10,10,28,0.92)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${PAL[selNode.status].core}30`,
            boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px ${PAL[selNode.status].core}15`,
          }}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl shrink-0">{selSub.emoji}</span>
              <div className="min-w-0">
                <h3 className="font-bold text-white text-sm leading-tight truncate">{selSub.title}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: PAL[selNode.status].core + "25", color: PAL[selNode.status].core }}>
                    {PAL[selNode.status].label}
                  </span>
                  {selNode.xp > 0 && (
                    <span className="text-[10px] text-white/35">{selNode.xp} мент</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => { setSelectedId(null); setPopupAnchor(null); }}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors text-sm leading-none">
              ✕
            </button>
          </div>

          {/* Description */}
          <div className="px-4 py-3">
            <p className="text-xs text-white/40 mb-3 leading-relaxed">{selSub.description}</p>

            {/* Topics preview — all subjects */}
            {(selTops || selTopicStrings.length > 0) && (
              <div className="overflow-x-auto -mx-1" style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255,255,255,0.15) transparent",
              }}>
                <style>{".galaxy-scroll::-webkit-scrollbar{height:4px}.galaxy-scroll::-webkit-scrollbar-track{background:transparent}.galaxy-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:4px}"}</style>
                <div className="galaxy-scroll flex gap-1.5 pb-2 min-w-max px-1" style={{ overflowX: "auto" }}>
                  {selTops
                    ? selTops.map(p => (
                        <a key={p.id}
                          href={`/learn/${selNode.id}?topic=${encodeURIComponent(p.title)}`}
                          className="flex-shrink-0 rounded-xl px-2.5 py-2 text-center transition-all hover:scale-105 hover:bg-white/10 cursor-pointer"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", width: 84 }}>
                          <div className="text-sm mb-1">{p.emoji}</div>
                          <div className="text-[9px] font-medium text-white/75 leading-tight line-clamp-2">{p.title}</div>
                        </a>
                      ))
                    : selTopicStrings.map((label, i) => (
                        <a key={i}
                          href={`/learn/${selNode.id}?topic=${encodeURIComponent(label)}`}
                          className="flex-shrink-0 rounded-xl px-2.5 py-2 text-center transition-all hover:scale-105 hover:bg-white/10 cursor-pointer"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", width: 84 }}>
                          <div className="text-[9px] font-medium text-white/75 leading-tight">{label}</div>
                        </a>
                      ))
                  }
                </div>
              </div>
            )}
            {!selTops && selTopicStrings.length === 0 && (
              <p className="text-[10px] text-white/30 italic">Mentora подстроится с первого сообщения</p>
            )}
          </div>

          {/* CTA */}
          <div className="px-4 pb-4">
            <a href={`/learn/${selNode.id}`}
              className="block w-full text-center py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${PAL[selNode.status].core}, ${PAL[selNode.status].core}cc)` }}>
              {selNode.status === "active" || selNode.status === "active_full" ? "Продолжить →" : "Начать →"}
            </a>
          </div>
        </div>
      )}

      <canvas ref={canvasRef}
        onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
        onMouseDown={onMouseDown} onClick={onClick}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        className="block w-full h-full"
        style={{ cursor: activeId ? "pointer" : "default" }} />
    </div>
  );
}
