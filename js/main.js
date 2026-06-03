/**
 * ==========================================================================
 * LegalAidIndia.org — Core Application Logic
 * ==========================================================================
 *
 * Handles: mobile navigation, smooth scrolling, active-section highlighting,
 * navbar scroll effect, animated stats counters, language selector,
 * scroll-to-top button, and copyright year update.
 *
 * @author  LegalAidIndia Dev Team
 * @version 1.0.0
 * @license MIT
 */

'use strict';

/* -----------------------------------------------------------------------
   1. DOM-Ready Wrapper
   ----------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initSmoothScroll();
  initActiveSectionHighlight();
  initNavbarScrollEffect();
  initStatsCounter();
  initLanguageSelector();
  initScrollToTop();
  updateCopyrightYear();
});

/* -----------------------------------------------------------------------
   2. Mobile Navigation Toggle
   ----------------------------------------------------------------------- */

function initMobileNav() {
  const hamburger = document.querySelector('.hamburger');
  const navMenu   = document.querySelector('.nav-menu');
  const navLinks  = document.querySelectorAll('.nav-menu a');
  const overlay   = document.querySelector('.nav-overlay');

  if (!hamburger || !navMenu) return;

  /**
   * Toggle mobile menu open/closed and lock body scroll.
   * @param {boolean} [forceClose] — if true, always close
   */
  const toggleMenu = (forceClose = false) => {
    const shouldOpen = forceClose ? false : !navMenu.classList.contains('active');

    navMenu.classList.toggle('active', shouldOpen);
    hamburger.classList.toggle('active', shouldOpen);
    hamburger.setAttribute('aria-expanded', String(shouldOpen));
    document.body.style.overflow = shouldOpen ? 'hidden' : '';

    if (overlay) {
      overlay.classList.toggle('active', shouldOpen);
    }
  };

  hamburger.addEventListener('click', () => toggleMenu());

  // Close on nav-link click (single-page navigation)
  navLinks.forEach((link) => {
    link.addEventListener('click', () => toggleMenu(true));
  });

  // Close on overlay click
  if (overlay) {
    overlay.addEventListener('click', () => toggleMenu(true));
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
      toggleMenu(true);
    }
  });
}

/* -----------------------------------------------------------------------
   3. Smooth Scroll for Anchor Links
   ----------------------------------------------------------------------- */

/** Fixed-navbar height offset (px). */
const NAVBAR_OFFSET = 72;

function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const targetId = anchor.getAttribute('href');
    if (targetId === '#' || targetId.length < 2) return;

    const targetEl = document.querySelector(targetId);
    if (!targetEl) return;

    e.preventDefault();

    const topPos =
      targetEl.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;

    window.scrollTo({ top: topPos, behavior: 'smooth' });

    // Update URL hash without jumping
    history.pushState(null, '', targetId);
  });
}

/* -----------------------------------------------------------------------
   4. Active Section Highlighting (IntersectionObserver)
   ----------------------------------------------------------------------- */

function initActiveSectionHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');

  if (!sections.length || !navLinks.length) return;

  /** Map href → link element for fast lookup. */
  const linkMap = new Map();
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href) linkMap.set(href, link);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = `#${entry.target.id}`;
        const link = linkMap.get(id);

        if (!link) return;

        if (entry.isIntersecting) {
          // Remove active from all, set on current
          navLinks.forEach((l) => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    },
    {
      rootMargin: `-${NAVBAR_OFFSET}px 0px -40% 0px`,
      threshold: 0,
    }
  );

  sections.forEach((section) => observer.observe(section));
}

/* -----------------------------------------------------------------------
   5. Navbar Background Change on Scroll
   ----------------------------------------------------------------------- */

function initNavbarScrollEffect() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  /** Scroll threshold before adding the opaque class (px). */
  const SCROLL_THRESHOLD = 100;

  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      navbar.classList.toggle('navbar-scrolled', window.scrollY > SCROLL_THRESHOLD);
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  // Run once on load in case page is already scrolled
  onScroll();
}

/* -----------------------------------------------------------------------
   6. Stats Counter Animation
   ----------------------------------------------------------------------- */

function initStatsCounter() {
  const statsBar = document.querySelector('.stats-bar');
  if (!statsBar) return;

  const counters = statsBar.querySelectorAll('[data-target]');
  if (!counters.length) return;

  let hasAnimated = false;

  /**
   * Format a number with commas (Indian/international).
   * @param {number} n
   * @returns {string}
   */
  const formatNumber = (n) => n.toLocaleString('en-IN');

  /**
   * Animate a single counter from 0 → target over ~2 s.
   * @param {HTMLElement} el
   */
  const animateCounter = (el) => {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 2000; // ms
    const start    = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out cubic for a satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatNumber(Math.floor(eased * target));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = formatNumber(target);
      }
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          counters.forEach(animateCounter);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  observer.observe(statsBar);
}

/* -----------------------------------------------------------------------
   7. Language Selector
   ----------------------------------------------------------------------- */

function initLanguageSelector() {
  const toggle   = document.querySelector('.lang-toggle');
  const dropdown = document.querySelector('.lang-dropdown');
  const options  = document.querySelectorAll('.lang-option');
  const label    = document.querySelector('.lang-label');

  if (!toggle || !dropdown) return;

  // Restore saved language preference
  const saved = localStorage.getItem('legalaid-lang');
  if (saved && label) {
    label.textContent = saved;
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
    toggle.setAttribute(
      'aria-expanded',
      String(dropdown.classList.contains('open'))
    );
  });

  options.forEach((opt) => {
    opt.addEventListener('click', () => {
      const lang = opt.dataset.lang || opt.textContent.trim();
      if (label) label.textContent = lang;
      localStorage.setItem('legalaid-lang', lang);
      dropdown.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');

      // Dispatch a custom event so other modules can react
      document.dispatchEvent(
        new CustomEvent('languageChange', { detail: { language: lang } })
      );
    });
  });

  // Close dropdown when clicking elsewhere
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* -----------------------------------------------------------------------
   8. Scroll-to-Top Button
   ----------------------------------------------------------------------- */

function initScrollToTop() {
  const btn = document.querySelector('.scroll-to-top');
  if (!btn) return;

  /** Scroll distance before showing the button (px). */
  const SHOW_THRESHOLD = 500;

  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      btn.classList.toggle('visible', window.scrollY > SHOW_THRESHOLD);
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Initial check
  onScroll();
}

/* -----------------------------------------------------------------------
   9. Auto-Update Copyright Year
   ----------------------------------------------------------------------- */

function updateCopyrightYear() {
  const yearEl = document.querySelector('.copyright-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}
