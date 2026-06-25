"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  Profile,
  StatusEvent,
  WishlistItem,
  WishlistItemWithOwner,
} from "@/lib/types";
import { formatDate, formatDateTime, formatKzt } from "@/lib/format";
import { STATUS_DOT, STATUS_LABELS } from "@/lib/status";
import { ActiveBadge, PriorityBadge, StatusBadge } from "./Badge";
import { StatusControl } from "./StatusControl";
import { QrModal } from "./QrModal";

interface Props {
  item: WishlistItemWithOwner;
  profiles: Profile[];
  canManage: boolean;
  isGifter: boolean;
  onClose: () => void;
  onEdit: (item: WishlistItemWithOwner) => void;
  onDelete: (item: WishlistItemWithOwner) => void;
  onStatusChanged: (updated: WishlistItem) => void;
}

export function WishlistDetailModal({
  item,
  profiles,
  canManage,
  isGifter,
  onClose,
  onEdit,
  onDelete,
  onStatusChanged,
}: Props) {
  const [showQr, setShowQr] = useState(false);
  const [events, setEvents] = useState<StatusEvent[]>([]);

  useEffect(() => {
    let active = true;
    supabase
      .from("wishlist_status_events")
      .select("*")
      .eq("item_id", item.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) setEvents((data as StatusEvent[]) ?? []);
      });
    return () => {
      active = false;
    };
  }, [item.id, item.status]);

  const nameOf = (id: string | null) => {
    if (!id) return "—";
    const p = profiles.find((x) => x.id === id);
    return p?.name || p?.email || "—";
  };
  const images =
    item.image_urls && item.image_urls.length
      ? item.image_urls
      : item.image_url
      ? [item.image_url]
      : [];
  const [index, setIndex] = useState(0);
  const current = images[index];

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  return (
    <>
      {showQr && item.product_url && (
        <QrModal
          value={item.product_url}
          title={item.title}
          onClose={() => setShowQr(false)}
        />
      )}
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
        onClick={onClose}
      >
      <div
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[90vh] sm:rounded-2xl lg:max-h-[88vh] lg:max-w-5xl lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow hover:bg-white lg:right-4 lg:top-4"
        >
          ✕
        </button>

        {/* Левая колонка: галерея */}
        <div className="flex flex-col bg-gray-50 lg:w-[55%] lg:shrink-0">
          <div className="relative aspect-square w-full bg-gray-100 sm:aspect-video lg:aspect-auto lg:flex-1">
            {current ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current}
                alt={item.title}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full min-h-[16rem] items-center justify-center text-6xl text-gray-300">
                🎁
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  aria-label="Назад"
                  className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-white hover:bg-black/70"
                >
                  ‹
                </button>
                <button
                  onClick={next}
                  aria-label="Вперёд"
                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-white hover:bg-black/70"
                >
                  ›
                </button>
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                  {index + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3">
              {images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === index ? "border-gray-900" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Правая колонка: информация */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-5 py-5 lg:px-6">
            <h2 className="pr-8 text-xl font-bold leading-tight lg:text-2xl">
              {item.title}
            </h2>

            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-2xl font-bold lg:text-3xl">
                {formatKzt(item.price_kzt)}
              </span>
              <div className="flex flex-wrap justify-end gap-1.5">
                <PriorityBadge priority={item.priority} />
                <ActiveBadge active={item.is_active} />
              </div>
            </div>

            {/* Статус подарка */}
            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Статус
                </span>
                <StatusBadge status={item.status} />
              </div>
              <StatusControl
                item={item}
                canChange={isGifter}
                mode="stepper"
                onChanged={onStatusChanged}
              />
            </div>

            {item.description && (
              <p className="mt-5 whitespace-pre-wrap break-words text-sm text-gray-600">
                {item.description}
              </p>
            )}

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-gray-400">Владелец</dt>
                <dd className="font-medium">
                  {item.owner?.name || item.owner?.email || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Создано</dt>
                <dd className="font-medium">{formatDate(item.created_at)}</dd>
              </div>
            </dl>

            {item.product_url && (
              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={item.product_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Открыть товар →
                </a>
                <button
                  type="button"
                  onClick={() => setShowQr(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <span>▦</span> QR
                </button>
              </div>
            )}

            {/* История статусов */}
            {events.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                  История статусов
                </h3>
                <ol className="space-y-3">
                  {events.map((e, i) => (
                    <li key={e.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`mt-1 h-2.5 w-2.5 rounded-full ${
                            STATUS_DOT[e.status]
                          } ${i === 0 ? "ring-2 ring-gray-900/30" : ""}`}
                        />
                        {i < events.length - 1 && (
                          <span className="mt-1 w-px flex-1 bg-gray-200" />
                        )}
                      </div>
                      <div className="pb-1">
                        <div className="text-sm font-medium text-gray-800">
                          {STATUS_LABELS[e.status]}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDateTime(e.created_at)} · {nameOf(e.changed_by)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Действия владельца */}
          {canManage && (
            <div className="flex gap-2 border-t border-gray-100 p-4 lg:px-6">
              <button
                onClick={() => onEdit(item)}
                className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Изменить
              </button>
              <button
                onClick={() => onDelete(item)}
                className="flex-1 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Удалить
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
