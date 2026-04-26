"use client";
import { useState, useEffect } from "react";

interface Props {
  currentNickname: string | null;
  changesLeft: number;
  currentFullName: string | null;
  currentAge: number | null;
  currentPhone: string | null;
}

const NICK_RE = /^[a-z0-9]{3,20}$/;

const COUNTRY_CODES = [
  { code: "+7",   flag: "🇷🇺", name: "Россия / Казахстан" },
  { code: "+1",   flag: "🇺🇸", name: "США / Канада" },
  { code: "+380", flag: "🇺🇦", name: "Украина" },
  { code: "+375", flag: "🇧🇾", name: "Беларусь" },
  { code: "+374", flag: "🇦🇲", name: "Армения" },
  { code: "+994", flag: "🇦🇿", name: "Азербайджан" },
  { code: "+995", flag: "🇬🇪", name: "Грузия" },
  { code: "+996", flag: "🇰🇬", name: "Кыргызстан" },
  { code: "+998", flag: "🇺🇿", name: "Узбекистан" },
  { code: "+992", flag: "🇹🇯", name: "Таджикистан" },
  { code: "+993", flag: "🇹🇲", name: "Туркменистан" },
  { code: "+49",  flag: "🇩🇪", name: "Германия" },
  { code: "+44",  flag: "🇬🇧", name: "Великобритания" },
  { code: "+33",  flag: "🇫🇷", name: "Франция" },
  { code: "+86",  flag: "🇨🇳", name: "Китай" },
  { code: "+91",  flag: "🇮🇳", name: "Индия" },
  { code: "+90",  flag: "🇹🇷", name: "Турция" },
  { code: "+971", flag: "🇦🇪", name: "ОАЭ" },
  { code: "+972", flag: "🇮🇱", name: "Израиль" },
];

function detectCountryCode(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const lang = navigator.language ?? "";
    if (tz.startsWith("Europe/Moscow") || tz.startsWith("Asia/Novosibirsk") ||
        tz.startsWith("Asia/Yekaterinburg") || tz.startsWith("Asia/Krasnoyarsk") ||
        tz.startsWith("Asia/Irkutsk") || tz.startsWith("Asia/Vladivostok") ||
        lang.startsWith("ru")) return "+7";
    if (tz.startsWith("Europe/Kiev") || tz.startsWith("Europe/Kyiv")) return "+380";
    if (tz.startsWith("Europe/Minsk")) return "+375";
    if (tz.startsWith("Asia/Tbilisi")) return "+995";
    if (tz.startsWith("Asia/Yerevan")) return "+374";
    if (tz.startsWith("Asia/Baku")) return "+994";
    if (tz.startsWith("Asia/Tashkent")) return "+998";
    if (tz.startsWith("Asia/Almaty") || tz.startsWith("Asia/Qyzylorda")) return "+7";
    if (tz.startsWith("Europe/Berlin")) return "+49";
    if (tz.startsWith("Europe/London")) return "+44";
    if (tz.startsWith("Europe/Paris")) return "+33";
    if (tz.startsWith("Asia/Shanghai") || tz.startsWith("Asia/Chongqing")) return "+86";
    if (tz.startsWith("Asia/Kolkata")) return "+91";
    if (tz.startsWith("Europe/Istanbul")) return "+90";
    if (tz.startsWith("Asia/Dubai")) return "+971";
    if (lang.startsWith("uk")) return "+380";
    if (lang.startsWith("be")) return "+375";
    if (lang.startsWith("de")) return "+49";
    if (lang.startsWith("tr")) return "+90";
  } catch {}
  return "+7";
}

function splitPhone(full: string | null): { cc: string; num: string } {
  if (!full) return { cc: "+7", num: "" };
  const matched = COUNTRY_CODES.find(c => full.startsWith(c.code));
  if (matched) return { cc: matched.code, num: full.slice(matched.code.length).trim() };
  return { cc: "+7", num: full };
}

export function ProfileNameEditor({ currentNickname, changesLeft, currentFullName, currentAge, currentPhone }: Props) {
  const [editing, setEditing]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);
  const [left, setLeft]           = useState(changesLeft);
  const [savedNick, setSavedNick] = useState(currentNickname);
  const [fullName, setFullName]   = useState(currentFullName ?? "");
  const [nickname, setNickname]   = useState(currentNickname ?? "");
  const [age, setAge]             = useState(currentAge?.toString() ?? "");

  const { cc: initCc, num: initNum } = splitPhone(currentPhone);
  const [countryCode, setCountryCode] = useState(initCc);
  const [phoneNum, setPhoneNum]       = useState(initNum);

  // Auto-detect country code on first open
  useEffect(() => {
    if (!currentPhone) {
      setCountryCode(detectCountryCode());
    }
  }, [currentPhone]);

  const nickChanged = nickname !== (savedNick ?? "");

  const handleSave = async () => {
    if (nickChanged) {
      if (left === 0) { setError("Лимит изменений никнейма исчерпан"); return; }
      if (!NICK_RE.test(nickname)) { setError("Никнейм: только a–z и 0–9, от 3 до 20 символов"); return; }
    }
    const ageNum = age ? Number(age) : undefined;
    if (ageNum !== undefined && (isNaN(ageNum) || ageNum < 1 || ageNum > 119)) { setError("Возраст: число от 1 до 119"); return; }

    const fullPhone = phoneNum.trim() ? `${countryCode}${phoneNum.trim()}` : undefined;

    setLoading(true); setError("");
    const res = await fetch("/api/profile/update-name", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nickname || undefined, fullName: fullName || undefined, age: ageNum, phone: fullPhone }),
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
          <div>
            <label className="text-[11px] font-medium t-secondary uppercase tracking-wide mb-1 block">
              Телефон <span className="normal-case font-normal t-muted">(необязательно)</span>
            </label>
            <div className="flex items-center gap-1 w-full max-w-xs">
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                className="text-sm border b-default rounded-xl pl-2 pr-1 py-2 focus:outline-none focus:border-brand-400 s-input focus:bg-white dark:focus:bg-gray-800 transition-colors shrink-0"
                style={{ width: "5.5rem" }}
              >
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <input
                value={phoneNum}
                onChange={e => setPhoneNum(e.target.value.replace(/[^\d\s\-()]/g, ""))}
                placeholder="900 000 00 00"
                maxLength={16}
                type="tel"
                className={`${inputCls} flex-1 min-w-0`}
              />
            </div>
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
