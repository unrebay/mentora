"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

export const YM_ID = 109541532;

/** Fire a Yandex.Metrika goal (conversion). Safe no-op if ym not loaded. */
export function ymGoal(goal: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.ym) {
    window.ym(YM_ID, "reachGoal", goal, params);
  }
}

declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void;
  }
}

function YandexMetrikaHits() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (typeof window === "undefined" || !window.ym) return;
    const qs = searchParams?.toString();
    window.ym(YM_ID, "hit", pathname + (qs ? `?${qs}` : ""));
  }, [pathname, searchParams]);
  return null;
}

export default function YandexMetrika({ nonce }: { nonce?: string }) {
  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive" nonce={nonce}>
        {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=2*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}','ym');ym(${YM_ID},'init',{ssr:true,webvisor:true,clickmap:true,accurateTrackBounce:true,trackLinks:true,defer:true});`}
      </Script>
      <Suspense fallback={null}>
        <YandexMetrikaHits />
      </Suspense>
      <noscript>
        <div><img src={`https://mc.yandex.ru/watch/${YM_ID}`} style={{ position: "absolute", left: "-9999px" }} alt="" /></div>
      </noscript>
    </>
  );
}
