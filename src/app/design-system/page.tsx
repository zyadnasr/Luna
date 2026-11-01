import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { PageContainer } from "@/components/ui/page-container";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DemoControls } from "./demo-controls";

const colors = [
  "brand-primary",
  "brand-secondary",
  "background",
  "surface",
  "surface-elevated",
  "text-primary",
  "accent",
  "success",
  "warning",
  "danger",
  "info",
];

export default function DesignSystemPage() {
  return (
    <PageContainer className="max-w-7xl">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6 border-b border-[var(--color-border)] pb-10">
        <div>
          <p className="text-sm font-semibold text-[var(--color-brand-primary)]">المرجع البصري</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
            نظام لونا للتصميم
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-[var(--color-text-muted)]">
            لغة واجهة هادئة، دافئة، واضحة، ومهيأة للعمل من اليمين إلى اليسار.
          </p>
        </div>
        <LanguageSwitcher />
      </div>
      <div className="grid gap-12">
        <section aria-labelledby="color-title">
          <h2 id="color-title" className="mb-5 text-2xl font-semibold">
            الألوان
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {colors.map((color) => (
              <div
                className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
                key={color}
              >
                <div className="h-16" style={{ backgroundColor: `var(--color-${color})` }} />
                <p className="p-3 text-xs text-[var(--color-text-secondary)]">{color}</p>
              </div>
            ))}
          </div>
        </section>
        <section aria-labelledby="type-title">
          <h2 id="type-title" className="mb-5 text-2xl font-semibold">
            الخطوط والإيقاع
          </h2>
          <GlassPanel>
            <p className="text-sm text-[var(--color-text-muted)]">العربية · English · Italiano</p>
            <p className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">مساحة هادئة</p>
            <p className="mt-3 text-xl text-[var(--color-text-secondary)]">
              Calm space for clear work.
            </p>
            <p className="mt-5 max-w-2xl leading-8 text-[var(--color-text-muted)]">
              نستخدم مكدس خطوط النظام مع قياسات مريحة، عناوين متوازنة، ومساحات تمنح المحتوى فرصة
              للتنفس.
            </p>
          </GlassPanel>
        </section>
        <section aria-labelledby="controls-title">
          <h2 id="controls-title" className="mb-5 text-2xl font-semibold">
            العناصر التفاعلية
          </h2>
          <Card>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                حقل نص
                <Input placeholder="اكتب هنا" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                قائمة اختيار
                <Select defaultValue="one">
                  <option value="one">الخيار الأول</option>
                  <option value="two">الخيار الثاني</option>
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
                ملاحظة
                <Textarea placeholder="اكتب ملاحظة قصيرة" />
              </label>
            </div>
            <div className="mt-7">
              <DemoControls />
            </div>
          </Card>
        </section>
        <section aria-labelledby="surface-title">
          <h2 id="surface-title" className="mb-5 text-2xl font-semibold">
            السطوح والحالات
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            <GlassPanel>
              <h3 className="text-lg font-semibold">لوح زجاجي هادئ</h3>
              <p className="mt-2 leading-7 text-[var(--color-text-muted)]">
                شفافية مضبوطة، blur خفيف، وحدود رقيقة.
              </p>
            </GlassPanel>
            <Card>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="success">جاهز</StatusBadge>
                <StatusBadge status="warning">قيد المراجعة</StatusBadge>
                <StatusBadge status="danger">يحتاج انتباهًا</StatusBadge>
                <StatusBadge status="info">معلومة</StatusBadge>
              </div>
            </Card>
          </div>
        </section>
        <section aria-labelledby="table-title">
          <h2 id="table-title" className="mb-5 text-2xl font-semibold">
            جدول مرجعي
          </h2>
          <Table
            headers={["اللغة", "الاتجاه", "الحالة"]}
            rows={[
              [
                "العربية",
                "RTL",
                <StatusBadge status="success" key="ar">
                  جاهزة
                </StatusBadge>,
              ],
              [
                "English",
                "LTR",
                <StatusBadge status="info" key="en">
                  جاهزة
                </StatusBadge>,
              ],
              [
                "Italiano",
                "LTR",
                <StatusBadge status="info" key="it">
                  جاهزة
                </StatusBadge>,
              ],
            ]}
          />
        </section>
        <section>
          <Tabs
            items={[
              {
                label: "حالة فارغة",
                content: (
                  <EmptyState
                    title="لا توجد بيانات لعرضها"
                    description="هذه الصفحة مرجع بصري فقط ولا تحتوي على بيانات تشغيلية."
                  />
                ),
              },
              {
                label: "RTL / LTR",
                content: (
                  <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 leading-8">
                    العربية تعمل من اليمين إلى اليسار، بينما English و Italiano تعملان من اليسار إلى
                    اليمين عند تغيير اللغة.
                  </p>
                ),
              },
            ]}
          />
        </section>
      </div>
    </PageContainer>
  );
}
