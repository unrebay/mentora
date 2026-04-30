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

const GRAPH_EDGES: [string, string][] = [
  ["russian-history",  "world-history"],
  ["russian-history",  "literature"],
  ["russian-history",  "russian-language"],
  ["russian-history",  "social-studies"],
  ["russian-history",  "discovery"],
  ["world-history",    "geography"],
  ["world-history",    "english"],
  ["world-history",    "social-studies"],
  ["mathematics",      "physics"],
  ["mathematics",      "computer-science"],
  ["mathematics",      "astronomy"],
  ["physics",          "chemistry"],
  ["physics",          "computer-science"],
  ["physics",          "astronomy"],
  ["chemistry",        "biology"],
  ["biology",          "geography"],
  ["russian-language", "literature"],
  ["russian-language", "english"],
  ["discovery",        "astronomy"],
  ["discovery",        "biology"],
  ["social-studies",   "geography"],
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

    // Build active set from user progress
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
      const w = container.clientWidth || window.innerWidth;
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

      // ─── Scene / Camera ────────────────────────────────────────────────────────
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x060c18);

      const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 1000);
      camera.position.set(0, 3.5, 19);
      camera.lookAt(0, 0, 0);

      // ─── Helpers ───────────────────────────────────────────────────────────────
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
          const y = 1 - (i / (n - 1)) * 2;
          const rad = Math.sqrt(Math.max(0, 1 - y * y));
          const theta = phi * i;
          pts.push(new THREE.Vector3(
            Math.cos(theta) * rad * r,
            y * r,
            Math.sin(theta) * rad * r,
          ));
        }
        return pts;
      }

      // ─── Groups ────────────────────────────────────────────────────────────────
      // mainGrp: all science content – rotates with full mouse speed
      // bgGrp:   background stars   – rotates at 0.10× (parallax)
      const mainGrp = new THREE.Group();
      const bgGrp   = new THREE.Group();
      scene.add(mainGrp);
      scene.add(bgGrp);

      // ─── Atmosphere BackSide shells ────────────────────────────────────────────
      // These sit directly in scene (so large they look static either way)
      const atmData: [number, number, number][] = [
        [90, 0x1a3a7a, 0.10],
        [60, 0x0d2255, 0.14],
        [45, 0x18083a, 0.08],
      ];
      for (const [r, color, op] of atmData) {
        scene.add(new THREE.Mesh(
          new THREE.SphereGeometry(r, 20, 20),
          new THREE.MeshBasicMaterial({
            color, transparent: true, opacity: op,
            blending: ADD, depthWrite: false, side: THREE.BackSide,
          }),
        ));
      }

      // ─── Background star layers ────────────────────────────────────────────────
      function mkStars(
        count: number, rMin: number, rMax: number,
        color: number, size: number, opacity: number,
      ) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const r     = rMin + Math.random() * (rMax - rMin);
          const theta = Math.random() * Math.PI * 2;
          const phi   = Math.acos(2 * Math.random() - 1);
          pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
          pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          pos[i * 3 + 2] = r * Math.cos(phi);
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        bgGrp.add(new THREE.Points(geo, new THREE.PointsMaterial({
          color, size, transparent: true, opacity,
          blending: ADD, depthWrite: false, sizeAttenuation: false,
        })));
      }

      mkStars(22000, 35, 350, 0xffffff,  1.9, 0.55);
      mkStars(4000,  20,  80, 0xaabbff,  2.2, 0.35);
      mkStars(700,   15,  40, 0xfff0cc,  3.0, 0.50);
      mkStars(1200,  25, 150, 0x88aaff,  1.5, 0.25);
      mkStars(500,   10,  30, 0xffffff,  4.0, 0.70);

      // Milky Way band
      {
        const count = 10000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const r     = 80 + Math.random() * 200;
          const angle = Math.random() * Math.PI * 2;
          const y     = (Math.random() - 0.5) * 30;
          pos[i * 3]     = Math.cos(angle) * r;
          pos[i * 3 + 1] = y;
          pos[i * 3 + 2] = Math.sin(angle) * r;
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        bgGrp.add(new THREE.Points(geo, new THREE.PointsMaterial({
          color: 0xaabbff, size: 1.4, transparent: true, opacity: 0.18,
          blending: ADD, depthWrite: false, sizeAttenuation: false,
        })));
      }

      // ─── Science positions (fibonacci sphere, compact) ─────────────────────────
      const sciPos = fibSph(SUBS.length, 5.2);

      // ─── Science nodes (core + glow + halo) ───────────────────────────────────
      const sciGlows: THREE.Mesh[] = [];

      for (let i = 0; i < SUBS.length; i++) {
        const s        = SUBS[i];
        const pos      = sciPos[i];
        const isActive = activeSet.has(s.id);
        const isFull   = FULL_SUBJECTS.has(s.id);
        const coreHex  = isActive ? 0xffa040 : s.hex;
        const coreOp   = isActive ? 0.95 : isFull ? 0.85 : 0.60;

        // Core
        const core = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 10, 8), makeMat(coreHex, coreOp),
        );
        core.position.copy(pos);
        mainGrp.add(core);

        // Glow halo (pulse-animated)
        const glow = new THREE.Mesh(
          new THREE.SphereGeometry(0.60, 8, 6), makeMat(coreHex, isActive ? 0.12 : 0.07),
        );
        glow.position.copy(pos);
        mainGrp.add(glow);
        sciGlows.push(glow);

        // Outer soft halo
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(1.05, 6, 5), makeMat(coreHex, isActive ? 0.045 : 0.022),
        );
        halo.position.copy(pos);
        mainGrp.add(halo);
      }

      // ─── Inter-science edges ───────────────────────────────────────────────────
      const sciIndex = new Map(SUBS.map((s, i) => [s.id, i]));
      const interE: [THREE.Vector3, THREE.Vector3][] = [];

      for (const [idA, idB] of GRAPH_EDGES) {
        const ia = sciIndex.get(idA);
        const ib = sciIndex.get(idB);
        if (ia == null || ib == null) continue;
        interE.push([sciPos[ia], sciPos[ib]]);

        const geo = new THREE.BufferGeometry().setFromPoints([sciPos[ia], sciPos[ib]]);
        mainGrp.add(new THREE.Line(geo, new THREE.LineBasicMaterial({
          color: 0x3355aa, transparent: true, opacity: 0.22,
          blending: ADD, depthWrite: false,
        })));
      }

      // ─── Chain nodes along inter-science edges (InstancedMesh) ────────────────
      const CN  = 14; // nodes per edge
      const TCN = Math.max(interE.length * CN, 1);

      const cnM = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.028, 5, 4),
        makeMat(0x88aaff, 0.60),
        TCN,
      );
      mainGrp.add(cnM);

      {
        const dum = new THREE.Object3D();
        let idx = 0;
        for (const [a, b] of interE) {
          for (let k = 0; k < CN; k++) {
            const t  = (k + 1) / (CN + 1);
            const ox = (Math.random() - 0.5) * 0.50;
            const oy = (Math.random() - 0.5) * 0.50;
            const oz = (Math.random() - 0.5) * 0.50;
            dum.position.set(
              a.x + (b.x - a.x) * t + ox,
              a.y + (b.y - a.y) * t + oy,
              a.z + (b.z - a.z) * t + oz,
            );
            dum.scale.setScalar(1);
            dum.updateMatrix();
            cnM.setMatrixAt(idx++, dum.matrix);
          }
        }
        cnM.instanceMatrix.needsUpdate = true;
      }

      // ─── Inactive knowledge chunks around each science (InstancedMesh) ─────────
      const CPER = 70; // chunks per science
      const TIN  = SUBS.length * CPER;

      const inM = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.021, 4, 3),
        makeMat(0xffffff, 0.27),
        TIN,
      );
      const inM2 = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.056, 4, 3),
        makeMat(0xaabbff, 0.050),
        TIN,
      );
      mainGrp.add(inM);
      mainGrp.add(inM2);

      {
        const dum = new THREE.Object3D();
        for (let si = 0; si < SUBS.length; si++) {
          const sp = sciPos[si];
          for (let j = 0; j < CPER; j++) {
            const idx   = si * CPER + j;
            const r     = 0.5 + Math.random() * 1.8;
            const theta = Math.random() * Math.PI * 2;
            const phi   = Math.acos(2 * Math.random() - 1);
            dum.position.set(
              sp.x + r * Math.sin(phi) * Math.cos(theta),
              sp.y + r * Math.sin(phi) * Math.sin(theta),
              sp.z + r * Math.cos(phi),
            );
            dum.scale.setScalar(1);
            dum.updateMatrix();
            inM.setMatrixAt(idx, dum.matrix);
            inM2.setMatrixAt(idx, dum.matrix);
          }
        }
        inM.instanceMatrix.needsUpdate  = true;
        inM2.instanceMatrix.needsUpdate = true;
      }

      // ─── Active knowledge nodes (for sciences with XP) ────────────────────────
      for (let si = 0; si < SUBS.length; si++) {
        const s = SUBS[si];
        if (!activeSet.has(s.id)) continue;
        const sp = sciPos[si];

        for (let j = 0; j < 6; j++) {
          const r     = 0.3 + Math.random() * 1.4;
          const theta = Math.random() * Math.PI * 2;
          const phi   = Math.acos(2 * Math.random() - 1);
          const node  = new THREE.Mesh(
            new THREE.SphereGeometry(0.048, 6, 5),
            makeMat(0xffa040, 0.85),
          );
          node.position.set(
            sp.x + r * Math.sin(phi) * Math.cos(theta),
            sp.y + r * Math.sin(phi) * Math.sin(theta),
            sp.z + r * Math.cos(phi),
          );
          mainGrp.add(node);
        }
      }

      // ─── Sci-to-chunk chain nodes ──────────────────────────────────────────────
      const SCN    = 5;  // nodes per sci→chunk edge
      const SCEDGE = 3;  // such edges per science
      const TSCN   = SUBS.length * SCEDGE * SCN;

      if (TSCN > 0) {
        const cnM2 = new THREE.InstancedMesh(
          new THREE.SphereGeometry(0.018, 5, 4),
          makeMat(0x6688cc, 0.42),
          TSCN,
        );
        mainGrp.add(cnM2);

        const dum = new THREE.Object3D();
        let idx2  = 0;
        for (let si = 0; si < SUBS.length; si++) {
          const sp = sciPos[si];
          for (let e = 0; e < SCEDGE; e++) {
            const r     = 1.5 + Math.random() * 1.0;
            const theta = Math.random() * Math.PI * 2;
            const phi   = Math.acos(2 * Math.random() - 1);
            const tx    = sp.x + r * Math.sin(phi) * Math.cos(theta);
            const ty    = sp.y + r * Math.sin(phi) * Math.sin(theta);
            const tz    = sp.z + r * Math.cos(phi);

            for (let k = 0; k < SCN; k++) {
              const t = (k + 1) / (SCN + 1);
              dum.position.set(
                sp.x + (tx - sp.x) * t + (Math.random() - 0.5) * 0.20,
                sp.y + (ty - sp.y) * t + (Math.random() - 0.5) * 0.20,
                sp.z + (tz - sp.z) * t + (Math.random() - 0.5) * 0.20,
              );
              dum.scale.setScalar(1);
              dum.updateMatrix();
              cnM2.setMatrixAt(idx2++, dum.matrix);
            }
          }
        }
        cnM2.instanceMatrix.needsUpdate = true;
      }

      // ─── Hero / bright foreground stars ───────────────────────────────────────
      // A handful of larger bright stars scattered around the scene
      {
        const heroGeo = new THREE.BufferGeometry();
        const count = 28;
        const pos   = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const r     = 8 + Math.random() * 18;
          const theta = Math.random() * Math.PI * 2;
          const phi   = Math.acos(2 * Math.random() - 1);
          pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
          pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          pos[i * 3 + 2] = r * Math.cos(phi);
        }
        heroGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        mainGrp.add(new THREE.Points(heroGeo, new THREE.PointsMaterial({
          color: 0xffffff, size: 4.5, transparent: true, opacity: 0.80,
          blending: ADD, depthWrite: false, sizeAttenuation: false,
        })));
        mainGrp.add(new THREE.Points(heroGeo, new THREE.PointsMaterial({
          color: 0xaaccff, size: 10, transparent: true, opacity: 0.22,
          blending: ADD, depthWrite: false, sizeAttenuation: false,
        })));
      }

      // ─── Mouse / touch interaction ─────────────────────────────────────────────
      let targetRotX  = 0.20;
      let targetRotY  = 0.0;
      let currentRotX = 0.20;
      let currentRotY = 0.0;

      onMouseMoveFn = (e: MouseEvent) => {
        const nx = (e.clientX / window.innerWidth  - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        targetRotY = nx * 0.55;
        targetRotX = 0.20 + ny * 0.30;
      };

      onTouchMoveFn = (e: TouchEvent) => {
        if (e.touches.length > 0) {
          const nx = (e.touches[0].clientX / window.innerWidth  - 0.5) * 2;
          const ny = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
          targetRotY = nx * 0.55;
          targetRotX = 0.20 + ny * 0.30;
        }
      };

      onResizeFn = () => {
        const nw = container.clientWidth  || window.innerWidth;
        const nh = container.clientHeight || window.innerHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };

      window.addEventListener("mousemove", onMouseMoveFn);
      window.addEventListener("touchmove", onTouchMoveFn, { passive: true });
      window.addEventListener("resize",    onResizeFn);

      // ─── Animation loop ────────────────────────────────────────────────────────
      const clock = new THREE.Clock();

      function animate() {
        animId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Eased rotation
        currentRotX += (targetRotX - currentRotX) * 0.04;
        currentRotY += (targetRotY - currentRotY) * 0.04;

        // Slow auto-rotation
        targetRotY += 0.00075;

        // Main content rotates fully
        mainGrp.rotation.x = currentRotX;
        mainGrp.rotation.y = currentRotY;

        // Background parallax (10% speed = depth)
        bgGrp.rotation.x = currentRotX * 0.10;
        bgGrp.rotation.y = currentRotY * 0.10;

        // Pulse science glows
        for (let i = 0; i < sciGlows.length; i++) {
          const glow     = sciGlows[i];
          const isActive = activeSet.has(SUBS[i].id);
          const pulse    = 1 + 0.09 * Math.sin(t * 1.5 + i * 0.72);
          glow.scale.setScalar(pulse);
          const m = glow.material as THREE.MeshBasicMaterial;
          m.opacity = (isActive ? 0.12 : 0.07) * (0.88 + 0.12 * Math.sin(t * 2.1 + i));
        }

        renderer.render(scene, camera);
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
      // Remove Three.js canvas
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
