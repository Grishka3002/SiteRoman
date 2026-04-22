import defaultPages from "@/content/default-pages.json";
import { prisma } from "@/lib/prisma";

export type SitePages = typeof defaultPages;
export type PageSlug = keyof SitePages;
export type SitePage = SitePages[PageSlug];

const fallbackPages = defaultPages as SitePages;

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
      return page.data as SitePages[T];
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export async function getAdminPages() {
  return Promise.all(
    getPageSlugs().map(async (slug) => ({
      slug,
      content: await getPageContent(slug),
    })),
  );
}
