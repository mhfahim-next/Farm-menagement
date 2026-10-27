// What's new and what's coming, shown on /changelog.
// To add a release: put a new object at the TOP of RELEASES (newest first).
// To change the plan: edit UPCOMING. Every text has an English and a Bangla version.

export type Bilingual = { en: string; bn: string };
export type ChangeType = "new" | "improved" | "fixed";
export type Change = { type: ChangeType } & Bilingual;

export type Release = {
  /** YYYY-MM-DD, also used as the link anchor (/changelog#2026-10-18-money). */
  id: string;
  date: string;
  title: Bilingual;
  summary: Bilingual;
  changes: Change[];
};

export type UpcomingStatus = "next" | "planned" | "exploring";
export type Upcoming = { status: UpcomingStatus; title: Bilingual; body: Bilingual };

export const UPCOMING: Upcoming[] = [
  {
    status: "next",
    title: { en: "The Android app on the Play Store, then iPhone", bn: "Play Store-এ Android অ্যাপ, তারপর iPhone" },
    body: {
      en: "The Android app is being tested now and does almost everything the website does. Next: the Play Store, then the App Store.",
      bn: "Android অ্যাপের পরীক্ষা চলছে, ওয়েবসাইটের প্রায় সব কাজই এখন অ্যাপে হয়। এরপর: Play Store, তারপর App Store।",
    },
  },
  {
    status: "next",
    title: { en: "Reminders on WhatsApp", bn: "WhatsApp-এ রিমাইন্ডার" },
    body: {
      en: "The morning summary on WhatsApp too, for phones where app notifications are easy to miss.",
      bn: "সকালের সারাংশ WhatsApp-এও, যাদের ফোনে অ্যাপের নোটিফিকেশন চোখ এড়িয়ে যায় তাদের জন্য।",
    },
  },
  {
    status: "planned",
    title: { en: "Daily task list for workers", bn: "কর্মীদের দৈনিক কাজের তালিকা" },
    body: {
      en: "Give each worker today's jobs: vaccinate, weigh, clean, refill feed. Tick them off in the app.",
      bn: "প্রতিদিন কর্মীকে কাজ ঠিক করে দিন: টিকা, ওজন, পরিষ্কার, খাবার ভরা। অ্যাপেই টিক দিয়ে শেষ করুন।",
    },
  },
  {
    status: "planned",
    title: { en: "Community: notifications and local groups", bn: "কমিউনিটি: নোটিফিকেশন ও এলাকার গ্রুপ" },
    body: {
      en: "Get told when someone answers your question, and find farmers and vets in your district.",
      bn: "প্রশ্নের উত্তর এলে জানানো হবে, আর নিজের জেলার খামারি ও চিকিৎসকদের খুঁজে পাবেন।",
    },
  },
  {
    status: "exploring",
    title: { en: "Feed ration calculator", bn: "খাবারের রেশন ক্যালকুলেটর" },
    body: {
      en: "Suggest a balanced daily ration from the feeds you have and their prices.",
      bn: "আপনার হাতের খাবার আর দাম অনুযায়ী প্রতিদিনের সুষম রেশন সাজেস্ট করবে।",
    },
  },
  {
    status: "exploring",
    title: { en: "Fodder plots and crops", bn: "ঘাসের জমি ও ফসল" },
    body: {
      en: "Track your Napier and maize plots: sowing, cuts, yield and cost per kg of grass.",
      bn: "নেপিয়ার আর ভুট্টার জমির হিসাব: লাগানো, কাটা, ফলন আর প্রতি কেজি ঘাসের খরচ।",
    },
  },
];

