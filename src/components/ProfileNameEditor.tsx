"use client";
import { useState } from "react";

interface Props {
  currentName: string | null;
  changesLeft: number;
}

const RULES = "Только строчные буквы a–z и цифры 0–9. От 3 до 20 символов.";

export function ProfileNameEditor({ currentName, changesLeft }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState(currentName);
  const [left, setLeft] = useState(changesLeft);

  const validate = (v: string) => /^[a-z0-9]{3,20}$/.test(v);

  const handleSave = async () => {
    if (!validate(value)) { setError(RULES); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/profile/update-name", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: value }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); setConfirming(false); return; }
    setName(value); setLeft(l => l - 1);
    setEditing(false); setConfirming(false); setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  if (left === 0 && !editing) {
    return (
      <div className="mt-2">
        <p className="text-sm font-semibold text-gray-900">{name ?? "—"}</p>
        <p className="text-xs text-gray-400 mt-0.5">Имя изменено максимальное число раз</p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      {!editing ? (
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-gray-900">{name ?? <span className="text-gray-400 italic">не задано</span>}</p>
          <button onClick={() => { setEditing(true); setValue(name ?? ""); }}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium">
            ✏️ Изменить
          </button>
          {success && <span className="text-xs text-green-600">✓ Сохранено</span>}
        </div>
      ) : confirming ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">Сменить имя на <strong>{value}</strong>?</p>
          <p className="text-xs text-orange-600">Осталось изменений: {left - 1} из 2</p>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={loading}
              className="text-xs px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50">
              {loading ? "..." : "Подтвердить"}
            </button>
            <button onClick={() => setConfirming(false)}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
              Назад
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input value={value} onChange={e => { setValue(e.target.value.toLowerCase()); setError(""); }}
            placeholder="andy123" maxLength={20}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:border-brand-400"/>
          <p className="text-[11px] text-gray-400">{RULES}</p>
          <p className="text-[11px] text-gray-400">Осталось изменений: <strong>{left}</strong> из 2</p>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => { if (validate(value)) setConfirming(true); else setError(RULES); }}
              className="text-xs px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
              Далее →
            </button>
            <button onClick={() => { setEditing(false); setError(""); }}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
