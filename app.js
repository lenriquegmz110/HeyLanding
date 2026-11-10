// 1. Obtenemos referencias a los elementos del DOM
const colorPicker = document.getElementById('primaryColor');
const borderRadiusSelect = document.getElementById('borderRadius');
const brandTitleInput = document.getElementById('brandTitle');
const previewTitle = document.getElementById('previewTitle');

const rootStyles = document.documentElement.style;

// 2. Evento para cambiar el color primario en vivo
colorPicker.addEventListener('input', (e) => {
    const selectedColor = e.target.value;
    rootStyles.setProperty('--color-primary', selectedColor);
    
    // Opcional: Podrías calcular un tono ligeramente más oscuro para el hover si quieres
});

// 3. Evento para cambiar el radio de los bordes en vivo
borderRadiusSelect.addEventListener('change', (e) => {
    const selectedRadius = e.target.value;
    rootStyles.setProperty('--radius-box', selectedRadius);
});

// 4. Evento para cambiar el texto en tiempo real
brandTitleInput.addEventListener('input', (e) => {
    const newText = e.target.value;
    previewTitle.textContent = newText.trim() === '' ? 'Tu título aquí' : newText;
});