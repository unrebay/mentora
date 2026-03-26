"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MessageRole } from "@/lib/types";

interface Message {
  role: MessageRole;
  content: string;
}

interface Props {
  subject: string;
  subjectTitle: string;
  initialHistory: { role: string; content: string }[];
}

export default function ChatInterface({ subject, subjectTitle, initialHistory }: Props) {
  const [messages, setMessages] = useState<Message[]>(
    initialHistory.map((m) => ({ role: m.role as MessageRole, content: m.content }))
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          subject,
          history: messages.slice(-10),
        }),
      });

      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Произошла ошибка. Попробуй ещё раз." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
          ←
        </Link>
        <div>
          <h1 className="font-semibold text-gray-900 text-sm">{subjectTitle}</h1>
          <p className="text-xs text-gray-400">AI-ментор · Mentora</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {isEmpty && (
          <div className="text-center pt-12">
            <div className="text-5xl mb-4">🏰</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Привет! Я твой ментор по теме «{subjectTitle}»
            </h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Спроси меня о любом периоде, событии или личности. Я объясню и задам вопрос для закрепления.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {["С чего начать изучение?", "Расскажи о Петре I", "Что такое Смутное время?"].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-brand-300 hover:text-brand-600 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-white border border-gray-100 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-4">
        <form onSubmit={sendMessage} className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Задай вопрос..."
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-40 text-sm"
          >
            →
          </button>
        </form>
      </div>
    </div>
  );
}
