"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import MeLogo from "@/components/MeLogo";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SOFT_LIMIT = 3;
const DEMO_LIMIT = 5;
const BRAND = "#4561E8";

// Hardcoded dark-glass tokens — DemoChat always sits on the dark hero galaxy,
// regardless of the user's theme. Same values as the dark variant of LandingNav.
const GLASS_BG = "rgba(6,6,18,0.38)";
const GLASS_BLUR = "blur(16px) saturate(1.6) brightness(1.02)";
const GLASS_BORDER = "1px solid rgba(255,255,255,0.09)";
const GLASS_SHADOW =
  "0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 48px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.08) inset";
const TEXT = "rgba(255,255,255,0.92)";
const TEXT_MUTED = "rgba(255,255,255,0.55)";

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>");
}

export default function DemoChat() {
  const t = useTranslations("demo");
  const INITIAL_MESSAGE: Message = { role: "assistant", content: t("initialMessage") };
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [used, setUsed] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [softBannerDismissed, setSoftBannerDismissed] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if ((messages.length > 1 || loading) && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  function adjustTextareaHeight() {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }

  async function sendMessage(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || loading || limitReached) return;
    const userMsg: Message = { role: "user", content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setLoading(true);
    const historyForApi = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history: historyForApi }),
      });
      const data = await res.json();
      if (res.status === 429 || data.error === "demo_limit_reached") {
        setLimitReached(true); setUsed(DEMO_LIMIT); setLoading(false); return;
      }
      if (!res.ok) throw new Error(data.error);
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      const newUsed = data.used ?? used + 1;
      setUsed(newUsed);
      if (data.remaining === 0 || newUsed >= DEMO_LIMIT) setLimitReached(true);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: t("somethingWentWrong") }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const suggestions = t.raw("suggestions") as string[];
  const showSoftBanner = used >= SOFT_LIMIT && !softBannerDismissed && !limitReached;
  const remaining = DEMO_LIMIT - used;
  const canSend = !!input.trim() && !loading && !limitReached;

  return (
    <div className="flex flex-col gap-3" style={{ maxWidth: 560 }}>

      {/* ── 1. Floating header pill (separate glass) ────────────────────── */}
      <div className="self-start flex items-center gap-2.5"
        style={{
          background: GLASS_BG,
          backdropFilter: GLASS_BLUR,
          WebkitBackdropFilter: GLASS_BLUR,
          border: GLASS_BORDER,
          borderRadius: 20,
          boxShadow: GLASS_SHADOW,
          padding: "8px 14px 8px 10px",
        }}
      >
        <div
          className="w-7 h-7 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: "#ffffff",
            border: "1.5px solid rgba(0,0,0,0.08)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          }}
        >
          <MeLogo height={12} colorM="#111111" colorE={BRAND} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-none" style={{ color: TEXT }}>{t("botTitle")}</p>
          <p className="text-[11px] leading-none mt-1 flex items-center gap-1.5" style={{ color: TEXT_MUTED }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
            {t("onlineLabel")}
          </p>
        </div>
      </div>

      {/* ── 2. Messages — each bubble is its own glass element, no wrapper ─ */}
      <div
        ref={messagesContainerRef}
        className="flex flex-col gap-2.5 overflow-y-auto"
        style={{ maxHeight: 360, paddingRight: 4 }}
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
            {m.role === "assistant" && (
              <div
                className="w-7 h-7 rounded-2xl flex items-center justify-center shrink-0 mt-auto mb-0.5"
                style={{
                  background: "#ffffff",
                  border: "1.5px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                }}
              >
                <MeLogo height={12} colorM="#111111" colorE={BRAND} />
              </div>
            )}
            <div
              className="max-w-[80%] px-4 py-2.5 text-[13.5px] leading-[1.6]"
              style={
                m.role === "user"
                  ? {
                      background: `linear-gradient(135deg, ${BRAND}, #6B8FFF)`,
                      color: "white",
                      boxShadow: `0 2px 12px ${BRAND}55, 0 1px 0 rgba(255,255,255,0.15) inset`,
                      borderRadius: "20px 20px 4px 20px",
                    }
                  : {
                      background: GLASS_BG,
                      backdropFilter: GLASS_BLUR,
                      WebkitBackdropFilter: GLASS_BLUR,
                      border: GLASS_BORDER,
                      borderLeft: `2.5px solid ${BRAND}55`,
                      color: TEXT,
                      boxShadow: GLASS_SHADOW,
                      borderRadius: "20px 20px 20px 4px",
                    }
              }
              dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
            />
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start gap-2">
            <div
              className="w-7 h-7 rounded-2xl flex items-center justify-center shrink-0 mt-auto mb-0.5"
              style={{
                background: "#ffffff",
                border: "1.5px solid rgba(0,0,0,0.08)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              }}
            >
              <MeLogo height={12} colorM="#111111" colorE={BRAND} />
            </div>
            <div
              className="px-3.5 py-2.5 flex items-center gap-1"
              style={{
                background: GLASS_BG,
                backdropFilter: GLASS_BLUR,
                WebkitBackdropFilter: GLASS_BLUR,
                border: GLASS_BORDER,
                borderRadius: "20px 20px 20px 4px",
                boxShadow: GLASS_SHADOW,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: TEXT_MUTED, animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: TEXT_MUTED, animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: TEXT_MUTED, animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Suggestions (initial only) ─────────────────────────────── */}
      {messages.length === 1 && !loading && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-[12px] px-3 py-1.5 transition-all hover:scale-[1.03] active:scale-95"
              style={{
                color: TEXT,
                background: GLASS_BG,
                backdropFilter: GLASS_BLUR,
                WebkitBackdropFilter: GLASS_BLUR,
                border: GLASS_BORDER,
                borderRadius: 999,
                boxShadow: GLASS_SHADOW,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── 4. Soft limit banner ───────────────────────────────────────── */}
      {showSoftBanner && (
        <div
          className="px-4 py-2.5 flex items-center justify-between gap-2"
          style={{
            background: "rgba(69,97,232,0.18)",
            backdropFilter: GLASS_BLUR,
            WebkitBackdropFilter: GLASS_BLUR,
            border: "1px solid rgba(107,143,255,0.30)",
            borderRadius: 16,
            boxShadow: GLASS_SHADOW,
          }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium" style={{ color: TEXT }}>
              {t("softBannerRemaining", { n: remaining })}
            </p>
            <Link href="/auth" className="text-[12px] font-semibold hover:underline" style={{ color: "#9DB1FF" }}>
              {t("softBannerCta")}
            </Link>
          </div>
          <button
            onClick={() => setSoftBannerDismissed(true)}
            className="shrink-0 transition-colors p-0.5"
            style={{ color: TEXT_MUTED }}
            aria-label={t("inputAriaClose")}
          >
            <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
        </div>
      )}

      {/* ── 5. Input row — 2 separate glass elements (input pill + send button) ─ */}
      {limitReached ? (
        <div className="flex flex-col gap-2.5">
          <div
            className="flex items-center justify-between gap-3 px-4 py-3"
            style={{
              background: GLASS_BG,
              backdropFilter: GLASS_BLUR,
              WebkitBackdropFilter: GLASS_BLUR,
              border: GLASS_BORDER,
              borderRadius: 16,
              boxShadow: GLASS_SHADOW,
            }}
          >
            <p className="text-xs" style={{ color: TEXT_MUTED }}>{t("hardLimitTitle")}</p>
            <Link
              href="/auth"
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:scale-[1.03]"
              style={{
                background: `linear-gradient(135deg, ${BRAND}, #6B8FFF)`,
                color: "white",
                boxShadow: `0 2px 10px ${BRAND}55`,
              }}
            >
              {t("hardLimitCta")}
            </Link>
          </div>
          <p className="text-[11px] text-center" style={{ color: TEXT_MUTED }}>{t("disclaimer")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {used > 0 && used >= DEMO_LIMIT - 1 && (
            <p className="text-[10px] font-medium px-1" style={{ color: "#fbbf24" }}>
              {DEMO_LIMIT - used} / {DEMO_LIMIT}
            </p>
          )}
          <div className="flex gap-2 items-end">
            {/* Input pill — its own glass element */}
            <div
              className="flex-1"
              style={{
                background: GLASS_BG,
                backdropFilter: GLASS_BLUR,
                WebkitBackdropFilter: GLASS_BLUR,
                border: GLASS_BORDER,
                borderRadius: 22,
                boxShadow: GLASS_SHADOW,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                rows={1}
                onChange={(e) => { setInput(e.target.value); adjustTextareaHeight(); }}
                onKeyDown={handleKey}
                placeholder={t("placeholder")}
                disabled={loading}
                className="w-full disabled:opacity-50 focus:outline-none"
                style={{
                  background: "transparent",
                  color: TEXT,
                  resize: "none",
                  minHeight: "44px",
                  maxHeight: "120px",
                  overflowY: "hidden",
                  lineHeight: "1.5",
                  fontSize: "16px",
                  padding: "12px 16px",
                  WebkitOverflowScrolling: "touch",
                  display: "block",
                }}
              />
            </div>

            {/* Send — separate glass circle */}
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={!canSend}
              className="shrink-0 flex items-center justify-center transition-all disabled:opacity-35 active:scale-95 hover:scale-[1.05]"
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: canSend
                  ? `linear-gradient(135deg, ${BRAND}, #6B8FFF)`
                  : GLASS_BG,
                backdropFilter: GLASS_BLUR,
                WebkitBackdropFilter: GLASS_BLUR,
                border: canSend ? "1px solid transparent" : GLASS_BORDER,
                boxShadow: canSend
                  ? `0 3px 14px ${BRAND}55, 0 1px 0 rgba(255,255,255,0.2) inset`
                  : GLASS_SHADOW,
                color: canSend ? "white" : TEXT_MUTED,
                transition: "background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease, border 0.2s ease",
                alignSelf: "flex-end",
              }}
              aria-label="Send"
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
