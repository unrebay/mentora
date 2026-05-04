/**
 * LevelAvatar — космические аватарки 8 уровней Mentora.
 * 0=Луна → 7=Кубок (Академик). Inline SVG, никаких внешних запросов.
 */

interface Props {
  level: number;     // 0..7
  size?: number;     // px, default 40
  className?: string;
}

export const LEVEL_NAMES = [
  "Луна", "Меркурий", "Плутон", "Земля",
  "Марс", "Юпитер", "Сатурн", "Кубок",
] as const;

export const LEVEL_TIER_NAMES = [
  "Новичок", "Исследователь", "Знаток", "Историк",
  "Эксперт", "Магистр", "Доктор", "Академик",
] as const;

export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 2500, 5000, 10000] as const;

export function unlockedLevel(xp: number): number {
  let l = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) l = i;
  }
  return l;
}

export default function LevelAvatar({ level, size = 40, className }: Props) {
  const lv = Math.max(0, Math.min(7, level));
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      {lv === 0 && <Moon />}
      {lv === 1 && <Mercury />}
      {lv === 2 && <Pluto />}
      {lv === 3 && <Earth />}
      {lv === 4 && <Mars />}
      {lv === 5 && <Jupiter />}
      {lv === 6 && <Saturn />}
      {lv === 7 && <Trophy />}
    </svg>
  );
}

const HL = (id: string) => (
  <radialGradient id={id} cx="32%" cy="28%" r="32%">
    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
  </radialGradient>
);

function Moon() {
  return (<>
    <defs>
      <radialGradient id="muG" cx="33%" cy="30%" r="72%">
        <stop offset="0%" stopColor="#fbfaf2" /><stop offset="50%" stopColor="#cbc7b9" /><stop offset="100%" stopColor="#454340" />
      </radialGradient>{HL("muHl")}
      <clipPath id="muClip"><circle cx="50" cy="50" r="38" /></clipPath>
    </defs>
    <circle cx="50" cy="50" r="38" fill="url(#muG)" />
    <g clipPath="url(#muClip)" opacity="0.55">
      <ellipse cx="36" cy="33" rx="14" ry="9" fill="#7d7a72" />
      <ellipse cx="60" cy="40" rx="10" ry="7" fill="#7d7a72" />
      <ellipse cx="55" cy="60" rx="11" ry="8" fill="#857f73" />
      <ellipse cx="38" cy="68" rx="6" ry="4" fill="#857f73" />
    </g>
    <g clipPath="url(#muClip)">
      <circle cx="58" cy="74" r="3.5" fill="#3d3b36" />
      <circle cx="58" cy="74" r="3.5" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="0.7" />
      <line x1="58" y1="74" x2="42" y2="88" stroke="#fff" strokeOpacity="0.42" strokeWidth="0.7" />
      <line x1="58" y1="74" x2="74" y2="88" stroke="#fff" strokeOpacity="0.42" strokeWidth="0.7" />
      <circle cx="48" cy="48" r="2.4" fill="#3d3b36" />
      <circle cx="48" cy="48" r="2.4" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="0.5" />
      <circle cx="68" cy="58" r="1.6" fill="#3d3b36" />
      <circle cx="32" cy="50" r="1.4" fill="#3d3b36" />
      <circle cx="62" cy="30" r="1.2" fill="#3d3b36" />
      <circle cx="42" cy="58" r="1" fill="#3d3b36" />
    </g>
    <ellipse cx="38" cy="34" rx="22" ry="12" fill="url(#muHl)" clipPath="url(#muClip)" />
  </>);
}

