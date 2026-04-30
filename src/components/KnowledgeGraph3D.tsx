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
  // Additional cross-discipline connections
  ["english","computer-science"],
  ["mathematics","social-studies"],
  ["geography","physics"],
  ["mathematics","biology"],
  ["chemistry","computer-science"],
  ["discovery","geography"],
  ["physics","biology"],
  ["literature","discovery"],
  ["russian-language","discovery"],
  ["astronomy","chemistry"],
  ["english","social-studies"],
  ["geography","russian-history"],
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
        {/* Description */}
        <p style={{ color:"rgba(255,255,255,0.55)", fontSize:12, lineHeight:1.6, margin:0 }}>{pop.description}</p>

        {/* XP Progress */}
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

        {/* Topics */}
        <div>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:11, margin:"0 0 8px 0" }}>Темы</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {pop.topics.map(t => (
              <span
                key={t}
                style={{ padding:"3px 9px", borderRadius:20, fontSize:11, border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.65)" }}
              >{t}</span>
            ))}
          </div>
        </div>

        {/* CTA */}
        {pop.xp > 0 ? (
          <a
            href={`/ru/learn/${pop.id}`}
            style={{ display:"block", textAlign:"center", padding:"8px 0", borderRadius:10, background:color, color:"#000", fontSize:12, fontWeight:600, textDecoration:"none", opacity:0.92 }}
          >Продолжить →</a>
        ) : (
          <a
            href={`/ru/learn/${pop.id}`}
            style={{ display:"block", textAlign:"center", padding:"8px 0", borderRadius:10, border:`1px solid ${color}55`, color:color, fontSize:12, fontWeight:600, textDecoration:"none" }}
          >Начать изучение →</a>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function KnowledgeGraph3D({ className, userProgress }: Props) {
  const mountRef  = useRef<HTMLDivElement>(null);
  const hovRef    = useRef<number | null>(null);       // raw hover index (in loop)
  const sciScr    = useRef(SUBS.map(() => ({ x: 0, y: 0 }))); // projected screen coords
  const setHovCb  = useRef<(i: number | null) => void>(() => {});
  const setPopCb  = useRef<(p: PopupState | null) => void>(() => {});

  const [hov, setHov] = useState<number | null>(null);
  const [pop, setPop] = useState<PopupState | null>(null);

  // Derive active set at component level (needed in JSX)
  const activeIds = new Set<string>(
    (userProgress ?? []).filter(p => (p.xp_total ?? 0) > 0).map(p => p.subject)
  );

  // keep callbacks stable for Three.js loop
  useEffect(() => { setHovCb.current = setHov; setPopCb.current = setPop; });

  // Escape closes popup
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
      renderer.setClearColor(0x06060f, 1);
      Object.assign(renderer.domElement.style, {
        position:"absolute", top:"0", left:"0", width:"100%", height:"100%", display:"block",
      });
      container.appendChild(renderer.domElement);

      // ── Scene / Camera ─────────────────────────────────────────────────────────
      const scene  = new THREE.Scene();
      scene.background = new THREE.Color(0x050a14);
      const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
      camera.position.set(0, 3.5, 28);
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

      // ── Nebulae (coloured soft blobs in background) ────────────────────────────
      // Large BackSide spheres placed at various positions in bgGrp
      const nebulaData: [number, number, number, number, number, number][] = [
        [55, 0x1a3a8a, 0.055,  50,  20, -30],
        [42, 0x6a1a9a, 0.048, -55,  -8,  35],
        [48, 0x0a4a3a, 0.052,  12,  42, -60],
        [38, 0x5a200a, 0.040, -28, -35, -45],
        [50, 0x0a2255, 0.060,  38, -18,  55],
        [32, 0x1a0a44, 0.050, -18,  50,  30],
      ];
      for (const [r, col, op, nx, ny, nz] of nebulaData) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({
          color: col, transparent:true, opacity:op, blending:ADD, depthWrite:false, side:THREE.BackSide,
        }));
        mesh.position.set(nx, ny, nz);
        bgGrp.add(mesh);
      }

      // ── Background stars (much dimmer) ────────────────────────────────────────
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
      // Stars dimmed ~50% vs first version
      mkStars(18000, 35, 350, 0xffffff, 1.6, 0.25);
      mkStars(3000,  20,  80, 0xaabbff, 1.9, 0.16);
      mkStars(500,   15,  40, 0xfff0cc, 2.6, 0.28);
      mkStars(900,   25, 150, 0x88aaff, 1.3, 0.12);
      mkStars(300,   10,  30, 0xffffff, 3.5, 0.40);
      // Milky Way
      {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(8000*3);
        for (let i = 0; i < 8000; i++) {
          const r = 80+Math.random()*200; const a = Math.random()*Math.PI*2; const y = (Math.random()-0.5)*28;
          pos[i*3]=Math.cos(a)*r; pos[i*3+1]=y; pos[i*3+2]=Math.sin(a)*r;
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        bgGrp.add(new THREE.Points(geo, new THREE.PointsMaterial({ color:0xaabbff, size:1.2, transparent:true, opacity:0.09, blending:ADD, depthWrite:false, sizeAttenuation:false })));
      }

      // ── Science positions ──────────────────────────────────────────────────────
      const sciPos = fibSph(SUBS.length, 8.0);

      // ── Science nodes ──────────────────────────────────────────────────────────
      const sciGlows:    THREE.Mesh[] = [];
      const sciCores:    THREE.Mesh[] = []; // for raycasting (hit area)

      for (let i = 0; i < SUBS.length; i++) {
        const s = SUBS[i]; const pos = sciPos[i];
        const isActive = activeSet.has(s.id); const isFull = FULL_SUBJECTS.has(s.id);
        const cHex = isActive ? 0xffa040 : s.hex;
        const cOp  = isActive ? 0.95 : isFull ? 0.85 : 0.65;

        // Invisible hit sphere (r=1.0 for easy clicking)
        // depthWrite:false is critical — without it the invisible sphere occludes the visual core
        const hitSph = new THREE.Mesh(new THREE.SphereGeometry(1.0, 6, 5), new THREE.MeshBasicMaterial({ transparent:true, opacity:0, depthWrite:false }));
        hitSph.position.copy(pos);
        mainGrp.add(hitSph);
        sciCores.push(hitSph);

        // Visual core
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.30, 12, 10), mkMat(cHex, cOp));
        core.position.copy(pos); mainGrp.add(core);
        // Glow
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.80, 8, 6), mkMat(cHex, isActive ? 0.14 : 0.08));
        glow.position.copy(pos); mainGrp.add(glow); sciGlows.push(glow);
        // Outer halo
        const halo = new THREE.Mesh(new THREE.SphereGeometry(1.5, 6, 5), mkMat(cHex, isActive ? 0.05 : 0.022));
        halo.position.copy(pos);
        mainGrp.add(halo);
      }

      // ── Edges & chain nodes ────────────────────────────────────────────────────
      const sciIdx = new Map(SUBS.map((s,i) => [s.id,i]));
      const interE: [THREE.Vector3,THREE.Vector3][] = [];
      for (const [idA,idB] of GRAPH_EDGES) {
        const ia = sciIdx.get(idA), ib = sciIdx.get(idB);
        if (ia==null||ib==null) continue;
        interE.push([sciPos[ia],sciPos[ib]]);
        mainGrp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([sciPos[ia],sciPos[ib]]),
          new THREE.LineBasicMaterial({ color:0x3355aa, transparent:true, opacity:0.20, blending:ADD, depthWrite:false })));
      }
      const CN=22, TCN=Math.max(interE.length*CN,1);
      const cnM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.032,5,4), mkMat(0x88aaff,0.55), TCN);
      mainGrp.add(cnM);
      { const dum=new THREE.Object3D(); let idx=0;
        for (const [a,b] of interE) for (let k=0;k<CN;k++) {
          const t=(k+1)/(CN+1), amp=0.55+Math.random()*0.25;
          dum.position.set(a.x+(b.x-a.x)*t+(Math.random()-.5)*amp, a.y+(b.y-a.y)*t+(Math.random()-.5)*amp, a.z+(b.z-a.z)*t+(Math.random()-.5)*amp);
          dum.scale.setScalar(1); dum.updateMatrix(); cnM.setMatrixAt(idx++, dum.matrix);
        }
        cnM.instanceMatrix.needsUpdate=true;
      }

      // Chunks
      const CPER=110, TIN=SUBS.length*CPER;
      const inM  = new THREE.InstancedMesh(new THREE.SphereGeometry(0.024,4,3), mkMat(0xffffff,0.27), TIN);
      const inM2 = new THREE.InstancedMesh(new THREE.SphereGeometry(0.062,4,3), mkMat(0xaabbff,0.05), TIN);
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
      // Spokes
      const SCN=6, SCEDGE=8, TSCN=SUBS.length*SCEDGE*SCN;
      const cnM2=new THREE.InstancedMesh(new THREE.SphereGeometry(0.020,5,4), mkMat(0x6688cc,0.38), TSCN);
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

      // ── Comets ─────────────────────────────────────────────────────────────────
      const TRAIL = 18;
      interface Comet {
        line: THREE.Line;
        pos: THREE.Vector3;
        vel: THREE.Vector3;
        posArr: Float32Array;
        colArr: Float32Array;
        timer: number; // countdown to reset
      }
      const comets: Comet[] = [];
      function spawnComet(c?: Partial<Comet>): Comet {
        const posArr = new Float32Array(TRAIL * 3);
        const colArr = new Float32Array(TRAIL * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
        geo.setAttribute("color",    new THREE.BufferAttribute(colArr, 3));
        const mat = new THREE.LineBasicMaterial({ vertexColors:true, transparent:true, opacity:0.85, blending:ADD, depthWrite:false });
        const line = new THREE.Line(geo, mat);
        scene.add(line);
        // random start pos off-screen (far edge of scene)
        const side = Math.floor(Math.random()*4);
        const px = side===0?-35:side===1?35:(Math.random()-0.5)*50;
        const py = side===2?-25:side===3?25:(Math.random()-0.5)*40;
        const pz = -20+Math.random()*10;
        const spd = 0.04+Math.random()*0.06;
        const angle = Math.random()*Math.PI*2;
        const vel = new THREE.Vector3(Math.cos(angle)*spd, (Math.random()-0.5)*spd*0.5, Math.sin(angle)*spd*0.3);
        const pos = new THREE.Vector3(px, py, pz);
        const timer = 80+Math.floor(Math.random()*120); // frames until reset
        return { line, pos, vel, posArr, colArr, timer, ...c };
      }

      // Stagger comet start timers
      for (let ci = 0; ci < 3; ci++) {
        const comet = spawnComet();
        // delay start
        comet.timer = ci * 90 + Math.floor(Math.random()*60);
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

        currentRotX += (targetRotX-currentRotX)*0.04;
        currentRotY += (targetRotY-currentRotY)*0.04;
        targetRotY  += 0.00070;
        mainGrp.rotation.x = currentRotX; mainGrp.rotation.y = currentRotY;
        bgGrp.rotation.x   = currentRotX*0.10; bgGrp.rotation.y = currentRotY*0.10;

        // Pulse glows
        for (let i=0;i<sciGlows.length;i++) {
          const g=sciGlows[i]; const ia=activeSet.has(SUBS[i].id);
          g.scale.setScalar(1+0.09*Math.sin(t*1.5+i*0.72));
          (g.material as THREE.MeshBasicMaterial).opacity=(ia?0.14:0.08)*(0.88+0.12*Math.sin(t*2.1+i));
        }

        // Update matrices before raycasting
        mainGrp.updateMatrixWorld(true);

        // Project science positions to screen (for hover label + popup)
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

        // Highlight hovered core
        for (let i=0;i<sciGlows.length;i++) {
          if (i===hovRef.current) {
            sciGlows[i].scale.setScalar(1.35); // pop up on hover
          }
        }

        // Comets
        for (const c of comets) {
          c.timer--;
          if (c.timer <= 0) {
            // Reuse same objects — reset position
            c.pos.set(
              (Math.random()-0.5)*70,
              (Math.random()-0.5)*50,
              -20+Math.random()*10,
            );
            const spd=0.04+Math.random()*0.06;
            const angle=Math.random()*Math.PI*2;
            c.vel.set(Math.cos(angle)*spd, (Math.random()-.5)*spd*.5, Math.sin(angle)*spd*.3);
            c.timer = 100+Math.floor(Math.random()*150);
          }
          c.pos.addScaledVector(c.vel, 1);
          // Update trail
          for (let k=0;k<TRAIL;k++) {
            const trail = (TRAIL-1-k)/(TRAIL-1); // 0=head, 1=tail
            c.posArr[k*3]   = c.pos.x - c.vel.x*trail*TRAIL*2;
            c.posArr[k*3+1] = c.pos.y - c.vel.y*trail*TRAIL*2;
            c.posArr[k*3+2] = c.pos.z - c.vel.z*trail*TRAIL*2;
            const bright = 1-trail; // head=1, tail=0
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
      {/* Three.js canvas appended here */}

      {/* Hover label — shows only when hovering and no popup open */}
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

      {/* Backdrop to close popup */}
      {pop && (
        <div
          style={{ position:"absolute", inset:0, zIndex:45 }}
          onClick={() => setPop(null)}
        />
      )}

      {/* Popup card */}
      {pop && <PopupCard pop={pop} onClose={() => setPop(null)} />}
    </div>
  );
}
