-- Order creation, badge evaluation, and "часто заказывают вместе" — all as
-- plain SQL/plpgsql functions (no SECURITY DEFINER / RLS bypass needed: the
-- app connects as a single trusted role and does its own authorization
-- checks in code before calling these).

-- Atomic order creation: re-validates every price server-side from the
-- products table, computes the redemption cap, and inserts
-- orders+order_items+the redeem ledger entry in one transaction.
create or replace function create_order(
  p_user_id uuid,
  p_items jsonb, -- [{ "product_id": uuid, "quantity": int }, ...]
  p_fulfillment_type text default 'pickup',
  p_pickup_note text default null,
  p_contact_phone text default null,
  p_comment text default null,
  p_points_to_redeem int default 0
)
returns uuid
language plpgsql
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_item jsonb;
  v_product record;
  v_subtotal int := 0;
  v_balance int;
  v_max_redeem int;
  v_points int;
  v_discount int;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select id, price_kopecks, is_available
      into v_product
      from products
      where id = (v_item->>'product_id')::uuid
      for update;

    if v_product.id is null or v_product.is_available is not true then
      raise exception 'product_unavailable: %', v_item->>'product_id';
    end if;

    if coalesce((v_item->>'quantity')::int, 0) <= 0 then
      raise exception 'invalid_quantity';
    end if;

    v_subtotal := v_subtotal + v_product.price_kopecks * (v_item->>'quantity')::int;
  end loop;

  select points_balance into v_balance from users where id = p_user_id;
  v_max_redeem := floor(v_subtotal * 0.5 / 100)::int; -- cap: 50% of subtotal, 1 point = 1 ruble
  v_points := least(greatest(coalesce(p_points_to_redeem, 0), 0), coalesce(v_balance, 0), v_max_redeem);
  v_discount := v_points * 100;

  insert into orders (
    id, user_id, status, fulfillment_type, pickup_note, contact_phone, comment,
    subtotal_kopecks, points_redeemed, discount_kopecks, total_kopecks
  ) values (
    v_order_id, p_user_id, 'created', p_fulfillment_type, p_pickup_note, p_contact_phone, p_comment,
    v_subtotal, v_points, v_discount, greatest(v_subtotal - v_discount, 0)
  );

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select id, name, price_kopecks into v_product
      from products where id = (v_item->>'product_id')::uuid;

    insert into order_items (
      order_id, product_id, product_name_snapshot, unit_price_kopecks_snapshot, quantity, subtotal_kopecks
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.price_kopecks,
      (v_item->>'quantity')::int, v_product.price_kopecks * (v_item->>'quantity')::int
    );
  end loop;

  if v_points > 0 then
    insert into loyalty_ledger (user_id, order_id, delta_points, reason)
    values (p_user_id, v_order_id, -v_points, 'redeem');
  end if;

  return v_order_id;
end;
$$;

-- Badge/streak evaluation — called right after an order is marked 'paid'.
create or replace function check_and_award_badges(p_user_id uuid)
returns void
language plpgsql
as $$
declare
  v_paid_orders int;
  v_distinct_categories int;
  v_cheesecake_orders int;
  v_week date := date_trunc('week', now())::date;
  v_badge_id uuid;
begin
  select count(*) into v_paid_orders
  from orders where user_id = p_user_id and status in ('paid','preparing','ready','completed');

  if v_paid_orders >= 1 then
    select id into v_badge_id from badges where code = 'first_order';
    if v_badge_id is not null then
      insert into user_badges (user_id, badge_id) values (p_user_id, v_badge_id)
      on conflict do nothing;
    end if;
  end if;

  select count(distinct p.category_id) into v_distinct_categories
  from order_items oi
  join orders o on o.id = oi.order_id
  join products p on p.id = oi.product_id
  where o.user_id = p_user_id and o.status in ('paid','preparing','ready','completed');

  if v_distinct_categories >= (select count(*) from categories) and v_distinct_categories > 0 then
    select id into v_badge_id from badges where code = 'taster';
    if v_badge_id is not null then
      insert into user_badges (user_id, badge_id) values (p_user_id, v_badge_id)
      on conflict do nothing;
    end if;
  end if;

  select count(distinct o.id) into v_cheesecake_orders
  from order_items oi
  join orders o on o.id = oi.order_id
  join products p on p.id = oi.product_id
  join categories c on c.id = p.category_id
  where o.user_id = p_user_id and c.slug = 'cheesecake'
    and o.status in ('paid','preparing','ready','completed');

  if v_cheesecake_orders >= 5 then
    select id into v_badge_id from badges where code = 'cheesecake_lover';
    if v_badge_id is not null then
      insert into user_badges (user_id, badge_id) values (p_user_id, v_badge_id)
      on conflict do nothing;
    end if;
  end if;

  update users
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

  if (select current_streak_weeks from users where id = p_user_id) % 4 = 0
     and (select current_streak_weeks from users where id = p_user_id) > 0 then
    insert into loyalty_ledger (user_id, delta_points, reason)
    values (p_user_id, 20, 'streak_bonus');

    select id into v_badge_id from badges where code = 'regular_guest';
    if v_badge_id is not null then
      insert into user_badges (user_id, badge_id) values (p_user_id, v_badge_id)
      on conflict do nothing;
    end if;
  end if;
end;
$$;

-- "Часто заказывают вместе" — co-occurrence across paid orders' items.
create or replace function get_paired_products(
  p_product_ids uuid[],
  p_limit int default 4
)
returns table (product_id uuid, pair_count bigint)
language sql
stable
as $$
  select oi2.product_id, count(distinct oi1.order_id) as pair_count
  from order_items oi1
  join order_items oi2
    on oi1.order_id = oi2.order_id and oi1.product_id <> oi2.product_id
  join orders o on o.id = oi1.order_id
  where o.status in ('paid', 'preparing', 'ready', 'completed')
    and oi1.product_id = any(p_product_ids)
    and not (oi2.product_id = any(p_product_ids))
  group by oi2.product_id
  order by pair_count desc
  limit p_limit;
$$;
