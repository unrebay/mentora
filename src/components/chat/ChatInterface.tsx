"use client"
import posthog from "posthog-js";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MessageRole } from "@/lib/types";
import ChatParticles from "@/components/ChatParticles";

const DAILY_LIMIT = 30;

const SUBJECT_CONFIG: Record<string, { emoji: string; hint: string; quickQuestions: string[] }> = {
  "russian-history": { emoji: "🏰", hint: "Спроси о любом периоде истории России — от древней Руси до современности", quickQuestions: ["Расскажи о Петре I и его реформах", "Что такое Смутное время?", "Как началась Великая Отечественная война?"] },
  "world-history": { emoji: "🌍", hint: "Спроси о любом историческом событии или эпохе мировой истории", quickQuestions: ["Расскажи о Первой мировой войне", "Что такое эпоха Возрождения?", "Как возникла Римская империя?"] },
  "mathematics": { emoji: "📐", hint: "Задай вопрос по алгебре, геометрии, анализу или теории вероятностей", quickQuestions: ["Объясни теорему Пифагора", "Как решать квадратные уравнения?", "Что такое производная?"] },
  "physics": { emoji: "⚛️", hint: "Спроси про законы физики, явления природы или реши задачу вместе со мной", quickQuestions: ["Объясни законы Ньютона", "Что такое электромагнитная индукция?", "Как работает ядерный реактор?"] },
  "chemistry": { emoji: "🧪", hint: "Спроси про химические реакции, элементы таблицы Менделеева или органическую химию", quickQuestions: ["Объясни строение атома", "Что такое ОВР?", "Как работает таблица Менделеева?"] },
  "biology": { emoji: "🧬", hint: "Спроси про живые организмы, эволюцию, генетику или экосистемы", quickQuestions: ["Объясни строение клетки", "Как работает ДНК?", "Что такое естественный отбор?"] },
  "russian-language": { emoji: "📝", hint: "Спроси про правила орфографии, пунктуации или грамматики", quickQuestions: ["НЕ с разными частями речи", "Как расставлять запятые?", "Что такое причастный оборот?"] },
  "literature": { emoji: "📚", hint: "Обсудим произведения русской и мировой литературы", quickQuestions: ["Расскажи о «Война и мир»", "Кто такой Достоевский?", "Помоги с анализом стихотворения"] },
  "english": { emoji: "🇬🇧", hint: "Let's practice English — grammar, vocabulary, speaking or writing", quickQuestions: ["Explain Present Perfect vs Past Simple", "How to use articles?", "Help me write a letter in English"] },
  "social-studies": { emoji: "🏛️", hint: "Спроси про государство, право, экономику или социальные явления", quickQuestions: ["Что такое разделение властей?", "Основы рыночной экономики", "Как устроена Конституция РФ?"] },
  "geography": { emoji: "🗺️", hint: "Спроси про страны, климат, рельеф или природные зоны", quickQuestions: ["Климатические пояса Земли", "Что такое тектоника плит?", "Природные ресурсы России"] },
  "computer-science": { emoji: "💻", hint: "Спроси про алгоритмы, программирование, сети или IT", quickQuestions: ["Что такое алгоритм?", "Как работает интернет?", "С чего начать программирование?"] },
  "astronomy": { emoji: "🔭", hint: "Спроси про планеты, звёзды, галактики или историю космонавтики", quickQuestions: ["Расскажи о Солнечной системе", "Что такое чёрная дыра?", "Жизненный цикл звезды"] },
};
const DEFAULT_CONFIG = { emoji: "🎓", hint: "Задай любой вопрос — я помогу разобраться", quickQuestions: ["С чего начать изучение?", "Объясни основные понятия", "Дай план изучения"] };

interface Message { role: MessageRole; content: string; isError?: boolean }
interface Props { subject: string; subjectTitle: string; initialHistory: { role: string; content: string }[]; initialMessagesRemaining: number | null; initialTopic?: string }

// ─── Math rendering (KaTeX via CDN injected by layout) ─────────────────────
function renderMath(formula: string, display: boolean): React.ReactNode {
  if (typeof window === "undefined") return <code>{formula}</code>;
  try {
    // @ts-expect-error katex loaded from CDN
    const katex = window.katex;
    if (!katex) return <code className="font-mono text-sm px-1 rounded" style={{background:"var(--bg-secondary)",color:"var(--text)"}}>{formula}</code>;
    const html = katex.renderToString(formula.trim(), { displayMode: display, throwOnError: false, output: "html" });
    return display
      ? <div className="my-3 overflow-x-auto text-center" dangerouslySetInnerHTML={{ __html: html }} />
      : <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <code className="font-mono text-sm px-1 rounded" style={{background:"var(--bg-secondary)",color:"var(--text)"}}>{formula}</code>;
  }
}

