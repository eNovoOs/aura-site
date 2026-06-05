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
        entry.target.style.transitionDelay = (entry.target.dataset.revealDelay || 0) + 'ms';
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) {
    // stagger siblings that reveal together
    var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains('reveal'); });
    var idx = sibs.indexOf(el);
    if (idx > 0) el.dataset.revealDelay = Math.min(idx, 5) * 70;
    io.observe(el);
  });

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
  // Two products: AuraFlex (small) and AuraFlow (a little bigger)
  var PRICES = { AuraFlex: 44.99, AuraFlow: 49.99 };
  var PRODUCT_IMG = {
    AuraFlex: {
      Bone: 'assets/img/products/auraflex-bone.svg',
      Moss: 'assets/img/products/auraflex-moss.svg',
      Ink:  'assets/img/products/auraflex-ink.svg'
    },
    AuraFlow: {
      Bone: 'assets/img/products/auraflow-bone.svg',
      Moss: 'assets/img/products/auraflow-moss.svg',
      Ink:  'assets/img/products/auraflow-ink.svg'
    }
  };
  function productImg(product, color) {
    var p = PRODUCT_IMG[product] || PRODUCT_IMG.AuraFlow;
    return p[color] || p.Ink;
  }

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
    add: function (product, color) {
      var items = read();
      var found = items.find(function (i) { return i.size === product && i.color === color; });
      if (found) found.qty += 1;
      else items.push({ size: product, color: color, qty: 1, price: PRICES[product], img: productImg(product, color) });
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
    remove: function (idx) {
      var items = read();
      items.splice(idx, 1);
      write(items);
    },
    items: read,
    img: productImg
  };
  paintCount();

  /* ---------- PDP variant selector + add to cart ---------- */
  var pdp = document.querySelector('[data-pdp]');
  if (pdp) {
    var state = { product: 'AuraFlow', color: 'Bone' };
    var priceEl = pdp.querySelector('[data-price]');
    var mainImg = pdp.querySelector('[data-main-img]');
    var modelEl = pdp.querySelector('[data-model-name]');
    var addBtn = pdp.querySelector('[data-add]');
    var bbName = document.querySelector('[data-bb-name]');
    var bbPrice = document.querySelector('[data-bb-price]');
    var bbImg = document.querySelector('[data-bb-img]');

    function fmt(n) { return '$' + n.toFixed(2); }
    function swapImg(el, src, bone) {
      if (!el) return;
      el.classList.toggle('tone-bone', bone);
      if (el.getAttribute('src') === src) return;
      var pre = new Image();
      pre.onload = function () {
        el.style.opacity = '0';
        setTimeout(function () { el.src = src; el.style.opacity = '1'; }, 160);
      };
      pre.src = src;
    }
    function refresh() {
      var bone = state.color === 'Bone';
      var src = AuraCart.img(state.product, state.color);
      if (priceEl) priceEl.textContent = fmt(PRICES[state.product]);
      swapImg(mainImg, src, bone);
      if (modelEl) modelEl.textContent = state.product;
      if (bbName) bbName.textContent = state.product + ' — ' + state.color;
      if (bbPrice) bbPrice.textContent = fmt(PRICES[state.product]);
      swapImg(bbImg, src, bone);
    }

    pdp.querySelectorAll('[data-product]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        pdp.querySelectorAll('[data-product]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        state.product = btn.getAttribute('data-product');
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
        AuraCart.add(state.product, state.color);
        var label = addBtn.querySelector('[data-add-label]') || addBtn;
        var original = label.textContent;
        label.textContent = 'Added to cart';
        setTimeout(function () { label.textContent = original; }, 1600);
      });
    }

    /* preselect from query string (?color=Moss) */
    var params = new URLSearchParams(location.search);
    var qc = params.get('color');
    if (qc) {
      var target = pdp.querySelector('[data-color="' + qc + '"]');
      if (target && target.getAttribute('data-locked') !== 'true') target.click();
    }
    var qp = params.get('product');
    if (qp) {
      var ptarget = pdp.querySelector('[data-product="' + qp + '"]');
      if (ptarget) ptarget.click();
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
        var thumb = it.img || AuraCart.img(it.size, it.color);
        row.innerHTML =
          '<div class="cart-line-thumb"><img class="' + toneCls.trim() + '" src="' + thumb + '" alt="' + it.size + ' ' + it.color + '"></div>' +
          '<div><div class="cart-line-name">' + it.size + '</div>' +
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
