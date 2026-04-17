"use client";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

interface Node {
  x: number; y: number; z: number;
  vx: number; vy: number;
  r: number;
  kind: 0 | 1 | 2 | 3; // 0=orange, 1=blue, 2=teal, 3=dim
  phase: number;
  phaseSpeed: number;
}

// Orange, Blue, Teal, Dim
const C = ["#FF7A00", "#4561E8", "#00C9E0", "#4C6088"];
const GLOW_MUL = [6, 5, 4, 2.5];

function rgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}

export default function NeuralNetworkCanvas({
  className,
  style,
  count,
}: {
  className?: string;
  style?: CSSProperties;
  count?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ nx: 0.5, ny: 0.5 });

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const canvas: HTMLCanvasElement = el;
    const ctx = canvas.getContext("2d")!;
    let nodes: Node[] = [];
    let raf = 0;
    let t = 0;
    let W = 0, H = 0;

    function make(): Node {
      const rnd = Math.random();
      const kind: 0 | 1 | 2 | 3 = rnd < 0.11 ? 0 : rnd < 0.56 ? 1 : rnd < 0.74 ? 2 : 3;
      const base = kind === 0 ? 3.8 : kind === 1 ? 2.2 : kind === 2 ? 1.6 : 1.0;
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: base + Math.random() * base * 0.5,
        kind,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.004 + Math.random() * 0.014,
      };
    }

    function resize() {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
      const n = count ?? (W < 600 ? 40 : W < 1024 ? 60 : 85);
      nodes = Array.from({ length: n }, make);
      ctx.fillStyle = "#04060f";
      ctx.fillRect(0, 0, W, H);
    }

    function drawNode(x: number, y: number, r: number, col: string, ga: number, ca: number, gm: number) {
      const grd = ctx.createRadialGradient(x, y, 0, x, y, r * gm);
      grd.addColorStop(0, rgba(col, ga));
      grd.addColorStop(0.3, rgba(col, ga * 0.4));
      grd.addColorStop(0.65, rgba(col, ga * 0.1));
      grd.addColorStop(1, rgba(col, 0));
      ctx.beginPath();
      ctx.arc(x, y, r * gm, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(col, ca);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, r * 0.32, 0, Math.PI * 2);
      ctx.fillStyle = rgba("#ffffff", ca * 0.75);
      ctx.fill();
    }

    function frame() {
      t += 0.007;
      ctx.fillStyle = "rgba(4,6,15,0.16)";
      ctx.fillRect(0, 0, W, H);

      const { nx: mx, ny: my } = mouseRef.current;
      nodes.sort((a, b) => a.z - b.z);

      // Connections
      const MAX_D = 170;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const dza = 0.3 + a.z * 0.7;
        const ax = a.x + (mx - 0.5) * 44 * dza;
        const ay = a.y + (my - 0.5) * 28 * dza;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dzb = 0.3 + b.z * 0.7;
          const bx = b.x + (mx - 0.5) * 44 * dzb;
          const by = b.y + (my - 0.5) * 28 * dzb;
          const dx = ax - bx, dy = ay - by;
          const d2 = dx * dx + dy * dy;
          if (d2 > MAX_D * MAX_D) continue;
          const d = Math.sqrt(d2);
          const alpha = (1 - d / MAX_D) * 0.28 * dza;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.strokeStyle = rgba(C[a.kind], alpha);
          ctx.lineWidth = (1 - d / MAX_D) * 0.85;
          ctx.stroke();
        }
      }

      // Nodes
      for (const nd of nodes) {
        nd.phase += nd.phaseSpeed;
        nd.vx += (Math.random() - 0.5) * 0.014;
        nd.vy += (Math.random() - 0.5) * 0.014;
        nd.vx *= 0.977;
        nd.vy *= 0.977;
        nd.x += nd.vx;
        nd.y += nd.vy;
        if (nd.x < -12) nd.x = W + 10;
        else if (nd.x > W + 12) nd.x = -10;
        if (nd.y < -12) nd.y = H + 10;
        else if (nd.y > H + 12) nd.y = -10;

        const pulse = 0.5 + 0.5 * Math.sin(t + nd.phase);
        const dz = 0.3 + nd.z * 0.7;
        const x = nd.x + (mx - 0.5) * 44 * dz;
        const y = nd.y + (my - 0.5) * 28 * dz;
        const r = nd.r * dz;
        const col = C[nd.kind];
        const gm = GLOW_MUL[nd.kind];

        let ga: number, ca: number;
        if (nd.kind === 0)      { ga = 0.55 * pulse * dz; ca = 0.9 * pulse; }
        else if (nd.kind === 1) { ga = 0.32 * pulse * dz; ca = 0.75 * pulse; }
        else if (nd.kind === 2) { ga = 0.24 * pulse * dz; ca = 0.6 * pulse; }
        else                    { ga = 0.07 * dz;          ca = 0.28 * dz; }

        drawNode(x, y, r, col, ga, ca, gm);
      }

      raf = requestAnimationFrame(frame);
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.nx = (e.clientX - rect.left) / rect.width;
      mouseRef.current.ny = (e.clientY - rect.top) / rect.height;
    };

    resize();
    frame();
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%", ...style }}
    />
  );
}
