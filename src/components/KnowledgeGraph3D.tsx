"use client";

import { useEffect, useRef } from "react";

interface UserProgress { subject: string; xp_total: number }
interface Props { className?: string; userProgress?: UserProgress[] }

const FULL_SUBJECTS = new Set(["russian-history"]);

interface SubData { id: string; label: string; hex: number }
const SUBS: SubData[] = [
  { id: "russian-history",  label: "История России",   hex: 0xff6030 },
  { id: "world-history",    label: "Всемирная история", hex: 0xff8844 },
  { id: "mathematics",      label: "Математика",        hex: 0x4488ff },
  { id: "physics",          label: "Физика",            hex: 0x44aaff },
  { id: "chemistry",        label: "Химия",             hex: 0x44ffaa },
  { id: "biology",          label: "Биология",          hex: 0x66ee44 },
  { id: "russian-language", label: "Русский язык",      hex: 0xffcc44 },
  { id: "literature",       label: "Литература",        hex: 0xff88cc },
  { id: "english",          label: "Английский",        hex: 0x88ccff },
  { id: "social-studies",   label: "Обществознание",    hex: 0xffaa44 },
  { id: "geography",        label: "География",         hex: 0x44ddaa },
  { id: "computer-science", label: "Информатика",       hex: 0xaa77ff },
  { id: "astronomy",        label: "Астрономия",        hex: 0xaaddff },
  { id: "discovery",        label: "Открытия",          hex: 0xffdd88 },
];

// Denser graph — more cross-discipline edges
const GRAPH_EDGES: [string, string][] = [
  ["russian-history",  "world-history"],
  ["russian-history",  "literature"],
  ["russian-history",  "russian-language"],
  ["russian-history",  "social-studies"],
  ["russian-history",  "discovery"],
  ["russian-history",  "geography"],
  ["world-history",    "geography"],
  ["world-history",    "english"],
  ["world-history",    "social-studies"],
  ["world-history",    "discovery"],
  ["world-history",    "literature"],
  ["mathematics",      "physics"],
  ["mathematics",      "computer-science"],
  ["mathematics",      "astronomy"],
  ["mathematics",      "chemistry"],
  ["physics",          "chemistry"],
  ["physics",          "computer-science"],
  ["physics",          "astronomy"],
  ["physics",          "discovery"],
  ["chemistry",        "biology"],
  ["chemistry",        "discovery"],
  ["biology",          "geography"],
  ["biology",          "discovery"],
  ["biology",          "chemistry"],
  ["russian-language", "literature"],
  ["russian-language", "english"],
  ["russian-language", "social-studies"],
  ["literature",       "english"],
  ["literature",       "social-studies"],
  ["discovery",        "astronomy"],
  ["discovery",        "computer-science"],
  ["social-studies",   "geography"],
  ["social-studies",   "english"],
  ["geography",        "astronomy"],
  ["computer-science", "mathematics"],
  ["astronomy",        "physics"],
];

