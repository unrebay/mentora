"use client";

import { useEffect, useRef, useState } from "react";

interface UserProgress { subject: string; xp_total: number }
interface Props { className?: string; userProgress?: UserProgress[] }

const FULL_SUBJECTS = new Set(["russian-history"]);

interface SubData { id: string; label: string; hex: number }
const SUBS: SubData[] = [
  { id: "russian-history",  label: "История России",    hex: 0xff6030 },
  { id: "world-history",    label: "Всемирная история", hex: 0xff8844 },
  { id: "mathematics",      label: "Математика",         hex: 0x4488ff },
  { id: "physics",          label: "Физика",             hex: 0x44aaff },
  { id: "chemistry",        label: "Химия",              hex: 0x44ffaa },
  { id: "biology",          label: "Биология",           hex: 0x66ee44 },
  { id: "russian-language", label: "Русский язык",       hex: 0xffcc44 },
  { id: "literature",       label: "Литература",         hex: 0xff88cc },
  { id: "english",          label: "Английский",         hex: 0x88ccff },
  { id: "social-studies",   label: "Обществознание",     hex: 0xffaa44 },
  { id: "geography",        label: "География",          hex: 0x44ddaa },
  { id: "computer-science", label: "Информатика",        hex: 0xaa77ff },
  { id: "astronomy",        label: "Астрономия",         hex: 0xaaddff },
  { id: "discovery",        label: "Открытия",           hex: 0xffdd88 },
  { id: "psychology",       label: "Психология",         hex: 0xcc66aa },
  { id: "economics",        label: "Экономика",          hex: 0x44cc88 },
  { id: "philosophy",       label: "Философия",          hex: 0xddaa44 },
];

const TOPICS: Record<string, string[]> = {
  "russian-history":  ["Древняя Русь","Монголы","Иван IV","Смута","Романовы","Пётр I","XIX век","Революция","СССР"],
  "world-history":    ["Античность","Средневековье","Ренессанс","Новое время","XX век","Холодная война"],
  "mathematics":      ["Алгебра","Геометрия","Анализ","Вероятность","Статистика"],
  "physics":          ["Механика","Термодинамика","Электродинамика","Квантовая","Оптика"],
  "chemistry":        ["Строение атома","Реакции","Органика","Металлы","Растворы"],
  "biology":          ["Клетка","Генетика","Эволюция","Экология","Анатомия"],
  "russian-language": ["Орфография","Пунктуация","Морфология","Синтаксис","Лексика"],
  "literature":       ["Классика","XIX век","XX век","Современная","Анализ текста"],
  "english":          ["Грамматика","Лексика","Говорение","Письмо","Аудирование"],
  "social-studies":   ["Право","Экономика","Политика","Социология","Философия"],
  "geography":        ["Физическая","Климат","Страны","Экономическая","Картография"],
  "computer-science": ["Алгоритмы","Программирование","Сети","Базы данных","ИИ"],
  "astronomy":        ["Солнечная система","Звёзды","Галактики","Космонавтика","Чёрные дыры"],
  "discovery":        ["Научные открытия","Изобретения","Великие учёные","Прогресс","Технологии"],
  "psychology":       ["Когнитивная психология","Эмоции","Личность","Социальная психология","Психотерапия"],
  "economics":        ["Макроэкономика","Микроэкономика","Финансы","Рынки","Экономическая история"],
  "philosophy":       ["Античность","Средневековье","Новое время","Этика","Эпистемология"],
};

const DESCRIPTIONS: Record<string, string> = {
  "russian-history":  "История России от древних времён до наших дней — ключевые события, правители и эпохи.",
  "world-history":    "Всемирная история цивилизаций, империй и революций от Античности до XX века.",
  "mathematics":      "Числа, уравнения, геометрия и математический анализ — язык науки и логики.",
  "physics":          "Фундаментальные законы природы: от классической механики до квантовой физики.",
  "chemistry":        "Строение вещества, химические реакции, органика — основа материального мира.",
  "biology":          "Живые организмы, генетика, эволюция и экология — наука о жизни.",
  "russian-language": "Грамматика, орфография, пунктуация и стилистика русского языка.",
  "literature":       "Мировая и русская литература — великие произведения и их анализ.",
  "english":          "Английский язык: грамматика, лексика, разговорная речь и письмо.",
  "social-studies":   "Общество, право, политика и экономика — как устроен современный мир.",
  "geography":        "Физическая и экономическая география — природа, страны и регионы Земли.",
  "computer-science": "Алгоритмы, программирование, сети и искусственный интеллект.",
  "astronomy":        "Планеты, звёзды, галактики и тайны вселенной — от Солнечной системы до Big Bang.",
  "discovery":        "Великие открытия и изобретения человечества, изменившие ход истории.",
  "psychology":       "Поведение, эмоции и мышление человека — от когнитивных процессов до психотерапии.",
  "economics":        "Рынки, деньги и решения — как устроена экономика на микро- и макроуровне.",
  "philosophy":       "Вечные вопросы о бытии, познании и морали — от Сократа до современной этики.",
};

