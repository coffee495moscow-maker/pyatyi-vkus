-- Пятый вкус — initial schema, RLS policies, and supporting triggers/functions.
-- Money is stored as integer kopecks everywhere to avoid float rounding.

-- ============================================================================
-- Helper: is_admin() — SECURITY DEFINER so RLS policies can check role
-- without recursively re-evaluating RLS on profiles.
-- ============================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================================
-- Tables
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
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

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  price_kopecks int not null check (price_kopecks >= 0),
  category_id uuid not null references public.categories (id) on delete restrict,
  image_path text,
  is_available boolean not null default true,
  is_new boolean not null default false,
  is_hit boolean not null default false,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_id_idx on public.products (category_id);
create index products_is_available_idx on public.products (is_available);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
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
create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);
create index orders_payment_id_idx on public.orders (payment_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  product_name_snapshot text not null,
  unit_price_kopecks_snapshot int not null check (unit_price_kopecks_snapshot >= 0),
  quantity int not null check (quantity > 0),
  subtotal_kopecks int not null check (subtotal_kopecks >= 0)
);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  changed_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index order_status_history_order_id_idx on public.order_status_history (order_id);

create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  delta_points int not null,
  reason text not null check (
    reason in ('earn_purchase', 'redeem', 'bonus_signup', 'streak_bonus', 'badge_bonus', 'admin_adjustment', 'reversal')
  ),
  created_at timestamptz not null default now()
);
create index loyalty_ledger_user_id_idx on public.loyalty_ledger (user_id);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  icon text not null default 'award'
);

create table public.user_badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_path text,
  discount_type text,
  discount_value int,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default false,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);
create index promotions_is_active_idx on public.promotions (is_active);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

