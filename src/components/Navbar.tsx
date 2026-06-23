"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

const links = [
  { href: "/wishlists", label: "Мои вишлисты" },
  { href: "/users", label: "Пользователи" },
  { href: "/profile", label: "Личный кабинет" },
];

export function Navbar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4">
        {/* Верхняя строка */}
        <div className="flex h-14 items-center justify-between">
          <Link
            href="/wishlists"
            className="text-lg font-bold text-gray-900"
            onClick={() => setOpen(false)}
          >
            🎁 Wishlist
          </Link>

          {/* Desktop-меню */}
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  pathname === l.href
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop: email + выход */}
          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button
              onClick={signOut}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Выйти
            </button>
          </div>

          {/* Бургер (только мобила) */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Меню"
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 sm:hidden"
          >
            {open ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Мобильное выпадающее меню */}
        {open && (
          <nav className="flex flex-col gap-1 border-t border-gray-100 py-3 sm:hidden">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  pathname === l.href
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-gray-100 pt-3">
              {user?.email && (
                <p className="px-3 pb-2 text-xs text-gray-400">{user.email}</p>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Выйти
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
