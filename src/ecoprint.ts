import { gsap } from 'gsap';

export function mountEcoPrint(container: HTMLElement) {
  const floraBtns = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-flora-select]'));
  const mordantBtns = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-mordant-select]'));
  const cloth = container.querySelector<HTMLElement>('[data-lab-cloth]');
  const imprintStage = container.querySelector<HTMLElement>('[data-lab-imprint-stage]');
  const hammerBtn = container.querySelector<HTMLButtonElement>('[data-lab-hammer]');
  const illuminateBtn = container.querySelector<HTMLButtonElement>('[data-lab-illuminate]');
  const lanternView = container.querySelector<HTMLElement>('[data-lab-lantern]');
  const resetBtn = container.querySelector<HTMLButtonElement>('[data-lab-reset]');
  const diagnosisEl = container.querySelector<HTMLElement>('[data-lab-diagnosis]');
  const chemistryTag = container.querySelector<HTMLElement>('[data-lab-chemistry]');

  if (!cloth || !imprintStage || !hammerBtn) return;

  type FloraData = {
    id: string;
    name: string;
    baseColor: string;
    pigment: string;
    tannin: string;
    desc: string;
  };

  const floraCatalog: Record<string, FloraData> = {
    xacu: {
      id: 'xacu',
      name: 'Lá Xà Cừ',
      baseColor: '#8a6240',
      pigment: 'Tannin ngưng tụ',
      tannin: 'Tannin cao (78%)',
      desc: 'Gân lá dày và cứng. Lực gõ cơ học giải phóng tannin liên kết trực tiếp vào sợi cellulose.'
    },
    cuc: {
      id: 'cuc',
      name: 'Hoa Cúc Chuỗi Ngọc',
      baseColor: '#dca134',
      pigment: 'Flavonoid & Carotenoid',
      tannin: 'Tannin nhẹ (32%)',
      desc: 'Cánh hoa mỏng mọng nước, giải phóng sắc vàng nghệ tươi sáng ngay cú chạm đầu tiên.'
    },
    bang: {
      id: 'bang',
      name: 'Lá Bàng Non',
      baseColor: '#4f664a',
      pigment: 'Tannin & Diệp lục',
      tannin: 'Tannin đậm (65%)',
      desc: 'Búp lá non giàu tannin thực vật và diệp lục tươi, tạo sắc rêu xám khói độc đáo.'
    }
  };

  const mordantModifiers: Record<string, { tint: string; chemistry: string; name: string }> = {
    lime: { tint: '#b08456', chemistry: 'Tạo môi trường kiềm (pH ~ 9.0), tăng độ trong và kháng nấm mốc', name: 'Nước vôi trong' },
    alum: { tint: '#c99538', chemistry: 'Ion Al³⁺ tạo cầu nối chelate kim loại, khóa sắc tươi bền sáng', name: 'Phèn chua tự nhiên' },
    iron: { tint: '#3e483e', chemistry: 'Ion Fe²⁺/Fe³⁺ phản ứng phức hợp tannin hóa đen, tạo sắc rêu khói thẫm', name: 'Nước rỉ sắt dân gian' }
  };

  let selectedFlora = 'xacu';
  let selectedMordant = 'alum';
  let isExtracted = false;
  let isLanternLit = false;

  function updateVisuals() {
    const flora = floraCatalog[selectedFlora];
    const mordant = mordantModifiers[selectedMordant];
    const finalColor = selectedMordant === 'iron' 
      ? '#3b4339' 
      : (selectedMordant === 'lime' ? '#9c734b' : flora.baseColor);

    // Update active button states
    floraBtns.forEach(btn => {
      const match = btn.dataset.floraSelect === selectedFlora;
      btn.classList.toggle('is-active', match);
      btn.setAttribute('aria-pressed', String(match));
    });

    mordantBtns.forEach(btn => {
      const match = btn.dataset.mordantSelect === selectedMordant;
      btn.classList.toggle('is-active', match);
      btn.setAttribute('aria-pressed', String(match));
    });

    if (chemistryTag) {
      chemistryTag.textContent = `${flora.name} + ${mordant.name} · ${flora.pigment}`;
    }

    if (!isExtracted) {
      imprintStage.innerHTML = `
        <div class="botanical-fresh-leaf" style="--leaf-color: ${flora.baseColor}">
          <svg viewBox="0 0 120 180" class="leaf-render-svg" aria-hidden="true">
            <path class="leaf-base" d="M60 10 C30 50 15 110 60 170 C105 110 90 50 60 10 Z" fill="${flora.baseColor}" opacity="0.9" />
            <path class="leaf-main-rib" d="M60 20 L60 170" stroke="#fff" stroke-width="2.5" opacity="0.75" />
            <path class="leaf-veins" d="M60 50 L35 40 M60 75 L85 65 M60 100 L30 90 M60 125 L90 115 M60 145 L40 138" stroke="#fff" stroke-width="1.8" opacity="0.65" stroke-linecap="round" />
          </svg>
          <span class="fresh-leaf-label">Lá tươi thu hái</span>
        </div>
      `;
      gsap.fromTo('.botanical-fresh-leaf', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });
      if (diagnosisEl) {
        diagnosisEl.textContent = `${flora.desc} Nhấn "Gõ búa ép sắc tố" để bắt đầu giải phóng màu tự nhiên.`;
      }
      hammerBtn.disabled = false;
      if (illuminateBtn) illuminateBtn.hidden = true;
      if (lanternView) lanternView.hidden = true;
      cloth.hidden = false;
    } else {
      // Extracted state
      imprintStage.innerHTML = `
        <div class="botanical-stamped-imprint" style="--stamped-color: ${finalColor}">
          <svg viewBox="0 0 120 180" class="leaf-render-svg" aria-hidden="true">
            <path class="leaf-imprint" d="M60 10 C30 50 15 110 60 170 C105 110 90 50 60 10 Z" fill="${finalColor}" />
            <path class="leaf-vein-imprint" d="M60 20 L60 170 M60 50 L35 40 M60 75 L85 65 M60 100 L30 90 M60 125 L90 115" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round" />
          </svg>
          <div class="imprint-halo" style="background: radial-gradient(circle, ${finalColor}33 0%, transparent 70%);"></div>
        </div>
      `;
    }
  }

  // Handle Flora Selection
  floraBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isExtracted) return;
      const id = btn.dataset.floraSelect;
      if (id && floraCatalog[id]) {
        selectedFlora = id;
        updateVisuals();
      }
    });
  });

  // Handle Mordant Selection
  mordantBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isExtracted) return;
      const id = btn.dataset.mordantSelect;
      if (id && mordantModifiers[id]) {
        selectedMordant = id;
        updateVisuals();
      }
    });
  });

  // Hammer extraction event
  hammerBtn.addEventListener('click', () => {
    if (isExtracted) return;
    isExtracted = true;
    hammerBtn.disabled = true;

    const mordant = mordantModifiers[selectedMordant];

    // Tactile Hammer impact and cloth vibration
    const tl = gsap.timeline();
    tl.to(cloth, { scale: 0.97, y: 4, duration: 0.08, ease: 'power4.in' })
      .to(cloth, { scale: 1, y: 0, duration: 0.4, ease: 'elastic.out(1.2, 0.35)' });

    updateVisuals();

    // Pulse the stamped imprint
    gsap.fromTo('.botanical-stamped-imprint', 
      { filter: 'blur(5px) brightness(1.4)', opacity: 0.4, scale: 0.95 },
      { filter: 'blur(0px) brightness(1)', opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }
    );

    if (diagnosisEl) {
      diagnosisEl.innerHTML = `<strong>✨ Chiết xuất thành công:</strong> ${mordant.chemistry}. Thớ vải đã cố định sắc tố thảo mộc hữu cơ.`;
      gsap.fromTo(diagnosisEl, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35 });
    }

    if (illuminateBtn) {
      illuminateBtn.hidden = false;
      gsap.fromTo(illuminateBtn, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.8)' });
    }
    if (resetBtn) resetBtn.hidden = false;
  });

  // Illuminate Star Lantern event
  if (illuminateBtn && lanternView) {
    illuminateBtn.addEventListener('click', () => {
      isLanternLit = true;
      cloth.hidden = true;
      lanternView.hidden = false;

      const finalColor = selectedMordant === 'iron' 
        ? '#4a5348' 
        : (selectedMordant === 'lime' ? '#9c734b' : floraCatalog[selectedFlora].baseColor);

      lanternView.style.setProperty('--lantern-leaf-color', finalColor);

      gsap.fromTo(lanternView,
        { scale: 0.75, opacity: 0, rotate: -8 },
        { scale: 1, opacity: 1, rotate: 0, duration: 0.65, ease: 'back.out(1.4)' }
      );

      if (diagnosisEl) {
        diagnosisEl.innerHTML = `<strong>🏮 Đèn Ông Sao tỏa sáng:</strong> Vải in hoa lá thảo mộc được căng lên khung tre 5 cánh. Ánh sáng ấm áp xuyên qua gân lá như đêm rằm Trung Thu thực địa!`;
      }
      illuminateBtn.hidden = true;
    });
  }

  // Reset
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      isExtracted = false;
      isLanternLit = false;
      updateVisuals();
      if (resetBtn) resetBtn.hidden = true;
    });
  }

  // Initial render
  updateVisuals();
}
