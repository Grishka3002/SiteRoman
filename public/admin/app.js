const adminPages = {
  home: { title: 'Главная', route: 'home', publicPath: '/' },
  wedding: { title: 'Свадьба', route: '/wedding', publicPath: '/wedding' },
  corporate: { title: 'Корпоративы', route: '/corporate', publicPath: '/corporate' }
};

let currentPageKey = location.pathname.split('/').filter(Boolean)[1] || 'home';
if (!adminPages[currentPageKey]) currentPageKey = 'home';

const currentPage = adminPages[currentPageKey];
let password = localStorage.getItem('adminPassword') || '';
let contentDoc = null;
let cmsData = { media: [], reviews: [], settings: {} };
let blocks = [];
let activeBlockId = '';
let activeSubByBlock = {};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

function status(message, isError = false) {
  const node = $('#status');
  node.textContent = message;
  node.classList.toggle('error', isError);
}

function showLoginError(message) {
  $('#loginError').textContent = message;
  $('#loginError').classList.remove('hidden');
}

function authHeaders(extra = {}) {
  return { 'x-admin-password': password, ...extra };
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: authHeaders(options.headers || {})
  });
  const type = response.headers.get('content-type') || '';
  const payload = type.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) throw new Error(payload.error || payload || `Ошибка ${response.status}`);
  return payload;
}

async function verifyPassword() {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'x-admin-password': password }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Пароль не подошел');
  }
}

function setupPageChrome() {
  document.title = `Админ-панель: ${currentPage.title}`;
  $('#pageTitle').textContent = currentPage.title;
  $('#pageHint').textContent = `Слева выберите страницу, сверху блок, внутри блока - нужный элемент.`;
  $('.site-link').href = currentPage.publicPath;
  $$('[data-page-link]').forEach((link) => {
    link.classList.toggle('active', link.dataset.pageLink === currentPageKey);
  });
}

function setImageSource(img, url) {
  if (!img || !url) return;
  img.setAttribute('src', url);
  img.setAttribute('data-original', url);
  img.setAttribute('data-img-zoom-url', url);
  const wrapper = img.closest('[data-original]');
  if (wrapper) wrapper.setAttribute('data-original', url);
  const meta = img.parentElement?.querySelector('meta[itemprop="image"]') || img.querySelector('meta[itemprop="image"]');
  if (meta) meta.setAttribute('content', url);
}

function setBackgroundImage(node, url) {
  if (!node || !url) return;
  node.style.backgroundImage = `url("${url}")`;
  node.setAttribute('data-original', url);
}

function setVideoSource(video, url) {
  if (!video || !url) return;
  video.removeAttribute('src');
  video.setAttribute('data-cms-src', url);
  $$('source', video).forEach((source) => {
    source.removeAttribute('src');
    source.setAttribute('data-cms-src', url);
  });
}

function setPlainTextKeepingWrapper(node, value) {
  if (!node) return;
  const target = node.querySelector('[data-customstyle]') || node;
  target.textContent = value;
}

function setReviewTextKeepingStyle(node, value) {
  if (!node) return;
  const lines = String(value || '').split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  node.innerHTML = lines.length
    ? lines.map((line) => `<p style="text-align: left;">${escapeHtml(line).replace(/\n/g, '<br>')}</p>`).join('')
    : '<p style="text-align: left;"></p>';
}

async function upload(file) {
  if (!file) return '';
  const form = new FormData();
  form.append('file', file);
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'x-admin-password': password },
    body: form
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Не удалось загрузить файл');
  return payload.url;
}

function blockTitle(block, index) {
  const manual = {
    '396': 'Обложка / текстовый блок',
    '958': 'Отзывы',
    '979': 'Медиа / портфолио',
    '774': 'Тарифы / карточки',
    '585': 'Вопросы / пункты',
    '450': 'Меню',
    '702': 'Форма',
    '862': 'Квиз',
    '106': 'Текстовый блок'
  };
  const recordType = block.getAttribute('data-record-type') || '';
  const heading = $('h1, h2, h3, .tn-atom[field^="tn_text"], .t-title, .t-card__title', block);
  const text = heading?.textContent.trim().replace(/\s+/g, ' ');
  if (text) return text.slice(0, 48);
  return manual[recordType] || `Блок ${index + 1}`;
}

