-- ============================================================
--  Миграция: история статусов (кто и когда менял).
--  Каждая смена статуса (и создание желания) пишется в журнал.
--  Запись делает триггер с auth.uid() — клиент не может подделать.
--  Выполните в Supabase → SQL Editor.
-- ============================================================

create table if not exists public.wishlist_status_events (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.wishlist_items(id) on delete cascade,
  status      text not null,
  changed_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists wishlist_status_events_item_idx
  on public.wishlist_status_events(item_id, created_at);

-- Журналирование: при создании и при смене статуса.
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

-- Бэкафилл для уже существующих желаний — одна запись на текущий статус.
insert into public.wishlist_status_events (item_id, status, changed_by, created_at)
select i.id, i.status, i.created_by, i.created_at
from public.wishlist_items i
where not exists (
  select 1 from public.wishlist_status_events e where e.item_id = i.id
);

-- RLS: историю может читать любой (в т.ч. гость), писать — только триггер.
alter table public.wishlist_status_events enable row level security;

drop policy if exists "status_events_select" on public.wishlist_status_events;
create policy "status_events_select" on public.wishlist_status_events
  for select to anon, authenticated
  using (true);
