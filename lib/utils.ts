export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function pagePath(slug: string) {
  return slug === "home" ? "/" : `/${slug}`;
}
