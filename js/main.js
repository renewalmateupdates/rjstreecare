/* ===================================
   RJ'S TREE CARE — Scripts
   =================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Sticky Nav ──────────────────── */
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  /* ── Mobile Nav ─────────────────── */
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileNav = document.querySelector('.nav__mobile');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', mobileNav.classList.contains('open'));
    });
  }

  /* ── FAQ Accordion ──────────────── */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item.open').forEach(open => {
        open.classList.remove('open');
        open.querySelector('.faq-answer').style.maxHeight = '0';
      });

      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  /* ── Gallery Lightbox ───────────── */
  const lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    const lightboxImg = lightbox.querySelector('img');
    const galleryItems = document.querySelectorAll('.gallery-item');
    let currentIdx = 0;
    const images = [];

    galleryItems.forEach((item, i) => {
      const src = item.querySelector('img')?.src;
      const label = item.querySelector('.gallery-item__label')?.textContent || '';
      if (src) images.push({ src, label });

      item.addEventListener('click', () => {
        currentIdx = i;
        openLightbox(i);
      });
    });

    function openLightbox(idx) {
      if (!images[idx]) return;
      lightboxImg.src = images[idx].src;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }

    lightbox.querySelector('.lightbox__close')?.addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox__prev')?.addEventListener('click', () => {
      currentIdx = (currentIdx - 1 + images.length) % images.length;
      openLightbox(currentIdx);
    });
    lightbox.querySelector('.lightbox__next')?.addEventListener('click', () => {
      currentIdx = (currentIdx + 1) % images.length;
      openLightbox(currentIdx);
    });
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') { currentIdx = (currentIdx - 1 + images.length) % images.length; openLightbox(currentIdx); }
      if (e.key === 'ArrowRight') { currentIdx = (currentIdx + 1) % images.length; openLightbox(currentIdx); }
    });
  }

  /* ── Form Submission (self-hosted email API — /api/contact) ─── */
  function wireContactForm(formSelector, successSelector) {
    const form = document.querySelector(formSelector);
    const success = document.querySelector(successSelector);
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      const payload = Object.fromEntries(new FormData(form).entries());

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(async response => {
        if (response.ok) {
          if (success) {
            success.style.display = 'flex';
            success.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => { success.style.display = 'none'; }, 8000);
          }
          form.reset();
        } else {
          alert("Something went wrong sending your message. Please call us directly at (765) 570-3398 — we'd hate to miss you.");
        }
      }).catch(() => {
        alert("Something went wrong sending your message. Please call us directly at (765) 570-3398 — we'd hate to miss you.");
      }).finally(() => {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
      });
    });
  }

  wireContactForm('#contact-form', '.form-success');
  wireContactForm('#quick-contact-form', '#quick-form-success');

  /* ── Email Capture ──────────────── */
  const emailForm = document.querySelector('#email-capture-form');
  if (emailForm) {
    emailForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = emailForm.querySelector('button');
      btn.textContent = '✓ You\'re in!';
      btn.style.background = '#34D399';
      emailForm.querySelector('input').value = '';
      setTimeout(() => { btn.textContent = 'Subscribe'; btn.style.background = ''; }, 4000);
    });
  }

  /* ── Scroll Fade Animations ─────── */
  const fadeEls = document.querySelectorAll('.fade-up');
  if ('IntersectionObserver' in window && fadeEls.length) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    fadeEls.forEach(el => obs.observe(el));
  } else {
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  /* ── Job Video Player ───────────── */
  // Each card links straight to its .mp4 (still works without JS); this plays it in a pop-up instead
  const workCards = document.querySelectorAll('.work-card');
  if (workCards.length) {
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Job video');
    modal.innerHTML = '<div class="video-modal__box"><button type="button" class="video-modal__close" aria-label="Close video">✕</button><video playsinline controls muted preload="none"></video><p class="video-modal__title"></p></div>';
    document.body.appendChild(modal);
    const player = modal.querySelector('video');
    const title = modal.querySelector('.video-modal__title');
    const closeBtn = modal.querySelector('.video-modal__close');
    let opener = null;

    const closeVideo = () => {
      player.pause();
      player.removeAttribute('src');
      player.load(); // stops the download
      modal.hidden = true;
      document.body.style.overflow = '';
      if (opener) opener.focus();
    };

    workCards.forEach(card => {
      card.addEventListener('click', e => {
        e.preventDefault();
        opener = card;
        player.poster = card.dataset.poster || '';
        player.src = card.getAttribute('href');
        title.textContent = card.querySelector('strong')?.textContent || '';
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
        player.play().catch(() => {}); // the controls are still there if a browser holds off
      });
    });

    closeBtn.addEventListener('click', closeVideo);
    modal.addEventListener('click', e => { if (e.target === modal) closeVideo(); });
    document.addEventListener('keydown', e => {
      if (modal.hidden) return;
      if (e.key === 'Escape') closeVideo();
      if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === closeBtn ? player : closeBtn).focus(); }
    });
  }

  /* ── Seasonal Falling Leaves ────── */
  // Runs only while css/fall.css is switched on (it sets --fall-leaves: on)
  const leavesOn = getComputedStyle(document.documentElement).getPropertyValue('--fall-leaves').trim() === 'on';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (leavesOn && !reduceMotion) {
    const layer = document.createElement('div');
    layer.className = 'fall-leaves';
    layer.setAttribute('aria-hidden', 'true');
    const count = window.innerWidth < 640 ? 6 : 10;
    let longest = 0;
    for (let i = 0; i < count; i++) {
      const leaf = document.createElement('span');
      const size = 14 + Math.round(Math.random() * 12);
      const duration = 9 + Math.random() * 6;
      const delay = Math.random() * 7;
      leaf.className = `fall-leaf fall-leaf--${(i % 4) + 1}${i % 2 ? ' fall-leaf--alt' : ''}`;
      leaf.style.left = `${((i + Math.random()) / count * 96).toFixed(1)}%`;
      leaf.style.width = leaf.style.height = `${size}px`;
      leaf.style.animationDuration = `${duration.toFixed(1)}s`;
      leaf.style.animationDelay = `${delay.toFixed(1)}s`;
      layer.appendChild(leaf);
      longest = Math.max(longest, delay + duration * 2); // each leaf falls twice
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), (longest + 1) * 1000);
  }

});
