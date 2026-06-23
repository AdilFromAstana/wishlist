"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type {
  Priority,
  Profile,
  WishlistItem,
  WishlistItemWithOwner,
} from "@/lib/types";
import { ProtectedShell } from "@/components/ProtectedShell";
import { WishlistCard } from "@/components/WishlistCard";
import { useData } from "@/components/DataProvider";

type SortKey = "created_at" | "price_kzt" | "priority";

const priorityOrder: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

export default function WishlistsPage() {
  const router = useRouter();
  const { items, profiles, loading, error, removeItem } = useData();
  const [deleteError, setDeleteError] = useState("");

  // Фильтры
  const [fOwner, setFOwner] = useState("");
  const [fMin, setFMin] = useState("");
  const [fMax, setFMax] = useState("");
  const [fPriority, setFPriority] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fActive, setFActive] = useState("");
  const [fDate, setFDate] = useState(""); // дата создания (с этой даты)
  const [showFilters, setShowFilters] = useState(false); // сворачивание на мобиле

  const resetFilters = () => {
    setFOwner("");
    setFMin("");
    setFMax("");
    setFPriority("");
    setFStatus("");
    setFActive("");
    setFDate("");
  };

  const activeFilterCount = [
    fOwner,
    fMin,
    fMax,
    fPriority,
    fStatus,
    fActive,
    fDate,
  ].filter(Boolean).length;

  // Сортировка
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const profileMap = useMemo(() => {
    const m = new Map<string, Profile>();
    profiles.forEach((p) => m.set(p.id, p));
    return m;
  }, [profiles]);

  const filtered: WishlistItemWithOwner[] = useMemo(() => {
    let result = items.map((i) => ({
      ...i,
      owner: i.owner_id ? profileMap.get(i.owner_id) : null,
    }));

    if (fOwner) result = result.filter((i) => i.owner_id === fOwner);
    if (fMin) result = result.filter((i) => i.price_kzt >= Number(fMin));
    if (fMax) result = result.filter((i) => i.price_kzt <= Number(fMax));
    if (fPriority) result = result.filter((i) => i.priority === fPriority);
    if (fStatus) result = result.filter((i) => i.status === fStatus);
    if (fActive)
      result = result.filter((i) => i.is_active === (fActive === "active"));
    if (fDate)
      result = result.filter(
        (i) => new Date(i.created_at) >= new Date(fDate)
      );

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "price_kzt") cmp = a.price_kzt - b.price_kzt;
      else if (sortKey === "priority")
        cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
      else
        cmp =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [
    items,
    profileMap,
    fOwner,
    fMin,
    fMax,
    fPriority,
    fStatus,
    fActive,
    fDate,
    sortKey,
    sortDir,
  ]);

  const handleDelete = async (item: WishlistItem) => {
    if (!confirm(`Удалить «${item.title}»?`)) return;
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("id", item.id);
    if (error) setDeleteError(error.message);
    else removeItem(item.id);
  };

  const openCreate = () => router.push("/wishlists/new");
  const openEdit = (item: WishlistItem) =>
    router.push(`/wishlists/${item.id}/edit`);

  const select =
    "w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm outline-none focus:border-gray-900 sm:w-auto";

  return (
    <ProtectedShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Мои вишлисты</h1>
        <button
          onClick={openCreate}
          className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 sm:w-auto"
        >
          + Добавить желание
        </button>
      </div>

      {/* Переключатель фильтров (только мобила) */}
      <div className="mb-3 flex items-center gap-2 sm:hidden">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex flex-1 items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700"
        >
          <span>
            Фильтры
            {activeFilterCount > 0 && (
              <span className="ml-2 rounded-full bg-gray-900 px-2 py-0.5 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </span>
          <span className="text-gray-400">{showFilters ? "▲" : "▼"}</span>
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-600"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Фильтры */}
      <div
        className={`mb-4 ${
          showFilters ? "grid" : "hidden"
        } grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex sm:flex-wrap sm:items-end`}
      >
        <div className="col-span-2 sm:col-auto">
          <label className="mb-1 block text-xs text-gray-500">Пользователь</label>
          <select
            className={select}
            value={fOwner}
            onChange={(e) => setFOwner(e.target.value)}
          >
            <option value="">Все</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Цена от</label>
          <input
            type="number"
            className={`${select} sm:w-24`}
            value={fMin}
            onChange={(e) => setFMin(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Цена до</label>
          <input
            type="number"
            className={`${select} sm:w-24`}
            value={fMax}
            onChange={(e) => setFMax(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Приоритет</label>
          <select
            className={select}
            value={fPriority}
            onChange={(e) => setFPriority(e.target.value)}
          >
            <option value="">Все</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Статус</label>
          <select
            className={select}
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value)}
          >
            <option value="">Все</option>
            <option value="not_purchased">Не куплено</option>
            <option value="purchased">Куплено</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Активность</label>
          <select
            className={select}
            value={fActive}
            onChange={(e) => setFActive(e.target.value)}
          >
            <option value="">Все</option>
            <option value="active">Активно</option>
            <option value="inactive">Неактивно</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-auto">
          <label className="mb-1 block text-xs text-gray-500">Создано с</label>
          <input
            type="date"
            className={select}
            value={fDate}
            onChange={(e) => setFDate(e.target.value)}
          />
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="hidden rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 sm:block"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Сортировка */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Сортировка</label>
          <select
            className={select}
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="created_at">По дате создания</option>
            <option value="price_kzt">По цене</option>
            <option value="priority">По приоритету</option>
          </select>
        </div>
        <button
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          className={`${select} hover:bg-gray-50`}
        >
          {sortDir === "asc" ? "↑ По возрастанию" : "↓ По убыванию"}
        </button>
      </div>

      {(error || deleteError) && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error || deleteError}
        </p>
      )}

      {loading ? (
        <div className="py-20 text-center text-gray-500">Загрузка…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 py-20 text-center">
          <div className="mb-2 text-4xl">🎁</div>
          <p className="text-gray-500">Список желаний пуст</p>
          <button
            onClick={openCreate}
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Добавить первое желание
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </ProtectedShell>
  );
}
