"use client"
import posthog from "posthog-js";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MessageRole } from "@/lib/types";
import ChatParticles from "@/components/ChatParticles";
import SubjectIcon, { subjectColor } from "@/components/SubjectIcon";
import MeLogo from "@/components/MeLogo";
import TelegramSupportButton from "@/components/TelegramSupportButton";

const DAILY_LIMIT = 10;

interface Message { role: MessageRole; content: string; isError?: boolean; imageUrl?: string }
interface Props { subject: string; subjectTitle: string; initialHistory: { role: string; content: string }[]; initialMessagesRemaining: number | null; initialResetAt?: string | null; initialTopic?: string; isUltima?: boolean }

// ─── Countdown helpers ────────────────────────────────────────────────────
function msUntilNextMidnightUTC(): number {
  const now = new Date(); const next = new Date();
  next.setUTCHours(24, 0, 0, 0); return next.getTime() - now.getTime();
}
function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600), m = Math.floor((totalSec % 3600) / 60), s = totalSec % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// ─── KaTeX math rendering ─────────────────────────────────────────────────
function renderMath(formula: string, display: boolean): React.ReactNode {
  if (typeof window === "undefined") return <code>{formula}</code>;
  try {
    // @ts-expect-error katex loaded from CDN
    const katex = window.katex;
    if (!katex) return <code className="rounded px-1 text-sm font-mono" style={{ background: "var(--bg-secondary)", color: "var(--text)" }}>{formula}</code>;
    const html = katex.renderToString(formula.trim(), { displayMode: display, throwOnError: false, output: "html" });
    return display
      ? <div className="my-3 overflow-x-auto text-center" dangerouslySetInnerHTML={{ __html: html }} />
      : <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <code className="rounded px-1 text-sm font-mono" style={{ background: "var(--bg-secondary)", color: "var(--text)" }}>{formula}</code>;
  }
}

// ─── Syntax highlighting ──────────────────────────────────────────────────
const LANG_KEYWORDS: Record<string, string[]> = {
  python:     ["def","class","import","from","return","if","elif","else","for","while","in","not","and","or","True","False","None","try","except","finally","with","as","pass","break","continue","lambda","yield","raise","del","global","nonlocal","is","assert","print","range","len","type","int","str","float","list","dict","set","tuple"],
  javascript: ["const","let","var","function","return","if","else","for","while","do","in","of","switch","case","break","continue","import","export","default","class","extends","new","this","typeof","instanceof","try","catch","finally","throw","async","await","true","false","null","undefined","void","=>"],
  typescript: ["const","let","var","function","return","if","else","for","while","do","in","of","switch","case","break","continue","import","export","default","class","extends","new","this","typeof","instanceof","try","catch","finally","throw","async","await","true","false","null","undefined","void","=>","interface","type","enum","abstract","implements","declare","namespace","readonly","public","private","protected","static","override"],
  sql:        ["SELECT","FROM","WHERE","INSERT","INTO","UPDATE","DELETE","JOIN","LEFT","RIGHT","INNER","OUTER","ON","GROUP","BY","ORDER","HAVING","LIMIT","OFFSET","CREATE","TABLE","DROP","ALTER","INDEX","DISTINCT","AS","AND","OR","NOT","IN","IS","NULL","LIKE","BETWEEN","UNION","ALL"],
  bash:       ["if","then","fi","else","elif","for","do","done","while","case","esac","function","return","echo","export","source","local","readonly","declare","true","false","grep","awk","sed","cat","ls","cd","mkdir","rm","cp","mv","chmod","chown","curl","wget","python3","node","npm"],
  go:         ["package","import","func","var","const","type","struct","interface","map","chan","go","defer","select","for","range","if","else","switch","case","default","return","break","continue","fallthrough","true","false","nil","make","new","len","cap","append","copy","close","panic","recover","error"],
  rust:       ["fn","let","mut","const","static","struct","enum","impl","trait","use","pub","mod","crate","super","self","where","match","if","else","for","while","loop","break","continue","return","true","false","None","Some","Ok","Err","Box","Vec","Option","Result"],
  html:       [],
  css:        [],
};

