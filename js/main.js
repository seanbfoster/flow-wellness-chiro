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

  var floor = doc.querySelector('.floor');
  if (floor) {
    var fill = floor.querySelector('.fill');
    var here = floor.querySelector('.here');
    var zones = Array.prototype.slice.call(doc.querySelectorAll('[data-zone]:not(a)'));
    var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.nav a[data-zone]'));
    var mobile = window.matchMedia('(max-width: 860px)');
    var ticking = false;

    function update() {
      ticking = false;
      var scrollY = window.scrollY;
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, scrollY / max) : 0;
      var probe = scrollY + window.innerHeight * 0.38;
      var current = null;
      for (var i = 0; i < zones.length; i++) {
        var top = zones[i].getBoundingClientRect().top + scrollY;
        if (top <= probe) current = zones[i];
      }
      var color = current ? current.getAttribute('data-color') : 'var(--teal)';
      floor.style.setProperty('--floor', color);
      if (mobile.matches) {
        floor.style.setProperty('--p', p.toFixed(4));
      } else {
        var h = p * window.innerHeight;
        fill.style.height = h + 'px';
        here.style.top = Math.max(h, 80) + 'px';
        var label = current ? current.querySelector('.sign-label') : null;
        here.textContent = label ? label.textContent.trim().split('·')[0].trim() : 'Start here';
      }
      floor.classList.toggle('on', scrollY > 40);
      var id = current ? current.id : '';
      navLinks.forEach(function (a) {
        a.setAttribute('aria-current', a.getAttribute('href') === '#' + id ? 'true' : 'false');
        if (a.getAttribute('aria-current') !== 'true') a.removeAttribute('aria-current');
      });
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
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