function Mercury() {
  return (<>
    <defs>
      <radialGradient id="mcG" cx="33%" cy="30%" r="74%">
        <stop offset="0%" stopColor="#f0c98a" /><stop offset="50%" stopColor="#7e5e2e" /><stop offset="100%" stopColor="#1f1206" />
      </radialGradient>{HL("mcHl")}
      <clipPath id="mcClip"><circle cx="50" cy="50" r="36" /></clipPath>
    </defs>
    <circle cx="50" cy="50" r="36" fill="url(#mcG)" />
    <g clipPath="url(#mcClip)" opacity="0.7">
      <ellipse cx="40" cy="33" rx="18" ry="10" fill="#5a3914" />
      <ellipse cx="40" cy="33" rx="14" ry="7" fill="#7d4f1f" opacity="0.7" />
      <ellipse cx="40" cy="33" rx="9" ry="4" fill="#a36f30" opacity="0.5" />
    </g>
    <g clipPath="url(#mcClip)">
      <circle cx="62" cy="44" r="2.6" fill="#3a2310" />
      <circle cx="62" cy="44" r="2.6" fill="none" stroke="#fff5dc" strokeOpacity="0.55" strokeWidth="0.5" />
      <circle cx="68" cy="58" r="1.8" fill="#3a2310" />
      <circle cx="38" cy="62" r="2.2" fill="#3a2310" />
      <circle cx="56" cy="64" r="1.4" fill="#3a2310" />
      <circle cx="52" cy="48" r="1.6" fill="#3a2310" />
      <circle cx="46" cy="58" r="1" fill="#3a2310" />
      <circle cx="60" cy="32" r="1.2" fill="#3a2310" />
    </g>
    <ellipse cx="36" cy="32" rx="20" ry="10" fill="url(#mcHl)" clipPath="url(#mcClip)" />
  </>);
}

function Pluto() {
  return (<>
    <defs>
      <radialGradient id="plG" cx="33%" cy="30%" r="72%">
        <stop offset="0%" stopColor="#fbe1ba" /><stop offset="50%" stopColor="#9c6c3a" /><stop offset="100%" stopColor="#241407" />
      </radialGradient>{HL("plHl")}
      <clipPath id="plClip"><circle cx="50" cy="50" r="34" /></clipPath>
    </defs>
    <circle cx="50" cy="50" r="34" fill="url(#plG)" />
    <g clipPath="url(#plClip)">
      <path d="M48 50 Q50 44 56 44 Q63 44 65 50 Q67 56 64 60 Q60 65 56 64 Q54 64 52 64 Q48 65 46 60 Q44 55 48 50 Z" fill="#fff5d8" opacity="0.88" />
      <ellipse cx="32" cy="48" rx="10" ry="7" fill="#321a08" opacity="0.75" />
      <ellipse cx="32" cy="48" rx="6" ry="4" fill="#1a0d04" opacity="0.6" />
      <circle cx="68" cy="40" r="2.4" fill="#3a1f0c" opacity="0.7" />
    </g>
    <ellipse cx="36" cy="34" rx="18" ry="9" fill="url(#plHl)" clipPath="url(#plClip)" />
  </>);
}

function Earth() {
  return (<>
    <defs>
      <radialGradient id="eaG" cx="32%" cy="30%" r="74%">
        <stop offset="0%" stopColor="#a4dbff" /><stop offset="48%" stopColor="#1c66c0" /><stop offset="100%" stopColor="#02152e" />
      </radialGradient>
      <radialGradient id="atmG" cx="50%" cy="50%" r="52%">
        <stop offset="86%" stopColor="#7ed1ff" stopOpacity="0" />
        <stop offset="98%" stopColor="#7ed1ff" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#7ed1ff" stopOpacity="0" />
      </radialGradient>{HL("eaHl")}
      <clipPath id="eaClip"><circle cx="50" cy="50" r="38" /></clipPath>
    </defs>
    <circle cx="50" cy="50" r="44" fill="url(#atmG)" />
    <circle cx="50" cy="50" r="38" fill="url(#eaG)" />
    <g clipPath="url(#eaClip)" fill="#2a8d44">
      <path d="M30 30 Q36 26 42 30 Q48 36 44 42 Q38 46 32 42 Q26 36 30 30 Z" opacity="0.96" />
      <path d="M48 36 Q60 30 70 36 Q76 46 74 54 Q70 62 62 62 Q56 56 50 50 Q46 42 48 36 Z" opacity="0.96" />
      <path d="M40 60 Q50 56 56 62 Q56 68 50 70 Q42 70 40 64 Z" opacity="0.92" />
      <ellipse cx="68" cy="72" rx="6" ry="3" opacity="0.88" />
    </g>
    <ellipse cx="50" cy="14" rx="11" ry="3.5" fill="#fff" opacity="0.82" clipPath="url(#eaClip)" />
    <ellipse cx="50" cy="86" rx="11" ry="3.5" fill="#fff" opacity="0.82" clipPath="url(#eaClip)" />
    <ellipse cx="36" cy="32" rx="20" ry="11" fill="url(#eaHl)" clipPath="url(#eaClip)" />
  </>);
}

