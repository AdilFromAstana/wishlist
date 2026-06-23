"use client";

import { useState } from "react";
import type { WishlistItemWithOwner } from "@/lib/types";
import { formatDate, formatKzt } from "@/lib/format";
import { ActiveBadge, PriorityBadge, StatusBadge } from "./Badge";

interface Props {
  item: WishlistItemWithOwner;
  onClose: () => void;
  onEdit: (item: WishlistItemWithOwner) => void;
  onDelete: (item: WishlistItemWithOwner) => void;
}

export function WishlistDetailModal({ item, onClose, onEdit, onDelete }: Props) {
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[90vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="truncate pr-2 text-lg font-bold">{item.title}</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto">
          {/* Галерея */}
          <div className="relative aspect-square w-full bg-gray-100 sm:aspect-video">
            {current ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current}
                alt={item.title}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl text-gray-300">
                🎁
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  aria-label="Назад"
                  className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  ‹
                </button>
                <button
                  onClick={next}
                  aria-label="Вперёд"
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  ›
                </button>
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                  {index + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          {/* Миниатюры */}
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

          {/* Инфо */}
          <div className="space-y-4 px-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl font-bold">
                {formatKzt(item.price_kzt)}
              </span>
              <div className="flex flex-wrap justify-end gap-1.5">
                <StatusBadge status={item.status} />
                <PriorityBadge priority={item.priority} />
                <ActiveBadge active={item.is_active} />
              </div>
            </div>

            {item.description && (
              <p className="whitespace-pre-wrap break-words text-sm text-gray-600">
                {item.description}
              </p>
            )}

            <dl className="grid grid-cols-2 gap-3 text-sm">
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
              <a
                href={item.product_url}
                target="_blank"
                rel="noreferrer"
                className="inline-block break-all text-sm font-medium text-blue-600 hover:underline"
              >
                Ссылка на товар →
              </a>
            )}
          </div>
        </div>

        {/* Действия */}
        <div className="flex gap-2 border-t border-gray-100 p-4">
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
      </div>
    </div>
  );
}
