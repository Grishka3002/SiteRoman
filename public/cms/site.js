(function () {
  const DEFAULT_CORNER_VIDEO = '/assets/corner-video-roman.mp4';
  const route = window.location.pathname.replace(/\/$/, '') || '/';
  const routeName = route === '/' ? 'home' : route.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'home';
  document.documentElement.classList.add(`cms-route-${routeName}`);

  function matchesPage(item) {
    return item.page === 'all' || item.page === route || (route === '/' && item.page === 'home');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[char]);
  }

  function textFrom(node) {
    return (node && node.textContent ? node.textContent : '').trim().replace(/\s{3,}/g, '\n\n');
  }

  function avatarFrom(node) {
    if (!node) return '';
    const original = node.getAttribute('data-original');
    if (original) return original;
    const style = node.getAttribute('style') || '';
    const match = style.match(/url\(["']?([^"')]+)["']?\)/i);
    return match?.[1] || '';
  }

  function posterFromVideoSrc(src) {
    const clean = String(src || '').split('?')[0];
    if (!/^\/(?:assets|uploads)\//.test(clean) || !/\.(mp4|mov|webm)$/i.test(clean)) return '';
    return clean.replace(/\.(mp4|mov|webm)$/i, '.poster.webp');
  }

  function videoSourceFrom(video) {
    return video?.dataset.cmsSrc
      || video?.getAttribute('src')
      || video?.querySelector('source')?.dataset.cmsSrc
      || video?.querySelector('source')?.getAttribute('src')
      || '';
  }

  function ensureVideoPreview(video, poster) {
    if (!video) return;
    const parent = video.parentElement;
    if (!parent) return;

    if (video.dataset.cmsPreviewReady === 'true') {
      const preview = parent.querySelector('.cms-video-preview');
      if (poster) video.poster = poster;
      if (preview && poster && preview.getAttribute('src') !== poster) {
        preview.classList.remove('cms-video-preview_placeholder');
        preview.src = poster;
      }
      return;
    }

    parent.classList.add('cms-video-has-preview');
    video.closest('.t396__elem[data-elem-type="video"]')?.classList.add('cms-native-video-preview');
    video.classList.add('cms-video-with-preview');
    if (poster) video.poster = poster;
    video.dataset.cmsPreviewReady = 'true';

    const preview = document.createElement(poster ? 'img' : 'div');
    preview.className = 'cms-video-preview';
    if (poster) {
      preview.src = poster;
      preview.alt = '';
      preview.decoding = 'async';
      preview.loading = 'lazy';
      preview.addEventListener('error', () => {
        preview.removeAttribute('src');
        preview.classList.add('cms-video-preview_placeholder');
      }, { once: true });
    } else {
      preview.classList.add('cms-video-preview_placeholder');
    }
    preview.setAttribute('aria-hidden', 'true');
    parent.append(preview);

    const hidePreview = () => {
      preview.classList.add('is-hidden');
      parent.classList.add('cms-video-preview-hidden');
    };
    const showPreview = () => {
      if (!video.currentTime || video.ended) {
        preview.classList.remove('is-hidden');
        parent.classList.remove('cms-video-preview-hidden');
      }
    };

    preview.addEventListener('click', () => {
      if (video.dataset.cmsSrc && !video.currentSrc) {
        video.src = video.dataset.cmsSrc;
        video.dataset.cmsLoaded = 'true';
        video.load();
      }
      video.play().catch(() => {});
    });
    video.addEventListener('playing', hidePreview);
    video.addEventListener('pause', showPreview);
    video.addEventListener('ended', () => {
      preview.classList.remove('is-hidden');
      parent.classList.remove('cms-video-preview-hidden');
    });
  }

  function createMediaCard(item) {
    const figure = document.createElement('figure');
    figure.className = 'cms-media-card';

    const isVideo = item.type && item.type.startsWith('video');
    const media = document.createElement(isVideo ? 'video' : 'img');
    media.src = item.url;
    if (isVideo) {
      media.removeAttribute('src');
      media.dataset.cmsSrc = item.url;
      media.controls = true;
      media.playsInline = true;
      media.preload = 'none';
      const poster = item.poster || posterFromVideoSrc(item.url);
      if (poster) media.poster = poster;
    } else {
      media.loading = 'lazy';
      media.alt = item.caption || '';
    }
    figure.append(media);
    if (isVideo) ensureVideoPreview(media, media.poster);

    if (item.caption) {
      const caption = document.createElement('figcaption');
      caption.className = 'cms-media-card__caption';
      caption.textContent = item.caption;
      figure.append(caption);
    }

    return figure;
  }

  function preloadHeroImage() {
    const heroImage = document.querySelector('.t396__artboard img[data-original], img[data-original], img[src]');
    const href = heroImage?.getAttribute('data-original') || heroImage?.getAttribute('src');
    if (!href || Array.from(document.querySelectorAll('link[rel="preload"]')).some((link) => link.href.endsWith(href))) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    document.head.append(link);
  }

  function optimizeNativeMedia() {
    Array.from(document.images).forEach((img, index) => {
      img.decoding = 'async';
      if (index < 3) {
        img.loading = 'eager';
        img.fetchPriority = 'high';
      } else {
        img.loading = 'lazy';
      }
    });

    document.querySelectorAll('video').forEach((video) => {
      video.playsInline = true;
      if (video.hasAttribute('autoplay')) {
        video.preload = 'metadata';
        return;
      }
      const src = video.getAttribute('src');
      if (src) {
        video.dataset.cmsSrc = src;
        video.removeAttribute('src');
      }
      video.querySelectorAll('source[src]').forEach((source) => {
        source.dataset.cmsSrc = source.getAttribute('src');
        source.removeAttribute('src');
      });
      video.preload = 'none';
    });

    const loadVideo = (video) => {
      if (!video || video.dataset.cmsLoaded === 'true') return;
      if (video.dataset.cmsSrc) video.src = video.dataset.cmsSrc;
      video.querySelectorAll('source[data-cms-src]').forEach((source) => {
        source.src = source.dataset.cmsSrc;
      });
      video.dataset.cmsLoaded = 'true';
      video.load();
    };

    const lazyVideos = Array.from(document.querySelectorAll('video[data-cms-src], video source[data-cms-src]'))
      .map((node) => node.tagName === 'SOURCE' ? node.closest('video') : node)
      .filter(Boolean);

    lazyVideos.forEach((video) => {
      video.addEventListener('click', () => loadVideo(video), { once: true });
      video.addEventListener('mouseenter', () => loadVideo(video), { once: true });
      video.addEventListener('focus', () => loadVideo(video), { once: true });
    });
  }

  function hydrateLazyMedia(root = document) {
    root.querySelectorAll('img[data-original]').forEach((img) => {
      const original = img.getAttribute('data-original');
      if (!original || img.getAttribute('src') === original) return;
      img.src = original;
      img.decoding = 'async';
      img.loading = 'lazy';
    });

    root.querySelectorAll('.t-bgimg[data-original], [data-original].t-slds__bgimg').forEach((node) => {
      const original = node.getAttribute('data-original');
      if (!original) return;
      const current = node.style.backgroundImage || '';
      if (!current.includes(original)) node.style.backgroundImage = `url("${original}")`;
    });
  }

  function bindLazyMediaObserver() {
    const nodes = Array.from(document.querySelectorAll('img[data-original], .t-bgimg[data-original], [data-original].t-slds__bgimg'));
    if (!nodes.length) return;

    if (!('IntersectionObserver' in window)) {
      hydrateLazyMedia(document);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        hydrateLazyMedia(entry.target.parentElement || document);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '900px 0px' });

    nodes.forEach((node) => observer.observe(node));
  }

  function bindLoadMoreHydration() {
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('button, a, .t-btn, .t-feed__showmore-btn, .t-store__load-more-btn');
      if (!trigger) return;
      const text = (trigger.textContent || '').toLowerCase();
      if (!/еще|ещё|more|show|показ/.test(text)) return;
      window.setTimeout(() => hydrateLazyMedia(document), 120);
      window.setTimeout(() => hydrateLazyMedia(document), 650);
    });
  }

  function applyVideoPosters(settings = {}) {
    const posters = settings.videoPosters || {};
    document.querySelectorAll('video').forEach((video) => {
      const src = videoSourceFrom(video);
      const poster = posters[src] || video.getAttribute('poster') || posterFromVideoSrc(src);
      if (poster) ensureVideoPreview(video, poster);
    });
  }

  function applyTypographySettings(settings = {}) {
    const minSize = Number(settings.typography?.minMobileFontSize || 16);
    const textColor = settings.typography?.textColor || '#e6e6e6';
    const processTextScale = Math.min(1.6, Math.max(0.8, Number(settings.typography?.processTextScale || 1.15)));
    document.documentElement.style.setProperty('--cms-small-text-size', `${minSize}px`);
    document.documentElement.style.setProperty('--cms-readable-text-color', textColor);
    document.documentElement.style.setProperty('--cms-process-text-scale', String(processTextScale));
    if (!window.matchMedia('(max-width: 640px)').matches) return;

    document.querySelectorAll('.t-text, .t-descr, .t-name, .t-title, .t-card__descr, .t585__text, .t958__review-text, .tn-atom').forEach((node) => {
      if (node.closest('.cms-corner-video, .cms-review-carousel__dots, .t-menuburger')) return;
      const size = parseFloat(window.getComputedStyle(node).fontSize || '0');
      if (size > 0 && size < minSize) node.style.fontSize = `${minSize}px`;
    });
  }

  function mountBottomBlock(settings = {}) {
    const config = settings.bottomBlock || {};
    const text = String(config.text || '').trim();
    if (!text || document.querySelector('.cms-bottom-block')) return;

    const block = document.createElement('section');
    block.className = 'cms-bottom-block';
    block.style.setProperty('--cms-bottom-font-size', `${Number(config.fontSize || 22)}px`);
    block.innerHTML = `<div class="cms-bottom-block__inner">${escapeHtml(text)}</div>`;

    const footer = document.querySelector('[id^="rec2172565761"], [id^="rec2171226081"], [id^="rec1025539546"]');
    const allRecords = document.querySelector('#allrecords');
    if (footer && footer.parentNode) footer.parentNode.insertBefore(block, footer);
    else if (allRecords) allRecords.append(block);
    else document.body.append(block);
  }

  function mountTariffReadMore() {
    const tariffBlocks = document.querySelectorAll('#rec2171225961, #rec1025539481');
    if (!window.cmsTariffCaptureReady) {
      window.cmsTariffCaptureReady = 'true';
      const closeTariffPopup = (button) => {
        const scrollY = Number(button?.dataset.cmsScrollY || window.scrollY || 0);
        document.querySelectorAll('.t-popup_show').forEach((popup) => {
          popup.classList.remove('t-popup_show');
          popup.style.display = 'none';
        });
        document.body.classList.remove('t-body_popupshowed', 't-quiz__body_popupshowed', 't-body_scroll-locked');
        document.body.style.top = '';
        document.body.removeAttribute('data-popup-scrolltop');
        window.scrollTo(0, scrollY);
      };

      const toggleTariffButton = (button) => {
        const card = button.closest('.cms-tariff-card');
        const text = card?.querySelector('.cms-tariff-text');
        if (!card || !text) return;
        const expanded = !card.classList.contains('is-expanded');
        card.classList.toggle('is-expanded', expanded);
        button.textContent = expanded ? 'Свернуть' : 'Читать полностью';
        button.setAttribute('aria-expanded', String(expanded));
        text.style.maxHeight = expanded ? `${text.scrollHeight}px` : 'var(--cms-tariff-collapsed-height)';
      };

      window.addEventListener('pointerdown', (event) => {
        const button = event.target?.closest?.('.cms-tariff-more');
        if (!button) return;
        button.dataset.cmsScrollY = String(window.scrollY || 0);
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
      }, true);

      window.addEventListener('pointerup', (event) => {
        const button = event.target?.closest?.('.cms-tariff-more');
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        button.dataset.cmsPointerHandled = 'true';
        toggleTariffButton(button);
        closeTariffPopup(button);
        window.setTimeout(() => closeTariffPopup(button), 0);
        window.setTimeout(() => closeTariffPopup(button), 80);
        window.setTimeout(() => { button.dataset.cmsPointerHandled = ''; }, 0);
      }, true);

      window.addEventListener('click', (event) => {
        const button = event.target?.closest?.('.cms-tariff-more');
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        if (button.dataset.cmsPointerHandled !== 'true') toggleTariffButton(button);
        closeTariffPopup(button);
        window.setTimeout(() => closeTariffPopup(button), 0);
        window.setTimeout(() => closeTariffPopup(button), 80);
      }, true);
    }

    tariffBlocks.forEach((block) => {
      block.querySelectorAll('.t774__content').forEach((card) => {
        if (card.dataset.cmsTariffReady === 'true') return;
        const text = card.querySelector('.t-card__descr');
        if (!text) return;

        card.dataset.cmsTariffReady = 'true';
        card.classList.add('cms-tariff-card');
        text.classList.add('cms-tariff-text');

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'cms-tariff-more';
        button.textContent = 'Читать полностью';
        button.setAttribute('aria-expanded', 'false');
        text.after(button);

        const updateClamp = () => {
          const isExpanded = card.classList.contains('is-expanded');
          text.style.maxHeight = 'none';
          button.hidden = false;

          const fullHeight = text.scrollHeight;
          const lineHeight = parseFloat(window.getComputedStyle(text).lineHeight) || 22;
          const collapsedHeight = Math.max(lineHeight * 3, Math.round(fullHeight / 3));
          const needsToggle = fullHeight > collapsedHeight + lineHeight;

          if (!needsToggle) {
            text.style.maxHeight = 'none';
            button.hidden = true;
            return;
          }

          text.style.setProperty('--cms-tariff-collapsed-height', `${collapsedHeight}px`);
          text.style.maxHeight = isExpanded ? `${fullHeight}px` : `${collapsedHeight}px`;
        };

        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          const expanded = !card.classList.contains('is-expanded');
          card.classList.toggle('is-expanded', expanded);
          button.textContent = expanded ? 'Свернуть' : 'Читать полностью';
          button.setAttribute('aria-expanded', String(expanded));
          updateClamp();
        });

        updateClamp();
        window.addEventListener('resize', updateClamp);
        window.setTimeout(updateClamp, 450);
      });
    });
  }

  function mountCorporateGuarantees() {
    if (route !== '/corporate' || document.querySelector('.cms-guarantee-list')) return;
    const record = document.querySelector('#rec2171225881');
    if (!record) return;

    const items = [
      {
        title: 'Фиксированная смета и сроки',
        text: 'Никаких доплат после подписания договора. Соблюдение дедлайнов и ответственность за результат.'
      },
      {
        title: 'Системный подход',
        text: 'На вашем проекте работают только аккредитованные специалисты агентства.'
      },
      {
        title: 'Безопасность и этика',
        text: 'Сохранение конфиденциальности и соблюдение регламентов компании.'
      },
      {
        title: 'Сценарий без клише',
        text: 'Сценарий строится под цели компании и характер гостей. Без стандартных конкурсов: только уместные интерактивы, которые поддерживают смысл события.'
      },
      {
        title: 'Управляемая атмосфера',
        text: 'Каждый гость будет чувствовать себя уместно. Это не просто "ведение", это модерация эмоций в зале.'
      }
    ];

    const section = document.createElement('section');
    section.className = 'cms-guarantee-list';
    section.innerHTML = `
      <h2 class="cms-guarantee-list__title">Я вам гарантирую</h2>
      <div class="cms-guarantee-list__items">
        ${items.map((item, index) => `
          <article class="cms-guarantee-list__item">
            <span class="cms-guarantee-list__number">${index + 1}</span>
            <div class="cms-guarantee-list__card">
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.text)}</p>
            </div>
          </article>
        `).join('')}
      </div>
    `;
    record.classList.add('cms-guarantee-record');
    record.append(section);
  }

  function contactHrefFrom(record, match) {
    return Array.from(record?.querySelectorAll('a[href]') || [])
      .find((link) => match(link.href))?.getAttribute('href') || '';
  }

  function mountWeddingContacts() {
    if (route !== '/wedding' || document.querySelector('.cms-contact-panel_wedding')) return;
    const record = document.querySelector('#rec1025539536');
    if (!record) return;

    const phoneHref = contactHrefFrom(record, (href) => href.startsWith('tel:')) || 'tel:+79949943640';
    const telegramHref = contactHrefFrom(record, (href) => href.includes('t.me/')) || 'https://t.me/Roman25art';
    const maxHref = 'https://max.ru/u/f9LHodD0cOJGaGFA_leE-fZbKQ8LIXojc7B2NdYqBNJUdQI2xqFU_scLtIQ';
    const instagramHref = contactHrefFrom(record, (href) => href.includes('instagram.com')) || 'https://instagram.com/shymilovroman';
    const whatsappHref = contactHrefFrom(record, (href) => href.includes('wa.me/')) || 'https://wa.me/79949943640';

    const panel = document.createElement('section');
    panel.className = 'cms-contact-panel cms-contact-panel_wedding';
    panel.innerHTML = `
      <h2 class="cms-contact-panel__title">познакомимся?</h2>
      <div class="cms-contact-panel__buttons">
        <a class="cms-contact-button cms-contact-button_primary" href="${escapeHtml(phoneHref)}">
          <span class="cms-contact-button__phone" aria-hidden="true"></span>
          <span>8 (994) 994-36-40</span>
        </a>
        <a class="cms-contact-button" href="${escapeHtml(telegramHref)}" target="_blank" rel="noopener">Telegram*</a>
        <a class="cms-contact-button" href="${escapeHtml(maxHref)}" target="_blank" rel="noopener">MAX</a>
        <a class="cms-contact-button" href="${escapeHtml(instagramHref)}" target="_blank" rel="noopener">Instagram*</a>
        <a class="cms-contact-button" href="${escapeHtml(whatsappHref)}" target="_blank" rel="noopener">WhatsApp*</a>
      </div>
    `;

    record.classList.add('cms-contact-record');
    record.querySelector('.t396')?.setAttribute('aria-hidden', 'true');
    record.append(panel);
  }

  function splitReviewName(value) {
    const name = String(value || '').trim();
    const match = name.match(/^(.+?)\s+[—–-]\s+(.+)$/);
    if (!match) return { person: name, company: '' };
    return {
      person: match[1].trim(),
      company: match[2].trim()
    };
  }

  function reviewNameHtml(value) {
    const parts = splitReviewName(value);
    const primary = parts.company || parts.person;
    const secondary = parts.company ? parts.person : '';
    return `
      <span class="cms-review-card__company">${escapeHtml(primary)}</span>
      ${secondary ? `<span class="cms-review-card__person">${escapeHtml(secondary)}</span>` : ''}
    `;
  }

  function createReviewCard(item, state) {
    const nameParts = splitReviewName(item.name);
    const card = document.createElement('article');
    card.className = `cms-review-card cms-review-card_${state}`;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Открыть отзыв: ${nameParts.person || item.name || 'без имени'}`);
    card.innerHTML = `
      <div class="cms-review-card__top">
        ${item.avatar ? `<img class="cms-review-card__avatar" src="${escapeHtml(item.avatar)}" alt="">` : '<div class="cms-review-card__avatar"></div>'}
        <h3 class="cms-review-card__name">${reviewNameHtml(item.name)}</h3>
      </div>
      <p class="cms-review-card__text">${escapeHtml(item.text)}</p>
      <span class="cms-review-card__more">Читать полностью</span>
    `;
    card.addEventListener('click', () => openReviewModal(item));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openReviewModal(item);
      }
    });
    return card;
  }

  function ensureReviewModal() {
    let modal = document.querySelector('.cms-review-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'cms-review-modal';
    modal.innerHTML = `
      <div class="cms-review-modal__backdrop"></div>
      <article class="cms-review-modal__card">
        <button class="cms-review-modal__close" type="button" aria-label="Закрыть отзыв">×</button>
        <div class="cms-review-card__top">
          <div class="cms-review-card__avatar"></div>
          <h3 class="cms-review-card__name"></h3>
        </div>
        <p class="cms-review-card__text"></p>
      </article>
    `;
    document.body.append(modal);
    modal.querySelector('.cms-review-modal__backdrop').addEventListener('click', closeReviewModal);
    modal.querySelector('.cms-review-modal__close').addEventListener('click', closeReviewModal);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeReviewModal();
    });
    return modal;
  }

  function openReviewModal(item) {
    const modal = ensureReviewModal();
    const avatar = modal.querySelector('.cms-review-card__avatar');
    const name = modal.querySelector('.cms-review-card__name');
    const text = modal.querySelector('.cms-review-card__text');
    if (item.avatar) {
      avatar.innerHTML = `<img src="${escapeHtml(item.avatar)}" alt="">`;
    } else {
      avatar.innerHTML = '';
    }
    name.innerHTML = reviewNameHtml(item.name);
    text.textContent = item.text || '';
    modal.classList.add('is-open');
    document.body.classList.add('cms-modal-open');
  }

  function closeReviewModal() {
    const modal = document.querySelector('.cms-review-modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.classList.remove('cms-modal-open');
  }

  function updateReviewMoreButtons(root = document) {
    root.querySelectorAll('.cms-review-card').forEach((card) => {
      const text = card.querySelector('.cms-review-card__text');
      if (!text) return;
      const overflowed = text.scrollHeight > text.clientHeight + 2 || text.scrollWidth > text.clientWidth + 2;
      card.classList.toggle('cms-review-card_fit', !overflowed);
    });
  }

  function collectTildaReviews() {
    return Array.from(document.querySelectorAll('.t958__slidecontainer .t958__card')).map((card) => ({
      name: textFrom(card.querySelector('.t958__author-name')),
      text: textFrom(card.querySelector('.t958__review-text')),
      avatar: avatarFrom(card.querySelector('.t958__avatar'))
    })).filter((item) => item.name || item.text);
  }

  function renderReviewCarousel(extraReviews) {
    const tildaGallery = document.querySelector('.t958__gallery');
    const tildaBlock = document.querySelector('.t958');
    const sourceReviews = collectTildaReviews();
    const reviews = sourceReviews.concat(extraReviews || []);
    if (!tildaGallery || !tildaBlock || !reviews.length) return false;

    tildaGallery.classList.add('cms-hidden-tilda-reviews');

    const carousel = document.createElement('section');
    carousel.className = 'cms-review-carousel';
    carousel.innerHTML = `
      <div class="cms-review-carousel__viewport">
        <div class="cms-review-carousel__track"></div>
      </div>
      <div class="cms-review-carousel__dots"></div>
    `;
    tildaBlock.append(carousel);

    const track = carousel.querySelector('.cms-review-carousel__track');
    const dots = carousel.querySelector('.cms-review-carousel__dots');
    const getSideSlots = () => reviews.length > 1 && !window.matchMedia('(max-width: 900px)').matches ? 1 : 0;
    let sideSlots = getSideSlots();
    let active = 0;
    let trackIndex = 0;
    let autoplay = null;

    function getSlideStep() {
      const card = track.querySelector('.cms-review-card');
      if (!card) return 0;
      const gap = parseFloat(window.getComputedStyle(track).columnGap || '0') || 0;
      return card.getBoundingClientRect().width + gap;
    }

    function moveTrack(animate = true) {
      track.classList.toggle('is-jump', !animate);
      track.style.transform = `translate3d(${-trackIndex * getSlideStep()}px, 0, 0)`;
      if (!animate) {
        requestAnimationFrame(() => track.classList.remove('is-jump'));
      }
    }

    function updateState() {
      const realIndex = active % reviews.length;
      track.querySelectorAll('.cms-review-card').forEach((card, index) => {
        const isActive = Number(card.dataset.reviewIndex) === realIndex && index === trackIndex + sideSlots;
        card.classList.toggle('cms-review-card_active', isActive);
        card.classList.toggle('cms-review-card_side', !isActive);
      });
      dots.querySelectorAll('button').forEach((button, index) => {
        button.classList.toggle('is-active', index === realIndex);
      });
    }

    function setActive(index, animate = true) {
      if (index > reviews.length) index = index % reviews.length;
      active = index;
      trackIndex = index;
      updateState();
      moveTrack(animate);
    }

    function restartAutoplay() {
      window.clearInterval(autoplay);
      autoplay = window.setInterval(() => {
        setActive(active + 1);
      }, 4500);
    }

    function render() {
      const before = sideSlots ? reviews.slice(-sideSlots) : [];
      const after = reviews.slice(0, sideSlots ? 2 : 1);
      const trackReviews = before.concat(reviews, after);
      track.innerHTML = '';
      dots.innerHTML = '';

      trackReviews.forEach((review, index) => {
        const realIndex = (index - sideSlots + reviews.length) % reviews.length;
        const state = index === active ? 'active' : 'side';
        const card = createReviewCard(review, state);
        card.dataset.reviewIndex = String(realIndex);
        track.append(card);
      });

      reviews.forEach((_, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = index === active ? 'is-active' : '';
        button.setAttribute('aria-label', `Отзыв ${index + 1}`);
        button.addEventListener('click', () => {
          setActive(index);
          restartAutoplay();
        });
        dots.append(button);
      });
      setActive(active, false);
      requestAnimationFrame(() => updateReviewMoreButtons(carousel));
    }

    track.addEventListener('transitionend', (event) => {
      if (event.target !== track || event.propertyName !== 'transform') return;
      if (active >= reviews.length) {
        active = active % reviews.length;
        trackIndex = active;
        updateState();
        moveTrack(false);
      }
    });

    render();
    window.setTimeout(() => updateReviewMoreButtons(carousel), 450);
    window.addEventListener('resize', () => {
      const nextSideSlots = getSideSlots();
      if (nextSideSlots !== sideSlots) {
        sideSlots = nextSideSlots;
        render();
        return;
      }
      moveTrack(false);
      requestAnimationFrame(() => updateReviewMoreButtons(carousel));
    });
    restartAutoplay();
    return true;
  }

  function appendMediaToPortfolio(items) {
    if (!items.length) return false;
    const videos = items.filter((item) => item.type && item.type.startsWith('video'));
    const images = items.filter((item) => !item.type || !item.type.startsWith('video'));
    const grid = document.querySelector('.t979__grid');
    let mounted = false;
    if (grid && images.length) {
      images.forEach((item) => grid.append(createMediaCard(item)));
      mounted = true;
    }
    if (videos.length) {
      appendVideoSlider(videos, grid?.closest('.r, .t-rec') || grid || document.querySelector('#allrecords') || document.body);
      mounted = true;
    }
    return mounted;
  }

  function appendVideoSlider(items, anchor) {
    if (!items.length || document.querySelector('.cms-video-slider')) return false;
    const section = document.createElement('section');
    section.className = 'cms-video-slider';
    section.innerHTML = `
      <div class="cms-video-slider__head">
        <h2>Видео</h2>
      </div>
      <div class="cms-video-slider__track"></div>
    `;
    const track = section.querySelector('.cms-video-slider__track');
    items.forEach((item) => track.append(createMediaCard(item)));

    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(section, anchor.nextSibling);
    } else {
      document.body.append(section);
    }
    return true;
  }

  function renderFallbackSection(title, items, renderer) {
    if (!items.length) return null;
    const section = document.createElement('section');
    section.className = 'cms-section';
    section.innerHTML = `
      <div class="cms-section__inner">
        <h2 class="cms-section__title">${escapeHtml(title)}</h2>
        <div class="cms-grid"></div>
      </div>
    `;
    const grid = section.querySelector('.cms-grid');
    items.forEach((item) => grid.append(renderer(item, 'active')));
    return section;
  }

  function mountFallback(sections) {
    const footer = document.querySelector('[id^="rec2172565761"], [id^="rec2171226101"], [id^="rec1025539601"]');
    const target = footer || document.querySelector('#allrecords') || document.body;
    sections.filter(Boolean).forEach((section) => target.parentNode.insertBefore(section, target));
  }

  function hideExternalVideoWidget() {
    const selectors = [
      'iframe[src*="lp9.ru"]',
      '[src*="lp9.ru/widget"]',
      '[id*="lp9"]',
      '[class*="lp9"]',
      '.video-widget'
    ].join(',');
    document.querySelectorAll(selectors).forEach((node) => {
      if (!node.closest('.cms-corner-video')) node.style.display = 'none';
    });
  }

  function neutralizeLegacyVideoWidgets() {
    document.querySelectorAll('.video-widget, .t657, [id*="lp9"], [class*="lp9"]').forEach((node) => {
      if (!node.closest('.cms-corner-video')) {
        node.style.setProperty('display', 'none', 'important');
        node.setAttribute('aria-hidden', 'true');
      }
    });

    document.querySelectorAll('.video-widget video, video.video-widget__video').forEach((video) => {
      video.pause?.();
      video.removeAttribute('autoplay');
      video.removeAttribute('src');
      video.querySelectorAll('source').forEach((source) => source.removeAttribute('src'));
      video.load?.();
    });
  }

  function mountCornerVideo(settings = {}) {
    hideExternalVideoWidget();
    neutralizeLegacyVideoWidgets();
    if (document.querySelector('.cms-corner-video')) return;
    const cornerVideo = settings.cornerVideo || {};
    const source = document.querySelector('video source[data-cms-src], video[data-cms-src], video source[src], video[src]');
    const src = cornerVideo.url || source?.getAttribute('data-cms-src') || source?.getAttribute('src') || source?.parentElement?.getAttribute('data-cms-src') || source?.parentElement?.getAttribute('src') || DEFAULT_CORNER_VIDEO;
    const poster = cornerVideo.poster || posterFromVideoSrc(src);
    const widget = document.createElement('div');
    widget.className = 'cms-corner-video';
    widget.innerHTML = `
      <button class="cms-corner-video__button" type="button" aria-label="Открыть видео">
        <span class="cms-corner-video__play"></span>
        <span class="cms-corner-video__label">Видео</span>
      </button>
      <div class="cms-corner-video__panel">
        <button class="cms-corner-video__close" type="button" aria-label="Свернуть видео">×</button>
        <video data-cms-src="${escapeHtml(src)}" ${poster ? `poster="${escapeHtml(poster)}"` : ''} playsinline webkit-playsinline controls preload="metadata"></video>
      </div>
    `;
    document.body.append(widget);
    const button = widget.querySelector('.cms-corner-video__button');
    const close = widget.querySelector('.cms-corner-video__close');
    const video = widget.querySelector('video');
    const loadCornerSource = (url) => {
      if (!url) return;
      const nextPoster = cornerVideo.poster || posterFromVideoSrc(url);
      if (nextPoster) video.poster = nextPoster;
      video.src = url;
      video.dataset.cmsLoadedSrc = url;
      video.load();
    };
    ensureVideoPreview(video, poster);
    video.addEventListener('error', () => {
      if (video.dataset.cmsLoadedSrc !== DEFAULT_CORNER_VIDEO) {
        loadCornerSource(DEFAULT_CORNER_VIDEO);
        if (widget.classList.contains('is-open')) {
          video.muted = true;
          window.setTimeout(() => video.play().catch(() => {}), 80);
        }
      }
    });
    button.addEventListener('click', () => {
      widget.classList.add('is-open');
      if (!video.currentSrc && video.dataset.cmsLoadedSrc !== video.dataset.cmsSrc) {
        loadCornerSource(video.dataset.cmsSrc || DEFAULT_CORNER_VIDEO);
      }
      video.play().catch(() => {});
    });
    close.addEventListener('click', () => {
      widget.classList.remove('is-open');
      video.pause();
    });
    window.setTimeout(() => {
      hideExternalVideoWidget();
      neutralizeLegacyVideoWidgets();
    }, 600);
    window.setTimeout(() => {
      hideExternalVideoWidget();
      neutralizeLegacyVideoWidgets();
    }, 1800);
    window.setInterval(neutralizeLegacyVideoWidgets, 5000);
  }

  function collectFormFields(form) {
    const fields = {};
    const formData = new FormData(form);
    formData.forEach((value, key) => {
      if (!key || key.startsWith('formservices') || key === 'form-spec-comments') return;
      if (value instanceof File) return;
      const cleanValue = String(value || '').trim();
      if (!cleanValue) return;
      if (fields[key]) fields[key] = Array.isArray(fields[key]) ? fields[key].concat(cleanValue) : [fields[key], cleanValue];
      else fields[key] = cleanValue;
    });
    return fields;
  }

  function showFormMessage(form, message, isError) {
    let box = form.querySelector('.cms-form-message');
    if (!box) {
      box = document.createElement('div');
      box.className = 'cms-form-message';
      form.append(box);
    }
    box.textContent = message;
    box.classList.toggle('cms-form-message_error', Boolean(isError));
  }

  function isRequiredFieldFilled(input, form) {
    if (input.disabled || input.type === 'hidden') return true;
    if (input.type === 'checkbox' || input.type === 'radio') {
      return Boolean(form.querySelector(`[name="${CSS.escape(input.name)}"]:checked`));
    }
    return Boolean(String(input.value || '').trim());
  }

  function validateLocalForm(form) {
    const required = Array.from(form.querySelectorAll('[data-tilda-req="1"], [aria-required="true"], [required]'));
    const invalid = required.find((input) => !isRequiredFieldFilled(input, form));
    if (invalid) {
      invalid.closest('.t-input-group')?.classList.add('js-error-control-box');
      invalid.focus?.();
      showFormMessage(form, 'Заполните обязательные поля.', true);
      return false;
    }
    form.querySelectorAll('.js-error-control-box').forEach((node) => node.classList.remove('js-error-control-box'));
    return true;
  }

  function handleLocalFormSuccess(form) {
    showFormMessage(form, 'Заявка отправлена. Мы свяжемся с вами в ближайшее время.');
    const successBox = form.querySelector('.js-successbox');
    if (successBox) {
      successBox.textContent = 'Спасибо! Заявка отправлена.';
      successBox.style.display = 'block';
    }
    const callback = form.dataset.successCallback;
    const quiz = form.closest('.t-quiz');
    if (callback && typeof window[callback] === 'function' && quiz) {
      window[callback](quiz);
    }
    form.reset();
  }

  function mountLocalForms() {
    document.querySelectorAll('form.t-form, form.js-form-proccess').forEach((form) => {
      if (form.dataset.cmsLocalForm === 'true') return;
      form.dataset.cmsLocalForm = 'true';
      form.setAttribute('action', '/api/inquiry');
      form.querySelectorAll('[name="formservices[]"]').forEach((node) => node.remove());

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!validateLocalForm(form)) return;

        const submitButton = form.querySelector('[type="submit"]');
        const previousDisabled = submitButton?.disabled;
        if (submitButton) submitButton.disabled = true;
        showFormMessage(form, 'Отправляем заявку...');

        try {
          const response = await fetch('/api/inquiry', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              page: route,
              formId: form.id || form.name || '',
              title: document.title,
              fields: collectFormFields(form)
            })
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.error || 'Не удалось отправить заявку');
          handleLocalFormSuccess(form);
        } catch (error) {
          showFormMessage(form, error.message, true);
        } finally {
          if (submitButton) submitButton.disabled = previousDisabled || false;
        }
      }, true);
    });
  }

  optimizeNativeMedia();
  applyVideoPosters();
  bindLazyMediaObserver();
  bindLoadMoreHydration();
  preloadHeroImage();
  mountLocalForms();
  mountWeddingContacts();
  mountCorporateGuarantees();
  mountTariffReadMore();
  neutralizeLegacyVideoWidgets();

  fetch('/api/cms')
    .then((response) => response.json())
    .then((cms) => {
      const media = (cms.media || []).filter(matchesPage);
      const reviews = (cms.reviews || []).filter(matchesPage);
      const settings = cms.settings || {};
      applyTypographySettings(settings);
      applyVideoPosters(settings);
      const mediaMounted = appendMediaToPortfolio(media);
      const reviewsMounted = renderReviewCarousel(reviews);

      mountFallback([
        mediaMounted ? null : renderFallbackSection('Портфолио', media, createMediaCard),
        reviewsMounted ? null : renderFallbackSection('Отзывы', reviews, createReviewCard)
      ]);
      mountBottomBlock(settings);
      mountCornerVideo(settings);
    })
    .catch(() => {
      applyTypographySettings();
      mountCornerVideo();
    });
})();
