import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { mountThread } from './thread';
import { mountLoupe } from './loupe';
import { mountGallery } from './gallery';
import { mountLanguageToggle } from './i18n';
import { mountTextileArtifacts } from './artifact';

gsap.registerPlugin(ScrollTrigger);

// 1. Single-Loop Lenis + GSAP Ticker Sync (60fps, zero double-RAF jitter)
const lenis = new Lenis({
  duration: 1.05,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 1.1,
  touchMultiplier: 1.4,
  respectReducedMotion: false,
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// Smooth scroll on anchor link clicks
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const targetId = anchor.getAttribute('href');
    if (targetId && targetId !== '#') {
      const targetEl = document.querySelector<HTMLElement>(targetId);
      if (targetEl) {
        e.preventDefault();
        lenis.scrollTo(targetEl, { offset: -24, duration: 1.1 });
      }
    }
  });
});

// 2. Mount Heritage Railway Track & Moving Locomotive
const track = document.querySelector<HTMLElement>('[data-thread-track]');
const setThreadMotion = track && mountThread(track);

// 3. Mount Tactile Loupe
const loupeEl = document.querySelector<HTMLElement>('[data-loupe-target]');
const loupeContainer = loupeEl?.closest<HTMLElement>('.loupe-chapter');
if (loupeContainer) mountLoupe(loupeContainer);

// 4. Mount Fieldwork Gallery, Filter & Lightbox + Video Hover Preview
mountGallery();

// 5. Mount Instant In-Place Language Toggle (VI <-> EN)
mountLanguageToggle();

// 6. Mount 3D Textile & Paper Specimen Artifacts
mountTextileArtifacts();

// 7. Hero 4-Zone Interactive Horizon (Regional Dye Glow + Quote + Jump)
const heroCover = document.querySelector<HTMLElement>('.cover');
const horizonZones = Array.from(document.querySelectorAll<HTMLElement>('[data-horizon-zone]'));
const horizonReadout = document.querySelector<HTMLElement>('[data-horizon-readout]');
const horizonRegionEl = document.querySelector<HTMLElement>('[data-horizon-region]');
const horizonCoordsEl = document.querySelector<HTMLElement>('[data-horizon-coords]');
const horizonQuoteEl = document.querySelector<HTMLElement>('[data-horizon-quote]');

if (heroCover && horizonZones.length) {
  const setActiveZone = (zone: HTMLElement | null) => {
    horizonZones.forEach((z) => z.classList.toggle('is-active', z === zone));
    if (!zone) {
      heroCover.style.setProperty('--hero-tint', 'transparent');
      horizonReadout?.classList.remove('is-visible');
      return;
    }
    const lang = document.documentElement.lang === 'en' ? 'en' : 'vi';
    const tint = zone.dataset.tint || 'transparent';
    const region = zone.getAttribute(`data-region-${lang}`) || '';
    const coords = zone.dataset.coords || '';
    const quote = zone.getAttribute(`data-quote-${lang}`) || '';

    heroCover.style.setProperty('--hero-tint', tint);
    if (horizonRegionEl) horizonRegionEl.textContent = region;
    if (horizonCoordsEl) horizonCoordsEl.textContent = coords;
    if (horizonQuoteEl) horizonQuoteEl.textContent = quote;
    horizonReadout?.classList.add('is-visible');
  };

  horizonZones.forEach((zone) => {
    zone.addEventListener('mouseenter', () => setActiveZone(zone));
    zone.addEventListener('focus', () => setActiveZone(zone));
    zone.addEventListener('click', () => {
      const targetId = zone.dataset.target;
      const targetEl = targetId ? document.querySelector<HTMLElement>(targetId) : null;
      if (targetEl) lenis.scrollTo(targetEl, { offset: -20, duration: 1.15 });
    });
  });

  heroCover.addEventListener('mouseleave', () => setActiveZone(null));
}

