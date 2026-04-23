/* app.js – Etkinlik single-page application */
'use strict';

// ─── Storage helpers ────────────────────────────────────────────────────────
const STORAGE_KEY = 'etkinlik_events';

function loadEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seedEvents();
  } catch {
    return seedEvents();
  }
}

function saveEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function seedEvents() {
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  const add = (days) => { const d = new Date(today); d.setDate(d.getDate() + days); return fmt(d); };

  const initial = [
    {
      id: uid(),
      title: 'Açık Hava Rock Konseri',
      category: 'Müzik',
      date: add(5),
      time: '20:00',
      location: 'Harbiye Açık Hava Tiyatrosu, İstanbul',
      description: 'Şehrin en sevilen rock gruplarının bir araya geldiği muhteşem bir açık hava konseri. Ailece katılabileceğiniz bu etkinlikte güzel bir gece sizi bekliyor.',
      capacity: 2000,
    },
    {
      id: uid(),
      title: 'Yazılım Geliştirme Zirvesi 2026',
      category: 'Teknoloji',
      date: add(12),
      time: '09:00',
      location: 'Tepekule Kongre Merkezi, İzmir',
      description: 'Modern yazılım geliştirme pratikleri, yapay zeka ve bulut mimarisi üzerine konuşmacılar ve atölye çalışmaları.',
      capacity: 500,
    },
    {
      id: uid(),
      title: 'Geleneksel Türk Mutfağı Workshopu',
      category: 'Yemek',
      date: add(8),
      time: '11:00',
      location: 'Mutfak Sanatları Merkezi, Ankara',
      description: 'Usta şeflerden geleneksel Türk yemeklerini öğrenin. Katılım ücreti malzemeleri kapsamaktadır.',
      capacity: 30,
    },
    {
      id: uid(),
      title: 'Maratonİstanbul 2026',
      category: 'Spor',
      date: add(20),
      time: '07:30',
      location: 'Sultanahmet Meydanı, İstanbul',
      description: 'İki kıtayı birbirine bağlayan eşsiz İstanbul Maratonu\'na katıl! 42 km, 21 km ve 10 km kategorileri mevcut.',
      capacity: 10000,
    },
    {
      id: uid(),
      title: 'Çağdaş Sanat Sergisi – "Renkler Konuşuyor"',
      category: 'Sanat',
      date: add(3),
      time: '10:00',
      location: 'Pera Müzesi, İstanbul',
      description: 'Türkiye\'nin önde gelen çağdaş sanatçılarının eserlerini bir arada sunan kapsamlı sergi.',
      capacity: null,
    },
  ];
  saveEvents(initial);
  return initial;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Category colours ────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  'Müzik':      '#6c63ff',
  'Spor':       '#10b981',
  'Sanat':      '#f59e0b',
  'Teknoloji':  '#3b82f6',
  'Yemek':      '#ef4444',
  'Eğitim':     '#8b5cf6',
  'Diğer':      '#6b7280',
};

function colorFor(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS['Diğer'];
}

// ─── State ──────────────────────────────────────────────────────────────────
let events = loadEvents();
let editingId = null;

