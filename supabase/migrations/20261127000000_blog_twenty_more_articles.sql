-- =====================================================================
-- Twenty more practical articles for farmers (Bangla + English):
-- five on vermicompost, the rest on cattle health and breeding, feed,
-- goats, layers and farm business. Safe to re-run: existing slugs are
-- skipped, and categories/tags that already exist keep their names.
-- =====================================================================

insert into public.blog_categories (slug, name_en, name_bn, description_en, description_bn, sort_order) values
  ('compost-soil', 'Compost & soil', 'কম্পোস্ট ও মাটি', 'Vermicompost, compost and putting farm manure to work.', 'কেঁচো সার, কম্পোস্ট আর খামারের গোবর কাজে লাগানো।', 6),
  ('goats', 'Goats', 'ছাগল', 'Black Bengal and other goats: housing, feeding, breeding and kids.', 'ব্ল্যাক বেঙ্গল ও অন্যান্য ছাগল: ঘর, খাবার, প্রজনন আর বাচ্চা।', 7)
on conflict (slug) do nothing;

insert into public.blog_tags (slug, name_en, name_bn) values
  ('vermicompost', 'Vermicompost', 'কেঁচো সার'),
  ('manure', 'Manure & compost', 'গোবর ও কম্পোস্ট'),
  ('farm-income', 'Extra farm income', 'খামারের বাড়তি আয়'),
  ('deworming', 'Deworming', 'কৃমিনাশক'),
  ('calf-care', 'Calf care', 'বাছুরের যত্ন'),
  ('vaccines', 'Vaccines', 'টিকা'),
  ('biosecurity', 'Biosecurity', 'জৈব নিরাপত্তা'),
  ('feed-ration', 'Feed ration', 'খাদ্য রেশন'),
  ('artificial-insemination', 'Artificial insemination', 'কৃত্রিম প্রজনন'),
  ('heat-detection', 'Heat detection', 'গরম চেনা'),
  ('dry-cow', 'Dry cow', 'শুকনো গাভী'),
  ('calving', 'Calving', 'বাছুর প্রসব'),
  ('fodder', 'Green fodder', 'কাঁচা ঘাস'),
  ('heat-stress', 'Heat stress', 'গরমের চাপ'),
  ('milk-cost', 'Milk cost', 'দুধের খরচ'),
  ('goats', 'Goats', 'ছাগল'),
  ('kid-care', 'Kid care', 'ছাগলের বাচ্চার যত্ন'),
  ('egg-production', 'Egg production', 'ডিম উৎপাদন'),
  ('records', 'Farm records', 'খামারের হিসাব'),
  ('selling-milk', 'Selling milk', 'দুধ বিক্রি')
on conflict (slug) do nothing;

create temporary table _new_articles (
  slug text, category text, tags text[], age interval,
  title_en text, title_bn text, summary_en text, summary_bn text, body_en text, body_bn text
);

-- 1 -------------------------------------------------------------------
insert into _new_articles values (
$s$vermicompost-step-by-step-beginner-guide$s$, 'compost-soil', array['vermicompost', 'manure'], interval '1 minute',
$s$How to make vermicompost at home: a step-by-step guide for beginners$s$,
$s$বাড়িতে কেঁচো সার তৈরির নিয়ম: নতুনদের জন্য ধাপে ধাপে গাইড$s$,
$s$Start vermicompost with cow dung, a shaded bed and a few kilos of worms. Bed size, bedding, feeding, moisture and your first harvest in about two months.$s$,
$s$গোবর, ছায়ায় একটা বেড আর কয়েক কেজি কেঁচো দিয়েই শুরু। বেডের মাপ, বিছানা, খাবার, আর্দ্রতা আর প্রায় দুই মাসে প্রথম সার তোলার নিয়ম।$s$,
$s$If you keep even two or three cows, you already have the main raw material for vermicompost. Earthworms eat partly rotted dung and leave behind a dark, crumbly, earthy-smelling compost that vegetable growers and nurseries like to buy. You do not need a shed or machines to start. A shaded corner, a simple bed and a little daily attention are enough.

This guide walks through a first small batch, the way most farmers in Bangladesh start.

## What you need

- **Cow dung that is 2–3 weeks old.** Fresh dung heats up as it rots and can kill the worms.
- **Earthworms suited to composting.** The common choice is the red worm *Eisenia fetida*. Start with about **1 kg of worms** for a small bed.
- **Bedding:** chopped straw, dry leaves, banana leaves or shredded cardboard.
- **A bed:** a cement ring, a brick tank with a small drain hole, a plastic crate or a shallow pit lined with polythene.
- **Shade and cover:** a roof, a tree or a shed wall, plus a jute sack (চট) to cover the bed.
- **Water:** a watering can or a bucket with holes.

## Step 1: Choose the spot

Pick a place that stays shaded all day, does not flood in the monsoon and is out of reach of chickens, ducks and rats. Worms die in direct sun and in standing water. Make sure extra water can drain out of the bed.

## Step 2: Make the bed

A good beginner size is about **1 m long, 1 m wide and 30–45 cm deep**. Larger beds are fine later, but the depth should stay under half a metre so the bottom does not turn sour.

1. Put a 5 cm layer of broken bricks or coarse sand at the bottom if the bed has a drain.
2. Add **10–15 cm of bedding** (straw or leaves), sprinkle water until it is damp.
3. Add **15–20 cm of old dung**, broken up by hand.
4. Wet the whole bed until it feels like a squeezed sponge: damp, but no water drips when you press a handful.

Leave the bed for 2–3 days. If it feels warm when you push your hand in, wait until it cools down.

## Step 3: Add the worms

Spread the worms on top in the evening. They dislike light and will move down into the bed by themselves. Cover the bed with a damp jute sack.

## Step 4: Daily and weekly care

- **Moisture:** check every day in the dry season. The bed should stay damp, never soggy. In winter, every 2–3 days is usually enough.
- **Feeding:** once the top layer starts to look dark and broken down, add a new 5–8 cm layer of old dung. Vegetable peels and leftover straw can go in too. Avoid meat, oil, salt, onion skins in large amounts and citrus peels.
- **Turning:** you do not need to turn a worm bed like a normal compost heap. Just loosen the top lightly once a week so air gets in.
- **Pests:** ants are a sign the bed is too dry. Put the legs of a raised bed in bowls of water. Keep chickens and rats away.

## Step 5: Harvest

In about **45–60 days** most of the bed turns dark, fine and granular, with no smell of dung. To harvest:

1. Stop watering for 3–4 days. The worms move down to the moist bottom.
2. Scrape off the dry top layer and make small heaps of it in sunlight for a few hours. Worms crawl away from light to the bottom of each heap.
3. Take the compost from the top of each heap and sieve it through a 3–4 mm mesh.
4. Put the worms and the unfinished bottom layer back into a fresh bed.

From a bed this size you can expect roughly a few hundred kilos of compost a year, depending on how much dung you feed and how well you keep the moisture.

## Storing the compost

Keep finished vermicompost in shade, slightly damp, in sacks or covered heaps. Do not let it dry out completely or sit in the rain. Used within a few months, it keeps its quality.

## Mistakes to avoid

- Fresh, hot dung on the worms
- A bed in the sun or under a dripping roof
- Too wet: the bed smells sour and worms climb up the walls
- Too dry: worms go still and ants move in
- Too much feed at once: thin layers work better than one big dump

## Keep a simple record

Write down the date you start each bed, how much dung you add and how much compost you harvest. In **FarmFlows** you can record any sale of compost or worms as farm income, so you see what your dung is really earning.$s$,
$s$খামারে দুই-তিনটা গরু থাকলেও কেঁচো সারের মূল কাঁচামাল আপনার কাছে আছে। কেঁচো আধাপচা গোবর খেয়ে যে কালো, ঝুরঝুরে, মাটির গন্ধওয়ালা সার রেখে যায়, সবজি চাষি আর নার্সারি তা কিনতে চায়। শুরু করতে আলাদা ঘর বা মেশিন লাগে না। ছায়াওয়ালা এক কোণ, একটা সাধারণ বেড আর প্রতিদিন একটু নজর রাখলেই হয়।

বাংলাদেশে বেশিরভাগ খামারি যেভাবে প্রথম ছোট বেড দিয়ে শুরু করেন, এখানে সেভাবেই ধাপগুলো দেওয়া হলো।

## যা লাগবে

- **২–৩ সপ্তাহের পুরনো গোবর।** টাটকা গোবর পচার সময় গরম হয়, তাতে কেঁচো মরে যেতে পারে।
- **কম্পোস্টের উপযোগী কেঁচো।** সাধারণত লাল কেঁচো *Eisenia fetida* ব্যবহার হয়। ছোট বেডের জন্য প্রায় **১ কেজি কেঁচো** দিয়ে শুরু করুন।
- **বিছানা:** কুচি করা খড়, শুকনো পাতা, কলাপাতা বা ছেঁড়া কার্ডবোর্ড।
- **বেড:** সিমেন্টের রিং, নিচে ছোট ফুটোসহ ইটের চৌবাচ্চা, প্লাস্টিকের ক্রেট বা পলিথিন বিছানো অগভীর গর্ত।
- **ছায়া আর ঢাকনা:** চালা, গাছ বা ঘরের দেয়ালের পাশ, আর ঢাকার জন্য একটা চট।
- **পানি:** ঝাঁঝরি বা ফুটো করা বালতি।

## ধাপ ১: জায়গা বাছুন

এমন জায়গা বাছুন যেখানে সারাদিন ছায়া থাকে, বর্ষায় পানি জমে না, আর মুরগি, হাঁস ও ইঁদুর পৌঁছাতে পারে না। রোদে আর জমা পানিতে কেঁচো মরে যায়। বেড থেকে বাড়তি পানি বের হওয়ার ব্যবস্থা রাখুন।

## ধাপ ২: বেড তৈরি

শুরুর জন্য ভালো মাপ **১ মিটার লম্বা, ১ মিটার চওড়া আর ৩০–৪৫ সেমি গভীর**। পরে বড় বেড করা যায়, তবে গভীরতা আধা মিটারের কম রাখবেন, নইলে নিচের অংশ টক হয়ে যায়।

1. বেডে পানি বের হওয়ার ফুটো থাকলে নিচে ৫ সেমি ভাঙা ইট বা মোটা বালু দিন।
2. **১০–১৫ সেমি বিছানা** (খড় বা পাতা) দিয়ে পানি ছিটিয়ে ভেজান।
3. ওপরে **১৫–২০ সেমি পুরনো গোবর** হাতে ভেঙে ছড়িয়ে দিন।
4. পুরো বেড এমনভাবে ভেজান যেন চিপে রাখা স্পঞ্জের মতো লাগে: ভেজা, কিন্তু মুঠোয় চাপলে পানি পড়ে না।

বেডটা ২–৩ দিন রেখে দিন। ভেতরে হাত দিলে গরম লাগলে ঠান্ডা হওয়া পর্যন্ত অপেক্ষা করুন।

## ধাপ ৩: কেঁচো ছাড়ুন

সন্ধ্যায় কেঁচোগুলো বেডের ওপর ছড়িয়ে দিন। আলো ওদের পছন্দ না, তাই নিজেরাই ভেতরে ঢুকে যাবে। বেড ভেজা চট দিয়ে ঢেকে দিন।

## ধাপ ৪: প্রতিদিন আর প্রতি সপ্তাহের যত্ন

- **আর্দ্রতা:** শুকনো মৌসুমে প্রতিদিন দেখুন। বেড ভেজা থাকবে, কিন্তু কাদা হবে না। শীতে সাধারণত ২–৩ দিন পরপর দেখলেই চলে।
- **খাবার:** ওপরের স্তর কালচে আর ঝুরঝুরে হতে শুরু করলে নতুন করে ৫–৮ সেমি পুরনো গোবর দিন। সবজির খোসা আর বাড়তি খড়ও দেওয়া যায়। মাংস, তেল, লবণ, বেশি পেঁয়াজের খোসা আর লেবু জাতীয় খোসা দেবেন না।
- **নাড়াচাড়া:** সাধারণ কম্পোস্টের মতো কেঁচোর বেড উল্টাতে হয় না। সপ্তাহে একবার ওপরটা আলতো করে আলগা করে দিলেই বাতাস ঢোকে।
- **পোকামাকড়:** পিঁপড়া এলে বুঝবেন বেড বেশি শুকনো। উঁচু বেড হলে পায়াগুলো পানিভরা বাটিতে রাখুন। মুরগি আর ইঁদুর দূরে রাখুন।

## ধাপ ৫: সার তোলা

প্রায় **৪৫–৬০ দিনে** বেডের বেশিরভাগ অংশ কালো, মিহি আর দানাদার হয়ে যায়, গোবরের গন্ধ থাকে না। তোলার নিয়ম:

1. ৩–৪ দিন পানি দেওয়া বন্ধ রাখুন। কেঁচো নিচের ভেজা অংশে নেমে যাবে।
2. ওপরের শুকনো স্তর তুলে রোদে কয়েকটা ছোট স্তূপ করুন। আলো থেকে বাঁচতে কেঁচো প্রতিটা স্তূপের নিচে চলে যাবে।
3. স্তূপের ওপর থেকে সার নিয়ে ৩–৪ মিমি জালিতে চেলে নিন।
4. কেঁচো আর নিচের না-পচা অংশ নতুন বেডে দিয়ে দিন।

এই মাপের একটা বেড থেকে বছরে মোটামুটি কয়েকশো কেজি সার পাওয়া যায়, কতটা গোবর দেন আর আর্দ্রতা কেমন রাখেন তার ওপর নির্ভর করে।

## সার রাখার নিয়ম

তৈরি কেঁচো সার ছায়ায়, হালকা ভেজা অবস্থায় বস্তায় বা ঢাকা স্তূপে রাখুন। পুরো শুকিয়ে যেতে বা বৃষ্টিতে ভিজতে দেবেন না। কয়েক মাসের মধ্যে ব্যবহার করলে মান ঠিক থাকে।

## যে ভুলগুলো এড়াবেন

- কেঁচোর ওপর টাটকা, গরম গোবর
- রোদে বা চাল চুঁইয়ে পানি পড়ে এমন জায়গায় বেড
- বেশি ভেজা: বেড টক গন্ধ ছাড়ে, কেঁচো দেয়াল বেয়ে উঠে যায়
- বেশি শুকনো: কেঁচো নড়াচড়া কমিয়ে দেয়, পিঁপড়া ঢোকে
- একবারে বেশি খাবার: একটা মোটা স্তরের চেয়ে কয়েকবারে পাতলা স্তর ভালো

## সহজ একটা হিসাব রাখুন

প্রতিটা বেড কবে শুরু করলেন, কতটা গোবর দিলেন আর কতটা সার তুললেন লিখে রাখুন। **FarmFlows**-এ সার বা কেঁচো বিক্রিকে খামারের আয় হিসেবে লিখে রাখতে পারেন, তাহলে বুঝবেন গোবর থেকে আসলে কত আয় হচ্ছে।$s$);

-- 2 -------------------------------------------------------------------
insert into _new_articles values (
$s$best-earthworms-for-vermicompost$s$, 'compost-soil', array['vermicompost'], interval '2 minutes',
$s$Which earthworms make vermicompost? Red worms vs garden worms, and how many to buy$s$,
$s$কেঁচো সারের জন্য কোন কেঁচো? লাল কেঁচো বনাম মাটির কেঁচো, আর কতটা কিনবেন$s$,
$s$Not every earthworm can make compost. Why red worms (Eisenia fetida) work, why garden worms die in a bed, how many to buy and how to check before you pay.$s$,
$s$সব কেঁচো দিয়ে সার হয় না। লাল কেঁচো (Eisenia fetida) কেন কাজ করে, মাটির কেঁচো কেন বেডে মরে যায়, কতটা কিনবেন আর কেনার আগে কী দেখবেন।$s$,
$s$The most common reason a new vermicompost bed fails is the wrong worm. Farmers dig up earthworms from a field, put them in dung and find them dead or gone a week later. That is not bad luck. Soil worms and compost worms live completely different lives.

## Two kinds of earthworm

**Soil worms (the big grey or pink ones you find when digging)** live deep in the ground. They dig long tunnels, eat soil and come up only now and then. Put them in a shallow bed of dung and they try to escape or die. They are good for your fields, not for a compost bed.

**Compost worms (surface worms)** live in the top layer of rotting leaves and dung. They do not dig deep, they eat a lot of organic matter, breed fast and are happy in a crowded bed. These are the ones you need.

## The worms used in Bangladesh

- ***Eisenia fetida* (red worm, red wiggler):** the most widely used compost worm. Small (5–10 cm), dark red with faint yellow bands, very active, breeds quickly. It tolerates crowding and handles our temperatures well in shade, but suffers in very hot, dry spells.
- ***Perionyx excavatus*:** a local compost worm found in South Asia. Reddish-brown, very quick on the surface. It works well in warm weather but tends to wander off if the bed is disturbed.
- ***Eudrilus eugeniae* (African night crawler):** bigger and fast-growing, likes warmth and lots of moisture, but does not like cold winter nights.

For a first bed, *Eisenia fetida* bought from an established vermicompost producer is the safest choice. Many upazila agriculture offices and NGOs can point you to someone nearby.

## How many worms to buy

A practical rule many producers use is about **1 kg of worms per square metre of bed**. One kilo is roughly a thousand worms or more, depending on size.

- Fewer worms are fine if you are patient: they multiply, and in a few months the bed fills up.
- More worms finish the first batch faster but cost more upfront.

Do not overstock a tiny container. Worms need room and food, or they stop breeding.

## What to check before you pay

1. **Movement:** healthy worms wriggle quickly when touched and move away from light.
2. **Colour:** shiny red to reddish-brown, not pale, grey or flat.
3. **Size mix:** a good sample has adults (with a thick band near the front, the clitellum), young worms and small round cocoons.
4. **Smell of the material:** it should smell of earth, not sour or rotten.
5. **Weight honesty:** some sellers sell "1 kg of worms" that is mostly compost. Ask to see a handful spread out.

## Carrying them home

Carry worms in a bag or bucket with damp compost from their old bed, not in water and not in a sealed plastic bag in the sun. Release them into the new bed the same evening.

## Keeping your worms multiplying

- Shade, moisture like a squeezed sponge and old (not fresh) dung
- Thin layers of food added regularly
- Protection from ants, rats, birds and flooding
- In very hot weeks, wet sacks on top and an extra watering in the evening

Once your beds are full, extra worms can be sold to neighbours who want to start. Record those sales in **FarmFlows** as income so you see what your worm beds bring in.$s$,
$s$নতুন কেঁচো সারের বেড ব্যর্থ হওয়ার সবচেয়ে বড় কারণ ভুল কেঁচো। অনেকে জমি খুঁড়ে কেঁচো তুলে গোবরে ছাড়েন, আর এক সপ্তাহ পর দেখেন সব মরে গেছে বা চলে গেছে। এটা দুর্ভাগ্য না। মাটির কেঁচো আর সারের কেঁচোর জীবন পুরো আলাদা।

## দুই ধরনের কেঁচো

**মাটির কেঁচো (মাটি খুঁড়লে যে বড়, ধূসর বা গোলাপি কেঁচো পাওয়া যায়)** মাটির অনেক গভীরে থাকে। লম্বা সুড়ঙ্গ খোঁড়ে, মাটি খায় আর মাঝে মাঝে ওপরে আসে। গোবরের অগভীর বেডে দিলে পালাতে চায় বা মরে যায়। এরা জমির জন্য ভালো, সারের বেডের জন্য না।

**সারের কেঁচো (ওপরের স্তরের কেঁচো)** পচা পাতা আর গোবরের ওপরের স্তরে থাকে। গভীরে খোঁড়ে না, অনেক জৈব জিনিস খায়, দ্রুত বংশ বাড়ায় আর ঘন বেডেও ভালো থাকে। আপনার দরকার এদেরই।

## বাংলাদেশে যে কেঁচো ব্যবহার হয়

- ***Eisenia fetida* (লাল কেঁচো):** সবচেয়ে বেশি ব্যবহৃত সারের কেঁচো। ছোট (৫–১০ সেমি), গাঢ় লাল, হালকা হলুদ দাগওয়ালা, খুব চটপটে, দ্রুত বংশ বাড়ায়। ঘন বেডেও টিকে থাকে আর ছায়ায় আমাদের তাপমাত্রা ভালোই সহ্য করে, তবে খুব গরম আর শুকনো সময়ে কষ্ট পায়।
- ***Perionyx excavatus*:** দক্ষিণ এশিয়ার দেশি সারের কেঁচো। লালচে-বাদামি, ওপরের স্তরে খুব দ্রুত চলে। গরমে ভালো কাজ করে, তবে বেড নাড়াচাড়া হলে অন্যত্র চলে যেতে চায়।
- ***Eudrilus eugeniae* (আফ্রিকান নাইটক্রলার):** বড় আর দ্রুত বাড়ে, গরম আর বেশি আর্দ্রতা পছন্দ করে, তবে শীতের ঠান্ডা রাত সহ্য করতে পারে না।

প্রথম বেডের জন্য অভিজ্ঞ কেঁচো সার উৎপাদকের কাছ থেকে কেনা *Eisenia fetida* সবচেয়ে নিরাপদ। উপজেলা কৃষি অফিস বা এনজিও অনেক সময় কাছের কোনো উৎপাদকের খোঁজ দিতে পারে।

## কতটা কেঁচো কিনবেন

অনেক উৎপাদক যে সহজ নিয়ম মানেন: **বেডের প্রতি বর্গমিটারে প্রায় ১ কেজি কেঁচো**। আকার ভেদে এক কেজিতে মোটামুটি হাজারখানেক বা তার বেশি কেঁচো থাকে।

- ধৈর্য থাকলে কম কেঁচো দিয়েও চলে: ওরা বংশ বাড়ায়, কয়েক মাসে বেড ভরে যায়।
- বেশি কেঁচো দিলে প্রথম বেড তাড়াতাড়ি শেষ হয়, কিন্তু শুরুতে খরচ বেশি।

ছোট পাত্রে বেশি কেঁচো ঠাসবেন না। জায়গা আর খাবার না পেলে ওরা বংশ বাড়ানো বন্ধ করে দেয়।

## টাকা দেওয়ার আগে যা দেখবেন

1. **নড়াচড়া:** সুস্থ কেঁচো ছুঁলেই দ্রুত মোচড়ায় আর আলো থেকে সরে যায়।
2. **রং:** চকচকে লাল থেকে লালচে-বাদামি, ফ্যাকাশে, ধূসর বা চ্যাপ্টা না।
3. **আকারের মিশ্রণ:** ভালো নমুনায় বড় কেঁচো (সামনের দিকে মোটা একটা বেড়, ক্লাইটেলাম), ছোট কেঁচো আর গোল ছোট ডিমের থলে (কোকুন) থাকে।
4. **গন্ধ:** মাটির গন্ধ থাকবে, টক বা পচা না।
5. **ওজনের সততা:** কেউ কেউ "১ কেজি কেঁচো" বলে বেশিরভাগ সার দিয়ে দেন। এক মুঠো ছড়িয়ে দেখতে চান।

## বাড়ি নেওয়ার নিয়ম

কেঁচো তাদের পুরনো বেডের ভেজা সারসহ ব্যাগ বা বালতিতে নিন, পানিতে না, আর রোদে বন্ধ পলিথিনে না। সেদিন সন্ধ্যায়ই নতুন বেডে ছেড়ে দিন।

## কেঁচোর বংশ বাড়াতে

- ছায়া, চিপে রাখা স্পঞ্জের মতো আর্দ্রতা আর পুরনো (টাটকা না) গোবর
- নিয়মিত পাতলা স্তরে খাবার
- পিঁপড়া, ইঁদুর, পাখি আর বন্যার পানি থেকে সুরক্ষা
- খুব গরম সপ্তাহে ওপরে ভেজা চট আর সন্ধ্যায় বাড়তি পানি

বেড ভরে গেলে বাড়তি কেঁচো শুরু করতে চাওয়া প্রতিবেশীদের কাছে বিক্রি করা যায়। সেই বিক্রি **FarmFlows**-এ আয় হিসেবে লিখে রাখুন, তাহলে বুঝবেন কেঁচোর বেড থেকে কত আসছে।$s$);

