// =====================================================================
//  Mini Constructor de Landings
//  Estado: { theme: {...}, sections: [{ id, type, ...campos }] }
// =====================================================================

const STORAGE_KEY = 'landing-config-v2';
const LEGACY_KEY = 'landing-config'; // versión anterior (solo un título y tema)

// ====== Definición de los tipos de sección ======
// Para crear un tipo nuevo: agrega su definición aquí y su función en RENDERERS.
const SECTION_TYPES = {
  hero: {
    label: 'Hero',
    defaults: {
      title: 'Impulsa tu negocio digital hoy',
      subtitle: 'Diseña, personaliza y convierte con una estructura optimizada para agencias y creadores.',
      buttonText: 'Empezar Ahora',
      buttonLink: '#',
      image: '',
    },
    fields: [
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
      { key: 'buttonText', label: 'Texto del botón (vacío = sin botón)', type: 'text' },
      { key: 'buttonLink', label: 'Enlace del botón', type: 'text', placeholder: 'https://…' },
      { key: 'image', label: 'Imagen de fondo (opcional)', type: 'image' },
    ],
  },
  banner: {
    label: 'Banner',
    defaults: {
      text: '🎉 Oferta de lanzamiento: 20% de descuento esta semana',
      buttonText: 'Aprovechar',
      buttonLink: '#',
      variant: 'primary',
    },
    fields: [
      { key: 'text', label: 'Mensaje', type: 'text' },
      { key: 'buttonText', label: 'Texto del botón (vacío = sin botón)', type: 'text' },
      { key: 'buttonLink', label: 'Enlace del botón', type: 'text', placeholder: 'https://…' },
      {
        key: 'variant',
        label: 'Estilo',
        type: 'select',
        options: [
          ['primary', 'Color primario'],
          ['dark', 'Oscuro'],
          ['light', 'Claro'],
        ],
      },
    ],
  },
  image: {
    label: 'Imagen',
    defaults: { image: '', alt: '', caption: '', fit: 'original' },
    fields: [
      { key: 'image', label: 'Imagen', type: 'image' },
      { key: 'alt', label: 'Texto alternativo (accesibilidad)', type: 'text' },
      { key: 'caption', label: 'Pie de foto (opcional)', type: 'text' },
      {
        key: 'fit',
        label: 'Formato',
        type: 'select',
        options: [
          ['original', 'Proporción original'],
          ['wide', 'Panorámica (recortada)'],
        ],
      },
    ],
  },
  imageText: {
    label: 'Imagen + texto',
    defaults: {
      title: 'Una propuesta clara',
      text: 'Cuenta en pocas líneas qué haces y por qué tus clientes deberían elegirte.',
      image: '',
      imagePosition: 'left',
      buttonText: '',
      buttonLink: '#',
    },
    fields: [
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'text', label: 'Texto', type: 'textarea' },
      { key: 'image', label: 'Imagen', type: 'image' },
      {
        key: 'imagePosition',
        label: 'Posición de la imagen',
        type: 'select',
        options: [
          ['left', 'Izquierda'],
          ['right', 'Derecha'],
        ],
      },
      { key: 'buttonText', label: 'Texto del botón (vacío = sin botón)', type: 'text' },
      { key: 'buttonLink', label: 'Enlace del botón', type: 'text', placeholder: 'https://…' },
    ],
  },
};

