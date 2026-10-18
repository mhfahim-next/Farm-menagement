-- =====================================================================
-- Six practical articles for farmers (Bangla + English), with category and tags.
-- Safe to re-run: existing slugs are skipped.
-- =====================================================================

create temporary table _articles (
  slug text, category text, tags text[], age interval,
  title_en text, title_bn text, summary_en text, summary_bn text, body_en text, body_bn text
);

-- 1 -------------------------------------------------------------------
insert into _articles values (
$s$cattle-vaccination-schedule-bangladesh$s$, 'cattle-health', array['vaccination', 'fmd', 'lumpy-skin', 'calf-care'], interval '12 days',
$s$Cattle vaccination schedule in Bangladesh: FMD, HS, BQ, anthrax and lumpy skin$s$,
$s$গরুর টিকার সময়সূচি: ক্ষুরা, গলাফোলা, বাদলা, তড়কা ও লাম্পি স্কিন$s$,
$s$Which vaccines a cow and calf need, at what age, how often, and the simple rules that make a vaccine actually work. With a printable year plan.$s$,
$s$গরু ও বাছুরকে কোন টিকা, কোন বয়সে, কতদিন পর পর দিতে হয় এবং টিকা যাতে সত্যিই কাজ করে তার সহজ নিয়ম। সাথে সারা বছরের পরিকল্পনা।$s$,
$s$One outbreak of foot-and-mouth disease can stop a dairy farm's milk for weeks and kill young calves. A vaccine costs a few taka; treatment and lost milk cost thousands. This guide gives you a clear, year-round plan.

> Vaccine brands, doses and the exact schedule can differ by area. Always confirm with your **Upazila Livestock Office** or a registered vet, who can also tell you about government vaccination campaigns.

## The main vaccines for cattle

| Disease | Local name | First dose | Repeat |
| --- | --- | --- | --- |
| Foot-and-mouth disease (FMD) | ক্ষুরা রোগ | Calf at 4 months, booster 3–4 weeks later | Every 6 months |
| Haemorrhagic septicaemia (HS) | গলাফোলা | Calf at 6 months | Every year, before the rains |
| Black quarter (BQ) | বাদলা | Calf at 6 months | Every year, up to about 3 years of age |
| Anthrax | তড়কা | From 6 months | Every year (most important where anthrax has been seen) |
| Lumpy skin disease (LSD) | লাম্পি স্কিন | As your vet advises | Every year, before the mosquito season |

## Deworming goes with vaccination

Worms weaken the immune system, so a wormy animal responds poorly to a vaccine.

- **Calves:** first deworming within the first month of life, then as your vet advises.
- **Adult cattle:** every 3–4 months, and always about **7–10 days before** a vaccine.
- Rotate the medicine group once a year so the worms don't become resistant.

## 7 rules that make a vaccine work

1. **Vaccinate only healthy animals.** Skip any animal with fever, diarrhoea or poor appetite and do it after it recovers.
2. **Keep the cold chain.** Vaccines must stay at 2–8 °C. Carry them in an ice box, never in a pocket or in the sun.
3. **Use the whole vial the same day.** Opened vials lose their power.
4. **One clean needle per animal** where possible, so you don't spread disease from cow to cow.
5. **Booster doses matter.** A first FMD dose without the booster leaves the calf poorly protected.
6. **Vaccinate the whole herd together.** One unvaccinated animal can bring the disease in for all.
7. **Ask your vet about pregnant cows,** especially in the last months of pregnancy.

## After vaccination

A small swelling at the injection site and a slightly lower appetite for a day are normal. Give clean water and shade. If an animal has trouble breathing, swelling of the face or collapses, call a vet **immediately**.

## A simple year plan

| Month | Work |
| --- | --- |
| January | Deworming for the herd |
| February–March | FMD (round 1), anthrax |
| April | Deworming; HS and BQ before the rains |
| May | LSD before the mosquito season |
| July | Deworming |
| August–September | FMD (round 2) |
| October | Deworming |

Adjust the months to your area's disease season and to government campaigns.

## Keep the record, or you will forget

Write down the date, vaccine, batch number and the next due date for every animal. In **FarmFlows**, open **Health → Add record**, choose the vaccine and set the next due date. The app then shows the cows that are due on the dashboard, so no animal misses a booster.

## Quick checklist

- Deworm 7–10 days before vaccinating
- FMD every 6 months, with a booster for calves
- HS, BQ and anthrax once a year, before the rains
- LSD every year before the mosquito season
- Keep vaccines at 2–8 °C, healthy animals only
- Record every dose and its next due date
$s$,
$s$একবার ক্ষুরা রোগ ছড়ালে দুগ্ধ খামারের দুধ কয়েক সপ্তাহ বন্ধ হয়ে যেতে পারে, ছোট বাছুরও মারা যেতে পারে। একটা টিকার দাম কয়েক টাকা, কিন্তু চিকিৎসা আর নষ্ট দুধের দাম হাজার হাজার টাকা। এই লেখায় সারা বছরের একটা পরিষ্কার টিকা পরিকল্পনা দেওয়া হলো।

> টিকার ব্র্যান্ড, মাত্রা ও সময়সূচি এলাকাভেদে আলাদা হতে পারে। সবসময় আপনার **উপজেলা প্রাণিসম্পদ দপ্তর** বা নিবন্ধিত পশু চিকিৎসকের সাথে মিলিয়ে নিন। সরকারি টিকা ক্যাম্পেইনের খবরও তাঁরাই দেবেন।

## গরুর প্রধান টিকাগুলো

| রোগ | প্রথম ডোজ | পরের ডোজ |
| --- | --- | --- |
| ক্ষুরা রোগ (FMD) | বাছুরের ৪ মাস বয়সে, ৩–৪ সপ্তাহ পর বুস্টার | প্রতি ৬ মাস পর পর |
| গলাফোলা (HS) | বাছুরের ৬ মাস বয়সে | প্রতি বছর, বর্ষার আগে |
| বাদলা (BQ) | বাছুরের ৬ মাস বয়সে | প্রতি বছর, প্রায় ৩ বছর বয়স পর্যন্ত |
| তড়কা (Anthrax) | ৬ মাস বয়স থেকে | প্রতি বছর (যে এলাকায় আগে তড়কা হয়েছে সেখানে অবশ্যই) |
| লাম্পি স্কিন (LSD) | চিকিৎসকের পরামর্শমতো | প্রতি বছর, মশার মৌসুমের আগে |

## টিকার সাথে কৃমিনাশক

কৃমি থাকলে পশুর রোগ প্রতিরোধ ক্ষমতা কমে যায়, তখন টিকাও ঠিকমতো কাজ করে না।

- **বাছুর:** জন্মের প্রথম মাসের মধ্যে প্রথম কৃমিনাশক, তারপর চিকিৎসকের পরামর্শমতো।
- **বড় গরু:** প্রতি ৩–৪ মাস পর পর, আর টিকার **৭–১০ দিন আগে** অবশ্যই।
- বছরে একবার ওষুধের গ্রুপ বদলান, যাতে কৃমি ওষুধ-সহনশীল না হয়ে যায়।

## টিকা কাজে লাগানোর ৭টি নিয়ম

1. **শুধু সুস্থ পশুকে টিকা দিন।** জ্বর, পাতলা পায়খানা বা খাওয়া কম থাকলে সুস্থ হওয়ার পর দিন।
2. **ঠান্ডা ধারা (কোল্ড চেইন) বজায় রাখুন।** টিকা ২–৮ °C তাপমাত্রায় রাখতে হয়। বরফের বাক্সে আনুন, পকেটে বা রোদে নয়।
3. **খোলা ভায়াল সেদিনই শেষ করুন।** খোলা টিকা পরে কার্যক্ষমতা হারায়।
4. **সম্ভব হলে প্রতিটি পশুর জন্য আলাদা পরিষ্কার সুঁই** ব্যবহার করুন, যাতে এক গরু থেকে অন্য গরুতে রোগ না ছড়ায়।
5. **বুস্টার ডোজ বাদ দেবেন না।** ক্ষুরার প্রথম ডোজের পর বুস্টার না দিলে বাছুর ঠিকমতো সুরক্ষিত হয় না।
6. **পুরো পালকে একসাথে টিকা দিন।** একটা টিকাবিহীন পশুই সবার জন্য রোগ নিয়ে আসতে পারে।
7. **গাভিন গাভীর ক্ষেত্রে,** বিশেষ করে শেষ মাসগুলোতে, চিকিৎসকের পরামর্শ নিন।

## টিকার পরে

ইনজেকশনের জায়গায় সামান্য ফোলা আর একদিন একটু কম খাওয়া স্বাভাবিক। পরিষ্কার পানি ও ছায়া দিন। শ্বাসকষ্ট, মুখ ফুলে যাওয়া বা পশু পড়ে গেলে **সঙ্গে সঙ্গে** পশু চিকিৎসক ডাকুন।

## সহজ বার্ষিক পরিকল্পনা

| মাস | কাজ |
| --- | --- |
| জানুয়ারি | পুরো পালের কৃমিনাশক |
| ফেব্রুয়ারি–মার্চ | ক্ষুরা (১ম রাউন্ড), তড়কা |
| এপ্রিল | কৃমিনাশক; বর্ষার আগে গলাফোলা ও বাদলা |
| মে | মশার মৌসুমের আগে লাম্পি স্কিন |
| জুলাই | কৃমিনাশক |
| আগস্ট–সেপ্টেম্বর | ক্ষুরা (২য় রাউন্ড) |
| অক্টোবর | কৃমিনাশক |

আপনার এলাকার রোগের মৌসুম ও সরকারি ক্যাম্পেইন অনুযায়ী মাস একটু আগে-পিছে করে নিন।

## রেকর্ড রাখুন, নইলে ভুলে যাবেন

প্রতিটি পশুর টিকার তারিখ, টিকার নাম, ব্যাচ নম্বর আর পরের তারিখ লিখে রাখুন। **FarmFlows**-এ **স্বাস্থ্য → রেকর্ড যোগ করুন** খুলে টিকা বেছে পরের তারিখ দিন। কোন গরুর টিকা বাকি, অ্যাপ নিজেই ড্যাশবোর্ডে দেখাবে, তাই কোনো বুস্টার বাদ পড়বে না।

## সংক্ষেপে চেকলিস্ট

- টিকার ৭–১০ দিন আগে কৃমিনাশক
- ক্ষুরা প্রতি ৬ মাসে, বাছুরের জন্য বুস্টারসহ
- গলাফোলা, বাদলা, তড়কা বছরে একবার, বর্ষার আগে
- লাম্পি স্কিন প্রতি বছর মশার মৌসুমের আগে
- টিকা ২–৮ °C-এ, শুধু সুস্থ পশুকে
- প্রতিটি ডোজ ও পরের তারিখ রেকর্ডে তুলুন
$s$);

