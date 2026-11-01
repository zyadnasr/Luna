-- Luna menu catalog transcribed from the supplied Arabic and English menu artwork.
-- Inventory remains operational data: products are visible in the menu, while order
-- availability is still decided by active recipes and non-expired stock batches.

insert into public.categories (id, slug, is_active, sort_order)
values
  ('10000000-0000-0000-0000-000000000001', 'luna-gold', true, 10),
  ('10000000-0000-0000-0000-000000000002', 'luna-classic', true, 20),
  ('10000000-0000-0000-0000-000000000003', 'luna-bites', true, 30),
  ('10000000-0000-0000-0000-000000000004', 'luna-mini', true, 40)
on conflict (id) do update set is_active = excluded.is_active, sort_order = excluded.sort_order;

insert into public.category_translations (category_id, locale, name)
values
  ('10000000-0000-0000-0000-000000000001', 'ar', 'لونا جولد'),
  ('10000000-0000-0000-0000-000000000001', 'en', 'Luna Gold'),
  ('10000000-0000-0000-0000-000000000001', 'it', 'Luna Gold'),
  ('10000000-0000-0000-0000-000000000002', 'ar', 'لونا كلاسيك'),
  ('10000000-0000-0000-0000-000000000002', 'en', 'Luna Classic'),
  ('10000000-0000-0000-0000-000000000002', 'it', 'Luna Classic'),
  ('10000000-0000-0000-0000-000000000003', 'ar', 'لونا بايتس'),
  ('10000000-0000-0000-0000-000000000003', 'en', 'Luna Bites'),
  ('10000000-0000-0000-0000-000000000003', 'it', 'Luna Bites'),
  ('10000000-0000-0000-0000-000000000004', 'ar', 'لونا ميني'),
  ('10000000-0000-0000-0000-000000000004', 'en', 'Luna Mini'),
  ('10000000-0000-0000-0000-000000000004', 'it', 'Luna Mini')
on conflict (category_id, locale) do update set name = excluded.name;

insert into public.products (id, category_id, sku, is_active, availability_status, sort_order)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'GOLD-CHOCOLATE', true, 'available', 10),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'GOLD-NUT', true, 'available', 20),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'GOLD-CRANBERRY', true, 'available', 30),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'GOLD-MAAMOUL', true, 'available', 40),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'GOLD-MIX', true, 'available', 50),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'CLASSIC-CHOCOLATE', true, 'available', 10),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'CLASSIC-NUT', true, 'available', 20),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', 'CLASSIC-DATE-MAAMOUL', true, 'available', 30),
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', 'CLASSIC-DRIED-FRUIT', true, 'available', 40),
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002', 'CLASSIC-MIX', true, 'available', 50),
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', 'CLASSIC-CHOCOLATE-NUT-MIX', true, 'available', 60),
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000003', 'BITES-BISCUITS', true, 'available', 10),
  ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000003', 'BITES-ALMOND', true, 'available', 20),
  ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000004', 'MINI-2-PIECES', true, 'available', 10),
  ('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000004', 'MINI-4-PIECES', true, 'available', 20)
on conflict (id) do update set category_id = excluded.category_id, is_active = excluded.is_active, availability_status = excluded.availability_status, sort_order = excluded.sort_order;

