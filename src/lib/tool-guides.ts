// The explanation under each free tool (/tools/<slug>): how it works, the
// formula, a worked example and a short FAQ, in English and Bangla, plus the
// blog article that goes with it. The worked example is calculated with the
// tool's own functions and the current (admin-editable) numbers, so the page
// can never show a result the tool wouldn't give.
import type { Locale } from "@/lib/i18n/core";
import type { ToolSlug } from "@/lib/tool-list";
import {
  convertUnit,
  dairyRation,
  defaultFeedChoices,
  doseFor,
  fodderPlan,
  leastCostRation,
  meatValue,
  milkPrice,
  poultryFeed,
  pregnancyDates,
  tapeWeightKg,
  type FeedId,
  type ToolParams,
} from "@/lib/tools";

type Bi = { en: string; bn: string };
type Num = (v: number, digits?: number) => string;
type Example = { setup: string; steps: string[]; result: string };

export type ToolGuide = {
  /** The blog article for this tool (linked both ways), by slug. */
  blog: string | null;
  how: Bi[];
  formula: Bi[];
  example: (p: ToolParams, locale: Locale, n: Num, date: (iso: string) => string) => Example | null;
  faq: { q: Bi; a: Bi }[];
};

const b = (en: string, bn: string): Bi => ({ en, bn });
const L = (locale: Locale, en: string, bn: string) => (locale === "bn" ? bn : en);

