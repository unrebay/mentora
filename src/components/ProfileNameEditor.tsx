"use client";
import { useState } from "react";

interface Props {
  currentNickname: string | null;
  changesLeft: number;
  currentFullName: string | null;
  currentAge: number | null;
}

const NICK_RE = /^[a-z0-9]{3,20}$/;

export function ProfileNameEditor({ currentNickname, changesLeft, currentFullName, currentAge }: Props) {
  const [editing, setEditing]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);
  const [left, setLeft]           = useState(changesLeft);
  const [savedNick, setSavedNick] = useState(currentNickname);
  const [fullName, setFullName]   = useState(currentFullName ?? "");
  const [nickname, setNickname]   = useState(currentNickname ?? "");
  const [age, setAge]             = useState(currentAge?.toString() ?? "");

  const nickChanged = nickname !== (savedNick ?? "");

  const handleSave = async () => {
    if (nickChanged) {
      if (left === 0) { setError("Лимит изменений никнейма исчерпан"); return; }
      if (!NICK_RE.test(nickname)) { setError("Никнейм: только a–z и 0–9, от 3 до 20 символов"); return; }
    }
    const ageNum = age ? Number(age) : undefined;
    if (ageNum !== undefined && (isNaN(ageNum) || ageNum < 1 || ageNum > 119)) { setError("Возраст: число от 1 до 119"); return; }

    setLoading(true); setError("");
    const res = await fetch("/api/profile/update-name", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nickname || undefined, fullName: fullName || undefined, age: ageNum }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Ошибка"); return; }
    if (nickChanged) { setSavedNick(nickname); setLeft(l => l - 1); }
    setEditing(false); setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const inputCls = "text-sm border b-default rounded-xl px-3 py-2 focus:outline-none focus:border-brand-400 s-input focus:bg-white dark:focus:bg-gray-800 transition-colors";

  return (
    <div className="mt-2">
      {!editing ? (
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(true)} className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors">
            Изменить профиль
          </button>
          {success && <span className="text-xs text-green-600">✓ Сохранено</span>}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-[11px] font-medium t-secondary uppercase tracking-wide mb-1 block">Имя</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Иван Иванов" maxLength={60}
              className={`${inputCls} w-full max-w-xs`} />
          </div>
          <div>
            <label className="text-[11px] font-medium t-secondary uppercase tracking-wide mb-1 block">
              Никнейм{" "}
              {left > 0 ? <span className="normal-case font-normal t-muted">({left} из 2 изменений)</span>
                        : <span className="normal-case font-normal text-orange-400">(лимит исчерпан)</span>}
            </label>
            <input value={nickname} onChange={e => { setNickname(e.target.value.toLowerCase()); setError(""); }}
              placeholder="andy123" maxLength={20} disabled={left === 0}
              className={`${inputCls} w-full max-w-xs disabled:opacity-40 disabled:cursor-not-allowed`} />
            <p className="text-[10px] t-muted mt-0.5">Только строчные a–z и 0–9, от 3 до 20 символов</p>
          </div>
          <div>
            <label className="text-[11px] font-medium t-secondary uppercase tracking-wide mb-1 block">Возраст</label>
            <input value={age} onChange={e => { setAge(e.target.value); setError(""); }} type="number" min={1} max={119} placeholder="25"
              className={`${inputCls} w-24`} />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={loading}
              className="text-sm px-5 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 font-medium transition-colors">
              {loading ? "Сохраняю..." : "Сохранить"}
            </button>
            <button onClick={() => { setEditing(false); setError(""); }}
              className="text-sm px-5 py-2 s-input t-secondary rounded-xl hover:s-input transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
