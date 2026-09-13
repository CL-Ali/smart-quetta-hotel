// Accurate, curated matching food images (Authentic Desi / Pakistani Chai Khana menu items)
export function getAccurateItemImageByName(nameStr?: string | null, fallbackUrl?: string | null): string {
  const name = (nameStr || "").toLowerCase().trim();
  
  // 1. Lassi (Authentic sweet white yogurt lassi in glass with malai)
  if (name.includes("lassi")) {
    return "https://images.unsplash.com/photo-1553787499-6f9133860278?w=500&auto=format&fit=crop&q=80";
  }
  
  // 2. Karwa Chai / Kahwa / Sulaimani / Green tea / Herbal tea
  if (
    name.includes("karwa") ||
    name.includes("kahwa") ||
    name.includes("qehwa") ||
    name.includes("black tea") ||
    name.includes("bina doodh") ||
    name.includes("green tea")
  ) {
    return "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80";
  }
  
  // 3. Special Doodh Patti Chai / Karak Chai / Matka Chai
  if (name.includes("chai") || name.includes("doodh patti") || name.includes("tea") || name.includes("karak")) {
    return "/images/chai.png";
  }
  
  // 4. Paratha (Crispy Golden Desi Ghee Lacha Paratha)
  if (name === "paratha" || (name.includes("paratha") && !name.includes("anda") && !name.includes("egg") && !name.includes("aloo"))) {
    return "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80";
  }

  // 4b. Aloo Paratha
  if (name.includes("aloo paratha") || name.includes("alu paratha")) {
    return "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80";
  }
  
  // 5. Anda Paratha / Omelette / Half Fry
  if (name.includes("anda") || name.includes("egg") || name.includes("omelette") || name.includes("omlet")) {
    return "https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=500&auto=format&fit=crop&q=80";
  }
  
  // 6. Halwa Puri (Golden Puffed Puris with Halwa Chana)
  if (name.includes("halwa") || name.includes("puri") || name.includes("poori")) {
    return "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80";
  }
  
  // 7. Samosa (Crispy Golden Triangular Potato & Spiced Samosas)
  if (name.includes("samosa")) {
    return "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80";
  }
  
  // 8. Pakora (Crispy Golden Mixed Vegetable Pakoras / Bhajia)
  if (name.includes("pakora") || name.includes("pakoda") || name.includes("bhajia")) {
    return "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&auto=format&fit=crop&q=80";
  }

  // 9. Chicken Karahi / Shinwari / Handi
  if (name.includes("karahi") || name.includes("shinwari") || name.includes("handi") || name.includes("chicken") || name.includes("mutton") || name.includes("salan")) {
    return "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=80";
  }

  // 10. Chana / Daal / Nihari
  if (name.includes("chana") || name.includes("daal") || name.includes("dal") || name.includes("nihari")) {
    return "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80";
  }
  
  // Fallback check
  if (fallbackUrl && !fallbackUrl.includes("photo-1571091718767") && fallbackUrl.trim() !== "") {
    return fallbackUrl;
  }
  
  return "/images/chai.png";
}