function Mars() {
  return (<>
    <defs>
      <radialGradient id="maG" cx="34%" cy="30%" r="74%">
        <stop offset="0%" stopColor="#ffba8c" /><stop offset="50%" stopColor="#c84527" /><stop offset="100%" stopColor="#28080a" />
      </radialGradient>{HL("maHl")}
      <clipPath id="maClip"><circle cx="50" cy="50" r="36" /></clipPath>
    </defs>
    <circle cx="50" cy="50" r="36" fill="url(#maG)" />
    <ellipse cx="50" cy="18" rx="13" ry="3.6" fill="#fff" opacity="0.9" clipPath="url(#maClip)" />
    <ellipse cx="50" cy="82" rx="11" ry="3" fill="#fff" opacity="0.82" clipPath="url(#maClip)" />
    <g clipPath="url(#maClip)">
      <ellipse cx="32" cy="36" rx="7" ry="5" fill="#7e2410" opacity="0.82" />
      <circle cx="32" cy="36" r="2" fill="#3f1207" />
      <ellipse cx="32" cy="36" rx="3" ry="2" fill="none" stroke="#fff5dc" strokeOpacity="0.4" strokeWidth="0.4" />
      <path d="M30 56 Q44 50 60 54 Q72 58 80 56" stroke="#5a1a08" strokeWidth="3.4" fill="none" strokeLinecap="round" opacity="0.9" />
      <ellipse cx="62" cy="68" rx="6" ry="2.5" fill="#7e2410" opacity="0.55" />
    </g>
    <ellipse cx="36" cy="32" rx="20" ry="11" fill="url(#maHl)" clipPath="url(#maClip)" />
  </>);
}

function Jupiter() {
  return (<>
    <defs>
      <radialGradient id="juG" cx="34%" cy="32%" r="72%">
        <stop offset="0%" stopColor="#fff0d3" /><stop offset="50%" stopColor="#cf8a4a" /><stop offset="100%" stopColor="#2c1804" />
      </radialGradient>{HL("juHl")}
      <clipPath id="juClip"><circle cx="50" cy="50" r="38" /></clipPath>
    </defs>
    <circle cx="50" cy="50" r="38" fill="url(#juG)" />
    <g clipPath="url(#juClip)">
      <ellipse cx="50" cy="32" rx="42" ry="3" fill="#a8693a" opacity="0.75" />
      <ellipse cx="50" cy="40" rx="42" ry="3" fill="#7d4823" opacity="0.75" />
      <ellipse cx="50" cy="46" rx="42" ry="2.2" fill="#d49d62" opacity="0.55" />
      <ellipse cx="50" cy="54" rx="42" ry="3" fill="#a8693a" opacity="0.7" />
      <ellipse cx="50" cy="62" rx="42" ry="3" fill="#7d4823" opacity="0.75" />
      <ellipse cx="50" cy="70" rx="42" ry="2" fill="#a8693a" opacity="0.65" />
      <ellipse cx="62" cy="58" rx="9" ry="4.5" fill="#c8401e" />
      <ellipse cx="62" cy="58" rx="6.5" ry="3" fill="#892008" />
      <ellipse cx="62" cy="58" rx="3" ry="1.5" fill="#5e1303" />
    </g>
    <ellipse cx="36" cy="32" rx="20" ry="11" fill="url(#juHl)" clipPath="url(#juClip)" />
  </>);
}