-- 3 -------------------------------------------------------------------
insert into _new_articles values (
$s$vermicompost-problems-and-solutions$s$, 'compost-soil', array['vermicompost'], interval '3 minutes',
$s$Vermicompost problems and how to fix them: bad smell, dying worms, ants and more$s$,
$s$কেঁচো সারের সমস্যা ও সমাধান: দুর্গন্ধ, কেঁচো মরা, পিঁপড়া আর আরও কিছু$s$,
$s$Sour smell, worms climbing out, ants, white mites, slow beds: what each sign tells you about your vermicompost bed and the quick fix that works.$s$,
$s$টক গন্ধ, কেঁচো বেয়ে বের হওয়া, পিঁপড়া, সাদা মাইট, ধীর সার: প্রতিটা লক্ষণ বেডের কী সমস্যা বলছে, আর দ্রুত কাজের সমাধান।$s$,
$s$A worm bed tells you when something is wrong. The worms move, the smell changes, insects show up. Almost every problem comes down to one of four things: **too wet, too dry, too hot or the wrong food**. Here is how to read the signs.

## 1. The bed smells sour or rotten

**What it means:** too wet and not enough air, or too much food at once. The material starts to rot without oxygen.

**Fix:**
- Stop watering for a few days.
- Mix in dry bedding: chopped straw, dry leaves or shredded cardboard.
- Loosen the top 10 cm with your fingers or a small fork so air can get in.
- Check that the drain hole is not blocked.
- Feed thinner layers until the smell is gone.

A healthy bed smells like soil after rain.

## 2. Worms climbing up the walls or leaving the bed

**What it means:** something in the bed is uncomfortable for them. Common causes:
- Fresh dung that is heating up
- Waterlogging after heavy rain
- Sour, acidic food (lots of fruit waste or citrus)
- A sudden change, such as a new batch of material with chemicals

**Fix:** push your hand into the bed. If it is warm, move the fresh dung aside and give it time to cool. If it is soggy, add dry bedding and improve drainage. Keep a light on near the bed for one or two nights: worms avoid light and stay in.

## 3. Worms are thin, slow or dying

**What it means:** usually heat or dryness, sometimes starvation.
- Feel the bed. If it is dry and warm, water it in the evening and cover with a wet sack.
- In hot months, move the bed to deeper shade or put a second roof layer above it.
- If the bed is fully dark and fine, the worms have finished their food. Harvest the compost and give them fresh, old dung.

## 4. Ants in the bed

**What it means:** the bed is too dry. Ants also eat worm cocoons.

**Fix:** water more often, keep the bed damp throughout, and stand raised beds on legs in bowls of water. Do not spray insecticide on or near the bed: it kills the worms too.

## 5. Small white or red mites

**What it means:** a few mites are normal. A crowd of them means the bed is very wet and has too much leftover food.

**Fix:** reduce feeding, add dry bedding, and leave the cover off for a few hours on a sunny (but not hot) day. A slice of potato or bread on top for a day collects many mites; lift it off and throw it away.

## 6. Flies and maggots

**What it means:** food left uncovered on the top, especially kitchen waste.

**Fix:** always bury food under a thin layer of old dung or bedding and keep the sack cover on. Do not add meat, fish or oily food.

## 7. Rats, frogs, birds and chickens

They all eat worms. Cover beds with a jute sack and a wire mesh, keep the area clean, and fence the corner from poultry.

## 8. The bed is too slow

If compost takes far longer than two months:
- There may be too few worms for the amount of dung.
- The dung may be too coarse. Break up lumps and mix in bedding.
- In winter, worms slow down. Keep the bed covered and avoid adding cold water late in the day.

## A quick weekly check

| Check | Good | Problem |
| --- | --- | --- |
| Squeeze a handful | A drop or two of water | Water runs, or it is dry and dusty |
| Smell | Earthy | Sour, rotten, ammonia |
| Hand inside | Cool | Warm or hot |
| Worms | Active, spread through the bed | Clustered at the top or walls |

Five minutes once a week keeps most problems from ever starting.$s$,
$s$কেঁচোর বেডে কিছু ঠিক না থাকলে বেড নিজেই জানিয়ে দেয়। কেঁচো নড়াচড়া বদলায়, গন্ধ বদলায়, পোকামাকড় আসে। প্রায় সব সমস্যার মূলে চারটার একটা থাকে: **বেশি ভেজা, বেশি শুকনো, বেশি গরম বা ভুল খাবার**। লক্ষণ দেখে কীভাবে বুঝবেন, নিচে দেওয়া হলো।

## ১. বেড থেকে টক বা পচা গন্ধ

**মানে:** বেশি ভেজা আর বাতাস কম, অথবা একবারে বেশি খাবার। অক্সিজেন ছাড়া জিনিস পচতে শুরু করে।

**সমাধান:**
- কয়েক দিন পানি দেওয়া বন্ধ রাখুন।
- শুকনো বিছানা মেশান: কুচি খড়, শুকনো পাতা বা ছেঁড়া কার্ডবোর্ড।
- ওপরের ১০ সেমি আঙুল বা ছোট কাঁটা দিয়ে আলগা করুন, যাতে বাতাস ঢোকে।
- পানি বের হওয়ার ফুটো বন্ধ হয়ে আছে কিনা দেখুন।
- গন্ধ না যাওয়া পর্যন্ত পাতলা স্তরে খাবার দিন।

ভালো বেডের গন্ধ বৃষ্টির পর ভেজা মাটির মতো।

## ২. কেঁচো দেয়াল বেয়ে উঠছে বা বেড ছেড়ে যাচ্ছে

**মানে:** বেডের কিছু একটা ওদের জন্য অস্বস্তিকর। সাধারণ কারণ:
- টাটকা গোবর গরম হচ্ছে
- ভারী বৃষ্টির পর পানি জমেছে
- টক খাবার (বেশি ফলের খোসা বা লেবু জাতীয় খোসা)
- হঠাৎ কোনো পরিবর্তন, যেমন রাসায়নিক মেশানো নতুন উপকরণ

**সমাধান:** বেডে হাত ঢুকিয়ে দেখুন। গরম লাগলে টাটকা গোবর সরিয়ে ঠান্ডা হতে দিন। কাদা হলে শুকনো বিছানা মেশান আর পানি বের হওয়ার পথ ঠিক করুন। এক-দুই রাত বেডের কাছে একটা বাতি জ্বালিয়ে রাখুন: কেঁচো আলো এড়িয়ে ভেতরেই থাকবে।

## ৩. কেঁচো রোগা, ধীর বা মরে যাচ্ছে

**মানে:** সাধারণত গরম বা শুকনো, কখনো খাবারের অভাব।
- বেডে হাত দিয়ে দেখুন। শুকনো আর গরম হলে সন্ধ্যায় পানি দিয়ে ভেজা চটে ঢেকে দিন।
- গরমের মাসে বেড আরও ঘন ছায়ায় সরান বা ওপরে আরেকটা চালা দিন।
- পুরো বেড কালো আর মিহি হয়ে গেলে বুঝবেন খাবার শেষ। সার তুলে নিয়ে নতুন পুরনো গোবর দিন।

## ৪. বেডে পিঁপড়া

**মানে:** বেড বেশি শুকনো। পিঁপড়া কেঁচোর ডিমের থলেও খায়।

**সমাধান:** বেশি করে পানি দিন, পুরো বেড ভেজা রাখুন, আর উঁচু বেডের পায়া পানিভরা বাটিতে রাখুন। বেডে বা কাছে কীটনাশক দেবেন না: কেঁচোও মরে যাবে।

## ৫. ছোট সাদা বা লাল মাইট

**মানে:** অল্প কয়েকটা থাকা স্বাভাবিক। অনেক বেশি থাকলে বুঝবেন বেড খুব ভেজা আর অনেক খাবার পড়ে আছে।

**সমাধান:** খাবার কমান, শুকনো বিছানা মেশান, রোদেলা (কিন্তু খুব গরম না) দিনে কয়েক ঘণ্টা ঢাকনা খুলে রাখুন। ওপরে এক টুকরো আলু বা রুটি একদিন রেখে দিলে অনেক মাইট তাতে জমে যায়; তুলে ফেলে দিন।

## ৬. মাছি আর পোকার লার্ভা

**মানে:** খাবার ওপরে খোলা পড়ে আছে, বিশেষ করে রান্নাঘরের উচ্ছিষ্ট।

**সমাধান:** খাবার সবসময় পুরনো গোবর বা বিছানার পাতলা স্তরের নিচে চাপা দিন আর চট দিয়ে ঢেকে রাখুন। মাংস, মাছ বা তেলতেলে খাবার দেবেন না।

## ৭. ইঁদুর, ব্যাঙ, পাখি আর মুরগি

এরা সবাই কেঁচো খায়। বেড চট আর তারের জাল দিয়ে ঢাকুন, জায়গা পরিষ্কার রাখুন, আর হাঁস-মুরগি থেকে কোণটা ঘিরে দিন।

## ৮. সার হতে বেশি সময় লাগছে

দুই মাসের অনেক বেশি সময় লাগলে:
- গোবরের তুলনায় কেঁচো কম থাকতে পারে।
- গোবর বেশি দলা পাকানো থাকতে পারে। দলা ভেঙে বিছানা মেশান।
- শীতে কেঁচো ধীর হয়ে যায়। বেড ঢেকে রাখুন আর বিকেলের পর ঠান্ডা পানি দেবেন না।

## সপ্তাহে একবার দ্রুত পরীক্ষা

| পরীক্ষা | ভালো | সমস্যা |
| --- | --- | --- |
| এক মুঠো চিপে দেখুন | এক-দুই ফোঁটা পানি | পানি গড়িয়ে পড়ে, বা শুকনো ধুলোর মতো |
| গন্ধ | মাটির মতো | টক, পচা, অ্যামোনিয়া |
| ভেতরে হাত | ঠান্ডা | গরম |
| কেঁচো | চটপটে, পুরো বেডে ছড়ানো | ওপরে বা দেয়ালে জড়ো |

সপ্তাহে একবার পাঁচ মিনিটের এই পরীক্ষাই বেশিরভাগ সমস্যা শুরু হতে দেয় না।$s$);

-- 4 -------------------------------------------------------------------
insert into _new_articles values (
$s$vermicompost-business-plan-cost-profit$s$, 'compost-soil', array['vermicompost', 'farm-income'], interval '4 minutes',
$s$Starting a small vermicompost business: costs, output, packing and finding buyers$s$,
$s$ছোট কেঁচো সারের ব্যবসা শুরু: খরচ, উৎপাদন, প্যাকিং আর ক্রেতা খোঁজা$s$,
$s$Turn cow dung into a side income: work out your own costs and profit, how much a bed produces, packing that sells and who really buys vermicompost.$s$,
$s$গোবর থেকে বাড়তি আয়। নিজের খরচ ও লাভ কীভাবে হিসাব করবেন, একটা বেডে কতটা সার হয়, যে প্যাকিং বিক্রি হয় আর আসলে কারা কেঁচো সার কেনে।$s$,
$s$Many dairy farmers in Bangladesh already sell vermicompost on the side. It turns dung, which is often a nuisance, into a product that vegetable growers, rooftop gardeners and nurseries pay for. Whether it makes you real money depends on three things: **steady dung supply, steady care and a buyer before you produce**.

This article helps you plan with your own numbers. Prices of worms, compost and materials change by district and season, so ask locally and fill in the blanks rather than trusting a figure from the internet.

## Step 1: Know your dung supply

A grown cow produces roughly 10–20 kg of dung a day. Some of it goes to biogas, fuel cakes or the field. Decide how much you can put into worm beds every month, after it has aged for 2–3 weeks.

A rough planning rule: worm beds return around **half of the dung's weight as finished compost**, sometimes less. So if you can feed 1,000 kg of old dung a month, plan for 400–500 kg of compost.

## Step 2: List your start-up costs

| Item | Notes |
| --- | --- |
| Beds | Cement rings, brick tanks or plastic crates; the biggest one-time cost |
| Shade | A simple tin or bamboo shed if you have no shaded space |
| Worms | About 1 kg per square metre of bed to start |
| Sieve | 3–4 mm mesh frame |
| Sacks, scale, bags | For storing, weighing and packing |
| Water | Watering can, pipe or bucket |

You can start with two or three beds and grow from your own worms instead of buying more.

## Step 3: List your running costs

- Your time or a worker's time (daily watering and checks, harvesting, sieving, packing)
- Bedding (straw, leaves) if you have to buy it
- Packing bags and labels
- Transport to buyers
- The value of the dung itself if you could sell it otherwise

## Step 4: Do the simple sum

**Monthly profit = (kg sold × your selling price per kg) − monthly running costs**

Then: **months to pay back = start-up cost ÷ monthly profit**

An example layout (replace every number with your own):

| | Your figure |
| --- | --- |
| Compost sold per month (kg) | ____ |
| Price per kg | ____ |
| Income | ____ |
| Labour, bags, transport | ____ |
| Profit | ____ |

If the profit only looks good when you assume selling every kilo at retail price, plan more carefully. Bulk buyers pay less but take more.

## Who buys vermicompost

- **Vegetable and fruit growers** near you, especially those growing for city markets
- **Nurseries** that sell potted plants and seedlings
- **Rooftop and home gardeners** in towns, often through Facebook groups
- **Organic farming groups and NGOs**
- **Shops** selling seeds and garden supplies

Talk to two or three buyers before you build ten beds. Ask how much they need each month, what size bags they prefer and what price they pay.

## Quality buyers notice

- Dark, fine and crumbly, with no lumps of raw dung
- Earthy smell, no sourness
- Slightly damp, not dusty and not wet
- Sieved, with no stones, plastic or worms in the bag

Consistency matters more than anything: a nursery that gets good compost once and bad the next time stops buying.

## Packing that sells

- **Small bags (1–5 kg)** for home gardeners: clean, sealed, with a simple label
- **Large sacks (25–50 kg)** for farmers and nurseries
- Label with your name, phone number, net weight and a short "how to use" line

## Sell the worms too

As beds multiply, you will have extra worms. New producers need them, so the surplus is a second product. Sell from your strongest beds and keep enough to restock your own.

## Keep the numbers honest

Record every sale, every cost and every harvest. In **FarmFlows**, add compost and worm sales as farm income and bags, labour and transport as expenses. After a few months you will know your real profit per kilo instead of guessing.$s$,
$s$বাংলাদেশের অনেক দুগ্ধ খামারি পাশাপাশি কেঁচো সার বিক্রি করেন। এতে গোবর, যা অনেক সময় ঝামেলা, এমন পণ্য হয়ে যায় যার জন্য সবজি চাষি, ছাদবাগানি আর নার্সারি টাকা দেয়। এতে আসলে লাভ হবে কিনা তিনটা জিনিসের ওপর নির্ভর করে: **নিয়মিত গোবর, নিয়মিত যত্ন, আর উৎপাদনের আগেই ক্রেতা**।

এই লেখা আপনাকে নিজের সংখ্যা দিয়ে পরিকল্পনা করতে সাহায্য করবে। কেঁচো, সার আর উপকরণের দাম জেলা আর মৌসুম ভেদে বদলায়, তাই ইন্টারনেটের কোনো সংখ্যায় ভরসা না করে স্থানীয়ভাবে জেনে ঘরগুলো নিজে পূরণ করুন।

## ধাপ ১: গোবরের জোগান জানুন

একটা বড় গরু দিনে মোটামুটি ১০–২০ কেজি গোবর দেয়। এর কিছু বায়োগ্যাস, ঘুঁটে বা জমিতে যায়। ২–৩ সপ্তাহ পুরনো হওয়ার পর মাসে কতটা গোবর কেঁচোর বেডে দিতে পারবেন, ঠিক করুন।

পরিকল্পনার মোটা হিসাব: কেঁচোর বেড থেকে **গোবরের ওজনের প্রায় অর্ধেক তৈরি সার** পাওয়া যায়, কখনো কম। মানে মাসে ১,০০০ কেজি পুরনো গোবর দিতে পারলে ৪০০–৫০০ কেজি সার ধরুন।

## ধাপ ২: শুরুর খরচের তালিকা

| জিনিস | মন্তব্য |
| --- | --- |
| বেড | সিমেন্টের রিং, ইটের চৌবাচ্চা বা প্লাস্টিকের ক্রেট; একবারের সবচেয়ে বড় খরচ |
| ছায়া | ছায়াওয়ালা জায়গা না থাকলে টিন বা বাঁশের সাধারণ চালা |
| কেঁচো | শুরুতে বেডের প্রতি বর্গমিটারে প্রায় ১ কেজি |
| চালুনি | ৩–৪ মিমি জালির ফ্রেম |
| বস্তা, দাঁড়িপাল্লা, ব্যাগ | রাখা, মাপা আর প্যাকিংয়ের জন্য |
| পানি | ঝাঁঝরি, পাইপ বা বালতি |

দুই-তিনটা বেড দিয়ে শুরু করে নিজের কেঁচো দিয়েই বাড়াতে পারেন, নতুন করে কিনতে হবে না।

## ধাপ ৩: চলতি খরচের তালিকা

- আপনার বা শ্রমিকের সময় (প্রতিদিন পানি আর দেখাশোনা, সার তোলা, চালা, প্যাকিং)
- বিছানা (খড়, পাতা) কিনতে হলে তার দাম
- প্যাকিং ব্যাগ আর লেবেল
- ক্রেতার কাছে পৌঁছানোর গাড়িভাড়া
- গোবর অন্যভাবে বিক্রি করতে পারলে তার দাম

## ধাপ ৪: সহজ হিসাব

**মাসিক লাভ = (বিক্রি করা কেজি × প্রতি কেজির দাম) − মাসিক চলতি খরচ**

তারপর: **খরচ উঠতে কত মাস = শুরুর খরচ ÷ মাসিক লাভ**

একটা নমুনা ছক (প্রতিটা ঘরে নিজের সংখ্যা বসান):

| | আপনার হিসাব |
| --- | --- |
| মাসে বিক্রি হওয়া সার (কেজি) | ____ |
| প্রতি কেজির দাম | ____ |
| আয় | ____ |
| শ্রম, ব্যাগ, গাড়িভাড়া | ____ |
| লাভ | ____ |

প্রতি কেজি খুচরা দামে বিক্রি হবে ধরলেই যদি লাভ ভালো দেখায়, তাহলে আরও সাবধানে পরিকল্পনা করুন। পাইকারি ক্রেতা দাম কম দেয়, কিন্তু বেশি নেয়।

## কারা কেঁচো সার কেনে

- আশপাশের **সবজি ও ফল চাষি**, বিশেষ করে যারা শহরের বাজারের জন্য চাষ করেন
- টবের গাছ আর চারা বিক্রি করা **নার্সারি**
- শহরের **ছাদবাগানি আর বাড়ির বাগানি**, অনেক সময় ফেসবুক গ্রুপের মাধ্যমে
- **জৈব চাষের দল আর এনজিও**
- বীজ ও বাগানের জিনিসের **দোকান**

দশটা বেড বানানোর আগে দুই-তিনজন ক্রেতার সাথে কথা বলুন। মাসে কতটা লাগবে, কোন মাপের ব্যাগ পছন্দ, আর কত দাম দেন জেনে নিন।

## ক্রেতা যে মান দেখে

- কালো, মিহি আর ঝুরঝুরে, কাঁচা গোবরের দলা নেই
- মাটির গন্ধ, টক না
- হালকা ভেজা, ধুলো ওড়ে না আবার কাদাও না
- চালা, ব্যাগে পাথর, প্লাস্টিক বা কেঁচো নেই

সবচেয়ে জরুরি হলো একই মান ধরে রাখা: একবার ভালো আর পরেরবার খারাপ সার পেলে নার্সারি আর কেনে না।

## যে প্যাকিং বিক্রি হয়

- বাড়ির বাগানির জন্য **ছোট ব্যাগ (১–৫ কেজি)**: পরিষ্কার, মুখ বন্ধ, সাধারণ লেবেলসহ
- চাষি আর নার্সারির জন্য **বড় বস্তা (২৫–৫০ কেজি)**
- লেবেলে আপনার নাম, ফোন নম্বর, নিট ওজন আর ব্যবহারের এক লাইনের নিয়ম

## কেঁচোও বিক্রি করুন

বেড বাড়লে বাড়তি কেঁচো হবে। নতুন উৎপাদকদের এগুলো লাগে, তাই এটা দ্বিতীয় পণ্য। সবচেয়ে ভালো বেড থেকে বিক্রি করুন, আর নিজের বেডের জন্য যথেষ্ট রেখে দিন।

## হিসাব সৎ রাখুন

প্রতিটা বিক্রি, প্রতিটা খরচ আর প্রতিবার সার তোলার হিসাব লিখুন। **FarmFlows**-এ সার আর কেঁচো বিক্রি খামারের আয় হিসেবে, আর ব্যাগ, শ্রম ও গাড়িভাড়া খরচ হিসেবে লিখুন। কয়েক মাস পর আন্দাজ না করে প্রতি কেজিতে আসল লাভ জানতে পারবেন।$s$);

