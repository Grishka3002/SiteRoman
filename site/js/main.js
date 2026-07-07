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
    if (gift) data.gift = gift.value;
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
    /* TODO production: отправка заявки на бэкенд (data/inquiries.json)
       или в Telegram-бот. Пока заявка фиксируется в консоли. */
    console.log('Заявка:', data);

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
