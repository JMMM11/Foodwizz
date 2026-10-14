// =====================================================
// FRAGMENTOS COMPARTIDOS - header, footer y chatbot
// Se carga en el <head> de todas las páginas.
// =====================================================

// Raíz del sitio, calculada desde la ubicación de este script (js/ está en la raíz).
// Así funciona igual en un dominio propio, en Firebase o en una subcarpeta
// como jmmm11.github.io/Foodwizz/.
window.FW_ROOT = new URL('../', document.currentScript.src).href;

// Descarga un fragmento HTML y convierte sus rutas "/..." en rutas desde la raíz del sitio
function loadFragment(path) {
    return fetch(FW_ROOT + path)
        .then(response => response.text())
        .then(html => html.replace(/((?:href|src)=["'])\/(?!\/)/g, '$1' + FW_ROOT));
}

// Header + menú hamburguesa
loadFragment('Pages/header.html').then(html => {
    document.getElementById('header-placeholder').innerHTML = html;

    const menuToggle = document.getElementById('menu-toggle');
    const navbar = document.getElementById('navbar');

    if (menuToggle && navbar) {
        menuToggle.addEventListener('click', () => {
            navbar.classList.toggle('active');
            menuToggle.querySelector('i').classList.toggle('fa-bars');
            menuToggle.querySelector('i').classList.toggle('fa-times');
        });
    }
});

// Footer
loadFragment('Pages/footer.html').then(html => {
    document.getElementById('footer-placeholder').innerHTML = html;
});

// Chatbot (solo en las páginas que tienen el contenedor)
loadFragment('Pages/chatbot.html').then(html => {
    const chatbotContainer = document.getElementById('chatbot-container');
    if (!chatbotContainer) return;
    chatbotContainer.innerHTML = html;
    if (typeof initChatbot === 'function') {
        initChatbot();
    }
});