-- 5 -------------------------------------------------------------------
insert into _new_articles values (
$s$how-to-use-vermicompost-dose-vermiwash$s$, 'compost-soil', array['vermicompost'], interval '5 minutes',
$s$How to use vermicompost: amounts for vegetables, fruit trees, pots and fodder, plus vermiwash$s$,
$s$কেঁচো সার কীভাবে ব্যবহার করবেন: সবজি, ফলগাছ, টব আর ঘাসে পরিমাণ, সাথে ভার্মিওয়াশ$s$,
$s$How much vermicompost to give vegetables, fruit trees, pots, seedlings and Napier grass, when to apply it, and how to collect and use vermiwash safely.$s$,
$s$সবজি, ফলগাছ, টব, চারা আর নেপিয়ার ঘাসে কতটা কেঁচো সার দেবেন, কখন দেবেন, আর ভার্মিওয়াশ কীভাবে সংগ্রহ ও নিরাপদে ব্যবহার করবেন।$s$,
$s$Vermicompost is not a strong fertiliser like urea. It is a soil improver. It feeds the soil with organic matter and slow-release nutrients, helps soil hold water and keeps it loose. Used well, it can cut how much chemical fertiliser you need. Used badly, it simply gets wasted.

The amounts below are common starting points. Soil, crop and season all matter, so watch your plants and adjust. For a field crop, your upazila agriculture office can test your soil and advise a full fertiliser plan.

## General rules

- **Mix it into the soil**, do not leave it on the surface in the sun. Sunlight dries it and kills the useful microbes.
- **Apply before or at planting**, then add a top-up during growth.
- **Water after applying.**
- Vermicompost is gentle. Unlike fresh dung, it will not burn roots.
- It works best together with good soil management, not as a magic powder.

## Vegetables in the field

- **At land preparation:** spread and mix in roughly **2–3 tonnes per hectare**, which is about **8–12 kg per decimal** (শতাংশ).
- **For each pit** of gourds, pumpkins or other climbers: **1–2 kg** mixed into the pit soil.
- **Top-up:** a handful around each plant 3–4 weeks after transplanting, worked lightly into the soil and watered.

## Fruit trees

| Tree age | Vermicompost per tree, per year |
| --- | --- |
| New plant (in the pit) | 2–5 kg mixed into the pit soil |
| 1–3 years | 5–10 kg |
| Older trees | 10–20 kg |

Spread it in a ring under the outer edge of the canopy, not against the trunk. Split the yearly amount into two doses, before and after the rainy season.

## Pots and rooftop gardens

- **Potting mix:** about **1 part vermicompost to 2–3 parts soil**, with some sand or cocopeat for drainage.
- **Established pots:** 1–2 handfuls on top every 1–2 months, mixed into the top layer and watered.
- Too much in a small pot can keep the soil wet for too long. More is not always better.

## Seedlings and nurseries

Seedling trays and polybags do well with **about 1 part vermicompost to 3–4 parts fine soil**. It gives stronger roots and fewer weak seedlings.

## Napier and other fodder grass

On your fodder plot, mix vermicompost in at planting and spread some along the rows after every second or third cut. Grass that is cut often takes a lot from the soil, and returning it as compost keeps yields up. Many farmers combine this with slurry from a biogas plant.

## Vermiwash

Vermiwash is the brown liquid that drains from a worm bed, or that you collect by slowly passing water through a bed.

**How to collect it:** keep a bucket under the drain hole of a bed. Once a week, sprinkle a little water over the bed and let it drip through overnight.

**How to use it:**
- Always **dilute it**: about **1 part vermiwash to 5–10 parts clean water**.
- Use it as a light spray on leaves early in the morning or late afternoon, or pour it at the root zone.
- Use it fresh, within a few days. Old, foul-smelling liquid should go back on the compost heap, not on plants.

Vermiwash is a mild booster, not a pesticide or a cure for plant disease.

## Common mistakes

- Using half-finished compost full of dung lumps: it can heat up and attract pests
- Leaving it on the surface in hot sun
- Expecting it to replace all fertiliser for heavy-feeding crops
- Using it dry and dusty: keep it slightly damp until use

## If you sell it

Put a short "how to use" note on every bag, with the amounts above. Buyers who get good results come back. If you also use your own compost on your fodder plot, note it in **FarmFlows** so your feed and fodder costs reflect what you save on fertiliser.$s$,
$s$কেঁচো সার ইউরিয়ার মতো তীব্র সার না। এটা মাটির মান বাড়ায়। মাটিতে জৈব পদার্থ আর ধীরে ধীরে মেলা পুষ্টি দেয়, মাটিকে পানি ধরে রাখতে সাহায্য করে আর ঝুরঝুরে রাখে। ঠিকমতো ব্যবহার করলে রাসায়নিক সার কম লাগতে পারে। ভুলভাবে দিলে শুধু নষ্টই হয়।

নিচের পরিমাণগুলো শুরু করার জন্য প্রচলিত হিসাব। মাটি, ফসল আর মৌসুম ভেদে আলাদা হয়, তাই গাছ দেখে কমবেশি করুন। মাঠের ফসলের জন্য উপজেলা কৃষি অফিস মাটি পরীক্ষা করে পুরো সারের পরিকল্পনা দিতে পারে।

## সাধারণ নিয়ম

- **মাটির সাথে মিশিয়ে দিন**, রোদে ওপরে ফেলে রাখবেন না। রোদে শুকিয়ে উপকারী অণুজীব মরে যায়।
- **চারা লাগানোর আগে বা সময়** দিন, তারপর বাড়ার সময় আরেকবার।
- **দেওয়ার পর পানি দিন।**
- কেঁচো সার নরম। টাটকা গোবরের মতো শিকড় পোড়ায় না।
- ভালো মাটির যত্নের সাথে এটা সবচেয়ে ভালো কাজ করে, এটা কোনো জাদুর গুঁড়া না।

## মাঠের সবজি

- **জমি তৈরির সময়:** হেক্টরে মোটামুটি **২–৩ টন**, অর্থাৎ **শতাংশে ৮–১২ কেজি** ছড়িয়ে মাটিতে মিশিয়ে দিন।
- লাউ, কুমড়া বা অন্য মাচার ফসলের **প্রতি মাদায়:** **১–২ কেজি** গর্তের মাটির সাথে মিশিয়ে।
- **পরে আবার:** চারা লাগানোর ৩–৪ সপ্তাহ পর প্রতিটা গাছের গোড়ায় এক মুঠো, আলতো মাটিতে মিশিয়ে পানি দিন।

## ফলগাছ

| গাছের বয়স | প্রতি গাছে বছরে কেঁচো সার |
| --- | --- |
| নতুন চারা (গর্তে) | গর্তের মাটির সাথে ২–৫ কেজি |
| ১–৩ বছর | ৫–১০ কেজি |
| বড় গাছ | ১০–২০ কেজি |

গাছের ডালপালার বাইরের কিনারার নিচে গোল করে দিন, কাণ্ডের গায়ে না। বছরের পরিমাণ দুই ভাগে দিন, বর্ষার আগে আর পরে।

## টব আর ছাদবাগান

- **টবের মাটি:** মোটামুটি **১ ভাগ কেঁচো সার আর ২–৩ ভাগ মাটি**, পানি বের হওয়ার জন্য একটু বালু বা কোকোপিট।
- **পুরনো টব:** ১–২ মাস পরপর ওপরে ১–২ মুঠো, ওপরের মাটিতে মিশিয়ে পানি দিন।
- ছোট টবে বেশি দিলে মাটি অনেকক্ষণ ভেজা থাকতে পারে। বেশি মানেই ভালো না।

## চারা আর নার্সারি

চারার ট্রে আর পলিব্যাগে **১ ভাগ কেঁচো সার আর ৩–৪ ভাগ মিহি মাটি** ভালো কাজ করে। শিকড় শক্ত হয়, দুর্বল চারা কম হয়।

## নেপিয়ার আর অন্য ঘাস

ঘাসের জমিতে লাগানোর সময় কেঁচো সার মেশান, আর প্রতি দুই-তিন কাটার পর সারির পাশে কিছুটা ছড়িয়ে দিন। বারবার কাটা ঘাস মাটি থেকে অনেক কিছু নেয়, কম্পোস্ট হিসেবে ফিরিয়ে দিলে ফলন ঠিক থাকে। অনেক খামারি এর সাথে বায়োগ্যাসের স্লারিও দেন।

## ভার্মিওয়াশ

ভার্মিওয়াশ হলো কেঁচোর বেড থেকে চুঁইয়ে পড়া বাদামি তরল, অথবা বেডের ভেতর দিয়ে ধীরে পানি পার করে যা সংগ্রহ করা হয়।

**সংগ্রহের নিয়ম:** বেডের পানি বের হওয়ার ফুটোর নিচে একটা বালতি রাখুন। সপ্তাহে একবার বেডের ওপর অল্প পানি ছিটিয়ে সারারাত চুঁইয়ে পড়তে দিন।

**ব্যবহারের নিয়ম:**
- সবসময় **পানিতে মিশিয়ে নিন**: মোটামুটি **১ ভাগ ভার্মিওয়াশ আর ৫–১০ ভাগ পরিষ্কার পানি**।
- ভোরে বা বিকেলে পাতায় হালকা স্প্রে করুন, বা গাছের গোড়ায় ঢালুন।
- টাটকা ব্যবহার করুন, কয়েক দিনের মধ্যে। পুরনো, দুর্গন্ধওয়ালা তরল গাছে না দিয়ে কম্পোস্টের স্তূপে ফেলে দিন।

ভার্মিওয়াশ হালকা টনিকের মতো, কীটনাশক বা গাছের রোগের ওষুধ না।

## সাধারণ ভুল

- গোবরের দলাভরা আধাপচা সার দেওয়া: গরম হতে পারে আর পোকা টানে
- কড়া রোদে ওপরে ফেলে রাখা
- বেশি খাদক ফসলে সব সারের বদলে শুধু এটা দিয়ে চলবে ভাবা
- শুকনো ধুলোর মতো ব্যবহার করা: ব্যবহারের আগ পর্যন্ত হালকা ভেজা রাখুন

## বিক্রি করলে

প্রতিটা ব্যাগে ওপরের পরিমাণসহ ছোট একটা "ব্যবহারের নিয়ম" লিখে দিন। ভালো ফল পেলে ক্রেতা আবার আসে। নিজের সার নিজের ঘাসের জমিতে দিলে **FarmFlows**-এ লিখে রাখুন, তাহলে খাদ্য ও ঘাসের খরচে সারে কত বাঁচল তা বোঝা যাবে।$s$);
-- 6 -------------------------------------------------------------------
insert into _new_articles values (
$s$cattle-deworming-schedule-guide$s$, 'cattle-health', array['deworming', 'calf-care'], interval '6 minutes',
$s$Deworming cattle: when to do it, how often, and the mistakes that waste the medicine$s$,
$s$গরুর কৃমিনাশক: কখন দেবেন, কত দিন পরপর, আর যে ভুলে ওষুধ নষ্ট হয়$s$,
$s$Worms quietly steal milk and weight. Signs of worms, a deworming calendar for calves, cows and fattening cattle, and how to avoid drug resistance.$s$,
$s$কৃমি চুপচাপ দুধ আর ওজন কেড়ে নেয়। কৃমির লক্ষণ, বাছুর, গাভী আর মোটাতাজা গরুর জন্য কৃমিনাশকের সময়সূচি, আর ওষুধ অকার্যকর হওয়া ঠেকানোর উপায়।$s$,
$s$Worms rarely kill a grown cow, which is exactly why they are easy to ignore. Instead they take a small share of every meal: the cow eats normally but gives less milk, a young bull gains weight slowly, a calf stays small with a rough coat. On a farm where cattle graze on wet pasture, by ponds or on shared village land, worms are almost always present.

This guide explains when to deworm and how to do it properly. **The medicine and dose should come from your vet or upazila livestock office**, based on the animal's weight and what worms are common in your area.

## Signs of a heavy worm load

- Rough, dull coat that does not shine even with good feed
- Pot belly in calves, thin body in adults
- Pale eyelids and gums (a sign of anaemia from blood-sucking worms)
- Loose or bad-smelling dung, sometimes with visible worms
- Swelling under the jaw ("bottle jaw") in severe cases
- Slow growth, low milk, poor appetite

Many animals carry worms with no clear signs. A dung test at the livestock office or a vet clinic shows what is there and how heavy the load is.

## A sensible deworming calendar

This is a common pattern for Bangladeshi conditions. Your vet may adjust it.

| Animal | Common timing |
| --- | --- |
| Calves | First deworming at about 3–4 weeks old (for roundworm passed from the mother), then every 2–3 months until about one year |
| Young stock and heifers | Every 3–4 months, and before and after the rainy season |
| Milking cows | Twice a year, usually before and after the monsoon; choose a medicine with a milk withdrawal period you can follow |
| Cattle for fattening | Once at the start of the fattening period, before the high-energy feeding begins |
| New animals | On arrival, before they join the herd |

The rainy season matters most. Worm eggs and larvae survive and spread on wet grass, so the months during and right after the monsoon carry the highest risk.

## How to deworm properly

1. **Weigh or measure the animal.** Underdosing is the most common mistake. Use a weighing tape if you have no scale (see our guide on measuring cattle weight with a tape).
2. **Give the full dose for the heaviest animal in a group**, not an average, unless your vet says otherwise.
3. **Follow the withdrawal period.** Milk and meat from treated animals must not be sold or eaten until the time on the label has passed.
4. **Give it on an empty stomach in the morning** if the label recommends it.
5. **Record it.** Date, product, dose and which animals.

## Avoid making worms resistant

Worms can become resistant if the same medicine is used again and again, or at doses that are too low.

- Do not deworm more often than needed.
- Rotate between different medicine groups each year, as your vet advises, not just different brand names of the same chemical.
- Avoid buying loose tablets with no label.

## Prevention beats treatment

- Do not graze calves on the same wet, low patch where adults dropped dung.
- Keep feed and water troughs off the ground and clean.
- Clear dung from sheds daily.
- Rotate grazing land where possible.
- Fence animals away from stagnant water and snail-rich areas (snails carry liver flukes).

## Keep the schedule in your phone

In **FarmFlows**, record each deworming as a health record with the next due date. The app reminds you when the next round is due and shows which animals were treated and when, so no calf is missed.$s$,
$s$বড় গরু কৃমিতে কমই মরে, আর এ কারণেই কৃমিকে অবহেলা করা সহজ। কৃমি বরং প্রতিবারের খাবারের একটা ভাগ খেয়ে নেয়: গরু স্বাভাবিক খায় কিন্তু দুধ কম দেয়, এঁড়ে বাছুরের ওজন ধীরে বাড়ে, বাছুর ছোট থাকে আর লোম খসখসে হয়। যে খামারে গরু ভেজা মাঠে, পুকুরপাড়ে বা গ্রামের সাধারণ জমিতে চরে, সেখানে প্রায় সবসময় কৃমি থাকে।

কখন আর কীভাবে ঠিকমতো কৃমিনাশক দেবেন, এই লেখায় তা বলা হলো। **ওষুধ আর মাত্রা পশুর ওজন আর আপনার এলাকায় কোন কৃমি বেশি তা দেখে ডাক্তার বা উপজেলা প্রাণিসম্পদ অফিস ঠিক করে দেবেন।**

## বেশি কৃমির লক্ষণ

- ভালো খাবার দিলেও লোম খসখসে আর ম্যাড়মেড়ে
- বাছুরের পেট বড়, বড় গরু রোগা
- চোখের পাতা আর মাড়ি ফ্যাকাশে (রক্তচোষা কৃমির কারণে রক্তশূন্যতার লক্ষণ)
- পাতলা বা দুর্গন্ধযুক্ত গোবর, কখনো কৃমি দেখা যায়
- খুব বেশি হলে চোয়ালের নিচে ফোলা
- ধীর বৃদ্ধি, কম দুধ, খাওয়ায় অরুচি

অনেক পশুর কৃমি থাকলেও স্পষ্ট লক্ষণ থাকে না। প্রাণিসম্পদ অফিস বা পশু হাসপাতালে গোবর পরীক্ষা করালে কী কৃমি আর কতটা আছে বোঝা যায়।

## কৃমিনাশকের সাধারণ সময়সূচি

বাংলাদেশের অবস্থায় প্রচলিত একটা ধরন। ডাক্তার প্রয়োজনে বদলাতে পারেন।

| পশু | সাধারণ সময় |
| --- | --- |
| বাছুর | প্রায় ৩–৪ সপ্তাহ বয়সে প্রথমবার (মায়ের কাছ থেকে আসা গোলকৃমির জন্য), তারপর প্রায় এক বছর পর্যন্ত ২–৩ মাস পরপর |
| বাড়ন্ত গরু ও বকনা | ৩–৪ মাস পরপর, আর বর্ষার আগে ও পরে |
| দুধেল গাভী | বছরে দুবার, সাধারণত বর্ষার আগে ও পরে; এমন ওষুধ বাছুন যার দুধ প্রত্যাহারের সময় আপনি মানতে পারবেন |
| মোটাতাজা করার গরু | মোটাতাজাকরণ শুরুর সময় একবার, বেশি শক্তির খাবার শুরুর আগে |
| নতুন কেনা পশু | আসার পরপর, পালের সাথে মেশানোর আগে |

বর্ষাকালই সবচেয়ে গুরুত্বপূর্ণ। ভেজা ঘাসে কৃমির ডিম আর লার্ভা টিকে থাকে আর ছড়ায়, তাই বর্ষার সময় আর ঠিক পরের মাসগুলোতে ঝুঁকি সবচেয়ে বেশি।

## ঠিকমতো কৃমিনাশক দেওয়ার নিয়ম

1. **পশুর ওজন মাপুন।** কম মাত্রা দেওয়াই সবচেয়ে সাধারণ ভুল। দাঁড়িপাল্লা না থাকলে ফিতা দিয়ে মাপুন (ফিতা দিয়ে গরুর ওজন মাপার লেখাটা দেখুন)।
2. ডাক্তার অন্য কিছু না বললে **দলের সবচেয়ে ভারী পশুর ওজন ধরে পুরো মাত্রা দিন**, গড় না।
3. **প্রত্যাহারের সময় মানুন।** লেবেলে লেখা সময় পার না হওয়া পর্যন্ত চিকিৎসা নেওয়া পশুর দুধ বা মাংস বিক্রি করবেন না, খাবেনও না।
4. লেবেলে বললে **সকালে খালি পেটে দিন।**
5. **লিখে রাখুন।** তারিখ, ওষুধের নাম, মাত্রা আর কোন কোন পশু।

## কৃমিকে ওষুধ-সহনশীল হতে দেবেন না

একই ওষুধ বারবার, বা কম মাত্রায় দিলে কৃমি ওষুধে মরে না এমন হয়ে যেতে পারে।

- প্রয়োজনের চেয়ে ঘনঘন কৃমিনাশক দেবেন না।
- ডাক্তারের পরামর্শমতো প্রতি বছর আলাদা গ্রুপের ওষুধ বদলে দিন, একই রাসায়নিকের শুধু আলাদা কোম্পানির নাম না।
- লেবেল ছাড়া খোলা ট্যাবলেট কিনবেন না।

## চিকিৎসার চেয়ে প্রতিরোধ ভালো

- বড় গরু যে ভেজা, নিচু জায়গায় গোবর ফেলেছে, সেখানে বাছুর চরাবেন না।
- খাবার আর পানির পাত্র মাটি থেকে উঁচুতে আর পরিষ্কার রাখুন।
- প্রতিদিন গোয়াল থেকে গোবর সরান।
- সম্ভব হলে চারণভূমি পালাক্রমে বদলান।
- বদ্ধ পানি আর শামুকভরা জায়গা থেকে পশু দূরে রাখুন (শামুক কলিজার কৃমি ছড়ায়)।

## সময়সূচি ফোনে রাখুন

**FarmFlows**-এ প্রতিবার কৃমিনাশক স্বাস্থ্য রেকর্ড হিসেবে পরের তারিখসহ লিখুন। পরের বার কবে, অ্যাপ মনে করিয়ে দেবে আর কোন পশু কবে পেয়েছে দেখাবে, তাই কোনো বাছুর বাদ পড়বে না।$s$);

-- 7 -------------------------------------------------------------------
insert into _new_articles values (
$s$foot-and-mouth-disease-cow-care$s$, 'cattle-health', array['vaccines', 'biosecurity'], interval '7 minutes',
$s$Foot and mouth disease (FMD) in cows: signs, isolation and nursing care at home$s$,
$s$গরুর ক্ষুরা রোগ (FMD): লক্ষণ, আলাদা রাখা আর বাড়িতে সেবা$s$,
$s$FMD spreads fast and costs months of milk. Spot it early, keep it from the rest of the herd, nurse a sick cow and protect calves until the vet comes.$s$,
$s$ক্ষুরা রোগ দ্রুত ছড়ায়, মাসের পর মাস দুধ কমায়। আগেভাগে চেনা, পালের বাকিদের রক্ষা, অসুস্থ গরুর সেবা আর ডাক্তার আসা পর্যন্ত বাছুর বাঁচানো।$s$,
$s$Foot and mouth disease (FMD, ক্ষুরা রোগ) is one of the most common and costly cattle diseases in Bangladesh. Adult cattle usually survive it, but a milking cow can lose much of her milk for weeks, draught animals cannot work, and **young calves can die suddenly** because the virus can damage the heart.

There is no medicine that kills the virus. What you can do is **vaccinate before it arrives, isolate quickly, nurse the sick animal well and call the vet** to treat secondary infections and pain.

## Signs to watch for

- High fever, dullness, not eating
- **Drooling strings of saliva** and smacking the lips
- Blisters on the tongue, gums and inside the lips that burst and leave raw sores
- Blisters between the hooves and around the coronet; the cow limps, shakes her feet or lies down a lot
- Sometimes blisters on the teats
- Sudden fall in milk

If you see drooling and lameness together in one animal, treat it as FMD until a vet says otherwise.

## Step 1: Isolate immediately

The virus spreads through saliva, milk, dung, breath and anything touched by sick animals: hands, clothes, buckets, ropes, vehicles.

- Move the sick animal to a separate shed or corner away from the others.
- One person cares for the sick animal and does that work **last** in the day.
- Use separate buckets and ropes for the sick animal.
- Keep visitors, traders and other farmers' animals away.
- Do not take animals to the haat or share bulls while the disease is around.

## Step 2: Call the vet or upazila livestock office

They can confirm the disease, treat fever and pain, prevent bacterial infection in the sores and advise on vaccinating the rest of the herd in the area. Report outbreaks: it helps the whole village.

## Step 3: Nursing care

Good nursing makes a large difference to how fast a cow recovers.

- **Soft feed:** green grass cut short, soaked bran, rice gruel. Hard straw hurts the mouth sores.
- **Clean water** always within reach; offer it often.
- **Mouth sores:** your vet may advise a mild antiseptic mouthwash. Do not apply home mixtures that burn.
- **Feet:** keep the floor dry and clean. Wash feet gently with clean water and an antiseptic your vet recommends, and protect wounds from flies.
- **Shade and rest:** a cool, dry, fly-free place.

## Step 4: Protect calves

- Keep young calves away from sick cows where possible.
- Do not let calves suckle a cow with teat blisters; feed colostrum or milk from a healthy source instead, boiled and cooled if it comes from a farm with FMD.
- Watch calves closely. Sudden weakness or death can happen without mouth sores.

## Step 5: Clean up

- Remove dung and bedding daily and bury or compost it away from other animals.
- Clean and disinfect the shed, troughs and tools after the animal recovers.
- Wash your hands and change clothes before touching healthy animals.

## Prevention: vaccinate on schedule

FMD vaccine protects only for a limited time, so it must be repeated regularly, usually **every 6 months**, as advised by your livestock office. Calves are vaccinated from about 3–4 months of age with a booster. Vaccinate the whole herd, not just a few animals, and buy new animals only from known sources, keeping them apart for 2–3 weeks.

Our article on the cattle vaccination schedule in Bangladesh has the full calendar.

## Record everything

Note when signs started, what the vet gave and the date of recovery. In **FarmFlows**, record vaccinations with their next due date so the whole herd stays on schedule, and the milk record shows how much the outbreak cost you.$s$,
$s$ক্ষুরা রোগ (FMD) বাংলাদেশে গরুর সবচেয়ে বেশি দেখা আর ক্ষতিকর রোগগুলোর একটা। বড় গরু সাধারণত সেরে ওঠে, কিন্তু দুধেল গাভী কয়েক সপ্তাহ ধরে অনেক দুধ কম দেয়, হালের গরু কাজ করতে পারে না, আর **ছোট বাছুর হঠাৎ মারা যেতে পারে**, কারণ ভাইরাস হৃৎপিণ্ডের ক্ষতি করতে পারে।

ভাইরাস মারার কোনো ওষুধ নেই। আপনি যা পারেন: **রোগ আসার আগে টিকা, দ্রুত আলাদা করা, অসুস্থ পশুর ভালো সেবা আর ডাক্তার ডাকা**, যিনি জ্বর, ব্যথা আর ঘায়ে অন্য জীবাণুর সংক্রমণের চিকিৎসা দেবেন।

## যে লক্ষণ দেখবেন

- বেশি জ্বর, ঝিমানো, খাওয়া বন্ধ
- **মুখ থেকে সুতার মতো লালা পড়া** আর ঠোঁট চাটা
- জিহ্বা, মাড়ি আর ঠোঁটের ভেতরে ফোসকা, যা ফেটে কাঁচা ঘা হয়
- খুরের মাঝে আর খুরের ওপরের কিনারায় ফোসকা; গরু খোঁড়ায়, পা ঝাড়ে বা বেশি শুয়ে থাকে
- কখনো বাঁটে ফোসকা
- হঠাৎ দুধ কমে যাওয়া

একই পশুতে লালা পড়া আর খোঁড়ানো একসাথে দেখলে ডাক্তার অন্য কিছু না বলা পর্যন্ত ক্ষুরা রোগ ধরে নিন।

## ধাপ ১: সঙ্গে সঙ্গে আলাদা করুন

ভাইরাস লালা, দুধ, গোবর, নিঃশ্বাস আর অসুস্থ পশু যা ছোঁয় তার মাধ্যমে ছড়ায়: হাত, কাপড়, বালতি, দড়ি, গাড়ি।

- অসুস্থ পশুকে আলাদা গোয়াল বা বাকিদের থেকে দূরের কোণে সরান।
- একজন মানুষ অসুস্থ পশুর দেখাশোনা করবেন, আর দিনের **সবশেষে** সেই কাজ করবেন।
- অসুস্থ পশুর জন্য আলাদা বালতি আর দড়ি রাখুন।
- দর্শনার্থী, ব্যাপারী আর অন্যের পশু দূরে রাখুন।
- রোগ চলাকালীন পশু হাটে নেবেন না বা ষাঁড় ভাগাভাগি করবেন না।

## ধাপ ২: ডাক্তার বা উপজেলা প্রাণিসম্পদ অফিসে খবর দিন

তাঁরা রোগ নিশ্চিত করবেন, জ্বর আর ব্যথার চিকিৎসা দেবেন, ঘায়ে জীবাণুর সংক্রমণ ঠেকাবেন আর এলাকার বাকি পশুকে টিকা দেওয়ার পরামর্শ দেবেন। রোগের খবর জানান: এতে পুরো গ্রামের উপকার হয়।

## ধাপ ৩: সেবা-যত্ন

ভালো সেবায় গরু অনেক তাড়াতাড়ি সেরে ওঠে।

- **নরম খাবার:** ছোট করে কাটা কাঁচা ঘাস, ভেজানো ভুসি, ভাতের মাড়। শক্ত খড় মুখের ঘায়ে লাগে।
- **পরিষ্কার পানি** সবসময় হাতের নাগালে; বারবার খেতে দিন।
- **মুখের ঘা:** ডাক্তার হালকা জীবাণুনাশক দিয়ে মুখ ধোয়ার পরামর্শ দিতে পারেন। জ্বালা করে এমন ঘরোয়া মিশ্রণ দেবেন না।
- **পা:** মেঝে শুকনো আর পরিষ্কার রাখুন। পরিষ্কার পানি আর ডাক্তারের দেওয়া জীবাণুনাশক দিয়ে আলতো করে পা ধুয়ে দিন, ঘা মাছি থেকে বাঁচান।
- **ছায়া আর বিশ্রাম:** ঠান্ডা, শুকনো, মাছিমুক্ত জায়গা।

## ধাপ ৪: বাছুর রক্ষা

- সম্ভব হলে ছোট বাছুর অসুস্থ গাভী থেকে দূরে রাখুন।
- বাঁটে ফোসকা থাকলে বাছুরকে সেই গাভীর দুধ চুষতে দেবেন না; সুস্থ উৎস থেকে শাল দুধ বা দুধ দিন, ক্ষুরা রোগের খামার থেকে এলে ফুটিয়ে ঠান্ডা করে।
- বাছুর ভালো করে খেয়াল রাখুন। মুখে ঘা ছাড়াই হঠাৎ দুর্বল হয়ে পড়া বা মারা যাওয়া হতে পারে।

## ধাপ ৫: পরিষ্কার

- প্রতিদিন গোবর আর বিছানা সরিয়ে অন্য পশু থেকে দূরে মাটিতে পুঁতে দিন বা কম্পোস্ট করুন।
- পশু সেরে উঠলে গোয়াল, খাবারের পাত্র আর যন্ত্রপাতি পরিষ্কার করে জীবাণুমুক্ত করুন।
- সুস্থ পশু ছোঁয়ার আগে হাত ধুয়ে কাপড় বদলান।

## প্রতিরোধ: সময়মতো টিকা

ক্ষুরা রোগের টিকা অল্প সময়ের জন্য সুরক্ষা দেয়, তাই নিয়মিত দিতে হয়, সাধারণত প্রাণিসম্পদ অফিসের পরামর্শে **প্রতি ৬ মাসে**। বাছুরকে প্রায় ৩–৪ মাস বয়স থেকে টিকা আর বুস্টার দেওয়া হয়। কয়েকটা না, পুরো পালকে টিকা দিন, আর নতুন পশু শুধু চেনা উৎস থেকে কিনে ২–৩ সপ্তাহ আলাদা রাখুন।

পুরো সময়সূচি আমাদের "বাংলাদেশে গরুর টিকার সময়সূচি" লেখায় আছে।

## সবকিছু লিখে রাখুন

কবে লক্ষণ শুরু হলো, ডাক্তার কী দিলেন আর কবে সেরে উঠল লিখুন। **FarmFlows**-এ টিকা পরের তারিখসহ লিখলে পুরো পাল সময়মতো টিকা পাবে, আর দুধের হিসাবে দেখা যাবে রোগে কত ক্ষতি হলো।$s$);

