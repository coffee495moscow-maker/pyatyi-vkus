-- Payment and loyalty hardening. This migration is deliberately additive so
-- installations that have already applied 0001/0002 receive the same guards.

alter table users
  add constraint users_points_balance_nonnegative check (points_balance >= 0);

create unique index orders_payment_id_unique_idx
  on orders (payment_id)
  where payment_id is not null;

-- One redemption, refund, and purchase reward may exist for a given order.
-- The partial indexes make webhook retries and concurrent requests idempotent.
create unique index loyalty_ledger_order_redeem_once_idx
  on loyalty_ledger (order_id)
  where reason = 'redeem';

create unique index loyalty_ledger_order_reversal_once_idx
  on loyalty_ledger (order_id)
  where reason = 'reversal';

create unique index loyalty_ledger_order_earn_once_idx
  on loyalty_ledger (order_id)
  where reason = 'earn_purchase';

-- Replaces the original function with the same interface. Locking the user
-- row serializes all point redemptions for that account before calculating the
-- remaining balance, so concurrent checkouts cannot spend the same points.
create or replace function create_order(
  p_user_id uuid,
  p_items jsonb,
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

  select points_balance into v_balance
    from users
    where id = p_user_id
    for update;
  if v_balance is null then
    raise exception 'user_not_found';
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

  v_max_redeem := floor(v_subtotal * 0.5 / 100)::int;
  v_points := least(greatest(coalesce(p_points_to_redeem, 0), 0), v_balance, v_max_redeem);
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
