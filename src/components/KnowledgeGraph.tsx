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
  "russian-history":  { cx: 0.50, cy: 0.42 }, "world-history":    { cx: 0.24, cy: 0.28 },
  "mathematics":      { cx: 0.73, cy: 0.27 }, "physics":          { cx: 0.84, cy: 0.51 },
  "chemistry":        { cx: 0.73, cy: 0.70 }, "biology":          { cx: 0.50, cy: 0.76 },
  "russian-language": { cx: 0.27, cy: 0.70 }, "literature":       { cx: 0.15, cy: 0.51 },
  "english":          { cx: 0.20, cy: 0.34 }, "social-studies":   { cx: 0.36, cy: 0.18 },
  "geography":        { cx: 0.63, cy: 0.17 }, "computer-science": { cx: 0.82, cy: 0.33 },
  "astronomy":        { cx: 0.62, cy: 0.83 },
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

interface UserProgress { subject: string; xp_total: number }
interface Props { className?: string; userProgress?: UserProgress[] }

const FULL_SUBJECTS = new Set(["russian-history"]);

function getStatus(id: string, progress: UserProgress[]): Status {
  const hasProgress = !!progress.find(x => x.subject === id && x.xp_total > 0);
  const isFull = FULL_SUBJECTS.has(id);
  if (hasProgress && isFull) return "active_full";
  if (hasProgress) return "active";
  if (isFull) return "full";
  return "beta"; // no more locked/Скоро
}
function getRadius(s: Status) { return s==="full"?28:s==="active"||s==="active_full"?26:s==="beta"?20:14; }

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

interface GNode {
  id: string; label: string; emoji: string; status: Status;
  x: number; y: number; r: number; phase: number;
  topics: { x: number; y: number; label: string; phase: number; baseR: number }[];
}

function buildGraph(W: number, H: number, progress: UserProgress[]): GNode[] {
  return SUBJECTS.map((s, si) => {
    const status = getStatus(s.id, progress), r = getRadius(status);
    const pos = LAYOUT[s.id] ?? { cx: 0.5, cy: 0.5 };
    const cx = pos.cx * W, cy = pos.cy * H;
    const topicLabels = TOPICS[s.id] ?? [];
    const topics = topicLabels.map((label, i) => {
      const seed1 = si * 100 + i * 7;
      const baseAngle = (i / topicLabels.length) * Math.PI * 2 - Math.PI / 2;
      const angleJitter = (seededRand(seed1) - 0.5) * 1.4;
      const angle = baseAngle + angleJitter;
      const minOrbit = r * 2.2 + 6, maxOrbit = r * 2.2 + (topicLabels.length > 6 ? 22 : 16);
      const orbitR = minOrbit + seededRand(seed1 + 1) * (maxOrbit - minOrbit);
      const baseR = 1.8 + seededRand(seed1 + 2) * 1.2;
      return { x: cx + Math.cos(angle) * orbitR, y: cy + Math.sin(angle) * orbitR,
               label, phase: seededRand(seed1 + 50) * Math.PI * 2, baseR };
    });
    return { id: s.id, label: s.title, emoji: s.emoji, status, x: cx, y: cy, r,
             phase: seededRand(si * 13) * Math.PI * 2, topics };
  });
}

const BG_STARS = Array.from({ length: 130 }, (_, i) => ({
  x: ((i * 137.5) % 1000) / 10, y: ((i * 97.3 + 17) % 1000) / 10,
  r: 0.12 + (i % 4) * 0.08, a: 0.15 + (i % 5) * 0.07,
}));

function drawBg(ctx: CanvasRenderingContext2D, W: number, H: number) {
  for (const s of BG_STARS) {
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.beginPath(); ctx.arc((s.x / 100) * W, (s.y / 100) * H, s.r, 0, Math.PI * 2); ctx.fill();
  }
}