-- 8 -------------------------------------------------------------------
insert into _new_articles values (
$s$bloat-in-cattle-signs-emergency-prevention$s$, 'cattle-health', array['feed-ration'], interval '8 minutes',
$s$Bloat in cattle: how to spot it early, what to do while the vet is coming, and how to prevent it$s$,
$s$গরুর পেট ফাঁপা: আগেভাগে চেনা, ডাক্তার আসা পর্যন্ত করণীয় আর প্রতিরোধ$s$,
$s$A bloated cow can die within hours. The signs on the left side, safe first steps while you wait for the vet, and the feeding habits that prevent bloat.$s$,
$s$পেট ফাঁপা গরু কয়েক ঘণ্টায় মারা যেতে পারে। বাঁ দিকের লক্ষণ, ডাক্তার আসা পর্যন্ত নিরাপদ প্রথম কাজ, আর পেট ফাঁপা ঠেকানোর খাওয়ানোর অভ্যাস।$s$,
$s$Bloat (পেট ফাঁপা) happens when gas builds up in the rumen, the cow's first and largest stomach, faster than she can burp it out. The swollen rumen presses on the lungs and heart. **Severe bloat is an emergency: a cow can die within a few hours.**

Most cases are caused by feeding, so most cases can be prevented.

## Why bloat happens

- **Sudden change to lush green feed**, especially young legumes (khesari, clover, lentil plants) or very young, wet grass
- **Too much grain or concentrate at once**, for example a hungry cow breaking into the feed store
- **Spoiled, mouldy or frosted feed**
- **Something stuck in the throat** (a piece of potato, mango or other fruit) that stops burping
- A cow lying on her side for a long time, unable to get up

## Signs

- **Swelling high on the left side**, behind the last rib; it feels tight like a drum and sounds hollow when tapped
- Discomfort: kicking at the belly, getting up and down, not eating
- Fast breathing, breathing through the mouth, tongue out
- Drooling, groaning
- In late stages: staggering, falling, lying stretched out

## What to do immediately

1. **Call the vet or the upazila livestock office now.** Say "bloat" so they know it is urgent.
2. **Stop feeding.** Take away green feed and grain.
3. **Keep the cow standing and walking slowly**, if she can. Movement helps gas come up.
4. **Stand her with the front feet higher** than the back, on a slope or a raised mound, to ease pressure on the chest.
5. **Check the mouth and throat** for something stuck, carefully, without being bitten. If you see an object, the vet should remove it.
6. A short piece of wood or a rope tied through the mouth like a bit makes the cow chew and drool, which helps her burp. Many farmers do this while waiting.

**Do not** puncture the belly with a knife or bamboo yourself unless a vet has shown you and it is a last resort with the cow collapsing. It can cause fatal infection. Do not pour large amounts of oil or home mixtures down the throat of a cow that cannot swallow properly: it can go into the lungs.

The vet may pass a stomach tube to release gas or give medicine to break up foam. Frothy bloat from legumes needs this foam-breaking treatment.

## Prevention

- **Change feed slowly** over 7–10 days, especially when moving to fresh green grass or more concentrate.
- **Give dry straw before green feed**, so cows do not fill up on lush grass on an empty stomach.
- **Wilt** very young or wet grass and legumes for a few hours before feeding.
- **Do not overfeed grain or concentrate at once.** Split it into two or three meals and lock the feed store.
- **Feed plenty of roughage** (straw, mature grass): it keeps the rumen working and the cow chewing cud.
- **Cut fruit and vegetables into small pieces** or avoid feeding whole potatoes, mangoes and similar items.
- **Never feed mouldy or rotten feed.**

## Write it down

Note the date, what the cow ate before and what the vet did. If bloat repeats in one animal, tell your vet: it can point to another health problem. In **FarmFlows**, add it as a health record so the history stays with the cow.$s$,
$s$রুমেনে, অর্থাৎ গরুর প্রথম আর সবচেয়ে বড় পাকস্থলীতে, গ্যাস যত দ্রুত জমে গরু তত দ্রুত ঢেকুর তুলে বের করতে না পারলে পেট ফাঁপে। ফোলা রুমেন ফুসফুস আর হৃৎপিণ্ডে চাপ দেয়। **বেশি পেট ফাঁপা জরুরি অবস্থা: গরু কয়েক ঘণ্টার মধ্যে মারা যেতে পারে।**

বেশিরভাগ ক্ষেত্রে কারণ খাওয়ানো, তাই বেশিরভাগই ঠেকানো যায়।

## কেন পেট ফাঁপে

- **হঠাৎ রসালো কাঁচা খাবারে বদল**, বিশেষ করে কচি ডালজাতীয় গাছ (খেসারি, মসুরের গাছ ইত্যাদি) বা খুব কচি, ভেজা ঘাস
- **একবারে বেশি দানা বা দানাদার খাবার**, যেমন ক্ষুধার্ত গরু খাবারের গুদামে ঢুকে পড়লে
- **নষ্ট, ছত্রাক পড়া খাবার**
- **গলায় কিছু আটকে যাওয়া** (আলু, আম বা অন্য ফলের টুকরো), যাতে ঢেকুর বন্ধ হয়ে যায়
- গরু অনেকক্ষণ কাত হয়ে শুয়ে থাকা আর উঠতে না পারা

## লক্ষণ

- **বাঁ দিকে ওপরের অংশ ফোলা**, শেষ পাঁজরের পেছনে; ঢোলের মতো টানটান লাগে, টোকা দিলে ফাঁপা শব্দ হয়
- অস্বস্তি: পেটে লাথি মারা, বারবার ওঠা-বসা, খাওয়া বন্ধ
- দ্রুত শ্বাস, মুখ দিয়ে শ্বাস, জিহ্বা বের করা
- লালা পড়া, গোঙানো
- শেষ পর্যায়ে: টলমল করা, পড়ে যাওয়া, হাত-পা ছড়িয়ে শুয়ে থাকা

## সঙ্গে সঙ্গে যা করবেন

1. **এখনই ডাক্তার বা উপজেলা প্রাণিসম্পদ অফিসে ফোন করুন।** "পেট ফাঁপা" বলুন, যাতে জরুরি বোঝেন।
2. **খাওয়ানো বন্ধ করুন।** কাঁচা খাবার আর দানা সরিয়ে নিন।
3. পারলে **গরুকে দাঁড় করিয়ে রাখুন আর আস্তে হাঁটান।** নড়াচড়ায় গ্যাস ওপরে উঠতে সাহায্য হয়।
4. **সামনের পা পেছনের চেয়ে উঁচুতে** রেখে দাঁড় করান, ঢালু জায়গা বা উঁচু ঢিবিতে, এতে বুকের চাপ কমে।
5. **মুখ আর গলা দেখুন**, কিছু আটকে আছে কিনা, সাবধানে, যাতে কামড় না খান। কিছু দেখলে ডাক্তার বের করবেন।
6. মুখে লাগামের মতো করে একটা ছোট কাঠের টুকরো বা দড়ি বেঁধে দিলে গরু চিবায় আর লালা ফেলে, যা ঢেকুর তুলতে সাহায্য করে। অনেক খামারি অপেক্ষার সময় এটা করেন।

ডাক্তার দেখিয়ে না দিলে, আর গরু পড়ে যাওয়ার মতো শেষ অবস্থা না হলে, ছুরি বা বাঁশ দিয়ে নিজে পেট ফুটো **করবেন না**। এতে মারাত্মক সংক্রমণ হতে পারে। যে গরু ঠিকমতো গিলতে পারছে না, তার গলায় অনেক তেল বা ঘরোয়া মিশ্রণ ঢালবেন না: ফুসফুসে চলে যেতে পারে।

ডাক্তার পাকস্থলীতে নল দিয়ে গ্যাস বের করতে পারেন বা ফেনা ভাঙার ওষুধ দিতে পারেন। ডালজাতীয় গাছ খেয়ে ফেনাযুক্ত পেট ফাঁপায় এই ফেনা ভাঙার চিকিৎসা লাগে।

## প্রতিরোধ

- **খাবার ধীরে বদলান**, ৭–১০ দিন ধরে, বিশেষ করে টাটকা কাঁচা ঘাস বা বেশি দানাদার খাবারে যাওয়ার সময়।
- **কাঁচা খাবারের আগে শুকনো খড় দিন**, যাতে খালি পেটে গরু রসালো ঘাসে পেট না ভরায়।
- খুব কচি বা ভেজা ঘাস আর ডালজাতীয় গাছ খাওয়ানোর আগে কয়েক ঘণ্টা **নেতিয়ে নিন।**
- **একবারে বেশি দানা বা দানাদার খাবার দেবেন না।** দুই-তিন বেলায় ভাগ করুন আর খাবারের গুদাম তালা দিয়ে রাখুন।
- **যথেষ্ট আঁশজাতীয় খাবার দিন** (খড়, পাকা ঘাস): এতে রুমেন ঠিকমতো কাজ করে আর গরু জাবর কাটে।
- **ফল আর সবজি ছোট টুকরো করুন**, বা আস্ত আলু, আম এ ধরনের জিনিস খাওয়াবেন না।
- **ছত্রাক পড়া বা পচা খাবার কখনো দেবেন না।**

## লিখে রাখুন

তারিখ, আগে গরু কী খেয়েছিল আর ডাক্তার কী করলেন লিখুন। একই গরুর বারবার পেট ফাঁপলে ডাক্তারকে বলুন: অন্য স্বাস্থ্য সমস্যার লক্ষণ হতে পারে। **FarmFlows**-এ স্বাস্থ্য রেকর্ড হিসেবে লিখলে গরুর সাথে ইতিহাসটা থেকে যায়।$s$);

-- 9 -------------------------------------------------------------------
insert into _new_articles values (
$s$calf-diarrhea-scours-treatment-prevention$s$, 'cattle-health', array['calf-care'], interval '9 minutes',
$s$Calf diarrhoea (scours): keep the calf drinking, make oral rehydration at home and prevent it$s$,
$s$বাছুরের পাতলা পায়খানা: বাছুরকে পানিশূন্যতা থেকে বাঁচান, ঘরে খাবার স্যালাইন আর প্রতিরোধ$s$,
$s$Calves with diarrhoea mostly die of lost water, not the germ. Check dehydration, give oral rehydration, keep feeding milk and stop scours spreading.$s$,
$s$পাতলা পায়খানায় বেশিরভাগ বাছুর জীবাণুতে না, পানিশূন্যতায় মারা যায়। পানিশূন্যতা বোঝা, খাবার স্যালাইন দেওয়া, দুধ চালু রাখা আর রোগ ছড়ানো ঠেকানোর নিয়ম।$s$,
$s$Diarrhoea (scours) is the most common reason young calves die, especially in the first month. The germ itself, whether a virus, bacteria or a parasite, is often not what kills the calf. **Dehydration is.** A calf with watery diarrhoea can lose a large share of its body water in a day, and its blood becomes too acidic.

The good news: if you catch it early and **keep fluids going in**, most calves recover.

## When to worry

Call your vet or the upazila livestock office **the same day** if the calf:
- Stops drinking or cannot stand
- Has sunken eyes or a cold mouth and legs
- Has blood in the dung
- Has a fever, or a very low temperature
- Is younger than a week and has watery diarrhoea

## How to check dehydration

- **Skin pinch:** pinch the skin on the neck and let go. In a healthy calf it flattens immediately. If it stays tented for more than 2 seconds, the calf is dehydrated.
- **Eyes:** sunken eyes with a gap between the eyeball and the lid mean serious dehydration.
- **Mouth:** a dry, cool mouth and weak suckle reflex are bad signs.

## Oral rehydration: the most important treatment

Use a **calf oral rehydration product (electrolyte powder)** from a vet shop if you can. It contains the right balance of salt, sugar and buffers. Mix exactly as the packet says.

If none is available at night, a temporary home mix many vets accept until you can buy a proper product is: **1 litre of clean boiled and cooled water, 1 level teaspoon of salt and about 2 tablespoons of sugar or glucose**. This is a stopgap, not a full replacement.

- Give **about 2 litres two or three times a day** for a typical local calf, between milk feeds, more for bigger calves and as your vet advises.
- Use a bottle with a teat or a clean bucket. If the calf cannot drink, call the vet; forcing fluid into a calf that cannot swallow can put it into the lungs.

## Keep feeding milk

Old advice said to stop milk. Most vets now advise **continuing milk in normal amounts**, split into smaller, more frequent feeds, and giving rehydration solution **between** milk feeds, not mixed into the milk. Milk keeps the calf's strength up and helps the gut heal.

## Medicines

Do not give antibiotics on your own. Many cases are caused by viruses or parasites where antibiotics do not help, and misuse makes resistance worse. Your vet will decide whether medicine is needed and which one.

## Keep it from spreading

- Move the sick calf to a **clean, dry, separate pen**.
- Feed healthy calves first, sick calves last.
- Wash bottles, buckets and teats with hot water after each use.
- Remove wet bedding and dung daily.
- Wash hands after handling a sick calf.

## Prevention

- **Colostrum within the first hours of life**, enough of it (about 10% of birth weight in the first 12 hours, much of it in the first feed). Our newborn calf care article explains how.
- **Clean, dry calving area** and dry bedding for calves.
- **Clean feeding equipment** every time.
- **Do not overfeed milk** in one go, and keep feeding times regular.
- **Vaccinate pregnant cows** where your vet recommends it against common scour germs.
- **Do not crowd calves** together in damp sheds.

## Keep a record

Note the date, the calf's age, how long the diarrhoea lasted and what helped. In **FarmFlows**, add it as a health record for the calf. If several calves get scours at the same age, that pattern helps your vet find the cause.$s$,
$s$পাতলা পায়খানা ছোট বাছুর মারা যাওয়ার সবচেয়ে সাধারণ কারণ, বিশেষ করে প্রথম মাসে। ভাইরাস, ব্যাকটেরিয়া বা পরজীবী, যে জীবাণুই হোক, বেশিরভাগ সময় বাছুর সেটায় মরে না। **মরে পানিশূন্যতায়।** পানির মতো পায়খানা হলে বাছুর এক দিনেই শরীরের অনেকখানি পানি হারাতে পারে, আর রক্ত বেশি অম্লীয় হয়ে যায়।

ভালো খবর হলো: আগেভাগে ধরে **শরীরে পানি ঢোকানো চালু রাখলে** বেশিরভাগ বাছুর সেরে ওঠে।

## কখন চিন্তা করবেন

বাছুর এগুলো করলে **সেদিনই** ডাক্তার বা উপজেলা প্রাণিসম্পদ অফিসে খবর দিন:
- খাওয়া বন্ধ বা দাঁড়াতে পারছে না
- চোখ বসে গেছে, বা মুখ আর পা ঠান্ডা
- পায়খানায় রক্ত
- জ্বর, বা তাপমাত্রা খুব কম
- এক সপ্তাহের কম বয়স আর পানির মতো পায়খানা

## পানিশূন্যতা কীভাবে বুঝবেন

- **চামড়া চিমটি:** ঘাড়ের চামড়া চিমটি কেটে ছেড়ে দিন। সুস্থ বাছুরে সাথে সাথে সমান হয়ে যায়। ২ সেকেন্ডের বেশি উঁচু হয়ে থাকলে বাছুর পানিশূন্য।
- **চোখ:** চোখ বসে গিয়ে চোখের মণি আর পাতার মাঝে ফাঁক দেখা গেলে পানিশূন্যতা গুরুতর।
- **মুখ:** মুখ শুকনো আর ঠান্ডা, চোষার জোর কম হলে খারাপ লক্ষণ।

## খাবার স্যালাইন: সবচেয়ে জরুরি চিকিৎসা

পারলে পশুর ওষুধের দোকান থেকে **বাছুরের খাবার স্যালাইন (ইলেকট্রোলাইট পাউডার)** নিন। এতে লবণ, চিনি আর বাফার ঠিক পরিমাণে থাকে। প্যাকেটে যেভাবে লেখা, ঠিক সেভাবে গুলুন।

রাতে কিছু না পেলে, ঠিকমতো জিনিস কেনা পর্যন্ত অনেক ডাক্তার যে সাময়িক ঘরোয়া মিশ্রণ মেনে নেন: **১ লিটার ফোটানো ঠান্ডা পরিষ্কার পানি, ১ সমান চা-চামচ লবণ আর প্রায় ২ টেবিল-চামচ চিনি বা গ্লুকোজ**। এটা জোড়াতালি, পুরো বিকল্প না।

- সাধারণ দেশি বাছুরকে দুধ খাওয়ানোর ফাঁকে দিনে দুই-তিনবার **প্রায় ২ লিটার করে** দিন, বড় বাছুরকে বেশি, আর ডাক্তারের পরামর্শমতো।
- নিপলওয়ালা বোতল বা পরিষ্কার বালতি ব্যবহার করুন। বাছুর খেতে না পারলে ডাক্তার ডাকুন; গিলতে না পারা বাছুরের মুখে জোর করে তরল দিলে ফুসফুসে যেতে পারে।

## দুধ খাওয়ানো বন্ধ করবেন না

আগে দুধ বন্ধ রাখার কথা বলা হতো। এখন বেশিরভাগ ডাক্তার **স্বাভাবিক পরিমাণে দুধ চালু রাখার** পরামর্শ দেন, ছোট ছোট ভাগে বারবার, আর দুধের সাথে মিশিয়ে না, দুধ খাওয়ানোর **ফাঁকে** স্যালাইন। দুধে বাছুরের শক্তি থাকে আর অন্ত্র সারতে সাহায্য করে।

## ওষুধ

নিজে থেকে অ্যান্টিবায়োটিক দেবেন না। অনেক ক্ষেত্রে কারণ ভাইরাস বা পরজীবী, যেখানে অ্যান্টিবায়োটিক কাজ করে না, আর ভুল ব্যবহারে জীবাণু ওষুধ-সহনশীল হয়। ওষুধ লাগবে কিনা আর কোনটা, ডাক্তার ঠিক করবেন।

## রোগ ছড়ানো ঠেকান

- অসুস্থ বাছুরকে **পরিষ্কার, শুকনো, আলাদা ঘরে** সরান।
- আগে সুস্থ বাছুর, শেষে অসুস্থ বাছুরকে খাওয়ান।
- প্রতিবার ব্যবহারের পর বোতল, বালতি আর নিপল গরম পানিতে ধুয়ে নিন।
- প্রতিদিন ভেজা বিছানা আর গোবর সরান।
- অসুস্থ বাছুর ধরার পর হাত ধুয়ে নিন।

## প্রতিরোধ

- **জন্মের প্রথম কয়েক ঘণ্টার মধ্যে যথেষ্ট শাল দুধ** (প্রথম ১২ ঘণ্টায় জন্ম-ওজনের প্রায় ১০%, তার বড় অংশ প্রথমবারেই)। কীভাবে দেবেন, নবজাতক বাছুরের যত্নের লেখায় আছে।
- **পরিষ্কার, শুকনো বাছুর প্রসবের জায়গা** আর বাছুরের জন্য শুকনো বিছানা।
- প্রতিবার **পরিষ্কার খাওয়ানোর পাত্র**।
- একবারে **বেশি দুধ দেবেন না**, আর খাওয়ানোর সময় নিয়মিত রাখুন।
- ডাক্তার বললে সাধারণ পাতলা পায়খানার জীবাণুর বিরুদ্ধে **গর্ভবতী গাভীকে টিকা** দিন।
- স্যাঁতসেঁতে ঘরে **অনেক বাছুর গাদাগাদি করে রাখবেন না।**

## লিখে রাখুন

তারিখ, বাছুরের বয়স, কত দিন পায়খানা চলল আর কী কাজ করল লিখুন। **FarmFlows**-এ বাছুরের স্বাস্থ্য রেকর্ড হিসেবে লিখুন। একই বয়সে কয়েকটা বাছুরের হলে সেই ধরন দেখে ডাক্তার কারণ খুঁজে পেতে পারেন।$s$);

