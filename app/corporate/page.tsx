import type { Metadata } from "next";

import { EventPage } from "@/components/event-page";
import { SiteFooter } from "@/components/site-footer";
import { getPageContent } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageContent("corporate");

  return {
    title: page.seoTitle,
    description: page.seoDescription,
  };
}

export default async function CorporatePage() {
  const page = await getPageContent("corporate");

  return (
    <main className="min-h-screen bg-black text-white">
      <EventPage page={page} />
      <SiteFooter {...page.contact} />
    </main>
  );
}