export const TOOL_GUIDES: Record<ToolSlug, ToolGuide> = {
  "cattle-weight": {
    blog: "how-to-measure-cattle-weight-with-a-tape",
    how: [
      b(
        "Most small farms have no livestock scale, but every farm has a measuring tape. An animal's weight is closely tied to the size of its chest and the length of its body, so two tape measurements give a good estimate of live weight. This tool uses Schaeffer's formula, which livestock officers and traders in Bangladesh and India have used for decades.",
        "বেশিরভাগ ছোট খামারে পশু মাপার পাল্লা নেই, কিন্তু একটা মাপার ফিতা সবার আছে। পশুর ওজন তার বুকের বেড় আর শরীরের দৈর্ঘ্যের সাথে খুব কাছাকাছি সম্পর্কিত, তাই ফিতা দিয়ে দুটো মাপ নিলেই জীবন্ত ওজনের ভালো অনুমান পাওয়া যায়। এই টুল শেফার (Schaeffer) সূত্র ব্যবহার করে, যা বাংলাদেশ ও ভারতের প্রাণিসম্পদ কর্মকর্তা ও ব্যাপারীরা বহু বছর ধরে ব্যবহার করছেন।",
      ),
      b(
        "Measure the heart girth all the way round the chest just behind the front legs, and the body length from the point of the shoulder to the pin bone near the tail. Keep the tape snug but not tight, and have the animal stand straight on level ground. Measure twice and use the average. You can measure in centimetres or inches; the tool converts for you.",
        "বুকের বেড় মাপুন সামনের পায়ের ঠিক পেছনে বুকের চারপাশ ঘুরিয়ে, আর শরীরের দৈর্ঘ্য মাপুন কাঁধের সামনের হাড় থেকে লেজের কাছের পিন হাড় পর্যন্ত। ফিতা টানটান রাখুন, তবে চেপে নয়, আর পশুকে সমান জায়গায় সোজা করে দাঁড় করান। দুবার মেপে গড় নিন। সেন্টিমিটার বা ইঞ্চি, যেকোনোটায় মাপতে পারেন; টুল নিজেই বদলে নেয়।",
      ),
    ],
    formula: [
      b("Live weight (kg) = heart girth (cm) × heart girth (cm) × body length (cm) ÷ 10,838", "জীবন্ত ওজন (কেজি) = বুকের বেড় (সেমি) × বুকের বেড় (সেমি) × শরীরের দৈর্ঘ্য (সেমি) ÷ ১০,৮৩৮"),
      b("In inches, the same formula is girth² × length ÷ 300 and gives pounds. The result is shown with a range of about ±10 %.", "ইঞ্চিতে একই সূত্র হলো বেড়² × দৈর্ঘ্য ÷ ৩০০, যা পাউন্ডে ফল দেয়। ফলের সাথে প্রায় ±১০ % সীমা দেখানো হয়।"),
    ],
    example: (p, locale, n) => {
      const r = tapeWeightKg(150, 120, "cm", p.weight);
      if (!r) return null;
      return {
        setup: L(locale, "A cow measures 150 cm round the chest and 120 cm long.", "একটা গাভীর বুকের বেড় ১৫০ সেমি আর শরীরের দৈর্ঘ্য ১২০ সেমি।"),
        steps: [
          L(locale, `150 × 150 = ${n(22500)}`, `১৫০ × ১৫০ = ${n(22500)}`),
          L(locale, `${n(22500)} × 120 = ${n(2700000)}`, `${n(22500)} × ১২০ = ${n(2700000)}`),
          L(locale, `${n(2700000)} ÷ ${n(p.weight.divisor)} = ${n(r.kg, 1)} kg`, `${n(2700000)} ÷ ${n(p.weight.divisor)} = ${n(r.kg, 1)} কেজি`),
        ],
        result: L(locale, `About ${n(r.kg, 1)} kg, most likely between ${n(r.low)} and ${n(r.high)} kg.`, `প্রায় ${n(r.kg, 1)} কেজি, সম্ভবত ${n(r.low)} থেকে ${n(r.high)} কেজির মধ্যে।`),
      };
    },
    faq: [
      {
        q: b("How accurate is weighing with a tape?", "ফিতা দিয়ে ওজন কতটা ঠিক হয়?"),
        a: b(
          "For an average cow it is usually within about 10 % of the scale weight. Very fat, very thin or pregnant animals, and animals with a full belly, can be further off. A scale is always more accurate.",
          "সাধারণ গাভীর ক্ষেত্রে সাধারণত পাল্লার ওজনের প্রায় ১০ %-এর মধ্যে থাকে। খুব মোটা, খুব রোগা বা গর্ভবতী পশু, আর ভরা পেটের পশুর ক্ষেত্রে পার্থক্য বেশি হতে পারে। পাল্লা সবসময় বেশি নির্ভুল।",
        ),
      },
      {
        q: b("When is the best time to measure?", "মাপার সবচেয়ে ভালো সময় কখন?"),
        a: b(
          "In the morning before feeding and drinking, at the same time each time. Then the change from one month to the next shows real growth, not a full or empty belly.",
          "সকালে খাবার ও পানি দেওয়ার আগে, প্রতিবার একই সময়ে। তাহলে এক মাস থেকে পরের মাসের পার্থক্য আসল বৃদ্ধি দেখাবে, ভরা বা খালি পেট নয়।",
        ),
      },
      {
        q: b("Can I use it for goats and sheep?", "ছাগল ও ভেড়ার জন্য কি ব্যবহার করা যায়?"),
        a: b(
          "Yes, it gives a rough estimate for goats and sheep too. Measure the same way; the error can be larger in small animals, so weigh a few on a scale to see how close it is for your breed.",
          "হ্যাঁ, ছাগল ও ভেড়ার জন্যও মোটামুটি অনুমান দেয়। একইভাবে মাপুন; ছোট পশুতে ভুল বেশি হতে পারে, তাই আপনার জাতের জন্য কতটা কাছাকাছি আসে দেখতে কয়েকটাকে পাল্লায় মেপে নিন।",
        ),
      },
      {
        q: b("What is the weight useful for?", "ওজন জেনে কী লাভ?"),
        a: b(
          "Medicine and dewormer doses are given by weight, feed is planned by weight, and a fattening animal's daily gain shows whether the feed is paying. In FarmFlows you can save the result to the animal and see its growth over time.",
          "ওষুধ ও কৃমিনাশকের মাত্রা ওজন দেখে দেওয়া হয়, খাবারের পরিকল্পনা ওজন দেখে হয়, আর মোটাতাজা পশুর দৈনিক বৃদ্ধি বলে দেয় খাবারের খরচ উঠছে কিনা। FarmFlows-এ ফলটা পশুর রেকর্ডে সেভ করে সময়ের সাথে তার বৃদ্ধি দেখতে পারেন।",
        ),
      },
    ],
  },

  "least-cost-ration": {
    blog: "how-to-make-maize-silage-small-farm",
    how: [
      b(
        "Feed is the largest cost on most cattle farms. This tool takes the feeds you actually have, at the prices you pay, and finds the cheapest daily ration that still gives the animal enough energy (TDN) and protein, inside the amount of dry matter it can eat.",
        "বেশিরভাগ গরুর খামারে সবচেয়ে বড় খরচ খাবার। এই টুল আপনার কাছে আসলে যে খাবার আছে, আপনার কেনা দামে, সেগুলো দিয়ে সবচেয়ে সস্তা দৈনিক রেশন খুঁজে দেয়, যাতে পশু যতটা শুকনো খাবার খেতে পারে তার মধ্যেই যথেষ্ট শক্তি (TDN) আর আমিষ পায়।",
      ),
      b(
        "It also keeps the ration safe: at least 35–60 % of the dry matter comes from roughage (straw, grass or silage), and no feed goes above its safe share, such as oil cake or molasses. If your feeds cannot meet a need, it tells you what is short and what kind of feed to add. Feed values come from typical Bangladeshi feed tables (BLRI / ICAR); real feeds vary, so watch the animal's milk and body condition.",
        "রেশনটা নিরাপদও রাখে: শুকনো খাবারের অন্তত ৩৫–৬০ % আসে আঁশজাতীয় খাবার (খড়, ঘাস বা সাইলেজ) থেকে, আর খৈল বা চিটাগুড়ের মতো কোনো খাবার নিরাপদ পরিমাণের বেশি হয় না। আপনার খাবারে কোনো চাহিদা না মিটলে কী কম আর কোন ধরনের খাবার যোগ করতে হবে তা বলে দেয়। খাবারের মান বাংলাদেশের সাধারণ খাদ্য-তালিকা (BLRI / ICAR) থেকে নেওয়া; আসল খাবার আলাদা হতে পারে, তাই পশুর দুধ ও শরীরের অবস্থা খেয়াল রাখুন।",
      ),
    ],
    formula: [
      b("Body upkeep: TDN = 0.0353 × weight^0.75 kg, protein = 0.00355 × weight^0.75 kg a day.", "শরীর ঠিক রাখতে: TDN = ০.০৩৫৩ × ওজন^০.৭৫ কেজি, আমিষ = ০.০০৩৫৫ × ওজন^০.৭৫ কেজি প্রতিদিন।"),
      b("Each kg of milk adds TDN 0.196 + 0.0315 × fat % and protein 0.054 + 0.009 × fat % kg; each kg of daily gain adds 3 kg TDN and 0.4 kg protein.", "প্রতি কেজি দুধে যোগ হয় TDN ০.১৯৬ + ০.০৩১৫ × ফ্যাট % আর আমিষ ০.০৫৪ + ০.০০৯ × ফ্যাট % কেজি; দৈনিক প্রতি কেজি বৃদ্ধিতে ৩ কেজি TDN ও ০.৪ কেজি আমিষ।"),
      b("Then: the lowest total cost of the feeds that meets both needs (linear programming).", "তারপর: যে খাবারগুলো দুটো চাহিদাই মেটায় তার মধ্যে সবচেয়ে কম মোট খরচেরটা (লিনিয়ার প্রোগ্রামিং)।"),
    ],
    example: (p, locale, n) => {
      const start: FeedId[] = ["rice_straw", "napier", "wheat_bran", "maize", "mustard_cake"];
      const r = leastCostRation({ kind: "milking", weightKg: 400, milkL: 10, fatPct: 4 }, defaultFeedChoices(p.feedPrice).filter((c) => start.includes(c.id)));
      if (!r || r.error) return null;
      const names: Record<string, Bi> = {
        rice_straw: b("rice straw", "ধানের খড়"),
        napier: b("Napier grass", "নেপিয়ার ঘাস"),
        wheat_bran: b("wheat bran", "গমের ভুসি"),
        maize: b("crushed maize", "ভাঙা ভুট্টা"),
        mustard_cake: b("mustard oil cake", "সরিষার খৈল"),
      };
      const list = r.items.map((it) => `${names[it.id]?.[locale] ?? it.id} ${n(it.kg, 1)} ${L(locale, "kg", "কেজি")}`).join(", ");
      return {
        setup: L(
          locale,
          "A 400 kg cow giving 10 litres of milk at 4 % fat, with rice straw, Napier grass, wheat bran, crushed maize and mustard oil cake at the starting prices.",
          "৪০০ কেজির একটা গাভী, ৪ % ফ্যাটে দিনে ১০ লিটার দুধ দেয়; খাবার ধানের খড়, নেপিয়ার ঘাস, গমের ভুসি, ভাঙা ভুট্টা ও সরিষার খৈল, শুরুর দামে।",
        ),
        steps: [
          L(locale, `She needs about ${n(r.need.tdn, 2)} kg TDN and ${n(r.need.cp, 2)} kg protein a day, and can eat ${n(r.need.dmMin, 1)}–${n(r.need.dmMax, 1)} kg of dry matter.`, `তার দিনে প্রায় ${n(r.need.tdn, 2)} কেজি TDN আর ${n(r.need.cp, 2)} কেজি আমিষ লাগে, আর সে ${n(r.need.dmMin, 1)}–${n(r.need.dmMax, 1)} কেজি শুকনো খাবার খেতে পারে।`),
          L(locale, `Cheapest mix that meets this: ${list}.`, `এটা মেটানোর সবচেয়ে সস্তা মিশ্রণ: ${list}।`),
        ],
        result: L(locale, `Feed cost about ৳${n(r.costDay)} a day, or ৳${n(r.costPerLitre ?? 0, 2)} per litre of milk.`, `খাবারের খরচ দিনে প্রায় ৳${n(r.costDay)}, বা প্রতি লিটার দুধে ৳${n(r.costPerLitre ?? 0, 2)}।`),
      };
    },
    faq: [
      {
        q: b("Why does it give so much green grass and so little concentrate?", "কেন এত বেশি কাঁচা ঘাস আর এত কম দানাদার দেয়?"),
        a: b(
          "Because at the prices given, grass is the cheapest way to supply energy and protein. If your grass is limited, type the most you have per animal per day and the tool will use more of the other feeds.",
          "কারণ দেওয়া দামে শক্তি আর আমিষ দেওয়ার সবচেয়ে সস্তা উপায় ঘাস। আপনার ঘাস সীমিত হলে প্রতি পশুর জন্য দিনে সর্বোচ্চ কতটা আছে লিখুন, টুল তখন অন্য খাবার বেশি ব্যবহার করবে।",
        ),
      },
      {
        q: b("Should I change the feed all at once?", "খাবার কি একবারে বদলে দেব?"),
        a: b(
          "No. Change over 7–10 days, a little more of the new ration each day, so the rumen can adjust. Sudden changes cause bloat, acidosis and a drop in milk.",
          "না। ৭–১০ দিন ধরে, প্রতিদিন নতুন রেশন একটু একটু বাড়িয়ে বদলান, যাতে রুমেন মানিয়ে নিতে পারে। হঠাৎ বদলালে পেট ফাঁপা, অম্লতা আর দুধ কমে যেতে পারে।",
        ),
      },
      {
        q: b("Is this enough for minerals and vitamins?", "খনিজ আর ভিটামিনের জন্য কি এটাই যথেষ্ট?"),
        a: b(
          "No. The tool balances energy and protein. Give salt and a mineral mix every day too (it shows how much), and clean water at all times.",
          "না। টুলটা শক্তি আর আমিষের হিসাব মেলায়। প্রতিদিন লবণ আর খনিজ মিশ্রণও দিন (কতটা, তা দেখায়), আর সবসময় পরিষ্কার পানি দিন।",
        ),
      },
    ],
  },

  "feed-ration": {
    blog: "safe-cattle-fattening-90-day-plan",
    how: [
      b(
        "This is the quick daily plan many farmers use: a set amount of concentrate (dana) for the animal's body, plus extra for the milk it gives or the weight you want it to gain, with green grass and straw filling the rest of what it eats. It also shows water, salt and minerals, and a home-made concentrate mix you can make in bulk.",
        "এটা অনেক খামারির ব্যবহার করা দ্রুত দৈনিক পরিকল্পনা: পশুর শরীরের জন্য নির্দিষ্ট পরিমাণ দানাদার, তার সাথে দুধ বা কাঙ্ক্ষিত ওজন বৃদ্ধির জন্য বাড়তি, আর বাকি খাবার কাঁচা ঘাস আর খড় দিয়ে পূরণ। পানি, লবণ, খনিজ আর একসাথে বানিয়ে রাখার মতো ঘরে তৈরি দানাদার মিশ্রণও দেখায়।",
      ),
      b(
        "It is a rule of thumb, not an exact ration: use it as a starting point and adjust to the animal's milk, appetite and body condition. When you know your feed prices, the least-cost ration tool can find a cheaper balanced mix.",
        "এটা মোটামুটি নিয়ম, নিখুঁত রেশন নয়: শুরু করার জন্য ব্যবহার করুন, তারপর পশুর দুধ, খিদে আর শরীরের অবস্থা দেখে ঠিক করুন। খাবারের দাম জানা থাকলে কম খরচের রেশন টুল আরও সস্তা সুষম মিশ্রণ খুঁজে দিতে পারে।",
      ),
    ],
    formula: [
      b("Milking cow: concentrate = upkeep (1 kg up to 200 kg body weight, 1.5 kg up to 350 kg, 2 kg above) + 1 kg per 2.5 litres of milk (per 2 litres when fat is 4.5 % or more).", "দুধের গাভী: দানাদার = শরীরের জন্য (২০০ কেজি পর্যন্ত ১ কেজি, ৩৫০ কেজি পর্যন্ত ১.৫ কেজি, তার বেশি ২ কেজি) + প্রতি ২.৫ লিটার দুধে ১ কেজি (ফ্যাট ৪.৫ % বা বেশি হলে প্রতি ২ লিটারে)।"),
      b("Dry matter about 3 % of body weight, green grass about 8 %; straw fills the rest. Water: 10 % of body weight plus 4 litres per litre of milk.", "শুকনো খাবার শরীরের ওজনের প্রায় ৩ %, কাঁচা ঘাস প্রায় ৮ %; বাকিটা খড়। পানি: শরীরের ওজনের ১০ % আর প্রতি লিটার দুধে ৪ লিটার।"),
      b("Fattening: concentrate = 1 % of body weight + 1.5 kg per kg of daily gain wanted.", "মোটাতাজাকরণ: দানাদার = শরীরের ওজনের ১ % + কাঙ্ক্ষিত দৈনিক প্রতি কেজি বৃদ্ধিতে ১.৫ কেজি।"),
    ],
    example: (p, locale, n) => {
      const r = dairyRation(350, 8, 4, p.ration);
      if (!r) return null;
      const kg = L(locale, "kg", "কেজি");
      return {
        setup: L(locale, "A 350 kg cow giving 8 litres of milk at 4 % fat.", "৩৫০ কেজির একটা গাভী, ৪ % ফ্যাটে দিনে ৮ লিটার দুধ দেয়।"),
        steps: [
          L(locale, `Upkeep for 350 kg: ${n(p.ration.upkeepMid, 1)} kg; milk: 8 ÷ ${n(p.ration.litresPerKg, 1)} = ${n(8 / p.ration.litresPerKg, 1)} kg.`, `৩৫০ কেজির শরীরের জন্য: ${n(p.ration.upkeepMid, 1)} কেজি; দুধের জন্য: ৮ ÷ ${n(p.ration.litresPerKg, 1)} = ${n(8 / p.ration.litresPerKg, 1)} কেজি।`),
          L(locale, `Green grass ${n(r.greenGrassKg, 1)} kg and straw ${n(r.strawKg, 1)} kg make up the rest of about ${n(r.dryMatterKg, 1)} kg dry matter.`, `কাঁচা ঘাস ${n(r.greenGrassKg, 1)} কেজি আর খড় ${n(r.strawKg, 1)} কেজি দিয়ে প্রায় ${n(r.dryMatterKg, 1)} কেজি শুকনো খাবারের বাকিটা পূরণ হয়।`),
        ],
        result: L(locale, `About ${n(r.concentrateKg, 1)} ${kg} concentrate a day, ${n(r.waterL)} litres of water, ${n(r.saltG)} g salt and ${n(r.mineralG)} g mineral mix.`, `দিনে প্রায় ${n(r.concentrateKg, 1)} ${kg} দানাদার, ${n(r.waterL)} লিটার পানি, ${n(r.saltG)} গ্রাম লবণ আর ${n(r.mineralG)} গ্রাম খনিজ মিশ্রণ।`),
      };
    },
    faq: [
      {
        q: b("Should I split the concentrate?", "দানাদার কি ভাগ করে দেব?"),
        a: b("Yes. Give it in two or three meals, around milking, never all at once, to avoid upsetting the rumen.", "হ্যাঁ। দুই বা তিন বেলায়, দোহানোর সময়ের আশেপাশে দিন, কখনো একবারে সব নয়, যাতে রুমেনের সমস্যা না হয়।"),
      },
      {
        q: b("What if I have no green grass?", "কাঁচা ঘাস না থাকলে কী করব?"),
        a: b("Give more straw or silage instead and add a little more protein, such as oil cake; the least-cost ration tool can work it out with what you have.", "তার বদলে বেশি খড় বা সাইলেজ দিন আর একটু বেশি আমিষ, যেমন খৈল, যোগ করুন; কম খরচের রেশন টুল আপনার কাছে যা আছে তা দিয়ে হিসাব করে দিতে পারে।"),
      },
      {
        q: b("Can I change the numbers?", "সংখ্যাগুলো কি বদলানো যায়?"),
        a: b("The farm advisers who run FarmFlows can adjust the rules (for example litres per kg of concentrate) for local feeds; the page always uses the current numbers.", "FarmFlows পরিচালনাকারী পরামর্শকেরা স্থানীয় খাবারের জন্য নিয়মগুলো (যেমন প্রতি কেজি দানাদারে কত লিটার) বদলাতে পারেন; পাতাটা সবসময় বর্তমান সংখ্যাগুলোই ব্যবহার করে।"),
      },
      {
        q: b("How do I know the ration is working?", "রেশন কাজ করছে কিনা কীভাবে বুঝব?"),
        a: b("Watch milk yield, dung and body condition for two weeks. Steady milk, firm but not hard dung and a cow that neither loses nor piles on weight mean the ration fits; weigh her monthly with the tape tool to be sure.", "দুই সপ্তাহ দুধ, গোবর আর শরীরের অবস্থা খেয়াল করুন। দুধ স্থির থাকলে, গোবর নরম-শক্তের মাঝামাঝি হলে আর গাভী রোগাও না হলে বা অতিরিক্ত মোটাও না হলে রেশন ঠিক আছে; নিশ্চিত হতে ফিতার টুল দিয়ে প্রতি মাসে ওজন নিন।"),
      },
    ],
  },

  "poultry-feed": {
    blog: "raising-layer-pullets-brooding-to-first-egg",
    how: [
      b(
        "Birds eat more each week as they grow. This tool looks up the usual feed per bird per day for the bird's age (layer, broiler or Sonali), multiplies it by the number of birds, and tells you the feed for today, the bags for a month and the water to keep in the drinkers.",
        "মুরগি বড় হওয়ার সাথে প্রতি সপ্তাহে বেশি খায়। এই টুল মুরগির বয়স অনুযায়ী (লেয়ার, ব্রয়লার বা সোনালি) প্রতি মুরগির দৈনিক সাধারণ খাবার দেখে, মুরগির সংখ্যা দিয়ে গুণ করে, আর আজকের খাবার, মাসের বস্তা আর পানির পাত্রে কতটা পানি রাখবেন তা বলে দেয়।",
      ),
      b(
        "If you type the price of a bag, it also shows the feed cost per day and per month. The tables are typical figures; check against your feed company's chart, and compare with what your birds really eat to spot waste or illness early. Recording the feed used each day in FarmFlows also gives you the feed per dozen eggs, the clearest sign of how well a flock converts feed.",
        "এক বস্তার দাম লিখলে দৈনিক ও মাসিক খাবারের খরচও দেখায়। তালিকাগুলো সাধারণ হিসাব; আপনার ফিড কোম্পানির চার্টের সাথে মিলিয়ে নিন, আর মুরগি আসলে কতটা খাচ্ছে তার সাথে তুলনা করে অপচয় বা রোগ আগেভাগে ধরুন। FarmFlows-এ প্রতিদিনের খাবার লিখে রাখলে প্রতি ডজন ডিমে কত খাবার লাগছে তাও দেখা যায়, যা মুরগি খাবারকে কতটা ভালোভাবে ডিমে বদলাচ্ছে তার সবচেয়ে পরিষ্কার মাপ।",
      ),
    ],
    formula: [
      b("Feed per day (kg) = grams per bird for its week of age × number of birds ÷ 1,000", "দৈনিক খাবার (কেজি) = বয়সের সপ্তাহ অনুযায়ী প্রতি মুরগির গ্রাম × মুরগির সংখ্যা ÷ ১,০০০"),
      b("Water ≈ 2 litres per kg of feed (2.5 in hot weather). Bags a month = feed per day × 30 ÷ bag weight.", "পানি ≈ প্রতি কেজি খাবারে ২ লিটার (গরমে ২.৫)। মাসে বস্তা = দৈনিক খাবার × ৩০ ÷ বস্তার ওজন।"),
    ],
    example: (p, locale, n) => {
      const r = poultryFeed("layer", 1000, 140, { bagPrice: 2900 }, p.poultry);
      if (!r) return null;
      return {
        setup: L(locale, "1,000 layer birds, 140 days old (week 21), feed at ৳2,900 a 50 kg bag.", "১,০০০টা লেয়ার মুরগি, বয়স ১৪০ দিন (২১তম সপ্তাহ), খাবার ৫০ কেজির বস্তা ৳২,৯০০।"),
        steps: [
          L(locale, `At this age a layer eats about ${n(r.gPerBird)} g a day: ${n(r.gPerBird)} × 1,000 ÷ 1,000 = ${n(r.kgPerDay, 1)} kg.`, `এই বয়সে একটা লেয়ার দিনে প্রায় ${n(r.gPerBird)} গ্রাম খায়: ${n(r.gPerBird)} × ১,০০০ ÷ ১,০০০ = ${n(r.kgPerDay, 1)} কেজি।`),
          L(locale, `A month: ${n(r.kgPerDay, 1)} × 30 ÷ 50 = ${n(r.bagsPerMonth, 1)} bags.`, `এক মাসে: ${n(r.kgPerDay, 1)} × ৩০ ÷ ৫০ = ${n(r.bagsPerMonth, 1)} বস্তা।`),
        ],
        result: L(locale, `${n(r.kgPerDay, 1)} kg feed and about ${n(r.waterLPerDay, 1)} litres of water a day; feed costs about ৳${n(r.costPerDay ?? 0)} a day, ৳${n(r.costPerMonth ?? 0)} a month.`, `দিনে ${n(r.kgPerDay, 1)} কেজি খাবার আর প্রায় ${n(r.waterLPerDay, 1)} লিটার পানি; খাবারের খরচ দিনে প্রায় ৳${n(r.costPerDay ?? 0)}, মাসে ৳${n(r.costPerMonth ?? 0)}।`),
      };
    },
    faq: [
      {
        q: b("My birds eat less than the table. Is that a problem?", "আমার মুরগি তালিকার চেয়ে কম খায়। এটা কি সমস্যা?"),
        a: b("A sudden drop in feed or water is often the first sign of disease or heat stress. Check the birds, the drinkers and the shed temperature, and call your vet if it continues.", "খাবার বা পানি হঠাৎ কমে যাওয়া প্রায়ই রোগ বা গরমের চাপের প্রথম লক্ষণ। মুরগি, পানির পাত্র আর শেডের তাপমাত্রা দেখুন, আর চলতে থাকলে ডাক্তার ডাকুন।"),
      },
      {
        q: b("Why does water go up in hot weather?", "গরমে পানি কেন বেশি লাগে?"),
        a: b("Birds cool themselves by panting and drinking. Keep cool, clean water always available; in summer they may drink 2.5 times their feed or more.", "মুরগি হাঁপিয়ে আর পানি খেয়ে শরীর ঠান্ডা রাখে। সবসময় ঠান্ডা, পরিষ্কার পানি রাখুন; গরমে তারা খাবারের আড়াই গুণ বা তার বেশি পানি খেতে পারে।"),
      },
      {
        q: b("Does it work for broilers and Sonali?", "ব্রয়লার আর সোনালির জন্য কি চলে?"),
        a: b("Yes. Choose the bird type; each has its own weekly table. Broilers eat much more per day, so the cost per kg of meat matters most there.", "হ্যাঁ। মুরগির ধরন বাছুন; প্রত্যেকটার নিজস্ব সাপ্তাহিক তালিকা আছে। ব্রয়লার দিনে অনেক বেশি খায়, তাই সেখানে প্রতি কেজি মাংসের খরচটাই সবচেয়ে জরুরি।"),
      },
      {
        q: b("How do I store feed so it doesn't spoil?", "খাবার কীভাবে রাখব যাতে নষ্ট না হয়?"),
        a: b("Keep bags off the floor on pallets, away from walls, in a dry, cool, rat-proof room, and use the oldest bags first. Damp feed grows mould that can poison birds and cut egg production, so buy only what you use in two to three weeks.", "বস্তা মেঝে থেকে উঁচু মাচায়, দেয়াল থেকে দূরে, শুকনো, ঠান্ডা আর ইঁদুরমুক্ত ঘরে রাখুন, আর পুরোনো বস্তা আগে ব্যবহার করুন। ভেজা খাবারে ছত্রাক জন্মায়, যা মুরগির জন্য বিষাক্ত আর ডিম কমিয়ে দেয়, তাই দুই-তিন সপ্তাহে যতটা লাগে ততটাই কিনুন।"),
      },
    ],
  },

  "calving-date": {
    blog: "cow-heat-signs-and-best-time-for-ai",
    how: [
      b(
        "From the day a cow, buffalo, goat or sheep was inseminated or mated, this tool counts forward to the dates that matter: when to watch for her next heat in case she did not hold, when to have the pregnancy checked, when to dry her off and when she is due.",
        "গাভী, মহিষ, ছাগল বা ভেড়াকে যেদিন কৃত্রিম প্রজনন বা পাল দেওয়া হয়েছে, সেদিন থেকে এই টুল জরুরি তারিখগুলো গুনে দেয়: গর্ভ না দাঁড়ালে পরের গরম কবে দেখবেন, কবে গর্ভ পরীক্ষা করাবেন, কবে দুধ বন্ধ করবেন আর কবে বাচ্চা দেবে।",
      ),
      b(
        "Pregnancy length varies a few days by breed and by animal, so treat the due date as the middle of a window and start watching closely about a week before. Keeping these dates in FarmFlows gives you reminders automatically.",
        "জাত আর পশু ভেদে গর্ভকাল কয়েক দিন কমবেশি হয়, তাই প্রসবের তারিখটাকে একটা সময়সীমার মাঝখান ধরুন আর প্রায় এক সপ্তাহ আগে থেকে ভালো করে নজর রাখুন। এই তারিখগুলো FarmFlows-এ রাখলে নিজে থেকেই রিমাইন্ডার পাবেন।",
      ),
    ],
    formula: [
      b("Due date = breeding date + pregnancy length (cow 283 days, buffalo 310, goat 150, sheep 147).", "প্রসবের তারিখ = প্রজননের তারিখ + গর্ভকাল (গাভী ২৮৩ দিন, মহিষ ৩১০, ছাগল ১৫০, ভেড়া ১৪৭)।"),
      b("Next heat if not pregnant = breeding date + heat cycle (21 days for cattle). Dry off = due date − 60 days for cows.", "গর্ভ না দাঁড়ালে পরের গরম = প্রজননের তারিখ + গরমের চক্র (গরুর ২১ দিন)। দুধ বন্ধ = প্রসবের তারিখ − গাভীর ক্ষেত্রে ৬০ দিন।"),
    ],
    example: (p, locale, n, date) => {
      const r = pregnancyDates("cattle", "2026-01-10", "2026-01-10", undefined, p);
      if (!r) return null;
      return {
        setup: L(locale, `A cow was inseminated on ${date("2026-01-10")}.`, `একটা গাভীকে ${date("2026-01-10")} তারিখে কৃত্রিম প্রজনন করানো হয়েছে।`),
        steps: [
          L(locale, `Watch for heat again around ${date(r.nextHeat)} (day ${p.pregCattle.cycle}). Pregnancy check from ${date(r.check)} (day ${p.pregCattle.check}).`, `${date(r.nextHeat)}-এর আশেপাশে (${n(p.pregCattle.cycle)}তম দিন) আবার গরম দেখুন। ${date(r.check)} (${n(p.pregCattle.check)}তম দিন) থেকে গর্ভ পরীক্ষা।`),
          L(locale, `${date("2026-01-10")} + ${r.gestation} days = ${date(r.due)}. Dry off on ${date(r.dryOff)}.`, `${date("2026-01-10")} + ${n(r.gestation)} দিন = ${date(r.due)}। দুধ বন্ধ ${date(r.dryOff)}।`),
        ],
        result: L(locale, `She is due about ${date(r.due)}.`, `প্রায় ${date(r.due)} তারিখে বাচ্চা দেবে।`),
      };
    },
    faq: [
      {
        q: b("When is the best time to inseminate?", "কৃত্রিম প্রজনন করানোর সবচেয়ে ভালো সময় কখন?"),
        a: b("Usually about 12 hours after the first signs of standing heat: heat seen in the morning, inseminate in the evening; seen in the evening, inseminate the next morning.", "সাধারণত দাঁড়িয়ে গরমের প্রথম লক্ষণ দেখার প্রায় ১২ ঘণ্টা পরে: সকালে গরম দেখলে বিকেলে, বিকেলে দেখলে পরদিন সকালে।"),
      },
      {
        q: b("Why dry off 60 days before calving?", "বাচ্চা দেওয়ার ৬০ দিন আগে কেন দুধ বন্ধ করব?"),
        a: b("The rest lets the udder recover and the cow build up for the next lactation; cows that are not dried off usually give less milk afterwards.", "এই বিশ্রামে ওলান সেরে ওঠে আর গাভী পরের দুধের সময়ের জন্য তৈরি হয়; দুধ বন্ধ না করলে সাধারণত পরে কম দুধ দেয়।"),
      },
      {
        q: b("Can I trust the date without a pregnancy check?", "গর্ভ পরীক্ষা ছাড়া কি তারিখটা ধরে নেওয়া যায়?"),
        a: b("No. Have a vet or AI technician confirm the pregnancy; only then plan around the due date.", "না। ডাক্তার বা কৃত্রিম প্রজনন কর্মী দিয়ে গর্ভ নিশ্চিত করুন; তারপরই প্রসবের তারিখ ধরে পরিকল্পনা করুন।"),
      },
      {
        q: b("What should I prepare before the due date?", "প্রসবের তারিখের আগে কী প্রস্তুতি নেব?"),
        a: b("About two weeks before, move the cow to a clean, dry, quiet pen with soft bedding, keep the vet's number at hand, and have clean cloths and iodine for the calf's navel. Make sure the calf can drink colostrum within the first two hours.", "প্রায় দুই সপ্তাহ আগে গাভীকে নরম বিছানাসহ পরিষ্কার, শুকনো, নিরিবিলি ঘরে নিন, ডাক্তারের নম্বর হাতের কাছে রাখুন, আর বাছুরের নাভির জন্য পরিষ্কার কাপড় ও আয়োডিন রাখুন। প্রথম দুই ঘণ্টার মধ্যে বাছুর যেন শাল দুধ খায় তা নিশ্চিত করুন।"),
      },
    ],
  },

  "qurbani-price": {
    blog: "safe-cattle-fattening-90-day-plan",
    how: [
      b(
        "Before Eid, buyers and sellers argue about price per kg of meat. This tool turns live weight into the meat-and-bone you can expect, and if you enter the asking price, shows the price per live kg and per kg of meat, so you can compare animals of different sizes fairly.",
        "ঈদের আগে ক্রেতা-বিক্রেতা প্রতি কেজি মাংসের দাম নিয়ে দর কষাকষি করেন। এই টুল জীবন্ত ওজনকে সম্ভাব্য মাংস-হাড়ে বদলে দেয়, আর চাওয়া দাম লিখলে প্রতি কেজি জীবন্ত ওজন ও প্রতি কেজি মাংসের দাম দেখায়, যাতে বিভিন্ন আকারের পশু ন্যায্যভাবে তুলনা করা যায়।",
      ),
      b(
        "If you raised the animal, enter what it cost you as well and the tool shows the profit. Get the live weight from a scale if you can, or from the tape weight tool.",
        "পশুটা নিজে পালন করে থাকলে আপনার খরচও লিখুন, টুল লাভ দেখাবে। সম্ভব হলে পাল্লা থেকে জীবন্ত ওজন নিন, না হলে ফিতা দিয়ে ওজনের টুল থেকে।",
      ),
    ],
    formula: [
      b("Meat and bone (kg) = live weight × 50–55 % for cattle, × 45–50 % for goats and sheep.", "মাংস ও হাড় (কেজি) = জীবন্ত ওজন × গরুর ক্ষেত্রে ৫০–৫৫ %, ছাগল ও ভেড়ার ক্ষেত্রে ৪৫–৫০ %।"),
      b("Price per kg of meat = asking price ÷ the middle of that range. Profit = price − your cost.", "প্রতি কেজি মাংসের দাম = চাওয়া দাম ÷ ওই সীমার মাঝামাঝি। লাভ = দাম − আপনার খরচ।"),
    ],
    example: (p, locale, n) => {
      const r = meatValue("cattle", 300, 120000, 90000, p.meat);
      if (!r) return null;
      return {
        setup: L(locale, "A 300 kg bull, asking price ৳1,20,000; raising it cost ৳90,000.", "৩০০ কেজির একটা ষাঁড়, চাওয়া দাম ৳১,২০,০০০; পালনে খরচ হয়েছে ৳৯০,০০০।"),
        steps: [
          L(locale, `Meat and bone: 300 × ${p.meat.cattleLow}–${p.meat.cattleHigh} % = ${n(r.carcassLow, 1)}–${n(r.carcassHigh, 1)} kg.`, `মাংস ও হাড়: ৩০০ × ${n(p.meat.cattleLow)}–${n(p.meat.cattleHigh)} % = ${n(r.carcassLow, 1)}–${n(r.carcassHigh, 1)} কেজি।`),
          L(locale, `Per live kg: ${n(120000)} ÷ 300 = ৳${n(r.pricePerLiveKg ?? 0)}. Per kg of meat: about ৳${n(r.pricePerMeatKg ?? 0)}.`, `প্রতি কেজি জীবন্ত ওজন: ${n(120000)} ÷ ৩০০ = ৳${n(r.pricePerLiveKg ?? 0)}। প্রতি কেজি মাংস: প্রায় ৳${n(r.pricePerMeatKg ?? 0)}।`),
        ],
        result: L(locale, `About ৳${n(r.pricePerMeatKg ?? 0)} per kg of meat; profit ৳${n(r.profit ?? 0)}.`, `প্রতি কেজি মাংসে প্রায় ৳${n(r.pricePerMeatKg ?? 0)}; লাভ ৳${n(r.profit ?? 0)}।`),
      };
    },
    faq: [
      {
        q: b("Why is the meat share a range?", "মাংসের ভাগ কেন একটা সীমা?"),
        a: b("Well-fattened animals with a small belly give more meat for their weight; animals weighed with a full belly or a lot of bone give less.", "ভালোভাবে মোটাতাজা, ছোট পেটের পশু ওজনের তুলনায় বেশি মাংস দেয়; ভরা পেটে মাপা বা বেশি হাড়ের পশু কম দেয়।"),
      },
      {
        q: b("Should I weigh before or after feeding?", "খাওয়ানোর আগে মাপব না পরে?"),
        a: b("Before. A full belly and water can add 10–20 kg to a big animal; compare animals weighed the same way.", "আগে। ভরা পেট আর পানি বড় পশুর ওজনে ১০–২০ কেজি বাড়াতে পারে; একইভাবে মাপা পশুদের মধ্যে তুলনা করুন।"),
      },
      {
        q: b("Does this include the skin and head?", "এতে কি চামড়া আর মাথা ধরা আছে?"),
        a: b("No. It estimates the dressed carcass (meat and bone). Skin, head, feet and offal are extra.", "না। এটা ছাড়ানো দেহের (মাংস ও হাড়) অনুমান। চামড়া, মাথা, পা আর ভুঁড়ি-কলিজা আলাদা।"),
      },
      {
        q: b("When should I sell for the best price?", "সবচেয়ে ভালো দামের জন্য কখন বিক্রি করব?"),
        a: b("Prices usually rise in the last two to three weeks before Eid-ul-Adha, but so do transport costs and the risk of stress and illness on the way to the market. Compare the price per kg of meat at your farm with the market price after costs, and do not keep feeding an animal that has stopped gaining.", "সাধারণত ঈদুল আজহার আগের শেষ দুই-তিন সপ্তাহে দাম বাড়ে, তবে পরিবহন খরচ আর হাটে যাওয়ার পথে পশুর চাপ ও অসুখের ঝুঁকিও বাড়ে। খামারে প্রতি কেজি মাংসের দাম আর খরচ বাদে হাটের দাম তুলনা করুন, আর যে পশুর ওজন বাড়া থেমে গেছে তাকে শুধু শুধু খাওয়াতে থাকবেন না।"),
      },
      {
        q: b("How much does a well-fattened bull gain a day?", "ভালোভাবে মোটাতাজা ষাঁড় দিনে কতটা বাড়ে?"),
        a: b("On a balanced ration, local and crossbred bulls often gain 0.5–1 kg a day. Weigh every two weeks; if gain drops, check the ration, deworming and water before buying more feed.", "সুষম রেশনে দেশি ও শংকর ষাঁড় প্রায়ই দিনে ০.৫–১ কেজি বাড়ে। প্রতি দুই সপ্তাহে ওজন নিন; বৃদ্ধি কমে গেলে আরও খাবার কেনার আগে রেশন, কৃমিনাশক আর পানি দেখুন।"),
      },
    ],
  },

  "unit-converter": {
    blog: "napier-grass-cultivation-guide",
    how: [
      b(
        "Farm figures come in many units: maund and seer at the market, hali and tray for eggs, hand for height, and decimal, katha and bigha for land. This tool converts between them and the metric units used in FarmFlows and in most feed and medicine charts.",
        "খামারের হিসাব নানা এককে আসে: বাজারে মণ আর সের, ডিমে হালি আর ট্রে, উচ্চতায় হাত, আর জমিতে শতাংশ, কাঠা আর বিঘা। এই টুল এগুলোকে একে অপরে আর FarmFlows ও বেশিরভাগ খাদ্য ও ওষুধের চার্টে ব্যবহৃত মেট্রিক এককে বদলায়।",
      ),
      b(
        "Some local units differ from place to place, especially the bigha and katha. The tool uses the common Bangladeshi sizes; if your area uses a different size, convert with care.",
        "কিছু স্থানীয় একক জায়গাভেদে আলাদা, বিশেষ করে বিঘা আর কাঠা। টুল বাংলাদেশের প্রচলিত মাপ ব্যবহার করে; আপনার এলাকায় অন্য মাপ চললে সাবধানে বদলান।",
      ),
    ],
    formula: [
      b("Value in the new unit = value × size of the old unit ÷ size of the new unit.", "নতুন এককে মান = মান × পুরোনো এককের মাপ ÷ নতুন এককের মাপ।"),
      b("Sizes used: 1 maund = 40 kg, 1 seer ≈ 0.933 kg, 1 hali = 4, 1 tray = 30, 1 decimal ≈ 40.47 m², 1 katha ≈ 66.9 m², 1 bigha ≈ 1,338 m².", "ব্যবহৃত মাপ: ১ মণ = ৪০ কেজি, ১ সের ≈ ০.৯৩৩ কেজি, ১ হালি = ৪, ১ ট্রে = ৩০, ১ শতাংশ ≈ ৪০.৪৭ বর্গমিটার, ১ কাঠা ≈ ৬৬.৯ বর্গমিটার, ১ বিঘা ≈ ১,৩৩৮ বর্গমিটার।"),
    ],
    example: (p, locale, n) => {
      const dec = convertUnit("land", 2, "bigha", "decimal", p.units);
      const kg = convertUnit("weight", 3, "maund", "kg", p.units);
      if (dec === null || kg === null) return null;
      return {
        setup: L(locale, "You have 2 bigha for Napier grass and bought 3 maund of wheat bran.", "নেপিয়ার ঘাসের জন্য আপনার ২ বিঘা জমি আছে, আর ৩ মণ গমের ভুসি কিনেছেন।"),
        steps: [
          L(locale, `2 × ${n(p.units.bigha, 1)} m² ÷ ${n(p.units.decimal, 2)} m² = ${n(dec, 1)} decimals.`, `২ × ${n(p.units.bigha, 1)} বর্গমিটার ÷ ${n(p.units.decimal, 2)} বর্গমিটার = ${n(dec, 1)} শতাংশ।`),
          L(locale, `3 × ${n(p.units.maund)} kg = ${n(kg)} kg.`, `৩ × ${n(p.units.maund)} কেজি = ${n(kg)} কেজি।`),
        ],
        result: L(locale, `2 bigha is about ${n(dec, 1)} decimals; 3 maund is ${n(kg)} kg.`, `২ বিঘা প্রায় ${n(dec, 1)} শতাংশ; ৩ মণ = ${n(kg)} কেজি।`),
      };
    },
    faq: [
      {
        q: b("Why is my bigha different?", "আমার এলাকার বিঘা কেন আলাদা?"),
        a: b("The bigha has had different sizes in different districts. The tool uses 33 decimals (about 1,338 m²), the most common size today; check your land papers for yours.", "বিভিন্ন জেলায় বিঘার মাপ ভিন্ন ছিল। টুল ৩৩ শতাংশ (প্রায় ১,৩৩৮ বর্গমিটার) ধরে, যা এখন সবচেয়ে প্রচলিত; আপনারটা জমির কাগজে দেখে নিন।"),
      },
      {
        q: b("Is a maund always 40 kg?", "মণ কি সবসময় ৪০ কেজি?"),
        a: b("In markets today, yes, almost always. The old maund was about 37.3 kg (40 seers of 0.933 kg); ask the trader which one they mean.", "এখনকার বাজারে প্রায় সবসময় হ্যাঁ। পুরোনো মণ ছিল প্রায় ৩৭.৩ কেজি (০.৯৩৩ কেজির ৪০ সের); ব্যাপারী কোনটা বোঝাচ্ছেন জিজ্ঞেস করে নিন।"),
      },
      {
        q: b("Can it convert eggs?", "ডিমের হিসাব কি বদলানো যায়?"),
        a: b("Yes: pieces, hali (4), dozen (12) and tray (30), so you can compare prices quoted per hali and per tray.", "হ্যাঁ: পিস, হালি (৪), ডজন (১২) আর ট্রে (৩০), যাতে হালি আর ট্রে হিসেবে বলা দাম তুলনা করতে পারেন।"),
      },
      {
        q: b("Why convert everything to kg and decimals?", "সব কিছু কেজি আর শতাংশে বদলাব কেন?"),
        a: b("Feed charts, medicine labels and FarmFlows reports use kg, litres and metric land units. Converting once means costs, yields and doses can be compared across markets and seasons, and the numbers in your records always mean the same thing.", "খাদ্য চার্ট, ওষুধের লেবেল আর FarmFlows-এর রিপোর্ট কেজি, লিটার আর মেট্রিক জমির একক ব্যবহার করে। একবার বদলে নিলে বিভিন্ন বাজার আর মৌসুমের খরচ, ফলন আর মাত্রা তুলনা করা যায়, আর আপনার রেকর্ডের সংখ্যাগুলো সবসময় একই অর্থ বোঝায়।"),
      },
      {
        q: b("How tall is a cow in hands?", "হাতে গরু কত উঁচু?"),
        a: b("A hand here is taken as about 45.7 cm (18 inches), the local cubit used by traders, not the 4-inch horse hand. A cow 3 hands high at the shoulder is about 137 cm.", "এখানে এক হাত ধরা হয়েছে প্রায় ৪৫.৭ সেমি (১৮ ইঞ্চি), ব্যাপারীদের ব্যবহার করা স্থানীয় হাত, ঘোড়ার ৪ ইঞ্চির হ্যান্ড নয়। কাঁধে ৩ হাত উঁচু গরু প্রায় ১৩৭ সেমি।"),
      },
    ],
  },

  "medicine-dose": {
    blog: "cattle-vaccination-schedule-bangladesh",
    how: [
      b(
        "Most medicines and dewormers for animals are dosed by body weight. The label says how many milligrams to give per kg; this tool multiplies by the animal's weight and, from the strength on the label, tells you how many millilitres of liquid or how many tablets that is.",
        "পশুর বেশিরভাগ ওষুধ আর কৃমিনাশকের মাত্রা শরীরের ওজন অনুযায়ী দেওয়া হয়। লেবেলে লেখা থাকে প্রতি কেজিতে কত মিলিগ্রাম; এই টুল তা পশুর ওজন দিয়ে গুণ করে, আর লেবেলের শক্তি থেকে বলে দেয় তা কত মিলিলিটার তরল বা কয়টা ট্যাবলেট।",
      ),
      b(
        "Use it only to check your arithmetic. Always follow the label and your vet's instructions, and use a weight from a scale or the tape tool. Never guess the weight: an underdose does not work and builds resistance; an overdose can harm.",
        "শুধু নিজের হিসাব মিলিয়ে নিতে এটা ব্যবহার করুন। সবসময় লেবেল আর ডাক্তারের নির্দেশ মানুন, আর পাল্লা বা ফিতার টুল থেকে পাওয়া ওজন ব্যবহার করুন। ওজন কখনো আন্দাজে ধরবেন না: কম মাত্রা কাজ করে না আর ওষুধ-প্রতিরোধ তৈরি করে; বেশি মাত্রা ক্ষতি করতে পারে।",
      ),
    ],
    formula: [
      b("Dose (mg) = weight (kg) × mg per kg from the label", "মাত্রা (মিগ্রা) = ওজন (কেজি) × লেবেলে লেখা প্রতি কেজিতে মিগ্রা"),
      b("Millilitres = dose ÷ mg per ml. Tablets = dose ÷ mg per tablet, rounded to the nearest quarter.", "মিলিলিটার = মাত্রা ÷ প্রতি মিলিতে মিগ্রা। ট্যাবলেট = মাত্রা ÷ প্রতি ট্যাবলেটে মিগ্রা, নিকটতম চার ভাগের এক ভাগে।"),
    ],
    example: (p, locale, n) => {
      const r = doseFor(250, 7.5, { mgPerMl: 25 }, p.dose);
      if (!r || r.ml === null) return null;
      return {
        setup: L(locale, "A 250 kg heifer; a label that says 7.5 mg per kg, and the liquid has 25 mg in each ml (an example label, not advice for any medicine).", "২৫০ কেজির একটা বকনা; লেবেলে লেখা প্রতি কেজিতে ৭.৫ মিগ্রা, আর তরলের প্রতি মিলিতে ২৫ মিগ্রা (উদাহরণের লেবেল, কোনো ওষুধের পরামর্শ নয়)।"),
        steps: [
          L(locale, `250 × 7.5 = ${n(r.mg, 1)} mg.`, `২৫০ × ৭.৫ = ${n(r.mg, 1)} মিগ্রা।`),
          L(locale, `${n(r.mg, 1)} ÷ 25 = ${n(r.ml, 1)} ml.`, `${n(r.mg, 1)} ÷ ২৫ = ${n(r.ml, 1)} মিলি।`),
        ],
        result: L(locale, `${n(r.ml, 1)} ml for this example label. Check it against the real label and your vet.`, `এই উদাহরণের লেবেলে ${n(r.ml, 1)} মিলি। আসল লেবেল আর ডাক্তারের সাথে মিলিয়ে নিন।`),
      };
    },
    faq: [
      {
        q: b("What if the label gives the dose per 10 kg or per 50 kg?", "লেবেলে যদি প্রতি ১০ কেজি বা ৫০ কেজিতে মাত্রা লেখা থাকে?"),
        a: b("Divide to get the dose per kg first. For example, 1 ml per 10 kg is 0.1 ml per kg; if you know the mg per ml, multiply to get mg per kg.", "আগে ভাগ করে প্রতি কেজির মাত্রা বের করুন। যেমন, প্রতি ১০ কেজিতে ১ মিলি মানে প্রতি কেজিতে ০.১ মিলি; প্রতি মিলিতে মিগ্রা জানা থাকলে গুণ করে প্রতি কেজিতে মিগ্রা পাবেন।"),
      },
      {
        q: b("Does this tool tell me which medicine to use?", "এই টুল কি বলে দেয় কোন ওষুধ দিতে হবে?"),
        a: b("No. It only does the arithmetic. Which medicine, when and for how long is for your vet to decide, as is the withdrawal time before milk or meat can be sold.", "না। এটা শুধু হিসাব করে। কোন ওষুধ, কখন আর কত দিন, তা ডাক্তার ঠিক করবেন, দুধ বা মাংস বিক্রির আগে কত দিন অপেক্ষা করতে হবে তাও।"),
      },
      {
        q: b("Can I split tablets?", "ট্যাবলেট কি ভাঙা যায়?"),
        a: b("Only scored tablets, and only if the label allows it. The tool rounds to quarters; if that is far from the exact dose, ask your vet.", "শুধু দাগ কাটা ট্যাবলেট, আর লেবেলে অনুমতি থাকলেই। টুল চার ভাগের এক ভাগে গোল করে; সঠিক মাত্রা থেকে তা অনেক দূরে হলে ডাক্তারকে জিজ্ঞেস করুন।"),
      },
      {
        q: b("Why must I wait before selling milk or meat?", "দুধ বা মাংস বিক্রির আগে কেন অপেক্ষা করতে হয়?"),
        a: b("Many medicines stay in the body for days. The label gives a withdrawal period for milk and for meat; selling earlier can harm consumers and is against the rules. FarmFlows reminds you of the withdrawal date when you record a treatment.", "অনেক ওষুধ কয়েক দিন শরীরে থেকে যায়। লেবেলে দুধ আর মাংসের জন্য অপেক্ষার সময় লেখা থাকে; তার আগে বিক্রি করলে ভোক্তার ক্ষতি হতে পারে আর তা নিয়মবিরুদ্ধ। চিকিৎসা রেকর্ড করলে FarmFlows অপেক্ষার শেষ তারিখ মনে করিয়ে দেয়।"),
      },
    ],
  },

  "fodder-land": {
    blog: "napier-grass-cultivation-guide",
    how: [
      b(
        "Green grass is the cheapest feed, but only if you grow enough of it. This tool works out how much green fodder your animals eat in a year, how much land you need at your yield, and how much silage you need to store for the lean months.",
        "কাঁচা ঘাস সবচেয়ে সস্তা খাবার, তবে শুধু যদি যথেষ্ট উৎপাদন করেন। এই টুল হিসাব করে আপনার পশুরা বছরে কত কাঁচা ঘাস খায়, আপনার ফলনে কত জমি লাগবে, আর অভাবের মাসগুলোর জন্য কত সাইলেজ জমিয়ে রাখতে হবে।",
      ),
      b(
        "Napier usually gives 60–80 tonnes an acre a year when it is cut regularly and given manure and water. Enter your own yield if you know it; the tool shows the land in decimals, the unit most Bangladeshi farmers use. Plan a little extra land, about one tenth more, for poor cuts, floods and new animals.",
        "নিয়মিত কাটলে আর সার ও পানি দিলে নেপিয়ার সাধারণত একরে বছরে ৬০–৮০ টন ফলন দেয়। নিজের ফলন জানা থাকলে সেটা লিখুন; টুল জমি শতাংশে দেখায়, যা বেশিরভাগ বাংলাদেশি খামারি ব্যবহার করেন। খারাপ ফলন, বন্যা আর নতুন পশুর কথা ভেবে প্রায় দশ ভাগের এক ভাগ বেশি জমির পরিকল্পনা রাখুন, যাতে সারা বছর ঘাসের টান না পড়ে।",
      ),
    ],
    formula: [
      b("Grass a year (tonnes) = animals × kg a day × 365 ÷ 1,000. Land (acres) = tonnes a year ÷ yield (tonnes an acre a year); 1 acre = 100 decimals.", "বছরে ঘাস (টন) = পশু × দিনে কেজি × ৩৬৫ ÷ ১,০০০। জমি (একর) = বছরে টন ÷ ফলন (একরে বছরে টন); ১ একর = ১০০ শতাংশ।"),
      b("Silage (kg) = animals × kg a day × days to cover; space ≈ kg ÷ 600 cubic metres.", "সাইলেজ (কেজি) = পশু × দিনে কেজি × যত দিনের জন্য; জায়গা ≈ কেজি ÷ ৬০০ ঘনমিটার।"),
    ],
    example: (p, locale, n) => {
      const r = fodderPlan(5, 25, 70, 60, p.fodder);
      if (!r) return null;
      return {
        setup: L(locale, "5 cows eating 25 kg of green grass a day each, Napier yield 70 tonnes an acre, and 60 days of silage for the dry season.", "৫টা গাভী, প্রতিটা দিনে ২৫ কেজি কাঁচা ঘাস খায়, নেপিয়ারের ফলন একরে ৭০ টন, আর শুকনো মৌসুমের জন্য ৬০ দিনের সাইলেজ।"),
        steps: [
          L(locale, `5 × 25 × 365 ÷ 1,000 = ${n(r.tonnesPerYear, 1)} tonnes a year.`, `৫ × ২৫ × ৩৬৫ ÷ ১,০০০ = বছরে ${n(r.tonnesPerYear, 1)} টন।`),
          L(locale, `${n(r.tonnesPerYear, 1)} ÷ 70 ≈ ${n(r.decimals / 100, 2)} acre ≈ ${n(r.decimals)} decimals.`, `${n(r.tonnesPerYear, 1)} ÷ ৭০ ≈ ${n(r.decimals / 100, 2)} একর ≈ ${n(r.decimals)} শতাংশ।`),
          L(locale, `Silage: 5 × 25 × 60 = ${n(r.silageKg)} kg, about ${n(r.silageM3, 1)} cubic metres.`, `সাইলেজ: ৫ × ২৫ × ৬০ = ${n(r.silageKg)} কেজি, প্রায় ${n(r.silageM3, 1)} ঘনমিটার।`),
        ],
        result: L(locale, `About ${n(r.decimals)} decimals of Napier, plus ${n(r.silageKg)} kg of silage stored.`, `প্রায় ${n(r.decimals)} শতাংশ নেপিয়ার, আর ${n(r.silageKg)} কেজি সাইলেজ জমা।`),
      };
    },
    faq: [
      {
        q: b("How much green grass does a cow eat?", "একটা গাভী কতটা কাঁচা ঘাস খায়?"),
        a: b("Roughly 8–10 % of her body weight a day if grass is her main roughage, so 25–35 kg for a 300–400 kg cow, plus straw.", "ঘাস প্রধান আঁশজাতীয় খাবার হলে দিনে মোটামুটি শরীরের ওজনের ৮–১০ %, অর্থাৎ ৩০০–৪০০ কেজির গাভীর জন্য ২৫–৩৫ কেজি, সাথে খড়।"),
      },
      {
        q: b("Why plan silage too?", "সাইলেজের পরিকল্পনাও কেন?"),
        a: b("Grass grows slowly in winter and in floods. Silage made when grass is plenty keeps milk steady through those months.", "শীতে আর বন্যায় ঘাস ধীরে বাড়ে। ঘাস যখন বেশি তখন বানানো সাইলেজ ওই মাসগুলোতে দুধ ঠিক রাখে।"),
      },
      {
        q: b("My yield is lower than 70 tonnes. What should I enter?", "আমার ফলন ৭০ টনের কম। কী লিখব?"),
        a: b("Enter your real figure: weigh one cut from a measured plot and multiply by the cuts a year. A lower yield simply needs more land.", "আসল সংখ্যাটা লিখুন: মাপা একটা প্লটের এক কাটার ঘাস ওজন করুন আর বছরে কত বার কাটেন তা দিয়ে গুণ করুন। ফলন কম হলে শুধু জমি বেশি লাগে।"),
      },
      {
        q: b("Which grass gives the most fodder?", "কোন ঘাসে সবচেয়ে বেশি ফলন?"),
        a: b("In Bangladesh, Napier and its hybrids give the highest yield of green fodder per decimal, cut every 35–45 days. Maize grown for silage gives energy-rich feed for the lean season. Mixing in a legume such as cowpea raises protein.", "বাংলাদেশে প্রতি শতাংশে সবচেয়ে বেশি কাঁচা ঘাস দেয় নেপিয়ার আর এর হাইব্রিড, প্রতি ৩৫–৪৫ দিনে কাটলে। সাইলেজের জন্য চাষ করা ভুট্টা অভাবের মৌসুমে শক্তিতে ভরা খাবার দেয়। কাউপির মতো ডালজাতীয় ঘাস মেশালে আমিষ বাড়ে।"),
      },
    ],
  },

  "milk-price": {
    blog: "how-to-calculate-milk-production-cost-per-litre",
    how: [
      b(
        "Many dairies and chilling centres pay by fat and SNF (solids-not-fat), not just by litres, so richer milk earns more. This tool uses the two rates to work out the price per kg and per litre for any test result, and the total for the milk you sold.",
        "অনেক ডেইরি আর চিলিং সেন্টার শুধু লিটার দেখে নয়, ফ্যাট আর এসএনএফ (ফ্যাট ছাড়া কঠিন অংশ) দেখে দাম দেয়, তাই ঘন দুধে বেশি দাম। এই টুল দুটো রেট দিয়ে যেকোনো পরীক্ষার ফলে প্রতি কেজি ও প্রতি লিটারের দাম আর বিক্রি করা দুধের মোট দাম বের করে।",
      ),
      b(
        "Use it to check a collector's slip, or to see how much a better ration that raises fat would be worth. Enter the rates your buyer uses; the starting values are only examples.",
        "সংগ্রাহকের রশিদ মিলিয়ে দেখতে, বা ফ্যাট বাড়ায় এমন ভালো রেশনে কত লাভ হবে দেখতে এটা ব্যবহার করুন। আপনার ক্রেতা যে রেট দেন সেটা লিখুন; শুরুর মানগুলো শুধু উদাহরণ।",
      ),
    ],
    formula: [
      b("Price per kg = fat % ÷ 100 × fat rate + SNF % ÷ 100 × SNF rate", "প্রতি কেজির দাম = ফ্যাট % ÷ ১০০ × ফ্যাটের রেট + এসএনএফ % ÷ ১০০ × এসএনএফের রেট"),
      b("Price per litre = price per kg × 1.03 (a litre of milk weighs about 1.03 kg).", "প্রতি লিটারের দাম = প্রতি কেজির দাম × ১.০৩ (এক লিটার দুধের ওজন প্রায় ১.০৩ কেজি)।"),
    ],
    example: (p, locale, n) => {
      const r = milkPrice(4, 8.5, 600, 400, 20, p.milk);
      if (!r) return null;
      return {
        setup: L(locale, "Milk tests 4 % fat and 8.5 % SNF; the buyer pays ৳600 per kg of fat and ৳400 per kg of SNF; you sold 20 litres.", "দুধের পরীক্ষায় ফ্যাট ৪ % আর এসএনএফ ৮.৫ %; ক্রেতা প্রতি কেজি ফ্যাটে ৳৬০০ আর প্রতি কেজি এসএনএফে ৳৪০০ দেন; আপনি ২০ লিটার বিক্রি করেছেন।"),
        steps: [
          L(locale, `0.04 × 600 + 0.085 × 400 = 24 + 34 = ৳${n(r.perKg, 2)} per kg.`, `০.০৪ × ৬০০ + ০.০৮৫ × ৪০০ = ২৪ + ৩৪ = প্রতি কেজি ৳${n(r.perKg, 2)}।`),
          L(locale, `${n(r.perKg, 2)} × ${n(p.milk.kgPerLitre, 2)} = ৳${n(r.perLitre, 2)} per litre.`, `${n(r.perKg, 2)} × ${n(p.milk.kgPerLitre, 2)} = প্রতি লিটার ৳${n(r.perLitre, 2)}।`),
        ],
        result: L(locale, `৳${n(r.perLitre, 2)} a litre; ৳${n(r.total ?? 0)} for the 20 litres.`, `প্রতি লিটার ৳${n(r.perLitre, 2)}; ২০ লিটারে ৳${n(r.total ?? 0)}।`),
      };
    },
    faq: [
      {
        q: b("What is SNF?", "এসএনএফ কী?"),
        a: b("Solids-not-fat: the protein, milk sugar and minerals in milk. Normal cow's milk has about 8–9 % SNF; added water lowers it.", "ফ্যাট ছাড়া কঠিন অংশ: দুধের আমিষ, দুধের চিনি আর খনিজ। সাধারণ গরুর দুধে প্রায় ৮–৯ % এসএনএফ থাকে; পানি মেশালে কমে যায়।"),
      },
      {
        q: b("How can I raise fat?", "ফ্যাট কীভাবে বাড়াব?"),
        a: b("Enough roughage (straw, grass, silage) in the ration, steady feeding times and full milking all raise fat; breed matters too.", "রেশনে যথেষ্ট আঁশজাতীয় খাবার (খড়, ঘাস, সাইলেজ), নিয়মিত খাওয়ানোর সময় আর পুরো দুধ দোহানো, সবই ফ্যাট বাড়ায়; জাতেরও প্রভাব আছে।"),
      },
      {
        q: b("Why does my buyer pay per litre instead?", "আমার ক্রেতা কেন লিটার হিসেবে দাম দেন?"),
        a: b("Many local buyers do. You can still use the tool to compare: if your milk is rich, a buyer who pays by fat and SNF may pay you more.", "অনেক স্থানীয় ক্রেতা তাই করেন। তবু তুলনা করতে টুলটা ব্যবহার করতে পারেন: আপনার দুধ ঘন হলে ফ্যাট-এসএনএফ দেখে দাম দেওয়া ক্রেতা হয়তো বেশি দেবেন।"),
      },
      {
        q: b("How do I test fat and SNF myself?", "ফ্যাট আর এসএনএফ নিজে কীভাবে পরীক্ষা করব?"),
        a: b("Most chilling centres test each delivery with a milk analyser and give a slip. A lactometer at home shows density, which drops when water is added; for fat, ask your buyer or a dairy cooperative to test a sample.", "বেশিরভাগ চিলিং সেন্টার প্রতিবার দুধ নেওয়ার সময় মিল্ক অ্যানালাইজারে পরীক্ষা করে রশিদ দেয়। বাড়িতে ল্যাক্টোমিটার দুধের ঘনত্ব দেখায়, যা পানি মেশালে কমে; ফ্যাটের জন্য ক্রেতা বা দুগ্ধ সমবায়কে একটা নমুনা পরীক্ষা করতে বলুন।"),
      },
      {
        q: b("Does the price per litre change with the season?", "প্রতি লিটারের দাম কি মৌসুমে বদলায়?"),
        a: b("Fat and SNF usually fall in hot months and on poor feed, so the same litres earn less. Good roughage, shade and clean water in summer help keep both up.", "গরমের মাসে আর খারাপ খাবারে সাধারণত ফ্যাট ও এসএনএফ কমে, তাই একই লিটারে কম দাম আসে। গরমে ভালো আঁশজাতীয় খাবার, ছায়া আর পরিষ্কার পানি দুটোই ঠিক রাখতে সাহায্য করে।"),
      },
    ],
  },
};

/** The tools whose guide points to this blog article (for the article's "Try the tool" box). */
export const toolsForPost = (slug: string) => (Object.keys(TOOL_GUIDES) as ToolSlug[]).filter((s) => TOOL_GUIDES[s].blog === slug);
