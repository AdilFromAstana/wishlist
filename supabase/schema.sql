-- ============================================================
--  Wishlist — ПОЛНАЯ актуальная схема БД, RLS и storage.
--  Единый источник правды: этот файл воспроизводит текущую базу
--  с нуля. Выполните в Supabase → SQL Editor на чистом проекте.
--
--  Модель прав (подарочный сценарий):
--    • Владелец желания (owner_id) правит КОНТЕНТ карточки
--      (название, цена, ссылка, фото, приоритет, активность),
--      но НЕ может менять статус.
--    • Второй пользователь (даритель, не владелец) может менять
--      ТОЛЬКО статус: wanted → ordered → shipping → received → given.
--    • Удалять желание может только владелец.
-- ============================================================

-- ---------- 1. Таблицы --------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text,
  created_at  timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  price_kzt   numeric not null default 0,
  product_url text,
  image_url   text,
  image_urls  text[] not null default '{}',
  status      text not null default 'wanted'
              check (status in ('wanted', 'ordered', 'shipping', 'received', 'given')),
  priority    text not null default 'medium'
              check (priority in ('high', 'medium', 'low')),
  is_active   boolean not null default true,
  owner_id    uuid references public.profiles(id) on delete set null,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists wishlist_items_owner_idx on public.wishlist_items(owner_id);
create index if not exists wishlist_items_created_idx on public.wishlist_items(created_at);

-- Статусы подарка (порядок потока):
--   wanted   — Хочет (по умолчанию при создании)
--   ordered  — Заказал
--   shipping — В пути
--   received — Получил (пришло к дарителю)
--   given    — Выдал (вручено владельцу)

-- ---------- 2. Авто-создание профиля при регистрации --------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 3. Разграничение прав по колонкам ---------------
-- Владелец правит контент (но не статус); даритель правит только статус.

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

-- ---------- 4. Row Level Security ---------------------------

alter table public.profiles      enable row level security;
alter table public.wishlist_items enable row level security;

-- profiles: читать может любой (в т.ч. гость без входа) — для имён владельцев
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to anon, authenticated
  using (true);

-- profiles: пользователь может обновлять только свой профиль
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- wishlist_items: список виден всем (в т.ч. гостю без входа), только чтение
drop policy if exists "wishlist_select" on public.wishlist_items;
create policy "wishlist_select" on public.wishlist_items
  for select to anon, authenticated
  using (true);

-- wishlist_items: создавать может только сам владелец
drop policy if exists "wishlist_insert" on public.wishlist_items;
create policy "wishlist_insert" on public.wishlist_items
  for insert to authenticated
  with check (auth.uid() = owner_id);

-- wishlist_items: обновлять могут оба пользователя,
-- а какие колонки — ограничивает триггер trg_wishlist_permissions
drop policy if exists "wishlist_update" on public.wishlist_items;
create policy "wishlist_update" on public.wishlist_items
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

-- wishlist_items: удалять может только владелец
drop policy if exists "wishlist_delete" on public.wishlist_items;
create policy "wishlist_delete" on public.wishlist_items
  for delete to authenticated
  using (auth.uid() = owner_id);

-- ---------- 4b. История статусов ----------------------------
-- Журнал смен статуса: кто и когда. Пишет триггер (auth.uid()).

create table if not exists public.wishlist_status_events (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.wishlist_items(id) on delete cascade,
  status      text not null,
  changed_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists wishlist_status_events_item_idx
  on public.wishlist_status_events(item_id, created_at);

create or replace function public.log_wishlist_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.wishlist_status_events (item_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.wishlist_status_events (item_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_wishlist_status_ins on public.wishlist_items;
create trigger trg_log_wishlist_status_ins
  after insert on public.wishlist_items
  for each row execute function public.log_wishlist_status();

drop trigger if exists trg_log_wishlist_status_upd on public.wishlist_items;
create trigger trg_log_wishlist_status_upd
  after update on public.wishlist_items
  for each row execute function public.log_wishlist_status();

alter table public.wishlist_status_events enable row level security;

drop policy if exists "status_events_select" on public.wishlist_status_events;
create policy "status_events_select" on public.wishlist_status_events
  for select to anon, authenticated
  using (true);

-- ---------- 5. Storage bucket -------------------------------

insert into storage.buckets (id, name, public)
values ('wishlist-images', 'wishlist-images', true)
on conflict (id) do nothing;

drop policy if exists "wishlist_images_read" on storage.objects;
create policy "wishlist_images_read" on storage.objects
  for select to public
  using (bucket_id = 'wishlist-images');

drop policy if exists "wishlist_images_insert" on storage.objects;
create policy "wishlist_images_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'wishlist-images');

drop policy if exists "wishlist_images_update" on storage.objects;
create policy "wishlist_images_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'wishlist-images');

drop policy if exists "wishlist_images_delete" on storage.objects;
create policy "wishlist_images_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'wishlist-images');
