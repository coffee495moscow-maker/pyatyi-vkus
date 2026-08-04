# Пятый вкус

PWA-приложение премиальной кондитерской «Пятый вкус»: каталог, корзина,
онлайн-оплата, личный кабинет с бонусами и достижениями, push-уведомления,
админ-панель.

**Стек**: Next.js 16 (App Router, TypeScript), Tailwind CSS v4, Supabase
(Postgres + Auth + Storage), ЮKassa, Web Push.

## Запуск локально

```bash
npm install
cp .env.example .env.local   # заполнить значениями своего Supabase-проекта
npm run dev
```

## Настройка Supabase (обязательно перед первым запуском)

1. Создать проект на [supabase.com](https://supabase.com).
2. Скопировать `Project URL`, `anon key`, `service_role key` (Settings →
   API) в `.env.local`.
3. Применить миграции — через Supabase CLI:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```
   Миграции лежат в `supabase/migrations/` и создают всю схему, RLS-политики
   и служебные функции (`create_order`, `attach_payment`,
   `check_and_award_badges`, `admin_update_order_status`,
   `get_paired_products`), а также бакет `product-images` в Storage.
4. Засеять каталог (3 категории, 8 товаров, перенесённых из исходного
   прототипа):
   ```bash
   psql "$(supabase db url)" -f supabase/seed.sql
   ```
5. Зарегистрироваться в приложении, затем вручную выдать себе роль админа:
   ```sql
   update public.profiles set role = 'admin' where id = '<ваш auth.users.id>';
   ```

## Оплата (ЮKassa)

Нужен отдельный аккаунт в ЮKassa (заводится клиентом самостоятельно —
Claude Code его не создаёт). `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY` —
из личного кабинета ЮKassa. Провайдер подключается через абстракцию
`lib/payments/provider.ts`, так что смена на другого провайдера (например
CloudPayments) не требует правок вызывающего кода.

## Push-уведомления

1. Сгенерировать ключи: `npx web-push generate-vapid-keys`.
2. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — в `.env.local`/Vercel; `VAPID_PRIVATE_KEY`
   и `VAPID_SUBJECT` — **как секреты Edge Function**, не как обычные env:
   ```bash
   supabase secrets set VAPID_PRIVATE_KEY=... VAPID_PUBLIC_KEY=... VAPID_SUBJECT=mailto:you@example.com
   ```
3. Деплой функции и настройка Database Webhooks — см.
   `supabase/functions/send-push/README.md`.

## Известные TODO перед боевым запуском

- **Фото товаров** — сейчас везде графические SVG-заглушки
  (`components/ProductPlaceholder.tsx`), сгенерированные детерминированно
  по slug товара. Реальные фото загружаются через `/admin/menu` (форма
  редактирования товара) — `image_path` автоматически подхватится вместо
  заглушки, правок кода не требуется.
- **Иконки PWA** — плейсхолдер-иконки в `public/icons/` и
  `public/apple-touch-icon.png` сгенерированы скриптом
  `scripts/generate-icons.mjs` (требует `sharp`, не входит в зависимости
  проекта). Заменить на фирменные перед запуском.
- **Telegram** — ссылка в `content/contacts.ts` пока пустышка
  (`https://t.me/`), реальный хендл не был предоставлен.
- **ЮKassa** — нужен реальный аккаунт продавца и ключи (см. выше).

## Структура

```
app/(app)/       — публичные страницы с нижним таб-баром (Главная/Меню/Бонусы/Профиль)
app/(auth)/      — вход/регистрация/сброс пароля
app/admin/       — админ-панель (роль admin)
app/api/         — вебхук ЮKassa, push subscribe/unsubscribe
lib/actions/     — Server Actions
lib/queries/     — серверные запросы к Supabase
lib/payments/    — абстракция платёжного провайдера + реализация ЮKassa
content/         — статический текст бренда (перенесён из исходного прототипа)
supabase/        — миграции, сид каталога, Edge Function отправки push
legacy/          — исходный статический прототип (для истории)
```

## Тесты и линт

```bash
npm run lint
npm run build
```
