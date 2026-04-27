"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { SUBJECTS } from "@/lib/types";
import { RUSSIAN_HISTORY_TOPICS } from "@/lib/topics";

const PAL = {
  active:      { core: "#ffa040", glow: "rgba(255,160,64,0.85)",  ring: "rgba(255,160,64,0.35)",   label: "Изучается" },
  active_full: { core: "#ffa040", glow: "rgba(255,160,64,0.85)",  ring: "rgba(107,143,255,0.45)",  label: "Изучается" },
  full:        { core: "#6b8fff", glow: "rgba(107,143,255,0.75)", ring: "rgba(107,143,255,0.30)",  label: "Полный" },
  beta:        { core: "#c8d4ff", glow: "rgba(200,212,255,0.60)", ring: "rgba(200,212,255,0.20)",  label: "Бета" },
};
type Status = "active" | "active_full" | "full" | "beta";

// More chaotic, galaxy-like positions — less circular, more scattered
const LAYOUT: Record<string, { cx: number; cy: number }> = {
  "russian-history":  { cx: 0.44, cy: 0.41 },  // center anchor
  "discovery":        { cx: 0.65, cy: 0.60 },
  "world-history":    { cx: 0.18, cy: 0.31 },
  "mathematics":      { cx: 0.74, cy: 0.17 },
  "physics":          { cx: 0.89, cy: 0.50 },
  "chemistry":        { cx: 0.71, cy: 0.76 },
  "biology":          { cx: 0.43, cy: 0.85 },
  "russian-language": { cx: 0.21, cy: 0.74 },
  "literature":       { cx: 0.07, cy: 0.54 },
  "english":          { cx: 0.11, cy: 0.18 },
  "social-studies":   { cx: 0.36, cy: 0.06 },
  "geography":        { cx: 0.63, cy: 0.10 },
  "computer-science": { cx: 0.87, cy: 0.30 },
  "astronomy":        { cx: 0.53, cy: 0.91 },
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

const NEBULAE = [
  { cx: 0.82, cy: 0.44, rx: 0.26, color: [80, 110, 255],  a: 0.18 },
  { cx: 0.36, cy: 0.38, rx: 0.24, color: [255, 140, 60],  a: 0.15 },
  { cx: 0.11, cy: 0.48, rx: 0.18, color: [60, 200, 180],  a: 0.14 },
  { cx: 0.52, cy: 0.83, rx: 0.22, color: [80, 210, 120],  a: 0.13 },
  { cx: 0.50, cy: 0.10, rx: 0.20, color: [180, 120, 255], a: 0.14 },
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

function getRadius(status: Status, xp = 0): number {
  if (status === "beta") return 5;
  if (status === "full") return 8;
  const bonus = Math.min(4, Math.sqrt(Math.max(0, xp)) * 0.15);
  return Math.round(6 + bonus);
}

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ── Zoom config ───────────────────────────────────────────────────────────────
const ZOOM_MAX = 3.2;
const ZOOM_MS  = 800;

function easeInOut(t: number): number {
  return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
}

interface ZoomState {
  id:       string | null;
  cx:       number;
  cy:       number;
  phase:    "idle" | "in" | "done" | "out";
  startT:   number;
  progress: number;
}

interface TopicOrbit {
  label:      string;
  baseAngle:  number;
  orbitR:     number;
  speed:      number;
  phase:      number;
  baseR:      number;
}

interface Drift {
  amplitude: number;   // px
  speed:     number;   // rad/ms
  angle:     number;   // phase X
  phaseY:    number;   // phase Y (different to create elliptical path)
}

interface GNode {
  id: string; label: string; emoji: string; status: Status;
  x: number; y: number; r: number; xp: number; phase: number;
  topics: TopicOrbit[];
  drift: Drift;
}

function buildGraph(W: number, H: number, progress: UserProgress[]): GNode[] {
  return SUBJECTS.map((s, si) => {
    const status = getStatus(s.id, progress);
    const xp = progress.find(x => x.subject === s.id)?.xp_total ?? 0;
    const r = getRadius(status, xp);
    const pos = LAYOUT[s.id] ?? { cx: 0.5, cy: 0.5 };
    const cx = pos.cx * W, cy = pos.cy * H;
    const topicLabels = TOPICS[s.id] ?? [];

    const topics: TopicOrbit[] = topicLabels.map((label, i) => {
      const seed = si * 100 + i * 7;
      const baseAngle = (i / topicLabels.length) * Math.PI * 2 - Math.PI / 2;
      const minOrbit = Math.max(r * 5 + 14, topicLabels.length * 8);
      const orbitR = minOrbit + seededRand(seed + 1) * 18;
      const speed = (seededRand(seed + 3) * 0.3 + 0.15) * (seededRand(seed + 4) > 0.5 ? 1 : -1) * 0.00005;
      const baseR = 1.1 + seededRand(seed + 2) * 0.7;
      return { label, baseAngle, orbitR, speed, phase: seededRand(seed + 50) * Math.PI * 2, baseR };
    });

    // Drift: gentle Lissajous float
    const ds = si * 31 + 7;
    const drift: Drift = {
      amplitude: 5 + seededRand(ds) * 8,                        // 5–13px
      speed:     (0.05 + seededRand(ds + 1) * 0.07) * 0.0001,  // very slow
      angle:     seededRand(ds + 2) * Math.PI * 2,
      phaseY:    seededRand(ds + 3) * Math.PI * 2,
    };

    return { id: s.id, label: s.title, emoji: s.emoji, status, x: cx, y: cy, r, xp,
             phase: seededRand(si * 13) * Math.PI * 2, topics, drift };
  });
}

// Compute current drifted position for a node
function driftedPos(n: GNode, t: number, frozen?: { cx: number; cy: number }) {
  if (frozen) return frozen;
  return {
    cx: n.x + n.drift.amplitude * Math.sin(t * n.drift.speed + n.drift.angle),
    cy: n.y + n.drift.amplitude * Math.cos(t * n.drift.speed * 0.73 + n.drift.phaseY),
  };
}

const BG_STARS = Array.from({ length: 200 }, (_, i) => ({
  x: ((i * 137.5) % 1000) / 10, y: ((i * 97.3 + 17) % 1000) / 10,
  r: 0.08 + (i % 5) * 0.06, a: 0.10 + (i % 7) * 0.05,
  twinkle: (i % 3 === 0), phase: (i * 0.73) % (Math.PI * 2),
}));

function drawBg(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  for (const nb of NEBULAE) {
    const cx = nb.cx * W, cy = nb.cy * H, r = nb.rx * Math.min(W, H);
    const [r0, g0, b0] = nb.color;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0,    `rgba(${r0},${g0},${b0},${nb.a})`);
    g.addColorStop(0.45, `rgba(${r0},${g0},${b0},${nb.a * 0.5})`);
    g.addColorStop(1,    `rgba(${r0},${g0},${b0},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }
  for (const s of BG_STARS) {
    const a = s.twinkle ? s.a * (0.7 + 0.3 * Math.sin(t * 0.0008 + s.phase)) : s.a;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath(); ctx.arc((s.x / 100) * W, (s.y / 100) * H, s.r, 0, Math.PI * 2); ctx.fill();
  }
}

function render(
  ctx: CanvasRenderingContext2D,
  nodes: GNode[],
  activeId: string | null,
  t: number, W: number, H: number,
  zoom: ZoomState,
) {
  ctx.clearRect(0, 0, W, H);

  const scale = 1 + (ZOOM_MAX - 1) * zoom.progress;
  const tx = zoom.progress * (W / 2 - zoom.cx * ZOOM_MAX);
  const ty = zoom.progress * (H / 2 - zoom.cy * ZOOM_MAX);

  ctx.save();
  if (zoom.progress > 0.001) {
    ctx.translate(tx, ty);
    ctx.scale(scale, scale);
  }

  drawBg(ctx, W, H, t);

  // ── Topic orbit dots ──────────────────────────────────────────────────────
  for (const n of nodes) {
    const pal = PAL[n.status];
    const isActive = n.id === activeId;
    const isZoomTarget = zoom.id === n.id && zoom.phase !== "idle";
    const isZoomDone   = zoom.id === n.id && zoom.phase === "done";
    const isAnyZoom    = zoom.phase !== "idle";

    // Compute drifted position (freeze for zoom target to match zoom center)
    const pos = driftedPos(n, t, isZoomTarget ? { cx: zoom.cx, cy: zoom.cy } : undefined);

    // Fade all non-target dots when zooming in on another star
    let nodeAlpha = 1;
    if (isAnyZoom && zoom.id !== n.id) {
      nodeAlpha = Math.max(0, 1 - zoom.progress * 0.85);
    }
    if (nodeAlpha < 0.01) continue;

    // Treat zoomed-done star as "active" for topic visibility
    const showTopicLabels = isActive || isZoomDone;
    const topicBaseOp = isZoomDone ? 0.75 : (isActive ? 0.65 : 0.14);

    n.topics.forEach((tp) => {
      const angle = tp.baseAngle + tp.speed * t;
      const tpx = pos.cx + Math.cos(angle) * tp.orbitR;
      const tpy = pos.cy + Math.sin(angle) * tp.orbitR;

      const pulse = 0.7 + 0.3 * Math.sin(t * 0.001 + tp.phase);
      const opacity = topicBaseOp * pulse * nodeAlpha;

      // Glow halo
      const gR = tp.baseR * (showTopicLabels ? 5.5 : 3.5);
      const grad = ctx.createRadialGradient(tpx, tpy, 0, tpx, tpy, gR);
      grad.addColorStop(0, pal.glow.replace(/[\d.]+\)$/, `${opacity * 0.55})`));
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(tpx, tpy, gR, 0, Math.PI * 2); ctx.fill();

      // Core dot
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.shadowBlur = showTopicLabels ? 8 : 3;
      ctx.shadowColor = pal.glow;
      ctx.fillStyle = pal.core;
      ctx.beginPath(); ctx.arc(tpx, tpy, tp.baseR * (1 + 0.2 * pulse), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Label — visible on hover AND when zoomed in
      if (showTopicLabels) {
        ctx.save();
        ctx.globalAlpha = opacity * 0.92;
        ctx.font = `${isZoomDone ? 10 : 9}px "Golos Text", system-ui`;
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "rgba(0,0,0,0.95)"; ctx.shadowBlur = 10;
        ctx.fillText(tp.label, tpx, tpy + tp.baseR + 3);
        ctx.restore();
      }
    });
  }

  // ── Subject stars ─────────────────────────────────────────────────────────
  for (const n of [...nodes].sort((a, b) => a.r - b.r)) {
    const isActive = n.id === activeId;
    const sh = 0.72 + 0.28 * Math.sin(t * 0.0007 + n.phase);
    const pal = PAL[n.status];
    const isZoomTarget = zoom.id === n.id && zoom.phase !== "idle";

    // Compute drifted position
    const pos = driftedPos(n, t, isZoomTarget ? { cx: zoom.cx, cy: zoom.cy } : undefined);

    // Fade non-target stars during zoom
    let globalAlpha = 1;
    if (zoom.phase !== "idle" && zoom.id !== n.id) {
      globalAlpha = 1 - zoom.progress * 0.7;
    }
    if (globalAlpha < 0.01) continue;
    ctx.save(); ctx.globalAlpha = globalAlpha;

    const glowR = n.r * (isActive ? 5 : 3.5) * sh;
    const coreR = n.r * (isActive ? 1.3 : 1) * sh;
    const g = ctx.createRadialGradient(pos.cx, pos.cy, 0, pos.cx, pos.cy, glowR);
    g.addColorStop(0, pal.glow); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pos.cx, pos.cy, glowR, 0, Math.PI * 2); ctx.fill();

    if (n.status === "active_full") {
      const g2 = ctx.createRadialGradient(pos.cx, pos.cy, coreR, pos.cx, pos.cy, glowR * 1.8);
      g2.addColorStop(0, "rgba(107,143,255,0.30)"); g2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(pos.cx, pos.cy, glowR * 1.8, 0, Math.PI * 2); ctx.fill();
    }

    ctx.shadowBlur = isActive ? 18 * sh : 10 * sh; ctx.shadowColor = pal.glow;
    ctx.fillStyle = pal.core;
    ctx.beginPath(); ctx.arc(pos.cx, pos.cy, coreR, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = pal.ring; ctx.lineWidth = isActive ? 1.2 : 0.6;
    ctx.shadowBlur = isActive ? 8 : 4;
    ctx.beginPath(); ctx.arc(pos.cx, pos.cy, coreR + 3 * sh, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // Label
    if (globalAlpha > 0.08) {
      ctx.save(); ctx.globalAlpha = globalAlpha;
      ctx.font = isActive ? 'bold 12px "Golos Text", system-ui' : '500 10px "Golos Text", system-ui';
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillStyle = isActive ? "#fff" : pal.core;
      ctx.globalAlpha *= isActive ? 1 : (0.65 + 0.3 * sh);
      ctx.shadowColor = "rgba(0,0,0,0.97)"; ctx.shadowBlur = 8;
      ctx.fillText(n.label, pos.cx, pos.cy + coreR + 5);
      ctx.restore();
    }
  }

  ctx.restore(); // end zoom transform
}

export default function KnowledgeGraph({ className = "", userProgress = [] }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const nodesRef   = useRef<GNode[]>([]);
  const rafRef     = useRef<number>(0);
  const activeRef  = useRef<string | null>(null);
  const clickStart = useRef({ x: 0, y: 0 });
  const touchStart = useRef({ x: 0, y: 0, t: 0 });
  const t0Ref      = useRef<number>(0);
  const zoomRef    = useRef<ZoomState>({ id: null, cx: 0, cy: 0, phase: "idle", startT: 0, progress: 0 });

  const [activeId,     setActiveId]     = useState<string | null>(null);
  const [showPanel,    setShowPanel]    = useState(false);
  const [panelId,      setPanelId]      = useState<string | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [isZoomed,     setIsZoomed]     = useState(false);

  // ── Glass hint pill ───────────────────────────────────────────────────────
  const [hintMounted,  setHintMounted]  = useState(false);
  const [hintVisible,  setHintVisible]  = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastInteractionRef = useRef<number>(Date.now());

  const showHintPill = useCallback(() => {
    setHintMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setHintVisible(true)));
  }, []);

  const hideHintPill = useCallback(() => {
    setHintVisible(false);
    setTimeout(() => setHintMounted(false), 400);
  }, []);

  const scheduleHint = useCallback(() => {
    clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(showHintPill, 5000);
  }, [showHintPill]);

  const resetHint = useCallback(() => {
    lastInteractionRef.current = Date.now();
    hideHintPill();
    scheduleHint();
  }, [hideHintPill, scheduleHint]);

  useEffect(() => {
    scheduleHint();
    return () => clearTimeout(hintTimerRef.current);
  }, [scheduleHint]);

  // ── Canvas init ───────────────────────────────────────────────────────────
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
    init();
    window.addEventListener("resize", init);
    t0Ref.current = performance.now();

    function loop(now: number) {
      const zoom = zoomRef.current;
      const elapsed = now - zoom.startT;

      if (zoom.phase === "in" || zoom.phase === "out") {
        const raw = Math.min(1, elapsed / ZOOM_MS);
        zoom.progress = zoom.phase === "in" ? easeInOut(raw) : 1 - easeInOut(raw);

        if (raw >= 1) {
          if (zoom.phase === "in") {
            zoom.phase = "done";
            zoom.progress = 1;
            setShowPanel(true);
            setIsZoomed(true);
            setTimeout(() => setPanelVisible(true), 20);
          } else {
            zoom.phase = "idle";
            zoom.progress = 0;
            zoom.id = null;
            setShowPanel(false);
            setPanelVisible(false);
            setPanelId(null);
            setIsZoomed(false);
          }
        }
      }

      const c = canvasRef.current;
      if (c) render(
        c.getContext("2d")!, nodesRef.current, activeRef.current,
        now - t0Ref.current, c.clientWidth, c.clientHeight, zoom,
      );
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", init); };
  }, [init]);

  // Get drifted coords for a node at current time (for hit-testing)
  const getNodePos = useCallback((n: GNode) => {
    const t = performance.now() - t0Ref.current;
    const zoom = zoomRef.current;
    if (zoom.id === n.id && zoom.phase !== "idle") {
      return { cx: zoom.cx, cy: zoom.cy };
    }
    return driftedPos(n, t);
  }, []);

  const startZoomIn = useCallback((id: string) => {
    const node = nodesRef.current.find(n => n.id === id);
    if (!node) return;
    resetHint();
    // Capture current drifted position as zoom center
    const pos = getNodePos(node);
    zoomRef.current = { id, cx: pos.cx, cy: pos.cy, phase: "in", startT: performance.now(), progress: 0 };
    setPanelId(id);
    setShowPanel(false);
    setPanelVisible(false);
  }, [resetHint, getNodePos]);

  const startZoomOut = useCallback(() => {
    const zoom = zoomRef.current;
    if (zoom.phase === "idle") return;
    resetHint();
    setPanelVisible(false);
    setTimeout(() => {
      zoomRef.current = { ...zoom, phase: "out", startT: performance.now(), progress: zoom.progress };
      setShowPanel(false);
    }, 180);
  }, [resetHint]);

  const hitSubject = useCallback((mx: number, my: number) => {
    let best: GNode | null = null, bestD = Infinity;
    for (const n of nodesRef.current) {
      const pos = getNodePos(n);
      const d = Math.hypot(pos.cx - mx, pos.cy - my);
      const hitR = n.r * 4 + 12;
      if (d < hitR && d < bestD) { bestD = d; best = n; }
    }
    return best;
  }, [getNodePos]);

  // Convert screen → canvas-space accounting for zoom
  const toCanvasSpace = useCallback((screenX: number, screenY: number): [number, number] => {
    const c = canvasRef.current; if (!c) return [screenX, screenY];
    const rect = c.getBoundingClientRect();
    const mx = screenX - rect.left, my = screenY - rect.top;
    const zoom = zoomRef.current;
    if (zoom.progress < 0.001) return [mx, my];
    const scale = 1 + (ZOOM_MAX - 1) * zoom.progress;
    const tx = zoom.progress * (c.clientWidth / 2 - zoom.cx * ZOOM_MAX);
    const ty = zoom.progress * (c.clientHeight / 2 - zoom.cy * ZOOM_MAX);
    return [(mx - tx) / scale, (my - ty) / scale];
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (zoomRef.current.phase === "done") return;
    const [cx, cy] = toCanvasSpace(e.clientX, e.clientY);
    const s = hitSubject(cx, cy);
    activeRef.current = s?.id ?? null;
    setActiveId(s?.id ?? null);
  }, [hitSubject, toCanvasSpace]);

  const onMouseLeave = useCallback(() => {
    activeRef.current = null; setActiveId(null);
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    clickStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (Math.hypot(e.clientX - clickStart.current.x, e.clientY - clickStart.current.y) > 10) return;
    const zoom = zoomRef.current;
    if (zoom.phase === "done") { startZoomOut(); return; }
    if (zoom.phase === "in" || zoom.phase === "out") return;
    const [cx, cy] = toCanvasSpace(e.clientX, e.clientY);
    const s = hitSubject(cx, cy);
    if (s) {
      startZoomIn(s.id);
      activeRef.current = s.id;
      setActiveId(s.id);
    }
  }, [hitSubject, startZoomIn, startZoomOut, toCanvasSpace]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.hypot(dx, dy) > 14 || Date.now() - touchStart.current.t > 420) return;
    const zoom = zoomRef.current;
    if (zoom.phase === "done") { startZoomOut(); return; }
    if (zoom.phase === "in" || zoom.phase === "out") return;
    const [cx, cy] = toCanvasSpace(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    const s = hitSubject(cx, cy);
    if (s) startZoomIn(s.id);
  }, [hitSubject, startZoomIn, startZoomOut, toCanvasSpace]);

  // Panel data
  const panelNode = nodesRef.current.find(n => n.id === panelId);
  const panelSub  = SUBJECTS.find(s => s.id === panelId);
  const panelTops = panelId === "russian-history" ? RUSSIAN_HISTORY_TOPICS : null;
  const panelTopicStrings = panelId && panelId !== "russian-history" ? (TOPICS[panelId] ?? []) : [];
  const pal = panelNode ? PAL[panelNode.status] : PAL.beta;

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
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.core, boxShadow: `0 0 4px ${item.core}` }} />
            <span className="text-[10px] text-white/40 font-medium">{item.label}</span>
          </div>
        ))}
      </div>

      {/* ── Glass pill hint — appears after 5s idle ────────────────────────── */}
      {hintMounted && (
        <div
          className="absolute bottom-28 left-1/2 z-30 pointer-events-none"
          style={{
            transform: `translateX(-50%) translateY(${hintVisible ? "0px" : "12px"}) scale(${hintVisible ? 1 : 0.88})`,
            opacity: hintVisible ? 1 : 0,
            transition: "transform 0.45s cubic-bezier(0.34,1.2,0.64,1), opacity 0.35s ease",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)",
              backdropFilter: "blur(20px) saturate(1.6)",
              WebkitBackdropFilter: "blur(20px) saturate(1.6)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: "999px",
              padding: "10px 20px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.12) inset, 0 -1px 0 rgba(0,0,0,0.2) inset",
            }}
            className="flex items-center gap-2.5"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white/70" />
            </span>
            <span className="text-xs font-medium text-white/85 whitespace-nowrap" style={{ letterSpacing: "0.01em" }}>
              Нажми на звезду
            </span>
          </div>
        </div>
      )}

      {/* ── Back button — visible when zoomed in ──────────────────────────── */}
      <div
        className="absolute top-4 left-4 z-30"
        style={{
          transition: "opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.2,0.64,1)",
          opacity: isZoomed ? 1 : 0,
          transform: isZoomed ? "translateX(0)" : "translateX(-12px)",
          pointerEvents: isZoomed ? "auto" : "none",
        }}
      >
        <button
          onClick={startZoomOut}
          className="flex items-center gap-2 rounded-full text-xs font-medium text-white/80 hover:text-white transition-colors"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.14)",
            padding: "8px 14px 8px 10px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Галактика
        </button>
      </div>

      {/* ── Topics panel — slides up after zoom ───────────────────────────── */}
      {showPanel && panelNode && panelSub && (
        <div
          className="absolute inset-x-0 bottom-0 z-40 pointer-events-auto"
          style={{
            transition: "transform 0.32s cubic-bezier(0.34,1.2,0.64,1), opacity 0.28s ease",
            transform: panelVisible ? "translateY(0)" : "translateY(100%)",
            opacity: panelVisible ? 1 : 0,
          }}
        >
          <div
            className="mx-2 mb-2 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(8,8,22,0.96)",
              backdropFilter: "blur(24px)",
              border: `1px solid ${pal.core}28`,
              boxShadow: `0 -8px 48px rgba(0,0,0,0.7), 0 0 0 1px ${pal.core}12`,
            }}
          >
            {/* Header */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">{panelSub.emoji}</span>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-sm leading-snug">{panelSub.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ background: pal.core + "20", color: pal.core }}>
                      {pal.label}
                    </span>
                    {panelNode.xp > 0 && (
                      <span className="text-[10px] text-white/30">{panelNode.xp} мент</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={startZoomOut}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Topics */}
            <div className="px-4 py-3">
              <p className="text-[10px] text-white/30 mb-2.5 font-medium uppercase tracking-wide">Выбери тему для изучения</p>
              <div className="overflow-x-auto -mx-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.12) transparent" }}>
                <style>{".gx-scroll::-webkit-scrollbar{height:3px}.gx-scroll::-webkit-scrollbar-track{background:transparent}.gx-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:4px}"}</style>
                <div className="gx-scroll flex gap-2 pb-2 min-w-max px-1" style={{ overflowX: "auto" }}>
                  {panelTops
                    ? panelTops.map(p => (
                        <a key={p.id}
                          href={`/learn/${panelNode.id}?topic=${encodeURIComponent(p.title)}`}
                          className="flex-shrink-0 rounded-xl px-3 py-2.5 text-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${pal.core}20`, minWidth: 72, maxWidth: 110 }}>
                          <div className="text-base mb-1">{p.emoji}</div>
                          <div className="text-[9px] font-medium text-white/75 leading-tight line-clamp-2">{p.title}</div>
                        </a>
                      ))
                    : panelTopicStrings.map((label, i) => (
                        <a key={i}
                          href={`/learn/${panelNode.id}?topic=${encodeURIComponent(label)}`}
                          className="flex-shrink-0 rounded-xl px-3 py-2.5 text-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${pal.core}20`, minWidth: 72, maxWidth: 110 }}>
                          <div className="text-[10px] font-medium text-white/80 leading-tight">{label}</div>
                        </a>
                      ))
                  }
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="px-4 pb-4">
              <a href={`/learn/${panelNode.id}`}
                className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-98"
                style={{ background: `linear-gradient(135deg, ${pal.core}, ${pal.core}bb)` }}>
                {panelNode.status === "active" || panelNode.status === "active_full" ? "Продолжить учёбу →" : "Начать изучение →"}
              </a>
            </div>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onMouseDown={onMouseDown}
        onClick={onClick}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="block w-full h-full"
        style={{ cursor: activeId && zoomRef.current.phase === "idle" ? "pointer" : showPanel ? "pointer" : "default" }}
      />
    </div>
  );
}