create table public.b2b_inquiries (
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
-- profiles auto-create on signup + signup bonus
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');

  insert into public.loyalty_ledger (user_id, delta_points, reason)
  values (new.id, 50, 'bonus_signup');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- loyalty_ledger -> keep profiles.points_balance / lifetime_points / tier in sync
-- ============================================================================

create or replace function public.apply_loyalty_ledger_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lifetime int;
begin
  update public.profiles
  set
    points_balance = points_balance + new.delta_points,
    lifetime_points = lifetime_points + greatest(new.delta_points, 0)
  where id = new.user_id
  returning lifetime_points into v_lifetime;

  update public.profiles
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
  after insert on public.loyalty_ledger
  for each row execute function public.apply_loyalty_ledger_entry();

-- ============================================================================
-- orders.status change -> audit trail in order_status_history
-- ============================================================================

create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger on_order_status_change
  after update of status on public.orders
  for each row execute function public.log_order_status_change();

-- ============================================================================
-- Badge evaluation — called via RPC (supabase.rpc('check_and_award_badges', ...))
-- from the payment webhook right after an order is marked 'paid'.
-- ============================================================================

create or replace function public.check_and_award_badges(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paid_orders int;
  v_distinct_categories int;
  v_cheesecake_orders int;
  v_week date := date_trunc('week', now())::date;
  v_badge_id uuid;
begin
  select count(*) into v_paid_orders
  from public.orders where user_id = p_user_id and status in ('paid','preparing','ready','completed');

  -- "Первый вкус" — first paid order
  if v_paid_orders >= 1 then
    select id into v_badge_id from public.badges where code = 'first_order';
    if v_badge_id is not null then
      insert into public.user_badges (user_id, badge_id) values (p_user_id, v_badge_id)
      on conflict do nothing;
    end if;
  end if;

  -- "Дегустатор" — ordered from all 3 categories at least once
  select count(distinct p.category_id) into v_distinct_categories
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  join public.products p on p.id = oi.product_id
  where o.user_id = p_user_id and o.status in ('paid','preparing','ready','completed');

  if v_distinct_categories >= (select count(*) from public.categories) and v_distinct_categories > 0 then
    select id into v_badge_id from public.badges where code = 'taster';
    if v_badge_id is not null then
      insert into public.user_badges (user_id, badge_id) values (p_user_id, v_badge_id)
      on conflict do nothing;
    end if;
  end if;

  -- "Любитель чизкейков" — 5+ orders containing a cheesecake-category item
  select count(distinct o.id) into v_cheesecake_orders
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  join public.products p on p.id = oi.product_id
  join public.categories c on c.id = p.category_id
  where o.user_id = p_user_id and c.slug = 'cheesecake'
    and o.status in ('paid','preparing','ready','completed');

  if v_cheesecake_orders >= 5 then
    select id into v_badge_id from public.badges where code = 'cheesecake_lover';
    if v_badge_id is not null then
      insert into public.user_badges (user_id, badge_id) values (p_user_id, v_badge_id)
      on conflict do nothing;
    end if;
  end if;

  -- Weekly streak: increment if this is the first paid order in a new week
  -- relative to last_order_week, reset if a week was skipped.
  update public.profiles
  set
    current_streak_weeks = case
      when last_order_week is null then 1
      when last_order_week = v_week then current_streak_weeks
      when last_order_week = (v_week - interval '7 day')::date then current_streak_weeks + 1
      else 1
    end,
    last_order_week = v_week,
    last_order_at = now()
  where id = p_user_id;

  -- Every 4th streak week: bonus points + badge
  if (select current_streak_weeks from public.profiles where id = p_user_id) % 4 = 0
     and (select current_streak_weeks from public.profiles where id = p_user_id) > 0 then
    insert into public.loyalty_ledger (user_id, delta_points, reason)
    values (p_user_id, 20, 'streak_bonus');

    select id into v_badge_id from public.badges where code = 'regular_guest';
    if v_badge_id is not null then
      insert into public.user_badges (user_id, badge_id) values (p_user_id, v_badge_id)
      on conflict do nothing;
    end if;
  end if;
end;
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.favorites enable row level security;
alter table public.loyalty_ledger enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.promotions enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.b2b_inquiries enable row level security;

-- profiles
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- categories (public read, admin write)
create policy "categories_select_all" on public.categories
  for select using (true);
create policy "categories_write_admin" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- products (public read of available items, admin sees/writes everything)
create policy "products_select_available_or_admin" on public.products
  for select using (is_available = true or public.is_admin());
create policy "products_write_admin" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- orders (own rows only; no client-side update — status transitions are
-- server-side via the service-role client in the webhook/admin actions)
create policy "orders_select_own_or_admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy "orders_insert_own" on public.orders
  for insert with check (user_id = auth.uid());

-- order_items (readable if the parent order is visible)
create policy "order_items_select_via_order" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );
create policy "order_items_insert_via_order" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- order_status_history (admin/service-role only; not writable by customers,
-- readable by the order owner for a transparent status timeline)
create policy "order_status_history_select" on public.order_status_history
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- favorites (full CRUD, own rows only)
create policy "favorites_all_own" on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- loyalty_ledger (read-only for the owner; inserts are service-role/admin only —
-- no insert policy for plain authenticated users is the deliberate anti-abuse rule)
create policy "loyalty_ledger_select_own_or_admin" on public.loyalty_ledger
  for select using (user_id = auth.uid() or public.is_admin());
create policy "loyalty_ledger_insert_admin" on public.loyalty_ledger
  for insert with check (public.is_admin());

-- badges / user_badges (public read, admin/service-role write)
create policy "badges_select_all" on public.badges
  for select using (true);
create policy "badges_write_admin" on public.badges
  for all using (public.is_admin()) with check (public.is_admin());
create policy "user_badges_select_own_or_admin" on public.user_badges
  for select using (user_id = auth.uid() or public.is_admin());

-- promotions (public read of active ones, admin sees/writes everything)
create policy "promotions_select_active_or_admin" on public.promotions
  for select using (is_active = true or public.is_admin());
create policy "promotions_write_admin" on public.promotions
  for all using (public.is_admin()) with check (public.is_admin());

-- push_subscriptions (owner can insert/delete own; select restricted to
-- admin — sending itself goes through the service-role client)
create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert with check (user_id = auth.uid());
create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete using (user_id = auth.uid());
create policy "push_subscriptions_select_admin" on public.push_subscriptions
  for select using (public.is_admin());

-- b2b_inquiries (public insert for the wholesale contact form, admin read/write)
create policy "b2b_inquiries_insert_public" on public.b2b_inquiries
  for insert with check (true);
create policy "b2b_inquiries_select_admin" on public.b2b_inquiries
  for select using (public.is_admin());
create policy "b2b_inquiries_update_admin" on public.b2b_inquiries
  for update using (public.is_admin());

-- ============================================================================
-- Seed badge catalog (static reference data, safe to run in every environment)
-- ============================================================================

insert into public.badges (code, title, description, icon) values
  ('first_order', 'Первый вкус', 'Оформлен и оплачен первый заказ.', 'sparkles'),
  ('taster', 'Дегустатор', 'Заказаны десерты из всех категорий каталога.', 'utensils'),
  ('regular_guest', 'Постоянный гость', '4 недели подряд с хотя бы одним заказом.', 'flame'),
  ('cheesecake_lover', 'Любитель чизкейков', '5 заказов с чизкейком в составе.', 'heart')
on conflict (code) do nothing;
