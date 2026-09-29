// Clean helper for hotel menu item display name
export function getItemDisplayName(nameStr?: string | null, _lang: string = "en"): string {
  if (!nameStr) return "";
  return nameStr.trim();
}

