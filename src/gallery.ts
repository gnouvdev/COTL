import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function mountGallery() {
  function init() {
    const section = document.getElementById('gallery');
    const lightbox = document.getElementById('gallery-lightbox');
    if (!section || !lightbox) return;

    const lightboxImg = lightbox.querySelector<HTMLImageElement>('.lightbox-image');
    const lightboxLoc = lightbox.querySelector<HTMLElement>('.lightbox-location');
    const lightboxTitle = lightbox.querySelector<HTMLElement>('.lightbox-title');
    const lightboxCaption = lightbox.querySelector<HTMLElement>('.lightbox-caption');

    function openLightbox(card: HTMLElement) {
      const src = card.dataset.lightboxSrc || '';
      const title = card.dataset.lightboxTitle || '';
      const location = card.dataset.lightboxLocation || '';
      const desc = card.dataset.lightboxDesc || '';

      if (!src) return;

      if (lightboxImg) {
        lightboxImg.src = src;
        lightboxImg.alt = title;
      }
      if (lightboxLoc) lightboxLoc.textContent = location ? `📍 ${location}` : '';
      if (lightboxTitle) lightboxTitle.textContent = title;
      if (lightboxCaption) lightboxCaption.textContent = desc;

      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    // Event delegation for clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Filter click
      const filterBtn = target.closest<HTMLButtonElement>('[data-filter-id]');
      if (filterBtn && section.contains(filterBtn)) {
        const filter = filterBtn.dataset.filterId || 'all';
        section.querySelectorAll<HTMLButtonElement>('[data-filter-id]').forEach((btn) => {
          const isCurrent = btn === filterBtn;
          btn.classList.toggle('active', isCurrent);
          btn.setAttribute('aria-selected', String(isCurrent));
        });

        section.querySelectorAll<HTMLElement>('[data-gallery-item]').forEach((item) => {
          const cat = item.dataset.category;
          const matches = filter === 'all' || cat === filter;
          item.style.display = matches ? '' : 'none';
        });

        const vp = section.querySelector<HTMLElement>('[data-gallery-viewport]');
        if (vp) {
          vp.dispatchEvent(new CustomEvent('cotl:reset-scroll'));
        }
        ScrollTrigger.refresh();
        return;
      }

      // Card click -> Open Lightbox (ignore right after drag-scroll)
      const card = target.closest<HTMLElement>('.gallery-card');
      if (card && section.contains(card)) {
        const vp = section.querySelector<HTMLElement>('[data-gallery-viewport]');
        if (vp?.dataset.justDragged) return;
        openLightbox(card);
        return;
      }

      // Close Lightbox
      if (target.closest('[data-lightbox-close]')) {
        closeLightbox();
        return;
      }
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
        closeLightbox();
        return;
      }

      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.classList.contains('gallery-card')) {
        e.preventDefault();
        openLightbox(document.activeElement as HTMLElement);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
