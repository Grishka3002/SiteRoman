import Link from "next/link";

import { getAdminPages } from "@/lib/content";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const pages = await getAdminPages();
  let inquiries: Awaited<ReturnType<typeof prisma.inquiry.findMany>> = [];

  if (process.env.DATABASE_URL) {
    try {
      inquiries = await prisma.inquiry.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
      });
    } catch {
      inquiries = [];
    }
  }

  return (
    <main className="min-h-screen bg-black px-5 py-10 text-white sm:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#101010] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="border-b border-white/10 bg-[#ffe100] px-6 py-8 text-black sm:px-10">
            <p className="text-xs font-black uppercase tracking-[0.45em]">Admin</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-6xl">
              Управление сайтом и заявками
            </h1>
          </div>

          <div className="grid gap-8 px-6 py-8 sm:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.38em] text-[#ffe100]">Разделы</p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em]">Страницы сайта</h2>
              </div>
            </div>

            <section className="grid gap-5 lg:grid-cols-3">
              {pages.map(({ slug, content }) => (
                <article
                  key={slug}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-black uppercase tracking-[0.32em] text-[#ffe100]">{slug}</div>
                    <div className="h-3 w-3 rounded-full bg-[#ffe100]" />
                  </div>
                  <h3 className="mt-4 text-2xl font-black uppercase tracking-[-0.04em]">{content.hero.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-white/65">{content.seoDescription}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/admin/${slug}`}
                      className="rounded-full bg-[#ffe100] px-4 py-2 text-sm font-black text-black transition hover:bg-white"
                    >
                      Редактировать
                    </Link>
                    <Link
                      href={slug === "home" ? "/" : `/${slug}`}
                      className="rounded-full border border-white/15 px-4 py-2 text-sm font-black text-white transition hover:border-[#ffe100] hover:text-[#ffe100]"
                    >
                      Открыть
                    </Link>
                  </div>
                </article>
              ))}
            </section>

            <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-black uppercase tracking-[-0.04em]">Последние заявки</h2>
              <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-white/10">
                <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                  <thead className="bg-white/[0.04] text-white/70">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Страница</th>
                      <th className="px-4 py-3 font-semibold">Имя</th>
                      <th className="px-4 py-3 font-semibold">Контакт</th>
                      <th className="px-4 py-3 font-semibold">Дата</th>
                      <th className="px-4 py-3 font-semibold">Комментарий</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {inquiries.length ? (
                      inquiries.map((inquiry) => (
                        <tr key={inquiry.id} className="align-top text-white/90">
                          <td className="px-4 py-4">{inquiry.pageSlug}</td>
                          <td className="px-4 py-4">{inquiry.name}</td>
                          <td className="px-4 py-4">{inquiry.contact}</td>
                          <td className="px-4 py-4">{inquiry.eventDate || "-"}</td>
                          <td className="px-4 py-4 text-white/60">{inquiry.message || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-white/55">
                          Заявок пока нет.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
