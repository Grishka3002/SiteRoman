/* Сервер сайта Романа Шумилова.
   Отдаёт страницы из site/, подставляя правки контента из data/content.json
   (тексты — [data-edit], плейсхолдеры — [data-edit-ph], фото-ленты — [data-photos],
   видео — [data-videos], бегущие строки — [data-marquee]).
   Админ-панель: /admin (пароль — env ADMIN_PASSWORD, по умолчанию roman2026). */

const express = require('express');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const multer = require('multer');

const SITE = path.join(__dirname, 'site');
const ADMIN = path.join(__dirname, 'admin');
const DATA = path.join(__dirname, 'data');
const UPLOADS = path.join(SITE, 'assets', 'uploads');
const CONTENT_FILE = path.join(DATA, 'content.json');
const INQUIRIES_FILE = path.join(DATA, 'inquiries.json');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'roman2026';
const PORT = process.env.PORT || 3000;

/* page id → файл в site/ */
const PAGES = {
  home: 'index.html',
  svadby: 'svadby.html',
  korporativy: 'korporativy.html'
};
const PAGE_TITLES = { home: 'Главная', svadby: 'Свадьбы', korporativy: 'Корпоративы' };

/* ---------- утилиты ---------- */
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}
function escAttr(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function parsePos(style) {
  const m = String(style || '').match(/object-position:\s*([^;]+)/);
  return m ? m[1].trim() : '50% 50%';
}

/* ---------- рендер страниц ---------- */
let pageCache = {};
function clearCache() { pageCache = {}; }

function photoImg(p, hideAlt) {
  return `<img src="${escAttr(p.src)}" alt="${hideAlt ? '' : escAttr(p.alt || '')}" style="object-position:${escAttr(p.pos || '50% 50%')}">`;
}

function renderPage(pageId) {
  if (pageCache[pageId]) return pageCache[pageId];
  const html = fs.readFileSync(path.join(SITE, PAGES[pageId]), 'utf8');
  const $ = cheerio.load(html);
  const content = (readJson(CONTENT_FILE, {})[pageId]) || {};
  const texts = content.texts || {};
  const photos = content.photos || {};
  const videos = content.videos || {};
  const marquees = content.marquees || {};

  $('[data-edit]').each((i, el) => {
    const key = $(el).attr('data-edit');
    if (texts[key] != null) $(el).html(texts[key]);
  });
  $('[data-edit-ph]').each((i, el) => {
    const key = $(el).attr('data-edit-ph');
    if (texts[key] != null) $(el).attr('placeholder', texts[key]);
  });
  $('[data-photos]').each((i, el) => {
    const list = photos[$(el).attr('data-photos')];
    if (!Array.isArray(list)) return;
    // фото ×2 для бесшовного лупа ленты
    $(el).html(list.map(p => photoImg(p, false)).join('') + list.map(p => photoImg(p, true)).join(''));
  });
  $('[data-videos]').each((i, el) => {
    const list = videos[$(el).attr('data-videos')];
    if (!Array.isArray(list)) return;
    $(el).html(list.map(raw => {
      // обратная совместимость: раньше элемент был строкой-src
      const v = typeof raw === 'string' ? { src: raw } : raw;
      const poster = v.poster ? ` poster="${escAttr(v.poster)}"` : '';
      return `<video src="${escAttr(v.src)}"${poster} controls playsinline preload="metadata"></video>`;
    }).join(''));
  });
  $('[data-marquee]').each((i, el) => {
    const list = marquees[$(el).attr('data-marquee')];
    if (!Array.isArray(list)) return;
    const hl = typeof $(el).attr('data-marquee-hl') !== 'undefined';
    const group = hidden => `<div class="marquee-group"${hidden ? ' aria-hidden="true"' : ''}>` +
      list.map((t, idx) => `<span${hl && idx === 0 ? ' class="hl"' : ''}>${t}</span><span class="d">◆</span>`).join('') +
      '</div>';
    $(el).html(group(false) + group(true));
  });

  const out = $.html();
  pageCache[pageId] = out;
  return out;
}

/* ---------- дефолты из HTML (для админки) ---------- */
function extractPage(pageId) {
  const html = fs.readFileSync(path.join(SITE, PAGES[pageId]), 'utf8');
  const $ = cheerio.load(html);
  const fields = [];
  $('[data-edit]').each((i, el) => {
    fields.push({ key: $(el).attr('data-edit'), type: 'html', def: ($(el).html() || '').trim() });
  });
  $('[data-edit-ph]').each((i, el) => {
    fields.push({ key: $(el).attr('data-edit-ph'), type: 'ph', def: $(el).attr('placeholder') || '' });
  });
  const photos = {};
  $('[data-photos]').each((i, el) => {
    const imgs = $(el).find('img').toArray();
    const half = imgs.slice(0, Math.ceil(imgs.length / 2));
    photos[$(el).attr('data-photos')] = half.map(im => ({
      src: $(im).attr('src') || '',
      alt: $(im).attr('alt') || '',
      pos: parsePos($(im).attr('style'))
    }));
  });
  const videos = {};
  $('[data-videos]').each((i, el) => {
    videos[$(el).attr('data-videos')] = $(el).find('video').toArray().map(v => ({
      src: $(v).attr('src') || '',
      poster: $(v).attr('poster') || ''
    }));
  });
  const marquees = {};
  $('[data-marquee]').each((i, el) => {
    const spans = $(el).find('.marquee-group').first().children('span').not('.d').toArray();
    marquees[$(el).attr('data-marquee')] = spans.map(s => ($(s).html() || '').trim());
  });
  return { fields, photos, videos, marquees };
}

/* ---------- приложение ---------- */
const app = express();
app.use(express.json({ limit: '5mb' }));

/* страницы */
app.get(['/', '/index.html'], (req, res) => res.type('html').send(renderPage('home')));
app.get('/svadby.html', (req, res) => res.type('html').send(renderPage('svadby')));
app.get('/korporativy.html', (req, res) => res.type('html').send(renderPage('korporativy')));

/* заявка с квиза (публичное API) */
app.post('/api/inquiry', (req, res) => {
  const b = req.body || {};
  const inquiry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    page: String(b.page || '').slice(0, 40),
    date: String(b.date || '').slice(0, 100),
    city: String(b.city || '').slice(0, 100),
    name: String(b.name || '').slice(0, 100),
    company: String(b.company || '').slice(0, 100),
    phone: String(b.phone || '').slice(0, 40),
    gift: String(b.gift || '').slice(0, 200)
  };
  if (!inquiry.phone) return res.status(400).json({ error: 'Не указан телефон' });
  const list = readJson(INQUIRIES_FILE, []);
  list.push(inquiry);
  writeJson(INQUIRIES_FILE, list);
  res.json({ ok: true });
});

