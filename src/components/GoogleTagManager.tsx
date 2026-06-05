"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

export const GTM_ID = "GTM-W5KSV2KL";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/** Push an event to the GTM dataLayer. Safe no-op until GTM is loaded. */
export function gtmEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
  }
}

/** SPA route-change pageviews: GTM's built-in Page View fires only on the
 *  first load; for client-side navigation we push a virtual page_view.
 *  In GTM, add a Custom Event trigger for "spa_page_view" (or use History Change). */
function GtmPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; } // initial load tracked by GTM itself
    const qs = searchParams?.toString();
    gtmEvent("spa_page_view", { page_path: pathname + (qs ? `?${qs}` : "") });
  }, [pathname, searchParams]);
  return null;
}

export default function GoogleTagManager({ nonce }: { nonce?: string }) {
  return (
    <>
      <Script id="gtm-loader" strategy="afterInteractive" nonce={nonce}>
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
      <Suspense fallback={null}>
        <GtmPageViews />
      </Suspense>
    </>
  );
}
