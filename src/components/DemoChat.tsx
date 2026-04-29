"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SOFT_LIMIT = 3;  // After this many messages — show dismissible soft banner
const DEMO_LIMIT = 5;  // After this many — disable input entirely

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
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll within the chat container only — never move the page
  useEffect(() => {
    if ((messages.length > 1 || loading) && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || loading || limitReached) return;

    const userMsg: Message = { role: "user", content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // History for API (excluding initial assistant greeting for cleaner context)
    const historyForApi = messages
      .slice(1) // skip initial greeting
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history: historyForApi }),
      });

      const data = await res.json();

      if (res.status === 429 || data.error === "demo_limit_reached") {
        setLimitReached(true);
        setUsed(DEMO_LIMIT);
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
      const newUsed = data.used ?? used + 1;
      setUsed(newUsed);
      if (data.remaining === 0 || newUsed >= DEMO_LIMIT) setLimitReached(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("somethingWentWrong") },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const suggestions = t.raw("suggestions") as string[];

  const showSoftBanner = used >= SOFT_LIMIT && !softBannerDismissed && !limitReached;
  const remaining = DEMO_LIMIT - used;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden flex flex-col" style={{ maxHeight: 480 }}>
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
            М
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800">{t("botTitle")}</p>
            <p className="text-[10px] text-green-500 font-medium">{t("onlineLabel")}</p>
          </div>
        </div>
        <span className="text-xs text-gray-400 bg-white border border-gray-100 px-2 py-1 rounded-lg">
          {t("historyBadge")}
        </span>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}
          >
            {m.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                М
              </div>
            )}
            <div
              className={`max-w-[82%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-50 border border-gray-100 text-gray-700"
              }`}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
            />
            {m.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                {t("userAvatar")}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
              М
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Suggestions (show only when just initial message) */}
      {messages.length === 1 && !loading && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-[10px] px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Soft limit banner — shown after SOFT_LIMIT messages, dismissible */}
      {showSoftBanner && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-xl flex items-center justify-between gap-2 shrink-0"
          style={{ background: "rgba(69,97,232,0.07)", border: "1px solid rgba(69,97,232,0.18)" }}>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-gray-600">
              {t("softBannerRemaining", { n: remaining })}
            </p>
            <Link href="/auth" className="text-[11px] text-brand-600 font-semibold hover:underline">
              {t("softBannerCta")}
            </Link>
          </div>
          <button
            onClick={() => setSoftBannerDismissed(true)}
            className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
            aria-label={t("inputAriaClose")}
          >
            <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
        </div>
      )}

      {/* Hard limit — disable input, show gentle CTA */}
      {limitReached ? (
        <div className="border-t border-gray-100 px-4 py-3 shrink-0" style={{ background: "linear-gradient(to bottom, #fff, #f9fafb)" }}>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs text-gray-500">{t("hardLimitTitle")}</p>
            <Link
              href="/auth"
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shrink-0"
            >
              {t("hardLimitCta")}
            </Link>
          </div>
          {/* Grayed-out disabled input to show what they're missing */}
          <div className="flex gap-2 items-center opacity-35 pointer-events-none select-none">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-400">
              {t("placeholder")}
            </div>
            <div className="w-7 h-7 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">↑</div>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">{t("disclaimer")}</p>
        </div>
      ) : (
        /* Normal input */
        <div className="border-t border-gray-100 px-4 py-3 flex gap-2 items-center shrink-0">
          {used > 0 && used >= DEMO_LIMIT - 1 && (
            <span className="text-[10px] text-amber-500 font-medium shrink-0">
              {DEMO_LIMIT - used} из {DEMO_LIMIT}
            </span>
          )}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={t("placeholder")}
            disabled={loading}
            // fontSize 16px prevents iOS Safari from auto-zooming the page on focus
            style={{ fontSize: "16px" }}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-brand-300 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-white text-xs shrink-0 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ↑
          </button>
        </div>
      )}
    </div>
  );
}
