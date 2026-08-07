-- Пятый вкус — seed data ported verbatim from the original prototype
-- (script.js's hardcoded product array). Safe to re-run: upserts by slug.
-- image_path is left NULL everywhere so the ProductPlaceholder component
-- renders until real product photography is uploaded via /admin/menu.

insert into categories (slug, name, sort_order) values
  ('corpus', 'Корпусные пирожные', 1),
  ('cheesecake', 'Чизкейки', 2),
  ('fresh', 'Свежая продукция', 3)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;

insert into products (slug, name, description, price_kopecks, category_id, is_new, is_hit, is_featured, sort_order)
select v.slug, v.name, v.description, v.price_kopecks, c.id, v.is_new, v.is_hit, v.is_featured, v.sort_order
from (
  values
    ('malina', 'Малина', 'Малиновое конфи, ванильный мусс, миндальный брауни и тонкий корпус из бельгийского шоколада.', 29000, 'corpus', false, true, true, 1),
    ('mango', 'Манго', 'Тропическое манго, нежный мусс и выразительная текстура в премиальной подаче.', 31000, 'corpus', false, false, false, 2),
    ('limon', 'Лимон', 'Свежий цитрусовый вкус, мягкая кислинка и тонкий шоколадный корпус.', 29000, 'corpus', false, false, false, 3),
    ('chernika', 'Черника', 'Черничное конфи, воздушный мусс и деликатная ягодная сладость.', 33000, 'corpus', true, false, false, 4),
    ('san-sebastian-classic', 'Сан-Себастьян классический', 'Нежная кремовая середина, карамелизированная корочка и чистый сливочный вкус.', 19000, 'cheesecake', false, true, true, 5),
    ('san-sebastian-pistachio', 'Сан-Себастьян фисташковый', 'Плотный фисташковый вкус и бархатистая текстура баскского чизкейка.', 23000, 'cheesecake', true, false, false, 6),
    ('limonnyy-tart', 'Лимонный тарт', 'Хрустящая основа, лимонный крем и воздушная меренга.', 19000, 'fresh', false, false, false, 7),
    ('anna-pavlova', 'Анна Павлова', 'Хрустящее безе, нежный крем и свежий ягодный акцент.', 21000, 'fresh', false, false, true, 8)
) as v(slug, name, description, price_kopecks, category_slug, is_new, is_hit, is_featured, sort_order)
join categories c on c.slug = v.category_slug
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_kopecks = excluded.price_kopecks,
  category_id = excluded.category_id,
  is_new = excluded.is_new,
  is_hit = excluded.is_hit,
  is_featured = excluded.is_featured,
  sort_order = excluded.sort_order;
