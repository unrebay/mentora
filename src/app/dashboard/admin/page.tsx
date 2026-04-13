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
    await fetch("/api/admin/knowledge", { method: "DELETE", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ ids: Array.from(selected) }) });
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
    const res = await fetch(url, { method: editId ? "PUT" : "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(form) });
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
      const res = await fetch("/api/admin/knowledge", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ subject: bulkSubject, topic, content, source, language: "ru" }) });
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
    <div className="min-h-screen bg-gray-950 text-white p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">База знаний</h1>
      <p className="text-gray-400 text-sm mb-6">Всего: {total} чанков</p>
      {msg && <div className="mb-4 px-4 py-2 bg-green-800 text-green-100 rounded text-sm">{msg}</div>}
      <div className="flex gap-2 mb-6">
        {(["list","add","bulk"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); if (t!=="add") cancelEdit(); }}
            className={`px-4 py-2 rounded text-sm font-medium transition ${tab===t?"bg-indigo-600":"bg-gray-800 hover:bg-gray-700"}`}>
            {t==="list"?"Список":t==="add"?(editId?"Редактировать":"Добавить"):"Массовый импорт"}
          </button>
        ))}
      </div>

      {tab==="list" && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            <select value={filterSubject} onChange={e=>{setFilterSubject(e.target.value);setPage(1);}} className="bg-gray-800 rounded px-3 py-2 text-sm">
              <option value="">Все предметы</option>
              {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Поиск..." className="bg-gray-800 rounded px-3 py-2 text-sm flex-1 min-w-48"/>
            {selected.size>0 && <button onClick={bulkDelete} className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded text-sm">Удалить ({selected.size})</button>}
          </div>
          {loading ? <p className="text-gray-400">Загрузка...</p> : chunks.length===0 ? <p className="text-gray-400">Нет записей</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-gray-400 border-b border-gray-800">
                <th className="pb-2 w-8"><input type="checkbox" checked={selected.size===chunks.length} onChange={()=>selected.size===chunks.length?setSelected(new Set()):setSelected(new Set(chunks.map(c=>c.id)))}/></th>
                <th className="pb-2 text-left">Предмет / Тема</th>
                <th className="pb-2 text-left">Контент</th>
                <th className="pb-2 w-20">Действия</th>
              </tr></thead>
              <tbody>{chunks.map(c=>(
                <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-900">
                  <td className="py-2"><input type="checkbox" checked={selected.has(c.id)} onChange={()=>toggleSelect(c.id)}/></td>
                  <td className="py-2 pr-3"><div className="font-medium text-indigo-400">{c.subject}</div><div className="text-gray-400">{c.topic}</div></td>
                  <td className="py-2 pr-3 text-gray-300 text-xs max-w-xs"><div className="line-clamp-2">{c.content}</div>{c.source&&<div className="text-gray-500 mt-1">📚 {c.source}</div>}</td>
                  <td className="py-2">
                    <button onClick={()=>startEdit(c)} className="text-indigo-400 hover:text-indigo-300 mr-2 text-xs">Изм.</button>
                    <button onClick={async()=>{if(!confirm("Удалить?"))return;await fetch(`/api/admin/knowledge/${c.id}`,{method:"DELETE"});flash("Удалено");load();}} className="text-red-400 hover:text-red-300 text-xs">Удал.</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {pages>1&&<div className="flex gap-2 mt-4">
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 bg-gray-800 rounded disabled:opacity-40">←</button>
            <span className="px-3 py-1 text-gray-400">{page}/{pages}</span>
            <button disabled={page===pages} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 bg-gray-800 rounded disabled:opacity-40">→</button>
          </div>}
        </div>
      )}

      {tab==="add" && (
        <div className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-gray-400 mb-1">Предмет *</label>
              <select value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} className="w-full bg-gray-800 rounded px-3 py-2 text-sm">
                {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
              </select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Язык</label>
              <select value={form.language} onChange={e=>setForm(f=>({...f,language:e.target.value}))} className="w-full bg-gray-800 rounded px-3 py-2 text-sm">
                <option value="ru">ru</option><option value="en">en</option>
              </select></div>
          </div>
          <div><label className="block text-xs text-gray-400 mb-1">Тема</label>
            <input value={form.topic} onChange={e=>setForm(f=>({...f,topic:e.target.value}))} placeholder="напр. Отечественная война 1812 года" className="w-full bg-gray-800 rounded px-3 py-2 text-sm"/></div>
          <div><label className="block text-xs text-gray-400 mb-1">Контент *</label>
            <textarea value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} rows={8} placeholder="Текст знания..." className="w-full bg-gray-800 rounded px-3 py-2 text-sm font-mono"/></div>
          <div><label className="block text-xs text-gray-400 mb-1">Источник</label>
            <input value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))} placeholder="напр. Учебник истории 10 класс" className="w-full bg-gray-800 rounded px-3 py-2 text-sm"/></div>
          <div className="flex gap-3">
            <button onClick={saveChunk} disabled={saving||!form.content.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-6 py-2 rounded text-sm font-medium">
              {saving?"Сохранение...":editId?"Обновить":"Добавить"}
            </button>
            {editId&&<button onClick={cancelEdit} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">Отмена</button>}
          </div>
        </div>
      )}

      {tab==="bulk" && (
        <div className="max-w-2xl space-y-4">
          <div><label className="block text-xs text-gray-400 mb-1">Предмет</label>
            <select value={bulkSubject} onChange={e=>setBulkSubject(e.target.value)} className="bg-gray-800 rounded px-3 py-2 text-sm">
              {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
            </select></div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Блоки разделяются строкой <code className="text-yellow-400">---</code></label>
            <p className="text-xs text-gray-500 mb-2">Каждый блок: <code className="text-gray-300">Topic: тема</code> / <code className="text-gray-300">Source: источник</code></p>
            <textarea value={bulkText} onChange={e=>setBulkText(e.target.value)} rows={12}
              placeholder={"Topic: Война 1812\nSource: Учебник 10 кл.\nНаполеон вторгся в Россию...\n---\nTopic: Бородино\nБитва 7 сентября 1812..."}
              className="w-full bg-gray-800 rounded px-3 py-2 text-sm font-mono"/>
          </div>
          <button onClick={bulkImport} disabled={bulkImporting||!bulkText.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-6 py-2 rounded text-sm font-medium">
            {bulkImporting?"Импорт...":"Импортировать блоки"}
          </button>
        </div>
      )}
    </div>
  );
}
