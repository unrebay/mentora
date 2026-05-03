"use client";
/**
 * GalaxyCanvas — reusable Three.js knowledge galaxy background.
 *
 * Renders a deep-space scene with:
 *  - Nebula atmosphere (BackSide spheres + gaussian particle clouds)
 *  - Background star field + Milky Way band
 *  - Science subject nodes as soft-glow sprite billboards (canvas radial gradient)
 *  - Subject graph edges with animated impulse pulses
 *  - Mouse / touch parallax rotation
 *
 * Pure background — no click interaction. Fill your container with:
 *   <GalaxyCanvas className="absolute inset-0 w-full h-full z-0" />
 */

import { useEffect, useRef } from "react";

// ── Subject data with Three.js hex colors ─────────────────────────────────
const SUBS = [
  { id: "russian-history",  hex: 0xff6030 },
  { id: "world-history",    hex: 0xff8844 },
  { id: "mathematics",      hex: 0x4488ff },
  { id: "physics",          hex: 0x44aaff },
  { id: "chemistry",        hex: 0x44ffaa },
  { id: "biology",          hex: 0x66ee44 },
  { id: "russian-language", hex: 0xffcc44 },
  { id: "literature",       hex: 0xff88cc },
  { id: "english",          hex: 0x88ccff },
  { id: "social-studies",   hex: 0xffaa44 },
  { id: "geography",        hex: 0x44ddaa },
  { id: "computer-science", hex: 0xaa77ff },
  { id: "astronomy",        hex: 0xaaddff },
  { id: "discovery",        hex: 0xffdd88 },
  { id: "psychology",       hex: 0xcc66aa },
  { id: "economics",        hex: 0x44cc88 },
  { id: "philosophy",       hex: 0xddaa44 },
];

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
  ["psychology","biology"],["psychology","social-studies"],
  ["psychology","literature"],["psychology","philosophy"],
  ["economics","mathematics"],["economics","social-studies"],
  ["economics","geography"],["economics","philosophy"],
  ["philosophy","literature"],["philosophy","mathematics"],
  ["philosophy","discovery"],["philosophy","world-history"],
];

interface Props {
  className?: string;
}

