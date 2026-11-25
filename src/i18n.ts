import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function mountLanguageToggle() {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.language a[lang]'));
  if (!links.length) return;

  function applyLang(targetLang: 'vi' | 'en') {
    document.documentElement.lang = targetLang;

    // Update page title
    document.title =
      targetLang === 'vi'
        ? 'Sắc màu của đất | Colors of the Land'
        : 'Colors of the Land';

    // Update active state on VI / EN switcher
    links.forEach((link) => {
      if (link.getAttribute('lang') === targetLang) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    // Swap all elements with data-vi / data-en
    document.querySelectorAll<HTMLElement>('[data-vi][data-en]').forEach((el) => {
      const text = el.getAttribute(`data-${targetLang}`);
      if (text !== null) {
        el.textContent = text;
      }
    });

    // Swap alt attributes
    document.querySelectorAll<HTMLImageElement>('[data-vi-alt][data-en-alt]').forEach((img) => {
      const alt = img.getAttribute(`data-${targetLang}-alt`);
      if (alt !== null) {
        img.alt = alt;
      }
    });

    // Swap language-specific href attributes (e.g., VI / EN Proposal PDFs)
    document.querySelectorAll<HTMLAnchorElement>('[data-vi-href][data-en-href]').forEach((anchor) => {
      const href = anchor.getAttribute(`data-${targetLang}-href`);
      if (href !== null) {
        anchor.href = href;
      }
    });

    // Swap lightbox dataset attributes on gallery cards
    document.querySelectorAll<HTMLElement>('.gallery-card').forEach((card) => {
      const title = card.getAttribute(`data-lightbox-title-${targetLang}`);
      const loc = card.getAttribute(`data-lightbox-location-${targetLang}`);
      const desc = card.getAttribute(`data-lightbox-desc-${targetLang}`);
      if (title !== null) {
        card.dataset.lightboxTitle = title;
        card.setAttribute('aria-label', title);
      }
      if (loc !== null) card.dataset.lightboxLocation = loc;
      if (desc !== null) card.dataset.lightboxDesc = desc;
    });

    // Update URL cleanly without reloading if needed, or keep current path
    ScrollTrigger.refresh();
  }

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetLang = link.getAttribute('lang') === 'en' ? 'en' : 'vi';
      applyLang(targetLang);
    });
  });
}
