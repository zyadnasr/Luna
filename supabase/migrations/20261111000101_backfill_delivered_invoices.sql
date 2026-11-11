-- Backfill invoices for delivered orders created before invoice generation was enabled.
-- Safe to rerun: existing invoices and invoice items are never duplicated.

insert into public.invoices (
  order_id,
  invoice_number,
  customer_name,
  customer_phone,
  customer_address,
  customer_type,
  subtotal_egp,
  delivery_fee_egp,
  discount_percentage,
  discount_amount_egp,
  tax_amount_egp,
  total_egp,
  issued_at
)
select
  o.id,
  public.next_invoice_number(),
  o.customer_name,
  o.customer_phone,
  o.delivery_address,
  case
    when o.customer_phone is not null and exists (
      select 1
      from public.orders previous_order
      where previous_order.status = 'delivered'
        and previous_order.customer_phone = o.customer_phone
        and previous_order.created_at < o.created_at
    ) then 'returning'
    else 'new'
  end,
  o.subtotal_egp,
  o.delivery_fee_egp,
  case
    when (o.subtotal_egp + o.delivery_fee_egp) > 0
      then round((o.discount_egp / (o.subtotal_egp + o.delivery_fee_egp)) * 100, 2)
    else 0
  end,
  o.discount_egp,
  0,
  o.total_egp,
  coalesce(o.created_at, timezone('utc', now()))
from public.orders o
where o.status = 'delivered'
  and not exists (
    select 1
    from public.invoices existing_invoice
    where existing_invoice.order_id = o.id
  )
on conflict (order_id) do nothing;

insert into public.invoice_items (
  invoice_id,
  product_id,
  product_name_snapshot,
  price_label_snapshot,
  unit_price_egp,
  quantity,
  line_total_egp
)
select
  i.id,
  oi.product_id,
  oi.product_name_snapshot,
  oi.price_label_snapshot,
  oi.unit_price_egp,
  oi.quantity,
  oi.line_total_egp
from public.invoices i
join public.orders o on o.id = i.order_id
join public.order_items oi on oi.order_id = o.id
where o.status = 'delivered'
  and not exists (
    select 1
    from public.invoice_items existing_item
    where existing_item.invoice_id = i.id
  );