insert into public.product_translations (product_id, locale, name, description)
values
  ('20000000-0000-0000-0000-000000000001', 'ar', 'كوكيز الشوكولاتة الفاخرة', 'كوكيز غنية بالشوكولاتة ضمن تشكيلة لونا جولد.'),
  ('20000000-0000-0000-0000-000000000001', 'en', 'Decadent Chocolate Cookies', 'Rich chocolate cookies from the Luna Gold collection.'),
  ('20000000-0000-0000-0000-000000000001', 'it', 'Biscotti al cioccolato fondente', 'Biscotti ricchi al cioccolato della collezione Luna Gold.'),
  ('20000000-0000-0000-0000-000000000002', 'ar', 'كوكيز المكسرات الغنية', 'كوكيز بالمكسرات المختارة.'),
  ('20000000-0000-0000-0000-000000000002', 'en', 'Rich Nut Cookies', 'Cookies with a generous mix of selected nuts.'),
  ('20000000-0000-0000-0000-000000000002', 'it', 'Biscotti ricchi alle noci', 'Biscotti con una ricca selezione di frutta secca.'),
  ('20000000-0000-0000-0000-000000000003', 'ar', 'كوكيز التوت البري الطبيعي', 'كوكيز بالتوت البري الطبيعي.'),
  ('20000000-0000-0000-0000-000000000003', 'en', 'Natural Cranberry Cookies', 'Cookies with natural cranberry.'),
  ('20000000-0000-0000-0000-000000000003', 'it', 'Biscotti ai mirtilli rossi', 'Biscotti con mirtilli rossi naturali.'),
  ('20000000-0000-0000-0000-000000000004', 'ar', 'معمول المكسرات الفاخر', 'معمول فاخر بالمكسرات.'),
  ('20000000-0000-0000-0000-000000000004', 'en', 'Premium Nut Maamoul', 'Premium maamoul filled with nuts.'),
  ('20000000-0000-0000-0000-000000000004', 'it', 'Maamoul pregiato alle noci', 'Maamoul pregiato ripieno di frutta secca.'),
  ('20000000-0000-0000-0000-000000000005', 'ar', 'جو ميكس', 'خلطة مميزة لتخصيص تجربتك.'),
  ('20000000-0000-0000-0000-000000000005', 'en', 'Customize Your Own Experience', 'A custom mix for your own Luna experience.'),
  ('20000000-0000-0000-0000-000000000005', 'it', 'Crea la tua esperienza', 'Un mix personalizzato per la tua esperienza Luna.'),
  ('20000000-0000-0000-0000-000000000006', 'ar', 'كوكيز الشوكولاتة', 'كوكيز الشوكولاتة من لونا كلاسيك.'),
  ('20000000-0000-0000-0000-000000000006', 'en', 'Chocolate Cookies', 'Chocolate cookies from Luna Classic.'),
  ('20000000-0000-0000-0000-000000000006', 'it', 'Biscotti al cioccolato', 'Biscotti al cioccolato della Luna Classic.'),
  ('20000000-0000-0000-0000-000000000007', 'ar', 'كوكيز المكسرات', 'كوكيز بالمكسرات من لونا كلاسيك.'),
  ('20000000-0000-0000-0000-000000000007', 'en', 'Nut Cookies', 'Nut cookies from Luna Classic.'),
  ('20000000-0000-0000-0000-000000000007', 'it', 'Biscotti alle noci', 'Biscotti alle noci della Luna Classic.'),
  ('20000000-0000-0000-0000-000000000008', 'ar', 'معمول التمر', 'معمول بالتمر.'),
  ('20000000-0000-0000-0000-000000000008', 'en', 'Date Maamoul', 'Maamoul filled with dates.'),
  ('20000000-0000-0000-0000-000000000008', 'it', 'Maamoul ai datteri', 'Maamoul ripieno di datteri.'),
  ('20000000-0000-0000-0000-000000000009', 'ar', 'كوكيز الفواكه المجففة', 'كوكيز بالفواكه المجففة.'),
  ('20000000-0000-0000-0000-000000000009', 'en', 'Dried Fruit Cookies', 'Cookies with dried fruit.'),
  ('20000000-0000-0000-0000-000000000009', 'it', 'Biscotti alla frutta secca', 'Biscotti con frutta disidratata.'),
  ('20000000-0000-0000-0000-000000000010', 'ar', 'علبة ميكس لونا', 'تشكيلة كلاسيكية متنوعة.'),
  ('20000000-0000-0000-0000-000000000010', 'en', 'A Diverse Classic Mix', 'A varied classic Luna mix.'),
  ('20000000-0000-0000-0000-000000000010', 'it', 'Mix classico assortito', 'Un assortimento classico Luna.'),
  ('20000000-0000-0000-0000-000000000011', 'ar', 'ميكس الشوكولاتة والمكسرات', 'خلطة كلاسيكية من الشوكولاتة والمكسرات.'),
  ('20000000-0000-0000-0000-000000000011', 'en', 'Classic Chocolate & Nut Mix', 'A classic mix of chocolate and nuts.'),
  ('20000000-0000-0000-0000-000000000011', 'it', 'Mix classico cioccolato e noci', 'Un mix classico di cioccolato e frutta secca.'),
  ('20000000-0000-0000-0000-000000000012', 'ar', 'بسكويت لونا', 'وجبة خفيفة يومية من لونا بايتس.'),
  ('20000000-0000-0000-0000-000000000012', 'en', 'Luna Biscuits', 'A light everyday treat from Luna Bites.'),
  ('20000000-0000-0000-0000-000000000012', 'it', 'Biscotti Luna', 'Uno snack leggero per ogni giorno.'),
  ('20000000-0000-0000-0000-000000000013', 'ar', 'كوكيز اللوز المقرمش', 'كوكيز باللوز المقرمش.'),
  ('20000000-0000-0000-0000-000000000013', 'en', 'Crunchy Almond Cookies', 'Cookies with crunchy almonds.'),
  ('20000000-0000-0000-0000-000000000013', 'it', 'Biscotti croccanti alle mandorle', 'Biscotti con mandorle croccanti.'),
  ('20000000-0000-0000-0000-000000000014', 'ar', 'بوكس قطعتين', 'علبة لونا ميني صغيرة.'),
  ('20000000-0000-0000-0000-000000000014', 'en', '2 Pieces Box', 'A small Luna Mini box.'),
  ('20000000-0000-0000-0000-000000000014', 'it', 'Box da 2 pezzi', 'Una piccola box Luna Mini.'),
  ('20000000-0000-0000-0000-000000000015', 'ar', 'بوكس 4 قطع', 'علبة لونا ميني صغيرة من 4 قطع.'),
  ('20000000-0000-0000-0000-000000000015', 'en', '4 Pieces Box', 'A small Luna Mini box with four pieces.'),
  ('20000000-0000-0000-0000-000000000015', 'it', 'Box da 4 pezzi', 'Una piccola box Luna Mini da quattro pezzi.')
