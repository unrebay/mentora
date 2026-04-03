"use client";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";

export function SplashScreen() {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setMounted(false), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes mentoraSplash {
          0%   { opacity: 0; transform: scale(0.94); }
          18%  { opacity: 1; transform: scale(1); }
          75%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.03); }
        }
        .mentora-splash-logo {
          animation: mentoraSplash 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white pointer-events-none">
        <div className="mentora-splash-logo">
          <Logo size="lg" href="" />
        </div>
      </div>
    </>
  );
}
