-- Repair the existing Luna Spiced Biscuits product after its translation rows
-- were removed by the previous non-atomic product save flow.
insert into public.product_translations (product_id, locale, name, description)
values
  ('20000000-0000-0000-0000-000000000012', 'ar', 'بسكويت لونا المتبل', 'بسكويت خفيف ومقرمش بنكهة القرفة الطبيعية السيلانية، محلى بدبس التمر والعسل الأسود، بدون سكر مكرر أو إضافات صناعية.'),
  ('20000000-0000-0000-0000-000000000012', 'en', 'Luna Spiced Biscuits', 'Light and crispy biscuits with the warm flavor of natural Ceylon cinnamon, sweetened with date molasses and black honey, without refined sugar or artificial additives.'),
  ('20000000-0000-0000-0000-000000000012', 'it', 'Biscotti speziati Luna', 'Biscotti leggeri e croccanti al gusto caldo della cannella naturale di Ceylon, dolcificati con melassa di datteri e miele nero, senza zuccheri raffinati né additivi artificiali.')
on conflict (product_id, locale) do update
set name = excluded.name, description = excluded.description;
