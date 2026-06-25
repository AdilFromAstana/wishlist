"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { QrCode } from "@/components/QrCode";

type Mode = "password" | "magic";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const signInPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) setError(error.message);
  };

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: origin ? `${origin}/wishlists` : undefined },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  const input =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-gray-900 sm:text-sm";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-3xl items-center gap-8 lg:grid-cols-2">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-2xl font-bold">🎁 Wishlist</h1>
          <p className="mb-6 text-sm text-gray-500">
            {mode === "password"
              ? "Войдите по email и паролю."
              : "Войдите по ссылке, отправленной на email."}
          </p>

          {sent ? (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
              Ссылка для входа отправлена на <strong>{email}</strong>. Откройте
              письмо на этом же устройстве.
              <button
                onClick={() => {
                  setSent(false);
                  setMode("password");
                }}
                className="mt-3 block text-sm font-medium text-green-900 underline"
              >
                Назад ко входу
              </button>
            </div>
          ) : mode === "password" ? (
            <form onSubmit={signInPassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={input}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Пароль
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={input}
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
              >
                {busy ? "Входим…" : "Войти"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("magic");
                  setError("");
                }}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-800"
              >
                Впервые здесь или нет пароля? Войти по ссылке на почту
              </button>
            </form>
          ) : (
            <form onSubmit={sendMagicLink} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={input}
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
              >
                {busy ? "Отправляем…" : "Отправить ссылку"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("password");
                  setError("");
                }}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-800"
              >
                Войти по паролю
              </button>

              <p className="text-center text-xs text-gray-400">
                После входа задайте пароль в «Личном кабинете» — дальше можно
                входить без писем на любом устройстве.
              </p>
            </form>
          )}
        </div>

        {/* QR «открыть на телефоне» — только десктоп */}
        {origin && (
          <div className="hidden flex-col items-center gap-3 text-center lg:flex">
            <QrCode value={origin} size={180} />
            <p className="max-w-[14rem] text-sm text-gray-500">
              Наведи камеру телефона, чтобы открыть сайт и войти с него
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
