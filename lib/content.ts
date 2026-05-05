import { prisma } from "@/lib/prisma";
import { sitePages, type PageSlug, type SitePage, type SitePages } from "@/lib/site-data";

export type { PageSlug, SitePage, SitePages };

const fallbackPages = sitePages;

export function getDefaultPage<T extends PageSlug>(slug: T): SitePages[T] {
  return fallbackPages[slug];
}

export function getPageSlugs(): PageSlug[] {
  return Object.keys(fallbackPages) as PageSlug[];
}

export async function getPageContent<T extends PageSlug>(slug: T): Promise<SitePages[T]> {
  const fallback = getDefaultPage(slug);

  if (!process.env.DATABASE_URL) {
    return fallback;
  }

  try {
    const page = await prisma.pageContent.findUnique({
      where: { slug },
    });

    if (page?.data) {
      return mergeWithFallback(fallback, page.data) as SitePages[T];
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function mergeWithFallback<T>(fallback: T, data: unknown): T {
  if (!isRecord(fallback) || !isRecord(data)) {
    return fallback;
  }

  const merged: Record<string, unknown> = { ...fallback };

  for (const [key, value] of Object.entries(data)) {
    const fallbackValue = merged[key];

    if (isRecord(fallbackValue) && isRecord(value) && !Array.isArray(fallbackValue) && !Array.isArray(value)) {
      merged[key] = mergeWithFallback(fallbackValue, value);
      continue;
    }

    if (value !== undefined && value !== null) {
      merged[key] = value;
    }
  }

  return merged as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function getAdminPages() {
  return Promise.all(
    getPageSlugs().map(async (slug) => ({
      slug,
      content: await getPageContent(slug),
    })),
  );
}
