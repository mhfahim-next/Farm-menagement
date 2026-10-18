-- =====================================================================
-- Ten more practical articles for farmers (Bangla + English).
-- Safe to re-run: existing slugs are skipped.
-- =====================================================================

insert into public.blog_tags (slug, name_en, name_bn) values
  ('mastitis', 'Mastitis', 'ওলান ফোলা'),
  ('milk-hygiene', 'Clean milking', 'পরিষ্কার দোহন'),
  ('fodder', 'Green fodder', 'কাঁচা ঘাস'),
  ('silage', 'Silage', 'সাইলেজ'),
  ('heat-stress', 'Heat stress', 'গরমের চাপ'),
  ('biosecurity', 'Biosecurity', 'জৈব নিরাপত্তা'),
  ('brooding', 'Brooding', 'ব্রুডিং'),
  ('milk-fever', 'Milk fever', 'দুধ জ্বর'),
  ('buying-cattle', 'Buying cattle', 'গরু কেনা'),
  ('manure', 'Manure & compost', 'গোবর ও কম্পোস্ট'),
  ('biogas', 'Biogas', 'বায়োগ্যাস')
on conflict (slug) do nothing;

create temporary table _more_articles (
  slug text, category text, tags text[], age interval,
  title_en text, title_bn text, summary_en text, summary_bn text, body_en text, body_bn text
);

-- 1 -------------------------------------------------------------------
insert into _more_articles values (
$s$prevent-mastitis-clean-milking-routine$s$, 'cattle-health', array['mastitis', 'milk-hygiene', 'milk-cost'], interval '15 days',
$s$Stop mastitis before it starts: a clean milking routine in 8 steps$s$,
$s$ওলান ফোলা রোগ ঠেকান শুরুতেই: পরিষ্কার দোহনের ৮টি ধাপ$s$,
$s$Mastitis is the most expensive everyday disease on a dairy farm. Learn how to spot hidden cases with a simple test and the 8-step milking routine that keeps udders healthy.$s$,
$s$দুগ্ধ খামারে সবচেয়ে বেশি টাকা নষ্ট করে ওলান ফোলা। সহজ পরীক্ষায় লুকানো রোগ ধরা আর ওলান সুস্থ রাখার ৮ ধাপের দোহন নিয়ম জানুন।$s$,
$s$Mastitis is an infection of the udder. Farmers usually notice it only when the quarter is hot and swollen or the milk has clots. But for every cow with visible signs, several more have a **hidden (subclinical) infection**: the milk looks normal, yet the yield is lower and the bacteria spread to other cows through hands and cloths.

## What mastitis really costs you

- Less milk from the infected quarter, often for the rest of the lactation
- Milk thrown away during treatment and the withdrawal period
- Medicine and vet fees
- A quarter can be lost for good; badly affected cows are often sold early

Prevention costs far less than any of these.

## How it spreads

Bacteria enter through the **teat canal**. They come from:

- Dirty hands, a shared cloth or a dirty milking bucket
- A wet, muddy floor or dung on the udder
- Infected cows milked before healthy ones
- Teat injuries and cracked teat skin

After milking, the teat opening stays open for about **30 minutes to an hour**. If the cow lies down on a dirty floor during that time, germs walk straight in.

## Find hidden cases: the strip cup and CMT

1. **Strip cup:** squirt the first 2–3 streams of each teat onto a dark cloth or a strip cup. Flakes, clots or watery milk mean clinical mastitis.
2. **California Mastitis Test (CMT):** a cheap paddle and reagent from veterinary shops. Mix equal milk and reagent from each quarter; if it thickens into a gel, that quarter has a hidden infection. Test every cow once a month and every fresh cow after calving.

## The 8-step milking routine

1. **Wash and dry your hands.** Keep nails short. Gloves are even better.
2. **Milk in the same order every time:** healthy young cows first, older cows next, and infected or treated cows **last**.
3. **Check the foremilk** from every teat in the strip cup.
4. **Clean the teats only**, not the whole udder; water running down the udder carries dirt to the teats.
5. **Dry each cow with its own cloth or paper towel.** One shared cloth for the whole herd spreads mastitis from cow to cow.
6. **Milk with the full hand,** squeezing from top to bottom. Do not pull the teat with finger and thumb ("stripping" or knuckling): it injures the teat.
7. **Dip the teats after milking** in a teat dip (iodine-based dips are common) so that each teat end is covered.
8. **Keep the cow standing for 30 minutes** by giving fresh feed right after milking, so the teat canal closes before she lies down.

## Keep the shed on your side

- Clean dung from the floor at least twice a day; keep bedding dry.
- Repair rough floors and sharp edges that cut teats.
- Clip long hair around the udder of crossbred cows.
- Clean buckets and cans with hot water and detergent after every milking, and dry them in the sun.

## If a cow gets mastitis

- Call your vet early. A case treated in the first day heals faster.
- Use the full course of medicine and keep to the **milk withdrawal period** written on the label. Selling milk with antibiotic residues is unsafe and illegal.
- Ask your vet about **dry cow therapy** at drying off, the best time to clear hidden infections.
- A cow that gets mastitis again and again may cost more than she earns; consider culling her.

## Record every case

In **FarmFlows**, record each mastitis case and its treatment under **Health** for that cow. You will quickly see which cows, quarters and seasons are a problem, and the milk record shows the yield before and after.

## Quick checklist

- Strip cup at every milking, CMT once a month
- Clean hands, one cloth per cow, full-hand milking
- Teat dip after milking, cow standing for 30 minutes
- Infected cows milked last
- Respect the withdrawal period; record every case
$s$,
$s$ওলান ফোলা (ম্যাস্টাইটিস) হলো ওলানের জীবাণু সংক্রমণ। খামারিরা সাধারণত তখনই টের পান, যখন বাঁট গরম ও ফোলা হয় বা দুধে দলা দেখা যায়। কিন্তু চোখে দেখা যায় এমন প্রতিটি গাভীর পাশাপাশি আরও কয়েকটি গাভীর **লুকানো সংক্রমণ** থাকে: দুধ দেখতে স্বাভাবিক, কিন্তু দুধ কম হয়, আর হাত ও কাপড়ের মাধ্যমে জীবাণু অন্য গাভীতে ছড়ায়।

## ওলান ফোলায় আসলে কত ক্ষতি

- আক্রান্ত বাঁটের দুধ কমে যায়, প্রায়ই পুরো দুধের মৌসুম জুড়ে
- চিকিৎসার সময় ও ওষুধের পরে নির্দিষ্ট দিন পর্যন্ত দুধ ফেলে দিতে হয়
- ওষুধ ও চিকিৎসকের খরচ
- একটা বাঁট চিরতরে নষ্ট হয়ে যেতে পারে; বেশি আক্রান্ত গাভী অনেক সময় আগেভাগে বিক্রি করতে হয়

এর যেকোনোটার চেয়ে প্রতিরোধের খরচ অনেক কম।

## কীভাবে ছড়ায়

জীবাণু ঢোকে **বাঁটের ছিদ্র** দিয়ে। আসে এসব থেকে:

- নোংরা হাত, সবার জন্য একটা কাপড় বা নোংরা দোহনের বালতি
- ভেজা, কাদা মেঝে বা ওলানে লেগে থাকা গোবর
- আক্রান্ত গাভী আগে, সুস্থ গাভী পরে দোহন
- বাঁটে আঘাত বা ফাটা চামড়া

দোহনের পর প্রায় **৩০ মিনিট থেকে এক ঘণ্টা** বাঁটের ছিদ্র খোলা থাকে। এই সময়ে গাভী নোংরা মেঝেতে শুয়ে পড়লে জীবাণু সরাসরি ঢুকে যায়।

## লুকানো রোগ ধরুন: স্ট্রিপ কাপ ও CMT

1. **স্ট্রিপ কাপ:** প্রতিটি বাঁটের প্রথম ২–৩ ধারা দুধ কালো কাপড় বা স্ট্রিপ কাপে ফেলুন। ছানা, দলা বা পানির মতো দুধ মানে ওলান ফোলা।
2. **ক্যালিফোর্নিয়া ম্যাস্টাইটিস টেস্ট (CMT):** পশুর ওষুধের দোকানে সস্তায় প্যাডেল ও রিএজেন্ট পাওয়া যায়। প্রতিটি বাঁটের দুধ আর রিএজেন্ট সমান মেশান; জেলির মতো ঘন হলে সেই বাঁটে লুকানো সংক্রমণ আছে। মাসে একবার সব গাভী আর বাচ্চা দেওয়ার পর প্রতিটি গাভী পরীক্ষা করুন।

## দোহনের ৮টি ধাপ

1. **হাত ধুয়ে শুকান।** নখ ছোট রাখুন। গ্লাভস পরলে আরও ভালো।
2. **প্রতিবার একই ক্রমে দোহন করুন:** আগে সুস্থ কম বয়সী গাভী, তারপর বয়স্ক গাভী, আর আক্রান্ত বা চিকিৎসাধীন গাভী **সবার শেষে**।
3. **প্রতিটি বাঁটের প্রথম দুধ** স্ট্রিপ কাপে দেখুন।
4. **শুধু বাঁট পরিষ্কার করুন,** পুরো ওলান ভেজাবেন না; ওলান বেয়ে পানি নামলে ময়লা বাঁটে চলে আসে।
5. **প্রতিটি গাভীর জন্য আলাদা কাপড় বা কাগজের তোয়ালে** দিয়ে মুছুন। পুরো পালের জন্য এক কাপড় এক গাভী থেকে আরেক গাভীতে রোগ ছড়ায়।
6. **পুরো হাত দিয়ে দোহন করুন,** ওপর থেকে নিচে চেপে। দুই আঙুলে বাঁট টেনে দোহন করবেন না: এতে বাঁটে আঘাত লাগে।
7. **দোহনের পরে বাঁট ডিপ করুন** টিট ডিপ দ্রবণে (আয়োডিনযুক্ত ডিপ বেশি চলে), যাতে প্রতিটি বাঁটের মাথা ঢেকে যায়।
8. **গাভীকে ৩০ মিনিট দাঁড় করিয়ে রাখুন**: দোহনের পরপরই টাটকা খাবার দিন, যাতে শোয়ার আগে বাঁটের ছিদ্র বন্ধ হয়ে যায়।

## গোয়ালঘরকে সাহায্যকারী বানান

- দিনে অন্তত দুবার মেঝের গোবর পরিষ্কার করুন; বিছানা শুকনো রাখুন।
- খসখসে মেঝে আর ধারালো কোণা মেরামত করুন, যাতে বাঁট না কাটে।
- শংকর গাভীর ওলানের চারপাশের লম্বা লোম ছেঁটে দিন।
- প্রতি দোহনের পর বালতি ও ক্যান গরম পানি ও সাবান দিয়ে ধুয়ে রোদে শুকান।

## গাভীর ওলান ফোলা হলে

- দেরি না করে চিকিৎসক ডাকুন। প্রথম দিনেই চিকিৎসা শুরু হলে দ্রুত সারে।
- ওষুধের পুরো কোর্স শেষ করুন এবং লেবেলে লেখা **দুধ ফেলে দেওয়ার সময়** মেনে চলুন। অ্যান্টিবায়োটিকযুক্ত দুধ বিক্রি অনিরাপদ ও বেআইনি।
- দুধ শুকানোর সময় **ড্রাই কাউ থেরাপি** নিয়ে চিকিৎসকের সাথে কথা বলুন; লুকানো সংক্রমণ সারানোর সেরা সময় এটাই।
- যে গাভী বারবার ওলান ফোলায় ভোগে, সে আয়ের চেয়ে বেশি খরচ করাতে পারে; বাদ দেওয়ার কথা ভাবুন।

## প্রতিটি ঘটনা লিখে রাখুন

**FarmFlows**-এ প্রতিটি ওলান ফোলার ঘটনা ও চিকিৎসা সেই গাভীর **স্বাস্থ্য** রেকর্ডে লিখুন। কোন গাভী, কোন বাঁট আর কোন মৌসুমে সমস্যা বেশি তা দ্রুত বোঝা যাবে, আর দুধের রেকর্ডে আগে-পরের দুধের পরিমাণও দেখা যাবে।

## সংক্ষেপে চেকলিস্ট

- প্রতি দোহনে স্ট্রিপ কাপ, মাসে একবার CMT
- পরিষ্কার হাত, প্রতি গাভীর আলাদা কাপড়, পুরো হাতে দোহন
- দোহনের পর টিট ডিপ, ৩০ মিনিট দাঁড় করিয়ে রাখা
- আক্রান্ত গাভী সবার শেষে
- দুধ ফেলার সময় মানুন; প্রতিটি ঘটনা রেকর্ড করুন
$s$);

