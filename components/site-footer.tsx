type SiteFooterProps = {
  title: string;
  subtitle: string;
  phone: string;
  telegram: string;
  whatsapp: string;
  instagram: string;
};

export function SiteFooter({ title, subtitle, phone, telegram, whatsapp, instagram }: SiteFooterProps) {
  return (
    <footer className="bg-black px-4 py-10 text-white sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 border-t border-white/10 pt-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.42em] text-[#ffe100]">Контакты</p>
          <h2 className="mt-4 max-w-3xl text-[clamp(2rem,4vw,3.5rem)] font-black uppercase leading-[0.9] tracking-[-0.055em]">{title}</h2>
          <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-white/55">{subtitle}</p>
          <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="mt-6 inline-flex text-2xl font-black text-white transition hover:text-[#ffe100]">
            {phone}
          </a>
        </div>
        <div className="flex flex-wrap gap-3">
          <a className="tilda-button tilda-button-outline-light min-h-0 px-4 py-2 text-sm" href={telegram}>
            Telegram
          </a>
          <a className="tilda-button tilda-button-outline-light min-h-0 px-4 py-2 text-sm" href={whatsapp}>
            WhatsApp
          </a>
          <a className="tilda-button tilda-button-outline-light min-h-0 px-4 py-2 text-sm" href={instagram}>
            Instagram
          </a>
        </div>
      </div>
    </footer>
  );
}