-- 10 ------------------------------------------------------------------
insert into _new_articles values (
$s$repeat-breeding-cow-not-conceiving$s$, 'breeding', array['artificial-insemination', 'heat-detection'], interval '10 minutes',
$s$Repeat breeding: why your cow comes into heat again after AI, and what to check$s$,
$s$রিপিট ব্রিডিং: কৃত্রিম প্রজননের পরও গাভী কেন আবার গরম হয়, আর কী দেখবেন$s$,
$s$A cow needing three or more services wastes months of milk. Common causes of repeat breeding, from AI timing to feed and infection, and a checklist.$s$,
$s$তিনবার বা বেশি প্রজনন লাগলে কয়েক মাসের দুধ নষ্ট হয়। রিপিট ব্রিডিংয়ের কারণ, প্রজননের সময় থেকে খাবার ও সংক্রমণ, আর ঠিক করার চেকলিস্ট।$s$,
$s$A **repeat breeder** is a cow that looks healthy, comes into heat at normal intervals, but does not get pregnant after three or more services. Every missed cycle adds about three weeks to the gap between calves, and that is three weeks of a dry, eating cow with no new calf and no new lactation.

Repeat breeding is rarely caused by one thing. Work through the list below with your vet or AI technician.

## 1. Was the timing right?

This is the most common cause, and the cheapest to fix.

- A cow should be inseminated in the **second half of standing heat**. A widely used rule: a cow first seen in standing heat in the morning is inseminated that evening; one first seen in the evening is inseminated the next morning.
- Too early or too late, the egg and the semen miss each other.
- **Missed heat signs** lead to guessing. Watch at least two or three times a day, early morning and evening, for about 20–30 minutes.

Our article on cow heat signs and the best time for AI explains the morning-evening rule in detail.

## 2. Was the semen handled properly?

- Semen straws must stay frozen in liquid nitrogen until a few seconds before use.
- Thawing, handling and placing the semen in the right part of the reproductive tract all need skill.
- Use a trained, registered AI technician and ask where the semen comes from.

## 3. Is the cow getting enough of the right feed?

- **Body condition:** cows that are too thin or too fat both conceive poorly. Aim for a cow whose ribs you can feel but not clearly see.
- **Energy and protein:** a high-yielding cow that loses a lot of weight after calving often does not conceive until she stops losing weight.
- **Minerals and vitamins:** phosphorus, copper, zinc, selenium and vitamin A are often short in straw-based diets. A good mineral mixture, as advised by your livestock office, is cheap insurance.
- **Green fodder** throughout the year helps.

## 4. Is there an infection in the uterus?

Signs include a cloudy or pus-like discharge, especially during heat, or a smell. Problems after calving (retained placenta, a difficult birth) often lead to infection later. **Only a vet can examine and treat this properly.** Do not wash the uterus out with home solutions.

## 5. Heat stress

Hot, humid months reduce conception in cows, especially crossbreds. Shade, fans or sprinklers, cool water and inseminating in the cooler part of the day all help. Our article on summer heat stress has practical steps.

## 6. Other reasons your vet may check

- Cysts on the ovaries or hormone imbalance
- Problems with the cow's reproductive tract from birth or injury
- Early embryo loss
- Diseases such as brucellosis that cause abortion (testing and advice from your vet)

## A practical checklist

- Record every heat, every insemination and the bull or semen used
- Check pregnancy about **60–90 days after AI** with your vet, instead of guessing
- If a cow has had **three failed services**, ask your vet for a full examination before the fourth
- Review feeding and add a mineral mixture
- Keep calving areas clean to reduce uterine infections

## Let the records do the work

In **FarmFlows**, record heats and inseminations on the breeding page. The app shows the expected next heat, the due date for a pregnancy check and how many services each cow needed. That history is exactly what your vet will ask for.$s$,
$s$**রিপিট ব্রিডার** বলতে এমন গাভী, যাকে সুস্থ দেখায়, স্বাভাবিক সময় পরপর গরম হয়, কিন্তু তিন বা তার বেশিবার প্রজননের পরও গর্ভবতী হয় না। প্রতিটা ব্যর্থ চক্রে দুই বাছুরের মাঝের সময় প্রায় তিন সপ্তাহ বাড়ে, আর সেই তিন সপ্তাহ গাভী শুধু খায়, দুধ বা নতুন বাছুর দেয় না।

রিপিট ব্রিডিং সাধারণত একটা কারণে হয় না। ডাক্তার বা কৃত্রিম প্রজনন কর্মীর সাথে নিচের তালিকা ধরে দেখুন।

## ১. সময় কি ঠিক ছিল?

এটাই সবচেয়ে সাধারণ কারণ, আর ঠিক করাও সবচেয়ে সস্তা।

- গাভীকে **দাঁড়িয়ে থাকা গরমের দ্বিতীয় অর্ধেকে** প্রজনন করাতে হয়। বহুল প্রচলিত নিয়ম: সকালে প্রথম দাঁড়ানো গরম দেখা গেলে সেদিন বিকেলে, আর বিকেলে প্রথম দেখা গেলে পরদিন সকালে প্রজনন।
- আগে বা পরে হলে ডিম আর বীজ একে অপরকে পায় না।
- **গরমের লক্ষণ চোখ এড়ালে** আন্দাজে চলতে হয়। দিনে অন্তত দুই-তিনবার, ভোরে আর বিকেলে, ২০–৩০ মিনিট করে খেয়াল রাখুন।

সকাল-বিকেলের নিয়ম বিস্তারিত আছে আমাদের "গাভীর গরম হওয়ার লক্ষণ ও কৃত্রিম প্রজননের সঠিক সময়" লেখায়।

## ২. বীজ কি ঠিকমতো রাখা আর ব্যবহার হয়েছিল?

- বীজের স্ট্র ব্যবহারের কয়েক সেকেন্ড আগ পর্যন্ত তরল নাইট্রোজেনে জমা থাকতে হয়।
- গলানো, ধরা আর প্রজনন অঙ্গের সঠিক জায়গায় বীজ রাখা, সবকিছুতেই দক্ষতা লাগে।
- প্রশিক্ষিত, নিবন্ধিত কৃত্রিম প্রজনন কর্মী দিয়ে করান আর বীজ কোথা থেকে এসেছে জিজ্ঞেস করুন।

## ৩. গাভী কি ঠিক খাবার যথেষ্ট পাচ্ছে?

- **শরীরের অবস্থা:** বেশি রোগা আর বেশি মোটা, দুই ধরনের গাভীই কম গর্ভবতী হয়। লক্ষ্য রাখুন যেন হাত দিলে পাঁজর বোঝা যায়, কিন্তু চোখে স্পষ্ট দেখা না যায়।
- **শক্তি আর আমিষ:** বেশি দুধের গাভী বাছুর দেওয়ার পর অনেক ওজন হারালে, ওজন কমা না থামা পর্যন্ত অনেক সময় গর্ভবতী হয় না।
- **খনিজ আর ভিটামিন:** খড়নির্ভর খাবারে প্রায়ই ফসফরাস, কপার, জিংক, সেলেনিয়াম আর ভিটামিন এ-র ঘাটতি থাকে। প্রাণিসম্পদ অফিসের পরামর্শে ভালো খনিজ মিশ্রণ কম খরচে নিশ্চিন্ত থাকার উপায়।
- সারা বছর **কাঁচা ঘাস** দিলে উপকার হয়।

## ৪. জরায়ুতে কি সংক্রমণ আছে?

লক্ষণ: ঘোলা বা পুঁজের মতো স্রাব, বিশেষ করে গরমের সময়, বা দুর্গন্ধ। বাছুর দেওয়ার পরের সমস্যা (ফুল না পড়া, কঠিন প্রসব) থেকে পরে প্রায়ই সংক্রমণ হয়। **এটা ঠিকমতো পরীক্ষা আর চিকিৎসা শুধু ডাক্তারই করতে পারেন।** ঘরোয়া দ্রবণ দিয়ে জরায়ু ধোবেন না।

## ৫. গরমের চাপ

গরম, স্যাঁতসেঁতে মাসে গাভীর গর্ভধারণ কমে, বিশেষ করে সংকর জাতে। ছায়া, ফ্যান বা পানি ছিটানো, ঠান্ডা পানি আর দিনের ঠান্ডা সময়ে প্রজনন, সবই সাহায্য করে। কাজের উপায়গুলো আছে আমাদের গরমের চাপ নিয়ে লেখায়।

## ৬. ডাক্তার আর যা দেখতে পারেন

- ডিম্বাশয়ে সিস্ট বা হরমোনের গোলমাল
- জন্মগত বা আঘাতজনিত প্রজনন অঙ্গের সমস্যা
- শুরুর দিকেই ভ্রূণ নষ্ট হওয়া
- ব্রুসেলোসিসের মতো গর্ভপাত ঘটানো রোগ (ডাক্তারের পরীক্ষা ও পরামর্শ)

## কাজের চেকলিস্ট

- প্রতিবার গরম, প্রতিবার প্রজনন আর কোন ষাঁড় বা বীজ, সব লিখে রাখুন
- আন্দাজ না করে কৃত্রিম প্রজননের **প্রায় ৬০–৯০ দিন পর** ডাক্তার দিয়ে গর্ভ পরীক্ষা করান
- কোনো গাভীর **তিনবার ব্যর্থ হলে** চতুর্থবারের আগে ডাক্তারকে দিয়ে পুরো পরীক্ষা করান
- খাবার দেখে খনিজ মিশ্রণ যোগ করুন
- জরায়ুর সংক্রমণ কমাতে বাছুর প্রসবের জায়গা পরিষ্কার রাখুন

## হিসাবই কাজটা করুক

**FarmFlows**-এর প্রজনন পাতায় গরম আর প্রজনন লিখুন। অ্যাপ পরের সম্ভাব্য গরম, গর্ভ পরীক্ষার তারিখ আর প্রতিটা গাভীর কতবার প্রজনন লেগেছে দেখায়। ডাক্তার ঠিক এই ইতিহাসটাই জানতে চাইবেন।$s$);
-- 11 ------------------------------------------------------------------
insert into _new_articles values (
$s$dry-period-management-dairy-cow$s$, 'breeding', array['dry-cow', 'calving'], interval '11 minutes',
$s$The dry period: why your cow needs two months off before calving, and how to manage it$s$,
$s$গাভী শুকানোর সময়: বাছুর দেওয়ার আগে দুই মাসের বিরতি কেন দরকার, আর কীভাবে সামলাবেন$s$,
$s$Milking a cow until calving costs milk next lactation. When and how to dry her off safely, what to feed in the last two months and signs to watch.$s$,
$s$বাছুর দেওয়া পর্যন্ত দুধ দোহালে পরের মৌসুমে দুধ কমে। কখন দুধ বন্ধ করবেন, নিরাপদে কীভাবে, শেষ দুই মাসে কী খাওয়াবেন আর কোন লক্ষণ দেখবেন।$s$,
$s$Many farmers keep milking a pregnant cow for as long as she gives anything, sometimes right up to calving. It feels like free milk. In reality it is borrowed milk: the cow pays it back with a weaker calf, a harder calving and **less milk in the whole next lactation**.

The **dry period** is the time, usually **about 60 days before the expected calving date**, when you stop milking and let the udder rest.

## Why the udder needs rest

During the dry period:

- Old udder tissue repairs and new milk-producing tissue grows for the next lactation.
- The calf grows fastest in the last two months of pregnancy and needs the cow's nutrients.
- The cow can rebuild body reserves she lost during milking.

Cows with a short or no dry period often give noticeably less milk afterwards, and are more prone to mastitis and metabolic problems.

## How long?

- **Around 60 days** is the common target for dairy cows.
- **Less than about 40 days** usually reduces the next lactation.
- **Much longer than 70 days** can make cows too fat, which brings its own calving problems.

Count back from the due date. If you record the insemination date, the expected calving date is roughly **283 days later** for most cattle. FarmFlows calculates it for you on the breeding page.

## How to dry off a cow

Two common approaches:

**Abrupt stop (for most cows):**
1. On the chosen day, milk out completely.
2. Stop milking altogether.
3. For a few days, reduce concentrate and give more dry straw and less lush green grass, so milk production drops.
4. Keep her bedding clean and dry.

**Gradual stop (for high-yielding cows):**
Reduce to once-a-day milking for several days, cut concentrate and water access only as advised by your vet, then stop completely.

The udder will swell for a few days and then soften as the milk is reabsorbed. **Do not milk out a little "to relieve her"**: that restarts production.

Ask your vet whether a dry-cow treatment to protect the udder against infection is advisable for your herd. Some farms use it for all cows, others only for cows with a history of mastitis.

## Watch the udder for the first two weeks

Check twice a day. Call the vet if a quarter becomes **hot, hard, red or painful**, if the cow has a fever or stops eating. Mastitis in the dry period is easy to miss and costly later.

## Feeding the dry cow

**Early dry period (the first 5–6 weeks):**
- Mainly good roughage: straw, hay or mature green grass
- A modest amount of concentrate if she is thin; little or none if she is fat
- A good mineral mixture and clean water

**The last 2–3 weeks before calving (close-up):**
- Gradually introduce the concentrate she will eat after calving, in small amounts, so her rumen adapts
- Keep minerals balanced. Avoid feeding large amounts of calcium-rich supplements right before calving unless your vet advises it, as it can increase milk fever risk
- Plenty of clean water, shade and space to lie down

Aim for a cow that calves in good, not fat, condition.

## Housing

- A clean, dry, separate area or at least a dry corner of the shed
- Exercise: walking helps prevent leg and calving problems
- A clean calving area ready before the due date

## Signs calving is near

- Udder fills and teats become full
- Ligaments on either side of the tail head soften and sink
- Vulva swells and loosens; clear mucus may hang down
- Restlessness, separating from the herd

## Plan it with records

In **FarmFlows**, the breeding page shows each cow's expected calving date and a dry-off date about two months earlier. Mark the cow as dry when you stop milking so her milk record and your feed plan stay correct.$s$,
$s$অনেক খামারি গর্ভবতী গাভী যতক্ষণ কিছু দুধ দেয় ততক্ষণ দোহান, কখনো বাছুর দেওয়ার দিন পর্যন্ত। মনে হয় বিনা খরচের দুধ। আসলে এটা ধার করা দুধ: গাভী তা শোধ করে দুর্বল বাছুর, কঠিন প্রসব আর **পরের পুরো মৌসুমে কম দুধ** দিয়ে।

**শুকানোর সময় (ড্রাই পিরিয়ড)** হলো, সাধারণত **বাছুর দেওয়ার সম্ভাব্য তারিখের প্রায় ৬০ দিন আগে**, দোহানো বন্ধ করে ওলানকে বিশ্রাম দেওয়ার সময়।

## ওলানের বিশ্রাম কেন দরকার

শুকানোর সময়ে:

- পুরনো ওলানের কোষ মেরামত হয় আর পরের মৌসুমের জন্য নতুন দুধ তৈরির কোষ গড়ে ওঠে।
- গর্ভের শেষ দুই মাসে বাছুর সবচেয়ে দ্রুত বাড়ে, তখন গাভীর পুষ্টি তারই লাগে।
- দোহানোর সময় গাভী শরীরের যে মজুত হারিয়েছে, তা আবার জমাতে পারে।

যে গাভীর শুকানোর সময় কম বা একেবারেই নেই, পরে প্রায়ই সে লক্ষণীয়ভাবে কম দুধ দেয়, আর ওলান ফোলা ও বিপাকজনিত সমস্যা বেশি হয়।

## কত দিন?

- দুধের গাভীর জন্য প্রচলিত লক্ষ্য **প্রায় ৬০ দিন**।
- **প্রায় ৪০ দিনের কম** হলে সাধারণত পরের মৌসুমে দুধ কমে।
- **৭০ দিনের অনেক বেশি** হলে গাভী বেশি মোটা হতে পারে, তাতে প্রসবে অন্য সমস্যা হয়।

বাছুর দেওয়ার তারিখ থেকে পেছনে গুনুন। প্রজননের তারিখ লেখা থাকলে বেশিরভাগ গরুর বাছুর দেওয়ার সম্ভাব্য তারিখ মোটামুটি **২৮৩ দিন পরে**। FarmFlows প্রজনন পাতায় এটা নিজেই হিসাব করে দেয়।

## গাভীর দুধ কীভাবে বন্ধ করবেন

দুটো প্রচলিত উপায়:

**একবারে বন্ধ (বেশিরভাগ গাভীর জন্য):**
1. ঠিক করা দিনে পুরো দুধ দুইয়ে নিন।
2. তারপর দোহানো পুরো বন্ধ করুন।
3. কয়েক দিন দানাদার খাবার কমিয়ে বেশি শুকনো খড় আর কম রসালো কাঁচা ঘাস দিন, যাতে দুধ উৎপাদন কমে।
4. বিছানা পরিষ্কার আর শুকনো রাখুন।

**ধীরে বন্ধ (বেশি দুধের গাভীর জন্য):**
কয়েক দিন দিনে একবার দোহান, দানাদার খাবার কমান, আর পানি কমানোর ব্যাপারে শুধু ডাক্তারের পরামর্শ মানুন, তারপর পুরো বন্ধ করুন।

কয়েক দিন ওলান ফুলে থাকবে, তারপর দুধ শরীরে শুষে নিলে নরম হয়ে যাবে। **"আরাম দিতে" একটু দুইয়ে দেবেন না**: তাতে আবার দুধ তৈরি শুরু হয়।

আপনার খামারে ওলানকে সংক্রমণ থেকে বাঁচাতে শুকানোর সময়ের চিকিৎসা (ড্রাই কাউ থেরাপি) দরকার কিনা ডাক্তারকে জিজ্ঞেস করুন। কোনো খামার সব গাভীকে দেয়, কেউ শুধু যাদের আগে ওলান ফোলা হয়েছে তাদের।

## প্রথম দুই সপ্তাহ ওলান খেয়াল করুন

দিনে দুবার দেখুন। কোনো বাঁট **গরম, শক্ত, লাল বা ব্যথাযুক্ত** হলে, জ্বর হলে বা খাওয়া বন্ধ করলে ডাক্তার ডাকুন। শুকানোর সময়ের ওলান ফোলা চোখ এড়ানো সহজ, আর পরে খরচ অনেক।

## শুকনো গাভীর খাবার

**শুকানোর শুরুর সময় (প্রথম ৫–৬ সপ্তাহ):**
- মূলত ভালো আঁশজাতীয় খাবার: খড় বা পাকা কাঁচা ঘাস
- রোগা হলে অল্প দানাদার খাবার; মোটা হলে খুব কম বা একেবারে না
- ভালো খনিজ মিশ্রণ আর পরিষ্কার পানি

**বাছুর দেওয়ার আগের শেষ ২–৩ সপ্তাহ:**
- বাছুর দেওয়ার পর যে দানাদার খাবার খাবে, তা অল্প অল্প করে শুরু করুন, যাতে রুমেন মানিয়ে নেয়
- খনিজ সুষম রাখুন। ডাক্তার না বললে বাছুর দেওয়ার ঠিক আগে বেশি ক্যালসিয়ামের সম্পূরক দেবেন না, এতে দুধ জ্বরের ঝুঁকি বাড়তে পারে
- প্রচুর পরিষ্কার পানি, ছায়া আর শোয়ার জায়গা

লক্ষ্য রাখুন গাভী যেন ভালো অবস্থায়, কিন্তু বেশি মোটা না হয়ে, বাছুর দেয়।

## থাকার জায়গা

- পরিষ্কার, শুকনো, আলাদা জায়গা, অন্তত গোয়ালের একটা শুকনো কোণ
- হাঁটাচলা: এতে পা আর প্রসবের সমস্যা কম হয়
- নির্ধারিত তারিখের আগেই পরিষ্কার প্রসবের জায়গা তৈরি

## বাছুর দেওয়া কাছে আসার লক্ষণ

- ওলান ভরে যায়, বাঁট টানটান হয়
- লেজের গোড়ার দুপাশের মাংসপেশি নরম হয়ে বসে যায়
- যোনিমুখ ফুলে ঢিলা হয়; স্বচ্ছ শ্লেষ্মা ঝুলতে পারে
- অস্থিরতা, পাল থেকে আলাদা হয়ে যাওয়া

## হিসাব দিয়ে পরিকল্পনা

**FarmFlows**-এর প্রজনন পাতায় প্রতিটা গাভীর বাছুর দেওয়ার সম্ভাব্য তারিখ আর তার প্রায় দুই মাস আগের শুকানোর তারিখ দেখা যায়। দোহানো বন্ধ করলে গাভীকে শুকনো হিসেবে চিহ্নিত করুন, তাহলে দুধের হিসাব আর খাবারের পরিকল্পনা ঠিক থাকবে।$s$);

-- 12 ------------------------------------------------------------------
insert into _new_articles values (
$s$urea-treated-rice-straw-cattle-feed$s$, 'feed-nutrition', array['feed-ration', 'fodder'], interval '12 minutes',
$s$Urea-treated rice straw: make plain straw more nutritious for cattle, safely$s$,
$s$ইউরিয়া মেশানো খড়: সাধারণ খড়কে গরুর জন্য বেশি পুষ্টিকর করার নিরাপদ নিয়ম$s$,
$s$Plain rice straw is cheap but poor feed. How urea treatment improves it, the steps, how long to store it and the safety rules against urea poisoning.$s$,
$s$সাধারণ খড় সস্তা, কিন্তু পুষ্টি কম। ইউরিয়া মেশালে কীভাবে মান বাড়ে, তৈরির ধাপ, কত দিন রাখতে হয় আর ইউরিয়া বিষক্রিয়া ঠেকানোর নিরাপত্তা নিয়ম।$s$,
$s$Rice straw is the main roughage on most Bangladeshi farms. It is cheap and available, but it is low in protein and hard for the cow to digest. A cow on plain straw eats less and gives less milk or gains less weight.

**Urea treatment** is a low-cost way to improve straw. When urea is dissolved in water and sealed into straw for a couple of weeks, it turns into ammonia, which softens the tough fibre and adds nitrogen the rumen microbes can use. Treated straw is softer, smells of ammonia, and cows usually eat more of it.

The method below is widely promoted in Bangladesh by livestock extension services. Ask your upazila livestock office for their recommended proportions for your area.

## What you need

- Dry, clean rice straw (not rotten or mouldy)
- **Fertiliser-grade urea**
- Clean water
- A plastic sheet, a pit lined with polythene, a drum or a large plastic bag
- A scale, a bucket and a watering can

## A commonly used ratio

A widely used guideline is: for **100 kg of straw, about 4 kg of urea dissolved in about 50 litres of water**. Some programmes use slightly different amounts. Never increase the urea on your own.

## Step by step

1. **Weigh the straw** you will treat. Chopping it into 5–10 cm pieces helps it pack tightly.
2. **Dissolve the urea fully** in the water. Stir until no grains remain.
3. **Spread a layer of straw** (about 15–20 cm) on the plastic or in the pit.
4. **Sprinkle the urea solution** evenly over the layer with a watering can, and press the straw down.
5. **Repeat in layers** until all the straw and solution are used. Press firmly to push out air.
6. **Seal tightly** with plastic and put weight on top (soil, bricks) so no air or rain gets in.
7. **Wait about 2–3 weeks** in warm weather, longer in cold weather.

## Feeding it out

1. Open one side only and take out what you need for a day or two. Reseal the rest.
2. **Spread the straw in the open air for a few hours** before feeding, so the strong ammonia smell goes away.
3. **Introduce it slowly** over about a week, mixing with plain straw at first.
4. Treated straw should still be fed with **green fodder and some concentrate**. It improves straw; it does not replace a balanced diet.

## Safety: urea can poison cattle

Urea is safe only when it has fully worked into the straw and is fed in the right amounts. **Never let cattle eat urea fertiliser directly or drink the urea solution.**

- Store urea bags locked away from animals.
- Do not use more urea than recommended.
- Do not feed treated straw to calves under about six months; their rumens are not developed yet.
- Do not feed it to sick, starving or very weak animals without your vet's advice.

**Signs of urea poisoning** (usually within an hour of eating too much): trembling, staggering, frothing at the mouth, bloating, laboured breathing, collapse. **Call the vet immediately.** Many farmers give large amounts of vinegar or sour liquid by mouth while waiting, but only if the animal can still swallow and as your vet advises by phone.

## Is it worth it?

Usually yes, when straw is your main roughage and green fodder is limited. Weigh the cost of urea and labour against the extra milk or weight. In **FarmFlows**, record urea as a feed expense and watch your cost per litre or per kilo of weight gain over the next month or two.$s$,
$s$বেশিরভাগ বাংলাদেশি খামারে খড়ই প্রধান আঁশজাতীয় খাবার। সস্তা আর সহজলভ্য, কিন্তু আমিষ কম আর গরুর পক্ষে হজম করা কঠিন। শুধু খড় খেলে গরু কম খায়, আর দুধ বা ওজন কম বাড়ে।

**ইউরিয়া মেশানো** খড়ের মান বাড়ানোর কম খরচের উপায়। ইউরিয়া পানিতে গুলে খড়ের সাথে মিশিয়ে দুই সপ্তাহের মতো বন্ধ করে রাখলে তা অ্যামোনিয়ায় পরিণত হয়, যা শক্ত আঁশ নরম করে আর রুমেনের অণুজীবের কাজে লাগে এমন নাইট্রোজেন যোগ করে। ইউরিয়া মেশানো খড় নরম হয়, অ্যামোনিয়ার গন্ধ থাকে, আর গরু সাধারণত বেশি খায়।

নিচের পদ্ধতি বাংলাদেশে প্রাণিসম্পদ সম্প্রসারণ সেবা ব্যাপকভাবে প্রচার করে। আপনার এলাকার জন্য সুপারিশকৃত অনুপাত উপজেলা প্রাণিসম্পদ অফিসে জেনে নিন।

## যা লাগবে

- শুকনো, পরিষ্কার ধানের খড় (পচা বা ছত্রাক পড়া না)
- **সারের ইউরিয়া**
- পরিষ্কার পানি
- পলিথিন, পলিথিন বিছানো গর্ত, ড্রাম বা বড় প্লাস্টিকের ব্যাগ
- দাঁড়িপাল্লা, বালতি আর ঝাঁঝরি

## প্রচলিত একটা অনুপাত

বহুল ব্যবহৃত নিয়ম: **১০০ কেজি খড়ের জন্য প্রায় ৫০ লিটার পানিতে প্রায় ৪ কেজি ইউরিয়া গুলে**। কিছু কর্মসূচিতে পরিমাণ একটু আলাদা। নিজে থেকে কখনো ইউরিয়া বাড়াবেন না।

## ধাপে ধাপে

1. যে খড় মেশাবেন **তা মেপে নিন।** ৫–১০ সেমি করে কুচি করলে শক্ত করে চাপা যায়।
2. পানিতে **ইউরিয়া পুরো গুলে নিন।** কোনো দানা না থাকা পর্যন্ত নাড়ুন।
3. পলিথিনের ওপর বা গর্তে **এক স্তর খড় বিছান** (প্রায় ১৫–২০ সেমি)।
4. ঝাঁঝরি দিয়ে **ইউরিয়ার পানি সমানভাবে ছিটান**, তারপর খড় চেপে দিন।
5. সব খড় আর পানি শেষ না হওয়া পর্যন্ত **স্তরে স্তরে করুন।** বাতাস বের করতে শক্ত করে চাপুন।
6. পলিথিন দিয়ে **শক্ত করে মুখ বন্ধ করুন** আর ওপরে ভার (মাটি, ইট) দিন, যাতে বাতাস বা বৃষ্টি না ঢোকে।
7. গরমে **প্রায় ২–৩ সপ্তাহ** রাখুন, শীতে আরও বেশি।

## খাওয়ানোর নিয়ম

1. শুধু এক পাশ খুলে এক-দুই দিনের মতো বের করুন। বাকিটা আবার বন্ধ করুন।
2. খাওয়ানোর আগে **কয়েক ঘণ্টা খোলা বাতাসে ছড়িয়ে রাখুন**, যাতে অ্যামোনিয়ার কড়া গন্ধ চলে যায়।
3. প্রায় এক সপ্তাহ ধরে **ধীরে শুরু করুন**, প্রথমে সাধারণ খড়ের সাথে মিশিয়ে।
4. ইউরিয়া মেশানো খড়ের সাথেও **কাঁচা ঘাস আর কিছু দানাদার খাবার** দিতে হবে। এটা খড়ের মান বাড়ায়, সুষম খাবারের বদলে না।

## নিরাপত্তা: ইউরিয়ায় গরুর বিষক্রিয়া হতে পারে

ইউরিয়া পুরোপুরি খড়ে কাজ করার পর আর ঠিক পরিমাণে খাওয়ালে তবেই নিরাপদ। **গরুকে কখনো সরাসরি ইউরিয়া সার বা ইউরিয়ার পানি খেতে দেবেন না।**

- ইউরিয়ার বস্তা পশুর নাগালের বাইরে তালা দিয়ে রাখুন।
- সুপারিশের বেশি ইউরিয়া দেবেন না।
- প্রায় ছয় মাসের কম বয়সী বাছুরকে দেবেন না; ওদের রুমেন এখনো তৈরি হয়নি।
- অসুস্থ, না খেয়ে থাকা বা খুব দুর্বল পশুকে ডাক্তারের পরামর্শ ছাড়া দেবেন না।

**ইউরিয়া বিষক্রিয়ার লক্ষণ** (সাধারণত বেশি খাওয়ার এক ঘণ্টার মধ্যে): কাঁপা, টলমল করা, মুখে ফেনা, পেট ফাঁপা, কষ্ট করে শ্বাস, পড়ে যাওয়া। **সঙ্গে সঙ্গে ডাক্তার ডাকুন।** অপেক্ষার সময় অনেক খামারি মুখে বেশি পরিমাণ ভিনেগার বা টক তরল দেন, তবে শুধু পশু গিলতে পারলে আর ফোনে ডাক্তারের পরামর্শমতো।

## লাভ হয় কি?

যেখানে খড়ই মূল আঁশজাতীয় খাবার আর কাঁচা ঘাস কম, সেখানে সাধারণত হয়। ইউরিয়া আর শ্রমের খরচ বাড়তি দুধ বা ওজনের সাথে মিলিয়ে দেখুন। **FarmFlows**-এ ইউরিয়াকে খাদ্য খরচ হিসেবে লিখুন, আর পরের এক-দুই মাসে প্রতি লিটার বা প্রতি কেজি ওজন বাড়ার খরচ খেয়াল করুন।$s$);

