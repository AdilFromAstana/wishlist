"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Status, WishlistItem } from "@/lib/types";
import {
  STATUS_BADGE,
  STATUS_DOT,
  STATUS_LABELS,
  STATUS_ORDER,
  statusIndex,
} from "@/lib/status";

interface Props {
  item: WishlistItem;
  canChange: boolean;
  mode?: "stepper" | "compact";
  onChanged: (updated: WishlistItem) => void;
}

export function StatusControl({
  item,
  canChange,
  mode = "stepper",
  onChanged,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const current = item.status;
  const currentIdx = statusIndex(current);

  const setStatus = async (next: Status) => {
    if (!canChange || next === current || saving) return;
    setSaving(true);
    setError("");
    const { data, error: err } = await supabase
      .from("wishlist_items")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", item.id)
      .select()
      .single();
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onChanged(data as WishlistItem);
  };

  if (mode === "compact") {
    if (!canChange) return null;
    const nextIdx = currentIdx + 1;
    const next = STATUS_ORDER[nextIdx];
    return (
      <div className="flex items-center gap-2">
        {next ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setStatus(next);
            }}
            disabled={saving}
            className="flex-1 rounded-lg border border-gray-900 bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {saving ? "…" : `→ ${STATUS_LABELS[next]}`}
          </button>
        ) : (
          <span className="flex-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-center text-xs font-semibold text-green-700">
            Выдано ✓
          </span>
        )}
        {currentIdx > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setStatus(STATUS_ORDER[currentIdx - 1]);
            }}
            disabled={saving}
            aria-label="Откатить статус"
            className="shrink-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-60"
          >
            ↩
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {STATUS_ORDER.map((s, i) => {
          const reached = i <= currentIdx;
          const isCurrent = s === current;
          const clickable = canChange && !saving;
          return (
            <button
              key={s}
              type="button"
              disabled={!clickable}
              onClick={() => setStatus(s)}
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition ${
                isCurrent
                  ? STATUS_BADGE[s] + " ring-2 ring-gray-900/70"
                  : reached
                  ? STATUS_BADGE[s]
                  : "bg-gray-100 text-gray-400"
              } ${clickable ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
            >
              <span
                className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                  reached ? STATUS_DOT[s] : "bg-gray-300"
                }`}
              />
              {STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>
      {canChange && (
        <p className="mt-2 text-xs text-gray-400">
          {saving ? "Сохранение…" : "Нажмите, чтобы изменить статус"}
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