on conflict (product_id, locale) do update set name = excluded.name, description = excluded.description;

insert into public.product_prices (id, product_id, price_egp, label, is_active)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 950, '18 pieces', true),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 1550, '30 pieces', true),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 830, '18 pieces', true),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 1350, '30 pieces', true),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 900, '18 pieces', true),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', 1450, '30 pieces', true),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000004', 800, '18 pieces', true),
  ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000004', 1300, '30 pieces', true),
  ('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000005', 900, '18 pieces', true),
  ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000005', 1450, '30 pieces', true),
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000006', 550, '16 pieces', true),
  ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000007', 500, '16 pieces', true),
  ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000008', 480, '16 pieces', true),
  ('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000009', 530, '16 pieces', true),
  ('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000010', 500, '16 pieces', true),
  ('30000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000011', 520, '16 pieces', true),
  ('30000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000012', 140, '180 g', true),
  ('30000000-0000-0000-0000-000000000018', '20000000-0000-0000-0000-000000000013', 170, '180 g', true),
  ('30000000-0000-0000-0000-000000000019', '20000000-0000-0000-0000-000000000014', 85, '2 pieces', true),
  ('30000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000015', 140, '4 pieces', true)
on conflict (id) do update set price_egp = excluded.price_egp, label = excluded.label, is_active = excluded.is_active;
