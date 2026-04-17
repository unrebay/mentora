"use client"
import posthog from "posthog-js";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MessageRole } from "@/lib/types";
import ChatParticles from "@/components/ChatParticles";
import SubjectIcon, { subjectColor } from "@/components/SubjectIcon";

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
interface Props { subject: string; subjectTitle: string; initialHistory: { role: string; content: string }[]; initialMessagesRemaining: number | null; initialTopic?: string; isUltima?: boolean }

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
          return <code key={i} className="rounded px-1 text-sm font-mono" style={{ background: "var(--bg-secondary)", color: "var(--text)" }}>{part.slice(1, -1)}</code>;
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
export default function ChatInterface({ subject, subjectTitle, initialHistory, initialMessagesRemaining, initialTopic, isUltima = false }: Props) {
  const [messages, setMessages] = useState<Message[]>(
    initialHistory.map((m) => ({ role: m.role as MessageRole, content: m.content }))
  );
  const [input, setInput] = useState(initialTopic ? `Расскажи про: ${initialTopic}` : "");
  const [loading, setLoading] = useState(false);
  const [messagesRemaining, setMessagesRemaining] = useState<number | null>(initialMessagesRemaining);
  const [lastUserMsg, setLastUserMsg] = useState("");
  // Ultima image upload state
  const [pendingImage, setPendingImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      setPendingImage({ data: base64, mimeType: file.type, preview: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

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
        body: JSON.stringify({
          message: userMessage,
          subject,
          history: messages.filter(m => !m.isError).slice(-10),
          ...(pendingImage ? { imageData: pendingImage.data, imageMimeType: pendingImage.mimeType } : {}),
        }),
      });
      setPendingImage(null);

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
    <div className="flex flex-col" style={{ height: "100dvh", background: "var(--bg)" }}>
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center gap-3 shrink-0"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-light)" }}>
        <Link href="/dashboard" className="transition-colors text-lg" style={{ color: "var(--text-muted)" }}>←</Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-sm" style={{ color: "var(--text)" }}>{subjectTitle}</h1>
            {initialMessagesRemaining === null && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded tracking-wide" style={{ background: "var(--brand)", color: "#fff" }}>PRO</span>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>AI-ментор · Mentora</p>
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
          <div className="relative text-center pt-10">
            <ChatParticles subject={subject} />
            {/* Subject icon badge */}
            <div className="inline-flex items-center justify-center mb-5">
              <div
                className="rounded-3xl p-1"
                style={{
                  background: `linear-gradient(135deg, ${subjectColor(subject)}33, ${subjectColor(subject)}11)`,
                  boxShadow: `0 0 32px ${subjectColor(subject)}30`,
                  border: `1px solid ${subjectColor(subject)}22`,
                }}
              >
                <SubjectIcon id={subject} size={64} />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-2">
              Привет! Я твой ментор по теме «{subjectTitle}»
            </h2>
            <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto leading-relaxed">{config.hint}</p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {config.quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-4 py-2 rounded-full text-sm transition-all duration-200"
                  style={{
                    background: "var(--bg-card)",
                    border: `1px solid var(--border)`,
                    color: "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = subjectColor(subject);
                    (e.currentTarget as HTMLButtonElement).style.color = subjectColor(subject);
                    (e.currentTarget as HTMLButtonElement).style.background = `${subjectColor(subject)}10`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-card)";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full border flex items-center justify-center mr-2 mt-0.5 shrink-0 select-none" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontWeight: 700, fontSize: "13px", lineHeight: 1, color: "currentColor", letterSpacing: "-0.02em" }}>
                  M<span style={{ color: "var(--brand)", fontStyle: "italic", marginRight: "0.03em" }}>e</span>
                </span>
              </div>
            )}
            <div
              className="max-w-[82%] rounded-2xl px-4 py-3"
              style={
                msg.role === "user"
                  ? {
                      background: "linear-gradient(135deg, #4561E8, #6B8FFF)",
                      color: "white",
                      fontSize: "15px",
                      lineHeight: "1.65",
                      boxShadow: "0 2px 12px rgba(69,97,232,0.35)",
                    }
                  : msg.isError
                    ? {
                        background: "rgba(239,68,68,0.06)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        color: "#dc2626",
                      }
                    : {
                        background: "var(--bg-card)",
                        borderLeft: `3px solid ${subjectColor(subject)}`,
                        borderTop: "1px solid var(--border-light)",
                        borderRight: "1px solid var(--border-light)",
                        borderBottom: "1px solid var(--border-light)",
                        color: "var(--text)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      }
              }
            >
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
            <div className="w-8 h-8 rounded-full border flex items-center justify-center mr-2 shrink-0 select-none" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontWeight: 700, fontSize: "13px", lineHeight: 1, color: "var(--text)", letterSpacing: "-0.02em" }}>
                M<span style={{ color: "var(--brand)", fontStyle: "italic", display: "inline-block", verticalAlign: "baseline", position: "relative", top: "0.03em", marginRight: "0.03em" }}>e</span>
              </span>
            </div>
            <div className="rounded-2xl px-4 py-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
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
      <div className="border-t px-4 pt-4 shrink-0"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-light)", paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
        {limitReached ? (
          <div className="rounded-xl p-4 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>Лимит на сегодня исчерпан</p>
            <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>Возвращайся завтра — счётчик сбросится автоматически</p>
            <Link href="/pricing" className="btn-glow inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full">
              ⚡ Pro — безлимитный доступ
            </Link>
          </div>
        ) : (
          <>
            {pendingImage && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded-xl border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                <img src={pendingImage.preview} alt="Фото задачи" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                <span className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>Фото прикреплено — напиши вопрос или отправь сразу</span>
                <button type="button" onClick={() => setPendingImage(null)} className="text-lg leading-none px-1" style={{ color: "var(--text-muted)" }}>×</button>
              </div>
            )}
            <form onSubmit={sendMessage} className="flex gap-2 items-center">
            {/* Hidden file input for Ultima */}
            {isUltima && (
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            )}
            {/* Camera button — only for Ultima */}
            {isUltima && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Сфотографировать задачу"
                className="shrink-0 flex items-center justify-center transition-colors"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  border: "1px solid var(--border)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-muted)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={pendingImage ? "Задай вопрос к фото (или отправь без текста)..." : "Задай вопрос..."}
              disabled={loading}
              className="flex-1 px-5 py-3 text-[15px] disabled:opacity-50 focus:outline-none transition-all"
              style={{
                borderRadius: "9999px",
                border: "1px solid var(--border)",
                background: "var(--bg-secondary)",
                color: "var(--text)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--brand)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(69,97,232,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="submit"
              disabled={loading || (!input.trim() && !pendingImage)}
              className="shrink-0 btn-glow flex items-center justify-center disabled:opacity-40 transition-all"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                fontSize: "18px",
              }}
            >
              →
            </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