-- 2 -------------------------------------------------------------------
insert into _articles values (
$s$cow-heat-signs-and-best-time-for-ai$s$, 'breeding', array['heat-detection', 'artificial-insemination'], interval '10 days',
$s$Cow heat signs and the best time for artificial insemination (AM–PM rule)$s$,
$s$গাভীর গরম হওয়ার লক্ষণ ও কৃত্রিম প্রজননের সঠিক সময় (সকাল-বিকেল নিয়ম)$s$,
$s$Missing one heat costs about 21 days of milk. Learn the signs of heat, the AM–PM rule for AI timing, and how to stop missing silent heats.$s$,
$s$একবার গরম মিস করা মানে প্রায় ২১ দিনের দুধ হারানো। গরমের লক্ষণ, কৃত্রিম প্রজননের সকাল-বিকেল নিয়ম আর নীরব গরম ধরার উপায় জানুন।$s$,
$s$A cow comes into heat about every **21 days** (anywhere from 18 to 24). Each missed heat pushes her next calving back by three weeks and means three weeks less milk over her life. Good heat detection is the cheapest way to make a dairy farm more profitable.

## Signs of heat

The most reliable sign is **standing heat**: the cow stands still when another cow mounts her. Other signs:

- Clear, stringy mucus from the vulva (like egg white)
- Swollen, red and moist vulva
- Restless, bellows more, walks more than usual
- Mounts other cows, sniffs and licks them
- Milk drops a little for a day; she eats less
- Rubbed hair and dirt on the tail head

> Mounting other cows is a sign of heat, but **standing to be mounted** is the sign to time insemination by.

## When to watch

Heat often starts at night and standing heat lasts only about **12–18 hours** (shorter in hot weather and in high-yielding cows). Watch the herd **at least 3 times a day for 20–30 minutes**: early morning, midday and late evening, when the animals are calm and not eating.

## The AM–PM rule

The egg is released about 10–14 hours **after** standing heat ends, so insemination works best in the second half of heat.

| First seen in standing heat | Inseminate |
| --- | --- |
| Morning | The same evening |
| Afternoon or evening | The next morning |

If you can only call the AI technician once a day, inseminate once about **12 hours** after you first saw standing heat. Inseminating too early or too late is one of the main reasons cows "repeat".

## Silent heat

Some cows ovulate with few or no signs, especially thin cows, cows in the first 2 months after calving, and cows in summer heat. To catch them:

- Use the 21-day calendar: watch extra carefully 18–24 days after the last heat
- Feed enough energy and minerals; thin cows often show weak heat
- Ask your vet to examine cows that have shown no heat 60 days after calving

## After insemination

1. Record the date, time, bull or semen code and the technician's name.
2. Watch for **return to heat 18–24 days later**. If she comes back, she is not pregnant.
3. Have a **pregnancy check** done about 45–60 days after insemination.
4. Expected calving is about **283 days** after the successful insemination.

## Let the app count the days

In **FarmFlows**, record heats and inseminations under **Breeding**. The app works out the next expected heat, the date to check for return to heat, the pregnancy check date and the expected calving date, and shows reminders on your dashboard. Your vet can also see them if you invite them to your farm.

## Quick checklist

- Watch 3 times a day, 20–30 minutes each
- Standing to be mounted = true heat
- Seen in the morning → inseminate in the evening; seen in the evening → next morning
- Watch again 18–24 days later
- Pregnancy check 45–60 days after AI
$s$,
$s$গাভী সাধারণত প্রতি **২১ দিন** পর পর (১৮ থেকে ২৪ দিনের মধ্যে) গরম হয়। একবার গরম মিস করলে পরের বাছুর তিন সপ্তাহ পিছিয়ে যায়, মানে গাভীর জীবনে তিন সপ্তাহের দুধ কম। ঠিকমতো গরম ধরা দুগ্ধ খামারের লাভ বাড়ানোর সবচেয়ে সস্তা উপায়।

## গরমের লক্ষণ

সবচেয়ে নির্ভরযোগ্য লক্ষণ হলো **স্থির হয়ে দাঁড়িয়ে থাকা**: অন্য গরু পিঠে উঠলে গাভী নড়ে না। অন্যান্য লক্ষণ:

- যোনিপথ দিয়ে ডিমের সাদা অংশের মতো স্বচ্ছ, লম্বা সুতার মতো শ্লেষ্মা
- যোনিমুখ ফোলা, লাল ও ভেজা
- অস্থিরতা, বারবার ডাকা, স্বাভাবিকের চেয়ে বেশি হাঁটা
- অন্য গরুর পিঠে ওঠা, শোঁকা ও চাটা
- একদিনের জন্য দুধ একটু কমে যাওয়া, খাওয়া কমে যাওয়া
- লেজের গোড়ায় লোম ঘষা খাওয়া ও ময়লা লাগা

> অন্য গরুর পিঠে ওঠাও গরমের লক্ষণ, কিন্তু প্রজননের সময় ঠিক করবেন **অন্য গরু পিঠে উঠলে স্থির দাঁড়িয়ে থাকা** দেখে।

## কখন খেয়াল রাখবেন

গরম প্রায়ই রাতে শুরু হয়, আর স্থির হয়ে দাঁড়ানোর সময়টা মাত্র **১২–১৮ ঘণ্টা** (গরমকালে ও বেশি দুধের গাভীতে আরও কম)। পালের দিকে **দিনে অন্তত ৩ বার, প্রতিবার ২০–৩০ মিনিট** নজর দিন: ভোরে, দুপুরে আর সন্ধ্যার পরে, যখন পশুরা শান্ত থাকে ও খাচ্ছে না।

## সকাল-বিকেল নিয়ম

স্থির গরম **শেষ হওয়ার** প্রায় ১০–১৪ ঘণ্টা পরে ডিম্বাণু বের হয়। তাই গরমের দ্বিতীয় ভাগে প্রজনন করালে সবচেয়ে ভালো ফল পাওয়া যায়।

| প্রথম কখন স্থির গরম দেখলেন | কখন প্রজনন করাবেন |
| --- | --- |
| সকালে | সেদিন বিকেলে/সন্ধ্যায় |
| দুপুরের পরে বা সন্ধ্যায় | পরদিন সকালে |

দিনে একবারের বেশি টেকনিশিয়ান ডাকা সম্ভব না হলে প্রথম স্থির গরম দেখার প্রায় **১২ ঘণ্টা পরে** একবার প্রজনন করান। খুব আগে বা খুব দেরিতে প্রজনন করানো গাভী "রিপিট" করার অন্যতম বড় কারণ।

## নীরব গরম

কিছু গাভী প্রায় কোনো লক্ষণ ছাড়াই গরম হয়, বিশেষ করে রোগা গাভী, বাচ্চা দেওয়ার পর প্রথম ২ মাসে, আর গরমকালে। এদের ধরতে:

- ২১ দিনের হিসাব রাখুন: আগের গরমের ১৮–২৪ দিন পরে বিশেষ নজর দিন
- পর্যাপ্ত শক্তির খাবার ও খনিজ দিন; রোগা গাভীর গরম দুর্বল হয়
- বাচ্চা দেওয়ার ৬০ দিন পরেও গরম না দেখালে চিকিৎসক দিয়ে পরীক্ষা করান

## প্রজননের পরে

1. তারিখ, সময়, ষাঁড় বা সিমেনের কোড আর টেকনিশিয়ানের নাম লিখে রাখুন।
2. **১৮–২৪ দিন পরে আবার গরম আসে কি না** দেখুন। ফিরে এলে বুঝবেন গাভী গর্ভবতী হয়নি।
3. প্রজননের প্রায় ৪৫–৬০ দিন পরে **গর্ভ পরীক্ষা** করান।
4. সফল প্রজননের প্রায় **২৮৩ দিন** পরে বাচ্চা হওয়ার কথা।

## দিন গোনার কাজ অ্যাপকে দিন

**FarmFlows**-এ **প্রজনন** পাতায় গরম ও কৃত্রিম প্রজনন লিখে রাখুন। পরের গরম কবে, আবার গরম আসছে কি না কবে দেখবেন, গর্ভ পরীক্ষা কবে আর বাচ্চা কবে হবে, অ্যাপ নিজেই হিসাব করে ড্যাশবোর্ডে মনে করিয়ে দেবে। আপনার পশু চিকিৎসককে খামারে যুক্ত করলে তিনিও দেখতে পাবেন।

## সংক্ষেপে চেকলিস্ট

- দিনে ৩ বার, প্রতিবার ২০–৩০ মিনিট নজর
- পিঠে উঠলে স্থির দাঁড়ানো = আসল গরম
- সকালে দেখলে বিকেলে, সন্ধ্যায় দেখলে পরদিন সকালে প্রজনন
- ১৮–২৪ দিন পরে আবার খেয়াল করুন
- প্রজননের ৪৫–৬০ দিন পরে গর্ভ পরীক্ষা
$s$);

