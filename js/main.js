(function () {
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var toggle = doc.querySelector('.nav-toggle');
  var nav = doc.getElementById('nav');
  function setNav(open) {
    nav.classList.toggle('open', open);
    doc.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setNav(!nav.classList.contains('open'));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setNav(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (m) {
      if (m.matches) setNav(false);
    });
  }

  var reveals = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  var quoteList = doc.querySelector('[data-quotes]');
  var quoteNav = doc.querySelector('[data-quote-nav]');
  if (quoteList && quoteNav) {
    var quoteBtns = quoteNav.querySelectorAll('button');

    function quoteStep() {
      var items = quoteList.children;
      return items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : quoteList.clientWidth;
    }

    function quoteEnds() {
      var max = quoteList.scrollWidth - quoteList.clientWidth;
      quoteNav.hidden = max <= 2;
      quoteBtns[0].disabled = quoteList.scrollLeft <= 2;
      quoteBtns[1].disabled = quoteList.scrollLeft >= max - 2;
    }

    function quoteClamp() {
      Array.prototype.forEach.call(quoteList.children, function (item) {
        if (item.classList.contains('is-open')) return;
        var text = item.querySelector('blockquote');
        var long = text.scrollHeight > text.clientHeight + 1;
        item.classList.toggle('is-long', long);
        item.querySelector('.quote-more').hidden = !long;
      });
    }

    quoteList.classList.add('is-clamp');
    quoteList.addEventListener('click', function (e) {
      var btn = e.target.closest('.quote-more');
      if (!btn) return;
      var open = btn.closest('.quote').classList.toggle('is-open');
      btn.textContent = open ? 'Show less' : 'Read more';
      btn.setAttribute('aria-expanded', String(open));
    });
    quoteNav.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var style = getComputedStyle(quoteList);
      var inner = quoteList.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      var per = Math.max(1, Math.round(inner / quoteStep()));
      quoteList.scrollBy({ left: Number(btn.dataset.dir) * per * quoteStep(), behavior: reduce ? 'auto' : 'smooth' });
    });
    quoteList.addEventListener('scroll', quoteEnds, { passive: true });
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { quoteClamp(); quoteEnds(); }).observe(quoteList);
    } else {
      quoteClamp();
      quoteEnds();
    }
    if (doc.fonts) doc.fonts.ready.then(quoteClamp);
  }

  var form = doc.getElementById('intake-form');
  if (form) {
    var success = doc.getElementById('intake-success');
    var error = doc.getElementById('intake-error');
    var button = form.querySelector('button[type="submit"]');
    var sending = false;
    var FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfm-WvR8_GWJGf793oTWbMjvsxIUc6bcj65hRaSxrUXa1Ig7g/formResponse';
    var ENTRIES = {
      firstName: 'entry.1470667253',
      lastName: 'entry.744885840',
      email: 'entry.1613364008',
      phone: 'entry.1278201038',
      who: 'entry.1633442180'
    };

    function validate() {
      var ok = true;
      var first = null;
      form.querySelectorAll('.field').forEach(function (f) {
        var input = f.querySelector('input, select');
        if (!input || !input.required) return;
        var valid = input.checkValidity() && input.value.trim() !== '';
        if (input.type === 'tel') valid = /\d{7,}/.test(input.value.replace(/\D/g, ''));
        f.classList.toggle('invalid', !valid);
        if (!valid) { ok = false; first = first || input; }
      });
      form.querySelectorAll('.group[data-required]').forEach(function (g) {
        var valid = !!g.querySelector('input:checked');
        g.classList.toggle('invalid', !valid);
        if (!valid) { ok = false; first = first || g.querySelector('input'); }
      });
      if (first) first.focus();
      return ok;
    }

    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field, .group');
      if (f) f.classList.remove('invalid');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending || !validate()) return;
      var data = new FormData(form);
      var body = new URLSearchParams();
      Object.keys(ENTRIES).forEach(function (k) {
        body.append(ENTRIES[k], (data.get(k) || '').toString().trim());
      });
      sending = true;
      button.disabled = true;
      error.classList.add('hidden');
      fetch(FORM_URL, { method: 'POST', mode: 'no-cors', body: body }).then(function () {
        var name = (data.get('firstName') || '').toString().trim();
        var nameEl = doc.getElementById('success-name');
        if (nameEl) nameEl.textContent = name || 'friend';
        form.classList.add('hidden');
        success.classList.remove('hidden');
        success.focus({ preventScroll: true });
        success.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      }, function () {
        sending = false;
        button.disabled = false;
        error.classList.remove('hidden');
      });
    });
  }
})();
