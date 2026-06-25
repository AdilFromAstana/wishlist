"use client";

import { useMemo, useState } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { useAuth } from "@/components/AuthProvider";
import { useData } from "@/components/DataProvider";
import { supabase } from "@/lib/supabase";
import { formatKzt } from "@/lib/format";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { profiles, items, loading } = useData();

  const [password, setPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setPwErr("Пароль должен быть не короче 6 символов");
      setPwMsg("");
      return;
    }
    setPwBusy(true);
    setPwErr("");
    setPwMsg("");
    const { error } = await supabase.auth.updateUser({ password });
    setPwBusy(false);
    if (error) setPwErr(error.message);
    else {
      setPwMsg("Пароль сохранён. Теперь можно входить по email и паролю.");
      setPassword("");
    }
  };

  const profile = useMemo(
    () => profiles.find((p) => p.id === user?.id) ?? null,
    [profiles, user?.id]
  );

  const stats = useMemo(() => {
    const own = items.filter((i) => i.owner_id === user?.id);
    return {
      total: own.length,
      purchased: own.filter((i) => i.status === "given").length,
      sum: own.reduce((s, i) => s + (i.price_kzt || 0), 0),
    };
  }, [items, user?.id]);

  return (
    <ProtectedShell>
      <h1 className="mb-6 text-2xl font-bold">Личный кабинет</h1>

      {loading ? (
        <div className="py-20 text-center text-gray-500">Загрузка…</div>
      ) : (
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold">
              {profile?.name || "Без имени"}
            </h2>
            <p className="text-sm text-gray-500">
              {profile?.email || user?.email}
            </p>
          </div>

          <dl className="mb-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-gray-50 p-3">
              <dt className="text-xs text-gray-500">Всего</dt>
              <dd className="mt-0.5 text-lg font-semibold">{stats.total}</dd>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <dt className="text-xs text-gray-500">Получено</dt>
              <dd className="mt-0.5 text-lg font-semibold">{stats.purchased}</dd>
            </div>
            <div className="col-span-2 rounded-lg bg-gray-50 p-3">
              <dt className="text-xs text-gray-500">Общая сумма</dt>
              <dd className="mt-0.5 text-lg font-semibold">
                {formatKzt(stats.sum)}
              </dd>
            </div>
          </dl>

          <button
            onClick={signOut}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Выйти
          </button>
        </div>
      )}

      {!loading && (
        <form
          onSubmit={savePassword}
          className="mt-4 max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-1 text-lg font-bold">Пароль для входа</h2>
          <p className="mb-4 text-sm text-gray-500">
            Задайте пароль — и сможете входить по email и паролю на любом
            устройстве, без писем.
          </p>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Новый пароль (мин. 6 символов)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-gray-900 sm:text-sm"
          />

          {pwErr && (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {pwErr}
            </p>
          )}
          {pwMsg && (
            <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
              {pwMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={pwBusy}
            className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {pwBusy ? "Сохранение…" : "Сохранить пароль"}
          </button>
        </form>
      )}
    </ProtectedShell>
  );
}
