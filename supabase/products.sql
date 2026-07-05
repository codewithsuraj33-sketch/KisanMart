-- ============================================================
-- KisanMart — Sample Data (dev/testing)
-- Run in Supabase SQL Editor. Re-runnable:
--   on conflict (slug) do update set image_url = excluded.image_url
--   => re-running refreshes images on existing rows without touching
--      price / stock / anything you edited in the admin panel.
--
-- 5 categories + 124 products.
-- Images: LoremFlickr — real, topical photos. Each product gets a UNIQUE
-- image via a per-product `lock` (abs(hashtext(name))), so no two products
-- share a photo and the picture always matches the category theme
-- (seed/plant, fertilizer, pesticide, gardening-tool, irrigation).
-- Loads reliably, never 404s. Swap image_url later from the admin panel.
-- price / mrp / stock / weight are derived deterministically from the
-- product name (via hashtext) so every item looks realistic & varied.
-- mrp is always > price (shows % OFF).
-- ============================================================

-- ---------- CATEGORIES ----------
insert into public.categories (name, slug, image_url) values
  ('Seeds',        'seeds',        'https://loremflickr.com/400/300/seed,plant?lock=11'),
  ('Fertilizers',  'fertilizers',  'https://loremflickr.com/400/300/fertilizer?lock=22'),
  ('Pesticides',   'pesticides',   'https://loremflickr.com/400/300/pesticide?lock=33'),
  ('Tools',        'tools',        'https://loremflickr.com/400/300/gardening-tool?lock=44'),
  ('Irrigation',   'irrigation',   'https://loremflickr.com/400/300/irrigation?lock=55')
on conflict (slug) do update set image_url = excluded.image_url;

