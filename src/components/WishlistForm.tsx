"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Priority, WishlistItem } from "@/lib/types";
import { useAuth } from "./AuthProvider";

interface Props {
  item?: WishlistItem | null;
  onCancel: () => void;
  onSaved: (saved: WishlistItem) => void;
}

const BUCKET = "wishlist-images";

export function WishlistForm({ item, onCancel, onSaved }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(String(item?.price_kzt ?? ""));
  const [productUrl, setProductUrl] = useState(item?.product_url ?? "");
  const [priority, setPriority] = useState<Priority>(item?.priority ?? "medium");
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Фото: смесь уже сохранённых (url) и новых (file + временный objectURL).
  const initialImages: { url: string; file?: File }[] = (
    item?.image_urls && item.image_urls.length
      ? item.image_urls
      : item?.image_url
      ? [item.image_url]
      : []
  ).map((url) => ({ url }));
  const [images, setImages] = useState(initialImages);

  const addFiles = (files: FileList | File[] | null) => {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    setImages((prev) => [
      ...prev,
      ...arr.map((f) => ({ url: URL.createObjectURL(f), file: f })),
    ]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Вставка фото из буфера обмена (⌘V / Ctrl+V) — например, скриншот с Mac.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = Array.from(items)
        .filter((it) => it.type.startsWith("image/"))
        .map((it) => it.getAsFile())
        .filter((f): f is File => !!f);
      if (files.length) {
        addFiles(files);
        e.preventDefault();
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  // Загружаем новые файлы, уже сохранённые url оставляем как есть.
  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const img of images) {
      if (img.file) {
        const ext = img.file.name.split(".").pop() || "png";
        const path = `${user?.id}/${Date.now()}-${Math.round(
          urls.length + 1
        )}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, img.file, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        urls.push(data.publicUrl);
      } else {
        urls.push(img.url);
      }
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const urls = await uploadImages();
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        price_kzt: Number(price) || 0,
        product_url: productUrl.trim() || null,
        image_url: urls[0] ?? null,
        image_urls: urls,
        priority,
        is_active: isActive,
      };

      let saved: WishlistItem;
      if (item) {
        const { data, error: err } = await supabase
          .from("wishlist_items")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", item.id)
          .select()
          .single();
        if (err) throw err;
        saved = data as WishlistItem;
      } else {
        const { data, error: err } = await supabase
          .from("wishlist_items")
          .insert({ ...payload, owner_id: user?.id, created_by: user?.id })
          .select()
          .single();
        if (err) throw err;
        saved = data as WishlistItem;
      }
      onSaved(saved);
    } catch (err: any) {
      setError(err.message ?? "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const input =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-gray-900 sm:text-sm";
  const label = "mb-1.5 block text-sm font-medium text-gray-700";

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg pb-28 sm:pb-0">
      <div className="space-y-5 sm:rounded-2xl sm:border sm:border-gray-200 sm:bg-white sm:p-6 sm:shadow-sm">
        <div>
          <label className={label}>Название *</label>
          <input
            className={input}
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Наушники Sony WH-1000XM5"
          />
        </div>

        <div>
          <label className={label}>Описание</label>
          <textarea
            className={input}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Цвет, размер, комментарий…"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Цена (₸)</label>
            <input
              className={input}
              type="number"
              inputMode="numeric"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className={label}>Приоритет</label>
            <select
              className={input}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </div>
        </div>

        <div>
          <label className={label}>Ссылка на товар</label>
          <input
            className={input}
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
          />
        </div>

        {/* Активность — крупный переключатель, удобно тапать */}
        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-sm font-medium text-gray-700">Активно</span>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300"
          />
        </label>

        <div>
          <label className={label}>
            Фото / скриншоты{" "}
            {images.length > 0 && (
              <span className="text-gray-400">({images.length})</span>
            )}
          </label>

          {images.length > 0 && (
            <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    aria-label="Удалить фото"
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white hover:bg-black/80"
                  >
                    ✕
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                      обложка
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500 hover:bg-gray-50">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <span>
              📷 {images.length > 0 ? "Добавить ещё фото" : "Выбрать фото"}
            </span>
            <span className="text-xs text-gray-400">
              можно выбрать несколько · вставить ⌘V / Ctrl+V
            </span>
          </label>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Кнопки на desktop */}
        <div className="hidden justify-end gap-2 pt-1 sm:flex">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </div>

      {/* Закреплённая панель действий на мобиле */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-gray-200 bg-white p-4 sm:hidden">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-[2] rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </div>
    </form>
  );
}