// ====== Utilidades ======
function newId() {
  return `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function createSection(type, overrides = {}) {
  return { id: newId(), type, ...SECTION_TYPES[type].defaults, ...overrides };
}

// Solo se aceptan imágenes http(s) o subidas (data:image) para evitar URLs peligrosas
function safeImageSrc(src) {
  return typeof src === 'string' && /^(https?:\/\/|data:image\/)/i.test(src.trim()) ? src.trim() : '';
}

function safeLink(href) {
  return typeof href === 'string' && /^(https?:\/\/|mailto:|tel:|#)/i.test(href.trim()) ? href.trim() : '#';
}

function pick(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function str(value) {
  return typeof value === 'string' ? value : '';
}

// Crea un elemento; el texto se asigna con textContent (nunca innerHTML)
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Devuelve blanco u oscuro según la luminosidad del color de fondo
function getContrastColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#111827' : '#ffffff';
}

// Lee una imagen, la reduce (máx. 1400px) y la devuelve como data URL
// para que ocupe poco espacio en localStorage
function fileToDataUrl(file, maxSize = 1400) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no válido'));
      img.onload = () => {
        const w = img.naturalWidth || 1200;
        const h = img.naturalHeight || 800;
        const scale = Math.min(1, maxSize / Math.max(w, h));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext('2d');
        const keepAlpha = file.type === 'image/png';
        if (!keepAlpha) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL(keepAlpha ? 'image/png' : 'image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ====== Estado ======
function defaultState() {
  return {
    theme: { primaryColor: '#3b43b5', borderRadius: '12px' },
    sections: [createSection('hero'), createSection('banner')],
  };
}

function normalizeState(raw) {
  const base = defaultState();
  const theme = { ...base.theme, ...(raw && raw.theme) };
  if (!/^#[0-9a-f]{6}$/i.test(theme.primaryColor)) theme.primaryColor = base.theme.primaryColor;

  const sections = Array.isArray(raw && raw.sections)
    ? raw.sections
        .filter((s) => s && SECTION_TYPES[s.type])
        .map((s) => ({ ...SECTION_TYPES[s.type].defaults, ...s, id: s.id || newId() }))
    : base.sections;

  return { theme, sections };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeState(JSON.parse(raw));

    // Migración desde la versión anterior (un solo hero con título)
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy);
      return normalizeState({
        theme: { primaryColor: old.primaryColor, borderRadius: old.borderRadius },
        sections: [createSection('hero', old.brandTitle ? { title: old.brandTitle } : {}), createSection('banner')],
      });
    }
  } catch {
    // datos corruptos o localStorage no disponible: usamos los valores por defecto
  }
  return defaultState();
}

let state = loadState();
let selectedId = null; // sección abierta en el editor

// ====== Referencias al DOM ======
const sidebar = document.querySelector('.sidebar');
const sectionList = document.getElementById('sectionList');
const preview = document.getElementById('preview');
const newSectionType = document.getElementById('newSectionType');
const addSectionBtn = document.getElementById('addSectionBtn');
const resetBtn = document.getElementById('resetBtn');
const saveStatus = document.getElementById('saveStatus');
const rootStyles = document.documentElement.style;

// ====== Persistencia ======
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveStatus.textContent = '';
  } catch {
    saveStatus.textContent =
      '⚠ No se pudo guardar: las imágenes pesan demasiado. Usa URLs o imágenes más pequeñas.';
  }
}

// ====== Tema ======
function applyTheme() {
  rootStyles.setProperty('--color-primary', state.theme.primaryColor);
  rootStyles.setProperty('--color-primary-text', getContrastColor(state.theme.primaryColor));
  rootStyles.setProperty('--radius-box', state.theme.borderRadius);
}

function syncThemeControls() {
  Object.keys(state.theme).forEach((key) => {
    const control = document.getElementById(key);
    if (control && control.value !== state.theme[key]) control.value = state.theme[key];
  });
}

// ====== Renderizado de la vista previa ======
function placeholder(text = 'Sin imagen: sube una o pega una URL') {
  return el('div', 'image-placeholder', text);
}

function renderButton(section, className) {
  const label = str(section.buttonText).trim();
  if (!label) return null;
  const a = el('a', className, label);
  a.href = safeLink(section.buttonLink);
  return a;
}

const RENDERERS = {
  hero(s) {
    const node = el('section', 'section section-hero');
    const src = safeImageSrc(s.image);
    if (src) {
      node.classList.add('has-image');
      const bg = el('div', 'hero-bg');
      const img = el('img');
      img.src = src;
      img.alt = '';
      bg.append(img, el('div', 'hero-overlay'));
      node.append(bg);
    }
    const content = el('div', 'hero-content');
    content.append(el('h1', null, str(s.title).trim() || 'Tu título aquí'));
    if (str(s.subtitle).trim()) content.append(el('p', null, s.subtitle));
    const btn = renderButton(s, 'btn-primary');
    if (btn) content.append(btn);
    node.append(content);
    return node;
  },

  banner(s) {
    const variant = pick(s.variant, ['primary', 'dark', 'light'], 'primary');
    const node = el('section', `section section-banner banner-${variant}`);
    node.append(el('p', 'banner-text', str(s.text).trim() || 'Mensaje del banner'));
    const btn = renderButton(s, variant === 'primary' ? 'btn-inverse' : 'btn-primary');
    if (btn) node.append(btn);
    return node;
  },

  image(s) {
    const node = el('figure', 'section section-image');
    const src = safeImageSrc(s.image);
    if (src) {
      const img = el('img');
      img.src = src;
      img.alt = str(s.alt);
      if (pick(s.fit, ['original', 'wide'], 'original') === 'wide') img.classList.add('is-wide');
      node.append(img);
    } else {
      node.append(placeholder());
    }
    if (str(s.caption).trim()) node.append(el('figcaption', null, s.caption));
    return node;
  },

  imageText(s) {
    const reversed = pick(s.imagePosition, ['left', 'right'], 'left') === 'right';
    const node = el('section', 'section section-imagetext' + (reversed ? ' is-reversed' : ''));

    const media = el('div', 'imagetext-media');
    const src = safeImageSrc(s.image);
    if (src) {
      const img = el('img');
      img.src = src;
      img.alt = str(s.title);
      media.append(img);
    } else {
      media.append(placeholder());
    }

    const body = el('div', 'imagetext-body');
    body.append(el('h2', null, str(s.title).trim() || 'Tu título aquí'));
    if (str(s.text).trim()) body.append(el('p', null, s.text));
    const btn = renderButton(s, 'btn-primary');
    if (btn) body.append(btn);

    node.append(media, body);
    return node;
  },
};

function renderPreview() {
  preview.replaceChildren();

  if (state.sections.length === 0) {
    preview.append(el('p', 'empty-state', 'Tu página está vacía. Agrega una sección desde el panel izquierdo.'));
    return;
  }

  state.sections.forEach((section) => {
    const node = RENDERERS[section.type](section);
    node.dataset.id = section.id;
    if (section.id === selectedId) node.classList.add('is-selected');
    preview.append(node);
  });
}

// ====== Editor de secciones (panel lateral) ======
function buildField(section, field) {
  const group = el('div', 'control-group');
  const inputId = `f-${section.id}-${field.key}`;
  const value = str(section[field.key]);

  const label = el('label', null, field.label);
  label.htmlFor = inputId;
  group.append(label);

  if (field.type === 'select') {
    const select = el('select');
    field.options.forEach(([val, text]) => {
      const opt = el('option', null, text);
      opt.value = val;
      select.append(opt);
    });
    select.value = value;
    select.id = inputId;
    select.dataset.key = field.key;
    group.append(select);
  } else if (field.type === 'textarea') {
    const area = el('textarea');
    area.rows = 3;
    area.value = value;
    area.id = inputId;
    area.dataset.key = field.key;
    group.append(area);
  } else if (field.type === 'image') {
    const uploaded = value.startsWith('data:');

    const thumb = el('img', 'thumb');
    thumb.alt = 'Miniatura';
    const src = safeImageSrc(value);
    if (src) thumb.src = src;
    else thumb.hidden = true;

    const url = el('input');
    url.type = 'text';
    url.id = inputId;
    url.value = uploaded ? '' : value;
    url.placeholder = uploaded ? 'Imagen subida (pega una URL para reemplazarla)' : 'https://… (URL de la imagen)';
    url.dataset.key = field.key;
    url.dataset.imageUrl = '1';

    const file = el('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.dataset.key = field.key;
    file.setAttribute('aria-label', `${field.label}: subir archivo`);

    const remove = el('button', 'btn-small', 'Quitar imagen');
    remove.type = 'button';
    remove.dataset.action = 'remove-image';
    remove.dataset.key = field.key;

    group.append(thumb, url, file, remove);
  } else {
    const input = el('input');
    input.type = 'text';
    input.value = value;
    input.id = inputId;
    input.dataset.key = field.key;
    if (field.placeholder) input.placeholder = field.placeholder;
    group.append(input);
  }

  return group;
}

function iconButton(action, symbol, label, disabled = false) {
  const btn = el('button', 'icon-btn', symbol);
  btn.type = 'button';
  btn.dataset.action = action;
  btn.setAttribute('aria-label', label);
  btn.title = label;
  btn.disabled = disabled;
  return btn;
}

function renderSectionList() {
  sectionList.replaceChildren();

  if (state.sections.length === 0) {
    sectionList.append(el('p', 'hint', 'Aún no hay secciones.'));
    return;
  }

  state.sections.forEach((section, i) => {
    const def = SECTION_TYPES[section.type];
    const isOpen = section.id === selectedId;

    const item = el('div', 'section-item' + (isOpen ? ' open' : ''));
    item.dataset.id = section.id;

    const head = el('div', 'section-head');
    const toggle = el('button', 'section-toggle', `${i + 1}. ${def.label}`);
    toggle.type = 'button';
    toggle.dataset.action = 'toggle';
    toggle.setAttribute('aria-expanded', String(isOpen));

    const summary = str(section.title || section.text || section.caption).trim();
    if (summary) toggle.append(el('span', 'section-summary', ` · ${summary}`));

    head.append(
      toggle,
      iconButton('up', '↑', 'Subir sección', i === 0),
      iconButton('down', '↓', 'Bajar sección', i === state.sections.length - 1),
      iconButton('delete', '✕', 'Eliminar sección'),
    );
    item.append(head);

    if (isOpen) {
      const editor = el('div', 'section-editor');
      def.fields.forEach((field) => editor.append(buildField(section, field)));
      item.append(editor);
    }

    sectionList.append(item);
  });
}

// ====== Acciones ======
function commit() {
  renderPreview();
  saveState();
}

function renderAll() {
  applyTheme();
  syncThemeControls();
  renderSectionList();
  renderPreview();
  saveState();
}

function selectSection(id) {
  selectedId = id;
  renderSectionList();
  renderPreview();
  const open = sectionList.querySelector('.section-item.open');
  if (open) open.scrollIntoView({ block: 'nearest' });
}

function updateThumb(group, value) {
  const thumb = group.querySelector('.thumb');
  if (!thumb) return;
  const src = safeImageSrc(value);
  if (src) {
    thumb.src = src;
    thumb.hidden = false;
  } else {
    thumb.hidden = true;
    thumb.removeAttribute('src');
  }
}

function findSection(id) {
  return state.sections.find((s) => s.id === id);
}

// ====== Eventos ======
// Cambios en controles (tema y campos de sección) — un solo listener para todo
sidebar.addEventListener('input', (e) => {
  const t = e.target;
  if (t.type === 'file') return; // los archivos se procesan en 'change'

  // Controles de tema
  if (Object.hasOwn(state.theme, t.id)) {
    state.theme[t.id] = t.value;
    applyTheme();
    saveState();
    return;
  }

  // Campos de una sección
  const key = t.dataset.key;
  const item = t.closest('.section-item');
  if (!key || !item) return;
  const section = findSection(item.dataset.id);
  if (!section) return;

  section[key] = t.value;
  if (t.dataset.imageUrl) updateThumb(t.closest('.control-group'), t.value);
  commit();
});

// Subida de imágenes desde el equipo
sidebar.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.type !== 'file' || !t.files[0]) return;

  const id = t.closest('.section-item')?.dataset.id;
  const key = t.dataset.key;
  try {
    const dataUrl = await fileToDataUrl(t.files[0]);
    const section = findSection(id);
    if (!section) return;
    section[key] = dataUrl;
    renderSectionList();
    commit();
  } catch (err) {
    saveStatus.textContent = `⚠ ${err.message}`;
  }
});

// Botones de la lista de secciones
sectionList.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn || btn.disabled) return;
  const id = btn.closest('.section-item').dataset.id;
  const index = state.sections.findIndex((s) => s.id === id);
  if (index < 0) return;

  switch (btn.dataset.action) {
    case 'toggle':
      selectSection(selectedId === id ? null : id);
      break;
    case 'up':
    case 'down': {
      const target = btn.dataset.action === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= state.sections.length) return;
      [state.sections[index], state.sections[target]] = [state.sections[target], state.sections[index]];
      renderSectionList();
      commit();
      break;
    }
    case 'delete':
      if (!confirm('¿Eliminar esta sección?')) return;
      state.sections.splice(index, 1);
      if (selectedId === id) selectedId = null;
      renderSectionList();
      commit();
      break;
    case 'remove-image':
      state.sections[index][btn.dataset.key] = '';
      renderSectionList();
      commit();
      break;
  }
});

addSectionBtn.addEventListener('click', () => {
  const section = createSection(newSectionType.value);
  state.sections.push(section);
  selectedId = section.id;
  renderSectionList();
  commit();
  const open = sectionList.querySelector('.section-item.open');
  if (open) open.scrollIntoView({ block: 'nearest' });
  preview.querySelector(`[data-id="${section.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Clic en la vista previa: selecciona la sección (y evita salir de la página por los enlaces)
preview.addEventListener('click', (e) => {
  if (e.target.closest('a')) e.preventDefault();
  const node = e.target.closest('.section');
  if (node) selectSection(node.dataset.id);
});

resetBtn.addEventListener('click', () => {
  if (!confirm('¿Restablecer todo? Se perderán tus secciones e imágenes.')) return;
  state = defaultState();
  selectedId = null;
  renderAll();
});

// ====== Inicio ======
Object.entries(SECTION_TYPES).forEach(([type, def]) => {
  const opt = el('option', null, def.label);
  opt.value = type;
  newSectionType.append(opt);
});

renderAll();
