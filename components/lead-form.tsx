"use client";

import { useFormStatus } from "react-dom";

type LeadFormProps = {
  pageSlug: string;
  pageKind?: string;
  title: string;
  subtitle: string;
  gifts?: string[];
  action: (formData: FormData) => void;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="tilda-button tilda-button-yellow w-full disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
    >
      {pending ? "Отправляем..." : "Отправить заявку"}
    </button>
  );
}

export function LeadForm({ pageSlug, pageKind, title, subtitle, gifts, action }: LeadFormProps) {
  const isCorporate = pageSlug === "corporate";

  return (
    <div className="grid gap-9 lg:grid-cols-[minmax(0,0.92fr)_minmax(460px,0.88fr)] lg:items-start lg:gap-12">
      <div className="relative z-0 lg:sticky lg:top-8">
        <p className="text-xs font-black uppercase tracking-[0.42em]">Стоимость</p>
        <h2 className="mt-5 max-w-[700px] break-words text-[clamp(2.35rem,5.35vw,5.15rem)] font-black uppercase leading-[0.9] tracking-[-0.06em]">
          {title}
        </h2>
        <p className="mt-5 max-w-xl text-[clamp(1rem,1.5vw,1.12rem)] font-medium leading-7 text-black/70">
          {subtitle}
        </p>

        {gifts?.length ? (
          <div className="mt-7 grid gap-3">
            {gifts.map((gift) => (
              <div key={gift} className="flex items-center gap-3 rounded-full bg-black px-4 py-3 text-white sm:px-5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffe100]" />
                <span className="text-xs font-semibold uppercase tracking-[0.08em] sm:text-sm">{gift}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <form action={action} className="relative z-10 rounded-[1.5rem] bg-black p-5 text-white shadow-2xl sm:p-7">
        <input type="hidden" name="pageSlug" value={pageSlug} />
        <input type="hidden" name="pageKind" value={pageKind ?? ""} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ваше имя" name="name" placeholder="Анна" required />
          <Field label="Телефон или Telegram" name="contact" placeholder="+7..." required />
          <Field label="Дата события" name="eventDate" placeholder="15.08.2026" />
          <Field label="Город / площадка" name="location" placeholder="Владивосток" />
          <Field label="Количество гостей" name="guestCount" placeholder="70" />
          <Field label={isCorporate ? "Формат события" : "Формат"} name="format" placeholder={isCorporate ? "Корпоратив, форум, юбилей" : "Церемония + банкет"} />
          {isCorporate ? <Field label="Компания" name="company" placeholder="Название компании" /> : null}
        </div>

        {gifts?.length ? (
          <label className="mt-4 grid gap-2 text-sm font-semibold text-white/75">
            Подарок / бонус
            <select
              name="gift"
              className="h-[52px] rounded-[1rem] border border-white/10 bg-white px-4 text-base text-black outline-none transition focus:border-[#ffe100]"
              defaultValue=""
            >
              <option value="" disabled>
                Выберите вариант
              </option>
              {gifts.map((gift) => (
                <option key={gift} value={gift}>
                  {gift}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="mt-4 grid gap-2 text-sm font-semibold text-white/75">
          Что важно учесть?
          <textarea
            name="message"
            rows={5}
            placeholder={isCorporate ? "Расскажите про задачу, аудиторию, тайминг или уровень продакшна" : "Расскажите пару слов о формате, гостях и пожеланиях"}
            className="resize-none rounded-[1rem] border border-white/10 bg-white px-4 py-4 text-base text-black outline-none transition placeholder:text-black/35 focus:border-[#ffe100]"
          />
        </label>

        <div className="mt-6">
          <SubmitButton />
        </div>

        <p className="mt-4 text-center text-xs leading-5 text-white/45">
          Нажимая кнопку, вы соглашаетесь на обработку данных для связи по заявке.
        </p>
      </form>
    </div>
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
