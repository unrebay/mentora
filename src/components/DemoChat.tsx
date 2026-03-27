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
    "Привет! Я Алексей — AI-ментор по истории. Спроси меня про любую эпоху, личность или событие — расскажу так, что запомнишь надолго.",
};

const DEMO_LIMIT = 5;

export default function DemoChat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [used, setUsed] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
      setUsed(data.used ?? used + 1);
      if (data.remaining === 0) setLimitReached(true);
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

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden flex flex-col" style={{ maxHeight: 480 }}>
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
            М
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800">Алексей · AI-ментор</p>
            <p className="text-[10px] text-green-500 font-medium">● онлайн сейчас</p>
          </div>
        </div>
        <span className="text-xs text-gray-400 bg-white border border-gray-100 px-2 py-1 rounded-lg">
          📜 История
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
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
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                Я
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
        <div ref={bottomRef} />
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

      {/* Limit reached CTA */}
      {limitReached ? (
        <div className="border-t border-gray-100 px-4 py-4 text-center bg-gradient-to-b from-white to-gray-50 shrink-0">
          <p className="text-xs text-gray-500 mb-2">
            Демо закончилось — но это только начало 🚀
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700 transition-colors"
          >
            Зарегистрироваться бесплатно →
          </Link>
          <p className="text-[10px] text-gray-400 mt-2">30 сообщений в день · бесплатно</p>
        </div>
      ) : (
        /* Input */
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
            placeholder="Спроси про любую эпоху..."
            disabled={loading}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-brand-300 disabled:opacity-50 transition-colors"
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