-- 3 -------------------------------------------------------------------
insert into _articles values (
$s$how-to-measure-cattle-weight-with-a-tape$s$, 'feed-nutrition', array['cattle-weight', 'fattening', 'qurbani'], interval '8 days',
$s$How to measure cattle weight with a measuring tape (formula + examples)$s$,
$s$ফিতা দিয়ে গরুর ওজন মাপার নিয়ম (সূত্র ও উদাহরণসহ)$s$,
$s$No scale? Measure heart girth and body length with a tape and use one simple formula to estimate live weight within about 5–10%. Worked examples in cm and inches.$s$,
$s$ওজন মাপার যন্ত্র নেই? ফিতা দিয়ে বুকের বেড় আর শরীরের দৈর্ঘ্য মেপে একটা সহজ সূত্রে গরুর ওজন প্রায় ৫–১০% নির্ভুলভাবে বের করুন। সেন্টিমিটার ও ইঞ্চি দুই হিসাবেই উদাহরণ।$s$,
$s$Knowing an animal's weight helps you dose medicine correctly, plan feed, check whether a fattening bull is really gaining, and get a fair price at the market. A cattle scale is expensive, but a **cloth measuring tape** and one formula give a good estimate.

## What to measure

1. **Heart girth:** the distance round the chest, just behind the front legs and shoulder. Pull the tape snug, not tight.
2. **Body length:** from the **point of the shoulder** to the **pin bone** (the bony point beside the tail).

Tips for an accurate reading:

- The animal should stand straight on level ground, head up, all four legs square.
- Measure before feeding in the morning, when the belly is not full.
- Measure twice and take the average.

## The formula

**With centimetres:**

> Weight (kg) = Girth (cm) × Girth (cm) × Length (cm) ÷ 10,838

**With inches:**

> Weight (kg) = Girth (in) × Girth (in) × Length (in) ÷ 660

## Worked examples

| Girth | Length | Calculation | Estimated weight |
| --- | --- | --- | --- |
| 140 cm | 120 cm | 140 × 140 × 120 ÷ 10,838 | about **217 kg** |
| 160 cm | 140 cm | 160 × 160 × 140 ÷ 10,838 | about **331 kg** |
| 180 cm | 155 cm | 180 × 180 × 155 ÷ 10,838 | about **463 kg** |
| 66 in | 56 in | 66 × 66 × 56 ÷ 660 | about **370 kg** |

## How accurate is it?

For grown cattle in normal condition the estimate is usually within **5–10%** of the scale weight. It is less accurate for very young calves, very fat or very thin animals, and cows in late pregnancy. Use the same tape, the same person and the same method each time, so the **change** from month to month is reliable even when the absolute number is a little off.

## Use weight to make decisions

- **Medicine doses** for dewormers and antibiotics are given per kg. Guessing wrong either wastes medicine or under-doses, which breeds resistance.
- **Fattening:** a healthy bull on a good ration should gain about **0.6–1 kg a day**. Weigh every 2–4 weeks. If gain stops, check worms, feed and water.
- **Selling:** carcass meat is roughly half of live weight (more for well-fattened cattle). Knowing the live weight helps you judge an offer.
- **Heifers:** a heifer is ready to breed when she reaches about 60–65% of her expected adult weight, not only by age.

## Let the app do the maths

In **FarmFlows**, open an animal and choose **Add weight → Measuring tape**. Enter girth and length and the app calculates the weight with this formula, keeps a weight history and shows the current weight next to every cow in your list. You can also download all weights as a CSV file.

## Quick checklist

- Girth just behind the front legs, length from shoulder point to pin bone
- Animal standing straight, before the morning feed
- kg = girth² × length ÷ 10,838 (cm)
- Weigh every 2–4 weeks and watch the trend
$s$,
$s$গরুর ওজন জানা থাকলে ঠিক মাত্রায় ওষুধ দেওয়া যায়, খাবারের পরিকল্পনা করা যায়, মোটাতাজা করা ষাঁড় আসলেই বাড়ছে কি না বোঝা যায়, আর হাটে ন্যায্য দাম পাওয়া যায়। ওজনের যন্ত্র দামি, কিন্তু একটা **কাপড়ের মাপার ফিতা** আর একটা সূত্রেই ভালো আন্দাজ পাওয়া যায়।

## কী মাপবেন

1. **বুকের বেড়:** সামনের পা ও কাঁধের ঠিক পেছনে বুকের চারপাশের মাপ। ফিতা টানটান রাখুন, কিন্তু চেপে ধরবেন না।
2. **শরীরের দৈর্ঘ্য:** **কাঁধের সামনের হাড়ের বিন্দু** থেকে **পাছার হাড়** (লেজের পাশের হাড়ের উঁচু বিন্দু) পর্যন্ত।

ঠিক মাপ পেতে:

- গরুকে সমান মাটিতে সোজা করে দাঁড় করান, মাথা উঁচু, চার পা সোজা।
- সকালে খাবার দেওয়ার আগে মাপুন, যখন পেট ভরা থাকে না।
- দুবার মেপে গড় নিন।

## সূত্র

**সেন্টিমিটারে মাপলে:**

> ওজন (কেজি) = বুকের বেড় (সেমি) × বুকের বেড় (সেমি) × দৈর্ঘ্য (সেমি) ÷ ১০,৮৩৮

**ইঞ্চিতে মাপলে:**

> ওজন (কেজি) = বুকের বেড় (ইঞ্চি) × বুকের বেড় (ইঞ্চি) × দৈর্ঘ্য (ইঞ্চি) ÷ ৬৬০

## উদাহরণ

| বুকের বেড় | দৈর্ঘ্য | হিসাব | আনুমানিক ওজন |
| --- | --- | --- | --- |
| ১৪০ সেমি | ১২০ সেমি | ১৪০ × ১৪০ × ১২০ ÷ ১০,৮৩৮ | প্রায় **২১৭ কেজি** |
| ১৬০ সেমি | ১৪০ সেমি | ১৬০ × ১৬০ × ১৪০ ÷ ১০,৮৩৮ | প্রায় **৩৩১ কেজি** |
| ১৮০ সেমি | ১৫৫ সেমি | ১৮০ × ১৮০ × ১৫৫ ÷ ১০,৮৩৮ | প্রায় **৪৬৩ কেজি** |
| ৬৬ ইঞ্চি | ৫৬ ইঞ্চি | ৬৬ × ৬৬ × ৫৬ ÷ ৬৬০ | প্রায় **৩৭০ কেজি** |

## কতটা নির্ভুল?

স্বাভাবিক শরীরের প্রাপ্তবয়স্ক গরুর ক্ষেত্রে এই হিসাব সাধারণত যন্ত্রের ওজনের **৫–১০%** এর মধ্যে থাকে। খুব ছোট বাছুর, খুব মোটা বা খুব রোগা পশু আর শেষ দিকের গাভিন গাভীর ক্ষেত্রে কম নির্ভুল। প্রতিবার একই ফিতা, একই মানুষ আর একই নিয়মে মাপুন। তাহলে সংখ্যা একটু এদিক-ওদিক হলেও মাস থেকে মাসে **কতটা বাড়ল** তা নির্ভরযোগ্য থাকবে।

## ওজন দিয়ে সিদ্ধান্ত নিন

- **ওষুধের মাত্রা:** কৃমিনাশক ও অ্যান্টিবায়োটিক কেজি হিসেবে দেওয়া হয়। আন্দাজে দিলে হয় ওষুধ নষ্ট, নয়তো কম মাত্রা, যাতে জীবাণু ওষুধ-সহনশীল হয়ে যায়।
- **মোটাতাজাকরণ:** ভালো খাবারে সুস্থ ষাঁড়ের দিনে প্রায় **০.৬–১ কেজি** বাড়া উচিত। ২–৪ সপ্তাহ পর পর মাপুন। বাড়া থেমে গেলে কৃমি, খাবার ও পানি দেখুন।
- **বিক্রি:** জীবিত ওজনের মোটামুটি অর্ধেক মাংস হয় (ভালো মোটাতাজা গরুতে একটু বেশি)। জীবিত ওজন জানলে দাম যাচাই করা সহজ।
- **বকনা:** শুধু বয়স নয়, প্রাপ্তবয়স্ক ওজনের প্রায় ৬০–৬৫% হলে বকনা প্রজননের উপযুক্ত হয়।

## হিসাবটা অ্যাপকে করতে দিন

**FarmFlows**-এ পশুর পাতা খুলে **ওজন যোগ করুন → মাপার ফিতা** বাছুন। বুকের বেড় ও দৈর্ঘ্য দিলে অ্যাপ এই সূত্রে ওজন বের করে, ওজনের ইতিহাস রাখে আর তালিকায় প্রতিটি গরুর পাশে বর্তমান ওজন দেখায়। সব ওজন CSV ফাইল হিসেবে ডাউনলোডও করা যায়।

## সংক্ষেপে চেকলিস্ট

- বুকের বেড় সামনের পায়ের ঠিক পেছনে, দৈর্ঘ্য কাঁধের বিন্দু থেকে পাছার হাড় পর্যন্ত
- গরু সোজা দাঁড়িয়ে, সকালের খাবারের আগে
- কেজি = বেড় × বেড় × দৈর্ঘ্য ÷ ১০,৮৩৮ (সেমি)
- ২–৪ সপ্তাহ পর পর মেপে বাড়ার ধারা দেখুন
$s$);

