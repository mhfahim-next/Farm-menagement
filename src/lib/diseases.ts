// Common livestock and poultry diseases in Bangladesh: what they look like,
// what to do at once, and how to prevent them, in Bangla and English. Plus a
// symptom checker that lists the diseases that best fit what the farmer sees.
// Pure data and functions with no imports, so the app keeps an exact copy
// (mobile/src/lib/diseases.ts). This is a guide, not a diagnosis: every page
// tells the farmer to call a vet, and no medicine doses are given.

export type Bi = { en: string; bn: string };
export type DiseaseSpecies = "cattle" | "goat" | "poultry";
export const DISEASE_SPECIES: DiseaseSpecies[] = ["cattle", "goat", "poultry"];

/** Signs a farmer can see, used by the checker. `species` = where the sign is asked about. */
export const SYMPTOMS = {
  fever: { species: ["cattle", "goat", "poultry"], en: "Fever (hot body, ears or horns)", bn: "জ্বর (শরীর, কান বা শিং গরম)" },
  off_feed: { species: ["cattle", "goat", "poultry"], en: "Eats little or stops eating", bn: "খাওয়া কমে গেছে বা বন্ধ" },
  dull: { species: ["cattle", "goat", "poultry"], en: "Dull, weak, stays apart", bn: "ঝিমায়, দুর্বল, আলাদা থাকে" },
  sudden_death: { species: ["cattle", "goat", "poultry"], en: "Sudden deaths", bn: "হঠাৎ মারা যাচ্ছে" },
  weight_loss: { species: ["cattle", "goat", "poultry"], en: "Getting thin", bn: "শুকিয়ে যাচ্ছে" },
  milk_drop: { species: ["cattle", "goat"], en: "Milk has dropped", bn: "দুধ কমে গেছে" },
  drooling: { species: ["cattle", "goat"], en: "Drooling, ropy saliva", bn: "মুখ দিয়ে লালা পড়ছে" },
  mouth_sores: { species: ["cattle", "goat", "poultry"], en: "Sores in the mouth, lips or tongue", bn: "মুখ, ঠোঁট বা জিভে ঘা / ফোসকা" },
  hoof_sores: { species: ["cattle", "goat"], en: "Sores between the hooves", bn: "খুরের ফাঁকে ঘা" },
  lame: { species: ["cattle", "goat"], en: "Limping", bn: "খুঁড়িয়ে হাঁটে" },
  skin_lumps: { species: ["cattle", "goat"], en: "Round lumps or nodules on the skin", bn: "চামড়ায় গোল গুটি / চাকা" },
  skin_sores: { species: ["cattle", "goat"], en: "Itchy skin, crusts or hair falling out", bn: "চামড়া চুলকায়, খসখসে বা লোম পড়ে যাচ্ছে" },
  cough: { species: ["cattle", "goat", "poultry"], en: "Coughing", bn: "কাশি" },
  breathing_hard: { species: ["cattle", "goat", "poultry"], en: "Hard or noisy breathing", bn: "শ্বাসকষ্ট বা ঘড়ঘড় শব্দ" },
  nasal_discharge: { species: ["cattle", "goat", "poultry"], en: "Runny nose", bn: "নাক দিয়ে পানি / সর্দি" },
  eye_discharge: { species: ["cattle", "goat", "poultry"], en: "Watery or sticky eyes", bn: "চোখ দিয়ে পানি / পিঁচুটি" },
  throat_swelling: { species: ["cattle"], en: "Swollen throat or neck", bn: "গলা বা ঘাড় ফোলা" },
  diarrhoea: { species: ["cattle", "goat", "poultry"], en: "Diarrhoea (loose dung)", bn: "পাতলা পায়খানা" },
  bloody_dung: { species: ["cattle", "goat", "poultry"], en: "Blood in the dung", bn: "পায়খানায় রক্ত" },
  bloat: { species: ["cattle", "goat"], en: "Belly blown up, mostly on the left", bn: "পেট ফাঁপা, বিশেষ করে বাম দিকে" },
  udder_swollen: { species: ["cattle", "goat"], en: "Udder swollen, hot, hard or painful", bn: "ওলান ফোলা, গরম, শক্ত বা ব্যথা" },
  milk_clots: { species: ["cattle", "goat"], en: "Clots, blood or watery milk", bn: "দুধে ছানা, রক্ত বা পানির মতো দুধ" },
  leg_swelling: { species: ["cattle"], en: "Swollen leg muscle that crackles", bn: "পা বা কাঁধের মাংস ফোলা, চাপে মচমচ শব্দ" },
  cant_stand: { species: ["cattle", "goat"], en: "Can't get up", bn: "উঠে দাঁড়াতে পারে না" },
  trembling: { species: ["cattle", "goat", "poultry"], en: "Trembling, fits or paddling legs", bn: "কাঁপুনি, খিঁচুনি বা পা ছোড়াছুড়ি" },
  red_urine: { species: ["cattle"], en: "Red or coffee-coloured urine", bn: "লাল বা কফি রঙের প্রস্রাব" },
  pale_eyes: { species: ["cattle", "goat"], en: "Pale or yellow inside the eyelids", bn: "চোখের ভেতরটা ফ্যাকাশে বা হলুদ" },
  ticks: { species: ["cattle", "goat"], en: "Many ticks on the body", bn: "গায়ে অনেক আঁটালি" },
  abortion: { species: ["cattle", "goat"], en: "Abortion (late pregnancy)", bn: "গর্ভপাত (গর্ভের শেষ দিকে)" },
  retained_placenta: { species: ["cattle", "goat"], en: "Afterbirth not passed", bn: "বাচ্চা দেওয়ার পর ফুল পড়েনি" },
  bleeding_openings: { species: ["cattle", "goat"], en: "Dark blood from nose, mouth or anus", bn: "নাক, মুখ বা মলদ্বারে কালো রক্ত" },
  twisted_neck: { species: ["poultry"], en: "Twisted neck, walking in circles", bn: "ঘাড় বাঁকা, ঘুরে ঘুরে চলে" },
  green_dung: { species: ["poultry"], en: "Green, watery droppings", bn: "সবুজ পাতলা পায়খানা" },
  white_dung: { species: ["poultry"], en: "White, chalky droppings", bn: "চুনের মতো সাদা পায়খানা" },
  egg_drop: { species: ["poultry"], en: "Fewer eggs, soft or odd shells", bn: "ডিম কমে গেছে, নরম বা বিকৃত খোসা" },
  comb_blue: { species: ["poultry"], en: "Comb and wattles bluish", bn: "ঝুঁটি ও গলকম্বল নীলচে" },
  face_swelling: { species: ["poultry"], en: "Swollen face, eyes or wattles", bn: "মুখ, চোখ বা গলকম্বল ফোলা" },
  comb_scabs: { species: ["poultry"], en: "Warts or scabs on the comb and face", bn: "ঝুঁটি ও মুখে গুটি বা খোস" },
} satisfies Record<string, Bi & { species: DiseaseSpecies[] }>;
export type SymptomId = keyof typeof SYMPTOMS;

export type Disease = {
  slug: string;
  species: DiseaseSpecies[];
  name: Bi;
  /** Other names farmers use. */
  aka?: Bi;
  /** Call a vet at once: it kills fast or spreads fast. */
  urgent: boolean;
  /** Can pass to people. */
  zoonotic: boolean;
  /** Must be reported to the Upazila Livestock Office. */
  report?: boolean;
  /** A vaccine is available in Bangladesh. */
  vaccine: boolean;
  symptoms: SymptomId[];
  summary: Bi;
  signs: Bi[];
  todo: Bi[];
  prevent: Bi[];
};

