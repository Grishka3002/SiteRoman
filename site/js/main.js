/* Роман Шумилов — общий скрипт: бургер-меню, квиз, deep-links мессенджеров */

/* Контакты для кнопок мессенджеров и звонка.
   TODO: заполнить реальными данными заказчика перед запуском. */
var CONTACTS = {
  whatsapp: '', // номер в международном формате без «+», напр. '79140000000'
  telegram: '', // username без «@», напр. 'shymilovroman'
  vk: '',       // id или короткое имя страницы, напр. 'shymilovroman'
  phone: ''     // номер для звонка, напр. '+79140000000'
};

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- экран загрузки (0→100%) ----------
     Полная анимация — один раз за сессию (флаг в sessionStorage,
     проверяется инлайн-скриптом в <head>, который ставит .no-preloader). */
  var preloader = document.getElementById('preloader');
  if (preloader) {
    if (document.documentElement.classList.contains('no-preloader')) {
      preloader.remove();
    } else {
      var num = preloader.querySelector('.preloader-num');
      var bar = preloader.querySelector('.preloader-line span');
      var t0 = null, DURATION = 1400, finished = false;
      var finish = function () {
        if (finished) return;
        finished = true;
        if (num) num.textContent = '100%';
        if (bar) bar.style.width = '100%';
        preloader.classList.add('done');
        try { sessionStorage.setItem('rsh-loaded', '1'); } catch (err) {}
        setTimeout(function () { preloader.remove(); }, 600);
      };
      var tick = function (ts) {
        if (finished) return;
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / DURATION);
        var e = 1 - Math.pow(1 - p, 3); /* ease-out */
        if (num) num.textContent = Math.round(e * 100) + '%';
        if (bar) bar.style.width = (e * 100) + '%';
        if (p < 1) requestAnimationFrame(tick);
        else finish();
      };
      requestAnimationFrame(tick);
      /* страховка: rAF стоит в фоновой вкладке — не держать оверлей вечно */
      setTimeout(finish, DURATION + 800);
    }
  }

  /* ---------- свечение под курсором ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);
    var gx = window.innerWidth / 2, gy = window.innerHeight / 2;
    var tx = gx, ty = gy;
    document.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
    });
    (function follow() {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.left = gx + 'px';
      glow.style.top = gy + 'px';
      requestAnimationFrame(follow);
    })();
  }

  /* ---------- видео-визитка: плавающая кнопка + панель ---------- */
  var vizFab = document.getElementById('vizitka-fab');
  var vizPanel = document.getElementById('vizitka-panel');
  if (vizFab && vizPanel) {
    var panelVideo = function () { return vizPanel.querySelector('video'); };
    var openViz = function () {
      vizPanel.classList.add('open');
      vizFab.classList.add('hidden');
      var v = panelVideo();
      if (v) {
        v.muted = false;
        var p = v.play();
        if (p) p.catch(function () {}); /* если автозапуск запрещён — останется постер с Play */
      }
    };
    var closeViz = function () {
      vizPanel.classList.remove('open');
      vizFab.classList.remove('hidden');
      var v = panelVideo();
      if (v) v.pause();
    };
    vizFab.querySelector('.vizitka-fab-btn').addEventListener('click', openViz);
    vizPanel.querySelector('.vizitka-close').addEventListener('click', closeViz);
    vizPanel.addEventListener('click', function (e) {
      if (e.target.closest('.vizitka-panel-cta')) closeViz(); /* по CTA закрываем и скроллим к квизу */
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeViz();
    });
  }

  /* ---------- бургер-меню ---------- */
  var burger = document.querySelector('.burger');
  var navLinks = document.querySelector('.nav-links');
  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') navLinks.classList.remove('open');
    });
  }

  /* ---------- квиз ---------- */
  var form = document.querySelector('.quiz-form');
  if (!form) return;

  function collectData() {
    var data = {};
    form.querySelectorAll('input[name]').forEach(function (input) {
      data[input.name] = input.value.trim();
    });
    var gift = document.querySelector('.gifts input:checked');
    if (gift) {
      var giftLabel = gift.closest('label');
      data.gift = giftLabel ? giftLabel.textContent.trim() : gift.value;
    }
    return data;
  }

  function validPhone(value) {
    var digits = value.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 12;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var phoneInput = form.querySelector('input[name="phone"]');
    if (!phoneInput || !validPhone(phoneInput.value)) {
      if (phoneInput) {
        phoneInput.classList.add('invalid');
        phoneInput.focus();
      }
      return;
    }
    phoneInput.classList.remove('invalid');

    var data = collectData();
    data.page = document.title;
    fetch('/api/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(function () {
      console.warn('Заявка не дошла до сервера:', data);
    });

    form.classList.add('sent');
  });

  form.querySelectorAll('input').forEach(function (input) {
    input.addEventListener('input', function () {
      input.classList.remove('invalid');
    });
  });

  /* ---------- deep-links мессенджеров ---------- */
  function buildMessage() {
    var d = collectData();
    var parts = ['Здравствуйте! Хочу рассчитать стоимость мероприятия.'];
    if (d.date) parts.push('Дата: ' + d.date);
    if (d.city) parts.push('Город: ' + d.city);
    if (d.name) parts.push('Имя: ' + d.name);
    if (d.company) parts.push('Компания: ' + d.company);
    if (d.gift) parts.push('Подарок: ' + d.gift);
    return parts.join('\n');
  }

  document.querySelectorAll('[data-messenger]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var type = link.getAttribute('data-messenger');
      var url = '';
      if (type === 'whatsapp' && CONTACTS.whatsapp) {
        url = 'https://wa.me/' + CONTACTS.whatsapp + '?text=' + encodeURIComponent(buildMessage());
      } else if (type === 'telegram' && CONTACTS.telegram) {
        url = 'https://t.me/' + CONTACTS.telegram;
      } else if (type === 'vk' && CONTACTS.vk) {
        url = 'https://vk.com/' + CONTACTS.vk;
      } else if (type === 'phone' && CONTACTS.phone) {
        url = 'tel:' + CONTACTS.phone;
      }
      if (url) {
        link.setAttribute('href', url);
        if (type !== 'phone') link.setAttribute('target', '_blank');
      } else {
        e.preventDefault();
      }
    });
  });
});