// ─── Inline parser: **bold**, *italic*, `code`, $math$, $$math$$ ──────────
function parseInline(text: string): React.ReactNode {
  // Split on all inline patterns including math
  const parts = text.split(/(\$\$[^$]+\$\$|\$[^$\n]+\$|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4)
          return <span key={i}>{renderMath(part.slice(2, -2), true)}</span>;
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2)
          return <span key={i}>{renderMath(part.slice(1, -1), false)}</span>;
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
          return <em key={i}>{part.slice(1, -1)}</em>;
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
          return <code key={i} className="bg-gray-100 dark:bg-[var(--bg-secondary)] text-gray-800 dark:text-[var(--text)] rounded px-1 text-sm font-mono">{part.slice(1, -1)}</code>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Block math: $$ ... $$ on its own lines ───────────────────────────────
function MarkdownMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let orderedBuffer: string[] = [];
  let blockMathBuffer: string[] = [];
  let inBlockMath = false;
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
    // Block math $$...$$
    if (line.trim() === "$$") {
      if (!inBlockMath) {
        flushLists();
        inBlockMath = true;
        blockMathBuffer = [];
      } else {
        elements.push(<div key={`bmath-${keyIdx++}`}>{renderMath(blockMathBuffer.join("\n"), true)}</div>);
        inBlockMath = false;
        blockMathBuffer = [];
      }
      continue;
    }
    if (inBlockMath) { blockMathBuffer.push(line); continue; }

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

// ─── Main Component ────────────────────────────────────────────────────────
export default function ChatInterface({ subject, subjectTitle, initialHistory, initialMessagesRemaining, initialTopic }: Props) {
  const [messages, setMessages] = useState<Message[]>(
    initialHistory.map((m) => ({ role: m.role as MessageRole, content: m.content }))
  );
  const [input, setInput] = useState(initialTopic ? `Расскажи про: ${initialTopic}` : "");
  const [loading, setLoading] = useState(false);
  const [messagesRemaining, setMessagesRemaining] = useState<number | null>(initialMessagesRemaining);
  const [lastUserMsg, setLastUserMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const config = SUBJECT_CONFIG[subject] ?? DEFAULT_CONFIG;
  const isLimited = messagesRemaining !== null;
  const limitReached = isLimited && messagesRemaining !== null && messagesRemaining <= 0;
  const showCounter = isLimited && messagesRemaining !== null && messagesRemaining <= 5 && !limitReached;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage(e: React.FormEvent, retryMsg?: string) {
    e?.preventDefault();
    const userMessage = retryMsg ?? input.trim();
    if (!userMessage || loading || limitReached) return;

    setLastUserMsg(userMessage);
    if (!retryMsg) setInput("");

    // Remove any previous error message on retry
    setMessages((prev) => {
      const filtered = prev.filter(m => !m.isError);
      return retryMsg ? filtered : [...filtered, { role: "user", content: userMessage }];
    });
    setLoading(true);

    const isFirst = messages.filter(m => m.role === "user" && !m.isError).length === 0;
    if (isFirst) posthog.capture("first_message_sent", { subject });
    posthog.capture("message_sent", { subject });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, subject, history: messages.filter(m => !m.isError).slice(-10) }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setMessagesRemaining(0);
        setMessages((prev) => prev.filter(m => m.content !== userMessage || m.role !== "user"));
        setInput(userMessage);
        return;
      }

      if (!res.ok || !data.message) {
        // Show error with retry button
        const errText = data.error === "Internal server error"
          ? "Сервер временно недоступен. Попробуй ещё раз 🔄"
          : (data.error ?? "Произошла ошибка. Попробуй ещё раз 🔄");
        setMessages((prev) => [...prev, { role: "assistant", content: errText, isError: true }]);
        posthog.capture("chat_error", { subject, status: res.status, error: data.error });
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      if (data.messagesRemaining !== undefined) setMessagesRemaining(data.messagesRemaining);
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Нет связи с сервером. Проверь интернет и попробуй ещё раз 🔄",
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-[var(--bg)]" style={{ height: "100dvh" }}>
      {/* Header */}
      <header className="bg-white dark:bg-[var(--bg-card)] border-b border-gray-100 dark:border-[var(--border-light)] px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 dark:text-[var(--text-muted)] hover:text-gray-600 dark:hover:text-[var(--text-secondary)] transition-colors text-lg">←</Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-gray-900 dark:text-[var(--text)] text-sm">{subjectTitle}</h1>
            {initialMessagesRemaining === null && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded tracking-wide" style={{ background: "var(--brand)", color: "#fff" }}>PRO</span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-[var(--text-muted)]">AI-ментор · Mentora</p>
        </div>
        {showCounter && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs font-medium text-amber-700">осталось {messagesRemaining} из {DAILY_LIMIT}</span>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {isEmpty && (
          <div className="relative text-center pt-12">
            <ChatParticles subject={subject} />
            <div className="text-5xl mb-4">{config.emoji}</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-[var(--text)] mb-2">Привет! Я твой ментор по теме «{subjectTitle}»</h2>
            <p className="text-gray-500 dark:text-[var(--text-secondary)] text-sm max-w-sm mx-auto leading-relaxed">{config.hint}</p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {config.quickQuestions.map((q) => (
                <button key={q} onClick={() => setInput(q)}
                  className="px-4 py-2 bg-white dark:bg-[var(--bg-card)] border border-gray-200 dark:border-[var(--border)] rounded-xl text-sm text-gray-600 dark:text-[var(--text-secondary)] hover:border-brand-300 hover:text-brand-600 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border)] shadow-sm flex items-center justify-center mr-2 mt-0.5 shrink-0 select-none">
                <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontWeight: 700, fontSize: "13px", lineHeight: 1, color: "currentColor", letterSpacing: "-0.02em" }}>
                  M<span style={{ color: "var(--brand)", fontStyle: "italic", marginRight: "0.03em" }}>e</span>
                </span>
              </div>
            )}
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-brand-600 text-white text-[15px] leading-relaxed"
                : msg.isError
                  ? "bg-red-50 border border-red-100 text-red-700"
                  : "bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-light)] text-gray-800 dark:text-[var(--text)] shadow-sm"
            }`}>
              {msg.role === "assistant" ? (
                <>
                  <MarkdownMessage content={msg.content} />
                  {msg.isError && (
                    <button
                      onClick={(e) => sendMessage(e as unknown as React.FormEvent, lastUserMsg)}
                      className="mt-2 text-xs text-red-600 underline hover:text-red-800"
                    >
                      Повторить запрос
                    </button>
                  )}
                </>
              ) : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border)] shadow-sm flex items-center justify-center mr-2 shrink-0 select-none">
              <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontWeight: 700, fontSize: "13px", lineHeight: 1, color: "var(--text)", letterSpacing: "-0.02em" }}>
                M<span style={{ color: "var(--brand)", fontStyle: "italic", display: "inline-block", verticalAlign: "baseline", position: "relative", top: "0.03em", marginRight: "0.03em" }}>e</span>
              </span>
            </div>
            <div className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-light)] rounded-2xl px-4 py-4 shadow-sm">
              <div className="flex gap-1.5 items-end h-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full"
                    style={{ background: "#4561E8", opacity: 0.7, animation: "mentoraDot 1.3s ease-in-out infinite", animationDelay: `${i * 0.18}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-[var(--bg-card)] border-t border-gray-100 dark:border-[var(--border-light)] px-4 py-4">
        {limitReached ? (
          <div className="rounded-xl bg-gray-50 dark:bg-[var(--bg-secondary)] border border-gray-200 dark:border-[var(--border)] p-4 text-center">
            <p className="text-sm font-semibold text-gray-800 dark:text-[var(--text)] mb-1">Лимит на сегодня исчерпан</p>
            <p className="text-xs text-gray-500 dark:text-[var(--text-secondary)] mb-3">Возвращайся завтра — счётчик сбросится автоматически</p>
            <Link href="/pricing" className="inline-flex items-center gap-2 bg-brand-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors">
              ⚡ Pro — безлимитный доступ
            </Link>
          </div>
        ) : (
          <form onSubmit={sendMessage} className="flex gap-3">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Задай вопрос..." disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-brand-500 transition text-[15px] disabled:opacity-50 bg-gray-50 dark:bg-[var(--bg-secondary)] text-gray-900 dark:text-[var(--text)]" />
            <button type="submit" disabled={loading || !input.trim()}
              className="px-5 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-40 text-sm">
              →
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
