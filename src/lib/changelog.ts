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
    title: { en: "Reminders on your phone", bn: "ফোনে রিমাইন্ডার" },
    body: {
      en: "Vaccine due, cow in heat, pregnancy check and calving dates sent to your phone, so you don't have to open the app to find out.",
      bn: "টিকার তারিখ, গরম, গর্ভ পরীক্ষা আর বাচ্চা হওয়ার দিন ফোনে জানানো হবে, অ্যাপ খুলে খুঁজতে হবে না।",
    },
  },
  {
    status: "planned",
    title: { en: "Profit per animal", bn: "প্রতিটি গাভীর লাভ-লোকসান" },
    body: {
      en: "See which cows earn their keep and which cost more than they give: milk, feed, medicine and breeding for each animal.",
      bn: "কোন গাভী লাভ দিচ্ছে আর কোনটা খরচ বেশি করাচ্ছে দেখুন: প্রতিটি পশুর দুধ, খাবার, ওষুধ আর প্রজননের হিসাবে।",
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
