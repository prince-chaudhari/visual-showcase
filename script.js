/* ============================================================
   SCRIPT.JS — Clean vanilla JS, no frameworks
   ============================================================ */

'use strict';

// ── State ─────────────────────────────────────────────────────
const state = {
  items: [],
  activeCategory: 'All',
  modal: {
    item: null,
    imgIndex: 0,
  },
};

// ── DOM References ────────────────────────────────────────────
const DOM = {
  grid:          document.getElementById('grid'),
  filterList:    document.getElementById('filter-list'),
  modalOverlay:  document.getElementById('modal-overlay'),
  modal:         document.getElementById('modal'),
  modalClose:    document.getElementById('modal-close'),
  galleryViewport: document.getElementById('gallery-viewport'),
  galleryCounter:  document.getElementById('gallery-counter'),
  dotRow:          document.getElementById('dot-row'),
  prevBtn:         document.getElementById('gallery-prev'),
  nextBtn:         document.getElementById('gallery-next'),
  modalCat:        document.getElementById('modal-cat'),
  modalTitle:      document.getElementById('modal-title'),
  modalDesc:       document.getElementById('modal-desc'),
  heroCount:       document.getElementById('hero-count'),
};

// ── Fetch Data ─────────────────────────────────────────────────
async function loadData() {
  renderSkeletons(8);
  try {
    const res = await fetch('https://raw.githubusercontent.com/prince-chaudhari/visual-showcase/refs/heads/main/data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.items = data;
    DOM.heroCount.textContent = String(data.length).padStart(2, '0');
    buildFilterTabs();
    renderGrid();
  } catch (err) {
    DOM.grid.innerHTML = `
      <div class="empty-state" role="alert">
        <p>Couldn't load items</p>
        <p>${err.message}</p>
      </div>`;
  }
}

// ── Skeletons ─────────────────────────────────────────────────
function renderSkeletons(count) {
  DOM.grid.innerHTML = Array.from({ length: count })
    .map(() => `<div class="skeleton" aria-hidden="true"></div>`)
    .join('');
}

// ── Filter Tabs ────────────────────────────────────────────────
function buildFilterTabs() {
  const categories = ['All', ...new Set(state.items.map(i => i.category))];
  DOM.filterList.innerHTML = categories.map(cat => `
    <li role="presentation">
      <button
        class="filter-btn${cat === state.activeCategory ? ' active' : ''}"
        data-category="${cat}"
        role="tab"
        aria-selected="${cat === state.activeCategory}"
      >${cat}</button>
    </li>`).join('');

  DOM.filterList.addEventListener('click', onFilterClick);
}

function onFilterClick(e) {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  const cat = btn.dataset.category;
  if (cat === state.activeCategory) return;

  state.activeCategory = cat;

  // Update ARIA + classes
  DOM.filterList.querySelectorAll('.filter-btn').forEach(b => {
    const isActive = b.dataset.category === cat;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', String(isActive));
  });

  renderGrid();
}

// ── Grid ───────────────────────────────────────────────────────
function renderGrid() {
  const filtered = state.activeCategory === 'All'
    ? state.items
    : state.items.filter(i => i.category === state.activeCategory);

  if (!filtered.length) {
    DOM.grid.innerHTML = `
      <div class="empty-state" role="status">
        <p>Nothing here yet</p>
        <p>Try a different category.</p>
      </div>`;
    return;
  }

  DOM.grid.innerHTML = filtered.map((item, idx) => createCardHTML(item, idx)).join('');

  // Stagger animation delays
  DOM.grid.querySelectorAll('.card').forEach((card, i) => {
    card.style.animationDelay = `${i * 55}ms`;
  });

  // Attach card events
  DOM.grid.querySelectorAll('.btn-details').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.closest('.card').dataset.id);
      openModal(state.items.find(i => i.id === id));
    });
  });
}

