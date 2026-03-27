"use client";

import { useState } from "react";
import Link from "next/link";
import type { TopicPeriod } from "@/lib/topics";

interface Props {
  periods: TopicPeriod[];
}

export default function TopicsMap({ periods }: Props) {
  const [openId, setOpenId] = useState<string | null>(periods[0]?.id ?? null);

  return (
    <div className="space-y-2">
      {periods.map((period) => {
        const isOpen = openId === period.id;
        return (
          <div
            key={period.id}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          >
            {/* Period header */}
            <button
              onClick={() => setOpenId(isOpen ? null : period.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{period.emoji}</span>
                <div>
                  <div className="font-semibold text-sm text-gray-900">{period.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{period.years} · {period.topics.length} тем</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${period.color}`}>
                  {period.topics.length} тем
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Topics list */}
            {isOpen && (
              <div className="border-t border-gray-100 px-5 py-3 grid grid-cols-1 md:grid-cols-2 gap-1">
                {period.topics.map((topic, idx) => (
                  <Link
                    key={topic.id}
                    href={`/learn/russian-history?topic=${encodeURIComponent(topic.title)}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-brand-50 group transition-colors"
                  >
                    <span className="text-[11px] font-bold text-gray-300 w-5 shrink-0 group-hover:text-brand-400">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm text-gray-700 group-hover:text-brand-700 leading-snug">
                      {topic.title}
                    </span>
                    <svg
                      className="w-3.5 h-3.5 text-gray-200 group-hover:text-brand-400 ml-auto shrink-0 transition-colors"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