-- 2 -------------------------------------------------------------------
insert into _more_articles values (
$s$napier-grass-cultivation-guide$s$, 'feed-nutrition', array['fodder', 'milk-cost'], interval '17 days',
$s$Napier grass cultivation: grow cheap green fodder all year$s$,
$s$নেপিয়ার ঘাস চাষ: সারা বছর সস্তায় কাঁচা ঘাস$s$,
$s$Green fodder is the cheapest feed a cow can eat. How to plant, fertilise, cut and use Napier grass so a small plot feeds your cows all year.$s$,
$s$গরুর সবচেয়ে সস্তা খাবার কাঁচা ঘাস। কীভাবে নেপিয়ার লাগাবেন, সার দেবেন, কাটবেন ও খাওয়াবেন, যাতে ছোট জমিতেই সারা বছর গরুর ঘাস হয়।$s$,
$s$Feed is the biggest cost on a cattle farm, and bought concentrate is the most expensive part of it. A cow that gets plenty of good green grass needs less concentrate for the same milk or growth. **Napier grass** is the most popular fodder crop in Bangladesh because it grows fast, regrows after every cut and lives for several years.

## Choose a good variety

Improved varieties such as **Pakchong**, and hybrid Napier lines released by the Bangladesh Livestock Research Institute (BLRI), give more leaf and softer stems than old local Napier. Get cuttings from a known grower or your Upazila Livestock Office so you start with healthy planting material.

## Land and soil

- High land or medium-high land that **does not stay flooded**. Napier hates standing water.
- Loamy soil is best, but it grows on most soils with enough manure.
- Full sun. Under trees it grows thin and weak.

## Preparing the land

1. Plough 2–3 times and remove weeds and roots.
2. Mix in **well-rotted cow dung**, about 30–40 kg per decimal.
3. Make rows so you can weed, fertilise and cut easily.

## Planting

- Use **stem cuttings with 2–3 nodes** (joints) or root slips.
- Plant cuttings at a slant with one node in the soil and one above it.
- A common spacing is about **70 cm between rows and 40–50 cm between plants**.
- The best time is the start of the rainy season (April–June), but with irrigation you can plant almost any time except the coldest weeks.

## Care after planting

- Water if there is no rain for a week, especially in the first month.
- Weed by hand twice in the first two months; after that the grass shades out most weeds.
- After **each cut**, apply some nitrogen fertiliser (about half a kilogram of urea per decimal is a common guide) or slurry from a biogas plant, then water.

## When and how to cut

- **First cut:** about 60–75 days after planting.
- **Later cuts:** every **35–45 days**, when the grass is about 1–1.5 metres tall.
- Cut **10–15 cm above the ground** with a sharp blade so it regrows quickly.
- Old, tall grass is hard and woody; cows waste much of it. Young grass is softer and more nutritious.

## How much do you need?

An adult cow eats roughly **10% of its body weight in fresh green grass** a day when grass is the main roughage. A 300 kg cow can eat about 25–30 kg. With good care, a well-managed plot of improved Napier can give **many tonnes of green grass per decimal each year**, so a small plot behind the house can supply one or two cows.

## Feeding tips

- **Chop it** into 3–5 cm pieces with a chaff cutter or dao. Cows eat more and waste less.
- Mix it with straw for cows that need more fibre and with some concentrate for high-yielding cows.
- Extra grass in the rainy season can be turned into **silage** for the dry months.
- Wilting freshly cut grass for a few hours in the shade reduces loose dung.

## Common mistakes

- Planting in a field that floods in the monsoon
- Letting the grass grow too tall before cutting
- Never adding manure or fertiliser, so yields fall after the first year
- Cutting too close to the ground, which slows regrowth

## Keep track of the savings

Record your fodder costs (cuttings, fertiliser, labour) and your concentrate purchases in **FarmFlows → Finance**. After a few months, compare the feed cost per litre of milk with the period before you grew your own grass.

## Quick checklist

- High land, full sun, plenty of rotted dung
- 2–3 node cuttings, about 70 cm × 45 cm spacing
- First cut at 60–75 days, then every 35–45 days
- Cut 10–15 cm above the ground; fertilise after every cut
- Chop before feeding; turn the surplus into silage
$s$,
$s$গরুর খামারে সবচেয়ে বড় খরচ খাবার, আর তার মধ্যে সবচেয়ে দামি কেনা দানাদার খাবার। যে গাভী প্রচুর ভালো কাঁচা ঘাস পায়, তার একই দুধ বা বৃদ্ধির জন্য কম দানাদার লাগে। **নেপিয়ার ঘাস** বাংলাদেশে সবচেয়ে জনপ্রিয় ঘাস, কারণ এটা দ্রুত বাড়ে, প্রতিবার কাটার পর আবার গজায় আর কয়েক বছর টিকে থাকে।

## ভালো জাত বাছুন

**পাকচং** এবং বাংলাদেশ প্রাণিসম্পদ গবেষণা ইনস্টিটিউটের (BLRI) উন্নত হাইব্রিড নেপিয়ার পুরনো দেশি নেপিয়ারের চেয়ে বেশি পাতা ও নরম কাণ্ড দেয়। পরিচিত চাষি বা উপজেলা প্রাণিসম্পদ দপ্তর থেকে কাটিং নিন, যাতে শুরু থেকেই সুস্থ চারা পান।

## জমি ও মাটি

- উঁচু বা মাঝারি উঁচু জমি, যেখানে **পানি জমে থাকে না**। নেপিয়ার জলাবদ্ধতা সহ্য করে না।
- দোআঁশ মাটি সবচেয়ে ভালো, তবে পর্যাপ্ত গোবর দিলে প্রায় সব মাটিতেই হয়।
- পুরো রোদ দরকার। গাছের ছায়ায় সরু ও দুর্বল হয়।

## জমি তৈরি

1. ২–৩ বার চাষ দিয়ে আগাছা ও শিকড় সরান।
2. শতাংশে প্রায় ৩০–৪০ কেজি **পচা গোবর** মিশিয়ে দিন।
3. সারি করে লাগানোর ব্যবস্থা করুন, যাতে নিড়ানি, সার দেওয়া ও কাটা সহজ হয়।

## লাগানো

- **২–৩ গিঁটওয়ালা কাণ্ডের কাটিং** বা শিকড়সহ চারা ব্যবহার করুন।
- কাটিং কাত করে লাগান: একটা গিঁট মাটির ভেতরে, একটা ওপরে।
- সাধারণত **সারি থেকে সারি প্রায় ৭০ সেমি, চারা থেকে চারা ৪০–৫০ সেমি** দূরত্ব রাখা হয়।
- বর্ষার শুরু (এপ্রিল–জুন) সবচেয়ে ভালো সময়, তবে সেচ থাকলে সবচেয়ে ঠান্ডা কয়েক সপ্তাহ বাদে প্রায় সারা বছর লাগানো যায়।

## লাগানোর পরের যত্ন

- এক সপ্তাহ বৃষ্টি না হলে সেচ দিন, বিশেষ করে প্রথম মাসে।
- প্রথম দুই মাসে দুবার হাতে নিড়ানি দিন; এরপর ঘাসের ছায়ায় বেশিরভাগ আগাছা আর বাড়ে না।
- **প্রতিবার কাটার পর** কিছু নাইট্রোজেন সার দিন (সাধারণ হিসাবে শতাংশে প্রায় আধা কেজি ইউরিয়া) বা বায়োগ্যাসের স্লারি দিন, তারপর সেচ দিন।

## কখন ও কীভাবে কাটবেন

- **প্রথম কাটা:** লাগানোর প্রায় ৬০–৭৫ দিন পরে।
- **পরের কাটা:** প্রতি **৩৫–৪৫ দিনে**, যখন ঘাস প্রায় ১–১.৫ মিটার লম্বা।
- ধারালো দা দিয়ে **মাটি থেকে ১০–১৫ সেমি ওপরে** কাটুন, তাহলে দ্রুত আবার গজায়।
- বেশি লম্বা পুরনো ঘাস শক্ত ও কাঠের মতো হয়ে যায়, গরু অনেকটাই নষ্ট করে। কচি ঘাস নরম ও বেশি পুষ্টিকর।

## কতটা লাগবে?

ঘাস যখন প্রধান খাবার, তখন একটা বড় গরু দিনে মোটামুটি **শরীরের ওজনের ১০% কাঁচা ঘাস** খায়। ৩০০ কেজির গাভী প্রায় ২৫–৩০ কেজি খেতে পারে। ভালো যত্নে উন্নত জাতের নেপিয়ারের প্লট থেকে **প্রতি শতাংশে বছরে কয়েক টন কাঁচা ঘাস** পাওয়া যায়, তাই বাড়ির পেছনের ছোট জমিতেই এক-দুটো গরুর ঘাস হয়ে যায়।

## খাওয়ানোর টিপস

- চপার মেশিন বা দা দিয়ে **৩–৫ সেমি করে কুচি করুন**। গরু বেশি খায়, কম নষ্ট করে।
- যে গরুর আঁশ বেশি দরকার তাকে খড়ের সাথে, আর বেশি দুধের গাভীকে কিছু দানাদারের সাথে মিশিয়ে দিন।
- বর্ষার বাড়তি ঘাস দিয়ে শুকনো মৌসুমের জন্য **সাইলেজ** বানান।
- কাটা ঘাস কয়েক ঘণ্টা ছায়ায় একটু নেতিয়ে দিলে পাতলা গোবর কম হয়।

## সাধারণ ভুল

- বর্ষায় পানি ওঠে এমন জমিতে লাগানো
- কাটার আগে ঘাস বেশি লম্বা হতে দেওয়া
- কখনো গোবর বা সার না দেওয়া, ফলে প্রথম বছরের পর ফলন কমে যায়
- মাটির খুব কাছ থেকে কাটা, এতে আবার গজাতে দেরি হয়

## সাশ্রয়ের হিসাব রাখুন

ঘাস চাষের খরচ (কাটিং, সার, শ্রম) আর দানাদার কেনার খরচ **FarmFlows → হিসাব** পাতায় লিখুন। কয়েক মাস পরে নিজের ঘাস চাষের আগের ও পরের সময়ের প্রতি লিটার দুধের খাবার খরচ তুলনা করুন।

## সংক্ষেপে চেকলিস্ট

- উঁচু জমি, পুরো রোদ, প্রচুর পচা গোবর
- ২–৩ গিঁটের কাটিং, প্রায় ৭০ × ৪৫ সেমি দূরত্ব
- প্রথম কাটা ৬০–৭৫ দিনে, তারপর প্রতি ৩৫–৪৫ দিনে
- মাটি থেকে ১০–১৫ সেমি ওপরে কাটা; প্রতি কাটার পর সার
- কুচি করে খাওয়ান; বাড়তি ঘাসে সাইলেজ
$s$);

