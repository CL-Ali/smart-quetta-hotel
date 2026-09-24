// Dedicated translation dictionary and helper for hotel menu items across supported regional languages
export function getItemDisplayName(nameStr?: string | null, lang: string = "en"): string {
  if (!nameStr) return "";
  const trimmed = nameStr.trim();
  if (!trimmed) return "";

  if (lang === "en") return trimmed;

  // If already contains Urdu/Arabic characters, return as-is
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    return trimmed;
  }

  const name = trimmed.toLowerCase();

  // ── URDU TRANSLATIONS (Granular & Accurate) ──
  if (lang === "ur") {
    // Teas & Beverages
    if (name.includes("matka")) return "مٹکا چائے";
    if (name.includes("doodh patti")) return "دودھ پتی چائے";
    if (name.includes("karak")) return "کڑک چائے";
    if (name.includes("kashmiri") || name.includes("pink tea")) return "کشمیری چائے";
    if (name.includes("gur") || name.includes("gurr")) return "گڑ والی چائے";
    if (name.includes("elaichi") || name.includes("cardamom")) return "الائچی چائے";
    if (name.includes("malai")) return "ملائی چائے";
    if (name.includes("special chai") || name.includes("special tea") || name.includes("quetta chai")) return "سپیشل کوئٹہ چائے";
    if (name.includes("karwa") || name.includes("kahwa") || name.includes("qehwa") || name.includes("green tea")) return "سبز قہوہ";
    if (name.includes("black tea") || name.includes("kala qehwa")) return "سیاہ قہوہ";
    if (name.includes("chai") || name.includes("tea")) return "چائے";
    if (name.includes("sweet lassi")) return "میٹھی لسی";
    if (name.includes("namkeen lassi") || name.includes("salted lassi")) return "نمکین لسی";
    if (name.includes("lassi")) return "لسی";
    if (name.includes("mineral water") || name.includes("water bottle")) return "منرل واٹر";
    if (name.includes("cold drink") || name.includes("soft drink") || name.includes("soda")) return "کولڈ ڈرنک";

    // Parathas & Breads
    if (name.includes("aloo paratha") || name.includes("alu paratha")) return "آلو پراٹھا";
    if (name.includes("anda paratha") || name.includes("egg paratha")) return "انڈہ پراٹھا";
    if (name.includes("keema paratha") || name.includes("qeema paratha")) return "قیمہ پراٹھا";
    if (name.includes("meetha paratha") || name.includes("sugar paratha")) return "میٹھا پراٹھا";
    if (name.includes("cheese paratha")) return "چیز پراٹھا";
    if (name.includes("lacha paratha") || name.includes("lachha paratha")) return "لچھا پراٹھا";
    if (name.includes("paratha")) return "پراٹھا";
    if (name.includes("roghni naan")) return "روغنی نان";
    if (name.includes("garlic naan")) return "گارلک نان";
    if (name.includes("khamiri roti")) return "خمیری روٹی";
    if (name.includes("tandoori roti")) return "تندوری روٹی";
    if (name.includes("naan")) return "نان";
    if (name.includes("roti")) return "روٹی";

    // Eggs & Breakfast
    if (name.includes("half fry") || name.includes("half-fry")) return "ہاف فرائی انڈہ";
    if (name.includes("full fry") || name.includes("full-fry")) return "فل فرائی انڈہ";
    if (name.includes("cheese omelette") || name.includes("cheese omlet")) return "چیز آملیٹ";
    if (name.includes("special omelette") || name.includes("special omlet")) return "سپیشل آملیٹ";
    if (name.includes("omelette") || name.includes("omlet") || name.includes("omlette")) return "آملیٹ";
    if (name.includes("boiled egg")) return "ابلا انڈہ";
    if (name.includes("halwa puri") || name.includes("halwa poori")) return "حلوہ پوری";
    if (name.includes("puri") || name.includes("poori")) return "پوری";
    if (name.includes("halwa")) return "حلوہ";

    // Snacks
    if (name.includes("keema samosa") || name.includes("qeema samosa")) return "قیمہ سموسہ";
    if (name.includes("aloo samosa") || name.includes("alu samosa")) return "آلو سموسہ";
    if (name.includes("samosa")) return "سموسہ";
    if (name.includes("pakora") || name.includes("pakoda") || name.includes("bhajia")) return "پکوڑے";

    // Mains & Curries
    if (name.includes("chicken shinwari")) return "چکن شنواری";
    if (name.includes("mutton shinwari")) return "مٹن شنواری";
    if (name.includes("chicken karahi")) return "چکن کڑاہی";
    if (name.includes("mutton karahi")) return "مٹن کڑاہی";
    if (name.includes("karahi")) return "کڑاہی";
    if (name.includes("chicken handi")) return "چکن ہانڈی";
    if (name.includes("chicken biryani")) return "چکن بریانی";
    if (name.includes("biryani")) return "بریانی";
    if (name.includes("daal mash") || name.includes("dal mash")) return "دال ماش";
    if (name.includes("daal chana") || name.includes("dal chana")) return "دال چنا";
    if (name.includes("daal") || name.includes("dal")) return "دال";
    if (name.includes("chana") || name.includes("chanay") || name.includes("chole")) return "چنے";
    if (name.includes("nihari")) return "نہاری";
    if (name.includes("paya") || name.includes("paye")) return "پائے";
    if (name.includes("qeema") || name.includes("keema")) return "قیمہ";

    return trimmed;
  }

  // ── PASHTO TRANSLATIONS ──
  if (lang === "ps") {
    if (name.includes("karwa") || name.includes("kahwa") || name.includes("qehwa") || name.includes("green tea")) return "شنه چای";
    if (name.includes("doodh patti") || name.includes("karak")) return "د شودو کړه چای";
    if (name.includes("chai") || name.includes("tea")) return "کوئټه چای";
    if (name.includes("lassi")) return "شوملې / لسي";
    if (name.includes("paratha")) return "پراټه";
    if (name.includes("half fry")) return "نیمه فرائی هګۍ";
    if (name.includes("omelette") || name.includes("anda") || name.includes("egg")) return "هګۍ / آملیټ";
    if (name.includes("roti") || name.includes("naan")) return "ډوډۍ / نان";
    if (name.includes("karahi")) return "کړاهي";
    return trimmed;
  }

  // ── BALOCHI TRANSLATIONS ──
  if (lang === "bal") {
    if (name.includes("karwa") || name.includes("kahwa") || name.includes("green tea")) return "سوزیں چاہ";
    if (name.includes("doodh patti") || name.includes("karak")) return "شیریں چاہ";
    if (name.includes("chai") || name.includes("tea")) return "چاہ";
    if (name.includes("lassi")) return "مستگیں لسی";
    if (name.includes("paratha")) return "پراٹہ";
    if (name.includes("egg") || name.includes("anda") || name.includes("fry")) return "ہیک / آملیٹ";
    if (name.includes("roti") || name.includes("naan")) return "نگن / روٹی";
    return trimmed;
  }

  return trimmed;
}
