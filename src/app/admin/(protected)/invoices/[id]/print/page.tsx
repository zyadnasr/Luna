import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/server";
import { getServerLocale } from "@/i18n/server";
import { getInvoiceExportData, invoiceExportCopy, formatInvoiceDate, formatInvoiceMoney, productName } from "@/lib/invoices/export";
import { PrintInvoiceButton } from "@/components/admin/print-invoice-button";

export const dynamic = "force-dynamic";

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("invoices.view");
  const { id } = await params;
  const invoice = await getInvoiceExportData(id);
  if (!invoice) notFound();
  const locale = await getServerLocale();
  const labels = invoiceExportCopy[locale];
  const order = invoice.orders;
  const money = (value: number | string) => formatInvoiceMoney(value, locale, invoice.currency);
  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-white px-6 py-8 text-[#2f2a25] print:max-w-none print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/admin/invoices/${invoice.id}`} className="text-sm underline">← {labels.invoice}</Link>
        <PrintInvoiceButton label={locale === "ar" ? "طباعة الفاتورة" : locale === "it" ? "Stampa fattura" : "Print invoice"} />
      </div>
      <header className="border-b-2 border-[#65705b] pb-5">
        <p className="text-sm font-bold tracking-[0.2em] text-[#65705b]">LUNA HEALTHY</p>
        <h1 className="mt-3 text-3xl font-bold">{labels.title}</h1>
        <p className="mt-2 text-sm">{labels.invoice}: {invoice.invoice_number}</p>
        <p className="text-sm">{labels.issuedAt}: {formatInvoiceDate(invoice.issued_at, locale)}</p>
      </header>
      <section className="grid gap-1 border-b border-[#d9d3c7] py-5 text-sm sm:grid-cols-2">
        <p>{labels.customer}: <strong>{invoice.customer_name || "-"}</strong></p>
        <p>{labels.phone}: <strong>{invoice.customer_phone || "-"}</strong></p>
        <p>{labels.address}: <strong>{invoice.customer_address || "-"}</strong></p>
        {order?.coupon_code ? <p>{labels.coupon}: <strong>{order.coupon_code}</strong></p> : null}
        {order?.delivery_location_url ? <p>{labels.locationLink}: <a className="underline" href={order.delivery_location_url}>{order.delivery_location_url}</a></p> : null}
      </section>
      <table className="mt-6 w-full border-collapse text-sm">
        <thead><tr className="border-b-2 border-[#65705b] text-start"><th className="py-2 text-start">{labels.item}</th><th className="py-2 text-end">{labels.quantity}</th><th className="py-2 text-end">{labels.unitPrice}</th><th className="py-2 text-end">{labels.lineTotal}</th></tr></thead>
        <tbody>{(invoice.invoice_items ?? []).map((item) => <tr className="border-b border-[#d9d3c7]" key={`${item.price_label_snapshot}-${item.quantity}-${item.line_total_egp}`}><td className="py-3">{productName(item, locale)}</td><td className="py-3 text-end">{item.quantity}</td><td className="py-3 text-end">{money(item.unit_price_egp)}</td><td className="py-3 text-end">{money(item.line_total_egp)}</td></tr>)}</tbody>
      </table>
      <section className="ms-auto mt-6 grid max-w-sm gap-2 text-sm">
        <p className="flex justify-between"><span>{labels.subtotal}</span><strong>{money(invoice.subtotal_egp)}</strong></p>
        <p className="flex justify-between"><span>{labels.delivery}</span><strong>{money(invoice.delivery_fee_egp)}</strong></p>
        <p className="flex justify-between"><span>{labels.discount}</span><strong>{money(invoice.discount_amount_egp)}</strong></p>
        <p className="flex justify-between border-t-2 border-[#65705b] pt-3 text-lg"><span>{labels.total}</span><strong>{money(invoice.total_egp)}</strong></p>
      </section>
      <p className="mt-16 text-center text-sm text-[#65705b]">{labels.thankYou}</p>
    </main>
  );
}