-- 4 -------------------------------------------------------------------
insert into _articles values (
$s$why-layer-egg-production-drops$s$, 'poultry', array['egg-production', 'layer-feed'], interval '6 days',
$s$Why layer egg production drops, and how to bring it back$s$,
$s$লেয়ার মুরগির ডিম কমে যায় কেন, আর কীভাবে আবার বাড়াবেন$s$,
$s$Light, feed, water, heat, disease or age? A step-by-step checklist to find why your layers lay fewer eggs, with the numbers to compare against.$s$,
$s$আলো, খাবার, পানি, গরম, রোগ না বয়স? লেয়ারের ডিম কমার কারণ খুঁজে বের করার ধাপে ধাপে চেকলিস্ট, তুলনার জন্য দরকারি সংখ্যাসহ।$s$,
$s$A sudden fall in eggs is the most common worry on a layer farm. The cause is almost always one of seven things. Work through them in order: the first ones are the quickest and cheapest to fix.

## First, measure it properly

Use **hen-day production**:

> Hen-day % = Eggs collected today ÷ Live hens today × 100

A healthy commercial flock rises to **about 90–95% at peak (around 26–32 weeks of age)** and then falls slowly, by roughly half a percent a week. A drop of **5% or more within a few days** means something is wrong.

## 1. Light

Layers need about **16 hours of light a day**, every day. Too little light, or light that changes suddenly (a power cut, a broken bulb, a new curtain), quickly lowers laying.

- Never reduce day length once the flock is laying.
- Use a timer so lights go on and off at the same time daily.

## 2. Feed

- A layer eats about **110–120 g of feed a day**. Weigh what you give and what is left.
- Layer feed needs about **16–18% protein** and **3.5–4% calcium**. Grower feed or homemade feed without enough calcium gives thin shells and fewer eggs.
- A sudden change of feed brand or a bad batch (mouldy, stale) can drop production within days.

## 3. Water

A hen drinks about **twice as much water as she eats feed**, and more in summer. A blocked nipple line, warm water or a leak can lower eggs within 24 hours. Check every drinker each morning.

## 4. Heat stress

Above about **30 °C**, hens eat less and lay fewer, smaller eggs with weak shells.

- Improve air flow; use fans and keep the roof shaded or insulated.
- Give cool, clean water; vitamin C and electrolytes in the water help on hot days.
- Feed in the cooler hours of early morning and evening.

## 5. Disease

Call your vet quickly if the drop comes with any of these:

- Coughing, sneezing or swollen faces
- Green or watery droppings, sudden deaths
- Soft-shelled, shell-less or misshapen eggs

Newcastle disease (Ranikhet), infectious bronchitis, egg drop syndrome and avian influenza can all stop laying. **Vaccination during rearing** is the best protection; keep the schedule your hatchery or vet gives you.

## 6. Parasites and stress

Worms and red mites quietly steal production. Check birds at night for mites and deworm on schedule. Loud noise, predators, rough handling, moving birds and overcrowding also cause short drops.

## 7. Age

After about 70–75 weeks most flocks are no longer profitable. If production has fallen slowly over months and nothing else is wrong, it is age. Compare **feed cost per egg** with the egg price to decide when to sell the flock.

## A 10-minute daily routine

1. Count eggs and calculate hen-day %.
2. Check lights and every drinker.
3. Weigh the feed given and left over.
4. Note deaths and any sick birds.
5. Look at the shells and droppings.

## Track it in the app

In **FarmFlows**, record daily eggs, feed and deaths for each flock under **Layer flocks → Daily log**. The app shows the laying rate and its trend, so a drop is visible on the first day, and you can record vaccines and medicine under **Flock health**.

## Quick checklist

- 16 hours of light, on a timer
- 110–120 g layer feed per bird, 3.5–4% calcium
- Plenty of cool, clean water
- Shade and air flow above 30 °C
- Vaccines and deworming on schedule
- Watch hen-day % every day
$s$,
$s$হঠাৎ ডিম কমে যাওয়া লেয়ার খামারের সবচেয়ে সাধারণ দুশ্চিন্তা। কারণ প্রায় সবসময় এই সাতটির কোনো একটি। ক্রমানুসারে দেখুন: প্রথমগুলো সবচেয়ে সহজে ও কম খরচে ঠিক করা যায়।

## আগে ঠিকমতো মাপুন

**হেন-ডে উৎপাদন** হিসাব করুন:

> হেন-ডে % = আজকের ডিম ÷ আজকের জীবিত মুরগি × ১০০

সুস্থ বাণিজ্যিক লেয়ারের উৎপাদন **২৬–৩২ সপ্তাহ বয়সে প্রায় ৯০–৯৫%** পর্যন্ত ওঠে, তারপর সপ্তাহে প্রায় আধা শতাংশ করে ধীরে কমে। **কয়েক দিনের মধ্যে ৫% বা তার বেশি** কমলে বুঝবেন কোথাও সমস্যা আছে।

## ১. আলো

লেয়ারের প্রতিদিন প্রায় **১৬ ঘণ্টা আলো** দরকার। আলো কম হলে বা হঠাৎ বদলে গেলে (বিদ্যুৎ চলে যাওয়া, বাল্ব নষ্ট, নতুন পর্দা) দ্রুত ডিম কমে।

- ডিম পাড়া শুরু হলে আলোর সময় কখনো কমাবেন না।
- টাইমার ব্যবহার করুন, যাতে প্রতিদিন একই সময়ে বাতি জ্বলে ও নেভে।

## ২. খাবার

- একটি লেয়ার দিনে প্রায় **১১০–১২০ গ্রাম খাবার** খায়। কত দিলেন আর কত বাকি থাকল মেপে দেখুন।
- লেয়ার খাবারে প্রায় **১৬–১৮% প্রোটিন** আর **৩.৫–৪% ক্যালসিয়াম** থাকা দরকার। গ্রোয়ার খাবার বা কম ক্যালসিয়ামের ঘরে বানানো খাবারে খোসা পাতলা হয়, ডিমও কমে।
- হঠাৎ খাবারের ব্র্যান্ড বদলানো বা খারাপ ব্যাচ (ছত্রাক ধরা, পুরনো) কয়েক দিনের মধ্যেই উৎপাদন কমায়।

## ৩. পানি

মুরগি খাবারের প্রায় **দ্বিগুণ পানি** খায়, গরমকালে আরও বেশি। নিপল লাইন বন্ধ, গরম পানি বা লিক থাকলে ২৪ ঘণ্টার মধ্যেই ডিম কমতে পারে। প্রতিদিন সকালে প্রতিটি পানির পাত্র দেখুন।

## ৪. গরমের চাপ

প্রায় **৩০ °C** এর বেশি তাপমাত্রায় মুরগি কম খায়, কম ও ছোট ডিম পাড়ে, খোসাও দুর্বল হয়।

- বাতাস চলাচল বাড়ান; ফ্যান দিন, ছাদে ছায়া বা ইনসুলেশন দিন।
- ঠান্ডা পরিষ্কার পানি দিন; গরমের দিনে পানিতে ভিটামিন সি ও ইলেক্ট্রোলাইট উপকারী।
- ভোরে আর সন্ধ্যায়, ঠান্ডা সময়ে খাবার দিন।

## ৫. রোগ

ডিম কমার সাথে এগুলোর কোনোটা থাকলে দ্রুত পশু চিকিৎসক ডাকুন:

- কাশি, হাঁচি বা মুখ ফোলা
- সবুজ বা পাতলা পায়খানা, হঠাৎ মৃত্যু
- নরম খোসা, খোসাবিহীন বা বিকৃত ডিম

রানীক্ষেত (নিউক্যাসল), ইনফেকশাস ব্রঙ্কাইটিস, এগ ড্রপ সিনড্রোম আর বার্ড ফ্লু ডিম পাড়া বন্ধ করে দিতে পারে। **বাড়ন্ত অবস্থায় টিকা** দেওয়াই সবচেয়ে বড় সুরক্ষা; হ্যাচারি বা চিকিৎসকের দেওয়া সূচি মেনে চলুন।

## ৬. পরজীবী ও চাপ

কৃমি আর লাল মাইট চুপচাপ উৎপাদন কমায়। রাতে মুরগি পরীক্ষা করে মাইট দেখুন এবং সময়মতো কৃমিনাশক দিন। জোরে শব্দ, শিয়াল-বেজি, রুক্ষভাবে ধরা, স্থান বদল আর বেশি গাদাগাদিও কিছুদিনের জন্য ডিম কমায়।

## ৭. বয়স

প্রায় ৭০–৭৫ সপ্তাহ বয়সের পরে বেশিরভাগ লেয়ার আর লাভজনক থাকে না। মাসের পর মাস ধীরে ধীরে কমলে আর অন্য কোনো সমস্যা না থাকলে কারণ বয়স। **প্রতি ডিমের খাবার খরচ** আর ডিমের দাম তুলনা করে ঠিক করুন কখন ব্যাচ বিক্রি করবেন।

## প্রতিদিন ১০ মিনিটের রুটিন

1. ডিম গুনে হেন-ডে % হিসাব করুন।
2. বাতি ও প্রতিটি পানির পাত্র দেখুন।
3. দেওয়া ও বাকি থাকা খাবার মাপুন।
4. মৃত্যু ও অসুস্থ মুরগি লিখে রাখুন।
5. ডিমের খোসা আর পায়খানা দেখুন।

## অ্যাপে হিসাব রাখুন

**FarmFlows**-এ **লেয়ার ব্যাচ → দৈনিক হিসাব** থেকে প্রতিটি ব্যাচের প্রতিদিনের ডিম, খাবার ও মৃত্যু লিখুন। অ্যাপ ডিম পাড়ার হার আর তার ধারা দেখায়, তাই প্রথম দিনেই কমতি চোখে পড়ে। টিকা ও ওষুধ লিখে রাখুন **মুরগির স্বাস্থ্য** পাতায়।

## সংক্ষেপে চেকলিস্ট

- টাইমারে ১৬ ঘণ্টা আলো
- প্রতি মুরগি ১১০–১২০ গ্রাম লেয়ার খাবার, ৩.৫–৪% ক্যালসিয়াম
- পর্যাপ্ত ঠান্ডা ও পরিষ্কার পানি
- ৩০ °C এর বেশি হলে ছায়া ও বাতাস
- সময়মতো টিকা ও কৃমিনাশক
- প্রতিদিন হেন-ডে % দেখুন
$s$);