export const RELEASES: Release[] = [
  {
    id: "2026-10-29-app-tools",
    date: "2026-10-29",
    title: { en: "Stock, staff, team and reports in the app", bn: "অ্যাপে স্টক, কর্মী, টিম আর রিপোর্ট" },
    summary: {
      en: "The app now has the farm tools too: feed and medicine stock, staff attendance and pay, inviting your team, and reports you can share as PDF or Excel.",
      bn: "অ্যাপে এখন খামারের টুলসও আছে: খাবার ও ওষুধের স্টক, কর্মীর হাজিরা ও বেতন, টিমে আমন্ত্রণ, আর PDF বা এক্সেলে শেয়ার করার মতো রিপোর্ট।",
    },
    changes: [
      { type: "new", en: "App: stock of feed and medicine: purchases, uses and counts, days left and low-stock warnings.", bn: "অ্যাপ: খাবার ও ওষুধের স্টক: কেনা, ব্যবহার ও গণনা, কত দিন চলবে আর কমে গেলে সতর্কতা।" },
      { type: "new", en: "App: staff attendance (mark only absences) and pay: salary, advance and bonus, with what is still due.", bn: "অ্যাপ: কর্মীর হাজিরা (শুধু অনুপস্থিতি লিখুন) আর বেতন: বেতন, অগ্রিম ও বোনাস, সাথে কত বাকি।" },
      { type: "new", en: "App: invite managers, workers and vets by email, remove someone or leave a farm. Accept invitations right in the app.", bn: "অ্যাপ: ইমেইলে ম্যানেজার, কর্মী ও ডাক্তারকে আমন্ত্রণ, কাউকে সরানো বা খামার ছেড়ে যাওয়া। আমন্ত্রণ অ্যাপেই গ্রহণ করুন।" },
      { type: "new", en: "App: milk and egg charts, cost and profit per litre and per egg, and profit per animal.", bn: "অ্যাপ: দুধ ও ডিমের চার্ট, লিটার ও ডিম প্রতি খরচ ও লাভ, আর পশু প্রতি লাভ।" },
      { type: "new", en: "App: share a report as PDF or CSV (Excel) on WhatsApp, email or Drive (paid plans).", bn: "অ্যাপ: রিপোর্ট PDF বা CSV (এক্সেল) হিসেবে হোয়াটসঅ্যাপ, ইমেইল বা ড্রাইভে শেয়ার করুন (পেইড প্ল্যানে)।" },
    ],
  },
  {
    id: "2026-10-28-app-manage",
    date: "2026-10-28",
    title: { en: "Run the farm from the app", bn: "অ্যাপ থেকেই খামার চালান" },
    summary: {
      en: "Add and edit animals with photos, weigh them, follow fattening, start flocks and batches, fix or delete records, and manage your profile and farm, all on the phone.",
      bn: "ছবিসহ পশু যোগ ও সম্পাদনা, ওজন, মোটাতাজাকরণ, নতুন ফ্লক ও ব্যাচ, ভুল হিসাব ঠিক করা বা মোছা, আর প্রোফাইল ও খামারের সেটিং — সব ফোন থেকেই।",
    },
    changes: [
      { type: "new", en: "App: add, edit and delete animals, with a photo from the camera or gallery.", bn: "অ্যাপ: পশু যোগ, সম্পাদনা ও মোছা, ক্যামেরা বা গ্যালারি থেকে ছবিসহ।" },
      { type: "new", en: "App: weights from a scale or a measuring tape, and fattening with expected weight on the sale day, break-even and profit.", bn: "অ্যাপ: পাল্লা বা মাপার ফিতা দিয়ে ওজন, আর মোটাতাজাকরণে বিক্রির দিনের সম্ভাব্য ওজন, লাভ-ক্ষতির সীমা ও লাভ।" },
      { type: "new", en: "App: start layer flocks and broiler or Sonali batches; FCR, mortality, laying rate, vaccines with presets.", bn: "অ্যাপ: লেয়ার ফ্লক আর ব্রয়লার বা সোনালি ব্যাচ খুলুন; FCR, মৃত্যুহার, ডিম পাড়ার হার, দ্রুত বাছাইসহ টিকা।" },
      { type: "new", en: "App: change or delete a vaccine, breeding event, weight, sale, payment or expense.", bn: "অ্যাপ: টিকা, প্রজনন, ওজন, বিক্রি, জমা বা খরচের হিসাব বদলান বা মুছুন।" },
      { type: "new", en: "App: profile (name, photo, password), farm settings and a second farm.", bn: "অ্যাপ: প্রোফাইল (নাম, ছবি, পাসওয়ার্ড), খামারের সেটিং আর দ্বিতীয় খামার।" },
      { type: "new", en: "Delete your account from the app or from Profile on the website.", bn: "অ্যাপ বা ওয়েবসাইটের প্রোফাইল থেকে নিজের অ্যাকাউন্ট মুছতে পারবেন।" },
    ],
  },
  {
    id: "2026-10-27-android-app",
    date: "2026-10-27",
    title: { en: "FarmFlows for Android (testing)", bn: "Android-এর জন্য FarmFlows (পরীক্ষামূলক)" },
    summary: {
      en: "A real Android app, not the website in a frame: your animals, the day's milk and eggs, vaccines, breeding, sales and dues, expenses and reminders, even without internet.",
      bn: "ওয়েবসাইট মোড়ানো নয়, আসল Android অ্যাপ: পশুর তালিকা, দিনের দুধ ও ডিম, টিকা, প্রজনন, বিক্রি ও বাকি, খরচ আর রিমাইন্ডার — ইন্টারনেট ছাড়াও।",
    },
    changes: [
      { type: "new", en: "A short guide on first launch, then sign in with email or Google. New accounts set up the farm and choose a plan in the app.", bn: "প্রথমবার খুললে ছোট একটি গাইড, তারপর ইমেইল বা Google দিয়ে লগইন। নতুন অ্যাকাউন্ট অ্যাপেই খামার সাজিয়ে প্ল্যান বেছে নিতে পারে।" },
      { type: "new", en: "Home: today's milk and eggs, and how many cattle, goats and birds you have.", bn: "হোম: আজকের দুধ ও ডিম, আর কতগুলো গরু, ছাগল ও মুরগি আছে।" },
      { type: "new", en: "Animals: search by tag or name; each animal's page shows its mother, milk, latest vaccines with the next date, and breeding with the expected calving.", bn: "পশু: ট্যাগ বা নাম দিয়ে খুঁজুন; প্রতিটি পশুর পাতায় মা, দুধ, শেষ টিকা ও পরের তারিখ, আর প্রজনন ও সম্ভাব্য প্রসবের তারিখ।" },
      { type: "new", en: "Daily entry: the milking sheet (litres for each cow) and each flock's eggs, deaths and feed. Bangla digits work.", bn: "দৈনিক হিসাব: দুধের শিট (প্রতিটি গাভীর লিটার) আর প্রতিটি ফ্লকের ডিম, মৃত্যু ও খাবার। বাংলা সংখ্যায়ও লেখা যায়।" },
      { type: "new", en: "Vaccines and treatments for one animal or the whole herd, with quick choices (FMD, LSD, deworming, PPR…) and the next due date.", bn: "একটি পশু বা পুরো খামারের টিকা ও চিকিৎসা, দ্রুত বাছাইসহ (খুরা রোগ, লাম্পি স্কিন, কৃমিনাশক, পিপিআর…) আর পরের তারিখ।" },
      { type: "new", en: "Breeding: heat, insemination with the expected birth date, pregnancy check, dry off, and births that add the calf or kid to your animals.", bn: "প্রজনন: গরম আসা, সম্ভাব্য প্রসবের তারিখসহ কৃত্রিম প্রজনন, গর্ভ পরীক্ষা, দুধ বন্ধ, আর প্রসব — বাছুর বা ছানা নিজে থেকেই পশুর তালিকায় যোগ হয়।" },
      { type: "new", en: "Sales & dues: sell milk, eggs, animals or birds for cash or on credit, see what each buyer owes and record their payments (bKash, Nagad…).", bn: "বিক্রি ও বাকি: দুধ, ডিম, পশু বা মুরগি নগদে বা বাকিতে বিক্রি করুন, কোন ক্রেতার কত বাকি দেখুন আর তাদের জমা লিখুন (বিকাশ, নগদ…)।" },
      { type: "new", en: "Today's work on the home screen, with a phone notification at 7 am, and at 8 pm if today's milk or eggs aren't entered.", bn: "হোম স্ক্রিনে আজকের কাজ, সকাল ৭টায় ফোনে নোটিফিকেশন, আর রাত ৮টায় যদি আজকের দুধ বা ডিম লেখা না হয়।" },
      { type: "new", en: "Scan the QR code on an ear tag to open the animal, or type its tag number.", bn: "কানের ট্যাগের QR কোড স্ক্যান করে পশুর পাতা খুলুন, অথবা ট্যাগ নম্বর লিখুন।" },
      { type: "new", en: "Expenses and this month's profit for each part of the farm.", bn: "খরচের হিসাব আর খামারের প্রতিটি অংশের এই মাসের লাভ-লোকসান।" },
      { type: "new", en: "No internet? Everything you enter waits on the phone and is sent by itself when the connection is back, without making copies.", bn: "ইন্টারনেট নেই? যা লিখবেন সব ফোনে জমা থাকে, নেট ফিরলে নিজে থেকেই পাঠানো হয়, দুবার জমা হয় না।" },
      { type: "improved", en: "Material design, Bangla and English, light and dark theme. Same account and records as the website.", bn: "Material ডিজাইন, বাংলা ও ইংরেজি, লাইট ও ডার্ক থিম। ওয়েবসাইটের একই অ্যাকাউন্ট আর হিসাব।" },
      { type: "fixed", en: "Signing in with Google in the app no longer ends on a “page not found” screen.", bn: "অ্যাপে Google দিয়ে লগইন করলে আর “পাতা পাওয়া যায়নি” দেখায় না।" },
    ],
  },
  {
    id: "2026-10-27-speed",
    date: "2026-10-27",
    title: { en: "Faster pages", bn: "আরও দ্রুত পাতা" },
    summary: {
      en: "The dashboard and animal pages open about twice as fast, and the home page downloads less.",
      bn: "ড্যাশবোর্ড আর পশুর পাতা প্রায় দ্বিগুণ দ্রুত খোলে, আর হোম পেজ কম ডাটা নামায়।",
    },
    changes: [
      { type: "improved", en: "Pages fetch their data in fewer steps, from servers in Mumbai next to the database.", bn: "পাতাগুলো কম ধাপে ডাটা আনে, ডাটাবেসের পাশেই মুম্বাইয়ের সার্ভার থেকে।" },
      { type: "improved", en: "Lighter animations on the public pages: less to download on slow connections.", bn: "পাবলিক পাতায় হালকা অ্যানিমেশন: ধীর ইন্টারনেটে কম ডাটা লাগে।" },
    ],
  },
  {
    id: "2026-10-26-animal-profit",
    date: "2026-10-26",
    title: { en: "Profit per animal", bn: "প্রতিটি পশুর লাভ-লোকসান" },
    summary: {
      en: "See which cows, goats and fattening animals earn their keep and which cost more than they give.",
      bn: "কোন গাভী, ছাগল আর মোটাতাজাকরণের পশু লাভ দিচ্ছে আর কোনটা খরচ বেশি করাচ্ছে দেখুন।",
    },
    changes: [
      { type: "new", en: "Cost & profit → Profit per animal: each animal's milk and sale against its purchase, medicine, breeding and share of feed and other costs, for the last 12 months, this year or all time.", bn: "খরচ ও লাভ → প্রতিটি পশুর লাভ-লোকসান: প্রতিটি পশুর দুধ ও বিক্রির আয় বনাম কেনা, ওষুধ, প্রজনন আর খাবার ও অন্যান্য খরচের ভাগ — গত ১২ মাস, এই বছর বা শুরু থেকে।" },
      { type: "new", en: "Each animal's page shows its profit and its rank on the farm.", bn: "প্রতিটি পশুর পাতায় তার লাভ আর খামারে তার অবস্থান দেখা যায়।" },
      { type: "improved", en: "Owners and managers can turn profit per animal off in Settings.", bn: "মালিক ও ম্যানেজার সেটিং থেকে প্রতিটি পশুর লাভ-লোকসান বন্ধ করতে পারেন।" },
      { type: "fixed", en: "Turning goats & sheep, fattening or broilers on or off in Settings now saves.", bn: "সেটিং থেকে ছাগল ও ভেড়া, মোটাতাজাকরণ বা ব্রয়লার চালু-বন্ধ করলে এখন সংরক্ষণ হয়।" },
    ],
  },
  {
    id: "2026-10-26-reminders",
    date: "2026-10-26",
    title: { en: "Reminders on your phone and by email", bn: "ফোনে আর ইমেইলে রিমাইন্ডার" },
    summary: {
      en: "A bell in the top bar with everything that needs doing, a morning summary as a phone notification, and an optional daily or weekly email.",
      bn: "ওপরের বারে ঘণ্টা আইকনে সব করণীয়, সকালে ফোনে নোটিফিকেশনে সারাংশ, আর চাইলে প্রতিদিন বা সপ্তাহে একবার ইমেইল।",
    },
    changes: [
      { type: "new", en: "🔔 Reminders: vaccines and deworming, heat, pregnancy checks, births, low stock, buyer dues, broiler weighing and sale age, the Qurbani countdown and your plan ending — worked out from your records.", bn: "🔔 রিমাইন্ডার: টিকা ও কৃমিনাশক, গরম আসা, গর্ভ পরীক্ষা, বাচ্চা হওয়া, স্টক কম, ক্রেতার বাকি, ব্রয়লারের ওজন ও বিক্রির বয়স, কোরবানির দিন গণনা আর প্ল্যানের মেয়াদ — আপনার হিসাব থেকেই।" },
      { type: "new", en: "Phone notifications: a summary at 7 am, and at 8 pm if today's milk or eggs are not entered. Turn them on in Reminders.", bn: "ফোনে নোটিফিকেশন: সকাল ৭টায় সারাংশ, আর রাত ৮টায় যদি আজকের দুধ বা ডিম লেখা না হয়। রিমাইন্ডার পাতা থেকে চালু করুন।" },
      { type: "new", en: "Email summary every morning or once a week.", bn: "প্রতিদিন সকালে বা সপ্তাহে একবার ইমেইলে সারাংশ।" },
      { type: "improved", en: "Each person chooses what to be reminded about; workers get daily work and vaccines, vets get health and breeding.", bn: "প্রত্যেকে নিজে বেছে নেন কোন রিমাইন্ডার চান; কর্মীরা পান প্রতিদিনের কাজ আর টিকা, ডাক্তাররা পান স্বাস্থ্য আর প্রজনন।" },
    ],
  },
  {
    id: "2026-10-26-reliability",
    date: "2026-10-26",
    title: { en: "Safer and more reliable", bn: "আরও নিরাপদ ও নির্ভরযোগ্য" },
    summary: {
      en: "A security update for the app's framework, a friendlier error page, and automatic checks before every change goes live.",
      bn: "অ্যাপের ফ্রেমওয়ার্কের নিরাপত্তা আপডেট, সহজ ভাষার ত্রুটির পাতা, আর প্রতিটি পরিবর্তন চালুর আগে স্বয়ংক্রিয় পরীক্ষা।",
    },
    changes: [
      { type: "fixed", en: "Security update for Next.js (the framework FarmFlows is built on).", bn: "Next.js (যার ওপর FarmFlows তৈরি) এর নিরাপত্তা আপডেট।" },
      { type: "improved", en: "If a page fails to load you now see a clear message with a Try again button, and we are told about the problem.", bn: "কোনো পাতা না খুললে এখন সহজ বার্তা আর “আবার চেষ্টা করুন” বোতাম দেখাবে, আর সমস্যাটা আমরা জানতে পারব।" },
      { type: "improved", en: "Every change is checked automatically before release: farm calculations, database security rules and a full build.", bn: "প্রতিটি পরিবর্তন চালুর আগে স্বয়ংক্রিয়ভাবে পরীক্ষা হয়: খামারের হিসাব, ডাটাবেসের নিরাপত্তা নিয়ম আর পুরো বিল্ড।" },
    ],
  },
  {
    id: "2026-10-26-livestock",
    date: "2026-10-26",
    title: { en: "Goats & sheep, cattle fattening for Qurbani, and broiler batches", bn: "ছাগল ও ভেড়া, কোরবানির গরু মোটাতাজাকরণ, আর ব্রয়লার ব্যাচ" },
    summary: {
      en: "FarmFlows now handles goats and sheep, bulls and khashi fattened for sale, and broiler and Sonali batches, each with its own numbers and profit.",
      bn: "FarmFlows-এ এখন ছাগল ও ভেড়া, বিক্রির জন্য মোটাতাজা ষাঁড় ও খাসি, আর ব্রয়লার ও সোনালি ব্যাচ রাখা যায়, প্রতিটির নিজস্ব হিসাব আর লাভসহ।",
    },
    changes: [
      { type: "new", en: "Choose what your farm keeps: dairy cows, cattle fattening, goats & sheep, layers, broiler & Sonali. The menu shows only those parts (Settings to change).", bn: "আপনার খামারে কী আছে বেছে নিন: দুধের গাভী, গরু মোটাতাজা, ছাগল ও ভেড়া, লেয়ার, ব্রয়লার ও সোনালি। মেনুতে শুধু সেগুলোই দেখাবে (সেটিংস থেকে বদলানো যায়)।" },
      { type: "new", en: "Goats & sheep: doe, buck, khashi, kids, ewe, ram and lambs with Black Bengal, Jamunapari, Garole and other breeds; kidding with 150-day (goat) and 147-day (sheep) gestation; PPR, goat pox and ET vaccine presets; weights, tags and reports.", bn: "ছাগল ও ভেড়া: ছাগী, পাঁঠা, খাসি, বাচ্চা, ভেড়ি, পুরুষ ভেড়া, ভেড়ার বাচ্চা, সাথে ব্ল্যাক বেঙ্গল, যমুনাপাড়ি, গাড়ল ইত্যাদি জাত; ১৫০ দিন (ছাগল) ও ১৪৭ দিন (ভেড়া) গর্ভকালে বাচ্চা দেওয়ার হিসাব; পিপিআর, বসন্ত ও ET টিকা; ওজন, ট্যাগ আর রিপোর্ট।" },
      { type: "new", en: "Fattening & Qurbani: countdown to Eid-ul-Adha, daily gain, weight expected on the sale day, cost so far, break-even price per kg and expected profit for every bull and khashi, and the real profit once sold.", bn: "মোটাতাজা ও কোরবানি: ঈদুল আযহার কাউন্টডাউন, প্রতিটি ষাঁড় ও খাসির দৈনিক ওজন বৃদ্ধি, বিক্রির দিনের সম্ভাব্য ওজন, এ পর্যন্ত খরচ, কেজিপ্রতি লাভ-ক্ষতির দাম আর সম্ভাব্য লাভ, বিক্রির পর আসল লাভ।" },
      { type: "new", en: "Broiler & Sonali batches: chicks and their price, daily deaths and feed, sample weights, FCR, EPEF, cost per kg, bird sales by weight and head, and profit per batch.", bn: "ব্রয়লার ও সোনালি ব্যাচ: বাচ্চা ও তার দাম, দৈনিক মৃত্যু ও খাবার, নমুনা ওজন, FCR, EPEF, কেজিপ্রতি খরচ, ওজন ও সংখ্যা ধরে মুরগি বিক্রি, আর প্রতিটি ব্যাচের লাভ।" },
      { type: "improved", en: "Finance has separate sections for fattening, goats and broilers, so cost per litre and per egg stay accurate.", bn: "হিসাবে মোটাতাজা, ছাগল আর ব্রয়লারের আলাদা বিভাগ, তাই প্রতি লিটার আর প্রতি ডিমের খরচ সঠিক থাকে।" },
    ],
  },
  {
    id: "2026-10-26-payments",
    date: "2026-10-26",
    title: { en: "Pay for your plan with bKash, Nagad, card and more", bn: "বিকাশ, নগদ, কার্ড ও আরও মাধ্যমে প্ল্যানের পেমেন্ট" },
    summary: {
      en: "Upgrade or renew right from the Plan page: send money by bKash, Nagad, Rocket, Upay or bank and enter the TrxID, or pay online with SSLCommerz or Stripe.",
      bn: "প্ল্যান পাতা থেকেই আপগ্রেড বা নবায়ন করুন: বিকাশ, নগদ, রকেট, উপায় বা ব্যাংকে টাকা পাঠিয়ে TrxID দিন, অথবা SSLCommerz বা Stripe দিয়ে অনলাইনে পেমেন্ট করুন।",
    },
    changes: [
      { type: "new", en: "Choose 1, 3 or 12 months (longer is cheaper) and how to pay. bKash, Nagad and the others show the number, the exact amount and the steps in their own colours; enter the TrxID and your plan starts once it is checked.", bn: "১, ৩ বা ১২ মাস বাছুন (বেশি মাসে কম দাম) আর পেমেন্টের মাধ্যম বাছুন। বিকাশ, নগদ ও অন্যগুলো নিজের রঙে নম্বর, ঠিক টাকার পরিমাণ আর ধাপ দেখায়; TrxID দিলে যাচাইয়ের পর প্ল্যান চালু হয়।" },
      { type: "new", en: "Pay online by card, mobile banking or net banking through SSLCommerz, or by card through Stripe; the plan starts as soon as the payment is confirmed.", bn: "SSLCommerz দিয়ে কার্ড, মোবাইল ব্যাংকিং বা নেট ব্যাংকিংয়ে, অথবা Stripe দিয়ে কার্ডে অনলাইন পেমেন্ট; পেমেন্ট নিশ্চিত হলেই প্ল্যান চালু।" },
      { type: "new", en: "Prices in taka in Bangladesh and in US dollars elsewhere, chosen by your country (you can switch).", bn: "বাংলাদেশে দাম টাকায়, অন্য দেশে মার্কিন ডলারে, আপনার দেশ দেখে ঠিক হয় (চাইলে বদলানো যায়)।" },
      { type: "new", en: "Payment history with a printable receipt, the date your plan is paid until, and a reminder to renew when it is close.", bn: "পেমেন্টের ইতিহাস ও প্রিন্টযোগ্য রসিদ, প্ল্যান কোন তারিখ পর্যন্ত পরিশোধিত, আর মেয়াদ শেষের আগে নবায়নের কথা মনে করানো।" },
    ],
  },
  {
    id: "2026-10-22-fixes",
    date: "2026-10-22",
    title: { en: "Pick any date for daily entries, and delete health and breeding records", bn: "দৈনিক এন্ট্রিতে যেকোনো তারিখ বাছুন, আর স্বাস্থ্য ও প্রজননের রেকর্ড মুছুন" },
    summary: {
      en: "Entries now save on the date you pick, and mistakes in health and breeding records can be removed.",
      bn: "এন্ট্রি এখন আপনার বাছা তারিখেই সংরক্ষণ হয়, আর স্বাস্থ্য ও প্রজননের ভুল রেকর্ড মুছে ফেলা যায়।",
    },
    changes: [
      { type: "fixed", en: "Layer daily log, milk sheet and attendance: picking an earlier date used to save the entry on today. The date and session you choose are now what gets saved, and that day's numbers load as soon as you pick it (no Load button).", bn: "লেয়ারের দৈনিক হিসাব, দুধের শিট আর হাজিরায় আগের তারিখ বাছলেও এন্ট্রি আজকের তারিখে সেভ হতো। এখন আপনি যে তারিখ ও বেলা বাছেন সেটাই সেভ হয়, আর তারিখ বাছলেই ওই দিনের হিসাব লোড হয় (“লোড” বোতাম লাগে না)।" },
      { type: "new", en: "Delete a vaccine/treatment record or a breeding record from the animal's page or its edit page (owners and managers, with a confirmation).", bn: "পশুর পাতা বা এডিট পাতা থেকে টিকা/চিকিৎসা আর প্রজননের রেকর্ড মুছুন (মালিক ও ম্যানেজার, নিশ্চিত করে)।" },
    ],
  },
  {
    id: "2026-10-20-animal-page",
    date: "2026-10-20",
    title: { en: "Animal tags with QR, PDF reports and a clearer animal page", bn: "QR ট্যাগ, PDF রিপোর্ট আর আরও পরিষ্কার পশুর পাতা" },
    summary: {
      en: "Print QR tags for your animals, download a PDF report for any animal, and the actions on an animal's page are now big buttons.",
      bn: "পশুর QR ট্যাগ প্রিন্ট করুন, যেকোনো পশুর PDF রিপোর্ট নামান, আর পশুর পাতার কাজগুলো এখন বড় বোতাম।",
    },
    changes: [
      { type: "new", en: "Print or save as PDF the tag number, name and QR code of all your animals (Cattle → Print tags with QR). Scanning a code opens that animal's page.", bn: "সব পশুর ট্যাগ নম্বর, নাম আর QR কোড প্রিন্ট করুন বা PDF হিসেবে রাখুন (গবাদিপশু → QR সহ ট্যাগ প্রিন্ট)। কোড স্ক্যান করলে ওই পশুর পাতা খোলে।" },
      { type: "new", en: "Download a PDF report for one animal: details, weight, milk, health, breeding and every cost and sale recorded for it, with the net result.", bn: "একটি পশুর PDF রিপোর্ট নামান: তথ্য, ওজন, দুধ, স্বাস্থ্য, প্রজনন, আর তার নামে লেখা সব খরচ ও বিক্রি, সাথে লাভ-ক্ষতি।" },
      { type: "improved", en: "The home page now lists weight and growth tracking, QR tags and the PDF report, and shows the mobile app as coming soon.", bn: "হোম পেজে এখন ওজন ও বৃদ্ধি, QR ট্যাগ আর PDF রিপোর্ট দেখা যায়, আর মোবাইল অ্যাপ “শীঘ্রই আসছে” হিসেবে দেখানো আছে।" },
      { type: "improved", en: "“Record vaccine / treatment”, “Record heat / AI / pregnancy / calving” and “Add weight” are now clear buttons at the top of their sections; the form opens right under the button.", bn: "“টিকা / চিকিৎসা লিখুন”, “গরম / এআই / গর্ভ পরীক্ষা / প্রসব লিখুন” আর “ওজন যোগ করুন” এখন নিজ নিজ অংশের উপরে স্পষ্ট বোতাম; ফর্ম বোতামের ঠিক নিচে খোলে।" },
      { type: "improved", en: "Bulls and steers no longer show milk records, breeding (heat, AI, pregnancy, calving) or expected calving.", bn: "ষাঁড় আর বলদের পাতায় এখন দুধের হিসাব, প্রজনন (গরম, এআই, গর্ভ, প্রসব) বা প্রসবের সম্ভাব্য তারিখ দেখায় না।" },
    ],
  },
  {
    id: "2026-10-19-offline",
    date: "2026-10-19",
    title: { en: "Works without internet, and Excel import", bn: "ইন্টারনেট ছাড়াও চলে, আর Excel থেকে তথ্য আনা" },
    summary: {
      en: "Record the day's work in the shed with no signal, and bring your old notebook or Excel records in at once.",
      bn: "নেটওয়ার্ক না থাকলেও গোয়ালে বসে দিনের হিসাব লিখুন, আর পুরোনো খাতা বা Excel-এর হিসাব একবারে তুলে আনুন।",
    },
    changes: [
      { type: "new", en: "Quick entry: milk, eggs, feed/medicine use and attendance on one page that opens and saves even without internet.", bn: "দ্রুত এন্ট্রি: দুধ, ডিম, খাবার/ওষুধ ব্যবহার আর হাজিরা এক পাতায়, যা ইন্টারনেট ছাড়াও খোলে ও সংরক্ষণ করে।" },
      { type: "new", en: "Entries made offline wait on the phone and are sent by themselves when the connection is back. A bar shows what is still waiting.", bn: "অফলাইনে করা এন্ট্রি ফোনে অপেক্ষা করে, নেট ফিরলে নিজে চলে যায়। কী বাকি আছে তা উপরের বারে দেখা যায়।" },
      { type: "new", en: "Import from Excel or CSV: animals, milk records, daily egg logs and income/expenses, with a template, Bangla headings and a check of every row before saving.", bn: "Excel বা CSV থেকে আনুন: পশু, দুধের হিসাব, ডিমের দৈনিক হিসাব আর আয়-ব্যয়; নমুনা ফাইল, বাংলা কলামের নাম, আর সংরক্ষণের আগে প্রতিটি সারি যাচাই।" },
      { type: "improved", en: "A weak network can no longer save the same stock use twice.", bn: "দুর্বল নেটওয়ার্কে একই স্টক ব্যবহার আর দুইবার জমা হয় না।" },
    ],
  },
  {
    id: "2026-10-19-site",
    date: "2026-10-19",
    title: { en: "What's new page, farm guide and a tidier website", bn: "নতুন কী পাতা, খামার গাইড আর গোছানো ওয়েবসাইট" },
    summary: {
      en: "See what changed and what is coming, a full guide to farm management software, and many small fixes across the site.",
      bn: "কী বদলাল আর কী আসছে দেখুন, ফার্ম ম্যানেজমেন্ট সফটওয়্যারের পূর্ণ গাইড, আর সাইট জুড়ে অনেক ছোট ঠিকঠাক।",
    },
    changes: [
      { type: "new", en: "This “What's new” page, with the plan for what comes next.", bn: "এই “নতুন কী” পাতা, সাথে সামনে কী আসছে তার পরিকল্পনা।" },
      { type: "new", en: "A guide page: what farm management software does, how FarmFlows compares with a notebook or Excel, and common questions.", bn: "গাইড পাতা: ফার্ম ম্যানেজমেন্ট সফটওয়্যার কী করে, খাতা বা Excel-এর সাথে FarmFlows-এর তুলনা, আর সাধারণ প্রশ্ন।" },
      { type: "new", en: "Twenty starter questions with answers in the community, taken from our guides.", bn: "কমিউনিটিতে আমাদের গাইড থেকে নেওয়া ২০টি প্রশ্ন ও উত্তর দিয়ে শুরু।" },
      { type: "new", en: "A friendly “page not found” page with links back to home, the blog and the community.", bn: "“পাতা পাওয়া যায়নি” এর জন্য সুন্দর পাতা, হোম, ব্লগ আর কমিউনিটিতে ফেরার লিংকসহ।" },
      { type: "improved", en: "The home page lists every feature, and FarmFlows is easier to find on Google (site name, icon sizes, structured data).", bn: "হোম পাতায় সব ফিচার দেখা যায়, আর Google-এ FarmFlows খুঁজে পাওয়া সহজ হয়েছে (সাইটের নাম, আইকন, স্ট্রাকচার্ড ডেটা)।" },
      { type: "improved", en: "Signing in with Google fills in your name and photo if your profile had none.", bn: "Google দিয়ে লগইন করলে প্রোফাইলে নাম বা ছবি না থাকলে তা নিজে বসে যায়।" },
      { type: "improved", en: "On phones, the footer shows Product and Resources side by side.", bn: "ফোনে ফুটারের Product আর Resources পাশাপাশি দেখায়।" },
      { type: "fixed", en: "Topic and category chips no longer overlap on small screens.", bn: "ছোট স্ক্রিনে টপিক আর ক্যাটাগরির বোতাম আর একটার ওপর আরেকটা পড়ে না।" },
    ],
  },
  {
    id: "2026-10-18-money",
    date: "2026-10-18",
    title: { en: "Stock, sales & what a litre really costs", bn: "স্টক, বিক্রি আর এক লিটারের আসল খরচ" },
    summary: {
      en: "Your farm's real money picture: what you buy, what you sell, who owes you, and what a litre of milk or an egg costs.",
      bn: "খামারের আসল টাকার চিত্র: কী কিনছেন, কী বিক্রি করছেন, কার কাছে পাওনা, আর এক লিটার দুধ বা একটা ডিমের খরচ কত।",
    },
    changes: [
      { type: "new", en: "Stock of feed and medicine: purchases, use, stock counts, average cost, days left and a low-stock alert.", bn: "খাবার ও ওষুধের স্টক: কেনা, ব্যবহার, গণনা, গড় দাম, কত দিন চলবে আর কমে গেলে সতর্কতা।" },
      { type: "new", en: "The layer daily log can take its feed (kg) straight from your stock.", bn: "মুরগির দৈনিক হিসাবের খাবার (কেজি) সরাসরি স্টক থেকে কাটা যায়।" },
      { type: "new", en: "Sales & dues: record milk, egg, animal and manure sales to buyers, cash or on credit, with payments by cash, bKash, Nagad or bank.", bn: "বিক্রি ও বাকি: ক্রেতাকে দুধ, ডিম, পশু আর গোবর বিক্রি নগদে বা বাকিতে, সাথে নগদ, বিকাশ, নগদ (Nagad) বা ব্যাংকে জমা।" },
      { type: "new", en: "Each buyer has a statement with a running balance and a Send on WhatsApp button.", bn: "প্রতিটি ক্রেতার হিসাবে চলতি বাকি দেখা যায়, আর WhatsApp-এ পাঠানোর বোতাম আছে।" },
      { type: "new", en: "Cost & profit: cost, income and profit per litre of milk and per egg, with a 6-month trend.", bn: "খরচ ও লাভ: প্রতি লিটার দুধ আর প্রতি ডিমের খরচ, আয় ও লাভ, সাথে ৬ মাসের তুলনা।" },
      { type: "improved", en: "Stock purchases and sales now appear in Finance by themselves. Dues to collect and low stock show on the dashboard.", bn: "স্টক কেনা আর বিক্রি এখন নিজে থেকেই আয়-ব্যয়ে আসে। পাওনা আর কমে যাওয়া স্টক ড্যাশবোর্ডে দেখা যায়।" },
      { type: "improved", en: "CSV downloads for sales and stock.", bn: "বিক্রি আর স্টকের CSV ডাউনলোড।" },
      { type: "improved", en: "When you are logged in, the website shows your photo and menu instead of Log in and Start free.", bn: "লগইন থাকলে ওয়েবসাইটে \"লগ ইন\" আর \"বিনামূল্যে শুরু\"-র বদলে আপনার ছবি আর মেনু দেখায়।" },
    ],
  },
  {
    id: "2026-10-18-community",
    date: "2026-10-18",
    title: { en: "Farmers' community and Google sign-in", bn: "খামারি কমিউনিটি আর Google দিয়ে লগইন" },
    summary: {
      en: "Ask questions and get answers from other farmers and verified vets.",
      bn: "অন্য খামারি আর যাচাইকৃত চিকিৎসকের কাছে প্রশ্ন করুন, উত্তর পান।",
    },
    changes: [
      { type: "new", en: "Community Q&A in Bangla or English: ask with photos, answer, mark answers helpful, and pick the best answer.", bn: "বাংলা বা ইংরেজিতে কমিউনিটির প্রশ্ন-উত্তর: ছবিসহ প্রশ্ন, উত্তর, সাহায্যকর চিহ্ন আর সেরা উত্তর বাছা।" },
      { type: "new", en: "Verified vets get a badge and their answers are shown first.", bn: "যাচাইকৃত চিকিৎসকের নামের পাশে ব্যাজ থাকে, আর তাঁদের উত্তর আগে দেখায়।" },
      { type: "new", en: "Report a post; moderators can hide posts and block people who misuse the community.", bn: "পোস্ট রিপোর্ট করা যায়; মডারেটর খারাপ পোস্ট লুকাতে আর অপব্যবহারকারীকে নিষিদ্ধ করতে পারেন।" },
      { type: "new", en: "Sign in with Google on the login and sign-up pages.", bn: "লগইন আর সাইনআপ পাতায় Google দিয়ে ঢোকার সুবিধা।" },
    ],
  },
  {
    id: "2026-10-18-blog",
    date: "2026-10-18",
    title: { en: "Blog: guides for farmers", bn: "ব্লগ: খামারিদের জন্য গাইড" },
    summary: {
      en: "17 practical guides in Bangla and English, with photos, categories and tags.",
      bn: "বাংলা ও ইংরেজিতে ১৭টা বাস্তব গাইড, ছবি, ক্যাটাগরি আর ট্যাগসহ।",
    },
    changes: [
      { type: "new", en: "Guides on vaccines, heat and AI timing, mastitis, milk fever, calf care, Napier, silage, layer egg drop, biosecurity, fattening, milk cost and more.", bn: "টিকা, গরম ও প্রজননের সময়, ওলান ফোলা, দুধ জ্বর, বাছুরের যত্ন, নেপিয়ার, সাইলেজ, ডিম কমা, জৈব নিরাপত্তা, মোটাতাজাকরণ, দুধের খরচসহ আরও অনেক বিষয়ে লেখা।" },
      { type: "new", en: "Browse by category or tag, search, reading time and related articles.", bn: "ক্যাটাগরি বা ট্যাগ ধরে দেখা, খোঁজা, পড়তে কত মিনিট লাগবে আর সম্পর্কিত লেখা।" },
    ],
  },
  {
    id: "2026-10-18-weights",
    date: "2026-10-18",
    title: { en: "Cattle weight and a faster site", bn: "গরুর ওজন আর আরও দ্রুত সাইট" },
    summary: {
      en: "Weigh with a scale or a tape and see how each animal grows.",
      bn: "যন্ত্রে বা ফিতায় ওজন মাপুন, প্রতিটি পশুর বাড়ার ধারা দেখুন।",
    },
    changes: [
      { type: "new", en: "Weight history for every animal with a tape estimate (girth × length) and a chart; the current weight shows in the cattle list.", bn: "প্রতিটি পশুর ওজনের ইতিহাস, ফিতার (বেড় × দৈর্ঘ্য) আন্দাজ আর চার্ট; তালিকায় বর্তমান ওজন দেখায়।" },
      { type: "new", en: "Weights in CSV downloads and in the AI assistant.", bn: "CSV ডাউনলোড আর AI সহকারীতেও ওজন আছে।" },
      { type: "improved", en: "Bangla web addresses and better search-engine information, so more farmers can find FarmFlows.", bn: "বাংলা ওয়েব ঠিকানা আর সার্চ ইঞ্জিনের জন্য ভালো তথ্য, যাতে আরও খামারি FarmFlows খুঁজে পান।" },
      { type: "fixed", en: "The phone menu no longer breaks after scrolling.", bn: "স্ক্রল করার পরে ফোনের মেনু আর ভেঙে যায় না।" },
    ],
  },
  {
    id: "2026-10-18-site",
    date: "2026-10-18",
    title: { en: "Reviews, contact and legal pages", bn: "রিভিউ, যোগাযোগ আর আইনি পাতা" },
    summary: {
      en: "More ways for farmers to trust and reach us.",
      bn: "খামারিদের আস্থা রাখার আর যোগাযোগের আরও সুযোগ।",
    },
    changes: [
      { type: "new", en: "Customer reviews on the home page, shown after a moderator approves them.", bn: "হোম পেজে গ্রাহকদের রিভিউ, মডারেটর অনুমোদন করলে দেখায়।" },
      { type: "new", en: "Contact form, Terms and Privacy pages, with contact details we can change any time.", bn: "যোগাযোগ ফর্ম, শর্তাবলী আর গোপনীয়তা নীতি, যোগাযোগের তথ্য যেকোনো সময় বদলানো যায়।" },
      { type: "new", en: "An interactive globe on the home page with dairy regions, worded for your country.", bn: "হোম পেজে ইন্টারঅ্যাকটিভ গ্লোব, দুগ্ধ অঞ্চলসহ, আপনার দেশ অনুযায়ী লেখা।" },
      { type: "improved", en: "Login and sign-up pages with the form on the right.", bn: "লগইন আর সাইনআপ পাতায় ফর্ম ডানদিকে।" },
    ],
  },
  {
    id: "2026-10-18-workers",
    date: "2026-10-18",
    title: { en: "Automatic attendance and branded emails", bn: "স্বয়ংক্রিয় হাজিরা আর নিজস্ব ইমেইল" },
    summary: {
      en: "Less typing for you and a more professional first impression.",
      bn: "আপনার লেখা কম আর প্রথম পরিচয় আরও পেশাদার।",
    },
    changes: [
      { type: "improved", en: "Staff attendance is automatic: everyone is present unless you mark an absence.", bn: "কর্মীর হাজিরা স্বয়ংক্রিয়: অনুপস্থিত চিহ্নিত না করলে সবাই উপস্থিত ধরা হয়।" },
      { type: "improved", en: "Sign-up and password emails come from FarmFlows with our own design.", bn: "সাইনআপ ও পাসওয়ার্ডের ইমেইল FarmFlows-এর নিজস্ব ডিজাইনে আসে।" },
      { type: "new", en: "Sitemap and search-engine files so the site shows up on Google.", bn: "Google-এ সাইট দেখা যাওয়ার জন্য সাইটম্যাপ আর সার্চ ইঞ্জিনের ফাইল।" },
    ],
  },
  {
    id: "2026-10-17-brand",
    date: "2026-10-17",
    title: { en: "New name and look: FarmFlows", bn: "নতুন নাম ও চেহারা: FarmFlows" },
    summary: {
      en: "The app is now FarmFlows, with a new logo and a smoother feel.",
      bn: "অ্যাপের নাম এখন FarmFlows, নতুন লোগো আর আরও মসৃণ অনুভূতি।",
    },
    changes: [
      { type: "improved", en: "New name, logo and icons, a tidier top bar and a new footer with a farm landscape.", bn: "নতুন নাম, লোগো ও আইকন, গোছানো ওপরের বার আর খামারের দৃশ্যসহ নতুন ফুটার।" },
      { type: "improved", en: "A loading indicator on every page change and while saving.", bn: "প্রতিটি পাতা বদলানো আর সংরক্ষণের সময় লোডিং দেখায়।" },
    ],
  },
  {
    id: "2026-10-17-staff",
    date: "2026-10-17",
    title: { en: "Staff, flock health and one money ledger", bn: "কর্মী, মুরগির স্বাস্থ্য আর এক খাতায় টাকা" },
    summary: {
      en: "Salaries, vaccines for the flock and all costs in one place.",
      bn: "বেতন, মুরগির টিকা আর সব খরচ এক জায়গায়।",
    },
    changes: [
      { type: "new", en: "Staff module: salary, attendance and payments.", bn: "কর্মী অংশ: বেতন, হাজিরা আর পরিশোধ।" },
      { type: "new", en: "Layer flock health: vaccines, medicine and pest control with a due board.", bn: "মুরগির স্বাস্থ্য: টিকা, ওষুধ ও পোকা দমন, কবে বাকি তার তালিকাসহ।" },
      { type: "new", en: "One income and expense ledger for cows and layers, including medicine, breeding and salary costs, with a Cow / Layer view.", bn: "গাভী আর লেয়ারের এক আয়-ব্যয় খাতা, ওষুধ, প্রজনন ও বেতনের খরচসহ, গাভী / লেয়ার ভিউসহ।" },
      { type: "new", en: "Quantity × rate calculator when you add income or expenses; the total is stored.", bn: "আয় বা খরচ লেখার সময় পরিমাণ × দর ক্যালকুলেটর; মোট টাকা সংরক্ষিত থাকে।" },
      { type: "improved", en: "Dedicated add pages for cattle, milk, health, breeding and flocks; tap a table row to open it.", bn: "পশু, দুধ, স্বাস্থ্য, প্রজনন ও ব্যাচের জন্য আলাদা যোগ করার পাতা; টেবিলের সারিতে চাপলেই খোলে।" },
      { type: "improved", en: "The menu is grouped into cow farm, layer farm, money and farm.", bn: "মেনু গাভী খামার, লেয়ার খামার, টাকা আর খামার, এই ভাগে সাজানো।" },
      { type: "improved", en: "Calving, heat cycle, dry-off and waiting-period days can now be set by an admin.", bn: "বাচ্চা হওয়া, গরমের চক্র, দুধ শুকানো আর অপেক্ষার দিন এখন অ্যাডমিন ঠিক করতে পারেন।" },
    ],
  },
  {
    id: "2026-10-16-ai",
    date: "2026-10-16",
    title: { en: "AI assistant and vet approvals", bn: "AI সহকারী আর চিকিৎসকের অনুমোদন" },
    summary: {
      en: "Ask the app to record things for you, and keep control of what vets add.",
      bn: "অ্যাপকে দিয়ে হিসাব লিখিয়ে নিন, আর চিকিৎসক যা যোগ করেন তার নিয়ন্ত্রণ নিজের হাতে রাখুন।",
    },
    changes: [
      { type: "new", en: "AI chat assistant that answers questions about your farm and records entries after you confirm.", bn: "AI চ্যাট সহকারী: আপনার খামার নিয়ে প্রশ্নের উত্তর দেয়, আর আপনি নিশ্চিত করলে এন্ট্রি লিখে দেয়।" },
      { type: "new", en: "Entries added by a vet wait for the farm owner's approval before they are saved.", bn: "চিকিৎসকের যোগ করা এন্ট্রি খামার মালিকের অনুমোদনের পরেই সংরক্ষিত হয়।" },
      { type: "new", en: "Install FarmFlows on your phone like an app.", bn: "ফোনে অ্যাপের মতো FarmFlows ইনস্টল করুন।" },
      { type: "improved", en: "The whole app works better on phones: tables scroll sideways with the first column pinned.", bn: "পুরো অ্যাপ ফোনে আরও ভালো চলে: টেবিল পাশে স্ক্রল হয়, প্রথম কলাম আটকে থাকে।" },
      { type: "improved", en: "Tag numbers can be edited; breeding events can have a time of day.", bn: "ট্যাগ নম্বর বদলানো যায়; প্রজননের এন্ট্রিতে সময়ও লেখা যায়।" },
      { type: "new", en: "A blog with guides for farmers.", bn: "খামারিদের জন্য গাইডসহ ব্লগ।" },
    ],
  },
  {
    id: "2026-10-15-records",
    date: "2026-10-15",
    title: { en: "Fix mistakes and keep your records tidy", bn: "ভুল শুধরান, হিসাব গোছানো রাখুন" },
    summary: {
      en: "Edit, archive and delete without losing your history.",
      bn: "ইতিহাস না হারিয়ে এডিট, আর্কাইভ আর মুছে ফেলুন।",
    },
    changes: [
      { type: "new", en: "Archive or delete an animal; edit health and breeding records.", bn: "পশু আর্কাইভ বা মুছে ফেলা; স্বাস্থ্য ও প্রজননের রেকর্ড এডিট।" },
      { type: "improved", en: "A message after every add, update or delete, and a loader while saving.", bn: "প্রতিটি যোগ, বদল বা মোছার পরে বার্তা, আর সংরক্ষণের সময় লোডার।" },
    ],
  },
  {
    id: "2026-10-14-launch",
    date: "2026-10-14",
    title: { en: "FarmFlows begins", bn: "FarmFlows-এর শুরু" },
    summary: {
      en: "The first version: one place for a dairy and layer farm's records, in Bangla and English.",
      bn: "প্রথম সংস্করণ: দুগ্ধ ও লেয়ার খামারের সব রেকর্ড এক জায়গায়, বাংলা ও ইংরেজিতে।",
    },
    changes: [
      { type: "new", en: "Cattle records with parents, milk records, vaccines and treatments with due dates, breeding with calving dates, layer flocks with daily egg, feed and death logs, and income and expenses.", bn: "বাবা-মাসহ পশুর রেকর্ড, দুধের হিসাব, তারিখসহ টিকা ও চিকিৎসা, বাচ্চা হওয়ার তারিখসহ প্রজনন, দৈনিক ডিম-খাবার-মৃত্যুসহ লেয়ার ব্যাচ, আর আয়-ব্যয়।" },
      { type: "new", en: "Farm team with roles, vets who can join your farm, plans, a light and dark theme and an admin panel.", bn: "ভূমিকাসহ খামারের টিম, খামারে যুক্ত হতে পারা চিকিৎসক, প্ল্যান, হালকা ও গাঢ় থিম আর অ্যাডমিন প্যানেল।" },
    ],
  },
];