// 8. Cursor-Aware Smooth Horizontal Scroll + Inertia & Physics Sway Animation
// - Cursor OUTSIDE component -> normal vertical page scroll (Lenis)
// - Cursor INSIDE component -> smooth horizontal wheel scroll with momentum sway/tilt
// - Automatically releases vertical scroll smoothly at left/right boundaries
function mountHorizontalTrack(
  viewport: HTMLElement,
  options?: {
    onProgress?: (progress: number, velocity: number) => void;
    swayTarget?: HTMLElement | null;
    swayVar?: string;
    swayFactor?: number;
    maxSway?: number;
  }
) {
  let isDown = false;
  let startX = 0;
  let scrollLeftStart = 0;
  let dragged = false;

  let currentScroll = viewport.scrollLeft;
  let targetScroll = viewport.scrollLeft;
  let swayVal = 0;
  let animating = false;

  const getMax = () => Math.max(0, viewport.scrollWidth - viewport.clientWidth);

  const emitProgress = (velocity: number) => {
    const max = Math.max(1, getMax());
    const progress = Math.max(0, Math.min(1, viewport.scrollLeft / max));
    options?.onProgress?.(progress, velocity);
  };

  const step = () => {
    const max = getMax();
    if (targetScroll > max) targetScroll = max;
    if (targetScroll < 0) targetScroll = 0;

    const diff = targetScroll - currentScroll;
    currentScroll += diff * 0.12;
    if (Math.abs(diff) < 0.35) currentScroll = targetScroll;

    viewport.scrollLeft = currentScroll;

    // Local physics sway animation (zero :root reflow!)
    const factor = options?.swayFactor ?? -0.024;
    const maxSway = options?.maxSway ?? 4.6;
    const desiredSway = Math.max(-maxSway, Math.min(maxSway, diff * factor));
    swayVal += (desiredSway - swayVal) * 0.16;
    if (Math.abs(swayVal) < 0.025 && Math.abs(diff) < 0.35) swayVal = 0;

    if (options?.swayTarget && options.swayVar) {
      options.swayTarget.style.setProperty(options.swayVar, `${swayVal.toFixed(2)}deg`);
    }

    emitProgress(diff);

    if (Math.abs(targetScroll - currentScroll) > 0.35 || Math.abs(swayVal) > 0.025) {
      requestAnimationFrame(step);
    } else {
      animating = false;
    }
  };

  const kick = () => {
    if (!animating) {
      animating = true;
      requestAnimationFrame(step);
    }
  };

  // Cursor-aware wheel handler: captures wheel ONLY when pointer is inside this viewport
  viewport.addEventListener(
    'wheel',
    (e) => {
      const max = getMax();
      if (max <= 2) return;

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 0.5) return;

      const atStart = targetScroll <= 1 && currentScroll <= 1;
      const atEnd = targetScroll >= max - 1 && currentScroll >= max - 1;

      // Release cleanly to normal vertical scroll once user reaches either end
      if ((delta < 0 && atStart) || (delta > 0 && atEnd)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      targetScroll = Math.max(0, Math.min(max, targetScroll + delta * 1.15));
      kick();
    },
    { passive: false }
  );

  // Pointer drag-to-scroll (synced cleanly into smooth inertia target)
  viewport.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button, a, video')) return;
    isDown = true;
    dragged = false;
    startX = e.pageX - viewport.offsetLeft;
    scrollLeftStart = viewport.scrollLeft;
    currentScroll = scrollLeftStart;
    targetScroll = scrollLeftStart;
    viewport.classList.add('is-dragging');
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const x = e.pageX - viewport.offsetLeft;
    const walk = (x - startX) * 1.25;
    if (Math.abs(walk) > 6) dragged = true;
    const max = getMax();
    targetScroll = Math.max(0, Math.min(max, scrollLeftStart - walk));
    kick();
  });

  window.addEventListener('pointerup', () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove('is-dragging');
    if (dragged) {
      viewport.dataset.justDragged = '1';
      setTimeout(() => delete viewport.dataset.justDragged, 120);
    }
  });

  // Reset event (e.g. when Gallery filter changes)
  viewport.addEventListener('cotl:reset-scroll', () => {
    targetScroll = 0;
    kick();
  });

  // Sync progress on native touch scroll (mobile)
  viewport.addEventListener(
    'scroll',
    () => {
      if (!animating) {
        currentScroll = viewport.scrollLeft;
        targetScroll = viewport.scrollLeft;
        emitProgress(0);
      }
    },
    { passive: true }
  );

  emitProgress(0);

  return {
    scrollTo: (left: number) => {
      targetScroll = Math.max(0, Math.min(getMax(), left));
      kick();
    },
  };
}

// 9. Mount Cursor-Aware Horizontal Railway Tickets (#journey)
const journeyViewport = document.querySelector<HTMLElement>('[data-journey-viewport]');
const journeyTrack = journeyViewport?.querySelector<HTMLElement>('.journey-tickets-track');
const journeyFill = document.querySelector<HTMLElement>('[data-journey-fill]');
const journeyLoco = document.querySelector<HTMLElement>('[data-journey-loco]');
const stationBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-station-jump]'));
const ticketCards = Array.from(document.querySelectorAll<HTMLElement>('[data-ticket-index]'));