export default function KnowledgeGraph3D({ className, userProgress }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    let animId = 0;
    let disposed = false;
    let onMouseMoveFn: ((e: MouseEvent) => void) | null = null;
    let onTouchMoveFn: ((e: TouchEvent) => void) | null = null;
    let onResizeFn: (() => void) | null = null;

    const activeSet = new Set<string>();
    if (userProgress) {
      for (const p of userProgress) {
        if (p.xp_total > 0) activeSet.add(p.subject);
      }
    }

    async function init() {
      const THREE = await import("three");
      if (disposed || !container) return;

      // ─── Renderer ──────────────────────────────────────────────────────────────
      const w = container.clientWidth  || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      renderer.setClearColor(0x06060f, 1);
      Object.assign(renderer.domElement.style, {
        position: "absolute", top: "0", left: "0",
        width: "100%", height: "100%", display: "block",
      });
      container.appendChild(renderer.domElement);

      // ─── Label canvas (2D overlay, pointer-events:none) ────────────────────────
      const labelCanvas = document.createElement("canvas");
      labelCanvas.width  = w;
      labelCanvas.height = h;
      Object.assign(labelCanvas.style, {
        position: "absolute", top: "0", left: "0",
        width: "100%", height: "100%", pointerEvents: "none",
      });
      container.appendChild(labelCanvas);
      const lctx = labelCanvas.getContext("2d")!;

      // ─── Scene / Camera ────────────────────────────────────────────────────────
      const scene  = new THREE.Scene();
      scene.background = new THREE.Color(0x060c18);

      const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
      camera.position.set(0, 3.5, 28);
      camera.lookAt(0, 0, 0);

      const ADD = THREE.AdditiveBlending;

      function makeMat(color: number, opacity: number) {
        return new THREE.MeshBasicMaterial({
          color, transparent: true, opacity, blending: ADD, depthWrite: false,
        });
      }

      function fibSph(n: number, r: number): THREE.Vector3[] {
        const pts: THREE.Vector3[] = [];
        const phi = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < n; i++) {
          const y   = 1 - (i / (n - 1)) * 2;
          const rad = Math.sqrt(Math.max(0, 1 - y * y));
          const th  = phi * i;
          pts.push(new THREE.Vector3(
            Math.cos(th) * rad * r,
            y * r,
            Math.sin(th) * rad * r,
          ));
        }
        return pts;
      }

      // ─── Groups (separate rotation speeds for parallax) ────────────────────────
      const mainGrp = new THREE.Group();
      const bgGrp   = new THREE.Group();
      scene.add(mainGrp);
      scene.add(bgGrp);

      // ─── Atmosphere BackSide shells ────────────────────────────────────────────
      for (const [r, color, op] of [[90, 0x1a3a7a, 0.08], [60, 0x0d2255, 0.11], [45, 0x18083a, 0.06]] as [number, number, number][]) {
        scene.add(new THREE.Mesh(
          new THREE.SphereGeometry(r, 20, 20),
          new THREE.MeshBasicMaterial({
            color, transparent: true, opacity: op,
            blending: ADD, depthWrite: false, side: THREE.BackSide,
          }),
        ));
      }

      // ─── Background stars (slightly dimmer than before) ────────────────────────
      function mkStars(count: number, rMin: number, rMax: number, color: number, size: number, op: number) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const r   = rMin + Math.random() * (rMax - rMin);
          const th  = Math.random() * Math.PI * 2;
          const ph  = Math.acos(2 * Math.random() - 1);
          pos[i*3]   = r * Math.sin(ph) * Math.cos(th);
          pos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
          pos[i*3+2] = r * Math.cos(ph);
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        bgGrp.add(new THREE.Points(geo, new THREE.PointsMaterial({
          color, size, transparent: true, opacity: op,
          blending: ADD, depthWrite: false, sizeAttenuation: false,
        })));
      }

      // Stars dimmed 30% vs original
      mkStars(20000, 35, 350, 0xffffff, 1.7, 0.38);
      mkStars(3500,  20,  80, 0xaabbff, 2.0, 0.24);
      mkStars(600,   15,  40, 0xfff0cc, 2.8, 0.35);
      mkStars(1000,  25, 150, 0x88aaff, 1.4, 0.17);
      mkStars(400,   10,  30, 0xffffff, 3.8, 0.50);

      // Milky Way
      {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(10000 * 3);
        for (let i = 0; i < 10000; i++) {
          const r = 80 + Math.random() * 200;
          const a = Math.random() * Math.PI * 2;
          const y = (Math.random() - 0.5) * 30;
          pos[i*3] = Math.cos(a)*r; pos[i*3+1] = y; pos[i*3+2] = Math.sin(a)*r;
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        bgGrp.add(new THREE.Points(geo, new THREE.PointsMaterial({
          color: 0xaabbff, size: 1.3, transparent: true, opacity: 0.12,
          blending: ADD, depthWrite: false, sizeAttenuation: false,
        })));
      }

      // ─── Science positions ─────────────────────────────────────────────────────
      // Larger radius = bigger galaxy, camera pulled back proportionally
      const sciPos = fibSph(SUBS.length, 8.0);

      // ─── Science nodes ─────────────────────────────────────────────────────────
      const sciGlows: THREE.Mesh[] = [];

      for (let i = 0; i < SUBS.length; i++) {
        const s        = SUBS[i];
        const pos      = sciPos[i];
        const isActive = activeSet.has(s.id);
        const isFull   = FULL_SUBJECTS.has(s.id);
        const cHex     = isActive ? 0xffa040 : s.hex;
        const cOp      = isActive ? 0.95 : isFull ? 0.85 : 0.65;

        // Core
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.30, 12, 10), makeMat(cHex, cOp));
        core.position.copy(pos);
        mainGrp.add(core);

        // Glow (pulsed)
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.80, 8, 6), makeMat(cHex, isActive ? 0.14 : 0.08));
        glow.position.copy(pos);
        mainGrp.add(glow);
        sciGlows.push(glow);

        // Outer halo
        const halo = new THREE.Mesh(new THREE.SphereGeometry(1.50, 6, 5), makeMat(cHex, isActive ? 0.05 : 0.025));
        halo.position.copy(pos);
        mainGrp.add(halo);
      }

      // ─── Inter-science edges ───────────────────────────────────────────────────
      const sciIdx = new Map(SUBS.map((s, i) => [s.id, i]));
      const interE: [THREE.Vector3, THREE.Vector3][] = [];

      for (const [idA, idB] of GRAPH_EDGES) {
        const ia = sciIdx.get(idA);
        const ib = sciIdx.get(idB);
        if (ia == null || ib == null) continue;
        interE.push([sciPos[ia], sciPos[ib]]);

        mainGrp.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([sciPos[ia], sciPos[ib]]),
          new THREE.LineBasicMaterial({ color: 0x3355aa, transparent: true, opacity: 0.20, blending: ADD, depthWrite: false }),
        ));
      }

      // ─── Chain nodes along inter-science edges ────────────────────────────────
      // 22 nodes per edge with wider zigzag spread
      const CN  = 22;
      const TCN = Math.max(interE.length * CN, 1);
      const cnM = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.032, 5, 4), makeMat(0x88aaff, 0.58), TCN,
      );
      mainGrp.add(cnM);

      {
        const dum = new THREE.Object3D();
        let idx = 0;
        for (const [a, b] of interE) {
          for (let k = 0; k < CN; k++) {
            const t   = (k + 1) / (CN + 1);
            const amp = 0.55 + Math.random() * 0.25;
            dum.position.set(
              a.x + (b.x - a.x) * t + (Math.random() - 0.5) * amp,
              a.y + (b.y - a.y) * t + (Math.random() - 0.5) * amp,
              a.z + (b.z - a.z) * t + (Math.random() - 0.5) * amp,
            );
            dum.scale.setScalar(1);
            dum.updateMatrix();
            cnM.setMatrixAt(idx++, dum.matrix);
          }
        }
        cnM.instanceMatrix.needsUpdate = true;
      }

      // ─── Inactive knowledge chunks around each science ─────────────────────────
      // 110 chunks/science, spread across r=0.5–2.2
      const CPER = 110;
      const TIN  = SUBS.length * CPER;

      const inM  = new THREE.InstancedMesh(new THREE.SphereGeometry(0.024, 4, 3), makeMat(0xffffff, 0.28), TIN);
      const inM2 = new THREE.InstancedMesh(new THREE.SphereGeometry(0.062, 4, 3), makeMat(0xaabbff, 0.05), TIN);
      mainGrp.add(inM);
      mainGrp.add(inM2);

      {
        const dum = new THREE.Object3D();
        for (let si = 0; si < SUBS.length; si++) {
          const sp = sciPos[si];
          for (let j = 0; j < CPER; j++) {
            const r   = 0.5 + Math.random() * 2.2;
            const th  = Math.random() * Math.PI * 2;
            const ph  = Math.acos(2 * Math.random() - 1);
            dum.position.set(
              sp.x + r * Math.sin(ph) * Math.cos(th),
              sp.y + r * Math.sin(ph) * Math.sin(th),
              sp.z + r * Math.cos(ph),
            );
            dum.scale.setScalar(1);
            dum.updateMatrix();
            inM.setMatrixAt(si * CPER + j, dum.matrix);
            inM2.setMatrixAt(si * CPER + j, dum.matrix);
          }
        }
        inM.instanceMatrix.needsUpdate  = true;
        inM2.instanceMatrix.needsUpdate = true;
      }

      // ─── Active nodes ──────────────────────────────────────────────────────────
      for (let si = 0; si < SUBS.length; si++) {
        if (!activeSet.has(SUBS[si].id)) continue;
        const sp = sciPos[si];
        for (let j = 0; j < 8; j++) {
          const r  = 0.4 + Math.random() * 1.6;
          const th = Math.random() * Math.PI * 2;
          const ph = Math.acos(2 * Math.random() - 1);
          const m  = new THREE.Mesh(new THREE.SphereGeometry(0.052, 6, 5), makeMat(0xffa040, 0.85));
          m.position.set(
            sp.x + r * Math.sin(ph) * Math.cos(th),
            sp.y + r * Math.sin(ph) * Math.sin(th),
            sp.z + r * Math.cos(ph),
          );
          mainGrp.add(m);
        }
      }

      // ─── Sci→subtopic chain nodes (radial spokes) ─────────────────────────────
      // 8 spokes per science × 6 nodes each = rich web around every node
      const SCN    = 6;
      const SCEDGE = 8;
      const TSCN   = SUBS.length * SCEDGE * SCN;

      const cnM2 = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.020, 5, 4), makeMat(0x6688cc, 0.40), TSCN,
      );
      mainGrp.add(cnM2);

      {
        const dum = new THREE.Object3D();
        let idx2 = 0;
        for (let si = 0; si < SUBS.length; si++) {
          const sp = sciPos[si];
          for (let e = 0; e < SCEDGE; e++) {
            const r   = 1.6 + Math.random() * 1.4;
            const th  = Math.random() * Math.PI * 2;
            const ph  = Math.acos(2 * Math.random() - 1);
            const tx  = sp.x + r * Math.sin(ph) * Math.cos(th);
            const ty  = sp.y + r * Math.sin(ph) * Math.sin(th);
            const tz  = sp.z + r * Math.cos(ph);

            // Draw thin line for spoke
            mainGrp.add(new THREE.Line(
              new THREE.BufferGeometry().setFromPoints([sp, new THREE.Vector3(tx, ty, tz)]),
              new THREE.LineBasicMaterial({ color: 0x334488, transparent: true, opacity: 0.12, blending: ADD, depthWrite: false }),
            ));

            for (let k = 0; k < SCN; k++) {
              const t = (k + 1) / (SCN + 1);
              dum.position.set(
                sp.x + (tx - sp.x) * t + (Math.random() - 0.5) * 0.22,
                sp.y + (ty - sp.y) * t + (Math.random() - 0.5) * 0.22,
                sp.z + (tz - sp.z) * t + (Math.random() - 0.5) * 0.22,
              );
              dum.scale.setScalar(1);
              dum.updateMatrix();
              cnM2.setMatrixAt(idx2++, dum.matrix);
            }
          }
        }
        cnM2.instanceMatrix.needsUpdate = true;
      }

      // ─── Hero foreground stars ─────────────────────────────────────────────────
      {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(30 * 3);
        for (let i = 0; i < 30; i++) {
          const r  = 10 + Math.random() * 22;
          const th = Math.random() * Math.PI * 2;
          const ph = Math.acos(2 * Math.random() - 1);
          pos[i*3] = r*Math.sin(ph)*Math.cos(th);
          pos[i*3+1] = r*Math.sin(ph)*Math.sin(th);
          pos[i*3+2] = r*Math.cos(ph);
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        mainGrp.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 4.2, transparent: true, opacity: 0.75, blending: ADD, depthWrite: false, sizeAttenuation: false })));
        mainGrp.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xaaccff, size: 9.0, transparent: true, opacity: 0.20, blending: ADD, depthWrite: false, sizeAttenuation: false })));
      }

      // ─── Mouse / touch ─────────────────────────────────────────────────────────
      let targetRotX  = 0.20;
      let targetRotY  = 0.0;
      let currentRotX = 0.20;
      let currentRotY = 0.0;

      onMouseMoveFn = (e: MouseEvent) => {
        targetRotY = ((e.clientX / window.innerWidth)  - 0.5) * 2 * 0.55;
        targetRotX = 0.20 + ((e.clientY / window.innerHeight) - 0.5) * 2 * 0.30;
      };
      onTouchMoveFn = (e: TouchEvent) => {
        if (!e.touches.length) return;
        targetRotY = ((e.touches[0].clientX / window.innerWidth)  - 0.5) * 2 * 0.55;
        targetRotX = 0.20 + ((e.touches[0].clientY / window.innerHeight) - 0.5) * 2 * 0.30;
      };
      onResizeFn = () => {
        const nw = container.clientWidth  || window.innerWidth;
        const nh = container.clientHeight || window.innerHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
        labelCanvas.width  = nw;
        labelCanvas.height = nh;
      };

      window.addEventListener("mousemove", onMouseMoveFn);
      window.addEventListener("touchmove", onTouchMoveFn, { passive: true });
      window.addEventListener("resize",    onResizeFn);

      // ─── Label drawing ─────────────────────────────────────────────────────────
      function drawLabels() {
        const cw = labelCanvas.width;
        const ch = labelCanvas.height;
        lctx.clearRect(0, 0, cw, ch);
        lctx.font = "bold 12px 'Inter', 'Helvetica Neue', Arial, sans-serif";
        lctx.textAlign = "center";

        const tmp = new THREE.Vector3();

        for (let i = 0; i < SUBS.length; i++) {
          const s    = SUBS[i];
          const wp   = sciPos[i].clone();
          // Transform by mainGrp world matrix
          wp.applyMatrix4(mainGrp.matrixWorld);
          tmp.copy(wp);
          tmp.project(camera);

          // Skip if behind camera
          if (tmp.z >= 1) continue;

          const sx = (tmp.z > 0.999) ? -999 : (tmp.x * 0.5 + 0.5) * cw;
          const sy = (-tmp.y * 0.5 + 0.5) * ch;

          const isActive = activeSet.has(s.id);
          const baseColor = isActive ? "255,160,64" : "200,220,255";

          // Depth-based opacity fade (labels further away = slightly faded)
          const depth  = Math.max(0, Math.min(1, 1 - (tmp.z * 0.5 + 0.5)));
          const alpha  = Math.max(0.4, depth) * (isActive ? 0.98 : 0.88);

          // Background pill
          const metrics = lctx.measureText(s.label);
          const pw = metrics.width + 10;
          const ph = 16;
          const px = sx - pw / 2;
          const py = sy + 16;

          lctx.fillStyle = `rgba(6,6,15,${(alpha * 0.65).toFixed(2)})`;
          lctx.beginPath();
          lctx.roundRect(px, py, pw, ph, 4);
          lctx.fill();

          // Text
          lctx.fillStyle = `rgba(${baseColor},${alpha.toFixed(2)})`;
          lctx.fillText(s.label, sx, py + 11.5);
        }
      }

      // ─── Animation loop ────────────────────────────────────────────────────────
      const clock = new THREE.Clock();

      function animate() {
        animId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        currentRotX += (targetRotX - currentRotX) * 0.04;
        currentRotY += (targetRotY - currentRotY) * 0.04;
        targetRotY  += 0.00070;

        mainGrp.rotation.x = currentRotX;
        mainGrp.rotation.y = currentRotY;
        bgGrp.rotation.x   = currentRotX * 0.10;
        bgGrp.rotation.y   = currentRotY * 0.10;

        // Pulse glows
        for (let i = 0; i < sciGlows.length; i++) {
          const g  = sciGlows[i];
          const ia = activeSet.has(SUBS[i].id);
          g.scale.setScalar(1 + 0.09 * Math.sin(t * 1.5 + i * 0.72));
          (g.material as THREE.MeshBasicMaterial).opacity =
            (ia ? 0.14 : 0.08) * (0.88 + 0.12 * Math.sin(t * 2.1 + i));
        }

        renderer.render(scene, camera);

        // Draw 2D labels on top (matrices are current after render)
        mainGrp.updateMatrixWorld(true);
        drawLabels();
      }

      animate();
    }

    init().catch(console.error);

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      if (onMouseMoveFn) window.removeEventListener("mousemove",  onMouseMoveFn);
      if (onTouchMoveFn) window.removeEventListener("touchmove",  onTouchMoveFn);
      if (onResizeFn)    window.removeEventListener("resize",     onResizeFn);
      while (container.firstChild) container.removeChild(container.firstChild);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ background: "#06060f" }}
    />
  );
}
