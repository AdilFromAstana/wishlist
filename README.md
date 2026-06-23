# 🎁 Wishlist

Совместный **список желаний для двух человек**. Оба входят по email, ведут один
общий wishlist, но у каждой вещи есть свой владелец. Видно, кто что хочет,
сколько это стоит, что уже куплено и на какую сумму набралось желаний.

Сделано как адаптивное веб-приложение — одинаково удобно с телефона и десктопа.

> 🌐 **Демо:** _добавьте сюда ссылку на ваш Vercel-домен_
> (`https://<project>.vercel.app`)

**Стек:** Next.js 14 (App Router) · React · TypeScript · Tailwind CSS · Supabase
(PostgreSQL + Auth + Storage) · деплой на Vercel. Валюта — KZT (₸).

## Возможности

**Авторизация**
- Вход через **magic link** (email OTP), без паролей.
- Сессия сохраняется и автоматически восстанавливается при открытии
  (`persistSession`, `autoRefreshToken`, `detectSessionInUrl`).
- Защита маршрутов: неавторизованный пользователь видит только страницу входа.
- Доступ только у двух разрешённых пользователей (контроль через RLS).

**Желания (wishlist)**
- Создание, редактирование, удаление — каждое на отдельной странице с удобной
  мобильной формой и закреплённой панелью действий.
- **Несколько фото** на одно желание: множественный выбор, **вставка из буфера
  ⌘V / Ctrl+V** (скриншоты), удаление любого фото, первое фото — обложка.
- Поля: название, описание, цена в ₸, ссылка на товар, статус
  (куплено / не куплено), приоритет (высокий / средний / низкий), активность,
  владелец, дата создания.
- Фильтры: по пользователю, цене (min/max), приоритету, статусу, активности,
  дате. На мобиле сворачиваются в один блок со счётчиком активных.
- Сортировка: по дате, цене, приоритету (по возрастанию / убыванию).

**Статистика**
- Страница пользователей: у каждого — кол-во всех / купленных / активных желаний
  и сумма активных в ₸.
- Личный кабинет: личная статистика + кнопка выхода.

**UX и производительность**
- Адаптивный интерфейс, бургер-меню на телефоне, badges для статусов.
- Цена форматируется как `2 000 000 ₸`.
- Состояния загрузки, пустого списка и ошибок.
- **Клиентский кэш данных**: `items` и `profiles` грузятся один раз после входа,
  навигация и изменения обновляют кэш локально — без лишних запросов.

---

## 1. Локальный запуск

```bash
npm install
cp .env.example .env.local   # заполните значения (см. ниже)
npm run dev
```

Откройте http://localhost:3000

### Переменные окружения (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
```

> На фронтенде используется **только** `anon` ключ.
> `service_role` ключ НИКОГДА не попадает в клиент.

---

## 2. Настройка Supabase

1. Создайте проект на https://supabase.com
2. Скопируйте `Project URL` и `anon public` ключ
   (Settings → API) в `.env.local`.
3. Откройте **SQL Editor** и выполните весь файл
   [`supabase/schema.sql`](supabase/schema.sql). Он создаёт:
   - таблицы `profiles` и `wishlist_items` (включая `image_urls text[]` для
     нескольких фото);
   - триггер авто-создания профиля при первом входе;
   - все RLS-политики;
   - публичный storage bucket `wishlist-images` и политики доступа к нему.

> Если таблица уже была создана раньше **без** колонки `image_urls`, выполните
> миграцию [`supabase/migration_multi_images.sql`](supabase/migration_multi_images.sql).

### Настройка Auth

- **Authentication → URL Configuration**: добавьте
  `http://localhost:3000` и URL вашего Vercel-домена в *Redirect URLs*.
- **Authentication → Providers → Email**: включите Email и
  *Email OTP / Magic Link*.

---

## 3. Создание двух пользователей вручную

В приложении должны быть **только 2 пользователя**.

**Способ A — через Dashboard (рекомендуется):**

1. Authentication → **Users** → **Add user** → *Send invitation* (или
   *Create new user*), укажите email первого пользователя.
2. Повторите для второго email.
3. При первом входе по magic link триггер `handle_new_user` автоматически
   создаст строку в `profiles`. Имя по умолчанию = часть email до `@`.

**Способ B — просто войдите по magic link** с каждого из двух email на странице
Login — профили создадутся автоматически.

> ⚠️ Если пользователь был создан в Authentication **до** выполнения
> `schema.sql` (т.е. до появления триггера), профиль для него не создастся, и
> вставка желаний будет падать с ошибкой RLS `42501`. Лечится backfill-ом:
> ```sql
> insert into public.profiles (id, email, name)
> select id, email, split_part(email, '@', 1) from auth.users
> on conflict (id) do nothing;
> ```

После этого при желании задайте имена:

```sql
update public.profiles set name = 'Адиль'  where email = 'first@example.com';
update public.profiles set name = 'Партнёр' where email = 'second@example.com';
```

### Ограничение «только 2 пользователя»

Все данные защищены RLS и доступны только тем, у кого есть строка в `profiles`.
Чтобы посторонние вообще не могли регистрироваться, в Supabase:
**Authentication → Sign In / Providers → Email** отключите
*Allow new users to sign up* после того, как оба нужных пользователя созданы.
Тогда magic link сработает только для уже существующих двух аккаунтов.

---

## 4. Деплой на Vercel

1. Запушьте проект в Git-репозиторий.
2. Импортируйте репозиторий на https://vercel.com (фреймворк определится как
   Next.js автоматически).
3. В **Project Settings → Environment Variables** добавьте:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. Добавьте итоговый домен Vercel в Supabase *Redirect URLs*.

---

## Структура проекта

```
src/
  app/
    layout.tsx          корневой layout + AuthProvider
    page.tsx            редирект в зависимости от сессии
    login/page.tsx      страница входа (magic link)
    wishlists/page.tsx  общий список + фильтры/сортировка/CRUD
    users/page.tsx      статистика по двум пользователям
    profile/page.tsx    личный кабинет + logout
  components/
    AuthProvider.tsx    сессия, защита маршрутов, logout
    ProtectedShell.tsx  обёртка приватных страниц + Navbar
    Navbar.tsx
    WishlistForm.tsx    создание/редактирование + загрузка фото
    WishlistCard.tsx
    Badge.tsx           бейджи статуса/приоритета/активности
  lib/
    supabase.ts         клиент Supabase (anon, persistSession и т.д.)
    types.ts
    format.ts           формат цены в ₸ и дат
supabase/
  schema.sql            таблицы + RLS + storage bucket
```
