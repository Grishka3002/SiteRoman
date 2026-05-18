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

const pageBlockNames = {
  home: {
    rec2172565301: { title: 'Первый экран', order: 10 },
    rec2172565751: { title: 'Контакты', order: 90 }
  },
  wedding: {
    rec1025539341: { title: 'Первый экран', order: 10 },
    rec1025539376: { title: 'О ведущем', order: 25 },
    rec1025539386: { title: 'Фото / портфолио', order: 30 },
    rec1025539441: { title: 'Сервис и этапы работы', order: 50 },
    rec1025539446: { title: 'Команда и оборудование', order: 55 },
    rec1025539481: { title: 'Тарифы', order: 60 },
    rec1025539496: { title: 'Отзывы', kind: 'reviews', order: 70 },
    rec1025539516: { title: 'Вопросы и ответы', order: 80 },
    rec1025539531: { title: 'Кнопка заявки', order: 85 },
    rec1025539536: { title: 'Контакты', order: 90 }
  },
  corporate: {
    rec2171225631: { title: 'Первый экран', order: 10 },
    rec2171225751: { title: 'О подходе', order: 25 },
    rec2171225771: { title: 'Фото / портфолио', order: 30 },
    rec2171225801: { title: 'Дополнительные фото', order: 35 },
    rec2171225881: { title: 'Процессы и этапы', order: 50 },
    rec2171225891: { title: 'Команда и оборудование', order: 55 },
    rec2171225901: { title: 'Мне доверяют', order: 58 },
    rec2171225961: { title: 'Тарифы', order: 60 },
    rec2171225991: { title: 'Отзывы', kind: 'reviews', order: 70 },
    rec2171226031: { title: 'Вопросы и ответы', order: 80 },
    rec2171226061: { title: 'Кнопка заявки', order: 85 },
    rec2171226071: { title: 'Контакты', order: 90 }
  }
};

const ignoredRecordTypes = new Set(['875', '450', '657', '131', '113', '270', '106']);

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
  const pill = $('#pageStatusPill');
  if (pill) {
    pill.classList.toggle('error', isError);
    pill.textContent = isError ? 'Нужна проверка' : 'Готово к работе';
  }
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

function posterFromVideoUrl(url) {
  const clean = String(url || '').split('?')[0];
  return /\.(mp4|mov|webm)$/i.test(clean) ? clean.replace(/\.(mp4|mov|webm)$/i, '.poster.webp') : '';
}

function setMediaValue(item, url) {
  if (!item || !url) return;
  if (item.type === 'image') setImageSource(item.node, url);
  else if (item.type === 'background') setBackgroundImage(item.node, url);
  else if (item.type === 'video') setVideoSource(item.node, url);
}

function canReorderSubBlocks(block, sub) {
  return Boolean(block?.subBlocks?.length > 1 && sub?.id?.startsWith('media-') && sub.items?.length === 1);
}

function swapMediaSubBlocks(block, currentSubId, direction) {
  const currentIndex = block.subBlocks.findIndex((sub) => sub.id === currentSubId);
  const targetIndex = currentIndex + direction;
  const current = block.subBlocks[currentIndex];
  const target = block.subBlocks[targetIndex];
  if (!current || !target || !canReorderSubBlocks(block, current) || !canReorderSubBlocks(block, target)) return false;

  const currentItem = current.items[0];
  const targetItem = target.items[0];
  if (currentItem.type !== targetItem.type) {
    status('Можно менять местами только одинаковые типы медиа.', true);
    return false;
  }

  const currentUrl = fieldValue(currentItem.node, currentItem.type);
  const targetUrl = fieldValue(targetItem.node, targetItem.type);
  setMediaValue(currentItem, targetUrl);
  setMediaValue(targetItem, currentUrl);
  activeSubByBlock[block.id] = target.id;
  return true;
}

function setPlainTextKeepingWrapper(node, value) {
  if (!node) return;
  const target = node.querySelector('[data-customstyle]') || node;
  target.innerHTML = textToRichHtml(value);
}

function setReviewTextKeepingStyle(node, value) {
  if (!node) return;
  const lines = String(value || '').split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  node.innerHTML = lines.length
    ? lines.map((line) => `<p style="text-align: left;">${escapeHtml(line).replace(/\n/g, '<br>')}</p>`).join('')
    : '<p style="text-align: left;"></p>';
}