function createCardHTML(item, idx) {
  const img = item.images[0] || '';
  return `
    <article class="card" data-id="${item.id}" aria-labelledby="card-title-${item.id}">
      <div class="card-img-wrap">
        <img
          src="${img}"
          alt="${escapeHTML(item.name)}"
          loading="${idx < 3 ? 'eager' : 'lazy'}"
        />
        <span class="card-category-badge" aria-label="Category: ${escapeHTML(item.category)}">${escapeHTML(item.category)}</span>
      </div>
      <div class="card-body">
        <h2 class="card-title" id="card-title-${item.id}">${escapeHTML(item.name)}</h2>
        <p class="card-sub">${escapeHTML(item.subDescription)}</p>
        <div class="card-footer">
          <button
            class="btn-details"
            aria-label="View details for ${escapeHTML(item.name)}"
          >
            View Details
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4"/>
            </svg>
          </button>
        </div>
      </div>
    </article>`;
}

// ── Modal ──────────────────────────────────────────────────────
function openModal(item) {
  state.modal.item = item;
  state.modal.imgIndex = 0;

  populateModal(item);
  DOM.modalOverlay.classList.add('open');
  DOM.modalOverlay.removeAttribute('aria-hidden');
  DOM.modal.setAttribute('aria-label', `Details for ${item.name}`);

  // Trap focus
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => DOM.modalClose.focus());
}

function closeModal() {
  DOM.modalOverlay.classList.remove('open');
  DOM.modalOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  state.modal.item = null;
}

function populateModal(item) {
  DOM.modalCat.textContent   = item.category;
  DOM.modalTitle.textContent = item.name;
  DOM.modalDesc.textContent  = item.description;

  buildGallery(item.images);
}

// ── Gallery ────────────────────────────────────────────────────
function buildGallery(images) {
  DOM.galleryViewport.innerHTML = images.map((src, i) => `
    <img
      class="gallery-img${i === 0 ? ' active' : ''}"
      src="${src}"
      alt="Image ${i + 1}"
      loading="${i === 0 ? 'eager' : 'lazy'}"
    />`).join('');

  // Dot row
  DOM.dotRow.innerHTML = images.map((_, i) => `
    <span class="dot${i === 0 ? ' active' : ''}" aria-hidden="true"></span>`).join('');

  updateGalleryCounter();
}

function goToImage(index) {
  const { item } = state.modal;
  if (!item) return;
  const imgs = item.images;
  const count = imgs.length;

  // Wrap around
  state.modal.imgIndex = ((index % count) + count) % count;
  const i = state.modal.imgIndex;

  DOM.galleryViewport.querySelectorAll('.gallery-img').forEach((el, idx) => {
    el.classList.toggle('active', idx === i);
  });

  DOM.dotRow.querySelectorAll('.dot').forEach((dot, idx) => {
    dot.classList.toggle('active', idx === i);
  });

  updateGalleryCounter();
}

function updateGalleryCounter() {
  const { item, imgIndex } = state.modal;
  if (!item) return;
  DOM.galleryCounter.textContent = `${imgIndex + 1} / ${item.images.length}`;
}

// ── Event Listeners ────────────────────────────────────────────
DOM.modalClose.addEventListener('click', closeModal);

DOM.modalOverlay.addEventListener('click', e => {
  if (e.target === DOM.modalOverlay) closeModal();
});

DOM.prevBtn.addEventListener('click', () => {
  goToImage(state.modal.imgIndex - 1);
});

DOM.nextBtn.addEventListener('click', () => {
  goToImage(state.modal.imgIndex + 1);
});

document.addEventListener('keydown', e => {
  if (!DOM.modalOverlay.classList.contains('open')) return;
  switch (e.key) {
    case 'Escape':    closeModal(); break;
    case 'ArrowLeft': goToImage(state.modal.imgIndex - 1); break;
    case 'ArrowRight':goToImage(state.modal.imgIndex + 1); break;
  }
});

// Focus trap inside modal
DOM.modal.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const focusable = DOM.modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

// ── Util ───────────────────────────────────────────────────────
function escapeHTML(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

// ── Init ───────────────────────────────────────────────────────
loadData();
