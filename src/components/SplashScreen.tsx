"use client";
import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 600);
    const t2 = setTimeout(() => setVisible(false), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-300"
      style={{ opacity: fading ? 0 : 1, pointerEvents: fading ? "none" : "auto" }}
    >
      <div className="flex items-center gap-2 select-none">
        <div style={{
          background: "linear-gradient(135deg,#4f6ef7,#3b5bdb)",
          borderRadius: "10px",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{ color: "white", fontSize: "22px", fontWeight: 800, lineHeight: 1 }}>M</span>
        </div>
        <span style={{ fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.5px", color: "#111827" }}>
          <span style={{ color: "#3b5bdb", fontStyle: "italic" }}>e</span>ntora
        </span>
      </div>
    </div>
  );
}
