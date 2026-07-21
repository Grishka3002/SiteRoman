/* Админ-панель: тексты, фото, видео, бегущие строки, заявки */
(function () {
  'use strict';

  var KEY_STORAGE = 'rsh-admin-key';
  var state = {
    key: localStorage.getItem(KEY_STORAGE) || '',
    data: null,        // ответ /api/admin/data
    page: 'home',      // активная вкладка
    dirty: false
  };

  /* ---------- подписи ---------- */
  var SECTION_LABELS = {
    logo: 'ЛОГОТИП', nav: 'НАВИГАЦИЯ', hero: 'ГЕРОЙ (ПЕРВЫЙ ЭКРАН)',
    stripLeft: 'ФОТО-ЛЕНТА — ЛЕВАЯ КОЛОНКА', stripRight: 'ФОТО-ЛЕНТА — ПРАВАЯ КОЛОНКА',
    marquee: 'БЕГУЩАЯ СТРОКА', guar: 'ГАРАНТИИ', pkg: 'ПАКЕТЫ УСЛУГ', lv: 'УРОВНИ РЕАЛИЗАЦИИ',
    videos: 'ВИДЕО', rev: 'ОТЗЫВЫ', faq: 'ВОПРОСЫ И ОТВЕТЫ (FAQ)', quiz: 'КВИЗ — РАСЧЁТ СТОИМОСТИ',
    footer: 'ФУТЕР', fine: 'МЕЛКИЙ ТЕКСТ В ПОДВАЛЕ', preloader: 'ЭКРАН ЗАГРУЗКИ',
    vizitka: 'ВИДЕО-ВИЗИТКА'
  };
  var FIELD_LABELS = {
    text: 'Текст', label: 'Надпись', type: 'Тайпрайтер-строка', title: 'Заголовок', lead: 'Подзаголовок / текст',
    cities: 'Строка внизу героя', kicker: 'Надпись справа от заголовка', note: 'Строка под карточками',
    btn: 'Кнопка', btnQuiz: 'Жёлтая кнопка', btnWeddings: 'Кнопка «Свадьбы»',
    btnCorporate: 'Кнопка «Корпоративы»', btnPackages: 'Кнопка «Пакеты услуг»',
    btnLevels: 'Кнопка «Уровни реализации»', cta: 'Кнопка', badge: 'Бейдж', name: 'Название',
    sub: 'Подпись под названием', desc: 'Описание', gift: 'Подпись под кнопкой',
    social: 'Соцсети', policy: 'Политика конфиденциальности', logo: 'Логотип',
    consent: 'Согласие на обработку данных', successTitle: 'Заголовок после отправки',
    successText: 'Текст после отправки', phDate: 'Плейсхолдер «Дата»', phCity: 'Плейсхолдер «Город»',
    phName: 'Плейсхолдер «Имя»', phCompany: 'Плейсхолдер «Компания»', phPhone: 'Плейсхолдер «Телефон»'
  };
  function fieldLabel(key) {
    var last = key.split('.').pop();
    if (FIELD_LABELS[last]) return FIELD_LABELS[last];
    var m;
    if ((m = last.match(/^h(\d+)$/))) return 'Заголовок ' + m[1];
    if ((m = last.match(/^t(\d+)$/))) return 'Текст ' + m[1];
    if ((m = last.match(/^q(\d+)$/))) return 'Вопрос ' + m[1];
    if ((m = last.match(/^a(\d+)$/))) return 'Ответ ' + m[1];
    if ((m = last.match(/^n(\d+)$/))) return 'Имя ' + m[1];
    if ((m = last.match(/^img(\d+)$/))) return 'Фото ' + m[1];
    if ((m = last.match(/^i(\d+)l$/))) return 'Пункт ' + m[1] + ' — выделенная метка';
    if ((m = last.match(/^i(\d+)t$/))) return 'Пункт ' + m[1] + ' — текст';
    if ((m = last.match(/^i(\d+)$/))) return 'Пункт ' + m[1];
    if ((m = last.match(/^gift(\d+)$/))) return 'Подарок ' + m[1];
    if ((m = last.match(/^msg(\d+)$/))) return 'Кнопка мессенджера ' + m[1];
    if ((m = last.match(/^link(\d+)$/))) return 'Ссылка ' + m[1];
    return last;
  }

  /* ---------- api ---------- */
  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ 'x-admin-key': state.key }, opts.headers || {});
    return fetch(path, opts).then(function (r) {
      if (r.status === 401) { logout(); throw new Error('Неверный пароль'); }
      if (!r.ok) return r.json().then(function (e) { throw new Error(e.error || 'Ошибка сервера'); });
      return r.json();
    });
  }

  /* ---------- элементы ---------- */
  var $login = document.getElementById('login');
  var $panel = document.getElementById('panel');
  var $tabs = document.getElementById('tabs');
  var $content = document.getElementById('content');
  var $savebar = document.getElementById('savebar');
  var $status = document.getElementById('save-status');

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ---------- вход/выход ---------- */
  function logout() {
    localStorage.removeItem(KEY_STORAGE);
    state.key = '';
    $panel.classList.add('hidden');
    $login.classList.remove('hidden');
  }
  document.getElementById('logout').addEventListener('click', logout);
  document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    state.key = document.getElementById('login-password').value;
    api('/api/admin/check').then(function () {
      localStorage.setItem(KEY_STORAGE, state.key);
      start();
    }).catch(function (err) {
      document.getElementById('login-error').textContent = err.message;
    });
  });

  function start() {
    $login.classList.add('hidden');
    $panel.classList.remove('hidden');
    loadData();
  }

  function loadData() {
    api('/api/admin/data').then(function (res) {
      state.data = res.pages;
      renderTabs();
      renderPage();
    }).catch(function (err) {
      $content.innerHTML = '<div class="empty">' + err.message + '</div>';
    });
  }

  /* ---------- вкладки ---------- */
  function renderTabs() {
    $tabs.innerHTML = '';
    Object.keys(state.data).forEach(function (pageId) {
      var b = el('button', pageId === state.page ? 'active' : '', state.data[pageId].title);
      b.addEventListener('click', function () { switchTab(pageId); });
      $tabs.appendChild(b);
    });
    var inq = el('button', state.page === '_inq' ? 'active' : '', 'Заявки');
    inq.addEventListener('click', function () { switchTab('_inq'); });
    $tabs.appendChild(inq);
  }
  function switchTab(pageId) {
    if (state.dirty && !confirm('Есть несохранённые изменения. Перейти без сохранения?')) return;
    state.page = pageId;
    state.dirty = false;
    renderTabs();
    renderPage();
  }
  function markDirty() {
    state.dirty = true;
    $status.textContent = 'Есть несохранённые изменения';
    $status.className = '';
  }
  window.addEventListener('beforeunload', function (e) {
    if (state.dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ---------- страница ---------- */
  function renderPage() {
    $content.innerHTML = '';
    if (state.page === '_inq') {
      $savebar.classList.add('hidden');
      renderInquiries();
      return;
    }
    $savebar.classList.remove('hidden');
    $status.textContent = '';
    var page = state.data[state.page];

    /* группировка по секциям в порядке появления */
    var sections = {};
    var order = [];
    function section(name) {
      if (!sections[name]) {
        sections[name] = { fields: [], images: [], photos: [], videos: [], marquees: [], settings: [] };
        order.push(name);
      }
      return sections[name];
    }
    page.fields.forEach(function (f) { section(f.key.split('.')[0]).fields.push(f); });
    (page.images || []).forEach(function (im) { section(im.key.split('.')[0]).images.push(im); });
    page.photos.forEach(function (p) { section(p.key).photos.push(p); });
    page.videos.forEach(function (v) { section(v.key === 'videos' ? 'videos' : v.key).videos.push(v); });
    page.marquees.forEach(function (m) { section(m.key).marquees.push(m); });
    (page.settings || []).forEach(function (s) { section(s.section || 'settings').settings.push(s); });

    order.forEach(function (name) {
      var sec = sections[name];
      var card = el('details', 'section-card');
      card.open = false;
      var count = sec.fields.length + sec.photos.reduce(function (a, p) { return a + p.value.length; }, 0) +
                  sec.videos.reduce(function (a, v) { return a + v.value.length; }, 0) +
                  sec.marquees.reduce(function (a, m) { return a + m.value.length; }, 0);
      card.appendChild(el('summary', '', (SECTION_LABELS[name] || name.toUpperCase()) +
        '<span class="cnt">' + count + '</span>'));
      var body = el('div', 'section-body');

      /* тексты с подгруппами (pkg.p1.* и т.п.) */
      var lastSub = null;
      sec.fields.forEach(function (f) {
        var parts = f.key.split('.');
        if (parts.length === 3 && parts[1] !== lastSub) {
          lastSub = parts[1];
          var nameField = sec.fields.filter(function (x) {
            return x.key === parts[0] + '.' + parts[1] + '.name';
          })[0];
          body.appendChild(el('div', 'subgroup', nameField ? stripTags(nameField.value) : parts[1].toUpperCase()));
        }
        body.appendChild(fieldEl(f));
      });

      sec.images.forEach(function (im) { body.appendChild(imageEl(im)); });
      sec.marquees.forEach(function (m) { body.appendChild(marqueeEl(m)); });
      sec.photos.forEach(function (p) { body.appendChild(photosEl(p)); });
      sec.videos.forEach(function (v) { body.appendChild(videosEl(v)); });
      sec.settings.forEach(function (s) { body.appendChild(settingEl(s)); });

      card.appendChild(body);
      $content.appendChild(card);
    });
  }

  function stripTags(s) {
    var d = document.createElement('div');
    d.innerHTML = s;
    return d.textContent;
  }

  /* текстовое поле */
  function fieldEl(f) {
    var wrap = el('div', 'field');
    wrap.appendChild(el('label', '', fieldLabel(f.key)));
    var long = f.value.length > 70 || f.value.indexOf('<br>') !== -1;
    var input;
    if (long) {
      input = el('textarea');
      input.rows = Math.min(6, Math.max(2, Math.ceil(f.value.length / 80)));
    } else {
      input = el('input');
      input.type = 'text';
    }
    input.value = f.value;
    input.addEventListener('input', function () {
      f.value = input.value;
      wrap.classList.toggle('changed', f.value !== f.def);
      markDirty();
    });
    wrap.appendChild(input);
    if (f.value.indexOf('<br>') !== -1 || f.value.indexOf('&nbsp;') !== -1) {
      wrap.appendChild(el('div', 'hint', '&lt;br&gt; — перенос строки, &amp;nbsp; — неразрывный пробел'));
    }
    return wrap;
  }

  /* одиночная картинка (аватар отзыва и т.п.) */
  function imageEl(im) {
    var wrap = el('div', 'media-item');
    var img = el('img');
    img.src = '/' + im.value;
    wrap.appendChild(img);
    var name = el('div', 'media-name', fieldLabel(im.key));
    name.style.flex = '1';
    wrap.appendChild(name);
    var actions = el('div', 'media-actions');
    var repl = el('button', '', '⟳'); repl.title = 'Заменить фото';
    repl.addEventListener('click', function () {
      uploadFile('image/*', function (path) {
        im.value = path;
        img.src = '/' + path;
        markDirty();
      });
    });
    actions.appendChild(repl);
    if (im.value !== im.def) {
      var reset = el('button', '', '⊘'); reset.title = 'Вернуть исходное';
      reset.addEventListener('click', function () {
        im.value = im.def;
        img.src = '/' + im.def;
        markDirty();
      });
      actions.appendChild(reset);
    }
    wrap.appendChild(actions);
    return wrap;
  }

  /* числовая настройка (ползунок + поле) */
  function settingEl(s) {
    var wrap = el('div', 'field');
    wrap.appendChild(el('label', '', s.label || s.key));
    var row = el('div', 'setting-row');
    var range = el('input');
    range.type = 'range'; range.min = s.min; range.max = s.max; range.value = s.value;
    var num = el('input');
    num.type = 'number'; num.min = s.min; num.max = s.max; num.value = s.value;
    var sync = function (v) {
      v = Math.max(s.min, Math.min(s.max, parseInt(v, 10) || s.def));
      s.value = v; range.value = v; num.value = v;
      markDirty();
    };
    range.addEventListener('input', function () { sync(range.value); });
    num.addEventListener('change', function () { sync(num.value); });
    row.appendChild(range);
    row.appendChild(num);
    wrap.appendChild(row);
    return wrap;
  }

  /* бегущая строка */
  function marqueeEl(m) {
    var wrap = el('div', 'field');
    wrap.appendChild(el('label', '', 'Фразы бегущей строки (каждая с новой строки)'));
    var ta = el('textarea');
    ta.rows = m.value.length + 1;
    ta.value = m.value.join('\n');
    ta.addEventListener('input', function () {
      m.value = ta.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      markDirty();
    });
    wrap.appendChild(ta);
    return wrap;
  }

  /* загрузка файла */
  function uploadFile(accept, cb) {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = accept;
    inp.addEventListener('change', function () {
      if (!inp.files[0]) return;
      var fd = new FormData();
      fd.append('file', inp.files[0]);
      $status.textContent = 'Загрузка файла…';
      $status.className = '';
      api('/api/admin/upload', { method: 'POST', body: fd }).then(function (res) {
        $status.textContent = 'Файл загружен';
        cb(res.path);
      }).catch(function (err) {
        $status.textContent = err.message;
        $status.className = 'err';
      });
    });
    inp.click();
  }

  /* список фото */
  function photosEl(p) {
    var wrap = el('div', 'media-list');

    function render() {
      wrap.innerHTML = '';
      p.value.forEach(function (item, idx) {
        var row = el('div', 'media-item');
        var img = el('img');
        img.src = '/' + item.src;
        row.appendChild(img);

        var fields = el('div', 'media-fields');
        var alt = el('input');
        alt.placeholder = 'Описание (alt)';
        alt.value = item.alt || '';
        alt.addEventListener('input', function () { item.alt = alt.value; markDirty(); });
        var pos = el('input');
        pos.placeholder = 'Кадрирование';
        pos.title = 'object-position: «50% 20%» — выше, «50% 80%» — ниже';
        pos.value = item.pos || '50% 50%';
        pos.addEventListener('input', function () { item.pos = pos.value; markDirty(); });
        fields.appendChild(alt);
        fields.appendChild(pos);
        row.appendChild(fields);

        var actions = el('div', 'media-actions');
        var up = el('button', '', '↑'); up.title = 'Выше';
        up.addEventListener('click', function () {
          if (idx === 0) return;
          p.value.splice(idx - 1, 0, p.value.splice(idx, 1)[0]);
          markDirty(); render();
        });
        var down = el('button', '', '↓'); down.title = 'Ниже';
        down.addEventListener('click', function () {
          if (idx === p.value.length - 1) return;
          p.value.splice(idx + 1, 0, p.value.splice(idx, 1)[0]);
          markDirty(); render();
        });
        var repl = el('button', '', '⟳'); repl.title = 'Заменить фото';
        repl.addEventListener('click', function () {
          uploadFile('image/*', function (path) { item.src = path; markDirty(); render(); });
        });
        var del = el('button', 'del', '✕'); del.title = 'Удалить';
        del.addEventListener('click', function () {
          if (p.value.length <= 1) { alert('В ленте должно остаться хотя бы одно фото'); return; }
          p.value.splice(idx, 1);
          markDirty(); render();
        });
        actions.appendChild(up); actions.appendChild(down); actions.appendChild(repl); actions.appendChild(del);
        row.appendChild(actions);
        wrap.appendChild(row);
      });
      var add = el('button', 'add-media', '+ Добавить фото');
      add.addEventListener('click', function () {
        uploadFile('image/*', function (path) {
          p.value.push({ src: path, alt: '', pos: '50% 50%' });
          markDirty(); render();
        });
      });
      wrap.appendChild(add);
    }
    render();
    return wrap;
  }

  /* список видео (элемент: {src, poster}) */
  function videosEl(v) {
    /* обратная совместимость со старым форматом (строка-src) */
    v.value = v.value.map(function (x) {
      return typeof x === 'string' ? { src: x, poster: '' } : x;
    });
    var wrap = el('div', 'media-list');
    function render() {
      wrap.innerHTML = '';
      v.value.forEach(function (item, idx) {
        var row = el('div', 'media-item');
        if (item.poster) {
          var img = el('img');
          img.src = '/' + item.poster;
          img.title = 'Превью видео';
          row.appendChild(img);
        } else {
          var vid = el('video');
          vid.src = '/' + item.src;
          vid.preload = 'metadata';
          vid.muted = true;
          row.appendChild(vid);
        }
        var name = el('div', 'media-name', item.src.split('/').pop() +
          (item.poster ? '<br><span style="color:#8fce8f">превью: ' + item.poster.split('/').pop() + '</span>' : ''));
        name.style.flex = '1';
        row.appendChild(name);
        var actions = el('div', 'media-actions');
        var up = el('button', '', '↑'); up.title = 'Выше';
        up.addEventListener('click', function () {
          if (idx === 0) return;
          v.value.splice(idx - 1, 0, v.value.splice(idx, 1)[0]);
          markDirty(); render();
        });
        var down = el('button', '', '↓'); down.title = 'Ниже';
        down.addEventListener('click', function () {
          if (idx === v.value.length - 1) return;
          v.value.splice(idx + 1, 0, v.value.splice(idx, 1)[0]);
          markDirty(); render();
        });
        var poster = el('button', '', '🖼'); poster.title = 'Загрузить фото-превью';
        poster.addEventListener('click', function () {
          uploadFile('image/*', function (path) { item.poster = path; markDirty(); render(); });
        });
        actions.appendChild(up); actions.appendChild(down); actions.appendChild(poster);
        if (item.poster) {
          var noPoster = el('button', '', '⊘'); noPoster.title = 'Убрать превью';
          noPoster.addEventListener('click', function () { item.poster = ''; markDirty(); render(); });
          actions.appendChild(noPoster);
        }
        var del = el('button', 'del', '✕'); del.title = 'Удалить видео';
        del.addEventListener('click', function () {
          if (v.value.length <= 1) { alert('Должно остаться хотя бы одно видео'); return; }
          v.value.splice(idx, 1);
          markDirty(); render();
        });
        actions.appendChild(del);
        row.appendChild(actions);
        wrap.appendChild(row);
      });
      var add = el('button', 'add-media', '+ Добавить видео');
      add.addEventListener('click', function () {
        uploadFile('video/*', function (path) {
          v.value.push({ src: path, poster: '' });
          markDirty(); render();
        });
      });
      wrap.appendChild(add);
    }
    render();
    return wrap;
  }

  /* ---------- сохранение ---------- */
  document.getElementById('save').addEventListener('click', function () {
    if (state.page === '_inq') return;
    var page = state.data[state.page];
    var body = { page: state.page, texts: {}, images: {}, photos: {}, videos: {}, marquees: {}, settings: {} };
    page.fields.forEach(function (f) { body.texts[f.key] = f.value; });
    (page.images || []).forEach(function (im) { body.images[im.key] = im.value; });
    page.photos.forEach(function (p) { body.photos[p.key] = p.value; });
    page.videos.forEach(function (v) { body.videos[v.key] = v.value; });
    page.marquees.forEach(function (m) { body.marquees[m.key] = m.value; });
    (page.settings || []).forEach(function (s) { body.settings[s.key] = s.value; });
    $status.textContent = 'Сохранение…';
    $status.className = '';
    api('/api/admin/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function () {
      state.dirty = false;
      $status.textContent = 'Сохранено. Изменения уже на сайте.';
      $status.className = 'ok';
    }).catch(function (err) {
      $status.textContent = err.message;
      $status.className = 'err';
    });
  });

  document.getElementById('reset-page').addEventListener('click', function () {
    if (state.page === '_inq') return;
    if (!confirm('Вернуть страницу «' + state.data[state.page].title + '» к исходному виду? Все правки этой страницы будут удалены.')) return;
    api('/api/admin/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: state.page })
    }).then(function () {
      state.dirty = false;
      loadData();
    });
  });

  /* ---------- заявки ---------- */
  function renderInquiries() {
    $content.innerHTML = '<div class="empty">Загрузка…</div>';
    api('/api/admin/inquiries').then(function (list) {
      $content.innerHTML = '';
      if (!list.length) {
        $content.appendChild(el('div', 'empty', 'Заявок пока нет'));
        return;
      }
      list.forEach(function (q) {
        var box = el('div', 'inq');
        var main = el('div', 'inq-main');
        main.appendChild(el('div', 'inq-phone', q.phone || '—'));
        var meta = new Date(q.createdAt).toLocaleString('ru-RU') + (q.page ? ' · ' + q.page : '');
        main.appendChild(el('div', 'inq-meta', meta));
        var rows = [];
        if (q.name) rows.push('Имя: ' + q.name);
        if (q.company) rows.push('Компания: ' + q.company);
        if (q.date) rows.push('Дата события: ' + q.date);
        if (q.city) rows.push('Город: ' + q.city);
        if (q.gift) rows.push('Подарок: ' + q.gift);
        rows.forEach(function (r) { main.appendChild(el('div', 'inq-row', r)); });
        box.appendChild(main);
        var del = el('button', 'inq-del', 'Удалить');
        del.addEventListener('click', function () {
          if (!confirm('Удалить заявку?')) return;
          api('/api/admin/inquiries/' + q.id, { method: 'DELETE' }).then(renderInquiries);
        });
        box.appendChild(del);
        $content.appendChild(box);
      });
    });
  }

  /* ---------- старт ---------- */
  if (state.key) {
    api('/api/admin/check').then(start).catch(function () {
      $login.classList.remove('hidden');
    });
  } else {
    $login.classList.remove('hidden');
  }
})();
