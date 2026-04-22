import Link from "next/link";
import { notFound } from "next/navigation";

import { resetPageContent, savePageContent } from "@/app/actions";
import { getPageContent, getPageSlugs } from "@/lib/content";

type AdminEditorPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminEditorPage({
  params,
  searchParams,
}: AdminEditorPageProps) {
  const { slug } = await params;
  const query = await searchParams;

  if (!getPageSlugs().includes(slug as never)) {
    notFound();
  }

  const content = await getPageContent(slug as never);

  return (
    <main className="min-h-screen bg-[#0b1220] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/admin" className="text-sm text-slate-400 transition hover:text-white">
              ← Назад в admin
            </Link>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.32em] text-[#c8a36a]">
              Редактор страницы
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">{slug}</h1>
          </div>
          {query.saved ? (
            <p className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
              Изменения сохранены.
            </p>
          ) : null}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Как редактировать</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-300">
              <li>Поле ниже хранит всю страницу целиком в формате JSON.</li>
              <li>Можно менять тексты, картинки, CTA, отзывы, FAQ и пакеты.</li>
              <li>После сохранения страница сразу подхватывает новые данные из базы.</li>
              <li>Кнопка сброса возвращает встроенный дефолтный контент.</li>
            </ul>
          </aside>

          <div className="grid gap-5">
            <form action={savePageContent} className="grid gap-4">
              <input type="hidden" name="slug" value={slug} />
              <label className="grid gap-2 text-sm font-medium text-slate-200">
                JSON страницы
                <textarea
                  name="content"
                  rows={34}
                  defaultValue={JSON.stringify(content, null, 2)}
                  className="min-h-[760px] rounded-[1.75rem] border border-white/10 bg-[#020617] px-5 py-4 font-mono text-sm leading-6 text-slate-200 outline-none transition focus:border-[#c8a36a]"
                />
              </label>
              <button
                type="submit"
                className="w-fit rounded-full bg-[#c8a36a] px-5 py-3 text-sm font-semibold text-[#0b1220]"
              >
                Сохранить в БД
              </button>
            </form>

            <form action={resetPageContent}>
              <input type="hidden" name="slug" value={slug} />
              <button
                type="submit"
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white"
              >
                Сбросить к дефолту
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
