import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0b1220] px-5 text-center text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#c8a36a]">404</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Страница не найдена</h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-slate-400">
        Возможно, адрес изменился. Вернитесь на главную или откройте нужный раздел.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-[#c8a36a] px-5 py-3 text-sm font-semibold text-[#0b1220]">
          На главную
        </Link>
        <Link href="/corporate" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white">
          Корпоративы
        </Link>
      </div>
    </main>
  );
}
