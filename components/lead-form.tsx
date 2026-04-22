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
      className="inline-flex items-center justify-center rounded-full bg-[#c8a36a] px-6 py-3 text-sm font-semibold text-[#0b1220] transition hover:bg-[#d8b981] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Отправляем..." : "Отправить заявку"}
    </button>
  );
}

export function LeadForm({
  pageSlug,
  pageKind,
  title,
  subtitle,
  gifts,
  action,
}: LeadFormProps) {
  const isCorporate = pageSlug === "corporate";

  return (
    <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_80px_rgba(11,18,32,0.14)] sm:p-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#9a7b4d]">
          Заявка
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 text-base leading-7 text-[#4b5563]">{subtitle}</p>
      </div>

      <form action={action} className="mt-8 grid gap-5">
        <input type="hidden" name="pageSlug" value={pageSlug} />
        <input type="hidden" name="pageKind" value={pageKind ?? ""} />

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-[#111827]">
            Имя
            <input
              required
              name="name"
              className="rounded-2xl border border-black/10 bg-[#f7f6f2] px-4 py-3 text-base outline-none transition focus:border-[#c8a36a]"
              placeholder="Как к вам обращаться"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#111827]">
            Телефон или мессенджер
            <input
              required
              name="contact"
              className="rounded-2xl border border-black/10 bg-[#f7f6f2] px-4 py-3 text-base outline-none transition focus:border-[#c8a36a]"
              placeholder="+7..."
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-[#111827]">
            Дата
            <input
              name="eventDate"
              className="rounded-2xl border border-black/10 bg-[#f7f6f2] px-4 py-3 text-base outline-none transition focus:border-[#c8a36a]"
              placeholder="Например, 14 августа"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#111827]">
            Город / площадка
            <input
              name="location"
              className="rounded-2xl border border-black/10 bg-[#f7f6f2] px-4 py-3 text-base outline-none transition focus:border-[#c8a36a]"
              placeholder="Где пройдет событие"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#111827]">
            Гостей
            <select
              name="guestCount"
              className="rounded-2xl border border-black/10 bg-[#f7f6f2] px-4 py-3 text-base outline-none transition focus:border-[#c8a36a]"
              defaultValue=""
            >
              <option value="">Выберите диапазон</option>
              <option>10-30</option>
              <option>30-50</option>
              <option>50-100</option>
              <option>100+</option>
            </select>
          </label>
        </div>

        {isCorporate ? (
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[#111827]">
              Компания
              <input
                name="company"
                className="rounded-2xl border border-black/10 bg-[#f7f6f2] px-4 py-3 text-base outline-none transition focus:border-[#c8a36a]"
                placeholder="Название компании"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#111827]">
              Формат события
              <input
                name="format"
                className="rounded-2xl border border-black/10 bg-[#f7f6f2] px-4 py-3 text-base outline-none transition focus:border-[#c8a36a]"
                placeholder="Корпоратив, форум, юбилей..."
              />
            </label>
          </div>
        ) : null}

        {gifts?.length ? (
          <label className="grid gap-2 text-sm font-medium text-[#111827]">
            Подарок / бонус
            <select
              name="gift"
              className="rounded-2xl border border-black/10 bg-[#f7f6f2] px-4 py-3 text-base outline-none transition focus:border-[#c8a36a]"
              defaultValue={gifts[0]}
            >
              {gifts.map((gift) => (
                <option key={gift} value={gift}>
                  {gift}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="grid gap-2 text-sm font-medium text-[#111827]">
          Комментарий
          <textarea
            name="message"
            rows={4}
            className="rounded-[1.5rem] border border-black/10 bg-[#f7f6f2] px-4 py-3 text-base outline-none transition focus:border-[#c8a36a]"
            placeholder={
              isCorporate
                ? "Расскажите про задачу, аудиторию, тайминг или уровень продакшна"
                : "Если есть пожелания по атмосфере, площадке или формату, напишите их здесь"
            }
          />
        </label>

        <div className="flex flex-col gap-4 border-t border-black/10 pt-4 text-sm text-[#6b7280] sm:flex-row sm:items-center sm:justify-between">
          <p>Отправляя заявку, вы соглашаетесь на обработку персональных данных.</p>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