function nodeLabel(node) {
  if (node.matches('h1, h2, h3, .t-title')) return 'Заголовок';
  if (node.matches('a, button, .tn-atom__button-text, .t-btnflex__text')) return 'Кнопка';
  if (node.matches('img')) return 'Картинка';
  if (node.matches('video')) return 'Видео';
  if (node.matches('.t958__author-name')) return 'Имя в отзыве';
  if (node.matches('.t958__review-text')) return 'Текст отзыва';
  if (node.matches('.t-card__title')) return 'Название';
  if (node.matches('.t-card__descr')) return 'Описание';
  return 'Текст';
}

function fieldValue(node, type) {
  if (type === 'image') return node.getAttribute('src') || '';
  if (type === 'background') {
    const style = node.getAttribute('style') || '';
    return /url\(["']?([^"')]+)["']?\)/i.exec(style)?.[1] || node.getAttribute('data-original') || '';
  }
  if (type === 'video') return node.getAttribute('data-cms-src') || node.getAttribute('src') || $('source', node)?.getAttribute('data-cms-src') || $('source', node)?.getAttribute('src') || '';
  return node.textContent.trim().replace(/\n{3,}/g, '\n\n');
}

function collectEditableItems(root, prefix = 'item') {
  const selector = [
    '.tn-atom[field^="tn_text"]',
    '.tn-atom__button-text',
    '.t-btnflex__text',
    '.t-text p',
    '.t-card__title',
    '.t-card__descr',
    '.t-name',
    '.t-descr',
    '.t-title',
    '.t958__author-name',
    '.t958__review-text',
    'h1.tn-atom',
    'h2.tn-atom',
    'h3.tn-atom',
    'img',
    'video'
  ].join(',');

  const seen = new Set();
  return $$(selector, root).filter((node) => {
    if (seen.has(node)) return false;
    seen.add(node);
    if (node.closest('.t-popup') && !root.matches('.t-popup')) return false;
    if (node.matches('img')) return !!node.getAttribute('src') && !node.getAttribute('src').startsWith('data:');
    if (node.matches('video')) return !!node.getAttribute('data-cms-src') || !!node.getAttribute('src') || !!$('source', node);
    return node.textContent.trim().length > 0;
  }).map((node, index) => ({
    id: `${prefix}-${index}`,
    node,
    type: node.matches('img') ? 'image' : node.matches('video') ? 'video' : 'text',
    reviewText: node.matches('.t958__review-text')
  }));
}

function uniqueNodes(nodes) {
  const seen = new Set();
  return nodes.filter((node) => {
    if (!node || seen.has(node)) return false;
    seen.add(node);
    return true;
  });
}

function collectSubBlocks(block) {
  const reviews = uniqueNodes($$('.t958__card, .t958__card_preview, .t958__item', block));
  if (reviews.length) {
    return reviews.map((node, index) => {
      const avatar = $('.t958__avatar', node);
      const items = [
        ...collectEditableItems(node, `${block.id}-review-${index}`),
        ...(avatar ? [{
          id: `${block.id}-review-avatar-${index}`,
          node: avatar,
          type: 'background',
          label: 'Фото автора'
        }] : [])
      ];
      return { id: `review-${index}`, title: `Отзыв ${index + 1}`, node, items };
    });
  }

  const tariffCards = uniqueNodes($$('.t774__content, .t774__col, .t-card', block));
  if (tariffCards.length > 1) {
    return tariffCards.map((node, index) => ({
      id: `card-${index}`,
      title: `Карточка ${index + 1}`,
      node,
      items: collectEditableItems(node, `${block.id}-card-${index}`)
    })).filter((item) => item.items.length);
  }

  const accordions = uniqueNodes($$('.t585__accordion, .t668__accordion, .t849__accordion', block));
  if (accordions.length) {
    return accordions.map((node, index) => ({
      id: `point-${index}`,
      title: `Пункт ${index + 1}`,
      node,
      items: collectEditableItems(node, `${block.id}-point-${index}`)
    })).filter((item) => item.items.length);
  }

  const media = uniqueNodes($$('.t979__grid img, .t156 img, .t-slds__bgimg, video', block));
  if (media.length > 1) {
    return media.map((node, index) => ({
      id: `media-${index}`,
      title: `Медиа ${index + 1}`,
      node,
      items: [{
        id: `${block.id}-media-${index}`,
        node,
        type: node.matches('video') ? 'video' : node.matches('img') ? 'image' : 'background',
        label: node.matches('video') ? 'Видео' : 'Картинка'
      }]
    }));
  }

  return [];
}

