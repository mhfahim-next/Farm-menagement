-- Breed dropdowns for cattle and layer flocks (admin-managed, editable).
--
-- The stored value is the English name, so breeds typed before this
-- migration keep working: an old free-text breed is simply shown as typed.

insert into public.dropdown_lists (key, editable, sort_order) values
  ('cattle_breed', true, 14),
  ('flock_breed',  true, 15);

insert into public.dropdown_options (list_key, value, label_en, label_bn, sort_order) values
  ('cattle_breed', 'Local (Deshi)',         'Local (Deshi)',         'দেশি',                   10),
  ('cattle_breed', 'Holstein Friesian',     'Holstein Friesian',     'হলস্টেইন ফ্রিজিয়ান',    20),
  ('cattle_breed', 'Jersey',                'Jersey',                'জার্সি',                  30),
  ('cattle_breed', 'Sahiwal',               'Sahiwal',               'শাহিওয়াল',              40),
  ('cattle_breed', 'Red Chittagong',        'Red Chittagong (RCC)',  'রেড চিটাগাং (আরসিসি)',   50),
  ('cattle_breed', 'Pabna',                 'Pabna',                 'পাবনা',                  60),
  ('cattle_breed', 'Brahman',               'Brahman',               'ব্রাহমান',                70),
  ('cattle_breed', 'Sindhi',                'Sindhi',                'সিন্ধি',                  80),
  ('cattle_breed', 'Cross: Holstein x Local',  'Cross: Holstein x Local',  'সংকর: হলস্টেইন × দেশি', 90),
  ('cattle_breed', 'Cross: Sahiwal x Local',   'Cross: Sahiwal x Local',   'সংকর: শাহিওয়াল × দেশি', 100),
  ('cattle_breed', 'Cross: Jersey x Local',    'Cross: Jersey x Local',    'সংকর: জার্সি × দেশি',    110),
  ('cattle_breed', 'Other',                 'Other',                 'অন্যান্য',                999),

  ('flock_breed', 'ISA Brown',      'ISA Brown',      'আইএসএ ব্রাউন',      10),
  ('flock_breed', 'Lohmann Brown',  'Lohmann Brown',  'লোহম্যান ব্রাউন',    20),
  ('flock_breed', 'Hy-Line Brown',  'Hy-Line Brown',  'হাই-লাইন ব্রাউন',    30),
  ('flock_breed', 'Hy-Line W-36',   'Hy-Line W-36',   'হাই-লাইন ডব্লিউ-৩৬', 40),
  ('flock_breed', 'Bovans Brown',   'Bovans Brown',   'বোভান্স ব্রাউন',     50),
  ('flock_breed', 'Dekalb White',   'Dekalb White',   'ডেকাল্ব হোয়াইট',     60),
  ('flock_breed', 'Fayoumi',        'Fayoumi',        'ফাইয়ুমি',            70),
  ('flock_breed', 'Sonali',         'Sonali',         'সোনালী',              80),
  ('flock_breed', 'Other',          'Other',          'অন্যান্য',             999);
