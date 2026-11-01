# Phase 5.1 QA Checklist

Run the application with `npm.cmd run dev` and use a real Owner account plus a Supabase project containing real catalog data. Do not create fake production orders.

## Viewports and languages

- [ ] Arabic / RTL at 1440px desktop
- [ ] Arabic / RTL at 390px mobile
- [ ] English / LTR at 1440px desktop
- [ ] English / LTR at 390px mobile
- [ ] Italian / LTR at 1440px desktop
- [ ] Italian / LTR at 390px mobile
- [ ] No horizontal overflow
- [ ] Focus rings and keyboard navigation work

## Access control

- [ ] Unauthenticated `/admin/orders` redirects to login
- [ ] Owner can open `/admin/orders`
- [ ] Owner can open `/admin/orders/new`
- [ ] Owner can open `/admin/orders/[id]`
- [ ] Non-owner receives the existing unauthorized behavior
- [ ] Public users cannot open payment proof paths

## Cash orders

- [ ] Public delivery Cash order does not require a screenshot
- [ ] Public table Cash order does not require a screenshot
- [ ] Manual Cash order does not require a screenshot
- [ ] Cash payment state is `cash_pending`
- [ ] No fake payment proof row is created

## Instapay orders

- [ ] Configured Instapay number appears on public checkout
- [ ] Configured Instapay number appears on manual order entry
- [ ] Copy button copies only the display number
- [ ] Missing Instapay setting blocks Instapay submission
- [ ] PNG proof uploads successfully
- [ ] JPG/JPEG proof uploads successfully
- [ ] WEBP proof uploads successfully
- [ ] Invalid file type is rejected
- [ ] Files above 5 MB are rejected
- [ ] Proof is not visible through a public URL
- [ ] Owner sees a short-lived signed preview
- [ ] Owner can verify payment
- [ ] Owner can reject payment with a note
- [ ] Finalized payments do not show active review controls
- [ ] Payment timeline shows only real events

## Manual external orders

- [ ] Talabat order validates and creates correctly
- [ ] Uber order validates and creates correctly
- [ ] WhatsApp order validates and creates correctly
- [ ] Manual order validates and creates correctly
- [ ] Product prices are re-read server-side
- [ ] Browser-submitted totals are ignored
- [ ] Delivery zone fee comes from Supabase
- [ ] Invalid or unavailable products are rejected
- [ ] Manual Instapay requires proof
- [ ] Manual Cash does not require proof

## Admin order details

- [ ] Source is displayed
- [ ] External reference is displayed where present
- [ ] Order type is displayed
- [ ] Customer details are displayed
- [ ] Delivery details are displayed where present
- [ ] Historical order item snapshots are displayed
- [ ] Payment method and status are displayed
- [ ] Order status transitions remain protected
- [ ] Audit activity is scoped to the current order only
- [ ] Audit activity does not expose secrets, tokens, or storage paths
- [ ] Payment timeline does not expose private paths or signed URLs

## Telegram

- [ ] Configured Telegram receives internal order events
- [ ] Payment proof is never included in Telegram
- [ ] Private storage paths are never included in Telegram
- [ ] Missing Telegram configuration does not fail an order
- [ ] Telegram failure does not fail an order