const b = (en: string, bn: string): Bi => ({ en, bn });

const VET = b("Call a vet or the Upazila Livestock Office.", "ডাক্তার বা উপজেলা প্রাণিসম্পদ অফিসে যোগাযোগ করুন।");
const ISOLATE = b("Keep the sick animal apart from the others.", "অসুস্থ পশুকে অন্যদের থেকে আলাদা রাখুন।");
const WATER = b("Give clean drinking water and soft feed.", "পরিষ্কার খাবার পানি আর নরম খাবার দিন।");
const NO_SELF = b("Don't give antibiotics or other medicine on your own; follow the vet.", "নিজে থেকে অ্যান্টিবায়োটিক বা অন্য ওষুধ দেবেন না; ডাক্তারের পরামর্শ মানুন।");
const CLEAN = b("Clean and disinfect the shed, pots and tools; limit visitors.", "শেড, পাত্র আর যন্ত্রপাতি পরিষ্কার ও জীবাণুমুক্ত করুন; বাইরের লোক আসা কমান।");
const NEW_ANIMALS = b("Keep new animals apart for 2–3 weeks before mixing them.", "নতুন পশু কিনে ২–৩ সপ্তাহ আলাদা রেখে তারপর মেশান।");
const BURY = b("Bury dead animals or birds deep with lime, away from water; don't sell or eat them.", "মৃত পশু বা পাখি চুন দিয়ে গভীর গর্তে, পানির উৎস থেকে দূরে পুঁতে ফেলুন; বিক্রি করবেন না, খাবেন না।");