function collectBlocks() {
  blocks = [{
    id: 'cms-settings',
    node: null,
    title: 'Настройки сайта',
    subBlocks: [],
    items: []
  }].concat($$('.r.t-rec[id]', contentDoc)
    .map((block, index) => {
      const subBlocks = collectSubBlocks(block);
      const items = collectEditableItems(block, block.id || `block-${index}`);
      return {
        id: block.id,
        node: block,
        title: blockTitle(block, index),
        subBlocks,
        items
      };
    })
    .filter((block) => block.items.length || block.subBlocks.length));

  if (!activeBlockId || !blocks.some((block) => block.id === activeBlockId)) {
    activeBlockId = blocks[0]?.id || '';
  }
  blocks.forEach((block) => {
    if (block.subBlocks.length && !activeSubByBlock[block.id]) {
      activeSubByBlock[block.id] = block.subBlocks[0].id;
    }
  });
}

function renderBlockTabs() {
  const tabs = $('#blockTabs');
  tabs.innerHTML = '';
  blocks.forEach((block) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = block.id === activeBlockId ? 'active' : '';
    button.textContent = block.title;
    button.addEventListener('click', () => {
      activeBlockId = block.id;
      renderBlockTabs();
      renderBlockEditor();
    });
    tabs.append(button);
  });
}

function renderTextField(item, row) {
  const label = item.label || nodeLabel(item.node);
  row.innerHTML = `
    <label>${escapeHtml(label)}
      <textarea rows="${item.reviewText ? 7 : 3}">${escapeHtml(fieldValue(item.node, item.type))}</textarea>
    </label>
  `;
  $('textarea', row).addEventListener('input', (event) => {
    if (item.reviewText) setReviewTextKeepingStyle(item.node, event.target.value);
    else setPlainTextKeepingWrapper(item.node, event.target.value);
  });
}

function renderMediaField(item, row) {
  const url = fieldValue(item.node, item.type);
  const isImage = item.type === 'image' || item.type === 'background';
  row.innerHTML = `
    <div class="editor-media">
      ${isImage ? `<img src="${escapeHtml(url)}" alt="">` : `<video src="${escapeHtml(url)}" controls></video>`}
      <label>${escapeHtml(item.label || nodeLabel(item.node))}
        <input type="file" accept="${isImage ? 'image/*' : 'video/*'}">
        <small>${escapeHtml(url)}</small>
      </label>
    </div>
  `;
  $('input', row).addEventListener('change', async (event) => {
    try {
      const uploadedUrl = await upload(event.target.files[0]);
      if (item.type === 'image') setImageSource(item.node, uploadedUrl);
      else if (item.type === 'background') setBackgroundImage(item.node, uploadedUrl);
      else setVideoSource(item.node, uploadedUrl);
      $('small', row).textContent = uploadedUrl;
      const preview = isImage ? $('img', row) : $('video', row);
      preview.src = uploadedUrl;
      status('Файл загружен. Нажмите «Сохранить страницу».');
    } catch (error) {
      status(error.message, true);
    }
  });
}

function renderItems(list, items) {
  list.innerHTML = '';
  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'editor-item';
    if (item.type === 'text') renderTextField(item, row);
    else renderMediaField(item, row);
    list.append(row);
  });
}

function cmsPageValue() {
  return currentPage.publicPath === '/' ? 'home' : currentPage.publicPath;
}