// ─── DOM refs ────────────────────────────────────────────────────────────────
const listView      = document.getElementById('listView');
const detailView    = document.getElementById('detailView');
const eventGrid     = document.getElementById('eventGrid');
const emptyState    = document.getElementById('emptyState');
const searchInput   = document.getElementById('searchInput');
const categoryFilter= document.getElementById('categoryFilter');
const modalOverlay  = document.getElementById('modalOverlay');
const eventForm     = document.getElementById('eventForm');
const modalTitle    = document.getElementById('modalTitle');
const newEventBtn   = document.getElementById('newEventBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn     = document.getElementById('cancelBtn');
const backBtn       = document.getElementById('backBtn');
const logoBtn       = document.getElementById('logoBtn');

// form fields
const fieldTitle      = document.getElementById('fieldTitle');
const fieldCategory   = document.getElementById('fieldCategory');
const fieldDate       = document.getElementById('fieldDate');
const fieldTime       = document.getElementById('fieldTime');
const fieldLocation   = document.getElementById('fieldLocation');
const fieldDescription= document.getElementById('fieldDescription');
const fieldCapacity   = document.getElementById('fieldCapacity');

// ─── View helpers ────────────────────────────────────────────────────────────
function showList() {
  listView.hidden = false;
  detailView.hidden = true;
  renderGrid();
}

function showDetail(id) {
  const event = events.find((e) => e.id === id);
  if (!event) return showList();

  listView.hidden = true;
  detailView.hidden = false;
  renderDetail(event);
}

// ─── Rendering ───────────────────────────────────────────────────────────────
function filteredEvents() {
  const q   = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;
  return events.filter((e) => {
    const matchesQ   = !q || e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q);
    const matchesCat = !cat || e.category === cat;
    return matchesQ && matchesCat;
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function renderGrid() {
  const list = filteredEvents();
  eventGrid.innerHTML = '';
  emptyState.hidden = list.length > 0;

  list.forEach((event) => {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', event.title);
    card.innerHTML = `
      <div class="card-color-bar" style="background:${colorFor(event.category)}"></div>
      <div class="card-body">
        <span class="card-category">${escHtml(event.category)}</span>
        <h3 class="card-title">${escHtml(event.title)}</h3>
        <div class="card-meta">
          <span>📅 ${formatDate(event.date)} – ${escHtml(event.time)}</span>
          <span>📍 ${escHtml(event.location)}</span>
          ${event.capacity ? `<span>👥 ${event.capacity.toLocaleString('tr-TR')} kişi kapasiteli</span>` : ''}
        </div>
      </div>`;

    card.addEventListener('click', () => showDetail(event.id));
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') showDetail(event.id); });
    eventGrid.appendChild(card);
  });
}

function renderDetail(event) {
  const color = colorFor(event.category);
  document.getElementById('detailCard').innerHTML = `
    <div class="detail-color-bar" style="background:${color}"></div>
    <div class="detail-body">
      <p class="detail-category">${escHtml(event.category)}</p>
      <h2 class="detail-title">${escHtml(event.title)}</h2>
      <div class="detail-meta">
        <div class="detail-meta-item">
          <span class="icon">📅</span>
          <div><span class="label">Tarih</span><span class="value">${formatDate(event.date)}</span></div>
        </div>
        <div class="detail-meta-item">
          <span class="icon">🕐</span>
          <div><span class="label">Saat</span><span class="value">${escHtml(event.time)}</span></div>
        </div>
        <div class="detail-meta-item">
          <span class="icon">📍</span>
          <div><span class="label">Konum</span><span class="value">${escHtml(event.location)}</span></div>
        </div>
        ${event.capacity ? `
        <div class="detail-meta-item">
          <span class="icon">👥</span>
          <div><span class="label">Kapasite</span><span class="value">${event.capacity.toLocaleString('tr-TR')} kişi</span></div>
        </div>` : ''}
      </div>
      ${event.description ? `<p class="detail-description">${escHtml(event.description)}</p>` : ''}
      <div class="detail-actions">
        <button class="btn btn-primary" id="editEventBtn">✏️ Düzenle</button>
        <button class="btn btn-danger" id="deleteEventBtn">🗑️ Sil</button>
      </div>
    </div>`;

  document.getElementById('editEventBtn').addEventListener('click', () => openModal(event.id));
  document.getElementById('deleteEventBtn').addEventListener('click', () => confirmDelete(event.id));
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function openModal(id) {
  editingId = id || null;
  modalTitle.textContent = editingId ? 'Etkinliği Düzenle' : 'Yeni Etkinlik';
  clearErrors();

  if (editingId) {
    const ev = events.find((e) => e.id === editingId);
    fieldTitle.value       = ev.title;
    fieldCategory.value    = ev.category;
    fieldDate.value        = ev.date;
    fieldTime.value        = ev.time;
    fieldLocation.value    = ev.location;
    fieldDescription.value = ev.description || '';
    fieldCapacity.value    = ev.capacity || '';
  } else {
    eventForm.reset();
  }

  modalOverlay.hidden = false;
  fieldTitle.focus();
}

function closeModal() {
  modalOverlay.hidden = true;
  editingId = null;
}

// ─── Form validation & submission ────────────────────────────────────────────
function clearErrors() {
  ['Title','Category','Date','Time','Location'].forEach((f) => {
    const el = document.getElementById('err' + f);
    if (el) el.textContent = '';
  });
  [fieldTitle, fieldCategory, fieldDate, fieldTime, fieldLocation].forEach((el) => el.classList.remove('invalid'));
}

function validate() {
  clearErrors();
  let ok = true;

  const required = [
    { el: fieldTitle,    errId: 'errTitle',    msg: 'Etkinlik adı zorunludur.' },
    { el: fieldCategory, errId: 'errCategory', msg: 'Lütfen bir kategori seçin.' },
    { el: fieldDate,     errId: 'errDate',      msg: 'Tarih zorunludur.' },
    { el: fieldTime,     errId: 'errTime',      msg: 'Saat zorunludur.' },
    { el: fieldLocation, errId: 'errLocation',  msg: 'Konum zorunludur.' },
  ];

  required.forEach(({ el, errId, msg }) => {
    if (!el.value.trim()) {
      document.getElementById(errId).textContent = msg;
      el.classList.add('invalid');
      ok = false;
    }
  });

  return ok;
}

eventForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validate()) return;

  const data = {
    title:       fieldTitle.value.trim(),
    category:    fieldCategory.value,
    date:        fieldDate.value,
    time:        fieldTime.value,
    location:    fieldLocation.value.trim(),
    description: fieldDescription.value.trim(),
    capacity:    fieldCapacity.value ? parseInt(fieldCapacity.value, 10) : null,
  };

  if (editingId) {
    events = events.map((ev) => ev.id === editingId ? { ...ev, ...data } : ev);
  } else {
    events.unshift({ id: uid(), ...data });
  }

  saveEvents(events);
  closeModal();

  if (editingId) {
    showDetail(editingId);
  } else {
    showList();
  }
});

// ─── Delete ──────────────────────────────────────────────────────────────────
function confirmDelete(id) {
  const ev = events.find((e) => e.id === id);
  if (!ev) return;
  if (!window.confirm(`"${ev.title}" etkinliğini silmek istediğinize emin misiniz?`)) return;
  events = events.filter((e) => e.id !== id);
  saveEvents(events);
  showList();
}

// ─── Escape helper (XSS prevention) ─────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Event listeners ─────────────────────────────────────────────────────────
newEventBtn.addEventListener('click', () => openModal(null));
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
backBtn.addEventListener('click', showList);
logoBtn.addEventListener('click', showList);
searchInput.addEventListener('input', renderGrid);
categoryFilter.addEventListener('change', renderGrid);

// Close modal on overlay click
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modalOverlay.hidden) closeModal();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
showList();
