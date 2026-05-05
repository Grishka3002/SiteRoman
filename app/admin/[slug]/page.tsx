import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminContentForm } from "@/components/admin/admin-content-form";
import { getPageContent, getPageSlugs, type PageSlug } from "@/lib/content";

type AdminEditorPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminEditorPage({ params, searchParams }: AdminEditorPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const pageSlugs = getPageSlugs();

  if (!pageSlugs.includes(slug as PageSlug)) {
    notFound();
  }

  const typedSlug = slug as PageSlug;
  const content = await getPageContent(typedSlug);
  const notice = query.saved
    ? "Изменения сохранены."
    : query.reset
      ? "Контент сброшен к дефолту."
      : query.saved === "local-only"
        ? "База не подключена: изменения не записаны."
        : undefined;

  return (
    <main className="min-h-screen bg-black px-5 py-10 text-white sm:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#101010] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="border-b border-white/10 bg-[#ffe100] px-6 py-8 text-black sm:px-10">
            <Link href="/admin" className="text-sm font-black text-black/70 transition hover:text-black">
              ← Назад в admin
            </Link>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.45em]">Редактор</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h1 className="text-4xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-6xl">{slug}</h1>
              <Link
                href={slug === "home" ? "/" : `/${slug}`}
                className="rounded-full bg-black px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-white hover:text-black"
              >
                Открыть страницу
              </Link>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-8 sm:px-10 lg:grid-cols-[0.78fr_1.22fr]">
            <aside className="h-fit rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 lg:sticky lg:top-6">
              <h2 className="text-xl font-black uppercase tracking-[-0.04em]">Как редактировать</h2>
              <ul className="mt-4 grid gap-3 text-sm font-medium leading-6 text-white/65">
                <li>Меняйте тексты, ссылки, изображения, отзывы, FAQ, пакеты и контакты обычными полями.</li>
                <li>Повторяемые блоки можно добавлять и удалять прямо в админке.</li>
                <li>После сохранения данные попадут в базу Railway, если подключен `DATABASE_URL`.</li>
                <li>Если базы нет, сайт продолжит работать на встроенном контенте.</li>
              </ul>
            </aside>

            <AdminContentForm slug={typedSlug} content={content} notice={notice} />
          </div>
        </div>
      </div>
    </main>
  );
}
