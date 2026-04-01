"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MessageRole } from "@/lib/types";

const DAILY_LIMIT = 30;

interface Message {
  role: MessageRole;
  content: string;
}

interface Props {
  subject: string;
  subjectTitle: string;
  initialHistory: { role: string; content: string }[];
  initialMessagesRemaining: number | null; // null = Pro (unlimited)
  initialTopic?: string; // pre-fill input from topics map
}

// Inline text: **bold**, *italic*, `code`
function parseInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return <code key={i} className="bg-gray-100 text-gray-800 rounded px-1 text-sm font-mono">{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// Full markdown block renderer
function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let orderedBuffer: string[] = [];
  let keyIdx = 0;

  const flushLists = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${keyIdx++}`} className="space-y-1.5 my-2 ml-1">
          {listBuffer.map((item, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
              <span className="flex-1">{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
    if (orderedBuffer.length > 0) {
      elements.push(
        <ol key={`ol-${keyIdx++}`} className="space-y-1.5 my-2 ml-1">
          {orderedBuffer.map((item, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="shrink-0 text-brand-500 font-semibold text-sm min-w-[18px]">{i + 1}.</span>
              <span className="flex-1">{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      orderedBuffer = [];
    }
  };

  for (const line of lines) {
    if (line.match(/^[-•*—] /)) {
      if (orderedBuffer.length > 0) flushLists();
      listBuffer.push(line.slice(2));
      continue;
    }
    const orderedMatch = line.match(/^\d+\.\s+(.+)/);
    if (orderedMatch) {
      if (listBuffer.length > 0) flushLists();
      orderedBuffer.push(orderedMatch[1]);
      continue;
    }
    flushLists();
    if (line.match(/^#{1,3} /)) {
      const text = line.replace(/^#{1,3} /, "");
      elements.push(<p key={keyIdx++} className="font-semibold mt-3 mb-1">{parseInline(text)}</p>);
      continue;
    }
    if (line.trim() === "") {
      if (elements.length > 0) elements.push(<div key={keyIdx++} className="h-2" />);
      continue;
    }
    elements.push(<p key={keyIdx++} className="leading-relaxed">{parseInline(line)}</p>);
  }
  flushLists();
  return <div className="space-y-0.5 text-[15px]">{elements}</div>;
}

export default function ChatInterface({ subject, subjectTitle, initialHistory, initialMessagesRemaining, initialTopic }: Props) {
  const [messages, setMessages] = useState<Message[]>(
    initialHistory.map((m) => ({ role: m.role as MessageRole, content: m.content }))
  );
  const [input, setInput] = useState(initialTopic ? `Расскажи про: ${initialTopic}` : "");
  const [loading, setLoading] = useState(false);
  const [messagesRemaining, setMessagesRemaining] = useState<number | null>(initialMessagesRemaining);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isLimited = messagesRemaining !== null; // false = Pro
  const limitReached = isLimited && messagesRemaining !== null && messagesRemaining <= 0;
  const showCounter = isLimited && messagesRemaining !== null && messagesRemaining <= 5 && !limitReached;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || limitReached) return;

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

      if (res.status === 429) {
        setMessagesRemaining(0);
        // Remove the optimistically added user message since it wasn't processed
        setMessages((prev) => prev.slice(0, -1));
        setInput(userMessage);
        return;
      }

      if (data.message) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      }
      if (data.messagesRemaining !== undefined) {
        setMessagesRemaining(data.messagesRemaining);
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
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors text-lg">
          ←
        </Link>
        <div className="flex-1">
          <h1 className="font-semibold text-gray-900 text-sm">{subjectTitle}</h1>
          <p className="text-xs text-gray-400">AI-ментор · Mentora</p>
        </div>
        {/* Counter badge — only when ≤5 remaining */}
        {showCounter && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs font-medium text-amber-700">
              осталось {messagesRemaining} из {DAILY_LIMIT}
            </span>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {isEmpty && (
          <div className="text-center pt-12">
            <div className="text-5xl mb-4">🏰</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Привет! Я твой ментор по теме «{subjectTitle}»
            </h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
              Спроси меня о любом периоде, событии или личности. Я расскажу живо — и задам вопрос для закрепления.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {["С чего начать изучение?", "Расскажи о Петре I", "Что такое Смутное время?"].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
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
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">
                М
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-brand-600 text-white text-[15px] leading-relaxed"
                  : "bg-white border border-gray-100 text-gray-800 shadow-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <MarkdownMessage content={msg.content} />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold mr-2 shrink-0">
              М
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-brand-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-100 px-4 py-4">
        {limitReached ? (
          /* Limit reached block */
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
            <p className="text-sm font-semibold text-gray-800 mb-1">
              Лимит на сегодня исчерпан
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Возвращайся завтра — счётчик сбросится автоматически
            </p>
            <div className="inline-flex items-center gap-2 bg-brand-600 text-white text-xs font-semibold px-4 py-2 rounded-xl opacity-60 cursor-not-allowed">
              ⚡ Pro — безлимитный доступ
              <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">скоро</span>
            </div>
          </div>
        ) : (
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Задай вопрос..."
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition text-[15px] disabled:opacity-50 bg-gray-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-40 text-sm"
            >
              →
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
