// ====== Configuración por defecto y estado central ======
const STORAGE_KEY = 'landing-config';

const defaults = {
  primaryColor: '#3b43b5',
  borderRadius: '12px',
  brandTitle: 'Impulsa tu negocio digital hoy',
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    // Mezclamos con defaults por si se agregan controles nuevos después
    return { ...defaults, ...saved };
  } catch {
    return { ...defaults };
  }
}

let state = loadState();

// ====== Referencias al DOM ======
const sidebar = document.querySelector('.sidebar');
const previewTitle = document.getElementById('previewTitle');
const resetBtn = document.getElementById('resetBtn');
const rootStyles = document.documentElement.style;

// ====== Utilidades ======
// Devuelve blanco o negro según la luminosidad del color de fondo
function getContrastColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#111827' : '#ffffff';
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage puede no estar disponible (modo privado, etc.)
  }
}

// ====== Render: única fuente de verdad ======
function render() {
  rootStyles.setProperty('--color-primary', state.primaryColor);
  rootStyles.setProperty('--color-primary-text', getContrastColor(state.primaryColor));
  rootStyles.setProperty('--radius-box', state.borderRadius);

  previewTitle.textContent = state.brandTitle.trim() || 'Tu título aquí';

  // Sincroniza los controles con el estado (útil al cargar o restablecer)
  Object.keys(state).forEach((key) => {
    const control = document.getElementById(key);
    if (control && control.value !== state[key]) control.value = state[key];
  });

  saveState();
}

// ====== Eventos ======
// Un solo listener para todos los controles del sidebar
sidebar.addEventListener('input', (e) => {
  const key = e.target.id;
  if (!(key in defaults)) return;
  state[key] = e.target.value;
  render();
});

resetBtn.addEventListener('click', () => {
  state = { ...defaults };
  render();
});

render();
