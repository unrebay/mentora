"use client";
import { useEffect, useRef } from "react";

interface Node {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  alpha: number;
}

interface Props {
  className?: string;
  count?: number;
}

export default function ParticleField({ className, count = 160 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // TS-safe aliases
    const cvs: HTMLCanvasElement = canvas;
    const c: CanvasRenderingContext2D = ctx;

    let animId: number;
    let mouseX = -9999, mouseY = -9999;
    let nodes: Node[] = [];
    let W = 0, H = 0;

    function resize() {
      W = cvs.offsetWidth;
      H = cvs.offsetHeight;
      cvs.width  = W;
      cvs.height = H;
    }

    function spawnNode(): Node {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.20,
        vy: (Math.random() - 0.5) * 0.20,
        r: Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 0.4 + 0.15,
      };
    }

    function init() {
      resize();
      nodes = Array.from({ length: count }, spawnNode);
    }

    function tick() {
      c.clearRect(0, 0, W, H);

      // Constellation lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            c.beginPath();
            c.moveTo(nodes[i].x, nodes[i].y);
            c.lineTo(nodes[j].x, nodes[j].y);
            c.strokeStyle = `rgba(107,143,255,${(1 - dist / 120) * 0.09})`;
            c.lineWidth = 0.5;
            c.stroke();
          }
        }
      }

      // Nodes
      for (const n of nodes) {
        const dx = mouseX - n.x;
        const dy = mouseY - n.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 180 * 180 && dist2 > 1) {
          const dist = Math.sqrt(dist2);
          const f = ((180 - dist) / 180) * 0.012;
          n.vx += (dx / dist) * f;
          n.vy += (dy / dist) * f;
        }
        n.vx += (Math.random() - 0.5) * 0.008;
        n.vy += (Math.random() - 0.5) * 0.008;
        n.vx *= 0.975;
        n.vy *= 0.975;
        const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (spd > 1.4) { n.vx = (n.vx / spd) * 1.4; n.vy = (n.vy / spd) * 1.4; }
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0) n.x = W; else if (n.x > W) n.x = 0;
        if (n.y < 0) n.y = H; else if (n.y > H) n.y = 0;
        c.beginPath();
        c.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        c.fillStyle = `rgba(107,143,255,${n.alpha})`;
        c.fill();
      }

      animId = requestAnimationFrame(tick);
    }

    const onMove = (e: MouseEvent) => {
      const rect = cvs.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const onLeave = () => { mouseX = -9999; mouseY = -9999; };

    init();
    tick();

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", init);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", init);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ pointerEvents: "none" }}
    />
  );
}
