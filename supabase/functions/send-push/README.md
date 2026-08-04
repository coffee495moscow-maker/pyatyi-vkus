# send-push Edge Function

Sends Web Push notifications for order status changes and promotion
launches. Not wired up automatically — deploy it and connect two Database
Webhooks once you have a linked Supabase project:

## 1. Set secrets (not regular env vars — these must not leak into Vercel)

```
supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:coffee495moscow@gmail.com
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically to
every Edge Function — no need to set them manually.

## 2. Deploy

```
supabase functions deploy send-push
```

## 3. Create the two Database Webhooks (Dashboard → Database → Webhooks, or `supabase db webhooks create`)

| Name | Table | Events | Condition | Target |
|---|---|---|---|---|
| order-status-push | `orders` | Update | Column `status` changed | HTTP POST to the deployed `send-push` URL |
| promotion-publish-push | `promotions` | Update | Column `is_active` changed | HTTP POST to the deployed `send-push` URL |

Both webhooks send the standard `{ type, table, record, old_record }` body
that `index.ts` expects. The function itself filters out no-op updates
(status unchanged, or `is_active` flipping to `false`) so over-broad webhook
conditions are harmless.
