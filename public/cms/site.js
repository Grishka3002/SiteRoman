(function () {
  const route = window.location.pathname.replace(/\/$/, '') || '/';

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
    const style = node.getAttribute('style') || '';
    const match = style.match(/url\(["']?([^"')]+)["']?\)/i);
    return match?.[1] || node.getAttribute('data-original') || '';
  }

  function createMediaCard(item) {
    const figure = document.createElement('figure');
    figure.className = 'cms-media-card';

    const isVideo = item.type && item.type.startsWith('video');
    const media = document.createElement(isVideo ? 'video' : 'img');
    media.src = item.url;
    if (isVideo) {
      media.controls = true;
      media.playsInline = true;
      media.preload = 'metadata';
    } else {
      media.loading = 'lazy';
      media.alt = item.caption || '';
    }
    figure.append(media);

    if (item.caption) {
      const caption = document.createElement('figcaption');
      caption.className = 'cms-media-card__caption';
      caption.textContent = item.caption;
      figure.append(caption);
    }

    return figure;
  }

  function createReviewCard(item, state) {
    const card = document.createElement('article');
    card.className = `cms-review-card cms-review-card_${state}`;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Открыть отзыв: ${item.name || 'без имени'}`);
    card.innerHTML = `
      <div class="cms-review-card__top">
        ${item.avatar ? `<img class="cms-review-card__avatar" src="${escapeHtml(item.avatar)}" alt="">` : '<div class="cms-review-card__avatar"></div>'}
        <h3 class="cms-review-card__name">${escapeHtml(item.name)}</h3>
      </div>
      <p class="cms-review-card__text">${escapeHtml(item.text)}</p>
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
    name.textContent = item.name || '';
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
      <div class="cms-review-carousel__track"></div>
      <div class="cms-review-carousel__dots"></div>
    `;
    tildaBlock.append(carousel);

    const track = carousel.querySelector('.cms-review-carousel__track');
    const dots = carousel.querySelector('.cms-review-carousel__dots');
    let active = Math.min(1, reviews.length - 1);
    let switchTimer = null;

    function render() {
      track.innerHTML = '';
      dots.innerHTML = '';
      const visibleCount = Math.min(3, reviews.length);
      const indexes = Array.from({ length: visibleCount }, (_, offset) => (active + offset) % reviews.length);

      indexes.forEach((reviewIndex, position) => {
        const state = position === 0 ? 'active' : 'side';
        track.append(createReviewCard(reviews[reviewIndex], state));
      });

      reviews.forEach((_, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = index === active ? 'is-active' : '';
        button.setAttribute('aria-label', `Отзыв ${index + 1}`);
        button.addEventListener('click', () => switchTo(index));
        dots.append(button);
      });
    }

    function switchTo(index) {
      window.clearTimeout(switchTimer);
      carousel.classList.add('is-switching');
      switchTimer = window.setTimeout(() => {
        active = index;
        render();
        requestAnimationFrame(() => carousel.classList.remove('is-switching'));
      }, 260);
    }

    render();
    window.setInterval(() => {
      switchTo((active + 1) % reviews.length);
    }, 4500);
    return true;
  }

  function appendMediaToPortfolio(items) {
    if (!items.length) return false;
    const grid = document.querySelector('.t979__grid');
    if (!grid) return false;
    items.forEach((item) => grid.append(createMediaCard(item)));
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
      '[class*="lp9"]'
    ].join(',');
    document.querySelectorAll(selectors).forEach((node) => {
      if (!node.closest('.cms-corner-video')) node.style.display = 'none';
    });
  }

  function mountCornerVideo() {
    hideExternalVideoWidget();
    if (document.querySelector('.cms-corner-video')) return;
    const source = document.querySelector('video source[src], video[src]');
    const src = source?.getAttribute('src') || source?.parentElement?.getAttribute('src') || '/assets/360p.f5fe27dad4.mp4';
    const widget = document.createElement('div');
    widget.className = 'cms-corner-video';
    widget.innerHTML = `
      <button class="cms-corner-video__button" type="button" aria-label="Открыть видео">
        <span class="cms-corner-video__play"></span>
      </button>
      <div class="cms-corner-video__panel">
        <button class="cms-corner-video__close" type="button" aria-label="Свернуть видео">×</button>
        <video src="${escapeHtml(src)}" playsinline controls></video>
      </div>
    `;
    document.body.append(widget);
    const button = widget.querySelector('.cms-corner-video__button');
    const close = widget.querySelector('.cms-corner-video__close');
    const video = widget.querySelector('video');
    button.addEventListener('click', () => {
      widget.classList.add('is-open');
      video.play().catch(() => {});
    });
    close.addEventListener('click', () => {
      widget.classList.remove('is-open');
      video.pause();
    });
    window.setTimeout(hideExternalVideoWidget, 600);
    window.setTimeout(hideExternalVideoWidget, 1800);
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

  mountLocalForms();

  fetch('/api/cms')
    .then((response) => response.json())
    .then((cms) => {
      const media = (cms.media || []).filter(matchesPage);
      const reviews = (cms.reviews || []).filter(matchesPage);
      const mediaMounted = appendMediaToPortfolio(media);
      const reviewsMounted = renderReviewCarousel(reviews);

      mountFallback([
        mediaMounted ? null : renderFallbackSection('Портфолио', media, createMediaCard),
        reviewsMounted ? null : renderFallbackSection('Отзывы', reviews, createReviewCard)
      ]);
      mountCornerVideo();
    })
    .catch(() => {
      mountCornerVideo();
    });
})();
