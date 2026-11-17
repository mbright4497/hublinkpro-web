// Client-safe SOS category list (no server imports).
export const SOS_CATEGORIES = [
  { slug: "plumbing", label: "Burst pipe / plumbing" },
  { slug: "roofing", label: "Roof damage / tarp" },
  { slug: "hvac", label: "No heat / no AC" },
  { slug: "electrical", label: "Electrical" },
  { slug: "water", label: "Water in the house" },
  { slug: "tree", label: "Tree down" },
  { slug: "locksmith", label: "Locked out" },
  { slug: "towing", label: "Towing" },
] as const;
export const isSosCategory = (s: string) => SOS_CATEGORIES.some((c) => c.slug === s);
export const categoryLabel = (s: string) => SOS_CATEGORIES.find((c) => c.slug === s)?.label ?? s;

