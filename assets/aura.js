/* ============================================================
   AURA — shared site behaviour
   Editorial store. No urgency timers, no popups. Calm by design.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- NAV border on scroll ---------- */
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 8) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var mobile = document.getElementById('mobileNav');
  if (toggle && mobile) {
    toggle.addEventListener('click', function () { mobile.classList.add('open'); });
    mobile.addEventListener('click', function (e) {
      if (e.target.closest('a') || e.target.closest('.mobile-nav-close')) {
        mobile.classList.remove('open');
      }
    });
  }

  /* ---------- Scroll reveal ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- FAQ / accordion (if present) ---------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    item.addEventListener('click', function () {
      var wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('open'); });
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* ---------- Newsletter / stay-close forms ---------- */
  document.querySelectorAll('[data-news-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input');
      var email = (input.value || '').trim();
      if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
        input.style.color = '#B0563E';
        setTimeout(function () { input.style.color = ''; }, 1500);
        return;
      }
      var success = form.parentElement.querySelector('.form-success');
      if (success) { form.style.display = 'none'; success.classList.add('show'); }
      else { input.value = ''; input.placeholder = 'You are on the list — thank you.'; }
    });
  });

  /* ============================================================
     CART — localStorage, single SKU, three sizes / colours
     ============================================================ */
  var STORE_KEY = 'aura_cart_v1';
  var PRICES = { '18oz': 44.99, '24oz': 49.99, '32oz': 54.99 };
  var COLOR_IMG = {
    Bone: 'assets/img/flex-lavender.svg',
    Moss: 'assets/img/flex-moss.svg',
    Ink: 'assets/img/flex-ink.svg'
  };

  function read() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
    catch (e) { return []; }
  }
  function write(items) {
    localStorage.setItem(STORE_KEY, JSON.stringify(items));
    paintCount();
  }
  function count() { return read().reduce(function (n, i) { return n + i.qty; }, 0); }
  function paintCount() {
    var n = count();
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = n;
      el.style.display = n > 0 ? 'inline-flex' : 'none';
    });
  }

  window.AuraCart = {
    add: function (size, color) {
      var items = read();
      var found = items.find(function (i) { return i.size === size && i.color === color; });
      if (found) found.qty += 1;
      else items.push({ size: size, color: color, qty: 1, price: PRICES[size] });
      write(items);
    },
    setQty: function (idx, qty) {
      var items = read();
      if (!items[idx]) return;
      items[idx].qty = Math.max(0, qty);
      if (items[idx].qty === 0) items.splice(idx, 1);
      write(items);
    },
    remove: function (idx) {
      var items = read();
      items.splice(idx, 1);
      write(items);
    },
    items: read,
    img: function (c) { return COLOR_IMG[c] || COLOR_IMG.Bone; }
  };
  paintCount();

  /* ---------- PDP variant selector + add to cart ---------- */
  var pdp = document.querySelector('[data-pdp]');
  if (pdp) {
    var state = { size: '24oz', color: 'Bone' };
    var priceEl = pdp.querySelector('[data-price]');
    var mainImg = pdp.querySelector('[data-main-img]');
    var addBtn = pdp.querySelector('[data-add]');
    var bbName = document.querySelector('[data-bb-name]');
    var bbPrice = document.querySelector('[data-bb-price]');
    var bbImg = document.querySelector('[data-bb-img]');

    function fmt(n) { return '$' + n.toFixed(2); }
    function refresh() {
      var bone = state.color === 'Bone';
      if (priceEl) priceEl.textContent = fmt(PRICES[state.size]);
      if (mainImg) { mainImg.src = AuraCart.img(state.color); mainImg.classList.toggle('tone-bone', bone); }
      if (bbName) bbName.textContent = 'Aura — ' + state.size + ' ' + state.color;
      if (bbPrice) bbPrice.textContent = fmt(PRICES[state.size]);
      if (bbImg) { bbImg.src = AuraCart.img(state.color); bbImg.classList.toggle('tone-bone', bone); }
    }

    pdp.querySelectorAll('[data-size]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        pdp.querySelectorAll('[data-size]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        state.size = btn.getAttribute('data-size');
        refresh();
      });
    });
    pdp.querySelectorAll('[data-color]').forEach(function (btn) {
      if (btn.getAttribute('data-locked') === 'true') return;
      btn.addEventListener('click', function () {
        pdp.querySelectorAll('[data-color]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        state.color = btn.getAttribute('data-color');
        refresh();
      });
    });
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        AuraCart.add(state.size, state.color);
        var label = addBtn.querySelector('[data-add-label]') || addBtn;
        var original = label.textContent;
        label.textContent = 'Added to cart';
        setTimeout(function () { label.textContent = original; }, 1600);
      });
    }

    /* preselect from query string (?color=Moss) */
    var params = new URLSearchParams(location.search);
    var qc = params.get('color');
    if (qc && PRICES && COLOR_IMG[qc]) {
      var target = pdp.querySelector('[data-color="' + qc + '"]');
      if (target && target.getAttribute('data-locked') !== 'true') target.click();
    }
    refresh();

    /* sticky buy bar */
    var bar = document.querySelector('.buybar');
    var topAnchor = pdp.querySelector('[data-pdp-top]');
    if (bar && topAnchor) {
      var barIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) bar.classList.remove('show');
          else bar.classList.add('show');
        });
      }, { threshold: 0 });
      barIo.observe(topAnchor);
      var bbAdd = bar.querySelector('[data-bb-add]');
      if (bbAdd) bbAdd.addEventListener('click', function () { if (addBtn) addBtn.click(); });
    }
  }

  /* ---------- Cart page render ---------- */
  var cartRoot = document.querySelector('[data-cart-page]');
  if (cartRoot) {
    var FREE_SHIP = 75;
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
        var toneCls = it.color === 'Bone' ? ' tone-bone' : '';
        row.innerHTML =
          '<div class="cart-line-thumb"><img class="' + toneCls.trim() + '" src="' + AuraCart.img(it.color) + '" alt="Aura ' + it.color + '"></div>' +
          '<div><div class="cart-line-name">Aura.</div>' +
          '<div class="cart-line-variant">' + it.size + ' · ' + it.color + '</div>' +
          '<div class="qty"><button data-dec="' + idx + '" aria-label="Decrease">–</button><span>' + it.qty + '</span><button data-inc="' + idx + '" aria-label="Increase">+</button></div>' +
          '<button class="cart-remove" data-rm="' + idx + '">Remove</button></div>' +
          '<div class="cart-line-price">' + money(it.price * it.qty) + '</div>';
        lines.appendChild(row);
      });
      var shipTxt = subtotal >= FREE_SHIP ? 'Free' : money(7.5);
      cartRoot.querySelector('[data-subtotal]').textContent = money(subtotal);
      cartRoot.querySelector('[data-shipping]').textContent = shipTxt;
      var total = subtotal + (subtotal >= FREE_SHIP ? 0 : 7.5);
      cartRoot.querySelector('[data-total]').textContent = money(total);
    }
    cartRoot.addEventListener('click', function (e) {
      var inc = e.target.getAttribute('data-inc');
      var dec = e.target.getAttribute('data-dec');
      var rm = e.target.getAttribute('data-rm');
      var items = AuraCart.items();
      if (inc !== null && inc !== undefined && e.target.hasAttribute('data-inc')) {
        AuraCart.setQty(+inc, items[+inc].qty + 1); render();
      } else if (e.target.hasAttribute('data-dec')) {
        AuraCart.setQty(+dec, items[+dec].qty - 1); render();
      } else if (e.target.hasAttribute('data-rm')) {
        AuraCart.remove(+rm); render();
      }
    });
    var addUpsell = cartRoot.querySelector('[data-add-upsell]');
    if (addUpsell) {
      addUpsell.addEventListener('click', function () {
        var items = AuraCart.items();
        items.push({ size: 'Straws', color: 'set of 3', qty: 1, price: 8.99 });
        localStorage.setItem('aura_cart_v1', JSON.stringify(items));
        paintCount(); render();
      });
    }
    render();
  }
})();
