import PDFDocument from "pdfkit-browser";
import { requirePermission } from "@/lib/auth/server";
import { getServerLocale } from "@/i18n/server";
import {
  formatInvoiceDate,
  formatInvoiceMoney,
  getInvoiceExportData,
  invoiceExportCopy,
  invoiceFontSource,
  productName,
} from "@/lib/invoices/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildPdf(
  invoice: NonNullable<Awaited<ReturnType<typeof getInvoiceExportData>>>,
  locale: Awaited<ReturnType<typeof getServerLocale>>,
) {
  return new Promise<Buffer>((resolve, reject) => {
    const labels = invoiceExportCopy[locale];
    const document = new PDFDocument({
      size: "A4",
      margin: 48,
      info: { Title: `${labels.title} ${invoice.invoice_number}`, Author: "Luna Healthy" },
    });
    const chunks: Buffer[] = [];
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
    const font = invoiceFontSource(locale);
    if (font) document.font(font);
    const right = document.page.width - document.page.margins.right;
    const number = (value: number | string) => formatInvoiceMoney(value, locale, invoice.currency);
    const writeRight = (text: string, y?: number, size = 10) =>
      document.fontSize(size).text(text, document.page.margins.left, y, {
        width: right - document.page.margins.left,
        align: locale === "ar" ? "right" : "left",
      });

    document.fillColor("#65705b").fontSize(12).text("LUNA HEALTHY");
    document.fillColor("#2f2a25");
    writeRight(labels.title, 86, 25);
    writeRight(`${labels.invoice}: ${invoice.invoice_number}`, 124, 11);
    writeRight(`${labels.issuedAt}: ${formatInvoiceDate(invoice.issued_at, locale)}`, 143, 10);
    document.moveTo(48, 174).lineTo(right, 174).strokeColor("#d9d3c7").stroke();

    writeRight(`${labels.customer}: ${invoice.customer_name || "-"}`, 196, 11);
    writeRight(`${labels.phone}: ${invoice.customer_phone || "-"}`, 216, 10);
    writeRight(`${labels.customerTypeLabel}: ${invoice.customer_type === "returning" ? labels.returningCustomer : labels.newCustomer}`, 236, 10);
    if (invoice.customer_address)
      writeRight(`${labels.address}: ${invoice.customer_address}`, 256, 10);

    let y = invoice.customer_address ? 306 : 286;
    const columns =
      locale === "ar"
        ? { item: right - 300, quantity: right - 210, unit: right - 130, total: right - 35 }
        : { item: 48, quantity: 310, unit: 370, total: 465 };
    document.fillColor("#65705b").fontSize(9);
    document.text(labels.item, columns.item, y, {
      width: 210,
      align: locale === "ar" ? "right" : "left",
    });
    document.text(labels.quantity, columns.quantity, y, { width: 55, align: "right" });
    document.text(labels.unitPrice, columns.unit, y, { width: 80, align: "right" });
    document.text(labels.lineTotal, columns.total, y, { width: 80, align: "right" });
    y += 22;
    document.fillColor("#2f2a25");
    for (const item of invoice.invoice_items ?? []) {
      if (y > 690) {
        document.addPage();
        y = 55;
      }
      document.fontSize(9).text(productName(item, locale), columns.item, y, {
        width: 210,
        align: locale === "ar" ? "right" : "left",
      });
      document.text(String(item.quantity), columns.quantity, y, { width: 55, align: "right" });
      document.text(number(item.unit_price_egp), columns.unit, y, { width: 80, align: "right" });
      document.text(number(item.line_total_egp), columns.total, y, { width: 80, align: "right" });
      y += 22;
    }
    document
      .moveTo(48, y + 4)
      .lineTo(right, y + 4)
      .strokeColor("#d9d3c7")
      .stroke();
    y += 24;
    const summary = [
      [labels.subtotal, number(invoice.subtotal_egp)],
      [labels.delivery, number(invoice.delivery_fee_egp)],
      [labels.discount, number(invoice.discount_amount_egp)],
      [labels.tax, number(invoice.tax_amount_egp)],
      [labels.total, number(invoice.total_egp)],
    ];
    for (const [label, value] of summary) {
      document
        .fontSize(label === labels.total ? 12 : 10)
        .font(label === labels.total ? (font ?? "Helvetica-Bold") : (font ?? "Helvetica"))
        .text(`${label}: ${value}`, 300, y, { width: right - 300, align: "right" });
      y += label === labels.total ? 27 : 20;
    }
    const order = invoice.orders;
    const detailRows: Array<[string, string | number | null | undefined]> = [
      [labels.orderNumber, order?.order_number],
      [labels.orderType, order?.order_type],
      [labels.source, order?.source],
      [labels.orderStatus, order?.status],
      [labels.paymentMethod, order?.payment_method],
      [labels.paymentStatus, order?.payment_status],
      [labels.salesChannel, order?.sales_channel],
      [labels.acquisitionSource, order?.acquisition_source],
      [labels.attributionType, order?.attribution_type],
      [labels.campaignAdSet, order?.campaign_ad_set],
      [labels.influencerPartner, order?.influencer_partner_name],
      [labels.businessType, order?.business_type],
      [labels.customerNotes, order?.customer_notes],
      [labels.invoiceNotes, order?.invoice_notes],
      [labels.coupon, order?.coupon_code],
      [labels.requestedDelivery, order?.requested_delivery_time ? formatInvoiceDate(order.requested_delivery_time, locale) : null],
      [labels.deliveryLocation, order?.delivery_location_url],
      [labels.invoiceRequested, order?.invoice_requested == null ? null : order.invoice_requested ? labels.yes : labels.no],
      [labels.externalInvoiceUrl, order?.external_invoice_url],
      [labels.externalInvoiceError, order?.external_invoice_error],
    ];
    if (detailRows.some(([, value]) => value)) {
      document.addPage();
      y = 58;
      writeRight(labels.orderDetails, y, 16);
      y += 30;
      for (const [label, value] of detailRows) {
        if (!value) continue;
        writeRight(`${label}: ${String(value)}`, y, 9);
        y += 18;
      }
    }
    document
      .fillColor("#65705b")
      .fontSize(10)
      .text(labels.thankYou, 48, 750, { width: right - 48, align: "center" });
    document.end();
  });
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  await requirePermission("invoices.view");
  const { id } = await context.params;
  const invoice = await getInvoiceExportData(id);
  if (!invoice) return new Response("Invoice not found", { status: 404 });
  const locale = await getServerLocale();
  const buffer = await buildPdf(invoice, locale);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