if (journeyViewport) {
  const journeyCtrl = mountHorizontalTrack(journeyViewport, {
    swayTarget: journeyTrack,
    swayVar: '--ticket-sway',
    swayFactor: -0.009,
    maxSway: 1.8,
    onProgress: (progress) => {
      const pct = `${(progress * 100).toFixed(1)}%`;
      if (journeyFill) journeyFill.style.width = pct;
      if (journeyLoco) journeyLoco.style.left = pct;
      const activeIdx = Math.min(stationBtns.length - 1, Math.round(progress * (stationBtns.length - 1)));
      stationBtns.forEach((b, bi) => b.classList.toggle('is-current', bi === activeIdx));
    },
  });

  stationBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      const card = ticketCards[idx];
      if (!card) return;
      const targetLeft = card.offsetLeft - Math.max(24, (journeyViewport.clientWidth - card.clientWidth) / 2);
      journeyCtrl.scrollTo(targetLeft);
    });
  });
}

// 10. Mount Cursor-Aware Horizontal Drying-Line Exhibition (#gallery) + Wind Sway + Video Hover
const galleryViewport = document.querySelector<HTMLElement>('[data-gallery-viewport]');
const galleryTrack = document.querySelector<HTMLElement>('[data-gallery-track]');
if (galleryViewport) {
  mountHorizontalTrack(galleryViewport, {
    swayTarget: galleryTrack,
    swayVar: '--local-sway',
    swayFactor: -0.025,
    maxSway: 4.8,
  });
}

// Hover-to-load & preview video in Gallery Cinema Reel
const galleryVideo = document.querySelector<HTMLVideoElement>('#gallery .featured-video');
const cinemaFrame = galleryVideo?.closest<HTMLElement>('.cinema-reel-piece');
if (galleryVideo && cinemaFrame) {
  let userClickedVideo = false;
  galleryVideo.addEventListener('click', () => {
    userClickedVideo = true;
    galleryVideo.muted = false;
  });
  cinemaFrame.addEventListener('mouseenter', () => {
    if (!userClickedVideo) {
      galleryVideo.muted = true;
      galleryVideo.preload = 'auto';
      void galleryVideo.play().catch(() => {});
    }
  });
  cinemaFrame.addEventListener('mouseleave', () => {
    if (!userClickedVideo && !galleryVideo.paused) {
      galleryVideo.pause();
    }
  });
}

// 11. Mount Interactive Crew Photobook Colophon Accordion (#team)
const crewDeck = document.querySelector<HTMLElement>('[data-crew-deck]');
if (crewDeck) {
  const panels = Array.from(crewDeck.querySelectorAll<HTMLElement>('[data-crew-panel]'));
  const activateCrew = (target: HTMLElement) => {
    panels.forEach((p) => p.classList.toggle('is-active', p === target));
  };
  panels.forEach((panel) => {
    panel.addEventListener('mouseenter', () => {
      if (window.innerWidth > 920) activateCrew(panel);
    });
    panel.addEventListener('click', () => activateCrew(panel));
    panel.addEventListener('focusin', () => activateCrew(panel));
  });
}

// 12. Dynamic Ambient Paper Tint Shift on Scroll
const landChapters = document.querySelectorAll<HTMLElement>('[data-land-theme]');
const landAuras: Record<string, string> = {
  'lung-tam': '#f3f6f9',
  'co-tu': '#faf3ee',
  'xi-thoai': '#f9f6ed',
  'an-giang': '#f8f3f7',
};

landChapters.forEach((chapter) => {
  const theme = chapter.dataset.landTheme;
  const color = theme && landAuras[theme];
  if (color) {
    ScrollTrigger.create({
      trigger: chapter,
      start: 'top 60%',
      end: 'bottom 40%',
      onEnter: () => document.documentElement.style.setProperty('--paper-ambient', color),
      onEnterBack: () => document.documentElement.style.setProperty('--paper-ambient', color),
    });
  }
});

