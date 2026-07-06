# KisanMart

Next.js + Supabase e-commerce storefront for Indian farm inputs. The app includes catalog/search, cart, wishlist, compare, Razorpay and COD checkout, coupons, multiple addresses, shipment tracking, invoice PDFs, returns, rewards/referrals, bulk quotations, crop advisory, bilingual navigation, notifications, admin analytics and inventory alerts.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add the project credentials.
3. In Supabase SQL Editor, run these files in order:
   - `supabase/schema.sql`
   - `supabase/products.sql` (seed catalog, optional)
   - `supabase/commerce-features.sql`
   - `supabase/order-functions.sql`
   - `supabase/realtime-setup.sql` (live admin refresh, optional)
4. Start with `npm run dev`.

`commerce-features.sql` is idempotent and contains all new tables, policies and atomic inventory/reward functions. Run it again when pulling feature updates.

## Payments and notifications

- Razorpay needs `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
- COD works without a payment provider and is controlled per pincode in `serviceable_pincodes`.
- Every order event creates an in-app notification.
- To send the same events through email/SMS, set `NOTIFICATION_WEBHOOK_URL`. The endpoint receives a JSON payload with title, message, email, phone, type and link. `NOTIFICATION_WEBHOOK_SECRET` adds a bearer token, so an n8n/Make/Resend/MSG91/Twilio adapter can be connected without changing checkout code.

## Quality checks

```bash
npm run lint
npm run build
```

The build requires network access to the configured Supabase project when server-rendered pages fetch live catalog data.
