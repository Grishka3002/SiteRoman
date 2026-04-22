"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDefaultPage, getPageSlugs, type PageSlug } from "@/lib/content";
import { prisma } from "@/lib/prisma";

export async function submitInquiry(formData: FormData) {
  const pageSlug = String(formData.get("pageSlug") || "home");
  const payload = {
    pageSlug,
    pageKind: String(formData.get("pageKind") || ""),
    name: String(formData.get("name") || ""),
    contact: String(formData.get("contact") || ""),
    eventDate: String(formData.get("eventDate") || ""),
    location: String(formData.get("location") || ""),
    guestCount: String(formData.get("guestCount") || ""),
    company: String(formData.get("company") || ""),
    format: String(formData.get("format") || ""),
    gift: String(formData.get("gift") || ""),
    message: String(formData.get("message") || ""),
  };

  if (process.env.DATABASE_URL) {
    try {
      await prisma.inquiry.create({
        data: payload,
      });
    } catch {
      redirect(`${pageSlug === "home" ? "/" : `/${pageSlug}`}?sent=error#contact`);
    }
  }

  redirect(`${pageSlug === "home" ? "/" : `/${pageSlug}`}?sent=1#contact`);
}

export async function savePageContent(formData: FormData) {
  const slug = String(formData.get("slug") || "") as PageSlug;
  const rawJson = String(formData.get("content") || "");

  if (!getPageSlugs().includes(slug)) {
    throw new Error("Unknown page slug");
  }

  const parsed = JSON.parse(rawJson);

  if (!process.env.DATABASE_URL) {
    redirect(`/admin/${slug}?saved=local-only`);
  }

  await prisma.pageContent.upsert({
    where: { slug },
    update: { data: parsed },
    create: { slug, data: parsed },
  });

  revalidatePath("/");
  revalidatePath(`/${slug}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/${slug}`);
  redirect(`/admin/${slug}?saved=1`);
}

export async function resetPageContent(formData: FormData) {
  const slug = String(formData.get("slug") || "") as PageSlug;

  if (!getPageSlugs().includes(slug)) {
    throw new Error("Unknown page slug");
  }

  const defaultPage = getDefaultPage(slug);

  if (!process.env.DATABASE_URL) {
    redirect(`/admin/${slug}?saved=local-only`);
  }

  await prisma.pageContent.upsert({
    where: { slug },
    update: { data: defaultPage },
    create: { slug, data: defaultPage },
  });

  revalidatePath("/");
  revalidatePath(`/${slug}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/${slug}`);
  redirect(`/admin/${slug}?reset=1`);
}