-- 3 -------------------------------------------------------------------
insert into _more_articles values (
$s$newborn-calf-care-colostrum-first-24-hours$s$, 'cattle-health', array['calf-care', 'farm-records'], interval '19 days',
$s$Newborn calf care: colostrum and the first 24 hours that decide its life$s$,
$s$নবজাতক বাছুরের যত্ন: শাল দুধ ও জীবন-নির্ধারণী প্রথম ২৪ ঘণ্টা$s$,
$s$A calf is born with almost no immunity. How much colostrum to give and how fast, navel care, and the daily routine that keeps calves alive and growing.$s$,
$s$বাছুর জন্মায় প্রায় কোনো রোগ প্রতিরোধ ক্ষমতা ছাড়াই। কতটা শাল দুধ, কত তাড়াতাড়ি দেবেন, নাভির যত্ন আর বাছুর বাঁচিয়ে রাখার প্রতিদিনের রুটিন।$s$,
$s$Most calf deaths happen in the **first weeks of life**, usually from diarrhoea or pneumonia. The good news: the most important protection costs nothing. It is the mother's first milk, **colostrum** (শাল দুধ), given quickly and in the right amount.

## Why colostrum is so important

A calf is born without protective antibodies. Colostrum is packed with them, and the calf's gut can absorb them only for a short time after birth: absorption is best in the first few hours and has almost stopped by about **24 hours**. Colostrum also gives energy, vitamins and warmth.

> Never throw away the first milk because it looks thick or yellow. It is the calf's first vaccine.

## The colostrum rule: quick, enough, clean

| When | How much |
| --- | --- |
| Within 1–2 hours of birth | About **5% of the calf's body weight** |
| Within 12 hours of birth | Another 5% of body weight |

So a 25 kg local calf needs about 1.25 litres in the first feed and the same again within 12 hours; a 40 kg crossbred calf needs about 2 litres each time. Weak calves may need help with a clean bottle. If the mother has no milk or has mastitis, use colostrum from another fresh cow in your herd (keep some frozen for emergencies).

## Right after birth

1. **Clear the nose and mouth** of mucus so the calf can breathe.
2. Let the mother lick the calf, or rub it dry with clean straw or a towel. This warms it and gets the blood moving.
3. **Dip the navel** in an iodine solution soon after birth and again the next day. An infected navel is a common start of joint and blood infections.
4. Make sure the calf **stands and suckles**, or feed colostrum yourself.
5. Put the calf on **clean, dry bedding** away from draughts.

## The first two months

- **Milk:** about **10% of body weight per day**, split into two feeds at the same times each day. Keep bottles and buckets clean.
- **Water:** clean water from the first week. Calves drink more than many farmers expect.
- **Calf starter and soft grass:** offer a little from the second week. Eating solid feed early grows the rumen and makes weaning easier.
- **Weaning:** many farms wean at about 2–3 months, once the calf is eating solid feed well.
- **Deworming:** in the first month and then as your vet advises.
- **Tagging:** give an ear tag and record the calf within 7 days.

## Danger signs: call the vet

- Watery or bloody diarrhoea, especially with sunken eyes (dehydration)
- Fast breathing, cough or nasal discharge
- Swollen, hot or smelly navel
- Not drinking milk, or unable to stand

For diarrhoea, keep giving **oral rehydration solution** between milk feeds while you wait for the vet. Do not stop milk completely for days; the calf needs the energy.

## Housing that keeps calves healthy

- Dry floor and bedding, changed often
- Fresh air but no cold draughts at calf height
- Separate pens for calves for the first weeks, so diseases don't spread
- Clean feeding equipment after every use

## Record it from day one

In **FarmFlows**, record the calving under **Breeding**; you can add the calf right there with its tag, and the mother and father are linked automatically. Add weights as the calf grows and record any treatment under **Health**. Good records show which calves are falling behind.

## Quick checklist

- Colostrum within 1–2 hours, 5% of body weight, and again within 12 hours
- Iodine on the navel at birth and the next day
- Clean, dry, draught-free pen
- Milk about 10% of body weight a day, water and starter from week 1–2
- Tag and record within 7 days
$s$,
$s$বাছুর মারা যাওয়ার বেশিরভাগ ঘটনা ঘটে **জীবনের প্রথম কয়েক সপ্তাহে**, সাধারণত পাতলা পায়খানা বা নিউমোনিয়ায়। সুখবর হলো, সবচেয়ে বড় সুরক্ষার কোনো খরচ নেই। সেটা মায়ের প্রথম দুধ, **শাল দুধ**, দ্রুত ও ঠিক পরিমাণে খাওয়ানো।

## শাল দুধ কেন এত জরুরি

বাছুর জন্মায় রোগ প্রতিরোধী অ্যান্টিবডি ছাড়া। শাল দুধে এই অ্যান্টিবডি ভরপুর, আর বাছুরের পেট সেগুলো শুধু জন্মের পরের অল্প সময়েই শুষে নিতে পারে: প্রথম কয়েক ঘণ্টায় সবচেয়ে ভালো, আর প্রায় **২৪ ঘণ্টার** মধ্যে এই ক্ষমতা প্রায় বন্ধ হয়ে যায়। শাল দুধ শক্তি, ভিটামিন আর উষ্ণতাও দেয়।

> ঘন বা হলুদ দেখে প্রথম দুধ কখনো ফেলে দেবেন না। এটাই বাছুরের প্রথম টিকা।

## শাল দুধের নিয়ম: দ্রুত, পর্যাপ্ত, পরিষ্কার

| কখন | কতটা |
| --- | --- |
| জন্মের ১–২ ঘণ্টার মধ্যে | বাছুরের **ওজনের প্রায় ৫%** |
| জন্মের ১২ ঘণ্টার মধ্যে | আবার ওজনের ৫% |

অর্থাৎ ২৫ কেজির দেশি বাছুরের প্রথমবার প্রায় সোয়া লিটার আর ১২ ঘণ্টার মধ্যে আবার ততটা লাগবে; ৪০ কেজির শংকর বাছুরের প্রতিবার প্রায় ২ লিটার। দুর্বল বাছুরকে পরিষ্কার বোতলে সাহায্য করে খাওয়াতে হতে পারে। মায়ের দুধ না থাকলে বা ওলান ফোলা হলে খামারের অন্য সদ্য প্রসূত গাভীর শাল দুধ দিন (জরুরি অবস্থার জন্য কিছু ফ্রিজে জমিয়ে রাখুন)।

## জন্মের ঠিক পরে

1. **নাক ও মুখের শ্লেষ্মা পরিষ্কার করুন,** যাতে বাছুর শ্বাস নিতে পারে।
2. মাকে বাছুর চাটতে দিন, বা পরিষ্কার খড় বা তোয়ালে দিয়ে ঘষে শুকান। এতে শরীর গরম হয়, রক্ত চলাচল বাড়ে।
3. জন্মের পরপরই আর পরদিন আবার **নাভি আয়োডিন দ্রবণে ডুবিয়ে দিন**। নাভির সংক্রমণ থেকেই প্রায়ই গিঁট ফোলা ও রক্তের সংক্রমণ শুরু হয়।
4. বাছুর **দাঁড়িয়ে দুধ টানছে** কি না নিশ্চিত হোন, নইলে নিজে শাল দুধ খাওয়ান।
5. বাছুরকে বাতাসের ঝাপটা থেকে দূরে **পরিষ্কার, শুকনো বিছানায়** রাখুন।

## প্রথম দুই মাস

- **দুধ:** দিনে **ওজনের প্রায় ১০%**, প্রতিদিন একই সময়ে দুই ভাগে। বোতল ও বালতি পরিষ্কার রাখুন।
- **পানি:** প্রথম সপ্তাহ থেকেই পরিষ্কার পানি। অনেক খামারি যতটা ভাবেন, বাছুর তার চেয়ে বেশি পানি খায়।
- **কাফ স্টার্টার ও নরম ঘাস:** দ্বিতীয় সপ্তাহ থেকে অল্প অল্প দিন। আগে শক্ত খাবার খাওয়া শুরু করলে পাকস্থলী বাড়ে, দুধ ছাড়ানোও সহজ হয়।
- **দুধ ছাড়ানো:** অনেক খামারে প্রায় ২–৩ মাসে, যখন বাছুর ভালোভাবে শক্ত খাবার খায়।
- **কৃমিনাশক:** প্রথম মাসে, তারপর চিকিৎসকের পরামর্শমতো।
- **ট্যাগ:** ৭ দিনের মধ্যে কানে ট্যাগ পরিয়ে রেকর্ডে তুলুন।

## বিপদের লক্ষণ: চিকিৎসক ডাকুন

- পানির মতো বা রক্তমিশ্রিত পায়খানা, বিশেষ করে চোখ বসে গেলে (পানিশূন্যতা)
- দ্রুত শ্বাস, কাশি বা নাক দিয়ে পানি
- নাভি ফোলা, গরম বা দুর্গন্ধ
- দুধ না খাওয়া বা দাঁড়াতে না পারা

পাতলা পায়খানা হলে চিকিৎসক আসা পর্যন্ত দুধের ফাঁকে ফাঁকে **খাবার স্যালাইন** দিতে থাকুন। কয়েক দিনের জন্য দুধ পুরো বন্ধ করবেন না; বাছুরের শক্তি দরকার।

## বাছুর সুস্থ রাখার ঘর

- শুকনো মেঝে ও বিছানা, ঘন ঘন বদলানো
- তাজা বাতাস, কিন্তু বাছুরের উচ্চতায় ঠান্ডা ঝাপটা নয়
- প্রথম কয়েক সপ্তাহ বাছুরের আলাদা খোঁয়াড়, যাতে রোগ না ছড়ায়
- প্রতিবার ব্যবহারের পর খাওয়ানোর পাত্র পরিষ্কার

## প্রথম দিন থেকেই রেকর্ড

**FarmFlows**-এ **প্রজনন** পাতায় বাছুর হওয়ার তথ্য লিখুন; সেখানেই ট্যাগ দিয়ে বাছুর যোগ করা যায়, মা ও বাবার সম্পর্ক নিজে থেকেই বসে যায়। বাছুর বাড়ার সাথে ওজন যোগ করুন আর যেকোনো চিকিৎসা **স্বাস্থ্য** পাতায় লিখুন। ভালো রেকর্ডে বোঝা যায় কোন বাছুর পিছিয়ে পড়ছে।

## সংক্ষেপে চেকলিস্ট

- ১–২ ঘণ্টার মধ্যে ওজনের ৫% শাল দুধ, ১২ ঘণ্টার মধ্যে আবার
- জন্মের সময় ও পরদিন নাভিতে আয়োডিন
- পরিষ্কার, শুকনো, ঝাপটাহীন খোঁয়াড়
- দিনে ওজনের প্রায় ১০% দুধ, ১–২ সপ্তাহ থেকে পানি ও স্টার্টার
- ৭ দিনের মধ্যে ট্যাগ ও রেকর্ড
$s$);

-- 4 -------------------------------------------------------------------
insert into _more_articles values (
$s$protect-dairy-cows-from-summer-heat-stress$s$, 'cattle-health', array['heat-stress', 'milk-cost'], interval '21 days',
$s$Summer heat stress in dairy cows: signs, and 9 ways to keep milk flowing$s$,
$s$গরমে গাভীর হিট স্ট্রেস: লক্ষণ ও দুধ ঠিক রাখার ৯টি উপায়$s$,
$s$Hot, humid days cut milk, appetite and pregnancy rates, especially in crossbred cows. How to read the warning signs and cool your cows cheaply.$s$,
$s$গরম ও আর্দ্র দিনে দুধ, খাওয়া ও গর্ভধারণ সবই কমে, বিশেষ করে শংকর গাভীর। সতর্কতার লক্ষণ চেনা আর কম খরচে গাভী ঠান্ডা রাখার উপায়।$s$,
$s$Bangladesh summers are not only hot but also humid, and humidity makes heat much harder on cows: they cool down mainly by breathing and sweating, which works poorly in damp air. High-yielding crossbred cows (Holstein Friesian and Sahiwal crosses) feel it first, because making a lot of milk also makes a lot of body heat.

## What heat stress does

- **Less feed eaten**, so less milk, often within a day or two
- Lower milk fat
- **Weaker or silent heats** and fewer cows getting pregnant
- More mastitis and lameness
- In severe cases, collapse and death

## Warning signs

| Sign | What to look for |
| --- | --- |
| Fast breathing | More than about 60 breaths a minute at rest (count flank movements for 15 seconds × 4) |
| Open-mouth panting | Mouth open, tongue out, drooling: this is an emergency |
| Behaviour | Standing instead of lying, crowding in shade or near water |
| Feed | Leaving feed in the trough, eating mostly at night |
| Milk | A sudden drop on hot days |

## 9 ways to keep cows cool

1. **Shade, always.** A shed roof or trees over the cows and over the feeding and water area. A white or reflective roof stays cooler than bare tin; a layer of straw or insulation under tin helps too.
2. **Air movement.** Open the sides of the shed. Fans over the resting and feeding area make a big difference, especially on still, humid days.
3. **Wet the cow, then dry her.** Short spells of water on the back and neck, followed by fans, cool better than a long soak. Don't simply raise humidity in a closed shed.
4. **Plenty of cool, clean water.** A milking cow may drink **3–4 litres of water for every litre of milk**, more in summer. Put extra water troughs close to the shed and clean them daily.
5. **Feed in the cool hours.** Give most of the feed early in the morning and in the evening. Fresh feed at night encourages eating when it is coolest.
6. **Feed quality over bulk.** Hot cows eat less, so every mouthful must count: good green grass, a balanced concentrate, and minerals. Ask your vet or nutritionist about extra salt and potassium (electrolytes) in very hot weather.
7. **Avoid work in the heat.** Do not move, treat, vaccinate or transport cows in the middle of the day.
8. **Fewer cows per shed.** Crowding traps heat. Give each cow enough space to lie down.
9. **Plan breeding.** Pregnancy rates fall in the hottest months. Watch more carefully for weak heats and discuss the timing of inseminations with your AI technician.

## First aid for a cow in trouble

If a cow is panting with an open mouth, staggering or lying down and cannot get up:

- Move her into shade with moving air
- Pour cool (not ice-cold) water over her body, especially the neck and back, and keep fanning
- Offer water to drink
- **Call the vet immediately**

## See the effect in your records

Record daily milk in **FarmFlows** and look at the milk chart for May–August. If yields drop on the hottest days, that is your proof that cooling pays. Record fan and shade costs under **Finance** and compare them with the milk you saved.

## Quick checklist

- Shade over cows, feed and water
- Fans and open sides; wet-then-dry cooling
- 3–4 litres of water per litre of milk, troughs nearby
- Feed in the morning and evening
- No handling or transport in midday heat
- Open-mouth panting = emergency
$s$,
$s$বাংলাদেশের গ্রীষ্ম শুধু গরম নয়, আর্দ্রও, আর আর্দ্রতা গরুর জন্য গরমকে অনেক বেশি কষ্টকর করে তোলে: গরু মূলত শ্বাস নিয়ে আর ঘেমে শরীর ঠান্ডা করে, যা ভেজা বাতাসে ঠিকমতো কাজ করে না। বেশি দুধের শংকর গাভী (হলস্টেইন ফ্রিজিয়ান ও শাহিওয়াল শংকর) আগে কষ্ট পায়, কারণ বেশি দুধ বানাতে শরীরে বেশি তাপও তৈরি হয়।

## হিট স্ট্রেসে কী হয়

- **খাওয়া কমে যায়,** ফলে এক-দুই দিনের মধ্যেই দুধ কমে
- দুধের ফ্যাট কমে
- **গরম দুর্বল বা নীরব হয়,** গর্ভধারণ কমে যায়
- ওলান ফোলা ও খোঁড়ানো বাড়ে
- বেশি হলে গাভী পড়ে যায়, মারাও যেতে পারে

## সতর্কতার লক্ষণ

| লক্ষণ | কী দেখবেন |
| --- | --- |
| দ্রুত শ্বাস | বিশ্রামে মিনিটে প্রায় ৬০ বারের বেশি (১৫ সেকেন্ড পেটের ওঠানামা গুনে × ৪) |
| মুখ খুলে হাঁপানো | মুখ খোলা, জিভ বের করা, লালা পড়া: এটা জরুরি অবস্থা |
| আচরণ | শুয়ে না থেকে দাঁড়িয়ে থাকা, ছায়া বা পানির কাছে ভিড় |
| খাওয়া | চাড়িতে খাবার রেখে দেওয়া, বেশিরভাগ রাতে খাওয়া |
| দুধ | গরমের দিনে হঠাৎ দুধ কমে যাওয়া |

## গাভী ঠান্ডা রাখার ৯টি উপায়

1. **সবসময় ছায়া।** গরুর ওপর, খাবার ও পানির জায়গার ওপর ছাউনি বা গাছ। খালি টিনের চেয়ে সাদা বা প্রতিফলক ছাদ ঠান্ডা থাকে; টিনের নিচে খড় বা ইনসুলেশনের স্তরও কাজে দেয়।
2. **বাতাস চলাচল।** ঘরের পাশ খোলা রাখুন। বিশ্রাম ও খাওয়ার জায়গায় ফ্যান অনেক পার্থক্য আনে, বিশেষ করে গুমোট দিনে।
3. **ভেজান, তারপর শুকান।** পিঠ ও ঘাড়ে অল্প সময় পানি দিয়ে তারপর ফ্যান চালালে লম্বা সময় ভেজানোর চেয়ে বেশি ঠান্ডা হয়। বন্ধ ঘরে শুধু আর্দ্রতা বাড়াবেন না।
4. **প্রচুর ঠান্ডা পরিষ্কার পানি।** দুধেল গাভী **প্রতি লিটার দুধের জন্য ৩–৪ লিটার পানি** খেতে পারে, গরমে আরও বেশি। ঘরের কাছে বাড়তি পানির চাড়ি রাখুন, প্রতিদিন পরিষ্কার করুন।
5. **ঠান্ডা সময়ে খাবার।** বেশিরভাগ খাবার ভোরে আর সন্ধ্যায় দিন। রাতে টাটকা খাবার দিলে সবচেয়ে ঠান্ডা সময়ে খাওয়া বাড়ে।
6. **পরিমাণের চেয়ে মান।** গরমে গরু কম খায়, তাই প্রতিটি গ্রাস গুরুত্বপূর্ণ: ভালো কাঁচা ঘাস, সুষম দানাদার আর খনিজ। খুব গরমে বাড়তি লবণ ও পটাশিয়াম (ইলেক্ট্রোলাইট) নিয়ে চিকিৎসক বা পুষ্টিবিদের পরামর্শ নিন।
7. **গরমে কাজ নয়।** দুপুরে গরু সরানো, চিকিৎসা, টিকা বা পরিবহন করবেন না।
8. **ঘরে কম গরু।** গাদাগাদি করলে তাপ আটকে থাকে। প্রতিটি গরুর শোয়ার মতো জায়গা দিন।
9. **প্রজননের পরিকল্পনা।** সবচেয়ে গরম মাসে গর্ভধারণ কমে। দুর্বল গরম ধরতে বেশি নজর দিন, আর প্রজননের সময় নিয়ে টেকনিশিয়ানের সাথে কথা বলুন।

## বিপদে পড়া গাভীর প্রাথমিক চিকিৎসা

গাভী মুখ খুলে হাঁপালে, টলতে থাকলে বা শুয়ে পড়ে উঠতে না পারলে:

- বাতাস চলে এমন ছায়ায় নিয়ে যান
- শরীরে, বিশেষ করে ঘাড় ও পিঠে ঠান্ডা (বরফ-ঠান্ডা নয়) পানি ঢালুন, বাতাস করতে থাকুন
- খাওয়ার জন্য পানি দিন
- **সঙ্গে সঙ্গে চিকিৎসক ডাকুন**

## রেকর্ডে ফল দেখুন

**FarmFlows**-এ প্রতিদিনের দুধ লিখুন আর মে–আগস্টের দুধের চার্ট দেখুন। সবচেয়ে গরম দিনে দুধ কমলে বুঝবেন ঠান্ডা রাখার খরচ লাভজনক। ফ্যান ও ছাউনির খরচ **হিসাব** পাতায় লিখে বাঁচানো দুধের সাথে তুলনা করুন।

## সংক্ষেপে চেকলিস্ট

- গরু, খাবার ও পানির ওপর ছায়া
- ফ্যান ও খোলা পাশ; ভেজানো-তারপর-শুকানো
- প্রতি লিটার দুধে ৩–৪ লিটার পানি, কাছেই চাড়ি
- সকাল ও সন্ধ্যায় খাবার
- দুপুরের গরমে কোনো নাড়াচাড়া বা পরিবহন নয়
- মুখ খুলে হাঁপানো = জরুরি অবস্থা
$s$);

