import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function mountTextileArtifacts() {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-artifact-card]'));
  if (!cards.length) return;

  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  cards.forEach((card) => {
    const inner = card.querySelector<HTMLElement>('[data-artifact-inner]');
    const stitchPaths = card.querySelectorAll<SVGGeometryElement>('.artifact-stitch-path');
    const flipBtns = card.querySelectorAll<HTMLButtonElement>('[data-artifact-flip]');

    // 1. Self-sewing SVG perimeter stitch on scroll
    stitchPaths.forEach((path) => {
      gsap.fromTo(
        path,
        { strokeDashoffset: 1320, opacity: 0.25 },
        {
          strokeDashoffset: 0,
          opacity: 1,
          duration: 1.5,
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            once: true,
          },
        }
      );
    });

    // 2. 3D Flip interaction
    flipBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const flipped = card.classList.toggle('is-flipped');
        card.setAttribute('data-flipped', String(flipped));
      });
    });

    // 3. 3D Perspective Tilt + Silk Sheen (desktop)
    if (isFinePointer && inner) {
      const rxTo = gsap.quickTo(card, '--tilt-x', { duration: 0.4, ease: 'power3.out' });
      const ryTo = gsap.quickTo(card, '--tilt-y', { duration: 0.4, ease: 'power3.out' });

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;

        const tiltY = (px - 0.5) * 9;   // -4.5deg to +4.5deg
        const tiltX = (0.5 - py) * 7;   // -3.5deg to +3.5deg

        rxTo(tiltX);
        ryTo(tiltY);
        card.style.setProperty('--sheen-x', `${(px * 100).toFixed(1)}%`);
        card.style.setProperty('--sheen-y', `${(py * 100).toFixed(1)}%`);
      });

      card.addEventListener('mouseleave', () => {
        rxTo(0);
        ryTo(0);
      });
    }
  });
}
