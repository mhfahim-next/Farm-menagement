// Copied from the website (src/lib/districts.ts); change both together.
// The 64 districts of Bangladesh, for the doctors' list. Pure data with no
// imports, so the app keeps an exact copy (mobile/src/lib/districts.ts).

export const DISTRICTS: { key: string; en: string; bn: string; also?: string[] }[] = [
  { key: "bagerhat", en: "Bagerhat", bn: "বাগেরহাট" },
  { key: "bandarban", en: "Bandarban", bn: "বান্দরবান" },
  { key: "barguna", en: "Barguna", bn: "বরগুনা" },
  { key: "barishal", en: "Barishal", bn: "বরিশাল", also: ["Barisal"] },
  { key: "bhola", en: "Bhola", bn: "ভোলা" },
  { key: "bogura", en: "Bogura", bn: "বগুড়া", also: ["Bogra"] },
  { key: "brahmanbaria", en: "Brahmanbaria", bn: "ব্রাহ্মণবাড়িয়া" },
  { key: "chandpur", en: "Chandpur", bn: "চাঁদপুর" },
  { key: "chapainawabganj", en: "Chapainawabganj", bn: "চাঁপাইনবাবগঞ্জ", also: ["Nawabganj"] },
  { key: "chattogram", en: "Chattogram", bn: "চট্টগ্রাম", also: ["Chittagong"] },
  { key: "chuadanga", en: "Chuadanga", bn: "চুয়াডাঙ্গা" },
  { key: "coxs_bazar", en: "Cox's Bazar", bn: "কক্সবাজার" },
  { key: "cumilla", en: "Cumilla", bn: "কুমিল্লা", also: ["Comilla"] },
  { key: "dhaka", en: "Dhaka", bn: "ঢাকা" },
  { key: "dinajpur", en: "Dinajpur", bn: "দিনাজপুর" },
  { key: "faridpur", en: "Faridpur", bn: "ফরিদপুর" },
  { key: "feni", en: "Feni", bn: "ফেনী" },
  { key: "gaibandha", en: "Gaibandha", bn: "গাইবান্ধা" },
  { key: "gazipur", en: "Gazipur", bn: "গাজীপুর" },
  { key: "gopalganj", en: "Gopalganj", bn: "গোপালগঞ্জ" },
  { key: "habiganj", en: "Habiganj", bn: "হবিগঞ্জ" },
  { key: "jamalpur", en: "Jamalpur", bn: "জামালপুর" },
  { key: "jashore", en: "Jashore", bn: "যশোর", also: ["Jessore"] },
  { key: "jhalokati", en: "Jhalokati", bn: "ঝালকাঠি", also: ["Jhalakathi"] },
  { key: "jhenaidah", en: "Jhenaidah", bn: "ঝিনাইদহ" },
  { key: "joypurhat", en: "Joypurhat", bn: "জয়পুরহাট" },
  { key: "khagrachhari", en: "Khagrachhari", bn: "খাগড়াছড়ি" },
  { key: "khulna", en: "Khulna", bn: "খুলনা" },
  { key: "kishoreganj", en: "Kishoreganj", bn: "কিশোরগঞ্জ" },
  { key: "kurigram", en: "Kurigram", bn: "কুড়িগ্রাম" },
  { key: "kushtia", en: "Kushtia", bn: "কুষ্টিয়া" },
  { key: "lakshmipur", en: "Lakshmipur", bn: "লক্ষ্মীপুর" },
  { key: "lalmonirhat", en: "Lalmonirhat", bn: "লালমনিরহাট" },
  { key: "madaripur", en: "Madaripur", bn: "মাদারীপুর" },
  { key: "magura", en: "Magura", bn: "মাগুরা" },
  { key: "manikganj", en: "Manikganj", bn: "মানিকগঞ্জ" },
  { key: "meherpur", en: "Meherpur", bn: "মেহেরপুর" },
  { key: "moulvibazar", en: "Moulvibazar", bn: "মৌলভীবাজার", also: ["Maulvibazar"] },
  { key: "munshiganj", en: "Munshiganj", bn: "মুন্সীগঞ্জ" },
  { key: "mymensingh", en: "Mymensingh", bn: "ময়মনসিংহ" },
  { key: "naogaon", en: "Naogaon", bn: "নওগাঁ" },
  { key: "narail", en: "Narail", bn: "নড়াইল" },
  { key: "narayanganj", en: "Narayanganj", bn: "নারায়ণগঞ্জ" },
  { key: "narsingdi", en: "Narsingdi", bn: "নরসিংদী" },
  { key: "natore", en: "Natore", bn: "নাটোর" },
  { key: "netrokona", en: "Netrokona", bn: "নেত্রকোণা", also: ["Netrakona"] },
  { key: "nilphamari", en: "Nilphamari", bn: "নীলফামারী" },
  { key: "noakhali", en: "Noakhali", bn: "নোয়াখালী" },
  { key: "pabna", en: "Pabna", bn: "পাবনা" },
  { key: "panchagarh", en: "Panchagarh", bn: "পঞ্চগড়" },
  { key: "patuakhali", en: "Patuakhali", bn: "পটুয়াখালী" },
  { key: "pirojpur", en: "Pirojpur", bn: "পিরোজপুর" },
  { key: "rajbari", en: "Rajbari", bn: "রাজবাড়ী" },
  { key: "rajshahi", en: "Rajshahi", bn: "রাজশাহী" },
  { key: "rangamati", en: "Rangamati", bn: "রাঙ্গামাটি" },
  { key: "rangpur", en: "Rangpur", bn: "রংপুর" },
  { key: "satkhira", en: "Satkhira", bn: "সাতক্ষীরা" },
  { key: "shariatpur", en: "Shariatpur", bn: "শরীয়তপুর" },
  { key: "sherpur", en: "Sherpur", bn: "শেরপুর" },
  { key: "sirajganj", en: "Sirajganj", bn: "সিরাজগঞ্জ" },
  { key: "sunamganj", en: "Sunamganj", bn: "সুনামগঞ্জ" },
  { key: "sylhet", en: "Sylhet", bn: "সিলেট" },
  { key: "tangail", en: "Tangail", bn: "টাঙ্গাইল" },
  { key: "thakurgaon", en: "Thakurgaon", bn: "ঠাকুরগাঁও" },
];

export const districtByKey = (key: string | null | undefined) => DISTRICTS.find((d) => d.key === key) ?? null;

/** The district named in free text such as a farm's location ("Savar, Dhaka", "গাজীপুর সদর"), or null. */
export function districtIn(text: string | null | undefined) {
  if (!text) return null;
  const s = text.toLowerCase();
  // Longest names first, so "Narayanganj" wins over a shorter name inside it.
  const names = DISTRICTS.flatMap((d) => [d.en, d.bn, ...(d.also ?? [])].map((n) => ({ key: d.key, n: n.toLowerCase() }))).sort((a, b) => b.n.length - a.n.length);
  return names.find((x) => s.includes(x.n))?.key ?? null;
}
