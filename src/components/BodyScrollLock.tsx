"use client";
import { useEffect } from "react";

/** Lock document body scroll while this component is mounted.
 *  Restores prior overflow on unmount. */
export default function BodyScrollLock() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);
  return null;
}
