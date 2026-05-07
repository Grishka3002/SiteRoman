"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";

import { resetPageContent, savePageContent } from "@/app/actions";
import type { PageSlug, SitePage } from "@/lib/content";

type AdminContentFormProps = {
  slug: PageSlug;
  content: SitePage;
  notice?: string;
};

type FieldType = "input" | "textarea";
type MediaKind = "image" | "video";

type ObjectField = {
  key: string;
  label: string;
  type?: FieldType;
  mediaKind?: MediaKind;
};

type JsonRecord = Record<string, unknown>;

const inputClass =
  "w-full rounded-[1rem] border border-white/10 bg-black px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/25 focus:border-[#ffe100]";
const textareaClass =
  "w-full resize-y rounded-[1rem] border border-white/10 bg-black px-4 py-3 text-sm font-medium leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-[#ffe100]";

export function AdminContentForm({ slug, content, notice }: AdminContentFormProps) {
  const [draft, setDraft] = useDraft(content);

  const showBio = Boolean(getRecord(draft, ["bio"]));
  const showIntro = Boolean(getRecord(draft, ["intro"]));
  const showLeadForm = Boolean(getRecord(draft, ["leadForm"]));

  return (
    <div className="grid gap-6">
      {notice ? (
        <div className="rounded-full border border-[#ffe100]/40 bg-[#ffe100] px-5 py-3 text-sm font-black text-black">
          {notice}
        </div>
      ) : null}

      <form action={savePageContent} className="grid gap-6">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="content" value={JSON.stringify(draft)} />

        <EditorSection title="SEO" hint="То, что видят поисковики и вкладка браузера.">
          <TextField label="Title страницы" path={["seoTitle"]} value={draft} onChange={setDraft} />
          <TextArea label="Description страницы" path={["seoDescription"]} value={draft} onChange={setDraft} rows={3} />
        </EditorSection>

        <EditorSection title="Hero" hint="Первый экран: заголовок, кнопки и главное фото.">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Маленькая подпись" path={["hero", "eyebrow"]} value={draft} onChange={setDraft} />
            <TextField label="Большой заголовок / имя" path={["hero", "title"]} value={draft} onChange={setDraft} />
          </div>
          <TextArea label="Описание" path={["hero", "subtitle"]} value={draft} onChange={setDraft} rows={3} />
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Текст основной кнопки" path={["hero", "primaryLabel"]} value={draft} onChange={setDraft} />
            <TextField label="Ссылка основной кнопки" path={["hero", "primaryHref"]} value={draft} onChange={setDraft} />
            <TextField label="Текст второй кнопки" path={["hero", "secondaryLabel"]} value={draft} onChange={setDraft} />
            <TextField label="Ссылка второй кнопки" path={["hero", "secondaryHref"]} value={draft} onChange={setDraft} />
          </div>
          <TextField label="Главное изображение" path={["hero", "image"]} value={draft} onChange={setDraft} mediaKind="image" />
          <ObjectList
            title="Цифры в hero"
            path={["hero", "stats"]}
            fields={[
              { key: "value", label: "Значение" },
              { key: "label", label: "Подпись" },
            ]}
            emptyItem={{ value: "20+", label: "лет опыта" }}
            value={draft}
            onChange={setDraft}
          />
        </EditorSection>

        {getArray(draft, ["nav"]).length ? (
          <EditorSection title="Навигация" hint="Пункты верхней плашки на странице.">
            <ObjectList
              title="Пункты меню"
              path={["nav"]}
              fields={[
                { key: "label", label: "Название" },
                { key: "href", label: "Ссылка" },
              ]}
              emptyItem={{ label: "Раздел", href: "#section" }}
              value={draft}
              onChange={setDraft}
            />
          </EditorSection>
        ) : null}

        {showBio ? (
          <EditorSection title="О ведущем" hint="Текстовый блок на главной странице.">
            <TextField label="Заголовок" path={["bio", "title"]} value={draft} onChange={setDraft} />
            <StringList title="Абзацы" path={["bio", "paragraphs"]} value={draft} onChange={setDraft} />
          </EditorSection>
        ) : null}

        {showIntro ? (
          <EditorSection title="Описание страницы" hint="Основной текстовый блок после первого экрана.">
            <TextField label="Заголовок" path={["intro", "title"]} value={draft} onChange={setDraft} />
            <StringList title="Абзацы" path={["intro", "paragraphs"]} value={draft} onChange={setDraft} />
          </EditorSection>
        ) : null}

        {getArray(draft, ["audiences"]).length ? (
          <EditorSection title="Направления" hint="Карточки перехода на страницы свадьбы / корпоративы.">
            <ObjectList
              title="Карточки"
              path={["audiences"]}
              fields={[
                { key: "title", label: "Заголовок" },
                { key: "description", label: "Описание", type: "textarea" },
                { key: "href", label: "Ссылка" },
                { key: "image", label: "Фото", mediaKind: "image" },
              ]}
              emptyItem={{ title: "Новое направление", description: "", href: "/", image: "/media/" }}
              value={draft}
              onChange={setDraft}
            />
          </EditorSection>
        ) : null}

        <EditableCollection title="Преимущества" path={getArray(draft, ["highlights"]).length ? ["highlights"] : ["advantages"]} value={draft} onChange={setDraft} />

        {getArray(draft, ["videos"]).length ? (
          <EditorSection title="Видео" hint="ID роликов Kinescope для карточек на сайте.">
            <ObjectList
              title="Ролики"
              path={["videos"]}
              fields={[
                { key: "title", label: "Название" },
                { key: "kinescopeId", label: "Kinescope ID" },
                { key: "localSrc", label: "Локальное видео", mediaKind: "video" },
              ]}
              emptyItem={{ title: "Новое видео", kinescopeId: "", localSrc: "" }}
              value={draft}
              onChange={setDraft}
            />
          </EditorSection>
        ) : null}

        {getArray(draft, ["packages"]).length ? (
          <EditorSection title="Пакеты" hint="Тарифы, форматы и списки преимуществ.">
            <PackageList value={draft} onChange={setDraft} />
          </EditorSection>
        ) : null}

        {getArray(draft, ["gallery"]).length ? (
          <EditorSection title="Галерея" hint="Пути к изображениям из public/media.">
            <StringList title="Изображения" path={["gallery"]} value={draft} onChange={setDraft} mediaKind="image" />
          </EditorSection>
        ) : null}

        {getArray(draft, ["testimonials"]).length ? (
          <EditorSection title="Отзывы" hint="Отзывы на публичных страницах.">
            <ObjectList
              title="Отзывы"
              path={["testimonials"]}
              fields={[
                { key: "name", label: "Имя" },
                { key: "company", label: "Компания / подпись" },
                { key: "text", label: "Текст", type: "textarea" },
              ]}
              emptyItem={{ name: "Новый отзыв", company: "", text: "" }}
              value={draft}
              onChange={setDraft}
            />
          </EditorSection>
        ) : null}

        {getArray(draft, ["faq"]).length ? (
          <EditorSection title="FAQ" hint="Частые вопросы и ответы.">
            <ObjectList
              title="Вопросы"
              path={["faq"]}
              fields={[
                { key: "question", label: "Вопрос" },
                { key: "answer", label: "Ответ", type: "textarea" },
              ]}
              emptyItem={{ question: "Новый вопрос", answer: "" }}
              value={draft}
              onChange={setDraft}
            />
          </EditorSection>
        ) : null}

        {showLeadForm ? (
          <EditorSection title="Форма заявки" hint="Заголовок, описание и бонусы в форме.">
            <TextField label="Заголовок формы" path={["leadForm", "title"]} value={draft} onChange={setDraft} />
            <TextArea label="Описание формы" path={["leadForm", "subtitle"]} value={draft} onChange={setDraft} rows={3} />
            <StringList title="Бонусы / подарки" path={["leadForm", "gifts"]} value={draft} onChange={setDraft} />
          </EditorSection>
        ) : null}

        <EditorSection title="Контакты" hint="Кнопки и ссылки в футере / форме.">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Заголовок" path={["contact", "title"]} value={draft} onChange={setDraft} />
            <TextField label="Телефон" path={["contact", "phone"]} value={draft} onChange={setDraft} />
            <TextField label="Telegram" path={["contact", "telegram"]} value={draft} onChange={setDraft} />
            <TextField label="WhatsApp" path={["contact", "whatsapp"]} value={draft} onChange={setDraft} />
            <TextField label="Instagram" path={["contact", "instagram"]} value={draft} onChange={setDraft} />
          </div>
          <TextArea label="Описание" path={["contact", "subtitle"]} value={draft} onChange={setDraft} rows={3} />
        </EditorSection>

        <div className="sticky bottom-4 z-10 flex justify-end rounded-[1.25rem] border border-white/10 bg-black/90 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur">
          <button type="submit" className="rounded-full bg-[#ffe100] px-6 py-3 text-sm font-black uppercase tracking-[0.16em] text-black transition hover:bg-white">
            Сохранить изменения
          </button>
        </div>
      </form>

      <form action={resetPageContent}>
        <input type="hidden" name="slug" value={slug} />
        <button type="submit" className="rounded-full border border-white/15 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:border-[#ffe100] hover:text-[#ffe100]">
          Сбросить к дефолту
        </button>
      </form>
    </div>
  );
}

