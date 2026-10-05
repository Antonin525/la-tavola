/* ═══════════════════════════════════════════════════════════
   LA TAVOLA — interactions
   ═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Horaires : jour (0 = dimanche) → services [ouverture, fermeture] en minutes */
  const HOURS = {
    0: [[12 * 60, 15 * 60]],
    1: [],
    2: [[12 * 60, 14 * 60 + 30], [19 * 60, 22 * 60 + 30]],
    3: [[12 * 60, 14 * 60 + 30], [19 * 60, 22 * 60 + 30]],
    4: [[12 * 60, 14 * 60 + 30], [19 * 60, 22 * 60 + 30]],
    5: [[12 * 60, 14 * 60 + 30], [19 * 60, 22 * 60 + 30]],
    6: [[12 * 60, 14 * 60 + 30], [19 * 60, 22 * 60 + 30]]
  };
  const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const fmtTime = (m) => `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;

  /* ─── En-tête : état au scroll, masquage en descente ─── */
  const header = $('#header');
  const hero = $('#accueil');
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    const pastHero = y > hero.offsetHeight * 0.8;
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    if (!document.body.classList.contains('menu-open')) {
      if (pastHero && goingDown) header.classList.add('is-hidden');
      else if (goingUp || !pastHero) header.classList.remove('is-hidden');
    }
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  /* ─── Parallaxe légère du hero ─── */
  const heroMedia = $('.hero-media');
  if (!reduced && heroMedia) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight * 1.2) heroMedia.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ─── Menu mobile ─── */
  const burger = $('#burger');
  const menu = $('#mobileMenu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.classList.toggle('menu-open', open);
    document.body.classList.toggle('no-scroll', open);
    header.classList.remove('is-hidden');
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
      setTimeout(() => $('a', menu).focus({ preventScroll: true }), 300);
    } else {
      menu.classList.remove('is-open');
      setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, reduced ? 0 : 650);
    }
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); burger.focus(); }
  });
  // piège de focus : Tab circule entre le bouton burger et le menu
  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const items = $$('a', menu);
    if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); burger.focus(); }
    else if (!e.shiftKey && document.activeElement === items[items.length - 1]) { e.preventDefault(); burger.focus(); }
  });
  burger.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && document.body.classList.contains('menu-open')) {
      e.preventDefault();
      const items = $$('a', menu);
      (e.shiftKey ? items[items.length - 1] : items[0]).focus();
    }
  });
  window.matchMedia('(min-width: 981px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ─── Lien actif dans la navigation ─── */
  const navLinks = $$('.main-nav a');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const navObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => {
        const on = a.getAttribute('href') === '#' + en.target.id;
        a.classList.toggle('is-current', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => navObs.observe(s));

  /* ─── Révélations au scroll (avec cascade entre voisins) ─── */
  const reveals = $$('.reveal');
  reveals.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty('--d', `${Math.min(i, 6) * 0.08}s`);
  });
  if ('IntersectionObserver' in window && !reduced) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); obs.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => obs.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ─── Compteurs ─── */
  const counters = $$('[data-count]');
  const runCounter = (el) => {
    const end = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (reduced) { el.textContent = end + suffix; return; }
    const t0 = performance.now();
    const dur = 1600;
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const cObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { runCounter(en.target); cObs.unobserve(en.target); } });
  }, { threshold: 0.6 });
  counters.forEach((c) => cObs.observe(c));

  /* ─── Statut d'ouverture + jour en cours ─── */
  const now = new Date();
  const status = $('#openStatus');
  const dot = $('.hero-bar .dot');
  if (status) {
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();
    const current = HOURS[day].find(([o, c]) => mins >= o && mins < c);
    if (current) {
      status.textContent = `Ouvert maintenant · jusqu'à ${fmtTime(current[1])}`;
    } else {
      dot.classList.add('closed');
      const later = HOURS[day].find(([o]) => mins < o);
      if (later) status.textContent = `Fermé · ouverture aujourd'hui à ${fmtTime(later[0])}`;
      else {
        let d = (day + 1) % 7, n = 1;
        while (!HOURS[d].length && n < 7) { d = (d + 1) % 7; n++; }
        status.textContent = `Fermé · réouverture ${n === 1 ? 'demain' : DAY_NAMES[d]} à ${fmtTime(HOURS[d][0][0])}`;
      }
    }
  }
  $$('#hoursTable tr').forEach((tr) => {
    if (tr.dataset.days.split(',').map(Number).includes(now.getDay())) tr.classList.add('is-today');
  });
  const year = $('#year');
  if (year) year.textContent = now.getFullYear();

  /* ─── Carte : onglets accessibles ─── */
  const tabs = $$('.cat-card');
  const selectTab = (tab, focus = false) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      panel.classList.toggle('is-active', on);
    });
    if (focus) tab.focus();
    // sur mobile : centrer la carte choisie dans le carrousel
    const strip = tab.parentElement;
    if (strip.scrollWidth > strip.clientWidth) {
      strip.scrollTo({ left: tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
    }
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      selectTab(tab);
      const panels = $('.carte-panels');
      const r = panels.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.75) panels.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    });
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });

  /* ─── Galerie : filtres ─── */
  const chips = $$('.chip');
  const galItems = $$('.gal-item');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => { const on = c === chip; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', String(on)); });
    galItems.forEach((it) => {
      const show = f === 'all' || it.dataset.cat === f;
      if (show && it.classList.contains('is-out')) {
        it.classList.remove('is-out');
        if (!reduced) it.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.22,.8,.24,1)' });
      } else if (!show) it.classList.add('is-out');
    });
  }));

  /* ─── Galerie : visionneuse ─── */
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbCap = $('#lbCaption');
  const lbCount = $('#lbCount');
  let lbList = [];
  let lbIndex = 0;
  let lbReturn = null;

  const showLb = (i) => {
    lbIndex = (i + lbList.length) % lbList.length;
    const img = $('img', lbList[lbIndex]);
    lbImg.classList.add('is-loading');
    const pre = new Image();
    pre.onload = pre.onerror = () => {
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = img.alt;
      lbCount.textContent = `${lbIndex + 1} / ${lbList.length}`;
      requestAnimationFrame(() => lbImg.classList.remove('is-loading'));
    };
    pre.src = img.currentSrc || img.src;
  };
  const openLb = (item) => {
    lbList = galItems.filter((it) => !it.classList.contains('is-out'));
    lbReturn = document.activeElement;
    lb.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => lb.classList.add('is-open'));
    showLb(lbList.indexOf(item));
    $('.lb-close', lb).focus();
  };
  const closeLb = () => {
    lb.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    setTimeout(() => { lb.hidden = true; }, reduced ? 0 : 350);
    if (lbReturn) lbReturn.focus();
  };
  galItems.forEach((it) => $('.gal-btn', it).addEventListener('click', () => openLb(it)));
  $('.lb-close', lb).addEventListener('click', closeLb);
  $('.lb-prev', lb).addEventListener('click', () => showLb(lbIndex - 1));
  $('.lb-next', lb).addEventListener('click', () => showLb(lbIndex + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lb-figure')) closeLb(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
    if (e.key === 'ArrowRight') showLb(lbIndex + 1);
    if (e.key === 'Tab') {
      const f = $$('button', lb);
      const idx = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(idx + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  let touchX = null;
  lb.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showLb(lbIndex + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ─── Réservation ─── */
  const form = $('#resaForm');
  const success = $('#resaSuccess');
  const dateInput = $('#date');
  const guestsInput = $('#guests');
  const guestsOut = $('#guestsOut');
  const stepBtns = $$('.step-btn');
  const MIN_G = 1, MAX_G = 10;
  const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

  const updateGuests = (n) => {
    n = Math.max(MIN_G, Math.min(MAX_G, n));
    guestsInput.value = n;
    guestsOut.textContent = n;
    stepBtns[0].disabled = n <= MIN_G;
    stepBtns[1].disabled = n >= MAX_G;
    guestsOut.classList.remove('bump'); void guestsOut.offsetWidth; guestsOut.classList.add('bump');
  };
  stepBtns.forEach((b) => b.addEventListener('click', () => updateGuests(Number(guestsInput.value) + Number(b.dataset.step))));
  updateGuests(2);

  // date minimale = aujourd'hui ; valeur par défaut = prochain jour d'ouverture
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 90);
  dateInput.min = toISO(today);
  dateInput.max = toISO(maxDate);
  const firstOpen = new Date(today);
  while (!HOURS[firstOpen.getDay()].length) firstOpen.setDate(firstOpen.getDate() + 1);
  dateInput.value = toISO(firstOpen);

  const slotInputs = $$('#slots input');
  const setError = (id, msg) => {
    const el = $('#' + id + 'Error');
    if (el) el.textContent = msg;
    const field = $('#' + id);
    if (field) field.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };

  // créneaux disponibles selon le jour choisi (et l'heure, si c'est aujourd'hui)
  const refreshSlots = () => {
    const v = dateInput.value;
    if (!v) { slotInputs.forEach((s) => { s.disabled = false; }); return; }
    const d = parseISO(v);
    const services = HOURS[d.getDay()];
    const isToday = toISO(d) === toISO(new Date());
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    slotInputs.forEach((s) => {
      const [h, m] = s.value.split(':').map(Number);
      const t = h * 60 + m;
      const open = services.some(([o, c]) => t >= o && t <= c - 60);
      s.disabled = !open || (isToday && t <= nowMin + 30);
      if (s.disabled && s.checked) s.checked = false;
    });
    if (!services.length) setError('date', 'Nous sommes fermés le lundi — choisissez un autre jour.');
    else if (slotInputs.every((s) => s.disabled)) setError('date', 'Plus de créneau disponible ce jour-là.');
    else setError('date', '');
  };
  dateInput.addEventListener('change', refreshSlots);
  dateInput.addEventListener('input', refreshSlots);
  refreshSlots();
  slotInputs.forEach((s) => s.addEventListener('change', () => { $('#timeError').textContent = ''; }));

  const validators = {
    name: (v) => v.trim().length >= 2 ? '' : 'Indiquez votre nom.',
    phone: (v) => /^[+\d][\d\s.-]{8,}$/.test(v.trim()) ? '' : 'Numéro de téléphone invalide.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Adresse e-mail invalide.'
  };
  Object.keys(validators).forEach((id) => {
    const el = $('#' + id);
    el.addEventListener('blur', () => { if (el.value) setError(id, validators[id](el.value)); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') setError(id, validators[id](el.value)); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let firstBad = null;
    const mark = (el) => { if (!firstBad) firstBad = el; };

    refreshSlots();
    if (!dateInput.value) { setError('date', 'Choisissez une date.'); mark(dateInput); }
    else {
      const d = parseISO(dateInput.value);
      if (d < today || d > maxDate) { setError('date', 'Choisissez une date dans les 90 prochains jours.'); mark(dateInput); }
      else if (!HOURS[d.getDay()].length) mark(dateInput);
    }
    const slot = slotInputs.find((s) => s.checked);
    if (!slot) { $('#timeError').textContent = 'Choisissez un horaire.'; mark(slotInputs.find((s) => !s.disabled) || slotInputs[0]); }
    Object.keys(validators).forEach((id) => {
      const el = $('#' + id);
      const msg = validators[id](el.value);
      setError(id, msg);
      if (msg) mark(el);
    });
    if (firstBad) { firstBad.focus(); return; }

    const btn = $('.btn-submit', form);
    btn.classList.add('is-loading');
    btn.disabled = true;
    $('.btn-label', btn).textContent = 'Envoi en cours…';

    setTimeout(() => {
      const d = parseISO(dateInput.value);
      const dateTxt = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      const g = Number(guestsInput.value);
      const firstName = $('#name').value.trim().split(/\s+/)[0];
      $('#resaSummary').textContent = `${firstName}, votre demande pour ${g} ${g > 1 ? 'personnes' : 'personne'} le ${dateTxt} à ${slot.value.replace(':', 'h')} est bien enregistrée. Un e-mail de confirmation vous sera envoyé.`;
      form.hidden = true;
      success.hidden = false;
      success.focus();
      btn.classList.remove('is-loading');
      btn.disabled = false;
      $('.btn-label', btn).textContent = 'Réserver ma table';
    }, reduced ? 200 : 1300);
  });

  $('#resaReset').addEventListener('click', () => {
    form.reset();
    updateGuests(2);
    dateInput.value = toISO(firstOpen);
    refreshSlots();
    ['name', 'phone', 'email'].forEach((id) => setError(id, ''));
    success.hidden = true;
    form.hidden = false;
    $('#name').focus();
  });
})();