export default function GalaxyCanvas({ className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId   = 0;
    let disposed = false;
    let onMMFn:  ((e: MouseEvent) => void) | null = null;
    let onTMFn:  ((e: TouchEvent) => void) | null = null;
    let onRSFn:  (() => void) | null = null;

    async function init() {
      const THREE = await import("three");
      if (disposed || !container) return;

      const w = container.clientWidth  || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      renderer.setClearColor(0x020308, 1);
      Object.assign(renderer.domElement.style, {
        position: "absolute", top: "0", left: "0", width: "100%", height: "100%", display: "block",
      });
      container.appendChild(renderer.domElement);

      const scene  = new THREE.Scene();
      scene.background = new THREE.Color(0x020308);
      const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
      camera.position.set(0, 3.0, 43); // z=43: ~16% larger scale vs z=50
      camera.lookAt(0, 0, 0);

      const ADD = THREE.AdditiveBlending;

      function fibSph(n: number, r: number): THREE.Vector3[] {
        const pts: THREE.Vector3[] = [];
        const phi = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < n; i++) {
          const y = 1 - (i / (n - 1)) * 2;
          const rad = Math.sqrt(Math.max(0, 1 - y * y));
          pts.push(new THREE.Vector3(Math.cos(phi * i) * rad * r, y * r, Math.sin(phi * i) * rad * r));
        }
        return pts;
      }

      const mainGrp = new THREE.Group();
      const bgGrp   = new THREE.Group();
      mainGrp.position.y = 11; // shift galaxy cluster up into hero / demo-chat area
      scene.add(mainGrp);
      scene.add(bgGrp);

      // ── Atmosphere — BackSide spheres (ADD blending accumulates, keep opacity very low) ──
      for (const [r, color, op] of [
        [100, 0x080814, 0.04], [65, 0x14081f, 0.05], [42, 0x10062a, 0.04],
      ] as [number, number, number][]) {
        scene.add(new THREE.Mesh(new THREE.SphereGeometry(r, 20, 20), new THREE.MeshBasicMaterial({
          color, transparent: true, opacity: op, blending: ADD, depthWrite: false, side: THREE.BackSide,
        })));
      }

      // ── Nebula volume spheres — varied palette, very low opacity ─────────────
      for (const [cx, cy, cz, r, col, op] of [
        [ 20,  8, -16, 28, 0x2a1a6a, 0.06],
        [-22, -4,  12, 24, 0x4a0a5a, 0.05],
        [  3, 22, -22, 22, 0x0a2a3a, 0.05],
        [-10,-20, -12, 20, 0x3a1a08, 0.05],
        [ 25, -8,  16, 24, 0x0a1a4a, 0.05],
        [-28, 14,  -6, 18, 0x1a0840, 0.04],
      ] as [number, number, number, number, number, number][]) {
        scene.add(new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), new THREE.MeshBasicMaterial({
          color: col, transparent: true, opacity: op, blending: ADD, depthWrite: false, side: THREE.BackSide,
        })));
      }

      // ── Dense particle nebulae — gaussian clouds for cosmic atmosphere ────────
      for (const nb of [
        { cx: 22,  cy: 10, cz:-18, r:16, col:0x2a3a88, count:3000, op:0.07, sz:2.5 },
        { cx:-25, cy: -5, cz: 14, r:14, col:0x5a1a7a, count:2800, op:0.06, sz:2.4 },
        { cx:  4, cy: 24, cz:-25, r:13, col:0x0a3a4a, count:2500, op:0.06, sz:2.3 },
        { cx:-12, cy:-22, cz:-14, r:11, col:0x5a2810, count:2000, op:0.05, sz:2.1 },
        { cx: 28, cy:-10, cz: 18, r:14, col:0x1a2a60, count:2500, op:0.06, sz:2.4 },
        { cx: -5, cy:  5, cz:-30, r:18, col:0x180a40, count:1800, op:0.05, sz:3.0 },
        { cx:-20, cy: 14, cz: -4, r:12, col:0x0a3050, count:1800, op:0.05, sz:2.2 },
        { cx:  8, cy:-16, cz: 22, r:11, col:0x2a1048, count:1600, op:0.05, sz:2.2 },
      ]) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(nb.count * 3);
        for (let i = 0; i < nb.count; i++) {
          const u1=Math.max(1e-10,Math.random()),u2=Math.random();
          const g1=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
          const u3=Math.max(1e-10,Math.random()),u4=Math.random();
          const g2=Math.sqrt(-2*Math.log(u3))*Math.cos(2*Math.PI*u4);
          const u5=Math.max(1e-10,Math.random()),u6=Math.random();
          const g3=Math.sqrt(-2*Math.log(u5))*Math.cos(2*Math.PI*u6);
          pos[i*3]=nb.cx+g1*nb.r*0.38; pos[i*3+1]=nb.cy+g2*nb.r*0.38; pos[i*3+2]=nb.cz+g3*nb.r*0.38;
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        bgGrp.add(new THREE.Points(geo, new THREE.PointsMaterial({
          color: nb.col, size: nb.sz, transparent: true, opacity: nb.op,
          blending: ADD, depthWrite: false, sizeAttenuation: false,
        })));
      }

      // ── Background stars ──────────────────────────────────────────────────────
      function mkStars(count: number, rMin: number, rMax: number, color: number, size: number, op: number) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const r=rMin+Math.random()*(rMax-rMin), th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
          pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.sin(ph)*Math.sin(th); pos[i*3+2]=r*Math.cos(ph);
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        bgGrp.add(new THREE.Points(geo, new THREE.PointsMaterial({
          color, size, transparent: true, opacity: op, blending: ADD, depthWrite: false, sizeAttenuation: false,
        })));
      }
      mkStars(18000, 35, 350, 0xffffff, 1.6, 0.11);
      mkStars( 3000, 20,  80, 0xaabbff, 1.9, 0.07);
      mkStars(  500, 15,  40, 0xfff0cc, 2.6, 0.12);
      mkStars(  900, 25, 150, 0x88aaff, 1.3, 0.06);
      mkStars(  300, 10,  30, 0xffffff, 3.5, 0.18);
      // Milky Way band
      { const geo=new THREE.BufferGeometry(); const pos=new Float32Array(8000*3);
        for (let i=0;i<8000;i++) { const r=80+Math.random()*200,a=Math.random()*Math.PI*2,y=(Math.random()-0.5)*28; pos[i*3]=Math.cos(a)*r; pos[i*3+1]=y; pos[i*3+2]=Math.sin(a)*r; }
        geo.setAttribute("position",new THREE.BufferAttribute(pos,3));
        bgGrp.add(new THREE.Points(geo,new THREE.PointsMaterial({ color:0xaabbff,size:1.2,transparent:true,opacity:0.04,blending:ADD,depthWrite:false,sizeAttenuation:false }))); }


      // ── Comets — occasional fading streaks across deep sky (own meshes for indep. fade) ──
      type Comet = { head: THREE.Mesh; halo: THREE.Mesh; pos: THREE.Vector3; dir: THREE.Vector3; speed: number; t: number; duration: number; active: boolean; startDelay: number };
      const COMET_N = 4;
      const comets: Comet[] = [];
      for (let i = 0; i < COMET_N; i++) {
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.65, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: ADD, depthWrite: false })
        );
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(2.2, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0x88aaff, transparent: true, opacity: 0, blending: ADD, depthWrite: false })
        );
        bgGrp.add(head); bgGrp.add(halo);
        comets.push({ head, halo, pos: new THREE.Vector3(), dir: new THREE.Vector3(),
                      speed: 0, t: 0, duration: 5, active: false, startDelay: i * 9 + Math.random() * 6 });
      }
      // ── Science positions — two rings of 17 nodes ─────────────────────────────
      const NODE_COUNT = SUBS.length * 2;
      const sciPos = fibSph(NODE_COUNT, 10.0);

      // ── Soft glow texture — canvas radial gradient, cached per hex color ──────
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

      // ── Science nodes — three concentric sprite layers per node ──────────────
      //   Layer 0: tight bright core
      //   Layer 1: mid animated glow  ← tracked in sciGlows[] for animation
      //   Layer 2: wide diffuse haze
      const sciGlows:   THREE.Sprite[] = [];
      const sciGlowOps: number[]       = [];
      const sciGlowSzs: number[]       = [];

      for (let i = 0; i < NODE_COUNT; i++) {
        const s = SUBS[i % SUBS.length];
        const isSecond = i >= SUBS.length;
        const cHex = isSecond ? Math.floor(s.hex * 0.55) : s.hex;
        const npos = sciPos[i];
        const tex = getGlowTex(cHex);

        const mkSp = (sz: number, op: number) => {
          const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, opacity:op, blending:ADD, depthWrite:false }));
          sp.scale.set(sz, sz, 1); sp.position.copy(npos); mainGrp.add(sp); return sp;
        };

        // 3D ORB — much smaller (1.7× topic size). Topic = 0.0225, science = 0.038
        const orbR = isSecond ? 0.030 : 0.038;
        const orb = new THREE.Mesh(
          new THREE.SphereGeometry(orbR, 14, 12),
          new THREE.MeshBasicMaterial({ color: cHex, transparent: true, opacity: isSecond ? 0.92 : 1.0 })
        );
        orb.position.copy(npos); mainGrp.add(orb);
        // Colored halo (additive) — orb's own-color glow
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(orbR * 2.4, 12, 10),
          new THREE.MeshBasicMaterial({ color: cHex, transparent: true, opacity: isSecond ? 0.22 : 0.34, blending: ADD, depthWrite: false })
        );
        halo.position.copy(npos); mainGrp.add(halo);
        // Mid glow (animated) — small proportional aura
        const gsz = isSecond ? 0.40 : 0.55;
        const gop = isSecond ? 0.20 : 0.32;
        const gsp = mkSp(gsz, gop);
        sciGlows.push(gsp); sciGlowOps.push(gop); sciGlowSzs.push(gsz);
        // Outer haze — gentle bloom
        mkSp(isSecond ? 0.85 : 1.20, isSecond ? 0.05 : 0.08);
      }

      // ── Graph edges ───────────────────────────────────────────────────────────
      const sciIdx = new Map(SUBS.map((s, i) => [s.id, i]));
      const interE: [THREE.Vector3, THREE.Vector3][] = [];
      for (const [idA, idB] of GRAPH_EDGES) {
        const ia=sciIdx.get(idA), ib=sciIdx.get(idB);
        if (ia==null||ib==null) continue;
        interE.push([sciPos[ia], sciPos[ib]]);
        mainGrp.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([sciPos[ia], sciPos[ib]]),
          new THREE.LineBasicMaterial({ color:0x6688f0, transparent:true, opacity:0.40, blending:ADD, depthWrite:false })
        ));
      }
      // Cross-links: second ring → first ring
      for (let i = 0; i < SUBS.length; i++) {
        const a=sciPos[i], b=sciPos[i+SUBS.length];
        interE.push([a, b]);
        mainGrp.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([a, b]),
          new THREE.LineBasicMaterial({ color:0x556bbb, transparent:true, opacity:0.24, blending:ADD, depthWrite:false })
        ));
      }

      // ── Chain nodes on edges — plasma beads (3D + halo, animated pulse) ───────
      const CN=22, TCN=Math.max(interE.length*CN,1);
      const mkMat = (color: number, op: number) =>
        new THREE.MeshBasicMaterial({ color, transparent:true, opacity:op, blending:ADD, depthWrite:false });
      // Bright plasma core: denser geom, brighter
      const cnM     = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055,10,8), mkMat(0xb8d4ff,0.85), TCN);
      // Plasma halo around each bead — gives the "energy stream" feeling
      const cnMHalo = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16,8,6),  mkMat(0x4470ff,0.22), TCN);
      mainGrp.add(cnM); mainGrp.add(cnMHalo);
      { const dum=new THREE.Object3D(); let idx=0;
        for (const [a,b] of interE) for (let k=0;k<CN;k++) {
          const t=(k+1)/(CN+1),amp=0.55+Math.random()*0.25;
          dum.position.set(a.x+(b.x-a.x)*t+(Math.random()-.5)*amp,a.y+(b.y-a.y)*t+(Math.random()-.5)*amp,a.z+(b.z-a.z)*t+(Math.random()-.5)*amp);
          dum.scale.setScalar(1); dum.updateMatrix();
          cnM.setMatrixAt(idx,dum.matrix); cnMHalo.setMatrixAt(idx,dum.matrix); idx++;
        }
        cnM.instanceMatrix.needsUpdate=true; cnMHalo.instanceMatrix.needsUpdate=true; }

      // ── Local node clouds (3D topics — bluish-white tiny orbs with halo) ──────
      const CPER=80, TIN=SUBS.length*CPER;
      // Solid bluish-white orb body (denser geometry → reads as 3D ball)
      const inM=new THREE.InstancedMesh(new THREE.SphereGeometry(0.0225,10,8),mkMat(0xcfe3ff,0.29),TIN);
      // Soft halo around each topic-orb for subtle glow
      const inMHalo=new THREE.InstancedMesh(new THREE.SphereGeometry(0.05,8,6),mkMat(0x88aaff,0.07),TIN);
      mainGrp.add(inM); mainGrp.add(inMHalo);
      { const dum=new THREE.Object3D();
        for (let si=0;si<SUBS.length;si++) { const sp=sciPos[si];
          for (let j=0;j<CPER;j++) {
            const r=0.5+Math.random()*2.0,th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1);
            dum.position.set(sp.x+r*Math.sin(ph)*Math.cos(th),sp.y+r*Math.sin(ph)*Math.sin(th),sp.z+r*Math.cos(ph));
            dum.scale.setScalar(1); dum.updateMatrix();
            const idx=si*CPER+j; inM.setMatrixAt(idx,dum.matrix); inMHalo.setMatrixAt(idx,dum.matrix);
          }
        }
        inM.instanceMatrix.needsUpdate=true; inMHalo.instanceMatrix.needsUpdate=true; }

      // ── Impulse pulses along edges ────────────────────────────────────────────
      // Wave-current: 4 impulses per edge with staggered phase → looks like flowing plasma current
      const WAVE_PER_EDGE = 4;
      const IMP_N = Math.min(120, interE.length * WAVE_PER_EDGE);
      interface ImpState { edgeIdx:number; t:number; speed:number; phase:number }
      const impStates: ImpState[] = Array.from({length: IMP_N}, (_, i) => {
        const edgeIdx = Math.floor(i / WAVE_PER_EDGE) % interE.length;
        const phaseInGroup = i % WAVE_PER_EDGE;
        return {
          edgeIdx,
          t: -phaseInGroup * 0.16,           // stagger: each group member trails the previous
          speed: 0.0028 + Math.random() * 0.0014,  // unified base speed for whole group
          phase: phaseInGroup * 0.6,         // phase for sin-pulsation
        };
      });
      const impIM=new THREE.InstancedMesh(new THREE.SphereGeometry(0.20,12,10),mkMat(0xddeaff,0.95),IMP_N);
      const impGlowIM=new THREE.InstancedMesh(new THREE.SphereGeometry(0.55,10,8),mkMat(0x5577ff,0.45),IMP_N);
      mainGrp.add(impIM); mainGrp.add(impGlowIM);
      const impD=new THREE.Object3D();

      // ── Mouse / touch parallax ────────────────────────────────────────────────
      let targetRotX=0.20, targetRotY=0.0, currentRotX=0.20, currentRotY=0.0;
      onMMFn=(e:MouseEvent)=>{ targetRotY=((e.clientX/window.innerWidth)-.5)*2*0.55; targetRotX=0.20+((e.clientY/window.innerHeight)-.5)*2*0.30; };
      onTMFn=(e:TouchEvent)=>{ if(!e.touches.length)return; targetRotY=((e.touches[0].clientX/window.innerWidth)-.5)*2*0.55; targetRotX=0.20+((e.touches[0].clientY/window.innerHeight)-.5)*2*0.30; };
      onRSFn=()=>{ const nw=container.clientWidth||window.innerWidth,nh=container.clientHeight||window.innerHeight; camera.aspect=nw/nh; camera.updateProjectionMatrix(); renderer.setSize(nw,nh); };
      window.addEventListener("mousemove",onMMFn);
      window.addEventListener("touchmove",onTMFn,{passive:true});
      window.addEventListener("resize",onRSFn);

      // ── Animation loop ────────────────────────────────────────────────────────
      const clock=new THREE.Clock();
      let lastT = 0;
      function animate() {
        animId=requestAnimationFrame(animate);
        const t=clock.getElapsedTime();
        const dt = Math.min(0.05, t - lastT); lastT = t;
        // Comet system
        for (const c of comets) {
          if (!c.active) {
            c.startDelay -= dt;
            if (c.startDelay <= 0) {
              const r = 200 + Math.random() * 80;
              const th1 = Math.random() * Math.PI * 2;
              const ph1 = Math.acos(2 * Math.random() - 1);
              c.pos.set(r * Math.sin(ph1) * Math.cos(th1), r * Math.sin(ph1) * Math.sin(th1), r * Math.cos(ph1));
              const tg = new THREE.Vector3().crossVectors(c.pos, new THREE.Vector3(0, 1, 0)).normalize();
              c.dir.copy(tg).multiplyScalar(Math.random() < 0.5 ? -1 : 1);
              c.speed = 0.4 + Math.random() * 0.6;
              c.t = 0;
              c.duration = 4 + Math.random() * 3;
              c.active = true;
            }
            (c.head.material as THREE.MeshBasicMaterial).opacity = 0;
            (c.halo.material as THREE.MeshBasicMaterial).opacity = 0;
          } else {
            c.t += dt / c.duration;
            if (c.t >= 1) {
              c.active = false;
              c.startDelay = 8 + Math.random() * 14;
              (c.head.material as THREE.MeshBasicMaterial).opacity = 0;
              (c.halo.material as THREE.MeshBasicMaterial).opacity = 0;
            } else {
              c.pos.addScaledVector(c.dir, c.speed);
              const fade = Math.sin(c.t * Math.PI);
              c.head.position.copy(c.pos);
              c.halo.position.copy(c.pos);
              (c.head.material as THREE.MeshBasicMaterial).opacity = 0.95 * fade;
              (c.halo.material as THREE.MeshBasicMaterial).opacity = 0.40 * fade;
            }
          }
        }

        currentRotX+=(targetRotX-currentRotX)*0.025;
        currentRotY+=(targetRotY-currentRotY)*0.025;
        targetRotY+=0.00040;
        mainGrp.rotation.x=currentRotX; mainGrp.rotation.y=currentRotY;
        bgGrp.rotation.x=currentRotX*0.10; bgGrp.rotation.y=currentRotY*0.10;

        // Pulse mid-glow sprites
        for (let i=0;i<sciGlows.length;i++) {
          const pulse=1+0.09*Math.sin(t*1.5+i*0.72);
          const sz=sciGlowSzs[i]*pulse;
          sciGlows[i].scale.set(sz,sz,1);
          (sciGlows[i].material as THREE.SpriteMaterial).opacity=sciGlowOps[i]*(0.85+0.15*Math.sin(t*2.1+i));
        }

        // Impulse pulses
        for (let i=0;i<IMP_N;i++) {
          const s=impStates[i]; s.t+=s.speed;
          if (s.t>1.08) {
            const groupStart = Math.floor(i / 4) * 4;
            const newEdge = Math.floor(Math.random() * interE.length);
            for (let g = 0; g < 4 && groupStart + g < IMP_N; g++) {
              impStates[groupStart + g].edgeIdx = newEdge;
              impStates[groupStart + g].t = -g * 0.16;
              impStates[groupStart + g].speed = 0.0028 + Math.random() * 0.0014;
            }
            continue;
          }
          const vis=s.t>=0&&s.t<=1;
          if (vis) {
            const[ea,eb]=interE[s.edgeIdx];
            impD.position.lerpVectors(ea,eb,s.t);
            const fade=Math.sin(Math.max(0,Math.min(1,s.t))*Math.PI);
            // Wave pulsation along the current — gives the "flowing AC" feel
            const wave = 0.6 + 0.6 * Math.sin(t * 4.0 + s.phase);
            impD.scale.setScalar(Math.max(0.001, fade * 1.1 * wave));
            impD.updateMatrix();
          } else { impD.position.set(0,0,0); impD.scale.setScalar(0.001); impD.updateMatrix(); }
          impIM.setMatrixAt(i,impD.matrix); impGlowIM.setMatrixAt(i,impD.matrix);
        }
        impIM.instanceMatrix.needsUpdate=true; impGlowIM.instanceMatrix.needsUpdate=true;
        renderer.render(scene,camera);
      }
      animate();
    }

    init().catch(console.error);

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      if (onMMFn) window.removeEventListener("mousemove", onMMFn);
      if (onTMFn) window.removeEventListener("touchmove", onTMFn);
      if (onRSFn) window.removeEventListener("resize",    onRSFn);
      while (container.firstChild) container.removeChild(container.firstChild);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ pointerEvents: "none" }}
    />
  );
}