-- 5 -------------------------------------------------------------------
insert into _more_articles values (
$s$how-to-make-maize-silage-small-farm$s$, 'feed-nutrition', array['silage', 'fodder', 'milk-cost'], interval '23 days',
$s$How to make maize silage on a small farm (bag and pit methods)$s$,
$s$ছোট খামারে ভুট্টার সাইলেজ বানানোর নিয়ম (ব্যাগ ও গর্ত পদ্ধতি)$s$,
$s$Silage stores green fodder for months without losing much quality. Step-by-step: when to harvest, how to chop, pack and seal, and how to tell good silage from bad.$s$,
$s$সাইলেজে কাঁচা ঘাস মাসের পর মাস ভালো থাকে। ধাপে ধাপে: কখন কাটবেন, কীভাবে কুচি, চাপ ও বন্ধ করবেন, আর ভালো-খারাপ সাইলেজ চিনবেন কীভাবে।$s$,
$s$Green grass is plentiful in the rainy season and scarce in the dry months, so milk drops when the grass runs out. **Silage** solves this. It is green fodder that is chopped, packed tightly and sealed without air, so natural bacteria turn its sugars into acid that keeps it, like a pickle, for many months.

## Which crop?

- **Maize** is the easiest and best silage crop: plenty of sugar for good fermentation and high energy for milk.
- Sorghum also works well.
- **Napier and other grasses** can be ensiled too, but they have less sugar. Mixing in **molasses** (about 3% of the green weight, diluted with a little water) helps them ferment properly.

## Harvest at the right time

Cut maize when the grains are at the **milk-to-dough stage** (a grain pressed with a fingernail gives a thick, milky paste), roughly 75–90 days after sowing depending on the variety. At this stage the whole plant has about the right dryness: around **30–35% dry matter**.

The squeeze test: take a handful of chopped material and squeeze hard for 30 seconds.

- **Water drips out:** too wet; wilt it in the sun for a few hours.
- **Holds a ball and the hand is moist:** just right.
- **Falls apart immediately and feels dry:** too dry; it will be hard to pack.

## Two methods for small farms

### Bag silage

Thick plastic silage bags hold about 50–100 kg each. Easy to handle, little waste once opened, and you can move them.

### Pit or bunker silage

A pit dug in high ground or a cement bunker, lined with thick plastic. Better for larger amounts. Choose a place where rainwater cannot flow in.

## Step by step

1. **Chop** into 1–2 cm pieces with a chaff cutter. Short pieces pack tightly.
2. **Fill quickly:** finish a bag or a pit section on the same day if possible.
3. **Pack hard,** layer by layer. In a bag, press and tamp every few centimetres; in a pit, trample each 15–20 cm layer well. Pushing out air is the most important step.
4. **Seal airtight.** Squeeze the remaining air out of a bag and tie it tightly. Cover a pit with thick plastic and weigh it down all over with soil, sand bags or old tyres.
5. **Protect** from rats, birds and sharp objects. Check for holes every week and tape them at once.
6. **Wait at least 3 weeks;** most farmers open after **30–45 days**.

## Good or bad silage?

| Good silage | Bad silage |
| --- | --- |
| Yellow-green to light brown | Dark brown or black |
| Pleasant, sour, fruity smell (like pickle) | Rotten, ammonia or strong vinegar smell |
| Firm, not slimy | Slimy, or with white, blue or black mould |

**Never feed mouldy or rotten silage.** It can make cows sick or cause abortion. Throw away the spoiled part.

## Feeding silage

- Start with a small amount and build up over 1–2 weeks.
- An adult milking cow can eat about **10–15 kg a day** alongside straw, grass and concentrate.
- Once opened, keep the face or bag covered and use it within a few days; air spoils it quickly.
- Take out only what you feed that day.

## Is it worth it?

Count your costs (crop, chopping, bags or plastic, labour) and compare them with buying fodder or extra concentrate in the dry season. Record them in **FarmFlows → Finance** and watch your milk record through the dry months; steady milk from February to April is the payoff.

## Quick checklist

- Maize at milk-to-dough stage, about 30–35% dry matter
- Chop 1–2 cm, fill fast, pack hard, seal airtight
- Wait 30–45 days
- Sour, fruity smell = good; mould or rot = throw away
- Build up to 10–15 kg a day per milking cow
$s$,
$s$বর্ষায় কাঁচা ঘাস প্রচুর, শুকনো মৌসুমে কম, তাই ঘাস ফুরালে দুধও কমে। এর সমাধান **সাইলেজ**। কাঁচা ঘাস কুচি করে শক্ত করে চেপে বাতাস ছাড়া বন্ধ করে রাখা হয়, যাতে প্রাকৃতিক জীবাণু ঘাসের চিনিকে অম্লে পরিণত করে আর আচারের মতো অনেক মাস ভালো রাখে।

## কোন ফসল?

- **ভুট্টা** সবচেয়ে সহজ ও সেরা: ভালো গাঁজনের জন্য যথেষ্ট চিনি আর দুধের জন্য বেশি শক্তি।
- সরগমও ভালো হয়।
- **নেপিয়ার ও অন্যান্য ঘাস** দিয়েও হয়, তবে চিনি কম। কাঁচা ওজনের প্রায় ৩% **চিটাগুড়** অল্প পানিতে গুলে মেশালে ঠিকমতো গাঁজন হয়।

## ঠিক সময়ে কাটুন

ভুট্টার দানা যখন **দুধ থেকে নরম ময়দার মতো অবস্থায়** (নখ দিয়ে চাপলে ঘন দুধের মতো পেস্ট বের হয়), তখন কাটুন; জাতভেদে বোনার প্রায় ৭৫–৯০ দিন পরে। এ সময় পুরো গাছের শুষ্কতা ঠিক থাকে: প্রায় **৩০–৩৫% শুষ্ক পদার্থ**।

চাপ পরীক্ষা: এক মুঠো কুচি করা ঘাস নিয়ে ৩০ সেকেন্ড জোরে চাপ দিন।

- **পানি ঝরে পড়ে:** বেশি ভেজা; কয়েক ঘণ্টা রোদে নেতিয়ে নিন।
- **বলের মতো থাকে, হাত একটু ভেজা:** একদম ঠিক।
- **সাথে সাথে ঝরে যায়, শুকনো লাগে:** বেশি শুকনো; চেপে রাখা কঠিন হবে।

## ছোট খামারের দুটি পদ্ধতি

### ব্যাগ সাইলেজ

মোটা প্লাস্টিকের সাইলেজ ব্যাগে প্রায় ৫০–১০০ কেজি করে ধরে। সহজে নাড়াচাড়া করা যায়, খোলার পর কম নষ্ট হয়, সরানোও যায়।

### গর্ত বা বাঙ্কার সাইলেজ

উঁচু জমিতে খোঁড়া গর্ত বা সিমেন্টের বাঙ্কার, মোটা প্লাস্টিক বিছানো। বেশি পরিমাণের জন্য ভালো। এমন জায়গা বাছুন যেখানে বৃষ্টির পানি ঢুকবে না।

## ধাপে ধাপে

1. চপার মেশিনে **১–২ সেমি করে কুচি করুন।** ছোট টুকরা শক্ত করে চাপা যায়।
2. **দ্রুত ভরুন:** সম্ভব হলে একটা ব্যাগ বা গর্তের একটা অংশ একই দিনে শেষ করুন।
3. **স্তরে স্তরে শক্ত করে চাপুন।** ব্যাগে কয়েক সেন্টিমিটার পর পর চেপে দিন; গর্তে প্রতি ১৫–২০ সেমি স্তর ভালো করে পা দিয়ে মাড়ান। বাতাস বের করাই সবচেয়ে জরুরি ধাপ।
4. **বাতাস না ঢোকে এমনভাবে বন্ধ করুন।** ব্যাগের বাকি বাতাস চেপে বের করে শক্ত করে বাঁধুন। গর্ত মোটা প্লাস্টিকে ঢেকে ওপরে সব জায়গায় মাটি, বালুর বস্তা বা পুরনো টায়ার চাপা দিন।
5. ইঁদুর, পাখি ও ধারালো জিনিস থেকে **রক্ষা করুন।** প্রতি সপ্তাহে ফুটো আছে কি না দেখুন, সাথে সাথে টেপ লাগান।
6. **অন্তত ৩ সপ্তাহ অপেক্ষা করুন;** বেশিরভাগ খামারি **৩০–৪৫ দিন** পরে খোলেন।

## ভালো না খারাপ সাইলেজ?

| ভালো সাইলেজ | খারাপ সাইলেজ |
| --- | --- |
| হলদে-সবুজ থেকে হালকা বাদামি | গাঢ় বাদামি বা কালো |
| মিষ্টি-টক, ফলের মতো গন্ধ (আচারের মতো) | পচা, অ্যামোনিয়া বা কড়া সিরকার গন্ধ |
| শক্ত, পিচ্ছিল নয় | পিচ্ছিল, বা সাদা, নীল বা কালো ছত্রাক |

**ছত্রাক ধরা বা পচা সাইলেজ কখনো খাওয়াবেন না।** গরু অসুস্থ হতে পারে, গাভিন গাভীর বাচ্চা নষ্ট হতে পারে। নষ্ট অংশ ফেলে দিন।

## সাইলেজ খাওয়ানো

- অল্প দিয়ে শুরু করে ১–২ সপ্তাহে বাড়ান।
- একটা বড় দুধেল গাভী খড়, ঘাস ও দানাদারের পাশাপাশি দিনে প্রায় **১০–১৫ কেজি** খেতে পারে।
- খোলার পর মুখ বা ব্যাগ ঢেকে রাখুন আর কয়েক দিনের মধ্যে শেষ করুন; বাতাস লাগলে দ্রুত নষ্ট হয়।
- শুধু সেদিন যতটা খাওয়াবেন ততটাই বের করুন।

## লাভ হয় কি?

খরচ (ফসল, কুচি করা, ব্যাগ বা প্লাস্টিক, শ্রম) হিসাব করে শুকনো মৌসুমে ঘাস বা বাড়তি দানাদার কেনার খরচের সাথে তুলনা করুন। **FarmFlows → হিসাব** পাতায় খরচ লিখুন আর শুকনো মাসগুলোতে দুধের রেকর্ড দেখুন; ফেব্রুয়ারি থেকে এপ্রিলে দুধ স্থির থাকলেই বুঝবেন লাভ হয়েছে।

## সংক্ষেপে চেকলিস্ট

- দুধ-থেকে-ময়দা অবস্থার ভুট্টা, প্রায় ৩০–৩৫% শুষ্ক পদার্থ
- ১–২ সেমি কুচি, দ্রুত ভরা, শক্ত চাপ, বাতাসহীন বন্ধ
- ৩০–৪৫ দিন অপেক্ষা
- টক, ফলের মতো গন্ধ = ভালো; ছত্রাক বা পচা = ফেলে দিন
- দুধেল গাভীকে দিনে ১০–১৫ কেজি পর্যন্ত
$s$);