function escHtml(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function highlightCode(code: string, rawLang: string): string {
  const lang = rawLang.toLowerCase().replace(/^(js|jsx)$/,"javascript").replace(/^(ts|tsx)$/,"typescript").replace(/^(sh|shell|zsh)$/,"bash").replace(/^(py)$/,"python");
  if (lang === "html") {
    // Basic HTML highlighting
    return escHtml(code)
      .replace(/(&lt;\/?)([\w-]+)/g, (_, lt, tag) => `${lt}<span style="color:#f97583">${tag}</span>`)
      .replace(/([\w-]+)(=)("(?:[^"\\]|\\.)*")/g, `<span style="color:#b392f0">$1</span>$2<span style="color:#9ecbff">$3</span>`)
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, `<span style="color:#6a737d;font-style:italic">$1</span>`);
  }
  if (lang === "css") {
    return escHtml(code)
      .replace(/([\w-]+)(\s*:)/g, `<span style="color:#79b8ff">$1</span>$2`)
      .replace(/(:(?:\s*)[^;{}]+)/g, `<span style="color:#9ecbff">$1</span>`)
      .replace(/(\/\*[\s\S]*?\*\/)/g, `<span style="color:#6a737d;font-style:italic">$1</span>`);
  }

  const kws = LANG_KEYWORDS[lang] ?? LANG_KEYWORDS["javascript"];
  const commentChar = lang === "python" || lang === "bash" ? "#" : lang === "sql" ? "--" : "//";

  // Tokenize line by line
  return code.split("\n").map(line => {
    // Comment detection (full-line or inline) — escape first then re-mark
    const escaped = escHtml(line);
    // String literals: "..." '...' `...`
    let result = escaped.replace(
      /(&quot;(?:[^&]|&(?!quot;))*?&quot;|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
      `<span style="color:#9ecbff">$1</span>`
    );
    // Comments (after strings so we don't re-highlight inside strings)
    const commentEsc = escHtml(commentChar);
    const commentIdx = result.indexOf(commentEsc);
    if (commentIdx !== -1) {
      const before = result.slice(0, commentIdx);
      const comment = result.slice(commentIdx);
      result = before + `<span style="color:#6a737d;font-style:italic">${comment}</span>`;
    }
    // Numbers
    result = result.replace(/\b(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, `<span style="color:#f8c555">$1</span>`);
    // Keywords (whole words only, avoid re-matching inside spans)
    if (kws.length > 0) {
      const kwPattern = new RegExp(`\\b(${kws.map(k => escHtml(k).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})\\b`, "g");
      result = result.replace(kwPattern, `<span style="color:#ff7b72">$1</span>`);
    }
    // Function calls: word(
    result = result.replace(/\b([a-zA-Z_]\w*)(\()(?!span)/g, `<span style="color:#d2a8ff">$1</span>$2`);
    return result;
  }).join("\n");
}

// ─── Code Block component ─────────────────────────────────────────────────
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // fallback
      const el = document.createElement("textarea");
      el.value = code; el.style.position = "fixed"; el.style.opacity = "0";
      document.body.appendChild(el); el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const displayLang = lang || "code";
  const highlighted = highlightCode(code, lang);

  return (
    <div className="my-3 rounded-2xl overflow-hidden" style={{
      background: "#0d1117",
      border: "1px solid rgba(255,255,255,0.09)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 select-none" style={{
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Language badge */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {["#ff5f57","#febc2e","#28c840"].map(c => (
              <div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c, opacity:0.7 }} />
            ))}
          </div>
          <span className="text-xs font-mono ml-1" style={{ color:"#7d8590" }}>{displayLang}</span>
        </div>
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all select-none"
          style={{
            background: copied ? "rgba(86,211,100,0.12)" : "rgba(255,255,255,0.06)",
            color: copied ? "#56d364" : "#7d8590",
            border: `1px solid ${copied ? "rgba(86,211,100,0.22)" : "rgba(255,255,255,0.08)"}`,
          }}
        >
          {copied ? (
            <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Скопировано</>
          ) : (
            <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Копировать</>
          )}
        </button>
      </div>
      {/* Code body */}
      <pre className="overflow-x-auto px-5 py-4 text-sm leading-[1.7]" style={{
        fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code','Courier New',monospace",
        color: "#e6edf3",
        margin: 0,
        tabSize: 2,
      }}>
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

// ─── Inline parser: **bold**, *italic*, `code`, $math$, $$math$$ ──────────
function parseInline(text: string): React.ReactNode {
  const parts = text.split(/(\$\$[^$]+\$\$|\$[^$\n]+\$|\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4)
          return <span key={i}>{renderMath(part.slice(2,-2), true)}</span>;
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2)
          return <span key={i}>{renderMath(part.slice(1,-1), false)}</span>;
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
          return <strong key={i} className="font-semibold">{part.slice(2,-2)}</strong>;
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
          return <em key={i} className="italic">{part.slice(1,-1)}</em>;
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
          return <code key={i} className="rounded-md px-1.5 py-0.5 text-[13px] font-mono" style={{
            background: "rgba(110,118,129,0.18)", color: "#e6edf3", border: "1px solid rgba(110,118,129,0.25)",
          }}>{part.slice(1,-1)}</code>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Content segment type ─────────────────────────────────────────────────
type Seg =
  | { type: "code";  lang: string; code: string }
  | { type: "text";  content: string };

function splitByCodeBlocks(content: string): Seg[] {
  const segs: Seg[] = [];
  // Match ```lang\n...``` with optional trailing newline
  const RE = /```([\w+-]*)\n([\s\S]*?)```/g;
  let last = 0; let m: RegExpExecArray | null;
  while ((m = RE.exec(content)) !== null) {
    if (m.index > last) segs.push({ type: "text", content: content.slice(last, m.index) });
    segs.push({ type: "code", lang: m[1].trim(), code: m[2] });
    last = m.index + m[0].length;
  }
  if (last < content.length) segs.push({ type: "text", content: content.slice(last) });
  return segs;
}

// ─── Text block renderer (lines → React nodes) ────────────────────────────
function TextBlock({ content }: { content: string }) {
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
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--brand)", opacity: 0.8 }} />
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
              <span className="shrink-0 font-semibold text-sm min-w-[20px]" style={{ color: "var(--brand)" }}>{i+1}.</span>
              <span className="flex-1">{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      orderedBuffer = [];
    }
  };

  for (const line of lines) {
    // Block math $$
    if (line.trim() === "$$") {
      if (!inBlockMath) { flushLists(); inBlockMath = true; blockMathBuffer = []; }
      else { elements.push(<div key={`bm-${keyIdx++}`}>{renderMath(blockMathBuffer.join("\n"), true)}</div>); inBlockMath = false; blockMathBuffer = []; }
      continue;
    }
    if (inBlockMath) { blockMathBuffer.push(line); continue; }

    // Horizontal rule
    if (/^[-*]{3,}$/.test(line.trim())) {
      flushLists();
      elements.push(<hr key={keyIdx++} className="my-3 border-none h-px" style={{ background: "var(--border-light)", opacity: 0.7 }} />);
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushLists();
      elements.push(
        <blockquote key={keyIdx++} className="pl-3 my-1.5 italic text-sm leading-relaxed" style={{
          borderLeft: "2.5px solid var(--brand)", color: "var(--text-muted)",
        }}>
          {parseInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Lists
    if (/^[-•*—] /.test(line)) {
      if (orderedBuffer.length > 0) flushLists();
      listBuffer.push(line.slice(2)); continue;
    }
    const ordMatch = line.match(/^\d+\.\s+(.+)/);
    if (ordMatch) {
      if (listBuffer.length > 0) flushLists();
      orderedBuffer.push(ordMatch[1]); continue;
    }
    // Multi-line list continuation
    if (line.trim() !== "") {
      if (orderedBuffer.length > 0) { orderedBuffer[orderedBuffer.length-1] += " " + line.trim(); continue; }
      if (listBuffer.length > 0)    { listBuffer[listBuffer.length-1]    += " " + line.trim(); continue; }
    }

    flushLists();

    // Headings
    const h1 = line.match(/^# (.+)/);   if (h1) { elements.push(<h2 key={keyIdx++} className="font-bold mt-4 mb-2 leading-snug" style={{ fontSize:"1.1rem", color:"var(--text)" }}>{parseInline(h1[1])}</h2>); continue; }
    const h2 = line.match(/^## (.+)/);  if (h2) { elements.push(<h3 key={keyIdx++} className="font-semibold mt-3 mb-1.5 leading-snug" style={{ fontSize:"1rem", color:"var(--text)" }}>{parseInline(h2[1])}</h3>); continue; }
    const h3 = line.match(/^### (.+)/); if (h3) { elements.push(<p  key={keyIdx++} className="font-semibold mt-2 mb-1" style={{ color:"var(--text)" }}>{parseInline(h3[1])}</p>); continue; }

    // Blank line
    if (line.trim() === "") { if (elements.length > 0) elements.push(<div key={keyIdx++} className="h-1.5" />); continue; }

    elements.push(<p key={keyIdx++} className="leading-relaxed">{parseInline(line)}</p>);
  }
  flushLists();
  return <>{elements}</>;
}

// ─── Full markdown message ────────────────────────────────────────────────
function MarkdownMessage({ content }: { content: string }) {
  const segs = splitByCodeBlocks(content);
  return (
    <div className="space-y-0.5 text-[15px]">
      {segs.map((seg, i) =>
        seg.type === "code"
          ? <CodeBlock key={i} lang={seg.lang} code={seg.code} />
          : <TextBlock key={i} content={seg.content} />
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function ChatInterface({ subject, subjectTitle, initialHistory, initialMessagesRemaining, initialResetAt, initialTopic, isUltima = false }: Props) {
  const locale = useLocale();
  const tChat = useTranslations("chat");
  const tUi = useTranslations("chat.ui");

  const subjectKey = subject as string;
  const subjectHint = (() => { try { return tChat(`subjects.${subjectKey}.hint`); } catch { return tUi("defaultHint"); } })();
  const subjectQuickQ = (() => {
    try { return [tChat(`subjects.${subjectKey}.q1`), tChat(`subjects.${subjectKey}.q2`), tChat(`subjects.${subjectKey}.q3`)]; }
    catch { return [tUi("defaultQ1"), tUi("defaultQ2"), tUi("defaultQ3")]; }
  })();

  const SUBJECT_EMOJI: Record<string, string> = {
    "russian-history":"🏰","world-history":"🌍","mathematics":"📐","physics":"⚛️",
    "chemistry":"🧪","biology":"🧬","russian-language":"📝","literature":"📚",
    "english":"🇬🇧","social-studies":"🏛️","geography":"🗺️","computer-science":"💻",
    "astronomy":"🔭","discovery":"🌐",
  };
  const subjectEmoji = SUBJECT_EMOJI[subject] ?? "🎓";

  const [messages, setMessages] = useState<Message[]>(
    initialHistory.map((m) => ({ role: m.role as MessageRole, content: m.content }))
  );
  const topicPrefix = tChat("topicPrefix");
  const [input, setInput] = useState(initialTopic ? `${topicPrefix}${initialTopic}` : "");
  const [loading, setLoading] = useState(false);
  const [messagesRemaining, setMessagesRemaining] = useState<number | null>(initialMessagesRemaining);
  const [, setResetAt] = useState<string | null>(initialResetAt ?? null);
  const [countdown, setCountdown] = useState<string>(() => formatCountdown(msUntilNextMidnightUTC()));
  const [lastUserMsg, setLastUserMsg] = useState("");
  const [pendingImage, setPendingImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [nativeModeActive, setNativeModeActive] = useState(false);
  const [showNativeHint, setShowNativeHint] = useState(false);
  const [hintFading, setHintFading] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [levelUpData, setLevelUpData] = useState<{ newLevel: string; oldLevel: string; message: string; color: string } | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpFading, setLevelUpFading] = useState(false);
  const levelUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current; if (!el) return;
    el.style.height = "auto";
    const maxH = 240; const newH = Math.min(el.scrollHeight, maxH);
    el.style.height = newH + "px"; el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    if (subject !== "english") return;
    let rafId: number; let fadeOutTimer: ReturnType<typeof setTimeout>;
    try {
      const key = "mentora_native_hint_count";
      const count = parseInt(localStorage.getItem(key) ?? "0", 10);
      if (count < 3) {
        localStorage.setItem(key, String(count + 1));
        setHintFading(true); setShowNativeHint(true);
        rafId = requestAnimationFrame(() => requestAnimationFrame(() => setHintFading(false)));
        hintTimerRef.current = setTimeout(() => {
          setHintFading(true); fadeOutTimer = setTimeout(() => setShowNativeHint(false), 400);
        }, 5000);
      }
    } catch {}
    return () => { cancelAnimationFrame(rafId); if (hintTimerRef.current) clearTimeout(hintTimerRef.current); clearTimeout(fadeOutTimer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tick = () => setCountdown(formatCountdown(msUntilNextMidnightUTC()));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  const dismissNativeHint = useCallback(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    setHintFading(true); setTimeout(() => setShowNativeHint(false), 400);
    try { localStorage.setItem("mentora_native_hint_count","3"); } catch {}
  }, []);

  const dismissLevelUp = useCallback(() => {
    if (levelUpTimerRef.current) clearTimeout(levelUpTimerRef.current);
    setLevelUpFading(true); setTimeout(() => { setShowLevelUp(false); setLevelUpData(null); }, 500);
  }, []);

  const handleExportPdf = async () => {
    if (exportingPdf || messages.filter(m => !m.isError).length < 2) return;
    setExportingPdf(true);
    try {
      const res = await fetch("/api/chat/generate-notes", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ subject, subjectTitle, messages: messages.filter(m=>!m.isError).slice(-30) }) });
      const data = await res.json();
      if (!res.ok || !data.notes) throw new Error(data.error ?? "Failed");
      localStorage.setItem("mentora_print_notes", JSON.stringify({ notes:data.notes, subjectTitle:data.subjectTitle }));
      window.open("/notes/print","_blank");
    } catch {} finally { setExportingPdf(false); }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => { const dataUrl = reader.result as string; setPendingImage({ data: dataUrl.split(",")[1], mimeType: file.type, preview: dataUrl }); };
    reader.readAsDataURL(file); e.target.value = "";
  };

  async function quickSend(text: string) {
    if (loading || limitReached) return;
    setMessages(prev => [...prev.filter(m=>!m.isError), { role:"user", content:text }]);
    setLastUserMsg(text); setLoading(true); posthog.capture("message_sent",{subject});
    try {
      const res = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text,subject,history:messages.filter(m=>!m.isError).slice(-10),locale})});
      const data = await res.json();
      if (res.status===429){setMessagesRemaining(0);setMessages(prev=>prev.filter(m=>!(m.role==="user"&&m.content===text)));return;}
      if (!res.ok||!data.message){setMessages(prev=>[...prev,{role:"assistant",content:data.error??tChat("errorGeneric"),isError:true}]);return;}
      setMessages(prev=>[...prev,{role:"assistant",content:data.message,imageUrl:data.imageUrl??undefined}]);
      if(data.messagesRemaining!==undefined)setMessagesRemaining(data.messagesRemaining);
    } catch {setMessages(prev=>[...prev,{role:"assistant",content:tChat("errorNoInternet"),isError:true}]);}
    finally{setLoading(false);}
  }

  const isLimited = messagesRemaining !== null;
  const limitReached = isLimited && messagesRemaining !== null && messagesRemaining <= 0;
  const showCounter = isLimited && messagesRemaining !== null && messagesRemaining <= 5 && !limitReached;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  async function sendMessage(e: React.FormEvent, retryMsg?: string) {
    e?.preventDefault();
    const userMessage = retryMsg ?? input.trim();
    if (!userMessage || loading || limitReached) return;
    setLastUserMsg(userMessage);
    if (!retryMsg) {
      setInput("");
      if (textareaRef.current) { textareaRef.current.style.height="44px"; textareaRef.current.style.overflowY="hidden"; }
    }
    setMessages((prev) => { const f=prev.filter(m=>!m.isError); return retryMsg ? f : [...f,{role:"user",content:userMessage}]; });
    setLoading(true);
    const isFirst = messages.filter(m=>m.role==="user"&&!m.isError).length===0;
    if (isFirst) posthog.capture("first_message_sent",{subject});
    posthog.capture("message_sent",{subject});
    try {
      const res = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:userMessage,subject,history:messages.filter(m=>!m.isError).slice(-10),locale,...(pendingImage?{imageData:pendingImage.data,imageMimeType:pendingImage.mimeType}:{})})});
      setPendingImage(null);
      const data = await res.json();
      if (res.status===429){setMessagesRemaining(0);setMessages(prev=>prev.filter(m=>m.content!==userMessage||m.role!=="user"));setInput(userMessage);return;}
      if (!res.ok||!data.message){
        const errText=data.error==="Internal server error"?tChat("errorServer"):(data.error??tChat("errorGeneric"));
        setMessages(prev=>[...prev,{role:"assistant",content:errText,isError:true}]);
        posthog.capture("chat_error",{subject,status:res.status,error:data.error});return;
      }
      setMessages(prev=>[...prev,{role:"assistant",content:data.message,imageUrl:data.imageUrl??undefined}]);
      if(data.messagesRemaining!==undefined)setMessagesRemaining(data.messagesRemaining);
      if(data.resetAt)setResetAt(data.resetAt);
      if(data.levelUp){
        setLevelUpData(data.levelUp);setLevelUpFading(true);setShowLevelUp(true);
        requestAnimationFrame(()=>requestAnimationFrame(()=>setLevelUpFading(false)));
        if(levelUpTimerRef.current)clearTimeout(levelUpTimerRef.current);
        levelUpTimerRef.current=setTimeout(()=>{setLevelUpFading(true);setTimeout(()=>{setShowLevelUp(false);setLevelUpData(null);},500);},10000);
      }
      if(data.streakRewardEarned){setTimeout(()=>{window.location.href="/dashboard?streak_reward=1";},1500);}
    } catch {setMessages(prev=>[...prev,{role:"assistant",content:tChat("errorNoInternet"),isError:true}]);}
    finally{setLoading(false);}
  }

  const isEmpty = messages.length === 0;
  const subjColor = subjectColor(subject);

  return (
    <div className="flex flex-col" style={{ height:"100dvh", background:"var(--chat-bg)" }}>

      {/* ── Header ── liquid glass ───────────────────────────────────────── */}
      <header
        className="px-4 py-3 flex items-center gap-3 shrink-0"
        style={{
          background: "var(--chat-header)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid var(--chat-msg-border)",
          boxShadow: "0 1px 0 var(--chat-msg-border)",
        }}
      >
        <Link
          href="/dashboard"
          className="transition-opacity hover:opacity-70 flex items-center justify-center rounded-xl"
          style={{ color:"var(--text-muted)", width:32, height:32, background:"var(--chat-msg-bg)", border:"1px solid var(--chat-msg-border)", backdropFilter:"blur(8px)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>

        {/* Subject icon + title */}
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{
          background: `linear-gradient(135deg,${subjColor}22,${subjColor}11)`,
          border: `1px solid ${subjColor}30`,
        }}>
          <SubjectIcon id={subject} size={22} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-sm truncate" style={{ color:"var(--text)" }}>{subjectTitle}</h1>
            {initialMessagesRemaining === null && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide shrink-0" style={{
                background: isUltima ? "linear-gradient(135deg,#7C3AED,#4561E8)" : "var(--brand)", color:"#fff",
              }}>
                {isUltima ? "ULTRA" : "PRO"}
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color:"var(--text-muted)" }}>{tChat("aiMentor")}</p>
        </div>

        {showCounter && (
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1 shrink-0" style={{
            background:"rgba(251,191,36,0.10)", border:"1px solid rgba(251,191,36,0.25)",
          }}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span className="text-xs font-medium whitespace-nowrap" style={{ color:"#d97706" }}>
              <span className="hidden sm:inline">{tChat("remainingFull",{n:messagesRemaining??0,limit:DAILY_LIMIT})}</span>
              <span className="sm:hidden">{tChat("remainingShort",{n:messagesRemaining??0})}</span>
            </span>
          </div>
        )}

        {isUltima && messages.filter(m=>!m.isError).length >= 3 && (
          <button
            onClick={handleExportPdf} disabled={exportingPdf} title={tChat("exportTitle")}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-50"
            style={{ background:"var(--chat-msg-bg)", border:"1px solid var(--chat-msg-border)", color:"var(--text-muted)" }}
          >
            {exportingPdf
              ? <span style={{ display:"inline-block", width:12, height:12, border:"1.5px solid var(--text-muted)", borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>}
            <span className="hidden sm:inline">{exportingPdf ? tChat("exporting") : tChat("export")}</span>
          </button>
        )}
      </header>

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4" style={{ scrollbarWidth:"thin" }}>

        {isEmpty && (
          <div className="relative text-center pt-10">
            <ChatParticles subject={subject} />
            <div className="inline-flex items-center justify-center mb-5">
              <div className="rounded-3xl p-1.5" style={{
                background:`linear-gradient(135deg,${subjColor}22,${subjColor}0a)`,
                boxShadow:`0 0 40px ${subjColor}28`,
                border:`1px solid ${subjColor}22`,
              }}>
                <SubjectIcon id={subject} size={68} />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color:"var(--text)" }}>
              {tChat("greeting",{subject:subjectTitle})}
            </h2>
            <p className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color:"var(--text-muted)" }}>{subjectHint}</p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {subjectQuickQ.map((q) => (
                <button
                  key={q} onClick={() => setInput(q)}
                  className="px-4 py-2 rounded-full text-sm transition-all duration-200"
                  style={{ background:"var(--chat-msg-bg)", backdropFilter:"blur(12px)", border:`1px solid var(--chat-msg-border)`, color:"var(--text-secondary)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor=subjColor; (e.currentTarget as HTMLElement).style.color=subjColor; (e.currentTarget as HTMLElement).style.background=`${subjColor}12`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor="var(--chat-msg-border)"; (e.currentTarget as HTMLElement).style.color="var(--text-secondary)"; (e.currentTarget as HTMLElement).style.background="var(--chat-msg-bg)"; }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role==="user" ? "justify-end" : "justify-start"} gap-2`}>

            {/* Assistant avatar */}
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-2xl flex items-center justify-center shrink-0 mt-auto mb-0.5" style={{
                background: `linear-gradient(135deg,${subjColor}22,${subjColor}11)`,
                border: `1.5px solid ${subjColor}30`,
                boxShadow: `0 2px 8px ${subjColor}18`,
              }}>
                <MeLogo height={13} colorM="var(--text)" colorE={subjColor} />
              </div>
            )}

            {/* Bubble — Telegram/iOS 26 style */}
            <div
              className="max-w-[80%] px-4 py-3"
              style={
                msg.role === "user"
                  ? {
                      background: "linear-gradient(135deg,#4561E8,#6B8FFF)",
                      color: "white", fontSize:"15px", lineHeight:"1.65",
                      boxShadow: "0 2px 12px rgba(69,97,232,0.35), 0 1px 0 rgba(255,255,255,0.15) inset",
                      borderRadius: "20px 20px 4px 20px",
                    }
                  : msg.isError
                    ? { background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.22)", color:"#dc2626", borderRadius:"20px 20px 20px 4px" }
                    : {
                        background: "var(--chat-msg-bg)",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        border: `1px solid var(--chat-msg-border)`,
                        borderLeft: `2.5px solid ${subjColor}55`,
                        color: "var(--text)",
                        boxShadow: `var(--chat-msg-shadow), 0 0 0 1px ${subjColor}08`,
                        borderRadius: "20px 20px 20px 4px",
                      }
              }
            >
              {msg.role === "assistant" ? (
                <>
                  <MarkdownMessage content={msg.content} />
                  {msg.imageUrl && (
                    <div className="mt-3">
                      <img src={msg.imageUrl} alt={tChat("imageAlt")} className="rounded-xl w-full max-w-sm object-cover" style={{ border:"1px solid var(--chat-msg-border)" }} loading="lazy" />
                      <p className="text-[10px] mt-1" style={{ color:"var(--text-muted)" }}>{tChat("imageCaption")}</p>
                    </div>
                  )}
                  {msg.isError && (
                    <button onClick={(e) => sendMessage(e as unknown as React.FormEvent, lastUserMsg)} className="mt-2 text-xs underline hover:opacity-80" style={{ color:"#dc2626" }}>{tChat("retry")}</button>
                  )}
                </>
              ) : msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start gap-2">
            <div className="w-7 h-7 rounded-2xl flex items-center justify-center shrink-0 mt-auto" style={{ background:`linear-gradient(135deg,${subjColor}22,${subjColor}11)`, border:`1.5px solid ${subjColor}30` }}>
              <MeLogo height={13} colorM="var(--text)" colorE={subjColor} />
            </div>
            <div className="px-5 py-4" style={{ background:"var(--chat-msg-bg)", backdropFilter:"blur(16px)", border:`1px solid var(--chat-msg-border)`, borderLeft:`2.5px solid ${subjColor}55`, borderRadius:"20px 20px 20px 4px" }}>
              <div className="flex gap-1.5 items-end h-4">
                {[0,1,2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full" style={{ background:"#4561E8", opacity:0.7, animation:"mentoraDot 1.3s ease-in-out infinite", animationDelay:`${i*0.18}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── iOS 26 / Telegram glass ────────────────────────── */}
      <div
        className="shrink-0"
        style={{
          background: "var(--chat-input)",
          backdropFilter: "blur(40px) saturate(1.8)",
          WebkitBackdropFilter: "blur(40px) saturate(1.8)",
          borderTop: "1px solid var(--chat-msg-border)",
          paddingTop: "10px",
          paddingLeft: "12px",
          paddingRight: "12px",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}
      >
        {limitReached ? (
          <div className="rounded-2xl p-5 text-center space-y-3" style={{ background:"var(--chat-msg-bg)", border:"1px solid var(--chat-msg-border)" }}>
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color:"var(--text)" }}>{tChat("limit.title")}</p>
              <p className="text-xs" style={{ color:"var(--text-muted)" }}>{tChat("limit.resetsAt")}</p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color:"var(--text-muted)", flexShrink:0 }}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span className="text-base font-mono font-semibold tracking-widest" style={{ color:"var(--text)" }}>{countdown}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Link href="/pricing" className="btn-glow inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                {tChat("limit.proCta")}
              </Link>
              <TelegramSupportButton size="sm" label={tChat("limit.support")} />
            </div>
          </div>
        ) : (
          <>
            {/* Native hint */}
            {subject==="english" && showNativeHint && (
              <div className="mb-2 mx-auto max-w-xs rounded-2xl px-4 py-3 flex items-start gap-2" style={{
                background:"linear-gradient(135deg,rgba(59,130,246,0.10) 0%,rgba(29,78,216,0.07) 100%)",
                border:"1px solid rgba(59,130,246,0.22)",
                opacity: hintFading ? 0 : 1, transition:"opacity 0.4s ease",
              }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold mb-0.5" style={{ color:"#3B82F6" }}>{tChat("native.hintTitle")}</p>
                  <p className="text-xs leading-relaxed" style={{ color:"var(--text-muted)" }}>{tChat("native.hintText")}</p>
                </div>
                <button onClick={dismissNativeHint} className="shrink-0 rounded-lg p-1 transition-colors" style={{ color:"var(--text-muted)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            )}

            {/* Native mode chip */}
            {subject==="english" && (
              <div className="mb-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => { if(nativeModeActive){quickSend("Switch back to Russian — вернись в обычный режим");setNativeModeActive(false);}else{quickSend("Включи режим носителя — только на английском");setNativeModeActive(true);} }}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-50"
                  style={nativeModeActive
                    ? { background:"linear-gradient(135deg,#3B82F6,#1848C0)", color:"white", boxShadow:"0 2px 8px rgba(59,130,246,0.35)" }
                    : { background:"rgba(59,130,246,0.08)", color:"#3B82F6", border:"1px solid rgba(59,130,246,0.25)" }}
                >
                  <span>🗣️</span>
                  {nativeModeActive ? tChat("native.buttonActive") : tChat("native.button")}
                </button>
              </div>
            )}

            {/* Pending image preview */}
            {pendingImage && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded-xl border" style={{ background:"var(--chat-msg-bg)", borderColor:"var(--chat-msg-border)" }}>
                <img src={pendingImage.preview} alt={tChat("imagePhotoAlt")} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                <span className="text-xs flex-1" style={{ color:"var(--text-secondary)" }}>{tChat("imageAttached")}</span>
                <button type="button" onClick={() => setPendingImage(null)} className="text-lg leading-none px-1" style={{ color:"var(--text-muted)" }}>×</button>
              </div>
            )}

            {/* iOS 26 / Telegram-style input row */}
            <form onSubmit={sendMessage} className="flex gap-2 items-end">
              {isUltima && <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />}

              {/* Pill container: camera + textarea together */}
              <div className="flex-1 flex items-end rounded-[22px] overflow-hidden transition-all"
                style={{
                  border: "1px solid var(--chat-msg-border)",
                  background: "var(--chat-msg-bg)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                {isUltima && (
                  <button
                    type="button" onClick={() => fileInputRef.current?.click()} title={tChat("cameraTitle")}
                    className="shrink-0 flex items-center justify-center transition-all hover:opacity-70 self-end"
                    style={{ width:40, height:44, color:"var(--text-muted)", flexShrink:0 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </button>
                )}
                {!isUltima && (
                  <div className="self-end flex items-center justify-center" style={{ width:14, height:44, flexShrink:0 }} />
                )}
                <textarea
                  ref={textareaRef} value={input} rows={1}
                  onChange={(e) => { setInput(e.target.value); adjustTextareaHeight(); }}
                  onKeyDown={(e) => {
                    if (e.key==="Enter"&&(e.ctrlKey||e.metaKey)) { e.preventDefault(); if(input.trim()||pendingImage) sendMessage(e as unknown as React.FormEvent); }
                  }}
                  placeholder={pendingImage ? tChat("placeholderWithImage") : tChat("placeholder")}
                  disabled={loading}
                  className="flex-1 py-3 pr-3 disabled:opacity-50 focus:outline-none"
                  style={{
                    background:"transparent", color:"var(--text)", resize:"none",
                    minHeight:"44px", maxHeight:"240px", overflowY:"hidden",
                    lineHeight:"1.5", fontSize:"16px",
                    WebkitOverflowScrolling:"touch",
                  }}
                />
              </div>

              {/* Send button — circular floating */}
              <button
                type="submit" disabled={loading||(!input.trim()&&!pendingImage)}
                className="shrink-0 flex items-center justify-center transition-all disabled:opacity-35 active:scale-95"
                style={{
                  width:44, height:44, borderRadius:"50%",
                  background: (input.trim()||pendingImage) && !loading
                    ? `linear-gradient(135deg,${subjColor},${subjColor}cc)`
                    : "var(--chat-msg-bg)",
                  border: `1.5px solid ${(input.trim()||pendingImage) && !loading ? "transparent" : "var(--chat-msg-border)"}`,
                  color: (input.trim()||pendingImage) && !loading ? "white" : "var(--text-muted)",
                  boxShadow: (input.trim()||pendingImage) && !loading ? `0 3px 12px ${subjColor}45` : "none",
                  transition: "background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease",
                  alignSelf: "flex-end",
                }}
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
              </button>
            </form>
          </>
        )}
      </div>

      {/* ── Level Up celebration ─────────────────────────────────────────── */}
      {showLevelUp && levelUpData && (
        <div
          className="fixed bottom-6 left-1/2 w-[calc(100%-2rem)] max-w-sm rounded-2xl overflow-hidden shadow-2xl"
          style={{
            zIndex:9999,
            transform:`translateX(-50%) translateY(${levelUpFading?"8px":"0"})`,
            opacity: levelUpFading ? 0 : 1,
            transition:"opacity 0.5s ease, transform 0.5s ease",
            background:`linear-gradient(135deg,${levelUpData.color}ee,${levelUpData.color}99)`,
          }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_,i)=>(
              <div key={i} className="absolute rounded-full" style={{
                width:i%3===0?6:i%3===1?4:3, height:i%3===0?6:i%3===1?4:3,
                left:`${8+(i*7.5)%84}%`, bottom:`${10+(i*13)%60}%`,
                background:i%2===0?"rgba(255,255,255,0.9)":"rgba(255,220,100,0.85)",
                animation:`mentoraSpark ${1.2+(i%4)*0.4}s ease-in-out ${(i*0.15)%1.2}s infinite`,
              }} />
            ))}
          </div>
          <div className="relative z-10 px-5 pt-5 pb-5">
            <button onClick={dismissLevelUp} className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/20" style={{ color:"rgba(255,255,255,0.8)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color:"rgba(255,255,255,0.7)" }}>{tChat("levelUp.label")}</p>
            <p className="text-2xl font-bold text-white mb-2">{levelUpData.newLevel} ✦</p>
            <p className="text-sm leading-relaxed" style={{ color:"rgba(255,255,255,0.88)" }}>{levelUpData.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