export const DISEASES: Disease[] = [
  {
    slug: "foot-and-mouth-disease",
    species: ["cattle", "goat"],
    name: b("Foot-and-mouth disease (FMD)", "ক্ষুরা রোগ (এফএমডি)"),
    aka: b("Khura rog", "খুরা রোগ, বাতা"),
    urgent: true,
    zoonotic: false,
    vaccine: true,
    symptoms: ["fever", "drooling", "mouth_sores", "hoof_sores", "lame", "milk_drop", "off_feed"],
    summary: b(
      "A fast-spreading virus of cattle, goats and sheep. Few adults die, but milk falls sharply and young calves can die suddenly.",
      "গরু, ছাগল ও ভেড়ার দ্রুত ছড়ানো ভাইরাসজনিত রোগ। বড় পশু কম মারা যায়, কিন্তু দুধ অনেক কমে যায় আর ছোট বাছুর হঠাৎ মারা যেতে পারে।",
    ),
    signs: [
      b("High fever, then blisters on the tongue, gums and between the hooves", "বেশি জ্বর, তারপর জিভ, মাড়ি আর খুরের ফাঁকে ফোসকা"),
      b("Ropy saliva hanging from the mouth, smacking of lips", "মুখ থেকে সুতার মতো লালা ঝোলে, ঠোঁট চাটে"),
      b("Limping; may not stand; milk drops", "খুঁড়িয়ে হাঁটে, দাঁড়াতে চায় না; দুধ কমে যায়"),
    ],
    todo: [
      ISOLATE,
      b("Wash mouth and feet sores with clean water mixed with a little potassium permanganate (light pink) or alum water.", "মুখ ও খুরের ঘা হালকা গোলাপি পটাশ (পটাশিয়াম পারম্যাঙ্গানেট) পানি বা ফিটকিরি পানি দিয়ে ধুয়ে দিন।"),
      b("Give soft feed (soaked bran, green grass) and keep flies off the feet.", "নরম খাবার (ভেজানো ভুসি, কাঁচা ঘাস) দিন আর খুরের ঘায়ে মাছি বসতে দেবেন না।"),
      b("Feed calves boiled and cooled milk, not from a sick cow's udder if you can.", "সম্ভব হলে বাছুরকে অসুস্থ গাভীর ওলান থেকে সরাসরি দুধ না খাইয়ে ফুটিয়ে ঠান্ডা করা দুধ দিন।"),
      VET,
    ],
    prevent: [
      b("Vaccinate every 6 months (all cattle, goats and sheep over 4 months).", "প্রতি ৬ মাস পর পর টিকা দিন (৪ মাসের বেশি বয়সী সব গরু, ছাগল, ভেড়া)।"),
      NEW_ANIMALS,
      CLEAN,
    ],
  },
  {
    slug: "lumpy-skin-disease",
    species: ["cattle"],
    name: b("Lumpy skin disease (LSD)", "লাম্পি স্কিন ডিজিজ (এলএসডি)"),
    aka: b("Lumpy", "লাম্পি, চর্মরোগ"),
    urgent: true,
    zoonotic: false,
    vaccine: true,
    symptoms: ["fever", "skin_lumps", "milk_drop", "off_feed", "nasal_discharge", "eye_discharge", "lame"],
    summary: b(
      "A virus spread by mosquitoes, flies and ticks. Firm round lumps appear all over the skin; milk and weight fall for weeks.",
      "মশা, মাছি ও আঁটালির মাধ্যমে ছড়ানো ভাইরাস। সারা গায়ে শক্ত গোল গুটি ওঠে; কয়েক সপ্তাহ দুধ আর ওজন কমে যায়।",
    ),
    signs: [
      b("Fever, then hard round lumps 1–5 cm on the skin", "জ্বর, তারপর চামড়ায় ১–৫ সেমি শক্ত গোল গুটি"),
      b("Watery eyes and nose; swollen legs or brisket", "চোখ-নাক দিয়ে পানি; পা বা বুকের নিচে ফোলা"),
      b("Lumps may burst and leave wounds that attract flies", "গুটি ফেটে ঘা হতে পারে, তাতে মাছি বসে"),
    ],
    todo: [
      ISOLATE,
      b("Use a mosquito net and keep flies off; clean open wounds and keep them dry.", "মশারি দিন আর মাছি তাড়ান; খোলা ঘা পরিষ্কার ও শুকনো রাখুন।"),
      WATER,
      VET,
    ],
    prevent: [
      b("Vaccinate every year (the goat pox vaccine is used in Bangladesh).", "প্রতি বছর টিকা দিন (বাংলাদেশে ছাগলের বসন্তের টিকা ব্যবহার করা হয়)।"),
      b("Control mosquitoes, flies and ticks around the shed.", "শেডের আশেপাশে মশা, মাছি ও আঁটালি নিয়ন্ত্রণ করুন।"),
      NEW_ANIMALS,
    ],
  },
  {
    slug: "haemorrhagic-septicaemia",
    species: ["cattle"],
    name: b("Haemorrhagic septicaemia (HS)", "গলাফোলা রোগ (এইচএস)"),
    urgent: true,
    zoonotic: false,
    vaccine: true,
    symptoms: ["fever", "throat_swelling", "breathing_hard", "drooling", "sudden_death", "off_feed"],
    summary: b(
      "A bacterial disease of cattle and buffalo, worst in the rainy season. It kills within a day or two without quick treatment.",
      "গরু ও মহিষের ব্যাকটেরিয়াজনিত রোগ, বর্ষায় বেশি হয়। দ্রুত চিকিৎসা না পেলে এক-দুই দিনের মধ্যে মারা যায়।",
    ),
    signs: [
      b("High fever, then a hot painful swelling of the throat and neck", "বেশি জ্বর, তারপর গলা ও ঘাড়ে গরম ব্যথাযুক্ত ফোলা"),
      b("Hard, noisy breathing with the tongue out; drooling", "জিভ বের করে কষ্ট করে, শব্দ করে শ্বাস নেয়; লালা পড়ে"),
      b("Often found dead with little warning", "প্রায়ই হঠাৎ মৃত অবস্থায় পাওয়া যায়"),
    ],
    todo: [b("Call a vet at once: treatment works only in the first hours.", "এখনই ডাক্তার ডাকুন: প্রথম কয়েক ঘণ্টার মধ্যে চিকিৎসা দিলে কাজ হয়।"), ISOLATE, NO_SELF, BURY],
    prevent: [
      b("Vaccinate before the rains, usually every 6 months (oil vaccine once a year).", "বর্ষার আগে টিকা দিন, সাধারণত প্রতি ৬ মাস পর পর (তেলযুক্ত টিকা বছরে একবার)।"),
      b("Avoid crowding and long transport in wet, hot weather.", "গরম-ভেজা আবহাওয়ায় গাদাগাদি আর দীর্ঘ পরিবহন এড়িয়ে চলুন।"),
    ],
  },
  {
    slug: "black-quarter",
    species: ["cattle"],
    name: b("Black quarter (BQ)", "বাদলা রোগ (বিকিউ)"),
    urgent: true,
    zoonotic: false,
    vaccine: true,
    symptoms: ["fever", "leg_swelling", "lame", "sudden_death", "off_feed", "dull"],
    summary: b(
      "A bacterial disease of young, well-fed cattle (6 months to 2 years). A leg muscle swells with gas; most die within 1–2 days.",
      "৬ মাস থেকে ২ বছরের সুস্থ-সবল গরুর ব্যাকটেরিয়াজনিত রোগ। পায়ের মাংসে গ্যাস জমে ফুলে যায়; বেশিরভাগ ১–২ দিনে মারা যায়।",
    ),
    signs: [
      b("Sudden lameness with a swollen hind leg, shoulder or neck", "হঠাৎ খোঁড়ানো, পেছনের পা, কাঁধ বা ঘাড় ফোলা"),
      b("The swelling crackles under your hand; later cold and painless", "ফোলা জায়গায় হাত দিলে মচমচ শব্দ; পরে ঠান্ডা ও ব্যথাহীন"),
      b("High fever, then sudden death", "বেশি জ্বর, তারপর হঠাৎ মৃত্যু"),
    ],
    todo: [b("Call a vet at once.", "এখনই ডাক্তার ডাকুন।"), b("Don't cut open the swelling or the carcass: the germ lives in the soil for years.", "ফোলা জায়গা বা মৃতদেহ কাটবেন না: জীবাণু বহু বছর মাটিতে বেঁচে থাকে।"), BURY],
    prevent: [b("Vaccinate calves from 6 months and every year until 3 years old.", "বাছুরকে ৬ মাস বয়স থেকে টিকা দিন, ৩ বছর পর্যন্ত প্রতি বছর।"), b("Burn or deep-bury carcasses; don't graze where animals died of BQ.", "মৃতদেহ পুড়িয়ে বা গভীরে পুঁতে ফেলুন; যেখানে বাদলায় পশু মরেছে সেখানে চরাবেন না।")],
  },
  {
    slug: "anthrax",
    species: ["cattle", "goat"],
    name: b("Anthrax", "তড়কা রোগ (অ্যানথ্রাক্স)"),
    urgent: true,
    zoonotic: true,
    report: true,
    vaccine: true,
    symptoms: ["sudden_death", "bleeding_openings", "fever", "trembling", "breathing_hard"],
    summary: b(
      "A deadly bacterial disease that also infects people through meat, skin and blood. Animals are often found dead with dark blood at the nose and anus.",
      "মারাত্মক ব্যাকটেরিয়াজনিত রোগ, যা মাংস, চামড়া আর রক্তের মাধ্যমে মানুষেরও হয়। পশু প্রায়ই মৃত পাওয়া যায়, নাক ও মলদ্বারে কালো রক্ত থাকে।",
    ),
    signs: [
      b("Sudden death; the body swells fast and doesn't stiffen", "হঠাৎ মৃত্যু; দেহ দ্রুত ফুলে যায়, শক্ত হয় না"),
      b("Dark, tarry blood that doesn't clot from the nose, mouth or anus", "নাক, মুখ বা মলদ্বার দিয়ে জমাট না বাঁধা কালো আলকাতরার মতো রক্ত"),
      b("If alive: very high fever, trembling, hard breathing", "বেঁচে থাকলে: খুব বেশি জ্বর, কাঁপুনি, শ্বাসকষ্ট"),
    ],
    todo: [
      b("Never open, skin, slaughter or eat the animal: you can catch anthrax.", "কখনো মৃত পশু কাটবেন না, চামড়া ছাড়াবেন না, জবাই করবেন না, খাবেন না: আপনারও তড়কা হতে পারে।"),
      b("Tell the Upazila Livestock Office at once; it must be reported.", "এখনই উপজেলা প্রাণিসম্পদ অফিসে জানান; এটা জানানো বাধ্যতামূলক।"),
      b("Bury at least 2 m deep with lime, where it died; anyone with a skin sore after touching should see a doctor.", "যেখানে মরেছে সেখানেই কমপক্ষে ২ মিটার গভীরে চুন দিয়ে পুঁতে ফেলুন; ছোঁয়ার পর কারও চামড়ায় ঘা হলে ডাক্তার দেখান।"),
    ],
    prevent: [b("Vaccinate cattle, goats and sheep every year, especially in areas with past cases.", "প্রতি বছর গরু, ছাগল, ভেড়াকে টিকা দিন, বিশেষ করে যেসব এলাকায় আগে হয়েছে।"), b("Never buy or eat meat from an animal that died suddenly.", "হঠাৎ মারা যাওয়া পশুর মাংস কখনো কিনবেন না, খাবেন না।")],
  },
  {
    slug: "mastitis",
    species: ["cattle", "goat"],
    name: b("Mastitis", "ওলান প্রদাহ (ম্যাস্টাইটিস)"),
    aka: b("Olan paka", "ওলান পাকা, ওলান ফোলা"),
    urgent: false,
    zoonotic: false,
    vaccine: false,
    symptoms: ["udder_swollen", "milk_clots", "milk_drop", "fever", "off_feed"],
    summary: b("Infection of the udder, the costliest disease of milking cows. Often starts hidden, with only a drop in milk.", "ওলানের সংক্রমণ, দুধের গাভীর সবচেয়ে খরচের রোগ। প্রায়ই চুপিচুপি শুরু হয়, শুধু দুধ কমে।"),
    signs: [
      b("A quarter swollen, hot, hard or painful", "ওলানের একটা ভাগ ফোলা, গরম, শক্ত বা ব্যথা"),
      b("Clots, flakes, blood or watery milk (check the first squirts on a dark cloth)", "দুধে ছানা, দানা, রক্ত বা পানির মতো দুধ (প্রথম কয়েক ফোঁটা কালো কাপড়ে দেখুন)"),
      b("Sometimes fever and off feed", "কখনো জ্বর আর খাওয়া কমে"),
    ],
    todo: [
      b("Milk the bad quarter out fully, often, and last; throw that milk away.", "আক্রান্ত বাঁট শেষে, বারবার আর পুরোপুরি দুইয়ে ফেলুন; সেই দুধ ফেলে দিন।"),
      b("Call a vet: treatment depends on the germ; keep milk out of sale for the withdrawal days.", "ডাক্তার ডাকুন: জীবাণু বুঝে চিকিৎসা লাগে; ওষুধের পর নির্দিষ্ট দিন দুধ বিক্রি করবেন না।"),
      NO_SELF,
    ],
    prevent: [
      b("Clean, dry floor; wash and dry teats before milking; dip teats after.", "মেঝে পরিষ্কার ও শুকনো রাখুন; দোহানোর আগে বাঁট ধুয়ে মুছুন, পরে বাঁট ডুবিয়ে জীবাণুমুক্ত করুন।"),
      b("Milk fully with clean, dry hands; let the cow stand 30 minutes after milking (give feed).", "পরিষ্কার শুকনো হাতে পুরো দুধ দোহান; দোহানোর পর ৩০ মিনিট গাভীকে দাঁড় করিয়ে রাখুন (খাবার দিন)।"),
      b("Test with CMT/California test every month; treat cows at dry-off as your vet advises.", "প্রতি মাসে সিএমটি টেস্ট করুন; দুধ বন্ধের সময় ডাক্তারের পরামর্শে চিকিৎসা দিন।"),
    ],
  },
  {
    slug: "milk-fever",
    species: ["cattle", "goat"],
    name: b("Milk fever (low calcium)", "দুধ জ্বর (ক্যালসিয়ামের অভাব)"),
    urgent: true,
    zoonotic: false,
    vaccine: false,
    symptoms: ["cant_stand", "trembling", "off_feed", "dull"],
    summary: b(
      "Low blood calcium in high-yielding cows, usually within 3 days of calving. Despite the name the body is cold, not hot. Without calcium she can die.",
      "বেশি দুধের গাভীর রক্তে ক্যালসিয়াম কমে যাওয়া, সাধারণত বাচ্চা দেওয়ার ৩ দিনের মধ্যে। নাম জ্বর হলেও শরীর ঠান্ডা থাকে। ক্যালসিয়াম না পেলে মারা যেতে পারে।",
    ),
    signs: [
      b("Shaky, wobbly walk, then lies down and can't get up", "টলমল করে হাঁটে, তারপর শুয়ে পড়ে, উঠতে পারে না"),
      b("Head turned towards the flank; cold ears; dry dung", "মাথা পেটের দিকে বাঁকানো; কান ঠান্ডা; শুকনো গোবর"),
      b("Usually in the first days after calving", "সাধারণত বাচ্চা দেওয়ার পর প্রথম কয়েক দিনে"),
    ],
    todo: [
      b("Call a vet at once: calcium is given into the vein by a vet.", "এখনই ডাক্তার ডাকুন: ডাক্তার শিরায় ক্যালসিয়াম দেন।"),
      b("Prop her up on her chest (not flat on the side) with straw bales; don't force-feed liquid.", "খড়ের বস্তা দিয়ে বুকে ভর দিয়ে বসিয়ে রাখুন (কাত করে শোয়াবেন না); জোর করে তরল খাওয়াবেন না।"),
    ],
    prevent: [
      b("Don't overfeed calcium in the last weeks before calving; keep cows not too fat.", "বাচ্চা দেওয়ার আগের সপ্তাহগুলোতে বেশি ক্যালসিয়াম দেবেন না; গাভীকে বেশি মোটা হতে দেবেন না।"),
      b("Don't milk out completely for the first 2–3 days after calving.", "বাচ্চা দেওয়ার পর প্রথম ২–৩ দিন পুরো দুধ দোহাবেন না।"),
    ],
  },
  {
    slug: "bloat",
    species: ["cattle", "goat"],
    name: b("Bloat", "পেট ফাঁপা"),
    urgent: true,
    zoonotic: false,
    vaccine: false,
    symptoms: ["bloat", "breathing_hard", "off_feed", "dull"],
    summary: b(
      "Gas trapped in the rumen, after eating a lot of young legumes, wet grass or grain. The left side swells and the animal can die within hours.",
      "বেশি কচি ডালজাতীয় ঘাস, ভেজা ঘাস বা দানা খেয়ে রুমেনে গ্যাস আটকে যাওয়া। বাম পাশ ফুলে ওঠে, কয়েক ঘণ্টায় মারা যেতে পারে।",
    ),
    signs: [b("Left side of the belly swollen high and tight like a drum", "পেটের বাম পাশ ঢোলের মতো উঁচু ও টানটান"), b("Kicks at the belly, gets up and down, breathes with the mouth open", "পেটে লাথি মারে, ওঠে-বসে, মুখ খুলে শ্বাস নেয়")],
    todo: [
      b("Stop feeding; keep the animal standing and walking, front feet higher than the back.", "খাওয়ানো বন্ধ করুন; পশুকে দাঁড় করিয়ে হাঁটান, সামনের পা পেছনের চেয়ে উঁচুতে রাখুন।"),
      b("Call a vet at once if breathing is hard; the vet may pass a tube or release the gas.", "শ্বাসকষ্ট হলে এখনই ডাক্তার ডাকুন; ডাক্তার নল দিয়ে বা ছিদ্র করে গ্যাস বের করতে পারেন।"),
    ],
    prevent: [b("Wilt young legumes and wet grass before feeding; change feed slowly.", "কচি ডালজাতীয় ও ভেজা ঘাস একটু শুকিয়ে খাওয়ান; খাবার ধীরে ধীরে বদলান।"), b("Give straw before green feed and grain; don't give a lot of grain at once.", "কাঁচা ঘাস ও দানার আগে খড় দিন; একবারে বেশি দানা দেবেন না।")],
  },
  {
    slug: "tick-fever-babesiosis",
    species: ["cattle"],
    name: b("Tick fever (babesiosis)", "আঁটালি জ্বর (বেবিসিওসিস)"),
    aka: b("Red water", "রক্ত প্রস্রাব"),
    urgent: true,
    zoonotic: false,
    vaccine: false,
    symptoms: ["fever", "red_urine", "pale_eyes", "ticks", "milk_drop", "weight_loss", "dull"],
    summary: b("A blood parasite spread by ticks, worst in crossbred cows. It destroys red blood cells, so urine turns red.", "আঁটালির মাধ্যমে ছড়ানো রক্তের পরজীবী, শংকর গাভীতে বেশি হয়। রক্তের লোহিত কণিকা নষ্ট করে, তাই প্রস্রাব লাল হয়ে যায়।"),
    signs: [b("High fever, many ticks on the body", "বেশি জ্বর, গায়ে অনেক আঁটালি"), b("Red or coffee-coloured urine; pale or yellow eyes", "লাল বা কফি রঙের প্রস্রাব; চোখ ফ্যাকাশে বা হলুদ"), b("Sudden fall in milk; weakness", "হঠাৎ দুধ কমে যাওয়া; দুর্বলতা")],
    todo: [b("Call a vet: there are injections that work if given early.", "ডাক্তার ডাকুন: আগে দিলে কাজ করে এমন ইনজেকশন আছে।"), b("Keep her in shade with water; don't make her walk far.", "ছায়ায় পানি দিয়ে রাখুন; বেশি হাঁটাবেন না।")],
    prevent: [b("Control ticks: spray or pour-on as your vet advises, clean the shed cracks.", "আঁটালি নিয়ন্ত্রণ করুন: ডাক্তারের পরামর্শে স্প্রে বা পোর-অন দিন, শেডের ফাটল পরিষ্কার করুন।"), b("Check crossbred cows for ticks every week.", "শংকর গাভীর গায়ে প্রতি সপ্তাহে আঁটালি দেখুন।")],
  },
  {
    slug: "worms",
    species: ["cattle", "goat"],
    name: b("Worms (internal parasites)", "কৃমি (পেটের পরজীবী)"),
    urgent: false,
    zoonotic: false,
    vaccine: false,
    symptoms: ["weight_loss", "diarrhoea", "pale_eyes", "dull", "milk_drop", "off_feed"],
    summary: b("Stomach, gut and liver worms are common in grazing animals and slowly steal milk, growth and money.", "পাকস্থলী, অন্ত্র আর কলিজার কৃমি চরে বেড়ানো পশুতে খুব সাধারণ, ধীরে ধীরে দুধ, বৃদ্ধি আর টাকা নষ্ট করে।"),
    signs: [b("Rough coat, thin despite eating, pot belly in young ones", "লোম খসখসে, খেয়েও রোগা, বাচ্চাদের পেট বড়"), b("Pale eyes; swelling under the jaw (bottle jaw) in goats", "চোখ ফ্যাকাশে; ছাগলের চোয়ালের নিচে ফোলা"), b("Loose dung", "পাতলা পায়খানা")],
    todo: [b("Ask your vet which dewormer to use and the dose by weight.", "কোন কৃমির ওষুধ আর ওজন অনুযায়ী কত মাত্রা, ডাক্তারকে জিজ্ঞেস করুন।"), b("Weigh the animal (use the tape tool) so the dose is right.", "সঠিক মাত্রার জন্য পশুর ওজন নিন (ফিতার টুল ব্যবহার করুন)।")],
    prevent: [b("Deworm every 3–4 months, and before and after the rains.", "প্রতি ৩–৪ মাস পর পর, আর বর্ষার আগে ও পরে কৃমির ওষুধ দিন।"), b("Don't graze low wet land early in the morning; keep the shed dry.", "সকালে নিচু ভেজা জমিতে চরাবেন না; শেড শুকনো রাখুন।"), b("Record each dose: FarmFlows reminds you when the next is due.", "প্রতিটা ডোজ লিখে রাখুন: পরেরটা কবে, FarmFlows মনে করিয়ে দেবে।")],
  },
  {
    slug: "calf-diarrhoea",
    species: ["cattle", "goat"],
    name: b("Calf and kid diarrhoea (scours)", "বাছুর ও ছাগলছানার ডায়রিয়া"),
    urgent: true,
    zoonotic: false,
    vaccine: false,
    symptoms: ["diarrhoea", "dull", "off_feed", "weight_loss", "bloody_dung"],
    summary: b("The commonest killer of calves in the first weeks. Death is mostly from losing water and salts, so fluids come first.", "জন্মের প্রথম কয়েক সপ্তাহে বাছুর মারা যাওয়ার প্রধান কারণ। মূলত পানি আর লবণ বেরিয়ে গিয়ে মারা যায়, তাই আগে তরল দিন।"),
    signs: [b("Watery yellow, white or bloody dung, soiled tail", "পানির মতো হলুদ, সাদা বা রক্ত মেশানো পায়খানা, লেজ নোংরা"), b("Sunken eyes, skin stays up when pinched, weak suckling", "চোখ বসে যায়, চামড়া টেনে ছাড়লে উঠে থাকে, দুধ কম টানে")],
    todo: [
      b("Give oral saline (ORS) 3–4 times a day between milk feeds; keep feeding milk.", "দুধ খাওয়ানোর মাঝে দিনে ৩–৪ বার খাবার স্যালাইন দিন; দুধ খাওয়ানো বন্ধ করবেন না।"),
      b("Keep the calf warm and dry; call a vet if it can't stand, has blood in dung or is cold.", "বাছুরকে গরম ও শুকনো রাখুন; দাঁড়াতে না পারলে, রক্ত গেলে বা শরীর ঠান্ডা হলে ডাক্তার ডাকুন।"),
    ],
    prevent: [b("Make sure every calf drinks colostrum (first milk) within 2 hours of birth.", "জন্মের ২ ঘণ্টার মধ্যে প্রতিটা বাছুর যেন শাল দুধ খায় তা নিশ্চিত করুন।"), b("Clean calving place and clean feeding buckets.", "বাচ্চা দেওয়ার জায়গা আর দুধ খাওয়ানোর বালতি পরিষ্কার রাখুন।")],
  },
  {
    slug: "pneumonia",
    species: ["cattle", "goat"],
    name: b("Pneumonia", "নিউমোনিয়া"),
    urgent: false,
    zoonotic: false,
    vaccine: false,
    symptoms: ["fever", "cough", "breathing_hard", "nasal_discharge", "off_feed", "dull"],
    summary: b("Lung infection, common in young animals in cold, damp, crowded or dusty sheds and after long transport.", "ফুসফুসের সংক্রমণ, ঠান্ডা, স্যাঁতসেঁতে, গাদাগাদি বা ধুলাবালি শেডে আর দীর্ঘ পরিবহনের পর বাচ্চাদের বেশি হয়।"),
    signs: [b("Cough, runny nose, fast or hard breathing", "কাশি, নাক দিয়ে পানি, দ্রুত বা কষ্টে শ্বাস"), b("Fever, dull, eats less", "জ্বর, ঝিমানো, কম খায়")],
    todo: [b("Move it to a dry, airy, draught-free place.", "শুকনো, বাতাস চলাচল আছে কিন্তু সরাসরি ঠান্ডা বাতাস লাগে না এমন জায়গায় রাখুন।"), WATER, VET, NO_SELF],
    prevent: [b("Good air flow without cold draughts; dry bedding; don't overcrowd.", "ঠান্ডা ঝাপটা ছাড়া ভালো বাতাস চলাচল; শুকনো বিছানা; গাদাগাদি নয়।"), b("Rest new animals after transport.", "পরিবহনের পর নতুন পশুকে বিশ্রাম দিন।")],
  },
  {
    slug: "brucellosis",
    species: ["cattle", "goat"],
    name: b("Brucellosis", "ব্রুসেলোসিস"),
    urgent: false,
    zoonotic: true,
    vaccine: false,
    symptoms: ["abortion", "retained_placenta", "milk_drop"],
    summary: b(
      "A bacterial disease that causes abortion in the last months and passes to people through raw milk and birth fluids.",
      "ব্যাকটেরিয়াজনিত রোগ, যা গর্ভের শেষ মাসগুলোতে গর্ভপাত ঘটায় আর কাঁচা দুধ ও প্রসবের তরলের মাধ্যমে মানুষের হয়।",
    ),
    signs: [b("Abortion in late pregnancy, weak calves", "গর্ভের শেষ দিকে গর্ভপাত, দুর্বল বাচ্চা"), b("Afterbirth not passed; repeat breeding", "ফুল পড়ে না; বারবার পাল দিতে হয়"), b("Swollen joints or testicles in males", "ষাঁড়ের অণ্ডকোষ বা গিরা ফোলা")],
    todo: [
      b("Wear gloves; bury the aborted calf and afterbirth with lime; clean the place.", "গ্লাভস পরুন; গর্ভপাতের বাচ্চা ও ফুল চুন দিয়ে পুঁতে ফেলুন; জায়গা পরিষ্কার করুন।"),
      b("Ask a vet for a blood test; keep the cow apart.", "রক্ত পরীক্ষার জন্য ডাক্তারকে বলুন; গাভীকে আলাদা রাখুন।"),
      b("Boil milk before drinking; people with long fever after contact should see a doctor.", "দুধ ফুটিয়ে খান; সংস্পর্শের পর কারও দীর্ঘ জ্বর হলে ডাক্তার দেখান।"),
    ],
    prevent: [b("Test new animals before buying; buy from tested herds.", "কেনার আগে নতুন পশুর পরীক্ষা করান; পরীক্ষিত খামার থেকে কিনুন।"), b("Always boil milk.", "সবসময় দুধ ফুটিয়ে খান।")],
  },
  {
    slug: "skin-disease-mange-ringworm",
    species: ["cattle", "goat"],
    name: b("Mange and ringworm (skin disease)", "খোস-পাঁচড়া ও দাদ (চর্মরোগ)"),
    urgent: false,
    zoonotic: true,
    vaccine: false,
    symptoms: ["skin_sores", "weight_loss"],
    summary: b("Mites (mange) and fungus (ringworm) cause itchy, crusty, hairless patches. Ringworm can spread to people.", "মাইট (খোস-পাঁচড়া) আর ছত্রাক (দাদ) চুলকানি, খসখসে, লোমহীন দাগ তৈরি করে। দাদ মানুষেরও হতে পারে।"),
    signs: [b("Round grey crusty patches (ringworm), often on the face and neck", "গোল ধূসর খসখসে দাগ (দাদ), প্রায়ই মুখ ও ঘাড়ে"), b("Intense itching, rubbing, thick wrinkled skin (mange)", "খুব চুলকানি, ঘষাঘষি, মোটা ভাঁজপড়া চামড়া (খোস-পাঁচড়া)")],
    todo: [b("Wash hands after touching; keep the animal apart.", "ছোঁয়ার পর হাত ধুয়ে নিন; পশুকে আলাদা রাখুন।"), b("Ask your vet for the right wash, spray or injection.", "সঠিক ওয়াশ, স্প্রে বা ইনজেকশনের জন্য ডাক্তারকে জিজ্ঞেস করুন।")],
    prevent: [b("Sunlight and a dry shed; clean brushes and ropes.", "রোদ আর শুকনো শেড; ব্রাশ আর দড়ি পরিষ্কার রাখুন।"), b("Good feeding: weak animals get skin disease more.", "ভালো খাবার দিন: দুর্বল পশুর চর্মরোগ বেশি হয়।")],
  },
  {
    slug: "ppr",
    species: ["goat"],
    name: b("PPR (goat plague)", "পিপিআর (ছাগলের প্লেগ)"),
    urgent: true,
    zoonotic: false,
    vaccine: true,
    symptoms: ["fever", "nasal_discharge", "eye_discharge", "mouth_sores", "diarrhoea", "cough", "sudden_death", "off_feed"],
    summary: b("A virus that kills many goats and sheep, especially kids. It spreads fast in markets and at Eid time.", "ভাইরাসজনিত রোগ, বহু ছাগল ও ভেড়া মারা যায়, বিশেষ করে বাচ্চা। হাট-বাজারে আর ঈদের সময় দ্রুত ছড়ায়।"),
    signs: [
      b("High fever, eyes and nose run, then crust", "বেশি জ্বর, চোখ-নাক দিয়ে পানি, পরে শুকিয়ে খোস"),
      b("Sores in the mouth with a bad smell", "মুখে দুর্গন্ধযুক্ত ঘা"),
      b("Bad diarrhoea, cough; many die in a week", "মারাত্মক পাতলা পায়খানা, কাশি; এক সপ্তাহে অনেক মারা যায়"),
    ],
    todo: [ISOLATE, b("Clean eyes, nose and mouth with clean water; give ORS and soft feed.", "চোখ, নাক আর মুখ পরিষ্কার পানি দিয়ে মুছে দিন; খাবার স্যালাইন আর নরম খাবার দিন।"), VET, BURY],
    prevent: [b("Vaccinate every goat and sheep from 4 months of age; follow the office for boosters.", "৪ মাস বয়স থেকে প্রতিটা ছাগল ও ভেড়াকে টিকা দিন; বুস্টারের জন্য প্রাণিসম্পদ অফিসের পরামর্শ মানুন।"), NEW_ANIMALS],
  },
  {
    slug: "goat-pox",
    species: ["goat"],
    name: b("Goat and sheep pox", "ছাগল ও ভেড়ার বসন্ত"),
    urgent: true,
    zoonotic: false,
    vaccine: true,
    symptoms: ["fever", "skin_lumps", "nasal_discharge", "eye_discharge", "off_feed", "breathing_hard"],
    summary: b("A virus that brings red spots and lumps on the hairless skin; kids can die.", "ভাইরাসজনিত রোগ, লোমহীন চামড়ায় লাল দাগ ও গুটি ওঠে; বাচ্চা মারা যেতে পারে।"),
    signs: [b("Fever, then red spots turning to lumps and scabs on the face, ears, udder and under the tail", "জ্বর, তারপর মুখ, কান, ওলান ও লেজের নিচে লাল দাগ থেকে গুটি ও খোস"), b("Runny eyes and nose, hard breathing", "চোখ-নাক দিয়ে পানি, শ্বাসকষ্ট")],
    todo: [ISOLATE, b("Keep sores clean and flies away; give soft feed and water.", "ঘা পরিষ্কার রাখুন, মাছি তাড়ান; নরম খাবার আর পানি দিন।"), VET],
    prevent: [b("Vaccinate every year.", "প্রতি বছর টিকা দিন।"), NEW_ANIMALS],
  },
  {
    slug: "enterotoxaemia",
    species: ["goat"],
    name: b("Enterotoxaemia (overeating disease)", "এন্টারোটক্সিমিয়া (বেশি খাওয়ার রোগ)"),
    urgent: true,
    zoonotic: false,
    vaccine: true,
    symptoms: ["sudden_death", "trembling", "diarrhoea", "bloat", "off_feed"],
    summary: b("A gut toxin that kills fast, often the best-growing kids after a sudden change to rich feed or grain.", "পেটের বিষাক্ত পদার্থ দ্রুত মেরে ফেলে, প্রায়ই হঠাৎ বেশি দানা বা ভালো খাবার পাওয়া সবচেয়ে মোটাতাজা বাচ্চাগুলো।"),
    signs: [b("Found dead, or fits, lying with legs paddling and head back", "মৃত পাওয়া যায়, বা খিঁচুনি, পা ছোড়াছুড়ি, মাথা পেছনে"), b("Sometimes diarrhoea and a swollen belly", "কখনো পাতলা পায়খানা আর পেট ফোলা")],
    todo: [b("Call a vet at once; stop grain for the rest of the herd.", "এখনই ডাক্তার ডাকুন; বাকি পশুর দানা আপাতত বন্ধ রাখুন।")],
    prevent: [b("Vaccinate kids and does (booster as advised).", "বাচ্চা ও মা ছাগলকে টিকা দিন (পরামর্শমতো বুস্টার)।"), b("Change feed slowly over 1–2 weeks; don't give a lot of grain at once.", "১–২ সপ্তাহ ধরে ধীরে খাবার বদলান; একবারে বেশি দানা দেবেন না।")],
  },
  {
    slug: "orf",
    species: ["goat"],
    name: b("Orf (sore mouth)", "অর্ফ (ঠোঁটে ঘা)"),
    urgent: false,
    zoonotic: true,
    vaccine: false,
    symptoms: ["mouth_sores", "off_feed", "weight_loss"],
    summary: b("A virus giving thick scabs on the lips of kids and lambs; it can pass to people's hands.", "ভাইরাসজনিত রোগ, বাচ্চা ছাগল ও ভেড়ার ঠোঁটে পুরু খোস হয়; মানুষের হাতেও হতে পারে।"),
    signs: [b("Thick brown scabs on the lips, mouth corners and nose", "ঠোঁট, মুখের কোণ আর নাকে পুরু বাদামি খোস"), b("Kids don't suckle well and lose weight", "বাচ্চা ঠিকমতো দুধ টানে না, ওজন কমে")],
    todo: [b("Wear gloves; keep sores clean; give soft feed.", "গ্লাভস পরুন; ঘা পরিষ্কার রাখুন; নরম খাবার দিন।"), b("Most heal in 3–4 weeks; call a vet if the udder or feet get sores.", "বেশিরভাগ ৩–৪ সপ্তাহে সেরে যায়; ওলান বা খুরে ঘা হলে ডাক্তার ডাকুন।")],
    prevent: [NEW_ANIMALS, b("Remove thorny feed that cuts the lips.", "ঠোঁট কেটে যায় এমন কাঁটাযুক্ত খাবার সরিয়ে ফেলুন।")],
  },
  {
    slug: "newcastle-disease",
    species: ["poultry"],
    name: b("Newcastle disease (Ranikhet)", "রানীক্ষেত রোগ (নিউক্যাসল)"),
    urgent: true,
    zoonotic: false,
    report: true,
    vaccine: true,
    symptoms: ["sudden_death", "twisted_neck", "green_dung", "breathing_hard", "egg_drop", "dull", "off_feed"],
    summary: b("The most feared chicken virus in Bangladesh: it can kill most of an unvaccinated flock within days.", "বাংলাদেশে মুরগির সবচেয়ে ভয়ের ভাইরাস: টিকা না দেওয়া খামারের বেশিরভাগ মুরগি কয়েক দিনে মারা যেতে পারে।"),
    signs: [b("Many deaths quickly; gasping, wheezing", "দ্রুত অনেক মৃত্যু; হাঁ করে শ্বাস, ঘড়ঘড় শব্দ"), b("Green watery droppings", "সবুজ পাতলা পায়খানা"), b("Twisted neck, paralysis; eggs stop or have soft shells", "ঘাড় বাঁকা, অবশ; ডিম বন্ধ বা নরম খোসা")],
    todo: [b("Call a vet or the Upazila Livestock Office at once.", "এখনই ডাক্তার বা উপজেলা প্রাণিসম্পদ অফিসে যোগাযোগ করুন।"), b("Stop moving birds, eggs and trays in or out; keep visitors away.", "মুরগি, ডিম আর ট্রে আনা-নেওয়া বন্ধ করুন; বাইরের লোক ঢুকতে দেবেন না।"), BURY],
    prevent: [
      b("Vaccinate: BCRDV at 4–7 and 21 days, then RDV at 2 months and every 2–3 months for layers (as your vet's schedule).", "টিকা দিন: ৪–৭ দিন ও ২১ দিনে বিসিআরডিভি, তারপর ২ মাসে আরডিভি আর লেয়ারে প্রতি ২–৩ মাসে (ডাক্তারের সূচি অনুযায়ী)।"),
      b("Biosecurity: footbath at the gate, one-age flocks, no wild birds inside.", "জীবাণু নিরাপত্তা: গেটে পা ধোয়ার পানি, একই বয়সের মুরগি একসাথে, ভেতরে বুনো পাখি নয়।"),
    ],
  },
  {
    slug: "gumboro",
    species: ["poultry"],
    name: b("Gumboro (IBD)", "গামবোরো রোগ (আইবিডি)"),
    urgent: true,
    zoonotic: false,
    vaccine: true,
    symptoms: ["white_dung", "dull", "sudden_death", "trembling", "off_feed", "diarrhoea"],
    summary: b("A virus of young chickens (3–6 weeks) that damages immunity; deaths peak for a few days, then vaccines work less well.", "৩–৬ সপ্তাহের মুরগির ভাইরাস, রোগ প্রতিরোধ ক্ষমতা নষ্ট করে; কয়েক দিন মৃত্যু বেশি হয়, পরে টিকাও কম কাজ করে।"),
    signs: [b("Sudden dullness, ruffled feathers, birds huddle", "হঠাৎ ঝিমানো, পালক ফোলানো, গাদাগাদি করে থাকে"), b("White watery droppings, soiled vent; pecking at the vent", "সাদা পাতলা পায়খানা, পায়ুপথ নোংরা; পায়ুপথে ঠোকরায়")],
    todo: [b("Give clean water with electrolytes and keep the brooder warm.", "পরিষ্কার পানিতে ইলেক্ট্রোলাইট দিন, ব্রুডার গরম রাখুন।"), VET, BURY],
    prevent: [b("Vaccinate at 10–14 days and again at 21–24 days (or as your hatchery/vet says).", "১০–১৪ দিনে টিকা, আবার ২১–২৪ দিনে (বা হ্যাচারি / ডাক্তারের পরামর্শমতো)।"), CLEAN],
  },
  {
    slug: "fowl-cholera",
    species: ["poultry"],
    name: b("Fowl cholera", "ফাউল কলেরা"),
    urgent: true,
    zoonotic: false,
    vaccine: true,
    symptoms: ["sudden_death", "green_dung", "comb_blue", "face_swelling", "fever", "off_feed"],
    summary: b("A bacterial disease of grown chickens and ducks; sudden deaths in good layers, or swollen wattles in long cases.", "বড় মুরগি ও হাঁসের ব্যাকটেরিয়াজনিত রোগ; ভালো ডিম পাড়া মুরগি হঠাৎ মারা যায়, পুরোনো ক্ষেত্রে গলকম্বল ফোলে।"),
    signs: [b("Sudden deaths; bluish comb", "হঠাৎ মৃত্যু; নীলচে ঝুঁটি"), b("Greenish diarrhoea, fever", "সবুজাভ পাতলা পায়খানা, জ্বর"), b("Swollen wattles or joints in birds that live", "বেঁচে থাকা মুরগির গলকম্বল বা গিরা ফোলা")],
    todo: [VET, NO_SELF, BURY],
    prevent: [b("Vaccinate layers and ducks (from about 8 weeks, booster as advised).", "লেয়ার ও হাঁসকে টিকা দিন (প্রায় ৮ সপ্তাহ থেকে, পরামর্শমতো বুস্টার)।"), b("Keep rats away; clean water pots daily.", "ইঁদুর দূরে রাখুন; পানির পাত্র প্রতিদিন পরিষ্কার করুন।")],
  },
  {
    slug: "bird-flu",
    species: ["poultry"],
    name: b("Bird flu (avian influenza)", "বার্ড ফ্লু (এভিয়ান ইনফ্লুয়েঞ্জা)"),
    urgent: true,
    zoonotic: true,
    report: true,
    vaccine: false,
    symptoms: ["sudden_death", "comb_blue", "face_swelling", "egg_drop", "breathing_hard", "dull", "green_dung"],
    summary: b("A flu virus that can kill a whole flock and can infect people. Any sudden mass deaths must be reported.", "ফ্লু ভাইরাস, পুরো খামারের মুরগি মেরে ফেলতে পারে আর মানুষেরও হতে পারে। হঠাৎ একসাথে অনেক মৃত্যু হলে অবশ্যই জানাতে হবে।"),
    signs: [b("Very many sudden deaths in a day or two", "এক-দুই দিনে হঠাৎ খুব বেশি মৃত্যু"), b("Blue, swollen comb and wattles; swollen face; red legs", "নীল ও ফোলা ঝুঁটি ও গলকম্বল; মুখ ফোলা; পা লাল"), b("Eggs stop; breathing trouble", "ডিম বন্ধ; শ্বাসকষ্ট")],
    todo: [
      b("Report at once to the Upazila Livestock Office; don't sell or move birds or eggs.", "এখনই উপজেলা প্রাণিসম্পদ অফিসে জানান; মুরগি বা ডিম বিক্রি বা সরাবেন না।"),
      b("Don't touch sick or dead birds with bare hands; wear a mask and gloves; wash hands with soap.", "খালি হাতে অসুস্থ বা মৃত মুরগি ধরবেন না; মাস্ক ও গ্লাভস পরুন; সাবান দিয়ে হাত ধুয়ে নিন।"),
      b("Anyone with fever or cough after contact should see a doctor and say they handle poultry.", "সংস্পর্শের পর কারও জ্বর বা কাশি হলে ডাক্তার দেখান আর বলুন যে মুরগি নিয়ে কাজ করেন।"),
    ],
    prevent: [b("Keep wild birds and ducks away from chickens; fence and net the farm.", "বুনো পাখি ও হাঁস মুরগি থেকে দূরে রাখুন; খামারে বেড়া ও জাল দিন।"), CLEAN, b("Buy chicks only from known hatcheries.", "শুধু পরিচিত হ্যাচারি থেকে বাচ্চা কিনুন।")],
  },
  {
    slug: "coccidiosis",
    species: ["poultry", "goat"],
    name: b("Coccidiosis (blood dysentery)", "রক্ত আমাশয় (ককসিডিওসিস)"),
    urgent: false,
    zoonotic: false,
    vaccine: false,
    symptoms: ["bloody_dung", "diarrhoea", "dull", "weight_loss", "off_feed"],
    summary: b("A gut parasite of young chickens and kids, worst on wet, dirty litter or bedding.", "বাচ্চা মুরগি ও ছাগলছানার অন্ত্রের পরজীবী, ভেজা নোংরা লিটার বা বিছানায় বেশি হয়।"),
    signs: [b("Bloody or brown watery droppings", "রক্ত মেশানো বা বাদামি পাতলা পায়খানা"), b("Dull birds with ruffled feathers; poor growth", "ঝিমানো, পালক ফোলানো; বৃদ্ধি কম")],
    todo: [b("Change wet litter at once; ask a vet for an anticoccidial for the water.", "ভেজা লিটার এখনই বদলান; পানিতে দেওয়ার ককসিডিওসিসের ওষুধের জন্য ডাক্তারকে জিজ্ঞেস করুন।"), WATER],
    prevent: [b("Keep litter dry: fix leaking drinkers, turn the litter often.", "লিটার শুকনো রাখুন: পানির পাত্রের লিক ঠিক করুন, লিটার প্রায়ই উল্টে দিন।"), b("Don't overcrowd.", "গাদাগাদি করবেন না।")],
  },
  {
    slug: "crd-mycoplasma",
    species: ["poultry"],
    name: b("CRD (mycoplasma)", "সিআরডি (মাইকোপ্লাজমা)"),
    urgent: false,
    zoonotic: false,
    vaccine: false,
    symptoms: ["cough", "breathing_hard", "nasal_discharge", "eye_discharge", "face_swelling", "egg_drop", "weight_loss"],
    summary: b("A slow breathing disease that lowers growth and eggs, worse with dust, ammonia smell and cold.", "ধীরে চলা শ্বাসতন্ত্রের রোগ, বৃদ্ধি ও ডিম কমায়; ধুলা, অ্যামোনিয়ার গন্ধ আর ঠান্ডায় বাড়ে।"),
    signs: [b("Sneezing, rattling breath, foamy eyes", "হাঁচি, ঘড়ঘড় শ্বাস, চোখে ফেনা"), b("Swollen face; fewer eggs", "মুখ ফোলা; ডিম কম")],
    todo: [b("Improve air flow and remove wet litter (ammonia smell).", "বাতাস চলাচল বাড়ান আর ভেজা লিটার সরান (অ্যামোনিয়ার গন্ধ)।"), VET, NO_SELF],
    prevent: [b("Buy chicks from mycoplasma-free hatcheries; all-in all-out.", "মাইকোপ্লাজমামুক্ত হ্যাচারি থেকে বাচ্চা কিনুন; একসাথে তুলুন, একসাথে বিক্রি করুন।"), b("Good ventilation, no dust.", "ভালো বাতাস চলাচল, ধুলা নয়।")],
  },
  {
    slug: "fowl-pox",
    species: ["poultry"],
    name: b("Fowl pox", "মুরগির বসন্ত (ফাউল পক্স)"),
    urgent: false,
    zoonotic: false,
    vaccine: true,
    symptoms: ["comb_scabs", "mouth_sores", "egg_drop", "breathing_hard", "off_feed"],
    summary: b("A virus spread by mosquitoes: wart-like scabs on the comb and face (dry form) or yellow patches in the mouth (wet form).", "মশার মাধ্যমে ছড়ানো ভাইরাস: ঝুঁটি ও মুখে আঁচিলের মতো খোস (শুকনো ধরন) বা মুখের ভেতরে হলুদ দাগ (ভেজা ধরন)।"),
    signs: [b("Scabs on the comb, wattles and around the eyes", "ঝুঁটি, গলকম্বল আর চোখের চারপাশে খোস"), b("Yellow patches in the mouth and throat; hard breathing", "মুখ ও গলার ভেতরে হলুদ দাগ; শ্বাসকষ্ট")],
    todo: [b("Separate sick birds; keep scabs clean (a little antiseptic).", "অসুস্থ মুরগি আলাদা করুন; খোস পরিষ্কার রাখুন (সামান্য জীবাণুনাশক)।"), VET],
    prevent: [b("Vaccinate (wing-web) as your vet's schedule, usually at 4–8 weeks.", "ডাক্তারের সূচি অনুযায়ী টিকা দিন (ডানার চামড়ায়), সাধারণত ৪–৮ সপ্তাহে।"), b("Control mosquitoes around the shed.", "শেডের আশেপাশে মশা নিয়ন্ত্রণ করুন।")],
  },
  {
    slug: "pullorum",
    species: ["poultry"],
    name: b("Pullorum / salmonella in chicks", "পুলোরাম (বাচ্চার সাদা উদরাময়)"),
    urgent: false,
    zoonotic: false,
    vaccine: false,
    symptoms: ["white_dung", "dull", "sudden_death", "breathing_hard"],
    summary: b("A bacterial disease passed through the egg; chicks die in the first 2–3 weeks.", "ডিমের মাধ্যমে আসা ব্যাকটেরিয়াজনিত রোগ; প্রথম ২–৩ সপ্তাহে বাচ্চা মারা যায়।"),
    signs: [b("Chicks huddle near the heat, chirp, white paste around the vent", "বাচ্চা তাপের কাছে গাদাগাদি করে, চিঁ চিঁ করে, পায়ুপথে সাদা আঠা"), b("Deaths in the first weeks", "প্রথম কয়েক সপ্তাহে মৃত্যু")],
    todo: [b("Keep chicks warm, give clean water; ask a vet and tell the hatchery.", "বাচ্চা গরম রাখুন, পরিষ্কার পানি দিন; ডাক্তারকে জিজ্ঞেস করুন আর হ্যাচারিকে জানান।")],
    prevent: [b("Buy chicks from tested, trusted hatcheries; clean and disinfect the brooder before chicks arrive.", "পরীক্ষিত, বিশ্বস্ত হ্যাচারি থেকে বাচ্চা কিনুন; বাচ্চা আসার আগে ব্রুডার পরিষ্কার ও জীবাণুমুক্ত করুন।")],
  },
];

export const diseaseBySlug = (slug: string) => DISEASES.find((d) => d.slug === slug) ?? null;
export const symptomsFor = (species: DiseaseSpecies) => (Object.keys(SYMPTOMS) as SymptomId[]).filter((id) => (SYMPTOMS[id].species as DiseaseSpecies[]).includes(species));

/**
 * Diseases that fit the signs seen, best first: most signs matched, then the
 * largest share of the disease's own signs, then urgent ones first. Only
 * diseases with at least one matching sign; at most `limit`.
 */
export function matchDiseases(species: DiseaseSpecies, seen: SymptomId[], limit = 5) {
  const picked = new Set(seen);
  if (picked.size === 0) return [];
  return DISEASES.filter((d) => d.species.includes(species))
    .map((d) => {
      const matched = d.symptoms.filter((s) => picked.has(s));
      return { disease: d, matched, share: matched.length / d.symptoms.length };
    })
    .filter((m) => m.matched.length > 0)
    .sort((a, b) => b.matched.length - a.matched.length || b.share - a.share || Number(b.disease.urgent) - Number(a.disease.urgent))
    .slice(0, limit);
}
