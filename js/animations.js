/**
 * ==========================================================================
 * LegalAidIndia.org — Animation Engine
 * ==========================================================================
 *
 * Handles: scroll-reveal with IntersectionObserver, staggered child
 * animations, lightweight canvas particle background for the hero section,
 * parallax scroll effects, and reduced-motion preference checks.
 *
 * @author  LegalAidIndia Dev Team
 * @version 1.0.0
 * @license MIT
 */

'use strict';

/* -----------------------------------------------------------------------
   Configuration
   ----------------------------------------------------------------------- */

const ANIM_CONFIG = Object.freeze({
  /** IntersectionObserver threshold for scroll-reveal. */
  revealThreshold: 0.15,

  /** Stagger delay between sibling elements (ms). */
  staggerDelay: 80,

  /** Particle system settings. */
  particles: {
    count: 50,
    minSize: 1,
    maxSize: 3,
    minOpacity: 0.1,
    maxOpacity: 0.3,
    speed: 0.3,
    lineDistance: 120,
    lineOpacity: 0.08,
    mouseInfluence: 0.02,
    color: '255, 255, 255', // RGB string for rgba()
  },

  /** Parallax intensity (lower = more subtle). */
  parallaxFactor: 0.3,
});

/* -----------------------------------------------------------------------
   Reduced-Motion Check
   ----------------------------------------------------------------------- */

/**
 * @returns {boolean} True if the user prefers reduced motion.
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* -----------------------------------------------------------------------
   Bootstrap
   ----------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initStaggeredAnimations();
  initParticleBackground();
  initParallaxScroll();
});

/* -----------------------------------------------------------------------
   1. Scroll-Reveal Observer
   ----------------------------------------------------------------------- */

function initScrollReveal() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  if (!elements.length) return;

  // If reduced motion, reveal everything immediately
  if (prefersReducedMotion()) {
    elements.forEach((el) => el.classList.add('animated'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          obs.unobserve(entry.target); // Animate only once
        }
      });
    },
    {
      threshold: ANIM_CONFIG.revealThreshold,
      // Trigger slightly before element is fully in view
      rootMargin: '0px 0px -50px 0px',
    }
  );

  elements.forEach((el) => observer.observe(el));
}

/* -----------------------------------------------------------------------
   2. Staggered Animations
   ----------------------------------------------------------------------- */

function initStaggeredAnimations() {
  const containers = document.querySelectorAll('.stagger-container');
  if (!containers.length || prefersReducedMotion()) return;

  containers.forEach((container) => {
    const children = container.querySelectorAll('.animate-on-scroll');

    children.forEach((child, index) => {
      child.style.animationDelay = `${index * ANIM_CONFIG.staggerDelay}ms`;
      child.style.transitionDelay = `${index * ANIM_CONFIG.staggerDelay}ms`;
    });
  });
}

/* -----------------------------------------------------------------------
   3. Canvas Particle Background
   ----------------------------------------------------------------------- */

function initParticleBackground() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || prefersReducedMotion()) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const cfg = ANIM_CONFIG.particles;

  /** @type {{ x: number, y: number, vx: number, vy: number, size: number, opacity: number }[]} */
  let particles = [];

  /** Mouse position (normalised 0–1, centred). */
  const mouse = { x: 0.5, y: 0.5 };

  /** Animation frame handle for cleanup. */
  let rafId = null;

  /* --- Canvas Sizing --- */

  function resizeCanvas() {
    const rect = canvas.parentElement
      ? canvas.parentElement.getBoundingClientRect()
      : { width: window.innerWidth, height: window.innerHeight };

    // Use device pixel ratio for crisp rendering on HiDPI displays
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width  = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    // Re-create particles on resize to match new dimensions
    createParticles(rect.width, rect.height);
  }

  /* --- Particle Creation --- */

  /**
   * Populate the particles array with random positions and velocities.
   * @param {number} w — canvas CSS width
   * @param {number} h — canvas CSS height
   */
  function createParticles(w, h) {
    particles = [];

    for (let i = 0; i < cfg.count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * cfg.speed,
        vy: (Math.random() - 0.5) * cfg.speed,
        size: cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize),
        opacity: cfg.minOpacity + Math.random() * (cfg.maxOpacity - cfg.minOpacity),
      });
    }
  }

  /* --- Animation Loop --- */

  function animate() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);

    // Update & draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Subtle mouse influence (parallax push)
      const dx = (mouse.x - 0.5) * cfg.mouseInfluence;
      const dy = (mouse.y - 0.5) * cfg.mouseInfluence;

      p.x += p.vx + dx;
      p.y += p.vy + dy;

      // Wrap around edges
      if (p.x < -cfg.maxSize) p.x = w + cfg.maxSize;
      if (p.x > w + cfg.maxSize) p.x = -cfg.maxSize;
      if (p.y < -cfg.maxSize) p.y = h + cfg.maxSize;
      if (p.y > h + cfg.maxSize) p.y = -cfg.maxSize;

      // Draw dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cfg.color}, ${p.opacity})`;
      ctx.fill();
    }

    // Draw connecting lines between nearby particles
    drawLines(ctx);

    rafId = requestAnimationFrame(animate);
  }

  /**
   * Draw faint lines between particles that are within `lineDistance` of each other.
   * We only check each pair once (j > i) for performance.
   * @param {CanvasRenderingContext2D} c
   */
  function drawLines(c) {
    const maxDist = cfg.lineDistance;
    const maxDistSq = maxDist * maxDist;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dxAB = a.x - b.x;
        const dyAB = a.y - b.y;
        const distSq = dxAB * dxAB + dyAB * dyAB;

        if (distSq < maxDistSq) {
          const opacity = cfg.lineOpacity * (1 - Math.sqrt(distSq) / maxDist);
          c.beginPath();
          c.moveTo(a.x, a.y);
          c.lineTo(b.x, b.y);
          c.strokeStyle = `rgba(${cfg.color}, ${opacity})`;
          c.lineWidth = 0.5;
          c.stroke();
        }
      }
    }
  }

  /* --- Mouse Tracking --- */

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) / rect.width;
    mouse.y = (e.clientY - rect.top) / rect.height;
  }

  /* --- Visibility Check --- */

  /**
   * Pause the animation when the hero section is off-screen to save CPU.
   */
  function initVisibilityObserver() {
    const heroSection = canvas.closest('section') || canvas.parentElement;
    if (!heroSection) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!rafId) rafId = requestAnimationFrame(animate);
        } else {
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        }
      },
      { threshold: 0 }
    );

    observer.observe(heroSection);
  }

  /* --- Initialise --- */

  resizeCanvas();
  initVisibilityObserver();
  rafId = requestAnimationFrame(animate);

  // Debounced resize handler
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 200);
  });

  canvas.addEventListener('mousemove', onMouseMove, { passive: true });

  // Reset mouse to centre when it leaves the canvas
  canvas.addEventListener('mouseleave', () => {
    mouse.x = 0.5;
    mouse.y = 0.5;
  });
}

/* -----------------------------------------------------------------------
   4. Parallax Scroll
   ----------------------------------------------------------------------- */

function initParallaxScroll() {
  if (prefersReducedMotion()) return;

  const parallaxEls = document.querySelectorAll('.parallax-bg');
  if (!parallaxEls.length) return;

  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const scrollY = window.scrollY;

      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallaxSpeed) || ANIM_CONFIG.parallaxFactor;
        const offset = scrollY * speed;

        // Use translate3d for GPU-accelerated compositing
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
      });

      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  // Initial call
  onScroll();
}
