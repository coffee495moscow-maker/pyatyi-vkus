-- Admin order status transitions + product image storage bucket.

-- orders has no client UPDATE policy at all (see 0001) — even for admins —
-- so status changes go through this narrow, audited RPC instead. It still
-- runs under the calling admin's own auth.uid(), which the existing
-- log_order_status_change trigger records as changed_by.
create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_new_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  if p_new_status not in ('preparing', 'ready', 'completed', 'cancelled') then
    raise exception 'invalid_status_transition';
  end if;

  update public.orders
  set status = p_new_status
  where id = p_order_id;

  if not found then
    raise exception 'order_not_found';
  end if;
end;
$$;

grant execute on function public.admin_update_order_status(uuid, text) to authenticated;

-- Product photography bucket — public read (product images are shown on
-- the public catalog), admin-only write. image_path stores the public URL.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product_images_admin_write"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_update"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
