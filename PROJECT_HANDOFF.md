# Luna Healthy — Project Handoff

آخر تحديث: 2026-11-01

هذا الملف هو مرجع الاستلام لأي AI أو مطوّر سيكمل مشروع Luna Healthy. اقرأه قبل تعديل الكود، خصوصًا قبل لمس الـ Supabase migrations أو نظام الترجمة أو الـ inventory.

## 1. ما هو المشروع؟

Luna Healthy هو موقع طلبات لمشروع كوكيز/حلويات صحية باسم Luna Healthy. المشروع يحتوي على:

- واجهة عامة للعميل: Home، Menu، Cart، Checkout، Order Status وSuccess.
- Admin Dashboard محمي بالصلاحيات لإدارة المنتجات، الأسعار، التصنيفات، المخزون، الوصفات والطلبات.
- ثلاث لغات: العربية `ar`، الإنجليزية `en`، الإيطالية `it`.
- ثيمان: Light وDark، بنفس هوية Luna الزمحية/البنية.
- Supabase Auth وPostgres وRLS وStorage لإثبات الدفع.
- فحص Server-side للأسعار، حالة المنتج، الوصفات والمخزون قبل إنشاء الطلب.

المشروع مبني بـ Next.js 16 App Router وReact 19 وTypeScript وTailwind CSS 4 وSupabase.

## 2. التشغيل والتحقق

من جذر المشروع:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run format
npm.cmd run lint
npm.cmd run type-check
npm.cmd test
npm.cmd run build
```

الـ dev server قد يستخدم Port `3001` إذا كان `3000` مشغولًا.

الـ build يطبع تحذيرًا متكررًا عن:

```text
@next/swc-win32-x64-msvc ... is not a valid Win32 application
```

هذا تحذير بيئي سابق، وNext.js يستخدم WASM fallback. لا تعتبره فشلًا طالما أن الـ build يكمل إلى `Compiled successfully` ويخرج route list.

## 3. قاعدة البيانات وSupabase

ملفات الـ migrations موجودة في:

```text
supabase/migrations/
```

الترتيب الحالي:

1. `20261029000100_phase_2_foundation.sql` — الجداول الأساسية، locations، branches، tables، categories، products، translations، prices، profiles، settings.
2. `20261029000200_auth_permissions_foundation.sql` — roles، permissions، user roles وRLS للصلاحيات.
3. `20261029000300_catalog_management.sql` — category translations، sort order وسياسات القراءة العامة للمنتجات والأسعار.
4. `20261029000400_orders_foundation.sql` — orders، order items، delivery zones، status history.
5. `20261029000500_payment_proofs.sql` — payment proof/storage support.
6. `20261029000600_inventory_foundation.sql` — inventory items، stock batches، movements، recipes، recipe items، stock consumption function.
7. `20261029000700_inventory_workflows.sql` — receive، transfer، waste، cancellation restore workflows.
8. `20261029000800_inventory_counts.sql` — stock count workflow.
9. `20261031000100_menu_catalog.sql` — كتالوج Luna من صور المنيو: الأقسام والمنتجات والأسعار والترجمات.

### حالة آخر migration

المستخدم شغّل فعليًا:

```powershell
npx.cmd supabase db push --linked
```

وظهر في الشاشة أن:

```text
Applying migration 20261031000100_menu_catalog.sql...
Finished supabase db push.
```

لذلك Migration الكتالوج مفترض أنه مطبق على قاعدة البيانات المرتبطة. لا تعيد تشغيله يدويًا ولا تنشئ IDs جديدة لنفس المنتجات.

### مهم بخصوص البيانات

الـ migration يضيف catalog فقط:

- 4 أقسام: Luna Gold، Luna Classic، Luna Bites، Luna Mini.
- 15 منتجًا.
- أسعار وأحجام المنتجات الظاهرة في صور المنيو.
- ترجمة عربي/إنجليزي/إيطالي.

هو لا يضيف stock batches أو recipes فعلية؛ هذه بيانات تشغيلية يجب إدخالها من الإدارة لأن اختراع المخزون سيؤدي لطلبات غير حقيقية.

إذا احتجت migrations جديدة، أضف ملفًا جديدًا باسم timestamp أكبر، ولا تعدّل migration مطبقًا على Supabase.

## 4. تدفق الكتالوج والطلب

المسار العام:

```text
Admin product
  -> product translations + prices
  -> active recipe per product/price
  -> inventory items + recipe items
  -> stock batches
  -> menu availability check
  -> cart
  -> server-side order validation
  -> order creation
