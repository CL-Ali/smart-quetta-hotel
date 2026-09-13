// Dedicated translation dictionary and helper for hotel menu items across supported regional languages
export function getItemDisplayName(nameStr?: string | null, lang: string = "en"): string {
  if (!nameStr) return "";
  const name = nameStr.toLowerCase().trim();

  if (lang === "en") return nameStr;

  // Urdu Translations (Authentic Pakistani Quetta Hotel terminology)
  if (lang === "ur") {
    if (name.includes("karwa") || name.includes("kahwa") || name.includes("qehwa") || name.includes("black tea") || name.includes("bina doodh") || name.includes("green tea")) {
      return "کڑوا قہوہ / سبز چائے";
    }
    if (name.includes("doodh patti") || name.includes("karak") || name.includes("matka")) {
      return "دودھ پتی کڑک چائے";
    }
    if (name.includes("chai") || name.includes("tea")) {
      return "خاص کوئٹہ چائے";
    }
    if (name.includes("lassi")) {
      return "ٹھنڈی میٹھی لسی";
    }
    if (name.includes("aloo paratha") || name.includes("alu paratha")) {
      return "آلو والا خستہ پراٹھا";
    }
    if (name.includes("anda paratha") || name.includes("egg paratha")) {
      return "انڈہ پراٹھا";
    }
    if (name === "paratha" || (name.includes("paratha") && !name.includes("anda") && !name.includes("aloo"))) {
      return "دیسی گھی لچھا پراٹھا";
    }
    if (name.includes("omelette") || name.includes("omlet") || name.includes("half fry") || name.includes("anda") || name.includes("egg")) {
      return "دیسی فرائی آملیٹ";
    }
    if (name.includes("halwa") || name.includes("puri") || name.includes("poori")) {
      return "حلوہ پوری ناشتہ";
    }
    if (name.includes("samosa")) {
      return "خستہ قیمہ / آلو سموسہ";
    }
    if (name.includes("pakora") || name.includes("pakoda") || name.includes("bhajia")) {
      return "گرم مکس پکوڑے";
    }
    if (name.includes("chicken karahi") || name.includes("chicken shinwari")) {
      return "چکن شنواری کڑاہی";
    }
    if (name.includes("mutton karahi") || name.includes("mutton shinwari")) {
      return "مٹن شنواری کڑاہی";
    }
    if (name.includes("karahi") || name.includes("handi") || name.includes("salan")) {
      return "سپیشل کڑاہی سالن";
    }
    if (name.includes("chana") || name.includes("chanay")) {
      return "لاہوری چنے ناشتہ";
    }
    if (name.includes("daal") || name.includes("dal")) {
      return "سپیشل مکھن دال فرائی";
    }
    if (name.includes("nihari")) {
      return "سپیشل نلی نہاری";
    }
    if (name.includes("roti") || name.includes("naan")) {
      return "تندوری نان / روٹی";
    }
    return nameStr;
  }

  // Pashto
  if (lang === "ps") {
    if (name.includes("karwa") || name.includes("kahwa") || name.includes("qehwa") || name.includes("green tea")) {
      return "شنه چای / قہوه";
    }
    if (name.includes("chai") || name.includes("tea")) {
      return "کوئٹہ چای";
    }
    if (name.includes("lassi")) {
      return "شوملې / لسي";
    }
    if (name.includes("paratha")) {
      return "پراټه";
    }
    if (name.includes("anda") || name.includes("egg")) {
      return "هګۍ / آملیټ";
    }
    return nameStr;
  }

  return nameStr;
}
