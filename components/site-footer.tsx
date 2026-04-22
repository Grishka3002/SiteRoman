type SiteFooterProps = {
  title: string;
  subtitle: string;
  phone: string;
  telegram: string;
  whatsapp: string;
  instagram: string;
};

export function SiteFooter({
  title,
  subtitle,
  phone,
  telegram,
  whatsapp,
  instagram,
}: SiteFooterProps) {
  return (
    <footer className="border-t border-white/10 bg-[#0b1220]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-14 text-white sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#c8a36a]">
            Контакты
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">{subtitle}</p>
          <a
            href={`tel:${phone.replace(/[^+\d]/g, "")}`}
            className="mt-6 inline-flex text-2xl font-semibold text-white"
          >
            {phone}
          </a>
        </div>
        <div className="grid gap-3 text-sm text-slate-300">
          <a href={telegram} className="transition hover:text-white">
            Telegram
          </a>
          <a href={whatsapp} className="transition hover:text-white">
            WhatsApp
          </a>
          <a href={instagram} className="transition hover:text-white">
            Instagram*
          </a>
          <p className="pt-4 text-xs text-slate-500">
            *Instagram принадлежит Meta, деятельность которой признана экстремистской и запрещена на территории РФ.
          </p>
        </div>
      </div>
    </footer>
  );
}