-- 13 ------------------------------------------------------------------
insert into _new_articles values (
$s$how-much-water-does-a-cow-need$s$, 'feed-nutrition', array['heat-stress', 'milk-cost'], interval '13 minutes',
$s$How much water does a dairy cow need? The cheapest way to more milk$s$,
$s$একটা দুধের গাভীর কত পানি লাগে? বেশি দুধের সবচেয়ে সস্তা উপায়$s$,
$s$Milk is mostly water, so a thirsty cow cannot milk well. Daily water needs by yield and season, how to set up troughs, and simple checks for water quality.$s$,
$s$দুধের বেশিরভাগই পানি, তৃষ্ণার্ত গাভী ভালো দুধ দেয় না। দুধ আর মৌসুম অনুযায়ী দিনে কত পানি, পানির পাত্রের ব্যবস্থা আর পানির মান যাচাই।$s$,
$s$Farmers spend a lot of thought on feed and very little on water. Yet milk is close to **87% water**, and a cow that cannot drink as much as she wants will give less milk the same day. Water is also the cheapest input on the farm. Getting it right costs almost nothing.

## How much does a cow drink?

A useful rule of thumb: a milking cow needs roughly **4–5 litres of water for every litre of milk she gives, on top of what she needs to live**. In hot weather she needs much more.

Approximate daily needs (all sources: drinking water plus water in green feed):

| Animal | Normal weather | Hot, humid weather |
| --- | --- | --- |
| Dry cow, local | 25–35 L | 40–50 L |
| Cow giving 5 L milk | 40–50 L | 55–70 L |
| Cow giving 10 L milk | 55–70 L | 75–95 L |
| Cow giving 15–20 L milk | 70–100 L | 100 L or more |
| Calf (2–3 months) | 5–10 L | 10–15 L |

These are planning figures. Big crossbred cows drink more than small local cows, and cows on dry straw drink more than cows on fresh green grass.

## Why "water twice a day" is not enough

Many cows get water only when they are taken to the pond or when someone remembers to fill a bucket. Cows prefer to drink **many small amounts**, especially **right after milking** and after eating. If water is available only twice a day, most cows simply cannot drink their full need.

**Best practice: clean water available all day and night.**

## Setting up water at the shed

- **One trough or bucket for every few cows**, so timid cows are not pushed away.
- Place water **close to the feeding area and the milking place**.
- Keep it in the **shade**. Cows drink less when water is hot.
- Trough height around the cow's knee, easy to clean and drain.
- In large sheds, a float valve on a tank-fed trough saves labour.

## Calves need water too

Milk is food, not drinking water. Calves offered clean water from the first week start eating solid feed earlier and grow better. Keep a small, clean bucket in the calf pen and change it daily.

## Water quality: simple checks

- **Look:** clear, no green scum, no oil film
- **Smell:** no rotten or chemical smell
- **Source:** tubewell water is usually safer than pond water; keep animals from defecating in the pond they drink from
- **Clean troughs** at least weekly; scrub off slime
- In some areas, groundwater contains arsenic or iron. If people in your village are advised not to drink the tubewell water, ask your livestock office whether it is suitable for animals

## Signs a cow is not drinking enough

- Dry, hard dung
- Milk drops suddenly, especially on hot days
- Sunken eyes, dry nose
- Dark, strong-smelling urine
- Less cud chewing

## Count it as part of your feed plan

Water is free milk. If you change to all-day water and your milk record goes up, that is a change worth seeing in numbers. In **FarmFlows**, compare daily milk before and after for the whole herd or for each cow.$s$,
$s$খামারিরা খাবার নিয়ে অনেক ভাবেন, পানি নিয়ে খুব কম। অথচ দুধের প্রায় **৮৭% পানি**, আর যে গাভী ইচ্ছামতো পানি খেতে পারে না, সে সেদিনই কম দুধ দেয়। খামারে পানিই সবচেয়ে সস্তা জিনিস। ঠিকমতো দিতে প্রায় কোনো খরচই নেই।

## গাভী কত পানি খায়?

কাজের একটা হিসাব: দুধের গাভীর বেঁচে থাকার জন্য যা লাগে তার ওপর, **প্রতি লিটার দুধের জন্য মোটামুটি ৪–৫ লিটার পানি** লাগে। গরমে অনেক বেশি।

দিনে আনুমানিক প্রয়োজন (সব উৎস মিলিয়ে: খাওয়ার পানি আর কাঁচা খাবারের পানি):

| পশু | স্বাভাবিক আবহাওয়া | গরম, ভ্যাপসা আবহাওয়া |
| --- | --- | --- |
| শুকনো গাভী, দেশি | ২৫–৩৫ লি | ৪০–৫০ লি |
| ৫ লি দুধের গাভী | ৪০–৫০ লি | ৫৫–৭০ লি |
| ১০ লি দুধের গাভী | ৫৫–৭০ লি | ৭৫–৯৫ লি |
| ১৫–২০ লি দুধের গাভী | ৭০–১০০ লি | ১০০ লি বা বেশি |
| বাছুর (২–৩ মাস) | ৫–১০ লি | ১০–১৫ লি |

এগুলো পরিকল্পনার সংখ্যা। বড় সংকর গাভী ছোট দেশি গাভীর চেয়ে বেশি খায়, আর শুকনো খড় খাওয়া গাভী টাটকা কাঁচা ঘাস খাওয়া গাভীর চেয়ে বেশি পানি খায়।

## "দিনে দুবার পানি" কেন যথেষ্ট না

অনেক গাভী পানি পায় শুধু পুকুরে নিয়ে গেলে বা কারো মনে পড়লে বালতি ভরলে। গাভী **অল্প অল্প করে বারবার** খেতে পছন্দ করে, বিশেষ করে **দোহানোর ঠিক পরে** আর খাওয়ার পরে। দিনে মাত্র দুবার পানি পেলে বেশিরভাগ গাভী পুরো প্রয়োজন মেটাতে পারে না।

**সবচেয়ে ভালো: দিনরাত পরিষ্কার পানি হাতের কাছে।**

## গোয়ালে পানির ব্যবস্থা

- **কয়েকটা গাভী প্রতি একটা চাড়ি বা বালতি**, যাতে ভীতু গাভী ধাক্কা খেয়ে সরে না যায়।
- পানি রাখুন **খাবারের জায়গা আর দোহানোর জায়গার কাছে**।
- **ছায়ায়** রাখুন। পানি গরম হলে গাভী কম খায়।
- চাড়ির উচ্চতা মোটামুটি গাভীর হাঁটু পর্যন্ত, সহজে পরিষ্কার আর খালি করা যায় এমন।
- বড় গোয়ালে ট্যাংকের সাথে লাগানো চাড়িতে ফ্লোট ভাল্ব লাগালে শ্রম বাঁচে।

## বাছুরেরও পানি লাগে

দুধ খাবার, খাওয়ার পানি না। প্রথম সপ্তাহ থেকে পরিষ্কার পানি পেলে বাছুর তাড়াতাড়ি শক্ত খাবার খেতে শেখে আর ভালো বাড়ে। বাছুরের ঘরে একটা ছোট পরিষ্কার বালতি রাখুন, প্রতিদিন পানি বদলান।

## পানির মান: সহজ পরীক্ষা

- **দেখুন:** পরিষ্কার, সবুজ শ্যাওলা বা তেলের আস্তর নেই
- **গন্ধ:** পচা বা রাসায়নিক গন্ধ নেই
- **উৎস:** পুকুরের চেয়ে টিউবওয়েলের পানি সাধারণত নিরাপদ; যে পুকুরের পানি খায়, সেখানে পশুকে মলত্যাগ করতে দেবেন না
- **চাড়ি পরিষ্কার** অন্তত সপ্তাহে একবার; পিচ্ছিল আস্তর ঘষে তুলুন
- কোনো কোনো এলাকায় মাটির নিচের পানিতে আর্সেনিক বা আয়রন থাকে। আপনার গ্রামে মানুষকে টিউবওয়েলের পানি না খেতে বলা হলে পশুর জন্য তা ঠিক কিনা প্রাণিসম্পদ অফিসে জিজ্ঞেস করুন

## গাভী যথেষ্ট পানি না খাওয়ার লক্ষণ

- শুকনো, শক্ত গোবর
- হঠাৎ দুধ কমা, বিশেষ করে গরমের দিনে
- চোখ বসে যাওয়া, নাক শুকনো
- গাঢ়, কড়া গন্ধের প্রস্রাব
- কম জাবর কাটা

## খাবারের পরিকল্পনার অংশ হিসেবে ধরুন

পানি মানে বিনা খরচের দুধ। সারাদিন পানির ব্যবস্থা করার পর দুধের হিসাব বাড়লে, সেটা সংখ্যায় দেখার মতো পরিবর্তন। **FarmFlows**-এ পুরো পাল বা প্রতিটা গাভীর আগে আর পরের দৈনিক দুধ মিলিয়ে দেখুন।$s$);

-- 14 ------------------------------------------------------------------
insert into _new_articles values (
$s$black-bengal-goat-farming-beginner-guide$s$, 'goats', array['goats'], interval '14 minutes',
$s$Black Bengal goat farming for beginners: housing, feeding, breeding and health$s$,
$s$নতুনদের জন্য ব্ল্যাক বেঙ্গল ছাগল পালন: ঘর, খাবার, প্রজনন আর স্বাস্থ্য$s$,
$s$Black Bengal goats are hardy, breed fast and sell well. A starter guide: raised housing, feeding, breeding age, kidding and the vaccines to plan.$s$,
$s$ব্ল্যাক বেঙ্গল ছাগল শক্ত, দ্রুত বংশ বাড়ায় আর ভালো দাম পায়। শুরুর কাজের গাইড: মাচার ঘর, কী খাওয়াবেন, প্রজননের বয়স, বাচ্চা দেওয়া আর টিকার পরিকল্পনা।$s$,
$s$The Black Bengal goat is one of Bangladesh's most valuable native breeds. It is small, eats a wide range of leaves and grass, often gives birth to twins or triplets, and its meat and skin are in high demand. A few goats can be kept by almost any household, which is why many farmers start here before cattle.

## Why Black Bengal

- **Fertile:** does often kid twice a year or three times in two years, frequently with twins
- **Hardy:** adapted to local heat and humidity
- **Good meat and skin prices**, especially before Eid-ul-Adha
- **Low feed cost:** browses leaves and grass that cattle do not eat

The downsides: small body size, lower milk, and young kids are fragile if housing and hygiene are poor.

## Choosing your first goats

- Start small: for example, **4–5 does and 1 buck** (or access to a good buck).
- Choose active animals with bright eyes, a clean nose, a shiny coat and firm dung.
- For does: from a family known for twins, good udder with two even teats.
- For the buck: well-built, active, from a different bloodline than your does.
- Buy from known farms, and keep new goats separate for 2–3 weeks.

## Housing: keep them dry

Goats hate wet ground. Damp floors bring pneumonia, foot rot and worms.

- A **raised slatted floor (মাচা)** about 1 metre above the ground, with gaps so droppings fall through
- Roughly **0.8–1 square metre per adult goat**, more for does with kids
- Good airflow but no cold draughts; cover the sides with sacks in winter nights
- Separate space for kids and for the buck
- Clean droppings under the platform regularly

## Feeding

Goats are browsers. They prefer leaves at head height over grass on the ground.

- **Leaves and green fodder:** jackfruit leaves, ipil-ipil, banana leaves, gourd vines, Napier and other grasses
- **Concentrate:** a small amount for growing kids, pregnant does in late pregnancy and does with kids, for example a mix of broken grain, bran and oil cake; around **100–250 g per day** depending on size and stage
- **Clean water** at all times
- **Salt and minerals:** a lick or mineral mixture
- Feed leaves **from a hanging bundle or rack**, not on the ground, to reduce worms and waste

Change feed gradually, and avoid wet, mouldy or pesticide-sprayed leaves.

## Breeding

- Does usually come into heat for the first time at **6–9 months**; breeding when they reach good body size gives better results.
- Signs of heat: bleating, tail wagging, restlessness, swollen vulva, mounting others. Heat repeats about every **3 weeks**.
- Pregnancy lasts about **145–150 days** (around five months).
- Keep the buck separate and bring the doe to him during heat, so you know the breeding date.

## Kidding

- Prepare a clean, dry corner with straw a week before the due date.
- Most does kid without help. Call the vet if labour goes on for more than about an hour without progress.
- Make sure every kid **suckles colostrum within the first hour**. Weak twins and triplets often need help.
- Dip the navel in an antiseptic your vet recommends.

## Health basics

- **PPR (goat plague) vaccination**, and others such as goat pox, as advised by your upazila livestock office
- Regular **deworming**, especially in the rainy season
- Trim overgrown hooves
- Watch for diarrhoea, coughing, nasal discharge and not eating; isolate sick goats early

Our article on goat kid care covers the first three months in detail.

## Keep records from day one

In **FarmFlows**, add each goat with its tag number, date of birth and mother. Record breeding, kidding, vaccines and sales. You will quickly see which does are your best mothers and which bloodlines to keep.$s$,
$s$ব্ল্যাক বেঙ্গল ছাগল বাংলাদেশের সবচেয়ে মূল্যবান দেশি জাতগুলোর একটা। আকারে ছোট, নানা রকম পাতা আর ঘাস খায়, প্রায়ই জোড়া বা তিনটা বাচ্চা দেয়, আর এর মাংস ও চামড়ার চাহিদা অনেক। কয়েকটা ছাগল প্রায় যেকোনো পরিবার পালতে পারে, তাই অনেক খামারি গরুর আগে এখান থেকেই শুরু করেন।

## কেন ব্ল্যাক বেঙ্গল

- **বেশি বাচ্চা:** ছাগি প্রায়ই বছরে দুবার বা দুই বছরে তিনবার বাচ্চা দেয়, অনেক সময় জোড়া
- **শক্ত:** দেশের গরম আর আর্দ্রতায় মানিয়ে নেওয়া
- **মাংস আর চামড়ার ভালো দাম**, বিশেষ করে ঈদুল আজহার আগে
- **কম খাবার খরচ:** গরু খায় না এমন পাতা আর ঘাসও খায়

অসুবিধা: শরীর ছোট, দুধ কম, আর ঘর ও পরিচ্ছন্নতা খারাপ হলে ছোট বাচ্চা দুর্বল থাকে।

## প্রথম ছাগল বাছাই

- ছোট করে শুরু করুন: যেমন **৪–৫টা ছাগি আর ১টা পাঁঠা** (বা ভালো পাঁঠার সুবিধা)।
- চটপটে, উজ্জ্বল চোখ, পরিষ্কার নাক, চকচকে লোম আর শক্ত মলের ছাগল বাছুন।
- ছাগির ক্ষেত্রে: জোড়া বাচ্চার জন্য পরিচিত বংশ, সমান দুটো বাঁটসহ ভালো ওলান।
- পাঁঠার ক্ষেত্রে: ভালো গড়ন, চটপটে, আর আপনার ছাগিদের থেকে আলাদা বংশের।
- চেনা খামার থেকে কিনুন, আর নতুন ছাগল ২–৩ সপ্তাহ আলাদা রাখুন।

## ঘর: শুকনো রাখুন

ছাগল ভেজা মাটি একদম পছন্দ করে না। স্যাঁতসেঁতে মেঝেতে নিউমোনিয়া, পায়ের পচন আর কৃমি হয়।

- মাটি থেকে প্রায় ১ মিটার উঁচু **ফাঁকা ফাঁকা কাঠ বা বাঁশের মাচা**, যাতে লেদা নিচে পড়ে যায়
- প্রতিটা বড় ছাগলের জন্য মোটামুটি **০.৮–১ বর্গমিটার**, বাচ্চাসহ ছাগির জন্য বেশি
- বাতাস চলাচল ভালো, কিন্তু ঠান্ডা বাতাসের ঝাপটা নয়; শীতের রাতে পাশগুলো চট দিয়ে ঢাকুন
- বাচ্চা আর পাঁঠার জন্য আলাদা জায়গা
- মাচার নিচের লেদা নিয়মিত পরিষ্কার

## খাবার

ছাগল ডাল-পাতা খেকো। মাটির ঘাসের চেয়ে মাথা-সমান উঁচুতে পাতা পছন্দ করে।

- **পাতা আর কাঁচা খাবার:** কাঁঠাল পাতা, ইপিল-ইপিল, কলাপাতা, লাউয়ের লতা, নেপিয়ার আর অন্য ঘাস
- **দানাদার খাবার:** বাড়ন্ত বাচ্চা, গর্ভের শেষ দিকের ছাগি আর বাচ্চাওয়ালা ছাগির জন্য অল্প, যেমন ভাঙা দানা, ভুসি আর খৈলের মিশ্রণ; আকার আর অবস্থা অনুযায়ী দিনে **১০০–২৫০ গ্রাম** মতো
- সবসময় **পরিষ্কার পানি**
- **লবণ আর খনিজ:** চাটার ইট বা খনিজ মিশ্রণ
- পাতা মাটিতে না দিয়ে **ঝুলিয়ে বা তাকে রেখে দিন**, এতে কৃমি আর অপচয় কম হয়

খাবার ধীরে বদলান, আর ভেজা, ছত্রাক পড়া বা কীটনাশক দেওয়া পাতা খাওয়াবেন না।

## প্রজনন

- ছাগি সাধারণত **৬–৯ মাস** বয়সে প্রথম গরম হয়; শরীর ভালো আকারে পৌঁছালে প্রজনন করালে ফল ভালো হয়।
- গরমের লক্ষণ: ডাকাডাকি, লেজ নাড়া, অস্থিরতা, যোনিমুখ ফোলা, অন্যের ওপর চড়া। প্রায় **৩ সপ্তাহ** পরপর গরম হয়।
- গর্ভকাল প্রায় **১৪৫–১৫০ দিন** (প্রায় পাঁচ মাস)।
- পাঁঠা আলাদা রাখুন আর গরমের সময় ছাগিকে তার কাছে নিন, তাহলে প্রজননের তারিখ জানা থাকবে।

## বাচ্চা দেওয়া

- নির্ধারিত তারিখের এক সপ্তাহ আগে খড় বিছিয়ে পরিষ্কার, শুকনো কোণ তৈরি রাখুন।
- বেশিরভাগ ছাগি নিজেই বাচ্চা দেয়। প্রায় এক ঘণ্টার বেশি ব্যথা চললেও অগ্রগতি না হলে ডাক্তার ডাকুন।
- প্রতিটা বাচ্চা যেন **প্রথম ঘণ্টার মধ্যে শাল দুধ খায়**। দুর্বল জোড়া বা তিন বাচ্চার প্রায়ই সাহায্য লাগে।
- ডাক্তারের দেওয়া জীবাণুনাশকে নাভি ডুবিয়ে দিন।

## স্বাস্থ্যের মূল কথা

- উপজেলা প্রাণিসম্পদ অফিসের পরামর্শে **পিপিআর (ছাগলের প্লেগ) টিকা**, আর ছাগলের বসন্তসহ অন্যান্য টিকা
- নিয়মিত **কৃমিনাশক**, বিশেষ করে বর্ষায়
- বেশি বড় হয়ে যাওয়া খুর কাটা
- পাতলা পায়খানা, কাশি, নাক দিয়ে পানি পড়া আর খাওয়া বন্ধ খেয়াল করুন; অসুস্থ ছাগল শুরুতেই আলাদা করুন

প্রথম তিন মাসের বিস্তারিত আছে আমাদের ছাগলের বাচ্চার যত্নের লেখায়।

## প্রথম দিন থেকেই হিসাব রাখুন

**FarmFlows**-এ প্রতিটা ছাগল ট্যাগ নম্বর, জন্মতারিখ আর মায়ের নামসহ যোগ করুন। প্রজনন, বাচ্চা দেওয়া, টিকা আর বিক্রি লিখুন। কোন ছাগি সবচেয়ে ভালো মা আর কোন বংশ রাখবেন, তাড়াতাড়িই বুঝতে পারবেন।$s$);

