import { submitInquiry } from "@/app/actions";
import type { WeddingPageContent } from "@/lib/site-data";

type BookingFormProps = {
  page: WeddingPageContent;
  sentStatus?: string;
};

export function BookingForm({ page, sentStatus }: BookingFormProps) {
  return (
    <section id="contact" className="tilda-section bg-[#ffe100] px-4 pb-12 pt-16 text-black sm:px-6 lg:pb-16 lg:pt-20">
      <div className="mx-auto grid max-w-7xl gap-9 lg:grid-cols-[minmax(0,0.92fr)_minmax(460px,0.88fr)] lg:items-start lg:gap-12">
        <div className="relative z-0 lg:sticky lg:top-8">
          <p className="text-xs font-black uppercase tracking-[0.42em]">Стоимость</p>
          <h2 className="mt-5 max-w-[700px] break-words text-[clamp(2.35rem,5.35vw,5.15rem)] font-black uppercase leading-[0.9] tracking-[-0.06em]">
            {page.leadForm.title}
          </h2>
          <p className="mt-5 max-w-xl text-[clamp(1rem,1.5vw,1.12rem)] font-medium leading-7 text-black/70">
            {page.leadForm.subtitle}
          </p>

          <div className="mt-7 grid gap-3">
            {page.leadForm.gifts.map((gift) => (
              <div key={gift} className="flex items-center gap-3 rounded-full bg-black px-4 py-3 text-white sm:px-5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffe100]" />
                <span className="text-xs font-semibold uppercase tracking-[0.08em] sm:text-sm">{gift}</span>
              </div>
            ))}
          </div>
        </div>

        <form action={submitInquiry} className="relative z-10 rounded-[1.5rem] bg-black p-5 text-white shadow-2xl sm:p-7">
          <input type="hidden" name="pageSlug" value="wedding" />
          <input type="hidden" name="pageKind" value="wedding" />

          {sentStatus === "1" ? (
            <div className="mb-5 rounded-[1rem] border border-[#ffe100]/40 bg-[#ffe100] px-4 py-3 text-sm font-semibold text-black">
              Заявка отправлена. Роман свяжется с вами в ближайшее время.
            </div>
          ) : null}
          {sentStatus === "error" ? (
            <div className="mb-5 rounded-[1rem] border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-100">
              Не удалось сохранить заявку. Попробуйте еще раз или напишите напрямую в WhatsApp.
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ваше имя" name="name" placeholder="Анна" required />
            <Field label="Телефон или Telegram" name="contact" placeholder="+7..." required />
            <Field label="Дата свадьбы" name="eventDate" placeholder="15.08.2026" />
            <Field label="Город / площадка" name="location" placeholder="Владивосток" />
            <Field label="Количество гостей" name="guestCount" placeholder="70" />
            <Field label="Формат" name="format" placeholder="Церемония + банкет" />
          </div>

          <label className="mt-4 grid gap-2 text-sm font-semibold text-white/75">
            Какой подарок интересен?
            <select
              name="gift"
              className="h-[52px] rounded-[1rem] border border-white/10 bg-white px-4 text-base text-black outline-none transition focus:border-[#ffe100]"
              defaultValue=""
            >
              <option value="" disabled>
                Выберите вариант
              </option>
              {page.leadForm.gifts.map((gift) => (
                <option key={gift} value={gift}>
                  {gift}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-4 grid gap-2 text-sm font-semibold text-white/75">
            Что важно на свадьбе?
            <textarea
              name="message"
              rows={5}
              placeholder="Расскажите пару слов о формате, гостях и пожеланиях"
              className="resize-none rounded-[1rem] border border-white/10 bg-white px-4 py-4 text-base text-black outline-none transition placeholder:text-black/35 focus:border-[#ffe100]"
            />
          </label>

          <button
            type="submit"
            className="tilda-button tilda-button-yellow mt-6 w-full sm:text-base"
          >
            Отправить заявку
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-white/45">
            Нажимая кнопку, вы соглашаетесь на обработку данных для связи по заявке.
          </p>
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-white/75">
      {label}
      <input
        name={name}
        placeholder={placeholder}
        required={required}
        className="h-[52px] rounded-[1rem] border border-white/10 bg-white px-4 text-base text-black outline-none transition placeholder:text-black/35 focus:border-[#ffe100]"
      />
    </label>
  );
}
