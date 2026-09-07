(function () {
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var toggle = doc.querySelector('.nav-toggle');
  var nav = doc.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
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

  var form = doc.getElementById('intake-form');
  if (form) {
    var success = doc.getElementById('intake-success');

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
      if (!validate()) return;
      var data = new FormData(form);
      var name = (data.get('firstName') || '').toString().trim();
      var nameEl = doc.getElementById('success-name');
      if (nameEl) nameEl.textContent = name || 'friend';
      try { sessionStorage.setItem('fw-lead', JSON.stringify(Object.fromEntries(data.entries()))); } catch (err) {}
      form.classList.add('hidden');
      success.classList.remove('hidden');
      success.focus({ preventScroll: true });
      success.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
  }
})();
