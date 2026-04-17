"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Chunk = {
  id: string;
  subject: string;
  topic: string | null;
  content: string;
  source: string | null;
  language: string;
  created_at: string;
};

const SUBJECTS = ["russian-history", "world-history", "mathematics", "physics", "chemistry", "biology", "russian-language", "literature", "english", "social-studies", "geography", "computer-science", "astronomy"];
const emptyForm = { subject: "russian-history", topic: "", content: "", source: "", language: "ru" };

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "white",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
} as const;

export default function AdminPage() {
  const router = useRouter();
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterSubject, setFilterSubject] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkSubject, setBulkSubject] = useState("russian-history");
  const [bulkImporting, setBulkImporting] = useState(false);
  const [tab, setTab] = useState<"list" | "add" | "bulk">("list");
  const [msg, setMsg] = useState("");
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), subject: filterSubject, search });
    const res = await fetch(`/api/admin/knowledge?${params}`);
    if (res.status === 403) { router.push("/dashboard"); return; }
    const json = await res.json();
    setChunks(json.data ?? []);
    setTotal(json.count ?? 0);
    setLoading(false);
  }, [page, filterSubject, search, router]);

  useEffect(() => { load(); }, [load]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const bulkDelete = async () => {
    if (!selected.size || !confirm(`Удалить ${selected.size} записей?`)) return;
    await fetch("/api/admin/knowledge", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selected) }) });
    setSelected(new Set());
    flash(`Удалено ${selected.size} записей`);
    load();
  };

  const startEdit = (c: Chunk) => {
    setEditId(c.id);
    setForm({ subject: c.subject, topic: c.topic ?? "", content: c.content, source: c.source ?? "", language: c.language });
    setTab("add");
  };

  const cancelEdit = () => { setEditId(null); setForm(emptyForm); };

  const saveChunk = async () => {
    if (!form.subject || !form.content.trim()) return;
    setSaving(true);
    const url = editId ? `/api/admin/knowledge/${editId}` : "/api/admin/knowledge";
    const res = await fetch(url, { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { flash(editId ? "Обновлено ✓" : "Добавлено ✓"); setEditId(null); setForm(emptyForm); setTab("list"); load(); }
    else { const j = await res.json(); flash("Ошибка: " + j.error); }
  };

  const bulkImport = async () => {
    const blocks = bulkText.split(/\n---\n/).map(b => b.trim()).filter(Boolean);
    if (!blocks.length) return;
    setBulkImporting(true);
    let ok = 0;
    for (const block of blocks) {
      const lines = block.split("\n");
      let topic = "", source = "";
      const contentLines: string[] = [];
      for (const line of lines) {
        if (line.startsWith("Topic:")) topic = line.slice(6).trim();
        else if (line.startsWith("Source:")) source = line.slice(7).trim();
        else contentLines.push(line);
      }
      const content = contentLines.join("\n").trim();
      if (!content) continue;
      const res = await fetch("/api/admin/knowledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: bulkSubject, topic, content, source, language: "ru" }) });
      if (res.ok) ok++;
    }
    setBulkImporting(false);
    setBulkText("");
    flash(`Импортировано ${ok} из ${blocks.length}`);
    setTab("list");
    load();
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-[#060610] text-white p-4 md:p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">
          <span style={{
            background: "linear-gradient(120deg, #6B8FFF, #4561E8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            База знаний
          </span>
        </h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Всего: {total} чанков</p>
      </div>

      {/* Flash message */}
      {msg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["list", "add", "bulk"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); if (t !== "add") cancelEdit(); }}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === t
              ? { background: "linear-gradient(135deg, #4561E8, #6B8FFF)", color: "white" }
              : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }
            }>
            {t === "list" ? "Список" : t === "add" ? (editId ? "Редактировать" : "Добавить") : "Массовый импорт"}
          </button>
        ))}
      </div>

      {/* LIST TAB */}
      {tab === "list" && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            <select
              value={filterSubject}
              onChange={e => { setFilterSubject(e.target.value); setPage(1); }}
              style={{ ...inputStyle, width: "auto" }}>
              <option value="">Все предметы</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Поиск..."
              style={{ ...inputStyle, flex: 1, minWidth: "180px" }}
            />
            {selected.size > 0 && (
              <button onClick={bulkDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                Удалить ({selected.size})
              </button>
            )}
          </div>

          {loading ? (
            <p style={{ color: "rgba(255,255,255,0.4)" }} className="text-sm">Загрузка...</p>
          ) : chunks.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.4)" }} className="text-sm">Нет записей</p>
          ) : (
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <th className="p-3 w-8">
                      <input type="checkbox"
                        checked={selected.size === chunks.length && chunks.length > 0}
                        onChange={() => selected.size === chunks.length ? setSelected(new Set()) : setSelected(new Set(chunks.map(c => c.id)))}
                        style={{ accentColor: "#4561E8" }}
                      />
                    </th>
                    <th className="p-3 text-left text-xs font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Предмет / Тема</th>
                    <th className="p-3 text-left text-xs font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Контент</th>
                    <th className="p-3 w-24 text-xs font-semibold tracking-wider text-right" style={{ color: "rgba(255,255,255,0.4)" }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {chunks.map((c, i) => (
                    <tr key={c.id}
                      style={{
                        borderBottom: i < chunks.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                        background: selected.has(c.id) ? "rgba(69,97,232,0.06)" : "transparent",
                      }}
                      className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3">
                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} style={{ accentColor: "#4561E8" }} />
                      </td>
                      <td className="p-3 pr-4">
                        <div className="font-medium text-xs mb-0.5" style={{ color: "#6B8FFF" }}>{c.subject}</div>
                        <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{c.topic}</div>
                      </td>
                      <td className="p-3 pr-4 max-w-xs">
                        <div className="text-xs line-clamp-2" style={{ color: "rgba(255,255,255,0.6)" }}>{c.content}</div>
                        {c.source && (
                          <div className="text-xs mt-1 flex items-center gap-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 9.5A1.5 1.5 0 0 1 3.5 8H10" /><path d="M3.5 2H10v8H3.5A1.5 1.5 0 0 1 2 8.5v-5A1.5 1.5 0 0 1 3.5 2z" /></svg>
                            {c.source}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => startEdit(c)} className="text-xs font-medium mr-3 hover:opacity-70 transition-opacity" style={{ color: "#6B8FFF" }}>Изм.</button>
                        <button
                          onClick={async () => { if (!confirm("Удалить?")) return; await fetch(`/api/admin/knowledge/${c.id}`, { method: "DELETE" }); flash("Удалено"); load(); }}
                          className="text-xs font-medium hover:opacity-70 transition-opacity" style={{ color: "#ef4444" }}>
                          Удал.
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pages > 1 && (
            <div className="flex gap-2 mt-4 items-center">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>←</button>
              <span className="px-3 py-1.5 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{page}/{pages}</span>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>→</button>
            </div>
          )}
        </div>
      )}

      {/* ADD/EDIT TAB */}
      {tab === "add" && (
        <div className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Предмет *</label>
              <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={inputStyle}>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Язык</label>
              <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} style={inputStyle}>
                <option value="ru">ru</option>
                <option value="en">en</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Тема</label>
            <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="напр. Отечественная война 1812 года" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Контент *</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8}
              placeholder="Текст знания..."
              style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace" }} />
          </div>
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Источник</label>
            <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="напр. Учебник истории 10 класс" style={inputStyle} />
          </div>
          <div className="flex gap-3">
            <button onClick={saveChunk} disabled={saving || !form.content.trim()}
              className="btn-glow px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50">
              {saving ? "Сохранение..." : editId ? "Обновить" : "Добавить"}
            </button>
            {editId && (
              <button onClick={cancelEdit}
                className="px-4 py-2.5 rounded-xl text-sm transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                Отмена
              </button>
            )}
          </div>
        </div>
      )}

      {/* BULK TAB */}
      {tab === "bulk" && (
        <div className="max-w-2xl space-y-4">
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Предмет</label>
            <select value={bulkSubject} onChange={e => setBulkSubject(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Блоки разделяются строкой <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(255,200,0,0.12)", color: "#fbbf24" }}>---</code>
            </label>
            <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              Каждый блок: <code style={{ color: "rgba(255,255,255,0.5)" }}>Topic: тема</code> / <code style={{ color: "rgba(255,255,255,0.5)" }}>Source: источник</code>
            </p>
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={12}
              placeholder={"Topic: Война 1812\nSource: Учебник 10 кл.\nНаполеон вторгся в Россию...\n---\nTopic: Бородино\nБитва 7 сентября 1812..."}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace" }} />
          </div>
          <button onClick={bulkImport} disabled={bulkImporting || !bulkText.trim()}
            className="btn-glow px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50">
            {bulkImporting ? "Импорт..." : "Импортировать блоки"}
          </button>
        </div>
      )}
    </div>
  );
}
