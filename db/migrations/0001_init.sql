-- Пятый вкус — схема для self-hosted Postgres (без Supabase Auth/RLS/Storage).
-- Авторизация и авторизационные проверки — на уровне приложения (Next.js),
-- не на уровне БД: одна доверенная роль приложения читает/пишет всё, доступ
-- разграничивается в коде (lib/session.ts + явные проверки в actions/queries).
-- Деньги — целые копейки везде.

create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  points_balance int not null default 0,
  lifetime_points int not null default 0,
  tier text not null default 'bronze' check (tier in ('bronze', 'silver', 'gold')),
  current_streak_weeks int not null default 0,
  last_order_week date,
  last_order_at timestamptz,
  created_at timestamptz not null default now()
);

create table sessions (
  id text primary key, -- random token (see lib/session.ts), not a guessable uuid sequence
  user_id uuid not null references users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index sessions_user_id_idx on sessions (user_id);
create index sessions_expires_at_idx on sessions (expires_at);

create table password_resets (
  token text primary key,
  user_id uuid not null references users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index password_resets_user_id_idx on password_resets (user_id);

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  price_kopecks int not null check (price_kopecks >= 0),
  category_id uuid not null references categories (id) on delete restrict,
  image_path text,
  is_available boolean not null default true,
  is_new boolean not null default false,
  is_hit boolean not null default false,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_id_idx on products (category_id);
create index products_is_available_idx on products (is_available);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  status text not null default 'created' check (
    status in ('created', 'awaiting_payment', 'paid', 'preparing', 'ready', 'completed', 'cancelled')
  ),
  fulfillment_type text not null default 'pickup',
  pickup_note text,
  contact_phone text,
  comment text,
  subtotal_kopecks int not null check (subtotal_kopecks >= 0),
  points_redeemed int not null default 0 check (points_redeemed >= 0),
  discount_kopecks int not null default 0 check (discount_kopecks >= 0),
  total_kopecks int not null check (total_kopecks >= 0),
  payment_provider text,
  payment_id text,
  payment_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_id_idx on orders (user_id);
create index orders_status_idx on orders (status);
create index orders_payment_id_idx on orders (payment_id);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid not null references products (id) on delete restrict,
  product_name_snapshot text not null,
  unit_price_kopecks_snapshot int not null check (unit_price_kopecks_snapshot >= 0),
  quantity int not null check (quantity > 0),
  subtotal_kopecks int not null check (subtotal_kopecks >= 0)
);
create index order_items_order_id_idx on order_items (order_id);
create index order_items_product_id_idx on order_items (product_id);

-- Status changes are logged explicitly by application code (the actor is
-- whoever's session performed the change), not by a DB trigger — there's no
-- auth.uid() equivalent available inside Postgres without Supabase.
create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  status text not null,
  changed_by uuid references users (id),
  created_at timestamptz not null default now()
);
create index order_status_history_order_id_idx on order_status_history (order_id);

create table favorites (
  user_id uuid not null references users (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  order_id uuid references orders (id) on delete set null,
  delta_points int not null,
  reason text not null check (
    reason in ('earn_purchase', 'redeem', 'bonus_signup', 'streak_bonus', 'badge_bonus', 'admin_adjustment', 'reversal')
  ),
  created_at timestamptz not null default now()
);
create index loyalty_ledger_user_id_idx on loyalty_ledger (user_id);

create table badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  icon text not null default 'award'
);

create table user_badges (
  user_id uuid not null references users (id) on delete cascade,
  badge_id uuid not null references badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_path text,
  discount_type text,
  discount_value int,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
create index promotions_is_active_idx on promotions (is_active);

create table b2b_inquiries (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  phone text not null,
  email text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- loyalty_ledger -> keep users.points_balance / lifetime_points / tier in sync
-- (still a DB trigger: pure bookkeeping, no auth context needed)
-- ============================================================================

create or replace function apply_loyalty_ledger_entry()
returns trigger
language plpgsql
as $$
declare
  v_lifetime int;
begin
  update users
  set
    points_balance = points_balance + new.delta_points,
    lifetime_points = lifetime_points + greatest(new.delta_points, 0)
  where id = new.user_id
  returning lifetime_points into v_lifetime;

  update users
  set tier = case
    when v_lifetime >= 5000 then 'gold'
    when v_lifetime >= 2000 then 'silver'
    else 'bronze'
  end
  where id = new.user_id;

  return new;
end;
$$;

create trigger on_loyalty_ledger_insert
  after insert on loyalty_ledger
  for each row execute function apply_loyalty_ledger_entry();

-- ============================================================================
-- Seed badge catalog (static reference data, safe to run in every environment)
-- ============================================================================

insert into badges (code, title, description, icon) values
  ('first_order', 'Первый вкус', 'Оформлен и оплачен первый заказ.', 'sparkles'),
  ('taster', 'Дегустатор', 'Заказаны десерты из всех категорий каталога.', 'utensils'),
  ('regular_guest', 'Постоянный гость', '4 недели подряд с хотя бы одним заказом.', 'flame'),
  ('cheesecake_lover', 'Любитель чизкейков', '5 заказов с чизкейком в составе.', 'heart')
on conflict (code) do nothing;
