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

});
