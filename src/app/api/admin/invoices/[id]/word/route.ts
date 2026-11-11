import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { requirePermission } from "@/lib/auth/server";
import { getServerLocale } from "@/i18n/server";
import {
  formatInvoiceDate,
  formatInvoiceMoney,
  getInvoiceExportData,
  invoiceExportCopy,
  productName,
} from "@/lib/invoices/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function paragraph(
  text: string,
  locale: Awaited<ReturnType<typeof getServerLocale>>,
  options: {
    bold?: boolean;
    size?: number;
    heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
  } = {},
) {
  return new Paragraph({
    heading: options.heading,
    alignment: locale === "ar" ? AlignmentType.RIGHT : AlignmentType.LEFT,
    bidirectional: locale === "ar",
    children: [new TextRun({ text, bold: options.bold, size: options.size ?? 22, font: "Arial" })],
  });
}

async function buildWord(
  invoice: NonNullable<Awaited<ReturnType<typeof getInvoiceExportData>>>,
  locale: Awaited<ReturnType<typeof getServerLocale>>,
) {
  const labels = invoiceExportCopy[locale];
  const money = (value: number | string) => formatInvoiceMoney(value, locale, invoice.currency);
  const headers = [labels.item, labels.quantity, labels.unitPrice, labels.lineTotal];
  const headerRow = new TableRow({
    children: headers.map(
      (value) =>
        new TableCell({
          children: [paragraph(value, locale, { bold: true, size: 18 })],
          width: { size: 25, type: WidthType.PERCENTAGE },
        }),
    ),
  });
  const itemRows = (invoice.invoice_items ?? []).map(
    (item) =>
      new TableRow({
        children: [
          productName(item, locale),
          String(item.quantity),
          money(item.unit_price_egp),
          money(item.line_total_egp),
        ].map((value) => new TableCell({ children: [paragraph(value, locale, { size: 18 })] })),
      }),
  );
  const summary = [
    [labels.subtotal, money(invoice.subtotal_egp)],
    [labels.delivery, money(invoice.delivery_fee_egp)],
    [labels.discount, money(invoice.discount_amount_egp)],
    [labels.tax, money(invoice.tax_amount_egp)],
    [labels.total, money(invoice.total_egp)],
  ];
  const document = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } },
        children: [
          paragraph("LUNA HEALTHY", locale, { bold: true, size: 28 }),
          paragraph(labels.title, locale, { bold: true, size: 34, heading: HeadingLevel.TITLE }),
          paragraph(`${labels.invoice}: ${invoice.invoice_number}`, locale),
          paragraph(`${labels.issuedAt}: ${formatInvoiceDate(invoice.issued_at, locale)}`, locale),
          paragraph(`${labels.customer}: ${invoice.customer_name || "-"}`, locale),
          paragraph(`${labels.phone}: ${invoice.customer_phone || "-"}`, locale),
          paragraph(`${labels.customerTypeLabel}: ${invoice.customer_type === "returning" ? labels.returningCustomer : labels.newCustomer}`, locale),
          ...(invoice.customer_address
            ? [paragraph(`${labels.address}: ${invoice.customer_address}`, locale)]
            : []),
          ...(invoice.orders?.coupon_code
            ? [paragraph(`${labels.coupon}: ${invoice.orders.coupon_code}`, locale)]
            : []),
          ...(invoice.orders?.delivery_location_url
            ? [paragraph(`${labels.locationLink}: ${invoice.orders.delivery_location_url}`, locale)]
            : []),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "D9D3C7" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              top: { style: BorderStyle.SINGLE, size: 4, color: "D9D3C7" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "D9D3C7" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [headerRow, ...itemRows],
          }),
          ...summary.map(([label, value]) =>
            paragraph(`${label}: ${value}`, locale, {
              bold: label === labels.total,
              size: label === labels.total ? 24 : 20,
            }),
          ),
          paragraph(labels.thankYou, locale, { size: 20 }),
        ],
      },
    ],
  });
  return Packer.toBuffer(document);
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  await requirePermission("invoices.view");
  const { id } = await context.params;
  const invoice = await getInvoiceExportData(id);
  if (!invoice) return new Response("Invoice not found", { status: 404 });
  const locale = await getServerLocale();
  const buffer = await buildWord(invoice, locale);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${invoice.invoice_number}.docx"`,
      "Cache-Control": "no-store",
    },
  });
}
