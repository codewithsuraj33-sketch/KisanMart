// Naam ko URL-friendly slug mein badalta hai
// "Hybrid Wheat Seeds 1kg" -> "hybrid-wheat-seeds-1kg"
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
