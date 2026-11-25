import L from 'leaflet';
import { gsap } from 'gsap';

export function mountAtlas(container: HTMLElement) {
  const mapElement = container.querySelector<HTMLElement>('#real-vietnam-map');
  const tabs = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-atlas-tab]'));
  const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-atlas-card]'));
  const resetBtn = container.querySelector<HTMLButtonElement>('[data-atlas-overview]');

  if (!mapElement || !cards.length) return;

  // Real geographic coordinates for the 4 craft sites
  const sitesData: Record<string, { coords: [number, number]; zoom: number; label: string; tag: string; color: string }> = {
    'lung-tam': { coords: [23.0805, 105.0345], zoom: 11, label: 'Lùng Tám', tag: 'HG', color: '#2b5876' },
    'co-tu': { coords: [15.8672, 107.8340], zoom: 11, label: 'Cơ Tu', tag: 'QN', color: '#91583c' },
    'xi-thoai': { coords: [13.4350, 108.9320], zoom: 11, label: 'Xí Thoại', tag: 'PY', color: '#c28847' },
    'an-giang': { coords: [10.7850, 105.1480], zoom: 11, label: 'Tân Châu', tag: 'AG', color: '#7a4e69' },
  };

  const overviewCenter: [number, number] = [16.4, 107.0];
  const overviewZoom = 6;

  // Initialize Leaflet Map
  const map = L.map(mapElement, {
    center: overviewCenter,
    zoom: overviewZoom,
    scrollWheelZoom: false, // Prevent intercepting page scroll
    zoomControl: true,
    attributionControl: false
  });

  // Real Topographic & Terrain Layer (Esri World Topo Map - No API key needed)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: 'Esri, USGS'
  }).addTo(map);

  const markers: Record<string, L.Marker> = {};

  // Create custom artisanal markers
  Object.entries(sitesData).forEach(([id, data]) => {
    const customIcon = L.divIcon({
      className: 'craft-leaflet-marker',
      html: `
        <div class="marker-seal" style="--seal-color: ${data.color}">
          <span class="marker-pulse"></span>
          <span class="marker-core">${data.tag}</span>
          <span class="marker-title">${data.label}</span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker(data.coords, { icon: customIcon }).addTo(map);
    markers[id] = marker;

    marker.on('click', () => {
      selectSite(id);
    });
  });

  let currentSiteId = 'lung-tam';

  function selectSite(id: string, fly = true) {
    if (!sitesData[id]) return;
    currentSiteId = id;
    const target = sitesData[id];

    if (fly) {
      map.flyTo(target.coords, target.zoom, {
        duration: 1.4,
        easeLinearity: 0.25
      });
    }

    // Update active marker styling
    Object.entries(markers).forEach(([sId, m]) => {
      const el = m.getElement();
      if (el) el.classList.toggle('is-active', sId === id);
    });

    // Update navigation tabs
    tabs.forEach((tab) => {
      const match = tab.dataset.atlasTab === id;
      tab.classList.toggle('is-active', match);
      tab.setAttribute('aria-pressed', String(match));
    });

    // Animate Card with high-impact editorial reveal
    cards.forEach((card) => {
      const match = card.dataset.atlasCard === id;
      if (match) {
        card.hidden = false;
        gsap.fromTo(card,
          { opacity: 0, y: 20, filter: 'blur(6px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out' }
        );
        const mainImg = card.querySelector('.dossier-hero-img');
        if (mainImg) {
          gsap.fromTo(mainImg, { scale: 1.06 }, { scale: 1, duration: 0.7, ease: 'power2.out' });
        }
      } else {
        card.hidden = true;
      }
    });
  }

  // Bind tab click events
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.atlasTab;
      if (id) selectSite(id);
    });
  });

  // Overview reset button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      map.flyTo(overviewCenter, overviewZoom, { duration: 1.4 });
      Object.values(markers).forEach((m) => {
        m.getElement()?.classList.remove('is-active');
      });
    });
  }

  // Interactive Gallery inside Cards
  cards.forEach((card) => {
    const mainImg = card.querySelector<HTMLImageElement>('.dossier-hero-img');
    const thumbs = Array.from(card.querySelectorAll<HTMLButtonElement>('[data-thumb-img]'));
    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const src = thumb.dataset.thumbImg;
        if (mainImg && src) {
          gsap.to(mainImg, { opacity: 0.3, duration: 0.15, onComplete: () => {
            mainImg.src = src;
            gsap.to(mainImg, { opacity: 1, duration: 0.25 });
          }});
          thumbs.forEach(t => t.classList.toggle('is-active', t === thumb));
        }
      });
    });
  });

  // Initial select
  selectSite(currentSiteId, false);
}
