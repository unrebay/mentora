"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Привет! Я Mentora — твой персональный AI-ментор по истории. Спроси меня про любую эпоху, личность или событие — расскажу так, что запомнишь надолго.",
};

const SOFT_LIMIT = 3;  // After this many messages — show dismissible soft banner
const DEMO_LIMIT = 5;  // After this many — disable input entirely

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>");
}

export default function DemoChat() {
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
        {
          role: "assistant",
          content: "Что-то пошло не так. Попробуй ещё раз.",
        },
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

  const suggestions = [
    "Расскажи про реформы Петра I",
    "Почему пала Римская империя?",
    "Как началась Первая мировая?",
  ];

  const showSoftBanner = used >= SOFT_LIMIT && !softBannerDismissed && !limitReached;
  const remaining = DEMO_LIMIT - used;

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        maxHeight: 480,
        background: "rgba(8,8,20,0.85)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(24px)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between shrink-0"
        style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #4561E8, #6b87ff)" }}
          >
            М
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Mentora · персональный AI-ментор</p>
            <p className="text-[10px] font-medium" style={{ color: "#4ade80" }}>● онлайн сейчас</p>
          </div>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-lg"
          style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          📜 История
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
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 text-white"
                style={{ background: "rgba(69,97,232,0.4)" }}
              >
                М
              </div>
            )}
            <div
              className="max-w-[82%] px-3 py-2 rounded-xl text-xs leading-relaxed"
              style={m.role === "user"
                ? { background: "linear-gradient(135deg, #4561E8, #6b87ff)", color: "white" }
                : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }
              }
              dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
            />
            {m.role === "user" && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
              >
                Я
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 text-white"
              style={{ background: "rgba(69,97,232,0.4)" }}
            >
              М
            </div>
            <div
              className="rounded-xl px-3 py-2 flex items-center gap-1"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "rgba(255,255,255,0.4)", animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "rgba(255,255,255,0.4)", animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "rgba(255,255,255,0.4)", animationDelay: "300ms" }} />
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
              className="text-[10px] px-2.5 py-1 rounded-lg transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)" }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = "rgba(69,97,232,0.5)"; (e.target as HTMLButtonElement).style.color = "#6b87ff"; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.target as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Soft limit banner — shown after SOFT_LIMIT messages, dismissible */}
      {showSoftBanner && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-xl flex items-center justify-between gap-2 shrink-0"
          style={{ background: "rgba(69,97,232,0.1)", border: "1px solid rgba(69,97,232,0.25)" }}>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
              Осталось {remaining} {remaining === 1 ? "сообщение" : "сообщения"} в демо
            </p>
            <Link href="/auth" className="text-[11px] font-semibold hover:underline" style={{ color: "#6b87ff" }}>
              Зарегистрируйся — 30 в день бесплатно →
            </Link>
          </div>
          <button
            onClick={() => setSoftBannerDismissed(true)}
            className="shrink-0 transition-colors p-0.5"
            style={{ color: "rgba(255,255,255,0.35)" }}
            aria-label="Закрыть"
          >
            <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
        </div>
      )}

      {/* Hard limit — disable input, show gentle CTA */}
      {limitReached ? (
        <div className="px-4 py-3 shrink-0" style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Демо-лимит исчерпан 🚀</p>
            <Link
              href="/auth"
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 text-white transition-opacity hover:opacity-80"
              style={{ background: "linear-gradient(135deg, #4561E8, #6b87ff)" }}
            >
              Продолжить бесплатно →
            </Link>
          </div>
          {/* Grayed-out disabled input to show what they're missing */}
          <div className="flex gap-2 items-center opacity-30 pointer-events-none select-none">
            <div className="flex-1 rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
              Напиши Менторе про любую эпоху...
            </div>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>↑</div>
          </div>
          <p className="text-[10px] text-center mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>30 сообщений в день · без карты · бесплатно</p>
        </div>
      ) : (
        /* Normal input */
        <div className="px-4 py-3 flex gap-2 items-center shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {used > 0 && used >= DEMO_LIMIT - 1 && (
            <span className="text-[10px] font-medium shrink-0" style={{ color: "#f59e0b" }}>
              {DEMO_LIMIT - used} из {DEMO_LIMIT}
            </span>
          )}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Напиши Менторе про любую эпоху..."
            disabled={loading}
            // fontSize 16px prevents iOS Safari from auto-zooming the page on focus
            style={{ fontSize: "16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
            className="flex-1 rounded-lg px-3 py-2 focus:outline-none disabled:opacity-50 transition-colors placeholder:text-white/30"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-80"
            style={{ background: "linear-gradient(135deg, #4561E8, #6b87ff)" }}
          >
            ↑
          </button>
        </div>
      )}
    </div>
  );
}
