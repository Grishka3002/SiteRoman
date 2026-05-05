import type { Metadata } from "next";

import { HomePage } from "@/components/home-page";
import { SiteFooter } from "@/components/site-footer";
import { getPageContent } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageContent("home");

  return {
    title: page.seoTitle,
    description: page.seoDescription,
  };
}

export default async function Page() {
  const page = await getPageContent("home");

  return (
    <main className="min-h-screen bg-black text-white">
      <HomePage page={page} />
      <SiteFooter {...page.contact} />
    </main>
  );
}
