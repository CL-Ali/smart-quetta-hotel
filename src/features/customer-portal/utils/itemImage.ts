// Clean helper for product image resolution
export function getAccurateItemImageByName(_nameStr?: string | null, fallbackUrl?: string | null): string {
  if (fallbackUrl && fallbackUrl.trim() !== "") {
    return fallbackUrl;
  }
  return "/images/chai.png";
}