-- 6 -------------------------------------------------------------------
insert into _more_articles values (
$s$layer-farm-biosecurity-checklist$s$, 'poultry', array['biosecurity', 'egg-production'], interval '25 days',
$s$Layer farm biosecurity: 12 rules that keep disease out$s$,
$s$লেয়ার খামারের জৈব নিরাপত্তা: রোগ ঠেকানোর ১২টি নিয়ম$s$,
$s$Most poultry diseases walk in on shoes, egg trays, vehicles and wild birds. A practical, low-cost biosecurity plan for small and medium layer farms.$s$,
$s$মুরগির বেশিরভাগ রোগ আসে জুতা, ডিমের ট্রে, গাড়ি আর বন্য পাখির সাথে। ছোট ও মাঝারি লেয়ার খামারের জন্য কম খরচের বাস্তব জৈব নিরাপত্তা পরিকল্পনা।$s$,
$s$Vaccines protect against some diseases, but no vaccine protects against everything, and an outbreak of Newcastle disease or bird flu can wipe out a flock and its income in days. **Biosecurity** means keeping germs out of your farm and stopping them from spreading inside it. Most of it costs very little; it is mainly discipline.

## How disease gets in

- **People:** shoes, clothes and hands of visitors, traders, vaccinators and your own workers
- **Egg trays and crates** that have been to the market or another farm
- **Vehicles:** feed trucks and egg pickup vans driving up to the shed
- **Wild birds, rats and flies**
- **New birds** of unknown health
- **Dead birds** left lying around

## 12 rules

1. **One gate, kept closed.** Fence the farm and put up a "No entry without permission" sign.
2. **Footbath at every shed door,** with a disinfectant made up as the label says. Change it daily, or whenever it is dirty; a muddy footbath does nothing.
3. **Farm-only boots and clothes.** Workers change at the gate. Keep a few pairs of boots and aprons for vets and visitors.
4. **Wash hands** with soap before and after entering each shed.
5. **Few visitors.** Ask whether they have been to another poultry farm or a bird market that day; if yes, they should not enter.
6. **Market egg trays stay outside.** Never bring used trays from the market into the shed. Use your own trays, or plastic trays that you wash and disinfect.
7. **Vehicles stop at the gate.** Load feed and eggs there, not next to the shed.
8. **Bird-proof the sheds.** Wire netting on open sides keeps out sparrows, crows and pigeons that carry disease.
9. **Control rats and flies.** Store feed in closed containers, clean up spilled feed, and keep manure dry.
10. **All-in, all-out.** Keep one age group per shed. After selling a flock, remove litter, wash, disinfect and leave the shed **empty for at least 2 weeks** before new birds arrive.
11. **Handle dead birds properly.** Collect them at least twice a day and bury them deep with lime, or burn them, away from the sheds. Never throw them into a pond or field.
12. **Clean water.** Treat drinking water if it comes from an open source, and clean drinker lines regularly.

## Work in the right order

Each day, visit the **youngest birds first** and the oldest last, and visit a shed with sick birds at the very end. If possible, give sick birds their own worker.

## When something goes wrong

Call your vet straight away if you see:

- Sudden deaths of many birds
- A sharp drop in eggs, feed or water intake
- Swollen heads, blue combs, breathing trouble or twisted necks

Bird flu (avian influenza) must be reported. Contact your **Upazila Livestock Office** quickly; early reporting protects your neighbours' farms and your own future flocks.

## Write your plan on one page

Pin a simple one-page plan at the gate: who may enter, what they must do, and who to call. Train every worker on it.

## Track health and losses

In **FarmFlows**, record daily deaths in the **Layer flocks → Daily log** and every vaccine, medicine and disinfection under **Flock health**. A rising death count or a falling laying rate shows up on the first day, which is when acting is cheapest.

## Quick checklist

- Fence, one gate, sign
- Footbath at every door, changed daily
- Farm boots and clothes; hand washing
- No market egg trays in the shed; vehicles stop at the gate
- Netting, rat and fly control
- All-in, all-out with 2 weeks empty
- Dead birds buried with lime or burned
- Report suspected bird flu at once
$s$,
$s$টিকা কিছু রোগ থেকে বাঁচায়, কিন্তু সব রোগের টিকা নেই, আর রানীক্ষেত বা বার্ড ফ্লু ছড়ালে কয়েক দিনে পুরো ব্যাচ ও আয় শেষ হয়ে যেতে পারে। **জৈব নিরাপত্তা** মানে খামারে জীবাণু ঢুকতে না দেওয়া আর ভেতরে ছড়াতে না দেওয়া। এর বেশিরভাগেই খরচ খুব কম; দরকার শুধু নিয়ম মেনে চলা।

## রোগ কীভাবে ঢোকে

- **মানুষ:** দর্শনার্থী, ব্যবসায়ী, টিকাদানকারী আর নিজের কর্মীদের জুতা, কাপড় ও হাত
- বাজার বা অন্য খামার ঘুরে আসা **ডিমের ট্রে ও খাঁচা**
- **গাড়ি:** শেড পর্যন্ত চলে আসা খাবারের ট্রাক ও ডিমের ভ্যান
- **বন্য পাখি, ইঁদুর ও মাছি**
- অজানা স্বাস্থ্যের **নতুন মুরগি**
- পড়ে থাকা **মরা মুরগি**

## ১২টি নিয়ম

1. **একটাই গেট, সবসময় বন্ধ।** খামারে বেড়া দিন, "অনুমতি ছাড়া প্রবেশ নিষেধ" লেখা টাঙান।
2. **প্রতিটি শেডের দরজায় ফুটবাথ,** লেবেলের নিয়মে জীবাণুনাশক মিশিয়ে। প্রতিদিন বা ময়লা হলেই বদলান; কাদাভরা ফুটবাথ কোনো কাজ করে না।
3. **খামারের জন্য আলাদা জুতা ও কাপড়।** কর্মীরা গেটে পোশাক বদলাবেন। চিকিৎসক ও দর্শনার্থীর জন্য কয়েক জোড়া বুট ও অ্যাপ্রন রাখুন।
4. প্রতিটি শেডে ঢোকার আগে ও পরে সাবান দিয়ে **হাত ধুয়ে নিন।**
5. **দর্শনার্থী কম।** জিজ্ঞেস করুন সেদিন অন্য মুরগির খামার বা পাখির বাজারে গিয়েছিলেন কি না; গেলে ঢুকতে দেবেন না।
6. **বাজারের ডিমের ট্রে বাইরে।** বাজার থেকে আসা পুরনো ট্রে কখনো শেডে আনবেন না। নিজের ট্রে বা ধুয়ে জীবাণুমুক্ত করা প্লাস্টিকের ট্রে ব্যবহার করুন।
7. **গাড়ি থামবে গেটে।** খাবার ও ডিম সেখানেই ওঠানামা করুন, শেডের পাশে নয়।
8. **শেডে পাখি ঢুকতে দেবেন না।** খোলা পাশে তারের জাল দিলে চড়ুই, কাক ও কবুতর ঢুকতে পারে না, যারা রোগ বহন করে।
9. **ইঁদুর ও মাছি নিয়ন্ত্রণ।** খাবার ঢাকনাওয়ালা পাত্রে রাখুন, পড়ে থাকা খাবার পরিষ্কার করুন, বিষ্ঠা শুকনো রাখুন।
10. **একসাথে আনা, একসাথে বিক্রি।** এক শেডে এক বয়সের মুরগি রাখুন। ব্যাচ বিক্রির পর লিটার সরিয়ে ধুয়ে, জীবাণুমুক্ত করে নতুন মুরগি আনার আগে **অন্তত ২ সপ্তাহ শেড খালি রাখুন।**
11. **মরা মুরগির ঠিক ব্যবস্থা।** দিনে অন্তত দুবার সংগ্রহ করে শেড থেকে দূরে চুনসহ গভীর গর্তে পুঁতে ফেলুন বা পুড়িয়ে ফেলুন। কখনো পুকুর বা মাঠে ফেলবেন না।
12. **পরিষ্কার পানি।** খোলা উৎসের পানি হলে শোধন করুন, পানির লাইন নিয়মিত পরিষ্কার করুন।

## ঠিক ক্রমে কাজ করুন

প্রতিদিন **আগে সবচেয়ে কম বয়সী মুরগি,** শেষে বয়স্কগুলো দেখুন, আর অসুস্থ মুরগির শেডে যান একদম শেষে। সম্ভব হলে অসুস্থ মুরগির জন্য আলাদা কর্মী রাখুন।

## কিছু ভুল হলে

এসব দেখলে সাথে সাথে চিকিৎসক ডাকুন:

- হঠাৎ অনেক মুরগি মারা যাওয়া
- ডিম, খাবার বা পানি খাওয়া হঠাৎ কমে যাওয়া
- মাথা ফোলা, ঝুঁটি নীল, শ্বাসকষ্ট বা ঘাড় বেঁকে যাওয়া

বার্ড ফ্লু (এভিয়ান ইনফ্লুয়েঞ্জা) সন্দেহ হলে জানাতেই হবে। দ্রুত **উপজেলা প্রাণিসম্পদ দপ্তরে** যোগাযোগ করুন; আগে জানালে প্রতিবেশীর খামার আর আপনার ভবিষ্যতের ব্যাচও রক্ষা পায়।

## এক পাতায় পরিকল্পনা লিখুন

গেটে এক পাতার সহজ পরিকল্পনা টাঙিয়ে দিন: কে ঢুকতে পারবে, কী করতে হবে আর কাকে ফোন করতে হবে। প্রত্যেক কর্মীকে এটা শিখিয়ে দিন।

## স্বাস্থ্য ও ক্ষতির হিসাব রাখুন

**FarmFlows**-এ **লেয়ার ব্যাচ → দৈনিক হিসাব** থেকে প্রতিদিনের মৃত্যু আর **মুরগির স্বাস্থ্য** পাতায় প্রতিটি টিকা, ওষুধ ও জীবাণুমুক্তকরণ লিখুন। মৃত্যু বাড়া বা ডিম পাড়ার হার কমা প্রথম দিনেই চোখে পড়ে, আর তখন ব্যবস্থা নেওয়াই সবচেয়ে সস্তা।

## সংক্ষেপে চেকলিস্ট

- বেড়া, একটা গেট, সাইনবোর্ড
- প্রতি দরজায় ফুটবাথ, প্রতিদিন বদলানো
- খামারের জুতা ও কাপড়; হাত ধোয়া
- বাজারের ট্রে শেডে নয়; গাড়ি গেটে থামবে
- জাল, ইঁদুর ও মাছি নিয়ন্ত্রণ
- একসাথে আনা-বিক্রি, ২ সপ্তাহ খালি
- মরা মুরগি চুন দিয়ে পোঁতা বা পোড়ানো
- বার্ড ফ্লু সন্দেহ হলে সাথে সাথে জানান
$s$);

