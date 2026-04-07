"use client";
import { useState, useEffect } from "react";
import Logo from "@/components/Logo";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1650);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes mentoraSplashLogo {
          0%   { opacity: 0; transform: scale(0.94); }
          18%  { opacity: 1; transform: scale(1); }
          75%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.03); }
        }
        @keyframes mentoraSplashBg {
          0%, 80% { opacity: 1; }
          100%     { opacity: 0; }
        }
        .mentora-splash {
          animation: mentoraSplashBg 1.6s cubic-bezier(0.4,0,0.2,1) forwards;
          pointer-events: none;
        }
        .mentora-splash-logo {
          animation: mentoraSplashLogo 1.5s cubic-bezier(0.4,0,0.2,1) forwards;
        }
      `}</style>
      <div className="mentora-splash fixed inset-0 z-[9999] flex items-center justify-center bg-white">
        <div className="mentora-splash-logo">
          <Logo size="lg" href="" />
        </div>
      </div>
    </>
  );
}