-- 15 ------------------------------------------------------------------
insert into _new_articles values (
$s$goat-kid-care-first-three-months$s$, 'goats', array['goats', 'kid-care'], interval '15 minutes',
$s$Goat kid care: the first three months, from colostrum to weaning$s$,
$s$ছাগলের বাচ্চার যত্ন: শাল দুধ থেকে দুধ ছাড়ানো পর্যন্ত প্রথম তিন মাস$s$,
$s$Most goat losses happen in the first weeks. Colostrum, keeping kids warm and dry, helping weak twins, creep feeding, deworming and weaning on time.$s$,
$s$ছাগলের বেশিরভাগ মৃত্যু প্রথম কয়েক সপ্তাহে। শাল দুধ, বাচ্চাকে গরম ও শুকনো রাখা, দুর্বল জোড়া বাচ্চার সাহায্য, কৃমিনাশক আর সময়মতো দুধ ছাড়ানো।$s$,
$s$A doe that gives birth to three kids is a good doe, but three kids also means three small, cold, hungry animals competing for two teats. Most losses on goat farms happen in the **first two to three weeks**: from cold, hunger, diarrhoea and pneumonia. Almost all of these can be prevented with simple care.

## The first hour

1. **Clear the nose and mouth** of mucus if the kid is not breathing well.
2. **Let the doe lick the kid dry.** If she is busy with a second kid, rub the first one with a clean dry cloth.
3. **Dip the navel** in an antiseptic your vet recommends.
4. **Colostrum within the first hour.** This first milk carries the antibodies that protect the kid for weeks. A kid that misses it is far more likely to die.

## Make sure every kid drinks

- Watch each kid suckle. A kid that has fed has a **full, rounded belly** and sleeps quietly.
- Weak or third kids often get pushed away. Hold them to the teat several times a day for the first days.
- If the doe has little milk or rejects a kid, milk colostrum from her (or another doe that kidded recently) and feed it with a small bottle or a clean spoon, slowly.
- Never pour milk into a kid that cannot swallow: it goes into the lungs.

## Warm and dry

- Kids lose heat fast, especially at night and in winter.
- Keep them on **dry straw**, raised off the wet ground, out of draughts.
- On cold nights, cover the sides of the shed with sacks. A kid that feels cold in the mouth and will not suck needs warming before feeding.

## Weeks 1–4

- Kids suckle often. Make sure the doe gets **enough feed and water** to keep milk coming.
- From the second week, offer **soft green leaves and a small handful of fine concentrate** in a clean tray. Kids start nibbling early, and this builds their rumen.
- Keep **clean water** in a shallow container they can reach.
- Clean the pen daily. Wet, dirty bedding causes diarrhoea and navel infections.

## Months 2–3

- Kids eat more solid feed every week: leaves, tender grass and around **50–100 g of concentrate** a day by the end of the third month, depending on size.
- **Creep feeding:** a small area with a narrow gap that kids can enter but adults cannot, with their own feed, helps them grow without competition.
- **Deworming:** ask your vet when to give the first dose; many farms deworm around **6–8 weeks** and then follow the herd schedule.
- **Vaccination:** PPR and other vaccines as advised by your upazila livestock office, usually after about **3 months** of age.

## Weaning

Black Bengal kids are usually weaned at about **2.5–3 months**, once they are eating solid feed well.

- Separate kids from the doe gradually, starting with a few hours a day.
- Keep their feed and housing unchanged during weaning to reduce stress.
- Weigh them if you can: steady weight gain is the best sign they are doing well.

## Danger signs

Call the vet early if a kid:
- Stops suckling, stands hunched or cries constantly
- Has watery diarrhoea (see our calf diarrhoea article: rehydration matters for kids too)
- Coughs, breathes fast or has a runny nose
- Has a swollen, hot or wet navel
- Cannot stand

## Record each kid

In **FarmFlows**, add each kid with its mother, sex and birth date, and record weights at birth, one month and weaning. You will see which does raise heavy kids and which kids grow slowly, long before market day.$s$,
$s$যে ছাগি তিনটা বাচ্চা দেয় সে ভালো মা, কিন্তু তিনটা বাচ্চা মানে দুটো বাঁটের জন্য লড়াই করা তিনটা ছোট, ঠান্ডা, ক্ষুধার্ত প্রাণী। ছাগলের খামারে বেশিরভাগ মৃত্যু হয় **প্রথম দুই-তিন সপ্তাহে**: ঠান্ডা, ক্ষুধা, পাতলা পায়খানা আর নিউমোনিয়ায়। এর প্রায় সবই সাধারণ যত্নে ঠেকানো যায়।

## প্রথম এক ঘণ্টা

1. বাচ্চা ঠিকমতো শ্বাস না নিলে **নাক আর মুখের শ্লেষ্মা পরিষ্কার করুন।**
2. **ছাগিকে বাচ্চা চেটে শুকাতে দিন।** দ্বিতীয় বাচ্চা নিয়ে ব্যস্ত থাকলে প্রথমটাকে পরিষ্কার শুকনো কাপড়ে মুছে দিন।
3. ডাক্তারের দেওয়া জীবাণুনাশকে **নাভি ডুবিয়ে দিন।**
4. **প্রথম ঘণ্টার মধ্যে শাল দুধ।** এই প্রথম দুধে যে রোগ-প্রতিরোধী উপাদান থাকে, তা কয়েক সপ্তাহ বাচ্চাকে রক্ষা করে। শাল দুধ না পেলে বাচ্চার মারা যাওয়ার ঝুঁকি অনেক বেশি।

## প্রতিটা বাচ্চা যেন খায়

- প্রতিটা বাচ্চার দুধ চোষা খেয়াল করুন। যে খেয়েছে তার **পেট ভরা, গোল** থাকে আর চুপচাপ ঘুমায়।
- দুর্বল বা তৃতীয় বাচ্চা প্রায়ই ঠেলা খেয়ে সরে যায়। প্রথম কয়েক দিন দিনে কয়েকবার ধরে বাঁটে লাগিয়ে দিন।
- ছাগির দুধ কম হলে বা কোনো বাচ্চাকে না নিলে, তার (বা সদ্য বাচ্চা দেওয়া অন্য ছাগির) শাল দুধ দুইয়ে ছোট বোতল বা পরিষ্কার চামচে ধীরে খাওয়ান।
- যে বাচ্চা গিলতে পারে না, তার মুখে কখনো দুধ ঢালবেন না: ফুসফুসে চলে যায়।

## গরম আর শুকনো

- বাচ্চা দ্রুত শরীরের তাপ হারায়, বিশেষ করে রাতে আর শীতে।
- ভেজা মাটি থেকে উঁচুতে, ঠান্ডা বাতাসের বাইরে **শুকনো খড়ের ওপর** রাখুন।
- শীতের রাতে ঘরের পাশগুলো চট দিয়ে ঢাকুন। মুখ ঠান্ডা আর চুষতে চাইছে না এমন বাচ্চাকে খাওয়ানোর আগে গরম করতে হয়।

## ১–৪ সপ্তাহ

- বাচ্চা বারবার দুধ খায়। দুধ চালু রাখতে ছাগি যেন **যথেষ্ট খাবার আর পানি** পায়।
- দ্বিতীয় সপ্তাহ থেকে পরিষ্কার ট্রেতে **নরম কাঁচা পাতা আর এক মুঠো মিহি দানাদার খাবার** দিন। বাচ্চা তাড়াতাড়ি খুঁটে খেতে শুরু করে, আর এতে রুমেন গড়ে ওঠে।
- নাগাল পায় এমন অগভীর পাত্রে **পরিষ্কার পানি** রাখুন।
- প্রতিদিন ঘর পরিষ্কার করুন। ভেজা, নোংরা বিছানায় পাতলা পায়খানা আর নাভির সংক্রমণ হয়।

## ২–৩ মাস

- প্রতি সপ্তাহে বাচ্চা বেশি শক্ত খাবার খায়: পাতা, কচি ঘাস, আর আকার ভেদে তৃতীয় মাসের শেষে দিনে প্রায় **৫০–১০০ গ্রাম দানাদার খাবার**।
- **ক্রিপ ফিডিং:** সরু ফাঁকওয়ালা ছোট একটা জায়গা, যেখানে বাচ্চা ঢুকতে পারে কিন্তু বড়রা পারে না, ভেতরে ওদের নিজের খাবার; এতে প্রতিযোগিতা ছাড়া বাড়তে পারে।
- **কৃমিনাশক:** প্রথম মাত্রা কবে, ডাক্তারকে জিজ্ঞেস করুন; অনেক খামারে **৬–৮ সপ্তাহে** দিয়ে তারপর পালের সময়সূচি মানা হয়।
- **টিকা:** উপজেলা প্রাণিসম্পদ অফিসের পরামর্শে পিপিআর আর অন্যান্য টিকা, সাধারণত প্রায় **৩ মাস** বয়সের পর।

## দুধ ছাড়ানো

ব্ল্যাক বেঙ্গলের বাচ্চা সাধারণত প্রায় **আড়াই থেকে ৩ মাসে**, শক্ত খাবার ভালো খেতে শিখলে, দুধ ছাড়ানো হয়।

- ধীরে ধীরে আলাদা করুন, দিনে কয়েক ঘণ্টা দিয়ে শুরু করে।
- দুধ ছাড়ানোর সময় খাবার আর ঘর না বদলালে চাপ কম হয়।
- পারলে ওজন মাপুন: নিয়মিত ওজন বাড়াই ভালো থাকার সবচেয়ে বড় লক্ষণ।

## বিপদের লক্ষণ

বাচ্চা এগুলো করলে আগেভাগে ডাক্তার ডাকুন:
- দুধ চোষা বন্ধ, কুঁজো হয়ে দাঁড়ানো বা সারাক্ষণ ডাকা
- পানির মতো পাতলা পায়খানা (বাছুরের পাতলা পায়খানার লেখা দেখুন: ছাগলের বাচ্চার ক্ষেত্রেও শরীরে পানি ফেরানোই আসল)
- কাশি, দ্রুত শ্বাস বা নাক দিয়ে পানি পড়া
- নাভি ফোলা, গরম বা ভেজা
- দাঁড়াতে না পারা

## প্রতিটা বাচ্চার হিসাব

**FarmFlows**-এ প্রতিটা বাচ্চা মা, লিঙ্গ আর জন্মতারিখসহ যোগ করুন, আর জন্মের সময়, এক মাসে আর দুধ ছাড়ানোর সময় ওজন লিখুন। হাটের দিনের অনেক আগেই বুঝবেন কোন ছাগি ভারী বাচ্চা বড় করে আর কোন বাচ্চা ধীরে বাড়ছে।$s$);
-- 16 ------------------------------------------------------------------
insert into _new_articles values (
$s$layer-feed-and-water-per-bird-per-day$s$, 'poultry', array['egg-production', 'feed-ration'], interval '16 minutes',
$s$How much feed and water does a layer hen need per day? A practical guide by age$s$,
$s$একটা লেয়ার মুরগির দিনে কত খাবার আর পানি লাগে? বয়স অনুযায়ী কাজের গাইড$s$,
$s$Feed is a layer farm's biggest cost. Daily feed and water per bird from chick to laying hen, checking intake, and cutting waste without losing eggs.$s$,
$s$লেয়ার খামারের সবচেয়ে বড় খরচ খাবার। বাচ্চা থেকে ডিম পাড়া পর্যন্ত দিনে কত খাবার ও পানি, ঝাঁক ঠিক খাচ্ছে কিনা, আর ডিম না কমিয়ে অপচয় কমানো।$s$,
$s$On a layer farm, feed usually makes up the largest share of total costs. Small mistakes add up fast: a few grams wasted per bird per day becomes many bags a month on a farm of a thousand hens. Too little feed, on the other hand, shows up as fewer and smaller eggs.

The figures below are typical for commercial brown layers in Bangladesh. **Your breed's management guide and your feed supplier's chart come first**, because strains differ.

## Daily feed per bird (approximate)

| Age | Feed per bird per day | Feed type |
| --- | --- | --- |
| Week 1 | 10–15 g | Starter (chick) feed |
| Weeks 2–4 | 15–30 g | Starter |
| Weeks 5–8 | 35–50 g | Starter / grower |
| Weeks 9–16 | 55–75 g | Grower |
| Weeks 17–19 (pre-lay) | 75–90 g | Pre-layer |
| Laying (from about 20 weeks) | 105–120 g | Layer feed |

In hot weather hens eat less, which often explains a drop in egg size in summer.

## Daily water per bird

Hens drink roughly **twice as much water as feed by weight**, and much more in heat.

| Age | Water per bird per day |
| --- | --- |
| Week 1 | 25–40 ml |
| Weeks 4–8 | 80–150 ml |
| Grower | 150–200 ml |
| Laying hen, normal weather | 200–250 ml |
| Laying hen, hot weather | 300–400 ml or more |

**Water problems show up as feed problems.** A hen that cannot drink will not eat, and egg production falls within a day or two. Check drinkers every morning and evening.

## How to know if the flock eats right

- **Weigh the feed** you give every day and write it down. Divide by the number of birds.
- **Weigh 10–20 birds** every week or two during rearing and compare with the breed's target weight.
- **Watch the feeders an hour after feeding.** If they are empty very quickly, birds may be hungry; if feed sits for many hours, check for illness, heat or stale feed.
- **Track egg numbers and egg size** daily. Changes in feed intake show up here first.

## Where feed gets wasted

- **Feeders filled to the top:** birds flick feed out. Fill only about **one-third full**.
- **Feeders set too low:** the lip should be at about the height of the bird's back.
- **Damp or stale feed:** buy amounts you can use within a few weeks and store bags on pallets, off the floor and away from walls.
- **Rats and wild birds:** they eat a surprising amount.
- **Too many non-laying hens:** older or unproductive hens still eat full rations. Cull them on time.

## Feed quality basics

- Use layer feed with enough **calcium for strong shells**. Some farmers add shell grit in the afternoon.
- Do not switch feed brands suddenly; mix old and new over several days.
- Avoid mouldy feed completely. Mould toxins lower production and damage health.

## Know your feed cost per egg

The number that matters most is not the price of a bag but **how much feed it takes to produce one egg** (or a dozen). In **FarmFlows**, record feed used in the daily flock log and eggs collected each day. The app works out feed per egg and cost per egg, so you can see the effect of any change you make.$s$,
$s$লেয়ার খামারে সাধারণত মোট খরচের সবচেয়ে বড় অংশ খাবার। ছোট ভুলও দ্রুত বড় হয়: প্রতি মুরগিতে দিনে কয়েক গ্রাম অপচয় হাজার মুরগির খামারে মাসে অনেক বস্তা হয়ে যায়। আবার খাবার কম দিলে ডিম কম আর ছোট হয়।

নিচের সংখ্যাগুলো বাংলাদেশে বাণিজ্যিক বাদামি লেয়ারের জন্য প্রচলিত। **আপনার জাতের ব্যবস্থাপনা গাইড আর খাদ্য সরবরাহকারীর চার্ট আগে মানবেন**, কারণ জাতভেদে পার্থক্য আছে।

## প্রতি মুরগিতে দিনে খাবার (আনুমানিক)

| বয়স | প্রতি মুরগিতে দিনে খাবার | খাবারের ধরন |
| --- | --- | --- |
| ১ম সপ্তাহ | ১০–১৫ গ্রাম | স্টার্টার (বাচ্চার) খাবার |
| ২–৪ সপ্তাহ | ১৫–৩০ গ্রাম | স্টার্টার |
| ৫–৮ সপ্তাহ | ৩৫–৫০ গ্রাম | স্টার্টার / গ্রোয়ার |
| ৯–১৬ সপ্তাহ | ৫৫–৭৫ গ্রাম | গ্রোয়ার |
| ১৭–১৯ সপ্তাহ (ডিমের আগে) | ৭৫–৯০ গ্রাম | প্রি-লেয়ার |
| ডিম পাড়া (প্রায় ২০ সপ্তাহ থেকে) | ১০৫–১২০ গ্রাম | লেয়ার খাবার |

গরমে মুরগি কম খায়, আর এ কারণেই প্রায়ই গরমকালে ডিম ছোট হয়।

## প্রতি মুরগিতে দিনে পানি

মুরগি ওজনে **খাবারের প্রায় দ্বিগুণ পানি** খায়, আর গরমে অনেক বেশি।

| বয়স | প্রতি মুরগিতে দিনে পানি |
| --- | --- |
| ১ম সপ্তাহ | ২৫–৪০ মিলি |
| ৪–৮ সপ্তাহ | ৮০–১৫০ মিলি |
| গ্রোয়ার | ১৫০–২০০ মিলি |
| ডিম পাড়া মুরগি, স্বাভাবিক আবহাওয়া | ২০০–২৫০ মিলি |
| ডিম পাড়া মুরগি, গরম আবহাওয়া | ৩০০–৪০০ মিলি বা বেশি |

**পানির সমস্যা খাবারের সমস্যা হয়ে দেখা দেয়।** যে মুরগি পানি খেতে পারে না সে খাবারও খায় না, আর এক-দুই দিনের মধ্যে ডিম কমে যায়। প্রতিদিন সকাল-বিকেল পানির পাত্র দেখুন।

## ঝাঁক ঠিকমতো খাচ্ছে কিনা কীভাবে বুঝবেন

- প্রতিদিন যে খাবার দেন **তা মেপে লিখে রাখুন।** মুরগির সংখ্যা দিয়ে ভাগ করুন।
- বাড়ন্ত সময়ে প্রতি এক-দুই সপ্তাহে **১০–২০টা মুরগির ওজন মাপুন** আর জাতের লক্ষ্য ওজনের সাথে মেলান।
- **খাবার দেওয়ার এক ঘণ্টা পর পাত্র দেখুন।** খুব তাড়াতাড়ি খালি হলে মুরগি হয়তো ক্ষুধার্ত; অনেক ঘণ্টা খাবার পড়ে থাকলে রোগ, গরম বা বাসি খাবার আছে কিনা দেখুন।
- প্রতিদিন **ডিমের সংখ্যা আর আকার** লিখুন। খাওয়ার পরিবর্তন প্রথমে এখানেই দেখা যায়।

## কোথায় খাবার নষ্ট হয়

- **পাত্র কানায় কানায় ভরা:** মুরগি ঠোঁট দিয়ে খাবার ছিটিয়ে ফেলে। মোটামুটি **এক-তৃতীয়াংশ** ভরুন।
- **পাত্র বেশি নিচু:** কিনারা মুরগির পিঠের উচ্চতায় থাকা উচিত।
- **ভেজা বা বাসি খাবার:** কয়েক সপ্তাহে শেষ করতে পারবেন এমন পরিমাণ কিনুন, আর বস্তা মেঝে ও দেয়াল থেকে দূরে মাচায় রাখুন।
- **ইঁদুর আর বুনো পাখি:** অবাক করার মতো বেশি খেয়ে ফেলে।
- **ডিম না পাড়া মুরগি বেশি:** বয়স্ক বা অনুৎপাদনশীল মুরগিও পুরো খাবার খায়। সময়মতো বাদ দিন।

## খাবারের মানের মূল কথা

- শক্ত খোসার জন্য **যথেষ্ট ক্যালসিয়ামওয়ালা** লেয়ার খাবার দিন। কিছু খামারি বিকেলে ঝিনুকের গুঁড়া দেন।
- হঠাৎ খাবারের কোম্পানি বদলাবেন না; কয়েক দিন ধরে পুরনো আর নতুন মিশিয়ে দিন।
- ছত্রাক পড়া খাবার একদম দেবেন না। ছত্রাকের বিষে উৎপাদন কমে আর স্বাস্থ্যের ক্ষতি হয়।

## প্রতি ডিমে খাবার খরচ জানুন

সবচেয়ে জরুরি সংখ্যা বস্তার দাম না, **একটা (বা এক ডজন) ডিম তৈরিতে কতটা খাবার লাগে**। **FarmFlows**-এ দৈনিক ঝাঁকের লগে খাবার আর প্রতিদিনের ডিম লিখুন। অ্যাপ প্রতি ডিমে খাবার আর প্রতি ডিমে খরচ হিসাব করে দেয়, তাই যেকোনো পরিবর্তনের ফল দেখতে পাবেন।$s$);

-- 17 ------------------------------------------------------------------
insert into _new_articles values (
$s$lighting-program-for-layer-hens$s$, 'poultry', array['egg-production'], interval '17 minutes',
$s$Lighting for layer hens: how many hours of light keep eggs coming$s$,
$s$লেয়ার মুরগির আলোর নিয়ম: দিনে কত ঘণ্টা আলো দিলে ডিম ঠিক থাকে$s$,
$s$Light tells a hen when to lay. A simple lighting program from chick to laying, why you must never cut light during lay, and a low-cost timer setup.$s$,
$s$আলোই মুরগিকে ডিম পাড়ার সংকেত দেয়। বাচ্চা থেকে ডিম পাড়া পর্যন্ত সহজ আলোর সূচি, ডিমের সময় কেন আলো কমাবেন না, আর টাইমারে কম খরচের ব্যবস্থা।$s$,
$s$Hens are sensitive to **day length**. Longer days tell the body it is the season to lay; shorter days tell it to slow down. That is why egg production often wobbles in winter on farms with no lighting plan, and why a pullet flock lit too early starts laying small eggs too soon.

A lighting program is one of the cheapest tools on a layer farm. It needs a few bulbs, a timer and discipline.

## The two golden rules

1. **During growing (rearing), never increase day length.** Keep it constant or decreasing, so pullets do not start laying before their bodies are ready.
2. **During laying, never decrease day length.** Keep it constant or increasing. Cutting light, even by an hour, can drop production.

## A simple program (open-sided houses)

Your breed's management guide gives the exact program; this is a common pattern.

| Age | Hours of light per day |
| --- | --- |
| Days 1–3 | 22–23 hours (chicks find feed and water) |
| Week 1 | Reduce gradually to about 18–20 hours |
| Weeks 2–8 | Reduce step by step to natural day length (about 11–12 hours) |
| Weeks 9–16 | Natural day length; do not add light |
| Around 17–18 weeks (when pullets reach target weight) | Start adding light: about 30–60 minutes per week |
| Laying | Build up to **16 hours** of total light and keep it there |

"Total light" means daylight plus artificial light. In Bangladesh, natural daylight is longest in June and shortest in December, so the bulbs you need change through the year.

## When to add the extra light

- **Early morning (before sunrise)** is the most common choice: hens wake, eat and lay in the morning.
- Some farms split it, adding a little in the evening too.
- Keep the switch-on and switch-off times **the same every day**. Irregular light confuses hens.

## How bright?

- Hens need enough light to see feed and water clearly everywhere in the house. A practical guide is that you can **read a newspaper at bird height** in the darkest corner.
- Use evenly spaced bulbs rather than one bright bulb, so there are no dark corners.
- Clean bulbs regularly: dust cuts light a lot.
- Warm white LED bulbs use little electricity and last long.

## Power cuts

Load-shedding breaks the program. A small battery backup or solar light for the morning hours protects production. If the light fails for one or two days, hens usually recover; repeated breaks cause a drop.

## Use a timer

A **cheap mechanical or digital timer** is more reliable than someone remembering to switch lights at 4 in the morning. Set it once and check it weekly.

## Signs the lighting is wrong

- Pullets laying very early and very small eggs: light increased during rearing
- Production falling in winter: total light too short
- Pecking and feather pulling: lights too bright or uneven, often combined with crowding

## Track the effect

Record the date you change the light schedule. In **FarmFlows**, your daily egg log shows the result in production and egg numbers per hen, so you can see whether the change worked.$s$,
$s$মুরগি **দিনের দৈর্ঘ্যের** প্রতি খুব সংবেদনশীল। লম্বা দিন শরীরকে জানায় এখন ডিম পাড়ার মৌসুম; ছোট দিন জানায় ধীর হওয়ার সময়। এ কারণেই আলোর পরিকল্পনা ছাড়া খামারে শীতে প্রায়ই ডিম ওঠানামা করে, আর বাড়ন্ত মুরগিকে আগেভাগে বেশি আলো দিলে খুব তাড়াতাড়ি ছোট ডিম পাড়া শুরু করে।

লেয়ার খামারে আলোর সূচি সবচেয়ে সস্তা কৌশলগুলোর একটা। লাগে কয়েকটা বাল্ব, একটা টাইমার আর নিয়ম মেনে চলা।

## দুটো সোনালি নিয়ম

1. **বাড়ন্ত সময়ে কখনো দিনের আলোর সময় বাড়াবেন না।** একই রাখুন বা কমান, যাতে শরীর তৈরি হওয়ার আগে ডিম পাড়া শুরু না করে।
2. **ডিম পাড়ার সময় কখনো আলোর সময় কমাবেন না।** একই রাখুন বা বাড়ান। এক ঘণ্টা কমালেও উৎপাদন পড়ে যেতে পারে।

## সহজ একটা সূচি (খোলা পাশের ঘর)

সঠিক সূচি আপনার জাতের ব্যবস্থাপনা গাইডে আছে; এটা প্রচলিত একটা ধরন।

| বয়স | দিনে আলোর ঘণ্টা |
| --- | --- |
| ১–৩ দিন | ২২–২৩ ঘণ্টা (বাচ্চা খাবার আর পানি খুঁজে পায়) |
| ১ম সপ্তাহ | ধীরে প্রায় ১৮–২০ ঘণ্টায় নামান |
| ২–৮ সপ্তাহ | ধাপে ধাপে প্রাকৃতিক দিনের দৈর্ঘ্যে (প্রায় ১১–১২ ঘণ্টা) |
| ৯–১৬ সপ্তাহ | প্রাকৃতিক দিন; বাড়তি আলো না |
| প্রায় ১৭–১৮ সপ্তাহ (লক্ষ্য ওজনে পৌঁছালে) | আলো বাড়ানো শুরু: সপ্তাহে প্রায় ৩০–৬০ মিনিট |
| ডিম পাড়া | মোট **১৬ ঘণ্টা** আলোয় তুলে সেখানেই রাখুন |

"মোট আলো" মানে দিনের আলো আর বাতির আলো মিলিয়ে। বাংলাদেশে প্রাকৃতিক দিন জুনে সবচেয়ে লম্বা আর ডিসেম্বরে সবচেয়ে ছোট, তাই সারা বছর বাতির প্রয়োজন বদলায়।

## বাড়তি আলো কখন দেবেন

- সবচেয়ে প্রচলিত হলো **ভোরে (সূর্য ওঠার আগে)**: মুরগি জেগে খায় আর সকালে ডিম পাড়ে।
- কোনো খামার ভাগ করে দেয়, সন্ধ্যায়ও কিছুটা যোগ করে।
- বাতি জ্বালানো আর নেভানোর সময় **প্রতিদিন একই** রাখুন। অনিয়মিত আলো মুরগিকে বিভ্রান্ত করে।

## কত উজ্জ্বল?

- ঘরের সব জায়গায় খাবার আর পানি স্পষ্ট দেখার মতো আলো লাগে। কাজের হিসাব: সবচেয়ে অন্ধকার কোণেও **মুরগির উচ্চতায় পত্রিকা পড়া যায়**।
- একটা উজ্জ্বল বাল্বের বদলে সমান দূরত্বে কয়েকটা বাল্ব দিন, যাতে অন্ধকার কোণ না থাকে।
- নিয়মিত বাল্ব পরিষ্কার করুন: ধুলায় অনেক আলো কমে যায়।
- উষ্ণ সাদা এলইডি বাল্বে বিদ্যুৎ কম লাগে আর অনেক দিন চলে।

## লোডশেডিং

লোডশেডিং সূচি ভেঙে দেয়। ভোরের ঘণ্টাগুলোর জন্য ছোট ব্যাটারি ব্যাকআপ বা সোলার বাতি উৎপাদন রক্ষা করে। এক-দুই দিন আলো না থাকলে মুরগি সাধারণত সামলে নেয়; বারবার হলে ডিম কমে।

## টাইমার ব্যবহার করুন

ভোর ৪টায় কারো মনে করে বাতি জ্বালানোর চেয়ে **সস্তা যান্ত্রিক বা ডিজিটাল টাইমার** বেশি নির্ভরযোগ্য। একবার সেট করে সপ্তাহে একবার দেখুন।

## আলো ভুল হওয়ার লক্ষণ

- বাড়ন্ত মুরগি খুব তাড়াতাড়ি খুব ছোট ডিম পাড়ছে: বাড়ন্ত সময়ে আলো বাড়ানো হয়েছে
- শীতে উৎপাদন কমছে: মোট আলো কম
- ঠোকরাঠুকরি আর পালক টানা: আলো বেশি উজ্জ্বল বা অসমান, প্রায়ই গাদাগাদির সাথে

## ফল খেয়াল করুন

আলোর সূচি কবে বদলালেন লিখে রাখুন। **FarmFlows**-এ প্রতিদিনের ডিমের লগে উৎপাদন আর মুরগি প্রতি ডিমের সংখ্যায় ফল দেখা যায়, তাই পরিবর্তন কাজ করল কিনা বুঝতে পারবেন।$s$);

