"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import SubjectIcon from "@/components/SubjectIcon";
import posthog from "posthog-js";

// ── Type augmentation ────────────────────────────────────────────────────────
declare global {
  interface Window {
    onMentoraCaptchaSuccess?: (token: string) => void;
    onMentoraCaptchaExpired?: () => void;
    onTelegramAuth?: (user: Record<string, string>) => void;
    Telegram?: { Login?: { auth: (opts: Record<string, unknown>, cb: (u: Record<string, string> | null) => void) => void } };
  }
}

const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "";

// ── Subject data (same as KnowledgeGraph3D) ──────────────────────────────────
const SUBS = [
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

// 75% complete: first 13 subjects are orange, last 4 are dim
const COMPLETED_COUNT = 13;

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
  ["psychology","biology"],["psychology","social-studies"],
  ["psychology","literature"],["psychology","philosophy"],
  ["economics","mathematics"],["economics","social-studies"],
  ["economics","geography"],["economics","philosophy"],
  ["philosophy","literature"],["philosophy","mathematics"],
  ["philosophy","discovery"],["philosophy","world-history"],
];

// ── Auth Galaxy Background (Three.js) ────────────────────────────────────────
function AuthGalaxy() {
  useEffect(() => {
    let animId = 0;
    let disposed = false;
    let canvas: HTMLCanvasElement | null = null;
    let onMMFn: ((e: MouseEvent) => void) | null = null;
    let onRSFn: (() => void) | null = null;

    async function init() {
      const THREE = await import("three");
      if (disposed) return;

      const w = window.innerWidth  || 1280;
      const h = window.innerHeight || 800;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      renderer.setClearColor(0x04060f, 1);
      canvas = renderer.domElement;
      Object.assign(canvas.style, {
        position: "fixed", top: "0", left: "0",
        width: "100vw", height: "100vh",
        zIndex: "0", pointerEvents: "none", display: "block",
      });
      document.body.appendChild(canvas);

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(58, w / h, 0.1, 1000);
      // Pulled back further + tilted up slightly to show full galaxy
      camera.position.set(0, 2.5, 30);
      camera.lookAt(0, 0, 0);

      const ADD = THREE.AdditiveBlending;
      const mkMat = (color: number, op: number) =>
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, blending: ADD, depthWrite: false });

      const mainGrp = new THREE.Group();
      const bgGrp   = new THREE.Group();
      scene.add(mainGrp);
      scene.add(bgGrp);

      // ── Atmosphere spheres ────────────────────────────────────────────────
      for (const [r, color, op] of [[90,0x1a3a7a,0.06],[60,0x0d2255,0.08],[45,0x18083a,0.04]] as [number,number,number][]) {
        scene.add(new THREE.Mesh(new THREE.SphereGeometry(r, 20, 20), new THREE.MeshBasicMaterial({
          color, transparent: true, opacity: op, blending: ADD, depthWrite: false, side: THREE.BackSide,
        })));
      }

      // ── Background stars ──────────────────────────────────────────────────
      function mkStars(count: number, rMin: number, rMax: number, color: number, size: number, op: number) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        function rng(seed: number) { const x = Math.sin(seed) * 73856; return x - Math.floor(x); }
        for (let i = 0; i < count; i++) {
          const r  = rMin + rng(i * 3.7 + 1) * (rMax - rMin);
          const th = rng(i * 7.1 + 2) * Math.PI * 2;
          const ph = Math.acos(2 * rng(i * 11.3 + 3) - 1);
          pos[i*3]   = r * Math.sin(ph) * Math.cos(th);
          pos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
          pos[i*3+2] = r * Math.cos(ph);
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        bgGrp.add(new THREE.Points(geo, new THREE.PointsMaterial({
          color, size, transparent: true, opacity: op, blending: ADD, depthWrite: false, sizeAttenuation: false,
        })));
      }
      mkStars(16000, 35, 300, 0xffffff, 1.5, 0.22);
      mkStars(2500,  20,  80, 0xaabbff, 1.8, 0.14);
      mkStars(400,   15,  40, 0xfff0cc, 2.4, 0.24);
      mkStars(800,   25, 150, 0x88aaff, 1.2, 0.11);

      // Milky Way band
      {
        function rng(s: number) { const x = Math.sin(s) * 73856; return x - Math.floor(x); }
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(6000 * 3);
        for (let i = 0; i < 6000; i++) {
          const r = 80 + rng(i * 2.1) * 200;
          const a = rng(i * 5.3) * Math.PI * 2;
          const y = (rng(i * 8.7) - 0.5) * 26;
          pos[i*3] = Math.cos(a)*r; pos[i*3+1] = y; pos[i*3+2] = Math.sin(a)*r;
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        bgGrp.add(new THREE.Points(geo, new THREE.PointsMaterial({
          color: 0xaabbff, size: 1.1, transparent: true, opacity: 0.07, blending: ADD, depthWrite: false, sizeAttenuation: false,
        })));
      }

      // ── Nebula blobs ───────────────────────────────────────────────────────
      const nebulas = [
        { cx:  20, cy:  8,  cz: -18, r: 12, col: 0x1a3a9a, count: 500, op: 0.20, sz: 2.4 },
        { cx: -22, cy: -5,  cz:  12, r: 10, col: 0x5a0a8a, count: 400, op: 0.18, sz: 2.2 },
        { cx:   4, cy:  20, cz: -22, r:  9, col: 0x0a3a4a, count: 350, op: 0.16, sz: 2.0 },
        { cx: -10, cy: -20, cz: -12, r:  8, col: 0x442210, count: 280, op: 0.15, sz: 1.9 },
        { cx:  26, cy: -8,  cz:  16, r: 10, col: 0x0a2255, count: 360, op: 0.18, sz: 2.3 },
      ];
      function rng(s: number) { const x = Math.sin(s) * 73856; return x - Math.floor(x); }
      let seed = 0;
      for (const nb of nebulas) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(nb.count * 3);
        for (let i = 0; i < nb.count; i++) {
          const u1 = Math.max(1e-10, rng(seed++)); const u2 = rng(seed++);
          const g1 = Math.sqrt(-2*Math.log(u1)) * Math.cos(2*Math.PI*u2);
          const u3 = Math.max(1e-10, rng(seed++)); const u4 = rng(seed++);
          const g2 = Math.sqrt(-2*Math.log(u3)) * Math.cos(2*Math.PI*u4);
          const u5 = Math.max(1e-10, rng(seed++)); const u6 = rng(seed++);
          const g3 = Math.sqrt(-2*Math.log(u5)) * Math.cos(2*Math.PI*u6);
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

      // ── Science positions (Fibonacci sphere, r=11.5 = larger spread) ─────
      function fibSph(n: number, r: number): { x: number; y: number; z: number }[] {
        const pts: { x: number; y: number; z: number }[] = [];
        const phi = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < n; i++) {
          const y   = 1 - (i / (n - 1)) * 2;
          const rad = Math.sqrt(Math.max(0, 1 - y * y));
          pts.push({ x: Math.cos(phi*i)*rad*r, y: y*r, z: Math.sin(phi*i)*rad*r });
        }
        return pts;
      }
      const sciPos = fibSph(SUBS.length, 11.5);

      // ── Nodes ─────────────────────────────────────────────────────────────
      const sciGlows: THREE.Mesh[]   = [];
      const sciGlowOps: number[]     = [];

      for (let i = 0; i < SUBS.length; i++) {
        const s       = SUBS[i];
        const p       = sciPos[i];
        const done    = i < COMPLETED_COUNT;
        // Completed → vivid orange-amber, not done → original dim color
        const cHex    = done ? 0xffa040 : s.hex;
        const cOp     = done ? 0.98 : 0.72;
        const glowOp  = done ? 0.28 : 0.11;
        sciGlowOps.push(glowOp);

        const pos3 = new THREE.Vector3(p.x, p.y, p.z);

        // Core
        mainGrp.add(Object.assign(
          new THREE.Mesh(new THREE.SphereGeometry(done ? 0.38 : 0.28, 12, 10), mkMat(cHex, cOp)),
          { position: pos3.clone() }
        ));
        // Glow
        const glow = new THREE.Mesh(new THREE.SphereGeometry(done ? 0.95 : 0.72, 8, 6), mkMat(cHex, glowOp));
        glow.position.copy(pos3);
        mainGrp.add(glow);
        sciGlows.push(glow);
        // Outer halo (stronger for completed)
        mainGrp.add(Object.assign(
          new THREE.Mesh(new THREE.SphereGeometry(done ? 2.2 : 1.5, 6, 5), mkMat(cHex, done ? 0.07 : 0.020)),
          { position: pos3.clone() }
        ));
      }

      // ── Edges ─────────────────────────────────────────────────────────────
      const sciIdx = new Map(SUBS.map((s, i) => [s.id, i]));
      const interE: [THREE.Vector3, THREE.Vector3][] = [];
      for (const [idA, idB] of GRAPH_EDGES) {
        const ia = sciIdx.get(idA), ib = sciIdx.get(idB);
        if (ia == null || ib == null) continue;
        const pa = new THREE.Vector3(sciPos[ia].x, sciPos[ia].y, sciPos[ia].z);
        const pb = new THREE.Vector3(sciPos[ib].x, sciPos[ib].y, sciPos[ib].z);
        interE.push([pa, pb]);
        // Orange edge if both completed, else blue
        const bothDone = ia < COMPLETED_COUNT && ib < COMPLETED_COUNT;
        mainGrp.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([pa, pb]),
          new THREE.LineBasicMaterial({
            color: bothDone ? 0xff8040 : 0x4466cc,
            transparent: true, opacity: bothDone ? 0.28 : 0.18,
            blending: ADD, depthWrite: false,
          })
        ));
      }

      // ── Chain nodes on edges ─────────────────────────────────────────────
      const CN  = 18;
      const TCN = Math.max(interE.length * CN, 1);
      const cnM = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.030, 5, 4),
        mkMat(0x88aaff, 0.60),
        TCN
      );
      mainGrp.add(cnM);
      {
        const dum = new THREE.Object3D(); let idx = 0;
        function rr(s: number) { const x = Math.sin(s*17.3+5) * 73856; return x - Math.floor(x); }
        for (const [a, b] of interE) for (let k = 0; k < CN; k++) {
          const t = (k+1)/(CN+1);
          const amp = 0.45 + rr(idx)*0.25;
          dum.position.set(
            a.x+(b.x-a.x)*t + (rr(idx*2)-0.5)*amp,
            a.y+(b.y-a.y)*t + (rr(idx*2+1)-0.5)*amp,
            a.z+(b.z-a.z)*t + (rr(idx*2+2)-0.5)*amp,
          );
          dum.scale.setScalar(1); dum.updateMatrix(); cnM.setMatrixAt(idx++, dum.matrix);
        }
        cnM.instanceMatrix.needsUpdate = true;
      }

      // ── Impulse pulses along edges ─────────────────────────────────────────
      const IMP_N = Math.min(50, interE.length * 2);
      interface ImpState { edgeIdx: number; t: number; speed: number; orange: boolean }
      function rr2(s: number) { const x = Math.sin(s*31.7) * 73856; return x - Math.floor(x); }
      const impStates: ImpState[] = Array.from({ length: IMP_N }, (_, i) => {
        const ei = i % interE.length;
        const [a, b] = interE[ei];
        const ia = sciIdx.get(SUBS.find(s => {
          const sp = sciPos[sciIdx.get(s.id)!];
          return Math.abs(sp.x - a.x) < 0.01;
        })?.id ?? "")!;
        const ib = sciIdx.get(SUBS.find(s => {
          const sp = sciPos[sciIdx.get(s.id)!];
          return Math.abs(sp.x - b.x) < 0.01;
        })?.id ?? "")!;
        return {
          edgeIdx: ei,
          t: rr2(i * 7.3),
          speed: 0.0025 + rr2(i * 13.1) * 0.003,
          orange: (ia ?? 0) < COMPLETED_COUNT && (ib ?? 0) < COMPLETED_COUNT,
        };
      });
      const impIM     = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 5, 4), mkMat(0xffc070, 0.92), IMP_N);
      const impIMblue = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 5, 4), mkMat(0xaaccff, 0.88), IMP_N);
      const impGlowIM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.32, 5, 4), mkMat(0xff8844, 0.28), IMP_N);
      mainGrp.add(impIM); mainGrp.add(impIMblue); mainGrp.add(impGlowIM);
      const impD = new THREE.Object3D();

      // ── Mouse parallax ────────────────────────────────────────────────────
      let targetRotX = 0.18, targetRotY = 0.0;
      let currentRotX = 0.18, currentRotY = 0.0;

      onMMFn = (e: MouseEvent) => {
        targetRotY  = ((e.clientX / window.innerWidth)  - 0.5) * 2 * 0.30;
        targetRotX  = 0.18 + ((e.clientY / window.innerHeight) - 0.5) * 2 * 0.18;
      };
      onRSFn = () => {
        const nw = container.clientWidth || window.innerWidth;
        const nh = container.clientHeight || window.innerHeight;
        camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
      };
      window.addEventListener("mousemove", onMMFn);
      window.addEventListener("resize",    onRSFn);

      // ── Animation loop ────────────────────────────────────────────────────
      const clock = new THREE.Clock();

      function animate() {
        animId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        currentRotX += (targetRotX - currentRotX) * 0.03;
        currentRotY += (targetRotY - currentRotY) * 0.03;
        targetRotY  += 0.00045; // very slow auto-spin
        mainGrp.rotation.x = currentRotX;
        mainGrp.rotation.y = currentRotY;
        bgGrp.rotation.x   = currentRotX * 0.08;
        bgGrp.rotation.y   = currentRotY * 0.08;

        // Pulse glows
        for (let i = 0; i < sciGlows.length; i++) {
          const done = i < COMPLETED_COUNT;
          sciGlows[i].scale.setScalar(1 + (done ? 0.12 : 0.06) * Math.sin(t * 1.4 + i * 0.8));
          (sciGlows[i].material as THREE.MeshBasicMaterial).opacity =
            sciGlowOps[i] * (0.80 + 0.20 * Math.sin(t * 2.0 + i));
        }

        // Impulse pulses
        for (let i = 0; i < IMP_N; i++) {
          const s = impStates[i];
          s.t += s.speed;
          if (s.t > 1.08) {
            s.t = -0.08;
            s.edgeIdx = Math.floor(rr2(i * t * 0.01 + i) * interE.length) % interE.length;
            s.speed = 0.0025 + rr2(i * t * 0.02) * 0.003;
          }
          const visible = s.t >= 0 && s.t <= 1;
          if (visible) {
            const [ea, eb] = interE[s.edgeIdx];
            impD.position.lerpVectors(ea, eb, s.t);
            const fade = Math.sin(Math.max(0, Math.min(1, s.t)) * Math.PI);
            impD.scale.setScalar(Math.max(0.001, fade * 1.0));
            impD.updateMatrix();
          } else {
            impD.position.set(0, 0, 0); impD.scale.setScalar(0.001); impD.updateMatrix();
          }
          if (s.orange) {
            impIM.setMatrixAt(i, impD.matrix);
            impGlowIM.setMatrixAt(i, impD.matrix);
            const blank = new THREE.Object3D();
            blank.position.set(0,0,0); blank.scale.setScalar(0.001); blank.updateMatrix();
            impIMblue.setMatrixAt(i, blank.matrix);
          } else {
            impIMblue.setMatrixAt(i, impD.matrix);
            const blank = new THREE.Object3D();
            blank.position.set(0,0,0); blank.scale.setScalar(0.001); blank.updateMatrix();
            impIM.setMatrixAt(i, blank.matrix);
            impGlowIM.setMatrixAt(i, blank.matrix);
          }
        }
        impIM.instanceMatrix.needsUpdate     = true;
        impIMblue.instanceMatrix.needsUpdate = true;
        impGlowIM.instanceMatrix.needsUpdate = true;

        renderer.render(scene, camera);
      }

      animate();
    }

    init().catch(console.error);

    return () => {
      disposed = true;
      cancelAnimationFrame(animId);
      if (onMMFn) window.removeEventListener("mousemove", onMMFn);
      if (onRSFn) window.removeEventListener("resize",    onRSFn);
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  return null;
}

