# SiteRoman Clone

Клон сайта Романа Шумилова на `Next.js 16` с админкой, формами заявок и хранением контента в `PostgreSQL` через `Prisma`.

## Что внутри

- `/` — главная страница-развилка
- `/wedding` — свадебный лендинг
- `/corporate` — корпоративный лендинг
- `/admin` — админка для редактирования JSON-контента страниц и просмотра заявок

## Локальный запуск

1. Скопируйте `.env.example` в `.env.local`
2. Укажите `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
3. Выполните:

```bash
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

Если `DATABASE_URL` не задан, сайт все равно откроется на встроенном JSON-контенте, но админка не будет сохранять изменения в базу.

## Админка

- Защищена basic auth через `ADMIN_USERNAME` и `ADMIN_PASSWORD`
- Страницы хранятся в таблице `PageContent`
- Заявки хранятся в таблице `Inquiry`

## Деплой на Railway

1. Создайте новый проект и подключите репозиторий
2. Добавьте сервис `PostgreSQL`
3. В переменные окружения приложения добавьте:

```bash
DATABASE_URL=...
ADMIN_USERNAME=...
ADMIN_PASSWORD=...
```

4. После первого деплоя выполните в Railway shell:

```bash
npx prisma generate
npx prisma db push
npm run prisma:seed
```

5. Стартовая команда:

```bash
npm run start
```

## Важно

Сейчас изображения подтягиваются по URL с текущего CDN Tilda. Если нужен полностью автономный перенос без зависимости от внешнего CDN, следующим шагом стоит зеркалировать медиа в `public/` и заменить ссылки в контенте.
