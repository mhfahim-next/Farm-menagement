// Copy for the /farm-management-software guide page. Every text has an English and a Bangla version.

export type Bilingual = { en: string; bn: string };

export const GUIDE = {
  metaTitle: {
    en: "Free Farm Management Software & App for Dairy, Cattle and Poultry Farms",
    bn: "ডেইরি, গবাদিপশু ও পোল্ট্রি খামারের ফ্রি ফার্ম ম্যানেজমেন্ট সফটওয়্যার ও অ্যাপ",
  },
  metaDescription: {
    en: "What a farm management system is, what it should track, how to choose one, and how FarmFlows gives dairy, cattle and layer farms a free farm management app in Bangla and English.",
    bn: "ফার্ম ম্যানেজমেন্ট সিস্টেম কী, কী কী হিসাব রাখা উচিত, কীভাবে বাছবেন, আর FarmFlows কীভাবে ডেইরি, গবাদিপশু ও লেয়ার খামারকে বাংলা ও ইংরেজিতে ফ্রি অ্যাপ দেয়।",
  },
  h1: {
    en: "Free farm management software and app for dairy, cattle and layer farms",
    bn: "ডেইরি, গবাদিপশু ও লেয়ার খামারের জন্য ফ্রি ফার্ম ম্যানেজমেন্ট সফটওয়্যার ও অ্যাপ",
  },
  intro: {
    en: "A farm management system keeps every record of your farm in one place: animals, milk, eggs, vaccines, feed, sales and money. This guide explains what it should do, how it beats a notebook or a spreadsheet, and how to start for free in a few minutes.",
    bn: "ফার্ম ম্যানেজমেন্ট সিস্টেম মানে খামারের সব রেকর্ড এক জায়গায়: পশু, দুধ, ডিম, টিকা, খাবার, বিক্রি আর টাকা। এই লেখায় আছে এর কাজ কী, খাতা বা স্প্রেডশিটের চেয়ে এটা কেন ভালো, আর কয়েক মিনিটে বিনা খরচে কীভাবে শুরু করবেন।",
  },
  whatTitle: { en: "What is a farm management system?", bn: "ফার্ম ম্যানেজমেন্ট সিস্টেম কী?" },
  whatBody: {
    en: "Farm management software (also called a farm management app or a livestock management system) replaces paper registers. You record what happens each day: how much milk each cow gave, how many eggs were collected, which animal was vaccinated, what feed you bought and what you sold. The software then does the work you do by hand: it adds up totals, reminds you when a vaccine or a calving is due, and shows your profit.",
    bn: "ফার্ম ম্যানেজমেন্ট সফটওয়্যার (ফার্ম ম্যানেজমেন্ট অ্যাপ বা লাইভস্টক ম্যানেজমেন্ট সিস্টেমও বলা হয়) কাগজের খাতার জায়গা নেয়। প্রতিদিন যা ঘটে তা লিখে রাখেন: কোন গাভী কত দুধ দিল, কয়টা ডিম পাওয়া গেল, কোন পশুকে টিকা দেওয়া হলো, কী খাবার কিনলেন আর কী বিক্রি করলেন। বাকি হাতের কাজ সফটওয়্যার করে: যোগফল বের করে, টিকা বা বাচ্চা হওয়ার দিন এলে মনে করায়, আর লাভ দেখায়।",
  },
  trackTitle: { en: "What a good farm management app should track", bn: "একটা ভালো ফার্ম ম্যানেজমেন্ট অ্যাপে কী কী থাকা উচিত" },
  track: [
    {
      title: { en: "Cattle and herd records", bn: "গবাদিপশুর রেকর্ড" },
      body: { en: "Tag number, breed, date of birth, mother and father, weight history and status (active, sold, dead).", bn: "ট্যাগ নম্বর, জাত, জন্মতারিখ, বাবা-মা, ওজনের ইতিহাস আর অবস্থা (চালু, বিক্রিত, মৃত)।" },
    },
    {
      title: { en: "Milk records", bn: "দুধের হিসাব" },
      body: { en: "Morning and evening yield per cow, fat percentage, and the total litres for any month.", bn: "প্রতিটি গাভীর সকাল-বিকেলের দুধ, ফ্যাট %, আর যেকোনো মাসের মোট লিটার।" },
    },
    {
      title: { en: "Health and vaccine reminders", bn: "স্বাস্থ্য ও টিকার রিমাইন্ডার" },
      body: { en: "Vaccines, deworming and treatments with the next due date, so no animal misses a dose.", bn: "টিকা, কৃমিনাশক ও চিকিৎসা, পরের তারিখসহ, যাতে কোনো পশুর ডোজ বাদ না পড়ে।" },
    },
    {
      title: { en: "Breeding calendar", bn: "প্রজননের ক্যালেন্ডার" },
      body: { en: "Heat, insemination, pregnancy check, dry-off and expected calving date worked out for you.", bn: "গরম, প্রজনন, গর্ভ পরীক্ষা, দুধ শুকানো আর বাচ্চা হওয়ার সম্ভাব্য তারিখ হিসাব করে দেওয়া।" },
    },
    {
      title: { en: "Layer flocks and egg production", bn: "লেয়ার ব্যাচ ও ডিম উৎপাদন" },
      body: { en: "Daily eggs, broken eggs, deaths, feed and water, with the laying percentage and mortality.", bn: "দৈনিক ডিম, ভাঙা ডিম, মৃত্যু, খাবার আর পানি, সাথে ডিম পাড়ার হার ও মৃত্যুর হার।" },
    },
    {
      title: { en: "Feed and medicine stock", bn: "খাবার ও ওষুধের স্টক" },
      body: { en: "What you bought, what was used, what is left and when to buy again.", bn: "কী কিনলেন, কী খরচ হলো, কী বাকি আছে আর কখন আবার কিনতে হবে।" },
    },
    {
      title: { en: "Sales and buyer dues", bn: "বিক্রি ও ক্রেতার বাকি" },
      body: { en: "Milk, egg and animal sales by buyer, payments received and who still owes you.", bn: "ক্রেতা অনুযায়ী দুধ, ডিম ও পশু বিক্রি, পাওয়া টাকা আর কার কাছে কত বাকি।" },
    },
    {
      title: { en: "Staff, expenses and profit", bn: "কর্মী, খরচ ও লাভ" },
      body: { en: "Attendance, salaries, every expense and the real cost and profit per litre of milk and per egg.", bn: "হাজিরা, বেতন, প্রতিটি খরচ আর প্রতি লিটার দুধ ও প্রতি ডিমের আসল খরচ ও লাভ।" },
    },
  ] as { title: Bilingual; body: Bilingual }[],
  freeTitle: { en: "Why use a free farm management app?", bn: "ফ্রি ফার্ম ম্যানেজমেন্ট অ্যাপ কেন ব্যবহার করবেন?" },
  freeBody: {
    en: "Most farmers start with a notebook. It works until the herd grows: pages are lost, totals are wrong and nobody knows what a litre of milk really costs. A free farm management app lets you move to digital records without paying anything first. The FarmFlows Free plan has no time limit. You upgrade only when your farm grows beyond the Free limits and you need more animals or flocks, more team members or data exports.",
    bn: "বেশিরভাগ খামারি খাতা দিয়ে শুরু করেন। পাল বড় হলে এতে সমস্যা হয়: পাতা হারায়, যোগফল ভুল হয়, আর এক লিটার দুধের আসল খরচ কেউ জানে না। ফ্রি ফার্ম ম্যানেজমেন্ট অ্যাপে আগে কিছু খরচ না করেই ডিজিটাল রেকর্ডে যাওয়া যায়। FarmFlows-এর ফ্রি প্ল্যানের কোনো সময়সীমা নেই। খামার ফ্রি সীমার চেয়ে বড় হলে, আর বেশি পশু বা ব্যাচ, বেশি টিম সদস্য বা ডেটা এক্সপোর্ট দরকার হলেই শুধু আপগ্রেড করবেন।",
  },
  compareTitle: { en: "Notebook vs spreadsheet vs farm management app", bn: "খাতা, স্প্রেডশিট আর ফার্ম ম্যানেজমেন্ট অ্যাপের তুলনা" },
  compareHead: {
    en: ["", "Notebook", "Spreadsheet", "Farm management app"],
    bn: ["", "খাতা", "স্প্রেডশিট", "ফার্ম ম্যানেজমেন্ট অ্যাপ"],
  },
  compareRows: [
    { en: ["Works on a phone in the shed", "Yes", "Hard to use", "Yes, made for phones"], bn: ["গোয়ালে ফোনে চলে", "হ্যাঁ", "ব্যবহার কঠিন", "হ্যাঁ, ফোনের জন্যই বানানো"] },
    { en: ["Totals and charts", "By hand", "You build the formulas", "Automatic"], bn: ["যোগফল ও চার্ট", "হাতে", "ফর্মুলা নিজে বানাতে হয়", "নিজে থেকেই"] },
    { en: ["Vaccine and calving reminders", "You must remember", "You must build them", "Built in"], bn: ["টিকা ও বাচ্চা হওয়ার রিমাইন্ডার", "নিজে মনে রাখতে হয়", "নিজে বানাতে হয়", "আগে থেকেই আছে"] },
    { en: ["Team and vet can add records", "Share one book", "Edits can clash", "Roles and approvals"], bn: ["টিম ও চিকিৎসক রেকর্ড যোগ করতে পারে", "একই খাতা ভাগ করতে হয়", "একসাথে এডিটে ঝামেলা", "ভূমিকা ও অনুমোদন আছে"] },
    { en: ["Safe if the book is lost", "No", "If you back it up", "Yes, in the cloud"], bn: ["খাতা হারালে নিরাপদ", "না", "ব্যাকআপ রাখলে", "হ্যাঁ, ক্লাউডে"] },
    { en: ["Real cost per litre or egg", "Very hard", "Possible, with work", "Shown for you"], bn: ["প্রতি লিটার বা ডিমের আসল খরচ", "খুব কঠিন", "অনেক কাজ করলে সম্ভব", "দেখিয়ে দেয়"] },
  ] as { en: string[]; bn: string[] }[],
  chooseTitle: { en: "How to choose farm management software", bn: "কীভাবে ফার্ম ম্যানেজমেন্ট সফটওয়্যার বাছবেন" },
  choose: [
    { en: "It covers your animals. A dairy farm, a cattle fattening farm and a layer farm need different records.", bn: "আপনার পশুর জন্য উপযুক্ত কি না। ডেইরি, গরু মোটাতাজাকরণ আর লেয়ার খামারের রেকর্ড আলাদা।" },
    { en: "It speaks your language. Bangla forms and Bangla dates mean your staff will actually use it.", bn: "আপনার ভাষায় চলে কি না। বাংলা ফর্ম আর বাংলা তারিখ থাকলে কর্মীরা সত্যিই ব্যবহার করবে।" },
    { en: "It is easy on a phone. If it is slow or hard to type in, records will not be entered.", bn: "ফোনে সহজ কি না। ধীর বা লেখা কঠিন হলে রেকর্ড আর ওঠে না।" },
    { en: "It shows money, not just records: cost per litre, cost per egg, dues from buyers.", bn: "শুধু রেকর্ড নয়, টাকার চিত্রও দেখায় কি না: প্রতি লিটারের খরচ, প্রতি ডিমের খরচ, ক্রেতার বাকি।" },
    { en: "It lets your team and your vet in, with the right permissions.", bn: "ঠিক অনুমতিসহ আপনার টিম আর চিকিৎসককে যুক্ত করা যায় কি না।" },
    { en: "You can start free and move your data out whenever you want.", bn: "বিনা খরচে শুরু করা যায় আর যখন খুশি নিজের ডেটা বের করে নেওয়া যায় কি না।" },
  ] as Bilingual[],
  startTitle: { en: "Start in five minutes", bn: "পাঁচ মিনিটে শুরু করুন" },
  start: [
    { en: "Sign up free with your email or Google account.", bn: "ইমেইল বা Google অ্যাকাউন্ট দিয়ে বিনা খরচে সাইন আপ করুন।" },
    { en: "Create your farm and choose dairy, layer or both.", bn: "খামার তৈরি করে ডেইরি, লেয়ার বা দুটোই বাছুন।" },
    { en: "Add your animals or your first flock.", bn: "পশুগুলো বা প্রথম মুরগির ব্যাচ যোগ করুন।" },
    { en: "Record milk, eggs and feed each day. Vaccines and breeding dates are then tracked for you.", bn: "প্রতিদিন দুধ, ডিম আর খাবার লিখুন। টিকা আর প্রজননের তারিখ অ্যাপই ধরে রাখবে।" },
    { en: "Add what you buy and sell. Your profit per litre and per egg appears by itself.", bn: "যা কেনেন আর বিক্রি করেন তা যোগ করুন। প্রতি লিটার আর প্রতি ডিমের লাভ নিজে থেকেই দেখা যাবে।" },
  ] as Bilingual[],
  faqTitle: { en: "Farm management software: common questions", bn: "ফার্ম ম্যানেজমেন্ট সফটওয়্যার নিয়ে সাধারণ প্রশ্ন" },
  faq: [
    {
      q: { en: "What is a farm management system?", bn: "ফার্ম ম্যানেজমেন্ট সিস্টেম কী?" },
      a: { en: "It is software that keeps all the records of a farm in one place: animals, milk, eggs, health, feed, sales and money. It replaces paper registers, adds up totals for you and reminds you of due dates.", bn: "এটা এমন সফটওয়্যার যা খামারের সব রেকর্ড এক জায়গায় রাখে: পশু, দুধ, ডিম, স্বাস্থ্য, খাবার, বিক্রি আর টাকা। এটা কাগজের খাতার জায়গা নেয়, যোগফল বের করে আর তারিখ মনে করায়।" },
    },
    {
      q: { en: "Is there a free farm management app?", bn: "ফ্রি ফার্ম ম্যানেজমেন্ট অ্যাপ আছে কি?" },
      a: { en: "Yes. FarmFlows has a Free plan with no time limit. It is made for small and medium dairy, cattle and layer farms and works in Bangla and English on any phone.", bn: "হ্যাঁ। FarmFlows-এর ফ্রি প্ল্যানের কোনো সময়সীমা নেই। এটা ছোট ও মাঝারি ডেইরি, গবাদিপশু ও লেয়ার খামারের জন্য, আর যেকোনো ফোনে বাংলা ও ইংরেজিতে চলে।" },
    },
    {
      q: { en: "Which farm management software suits dairy farms in Bangladesh?", bn: "বাংলাদেশের ডেইরি খামারের জন্য কোন ফার্ম ম্যানেজমেন্ট সফটওয়্যার উপযুক্ত?" },
      a: { en: "Look for Bangla support, a phone-friendly design, milk and breeding records, vaccine reminders and a way to see your cost per litre. FarmFlows was built for these needs.", bn: "বাংলা ভাষা, ফোনে সহজ ডিজাইন, দুধ ও প্রজননের রেকর্ড, টিকার রিমাইন্ডার আর প্রতি লিটারের খরচ দেখার সুবিধা আছে কি না দেখুন। FarmFlows এই প্রয়োজনগুলো মাথায় রেখেই বানানো।" },
    },
    {
      q: { en: "Can I use it for a poultry or layer farm?", bn: "পোল্ট্রি বা লেয়ার খামারে কি ব্যবহার করা যায়?" },
      a: { en: "Yes. Record daily eggs, broken eggs, deaths, feed and water for each flock, track vaccines, and see the laying percentage and the cost per egg.", bn: "হ্যাঁ। প্রতিটি ব্যাচের দৈনিক ডিম, ভাঙা ডিম, মৃত্যু, খাবার ও পানি লিখুন, টিকা ধরে রাখুন, আর ডিম পাড়ার হার ও প্রতি ডিমের খরচ দেখুন।" },
    },
    {
      q: { en: "Do I need internet all the time?", bn: "সবসময় কি ইন্টারনেট লাগবে?" },
      a: { en: "You need a connection to save records. Entering records without a connection is on our roadmap; see What's new.", bn: "রেকর্ড সংরক্ষণ করতে ইন্টারনেট লাগে। ইন্টারনেট ছাড়া এন্ট্রি আমাদের পরিকল্পনায় আছে; \"নতুন কী\" পাতায় দেখুন।" },
    },
    {
      q: { en: "Is my farm data private?", bn: "আমার খামারের তথ্য কি গোপন থাকে?" },
      a: { en: "Yes. Your records are visible only to the people you add to your farm, and your vet cannot see your finances.", bn: "হ্যাঁ। আপনার রেকর্ড শুধু আপনার যোগ করা মানুষেরাই দেখতে পান, আর আপনার চিকিৎসক আপনার টাকার হিসাব দেখতে পান না।" },
    },
  ] as { q: Bilingual; a: Bilingual }[],
  ctaTitle: { en: "Try the free farm management app", bn: "ফ্রি ফার্ম ম্যানেজমেন্ট অ্যাপ চালিয়ে দেখুন" },
  ctaBody: { en: "Create your farm in minutes. No card needed.", bn: "কয়েক মিনিটে খামার তৈরি করুন। কার্ড লাগবে না।" },
};
