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
    <div
      className="flex flex-col overflow-hidden"
      style={{
        maxHeight: 520,
        background: "var(--bg-nav)",
        backdropFilter: "blur(20px) saturate(1.6) brightness(1.02)",
        WebkitBackdropFilter: "blur(20px) saturate(1.6) brightness(1.02)",
        border: "1px solid var(--border-light)",
        borderRadius: 20,
        boxShadow: "0 12px 40px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.06) inset",
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: "#ffffff",
              border: "1.5px solid rgba(0,0,0,0.08)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
            }}
          >
            <MeLogo height={14} colorM="#111111" colorE={BRAND} />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{t("botTitle")}</p>
            <p className="text-[10px] font-medium flex items-center gap-1.5" style={{ color: "#22c55e" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
              {t("onlineLabel")}
            </p>
          </div>
        </div>
        <span
          className="text-[10px] px-2.5 py-1 rounded-lg font-medium"
          style={{
            color: "var(--text-muted)",
            background: "var(--chat-msg-bg)",
            border: "1px solid var(--chat-msg-border)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {t("historyBadge")}
        </span>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
            {m.role === "assistant" && (
              <div
                className="w-6 h-6 rounded-2xl flex items-center justify-center shrink-0 mt-auto mb-0.5"
                style={{
                  background: "#ffffff",
                  border: "1.5px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.10)",
                }}
              >
                <MeLogo height={11} colorM="#111111" colorE={BRAND} />
              </div>
            )}
            <div
              className="max-w-[82%] px-3.5 py-2.5 text-[13px] leading-[1.55]"
              style={
                m.role === "user"
                  ? {
                      background: `linear-gradient(135deg, ${BRAND}, #6B8FFF)`,
                      color: "white",
                      boxShadow: `0 2px 10px ${BRAND}55, 0 1px 0 rgba(255,255,255,0.15) inset`,
                      borderRadius: "16px 16px 4px 16px",
                    }
                  : {
                      background: "var(--chat-msg-bg)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      border: "1px solid var(--chat-msg-border)",
                      borderLeft: `2px solid ${BRAND}55`,
                      color: "var(--text)",
                      boxShadow: "var(--chat-msg-shadow)",
                      borderRadius: "16px 16px 16px 4px",
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
              className="w-6 h-6 rounded-2xl flex items-center justify-center shrink-0 mt-auto mb-0.5"
              style={{
                background: "#ffffff",
                border: "1.5px solid rgba(0,0,0,0.08)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.10)",
              }}
            >
              <MeLogo height={11} colorM="#111111" colorE={BRAND} />
            </div>
            <div
              className="px-3 py-2 flex items-center gap-1"
              style={{
                background: "var(--chat-msg-bg)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid var(--chat-msg-border)",
                borderRadius: "16px 16px 16px 4px",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--text-muted)", animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--text-muted)", animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--text-muted)", animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length === 1 && !loading && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-[11px] px-2.5 py-1 rounded-lg transition-all hover:scale-[1.02]"
              style={{
                color: "var(--text-muted)",
                background: "var(--chat-msg-bg)",
                border: "1px solid var(--chat-msg-border)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Soft limit banner */}
      {showSoftBanner && (
        <div
          className="mx-3 mb-2 px-3 py-2 rounded-xl flex items-center justify-between gap-2 shrink-0"
          style={{ background: "rgba(69,97,232,0.10)", border: "1px solid rgba(69,97,232,0.22)" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium" style={{ color: "var(--text)" }}>
              {t("softBannerRemaining", { n: remaining })}
            </p>
            <Link href="/auth" className="text-[11px] font-semibold hover:underline" style={{ color: BRAND }}>
              {t("softBannerCta")}
            </Link>
          </div>
          <button
            onClick={() => setSoftBannerDismissed(true)}
            className="shrink-0 transition-colors p-0.5"
            style={{ color: "var(--text-muted)" }}
            aria-label={t("inputAriaClose")}
          >
            <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
        </div>
      )}

      {/* Hard limit */}
      {limitReached ? (
        <div className="px-4 py-3 shrink-0" style={{ borderTop: "1px solid var(--border-light)" }}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("hardLimitTitle")}</p>
            <Link
              href="/auth"
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-[1.02]"
              style={{
                background: `linear-gradient(135deg, ${BRAND}, #6B8FFF)`,
                color: "white",
                boxShadow: `0 2px 10px ${BRAND}55`,
              }}
            >
              {t("hardLimitCta")}
            </Link>
          </div>
          <div className="flex gap-2 items-center opacity-35 pointer-events-none select-none">
            <div
              className="flex-1 px-3 py-2 text-xs"
              style={{
                background: "var(--bg-nav)",
                border: "1px solid var(--border-light)",
                borderRadius: 22,
                color: "var(--text-muted)",
              }}
            >
              {t("placeholder")}
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg-nav)", border: "1px solid var(--border-light)", color: "var(--text-muted)" }}
            >
              ↑
            </div>
          </div>
          <p className="text-[10px] text-center mt-2" style={{ color: "var(--text-muted)" }}>{t("disclaimer")}</p>
        </div>
      ) : (
        /* Normal input — same 2-element row as real ChatInterface */
        <div className="px-3 py-3 shrink-0" style={{ borderTop: "1px solid var(--border-light)" }}>
          {used > 0 && used >= DEMO_LIMIT - 1 && (
            <p className="text-[10px] font-medium mb-2 px-1" style={{ color: "#f59e0b" }}>
              {DEMO_LIMIT - used} / {DEMO_LIMIT}
            </p>
          )}
          <div className="flex gap-2 items-end">
            {/* Input — full glass pill identical to nav pill */}
            <div
              className="flex-1 transition-all"
              style={{
                background: "var(--bg-nav)",
                backdropFilter: "blur(16px) saturate(1.6) brightness(1.02)",
                WebkitBackdropFilter: "blur(16px) saturate(1.6) brightness(1.02)",
                border: "1px solid var(--border-light)",
                borderRadius: 22,
                boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 2px 12px rgba(0,0,0,0.08)",
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
                  color: "var(--text)",
                  resize: "none",
                  minHeight: "40px",
                  maxHeight: "120px",
                  overflowY: "hidden",
                  lineHeight: "1.5",
                  fontSize: "16px",
                  padding: "10px 14px",
                  WebkitOverflowScrolling: "touch",
                  display: "block",
                }}
              />
            </div>

            {/* Send — glass circle, lights up brand when ready */}
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={!canSend}
              className="shrink-0 flex items-center justify-center transition-all disabled:opacity-35 active:scale-95 hover:scale-[1.05]"
              style={{
                width: 40, height: 40, borderRadius: "50%",
                background: canSend
                  ? `linear-gradient(135deg, ${BRAND}, #6B8FFF)`
                  : "var(--bg-nav)",
                backdropFilter: "blur(16px) saturate(1.6) brightness(1.02)",
                WebkitBackdropFilter: "blur(16px) saturate(1.6) brightness(1.02)",
                border: canSend ? "1px solid transparent" : "1px solid var(--border-light)",
                boxShadow: canSend
                  ? `0 3px 14px ${BRAND}55, 0 1px 0 rgba(255,255,255,0.2) inset`
                  : "0 2px 12px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.12) inset",
                color: canSend ? "white" : "var(--text-muted)",
                transition: "background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease, border 0.2s ease",
                alignSelf: "flex-end",
              }}
              aria-label="Send"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