-- 18 ------------------------------------------------------------------
insert into _new_articles values (
$s$egg-quality-cracked-dirty-eggs-storage$s$, 'poultry', array['egg-production', 'biosecurity'], interval '18 minutes',
$s$Fewer cracked and dirty eggs: collection, cleaning and storage that protect your egg price$s$,
$s$ভাঙা আর নোংরা ডিম কমান: ডিম সংগ্রহ, পরিষ্কার আর রাখার নিয়ম, যাতে দাম ঠিক থাকে$s$,
$s$Cracked, dirty and thin-shelled eggs sell for less. Common causes, how often to collect, cleaning without spoiling eggs, and storing them until sale.$s$,
$s$ভাঙা, নোংরা আর পাতলা খোসার ডিমের দাম কম। কারণ, কতবার সংগ্রহ করবেন, ডিম নষ্ট না করে পরিষ্কারের নিয়ম আর বিক্রি পর্যন্ত রাখার উপায়।$s$,
$s$Every egg a hen lays has already cost you feed, labour, medicine and electricity. A cracked or dirty egg that sells at a discount, or not at all, throws that cost away. On many farms, a few percent of eggs are lost this way every day without anyone counting.

## Why eggs crack

- **Thin shells** from older hens, heat stress, disease or lack of calcium in the diet
- **Collecting too rarely**: eggs pile up and hens step on them
- **Rough handling**: dropping eggs into a bucket, overfilling trays
- **Cage or nest problems**: sloping floors that roll eggs too fast, broken wires, no bedding in nests
- **Transport**: loose trays on a bumpy road

## Why eggs get dirty

- Wet, dirty litter or nest bedding
- Hens sleeping in nest boxes and droppings inside them
- Diarrhoea in the flock (a health problem to investigate)
- Eggs left on the floor

## Collection: often and gently

- **Collect at least 3 times a day**, more in hot weather. Most eggs are laid in the morning.
- Use clean plastic trays, not buckets.
- Place eggs **pointed end down**: the air cell stays at the top and the yolk stays centred.
- Separate cracked and dirty eggs at collection, not later.

## Cleaning dirty eggs

The shell has a natural protective coating. Washing in the wrong way pulls germs into the egg.

- **Dry clean first:** lightly rub off spots with a dry cloth, fine sandpaper or a soft brush.
- If washing is needed, use **water warmer than the egg** (not cold), wash quickly, and dry immediately. Cold water makes the egg contents shrink and pulls dirt in through the pores.
- **Never soak eggs** in a bucket of water.
- Heavily soiled eggs are best used at home quickly, not stored or sold.

## Storage until sale

- **Cool, shaded, dry and airy place**, away from feed, chemicals and strong smells (eggs absorb smells)
- Not in direct sun, not on the floor
- Sell as fresh as possible. In normal room temperatures in Bangladesh, eggs lose quality faster than in cool climates.
- Do not move eggs from a cool store into hot air just before sale: they "sweat", and moisture on the shell helps germs enter.

## Fix the cause, not just the eggs

| Problem | Check |
| --- | --- |
| Many thin or cracked shells | Layer feed calcium, shell grit, hen age, heat stress, any disease in the flock |
| Many dirty eggs | Litter dryness, nest bedding, number of nests, droppings in nests |
| Eggs cracked in cages | Floor slope, broken wires, how often eggs are collected |
| Shell problems in older hens | Plan to replace the flock; production costs rise with age |

Our article on why layer egg production drops covers disease and management causes in more detail.

## Count it

Write down cracked and dirty eggs separately from saleable eggs every day. In **FarmFlows**, you can record egg production in the daily flock log. If you see cracked eggs rising from 2% to 6%, you know to act before it becomes a bigger loss.$s$,
$s$মুরগি যে ডিম পাড়ে, তাতে আগেই খাবার, শ্রম, ওষুধ আর বিদ্যুতের খরচ হয়ে গেছে। ভাঙা বা নোংরা ডিম কম দামে বিক্রি হলে, বা একদমই বিক্রি না হলে, সেই খরচ নষ্ট হয়। অনেক খামারে প্রতিদিন এভাবে কয়েক শতাংশ ডিম নষ্ট হয়, কেউ গোনেও না।

## ডিম কেন ভাঙে

- বয়স্ক মুরগি, গরমের চাপ, রোগ বা খাবারে ক্যালসিয়ামের অভাবে **পাতলা খোসা**
- **কম বার সংগ্রহ**: ডিম জমে যায়, মুরগি পাড়া দেয়
- **অযত্নে নাড়াচাড়া**: বালতিতে ডিম ফেলা, ট্রেতে বেশি রাখা
- **খাঁচা বা বাসার সমস্যা**: বেশি ঢালু মেঝেতে ডিম জোরে গড়ায়, ভাঙা তার, বাসায় বিছানা নেই
- **পরিবহন**: এবড়োখেবড়ো রাস্তায় আলগা ট্রে

## ডিম কেন নোংরা হয়

- ভেজা, নোংরা লিটার বা বাসার বিছানা
- মুরগি বাসায় ঘুমায় আর ভেতরে মলত্যাগ করে
- ঝাঁকে পাতলা পায়খানা (খুঁজে দেখার মতো স্বাস্থ্য সমস্যা)
- মেঝেতে পড়ে থাকা ডিম

## সংগ্রহ: বারবার আর আলতো হাতে

- **দিনে অন্তত ৩ বার সংগ্রহ করুন**, গরমে আরও বেশি। বেশিরভাগ ডিম সকালে পাড়ে।
- বালতি না, পরিষ্কার প্লাস্টিকের ট্রে ব্যবহার করুন।
- ডিম **সরু দিক নিচে** রাখুন: বাতাসের থলি ওপরে থাকে আর কুসুম মাঝখানে থাকে।
- ভাঙা আর নোংরা ডিম সংগ্রহের সময়ই আলাদা করুন, পরে না।

## নোংরা ডিম পরিষ্কার

খোসায় প্রাকৃতিক সুরক্ষার একটা আস্তর থাকে। ভুলভাবে ধুলে জীবাণু ডিমের ভেতরে চলে যায়।

- **আগে শুকনো পরিষ্কার:** শুকনো কাপড়, মিহি শিরিশ কাগজ বা নরম ব্রাশ দিয়ে দাগ আলতো ঘষে তুলুন।
- ধুতেই হলে **ডিমের চেয়ে গরম পানি** দিয়ে (ঠান্ডা না) দ্রুত ধুয়ে সাথে সাথে শুকিয়ে নিন। ঠান্ডা পানিতে ডিমের ভেতরটা সংকুচিত হয়ে ছিদ্র দিয়ে ময়লা টেনে নেয়।
- বালতির পানিতে **কখনো ডিম ভিজিয়ে রাখবেন না।**
- খুব নোংরা ডিম রেখে বা বিক্রি না করে তাড়াতাড়ি বাড়িতে খেয়ে ফেলাই ভালো।

## বিক্রি পর্যন্ত রাখা

- **ঠান্ডা, ছায়াযুক্ত, শুকনো আর বাতাস চলাচলের জায়গায়**, খাবার, রাসায়নিক আর কড়া গন্ধ থেকে দূরে (ডিম গন্ধ শুষে নেয়)
- সরাসরি রোদে না, মেঝেতে না
- যত টাটকা সম্ভব বিক্রি করুন। বাংলাদেশের সাধারণ ঘরের তাপমাত্রায় ঠান্ডা দেশের চেয়ে ডিমের মান তাড়াতাড়ি কমে।
- বিক্রির ঠিক আগে ঠান্ডা জায়গা থেকে গরম বাতাসে নেবেন না: ডিম "ঘামে", আর খোসার আর্দ্রতায় জীবাণু ঢোকে।

## ডিম না, কারণ ঠিক করুন

| সমস্যা | যা দেখবেন |
| --- | --- |
| অনেক পাতলা বা ভাঙা খোসা | লেয়ার খাবারের ক্যালসিয়াম, ঝিনুকের গুঁড়া, মুরগির বয়স, গরমের চাপ, ঝাঁকে কোনো রোগ |
| অনেক নোংরা ডিম | লিটার শুকনো কিনা, বাসার বিছানা, বাসার সংখ্যা, বাসায় মল |
| খাঁচায় ডিম ভাঙা | মেঝের ঢাল, ভাঙা তার, কতবার সংগ্রহ হয় |
| বয়স্ক মুরগির খোসার সমস্যা | ঝাঁক বদলানোর পরিকল্পনা; বয়সের সাথে উৎপাদন খরচ বাড়ে |

রোগ আর ব্যবস্থাপনার কারণ বিস্তারিত আছে আমাদের "লেয়ার মুরগির ডিম কেন কমে" লেখায়।

## গুনে রাখুন

বিক্রিযোগ্য ডিম থেকে আলাদা করে প্রতিদিন ভাঙা আর নোংরা ডিম লিখুন। **FarmFlows**-এ দৈনিক ঝাঁকের লগে ডিম উৎপাদন লেখা যায়। ভাঙা ডিম ২% থেকে ৬%-এ উঠতে দেখলে, বড় ক্ষতির আগেই ব্যবস্থা নেওয়ার সময় বুঝবেন।$s$);

-- 19 ------------------------------------------------------------------
insert into _new_articles values (
$s$daily-farm-records-what-to-write-down$s$, 'farm-business', array['records', 'milk-cost'], interval '19 minutes',
$s$Daily farm records: the 10 things worth writing down, and the ones you can skip$s$,
$s$খামারের দৈনিক হিসাব: যে ১০টা জিনিস লেখা দরকার, আর যেগুলো বাদ দিলেও চলে$s$,
$s$Records only help if you keep them. The few numbers that show if your farm makes money, ten minutes a day, and how to turn them into decisions.$s$,
$s$হিসাব রাখলে তবেই কাজে লাগে। খামার লাভে আছে কিনা বোঝার জন্য যে কয়েকটা সংখ্যা আসলে দরকার, প্রতিদিন কত সময় লাগে, আর কীভাবে সেগুলো থেকে সিদ্ধান্ত নেবেন।$s$,
$s$Most farmers know their farm "roughly": which cow is good, which month was bad, about how much feed costs. But "roughly" hides the things that lose money quietly: a cow that eats more than her milk is worth, a feed price that crept up, a buyer who owes more every month.

The answer is not a thick register filled with everything. It is **a short list of numbers, written every day**, that takes ten minutes.

## The 10 records that matter

**Every day**
1. **Milk per cow** (or eggs per flock), morning and evening
2. **Milk or eggs sold**, to whom and at what price
3. **Feed used**: concentrate and anything bought
4. **Money paid out**: feed, medicine, labour, transport, electricity
5. **Money received**, and who still owes you

**When it happens**
6. **Health events**: sickness, treatment, vaccines and deworming with next due dates
7. **Breeding**: heat, insemination, pregnancy check, calving
8. **Births, deaths, purchases and sales** of animals
9. **Weights** of growing animals, at least monthly

**Once a month**
10. **Stock count** of feed and medicine, to catch waste or theft

## What you can skip

- Writing the same thing in two places
- Long notes nobody reads again
- Exact feed for each animal every day, unless you are testing a ration: herd totals are enough
- Daily weights; monthly is plenty for most farms

## What the numbers tell you

- **Cost per litre of milk** (or per egg): the single most useful number. If it is higher than your selling price, something must change.
- **Milk per cow over time**: shows which cows to keep, breed from or sell.
- **Days between calvings**: long gaps mean breeding problems costing you milk.
- **Who owes you**: unpaid dues are a hidden cost.
- **Feed cost trend**: a slow rise you might not notice month to month.

Our article on milk production cost per litre shows how to calculate it step by step.

## Make it a habit

- **Same time every day**, for example right after evening milking
- **One person responsible**, even if others help
- **Write it immediately**, not "later this week"
- **Look at the totals once a week**: records you never read are wasted effort

## Paper or phone?

A notebook works if it is kept every day. A phone app saves the adding up. **FarmFlows** lets you enter milk, eggs, feed, expenses, sales and health records in Bangla or English, even offline, and does the totals: cost per litre and per egg, profit per animal, dues by buyer and reminders for vaccines and breeding. The important part is the habit; the tool only makes it faster.$s$,
$s$বেশিরভাগ খামারি নিজের খামার "মোটামুটি" জানেন: কোন গাভী ভালো, কোন মাস খারাপ গেল, খাবারে মোটামুটি কত খরচ। কিন্তু "মোটামুটি"র আড়ালে চুপচাপ টাকা নষ্ট হয়: যে গাভীর দুধের দামের চেয়ে খাওয়া বেশি, খাবারের যে দাম ধীরে ধীরে বেড়েছে, যে ক্রেতার বাকি প্রতি মাসে বাড়ছে।

সমাধান সবকিছু লেখা মোটা খাতা না। সমাধান হলো **প্রতিদিন লেখা ছোট একটা সংখ্যার তালিকা**, যাতে দশ মিনিট লাগে।

## যে ১০টা হিসাব দরকার

**প্রতিদিন**
1. **প্রতিটা গাভীর দুধ** (বা ঝাঁকের ডিম), সকাল আর বিকেল
2. **বিক্রি করা দুধ বা ডিম**, কাকে আর কত দামে
3. **খরচ হওয়া খাবার**: দানাদার আর কেনা যেকোনো খাবার
4. **দেওয়া টাকা**: খাবার, ওষুধ, শ্রম, গাড়িভাড়া, বিদ্যুৎ
5. **পাওয়া টাকা**, আর কে এখনো বাকি রেখেছে

**যখন ঘটে**
6. **স্বাস্থ্য**: অসুখ, চিকিৎসা, টিকা আর কৃমিনাশক, পরের তারিখসহ
7. **প্রজনন**: গরম, কৃত্রিম প্রজনন, গর্ভ পরীক্ষা, বাছুর দেওয়া
8. পশুর **জন্ম, মৃত্যু, কেনা আর বিক্রি**
9. বাড়ন্ত পশুর **ওজন**, অন্তত মাসে একবার

**মাসে একবার**
10. খাবার আর ওষুধের **মজুত গোনা**, অপচয় বা চুরি ধরার জন্য

## যা বাদ দিলেও চলে

- একই জিনিস দুই জায়গায় লেখা
- এমন লম্বা নোট যা আর কেউ পড়ে না
- রেশন পরীক্ষা না করলে প্রতিদিন প্রতিটা পশুর আলাদা খাবার: পালের মোট হিসাবই যথেষ্ট
- প্রতিদিনের ওজন; বেশিরভাগ খামারে মাসে একবারই যথেষ্ট

## সংখ্যাগুলো কী বলে

- **প্রতি লিটার দুধের (বা প্রতি ডিমের) খরচ**: সবচেয়ে কাজের একক সংখ্যা। বিক্রির দামের চেয়ে বেশি হলে কিছু বদলাতেই হবে।
- **সময়ের সাথে প্রতিটা গাভীর দুধ**: কোন গাভী রাখবেন, কাকে দিয়ে বংশ বাড়াবেন বা কাকে বিক্রি করবেন।
- **দুই বাছুরের মাঝের দিন**: লম্বা ফাঁক মানে প্রজননের সমস্যায় দুধ নষ্ট হচ্ছে।
- **কে বাকি রেখেছে**: বকেয়া টাকা লুকানো খরচ।
- **খাবার খরচের ধারা**: মাসে মাসে চোখে না পড়া ধীর বৃদ্ধি।

ধাপে ধাপে কীভাবে হিসাব করবেন, দেখানো আছে আমাদের প্রতি লিটার দুধের উৎপাদন খরচের লেখায়।

## অভ্যাস বানান

- **প্রতিদিন একই সময়ে**, যেমন বিকেলের দোহানোর ঠিক পরে
- **একজন দায়িত্বে**, অন্যরা সাহায্য করলেও
- **সাথে সাথে লিখুন**, "এই সপ্তাহে পরে" না
- **সপ্তাহে একবার মোট দেখুন**: যে হিসাব কখনো পড়া হয় না, তা বৃথা পরিশ্রম

## খাতা না ফোন?

প্রতিদিন রাখলে খাতাও কাজ করে। ফোনের অ্যাপে যোগ-বিয়োগের ঝামেলা বাঁচে। **FarmFlows**-এ দুধ, ডিম, খাবার, খরচ, বিক্রি আর স্বাস্থ্যের হিসাব বাংলা বা ইংরেজিতে, অফলাইনেও লেখা যায়, আর অ্যাপ মোট হিসাব করে দেয়: প্রতি লিটার আর প্রতি ডিমে খরচ, প্রতি পশুতে লাভ, ক্রেতাভিত্তিক বাকি আর টিকা ও প্রজননের রিমাইন্ডার। আসল জিনিস অভ্যাস; অ্যাপ শুধু কাজটা দ্রুত করে।$s$);

-- 20 ------------------------------------------------------------------
insert into _new_articles values (
$s$how-to-sell-milk-at-a-better-price$s$, 'farm-business', array['selling-milk', 'milk-cost'], interval '20 minutes',
$s$Getting a better price for your milk: who to sell to, and how to keep buyers paying$s$,
$s$দুধের ভালো দাম পাওয়া: কার কাছে বিক্রি করবেন, আর ক্রেতার টাকা কীভাবে নিয়মিত পাবেন$s$,
$s$Collection centre, sweet shop, tea stall or households: pros and cons of each milk buyer, the value of clean milk, and stopping dues eating profit.$s$,
$s$সংগ্রহ কেন্দ্র, মিষ্টির দোকান, চায়ের দোকান না বাড়ি বাড়ি: প্রতিটা ক্রেতার সুবিধা-অসুবিধা, পরিষ্কার দুধের কদর, আর বাকি টাকা যেন লাভ খেয়ে না ফেলে।$s$,
$s$Two farmers in the same village can get very different money for the same milk. The difference is rarely luck. It comes down to **who they sell to, how clean and consistent the milk is, and whether they actually get paid on time**.

## Know your cost first

Before you negotiate any price, know what one litre costs you to produce. If you do not know, you cannot tell a good offer from a bad one. Our article on milk production cost per litre shows how to work it out.

## Your selling options

| Buyer | Strengths | Weak points |
| --- | --- | --- |
| **Dairy company collection centre** | Buys every day, all year; fixed system; payment usually regular | Price per litre often lower; may test fat and quality; may need to deliver at a fixed time |
| **Sweet shops (মিষ্টির দোকান)** | Large volumes; may pay more for high-fat milk | Demand rises and falls with festivals; dues can pile up |
| **Tea stalls and restaurants** | Daily demand, close by | Small volumes each; payment often on credit |
| **Households (বাড়ি বাড়ি)** | Usually the best price per litre | Time and transport for delivery; many small accounts to track |
| **Local middleman (ঘোষ / পাইকার)** | Takes everything, no delivery effort | Lowest price; often controls when you get paid |

Most small farms do best with a **mix**: a steady base buyer (collection centre or sweet shop) for most of the milk, plus some direct household or shop sales for a better average price.

## Clean milk earns more

Buyers, especially companies and households, pay for milk that keeps well and tastes good.

- Clean udders, clean hands and a clean pail (our clean milking article has the routine)
- **Stainless steel or food-grade containers**, not old plastic or rusty cans
- **Cool the milk quickly** and deliver soon after milking
- **No water added**, ever. Buyers test, and trust once lost does not come back
- No milk from cows under treatment until the withdrawal period is over

## Consistent supply matters

A buyer would rather have 20 litres every day than 30 one day and 10 the next. Feeding and cow management that keep yields steady also help you keep good buyers.

## Fat and quality testing

If a collection centre pays by fat content, ask how they test and when you see the result. Breed, stage of lactation and feed all affect fat. Better green fodder and roughage often raise fat percentage.

## Dues: the silent profit killer

Credit sales are common, and unpaid dues can quietly wipe out a month's profit.

- **Agree on payment terms at the start**: daily, weekly or monthly
- **Write down every delivery**, litres and date, and share a running total with the buyer
- **Set a limit**: if a buyer has not paid for a set period, pause deliveries until they settle
- **Give a written bill** at the end of the month

## Let the app keep the accounts

In **FarmFlows**, record each sale with the buyer's name, litres and price. The app keeps a running balance for every buyer, shows who owes what, and can produce a monthly bill or memo you can share on WhatsApp. When you know exactly what each buyer owes and pays, asking for a better price or a faster payment is much easier.$s$,
$s$একই গ্রামের দুজন খামারি একই দুধে খুব আলাদা টাকা পেতে পারেন। পার্থক্যটা খুব কমই ভাগ্যের। আসল বিষয় হলো **কার কাছে বিক্রি করেন, দুধ কতটা পরিষ্কার আর নিয়মিত, আর আসলে সময়মতো টাকা পান কিনা**।

## আগে নিজের খরচ জানুন

কোনো দাম নিয়ে দর-কষাকষির আগে জানুন এক লিটার দুধ উৎপাদনে আপনার কত খরচ। না জানলে ভালো আর খারাপ প্রস্তাবের পার্থক্য বুঝবেন না। কীভাবে হিসাব করবেন, দেখানো আছে প্রতি লিটার দুধের উৎপাদন খরচের লেখায়।

## বিক্রির উপায়

| ক্রেতা | সুবিধা | অসুবিধা |
| --- | --- | --- |
| **দুগ্ধ কোম্পানির সংগ্রহ কেন্দ্র** | সারা বছর প্রতিদিন কেনে; নির্দিষ্ট ব্যবস্থা; টাকা সাধারণত নিয়মিত | লিটারপ্রতি দাম প্রায়ই কম; চর্বি আর মান পরীক্ষা করতে পারে; নির্দিষ্ট সময়ে দিতে হতে পারে |
| **মিষ্টির দোকান** | বেশি পরিমাণ; বেশি চর্বির দুধে বেশি দিতে পারে | উৎসব অনুযায়ী চাহিদা ওঠানামা করে; বাকি জমে যেতে পারে |
| **চায়ের দোকান আর হোটেল** | প্রতিদিন চাহিদা, কাছেই | একেকটায় অল্প; প্রায়ই বাকিতে |
| **বাড়ি বাড়ি** | সাধারণত লিটারপ্রতি সবচেয়ে ভালো দাম | পৌঁছানোর সময় আর গাড়িভাড়া; অনেক ছোট হিসাব রাখতে হয় |
| **স্থানীয় ঘোষ বা পাইকার** | সব নিয়ে নেয়, পৌঁছাতে হয় না | সবচেয়ে কম দাম; টাকা কবে পাবেন অনেক সময় তারাই ঠিক করে |

বেশিরভাগ ছোট খামার **মিলিয়ে** বিক্রি করলে সবচেয়ে ভালো করে: বেশিরভাগ দুধের জন্য একটা নিয়মিত মূল ক্রেতা (সংগ্রহ কেন্দ্র বা মিষ্টির দোকান), আর গড় দাম বাড়াতে কিছুটা সরাসরি বাড়ি বা দোকানে।

## পরিষ্কার দুধের দাম বেশি

ক্রেতারা, বিশেষ করে কোম্পানি আর বাড়ির লোক, এমন দুধের দাম দেন যা ভালো থাকে আর খেতে ভালো।

- পরিষ্কার ওলান, পরিষ্কার হাত আর পরিষ্কার বালতি (নিয়ম আছে আমাদের পরিষ্কার দোহনের লেখায়)
- পুরনো প্লাস্টিক বা মরচে ধরা ক্যান না, **স্টেইনলেস স্টিল বা খাদ্য-মানের পাত্র**
- **দুধ তাড়াতাড়ি ঠান্ডা করুন** আর দোহানোর পর দ্রুত পৌঁছে দিন
- **কখনো পানি মেশাবেন না।** ক্রেতা পরীক্ষা করে, আর একবার আস্থা গেলে আর ফেরে না
- চিকিৎসাধীন গাভীর দুধ প্রত্যাহারের সময় শেষ না হওয়া পর্যন্ত দেবেন না

## নিয়মিত জোগান জরুরি

ক্রেতা একদিন ৩০ আর পরদিন ১০ লিটারের চেয়ে প্রতিদিন ২০ লিটার বেশি পছন্দ করে। যে খাওয়ানো আর গাভীর যত্নে দুধ স্থির থাকে, তা ভালো ক্রেতা ধরে রাখতেও সাহায্য করে।

## চর্বি আর মান পরীক্ষা

সংগ্রহ কেন্দ্র চর্বির হিসাবে দাম দিলে জিজ্ঞেস করুন কীভাবে পরীক্ষা করে আর ফল কখন দেখতে পাবেন। জাত, দুধের মৌসুমের কোন পর্যায় আর খাবার, সবকিছুই চর্বিকে প্রভাবিত করে। ভালো কাঁচা ঘাস আর আঁশজাতীয় খাবারে প্রায়ই চর্বির হার বাড়ে।

## বাকি: নীরবে লাভ খেয়ে ফেলে

বাকিতে বিক্রি খুব সাধারণ, আর না পাওয়া টাকা চুপচাপ এক মাসের লাভ মুছে দিতে পারে।

- **শুরুতেই টাকা দেওয়ার নিয়ম ঠিক করুন**: দৈনিক, সাপ্তাহিক বা মাসিক
- **প্রতিবার দুধ দেওয়া লিখে রাখুন**, লিটার আর তারিখ, আর চলতি মোট ক্রেতাকে জানান
- **একটা সীমা রাখুন**: নির্দিষ্ট সময় টাকা না দিলে পরিশোধ না করা পর্যন্ত দুধ দেওয়া বন্ধ রাখুন
- মাস শেষে **লিখিত বিল** দিন

## হিসাব অ্যাপকে রাখতে দিন

**FarmFlows**-এ প্রতিটা বিক্রি ক্রেতার নাম, লিটার আর দামসহ লিখুন। অ্যাপ প্রতিটা ক্রেতার চলতি বাকি রাখে, কে কত পাওনা দেখায়, আর মাসিক বিল বা মেমো বানায় যা হোয়াটসঅ্যাপে পাঠানো যায়। প্রতিটা ক্রেতা ঠিক কত পাওনা আর কত দিল জানা থাকলে ভালো দাম বা তাড়াতাড়ি টাকা চাওয়া অনেক সহজ হয়।$s$);

-- Insert the articles (skip any slug that already exists) and link them.
insert into public.blog_posts (slug, title_en, title_bn, summary_en, summary_bn, body_en, body_bn, published, published_at, category_id)
select a.slug, a.title_en, a.title_bn, a.summary_en, a.summary_bn, a.body_en, a.body_bn, true, now() - a.age,
       (select c.id from public.blog_categories c where c.slug = a.category)
from _new_articles a
where not exists (select 1 from public.blog_posts p where p.slug = a.slug);

insert into public.blog_post_tags (post_id, tag_id)
select p.id, t.id
from _new_articles a
join public.blog_posts p on p.slug = a.slug
join public.blog_tags t on t.slug = any (a.tags)
on conflict do nothing;

drop table _new_articles;

-- Animal-health articles: marked as such (they show who wrote them and, once
-- an admin adds one, the vet reviewer) with official sources, checked to open.
do $$
declare
  fmd jsonb := '{"title_en": "WOAH: Foot and mouth disease", "title_bn": "WOAH: ক্ষুরা রোগ (ফুট অ্যান্ড মাউথ ডিজিজ)", "url": "https://www.woah.org/en/disease/foot-and-mouth-disease/"}';
  fah jsonb := '{"title_en": "FAO: Animal health", "title_bn": "FAO: প্রাণিস্বাস্থ্য", "url": "https://www.fao.org/animal-health/en"}';
  amr jsonb := '{"title_en": "FAO: Antimicrobial resistance", "title_bn": "FAO: অ্যান্টিমাইক্রোবিয়াল রেজিস্ট্যান্স (ওষুধ-সহনশীলতা)", "url": "https://www.fao.org/antimicrobial-resistance/en/"}';
  woah_amr jsonb := '{"title_en": "WOAH: Antimicrobial resistance", "title_bn": "WOAH: অ্যান্টিমাইক্রোবিয়াল রেজিস্ট্যান্স", "url": "https://www.woah.org/en/what-we-do/global-initiatives/antimicrobial-resistance/"}';
begin
  update public.blog_posts set health_topic = true, sources = jsonb_build_array(fah, amr) where slug = 'cattle-deworming-schedule-guide' and sources = '[]';
  update public.blog_posts set health_topic = true, sources = jsonb_build_array(fmd, fah) where slug = 'foot-and-mouth-disease-cow-care' and sources = '[]';
  update public.blog_posts set health_topic = true, sources = jsonb_build_array(fah) where slug = 'bloat-in-cattle-signs-emergency-prevention' and sources = '[]';
  update public.blog_posts set health_topic = true, sources = jsonb_build_array(fah, woah_amr) where slug = 'calf-diarrhea-scours-treatment-prevention' and sources = '[]';
end $$;
