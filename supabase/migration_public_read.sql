-- ============================================================
--  Миграция: гостевой просмотр без авторизации.
--  Любой (anon) может ЧИТАТЬ списки и профили (имена владельцев),
--  но создавать/менять/удалять по-прежнему могут только
--  авторизованные (insert/update/delete остаются to authenticated).
--  Выполните в Supabase → SQL Editor.
-- ============================================================

drop policy if exists "wishlist_select" on public.wishlist_items;
create policy "wishlist_select" on public.wishlist_items
  for select to anon, authenticated
  using (true);

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to anon, authenticated
  using (true);