/* ---------- админ API ---------- */
function requireAdmin(req, res, next) {
  if (req.get('x-admin-key') === ADMIN_PASSWORD) return next();
  res.status(401).json({ error: 'Неверный пароль' });
}

app.get('/api/admin/check', requireAdmin, (req, res) => res.json({ ok: true }));

app.get('/api/admin/data', requireAdmin, (req, res) => {
  const content = readJson(CONTENT_FILE, {});
  const pages = {};
  for (const pageId of Object.keys(PAGES)) {
    const def = extractPage(pageId);
    const over = content[pageId] || {};
    pages[pageId] = {
      title: PAGE_TITLES[pageId],
      fields: def.fields.map(f => ({
        ...f,
        value: over.texts && over.texts[f.key] != null ? over.texts[f.key] : f.def
      })),
      photos: Object.keys(def.photos).map(key => ({
        key,
        value: over.photos && over.photos[key] ? over.photos[key] : def.photos[key]
      })),
      videos: Object.keys(def.videos).map(key => ({
        key,
        value: over.videos && over.videos[key] ? over.videos[key] : def.videos[key]
      })),
      marquees: Object.keys(def.marquees).map(key => ({
        key,
        value: over.marquees && over.marquees[key] ? over.marquees[key] : def.marquees[key]
      }))
    };
  }
  res.json({ pages });
});

app.post('/api/admin/save', requireAdmin, (req, res) => {
  const { page, texts, photos, videos, marquees } = req.body || {};
  if (!PAGES[page]) return res.status(400).json({ error: 'Неизвестная страница' });
  const content = readJson(CONTENT_FILE, {});
  content[page] = {
    texts: texts || {},
    photos: photos || {},
    videos: videos || {},
    marquees: marquees || {}
  };
  writeJson(CONTENT_FILE, content);
  clearCache();
  res.json({ ok: true });
});

/* сброс страницы к дефолтам из HTML */
app.post('/api/admin/reset', requireAdmin, (req, res) => {
  const { page } = req.body || {};
  if (!PAGES[page]) return res.status(400).json({ error: 'Неизвестная страница' });
  const content = readJson(CONTENT_FILE, {});
  delete content[page];
  writeJson(CONTENT_FILE, content);
  clearCache();
  res.json({ ok: true });
});

/* загрузка фото/видео */
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(UPLOADS, { recursive: true });
      cb(null, UPLOADS);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, '').slice(0, 40) || 'file';
      cb(null, Date.now() + '-' + base + ext);
    }
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /\.(jpe?g|png|webp|gif|avif|mp4|webm|mov)$/i.test(file.originalname);
    cb(ok ? null : new Error('Недопустимый тип файла'), ok);
  }
});
app.post('/api/admin/upload', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не получен' });
  res.json({ path: 'assets/uploads/' + req.file.filename });
});

/* заявки */
app.get('/api/admin/inquiries', requireAdmin, (req, res) => {
  res.json(readJson(INQUIRIES_FILE, []).slice().reverse());
});
app.delete('/api/admin/inquiries/:id', requireAdmin, (req, res) => {
  const list = readJson(INQUIRIES_FILE, []).filter(i => i.id !== req.params.id);
  writeJson(INQUIRIES_FILE, list);
  res.json({ ok: true });
});

/* админ-панель и статика */
app.use('/admin', express.static(ADMIN));
app.use(express.static(SITE));

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(400).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log('Сайт: http://localhost:' + PORT);
  console.log('Админ-панель: http://localhost:' + PORT + '/admin');
});
