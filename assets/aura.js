/* ============================================================
   AURA — shared site behaviour (on-brand rebuild)
   Founder-led, drop-driven. Real localStorage cart, real product
   photography, MagSafe-forward PDP. No fake urgency timers.
   ============================================================ */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Tumbler SVG (color-driven, hero arc) ---------- */
  var TUMBLER_SVG =
    '<svg viewBox="0 0 100 240" aria-hidden="true">' +
    '<path d="M68 80 C 92 86, 92 150, 68 156 L 68 144 C 80 140, 80 96, 68 92 Z" fill="var(--shadow)"/>' +
    '<path d="M22 64 Q22 56 30 56 L70 56 Q78 56 78 64 L78 188 Q78 204 64 208 L36 208 Q22 204 22 188 Z" fill="var(--body)"/>' +
    '<path d="M62 56 L78 56 L78 188 Q78 204 64 208 L57 208 Q70 200 70 186 L70 60 Z" fill="var(--shadow)" opacity="0.4"/>' +
    '<path d="M30 198 L70 198 L66 216 L34 216 Z" fill="var(--shadow)" opacity="0.45"/>' +
    '<rect x="22" y="48" width="56" height="14" rx="3" fill="var(--shadow)"/>' +
    '<rect x="26" y="34" width="48" height="16" rx="4" fill="var(--lid)"/>' +
    '<rect x="46" y="14" width="8" height="22" rx="3" fill="var(--lid)"/>' +
    '<rect x="30" y="70" width="5" height="118" rx="3" fill="#fff" opacity="0.22"/>' +
    '</svg>';
  document.querySelectorAll('.tumbler').forEach(function (t) {
    t.insertAdjacentHTML('afterbegin', TUMBLER_SVG);
  });

  /* ---------- Nav shadow on scroll ---------- */
  var nav = document.getElementById('nav');
  if (nav) {
    var onNav = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onNav, { passive: true });
    onNav();
  }

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var mobile = document.getElementById('mobileNav');
  if (toggle && mobile) {
    toggle.addEventListener('click', function () { mobile.classList.add('open'); });
    mobile.addEventListener('click', function (e) {
      if (e.target.closest('a') || e.target.closest('.mobile-nav-close')) mobile.classList.remove('open');
    });
  }

  /* ---------- Scroll reveal (staggered) ---------- */
  var rev = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && rev.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          var sibs = Array.prototype.filter.call(e.target.parentElement.children, function (c) { return c.classList.contains('reveal'); });
          e.target.style.transitionDelay = Math.max(0, sibs.indexOf(e.target)) * 65 + 'ms';
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    rev.forEach(function (r) { io.observe(r); });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.q button').forEach(function (b) {
    b.addEventListener('click', function () {
      var q = b.parentElement, open = q.classList.contains('open');
      document.querySelectorAll('.q').forEach(function (x) { x.classList.remove('open'); });
      if (!open) q.classList.add('open');
    });
  });

  /* ---------- Waitlist / newsletter forms ---------- */
  document.querySelectorAll('[data-news-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((input.value || '').trim())) {
        input.style.boxShadow = '0 0 0 2px #DD8170 inset';
        setTimeout(function () { input.style.boxShadow = ''; }, 1200);
        return;
      }
      var success = form.parentElement.querySelector('.success, .form-success');
      if (success) { form.style.display = 'none'; success.classList.add('show'); }
      else { var btn = form.querySelector('button'); btn.textContent = "You're in ✓"; btn.disabled = true; }
    });
  });

  /* ============================================================
     CART — localStorage. Two models (AuraFlow / AuraFlex),
     every color equal, founders' drop. Each line carries its
     real product image + price.
     ============================================================ */
  var STORE_KEY = 'aura_cart_v2';
  function read() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; } }
  function write(items) { localStorage.setItem(STORE_KEY, JSON.stringify(items)); paintCount(); }
  function count() { return read().reduce(function (n, i) { return n + i.qty; }, 0); }
  function paintCount() {
    var n = count();
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = n;
      el.style.display = n > 0 ? 'inline-flex' : 'none';
    });
  }
  window.AuraCart = {
    add: function (model, color, price, img) {
      var items = read();
      var found = items.find(function (i) { return i.model === model && i.color === color; });
      if (found) found.qty += 1;
      else items.push({ model: model, color: color, qty: 1, price: price, img: img });
      write(items);
      document.querySelectorAll('[data-cart-count]').forEach(function (el) {
        el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
      });
    },
    setQty: function (idx, qty) {
      var items = read();
      if (!items[idx]) return;
      items[idx].qty = Math.max(0, qty);
      if (items[idx].qty === 0) items.splice(idx, 1);
      write(items);
    },
    remove: function (idx) { var items = read(); items.splice(idx, 1); write(items); },
    items: read
  };
  paintCount();

  /* ---------- Toast ---------- */
  var toast = document.getElementById('toast');
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.classList.remove('show'); }, 2600);
  }

  /* ============================================================
     PDP — model / color / add-to-cart
     Two real, approved models (not two sizes of one shape):
     AuraFlow = the carry-handle tumbler, AuraFlex = the slim bottle.
     Confirm capacity/oz + final price per model before launch.
     ============================================================ */
  var MODELS = {
    AuraFlow: {
      price: 54,
      colors: [
        { name: 'Pink',     hex: '#E08572', img: 'assets/img/products/auraflow-pink.png' },
        { name: 'Lavender', hex: '#C6B4D6', img: 'assets/img/products/auraflow-lavender.png' },
        { name: 'Matcha',   hex: '#7A8B6F', img: 'assets/img/products/auraflow-matcha.png' },
        { name: 'Blue',     hex: '#8FC2CF', img: 'assets/img/products/auraflow-blue.png' },
        { name: 'Black',    hex: '#1A1A1A', img: 'assets/img/products/auraflow-black.png' }
      ]
    },
    AuraFlex: {
      price: 44,
      colors: [
        { name: 'Pink',     hex: '#E7B8B8', img: 'assets/img/products/auraflex-pink.png' },
        { name: 'Lavender', hex: '#C6B4D6', img: 'assets/img/products/auraflex-lavender.png' },
        { name: 'Matcha',   hex: '#7A8B6F', img: 'assets/img/products/auraflex-matcha.png' },
        { name: 'Blue',     hex: '#8FC2CF', img: 'assets/img/products/auraflex-blue.png' },
        { name: 'Black',    hex: '#1A1A1A', img: 'assets/img/products/auraflex-black.png' },
        { name: 'Beige',    hex: '#C9B49A', img: 'assets/img/products/auraflex-beige.png' },
        { name: 'Forest',   hex: '#2E3A34', img: 'assets/img/products/auraflex-green.png' },
        { name: 'Navy',     hex: '#1F2A3A', img: 'assets/img/products/auraflex-navy.png' },
        { name: 'Clay',     hex: '#C4877E', img: 'assets/img/products/auraflex-clay.png' }
      ]
    }
  };

  var buy = document.getElementById('buy');
  if (buy) {
    var state = { model: 'AuraFlow', price: MODELS.AuraFlow.price, color: 'Pink', img: MODELS.AuraFlow.colors[0].img };
    var priceEl = document.getElementById('price');
    var swName = document.getElementById('swName');
    var swatchesEl = document.getElementById('swatches');
    var pdpMain = document.getElementById('pdpMain');
    var bbName = document.getElementById('bbName');
    var bbPrice = document.getElementById('bbPrice');
    var bbThumb = document.getElementById('bbThumb');

    function setMain(src) {
      if (!pdpMain) return;
      pdpMain.style.opacity = '0';
      setTimeout(function () { pdpMain.src = src; pdpMain.style.opacity = '1'; }, 150);
    }
    function refresh() {
      if (priceEl) priceEl.firstChild.textContent = '$' + state.price + ' ';
      if (swName) swName.textContent = state.color;
      if (bbName) bbName.textContent = state.model + ' — ' + state.color;
      if (bbPrice) bbPrice.textContent = '$' + state.price + ' · free MagSafe ring';
      if (bbThumb) bbThumb.src = state.img;
    }
    function selectColor(c, el) {
      document.querySelectorAll('.swatch').forEach(function (x) { x.classList.remove('sel'); });
      if (el) el.classList.add('sel');
      state.color = c.name; state.img = c.img;
      refresh();
      setMain(c.img);
    }
    function renderSwatches() {
      if (!swatchesEl) return;
      swatchesEl.innerHTML = '';
      MODELS[state.model].colors.forEach(function (c, i) {
        var b = document.createElement('button');
        b.className = 'swatch' + (i === 0 ? ' sel' : '');
        b.style.background = c.hex;
        b.setAttribute('aria-label', c.name);
        b.addEventListener('click', function () { selectColor(c, b); });
        swatchesEl.appendChild(b);
      });
    }

    document.querySelectorAll('.size').forEach(function (s) {
      s.addEventListener('click', function () {
        document.querySelectorAll('.size').forEach(function (x) { x.classList.remove('sel'); });
        s.classList.add('sel');
        state.model = s.dataset.model; state.price = +s.dataset.price;
        renderSwatches();
        selectColor(MODELS[state.model].colors[0], swatchesEl && swatchesEl.firstElementChild);
      });
    });

    renderSwatches();
    selectColor(MODELS[state.model].colors[0], swatchesEl && swatchesEl.firstElementChild);

    function add() {
      AuraCart.add(state.model, state.color, state.price, state.img);
      showToast('Saved for launch — ' + state.model + ', ' + state.color);
    }
    var addBtn = document.getElementById('addBtn');
    if (addBtn) addBtn.addEventListener('click', add);
    var bbAdd = document.getElementById('bbAdd');
    if (bbAdd) bbAdd.addEventListener('click', add);

    /* sticky buybar after hero scrolled */
    var buybar = document.getElementById('buybar');
    if (buybar) {
      var onBar = function () { buybar.classList.toggle('show', window.scrollY > 620); };
      window.addEventListener('scroll', onBar, { passive: true });
      onBar();
    }
  }

  /* ---------- Cart page render ---------- */
  var cartRoot = document.querySelector('[data-cart-page]');
  if (cartRoot) {
    var FREE_SHIP = 0; // founders' drop ships free
    function money(n) { return '$' + n.toFixed(2); }
    function render() {
      var items = AuraCart.items();
      var full = cartRoot.querySelector('[data-cart-full]');
      var empty = cartRoot.querySelector('[data-cart-empty]');
      var lines = cartRoot.querySelector('[data-cart-lines]');
      if (!items.length) {
        if (full) full.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
      }
      if (full) full.style.display = '';
      if (empty) empty.style.display = 'none';
      var subtotal = 0;
      lines.innerHTML = '';
      items.forEach(function (it, idx) {
        subtotal += it.price * it.qty;
        var row = document.createElement('div');
        row.className = 'cart-line';
        row.innerHTML =
          '<div class="cart-line-thumb"><img src="' + (it.img || '') + '" alt="' + it.model + ' ' + it.color + '"></div>' +
          '<div><div class="cart-line-name">' + it.model + '</div>' +
          '<div class="cart-line-variant">' + it.color + ' · founders’ drop</div>' +
          '<div class="qty"><button data-dec="' + idx + '" aria-label="Decrease">–</button><span>' + it.qty + '</span><button data-inc="' + idx + '" aria-label="Increase">+</button></div>' +
          '<button class="cart-remove" data-rm="' + idx + '">Remove</button></div>' +
          '<div class="cart-line-price">' + money(it.price * it.qty) + '</div>';
        lines.appendChild(row);
      });
      cartRoot.querySelector('[data-subtotal]').textContent = money(subtotal);
      cartRoot.querySelector('[data-shipping]').textContent = 'Free';
      cartRoot.querySelector('[data-total]').textContent = money(subtotal);
    }
    cartRoot.addEventListener('click', function (e) {
      var items = AuraCart.items();
      if (e.target.hasAttribute('data-inc')) { var i = +e.target.getAttribute('data-inc'); AuraCart.setQty(i, items[i].qty + 1); render(); }
      else if (e.target.hasAttribute('data-dec')) { var d = +e.target.getAttribute('data-dec'); AuraCart.setQty(d, items[d].qty - 1); render(); }
      else if (e.target.hasAttribute('data-rm')) { AuraCart.remove(+e.target.getAttribute('data-rm')); render(); }
    });
    render();
  }
})();
