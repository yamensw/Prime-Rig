/* Prime Rig interactions (no external libraries)
   - Mobile drawer menu
   - Scroll reveal
   - Smooth scrolling for on-page anchors
   - Liquid-glass button press: sweep + ripple + micro-bounce
   - Enhanced animations (without tilt effect)
*/

(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------
  // Helpers
  // ---------------------------
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // ---------------------------
  // Smooth scroll (only same-page hash links)
  // ---------------------------
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '#';
      if (href === '#' || href.length < 2) return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });

      // Close mobile menu if open
      closeMobileMenu();

      // Update URL hash without jumping
      history.pushState(null, '', href);
    });
  });

  // ---------------------------
  // Mobile menu
  // ---------------------------
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  function isMobileNavActive() {
    return window.matchMedia('(max-width: 720px)').matches;
  }

  function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('no-scroll');
  }

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('no-scroll');
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('open');
      if (isOpen) closeMobileMenu();
      else openMobileMenu();
    });

    // Click outside dialog closes
    mobileMenu.addEventListener('click', (e) => {
      if (e.target === mobileMenu) closeMobileMenu();
    });

    // ESC closes
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileMenu();
    });

    // If user resizes to desktop, ensure menu is closed
    window.addEventListener('resize', () => {
      if (!isMobileNavActive()) closeMobileMenu();
    });
  }

  // Mobile menu links close after click
  if (mobileMenu) {
    $$('a', mobileMenu).forEach(a => a.addEventListener('click', closeMobileMenu));
  }

  // ---------------------------
  // Scroll reveal
  // ---------------------------
  const revealEls = $$('.reveal');
  if (!prefersReducedMotion && 'IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

    revealEls.forEach(el => {
      // If already in, skip
      if (!el.classList.contains('in')) io.observe(el);
    });
  } else {
    // Reduced motion or no IO support: show immediately
    revealEls.forEach(el => el.classList.add('in'));
  }

  // ---------------------------
  // Active nav link (index page sections)
  // ---------------------------
  const navLinks = $$('.navlinks a[href^="#"]');
  const sections = navLinks
    .map(a => document.querySelector(a.getAttribute('href') || ''))
    .filter(Boolean);

  if (!prefersReducedMotion && 'IntersectionObserver' in window && navLinks.length && sections.length) {
    const map = new Map(sections.map((sec, i) => [sec, navLinks[i]]));

    const navIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(a => a.classList.remove('active'));
          const link = map.get(entry.target);
          if (link) link.classList.add('active');
        }
      });
    }, { threshold: 0.45 });

    sections.forEach(sec => navIO.observe(sec));
  }

  // ---------------------------
  // Button: sweep + ripple + micro-bounce
  // ---------------------------
  const buttons = $$('.btn');

  // Add sweep element if missing
  buttons.forEach(btn => {
    if (!btn.querySelector('.sweep')) {
      const sweep = document.createElement('i');
      sweep.className = 'sweep';
      sweep.setAttribute('aria-hidden', 'true');
      btn.prepend(sweep);
    }

    // Ensure <span> wrapper exists for label (so text always above effects)
    if (!btn.querySelector('span')) {
      const text = btn.textContent;
      btn.textContent = '';
      const span = document.createElement('span');
      span.textContent = text;
      btn.append(span);
    }
  });

  // Avoid double firing on touch devices that support pointer events
  let lastPointerDownAt = 0;

  function pressEffect(e, btn) {
    // Ripple position
    const rect = btn.getBoundingClientRect
