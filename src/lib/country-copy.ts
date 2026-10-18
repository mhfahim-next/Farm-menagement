// Home-page globe section, worded for the visitor's country (from the hosting
// edge's geo header). Bangladesh is the default; other countries get their own
// regions in the headline and a "can keep" body (we don't claim users there).

type Copy = { title: string; body: string; kicker: string };
type Regional = { en: [string, string]; bn: [string, string]; center: [number, number] };

const REGIONS: Record<string, Regional> = {
  IN: { en: ["Punjab", "Kerala"], bn: ["পাঞ্জাব", "কেরালা"], center: [22, 78] },
  PK: { en: ["Punjab", "Sindh"], bn: ["পাঞ্জাব", "সিন্ধু"], center: [29, 70] },
  LK: { en: ["Jaffna", "Galle"], bn: ["জাফনা", "গল"], center: [12, 80] },
  NP: { en: ["Jhapa", "Kailali"], bn: ["ঝাপা", "কৈলালি"], center: [26, 84] },
  NL: { en: ["Friesland", "Limburg"], bn: ["ফ্রিসল্যান্ড", "লিমবুর্গ"], center: [48, 12] },
  DK: { en: ["Jutland", "Zealand"], bn: ["জুটল্যান্ড", "জিল্যান্ড"], center: [50, 12] },
  IE: { en: ["Cork", "Donegal"], bn: ["কর্ক", "ডোনেগাল"], center: [48, 0] },
  GB: { en: ["Cornwall", "Scotland"], bn: ["কর্নওয়াল", "স্কটল্যান্ড"], center: [48, 2] },
  US: { en: ["Wisconsin", "California"], bn: ["উইসকনসিন", "ক্যালিফোর্নিয়া"], center: [35, -85] },
  CA: { en: ["Ontario", "Quebec"], bn: ["অন্টারিও", "কুইবেক"], center: [45, -80] },
  NZ: { en: ["Waikato", "Canterbury"], bn: ["ওয়াইকাটো", "ক্যান্টারবেরি"], center: [-30, 160] },
  AU: { en: ["Victoria", "Queensland"], bn: ["ভিক্টোরিয়া", "কুইন্সল্যান্ড"], center: [-28, 140] },
  BR: { en: ["Minas Gerais", "Rio Grande do Sul"], bn: ["মিনাস জেরাইস", "রিও গ্রান্দে দো সুল"], center: [-15, -50] },
  SA: { en: ["Riyadh", "Al-Kharj"], bn: ["রিয়াদ", "আল-খারজ"], center: [24, 50] },
  AE: { en: ["Abu Dhabi", "Al Ain"], bn: ["আবুধাবি", "আল আইন"], center: [24, 55] },
  MY: { en: ["Johor", "Kedah"], bn: ["জোহর", "কেদাহ"], center: [5, 102] },
};

const BD_CENTER: [number, number] = [24, 70];
const THE = new Set(["NL", "US", "GB", "AE", "PH", "CZ", "DO", "BS", "GM"]);

function countryName(code: string, locale: "en" | "bn") {
  try {
    return new Intl.DisplayNames([locale === "bn" ? "bn" : "en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Headline, body and globe centre for a visitor from `country` (ISO code, may be null). */
export function globeCopy(country: string | null, locale: "en" | "bn"): Copy & { center: [number, number]; country: string } {
  const code = (country ?? "BD").toUpperCase();
  if (code === "BD") {
    return locale === "bn"
      ? {
          kicker: "বাংলাদেশে তৈরি",
          title: "রংপুর থেকে চট্টগ্রাম, সব খামারের জন্য এক অ্যাপ",
          body: "দেশজুড়ে ডেইরি খামার, গরু মোটাতাজাকরণ ও লেয়ার মুরগির খামারিরা FarmFlows-এ হিসাব রাখেন — ফোনে, বাংলায়, দুর্বল নেটওয়ার্কেও।",
          center: BD_CENTER,
          country: code,
        }
      : {
          kicker: "Made in Bangladesh",
          title: "From Rangpur to Chattogram, one app for every farm",
          body: "Dairy farms, cattle fattening and layer poultry across the country keep their records in FarmFlows — on a phone, in Bangla, even with a weak connection.",
          center: BD_CENTER,
          country: code,
        };
  }

  // English needs "the" before some country names ("the Netherlands", "the United States").
  const name = (locale === "en" && THE.has(code) ? "the " : "") + countryName(code, locale);
  const r = REGIONS[code];
  if (locale === "bn") {
    return {
      kicker: `বাংলাদেশে তৈরি · ${name}-এর খামারের জন্য`,
      title: r ? `${r.bn[0]} থেকে ${r.bn[1]}, সব খামারের জন্য এক অ্যাপ` : "ছোট শেড থেকে বড় ডেইরি, সব খামারের জন্য এক অ্যাপ",
      body: `${name}-জুড়ে ডেইরি খামার, গরু মোটাতাজাকরণ ও লেয়ার মুরগির খামারিরা FarmFlows-এ হিসাব রাখতে পারেন — ফোনে, বাংলা বা ইংরেজিতে, দুর্বল নেটওয়ার্কেও।`,
      center: r?.center ?? BD_CENTER,
      country: code,
    };
  }
  return {
    kicker: `Made in Bangladesh · for farms in ${name}`,
    title: r ? `From ${r.en[0]} to ${r.en[1]}, one app for every farm` : "From small sheds to big dairies, one app for every farm",
    body: `Dairy farms, cattle fattening and layer poultry across ${name} can keep their records in FarmFlows — on a phone, in English or Bangla, even with a weak connection.`,
    center: r?.center ?? BD_CENTER,
    country: code,
  };
}
