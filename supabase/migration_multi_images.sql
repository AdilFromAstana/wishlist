-- ============================================================
--  Миграция: поддержка нескольких фото у одного желания.
--  Выполните в Supabase → SQL Editor, если таблица уже создана
--  по старой схеме (без колонки image_urls).
-- ============================================================

alter table public.wishlist_items
  add column if not exists image_urls text[] not null default '{}';

-- Перенесём существующие одиночные фото в массив.
update public.wishlist_items
  set image_urls = array[image_url]
  where image_url is not null
    and (image_urls is null or array_length(image_urls, 1) is null);