```

صفحة الـ Menu هي:

```text
src/app/menu/page.tsx
```

وتقرأ المنتجات والتصنيفات من:

```text
src/lib/catalog/queries.ts
```

كل price في الـ Menu يُفحص بواسطة:

```text
src/lib/inventory/availability.ts
```

الفحص يتحقق من:

- المنتج active و`availability_status = available`.
- السعر تابع لنفس المنتج وactive وغير منتهٍ.
- توجد recipe active، مفضّلًا recipe الخاصة بالسعر ثم recipe العامة للمنتج.
- كل recipe item لديه كمية متاحة كافية في stock batches غير المنتهية.

تم تحويل قراءة availability الداخلية إلى server-only service client لأن جداول inventory غير متاحة للـ anon بسبب RLS. لا ترسل quantities أو service-role key إلى المتصفح؛ الذي يخرج للواجهة هو boolean availability فقط.

صفحة الـ Menu تعرض المنتج، لكن زر الإضافة يكون disabled إذا كان السعر غير متاح. الطلب يعيد الفحص مرة أخرى داخل:

```text
src/lib/orders/actions.ts
```

لا تعتمد على فحص المتصفح وحده؛ فحص الطلب النهائي يجب أن يظل Server-side دائمًا.

## 5. كيف تجهّز المنتجات للطلب؟

من Admin:

1. `/admin/inventory/items/new` — إنشاء inventory items.
2. `/admin/inventory/batches` — استلام stock batch في Warehouse `Home`.
3. `/admin/inventory/recipes` — إنشاء recipe لكل منتج/حجم وربطها بالـ inventory items.
4. افتح `/menu` وتأكد أن price أصبح Available.

الأحجام الموجودة في الكتالوج:

- Luna Gold: 18 pieces و30 pieces.
- Luna Classic: 16 pieces.
- Luna Bites: 180 g.
- Luna Mini: 2 pieces و4 pieces.

لا تضف batches تجريبية في الإنتاج. إذا كان المنتج بلا recipe أو بلا stock، من الطبيعي أن يظهر في الكتالوج كغير متاح.

## 6. الترجمة

هناك أكثر من طبقة ترجمة لأن المشروع يحتوي على public وadmin وauth:

- Public copy: `src/i18n/public.ts`
- Admin page copy: `src/i18n/admin.ts`
- Raw Arabic admin text mapping: `src/i18n/admin-text.ts`
- Auth copy/messages: `src/components/auth/auth-form.tsx` و`src/i18n/auth-messages.ts`
- Locale state: `src/components/ui/locale-provider.tsx`

قواعد مهمة:

- لا تكتب نصًا جديدًا داخل صفحة Admin إذا كان سيظهر للمستخدم؛ أضفه للقاموس المركزي.
- عند إضافة نص عربي raw في مكوّن Admin، أضف mapping للإنجليزية والإيطالية في `admin-text.ts`.
- عند إضافة public screen، أضف المفاتيح للغات الثلاث في `public.ts`.
- لا تستخدم `window` أو `localStorage` في render server/client branch. استخدم `useSyncExternalStore` أو effect مناسبًا لتفادي hydration mismatch.
- بعد تغيير اللغة يجب أن يتغير `document.documentElement.lang` و`dir` تلقائيًا.

## 7. أخطاء واجهتنا وحلولها

### Hydration mismatch في Header وThemeToggle

الخطأ كان يظهر لأن server يرندر العربية/الثيم الافتراضي، بينما client يقرأ localStorage فورًا ويرندر English أو Dark:

```text
Hydration failed because the server rendered text didn't match the client
```

الحل:

- `LocaleProvider` يستخدم `useSyncExternalStore` مع server snapshot عربي.
- `ThemeToggle` يستخدم نفس النمط بدل `typeof window !== undefined` داخل render.
- لا تعيد هذا الخطأ بإضافة localStorage reads مباشرة أثناء render.

### زرار Sign in والأزرار البنية غير مقروءة في Dark mode

كان النص يستخدم `--color-surface` فوق `--color-brand-secondary`. في Dark mode أصبح surface داكنًا، فاختفى النص.

الحل:

- زرار primary يستخدم `--color-on-brand`.
- الكروت البنية تستخدم `--color-on-brand` و`--color-on-brand-muted`.
- تم تعميم الإصلاح على الأزرار المشتركة وليس زرًا واحدًا فقط.

### نص Add your first trusted user غير واضح

السبب كان hard-coded rgba لا يتبع theme.

الحل: استخدام `--color-on-brand-muted` داخل الكارت ذي الخلفية البنية.

### Account connected dot

كان يعتمد على `bg-current` بطريقة غير واضحة.

الحل: `StatusBadge` يحدد لون dot صراحة حسب status، والـ success يستخدم `--color-success`.

### Sidebar يحدد Inventory وRecipes معًا

كان parent route يعتبر نفسه active بمجرد أن pathname يبدأ بـ `/admin/inventory`.

الحل: `AdminShell` يبحث عن أكثر route تحديدًا، فيتم تفعيل Recipes فقط داخل `/admin/inventory/recipes`.

### اختيار اللغة المكرر في Admin

كان هناك LanguageSwitcher في الـ public navbar وآخر داخل Admin header.

الحل: إزالة المكرر من `src/components/admin/admin-shell.tsx` والإبقاء على selector الأساسي في الـ navbar.

### نصوص عربية متسربة في Admin English/Italian

كانت صفحات inventory وalerts تستخدم default Arabic strings لا توجد في القاموس.

الحل: إضافة المفاتيح إلى `src/i18n/admin-text.ts` وربط `InventoryEmptyState` بـ `useLocale`.

### Empty state plus منخفض التباين

الحل: استخدام background/border/text tokens بدل لون brand منخفض التباين.

### Instapay autofill يظهر بلون غير مقروء

Edge/Chromium autofill كان يفرض background وtext colors.

الحل: CSS `:-webkit-autofill` في `src/app/globals.css` يستخدم `--color-surface-focus` و`--color-text-primary`.

### صورة الكوكيز والزوائد البيضاء

تم استخدام cutout حقيقي من المستخدم في:

```text
public/assets/menu-ar.png
```

والـ Home يستخدمه بدل CSS cookie shapes. تم تنظيف الهالة البيضاء وإبقاء alpha channel.

لا تغيّر اسم `menu-ar.png` إلا بطلب صريح. صورة المنيو العربية ما زالت:

```text
public/assets/menu-ar.jpeg
```

والإنجليزية:

```text
public/assets/menu-en.jpeg
```

### SWC native warning

البيئة الحالية لا تستطيع تحميل native SWC binary وتستخدم WASM. هذا لا يحتاج تعديلًا في business code طالما build ناجح.

## 8. الثيم والتصميم

Tokens موجودة في:

```text
src/styles/tokens.css
```

استخدم tokens بدل hard-coded colors، خصوصًا:

- `--color-text-primary`
- `--color-text-secondary`
- `--color-text-muted`
- `--color-on-brand`
- `--color-on-brand-muted`
- `--color-surface-focus`
- `--color-nav-active-bg`
- `--color-nav-active-text`
- `--color-success`
- `--color-danger-*`

تم إضافة custom scrollbar في `src/app/globals.css` باستخدام brand tokens ويتغير تلقائيًا مع Light/Dark.

### آخر تحديثات كروت المنتجات

تم توحيد نظام كروت المنتجات responsive في كل تدفقات الطلب العامة:

- `/menu`
- `/order` لطلبات التوصيل
- `/order/table/[code]` لطلبات الطاولات عبر QR

على شاشات الموبايل تستخدم المنتجات شبكة من عمودين بدل كروت بعرض الشاشة بالكامل. الكروت تستخدم `luna-glass` و`luna-menu-card`، مع عنوان محدود الأسطر، مسافات compact، تدرّج بصري خفيف، وأزرار/اختيارات مناسبة للمس. على الشاشات الأكبر ترجع الشبكة تلقائيًا إلى تخطيط أوسع عبر breakpoints الموجودة في Tailwind.

الـ shared styles الخاصة بالكروت موجودة في `src/app/globals.css`، بينما markup التدفقات موجود في:

```text
src/app/menu/page.tsx
src/app/order/page.tsx
src/app/order/table/[code]/page.tsx
src/components/orders/menu-order-controls.tsx
```

اسم البراند يظل `Luna Healthy` بالإنجليزية في كل اللغات، بينما نصوص الواجهة نفسها تظل مترجمة. تم تحديث الـ header، footer، auth، home، not-found، وpublic/admin copy لتجنب ظهور اسم البراند بالعربية.

## 9. الصور حسب اللغة

في `src/app/page.tsx`:

- Arabic home menu image: `/assets/menu-ar.jpeg`
- English and Italian home menu image: `/assets/menu-en.jpeg`
- Real cookies decoration: `/assets/menu-ar.png`

لا تخلط بين `menu-ar.png` (كوكيز cutout) و`menu-ar.jpeg` (صورة المنيو العربية).

## 10. Admin routes الحالية

الموجود حاليًا:

- `/admin`
- `/admin/categories`
- `/admin/orders`
- `/admin/orders/new`
- `/admin/orders/[id]`
- `/admin/products`
- `/admin/products/new`
- `/admin/products/[id]`
- `/admin/inventory`
- `/admin/inventory/items`
- `/admin/inventory/items/new`
- `/admin/inventory/batches`
- `/admin/inventory/movements`
- `/admin/inventory/recipes`
- `/admin/inventory/recipes/new`
- `/admin/inventory/alerts`
- `/admin/inventory/transfers`
- `/admin/inventory/waste`
- `/admin/inventory/counts`
- `/admin/users`
- `/admin/settings`
- `/admin/tables`
- `/admin/expenses`
- `/admin/reports`

بعض صفحات الإدارة مثل expenses/reports/tables ما زالت placeholder modules، وليست business workflows كاملة. لا تعتبر وجود route معناه أن الوحدة اكتملت.

## 11. ما تم اختباره آخر مرة

آخر validation ناجح:

- `npm.cmd run format`
- `npm.cmd run lint`
- `npm.cmd run type-check`
- `npm.cmd test` — 11 tests passed
- `npm.cmd run build` — succeeded with known SWC WASM warning
- Mobile visual QA على عرض يقارب 400px: شبكة الكروت والـ bottom navigation لا تتداخل مع محتوى الكروت أثناء التمرير.
- تم اختبار تبديل اللغة في cart: أسماء المنتجات والأسعار تتغير حسب اللغة، مع بقاء `Luna Healthy` بالإنجليزية.

آخر commits الخاصة بهذه التحديثات:

```text
cc33ac8 Refine mobile menu product cards
dc62479 Apply responsive product cards to order flows
ae602ae Keep Luna brand name in English
```

تم دفعها إلى GitHub على branch `main`، وVercel مربوط بالنشر التلقائي من هذا الفرع.

## 12. الطلبات والدفع والإشعارات

- الدفع عند الاستلام يعمل كطريقة الدفع الحالية.
- Visa ظاهرة كخيار معطّل مؤقتًا حتى ربط بوابة دفع حقيقية.
- رسوم توصيل El Tagamo3 مضبوطة على `45 EGP`، ويمكن إضافة مناطق أخرى من البيانات/الإدارة لاحقًا.
- التحقق من كوبونات الخصم أصبح متاحًا من checkout عبر `validatePublicCoupon`، مع دعم نسبة الخصم والمنتجات المسموح بها من لوحة الإدارة.
- بيانات العميل تُحفظ ضمن تدفق الطلب لدعم إعادة الطلب/الشحن المجاني للعميل العائد حسب قواعد المشروع الحالية.
- Telegram bot المجهز للطلبات هو `@LunaHealthyOrdersBot`، ومتغيرا `TELEGRAM_BOT_TOKEN` و`TELEGRAM_CHAT_ID` مضبوطان على Vercel. لم يتم إنشاء طلب حقيقي أثناء QA.

## 13. الخطوات التالية المقترحة

بالترتيب:

1. إدخال inventory items الحقيقية من الإدارة.
2. استلام stock batches الحقيقية.
3. إنشاء recipes لكل منتج وحجم.
4. اختبار `/menu` والإضافة للسلة في اللغات الثلاث.
5. اختبار إنشاء طلب كامل: cash وInstapay.
6. اختبار أن quantity أكبر من المخزون تُرفض Server-side.
7. استكمال workflows الحقيقية لـ Tables وExpenses وReports بدل placeholder.
8. عمل bulk setup utility للمنتجات/recipes فقط إذا تم اعتماد قواعد الوصفات والكميات من صاحب المشروع.

## 14. قواعد عدم تكرار الأخطاء

- لا تضف business data وهمية للمخزون أو recipes.
- لا تعتبر المنتج قابلًا للطلب اعتمادًا على `availability_status` فقط؛ يجب فحص recipe وstock.
- لا تستخدم service role key في client components أو browser code.
- لا تضع ترجمة مباشرة داخل JSX في صفحات جديدة؛ استخدم القواميس.
- لا تستخدم `--color-surface` كنص فوق brand background؛ استخدم `--color-on-brand`.
- لا تعدّل migration مطبقًا؛ أضف migration جديدًا.
- لا تدّعي أن migration اتطبق على Supabase إلا بعد ظهور نتيجة `supabase db push` بنجاح.
- بعد أي تعديل React/Next شغّل format وlint وtype-check، وبعد تغييرات data/order شغّل tests وbuild.