-- ---------- PRODUCTS (124) ----------
with items(name, cat) as (
  values
    -- Seeds (28)
    ('Hybrid Wheat Seeds 1kg', 'seeds'),
    ('Basmati Rice Seeds 1kg', 'seeds'),
    ('Yellow Maize Seeds 1kg', 'seeds'),
    ('Bajra Pearl Millet Seeds 1kg', 'seeds'),
    ('Jowar Sorghum Seeds 1kg', 'seeds'),
    ('Green Gram Moong Seeds 500g', 'seeds'),
    ('Chickpea Chana Seeds 1kg', 'seeds'),
    ('Soybean Seeds 1kg', 'seeds'),
    ('Mustard Seeds 500g', 'seeds'),
    ('Groundnut Seeds 1kg', 'seeds'),
    ('Cotton BT Seeds Pack', 'seeds'),
    ('Sugarcane Seed Setts', 'seeds'),
    ('Tomato Hybrid Seeds 50g', 'seeds'),
    ('Chilli Hybrid Seeds 25g', 'seeds'),
    ('Brinjal Seeds 25g', 'seeds'),
    ('Okra Bhindi Seeds 100g', 'seeds'),
    ('Onion Seeds 100g', 'seeds'),
    ('Cauliflower Seeds 25g', 'seeds'),
    ('Cabbage Seeds 25g', 'seeds'),
    ('Cucumber Seeds 50g', 'seeds'),
    ('Bottle Gourd Seeds 50g', 'seeds'),
    ('Pumpkin Seeds 50g', 'seeds'),
    ('Spinach Palak Seeds 100g', 'seeds'),
    ('Coriander Seeds 200g', 'seeds'),
    ('Carrot Seeds 50g', 'seeds'),
    ('Radish Seeds 100g', 'seeds'),
    ('Watermelon Seeds 50g', 'seeds'),
    ('Marigold Flower Seeds 25g', 'seeds'),
    -- Fertilizers (28)
    ('Urea Fertilizer 45kg', 'fertilizers'),
    ('DAP Fertilizer 50kg', 'fertilizers'),
    ('NPK 19-19-19 25kg', 'fertilizers'),
    ('Muriate of Potash 50kg', 'fertilizers'),
    ('Single Super Phosphate 50kg', 'fertilizers'),
    ('Ammonium Sulphate 25kg', 'fertilizers'),
    ('Calcium Nitrate 25kg', 'fertilizers'),
    ('Zinc Sulphate 5kg', 'fertilizers'),
    ('Vermicompost Organic 25kg', 'fertilizers'),
    ('Cow Dung Manure 30kg', 'fertilizers'),
    ('Neem Cake Fertilizer 10kg', 'fertilizers'),
    ('Bone Meal 5kg', 'fertilizers'),
    ('Seaweed Extract 1L', 'fertilizers'),
    ('Humic Acid Granules 5kg', 'fertilizers'),
    ('Bio NPK Consortia 1kg', 'fertilizers'),
    ('Micronutrient Mixture 5kg', 'fertilizers'),
    ('Potassium Nitrate 25kg', 'fertilizers'),
    ('Magnesium Sulphate 10kg', 'fertilizers'),
    ('Ferrous Sulphate 5kg', 'fertilizers'),
    ('Boron Fertilizer 1kg', 'fertilizers'),
    ('Sulphur Bentonite 25kg', 'fertilizers'),
    ('Liquid Bio Fertilizer 1L', 'fertilizers'),
    ('Panchagavya Organic 1L', 'fertilizers'),
    ('Jeevamrut Concentrate 1L', 'fertilizers'),
    ('Mycorrhiza Bio Fertilizer 1kg', 'fertilizers'),
    ('Rock Phosphate 50kg', 'fertilizers'),
    ('Gypsum Soil Conditioner 25kg', 'fertilizers'),
    ('Rhizobium Culture 1kg', 'fertilizers'),
    -- Pesticides (28)
    ('Neem Oil Insecticide 1L', 'pesticides'),
    ('Imidacloprid 17.8 Percent 250ml', 'pesticides'),
    ('Chlorpyrifos 20 Percent 1L', 'pesticides'),
    ('Cypermethrin 10 Percent 500ml', 'pesticides'),
    ('Mancozeb 75 WP 1kg', 'pesticides'),
    ('Carbendazim 50 WP 500g', 'pesticides'),
    ('Copper Oxychloride 1kg', 'pesticides'),
    ('Glyphosate Weedicide 1L', 'pesticides'),
    ('Paraquat Herbicide 1L', 'pesticides'),
    ('2 4 D Weedicide 500ml', 'pesticides'),
    ('Sulphur Fungicide 1kg', 'pesticides'),
    ('Acephate 75 SP 500g', 'pesticides'),
    ('Profenophos 50 Percent 1L', 'pesticides'),
    ('Emamectin Benzoate 100g', 'pesticides'),
    ('Thiamethoxam 25 Percent 100g', 'pesticides'),
    ('Fipronil 5 SC 1L', 'pesticides'),
    ('Spinosad Bio Insecticide 250ml', 'pesticides'),
    ('Bacillus Thuringiensis 500g', 'pesticides'),
    ('Trichoderma Viride 1kg', 'pesticides'),
    ('Pheromone Trap Set', 'pesticides'),
    ('Sticky Trap Yellow Pack', 'pesticides'),
    ('Metalaxyl Fungicide 500g', 'pesticides'),
    ('Hexaconazole 5 Percent 1L', 'pesticides'),
    ('Lambda Cyhalothrin 250ml', 'pesticides'),
    ('Dinotefuran 20 Percent 100g', 'pesticides'),
    ('Sulfoxaflor Insecticide 250ml', 'pesticides'),
    ('Pseudomonas Bio Agent 1kg', 'pesticides'),
    ('Malathion 50 Percent 1L', 'pesticides'),
    -- Tools (25)
    ('Garden Hand Trowel Steel', 'tools'),
    ('Pruning Shears Heavy Duty', 'tools'),
    ('Khurpi Weeding Tool', 'tools'),
    ('Sickle Harvesting Darati', 'tools'),
    ('Kudal Digging Hoe', 'tools'),
    ('Spade with Wooden Handle', 'tools'),
    ('Grafting Knife Set', 'tools'),
    ('Garden Fork 4 Tine', 'tools'),
    ('Watering Can 10L', 'tools'),
    ('Knapsack Sprayer 16L', 'tools'),
    ('Battery Sprayer 18L', 'tools'),
    ('Hand Cultivator 3 Prong', 'tools'),
    ('Wheelbarrow Steel Tray', 'tools'),
    ('Machete Farm Knife', 'tools'),
    ('Axe Steel Head', 'tools'),
    ('Seed Drill Manual', 'tools'),
    ('Digital pH Meter', 'tools'),
    ('Soil Testing Kit', 'tools'),
    ('Grass Trimmer Manual', 'tools'),
    ('Harvesting Basket 20L', 'tools'),
    ('Leaf Rake 22 Teeth', 'tools'),
    ('Post Hole Digger', 'tools'),
    ('Garden Gloves Pair', 'tools'),
    ('Wheel Hoe Weeder', 'tools'),
    ('Fruit Picker Pole', 'tools'),
    -- Irrigation (15)
    ('Drip Irrigation Kit 50m', 'irrigation'),
    ('Garden Hose Pipe 30m', 'irrigation'),
    ('Sprinkler Set 4 Piece', 'irrigation'),
    ('Rain Pipe 100m', 'irrigation'),
    ('Drip Emitters 100 Pack', 'irrigation'),
    ('Inline Drip Lateral 16mm 100m', 'irrigation'),
    ('Micro Sprinkler 50 Pack', 'irrigation'),
    ('Venturi Fertilizer Injector', 'irrigation'),
    ('Water Pump 1HP', 'irrigation'),
    ('Solar Water Pump 2HP', 'irrigation'),
    ('PVC Pipe Fittings Set', 'irrigation'),
    ('Screen Filter 2 inch', 'irrigation'),
    ('Foot Valve 2 inch', 'irrigation'),
    ('Sprinkler Riser Pipe Set', 'irrigation'),
    ('Drip Kit for Terrace Garden', 'irrigation')
),
prepared as (
  select
    i.name,
    i.cat,
    regexp_replace(lower(i.name), '[^a-z0-9]+', '-', 'g') as slug,
    (abs(hashtext(i.name)) % 900) as h,
    -- real, topical photo per category + a UNIQUE lock per product => every
    -- product gets a different picture that still matches the category.
    'https://loremflickr.com/600/600/' ||
      case i.cat
        when 'seeds'       then 'seed,plant'
        when 'fertilizers' then 'fertilizer'
        when 'pesticides'  then 'pesticide'
        when 'tools'       then 'gardening-tool'
        when 'irrigation'  then 'irrigation'
      end
      || '?lock=' || abs(hashtext(i.name)) as img
  from items i
)
insert into public.products
  (name, slug, description, price, mrp, stock, category_id, image_url, weight_grams, is_active)
select
  p.name,
  p.slug,
  'Premium quality ' || p.name || ' — trusted by Indian farmers for reliable results and better yield.',
  (99 + p.h)::numeric(10,2),
  round((99 + p.h) * 1.3)::numeric(10,2),
  20 + (p.h % 180),
  c.id,
  p.img,
  250 + (p.h % 12) * 250,
  true
from prepared p
join public.categories c on c.slug = p.cat
on conflict (slug) do update set image_url = excluded.image_url;

-- Verify:
--   select count(*) from public.products;                 -- ~124 (+ any existing)
--   select name, image_url from public.products limit 10;
--   select c.name, count(*) from public.products pr
--     join public.categories c on c.id = pr.category_id
--     group by c.name order by c.name;
