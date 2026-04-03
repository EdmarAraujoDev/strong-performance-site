/* =========================================
   STRONG PERFORMANCE CENTRO AUTOMOTIVO
   script.js — Interactivity & Animations
   ========================================= */

(function () {
  'use strict';

  // ─── DOM REFS ───
  const header     = document.getElementById('header');
  const hamburger  = document.getElementById('hamburger');
  const nav        = document.getElementById('nav');
  const backToTop  = document.getElementById('backToTop');
  const navLinks   = document.querySelectorAll('.nav-link');
  const sections   = document.querySelectorAll('section[id], div[id]');
  const aosEls     = document.querySelectorAll('[data-aos]');

  // ─── SCROLL: header scroll state ───
  function onScroll () {
    const scrollY = window.scrollY;

    // Header shrink
    if (scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Back to top visibility
    if (scrollY > 400) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }

    // Active nav link based on section in view
    let current = '';
    sections.forEach(function (sec) {
      const sectionTop = sec.offsetTop - 100;
      if (scrollY >= sectionTop) {
        current = sec.getAttribute('id');
      }
    });
    navLinks.forEach(function (link) {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });

    // AOS reveal
    triggerAOS();
  }

  // ─── AOS LIGHTWEIGHT ───
  function triggerAOS () {
    aosEls.forEach(function (el) {
      if (el.classList.contains('aos-animate')) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80) {
        const delay = parseInt(el.getAttribute('data-aos-delay') || 0);
        setTimeout(function () {
          el.classList.add('aos-animate');
        }, delay);
      }
    });
  }

  // ─── HAMBURGER / MOBILE NAV ───
  hamburger.addEventListener('click', function () {
    const isOpen = nav.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close nav when a link is clicked
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // ─── SMOOTH SCROLL ───
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = header.offsetHeight + 12;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // ─── BACK TO TOP ───
  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ─── COUNTER ANIMATION (stat badges) ───
  function animateCounter (el, target, duration) {
    const start = 0;
    const step = (target / duration) * 16;
    let current = start;
    const timer = setInterval(function () {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current) + (el.dataset.suffix || '');
    }, 16);
  }

  // ─── SERVICE CARDS RIPPLE ───
  document.querySelectorAll('.service-card').forEach(function (card) {
    card.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      ripple.style.cssText = [
        'position:absolute',
        'border-radius:50%',
        'background:rgba(229,9,20,0.15)',
        'pointer-events:none',
        'transform:scale(0)',
        'animation:ripple 0.6s linear',
        'width:200px',
        'height:200px',
        'margin-top:-100px',
        'margin-left:-100px',
        'left:' + (e.clientX - card.getBoundingClientRect().left) + 'px',
        'top:' + (e.clientY - card.getBoundingClientRect().top) + 'px'
      ].join(';');
      card.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 650);
    });
  });

  // Add ripple keyframe dynamically
  const styleEl = document.createElement('style');
  styleEl.textContent = '@keyframes ripple{to{opacity:0;transform:scale(2.5)}}';
  document.head.appendChild(styleEl);

  // ─── WHATSAPP FLOAT PULSE PAUSE ON HOVER ───
  const waFloat = document.getElementById('whatsapp-float');
  if (waFloat) {
    waFloat.addEventListener('mouseenter', function () {
      this.style.animationPlayState = 'paused';
    });
    waFloat.addEventListener('mouseleave', function () {
      this.style.animationPlayState = 'running';
    });
  }

  // ─── SCROLL LISTENER (throttled) ───
  let ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // ─── INIT ───
  onScroll(); // run once on load

  // Trigger AOS on images load for better accuracy
  window.addEventListener('load', function () {
    triggerAOS();

    // Animate badge counter
    const badge = document.querySelector('.about-badge-number');
    if (badge) {
      badge.dataset.suffix = '+';
      animateCounter(badge, 10, 1500);
    }
  });

  // ─── HEADER LINK CLICK TRACKING ───
  // Accessibility: close mobile nav on outside click
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !hamburger.contains(e.target)) {
      nav.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

}());
