import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getProducts } from "@/lib/catalog/queries";
import { PageContainer } from "@/components/ui/page-container";
import { MenuOrderControls } from "@/components/orders/menu-order-controls";
import { CheckoutForm } from "@/components/orders/checkout-form";
import { CartDrawer } from "@/components/orders/cart-drawer";
export const dynamic = "force-dynamic";
export default async function TableOrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: rawQr } = await supabase
    .from("qr_codes")
    .select(
      "code, branch_id, dining_table_id, is_active, dining_tables(table_number, is_active), branches(is_active)",
    )
    .eq("code", code)
    .eq("type", "table")
    .maybeSingle();
  const qr = rawQr as {
    code: string;
    branch_id: string;
    dining_table_id: string;
    is_active: boolean;
    dining_tables: { table_number: number; is_active: boolean } | null;
    branches: { is_active: boolean } | null;
  } | null;
  if (!qr || !qr.is_active || !qr.dining_tables?.is_active || !qr.branches?.is_active) notFound();
  const [{ products }, categories] = await Promise.all([getProducts(), getCategories()]);
  return (
    <PageContainer>
      <header className="rounded-[1.5rem] bg-[var(--color-brand-secondary)] p-6 text-[var(--color-on-brand)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[rgba(255,253,245,0.72)]">Luna Healthy · Black Ball</p>
            <h1 className="mt-2 text-3xl font-bold">طاولة {qr.dining_tables.table_number}</h1>
          </div>
          <CartDrawer contextLabel={`طلب الطاولة ${qr.dining_tables.table_number}`} />
        </div>
        <p className="mt-4 text-sm text-[rgba(255,253,245,0.78)]">
          أضف اختياراتك وسنرسل الطلب مباشرة إلى الطاولة.
        </p>
      </header>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-8">
          {categories.map((category) => {
            const items = products.filter((product) => product.category_id === category.id);
            return items.length ? (
              <section key={category.id}>
                <h2 className="text-2xl font-semibold">{category.slug}</h2>
                <div className="luna-menu-grid mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2">
                  {items.map((product) => {
                    const translation = product.product_translations.find(
                      (item) => item.locale === "ar",
                    );
                    const prices = product.product_prices.filter((price) => price.is_active);
                    return (
                      <article
                        className="luna-menu-card luna-glass min-w-0 rounded-[1.15rem] border p-3 sm:rounded-[1.25rem] sm:p-4"
                        key={product.id}
                      >
                        <div className="flex min-h-[5rem] items-start rounded-[0.95rem] bg-[var(--color-background-deep)] p-3 sm:min-h-20">
                          <h3 className="line-clamp-3 text-[1.05rem] font-semibold leading-5 sm:text-xl sm:leading-normal">
                            {translation?.name}
                          </h3>
                        </div>
                        {product.availability_status === "available" ? (
                          <MenuOrderControls
                            productId={product.id}
                            productName={translation?.name}
                            productNames={Object.fromEntries(
                              product.product_translations.map((item) => [item.locale, item.name]),
                            )}
                            prices={prices}
                          />
                        ) : (
                          <p className="mt-3 text-sm text-[var(--color-warning)]">نفد مؤقتًا</p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null;
          })}
        </div>
        <aside className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] lg:sticky lg:top-24 lg:h-fit">
          <h2 className="text-xl font-bold">إرسال الطلب</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            الطاولة {qr.dining_tables.table_number} · ستتم إعادة التحقق من التوفر عند الإرسال.
          </p>
          <div className="mt-6">
            <CheckoutForm
              zones={[]}
              context={{
                type: "table",
                qrCode: qr.code,
                tableId: qr.dining_table_id,
                branchId: qr.branch_id,
              }}
            />
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