function textToRichHtml(value) {
  const normalized = String(value || '')
    .replace(/\r/g, '')
    .replace(/\u200b/g, '')
    .trim();
  if (!normalized) return '';
  return normalized
    .split(/\n{2,}/)
    .map((part) => escapeHtml(part.trim()).replace(/\n/g, '<br>'))
    .join('<br><br>');
}

function richTextToEditorValue(node) {
  if (!node) return '';
  const target = node.querySelector('[data-customstyle]') || node;
  const chunkForNode = (child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      return child.textContent
        .replace(/\u00a0/g, ' ')
        .replace(/\u200b/g, '');
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return '';
    if (child.tagName === 'BR') return '\n';

    const inner = Array.from(child.childNodes).map(chunkForNode).join('');
    if (child.tagName === 'P' || child.tagName === 'DIV' || child.tagName === 'LI') {
      return `${inner}\n\n`;
    }
    return inner;
  };

  return Array.from(target.childNodes)
    .map(chunkForNode)
    .join('')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

function semanticBlockInfo(block, index) {
  const id = block.id || '';
  const configured = pageBlockNames[currentPageKey]?.[id];
  if (configured) {
    return {
      title: configured.title,
      kind: configured.kind || '',
      order: configured.order || index + 100
    };
  }

  const recordType = block.getAttribute('data-record-type') || '';
  const text = block.textContent.trim().replace(/\s+/g, ' ');
  const hasVideo = Boolean($('video', block));

  if (hasVideo || /видео с мероприятий|видео/i.test(text)) return null;
  if (ignoredRecordTypes.has(recordType)) return null;
  if (/политика конфиденциальности|разработка сайта|огрнип|инн|instagram принадлежит|cookie|яндекс метрика/i.test(text)) return null;

  const fallbackByType = {
    '396': 'Текстовый блок',
    '958': 'Отзывы',
    '979': 'Фото / портфолио',
    '774': 'Тарифы',
    '585': 'Вопросы и ответы',
    '1040': 'Расчет стоимости',
    '702': 'Форма заявки',
    '862': 'Квиз'
  };

  return {
    title: fallbackByType[recordType] || blockTitle(block, index),
    kind: recordType === '958' ? 'reviews' : '',
    order: index + 100
  };
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
  return richTextToEditorValue(node);
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
  const reviews = uniqueNodes(
    $$('.t958__slidecontainer .t958__card, .t958__card:not(.t958__card_preview)', block)
  );
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

  const tariffCards = uniqueNodes(
    $$('.t774__col', block).length
      ? $$('.t774__col', block)
      : $$('.t774__content', block)
  );
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
  const pageBlocks = $$('.r.t-rec[id]', contentDoc)
    .map((block, index) => {
      const info = semanticBlockInfo(block, index);
      if (!info) return null;
      const subBlocks = collectSubBlocks(block);
      const items = collectEditableItems(block, block.id || `block-${index}`);
      return {
        id: block.id,
        node: block,
        title: info.title,
        kind: info.kind || '',
        order: info.order || index + 100,
        subBlocks,
        items
      };
    })
    .filter((block) => block && (block.items.length || block.subBlocks.length))
    .sort((a, b) => a.order - b.order);

  blocks = [{
    id: 'cms-settings',
    node: null,
    title: 'Настройки сайта',
    kind: 'settings',
    subBlocks: [],
    items: []
  }, {
    id: 'cms-video',
    node: null,
    title: 'Видео',
    kind: 'video',
    subBlocks: [],
    items: []
  }].concat(pageBlocks);

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
  const query = ($('#blockSearch')?.value || '').trim().toLowerCase();
  const visibleBlocks = blocks.filter((block) => String(block.title || '').toLowerCase().includes(query));
  tabs.innerHTML = '';
  $('#blockCount').textContent = query
    ? `${visibleBlocks.length} из ${blocks.length}`
    : `${blocks.length} блоков`;

  if (!visibleBlocks.length) {
    tabs.innerHTML = '<p class="block-tabs__empty">Блоки не найдены. Попробуйте другое слово.</p>';
    return;
  }

  visibleBlocks.forEach((block) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = block.id === activeBlockId ? 'active' : '';
    button.innerHTML = `
      <span class="block-tabs__number">${blocks.indexOf(block) + 1}</span>
      <span class="block-tabs__title">${escapeHtml(block.title)}</span>
    `;
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
  const isLongCardText = item.node?.matches?.('.t-card__descr');
  const rows = item.reviewText ? 7 : isLongCardText ? 10 : 3;
  row.innerHTML = `
    <label>${escapeHtml(label)}
      <textarea rows="${rows}">${escapeHtml(fieldValue(item.node, item.type))}</textarea>
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

function mediaMatchesCurrentPage(item) {
  const page = item.page || 'home';
  return page === cmsPageValue() || page === currentPage.publicPath || (currentPage.publicPath === '/' && page === 'home');
}

function isVideoItem(item) {
  return String(item.type || '').startsWith('video');
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
      renderBlockEditor();
      status('Отзыв добавлен. Он появится в слайдере отзывов.');
    } catch (error) {
      status(error.message, true);
    }
  });
  panel.append(form);
}

function renderCmsReviews(panel) {
  const currentReviews = (cmsData.reviews || []).filter(mediaMatchesCurrentPage);
  const section = document.createElement('section');
  section.className = 'cms-add-form';
  section.innerHTML = `
    <h3>Отзывы, добавленные через админку</h3>
    <p class="muted">Эти отзывы автоматически добавляются в слайдер отзывов на текущей странице.</p>
    <div class="editor-list" data-cms-review-list></div>
  `;
  const list = $('[data-cms-review-list]', section);

  currentReviews.forEach((review) => {
    const realIndex = cmsData.reviews.indexOf(review);
    const row = document.createElement('div');
    row.className = 'editor-item';
    row.innerHTML = `
      <div class="form-grid">
        <label>Имя автора
          <input data-review-name value="${escapeHtml(review.name || '')}">
        </label>
        <label>Фото автора
          <input data-review-avatar-file type="file" accept="image/*">
          <small>${escapeHtml(review.avatar || 'Фото не выбрано')}</small>
        </label>
        <label class="wide">Текст отзыва
          <textarea data-review-text rows="5">${escapeHtml(review.text || '')}</textarea>
        </label>
      </div>
      <button type="button" class="secondary" data-review-delete>Удалить отзыв</button>
    `;

    $('[data-review-name]', row).addEventListener('input', (event) => {
      cmsData.reviews[realIndex].name = event.target.value;
    });
    $('[data-review-text]', row).addEventListener('input', (event) => {
      cmsData.reviews[realIndex].text = event.target.value;
    });
    $('[data-review-avatar-file]', row).addEventListener('change', async (event) => {
      try {
        const uploadedUrl = await upload(event.target.files[0]);
        cmsData.reviews[realIndex].avatar = uploadedUrl;
        $('small', row).textContent = uploadedUrl;
        await saveCmsData();
        status('Фото отзыва загружено.');
      } catch (error) {
        status(error.message, true);
      }
    });
    $('[data-review-delete]', row).addEventListener('click', async () => {
      cmsData.reviews.splice(realIndex, 1);
      await saveCmsData();
      renderBlockEditor();
      status('Отзыв удален.');
    });
    list.append(row);
  });

  if (!currentReviews.length) {
    list.innerHTML = '<p class="muted">Пока нет отзывов, добавленных через админку.</p>';
  }

  panel.append(section);
}

function ensureCmsSettings() {
  cmsData.settings = cmsData.settings && typeof cmsData.settings === 'object' ? cmsData.settings : {};
  cmsData.settings.cornerVideo = cmsData.settings.cornerVideo && typeof cmsData.settings.cornerVideo === 'object'
    ? cmsData.settings.cornerVideo
    : { url: '/assets/corner-video-roman.mp4', poster: '' };
  cmsData.settings.videoPosters = cmsData.settings.videoPosters && typeof cmsData.settings.videoPosters === 'object'
    ? cmsData.settings.videoPosters
    : {};
  cmsData.settings.typography = cmsData.settings.typography && typeof cmsData.settings.typography === 'object'
    ? cmsData.settings.typography
    : { minMobileFontSize: 16 };
  if (!cmsData.settings.typography.textColor) cmsData.settings.typography.textColor = '#e6e6e6';
  if (!cmsData.settings.typography.processTextScale) cmsData.settings.typography.processTextScale = 1.15;
  cmsData.settings.bottomBlock = cmsData.settings.bottomBlock && typeof cmsData.settings.bottomBlock === 'object'
    ? cmsData.settings.bottomBlock
    : { text: '', fontSize: 16 };
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
  const corner = cmsData.settings.cornerVideo;
  const typography = cmsData.settings.typography;
  const bottomBlock = cmsData.settings.bottomBlock;
  panel.innerHTML = `
    <div class="block-panel__head">
      <div>
        <h2>Настройки сайта</h2>
        <p class="muted">Общие настройки, которые работают на всех страницах. Превью обычных видео теперь находятся во вкладке «Видео».</p>
      </div>
    </div>
    <div class="settings-grid">
      <section class="settings-card">
        <h3>Видео в углу сайта</h3>
        <p class="muted">Один ролик и одно превью для главной, свадьбы и корпоративов.</p>
        <div class="editor-list">
          <div class="editor-item" data-setting="corner-video"></div>
          <div class="editor-item" data-setting="corner-poster"></div>
        </div>
      </section>
      <section class="settings-card">
        <h3>Размеры текста</h3>
        <div class="form-grid">
          <label>Минимальный мелкий шрифт на телефоне, px
            <input data-setting-font-min type="number" min="14" max="24" value="${escapeHtml(typography.minMobileFontSize || 16)}">
          </label>
          <label>Размер текста нижнего блока, px
            <input data-setting-bottom-font type="number" min="12" max="28" value="${escapeHtml(bottomBlock.fontSize || 16)}">
          </label>
          <label>Масштаб текста в блоке «Прозрачность процессов»
            <input data-setting-process-scale type="number" min="0.8" max="1.6" step="0.05" value="${escapeHtml(typography.processTextScale || 1.15)}">
          </label>
          <label>Цвет основного текста
            <input data-setting-text-color type="color" value="${escapeHtml(typography.textColor || '#e6e6e6')}">
          </label>
        </div>
        <p class="muted">Мелкий текст на мобильной версии будет автоматически увеличен до этого значения.</p>
      </section>
    </div>
    <section class="settings-card">
      <h3>Нижний черный блок на всех страницах</h3>
      <label>Текст блока
        <textarea data-setting-bottom-text rows="6" placeholder="Введите текст, который должен быть внизу каждой страницы">${escapeHtml(bottomBlock.text || '')}</textarea>
      </label>
      <div class="row">
        <button type="button" data-save-settings>Сохранить настройки</button>
      </div>
    </section>
  `;

  renderSettingsUpload($('[data-setting="corner-video"]', panel), {
    title: 'Общее видео',
    accept: 'video/*',
    url: corner.url,
    onUpload: (url) => {
      corner.url = url;
      corner.poster = posterFromVideoUrl(url) || corner.poster;
    }
  });
  renderSettingsUpload($('[data-setting="corner-poster"]', panel), {
    title: 'Превью видео в углу',
    accept: 'image/*',
    url: corner.poster,
    isImage: true,
    onUpload: (url) => { corner.poster = url; }
  });

  $('[data-setting-font-min]', panel).addEventListener('input', (event) => {
    typography.minMobileFontSize = Number(event.target.value || 16);
  });
  $('[data-setting-bottom-font]', panel).addEventListener('input', (event) => {
    bottomBlock.fontSize = Number(event.target.value || 16);
  });
  $('[data-setting-process-scale]', panel).addEventListener('input', (event) => {
    typography.processTextScale = Number(event.target.value || 1.15);
  });
  $('[data-setting-text-color]', panel).addEventListener('input', (event) => {
    typography.textColor = event.target.value || '#e6e6e6';
  });
  $('[data-setting-bottom-text]', panel).addEventListener('input', (event) => {
    bottomBlock.text = event.target.value;
  });
  $('[data-save-settings]', panel).addEventListener('click', async () => {
    try {
      await saveCmsData();
      status('Настройки сохранены.');
    } catch (error) {
      status(error.message, true);
    }
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

function collectVideoTextItems() {
  if (!contentDoc) return [];
  return $$('.r.t-rec[id]', contentDoc).flatMap((block, index) => {
    const text = block.textContent.trim().replace(/\s+/g, ' ');
    if (!$('video', block) && !/видео с мероприятий|видео/i.test(text)) return [];
    return collectEditableItems(block, `video-text-${index}`).filter((item) => item.type === 'text');
  });
}

function renderCmsVideoList(list) {
  const videos = (cmsData.media || []).filter((item) => mediaMatchesCurrentPage(item) && isVideoItem(item));
  list.innerHTML = '';

  videos.forEach((item) => {
    const realIndex = cmsData.media.indexOf(item);
    const row = document.createElement('div');
    row.className = 'editor-item';
    row.innerHTML = `
      <div class="editor-media">
        <video src="${escapeHtml(item.url || '')}" ${item.poster ? `poster="${escapeHtml(item.poster)}"` : ''} controls></video>
        <div class="form-grid">
          <label>Название / подпись
            <input data-video-caption value="${escapeHtml(item.caption || '')}">
          </label>
          <label>Заменить видео
            <input data-video-file type="file" accept="video/*">
            <small>${escapeHtml(item.url || '')}</small>
          </label>
          <label>Превью
            <input data-video-poster type="file" accept="image/*">
            <small>${escapeHtml(item.poster || 'Превью не выбрано')}</small>
          </label>
        </div>
      </div>
      <button type="button" class="secondary" data-video-delete>Удалить видео</button>
    `;

    $('[data-video-caption]', row).addEventListener('input', (event) => {
      cmsData.media[realIndex].caption = event.target.value;
    });
    $('[data-video-file]', row).addEventListener('change', async (event) => {
      try {
        const uploadedUrl = await upload(event.target.files[0]);
        cmsData.media[realIndex].url = uploadedUrl;
        cmsData.media[realIndex].poster = cmsData.media[realIndex].poster || posterFromVideoUrl(uploadedUrl);
        $('video', row).src = uploadedUrl;
        if (cmsData.media[realIndex].poster) $('video', row).poster = cmsData.media[realIndex].poster;
        $('[data-video-file]', row).nextElementSibling.textContent = uploadedUrl;
        await saveCmsData();
        status('Видео обновлено.');
      } catch (error) {
        status(error.message, true);
      }
    });
    $('[data-video-poster]', row).addEventListener('change', async (event) => {
      try {
        const uploadedUrl = await upload(event.target.files[0]);
        cmsData.media[realIndex].poster = uploadedUrl;
        $('video', row).poster = uploadedUrl;
        $('[data-video-poster]', row).nextElementSibling.textContent = uploadedUrl;
        await saveCmsData();
        status('Превью видео загружено.');
      } catch (error) {
        status(error.message, true);
      }
    });
    $('[data-video-delete]', row).addEventListener('click', async () => {
      cmsData.media.splice(realIndex, 1);
      await saveCmsData();
      renderBlockEditor();
      status('Видео удалено.');
    });
    list.append(row);
  });

  if (!videos.length) {
    list.innerHTML = '<p class="muted">Пока нет дополнительных видео, добавленных через админку.</p>';
  }
}

function renderVideoManager(panel) {
  ensureCmsSettings();
  const pageVideos = collectPageVideos();
  const textItems = collectVideoTextItems();
  const corner = cmsData.settings.cornerVideo;

  panel.innerHTML = `
    <div class="block-panel__head">
      <div>
        <h2>Видео</h2>
        <p class="muted">Здесь меняются ролики страницы, превью и общее видео в углу сайта.</p>
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
        <p class="muted">${pageVideos.length ? 'Загрузите обложку для каждого ролика, который уже есть на странице.' : 'На этой странице встроенные видео не найдены.'}</p>
        <div class="editor-list" data-video-posters></div>
      </section>
    </div>
    <section class="settings-card">
      <h3>Заголовки и тексты блока видео</h3>
      <div class="editor-list" data-video-texts></div>
    </section>
    <section class="settings-card">
      <h3>Добавленные видео</h3>
      <p class="muted">Если видео несколько, на сайте они показываются как слайдер.</p>
      <div class="editor-list" data-cms-video-list></div>
    </section>
    <form class="cms-add-form" data-add-video-form>
      <h3>Добавить видео</h3>
      <div class="form-grid">
        <label>Видео
          <input name="videoFile" type="file" accept="video/*" required>
        </label>
        <label>Превью
          <input name="posterFile" type="file" accept="image/*">
        </label>
        <label class="wide">Название / подпись
          <input name="caption" placeholder="Например: Свадьба в ресторане">
        </label>
      </div>
      <button type="submit">Добавить видео</button>
    </form>
  `;

  renderSettingsUpload($('[data-setting="corner-video"]', panel), {
    title: 'Общее видео',
    accept: 'video/*',
    url: corner.url,
    onUpload: (url) => { corner.url = url; }
  });
  renderSettingsUpload($('[data-setting="corner-poster"]', panel), {
    title: 'Превью видео в углу',
    accept: 'image/*',
    url: corner.poster,
    isImage: true,
    onUpload: (url) => { corner.poster = url; }
  });

  const posterList = $('[data-video-posters]', panel);
  pageVideos.forEach((video) => {
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

  const textList = $('[data-video-texts]', panel);
  if (textItems.length) renderItems(textList, textItems);
  else textList.innerHTML = '<p class="muted">Текстовые поля блока видео не найдены.</p>';

  renderCmsVideoList($('[data-cms-video-list]', panel));

  $('[data-add-video-form]', panel).addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const videoFile = formData.get('videoFile');
      const posterFile = formData.get('posterFile');
      const url = videoFile?.size ? await upload(videoFile) : '';
      const poster = posterFile?.size ? await upload(posterFile) : '';
      if (!url) {
        status('Выберите видеофайл.', true);
        return;
      }
      cmsData.media = [...(cmsData.media || []), {
        page: cmsPageValue(),
        type: videoFile.type || 'video/mp4',
        url,
        poster: poster || posterFromVideoUrl(url),
        caption: String(formData.get('caption') || '').trim()
      }];
      await saveCmsData();
      form.reset();
      renderBlockEditor();
      status('Видео добавлено. Оно появится в видеослайдере на странице.');
    } catch (error) {
      status(error.message, true);
    }
  });
}

function renderBlockEditor() {
  const panel = $('#blockEditor');
  if (activeBlockId === 'cms-settings') {
    $('#activeBlockName').textContent = 'Настройки сайта';
    renderCmsSettings(panel);
    return;
  }
  if (activeBlockId === 'cms-video') {
    $('#activeBlockName').textContent = 'Видео';
    renderVideoManager(panel);
    return;
  }
  const block = blocks.find((item) => item.id === activeBlockId);
  if (!block) {
    $('#activeBlockName').textContent = 'Блок не выбран';
    panel.innerHTML = '<p class="muted">На странице нет редактируемых блоков.</p>';
    return;
  }

  const hasSubBlocks = block.subBlocks.length > 0;
  $('#activeBlockName').textContent = block.title;
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
    const activeIndex = block.subBlocks.indexOf(activeSub);
    if (canReorderSubBlocks(block, activeSub)) {
      const controls = document.createElement('div');
      controls.className = 'sub-order-controls';
      controls.innerHTML = `
        <span>Порядок фото</span>
        <button type="button" class="secondary" data-move-sub="-1" ${activeIndex <= 0 ? 'disabled' : ''}>Выше</button>
        <button type="button" class="secondary" data-move-sub="1" ${activeIndex >= block.subBlocks.length - 1 ? 'disabled' : ''}>Ниже</button>
      `;
      controls.querySelectorAll('[data-move-sub]').forEach((button) => {
        button.addEventListener('click', () => {
          if (swapMediaSubBlocks(block, activeSub.id, Number(button.dataset.moveSub))) {
            renderBlockEditor();
            status('Порядок фото изменен. Нажмите «Сохранить страницу».');
          }
        });
      });
      list.before(controls);
    }
    renderItems(list, activeSub.items);
  } else {
    subTabs.remove();
    renderItems(list, block.items);
  }

  if (block.kind === 'reviews' || (block.title || '').toLowerCase().includes('отзыв') || block.node.querySelector('.t958')) {
    renderCmsReviews(panel);
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
$('#blockSearch')?.addEventListener('input', renderBlockTabs);
$('#logout').addEventListener('click', () => {
  localStorage.removeItem('adminPassword');
  location.reload();
});