-- 5 -------------------------------------------------------------------
insert into _articles values (
$s$safe-cattle-fattening-90-day-plan$s$, 'feed-nutrition', array['fattening', 'qurbani', 'cattle-weight'], interval '4 days',
$s$Safe cattle fattening: a 90-day plan for Qurbani without steroids$s$,
$s$নিরাপদ গরু মোটাতাজাকরণ: স্টেরয়েড ছাড়া কোরবানির ৯০ দিনের পরিকল্পনা$s$,
$s$Choose the right animal, prepare it in the first week, feed a balanced ration and track weight gain, so you sell a healthy bull at a good price.$s$,
$s$সঠিক গরু বাছাই, প্রথম সপ্তাহের প্রস্তুতি, সুষম খাবার আর ওজন বাড়ার হিসাব: সুস্থ ষাঁড় ভালো দামে বিক্রির পূর্ণ পরিকল্পনা।$s$,
$s$Fattening bulls for Eid-ul-Adha can be very profitable when it is done the right way: with good feed, clean water and healthy animals. This 90-day plan works for small and medium farms.

> **Never use steroids, dexamethasone or other hormones to fatten cattle.** They make the animal look heavy with water, not meat; they can kill the animal, harm the people who eat the meat and are against the law. Buyers increasingly recognise and avoid such cattle.

## Step 1: Choose the right animal

- **Age 1.5–2.5 years.** Young bulls convert feed to meat best.
- **A long, broad frame** that is thin but not sick. A big frame gains more.
- **Healthy:** bright eyes, wet nose, good appetite, normal dung.
- Local, crossbred and Sahiwal-type bulls all do well; choose what your market wants.

## Step 2: The first week

1. **Quarantine** new animals away from your herd for 7–10 days.
2. **Deworm** on day 1–2 (internal worms and, if needed, ticks and lice).
3. **Vaccinate** about 7–10 days later as your vet advises (FMD, and others for your area).
4. Start feed **slowly**: mostly roughage at first, adding concentrate over 7–10 days so the stomach can adjust.
5. **Weigh** the animal (scale or measuring tape) so you can track gain.

## Step 3: The daily ration

| Feed | How much (per day) |
| --- | --- |
| Green grass (Napier, maize fodder, German) | As much as it eats, often 10–20 kg |
| Rice straw | 2–4 kg, chopped |
| Concentrate mix | About 1–1.5% of body weight (3–4 kg for a 300 kg bull) |
| Clean water | Always available, 40–60 litres or more |

**An example concentrate mix (per 10 kg):**

| Ingredient | Amount |
| --- | --- |
| Wheat bran | 4 kg |
| Broken maize | 2.5 kg |
| Mustard or sesame oilcake | 2 kg |
| Pulse bran (khesari/mosur) | 1.2 kg |
| Salt | 100 g |
| Mineral–vitamin premix | 200 g |

Feed concentrate in 2–3 meals a day. Increase it slowly. Ask your livestock officer about adjusting the mix to the prices in your area.

## Step 4: Housing and care

- A dry, airy shed with shade; about **2–2.5 m² per bull**.
- Clean the floor daily; dampness causes foot problems and disease.
- Wash or brush the animals regularly in hot weather.
- Limit walking: a calm animal puts energy into growth.

## Step 5: Track the gain

Weigh every **2–4 weeks**. On this plan a healthy bull typically gains about **0.6–1 kg a day**, which is **55–90 kg in 90 days**.

If an animal is not gaining:

- Check for worms and deworm again if needed
- Check the feed and water really eaten
- Look for limping, coughing or diarrhoea and call a vet

## Step 6: Know your profit before you sell

> Profit = Sale price − (Purchase price + Feed + Medicine & vaccines + Labour + Transport and other costs)

Write every cost down from day one. Many farmers believe they made a profit until they add up the feed bills.

## Do it with FarmFlows

Add each bull under **Cattle**, record weights with the tape calculator, deworming and vaccines under **Health**, and every feed purchase under **Finance**. The finance report then shows your real profit per batch.

## Quick checklist

- 1.5–2.5 years, long frame, healthy
- Quarantine, deworm, then vaccinate in the first 10 days
- Plenty of green grass + concentrate 1–1.5% of body weight + water always
- No steroids or hormones, ever
- Weigh every 2–4 weeks; record every cost
$s$,
$s$ঈদুল আযহার জন্য ষাঁড় মোটাতাজা করা ঠিক নিয়মে করলে বেশ লাভজনক: ভালো খাবার, পরিষ্কার পানি আর সুস্থ পশু দিয়ে। এই ৯০ দিনের পরিকল্পনা ছোট ও মাঝারি খামারের জন্য।

> **গরু মোটাতাজা করতে কখনো স্টেরয়েড, ডেক্সামেথাসন বা অন্য হরমোন ব্যবহার করবেন না।** এতে মাংস নয়, শরীরে পানি জমে গরু মোটা দেখায়; গরু মারা যেতে পারে, যারা মাংস খান তাদের ক্ষতি হয় এবং এটা আইনত দণ্ডনীয়। ক্রেতারাও এখন এমন গরু চিনে এড়িয়ে চলেন।

## ধাপ ১: সঠিক গরু বাছাই

- **বয়স ১.৫–২.৫ বছর।** কম বয়সী ষাঁড় খাবারকে সবচেয়ে ভালোভাবে মাংসে পরিণত করে।
- **লম্বা ও চওড়া কাঠামো,** রোগা কিন্তু অসুস্থ নয়। বড় কাঠামো বেশি বাড়ে।
- **সুস্থ:** উজ্জ্বল চোখ, ভেজা নাক, ভালো রুচি, স্বাভাবিক গোবর।
- দেশি, শংকর ও শাহিওয়াল ধরনের ষাঁড় সবই ভালো করে; আপনার বাজার যা চায় তা বাছুন।

## ধাপ ২: প্রথম সপ্তাহ

1. নতুন গরুকে ৭–১০ দিন পালের থেকে **আলাদা** রাখুন।
2. ১ম–২য় দিনে **কৃমিনাশক** দিন (পেটের কৃমি, দরকার হলে আঠালি ও উকুনেরও)।
3. প্রায় ৭–১০ দিন পরে চিকিৎসকের পরামর্শমতো **টিকা** দিন (ক্ষুরা এবং এলাকার জন্য দরকারি অন্যগুলো)।
4. খাবার **ধীরে ধীরে** শুরু করুন: প্রথমে বেশিরভাগ খড়-ঘাস, ৭–১০ দিন ধরে দানাদার খাবার বাড়ান, যাতে পেট মানিয়ে নিতে পারে।
5. গরুর **ওজন** নিন (যন্ত্রে বা ফিতা দিয়ে), যাতে বাড়ার হিসাব রাখা যায়।

## ধাপ ৩: প্রতিদিনের খাবার

| খাবার | পরিমাণ (দৈনিক) |
| --- | --- |
| কাঁচা ঘাস (নেপিয়ার, ভুট্টার ঘাস, জার্মান) | যত খায়, সাধারণত ১০–২০ কেজি |
| ধানের খড় | ২–৪ কেজি, কুচি করে |
| দানাদার মিশ্রণ | শরীরের ওজনের প্রায় ১–১.৫% (৩০০ কেজির ষাঁড়ে ৩–৪ কেজি) |
| পরিষ্কার পানি | সবসময়, ৪০–৬০ লিটার বা বেশি |

**দানাদার মিশ্রণের একটি উদাহরণ (প্রতি ১০ কেজিতে):**

| উপকরণ | পরিমাণ |
| --- | --- |
| গমের ভুসি | ৪ কেজি |
| ভাঙা ভুট্টা | ২.৫ কেজি |
| সরিষা বা তিলের খৈল | ২ কেজি |
| ডালের ভুসি (খেসারি/মসুর) | ১.২ কেজি |
| লবণ | ১০০ গ্রাম |
| খনিজ-ভিটামিন প্রিমিক্স | ২০০ গ্রাম |

দানাদার খাবার দিনে ২–৩ বারে ভাগ করে দিন, ধীরে ধীরে বাড়ান। এলাকার দাম অনুযায়ী মিশ্রণ ঠিক করতে প্রাণিসম্পদ কর্মকর্তার পরামর্শ নিন।

## ধাপ ৪: ঘর ও যত্ন

- শুকনো, বাতাস চলাচলের ঘর, ছায়াসহ; প্রতি ষাঁড়ে প্রায় **২–২.৫ বর্গমিটার** জায়গা।
- প্রতিদিন মেঝে পরিষ্কার করুন; স্যাঁতসেঁতে মেঝেতে পায়ের সমস্যা ও রোগ হয়।
- গরমে নিয়মিত গোসল করান বা ব্রাশ করুন।
- বেশি হাঁটাহাঁটি কমান: শান্ত গরুর শক্তি বাড়ার কাজে লাগে।

## ধাপ ৫: বাড়ার হিসাব রাখুন

**২–৪ সপ্তাহ** পর পর ওজন নিন। এই পরিকল্পনায় সুস্থ ষাঁড় সাধারণত দিনে প্রায় **০.৬–১ কেজি** বাড়ে, অর্থাৎ **৯০ দিনে ৫৫–৯০ কেজি**।

গরু না বাড়লে:

- কৃমি আছে কি না দেখুন, দরকারে আবার কৃমিনাশক দিন
- আসলে কতটা খাবার ও পানি খাচ্ছে দেখুন
- খোঁড়ানো, কাশি বা পাতলা পায়খানা থাকলে চিকিৎসক ডাকুন

## ধাপ ৬: বিক্রির আগে লাভ জানুন

> লাভ = বিক্রয় মূল্য − (কেনা দাম + খাবার + ওষুধ ও টিকা + শ্রম + পরিবহন ও অন্যান্য খরচ)

প্রথম দিন থেকেই প্রতিটি খরচ লিখে রাখুন। খাবারের বিল যোগ করার আগে অনেকেই মনে করেন লাভ হয়েছে।

## FarmFlows দিয়ে করুন

প্রতিটি ষাঁড় **গবাদিপশু** পাতায় যোগ করুন, ফিতার ক্যালকুলেটর দিয়ে ওজন রাখুন, কৃমিনাশক ও টিকা **স্বাস্থ্য** পাতায় আর প্রতিটি খাবার কেনা **হিসাব** পাতায় লিখুন। তাহলে হিসাবের রিপোর্টেই প্রতিটি ব্যাচের আসল লাভ দেখা যাবে।

## সংক্ষেপে চেকলিস্ট

- ১.৫–২.৫ বছর, লম্বা কাঠামো, সুস্থ
- প্রথম ১০ দিনে আলাদা রাখা, কৃমিনাশক, তারপর টিকা
- প্রচুর কাঁচা ঘাস + শরীরের ওজনের ১–১.৫% দানাদার + সবসময় পানি
- স্টেরয়েড বা হরমোন কখনোই নয়
- ২–৪ সপ্তাহ পর পর ওজন; প্রতিটি খরচ লিখে রাখুন
$s$);

