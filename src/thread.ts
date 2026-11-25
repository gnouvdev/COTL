import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type Point = { x: number; y: number };
type TrackSample = { x: number; y: number; tx: number; ty: number; nx: number; ny: number; dist: number };

export function mountThread(track: HTMLElement) {
  const canvas = document.createElement('canvas');
  const drawing = canvas.getContext('2d');
  if (!drawing) return;
  const context = drawing;
  canvas.className = 'thread-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  track.prepend(canvas);

  let points: Point[] = [];
  let samples: TrackSample[] = [];
  let totalTrackLength = 0;
  let viewportWidth = 0;
  let viewportHeight = 0;
  let ratio = 1;
  let frame = 0;
  let animation: gsap.core.Tween | undefined;
  const state = { reveal: 0 };

  function buildArcLengthSamples() {
    samples = [];
    totalTrackLength = 0;
    if (points.length < 2) return;

    const raw: Point[] = [];
    const [first, ...rest] = points;
    let prev = first;
    for (const next of rest) {
      const bend = (next.y - prev.y) * 0.52;
      const steps = Math.max(18, Math.ceil(Math.hypot(next.x - prev.x, next.y - prev.y) / 8));
      for (let i = 0; i <= steps; i++) {
        if (raw.length > 0 && i === 0) continue;
        const t = i / steps;
        const mt = 1 - t;
        const x =
          mt * mt * mt * prev.x +
          3 * mt * mt * t * prev.x +
          3 * mt * t * t * next.x +
          t * t * t * next.x;
        const y =
          mt * mt * mt * prev.y +
          3 * mt * mt * t * (prev.y + bend) +
          3 * mt * t * t * (next.y - bend) +
          t * t * t * next.y;
        raw.push({ x, y });
      }
      prev = next;
    }

    let accDist = 0;
    for (let i = 0; i < raw.length; i++) {
      if (i > 0) {
        accDist += Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y);
      }
      const pPrev = raw[Math.max(0, i - 1)];
      const pNext = raw[Math.min(raw.length - 1, i + 1)];
      const dx = pNext.x - pPrev.x;
      const dy = pNext.y - pPrev.y;
      const len = Math.hypot(dx, dy) || 1;
      const tx = dx / len;
      const ty = dy / len;
      samples.push({
        x: raw[i].x,
        y: raw[i].y,
        tx,
        ty,
        nx: -ty,
        ny: tx,
        dist: accDist,
      });
    }
    totalTrackLength = accDist;
  }

  function drawRailsAndTies(subset: TrackSample[], scrollTop: number, isActive: boolean) {
    if (subset.length < 2) return;
    const railOffset = 4.2;
    const tieHalfWidth = 7.2;

    context.save();
    // 1. Wooden Sleepers / Ties (Thanh tà vẹt ngang) spaced every ~11px of arc length
    context.strokeStyle = isActive ? 'rgba(145, 88, 60, 0.62)' : 'rgba(145, 88, 60, 0.2)';
    context.lineWidth = isActive ? 2.1 : 1.5;
    context.lineCap = 'butt';
    let nextTieDist = Math.ceil(subset[0].dist / 11) * 11;
    context.beginPath();
    for (const s of subset) {
      if (s.dist >= nextTieDist) {
        const vy = s.y - scrollTop;
        if (vy >= -24 && vy <= viewportHeight + 24) {
          context.moveTo(s.x - s.nx * tieHalfWidth, vy - s.ny * tieHalfWidth);
          context.lineTo(s.x + s.nx * tieHalfWidth, vy + s.ny * tieHalfWidth);
        }
        nextTieDist += 11;
      }
    }
    context.stroke();

    // 2. Left & Right Parallel Steel/Brass Rails (Hai thanh ray song song)
    context.strokeStyle = isActive ? 'rgba(31, 48, 72, 0.88)' : 'rgba(110, 88, 68, 0.28)';
    context.lineWidth = isActive ? 1.65 : 1.15;
    context.lineJoin = 'round';
    for (const side of [-1, 1]) {
      context.beginPath();
      let started = false;
      for (const s of subset) {
        const vy = s.y - scrollTop;
        if (vy < -40 || vy > viewportHeight + 40) {
          started = false;
          continue;
        }
        const rx = s.x + s.nx * railOffset * side;
        const ry = vy + s.ny * railOffset * side;
        if (!started) {
          context.moveTo(rx, ry);
          started = true;
        } else {
          context.lineTo(rx, ry);
        }
      }
      context.stroke();
    }

    // Highlight inner brass sheen on active rails
    if (isActive) {
      context.strokeStyle = 'rgba(228, 189, 104, 0.55)';
      context.lineWidth = 0.7;
      for (const side of [-1, 1]) {
        context.beginPath();
        let started = false;
        for (const s of subset) {
          const vy = s.y - scrollTop;
          if (vy < -40 || vy > viewportHeight + 40) {
            started = false;
            continue;
          }
          const rx = s.x + s.nx * (railOffset - 0.8) * side;
          const ry = vy + s.ny * (railOffset - 0.8) * side;
          if (!started) {
            context.moveTo(rx, ry);
            started = true;
          } else {
            context.lineTo(rx, ry);
          }
        }
        context.stroke();
      }
    }
    context.restore();
  }

  function drawLocomotive(tip: TrackSample, scrollTop: number, fullSamples: TrackSample[], tipIndex: number) {
    const vy = tip.y - scrollTop;
    if (vy < -40 || vy > viewportHeight + 40) return;

    // Angle so +Y local points forward along tangent (tx, ty)
    const angle = Math.atan2(tip.ty, tip.tx) - Math.PI / 2;

    context.save();
    context.translate(tip.x, vy);
    context.rotate(angle);

    // 1. Warm Golden Headlight Beam Cone shining forward (+Y)
    const beamGrad = context.createLinearGradient(0, 14, 0, 48);
    beamGrad.addColorStop(0, 'rgba(228, 189, 104, 0.58)');
    beamGrad.addColorStop(1, 'rgba(228, 189, 104, 0)');
    context.fillStyle = beamGrad;
    context.beginPath();
    context.moveTo(-2.5, 13);
    context.lineTo(-12, 48);
    context.lineTo(12, 48);
    context.lineTo(2.5, 13);
    context.closePath();
    context.fill();

    // Drop shadow under locomotive
    context.shadowColor = 'rgba(20, 28, 36, 0.35)';
    context.shadowBlur = 8;
    context.shadowOffsetY = 3;

    // 2. Brass Cowcatcher (Lưới gạt mũi tàu phía trước +Y)
    context.fillStyle = '#c28847';
    context.beginPath();
    context.moveTo(-6, 10);
    context.lineTo(0, 17);
    context.lineTo(6, 10);
    context.closePath();
    context.fill();

    // 3. Main Cylindrical Boiler Body (Thân đầu máy thép chàm)
    context.fillStyle = '#1f3048';
    context.beginPath();
    context.roundRect(-6.2, -13, 12.4, 24, 3);
    context.fill();

    // 4. Terracotta Engineer Cab Roof at rear (-Y)
    context.shadowBlur = 0;
    context.shadowOffsetY = 0;
    context.fillStyle = '#91583c';
    context.beginPath();
    context.roundRect(-7.2, -15, 14.4, 9.5, 2);
    context.fill();

    // Brass Boiler Bands
    context.strokeStyle = '#e4bd68';
    context.lineWidth = 1.2;
    context.beginPath();
    context.moveTo(-6, -1);
    context.lineTo(6, -1);
    context.moveTo(-6, 5);
    context.lineTo(6, 5);
    context.stroke();

    // Smokestack / Chimney near front (+Y)
    context.fillStyle = '#131d2b';
    context.beginPath();
    context.arc(0, 8, 2.8, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#e4bd68';
    context.lineWidth = 0.9;
    context.stroke();

    // Glowing Front Headlight Lamp
    context.fillStyle = '#fff6d6';
    context.beginPath();
    context.arc(0, 12.5, 1.9, 0, Math.PI * 2);
    context.fill();

    context.restore();

    // 5. Soft Drifting Steam Puffs trailing behind the chimney along the track
    for (let p = 1; p <= 3; p++) {
      const backIdx = Math.max(0, tipIndex - p * 3);
      const sp = fullSamples[backIdx];
      if (!sp) continue;
      const svy = sp.y - scrollTop;
      const drift = Math.sin(scrollTop * 0.03 + p * 1.7) * (2.5 + p * 1.2);
      context.save();
      context.fillStyle = `rgba(255, 252, 246, ${0.52 - p * 0.13})`;
      context.strokeStyle = `rgba(145, 88, 60, ${0.18 - p * 0.04})`;
      context.lineWidth = 0.7;
      context.beginPath();
      context.arc(sp.x + sp.nx * drift, svy + sp.ny * drift, 2.6 + p * 1.5, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.restore();
    }
  }

  function paint() {
    frame = 0;
    if (samples.length < 2 || totalTrackLength <= 0) return;
    const scrollTop = window.scrollY;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, viewportWidth, viewportHeight);

    // 1. Draw full unvisited guide railway track
    drawRailsAndTies(samples, scrollTop, false);

    // 2. Determine train position along the railway based on scroll viewport center
    const targetY = scrollTop + viewportHeight * 0.5;
    let activeIdx = 0;
    for (let i = 0; i < samples.length; i++) {
      if (samples[i].y <= targetY) activeIdx = i;
      else break;
    }
    activeIdx = Math.max(1, activeIdx);

    const activeSubset = samples.slice(0, activeIdx + 1);
    drawRailsAndTies(activeSubset, scrollTop, true);

    // 3. Station rings on passed [data-thread-node] stops
    const tipY = samples[activeIdx].y;
    points.forEach((pt, idx) => {
      // Only draw station ring on primary node points (even indices in our measure pair, or actual nodes)
      if (idx % 2 === 1) return;
      const vy = pt.y - scrollTop;
      if (vy >= -24 && vy <= viewportHeight + 24 && pt.y <= tipY + 8) {
        context.save();
        context.strokeStyle = 'rgba(145, 88, 60, 0.45)';
        context.lineWidth = 1.4;
        context.beginPath();
        context.arc(pt.x, vy, 11, 0, Math.PI * 2);
        context.stroke();
        context.restore();
      }
    });

    // 4. Draw the Vintage Steam Locomotive at the leading tip
    drawLocomotive(samples[activeIdx], scrollTop, samples, activeIdx);
  }

  function schedulePaint() {
    if (!frame) frame = requestAnimationFrame(paint);
  }

  function measure() {
    const { scrollY, innerHeight } = window;
    const width = document.documentElement.clientWidth;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    if (width !== viewportWidth || innerHeight !== viewportHeight || ratio !== pixelRatio) {
      viewportWidth = width;
      viewportHeight = innerHeight;
      ratio = pixelRatio;
      canvas.width = Math.round(viewportWidth * ratio);
      canvas.height = Math.round(viewportHeight * ratio);
    }
    const liveNodes = Array.from(track.querySelectorAll<HTMLElement>('[data-thread-node]')).filter(
      (n) => n.offsetParent !== null
    );
    points = liveNodes.flatMap((node) => {
      const bounds = node.getBoundingClientRect();
      const point = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 + scrollY };
      const chapter = node.closest('.chapter-copy, .pilot-copy, .land-copy');
      if (!chapter) return [point, { x: point.x, y: point.y + 1 }];
      const exit = chapter.getBoundingClientRect().bottom + scrollY + 16;
      return [point, { x: point.x, y: exit }];
    });
    buildArcLengthSamples();
    schedulePaint();
  }

  const observer = new ResizeObserver(measure);
  observer.observe(track);
  window.addEventListener('scroll', schedulePaint, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  void document.fonts.ready.then(measure);
  ScrollTrigger.addEventListener('refresh', measure);
  measure();

  return (animated: boolean) => {
    animation?.scrollTrigger?.kill();
    animation?.kill();
    state.reveal = animated ? 1 : 1;
    measure();
  };
}