const GRAPH_EDGES: [string, string][] = [
  ["russian-history","world-history"],["russian-history","literature"],
  ["russian-history","russian-language"],["russian-history","social-studies"],
  ["russian-history","discovery"],["russian-history","geography"],
  ["world-history","geography"],["world-history","english"],
  ["world-history","social-studies"],["world-history","discovery"],
  ["world-history","literature"],["mathematics","physics"],
  ["mathematics","computer-science"],["mathematics","astronomy"],
  ["mathematics","chemistry"],["physics","chemistry"],
  ["physics","computer-science"],["physics","astronomy"],
  ["physics","discovery"],["chemistry","biology"],
  ["chemistry","discovery"],["biology","geography"],
  ["biology","discovery"],["russian-language","literature"],
  ["russian-language","english"],["russian-language","social-studies"],
  ["literature","english"],["literature","social-studies"],
  ["discovery","astronomy"],["discovery","computer-science"],
  ["social-studies","geography"],["social-studies","english"],
  ["geography","astronomy"],["astronomy","physics"],["biology","chemistry"],
  ["english","computer-science"],["mathematics","social-studies"],
  ["geography","physics"],["mathematics","biology"],
  ["chemistry","computer-science"],["discovery","geography"],
  ["physics","biology"],["literature","discovery"],
  ["russian-language","discovery"],["astronomy","chemistry"],
  ["english","social-studies"],["geography","russian-history"],
  // Psychology connections
  ["psychology","biology"],["psychology","social-studies"],
  ["psychology","literature"],["psychology","philosophy"],
  // Economics connections
  ["economics","mathematics"],["economics","social-studies"],
  ["economics","geography"],["economics","philosophy"],
  // Philosophy connections
  ["philosophy","literature"],["philosophy","mathematics"],
  ["philosophy","discovery"],["philosophy","world-history"],
];

interface PopupState {
  idx: number; id: string; label: string; hex: number;
  description: string; topics: string[];
  xp: number; sx: number; sy: number;
}

function hexToCSS(hex: number): string {
  return `#${hex.toString(16).padStart(6, "0")}`;
}

