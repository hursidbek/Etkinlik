/**
 * Etkinlik – Event Management Application
 * Simple client-side app using localStorage for persistence.
 */

const STORAGE_KEY = 'etkinlik_events';

const categoryLabels = {
  genel:     'Genel',
  egitim:    'Eğitim',
  spor:      'Spor',
  sanat:     'Sanat & Kültür',
  teknoloji: 'Teknoloji',
  eglence:   'Eğlence',
};

// ---- State ----
let events = loadEvents();

// ---- DOM refs ----
const form          = document.getElementById('event-form');
const titleInput    = document.getElementById('event-title');
const dateInput     = document.getElementById('event-date');
const timeInput     = document.getElementById('event-time');
const locationInput = document.getElementById('event-location');
const categoryInput = document.getElementById('event-category');
const descInput     = document.getElementById('event-desc');
const eventsGrid    = document.getElementById('events-grid');
const emptyMsg      = document.getElementById('empty-msg');
const eventCount    = document.getElementById('event-count');
const searchInput   = document.getElementById('search');
const filterCategory= document.getElementById('filter-category');
const modal         = document.getElementById('modal');
const modalClose    = document.getElementById('modal-close');
const modalBody     = document.getElementById('modal-body');

// ---- Init ----
renderEvents();

// ---- Event listeners ----
form.addEventListener('submit', handleSubmit);
searchInput.addEventListener('input', renderEvents);
filterCategory.addEventListener('change', renderEvents);
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// ---- Handlers ----
function handleSubmit(e) {
  e.preventDefault();

  const newEvent = {
    id:       Date.now().toString(),
    title:    titleInput.value.trim(),
    date:     dateInput.value,
    time:     timeInput.value,
    location: locationInput.value.trim(),
    category: categoryInput.value,
    desc:     descInput.value.trim(),
  };

  events.unshift(newEvent);
  saveEvents();
  renderEvents();
  form.reset();
}

function handleDelete(e, id) {
  e.stopPropagation();
  if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;
  events = events.filter((ev) => ev.id !== id);
  saveEvents();
  renderEvents();
  closeModal();
}

function openModal(event) {
  modalBody.innerHTML = `
    <h2>${escapeHtml(event.title)}</h2>
    <span class="category-tag cat-${event.category}">${categoryLabels[event.category] || event.category}</span>
    <div style="margin-top:1rem">
      <div class="detail-row">
        <span class="detail-label">📅 Tarih</span>
        <span>${formatDate(event.date)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">🕐 Saat</span>
        <span>${event.time || '—'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">📍 Konum</span>
        <span>${escapeHtml(event.location) || '—'}</span>
      </div>
    </div>
    ${event.desc ? `<div class="detail-desc">${escapeHtml(event.desc)}</div>` : ''}
    <div style="margin-top:1.5rem">
      <button class="btn btn-danger" id="modal-delete-btn">🗑 Etkinliği Sil</button>
    </div>
  `;

  document.getElementById('modal-delete-btn').addEventListener('click', (e) => handleDelete(e, event.id));
  modal.classList.add('open');
}

function closeModal() {
  modal.classList.remove('open');
}

// ---- Render ----
function renderEvents() {
  const query    = searchInput.value.trim().toLowerCase();
  const catFilter= filterCategory.value;

  const filtered = events.filter((ev) => {
    const matchSearch   = !query || ev.title.toLowerCase().includes(query) || (ev.desc && ev.desc.toLowerCase().includes(query));
    const matchCategory = !catFilter || ev.category === catFilter;
    return matchSearch && matchCategory;
  });

  eventCount.textContent = filtered.length;

  if (filtered.length === 0) {
    eventsGrid.innerHTML = '';
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';
  eventsGrid.innerHTML = filtered.map(renderEventCard).join('');

  // Attach click listeners
  eventsGrid.querySelectorAll('.event-card').forEach((card) => {
    card.addEventListener('click', () => {
      const ev = events.find((e) => e.id === card.dataset.id);
      if (ev) openModal(ev);
    });
  });

  // Attach delete listeners
  eventsGrid.querySelectorAll('.btn-danger').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.closest('.event-card').dataset.id;
      handleDelete(e, id);
    });
  });
}

function renderEventCard(ev) {
  return `
    <div class="event-card" data-id="${ev.id}" role="button" tabindex="0" aria-label="${escapeHtml(ev.title)} etkinliğini görüntüle">
      <div class="event-card-header">
        <h3>${escapeHtml(ev.title)}</h3>
        <span class="category-tag cat-${ev.category}">${categoryLabels[ev.category] || ev.category}</span>
      </div>
      <div class="event-meta">
        ${ev.date ? `<span>📅 ${formatDate(ev.date)}</span>` : ''}
        ${ev.time ? `<span>🕐 ${ev.time}</span>` : ''}
        ${ev.location ? `<span>📍 ${escapeHtml(ev.location)}</span>` : ''}
      </div>
      <div class="event-card-footer">
        <button class="btn btn-danger">🗑 Sil</button>
      </div>
    </div>
  `;
}

// ---- Persistence ----
function loadEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

// ---- Helpers ----
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
