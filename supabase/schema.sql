-- ============================================================
--  Wishlist — схема базы данных, RLS и storage для Supabase
--  Выполните этот скрипт в Supabase → SQL Editor.
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
  status      text not null default 'not_purchased'
              check (status in ('not_purchased', 'purchased')),
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

-- ---------- 2. Авто-создание профиля при регистрации --------
-- Когда пользователь впервые входит по magic link, в auth.users
-- появляется запись. Этот триггер создаёт связанный profile.

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

-- ---------- 3. Row Level Security ---------------------------

alter table public.profiles      enable row level security;
alter table public.wishlist_items enable row level security;

-- Только авторизованные пользователи, у которых есть профиль
-- (т.е. один из двух разрешённых), получают доступ к данным.

-- profiles: читать может любой авторизованный пользователь
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (true);

-- profiles: пользователь может обновлять только свой профиль
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- wishlist_items: общий список виден обоим разрешённым пользователям
drop policy if exists "wishlist_select" on public.wishlist_items;
create policy "wishlist_select" on public.wishlist_items
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid()));

-- wishlist_items: создавать может любой разрешённый пользователь
drop policy if exists "wishlist_insert" on public.wishlist_items;
create policy "wishlist_insert" on public.wishlist_items
  for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

-- wishlist_items: редактировать может любой разрешённый пользователь
drop policy if exists "wishlist_update" on public.wishlist_items;
create policy "wishlist_update" on public.wishlist_items
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

-- wishlist_items: удалять может любой разрешённый пользователь
drop policy if exists "wishlist_delete" on public.wishlist_items;
create policy "wishlist_delete" on public.wishlist_items
  for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid()));

-- ---------- 4. Storage bucket -------------------------------
-- Создаём публичный bucket для фото / скриншотов.

insert into storage.buckets (id, name, public)
values ('wishlist-images', 'wishlist-images', true)
on conflict (id) do nothing;

-- Чтение файлов — публичное (bucket public = true).
-- Загрузка / изменение / удаление — только авторизованным.

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