// ── Popup card ─────────────────────────────────────────────────────────────────
function PopupCard({ pop, onClose }: { pop: PopupState; onClose: () => void }) {
  const pw = 300;
  const ph = 260;
  const cw = typeof window !== "undefined" ? window.innerWidth  : 1200;
  const ch = typeof window !== "undefined" ? window.innerHeight : 800;
  const left = Math.min(Math.max(pop.sx - pw / 2, 12), cw - pw - 12);
  const top  = Math.min(Math.max(pop.sy - ph - 24, 12), ch - ph - 12);
  const color = hexToCSS(pop.hex);
  const pct   = Math.min(100, Math.round(pop.xp / 5));

  return (
    <div
      style={{
        position: "absolute", left, top, width: pw, zIndex: 60,
        background: "rgba(6,6,22,0.88)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: `1px solid rgba(255,255,255,0.10)`,
        borderRadius: 16,
        boxShadow: `0 0 40px ${color}22, 0 12px 48px rgba(0,0,0,0.6)`,
        overflow: "hidden",
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px 12px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ width:10, height:10, borderRadius:"50%", background:color, boxShadow:`0 0 10px ${color}` }} />
        <span style={{ color:"#fff", fontWeight:600, fontSize:14, flex:1 }}>{pop.label}</span>
        <button
          onClick={onClose}
          style={{ background:"none", border:"none", color:"rgba(255,255,255,0.35)", fontSize:16, cursor:"pointer", lineHeight:1, padding:2 }}
        >✕</button>
      </div>

      {/* Body */}
      <div style={{ padding:"12px 16px 16px", display:"flex", flexDirection:"column", gap:12 }}>
        <p style={{ color:"rgba(255,255,255,0.55)", fontSize:12, lineHeight:1.6, margin:0 }}>{pop.description}</p>

        <div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ color:"rgba(255,255,255,0.35)", fontSize:11 }}>Прогресс</span>
            <span style={{ color:"rgba(255,255,255,0.60)", fontSize:11 }}>
              {pop.xp > 0 ? `${pop.xp} XP` : "Ещё не начат"}
            </span>
          </div>
          <div style={{ height:4, background:"rgba(255,255,255,0.08)", borderRadius:4 }}>
            <div style={{ height:"100%", borderRadius:4, background:color, width:`${pct}%`, transition:"width 0.6s ease", boxShadow: pct > 0 ? `0 0 8px ${color}` : "none" }} />
          </div>
        </div>

        <div>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:11, margin:"0 0 8px 0" }}>Темы</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {pop.topics.map(t => (
              <span key={t} style={{ padding:"3px 9px", borderRadius:20, fontSize:11, border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.65)" }}>{t}</span>
            ))}
          </div>
        </div>

        {pop.xp > 0 ? (
          <a href={`/ru/learn/${pop.id}`} style={{ display:"block", textAlign:"center", padding:"8px 0", borderRadius:10, background:color, color:"#000", fontSize:12, fontWeight:600, textDecoration:"none", opacity:0.92 }}>Продолжить →</a>
        ) : (
          <a href={`/ru/learn/${pop.id}`} style={{ display:"block", textAlign:"center", padding:"8px 0", borderRadius:10, border:`1px solid ${color}55`, color:color, fontSize:12, fontWeight:600, textDecoration:"none" }}>Начать изучение →</a>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function KnowledgeGraph3D({ className, userProgress }: Props) {
  const mountRef  = useRef<HTMLDivElement>(null);
  const hovRef    = useRef<number | null>(null);
  const sciScr    = useRef(SUBS.map(() => ({ x: 0, y: 0 })));
  const setHovCb  = useRef<(i: number | null) => void>(() => {});
  const setPopCb  = useRef<(p: PopupState | null) => void>(() => {});

  const [hov, setHov] = useState<number | null>(null);
  const [pop, setPop] = useState<PopupState | null>(null);

  const activeIds = new Set<string>(
    (userProgress ?? []).filter(p => (p.xp_total ?? 0) > 0).map(p => p.subject)
  );

  useEffect(() => { setHovCb.current = setHov; setPopCb.current = setPop; });

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setPop(null); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    let animId    = 0;
    let disposed  = false;
    let onMMFn:   ((e: MouseEvent) => void) | null = null;
    let onTMFn:   ((e: TouchEvent) => void) | null = null;
    let onRSFn:   (() => void) | null = null;
    let onClkFn:  ((e: MouseEvent) => void) | null = null;

    const activeSet = new Set<string>();
    if (userProgress) for (const p of userProgress) if (p.xp_total > 0) activeSet.add(p.subject);
    const xpMap = new Map<string, number>();
    if (userProgress) for (const p of userProgress) xpMap.set(p.subject, p.xp_total ?? 0);

    async function init() {
      const THREE = await import("three");
      if (disposed || !container) return;

      // ── Renderer ──────────────────────────────────────────────────────────────
      const w = container.clientWidth  || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      renderer.setClearColor(0x020308, 1);
      Object.assign(renderer.domElement.style, {
        position:"absolute", top:"0", left:"0", width:"100%", height:"100%", display:"block",
      });
      container.appendChild(renderer.domElement);

      // ── Scene / Camera ─────────────────────────────────────────────────────────
      const scene  = new THREE.Scene();
      scene.background = new THREE.Color(0x020308);
      const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
      camera.position.set(0, 3.0, 26); // slightly closer for larger apparent galaxy
      camera.lookAt(0, 0, 0);

      const ADD = THREE.AdditiveBlending;
      const mkMat = (color: number, op: number) =>
        new THREE.MeshBasicMaterial({ color, transparent:true, opacity:op, blending:ADD, depthWrite:false });

      function fibSph(n: number, r: number): THREE.Vector3[] {
        const pts: THREE.Vector3[] = [];
        const phi = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < n; i++) {
          const y = 1 - (i / (n-1)) * 2;
          const rad = Math.sqrt(Math.max(0, 1-y*y));
          pts.push(new THREE.Vector3(Math.cos(phi*i)*rad*r, y*r, Math.sin(phi*i)*rad*r));
        }
        return pts;
      }

      const mainGrp = new THREE.Group();
      const bgGrp   = new THREE.Group();
      scene.add(mainGrp);
      scene.add(bgGrp);

      // ── BackSide atmosphere ────────────────────────────────────────────────────
      for (const [r, color, op] of [[90,0x1a3a7a,0.07],[60,0x0d2255,0.10],[45,0x18083a,0.05]] as [number,number,number][]) {
        scene.add(new THREE.Mesh(new THREE.SphereGeometry(r,20,20), new THREE.MeshBasicMaterial({
          color, transparent:true, opacity:op, blending:ADD, depthWrite:false, side:THREE.BackSide,
        })));
      }

      // ── Nebulae — soft gaussian particle clouds for cosmic atmosphere ──────────
      const nebulaConfigs = [
        { cx:  22, cy:  10, cz: -18, r: 14, col: 0x1a3a9a, count: 600, op: 0.22, sz: 2.5 },
        { cx: -25, cy:  -5, cz:  14, r: 12, col: 0x5a0a8a, count: 480, op: 0.20, sz: 2.3 },
        { cx:   4, cy:  24, cz: -25, r: 11, col: 0x0a3a4a, count: 420, op: 0.18, sz: 2.2 },
        { cx: -12, cy: -22, cz: -14, r:  9, col: 0x442210, count: 300, op: 0.16, sz: 2.0 },
        { cx:  28, cy: -10, cz:  18, r: 12, col: 0x0a2255, count: 400, op: 0.19, sz: 2.4 },
        { cx: -18, cy:  16, cz:  22, r: 10, col: 0x1a0a44, count: 320, op: 0.17, sz: 2.1 },
      ];
      for (const nb of nebulaConfigs) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(nb.count * 3);
        for (let i = 0; i < nb.count; i++) {
          // Box-Muller gaussian distribution for soft cloud look
          const u1 = Math.max(1e-10, Math.random()), u2 = Math.random();
          const g1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          const u3 = Math.max(1e-10, Math.random()), u4 = Math.random();
          const g2 = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4);
          const u5 = Math.max(1e-10, Math.random()), u6 = Math.random();
          const g3 = Math.sqrt(-2 * Math.log(u5)) * Math.cos(2 * Math.PI * u6);
          pos[i*3]   = nb.cx + g1 * nb.r * 0.38;
          pos[i*3+1] = nb.cy + g2 * nb.r * 0.38;
          pos[i*3+2] = nb.cz + g3 * nb.r * 0.38;
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        bgGrp.add(new THREE.Points(geo, new THREE.PointsMaterial({
          color: nb.col, size: nb.sz, transparent: true, opacity: nb.op,
          blending: ADD, depthWrite: false, sizeAttenuation: false,
        })));
      }

      // ── Background stars (dimmed) ─────────────────────────────────────────────
      function mkStars(count: number, rMin: number, rMax: number, color: number, size: number, op: number) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const r = rMin + Math.random()*(rMax-rMin);
          const th = Math.random()*Math.PI*2; const ph = Math.acos(2*Math.random()-1);
          pos[i*3] = r*Math.sin(ph)*Math.cos(th); pos[i*3+1] = r*Math.sin(ph)*Math.sin(th); pos[i*3+2] = r*Math.cos(ph);
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        bgGrp.add(new THREE.Points(geo, new THREE.PointsMaterial({
          color, size, transparent:true, opacity:op, blending:ADD, depthWrite:false, sizeAttenuation:false,
        })));
      }
      mkStars(18000, 35, 350, 0xffffff, 1.6, 0.20);
      mkStars(3000,  20,  80, 0xaabbff, 1.9, 0.13);
      mkStars(500,   15,  40, 0xfff0cc, 2.6, 0.22);
      mkStars(900,   25, 150, 0x88aaff, 1.3, 0.10);
      mkStars(300,   10,  30, 0xffffff, 3.5, 0.32);
      // Milky Way band
      {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(8000*3);
        for (let i = 0; i < 8000; i++) {
          const r = 80+Math.random()*200; const a = Math.random()*Math.PI*2; const y = (Math.random()-0.5)*28;
          pos[i*3]=Math.cos(a)*r; pos[i*3+1]=y; pos[i*3+2]=Math.sin(a)*r;
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        bgGrp.add(new THREE.Points(geo, new THREE.PointsMaterial({ color:0xaabbff, size:1.2, transparent:true, opacity:0.07, blending:ADD, depthWrite:false, sizeAttenuation:false })));
      }

      // ── Science positions (radius 10.0 = 25% larger sphere) ───────────────────
      const sciPos = fibSph(SUBS.length, 10.0);

      // ── Soft glow texture factory (canvas radial gradient, cached) ───────────
      const glowTexCache = new Map<number, THREE.Texture>();
      function getGlowTex(hexColor: number): THREE.Texture {
        if (glowTexCache.has(hexColor)) return glowTexCache.get(hexColor)!;
        const rr=(hexColor>>16)&0xff, gg=(hexColor>>8)&0xff, bb=hexColor&0xff;
        const sz=256; const gc=document.createElement("canvas"); gc.width=gc.height=sz;
        const gctx=gc.getContext("2d")!;
        const half=sz/2;
        const grd=gctx.createRadialGradient(half,half,0,half,half,half);
        grd.addColorStop(0.00,`rgba(${rr},${gg},${bb},1.00)`);
        grd.addColorStop(0.10,`rgba(${rr},${gg},${bb},0.95)`);
        grd.addColorStop(0.28,`rgba(${rr},${gg},${bb},0.60)`);
        grd.addColorStop(0.52,`rgba(${rr},${gg},${bb},0.20)`);
        grd.addColorStop(0.75,`rgba(${rr},${gg},${bb},0.05)`);
        grd.addColorStop(1.00,`rgba(${rr},${gg},${bb},0.00)`);
        gctx.fillStyle=grd; gctx.fillRect(0,0,sz,sz);
        const tex=new THREE.CanvasTexture(gc); glowTexCache.set(hexColor,tex); return tex;
      }

      // ── Science nodes — sprite billboards + invisible hit sphere ──────────────
      const sciGlows:   THREE.Sprite[] = [];
      const sciCores:   THREE.Mesh[]   = [];
      const sciGlowOps: number[]       = [];
      const sciGlowSzs: number[]       = [];

      for (let i = 0; i < SUBS.length; i++) {
        const s = SUBS[i]; const pos = sciPos[i];
        const isActive = activeSet.has(s.id);
        const cHex = isActive ? 0xffa040 : s.hex;

        // Invisible hit sphere for raycasting (keep this for click detection)
        const hitSph = new THREE.Mesh(new THREE.SphereGeometry(1.0, 6, 5), new THREE.MeshBasicMaterial({ transparent:true, opacity:0, depthWrite:false }));
        hitSph.position.copy(pos); mainGrp.add(hitSph); sciCores.push(hitSph);

        const tex = getGlowTex(cHex);
        const mkSp = (sz: number, op: number) => {
          const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, opacity:op, blending:ADD, depthWrite:false }));
          sp.scale.set(sz,sz,1); sp.position.copy(pos); mainGrp.add(sp); return sp;
        };
        // Tight bright core
        mkSp(isActive ? 1.4 : 1.0, isActive ? 0.92 : 0.80);
        // Mid glow (animated)
        const gsz = isActive ? 4.0 : 3.2;
        const gop = isActive ? 0.45 : 0.30;
        const gsp = mkSp(gsz, gop);
        sciGlows.push(gsp); sciGlowOps.push(gop); sciGlowSzs.push(gsz);
        // Outer diffuse haze
        mkSp(isActive ? 9.0 : 7.0, isActive ? 0.10 : 0.07);
      }

      // ── Edges ─────────────────────────────────────────────────────────────────
      const sciIdx = new Map(SUBS.map((s,i) => [s.id,i]));
      const interE: [THREE.Vector3,THREE.Vector3][] = [];
      for (const [idA,idB] of GRAPH_EDGES) {
        const ia = sciIdx.get(idA), ib = sciIdx.get(idB);
        if (ia==null||ib==null) continue;
        interE.push([sciPos[ia],sciPos[ib]]);
        // Higher contrast edges: opacity 0.20→0.30, brighter blue
        mainGrp.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([sciPos[ia],sciPos[ib]]),
          new THREE.LineBasicMaterial({ color:0x4466cc, transparent:true, opacity:0.30, blending:ADD, depthWrite:false })
        ));
      }

      // Chain nodes on edges — plasma beads (denser geom + halo, animated pulse)
      const CN=22, TCN=Math.max(interE.length*CN,1);
      const cnM     = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055,10,8), mkMat(0xb8d4ff,0.85), TCN);
      const cnMHalo = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16,8,6),  mkMat(0x4470ff,0.22), TCN);
      mainGrp.add(cnM); mainGrp.add(cnMHalo);
      { const dum=new THREE.Object3D(); let idx=0;
        for (const [a,b] of interE) for (let k=0;k<CN;k++) {
          const t=(k+1)/(CN+1), amp=0.55+Math.random()*0.25;
          dum.position.set(a.x+(b.x-a.x)*t+(Math.random()-.5)*amp, a.y+(b.y-a.y)*t+(Math.random()-.5)*amp, a.z+(b.z-a.z)*t+(Math.random()-.5)*amp);
          dum.scale.setScalar(1); dum.updateMatrix();
          cnM.setMatrixAt(idx,dum.matrix); cnMHalo.setMatrixAt(idx,dum.matrix); idx++;
        }
        cnM.instanceMatrix.needsUpdate=true; cnMHalo.instanceMatrix.needsUpdate=true;
      }

      // Chunks (local clouds around each science) — 3D bluish-white topic orbs
      const CPER=110, TIN=SUBS.length*CPER;
      const inM  = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045,10,8), mkMat(0xcfe3ff,0.40), TIN);
      const inM2 = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11,8,6),   mkMat(0x88aaff,0.10), TIN);
      mainGrp.add(inM); mainGrp.add(inM2);
      { const dum=new THREE.Object3D();
        for (let si=0;si<SUBS.length;si++) {
          const sp=sciPos[si];
          for (let j=0;j<CPER;j++) {
            const r=0.5+Math.random()*2.2, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
            dum.position.set(sp.x+r*Math.sin(ph)*Math.cos(th), sp.y+r*Math.sin(ph)*Math.sin(th), sp.z+r*Math.cos(ph));
            dum.scale.setScalar(1); dum.updateMatrix();
            inM.setMatrixAt(si*CPER+j, dum.matrix); inM2.setMatrixAt(si*CPER+j, dum.matrix);
          }
        }
        inM.instanceMatrix.needsUpdate=true; inM2.instanceMatrix.needsUpdate=true;
      }

      // Spokes (short tendrils from each science)
      const SCN=6, SCEDGE=8, TSCN=SUBS.length*SCEDGE*SCN;
      const cnM2=new THREE.InstancedMesh(new THREE.SphereGeometry(0.034,8,6), mkMat(0x88aadd,0.55), TSCN);
      mainGrp.add(cnM2);
      { const dum=new THREE.Object3D(); let idx2=0;
        for (let si=0;si<SUBS.length;si++) {
          const sp=sciPos[si];
          for (let e=0;e<SCEDGE;e++) {
            const r=1.6+Math.random()*1.4, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
            const tx=sp.x+r*Math.sin(ph)*Math.cos(th), ty=sp.y+r*Math.sin(ph)*Math.sin(th), tz=sp.z+r*Math.cos(ph);
            mainGrp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([sp,new THREE.Vector3(tx,ty,tz)]),
              new THREE.LineBasicMaterial({ color:0x334488, transparent:true, opacity:0.10, blending:ADD, depthWrite:false })));
            for (let k=0;k<SCN;k++) {
              const t=(k+1)/(SCN+1);
              dum.position.set(sp.x+(tx-sp.x)*t+(Math.random()-.5)*.22, sp.y+(ty-sp.y)*t+(Math.random()-.5)*.22, sp.z+(tz-sp.z)*t+(Math.random()-.5)*.22);
              dum.scale.setScalar(1); dum.updateMatrix(); cnM2.setMatrixAt(idx2++, dum.matrix);
            }
          }
        }
        cnM2.instanceMatrix.needsUpdate=true;
      }

      // ── Impulse pulses along edges ─────────────────────────────────────────────
      // Small bright spheres travel along edge lines, fade in/out with sin curve
      const IMP_N = Math.min(40, interE.length * 2);
      interface ImpState { edgeIdx: number; t: number; speed: number }
      const impStates: ImpState[] = Array.from({ length: IMP_N }, (_, i) => ({
        edgeIdx: i % interE.length,
        t: i / IMP_N, // stagger so they don't all start at same edge point
        speed: 0.0022 + Math.random() * 0.0038,
      }));
      const impGeo    = new THREE.SphereGeometry(0.11, 5, 4);
      const impMat    = new THREE.MeshBasicMaterial({ color: 0xaaccff, transparent: true, opacity: 0.90, blending: ADD, depthWrite: false });
      const impIM     = new THREE.InstancedMesh(impGeo, impMat, IMP_N);
      const impGGeo   = new THREE.SphereGeometry(0.28, 5, 4);
      const impGMat   = new THREE.MeshBasicMaterial({ color: 0x4466cc, transparent: true, opacity: 0.30, blending: ADD, depthWrite: false });
      const impGlowIM = new THREE.InstancedMesh(impGGeo, impGMat, IMP_N);
      mainGrp.add(impIM); mainGrp.add(impGlowIM);
      const impD = new THREE.Object3D();

      // ── Comets ─────────────────────────────────────────────────────────────────
      const TRAIL = 18;
      interface Comet {
        line:     THREE.Line;
        pos:      THREE.Vector3;
        vel:      THREE.Vector3;
        posArr:   Float32Array;
        colArr:   Float32Array;
        timer:    number;
        maxTimer: number; // used for fade in/out calculation
      }
      const comets: Comet[] = [];

      function spawnComet(): Comet {
        const posArr = new Float32Array(TRAIL * 3);
        const colArr = new Float32Array(TRAIL * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
        geo.setAttribute("color",    new THREE.BufferAttribute(colArr, 3));
        const mat = new THREE.LineBasicMaterial({ vertexColors:true, transparent:true, opacity:0, blending:ADD, depthWrite:false });
        const line = new THREE.Line(geo, mat);
        scene.add(line);
        const side = Math.floor(Math.random()*4);
        const px = side===0?-38:side===1?38:(Math.random()-0.5)*55;
        const py = side===2?-28:side===3?28:(Math.random()-0.5)*44;
        const pz = -20+Math.random()*10;
        const spd = 0.04+Math.random()*0.06;
        const angle = Math.random()*Math.PI*2;
        const vel = new THREE.Vector3(Math.cos(angle)*spd, (Math.random()-0.5)*spd*0.5, Math.sin(angle)*spd*0.3);
        const pos = new THREE.Vector3(px, py, pz);
        const timer = 80+Math.floor(Math.random()*120);
        return { line, pos, vel, posArr, colArr, timer, maxTimer: timer };
      }

      for (let ci = 0; ci < 3; ci++) {
        const comet = spawnComet();
        comet.timer = ci * 90 + Math.floor(Math.random()*60);
        comet.maxTimer = comet.timer;
        comets.push(comet);
      }

      // ── Raycaster ──────────────────────────────────────────────────────────────
      const raycaster = new THREE.Raycaster();
      const mouse2D   = new THREE.Vector2();
      let mouseX = 0, mouseY = 0;

      // ── Input handlers ─────────────────────────────────────────────────────────
      let targetRotX=0.20, targetRotY=0.0, currentRotX=0.20, currentRotY=0.0;

      onMMFn = (e: MouseEvent) => {
        mouseX = e.clientX; mouseY = e.clientY;
        targetRotY = ((e.clientX/window.innerWidth)-.5)*2*0.55;
        targetRotX = 0.20+((e.clientY/window.innerHeight)-.5)*2*0.30;
      };
      onTMFn = (e: TouchEvent) => {
        if (!e.touches.length) return;
        targetRotY = ((e.touches[0].clientX/window.innerWidth)-.5)*2*0.55;
        targetRotX = 0.20+((e.touches[0].clientY/window.innerHeight)-.5)*2*0.30;
      };
      onRSFn = () => {
        const nw=container.clientWidth||window.innerWidth, nh=container.clientHeight||window.innerHeight;
        camera.aspect=nw/nh; camera.updateProjectionMatrix(); renderer.setSize(nw,nh);
      };
      onClkFn = () => {
        const hIdx = hovRef.current;
        if (hIdx == null) { setPopCb.current(null); return; }
        const s = SUBS[hIdx];
        const scr = sciScr.current[hIdx];
        setPopCb.current({
          idx: hIdx, id: s.id, label: s.label, hex: s.hex,
          description: DESCRIPTIONS[s.id] ?? "",
          topics: TOPICS[s.id] ?? [],
          xp: xpMap.get(s.id) ?? 0,
          sx: scr.x, sy: scr.y,
        });
      };

      window.addEventListener("mousemove", onMMFn);
      window.addEventListener("touchmove", onTMFn, { passive:true });
      window.addEventListener("resize",    onRSFn);
      renderer.domElement.addEventListener("click", onClkFn);

      // ── Animation loop ─────────────────────────────────────────────────────────
      const clock = new THREE.Clock();
      const tmpVec = new THREE.Vector3();

      function animate() {
        animId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        currentRotX += (targetRotX-currentRotX)*0.025;
        currentRotY += (targetRotY-currentRotY)*0.025;
        targetRotY  += 0.00040;
        mainGrp.rotation.x = currentRotX; mainGrp.rotation.y = currentRotY;
        bgGrp.rotation.x   = currentRotX*0.10; bgGrp.rotation.y = currentRotY*0.10;

        // Pulse mid-glow sprites
        for (let i=0;i<sciGlows.length;i++) {
          const pulse=1+0.09*Math.sin(t*1.5+i*0.72);
          const sz=sciGlowSzs[i]*pulse;
          sciGlows[i].scale.set(sz,sz,1);
          (sciGlows[i].material as THREE.SpriteMaterial).opacity=sciGlowOps[i]*(0.85+0.15*Math.sin(t*2.1+i));
        }

        // Update matrices before raycasting
        mainGrp.updateMatrixWorld(true);

        // Project science positions to screen
        const rect = renderer.domElement.getBoundingClientRect();
        for (let i=0;i<SUBS.length;i++) {
          tmpVec.copy(sciPos[i]).applyMatrix4(mainGrp.matrixWorld);
          const projected = tmpVec.clone().project(camera);
          sciScr.current[i] = {
            x: (projected.x*.5+.5)*rect.width  + rect.left,
            y: (-projected.y*.5+.5)*rect.height + rect.top,
          };
        }

        // Raycasting for hover
        mouse2D.x =  ((mouseX-rect.left)/rect.width )*2-1;
        mouse2D.y = -((mouseY-rect.top )/rect.height)*2+1;
        raycaster.setFromCamera(mouse2D, camera);
        const hits = raycaster.intersectObjects(sciCores);
        const newHov = hits.length>0 ? sciCores.indexOf(hits[0].object as THREE.Mesh) : null;
        if (newHov !== hovRef.current) {
          hovRef.current = newHov;
          setHovCb.current(newHov);
          renderer.domElement.style.cursor = newHov!==null ? "pointer" : "default";
        }
        for (let i=0;i<sciGlows.length;i++) {
          if (i===hovRef.current) sciGlows[i].scale.set(sciGlowSzs[i]*1.35, sciGlowSzs[i]*1.35, 1);
        }

        // ── Impulse pulses ──────────────────────────────────────────────────────
        for (let i = 0; i < IMP_N; i++) {
          const s = impStates[i];
          s.t += s.speed;
          if (s.t > 1.08) {
            s.t = -0.08;
            s.edgeIdx = Math.floor(Math.random() * interE.length);
            s.speed = 0.0022 + Math.random() * 0.0038;
          }
          const visible = s.t >= 0 && s.t <= 1;
          if (visible) {
            const [ea, eb] = interE[s.edgeIdx];
            impD.position.lerpVectors(ea, eb, s.t);
            // sin curve → fade in at start, fade out at end
            const fade = Math.sin(Math.max(0, Math.min(1, s.t)) * Math.PI);
            impD.scale.setScalar(Math.max(0.001, fade * 1.1));
            impD.updateMatrix();
          } else {
            impD.position.set(0, 0, 0); impD.scale.setScalar(0.001); impD.updateMatrix();
          }
          impIM.setMatrixAt(i, impD.matrix);
          impGlowIM.setMatrixAt(i, impD.matrix);
        }
        impIM.instanceMatrix.needsUpdate = true;
        impGlowIM.instanceMatrix.needsUpdate = true;

        // ── Comets with fade in/out ──────────────────────────────────────────────
        for (const c of comets) {
          c.timer--;
          if (c.timer <= 0) {
            c.pos.set((Math.random()-0.5)*70, (Math.random()-0.5)*50, -20+Math.random()*10);
            const spd=0.04+Math.random()*0.06;
            const angle=Math.random()*Math.PI*2;
            c.vel.set(Math.cos(angle)*spd, (Math.random()-.5)*spd*.5, Math.sin(angle)*spd*.3);
            c.timer = 100+Math.floor(Math.random()*150);
            c.maxTimer = c.timer; // reset maxTimer for fresh fade cycle
          }
          c.pos.addScaledVector(c.vel, 1);

          // Fade in (first 25 frames) + fade out (last 30 frames)
          const elapsed  = c.maxTimer - c.timer;
          const fadeIn   = Math.min(1, elapsed / 25);
          const fadeOut  = Math.min(1, c.timer  / 30);
          const opacity  = Math.min(fadeIn, fadeOut) * 0.85;
          (c.line.material as THREE.LineBasicMaterial).opacity = opacity;

          // Update trail geometry
          for (let k=0;k<TRAIL;k++) {
            const trail = (TRAIL-1-k)/(TRAIL-1);
            c.posArr[k*3]   = c.pos.x - c.vel.x*trail*TRAIL*2;
            c.posArr[k*3+1] = c.pos.y - c.vel.y*trail*TRAIL*2;
            c.posArr[k*3+2] = c.pos.z - c.vel.z*trail*TRAIL*2;
            const bright = 1-trail;
            c.colArr[k*3]   = bright*1.0;
            c.colArr[k*3+1] = bright*0.92;
            c.colArr[k*3+2] = bright*1.0;
          }
          (c.line.geometry.attributes.position as THREE.BufferAttribute).needsUpdate=true;
          (c.line.geometry.attributes.color    as THREE.BufferAttribute).needsUpdate=true;
        }

        renderer.render(scene, camera);
      }

      animate();
    }

    init().catch(console.error);

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      if (onMMFn)  window.removeEventListener("mousemove", onMMFn);
      if (onTMFn)  window.removeEventListener("touchmove", onTMFn);
      if (onRSFn)  window.removeEventListener("resize",    onRSFn);
      while (container.firstChild) container.removeChild(container.firstChild);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ background:"#05080f", position:"relative", overflow:"hidden" }}
      onClick={() => { if (hovRef.current == null) setPop(null); }}
    >
      {/* Hover label */}
      {hov !== null && !pop && (
        <div
          style={{
            position:"fixed",
            left: sciScr.current[hov].x,
            top:  sciScr.current[hov].y + 22,
            transform: "translateX(-50%)",
            pointerEvents: "none",
            zIndex: 30,
            padding: "4px 10px",
            borderRadius: 8,
            background: "rgba(6,6,22,0.80)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: activeIds.has(SUBS[hov].id) ? "#ffa040" : "rgba(200,220,255,0.92)",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif",
            whiteSpace: "nowrap",
            boxShadow: `0 4px 16px rgba(0,0,0,0.4)`,
          }}
        >
          {SUBS[hov].label}
        </div>
      )}

      {pop && (
        <div style={{ position:"absolute", inset:0, zIndex:45 }} onClick={() => setPop(null)} />
      )}
      {pop && <PopupCard pop={pop} onClose={() => setPop(null)} />}
    </div>
  );
}
