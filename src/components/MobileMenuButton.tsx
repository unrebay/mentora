"use client";
import { useState } from "react";
import Link from "next/link";

interface NavLink {
  href: string;
  label: string;
  active?: boolean;
}

interface Props {
  links: NavLink[];
}

export default function MobileMenuButton({ links }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger icon */}
      <button
        className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-lg shrink-0"
        style={{ color: "var(--text)" }}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
      >
        <span
          className="block w-5 h-0.5 bg-current transition-all duration-200 origin-center"
          style={{ transform: open ? "rotate(45deg) translate(0, 7px)" : "none" }}
        />
        <span
          className="block w-5 h-0.5 bg-current transition-all duration-200"
          style={{ opacity: open ? 0 : 1 }}
        />
        <span
          className="block w-5 h-0.5 bg-current transition-all duration-200 origin-center"
          style={{ transform: open ? "rotate(-45deg) translate(0, -7px)" : "none" }}
        />
      </button>

      {/* Dropdown — rendered outside button, via portal-like sibling injection */}
      {open && (
        <div
          className="md:hidden fixed left-0 right-0 z-40 border-b px-6 py-5 flex flex-col gap-1"
          style={{
            top: "65px",
            background: "var(--bg-nav)",
            borderColor: "var(--border-light)",
            backdropFilter: "blur(12px)",
          }}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium py-2.5 border-b last:border-0 transition-opacity hover:opacity-70"
              style={{
                color: link.active ? "var(--text)" : "var(--text-secondary)",
                fontWeight: link.active ? 600 : 500,
                borderColor: "var(--border-light)",
              }}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
