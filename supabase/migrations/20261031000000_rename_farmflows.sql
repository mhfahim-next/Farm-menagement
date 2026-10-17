-- The product is now called "FarmFlows": update existing blog articles.
update public.blog_posts set
  title_en   = regexp_replace(title_en,   'FarmFlow(?!s)', 'FarmFlows', 'g'),
  title_bn   = regexp_replace(title_bn,   'FarmFlow(?!s)', 'FarmFlows', 'g'),
  summary_en = regexp_replace(summary_en, 'FarmFlow(?!s)', 'FarmFlows', 'g'),
  summary_bn = regexp_replace(summary_bn, 'FarmFlow(?!s)', 'FarmFlows', 'g'),
  body_en    = regexp_replace(body_en,    'FarmFlow(?!s)', 'FarmFlows', 'g'),
  body_bn    = regexp_replace(body_bn,    'FarmFlow(?!s)', 'FarmFlows', 'g')
where concat_ws(' ', title_en, title_bn, summary_en, summary_bn, body_en, body_bn) ~ 'FarmFlow(?!s)';
