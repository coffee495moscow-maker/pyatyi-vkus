# Пятый вкус

PWA-приложение премиальной кондитерской «Пятый вкус»: каталог, корзина,
онлайн-оплата, личный кабинет с бонусами и достижениями, админ-панель.

**Стек**: Next.js 16 (App Router, TypeScript), Tailwind CSS v4, self-hosted
Postgres (без Supabase — своя авторизация и своё файловое хранилище),
ЮKassa. Никаких сторонних управляемых сервисов: база данных, авторизация и
фото товаров — всё на вашей инфраструктуре.

## Деплой на свой сервер (Docker Compose)

Всё, что нужно — сервер с Docker. Из этой рабочей копии на сервере:

```bash
# 1. Установить Docker, если его ещё нет
curl -fsSL https://get.docker.com | sh

# 2. Склонировать репозиторий
git clone https://github.com/coffee495moscow-maker/pyatyi-vkus.git /opt/pyatyi-vkus
cd /opt/pyatyi-vkus

# 3. Настроить переменные окружения
cp .env.example .env
nano .env   # обязательно: POSTGRES_PASSWORD; по желанию: YOOKASSA_*, SMTP_*

# 4. Собрать и запустить (Postgres + приложение + Caddy-прокси)
docker compose up -d --build

# 5. Применить сид каталога — один раз, сразу после первого запуска
#    (миграции применяются автоматически при каждом старте контейнера app)
docker compose exec app node scripts/seed.mjs

# 6. Зарегистрироваться на сайте, затем выдать себе роль админа
#    (docker compose exec запускает команду в уже настроенном контейнере
#    app, DATABASE_URL брать заново не нужно)
docker compose exec app node scripts/make-admin.mjs you@example.com
```

Сайт будет доступен по IP сервера (порт 80, без HTTPS — сертификат для
голого IP не выпускается). Когда появится домен: пропишите его A-запись на
IP сервера, раскомментируйте `SITE_ADDRESS=ваш-домен.ru` в `.env`, затем
`docker compose up -d` — Caddy автоматически получит HTTPS через Let's
Encrypt, без дополнительной настройки.

**Обновление после новых изменений в коде**:
```bash
cd /opt/pyatyi-vkus && git pull && docker compose up -d --build
```

## Запуск локально (для разработки)

```bash
npm install
cp .env.example .env.local   # DATABASE_URL на свой локальный/удалённый Postgres
npm run db:migrate
npm run db:seed
npm run dev
```

## Переменные окружения

Все описаны с комментариями в `.env.example`. Коротко:

- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` — для Docker Compose,
  из них автоматически собирается `DATABASE_URL` для контейнера `app`.
- `DATABASE_URL` — используется только при запуске не через Compose.
- `UPLOAD_DIR` — куда сохраняются загруженные фото товаров/акций (должен
  быть на постоянном томе — в Compose уже примонтирован).
- `SITE_ADDRESS` — домен для Caddy (см. выше); без него — обычный HTTP по IP.
- `PAYMENT_PROVIDER`, `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY` — оплата.
- `NEXT_PUBLIC_SITE_URL` — абсолютный адрес сайта (для ссылок оплаты/сброса пароля).
- `SMTP_*` — опционально, для писем восстановления пароля; без них ссылка
  просто пишется в лог контейнера (`docker compose logs app`).

## Оплата (ЮKassa)

Нужен отдельный аккаунт в ЮKassa (заводится вами самостоятельно). Ключи —
из личного кабинета ЮKassa (Settings → Shop credentials) в `.env`. Провайдер
подключается через абстракцию `lib/payments/provider.ts`, так что смена на
другого провайдера (например CloudPayments) не требует правок вызывающего
кода — только добавить `lib/payments/<provider>.ts` и один case в
`lib/payments/index.ts`.

## Известные TODO перед боевым запуском

- **Фото товаров** — сейчас везде графические SVG-заглушки
  (`components/ProductPlaceholder.tsx`), сгенерированные детерминированно
  по slug товара. Реальные фото загружаются через `/admin/menu` (форма
  товара, поле «Фото») — `image_path` автоматически подхватится вместо
  заглушки, правок кода не требуется.
- **Иконки PWA** — плейсхолдер-иконки в `public/icons/` и
  `public/apple-touch-icon.png` сгенерированы скриптом
  `scripts/generate-icons.mjs` (требует `sharp`, не входит в зависимости
  проекта — `npm i -D sharp` перед повторным запуском). Заменить на
  фирменные перед запуском.
- **Telegram** — ссылка в `content/contacts.ts` пока пустышка
  (`https://t.me/`), реальный хендл не был предоставлен.
- **ЮKassa** — нужен реальный аккаунт продавца и ключи (см. выше).
- **SMTP** — без него восстановление пароля работает только «вручную»
  (ссылка в логах контейнера), для реальных писем нужен SMTP-провайдер.

## Структура

```
app/(app)/       — публичные страницы с нижним таб-баром (Главная/Меню/Бонусы/Профиль)
app/(auth)/      — вход/регистрация/сброс пароля
app/admin/       — админ-панель (роль admin)
app/api/         — вебхук ЮKassa
app/uploads/     — раздача загруженных файлов с диска (UPLOAD_DIR)
lib/actions/     — Server Actions
lib/queries/     — серверные запросы к Postgres
lib/payments/    — абстракция платёжного провайдера + реализация ЮKassa
lib/session.ts   — своя авторизация (сессии в БД, httpOnly-кука)
lib/storage.ts   — сохранение загруженных файлов на диск
content/         — статический текст бренда (перенесён из исходного прототипа)
db/              — миграции, сид каталога
scripts/         — миграции/сид/назначение админа как CLI-скрипты
legacy/          — исходный статический прототип (для истории)
```

## Тесты и линт

```bash
npm run lint
npm run build
```