function useDraft(content: SitePage): [JsonRecord, (path: Array<string | number>, value: unknown) => void] {
  const initialDraft = content as unknown as JsonRecord;
  const [draft, setDraft] = useState(initialDraft);

  const updateDraft = (path: Array<string | number>, value: unknown) => {
    setDraft((current) => setValueAtPath(current, path, value));
  };

  return [draft, updateDraft];
}

function EditorSection({ title, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.22)] sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.38em] text-[#ffe100]">{title}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function TextField({ label, path, value, onChange, mediaKind }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-black text-white/75">
      {label}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input className={inputClass} value={getString(value, path)} onChange={(event) => onChange(path, event.target.value)} />
        {mediaKind ? <MediaUploadButton kind={mediaKind} onUploaded={(filePath) => onChange(path, filePath)} /> : null}
      </div>
    </label>
  );
}

function TextArea({ label, path, value, onChange, rows = 4 }: FieldProps & { rows?: number }) {
  return (
    <label className="grid gap-2 text-sm font-black text-white/75">
      {label}
      <textarea className={textareaClass} rows={rows} value={getString(value, path)} onChange={(event) => onChange(path, event.target.value)} />
    </label>
  );
}

type FieldProps = {
  label: string;
  path: Array<string | number>;
  value: JsonRecord;
  onChange: (path: Array<string | number>, value: unknown) => void;
  mediaKind?: MediaKind;
};