function renderAddReview(panel) {
  if (!currentPage.publicPath.includes('wedding') && !currentPage.publicPath.includes('corporate') && currentPage.publicPath !== '/') return;
  const form = document.createElement('form');
  form.className = 'cms-add-form';
  form.innerHTML = `
    <h3>Добавить новый отзыв</h3>
    <div class="form-grid">
      <label>Имя автора
        <input name="name" placeholder="Например: Анна и Илья">
      </label>
      <label>Фото автора
        <input name="avatarFile" type="file" accept="image/*">
      </label>
      <label class="wide">Текст отзыва
        <textarea name="text" rows="5" placeholder="Введите полный текст отзыва"></textarea>
      </label>
    </div>
    <button type="submit">Добавить отзыв</button>
  `;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData(form);
      const avatar = formData.get('avatarFile')?.size ? await upload(formData.get('avatarFile')) : '';
      const review = {
        page: cmsPageValue(),
        name: String(formData.get('name') || '').trim(),
        text: String(formData.get('text') || '').trim(),
        avatar
      };
      if (!review.name && !review.text) {
        status('Заполните имя или текст отзыва.', true);
        return;
      }
      cmsData.reviews = [...(cmsData.reviews || []), review];
      await saveCmsData();
      form.reset();
      status('Отзыв добавлен. Он появится в слайдере отзывов.');
    } catch (error) {
      status(error.message, true);
    }
  });
  panel.append(form);
}

function ensureCmsSettings() {
  cmsData.settings = cmsData.settings && typeof cmsData.settings === 'object' ? cmsData.settings : {};
  cmsData.settings.cornerVideo = cmsData.settings.cornerVideo && typeof cmsData.settings.cornerVideo === 'object'
    ? cmsData.settings.cornerVideo
    : { url: '/assets/360p.f5fe27dad4.mp4', poster: '' };
  cmsData.settings.videoPosters = cmsData.settings.videoPosters && typeof cmsData.settings.videoPosters === 'object'
    ? cmsData.settings.videoPosters
    : {};
}

function collectPageVideos() {
  if (!contentDoc) return [];
  return uniqueNodes($$('video', contentDoc)).map((video, index) => ({
    id: `video-${index}`,
    url: fieldValue(video, 'video'),
    label: `Видео ${index + 1}`
  })).filter((item) => item.url);
}

function renderCmsSettings(panel) {
  ensureCmsSettings();
  const videos = collectPageVideos();
  const corner = cmsData.settings.cornerVideo;
  panel.innerHTML = `
    <div class="block-panel__head">
      <div>
        <h2>Общие настройки сайта</h2>
        <p class="muted">Единое угловое видео для всех страниц и превью для видео на текущей странице.</p>
      </div>
    </div>
    <div class="settings-grid">
      <section class="settings-card">
        <h3>Видео в углу сайта</h3>
        <div class="editor-list">
          <div class="editor-item" data-setting="corner-video"></div>
          <div class="editor-item" data-setting="corner-poster"></div>
        </div>
      </section>
      <section class="settings-card">
        <h3>Превью видео на странице</h3>
        <p class="muted">${videos.length ? 'Загрузите картинку-превью для каждого ролика.' : 'На этой странице видео не найдены.'}</p>
        <div class="editor-list" data-video-posters></div>
      </section>
    </div>
  `;

  renderSettingsUpload($('[data-setting="corner-video"]', panel), {
    title: 'Общее видео',
    accept: 'video/*',
    url: corner.url,
    onUpload: (url) => { corner.url = url; }
  });
  renderSettingsUpload($('[data-setting="corner-poster"]', panel), {
    title: 'Превью углового видео',
    accept: 'image/*',
    url: corner.poster,
    isImage: true,
    onUpload: (url) => { corner.poster = url; }
  });

  const posterList = $('[data-video-posters]', panel);
  videos.forEach((video) => {
    const row = document.createElement('div');
    row.className = 'editor-item';
    renderSettingsUpload(row, {
      title: video.label,
      accept: 'image/*',
      url: cmsData.settings.videoPosters[video.url] || '',
      note: video.url,
      isImage: true,
      onUpload: (url) => { cmsData.settings.videoPosters[video.url] = url; }
    });
    posterList.append(row);
  });
}

function renderSettingsUpload(row, config) {
  const preview = config.isImage
    ? `<img src="${escapeHtml(config.url || '')}" alt="">`
    : `<video src="${escapeHtml(config.url || '')}" controls></video>`;
  row.innerHTML = `
    <div class="editor-media">
      ${preview}
      <label>${escapeHtml(config.title)}
        <input type="file" accept="${escapeHtml(config.accept)}">
        <small>${escapeHtml(config.note || config.url || 'Файл не выбран')}</small>
      </label>
    </div>
  `;
  $('input', row).addEventListener('change', async (event) => {
    try {
      const uploadedUrl = await upload(event.target.files[0]);
      config.onUpload(uploadedUrl);
      const media = config.isImage ? $('img', row) : $('video', row);
      media.src = uploadedUrl;
      $('small', row).textContent = uploadedUrl;
      await saveCmsData();
      status('Настройки сохранены.');
    } catch (error) {
      status(error.message, true);
    }
  });
}