-- 7 -------------------------------------------------------------------
insert into _more_articles values (
$s$raising-layer-pullets-brooding-to-first-egg$s$, 'poultry', array['brooding', 'egg-production', 'layer-feed'], interval '27 days',
$s$Raising layer pullets: from day-old chick to the first egg$s$,
$s$লেয়ার পুলেট পালন: একদিনের বাচ্চা থেকে প্রথম ডিম পর্যন্ত$s$,
$s$A layer's whole laying life is decided in its first 18 weeks. Brooding temperatures, light, feed changes, body weight and vaccination, explained simply.$s$,
$s$একটা লেয়ারের পুরো ডিম পাড়ার জীবন ঠিক হয় প্রথম ১৮ সপ্তাহে। ব্রুডিং তাপমাত্রা, আলো, খাবার বদল, ওজন ও টিকা, সহজ ভাষায়।$s$,
$s$Many farmers put all their effort into the laying period, but **a poorly grown pullet never becomes a good layer**. Birds that are underweight or uneven at 16–18 weeks start late, lay smaller eggs and peak lower. Here is how to raise a flock that is ready to lay well.

## Before the chicks arrive

- Clean and disinfect the shed, then leave it empty for at least 2 weeks.
- Spread 5–7 cm of dry, clean litter (rice husk or wood shavings).
- **Pre-heat the brooding area for 12–24 hours** so the floor is warm when the chicks arrive.
- Fill drinkers with clean, slightly warm water and put feed on paper or chick trays.

## Brooding temperature

| Age | Temperature at chick height |
| --- | --- |
| Days 1–7 | About 32–35 °C |
| Week 2 | About 29–31 °C |
| Week 3 | About 27–29 °C |
| Week 4 onwards | Lower slowly to about 21–24 °C |

**Watch the chicks, not just the thermometer:**

- **Huddled under the heater, chirping loudly:** too cold
- **Far from the heater, panting, wings spread:** too hot
- **Crowded on one side:** a draught is coming from the other
- **Spread evenly, eating, drinking and resting:** just right

## The first week matters most

- Make sure every chick finds water and feed in the first hours. Dip a few beaks in the water to teach them.
- Use bright light (close to 24 hours) for the first 2–3 days, then reduce it step by step.
- Check crop fill: after 24 hours, most chicks should have a soft, full crop.
- Weigh a sample at day 7. A good flock roughly **doubles to quadruples** its day-old weight in the first week; follow the target in your breed's management guide.

## Feed by stage

| Stage | Typical age | Feed |
| --- | --- | --- |
| Starter | 0–6 weeks | Chick starter, high protein |
| Grower | 7–15/16 weeks | Grower feed, lower protein |
| Pre-lay | About 16–18 weeks | Pre-layer feed with more calcium |
| Layer | From about 5% production | Layer feed (about 3.5–4% calcium) |

Change feed gradually over 3–4 days by mixing old and new.

## Light during rearing

Keep day length **short and constant** during the growing period (follow your breed guide, often around 10–12 hours by the end of rearing). Then **increase light step by step from about 16–18 weeks**, when the birds reach the target weight, to reach about 16 hours in the laying house. Increasing light too early in underweight birds brings small eggs and prolapse.

## Weigh, don't guess

From week 4, weigh about **5% of the flock (at least 50 birds) every week** at the same time of day.

- Compare the average with your breed's target weight.
- Check **uniformity**: the share of birds within 10% of the average. Aim for **80% or more**.
- If uniformity is poor, sort birds by size and give the small ones more feeder space.

## Vaccination and health

Follow the vaccination schedule from your hatchery or vet. In Bangladesh it usually covers **Marek's disease** (often at the hatchery), **Newcastle disease (Ranikhet)**, **infectious bronchitis**, **Gumboro (IBD)** and **fowl pox**, with boosters before lay. Give vaccines at the right age, with the cold chain kept and the right method (eye drop, drinking water or injection). Keep litter dry to prevent coccidiosis.

## Space

Enough feeder and drinker space is as important as enough floor space. Crowded pullets grow unevenly because the weak birds can't reach the feed.

## Record the whole rearing

In **FarmFlows**, create the flock under **Layer flocks** on the day the chicks arrive, record daily feed and deaths in the **Daily log**, and record every vaccine under **Flock health**. When the flock starts laying, the same flock keeps its full history.

## Quick checklist

- Pre-heat 12–24 hours; 32–35 °C in week 1
- Read chick behaviour, not only the thermometer
- Starter → grower → pre-lay → layer, changed slowly
- Weigh weekly from week 4, uniformity 80%+
- Light stimulation only when the target weight is reached
- Vaccines on schedule, litter dry
$s$,
$s$অনেক খামারি সব মনোযোগ দেন ডিম পাড়ার সময়ে, কিন্তু **ঠিকমতো না বাড়া পুলেট কখনো ভালো লেয়ার হয় না।** ১৬–১৮ সপ্তাহে ওজন কম বা অসমান থাকলে ডিম পাড়া দেরিতে শুরু হয়, ডিম ছোট হয়, সর্বোচ্চ উৎপাদনও কম হয়। কীভাবে ভালো ডিম পাড়ার জন্য তৈরি ব্যাচ বড় করবেন, দেখুন।

## বাচ্চা আসার আগে

- শেড পরিষ্কার ও জীবাণুমুক্ত করে অন্তত ২ সপ্তাহ খালি রাখুন।
- ৫–৭ সেমি শুকনো, পরিষ্কার লিটার (ধানের তুষ বা কাঠের গুঁড়া) বিছান।
- **১২–২৪ ঘণ্টা আগে ব্রুডিং জায়গা গরম করুন,** যাতে বাচ্চা আসার সময় মেঝে গরম থাকে।
- পানির পাত্রে পরিষ্কার, হালকা কুসুম গরম পানি দিন আর কাগজ বা চিক ট্রেতে খাবার দিন।

## ব্রুডিং তাপমাত্রা

| বয়স | বাচ্চার উচ্চতায় তাপমাত্রা |
| --- | --- |
| ১–৭ দিন | প্রায় ৩২–৩৫ °C |
| ২য় সপ্তাহ | প্রায় ২৯–৩১ °C |
| ৩য় সপ্তাহ | প্রায় ২৭–২৯ °C |
| ৪র্থ সপ্তাহ থেকে | ধীরে ধীরে প্রায় ২১–২৪ °C-এ নামান |

**শুধু থার্মোমিটার নয়, বাচ্চাদের দেখুন:**

- **হিটারের নিচে জড়ো হয়ে জোরে ডাকছে:** ঠান্ডা লাগছে
- **হিটার থেকে দূরে, হাঁপাচ্ছে, ডানা ছড়ানো:** বেশি গরম
- **এক পাশে ভিড়:** অন্য পাশ থেকে বাতাসের ঝাপটা আসছে
- **সমানভাবে ছড়িয়ে খাচ্ছে, পানি খাচ্ছে, বিশ্রাম নিচ্ছে:** একদম ঠিক

## প্রথম সপ্তাহই সবচেয়ে জরুরি

- প্রথম কয়েক ঘণ্টায় প্রতিটি বাচ্চা যেন পানি ও খাবার খুঁজে পায়। কয়েকটার ঠোঁট পানিতে ডুবিয়ে শিখিয়ে দিন।
- প্রথম ২–৩ দিন উজ্জ্বল আলো (প্রায় ২৪ ঘণ্টা) দিন, তারপর ধাপে ধাপে কমান।
- খাদ্যথলি দেখুন: ২৪ ঘণ্টা পরে বেশিরভাগ বাচ্চার খাদ্যথলি নরম ও ভরা থাকা উচিত।
- ৭ দিনে কিছু বাচ্চার ওজন নিন। ভালো ব্যাচ প্রথম সপ্তাহে একদিন বয়সের ওজনের মোটামুটি **দুই থেকে চার গুণ** হয়; আপনার জাতের ব্যবস্থাপনা গাইডের লক্ষ্য মেনে চলুন।

## বয়স অনুযায়ী খাবার

| পর্যায় | সাধারণ বয়স | খাবার |
| --- | --- | --- |
| স্টার্টার | ০–৬ সপ্তাহ | চিক স্টার্টার, বেশি প্রোটিন |
| গ্রোয়ার | ৭–১৫/১৬ সপ্তাহ | গ্রোয়ার খাবার, কম প্রোটিন |
| প্রি-লে | প্রায় ১৬–১৮ সপ্তাহ | বেশি ক্যালসিয়ামের প্রি-লেয়ার খাবার |
| লেয়ার | প্রায় ৫% উৎপাদন থেকে | লেয়ার খাবার (প্রায় ৩.৫–৪% ক্যালসিয়াম) |

পুরনো ও নতুন খাবার মিশিয়ে ৩–৪ দিনে ধীরে ধীরে বদলান।

## বাড়ন্ত সময়ের আলো

বাড়ন্ত সময়ে দিনের আলো **কম ও স্থির** রাখুন (জাতের গাইড মানুন, বাড়ন্ত সময়ের শেষে প্রায়ই ১০–১২ ঘণ্টা)। তারপর **প্রায় ১৬–১৮ সপ্তাহ থেকে ধাপে ধাপে আলো বাড়ান,** যখন মুরগি লক্ষ্য ওজনে পৌঁছায়, যাতে লেয়ার শেডে প্রায় ১৬ ঘণ্টা হয়। কম ওজনের মুরগিতে আগেভাগে আলো বাড়ালে ডিম ছোট হয়, বাচ্চাদানি বের হওয়ার (প্রোল্যাপস) সমস্যা হয়।

## আন্দাজ নয়, ওজন মাপুন

৪র্থ সপ্তাহ থেকে **প্রতি সপ্তাহে ব্যাচের প্রায় ৫% (অন্তত ৫০টি) মুরগির** ওজন একই সময়ে নিন।

- গড় ওজন জাতের লক্ষ্য ওজনের সাথে মেলান।
- **সমতা (ইউনিফর্মিটি)** দেখুন: গড়ের ১০%-এর মধ্যে থাকা মুরগির অংশ। লক্ষ্য **৮০% বা বেশি।**
- সমতা কম হলে আকার অনুযায়ী আলাদা করে ছোটগুলোকে খাবারের পাত্রে বেশি জায়গা দিন।

## টিকা ও স্বাস্থ্য

হ্যাচারি বা চিকিৎসকের দেওয়া টিকার সূচি মেনে চলুন। বাংলাদেশে সাধারণত থাকে **মারেক্স** (প্রায়ই হ্যাচারিতে), **রানীক্ষেত (নিউক্যাসল)**, **ইনফেকশাস ব্রঙ্কাইটিস**, **গামবোরো (IBD)** আর **ফাউল পক্স,** সাথে ডিম পাড়ার আগে বুস্টার। ঠিক বয়সে, ঠান্ডা ধারা বজায় রেখে আর ঠিক পদ্ধতিতে (চোখে ফোঁটা, পানিতে বা ইনজেকশন) টিকা দিন। রক্ত আমাশয় (ককসিডিওসিস) ঠেকাতে লিটার শুকনো রাখুন।

## জায়গা

মেঝের জায়গার মতোই খাবার ও পানির পাত্রের যথেষ্ট জায়গা জরুরি। গাদাগাদি পুলেট অসমানভাবে বাড়ে, কারণ দুর্বলগুলো খাবারের কাছে যেতে পারে না।

## পুরো বাড়ন্ত সময়ের রেকর্ড

বাচ্চা আসার দিনেই **FarmFlows**-এ **লেয়ার ব্যাচ** পাতায় ব্যাচ তৈরি করুন, **দৈনিক হিসাব**-এ প্রতিদিনের খাবার ও মৃত্যু আর **মুরগির স্বাস্থ্য**-এ প্রতিটি টিকা লিখুন। ডিম পাড়া শুরু হলে একই ব্যাচে পুরো ইতিহাস থেকে যায়।

## সংক্ষেপে চেকলিস্ট

- ১২–২৪ ঘণ্টা আগে গরম করুন; ১ম সপ্তাহে ৩২–৩৫ °C
- শুধু থার্মোমিটার নয়, বাচ্চার আচরণ দেখুন
- স্টার্টার → গ্রোয়ার → প্রি-লে → লেয়ার, ধীরে বদল
- ৪র্থ সপ্তাহ থেকে সাপ্তাহিক ওজন, সমতা ৮০%+
- লক্ষ্য ওজনে পৌঁছালেই আলো বাড়ানো
- সময়মতো টিকা, শুকনো লিটার
$s$);

-- 8 -------------------------------------------------------------------
insert into _more_articles values (
$s$milk-fever-in-cows-signs-and-prevention$s$, 'cattle-health', array['milk-fever', 'calf-care'], interval '29 days',
$s$Milk fever in cows: early signs, emergency steps and prevention$s$,
$s$গাভীর দুধ জ্বর (মিল্ক ফিভার): শুরুর লক্ষণ, জরুরি করণীয় ও প্রতিরোধ$s$,
$s$A cow that goes down soon after calving may have milk fever, a calcium shortage that can kill within hours. How to recognise it early, what to do, and how to prevent it.$s$,
$s$বাচ্চা দেওয়ার পরপর গাভী শুয়ে পড়লে দুধ জ্বর হতে পারে, ক্যালসিয়ামের অভাব যা কয়েক ঘণ্টায় মেরে ফেলতে পারে। আগেভাগে চেনা, করণীয় আর প্রতিরোধের উপায়।$s$,
$s$Despite its name, milk fever is **not a fever**; the body temperature is usually normal or low. It happens when blood calcium falls suddenly around calving, because the udder starts pulling large amounts of calcium into colostrum faster than the cow can supply it. Muscles, including the heart, cannot work without calcium, so the cow becomes weak and goes down.

## Which cows are at risk?

- Cows in their **third calving or later**
- **High-yielding** cows, especially crossbreds
- Cows that are **too fat** at calving
- Cows that had milk fever before
- Most cases happen **within 72 hours of calving**, often in the first day

## Signs, stage by stage

| Stage | What you see |
| --- | --- |
| 1. Early | Restless, shaky, stiff legs, stops eating, may grind teeth; still standing |
| 2. Down | Lying on her chest, cannot get up, head turned towards her flank, cold ears, dry nose, no dung |
| 3. Severe | Lying flat on her side, bloated, barely responsive; death can follow within hours |

> The earlier the treatment, the better the chance. A cow treated in stage 1 or 2 usually recovers quickly.

## What to do: an emergency

1. **Call the vet immediately.** The standard treatment is calcium given slowly into a vein, and it must be done by a trained person: calcium given too fast can stop the heart.
2. While you wait, **prop the cow up on her chest** with straw bales or sacks, with her head turned to one side. This stops bloat and prevents her from inhaling stomach contents.
3. **Do not pour drinks or medicine into the mouth** of a cow that is down; she may choke.
4. Keep her in shade and on soft, dry bedding; turn her from side to side every few hours if she stays down.
5. After treatment, follow the vet's advice on oral calcium and on how much to milk for the next day or two.

## Prevention starts in the dry period

- **Keep cows at a moderate body condition** at drying off and calving, neither thin nor fat.
- **Watch the dry-cow diet in the last 3 weeks before calving.** Too much calcium in this period (for example, a lot of legume fodder or calcium supplements) makes milk fever **more** likely, because the cow's body "switches off" its own calcium release. Ask your vet or nutritionist to balance the close-up dry cow ration.
- Give good-quality forage and the right minerals; magnesium is important for calcium balance.
- For high-risk cows, ask your vet about **oral calcium** (gel or bolus) given at calving and again 12–24 hours later.
- Make sure fresh cows eat well after calving: clean water, fresh feed, a comfortable calving area.

## Related problems

A cow with milk fever is more likely to have a retained placenta, uterine infection, mastitis and a displaced stomach in the following weeks. Watch her closely and record any problems.

## Use your records to predict

In **FarmFlows**, the **Breeding** page shows expected calving dates and dry-off dates for every pregnant cow. Mark the high-risk ones (older, high-yielding, or with a history of milk fever) in their notes, prepare in advance, and record any case under **Health** so you know which cows to watch next time.

## Quick checklist

- Watch high-risk cows closely for 3 days after calving
- Shaky, down, head to flank, cold ears = call the vet now
- Prop a down cow on her chest; nothing into the mouth
- IV calcium only by a trained person
- Moderate body condition and a balanced close-up dry-cow ration
- Oral calcium at calving for high-risk cows, as your vet advises
$s$,
$s$নামে জ্বর হলেও দুধ জ্বর **আসলে জ্বর নয়;** শরীরের তাপমাত্রা সাধারণত স্বাভাবিক বা কম থাকে। বাচ্চা দেওয়ার সময় রক্তের ক্যালসিয়াম হঠাৎ কমে গেলে এটা হয়, কারণ ওলান শাল দুধ বানাতে এত দ্রুত ক্যালসিয়াম টানে যে গাভীর শরীর তা জোগাতে পারে না। ক্যালসিয়াম ছাড়া হৃদপিণ্ডসহ কোনো মাংসপেশি কাজ করে না, তাই গাভী দুর্বল হয়ে শুয়ে পড়ে।

## কোন গাভীর ঝুঁকি বেশি?

- **তৃতীয় বা তার পরের বাচ্চা** দেওয়া গাভী
- **বেশি দুধের** গাভী, বিশেষ করে শংকর
- বাচ্চা দেওয়ার সময় **বেশি মোটা** গাভী
- আগে দুধ জ্বর হয়েছে এমন গাভী
- বেশিরভাগ ঘটনা ঘটে **বাচ্চা দেওয়ার ৭২ ঘণ্টার মধ্যে,** প্রায়ই প্রথম দিনেই

## ধাপে ধাপে লক্ষণ

| ধাপ | কী দেখবেন |
| --- | --- |
| ১. শুরু | অস্থির, কাঁপুনি, পা শক্ত, খাওয়া বন্ধ, দাঁত কিড়মিড় করতে পারে; তখনো দাঁড়িয়ে |
| ২. শুয়ে পড়া | বুকে ভর দিয়ে শুয়ে, উঠতে পারে না, মাথা পেটের দিকে ঘোরানো, কান ঠান্ডা, নাক শুকনো, গোবর বন্ধ |
| ৩. গুরুতর | এক পাশে কাত হয়ে পড়ে থাকা, পেট ফাঁপা, প্রায় সাড়া নেই; কয়েক ঘণ্টায় মৃত্যু হতে পারে |

> চিকিৎসা যত আগে, বাঁচার সম্ভাবনা তত বেশি। ১ম বা ২য় ধাপে চিকিৎসা পেলে গাভী সাধারণত দ্রুত সেরে ওঠে।

## করণীয়: এটা জরুরি অবস্থা

1. **সঙ্গে সঙ্গে চিকিৎসক ডাকুন।** প্রচলিত চিকিৎসা হলো শিরায় ধীরে ধীরে ক্যালসিয়াম দেওয়া, আর তা প্রশিক্ষিত ব্যক্তিকেই দিতে হবে: খুব দ্রুত ক্যালসিয়াম দিলে হৃদপিণ্ড থেমে যেতে পারে।
2. অপেক্ষার সময় খড়ের আঁটি বা বস্তা দিয়ে **গাভীকে বুকে ভর দিয়ে বসিয়ে রাখুন,** মাথা এক পাশে ঘোরানো। এতে পেট ফাঁপা ও পেটের জিনিস শ্বাসনালীতে যাওয়া ঠেকানো যায়।
3. **শুয়ে থাকা গাভীর মুখে পানি বা ওষুধ ঢালবেন না;** গলায় আটকে যেতে পারে।
4. ছায়ায়, নরম শুকনো বিছানায় রাখুন; শুয়েই থাকলে কয়েক ঘণ্টা পর পর পাশ বদলে দিন।
5. চিকিৎসার পরে মুখে খাওয়ানোর ক্যালসিয়াম আর পরের এক-দুই দিন কতটা দোহন করবেন, সে বিষয়ে চিকিৎসকের পরামর্শ মানুন।

## প্রতিরোধ শুরু হয় দুধ শুকানোর সময় থেকে

- দুধ শুকানো ও বাচ্চা দেওয়ার সময় গাভীর **শরীর মাঝারি রাখুন,** রোগাও নয়, মোটাও নয়।
- **বাচ্চা দেওয়ার আগের শেষ ৩ সপ্তাহের খাবার খেয়াল করুন।** এ সময় বেশি ক্যালসিয়াম (যেমন প্রচুর ডালজাতীয় ঘাস বা ক্যালসিয়াম সাপ্লিমেন্ট) দিলে দুধ জ্বর **বেশি** হয়, কারণ শরীর নিজের ক্যালসিয়াম ছাড়ার ব্যবস্থা "বন্ধ" করে দেয়। প্রসবের কাছাকাছি শুকনো গাভীর খাবার ঠিক করতে চিকিৎসক বা পুষ্টিবিদের পরামর্শ নিন।
- ভালো মানের আঁশজাতীয় খাবার আর ঠিক খনিজ দিন; ক্যালসিয়ামের ভারসাম্যে ম্যাগনেসিয়াম জরুরি।
- বেশি ঝুঁকির গাভীর জন্য বাচ্চা দেওয়ার সময় আর ১২–২৪ ঘণ্টা পরে **মুখে খাওয়ানোর ক্যালসিয়াম** (জেল বা বোলাস) নিয়ে চিকিৎসকের সাথে কথা বলুন।
- বাচ্চা দেওয়ার পর গাভী যেন ভালোভাবে খায়: পরিষ্কার পানি, টাটকা খাবার, আরামদায়ক প্রসবের জায়গা।

## সাথে আসা সমস্যা

দুধ জ্বর হওয়া গাভীর পরের কয়েক সপ্তাহে ফুল আটকে যাওয়া, জরায়ুর সংক্রমণ, ওলান ফোলা আর পাকস্থলী সরে যাওয়ার ঝুঁকি বেশি। কাছ থেকে নজর রাখুন, যেকোনো সমস্যা লিখে রাখুন।

## রেকর্ড দিয়ে আগাম প্রস্তুতি

**FarmFlows**-এর **প্রজনন** পাতায় প্রতিটি গাভিন গাভীর সম্ভাব্য বাচ্চা দেওয়ার আর দুধ শুকানোর তারিখ দেখা যায়। বেশি ঝুঁকির গাভীর (বয়স্ক, বেশি দুধের, বা আগে দুধ জ্বর হয়েছে) নোটে চিহ্ন দিয়ে আগে থেকেই প্রস্তুত থাকুন, আর প্রতিটি ঘটনা **স্বাস্থ্য** পাতায় লিখুন, যাতে পরের বার কোন গাভীর দিকে নজর দিতে হবে জানা থাকে।

## সংক্ষেপে চেকলিস্ট

- বাচ্চা দেওয়ার পর ৩ দিন ঝুঁকির গাভীর দিকে কড়া নজর
- কাঁপুনি, শুয়ে পড়া, মাথা পেটের দিকে, কান ঠান্ডা = এখনই চিকিৎসক
- শুয়ে পড়া গাভীকে বুকে ভর দিয়ে বসান; মুখে কিছু নয়
- শিরায় ক্যালসিয়াম শুধু প্রশিক্ষিত ব্যক্তি দেবেন
- মাঝারি শরীর আর প্রসবের আগের সুষম খাবার
- চিকিৎসকের পরামর্শে ঝুঁকির গাভীকে প্রসবের সময় মুখে ক্যালসিয়াম
$s$);