function render(
  ctx: CanvasRenderingContext2D, nodes: GNode[],
  activeId: string | null, hovTopicIdx: [string, number] | null,
  t: number, W: number, H: number,
) {
  ctx.clearRect(0, 0, W, H); drawBg(ctx, W, H);

  // Connection lines
  for (const n of nodes) {
    // all statuses are visible
    const pal = PAL[n.status], isActive = n.id === activeId;
    for (const tp of n.topics) {
      ctx.save();
      ctx.strokeStyle = pal.ring.replace(/[\d.]+\)$/, `${isActive ? 0.22 : 0.06})`);
      ctx.lineWidth = isActive ? 0.6 : 0.3;
      ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(tp.x, tp.y);
      ctx.stroke(); ctx.restore();
    }
  }

  // Topic dots — always visible
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
        ctx.save(); ctx.font = isHovTopic ? "bold 9px system-ui" : "8.5px system-ui";
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillStyle = pal.core; ctx.globalAlpha = labelAlpha;
        ctx.shadowColor = "rgba(0,0,0,0.95)"; ctx.shadowBlur = 7;
        const dx = tp.x - n.x, dy = tp.y - n.y, len = Math.sqrt(dx*dx+dy*dy)||1;
        ctx.fillText(tp.label, tp.x + dx/len*7, tp.y + dy/len*7); ctx.restore();
      }
    });
  }

  // Subject stars
  for (const n of [...nodes].sort((a,b)=>a.r-b.r)) {
    const isActive = n.id === activeId, sh = 0.72 + 0.28 * Math.sin(t * 0.0007 + n.phase);
    const pal = PAL[n.status], glowR = n.r*(isActive?3.6:2.2)*sh, coreR = n.r*(isActive?1.25:1)*sh;
    ctx.save();
    // Main glow (always orange for active/active_full)
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
    g.addColorStop(0, pal.glow); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, glowR, 0, Math.PI*2); ctx.fill();
    // For active_full: add extra blue outer glow layer
    if (n.status === "active_full") {
      const g2 = ctx.createRadialGradient(n.x, n.y, coreR, n.x, n.y, glowR * 1.6);
      g2.addColorStop(0, "rgba(107,143,255,0.35)"); g2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(n.x, n.y, glowR * 1.6, 0, Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur = isActive ? 24*sh : 14*sh; ctx.shadowColor = pal.glow;
    ctx.fillStyle = pal.core; ctx.beginPath(); ctx.arc(n.x, n.y, coreR, 0, Math.PI*2); ctx.fill();
    // Ring — blue for active_full, otherwise pal.ring
    ctx.strokeStyle = pal.ring; ctx.lineWidth = isActive ? 1.5 : 0.8;
    ctx.shadowBlur = isActive ? 12 : 6;
    ctx.shadowColor = n.status === "active_full" ? "rgba(107,143,255,0.8)" : pal.glow;
    ctx.beginPath(); ctx.arc(n.x, n.y, coreR+4*sh, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.font = isActive ? "bold 12px system-ui" : "10px system-ui";
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
    const s = hitSubject(mx, my);
    if (s) {
      setSelectedId(id => id === s.id ? null : s.id);
      activate(s.id);
    }
  }, [hitSubject, activate]);

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
      if (s) { setSelectedId(id => id === s.id ? null : s.id); activate(s.id); }
    }
    activate(null);
  }, [activate, hitSubject]);

  const selNode = nodesRef.current.find(n => n.id === selectedId);
  const selSub  = SUBJECTS.find(s => s.id === selectedId);
  const selTops = selectedId === "russian-history" ? RUSSIAN_HISTORY_TOPICS : null;

  return (
    <div className={`relative w-full h-full ${className}`} style={{ background: "#06060f" }}>
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10 pointer-events-none">
        {([
          { key: "active",      core: "#ffa040", label: "Изучается" },
          { key: "full",        core: "#6b8fff", label: "Полный" },
          { key: "beta",        core: "#c8d4ff", label: "Бета" },
        ] as { key: string; core: string; label: string }[]).map(item => (
          <div key={item.key} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: item.core, boxShadow: `0 0 5px ${item.core}` }} />
            <span className="text-[10px] text-white/40 font-medium">{item.label}</span>
          </div>
        ))}
      </div>
      <p className="absolute top-4 left-4 z-10 text-[10px] text-white/25 pointer-events-none md:hidden">Нажми на звезду</p>

      {selNode && selSub && (
        <div className="absolute bottom-0 left-0 right-0 z-20" style={{ background: "rgba(6,6,15,0.96)", backdropFilter: "blur(16px)" }}>
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selSub.emoji}</span>
                <div>
                  <h3 className="font-bold text-white text-base">{selSub.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: PAL[selNode.status].core + "30", color: PAL[selNode.status].core }}>
                      {PAL[selNode.status].label.toUpperCase()}
                    </span>
                    <span className="text-xs text-white/40">{selSub.description}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={`/learn/${selNode.id}`}
                  className="px-3 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors">
                  Начать →
                </a>
                <button onClick={() => setSelectedId(null)}
                  className="px-2 py-2 text-white/40 hover:text-white/70 transition-colors text-lg leading-none">✕</button>
              </div>
            </div>
            {selTops ? (
              <div className="overflow-x-auto -mx-4 px-4">
                <div className="flex gap-2 pb-2 min-w-max">
                  {selTops.map(p => (
                    <div key={p.id} className="flex-shrink-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 hover:bg-white/10 transition-colors" style={{ width: 115 }}>
                      <div className="text-sm mb-1">{p.emoji}</div>
                      <div className="text-xs font-medium text-white/80 leading-tight line-clamp-2">{p.title}</div>
                      <div className="text-[10px] text-white/30 mt-1">{p.years} · {p.topics.length} тем</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-white/30">
                {selNode.status === "active" ? "Ты уже изучаешь этот предмет." : "Нажми «Начать» — Mentora подстроится с первого сообщения."}
              </p>
            )}
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
