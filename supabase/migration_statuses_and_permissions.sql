-- ============================================================
--  Миграция: расширенные статусы подарка + права доступа.
--  Выполните в Supabase → SQL Editor.
--
--  Модель прав (подарочный сценарий):
--    • Владелец желания (owner_id) правит КОНТЕНТ карточки
--      (название, цена, ссылка, фото, приоритет, активность),
--      но НЕ может менять статус.
--    • Второй пользователь (даритель, не владелец) может менять
--      ТОЛЬКО статус — чтобы вести «заказал → в пути → выдал».
--    • Удалять желание может только владелец.
-- ============================================================

-- ---------- 1. Новые статусы --------------------------------
-- Поток: wanted → ordered → shipping → received → given
--   wanted   — Хочет (по умолчанию при создании)
--   ordered  — Заказал
--   shipping — В пути
--   received — Получил (пришло к дарителю)
--   given    — Выдал (вручено владельцу)

alter table public.wishlist_items
  drop constraint if exists wishlist_items_status_check;

update public.wishlist_items set status = 'wanted'   where status = 'not_purchased';
update public.wishlist_items set status = 'given'     where status = 'purchased';

alter table public.wishlist_items
  alter column status set default 'wanted';

alter table public.wishlist_items
  add constraint wishlist_items_status_check
  check (status in ('wanted', 'ordered', 'shipping', 'received', 'given'));

-- ---------- 2. Триггер: разграничение прав по колонкам ------

create or replace function public.enforce_wishlist_permissions()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() = old.owner_id then
    if new.status is distinct from old.status then
      raise exception 'Владелец не может менять статус своего желания';
    end if;
  else
    if new.title       is distinct from old.title
    or new.description is distinct from old.description
    or new.price_kzt   is distinct from old.price_kzt
    or new.product_url is distinct from old.product_url
    or new.image_url   is distinct from old.image_url
    or new.image_urls  is distinct from old.image_urls
    or new.priority    is distinct from old.priority
    or new.is_active   is distinct from old.is_active
    or new.owner_id    is distinct from old.owner_id
    or new.created_by  is distinct from old.created_by then
      raise exception 'Редактировать желание может только его владелец';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_wishlist_permissions on public.wishlist_items;
create trigger trg_wishlist_permissions
  before update on public.wishlist_items
  for each row execute function public.enforce_wishlist_permissions();

-- ---------- 3. RLS: создание и удаление ---------------------
-- insert: владелец = текущий пользователь.

drop policy if exists "wishlist_insert" on public.wishlist_items;
create policy "wishlist_insert" on public.wishlist_items
  for insert to authenticated
  with check (auth.uid() = owner_id);

-- delete: только владелец.

drop policy if exists "wishlist_delete" on public.wishlist_items;
create policy "wishlist_delete" on public.wishlist_items
  for delete to authenticated
  using (auth.uid() = owner_id);

-- update: оба разрешённых пользователя проходят RLS,
-- а триггер выше ограничивает, какие именно колонки можно менять.

drop policy if exists "wishlist_update" on public.wishlist_items;
create policy "wishlist_update" on public.wishlist_items
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()));