function renderBlockEditor() {
  const panel = $('#blockEditor');
  if (activeBlockId === 'cms-settings') {
    renderCmsSettings(panel);
    return;
  }
  const block = blocks.find((item) => item.id === activeBlockId);
  if (!block) {
    panel.innerHTML = '<p class="muted">На странице нет редактируемых блоков.</p>';
    return;
  }

  const hasSubBlocks = block.subBlocks.length > 0;
  panel.innerHTML = `
    <div class="block-panel__head">
      <div>
        <h2>${escapeHtml(block.title)}</h2>
        <p class="muted">${hasSubBlocks ? `${block.subBlocks.length} элементов внутри блока` : `${block.items.length} полей для редактирования`}</p>
      </div>
      <a href="${currentPage.publicPath}#${escapeHtml(block.id)}" target="_blank">Открыть блок</a>
    </div>
    <div class="sub-tabs"></div>
    <div class="editor-list"></div>
  `;

  const subTabs = $('.sub-tabs', panel);
  const list = $('.editor-list', panel);

  if (hasSubBlocks) {
    const currentSubId = activeSubByBlock[block.id] || block.subBlocks[0].id;
    block.subBlocks.forEach((sub) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = sub.id === currentSubId ? 'active' : '';
      button.textContent = sub.title;
      button.addEventListener('click', () => {
        activeSubByBlock[block.id] = sub.id;
        renderBlockEditor();
      });
      subTabs.append(button);
    });
    const activeSub = block.subBlocks.find((sub) => sub.id === currentSubId) || block.subBlocks[0];
    renderItems(list, activeSub.items);
  } else {
    subTabs.remove();
    renderItems(list, block.items);
  }

  if ((block.title || '').toLowerCase().includes('отзыв') || block.node.querySelector('.t958')) {
    renderAddReview(panel);
  }
}

async function loadContent() {
  status('Загружаю страницу...');
  const [pagePayload, cmsPayload] = await Promise.all([
    api(`/api/page?page=${currentPageKey}`),
    api('/api/cms')
  ]);
  cmsData = cmsPayload || { media: [], reviews: [] };
  ensureCmsSettings();
  contentDoc = new DOMParser().parseFromString(pagePayload.html, 'text/html');
  collectBlocks();
  renderBlockTabs();
  renderBlockEditor();
  status('Страница загружена. Выберите блок сверху, затем элемент внутри блока.');
}

function pageHtmlFromDoc() {
  return '<!doctype html>\n' + contentDoc.documentElement.outerHTML;
}

async function saveCmsData() {
  await api('/api/cms', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      media: Array.isArray(cmsData.media) ? cmsData.media : [],
      reviews: Array.isArray(cmsData.reviews) ? cmsData.reviews : [],
      settings: cmsData.settings && typeof cmsData.settings === 'object' ? cmsData.settings : {}
    })
  });
}

async function saveContentPage() {
  if (!contentDoc) await loadContent();
  await api(`/api/page?page=${currentPageKey}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ html: pageHtmlFromDoc() })
  });
  await saveCmsData();
  status('Страница сохранена.');
}

async function showApp() {
  $('#login').classList.add('hidden');
  $('#app').classList.remove('hidden');
  $('#logout').classList.remove('hidden');
  await loadContent();
}

setupPageChrome();
$('#loginStatus').textContent = 'Скрипт загружен. Введите пароль и нажмите «Войти».';

if (password) {
  verifyPassword().then(showApp).catch(() => {
    localStorage.removeItem('adminPassword');
    password = '';
  });
}

$('#loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('#loginError').classList.add('hidden');
  password = $('#password').value.trim();
  if (!password) {
    showLoginError('Введите пароль.');
    return;
  }
  try {
    await verifyPassword();
    localStorage.setItem('adminPassword', password);
    await showApp();
  } catch (error) {
    showLoginError(error.message);
  }
});

$('#saveContentPage').addEventListener('click', saveContentPage);
$('#logout').addEventListener('click', () => {
  localStorage.removeItem('adminPassword');
  location.reload();
});
