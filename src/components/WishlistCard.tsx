"use client";

import type { WishlistItemWithOwner } from "@/lib/types";
import { formatDate, formatKzt } from "@/lib/format";
import { ActiveBadge, PriorityBadge, StatusBadge } from "./Badge";

interface Props {
  item: WishlistItemWithOwner;
  onEdit: (item: WishlistItemWithOwner) => void;
  onDelete: (item: WishlistItemWithOwner) => void;
}

export function WishlistCard({ item, onEdit, onDelete }: Props) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="relative h-40 w-full bg-gray-100">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-gray-300">
            🎁
          </div>
        )}
        {item.image_urls && item.image_urls.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            📷 {item.image_urls.length}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="break-words font-semibold leading-tight">{item.title}</h3>
          <span className="whitespace-nowrap font-bold text-gray-900">
            {formatKzt(item.price_kzt)}
          </span>
        </div>

        {item.description && (
          <p className="line-clamp-2 break-words text-sm text-gray-500">
            {item.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={item.status} />
          <PriorityBadge priority={item.priority} />
          <ActiveBadge active={item.is_active} />
        </div>

        <div className="mt-1 text-xs text-gray-500">
          <div>
            Владелец: <strong>{item.owner?.name || item.owner?.email || "—"}</strong>
          </div>
          <div>Создано: {formatDate(item.created_at)}</div>
        </div>

        {item.product_url && (
          <a
            href={item.product_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Ссылка на товар →
          </a>
        )}

        <div className="mt-auto flex gap-2 pt-3">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Изменить
          </button>
          <button
            onClick={() => onDelete(item)}
            className="flex-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
