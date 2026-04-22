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
    <main className="min-h-screen bg-[#0b1220] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#c8a36a]">
              Admin
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">
              Управление страницами и заявками
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-400">
            Если переменная DATABASE_URL не настроена, сайт берет контент из встроенного JSON. После подключения базы правки из admin будут сохраняться в PostgreSQL.
          </p>
        </div>

        <section className="mt-10 grid gap-5 lg:grid-cols-3">
          {pages.map(({ slug, content }) => (
            <article key={slug} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.32em] text-[#c8a36a]">
                {slug}
              </div>
              <h2 className="mt-3 text-2xl font-semibold">{content.hero.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{content.seoDescription}</p>
              <div className="mt-6 flex gap-3">
                <Link
                  href={`/admin/${slug}`}
                  className="rounded-full bg-[#c8a36a] px-4 py-2 text-sm font-semibold text-[#0b1220]"
                >
                  Редактировать
                </Link>
                <Link
                  href={slug === "home" ? "/" : `/${slug}`}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white"
                >
                  Открыть
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold">Последние заявки</h2>
          <p className="mt-2 text-sm text-slate-400">
            {process.env.DATABASE_URL
              ? "Форма на страницах сохраняет все заявки сюда."
              : "Для хранения заявок подключите DATABASE_URL в .env.local и на Railway."}
          </p>
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Страница</th>
                  <th className="px-4 py-3 font-medium">Имя</th>
                  <th className="px-4 py-3 font-medium">Контакт</th>
                  <th className="px-4 py-3 font-medium">Дата</th>
                  <th className="px-4 py-3 font-medium">Комментарий</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {inquiries.length ? (
                  inquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="align-top text-slate-200">
                      <td className="px-4 py-4">{inquiry.pageSlug}</td>
                      <td className="px-4 py-4">{inquiry.name}</td>
                      <td className="px-4 py-4">{inquiry.contact}</td>
                      <td className="px-4 py-4">{inquiry.eventDate || "-"}</td>
                      <td className="px-4 py-4 text-slate-400">{inquiry.message || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-slate-400">
                      Заявок пока нет или база не подключена.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
