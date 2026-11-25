import { gsap } from 'gsap';

type BrushPoint = { x: number; y: number; life: number };

export function mountWovenHover(surface: HTMLElement) {
  const canvas = document.createElement('canvas');
  const brush = document.createElement('canvas');
  brush.width = brush.height = 160;
  const canvasContext = canvas.getContext('2d');
  const brushContext = brush.getContext('2d');
  if (!canvasContext || !brushContext) return;
  const context = canvasContext;

  canvas.className = 'woven-hover';
  canvas.setAttribute('aria-hidden', 'true');
  surface.append(canvas);
  const edge = brushContext.createRadialGradient(80, 80, 18, 80, 80, 80);
  edge.addColorStop(0, '#fff');
  edge.addColorStop(.55, 'rgba(255,255,255,.84)');
  edge.addColorStop(1, 'rgba(255,255,255,0)');
  brushContext.fillStyle = edge;
  brushContext.fillRect(0, 0, 160, 160);

  const texture = new Image();
  texture.decoding = 'async';
  texture.src = surface.dataset.wovenSurface || '/photos/woven-detail.webp';
  const cursor = { x: 0, y: 0, strength: 0 };
  const xTo = gsap.quickTo(cursor, 'x', { duration: .23, ease: 'power3.out' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: .23, ease: 'power3.out' });
  const strengthTo = gsap.quickTo(cursor, 'strength', { duration: .32, ease: 'power2.out' });
  const trail: BrushPoint[] = [];
  let width = 0;
  let height = 0;
  let radius = 110;
  let scale = 1;
  let hovered = false;
  let ticking = false;
  let lastStamp: BrushPoint | undefined;

  function resize() {
    width = surface.clientWidth;
    height = surface.clientHeight;
    radius = gsap.utils.clamp(68, 175, width * .165);
    scale = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    trail.length = 0;
    lastStamp = undefined;
    if (hovered) startDrawing();
  }

  function draw(_: number, delta: number) {
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, width, height);

    if (hovered && (!lastStamp || Math.hypot(lastStamp.x - cursor.x, lastStamp.y - cursor.y) > radius * .21)) {
      lastStamp = { x: cursor.x, y: cursor.y, life: 1 };
      trail.push(lastStamp);
      if (trail.length > 8) trail.shift();
    }

    context.globalCompositeOperation = 'source-over';
    for (let i = trail.length - 1; i >= 0; i--) {
      const point = trail[i];
      point.life -= delta / 430;
      if (point.life <= 0) {
        trail.splice(i, 1);
        continue;
      }
      const size = radius * (1.2 + .6 * point.life);
      context.globalAlpha = .72 * point.life;
      context.drawImage(brush, point.x - size / 2, point.y - size / 2, size, size);
    }

    if (cursor.strength > .003) {
      context.globalAlpha = cursor.strength;
      context.drawImage(brush, cursor.x - radius, cursor.y - radius, radius * 2, radius * 2);
    }

    // Keep the texture in place and reveal it only where the brush has drawn alpha.
    if (texture.complete && texture.naturalWidth) {
      const cover = Math.max(width / texture.naturalWidth, height / texture.naturalHeight);
      const textureWidth = texture.naturalWidth * cover;
      const textureHeight = texture.naturalHeight * cover;
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-in';
      context.drawImage(texture, (width - textureWidth) / 2, (height - textureHeight) / 2, textureWidth, textureHeight);
    } else {
      context.clearRect(0, 0, width, height);
    }

    const pointerMoving = xTo.tween.isActive() || yTo.tween.isActive() || strengthTo.tween.isActive();
    if (trail.length === 0 && !pointerMoving) {
      gsap.ticker.remove(draw);
      ticking = false;
    }
  }

  function move(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    const bounds = surface.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = (event.clientX - bounds.left) / bounds.width * width;
    const y = (event.clientY - bounds.top) / bounds.height * height;
    if (!hovered) {
      hovered = true;
      xTo(x, x);
      yTo(y, y);
      strengthTo(1);
    } else {
      xTo(x);
      yTo(y);
    }
    startDrawing();
  }

  function startDrawing() {
    if (ticking) return;
    gsap.ticker.add(draw);
    ticking = true;
  }

  function leave() {
    if (!hovered) return;
    hovered = false;
    lastStamp = undefined;
    strengthTo(0);
    startDrawing();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(surface);
  resize();
  texture.addEventListener('load', startDrawing);
  surface.addEventListener('pointermove', move);
  surface.addEventListener('pointerleave', leave);
  surface.addEventListener('pointercancel', leave);

  return () => {
    gsap.ticker.remove(draw);
    xTo.tween.kill();
    yTo.tween.kill();
    strengthTo.tween.kill();
    observer.disconnect();
    texture.removeEventListener('load', startDrawing);
    surface.removeEventListener('pointermove', move);
    surface.removeEventListener('pointerleave', leave);
    surface.removeEventListener('pointercancel', leave);
    canvas.remove();
  };
}