-- 6 -------------------------------------------------------------------
insert into _articles values (
$s$how-to-calculate-milk-production-cost-per-litre$s$, 'farm-business', array['milk-cost', 'profit', 'farm-records'], interval '2 days',
$s$How to calculate your milk production cost per litre (and lower it)$s$,
$s$প্রতি লিটার দুধের উৎপাদন খরচ কীভাবে হিসাব করবেন (আর কীভাবে কমাবেন)$s$,
$s$If you don't know what a litre of milk costs you, you can't know if you make a profit. A simple monthly method, a worked example and 7 proven ways to cut the cost.$s$,
$s$এক লিটার দুধে আপনার কত খরচ হয় না জানলে লাভ হচ্ছে কি না বোঝা যায় না। মাসিক হিসাবের সহজ নিয়ম, একটি উদাহরণ আর খরচ কমানোর ৭টি পরীক্ষিত উপায়।$s$,
$s$Many dairy farmers sell milk every day and still feel they never have money. Usually the reason is simple: the **cost per litre** is close to, or higher than, the price they get. Once you know this number you can make better decisions about feed, cows and price.

## Step 1: List every cost for one month

| Cost | What to include |
| --- | --- |
| Feed | Concentrate, green grass (bought or the cost of growing it), straw, minerals |
| Labour | Wages, and a fair value for family labour too |
| Health | Medicine, vaccines, dewormers, vet visits |
| Breeding | AI or bull service |
| Utilities | Electricity, water, fuel |
| Other | Rent, transport to the collection point, repairs |
| Depreciation | Shed and equipment cost spread over their useful life |

Feed is usually **60–70%** of the total, so that is where savings matter most.

## Step 2: Count the milk

Add up all the milk produced in the month, **including** milk fed to calves and used at home. That milk was produced and had a cost.

## Step 3: Divide

> Cost per litre = Total monthly cost ÷ Total litres produced

## A worked example (5 milking cows)

| Item | Taka per month |
| --- | --- |
| Concentrate | 33,000 |
| Green grass and straw | 12,000 |
| Labour | 12,000 |
| Medicine, vaccines, AI | 3,000 |
| Electricity, water, transport | 2,500 |
| Depreciation | 2,500 |
| **Total** | **65,000** |

Milk produced: 5 cows × 10 litres × 30 days = **1,500 litres**.

Cost per litre = 65,000 ÷ 1,500 = **about 43 taka**.

If the farm sells milk at 60 taka, it earns about 17 taka per litre before counting dry cows, calves and heifers that also eat. These are example numbers; use your own.

## Step 4: Count the whole herd

Dry cows, heifers and calves eat but give no milk today. Include their feed in the dairy cost, or track them separately as the cost of your **future** milking cows. Either way, don't forget them.

## 7 ways to lower the cost per litre

1. **Grow your own green fodder.** Napier and maize fodder are much cheaper per kg than concentrate.
2. **Feed by yield.** A cow giving 15 litres needs more concentrate than one giving 5. Feeding them the same wastes money on the low yielder.
3. **Shorten the calving interval.** Aim for a calf every 12–13 months; every extra month dry is a month of feed without milk.
4. **Prevent mastitis.** Clean milking, dry teats and a clean floor save milk and medicine.
5. **Cull the persistent losers.** A cow that repeatedly fails to conceive or always gives very little milk costs more than she earns.
6. **Buy feed in bulk** and store it dry to avoid mould and price spikes.
7. **Keep records.** You cannot improve a number you don't measure.

## Let the app add it up

In **FarmFlows**, record daily milk per cow under **Milk**, and every expense and income under **Finance** (feed, salaries, medicine, AI and more). The finance report shows your monthly totals for the dairy, so you can see your real cost per litre and which cows earn their keep.

## Quick checklist

- List all costs, including family labour and depreciation
- Count all milk, including milk fed to calves
- Cost per litre = monthly cost ÷ litres
- Feed is 60–70% of cost: start saving there
- Review the number every month
$s$,
$s$অনেক দুগ্ধ খামারি প্রতিদিন দুধ বিক্রি করেও মনে করেন হাতে টাকা থাকে না। কারণ সাধারণত সহজ: **প্রতি লিটারের খরচ** বিক্রির দামের কাছাকাছি বা তার চেয়েও বেশি। এই সংখ্যাটা জানলে খাবার, গাভী আর দাম নিয়ে ভালো সিদ্ধান্ত নেওয়া যায়।

## ধাপ ১: এক মাসের সব খরচ লিখুন

| খরচ | কী কী ধরবেন |
| --- | --- |
| খাবার | দানাদার, কাঁচা ঘাস (কেনা বা চাষের খরচ), খড়, খনিজ |
| শ্রম | মজুরি, পরিবারের সদস্যদের শ্রমেরও ন্যায্য মূল্য |
| স্বাস্থ্য | ওষুধ, টিকা, কৃমিনাশক, চিকিৎসকের ফি |
| প্রজনন | কৃত্রিম প্রজনন বা ষাঁড়ের খরচ |
| বিদ্যুৎ-পানি | বিদ্যুৎ, পানি, জ্বালানি |
| অন্যান্য | ভাড়া, দুধ সংগ্রহ কেন্দ্রে পরিবহন, মেরামত |
| অবচয় | ঘর ও যন্ত্রপাতির দাম তাদের ব্যবহারকালে ভাগ করে |

মোট খরচের সাধারণত **৬০–৭০%** খাবারে যায়, তাই সাশ্রয়ের সবচেয়ে বড় জায়গা সেটাই।

## ধাপ ২: দুধ গুনুন

মাসে মোট যত দুধ হয়েছে যোগ করুন, বাছুরকে খাওয়ানো আর বাড়িতে খাওয়া দুধ **সহ**। সেই দুধ উৎপাদনেও খরচ হয়েছে।

## ধাপ ৩: ভাগ করুন

> প্রতি লিটারের খরচ = মাসের মোট খরচ ÷ মাসের মোট দুধ (লিটার)

## একটি উদাহরণ (৫টি দুধেল গাভী)

| খাত | মাসিক টাকা |
| --- | --- |
| দানাদার খাবার | ৩৩,০০০ |
| কাঁচা ঘাস ও খড় | ১২,০০০ |
| শ্রম | ১২,০০০ |
| ওষুধ, টিকা, প্রজনন | ৩,০০০ |
| বিদ্যুৎ, পানি, পরিবহন | ২,৫০০ |
| অবচয় | ২,৫০০ |
| **মোট** | **৬৫,০০০** |

উৎপাদিত দুধ: ৫টি গাভী × ১০ লিটার × ৩০ দিন = **১,৫০০ লিটার**।

প্রতি লিটারের খরচ = ৬৫,০০০ ÷ ১,৫০০ = **প্রায় ৪৩ টাকা**।

খামার যদি ৬০ টাকায় দুধ বিক্রি করে, তাহলে শুকনো গাভী, বাছুর ও বকনার খরচ ধরার আগে লিটারে প্রায় ১৭ টাকা থাকে। এগুলো উদাহরণের সংখ্যা; আপনার নিজের হিসাব বসান।

## ধাপ ৪: পুরো পালের হিসাব ধরুন

শুকনো গাভী, বকনা আর বাছুর খায়, কিন্তু আজ দুধ দেয় না। তাদের খাবারও দুধের খরচে ধরুন, অথবা আলাদা করে **ভবিষ্যতের** দুধেল গাভীর খরচ হিসেবে রাখুন। যেভাবেই হোক, বাদ দেবেন না।

## প্রতি লিটারের খরচ কমানোর ৭টি উপায়

1. **নিজে কাঁচা ঘাস চাষ করুন।** নেপিয়ার ও ভুট্টার ঘাস কেজিপ্রতি দানাদারের চেয়ে অনেক সস্তা।
2. **দুধ অনুযায়ী খাবার দিন।** ১৫ লিটারের গাভীর দানাদার বেশি লাগে, ৫ লিটারের কম। সবাইকে সমান দিলে কম দুধের গাভীতে টাকা নষ্ট হয়।
3. **দুই বাচ্চার মাঝের সময় কমান।** প্রতি ১২–১৩ মাসে একটি বাচ্চা লক্ষ্য রাখুন; প্রতিটি বাড়তি শুকনো মাস মানে দুধ ছাড়া খাবারের খরচ।
4. **ওলান ফোলা (ম্যাস্টাইটিস) প্রতিরোধ করুন।** পরিষ্কারভাবে দোহন, শুকনো বাঁট আর পরিষ্কার মেঝে দুধ ও ওষুধের টাকা বাঁচায়।
5. **বারবার লোকসানের গাভী বাদ দিন।** যে গাভী বারবার গর্ভধারণ করে না বা সবসময় খুব কম দুধ দেয়, সে যা আয় করে তার চেয়ে বেশি খরচ করায়।
6. **খাবার একসাথে বেশি করে কিনুন** আর শুকনো জায়গায় রাখুন, যাতে ছত্রাক ও হঠাৎ দাম বাড়া এড়ানো যায়।
7. **হিসাব রাখুন।** যে সংখ্যা মাপেন না, তা উন্নত করা যায় না।

## যোগফল অ্যাপকে করতে দিন

**FarmFlows**-এ **দুধ** পাতায় প্রতিটি গাভীর দৈনিক দুধ আর **হিসাব** পাতায় প্রতিটি খরচ ও আয় (খাবার, বেতন, ওষুধ, কৃত্রিম প্রজনন ইত্যাদি) লিখুন। হিসাবের রিপোর্টে দুগ্ধ খামারের মাসিক মোট দেখা যায়, তাই প্রতি লিটারের আসল খরচ আর কোন গাভী লাভ দিচ্ছে তা বোঝা যায়।

## সংক্ষেপে চেকলিস্ট

- পরিবারের শ্রম ও অবচয়সহ সব খরচ লিখুন
- বাছুরকে খাওয়ানো দুধসহ সব দুধ গুনুন
- প্রতি লিটারের খরচ = মাসের খরচ ÷ লিটার
- খরচের ৬০–৭০% খাবার: সাশ্রয় সেখান থেকে শুরু
- প্রতি মাসে সংখ্যাটা দেখুন
$s$);

-- Insert the articles (skip any slug that already exists) and link them.
insert into public.blog_posts (slug, title_en, title_bn, summary_en, summary_bn, body_en, body_bn, published, published_at, category_id)
select a.slug, a.title_en, a.title_bn, a.summary_en, a.summary_bn, a.body_en, a.body_bn, true, now() - a.age,
       (select c.id from public.blog_categories c where c.slug = a.category)
from _articles a
where not exists (select 1 from public.blog_posts p where p.slug = a.slug);

insert into public.blog_post_tags (post_id, tag_id)
select p.id, t.id
from _articles a
join public.blog_posts p on p.slug = a.slug
join public.blog_tags t on t.slug = any (a.tags)
on conflict do nothing;
drop table _articles;