-- 9 -------------------------------------------------------------------
insert into _more_articles values (
$s$how-to-buy-a-good-dairy-cow$s$, 'farm-business', array['buying-cattle', 'mastitis', 'farm-records'], interval '31 days',
$s$How to buy a good dairy cow: 10 checks before you pay$s$,
$s$ভালো দুধেল গাভী কেনার নিয়ম: টাকা দেওয়ার আগে ১০টি যাচাই$s$,
$s$A cow is the biggest purchase on a small dairy farm. Ten practical checks (age, udder, real milk yield, health and history) so you don't pay for someone else's problem.$s$,
$s$ছোট দুগ্ধ খামারে সবচেয়ে বড় কেনাকাটা একটা গাভী। বয়স, ওলান, আসল দুধ, স্বাস্থ্য ও ইতিহাস: অন্যের সমস্যা যাতে টাকা দিয়ে কিনে না আনেন, তার ১০টি বাস্তব যাচাই।$s$,
$s$Buying a cow at the market is often rushed: the seller is in a hurry, there are other buyers, and the cow's udder looks full. Many farmers later discover low milk, an infected quarter or a cow that won't get pregnant. Take your time, and if possible bring an experienced farmer or a vet with you.

## 1. Buy from a known source

A cow from a known farm with records is safer than one from a trader who bought her last week. Ask why the cow is being sold. "Too many cows" is a better answer than no answer.

## 2. Check the age by the teeth

Cattle have no upper front teeth; look at the **lower front teeth (incisors)**. Calves have small milk teeth; the broad permanent teeth come in pairs:

| Permanent front teeth | Approximate age |
| --- | --- |
| 2 | About 2 years |
| 4 | About 2.5–3 years |
| 6 | About 3–3.5 years |
| 8 | About 4 years or more |

Worn, spaced or missing teeth suggest an old cow. A cow in her **first to third lactation** is usually the best buy.

## 3. Watch her being milked, twice

The most common trick is to leave a cow unmilked before the sale so the udder looks huge. If you can, **watch her milked in the evening and again the next morning** and measure the milk. That is her real daily yield.

## 4. Examine the udder

- Four quarters of similar size, firmly attached, not hanging very low
- Soft and pliable **after milking** (a hard, lumpy udder after milking suggests old mastitis)
- Four teats of normal size, evenly placed, without injuries; check that milk flows from **each** teat
- Check the first milk from each teat in a strip cup and, if possible, do a **CMT test** for hidden mastitis

## 5. Check general health

- Bright eyes, moist nose, alert and curious
- Normal breathing at rest, no cough or nasal discharge
- Shiny coat; no lumps, wounds or ringworm patches
- Normal dung, not watery
- Takes the temperature if you can: normal is roughly 38–39 °C

## 6. Watch her walk

Ask the seller to walk her. Limping, swollen joints or overgrown hooves cost money and lower milk.

## 7. Body condition

She should be neither thin with sharp hip bones nor very fat. A very thin cow may be sick or wormy; a very fat dry cow is at risk at calving.

## 8. Breeding status

- When did she last calve? When is she due?
- Has she been inseminated, and how many times? A cow that needed many services may have a fertility problem.
- If she is said to be pregnant, ask for a **pregnancy check** by a vet before paying a pregnant-cow price.

## 9. Vaccination and treatment records

Ask for dates of FMD, HS, BQ, anthrax and LSD vaccines, deworming and any treatments. No records means you should vaccinate and deworm her after purchase.

## 10. Temperament

Milk her yourself or watch closely. A cow that kicks, won't let down milk or panics in the shed makes every day harder.

## After you buy

1. **Quarantine** her away from your herd for 2–3 weeks.
2. Deworm, then vaccinate as your vet advises.
3. Introduce new feed slowly.
4. Record everything from day one.

## Make the cow part of your records

In **FarmFlows**, add the new cow under **Cattle** with her purchase date and price, record the payment as an expense under **Finance**, note the seller's old tag in the notes, and start recording her milk on day one. After a month you'll know exactly whether she was worth the price.

## Quick checklist

- Known source; ask why she is sold
- Age by teeth; first to third lactation is ideal
- Watch two milkings and measure
- Soft udder after milking, four working teats, CMT
- Healthy, walks well, moderate body condition
- Breeding and vaccination history; vet pregnancy check
- Quarantine 2–3 weeks after purchase
$s$,
$s$হাটে গাভী কেনা প্রায়ই তাড়াহুড়োয় হয়: বিক্রেতার তাড়া, অন্য ক্রেতা আছে, আর গাভীর ওলান ভরা দেখায়। পরে অনেকে দেখেন দুধ কম, একটা বাঁটে সংক্রমণ, বা গাভী গর্ভধারণ করছে না। সময় নিন, আর সম্ভব হলে অভিজ্ঞ খামারি বা পশু চিকিৎসককে সাথে নিন।

## ১. পরিচিত জায়গা থেকে কিনুন

রেকর্ডসহ পরিচিত খামারের গাভী গত সপ্তাহে কেনা ব্যাপারীর গাভীর চেয়ে নিরাপদ। জিজ্ঞেস করুন কেন বিক্রি করা হচ্ছে। "গরু বেশি হয়ে গেছে" কোনো উত্তর না পাওয়ার চেয়ে ভালো উত্তর।

## ২. দাঁত দেখে বয়স যাচাই

গরুর ওপরের সামনের দাঁত নেই; **নিচের সামনের দাঁত** দেখুন। বাছুরের ছোট দুধদাঁত থাকে; চওড়া স্থায়ী দাঁত জোড়ায় জোড়ায় ওঠে:

| স্থায়ী সামনের দাঁত | আনুমানিক বয়স |
| --- | --- |
| ২টি | প্রায় ২ বছর |
| ৪টি | প্রায় ২.৫–৩ বছর |
| ৬টি | প্রায় ৩–৩.৫ বছর |
| ৮টি | প্রায় ৪ বছর বা বেশি |

ক্ষয়ে যাওয়া, ফাঁকা বা পড়ে যাওয়া দাঁত মানে বয়স্ক গাভী। **প্রথম থেকে তৃতীয় দুধের মৌসুমের** গাভী সাধারণত সবচেয়ে ভালো কেনা।

## ৩. দুবার দোহন দেখুন

সবচেয়ে প্রচলিত কৌশল হলো বিক্রির আগে দোহন না করে ওলান বড় দেখানো। সম্ভব হলে **সন্ধ্যায় আর পরদিন সকালে দোহন দেখে** দুধ মেপে নিন। সেটাই গাভীর আসল দৈনিক দুধ।

## ৪. ওলান পরীক্ষা

- চার ভাগ প্রায় সমান, শক্তভাবে লাগানো, খুব বেশি ঝুলে পড়া নয়
- **দোহনের পরে** নরম ও নমনীয় (দোহনের পরেও শক্ত, দলাদলা ওলান পুরনো ওলান ফোলার লক্ষণ)
- চারটা স্বাভাবিক আকারের বাঁট, সমান দূরত্বে, আঘাত নেই; **প্রতিটি** বাঁট দিয়ে দুধ আসে কি না দেখুন
- প্রতিটি বাঁটের প্রথম দুধ স্ট্রিপ কাপে দেখুন, সম্ভব হলে লুকানো ওলান ফোলার জন্য **CMT পরীক্ষা** করুন

## ৫. সাধারণ স্বাস্থ্য

- উজ্জ্বল চোখ, ভেজা নাক, সজাগ ও কৌতূহলী
- বিশ্রামে স্বাভাবিক শ্বাস, কাশি বা নাক দিয়ে পানি নেই
- চকচকে লোম; গুটি, ক্ষত বা দাদের দাগ নেই
- স্বাভাবিক গোবর, পাতলা নয়
- সম্ভব হলে তাপমাত্রা মাপুন: স্বাভাবিক প্রায় ৩৮–৩৯ °C

## ৬. হাঁটা দেখুন

বিক্রেতাকে গাভী হাঁটাতে বলুন। খোঁড়ানো, গিঁট ফোলা বা বড় হয়ে যাওয়া খুর খরচ বাড়ায়, দুধ কমায়।

## ৭. শরীরের অবস্থা

কোমরের হাড় বেরিয়ে থাকা রোগা বা খুব মোটা কোনোটাই নয়। খুব রোগা গাভী অসুস্থ বা কৃমিযুক্ত হতে পারে; খুব মোটা শুকনো গাভীর বাচ্চা দেওয়ার সময় ঝুঁকি থাকে।

## ৮. প্রজননের অবস্থা

- শেষ বাচ্চা কবে হয়েছে? পরেরটা কবে?
- কৃত্রিম প্রজনন হয়েছে কি, কতবার? অনেকবার লাগলে গর্ভধারণে সমস্যা থাকতে পারে।
- গাভিন বলা হলে, গাভিনের দাম দেওয়ার আগে চিকিৎসক দিয়ে **গর্ভ পরীক্ষা** করান।

## ৯. টিকা ও চিকিৎসার রেকর্ড

ক্ষুরা, গলাফোলা, বাদলা, তড়কা আর লাম্পি স্কিনের টিকা, কৃমিনাশক ও চিকিৎসার তারিখ চান। রেকর্ড না থাকলে কেনার পর কৃমিনাশক ও টিকা দিন।

## ১০. মেজাজ

নিজে দোহন করে দেখুন বা কাছ থেকে দেখুন। যে গাভী লাথি মারে, দুধ ছাড়ে না বা ঘরে আতঙ্কিত হয়, সে প্রতিদিনের কাজ কঠিন করে।

## কেনার পরে

1. ২–৩ সপ্তাহ পাল থেকে **আলাদা** রাখুন।
2. কৃমিনাশক দিন, তারপর চিকিৎসকের পরামর্শে টিকা।
3. নতুন খাবার ধীরে ধীরে দিন।
4. প্রথম দিন থেকেই সব লিখে রাখুন।

## গাভীকে রেকর্ডের অংশ করুন

**FarmFlows**-এ **গবাদিপশু** পাতায় কেনার তারিখ ও দামসহ নতুন গাভী যোগ করুন, দামটা **হিসাব** পাতায় খরচ হিসেবে লিখুন, বিক্রেতার পুরনো ট্যাগ নোটে লিখুন, আর প্রথম দিন থেকেই দুধ লিখুন। এক মাস পরেই পরিষ্কার বুঝবেন দামটা ঠিক ছিল কি না।

## সংক্ষেপে চেকলিস্ট

- পরিচিত উৎস; কেন বিক্রি জিজ্ঞেস করুন
- দাঁতে বয়স; প্রথম থেকে তৃতীয় মৌসুম আদর্শ
- দুবার দোহন দেখে মাপুন
- দোহনের পরে নরম ওলান, চারটা কার্যকর বাঁট, CMT
- সুস্থ, ঠিকমতো হাঁটে, মাঝারি শরীর
- প্রজনন ও টিকার ইতিহাস; চিকিৎসক দিয়ে গর্ভ পরীক্ষা
- কেনার পর ২–৩ সপ্তাহ আলাদা রাখা
$s$);