// 13. Lightweight GPU-Friendly Scroll Animations (No laggy SVG filters or :root updates!)
function createMotion() {
  // Hero entrance
  if (window.scrollY < 40) {
    gsap.timeline({ defaults: { duration: 1.0, ease: 'power3.out' } })
      .from('#title > *', { y: 32, opacity: 0, stagger: 0.14 })
      .from('.hero-lead', { y: 18, opacity: 0, duration: 0.85 }, 0.3)
      .from('.hero-copy .actions', { y: 14, opacity: 0, duration: 0.75 }, 0.48);
  }

  // Hero subtle parallax scrub
  if (heroCover) {
    gsap.to('.hero-ambient-video', {
      yPercent: 14,
      ease: 'none',
      scrollTrigger: {
        trigger: heroCover,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  // Giant Roman Numeral subtle depth parallax
  document.querySelectorAll<HTMLElement>('.roman-watermark').forEach((num) => {
    const parent = num.closest('.land-chapter');
    if (parent) {
      gsap.fromTo(
        num,
        { y: -45 },
        {
          y: 45,
          ease: 'none',
          scrollTrigger: {
            trigger: parent,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    }
  });

  // Art-book section openers gentle reveal (once, no scrub overhead)
  document.querySelectorAll<HTMLElement>('.artbook-opener, .manifesto-lead').forEach((el) => {
    gsap.from(el, {
      y: 26,
      opacity: 0,
      duration: 0.85,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true,
      },
    });
  });

  // Media reveal (once — crisp & silky 60fps instead of heavy scrubbed clip-path)
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((media) => {
    const photos = media.querySelectorAll('.image-window');
    if (!photos.length) return;
    gsap.fromTo(
      photos,
      { y: 28, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: media, start: 'top 86%', once: true },
      }
    );
  });

  // Desktop fine-pointer magnetic buttons & editorial cursor
  const media = gsap.matchMedia();
  media.add('(hover: hover) and (pointer: fine)', () => {
    const cleanups: Array<() => void> = [];

    document.querySelectorAll<HTMLElement>('.button').forEach((btn) => {
      const onMove = (e: MouseEvent) => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, {
          x: (e.clientX - (r.left + r.width / 2)) * 0.2,
          y: (e.clientY - (r.top + r.height / 2)) * 0.2,
          duration: 0.3,
          ease: 'power2.out',
        });
      };
      const onLeave = () => gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.45)' });
      btn.addEventListener('mousemove', onMove);
      btn.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        btn.removeEventListener('mousemove', onMove);
        btn.removeEventListener('mouseleave', onLeave);
      });
    });

    const cursor = document.querySelector<HTMLElement>('.cotl-cursor');
    const cursorLabel = cursor?.querySelector<HTMLElement>('.cotl-cursor-label');
    let rafId = 0;
    if (cursor && cursorLabel) {
      let tx = -100, ty = -100, cx = -100, cy = -100;
      const onPointerMove = (e: MouseEvent) => {
        tx = e.clientX;
        ty = e.clientY;
        if (!cursor.classList.contains('is-visible')) cursor.classList.add('is-visible');

        const target = e.target as HTMLElement | null;
        const isVi = document.documentElement.lang !== 'en';
        if (target?.closest('.gallery-card')) {
          cursor.classList.add('has-label');
          cursorLabel.textContent = isVi ? 'Xem ảnh' : 'Inspect';
        } else if (target?.closest('.loupe-stage')) {
          cursor.classList.add('has-label');
          cursorLabel.textContent = isVi ? 'Soi 2.5×' : 'Loupe 2.5×';
        } else if (
          target?.closest('[data-journey-viewport], [data-gallery-viewport]') &&
          !target.closest('video, .cinema-reel-piece, a, button')
        ) {
          cursor.classList.add('has-label');
          cursorLabel.textContent = isVi ? 'Cuộn ngang ↔' : 'Scroll ↔';
        } else if (target?.closest('a, button, [data-horizon-zone]')) {
          cursor.classList.add('is-pointer');
          cursor.classList.remove('has-label');
        } else {
          cursor.classList.remove('has-label', 'is-pointer');
        }
      };
      const onScrollClear = () => {
        cursor.classList.remove('has-label', 'is-pointer');
      };
      const onLeaveDoc = () => cursor.classList.remove('is-visible');
      const tick = () => {
        cx += (tx - cx) * 0.18;
        cy += (ty - cy) * 0.18;
        cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        rafId = requestAnimationFrame(tick);
      };
      window.addEventListener('mousemove', onPointerMove, { passive: true });
      window.addEventListener('scroll', onScrollClear, { passive: true });
      document.addEventListener('mouseleave', onLeaveDoc);
      rafId = requestAnimationFrame(tick);

      cleanups.push(() => {
        window.removeEventListener('mousemove', onPointerMove);
        window.removeEventListener('scroll', onScrollClear);
        document.removeEventListener('mouseleave', onLeaveDoc);
        cancelAnimationFrame(rafId);
      });
    }

    return () => cleanups.forEach((fn) => fn());
  });

  return () => media.revert();
}

gsap.context(createMotion);
setThreadMotion?.(true);
void document.fonts.ready.then(() => ScrollTrigger.refresh());
