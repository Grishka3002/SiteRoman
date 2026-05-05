import type { Metadata } from "next";

import { WeddingLanding } from "@/components/public/wedding-landing";
import { getPageContent } from "@/lib/content";
import type { WeddingPageContent } from "@/lib/site-data";

type WeddingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const page = (await getPageContent("wedding")) as WeddingPageContent;

  return {
    title: page.seoTitle,
    description: page.seoDescription,
  };
}

export default async function WeddingPage({ searchParams }: WeddingPageProps) {
  const page = (await getPageContent("wedding")) as WeddingPageContent;
  const query = searchParams ? await searchParams : {};
  const sent = Array.isArray(query.sent) ? query.sent[0] : query.sent;

  return <WeddingLanding page={page} sentStatus={sent} />;
}