-- 10 ------------------------------------------------------------------
insert into _more_articles values (
$s$cow-dung-compost-vermicompost-biogas-income$s$, 'farm-business', array['manure', 'biogas', 'profit'], interval '33 days',
$s$Turn cow dung into money: compost, vermicompost and biogas$s$,
$s$গোবর থেকে বাড়তি আয়: কম্পোস্ট, কেঁচো সার ও বায়োগ্যাস$s$,
$s$Every cow produces a lot of dung each day. Handled well, it becomes fertiliser, cooking gas and extra income instead of smell and flies. Three practical options compared.$s$,
$s$প্রতিটি গরু প্রতিদিন অনেক গোবর দেয়। ঠিকমতো কাজে লাগালে দুর্গন্ধ ও মাছির বদলে হয় সার, রান্নার গ্যাস আর বাড়তি আয়। তিনটি বাস্তব উপায়ের তুলনা।$s$,
$s$An adult cow produces roughly **10–20 kg of fresh dung a day**, depending on its size and feed. On a farm with five cows, that is more than a tonne a month. Left in a heap, it smells, breeds flies, loses most of its nutrients to rain and sun, and annoys the neighbours. Managed properly, it can feed your crops and fodder, cook your food and even bring in cash.

## Option 1: Simple compost pit

The cheapest start.

1. Dig a pit (for example 2–3 m long, 1–1.5 m wide, about 1 m deep) on high ground, under a roof or a cover so rain doesn't wash it out.
2. Add dung in layers, mixing in straw, leftover fodder and leaves.
3. Keep it **moist but not wet**, like a squeezed sponge.
4. Turn the heap every few weeks to let air in.
5. In about **2–3 months** it becomes dark, crumbly compost that smells of soil.

Use it on your **Napier and fodder plots**, vegetables and fruit trees. Well-rotted compost is better than fresh dung, which can burn young plants and carries weed seeds.

## Option 2: Vermicompost (earthworm compost)

Vermicompost is finer and richer than ordinary compost, and many vegetable and nursery growers buy it.

- Use **red composting earthworms** (often sold as "red wigglers", *Eisenia fetida*), not ordinary soil earthworms.
- Use dung that is **a few weeks old** (fresh dung heats up and can kill the worms).
- Keep the bed in **shade**, in a cement ring, tank or brick bed with drainage; cover it with sacks.
- Keep it moist; protect it from ants, rats, birds and flooding.
- In about **45–60 days** the top turns into dark, granular vermicompost. Stop watering for a few days, collect the top layer, and sieve it.
- Separate the worms and use them to start new beds; extra worms can be sold too.

## Option 3: Biogas plant

A biogas plant turns dung into **cooking gas** and leaves a liquid **slurry** that is an excellent fertiliser.

- A small family plant often needs the dung of about **3–5 cows** a day, mixed with an equal amount of water.
- It can provide cooking gas for a family every day, replacing firewood, LPG cylinders or dung cakes, which means less smoke in the kitchen.
- The **slurry** can go straight onto fodder fields or into the compost pit.
- Building a plant costs money up front, so ask your upazila livestock or agriculture office, or local development organisations, whether a support or loan programme is available in your area.

## Which one is right for you?

| | Compost pit | Vermicompost | Biogas |
| --- | --- | --- | --- |
| Start-up cost | Very low | Low | Medium to high |
| Work | Turning now and then | Daily care of the bed | Daily feeding with dung and water |
| Product | Compost | High-value vermicompost + worms | Cooking gas + slurry fertiliser |
| Best for | Every farm | Farms that can sell to vegetable growers or nurseries | Farms with 3+ cows and a family kitchen nearby |

Many farms combine them: biogas for the kitchen, slurry and extra dung to compost or vermicompost, and the fertiliser on fodder plots.

## Health and neighbours

- Keep dung heaps and pits away from wells, ponds and the house.
- Cover them to reduce flies and smell.
- Wash hands after handling dung.

## Count it as income

Sales of compost, vermicompost or worms, and the money you save on gas and fertiliser, are real income from your farm. Record them in **FarmFlows → Finance** as income so your farm's profit report shows the full picture.

## Quick checklist

- 10–20 kg of dung per cow per day: don't waste it
- Compost: covered pit, layers, moist, turned, ready in 2–3 months
- Vermicompost: red worms, partly rotted dung, shade, 45–60 days
- Biogas: dung of 3–5 cows for a family plant; slurry as fertiliser
- Record sales and savings as income
$s$,
$s$একটা বড় গরু আকার ও খাবার অনুযায়ী দিনে মোটামুটি **১০–২০ কেজি কাঁচা গোবর** দেয়। পাঁচটা গরুর খামারে মাসে এক টনেরও বেশি। স্তূপ করে ফেলে রাখলে দুর্গন্ধ হয়, মাছি জন্মায়, রোদে-বৃষ্টিতে বেশিরভাগ পুষ্টি নষ্ট হয়, প্রতিবেশীও বিরক্ত হন। ঠিকমতো ব্যবহার করলে এটা ফসল ও ঘাসের খাবার হয়, রান্না চালায়, এমনকি নগদ আয়ও আনে।

## উপায় ১: সাধারণ কম্পোস্ট গর্ত

শুরু করার সবচেয়ে সস্তা উপায়।

1. উঁচু জমিতে একটা গর্ত খুঁড়ুন (যেমন ২–৩ মিটার লম্বা, ১–১.৫ মিটার চওড়া, প্রায় ১ মিটার গভীর), ওপরে চালা বা ঢাকনা দিন যাতে বৃষ্টিতে ধুয়ে না যায়।
2. স্তরে স্তরে গোবর দিন, সাথে খড়, বেঁচে যাওয়া ঘাস ও পাতা মেশান।
3. **ভেজা, কিন্তু কাদা নয়** এমন রাখুন, চিপে নেওয়া স্পঞ্জের মতো।
4. কয়েক সপ্তাহ পর পর উল্টে দিন, যাতে বাতাস ঢোকে।
5. প্রায় **২–৩ মাসে** এটা মাটির গন্ধওয়ালা কালো, ঝুরঝুরে কম্পোস্ট হয়ে যায়।

**নেপিয়ার ও ঘাসের জমি,** সবজি আর ফলগাছে ব্যবহার করুন। কাঁচা গোবরের চেয়ে ভালোভাবে পচা কম্পোস্ট ভালো; কাঁচা গোবর চারা পুড়িয়ে দিতে পারে, আগাছার বীজও আনে।

## উপায় ২: কেঁচো সার (ভার্মিকম্পোস্ট)

কেঁচো সার সাধারণ কম্পোস্টের চেয়ে মিহি ও বেশি পুষ্টিকর, আর অনেক সবজি চাষি ও নার্সারি এটা কেনেন।

- **লাল কম্পোস্ট কেঁচো** ব্যবহার করুন (প্রায়ই "রেড উইগলার", *Eisenia fetida* নামে বিক্রি হয়), মাটির সাধারণ কেঁচো নয়।
- **কয়েক সপ্তাহ পুরনো** গোবর দিন (কাঁচা গোবর গরম হয়ে কেঁচো মেরে ফেলতে পারে)।
- বেড **ছায়ায়** রাখুন: সিমেন্টের রিং, চৌবাচ্চা বা পানি বের হওয়ার ব্যবস্থাসহ ইটের বেড; ওপরে চট দিয়ে ঢাকুন।
- ভেজা রাখুন; পিঁপড়া, ইঁদুর, পাখি আর বন্যার পানি থেকে বাঁচান।
- প্রায় **৪৫–৬০ দিনে** ওপরের অংশ কালো, দানাদার কেঁচো সারে পরিণত হয়। কয়েক দিন পানি দেওয়া বন্ধ রেখে ওপরের স্তর তুলে চেলে নিন।
- কেঁচো আলাদা করে নতুন বেড শুরু করুন; বাড়তি কেঁচোও বিক্রি করা যায়।

## উপায় ৩: বায়োগ্যাস প্লান্ট

বায়োগ্যাস প্লান্ট গোবরকে **রান্নার গ্যাসে** পরিণত করে, আর পড়ে থাকা তরল **স্লারি** চমৎকার সার।

- পরিবারের ছোট প্লান্টে সাধারণত প্রতিদিন প্রায় **৩–৫টি গরুর** গোবর, সমান পানিতে মিশিয়ে লাগে।
- এতে একটা পরিবারের প্রতিদিনের রান্নার গ্যাস হতে পারে: লাকড়ি, এলপিজি সিলিন্ডার বা ঘুঁটের বদলে, রান্নাঘরে ধোঁয়াও কম।
- **স্লারি** সরাসরি ঘাসের জমিতে বা কম্পোস্ট গর্তে দেওয়া যায়।
- প্লান্ট বানাতে শুরুতে খরচ আছে, তাই আপনার এলাকায় সহায়তা বা ঋণ কর্মসূচি আছে কি না উপজেলা প্রাণিসম্পদ বা কৃষি অফিস, কিংবা স্থানীয় উন্নয়ন সংস্থায় খোঁজ নিন।

## আপনার জন্য কোনটা?

| | কম্পোস্ট গর্ত | কেঁচো সার | বায়োগ্যাস |
| --- | --- | --- | --- |
| শুরুর খরচ | খুব কম | কম | মাঝারি থেকে বেশি |
| কাজ | মাঝে মাঝে উল্টানো | প্রতিদিন বেডের যত্ন | প্রতিদিন গোবর-পানি দেওয়া |
| যা পাবেন | কম্পোস্ট | দামি কেঁচো সার + কেঁচো | রান্নার গ্যাস + স্লারি সার |
| কার জন্য ভালো | সব খামার | যারা সবজি চাষি বা নার্সারিতে বিক্রি করতে পারেন | ৩+ গরু আর কাছেই পরিবারের রান্নাঘর |

অনেক খামার একসাথে করে: রান্নাঘরে বায়োগ্যাস, স্লারি আর বাড়তি গোবর দিয়ে কম্পোস্ট বা কেঁচো সার, আর সেই সার ঘাসের জমিতে।

## স্বাস্থ্য ও প্রতিবেশী

- গোবরের স্তূপ ও গর্ত টিউবওয়েল, পুকুর আর বাড়ি থেকে দূরে রাখুন।
- মাছি ও দুর্গন্ধ কমাতে ঢেকে রাখুন।
- গোবর ধরার পর হাত ধুয়ে নিন।

## এটাও আয় হিসেবে ধরুন

কম্পোস্ট, কেঁচো সার বা কেঁচো বিক্রি, আর গ্যাস ও সারে বাঁচানো টাকা খামারের আসল আয়। **FarmFlows → হিসাব** পাতায় আয় হিসেবে লিখুন, যাতে খামারের লাভের রিপোর্টে পুরো চিত্র দেখা যায়।

## সংক্ষেপে চেকলিস্ট

- প্রতি গরু দিনে ১০–২০ কেজি গোবর: নষ্ট করবেন না
- কম্পোস্ট: ঢাকা গর্ত, স্তর, ভেজা, উল্টানো, ২–৩ মাসে তৈরি
- কেঁচো সার: লাল কেঁচো, আধাপচা গোবর, ছায়া, ৪৫–৬০ দিন
- বায়োগ্যাস: পরিবারের প্লান্টে ৩–৫টি গরুর গোবর; স্লারি সার হিসেবে
- বিক্রি ও সাশ্রয় আয় হিসেবে লিখুন
$s$);

-- Insert the articles (skip any slug that already exists) and link them.
insert into public.blog_posts (slug, title_en, title_bn, summary_en, summary_bn, body_en, body_bn, published, published_at, category_id)
select a.slug, a.title_en, a.title_bn, a.summary_en, a.summary_bn, a.body_en, a.body_bn, true, now() - a.age,
       (select c.id from public.blog_categories c where c.slug = a.category)
from _more_articles a
where not exists (select 1 from public.blog_posts p where p.slug = a.slug);

insert into public.blog_post_tags (post_id, tag_id)
select p.id, t.id
from _more_articles a
join public.blog_posts p on p.slug = a.slug
join public.blog_tags t on t.slug = any (a.tags)
on conflict do nothing;

drop table _more_articles;
