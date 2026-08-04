-- Checkout RPCs — the only sanctioned way orders/order_items/loyalty_ledger
-- get written to from a customer session. Both are SECURITY DEFINER so they
-- can perform the loyalty_ledger insert (client INSERT is admin-only per
-- 0001's RLS) and the orders UPDATE (no client UPDATE policy exists on
-- orders at all — status transitions are deliberately server-side only),
-- while still enforcing ownership/state checks in the function body.

create or replace function public.create_order(
  p_items jsonb, -- [{ "product_id": uuid, "quantity": int }, ...]
  p_fulfillment_type text default 'pickup',
  p_pickup_note text default null,
  p_contact_phone text default null,
  p_comment text default null,
  p_points_to_redeem int default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid := gen_random_uuid();
  v_item jsonb;
  v_product record;
  v_subtotal int := 0;
  v_balance int;
  v_max_redeem int;
  v_points int;
  v_discount int;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart';
  end if;

  -- Pass 1: validate + compute subtotal from real, current prices.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select id, price_kopecks, is_available
      into v_product
      from public.products
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

  select points_balance into v_balance from public.profiles where id = v_user_id;
  v_max_redeem := floor(v_subtotal * 0.5 / 100)::int; -- cap: 50% of subtotal, 1 point = 1 ruble
  v_points := least(greatest(coalesce(p_points_to_redeem, 0), 0), coalesce(v_balance, 0), v_max_redeem);
  v_discount := v_points * 100;

  insert into public.orders (
    id, user_id, status, fulfillment_type, pickup_note, contact_phone, comment,
    subtotal_kopecks, points_redeemed, discount_kopecks, total_kopecks
  ) values (
    v_order_id, v_user_id, 'created', p_fulfillment_type, p_pickup_note, p_contact_phone, p_comment,
    v_subtotal, v_points, v_discount, greatest(v_subtotal - v_discount, 0)
  );

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select id, name, price_kopecks into v_product
      from public.products where id = (v_item->>'product_id')::uuid;

    insert into public.order_items (
      order_id, product_id, product_name_snapshot, unit_price_kopecks_snapshot, quantity, subtotal_kopecks
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.price_kopecks,
      (v_item->>'quantity')::int, v_product.price_kopecks * (v_item->>'quantity')::int
    );
  end loop;

  if v_points > 0 then
    insert into public.loyalty_ledger (user_id, order_id, delta_points, reason)
    values (v_user_id, v_order_id, -v_points, 'redeem');
  end if;

  return v_order_id;
end;
$$;

grant execute on function public.create_order(jsonb, text, text, text, text, int) to authenticated;

-- Transitions an order the caller owns from 'created' to 'awaiting_payment'
-- once a payment has been opened with the provider. This is the only field
-- set a customer session may ever apply to their own order.
create or replace function public.attach_payment(
  p_order_id uuid,
  p_provider text,
  p_payment_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set status = 'awaiting_payment', payment_provider = p_provider,
      payment_id = p_payment_id, payment_status = 'pending'
  where id = p_order_id and user_id = auth.uid() and status = 'created';

  if not found then
    raise exception 'order_not_found_or_invalid_state';
  end if;
end;
$$;

grant execute on function public.attach_payment(uuid, text, text) to authenticated;