function Saturn() {
  return (<>
    <defs>
      <radialGradient id="saG" cx="34%" cy="32%" r="64%">
        <stop offset="0%" stopColor="#ffeab3" /><stop offset="55%" stopColor="#caa056" /><stop offset="100%" stopColor="#3e2308" />
      </radialGradient>
      <linearGradient id="ringG" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stopColor="#a17835" stopOpacity="0" />
        <stop offset="20%" stopColor="#caa056" />
        <stop offset="50%" stopColor="#fff1cc" />
        <stop offset="80%" stopColor="#caa056" />
        <stop offset="100%" stopColor="#a17835" stopOpacity="0" />
      </linearGradient>{HL("saHl")}
      <clipPath id="saClip"><circle cx="50" cy="50" r="26" /></clipPath>
    </defs>
    <ellipse cx="50" cy="56" rx="46" ry="9" fill="none" stroke="url(#ringG)" strokeWidth="3.5" />
    <ellipse cx="50" cy="56" rx="42" ry="7" fill="none" stroke="#3a2308" strokeWidth="0.7" opacity="0.5" />
    <ellipse cx="50" cy="56" rx="38" ry="5.5" fill="none" stroke="#fff" strokeWidth="0.6" strokeOpacity="0.25" />
    <circle cx="50" cy="50" r="26" fill="url(#saG)" />
    <g clipPath="url(#saClip)">
      <ellipse cx="50" cy="40" rx="28" ry="2" fill="#a17835" opacity="0.6" />
      <ellipse cx="50" cy="48" rx="28" ry="1.6" fill="#7c5621" opacity="0.55" />
      <ellipse cx="50" cy="56" rx="28" ry="2" fill="#a17835" opacity="0.55" />
    </g>
    <ellipse cx="56" cy="56" rx="14" ry="2" fill="#000" opacity="0.25" clipPath="url(#saClip)" />
    <ellipse cx="40" cy="36" rx="14" ry="7" fill="url(#saHl)" clipPath="url(#saClip)" />
  </>);
}

function Trophy() {
  return (<>
    <defs>
      <linearGradient id="cupG" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#fff2a3" /><stop offset="40%" stopColor="#f7b94a" /><stop offset="100%" stopColor="#7e4e07" />
      </linearGradient>
      <linearGradient id="cupTopG" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#fff7c4" /><stop offset="100%" stopColor="#f6a82a" />
      </linearGradient>
      <radialGradient id="raysG" cx="50%" cy="46%" r="55%">
        <stop offset="0%" stopColor="#ffe7a3" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#ffe7a3" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#raysG)" />
    <g opacity="0.5">
      <line x1="50" y1="6" x2="50" y2="14" stroke="#f6a82a" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="86" y1="22" x2="80" y2="28" stroke="#f6a82a" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="14" y1="22" x2="20" y2="28" stroke="#f6a82a" strokeWidth="1.4" strokeLinecap="round" />
    </g>
    <path d="M30 26 H70 V44 Q70 60 50 60 Q30 60 30 44 Z" fill="url(#cupG)" stroke="#5d3402" strokeWidth="1.2" />
    <path d="M30 30 Q18 32 18 44 Q18 52 30 52" stroke="#5d3402" strokeWidth="2.6" fill="none" />
    <path d="M70 30 Q82 32 82 44 Q82 52 70 52" stroke="#5d3402" strokeWidth="2.6" fill="none" />
    <ellipse cx="50" cy="26" rx="20" ry="3.6" fill="url(#cupTopG)" stroke="#5d3402" strokeWidth="1" />
    <text x="50" y="50" textAnchor="middle" fontSize="16" fontWeight="700" fill="#5d3402">★</text>
    <path d="M44 60 H56 V68 H44 Z" fill="url(#cupG)" stroke="#5d3402" strokeWidth="1" />
    <ellipse cx="50" cy="76" rx="16" ry="3.6" fill="url(#cupTopG)" stroke="#5d3402" strokeWidth="1.2" />
    <ellipse cx="42" cy="34" rx="3" ry="6" fill="#fff" opacity="0.55" />
  </>);
}
