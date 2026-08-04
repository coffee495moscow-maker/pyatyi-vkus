-- "Часто заказывают вместе" — rule-based recommendations, no ML.
-- SECURITY DEFINER so it can read across all paid orders' items to compute
-- aggregate co-occurrence counts, while only ever returning
-- (product_id, count) pairs — never which user ordered what — so it's safe
-- to expose to anon/authenticated despite orders/order_items RLS
-- restricting each customer to their own rows.
create or replace function public.get_paired_products(
  p_product_ids uuid[],
  p_limit int default 4
)
returns table (product_id uuid, pair_count bigint)
language sql
security definer
stable
set search_path = public
as $$
  select oi2.product_id, count(distinct oi1.order_id) as pair_count
  from public.order_items oi1
  join public.order_items oi2
    on oi1.order_id = oi2.order_id and oi1.product_id <> oi2.product_id
  join public.orders o on o.id = oi1.order_id
  where o.status in ('paid', 'preparing', 'ready', 'completed')
    and oi1.product_id = any(p_product_ids)
    and not (oi2.product_id = any(p_product_ids))
  group by oi2.product_id
  order by pair_count desc
  limit p_limit;
$$;

grant execute on function public.get_paired_products(uuid[], int) to authenticated, anon;