function EditableCollection({
  title,
  path,
  value,
  onChange,
}: {
  title: string;
  path: string[];
  value: JsonRecord;
  onChange: (path: Array<string | number>, value: unknown) => void;
}) {
  if (!getArray(value, path).length) {
    return null;
  }

  return (
    <EditorSection title={title} hint="Карточки с короткими преимуществами.">
      <ObjectList
        title="Карточки"
        path={path}
        fields={[
          { key: "title", label: "Заголовок" },
          { key: "text", label: "Текст", type: "textarea" },
        ]}
        emptyItem={{ title: "Новое преимущество", text: "" }}
        value={value}
        onChange={onChange}
      />
    </EditorSection>
  );
}

function ObjectList({
  title,
  path,
  fields,
  emptyItem,
  value,
  onChange,
}: {
  title: string;
  path: Array<string | number>;
  fields: ObjectField[];
  emptyItem: JsonRecord;
  value: JsonRecord;
  onChange: (path: Array<string | number>, value: unknown) => void;
}) {
  const items = getArray(value, path).map((item) => (isRecord(item) ? item : {}));

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-black uppercase tracking-[-0.03em] text-white">{title}</h3>
        <button type="button" onClick={() => onChange(path, [...items, emptyItem])} className="rounded-full bg-[#ffe100] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white">
          Добавить
        </button>
      </div>

      <div className="grid gap-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-[1.25rem] border border-white/10 bg-black/45 p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="text-xs font-black uppercase tracking-[0.24em] text-[#ffe100]">#{index + 1}</span>
              <button type="button" onClick={() => onChange(path, items.filter((_, itemIndex) => itemIndex !== index))} className="text-xs font-black uppercase tracking-[0.12em] text-white/45 transition hover:text-[#ffe100]">
                Удалить
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((field) => (
                <label key={field.key} className={["grid gap-2 text-sm font-black text-white/70", field.type === "textarea" ? "md:col-span-2" : ""].join(" ")}>
                  {field.label}
                  {field.mediaKind ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        className={inputClass}
                        value={String(item[field.key] ?? "")}
                        onChange={(event) => onChange([...path, index, field.key], event.target.value)}
                      />
                      <MediaUploadButton kind={field.mediaKind} onUploaded={(filePath) => onChange([...path, index, field.key], filePath)} />
                    </div>
                  ) : field.type === "textarea" ? (
                    <textarea
                      className={textareaClass}
                      rows={3}
                      value={String(item[field.key] ?? "")}
                      onChange={(event) => onChange([...path, index, field.key], event.target.value)}
                    />
                  ) : (
                    <input
                      className={inputClass}
                      value={String(item[field.key] ?? "")}
                      onChange={(event) => onChange([...path, index, field.key], event.target.value)}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StringList({
  title,
  path,
  value,
  onChange,
  mediaKind,
}: {
  title: string;
  path: Array<string | number>;
  value: JsonRecord;
  onChange: (path: Array<string | number>, value: unknown) => void;
  mediaKind?: MediaKind;
}) {
  const items = getArray(value, path).map((item) => String(item ?? ""));

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-black uppercase tracking-[-0.03em] text-white">{title}</h3>
        <button type="button" onClick={() => onChange(path, [...items, ""])} className="rounded-full bg-[#ffe100] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white">
          Добавить
        </button>
      </div>

      {items.map((item, index) => (
        <div key={index} className="grid gap-2 rounded-[1rem] border border-white/10 bg-black/45 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-[0.24em] text-[#ffe100]">#{index + 1}</span>
            <button type="button" onClick={() => onChange(path, items.filter((_, itemIndex) => itemIndex !== index))} className="text-xs font-black uppercase tracking-[0.12em] text-white/45 transition hover:text-[#ffe100]">
              Удалить
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <textarea className={textareaClass} rows={2} value={item} onChange={(event) => onChange([...path, index], event.target.value)} />
            {mediaKind ? <MediaUploadButton kind={mediaKind} onUploaded={(filePath) => onChange([...path, index], filePath)} /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function PackageList({ value, onChange }: { value: JsonRecord; onChange: (path: Array<string | number>, value: unknown) => void }) {
  const path = ["packages"];
  const items = getArray(value, path).map((item) => (isRecord(item) ? item : {}));

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-black uppercase tracking-[-0.03em] text-white">Карточки пакетов</h3>
        <button
          type="button"
          onClick={() => onChange(path, [...items, { name: "New", tag: "", description: "", features: [""] }])}
          className="rounded-full bg-[#ffe100] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white"
        >
          Добавить
        </button>
      </div>

      {items.map((item, index) => (
        <div key={index} className="rounded-[1.25rem] border border-white/10 bg-black/45 p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="text-xs font-black uppercase tracking-[0.24em] text-[#ffe100]">Пакет #{index + 1}</span>
            <button type="button" onClick={() => onChange(path, items.filter((_, itemIndex) => itemIndex !== index))} className="text-xs font-black uppercase tracking-[0.12em] text-white/45 transition hover:text-[#ffe100]">
              Удалить
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-black text-white/70">
              Название
              <input className={inputClass} value={String(item.name ?? "")} onChange={(event) => onChange([...path, index, "name"], event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-black text-white/70">
              Метка
              <input className={inputClass} value={String(item.tag ?? "")} onChange={(event) => onChange([...path, index, "tag"], event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-black text-white/70 md:col-span-2">
              Описание
              <textarea className={textareaClass} rows={3} value={String(item.description ?? "")} onChange={(event) => onChange([...path, index, "description"], event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-black text-white/70 md:col-span-2">
              Пункты пакета, каждый с новой строки
              <textarea
                className={textareaClass}
                rows={5}
                value={getArray(item, ["features"]).join("\n")}
                onChange={(event) =>
                  onChange(
                    [...path, index, "features"],
                    event.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean),
                  )
                }
              />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

function MediaUploadButton({ kind, onUploaded }: { kind: MediaKind; onUploaded: (path: string) => void }) {
  const [status, setStatus] = useState("");

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const sourceFile = input.files?.[0];

    if (!sourceFile) {
      return;
    }

    setStatus("Загрузка...");

    try {
      const file = kind === "image" ? await convertImageToWebp(sourceFile) : sourceFile;
      const formData = new FormData();

      formData.append("kind", kind);
      formData.append("file", file);

      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { path?: string; error?: string };

      if (!response.ok || !payload.path) {
        throw new Error(payload.error || "Upload failed");
      }

      onUploaded(payload.path);
      setStatus("Готово");
    } catch {
      setStatus("Ошибка");
    } finally {
      input.value = "";
    }
  };

  return (
    <span className="flex min-w-[150px] flex-col gap-1">
      <label className="grid cursor-pointer place-items-center rounded-full border border-[#ffe100]/45 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.11em] text-[#ffe100] transition hover:bg-[#ffe100] hover:text-black">
        {kind === "image" ? "Загрузить WebP" : "Загрузить видео"}
        <input
          type="file"
          accept={kind === "image" ? "image/*" : "video/mp4,video/webm,video/quicktime"}
          className="sr-only"
          onChange={handleFile}
        />
      </label>
      {status ? <span className="text-center text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/45">{status}</span> : null}
    </span>
  );
}

async function convertImageToWebp(file: File) {
  const bitmap = await createImageBitmap(file);
  const maxSide = 1920;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  if (!context) {
    throw new Error("Canvas is not available");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("WebP conversion failed"));
        }
      },
      "image/webp",
      0.82,
    );
  });

  const filename = file.name.replace(/\.[^.]+$/, "") || "image";

  return new File([blob], `${filename}.webp`, { type: "image/webp" });
}

function getRecord(source: JsonRecord, path: Array<string | number>) {
  const value = getValueAtPath(source, path);

  return isRecord(value) ? value : null;
}

function getArray(source: JsonRecord, path: Array<string | number>) {
  const value = getValueAtPath(source, path);

  return Array.isArray(value) ? value : [];
}

function getString(source: JsonRecord, path: Array<string | number>) {
  const value = getValueAtPath(source, path);

  return typeof value === "string" ? value : "";
}

function getValueAtPath(source: unknown, path: Array<string | number>) {
  return path.reduce<unknown>((current, key) => {
    if (Array.isArray(current) && typeof key === "number") {
      return current[key];
    }

    if (isRecord(current) && typeof key === "string") {
      return current[key];
    }

    return undefined;
  }, source);
}

function setValueAtPath(source: JsonRecord, path: Array<string | number>, value: unknown) {
  const next = structuredClone(source) as JsonRecord;
  let cursor: unknown = next;

  path.forEach((key, index) => {
    const isLast = index === path.length - 1;

    if (isLast) {
      if (Array.isArray(cursor) && typeof key === "number") {
        cursor[key] = value;
      } else if (isRecord(cursor) && typeof key === "string") {
        cursor[key] = value;
      }
      return;
    }

    const nextKey = path[index + 1];

    if (Array.isArray(cursor) && typeof key === "number") {
      if (!isRecord(cursor[key]) && !Array.isArray(cursor[key])) {
        cursor[key] = typeof nextKey === "number" ? [] : {};
      }
      cursor = cursor[key];
      return;
    }

    if (isRecord(cursor) && typeof key === "string") {
      if (!isRecord(cursor[key]) && !Array.isArray(cursor[key])) {
        cursor[key] = typeof nextKey === "number" ? [] : {};
      }
      cursor = cursor[key];
    }
  });

  return next;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