// ── Page entry ───────────────────────────────────────────────────────────────
export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "#04060f" }} />}>
      <AuthPageContent />
    </Suspense>
  );
}

function AuthPageContent() {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [tgLoading, setTgLoading]       = useState(false);
  const [tgAvailable, setTgAvailable]   = useState<null | boolean>(null);
  const [mode, setMode]                 = useState<"signin" | "signup">("signin");
  const [loading, setLoading]           = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [emailSent, setEmailSent]       = useState<string | null>(null);

  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();
  const captchaRef   = useRef<HTMLDivElement>(null);
  const t = useTranslations("auth");

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) setError(t("errorOAuth"));
  }, [searchParams]);

  useEffect(() => {
    window.onMentoraCaptchaSuccess = (token: string) => setCaptchaToken(token);
    window.onMentoraCaptchaExpired = () => setCaptchaToken(null);
    return () => { delete window.onMentoraCaptchaSuccess; delete window.onMentoraCaptchaExpired; };
  }, []);

  useEffect(() => {
    if (!HCAPTCHA_SITE_KEY) return;
    if (document.getElementById("hcaptcha-script")) return;
    const script = document.createElement("script");
    script.id = "hcaptcha-script"; script.src = "https://js.hcaptcha.com/1/api.js";
    script.async = true; script.defer = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => { setCaptchaToken(null); }, [mode]);

  useEffect(() => {
    window.onTelegramAuth = async (user) => {
      setTgLoading(true);
      try {
        const res  = await fetch("/api/auth/telegram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(user) });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        window.location.href = json.action_link;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : t("tryAgain");
        setError(t("errorTelegramLogin") + msg);
        setTgLoading(false);
      }
    };
    const container = document.getElementById("telegram-login-widget");
    if (container && !container.querySelector("script")) {
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute("data-telegram-login", "mentora_su_bot");
      script.setAttribute("data-size", "large"); script.setAttribute("data-radius", "10");
      script.setAttribute("data-onauth", "onTelegramAuth(user)");
      script.setAttribute("data-request-access", "write"); script.setAttribute("data-userpic", "false");
      script.async = true;
      script.onload  = () => setTgAvailable(true);
      script.onerror = () => setTgAvailable(false);
      container.appendChild(script);
    }
    return () => { delete window.onTelegramAuth; };
  }, []);

  async function handleOAuth(provider: "google") {
    setOauthLoading(provider); setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: provider === "google" ? { access_type: "offline", prompt: "consent" } : undefined },
    });
    if (error) { setError(t("errorConnect")); setOauthLoading(null); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null);
    if (mode === "signup") {
      if (HCAPTCHA_SITE_KEY && !captchaToken) { setError(t("errorRobot")); setLoading(false); return; }
      const { data: signUpData, error } = await supabase.auth.signUp({ email, password, options: { captchaToken: captchaToken ?? undefined } });
      if (error) {
        if (error.message.includes("already registered")) setError(t("errorEmailExists"));
        else if (error.message.includes("captcha"))       setError(t("errorCaptcha"));
        else                                               setError(error.message);
      } else {
        const refCode = searchParams.get("ref");
        if (refCode && signUpData.user?.id) {
          fetch("/api/referral", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: refCode, newUserId: signUpData.user.id }) }).catch(() => {});
        }
        if (!signUpData.session) setEmailSent(email);
        else { router.push("/onboarding"); router.refresh(); }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(t("errorCredentials"));
      else { router.push("/dashboard"); router.refresh(); }
    }
    setLoading(false);
  }

  function switchMode(next: "signin" | "signup") { setMode(next); setError(null); }
  const isSignup = mode === "signup";

  // ── Email confirmation screen ─────────────────────────────────────────────
  if (emailSent) {
    return (
      <main className="min-h-screen relative flex items-center justify-center px-4 py-12" style={{ background: "#04060f" }}>
        <div className="fixed inset-0 z-0" style={{ background: "#04060f" }}>
          <AuthGalaxy />
        </div>
        <div className="relative z-10 w-full max-w-sm text-center animate-fade-in-up">
          <div className="flex justify-center mb-10">
            <Logo size="md" textColor="rgba(255,255,255,0.95)" />
          </div>
          <div className="glass rounded-3xl p-8 space-y-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "rgba(69,97,232,0.18)", border: "1px solid rgba(107,143,255,0.25)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B8FFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">{t("checkEmail")}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t("checkEmailDesc")}{" "}<span className="text-white font-semibold">{emailSent}</span>.<br/>{t("checkEmailActivate")}
              </p>
            </div>
            <div className="rounded-xl p-3 text-xs text-gray-500" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {t("checkEmailNoReceive")}{" "}
              <button className="text-[#6B8FFF] hover:underline font-medium" onClick={() => setEmailSent(null)}>{t("tryAgain")}</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Main auth screen ──────────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen" style={{ background: "#04060f" }}>

      {/* ── Three.js Galaxy background ─────────────────────────────────── */}
      <AuthGalaxy />

      {/* ── Left-side gradient so text is readable ─────────────────────── */}
      <div className="fixed inset-0 pointer-events-none hidden lg:block" style={{
        zIndex: 1,
        background: "linear-gradient(to right, rgba(4,6,15,0.92) 0%, rgba(4,6,15,0.80) 35%, rgba(4,6,15,0.30) 58%, rgba(4,6,15,0.05) 100%)",
      }} />
      {/* Mobile overlay */}
      <div className="fixed inset-0 pointer-events-none lg:hidden" style={{
        zIndex: 1,
        background: "rgba(4,6,15,0.70)",
      }} />

      {/* ── Split layout ───────────────────────────────────────────────── */}
      <div className="relative flex min-h-screen" style={{ zIndex: 10 }}>

        {/* ── LEFT: branding + headline ─────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-center px-14 xl:px-20 py-12" style={{ width: "54%" }}>

          <div className="mb-12">
            <Logo size="md" textColor="rgba(255,255,255,0.95)" />
          </div>

          <div className="max-w-lg">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase mb-5"
               style={{ color: "rgba(107,143,255,0.75)" }}>
              {t("leftTagline")}
            </p>

            <h1 className="font-black leading-[1.12] text-white mb-5"
                style={{ fontSize: "clamp(28px, 3.5vw, 48px)" }}>
              {t("leftHeading1")}{" "}{t("leftHeading2")}{" "}
              <span style={{
                background: "linear-gradient(120deg, #6B8FFF 0%, #4561E8 40%, #ffa040 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                {t("leftHeading3")}
              </span>
            </h1>

            <p className="text-base leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.48)" }}>
              {t("leftSubtitle")}
            </p>

            {/* Subject icons row */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {["russian-history","mathematics","physics","chemistry","biology","english","astronomy"].map(id => (
                <SubjectIcon key={id} id={id} size={32} style={{ opacity: 0.60 }} />
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
              <span>{t("leftStats1")}</span>
              <span style={{ color: "rgba(255,255,255,0.12)" }}>·</span>
              <span>{t("leftStats2")}</span>
              <span style={{ color: "rgba(255,255,255,0.12)" }}>·</span>
              <span>{t("leftStats3")}</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: form panel ─────────────────────────────────────── */}
        <div className="w-full lg:w-[46%] flex flex-col items-center justify-center px-5 sm:px-8 py-10 min-h-screen">

          {/* Mobile-only logo */}
          <div className="lg:hidden mb-8">
            <Logo size="sm" textColor="rgba(255,255,255,0.95)" />
          </div>

          {/* Mobile-only headline */}
          <div className="lg:hidden text-center mb-8 max-w-xs">
            <h1 className="font-black leading-tight text-white text-2xl mb-2">
              {t("leftHeading1")}{" "}{t("leftHeading2")}{" "}
              <span style={{
                background: "linear-gradient(120deg, #6B8FFF 0%, #4561E8 40%, #ffa040 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                {t("leftHeading3")}
              </span>
            </h1>
          </div>

          {/* ── Mode toggle pill ─────────────────────────────────────── */}
          <div className="w-full mb-3 animate-fade-in-up" style={{ maxWidth: 420 }}>
            <div className="relative flex p-1 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
              }}>
              <div className="absolute top-1 bottom-1 rounded-xl transition-all duration-200"
                style={{
                  width: "calc(50% - 4px)",
                  left: isSignup ? "calc(50%)" : "4px",
                  background: "rgba(255,255,255,0.11)",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.4)",
                }} />
              <button
                onClick={() => switchMode("signin")}
                className="relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors"
                style={{ zIndex: 1, color: !isSignup ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.32)" }}
              >
                {t("signIn")}
              </button>
              <button
                onClick={() => switchMode("signup")}
                className="relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors"
                style={{ zIndex: 1, color: isSignup ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.32)" }}
              >
                {t("signUpTab")}
              </button>
            </div>
          </div>

          {/* ── Glass card ───────────────────────────────────────────── */}
          <div className="w-full animate-fade-in-up" style={{ maxWidth: 420 }}>
            <div className="rounded-3xl p-7 space-y-4"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.13)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                boxShadow: "0 8px 60px rgba(0,0,0,0.55), 0 2px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.10)",
              }}>

              <div className="mb-1">
                <h2 className="text-xl font-bold text-white">
                  {isSignup ? t("createFreeAccount") : t("welcomeBack")}
                </h2>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {isSignup ? t("noCard") : t("continueLearn")}
                </p>
              </div>

              {/* Google OAuth */}
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={oauthLoading !== null}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all disabled:opacity-60"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)" }}
              >
                {oauthLoading === "google"
                  ? <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "rgba(255,255,255,0.7)" }} />
                  : <GoogleIcon />}
                {t("continueGoogle")}
              </button>

              <div className="relative flex items-center gap-3 py-1">
                <div className="flex-1 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{t("orEmail")}</span>
                <div className="flex-1 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }} />
              </div>

              {/* Email / Password form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>Email</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    required autoComplete="email"
                    className="w-full px-4 py-3 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-[#4561E8] placeholder:text-white/25"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.9)" }}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>{t("password")}</label>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    required minLength={6} autoComplete={isSignup ? "new-password" : "current-password"}
                    className="w-full px-4 py-3 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-[#4561E8] placeholder:text-white/25"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.9)" }}
                    placeholder={isSignup ? t("passwordPlaceholder") : t("passwordPlaceholderSignIn")}
                  />
                </div>

                {isSignup && HCAPTCHA_SITE_KEY && (
                  <div className="flex justify-center py-1">
                    <div ref={captchaRef} className="h-captcha"
                      data-sitekey={HCAPTCHA_SITE_KEY}
                      data-callback="onMentoraCaptchaSuccess"
                      data-expired-callback="onMentoraCaptchaExpired"
                      data-theme="auto" />
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="currentColor">
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                    </svg>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading || oauthLoading !== null}
                  className="btn-glow w-full py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-50 disabled:transform-none">
                  {loading
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("loading")}
                      </span>
                    : <span className="inline-flex items-center justify-center gap-2">
                        {isSignup ? t("createAccountBtn") : t("signInBtn")}
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </span>
                  }
                </button>
              </form>

              <div id="telegram-login-widget" style={{ position:"absolute", opacity:0, width:1, height:1, overflow:"hidden", pointerEvents:"none" }} />

              {/* Telegram button */}
              <div>
                {tgAvailable === false ? (
                  <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 opacity-50" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.19l-2.04 9.6c-.15.68-.54.85-1.1.53l-3-2.21-1.45 1.4c-.16.16-.3.3-.61.3l.21-3.03 5.49-4.96c.24-.21-.05-.33-.37-.12L6.8 14.26l-2.96-.92c-.64-.2-.65-.64.14-.95l11.57-4.46c.53-.2 1 .13.39.26z"/>
                    </svg>
                    {t("telegramUnavailable")}
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={tgLoading || tgAvailable === null}
                    onClick={() => {
                      const tg = window.Telegram;
                      if (tg?.Login?.auth) {
                        tg.Login.auth({ bot_id: 8558784965, request_access: "write" }, (user) => {
                          if (user && window.onTelegramAuth) window.onTelegramAuth(user);
                          else if (!user) setError(t("errorTelegramFailed"));
                        });
                      } else { setError(t("errorTelegramUnavailable")); }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-all disabled:opacity-60"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.7)" }}
                  >
                    {tgLoading ? (
                      <><span className="w-4 h-4 border-2 rounded-full animate-spin"
                          style={{ borderColor: "rgba(255,255,255,0.15)", borderTopColor: "rgba(255,255,255,0.7)" }} />{t("signingInTelegram")}</>
                    ) : tgAvailable === null ? (
                      <><span className="w-4 h-4 border-2 rounded-full animate-spin"
                          style={{ borderColor: "rgba(255,255,255,0.10)", borderTopColor: "rgba(255,255,255,0.4)" }} />{t("checkingTelegram")}</>
                    ) : (
                      <><svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#2AABEE]">
                          <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.94 8.19l-2.04 9.6c-.15.68-.54.85-1.1.53l-3-2.21-1.45 1.4c-.16.16-.3.3-.61.3l.21-3.03 5.49-4.96c.24-.21-.05-.33-.37-.12L6.8 14.26l-2.96-.92c-.64-.2-.65-.64.14-.95l11.57-4.46c.53-.2 1 .13.39.26z"/>
                        </svg>{t("signInTelegram")}</>
                    )}
                  </button>
                )}
              </div>

            </div>{/* /glass card */}
          </div>

          {/* Switch mode link */}
          <p className="text-center text-sm mt-5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {isSignup ? (
              <>{t("hasAccount")}{" "}
                <button onClick={() => switchMode("signin")} className="font-semibold hover:underline" style={{ color: "#6B8FFF" }}>{t("signIn")}</button>
              </>
            ) : (
              <>{t("noAccount")}{" "}
                <button onClick={() => switchMode("signup")} className="font-semibold hover:underline" style={{ color: "#6B8FFF" }}>{t("signUpFreeLink")}</button>
              </>
            )}
          </p>

          {/* Mobile stats */}
          <div className="lg:hidden flex items-center gap-3 mt-6 text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
            <span>{t("leftStats1")}</span>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
            <span>{t("leftStats2")}</span>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
            <span>{t("leftStats3")}</span>
          </div>

        </div>{/* /right panel */}
      </div>{/* /split layout */}
    </main>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
