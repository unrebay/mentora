"use client";
import { useEffect } from "react";

/**
 * TiltProvider — global hover-tilt effect for all [data-tilt] elements.
 * Add data-tilt to any card; optionally data-tilt-strength="N" (default 6 deg).
 * Skips tilt on touch devices (no cursor).
 */
export default function TiltProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip on touch-primary devices
    if (window.matchMedia("(hover: none)").matches) return;

    const attached = new WeakSet<Element>();

    function applyTilt(card: HTMLElement, e: MouseEvent) {
      const rect = card.getBoundingClientRect();
      const strength = parseFloat(card.dataset.tiltStrength ?? "6");
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const rotX = (-dy * strength).toFixed(2);
      const rotY = (dx * strength).toFixed(2);
      card.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.018)`;
      card.style.transition = "transform 0.08s ease-out";
      card.style.willChange = "transform";
      card.style.zIndex = "2";
    }

    function resetTilt(card: HTMLElement) {
      card.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)";
      card.style.transition = "transform 0.25s ease-out";
      card.style.zIndex = "";
      // Clean up will-change after transition
      setTimeout(() => { card.style.willChange = ""; }, 280);
    }

    function attach(card: HTMLElement) {
      if (attached.has(card)) return;
      attached.add(card);
      card.addEventListener("mousemove", (e) => applyTilt(card, e as MouseEvent));
      card.addEventListener("mouseleave", () => resetTilt(card));
    }

    function scanAndAttach() {
      document.querySelectorAll<HTMLElement>("[data-tilt]").forEach(attach);
    }

    scanAndAttach();

    // Watch for newly added cards (Next.js client navigation)
    const obs = new MutationObserver(scanAndAttach);
    obs.observe(document.body, { subtree: true, childList: true });

    return () => {
      obs.disconnect();
    };
  }, []);

  return null;
}
