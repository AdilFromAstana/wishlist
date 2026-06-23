"use client";

import { useMemo } from "react";
import { ProtectedShell } from "@/components/ProtectedShell";
import { useData } from "@/components/DataProvider";
import { formatKzt } from "@/lib/format";

export default function UsersPage() {
  const { profiles, items, loading, error } = useData();

  const stats = useMemo(() => {
    return profiles.map((p) => {
      const owned = items.filter((i) => i.owner_id === p.id);
      return {
        profile: p,
        total: owned.length,
        purchased: owned.filter((i) => i.status === "purchased").length,
        active: owned.filter((i) => i.is_active).length,
        activeSum: owned
          .filter((i) => i.is_active)
          .reduce((s, i) => s + (i.price_kzt || 0), 0),
      };
    });
  }, [profiles, items]);

  return (
    <ProtectedShell>
      <h1 className="mb-6 text-2xl font-bold">Пользователи</h1>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="py-20 text-center text-gray-500">Загрузка…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {stats.map(({ profile, total, purchased, active, activeSum }) => (
            <div
              key={profile.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4">
                <h2 className="text-lg font-bold">
                  {profile.name || "Без имени"}
                </h2>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Всего желаний" value={total} />
                <Stat label="Куплено" value={purchased} />
                <Stat label="Активных" value={active} />
                <Stat label="Сумма активных" value={formatKzt(activeSum)} />
              </dl>
            </div>
          ))}
        </div>
      )}
    </ProtectedShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold text-gray-900">{value}</dd>
    </div>
  );
}
