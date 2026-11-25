import { gsap } from 'gsap';

export function mountLoupe(container: HTMLElement) {
  const targetImg = container.querySelector<HTMLImageElement>('[data-loupe-target]');
  const lens = container.querySelector<HTMLElement>('[data-loupe-lens]');
  const zoomView = container.querySelector<HTMLElement>('[data-loupe-zoom]');
  const readout = container.querySelector<HTMLElement>('[data-loupe-readout]');

  if (!targetImg || !lens || !zoomView) return;

  const zoomFactor = 2.4;
  let imgWidth = 0;
  let imgHeight = 0;
  let lensSize = 130;
  let active = false;

  const cursor = { x: 0, y: 0 };
  const xTo = gsap.quickTo(lens, 'x', { duration: 0.15, ease: 'power2.out' });
  const yTo = gsap.quickTo(lens, 'y', { duration: 0.15, ease: 'power2.out' });

  function measure() {
    imgWidth = targetImg.clientWidth;
    imgHeight = targetImg.clientHeight;
    lensSize = Math.max(90, Math.min(150, imgWidth * 0.28));
    lens.style.width = `${lensSize}px`;
    lens.style.height = `${lensSize}px`;

    // Background size for the zoom view
    zoomView.style.backgroundSize = `${imgWidth * zoomFactor}px ${imgHeight * zoomFactor}px`;
    zoomView.style.backgroundImage = `url('${targetImg.currentSrc || targetImg.src}')`;
  }

  function updatePosition(x: number, y: number) {
    // Clamp inside image bounds
    const clampedX = Math.max(0, Math.min(imgWidth, x));
    const clampedY = Math.max(0, Math.min(imgHeight, y));

    // Move lens center to cursor
    xTo(clampedX - lensSize / 2);
    yTo(clampedY - lensSize / 2);

    // Calculate background position
    const bgX = -clampedX * zoomFactor + lensSize / 2;
    const bgY = -clampedY * zoomFactor + lensSize / 2;
    zoomView.style.backgroundPosition = `${bgX}px ${bgY}px`;

    if (readout) {
      const threadCol = Math.round((clampedX / imgWidth) * 120);
      const threadRow = Math.round((clampedY / imgHeight) * 120);
      readout.textContent = `Sợi dọc #${threadCol} · Sợi ngang #${threadRow}`;
    }
  }

  function onPointerMove(e: PointerEvent) {
    const rect = targetImg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!active) {
      active = true;
      lens.classList.add('is-active');
      gsap.to(lens, { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' });
    }
    updatePosition(x, y);
  }

  function onPointerLeave() {
    if (!active) return;
    active = false;
    lens.classList.remove('is-active');
    gsap.to(lens, { opacity: 0, scale: 0.85, duration: 0.25, ease: 'power2.in' });
  }

  const observer = new ResizeObserver(measure);
  observer.observe(targetImg);
  targetImg.addEventListener('load', measure);

  container.addEventListener('pointerenter', onPointerMove);
  container.addEventListener('pointermove', onPointerMove);
  container.addEventListener('pointerleave', onPointerLeave);
  container.addEventListener('pointercancel', onPointerLeave);

  // Initial trigger in center
  measure();
  updatePosition(imgWidth / 2, imgHeight / 2);

  return () => {
    observer.disconnect();
    targetImg.removeEventListener('load', measure);
    container.removeEventListener('pointerenter', onPointerMove);
    container.removeEventListener('pointermove', onPointerMove);
    container.removeEventListener('pointerleave', onPointerLeave);
    container.removeEventListener('pointercancel', onPointerLeave);
  };
}
